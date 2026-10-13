#!/usr/bin/env node
// Performance benchmark: builds the game in bench mode (playtest hooks on,
// otherwise a production build), plays the heaviest moment of every chapter in
// headless Chromium with CPU throttling, and reports main-thread CPU time per
// frame, long tasks, GC pauses and heap growth (docs/PERFORMANCE.md).
//
// The gate is "no regression against current main, on this machine": every
// scenario is played by this build and by a build of main, alternating, and
// this build must not be slower than main beyond run-to-run noise
// (scripts/bench/budget.mjs). Leaks and machine-independent counts are absolute.
//
//   npm run bench                         the gate: every scenario at 4x, this build vs main, 2 alternating rounds, plus the leak check
//   npm run bench -- --only=ch3-frog      some scenarios (comma-separated)
//   npm run bench -- --rounds=3           more alternating rounds (less noise)
//   npm run bench -- --throttle=4,6       also measure at 6x (the gate compares 4x)
//   npm run bench -- --base=<ref>         compare against another commit than origin/main
//   npm run bench -- --base-dist=<dir>    compare against an existing bench build
//   npm run bench -- --no-ab              this build only, no comparison (numbers for reference; `--absolute` checks the old absolute CPU limits)
//   npm run bench -- --no-leak            skip the leak check; --leak-only runs only it
//   npm run bench -- --device=desktop     1280x720 instead of a wide phone
//   npm run bench -- --profile            also save CPU profiles and list the hottest functions (this build only)
//   npm run bench -- --gl                 also count WebGL draw calls, texture binds and shader switches
//   npm run bench -- --boot               cold boot to the title screen, this build vs main (5 fresh pages each at 4x, no network throttle)
//   npm run bench -- --load               boot time to the title screen on Slow 4G, cold and warm cache
//   npm run bench -- --no-build           reuse the last bench build of this tree
//   npm run bench -- --dist=<dir>         benchmark another bench build as "this build"
//   npm run bench -- --query=debug=1      add URL switches to every scenario
//   npm run bench -- --load --vercel=<file>   serve with another vercel.json's headers
//
// Headless Chromium renders WebGL in software, so its frame rate is not a
// phone's. The budget is CPU time per frame; FPS is reported as a secondary signal.
// Needs a Chromium: BENCH_CHROME=/path/to/chrome, or `npx playwright-core install chromium`.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { SCENARIOS, skipCinematics, sleep } from './bench/scenarios.mjs';
import { averageRuns, checkAbsoluteCpu, checkLeaks, checkRegression, REGRESSION } from './bench/budget.mjs';
import { buildBase, resolveBase } from './bench/base.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args0 = process.argv.find((a) => a.startsWith('--dist='));
// --dist=<dir>: benchmark an existing build (e.g. one made from another commit) instead of building.
const OUT_DIR = args0 ? path.resolve(args0.slice('--dist='.length)) : path.join(ROOT, '.bench-dist');
const RESULTS_DIR = path.join(ROOT, 'bench-results');

// ------------------------------------------------------------------ options

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const throttles = String(args.throttle ?? '4').split(',').map(Number);
const rounds = Math.max(1, Number(args.rounds ?? 2));
const seconds = Number(args.seconds ?? 12);
const warmupMs = Number(args.warmup ?? 4) * 1000;
const device = args.device === 'desktop' ? 'desktop' : 'phone';
const only = args.only ? String(args.only).split(',') : null;
const label = args.label ? String(args.label) : '';
const extraQuery = args.query ? `&${process.argv.find((a) => a.startsWith('--query=')).slice('--query='.length)}` : '';

const DEVICES = {
  // A wide 20:9 Android phone in landscape (Pixel 7 class).
  phone: { viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

// ------------------------------------------------------------------ build and serve

function build() {
  const flags = ['vite', 'build', '--mode', 'bench', '--outDir', OUT_DIR, '--emptyOutDir', '--logLevel', 'warn'];
  if (args.unminified) flags.push('--minify', 'false');
  const r = spawnSync('npx', flags, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('bench build failed');
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

/**
 * Serves the build the way Vercel does: brotli or gzip when the browser accepts it, an ETag with
 * 304s for revalidation, and the Cache-Control default for static files (public, max-age=0,
 * must-revalidate) unless a `headers` rule in vercel.json says otherwise.
 */
function serve(root = OUT_DIR) {
  // --vercel=<file>: serve with another vercel.json's headers (e.g. to compare caching rules).
  const vercelFile = args.vercel ? path.resolve(String(args.vercel)) : path.join(ROOT, 'vercel.json');
  const vercel = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
  const rules = (vercel.headers ?? []).map((h) => ({ re: new RegExp(`^${h.source.replace(/\(\.\*\)/g, '.*')}$`), headers: h.headers }));
  const compressed = new Map();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    const stat = fs.statSync(file);
    const etag = `"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
    const headers = { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', etag, 'cache-control': 'public, max-age=0, must-revalidate' };
    for (const rule of rules) if (rule.re.test(url.pathname)) for (const h of rule.headers) headers[h.key.toLowerCase()] = h.value;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers).end();
      return;
    }
    const accept = String(req.headers['accept-encoding'] ?? '');
    const encoding = accept.includes('br') ? 'br' : accept.includes('gzip') ? 'gzip' : null;
    let body = fs.readFileSync(file);
    if (encoding && /\.(js|html|css|svg|json|webmanifest)$/.test(file)) {
      const key = `${file}:${encoding}:${etag}`;
      if (!compressed.has(key)) compressed.set(key, encoding === 'br' ? zlib.brotliCompressSync(body) : zlib.gzipSync(body, { level: 9 }));
      body = compressed.get(key);
      headers['content-encoding'] = encoding;
    }
    headers['content-length'] = body.length;
    res.writeHead(200, headers).end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function chromePath() {
  if (process.env.BENCH_CHROME) return process.env.BENCH_CHROME;
  for (const p of ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome']) if (fs.existsSync(p)) return p;
  return undefined;
}

// ------------------------------------------------------------------ page setup

/** A save that has cleared Act 1 with every alien, sound on, touch controls always shown on the phone. */
function saveFixture() {
  const now = Date.now();
  const chapter = { completed: true, clears: 1, cards: [], bests: {} };
  return {
    version: 4,
    muted: false,
    settings: { reduceFlashing: false, shake: 1, touchControls: device === 'phone' ? 'on' : 'off', ghost: false },
    lastSlot: 0,
    slots: [
      {
        createdAt: now,
        lastPlayedAt: now,
        playTimeMs: 0,
        difficulty: 'normal',
        chapters: { ch1: chapter, ch2: chapter, ch3: chapter, ch4: chapter },
        unlockedAliens: ['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade'],
        resume: null,
        achievements: {},
        lifetime: {},
        jokes: [],
      },
      null,
      null,
    ],
  };
}

const PROBE = fs.readFileSync(path.join(ROOT, 'scripts/bench/probe.js'), 'utf8');

async function openPage(browser, opts = {}) {
  const context = await browser.newContext({ ...DEVICES[device] });
  const save = JSON.stringify(saveFixture());
  await context.addInitScript(`
    try { localStorage.setItem('ben10-omnitrix-summer', ${JSON.stringify(save)}); } catch {}
    window.__benchConfig = ${JSON.stringify({ countGl: !!opts.countGl, seed: 12345 })};
  `);
  await context.addInitScript(PROBE);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('  [page error]', e.message));
  const cdp = await context.newCDPSession(page);
  return { context, page, cdp };
}

async function waitForLevel(page) {
  await page.waitForFunction(
    () => window.__bench?.attached && window.__game?.scene?.isActive('Level') && window.__level?.cameras?.main,
    undefined,
    { timeout: 120_000, polling: 200 },
  );
}

async function forcedGcHeapMb(cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  const { usedSize } = await cdp.send('Runtime.getHeapUsage');
  return usedSize / 1048576;
}

// ------------------------------------------------------------------ statistics

const sum = (a) => a.reduce((s, v) => s + v, 0);
const mean = (a) => (a.length ? sum(a) / a.length : 0);
function pct(a, p) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

/** GC pauses on the renderer main thread from a Chromium trace. */
function gcFromTrace(buffer) {
  const events = JSON.parse(buffer.toString('utf8')).traceEvents ?? [];
  const main = new Set(events.filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain').map((e) => `${e.pid}:${e.tid}`));
  const pauses = { minor: [], major: [], rasterMs: 0 };
  for (const e of events) {
    if (e.ph !== 'X' || !main.has(`${e.pid}:${e.tid}`)) continue;
    if (e.name === 'MinorGC') pauses.minor.push(e.dur / 1000);
    else if (e.name === 'MajorGC') pauses.major.push(e.dur / 1000);
    // Headless only: the page waits while SwiftShader draws the frame in software. A rough proxy for GPU work.
    else if (e.name === 'GLES2::ReadPixels') pauses.rasterMs += e.dur / 1000;
  }
  return pauses;
}

/** Self time per function from a CDP CPU profile. */
function hottest(profile, top = 25) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const node = byId.get(profile.samples[i]);
    const cf = node.callFrame;
    const file = cf.url ? cf.url.split('/').pop() : '';
    const key = `${cf.functionName || '(anonymous)'}  ${file}:${cf.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000);
  }
  const total = sum([...self.values()]);
  return [...self.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([k, ms]) => ({ fn: k, ms: Math.round(ms), pct: Math.round((ms / total) * 1000) / 10 }));
}

/** Bytes allocated per frame by function, from a sampling heap profile. */
function allocators(profile, frames, top = 30) {
  const self = new Map();
  const walk = (node) => {
    const cf = node.callFrame;
    const file = cf.url ? cf.url.split('/').pop() : '';
    const key = `${cf.functionName || '(anonymous)'}  ${file}:${cf.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + node.selfSize);
    for (const c of node.children ?? []) walk(c);
  };
  walk(profile.head);
  const total = sum([...self.values()]);
  console.log(`  sampled allocation: ${Math.round(total / 1024 / Math.max(1, frames))} KB per frame`);
  return [...self.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([k, bytes]) => ({ fn: `${Math.round(bytes / 1024 / Math.max(1, frames)).toString().padStart(5)} KB/frame  ${k}`, pct: Math.round((bytes / total) * 1000) / 10 }));
}

function summarize(raw, gc) {
  const cpu = raw.update.map((u, i) => u + raw.render[i]);
  const intervals = raw.interval.filter((v) => v > 0);
  const r = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
  const out = {
    frames: raw.n,
    cpuMean: r(mean(cpu)),
    cpuP50: r(pct(cpu, 50)),
    cpuP95: r(pct(cpu, 95)),
    cpuP99: r(pct(cpu, 99)),
    cpuMax: r(Math.max(0, ...cpu)),
    updateMean: r(mean(raw.update)),
    renderMean: r(mean(raw.render)),
    over8: cpu.filter((v) => v > 8).length,
    over16: cpu.filter((v) => v > 16.7).length,
    fps: r(intervals.length ? 1000 / mean(intervals) : 0, 1),
    fpsLow1: r(intervals.length ? 1000 / pct(intervals, 99) : 0, 1),
    longSteps: cpu.filter((v) => v > 50).length,
    longTasks: raw.longTasks.length,
    longTaskMax: r(Math.max(0, ...raw.longTasks), 0),
    heapDeltaMb: r((raw.heapEnd - raw.heapStart) / 1048576),
    fbAllocsPerSec: r(raw.fbAllocs / seconds, 1),
    texAllocsPerSec: r(raw.texAllocs / seconds, 1),
    renderPool: raw.renderPool,
  };
  if (gc) {
    const all = [...gc.minor, ...gc.major];
    out.gcCount = all.length;
    out.gcMinor = gc.minor.length;
    out.gcMajor = gc.major.length;
    out.gcTotalMs = r(sum(all), 1);
    out.gcMaxMs = r(Math.max(0, ...all), 1);
    out.gcPerSec = r(all.length / seconds, 2);
    out.rasterMs = r(gc.rasterMs / Math.max(1, raw.n), 1);
  }
  if (raw.draws.some((v) => v > 0)) {
    out.drawsMean = r(mean(raw.draws), 1);
    out.drawsMax = Math.max(...raw.draws);
    out.texBindsMean = r(mean(raw.binds), 1);
    out.programsMean = r(mean(raw.programs), 1);
    out.targetsMean = r(mean(raw.targets), 1);
  }
  return out;
}

// ------------------------------------------------------------------ runs

async function runScenario(browser, base, sc, throttle) {
  const { context, page, cdp } = await openPage(browser, { countGl: !!args.gl });
  try {
    await page.goto(`${base}/?${sc.query}&god=1${extraQuery}`);
    await waitForLevel(page);
    if (sc.setup) {
      await sc.setup(page);
      await page.evaluate(() => {
        const lvl = window.__game.scene.getScene('Level');
        lvl.scene.restart({ levelId: lvl.level?.id ?? 'training' });
      });
      await sleep(500);
      await waitForLevel(page);
    }
    await sleep(1200);
    const textures = await page.evaluate(() => {
      let bytes = 0;
      let count = 0;
      for (const key of window.__game.textures.getTextureKeys()) {
        const t = window.__game.textures.get(key);
        for (const s of t.source) {
          bytes += (s.width || 0) * (s.height || 0) * 4;
          count++;
        }
      }
      const c = window.__game.canvas;
      return { count, mb: Math.round((bytes / 1048576) * 10) / 10, canvas: `${c.width}x${c.height}` };
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    await skipCinematics(page, 3);
    const heapBefore = await forcedGcHeapMb(cdp);

    const play = sc.play(page, warmupMs + seconds * 1000 + 500);
    await sleep(warmupMs);
    if (args.profile) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
      await cdp.send('Profiler.start');
    }
    if (args.alloc) {
      await cdp.send('HeapProfiler.enable');
      await cdp.send('HeapProfiler.startSampling', { samplingInterval: 4096, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
    }
    const tracing = !args.profile && !args.alloc;
    if (tracing) await browser.startTracing(page, { categories: ['devtools.timeline', 'v8', 'disabled-by-default-v8.gc', 'gpu'] });
    await page.evaluate(() => window.__bench.start());
    await sleep(seconds * 1000);
    const raw = await page.evaluate(() => window.__bench.stop());
    if (raw.n === 0) {
      const state = await page.evaluate(() => ({
        paused: window.__game.isPaused,
        running: window.__game.loop.running,
        scenes: window.__game.scene.getScenes(false).map((s) => `${s.sys.settings.key}:${s.sys.settings.status}`).join(' '),
      }));
      console.log('\n  no frames recorded:', JSON.stringify(state));
    }
    const trace = tracing ? await browser.stopTracing() : null;
    let hot = null;
    if (args.profile) {
      const { profile } = await cdp.send('Profiler.stop');
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
      fs.writeFileSync(path.join(RESULTS_DIR, `${sc.id}-${throttle}x.cpuprofile`), JSON.stringify(profile));
      hot = hottest(profile);
    }
    if (args.alloc) {
      const { profile } = await cdp.send('HeapProfiler.stopSampling');
      hot = allocators(profile, raw.n);
    }
    await play;
    const heapAfter = await forcedGcHeapMb(cdp);
    const stats = summarize(raw, trace ? gcFromTrace(trace) : null);
    stats.retainedGrowthMb = Math.round((heapAfter - heapBefore) * 100) / 100;
    stats.heapMb = Math.round(heapAfter * 10) / 10;
    stats.textures = textures;
    return { stats, hot };
  } finally {
    await context.close();
  }
}

/** Plays every chapter in turn, several times, and checks that nothing piles up between scene changes. */
async function runLeak(browser, base) {
  const { context, page, cdp } = await openPage(browser);
  try {
    await page.goto(`${base}/?level=ch1&start=cp-arena&god=1`);
    await waitForLevel(page);
    const plan = [
      ['ch1', 'cp-arena'],
      ['ch2', 'cp-convoy'],
      ['ch2', 'cp-arena'],
      ['ch3', 'cp-frog'],
      ['ch4', 'cp-station'],
      ['ch4', 'cp-kevin'],
      // Running right from the station boards the ore cart: the level ends mid-ride, the 3D scene and its texture must go with it.
      ['ch5', 'cp-dive'],
      ['ch5', 'cp-hunters'],
      ['training', null],
    ];
    const rows = [];
    const snapshot = async (cycle) => {
      const s = await page.evaluate(() => {
        const g = window.__game;
        const scenes = g.scene.getScenes(false);
        let objects = 0;
        let tweens = 0;
        let timers = 0;
        for (const sc of scenes) {
          if (!sc.sys.settings.active && !sc.sys.settings.visible) continue;
          objects += sc.sys.displayList?.length ?? 0;
          tweens += sc.sys.tweens?.getTweens?.().length ?? 0;
          timers += (sc.sys.time?._active?.length ?? 0) + (sc.sys.time?._pendingInsertion?.length ?? 0);
        }
        return {
          bus: window.__bus.listenerTotal(),
          gameEvents: g.events.eventNames().reduce((n, e) => n + g.events.listenerCount(e), 0),
          textures: g.textures.getTextureKeys().length,
          objects,
          tweens,
          timers,
          keys: g.input.keyboard?.keys?.filter(Boolean).length ?? 0,
          audioSources: window.__bench.audioSources,
          audioHeld: window.__bench.audioHeld,
        };
      });
      const heap = await forcedGcHeapMb(cdp);
      rows.push({ cycle, heapMb: Math.round(heap * 10) / 10, ...s });
    };
    const cycles = Number(args.cycles ?? 6);
    for (let c = 0; c <= cycles; c++) {
      for (const entry of plan) {
        const [levelId, checkpoint] = entry;
        await page.evaluate(
          ([levelId, checkpoint]) => {
            const lvl = window.__game.scene.getScene('Level');
            lvl.scene.start('Level', { levelId, checkpoint });
          },
          [levelId, checkpoint],
        );
        await waitForLevel(page);
        await skipCinematics(page, 2);
        // Leave mid-action: transformed, running and charging, so held sounds (XLR8's wind, Heatblast's hum)
        // and in-flight effects are live when the scene ends.
        await page.keyboard.press(plan.indexOf(entry) % 2 ? '1' : '3');
        await page.keyboard.press('t');
        await page.keyboard.down('ArrowRight');
        await page.keyboard.down('k');
        await sleep(1500);
      }
      await page.keyboard.up('k');
      await page.keyboard.up('ArrowRight');
      // Through the menus too: chapter select, then back into a level.
      await page.evaluate(() => window.__game.scene.getScene('Level').scene.start('ChapterSelect'));
      await sleep(1200);
      await snapshot(c);
      console.log(`  cycle ${c}: ${JSON.stringify(rows[rows.length - 1])}`);
    }
    // Held sounds: in Training (no cinematics) become XLR8 (dial slot 3), run so his wind loop plays,
    // and leave mid-run. One loop should be live each time, never one more per restart.
    const held = [];
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.__game.scene.getScene('Level').scene.start('Level', { levelId: 'training' }));
      await waitForLevel(page);
      await sleep(600);
      await page.keyboard.press('3');
      await page.keyboard.press('t');
      await sleep(900);
      await page.keyboard.down('ArrowRight');
      await sleep(1200);
      held.push(await page.evaluate(() => window.__bench.audioHeld));
      await page.keyboard.up('ArrowRight');
    }
    await page.evaluate(() => window.__game.scene.getScene('Level').scene.start('ChapterSelect'));
    await sleep(2500);
    const after = await page.evaluate(() => window.__bench.audioHeld);
    console.log(`  held sounds: sources with no stop scheduled while running as XLR8, per restart: ${held.join(' ')}; in the menu after: ${after}`);
    rows.heldSounds = { perRestart: held, menuAfter: after };
    return rows;
  } finally {
    await context.close();
  }
}

/** Time from navigation to the title screen on a slow connection, cold and warm cache. */
async function runLoad(browser, base, throttle) {
  const results = [];
  const context = await browser.newContext({ ...DEVICES[device] });
  try {
    for (const pass of ['cold', 'warm']) {
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      // Chrome DevTools' "Slow 4G": 150 ms RTT, 1.6 Mbps down.
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
      const t0 = Date.now();
      await page.goto(`${base}/`, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.__game?.scene?.isActive('Menu'), undefined, { timeout: 180_000, polling: 100 });
      const ms = Date.now() - t0;
      const nav = await page.evaluate(() => {
        const r = performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.js'));
        return { jsKb: Math.round(r.reduce((s, e) => s + (e.transferSize || 0), 0) / 1024), scripts: r.length };
      });
      results.push({ pass, throttle, toTitleMs: ms, ...nav });
      await page.close();
    }
  } finally {
    await context.close();
  }
  return results;
}

/**
 * Cold boot on the bench machine: a fresh page (empty cache) to the title screen at the
 * throttle, `runs` times, with the longest main-thread task of each boot (Preload generates
 * every texture in one go, so that task is mostly art generation).
 */
async function runBoot(browser, base, throttle, runs = 5) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const context = await browser.newContext({ ...DEVICES[device] });
    try {
      await context.addInitScript(() => {
        window.__bootTasks = [];
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) window.__bootTasks.push(e.duration);
          }).observe({ type: 'longtask', buffered: true });
        } catch {
          // No long task API.
        }
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
      const t0 = Date.now();
      await page.goto(`${base}/?mute=1`, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.__game?.scene?.isActive('Menu'), undefined, { timeout: 180_000, polling: 50 });
      const toTitleMs = Date.now() - t0;
      const longest = await page.evaluate(() => Math.round(Math.max(0, ...window.__bootTasks)));
      results.push({ toTitleMs, longestTaskMs: longest });
    } finally {
      await context.close();
    }
  }
  const med = (k) => {
    const v = results.map((r) => r[k]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  return { throttle, runs: results, medianToTitleMs: med('toTitleMs'), medianLongestTaskMs: med('longestTaskMs') };
}

/** Whether a build can play a scenario's level (main can't play a chapter added after it). */
async function supportsLevel(browser, base, levelId) {
  if (!levelId) return true;
  const context = await browser.newContext({ ...DEVICES[device] });
  try {
    await context.addInitScript(`try { localStorage.setItem('ben10-omnitrix-summer', ${JSON.stringify(JSON.stringify(saveFixture()))}); } catch {}`);
    const page = await context.newPage();
    await page.goto(`${base}/?level=${levelId}&god=1&mute=1`);
    await page.waitForFunction(() => window.__game?.scene?.isActive('Level') || window.__game?.scene?.isActive('Menu'), undefined, { timeout: 120_000, polling: 200 });
    return await page.evaluate((id) => window.__game.scene.isActive('Level') && window.__level?.level?.id === id, levelId);
  } finally {
    await context.close();
  }
}

const levelOf = (sc) => /(?:^|&)level=([^&]+)/.exec(sc.query)?.[1] ?? (sc.query.includes('training=1') ? null : 'ch1');

// ------------------------------------------------------------------ main

function printTable(rows) {
  const cols = ['build', 'scenario', 'x', 'runs', 'cpuMean', 'cpuP95', 'cpuP99', 'cpuMax', 'updateMean', 'renderMean', 'over16', 'longSteps', 'longTasks', 'gcPerSec', 'gcMaxMs', 'gcTotalMs', 'retainedGrowthMb', 'fbAllocsPerSec', 'renderPool', 'rasterMs', 'fps', 'fpsLow1', 'drawsMean'];
  const lines = [cols, ...rows.map((r) => cols.map((c) => String(r[c] ?? '')))];
  const widths = cols.map((_, i) => Math.max(...lines.map((l) => l[i].length)));
  for (const l of lines) console.log(l.map((v, i) => v.padStart(widths[i])).join('  '));
}

/** Main against this build, scenario by scenario: mean CPU, p95 and the change. */
function printComparison(baseRows, currentRows) {
  const cols = ['scenario', 'x', 'main', 'this', 'change', 'p95 main', 'p95 this', 'gc/s main', 'gc/s this'];
  const lines = [cols];
  for (const c of currentRows) {
    const b = baseRows.find((r) => r.scenario === c.scenario && r.x === c.x);
    const pctChange = b ? `${c.cpuMean >= b.cpuMean ? '+' : ''}${Math.round(((c.cpuMean - b.cpuMean) / b.cpuMean) * 1000) / 10}%` : 'new';
    lines.push([c.scenario, String(c.x), String(b?.cpuMean ?? '-'), String(c.cpuMean), pctChange, String(b?.cpuP95 ?? '-'), String(c.cpuP95), String(b?.gcPerSec ?? '-'), String(c.gcPerSec ?? '-')]);
  }
  const widths = cols.map((_, i) => Math.max(...lines.map((l) => l[i].length)));
  for (const l of lines) console.log(l.map((v, i) => v.padStart(widths[i])).join('  '));
}

async function main() {
  if (!args['no-build'] && !args.dist) build();
  const ab = !args['no-ab'] && !args.profile && !args.alloc;
  let baseDir = null;
  let baseInfo = null;
  if (ab && !args['leak-only'] && !args.load) {
    if (args['base-dist']) {
      baseDir = path.resolve(String(args['base-dist']));
      baseInfo = { ref: 'base-dist', sha: path.basename(baseDir) };
    } else {
      baseInfo = resolveBase(ROOT, args.base);
      console.log(`Comparing against ${baseInfo.ref} (${baseInfo.sha})`);
      baseDir = buildBase(ROOT, baseInfo.sha, { unminified: !!args.unminified });
    }
  }
  const server = await serve(OUT_DIR);
  const baseServer = baseDir ? await serve(baseDir) : null;
  const urls = { this: `http://127.0.0.1:${server.address().port}` };
  if (baseServer) urls.main = `http://127.0.0.1:${baseServer.address().port}`;
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: ['--enable-precise-memory-info', '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
  });
  const report = { date: new Date().toISOString(), label, device, seconds, rounds, base: baseInfo, scenarios: [], averaged: [], leak: null, load: null, boot: null };
  const failures = [];
  try {
    if (args.load) {
      for (const t of throttles) report.load = [...(report.load ?? []), ...(await runLoad(browser, urls.this, t))];
      console.table(report.load);
    }
    if (args.boot) {
      report.boot = {};
      for (const [build, url] of Object.entries(urls)) {
        for (const t of throttles) {
          const b = await runBoot(browser, url, t, Number(args.runs ?? 5));
          report.boot[`${build}@${t}x`] = b;
          console.log(`boot ${build} @ ${t}x: to title ${b.medianToTitleMs} ms (median of ${b.runs.length}: ${b.runs.map((r) => r.toTitleMs).join(', ')}), longest task ${b.medianLongestTaskMs} ms`);
        }
      }
    }
    const scenariosWanted = !args.load && !args.boot && !args['leak-only'];
    if (scenariosWanted) {
      const list = SCENARIOS.filter((s) => !only || only.includes(s.id));
      const builds = Object.keys(urls);
      // Which scenarios main can play (a new chapter's can't): those are held to main's heaviest.
      const playable = new Map();
      if (urls.main) {
        for (const lvl of new Set(list.map(levelOf))) playable.set(lvl, await supportsLevel(browser, urls.main, lvl));
        const missing = [...playable].filter(([, ok]) => !ok).map(([l]) => l);
        if (missing.length) console.log(`main can't play ${missing.join(', ')}: those scenarios are held to main's heaviest scenario`);
      }
      for (let round = 0; round < rounds; round++) {
        if (rounds > 1) console.log(`-- round ${round + 1} of ${rounds}`);
        for (const sc of list) {
          for (const t of throttles) {
            // Alternate which build goes first each round so drift (heat, background load) cancels out.
            const order = round % 2 === 0 ? builds : [...builds].reverse();
            for (const build of order) {
              if (build === 'main' && playable.get(levelOf(sc)) === false) continue;
              process.stdout.write(`${sc.id} @ ${t}x [${build}] ... `);
              const { stats, hot } = await runScenario(browser, urls[build], sc, t);
              console.log(`cpu ${stats.cpuMean} ms mean, p99 ${stats.cpuP99}, gc ${stats.gcPerSec ?? '-'}/s max ${stats.gcMaxMs ?? '-'} ms, fps ${stats.fps}`);
              report.scenarios.push({ build, round, scenario: sc.id, x: t, ...stats });
              if (hot) {
                console.log(args.alloc ? '  top allocators:' : '  hottest functions (self time):');
                for (const h of hot) console.log(`    ${String(h.pct).padStart(5)}%  ${h.fn}`);
              }
            }
          }
        }
      }
      report.averaged = averageRuns(report.scenarios.map(({ round: _r, ...row }) => row));
      console.log();
      printTable(report.averaged);
      const current = report.averaged.filter((r) => r.build === 'this');
      if (urls.main) {
        const base = report.averaged.filter((r) => r.build === 'main');
        console.log(`\nThis build against main (${baseInfo.sha}), mean of ${rounds} alternating round(s):`);
        printComparison(base, current);
        failures.push(...checkRegression(base, current));
      } else {
        failures.push(...checkRegression([], current).filter((f) => !f.includes('main')));
        if (args.absolute) failures.push(...checkAbsoluteCpu(current));
      }
    }
    if ((args.leak || (scenariosWanted && !args['no-leak'] && !only) || args['leak-only']) && !args.load && !args.boot) {
      console.log('Leak check: switching chapters...');
      report.leak = await runLeak(browser, urls.this);
      report.heldSounds = report.leak.heldSounds;
      failures.push(...checkLeaks(report));
    }
  } finally {
    await browser.close();
    server.close();
    baseServer?.close();
  }
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `bench-${device}${label ? `-${label}` : ''}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`\nSaved ${path.relative(ROOT, file)}`);

  if (failures.length) {
    console.log(`\nFAILED (docs/PERFORMANCE.md):`);
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  } else if (report.scenarios.length || report.leak) {
    console.log(urls.main ? `\nNo regression against main at ${REGRESSION.throttle}x, and no leaks.` : '\nWithin the absolute limits (no comparison run).');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
