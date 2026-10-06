#!/usr/bin/env node
// QA sweep: plays every screen and checkpoint of Chapters 1-4 in headless
// Chromium at three screen sizes, screenshots each one, and checks every
// visible text (scripts/qa/textcheck.js), the HUD under stress (long banners,
// combos, toasts, prompts, dialogue), and page errors. --fuzz adds random play
// at every checkpoint looking for errors, softlocks and stuck states.
//
//   npm run qa                         sweep + HUD gauntlet at desktop, 20:9 phone, small 16:9 phone
//   npm run qa -- --sizes=phone        one size
//   npm run qa -- --fuzz               also fuzz every checkpoint (random inputs, aliens, pauses, timeouts)
//   npm run qa -- --fuzz --only-fuzz --seconds=25 --levels=ch4,training   (--levels limits the sweep too)
//   npm run qa -- --no-build           reuse the last QA build
//   npm run qa -- --parts=menus        only some of menus,levels,hud
//   npm run qa -- --out=<dir>          results somewhere else (run sizes in parallel)
//   npm run qa -- --dist=<dir>         build into (or serve) another directory than .qa-dist
//
// Results: qa-results/<size>/*.png, qa-results/report.json, and a summary on stdout.
// Exits with 1 when a check fails (text issues, page errors, fuzz failures).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const OUT_DIR = args.dist ? path.resolve(String(args.dist)) : path.join(ROOT, '.qa-dist');
const RESULTS = args.out ? path.resolve(String(args.out)) : path.join(ROOT, 'qa-results');
const SIZES = {
  // A 16:9 desktop window, a 20:9 phone (Pixel 7 class) and a small 16:9 phone (iPhone SE class), both landscape.
  desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  small: { viewport: { width: 667, height: 375 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const sizes = String(args.sizes ?? 'desktop,phone,small').split(',').filter((s) => SIZES[s]);
const parts = new Set(String(args.parts ?? 'menus,levels,hud').split(','));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TEXTCHECK = fs.readFileSync(path.join(ROOT, 'scripts/qa/textcheck.js'), 'utf8');

// ------------------------------------------------------------------ build and serve

function build() {
  const r = spawnSync('npx', ['vite', 'build', '--mode', 'bench', '--outDir', OUT_DIR, '--emptyOutDir', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('qa build failed');
}

function serve() {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = path.join(OUT_DIR, decodeURIComponent(url.pathname));
    if (!file.startsWith(OUT_DIR)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function chromePath() {
  if (process.env.BENCH_CHROME) return process.env.BENCH_CHROME;
  for (const p of ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome']) if (fs.existsSync(p)) return p;
  return undefined;
}

/** A file that has cleared Chapters 1-4 with every alien and every card slot empty. */
function saveFixture(touch) {
  const now = Date.now();
  const chapter = { completed: true, clears: 1, cards: [], bests: { normal: { bestTimeMs: 400000, bestRank: 'A', bestScore: 900, clears: 1, bestSplits: {}, bestSegments: {} } } };
  return {
    version: 4,
    muted: true,
    settings: { reduceFlashing: false, shake: 1, touchControls: touch ? 'on' : 'off', ghost: false },
    lastSlot: 0,
    slots: [
      {
        createdAt: now,
        lastPlayedAt: now,
        playTimeMs: 3_600_000,
        difficulty: 'normal',
        chapters: { ch1: chapter, ch2: chapter, ch3: chapter, ch4: chapter },
        unlockedAliens: ['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade'],
        resume: { levelId: 'ch4', checkpoint: 'cp-depot', stats: null },
        achievements: { 'hero-time': now },
        lifetime: {},
        jokes: [],
      },
      null,
      null,
    ],
  };
}

// ------------------------------------------------------------------ page helpers

class Session {
  constructor(browser, base, sizeName) {
    this.browser = browser;
    this.base = base;
    this.sizeName = sizeName;
    this.size = SIZES[sizeName];
    this.touch = this.size.hasTouch;
    this.errors = [];
    this.issues = [];
    this.shots = 0;
    this.dir = path.join(RESULTS, sizeName);
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async open() {
    this.context = await this.browser.newContext({ ...this.size });
    const save = JSON.stringify(saveFixture(this.touch));
    await this.context.addInitScript(`try { localStorage.setItem('ben10-omnitrix-summer', ${JSON.stringify(save)}); } catch {}`);
    await this.context.addInitScript(TEXTCHECK);
    this.page = await this.context.newPage();
    this.page.on('pageerror', (e) => this.errors.push({ where: this.where, error: e.message }));
    this.page.on('console', (m) => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      const t = m.text();
      // SwiftShader's own complaints are about the container, not the game.
      if (/swiftshader|GL Driver Message|GroupMarkerNotSet|software WebGL/i.test(t)) return;
      this.errors.push({ where: this.where, error: `${m.type()}: ${t}` });
    });
  }

  async close() {
    await this.context.close();
  }

  async goto(query, where) {
    this.where = where;
    await this.page.goto(`${this.base}/?${query}`);
    await this.page.waitForFunction(() => window.__game?.isRunning && window.__game.scene.scenes.length > 5, undefined, { timeout: 120000 });
  }

  async waitScene(key, timeout = 60000) {
    await this.page.waitForFunction((k) => window.__game.scene.isActive(k), key, { timeout });
  }

  /** Taps (touch) or presses Enter (keyboard) to skip a cinematic, without changing the input mode. */
  async skip(times = 4) {
    for (let i = 0; i < times; i++) {
      if (this.touch) await this.page.touchscreen.tap(this.size.viewport.width / 2, 40);
      else await this.page.keyboard.press('Enter');
      await sleep(350);
    }
  }

  /** Runs the text checker on what's on screen now and saves a screenshot. */
  async check(name, opts = {}) {
    this.where = name;
    const found = await this.page.evaluate((o) => window.__qaText(o), opts).catch((e) => [{ kind: 'checker', scene: '-', text: '', detail: e.message }]);
    for (const f of found) this.issues.push({ size: this.sizeName, where: name, ...f });
    const file = `${String(this.shots++).padStart(3, '0')}-${name.replace(/[^a-z0-9-]+/gi, '_')}.png`;
    await this.page.screenshot({ path: path.join(this.dir, file) }).catch(() => undefined);
    return found;
  }

  async scenesOnly(keys) {
    await this.page.evaluate((list) => {
      const m = window.__game.scene;
      for (const s of m.scenes) if (s.sys.settings.key !== 'Boot' && (s.sys.isActive() || s.sys.isPaused() || s.sys.isSleeping())) m.stop(s.sys.settings.key);
      for (const [k, d] of list) m.start(k, d);
    }, keys);
    await sleep(900);
  }
}

// ------------------------------------------------------------------ the sweep

const CHAPTERS = ['ch1', 'ch2', 'ch3', 'ch4'];

async function checkpointsOf(s, level) {
  await s.goto(`level=${level}&god=1&mute=1`, `${level}-probe`);
  await s.waitScene('Level');
  return s.page.evaluate(() => window.__level.level.entities.filter((e) => e.type === 'checkpoint').map((e) => e.id));
}

async function sweepMenus(s) {
  await s.goto('mute=1', 'title');
  await s.waitScene('Menu');
  await sleep(1800);
  await s.check('title');
  for (const [key, data] of [
    ['FileSelect', {}],
    ['Difficulty', { slot: 1 }],
  ]) {
    await s.scenesOnly([[key, data]]);
    await sleep(600);
    await s.check(`menu-${key}`);
  }
  // Chapter Select and the rest need a file in play: a direct level start picks the last one.
  await s.goto('level=ch1&mute=1', 'menus-with-file');
  await s.waitScene('Level');
  const screens = [
    ['ChapterSelect', {}],
    ['ChapterSelect', { focus: 2 }],
    ['ChapterSelect', { focus: 3 }],
    ['ChapterSelect', { focus: 4 }],
    ['ChapterSelect', { focus: 6 }],
    ['ChapterSelect', { newFile: true, focus: 1 }],
    ['ChapterSelect', { cleared: 'ch4', firstClear: true }],
    ['Settings', { returnTo: 'Menu', slot: 0 }],
    ['Extras', { slot: 0 }],
  ];
  for (const [key, data] of screens) {
    await s.scenesOnly([[key, data]]);
    await sleep(key === 'ChapterSelect' && data.cleared ? 3500 : 600);
    await s.check(`menu-${key}-${JSON.stringify(data).replace(/[^a-z0-9]+/gi, '')}`);
  }
  // Every EXTRAS page.
  for (let tab = 1; tab < 3; tab++) {
    await s.page.evaluate((t) => {
      const ex = window.__game.scene.getScene('Extras');
      (ex.showTab ?? ex.setTab ?? ex.selectTab)?.call(ex, t);
    }, tab);
    await sleep(500);
    await s.check(`menu-Extras-tab${tab}`);
  }
}

async function sweepLevels(s) {
  const only = args.levels ? String(args.levels).split(',') : null;
  for (const level of [...CHAPTERS, 'training'].filter((l) => !only || only.includes(l))) {
    const cps = level === 'training' ? [null] : [null, ...(await checkpointsOf(s, level))];
    for (const cp of cps) {
      const name = `${level}-${cp ?? 'start'}`;
      await s.goto(`level=${level}${cp ? `&start=${cp}` : ''}&god=1&mute=1${level === 'training' ? '&training=1' : ''}`, name);
      await s.waitScene('Level');
      await sleep(1200);
      await s.check(`${name}-0s`, { allowKeys: false });
      await s.skip(4);
      await sleep(2200);
      await s.check(`${name}-play`);
      // Pause menu over the level.
      await s.page.evaluate(() => window.__bus.emit('system:pause'));
      await sleep(700);
      if (await s.page.evaluate(() => window.__game.scene.isActive('Pause'))) {
        await s.check(`${name}-pause`);
        await s.page.evaluate(() => window.__game.scene.getScene('Pause').resume());
        await sleep(300);
      }
    }
    if (level !== 'training') {
      // Game Over, then Chapter Complete with this chapter's stats.
      await s.page.evaluate(() => window.__level.onDeath());
      await sleep(2600);
      await s.check(`${level}-gameover`);
      await s.page.evaluate((id) => {
        const stats = JSON.parse(JSON.stringify(window.__level.stats));
        Object.assign(stats, { timeMs: 431_234, enemiesDefeated: 87, deaths: 1, bestCombo: 42, transformations: 31, perfectTransforms: 6, swaps: 14, bestTagTeam: 4, strikes: 2, multiCuts: 1, parries: 9, damageTaken: 6 });
        const m = window.__game.scene;
        for (const k of ['Level', 'UI', 'Touch', 'GameOver', 'Pause']) m.stop(k);
        m.start('ChapterComplete', { levelId: id, stats });
      }, level);
      await sleep(7000);
      await s.check(`${level}-complete`);
    }
  }
  // The Act 1 ending and SUMO SLAMMERS.
  await s.scenesOnly([['ActEnd', { act: 1, levelId: 'ch3', then: { cleared: 'ch3', firstClear: true } }]]);
  for (let i = 0; i < 4; i++) {
    await sleep(3500);
    await s.check(`actend-${i}`);
  }
  await s.goto('level=ch4&start=cp-highscore&god=1&mute=1', 'arcade');
  await s.waitScene('Level');
  await sleep(1500);
  await s.page.evaluate(() => {
    const lvl = window.__game.scene.getScene('Level');
    lvl.scene.pause();
    lvl.scene.launch('Arcade', { onDone: () => lvl.scene.resume() });
  });
  await sleep(1200);
  await s.check('arcade-start');
  await sleep(4000);
  await s.check('arcade-play');
}

/** Long and stacked HUD content: the things that clip at the edges when they're at their longest. */
async function hudGauntlet(s) {
  await s.goto('level=ch2&start=cp-arena&god=1&mute=1', 'hud');
  await s.waitScene('Level');
  await s.skip(5);
  await sleep(2500);
  const bus = (name, payload) => s.page.evaluate(([n, p]) => window.__bus.emit(n, p), [name, payload]);
  await bus('combo:update', { count: 99, best: 99, forms: ['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade'] });
  await sleep(250);
  await s.check('hud-combo-99');
  await bus('combo:drop', { count: 99 });
  for (const t of [100, 250, 400]) {
    await sleep(t === 100 ? 100 : 150);
    await s.check(`hud-combo-drop-${t}ms`);
  }
  const banners = [
    { title: 'SUMO SLAMMERS CARD!', subtitle: '12 / 12 FOUND', style: 'slam' },
    { title: 'ROADBREAKER WRECKED!', subtitle: 'ROAD TRIP COMPLETE', style: 'slam' },
    { title: 'HIDDEN PATH!', subtitle: 'SNIFFED OUT', style: 'slam' },
    { title: 'CHECKPOINT', style: 'soft' },
  ];
  for (const b of banners) {
    await bus('hud:banner', { ...b, color: 0xffd23c, durationMs: 2500 });
    await sleep(700);
    await s.check(`hud-banner-${b.title}`);
  }
  for (const id of ['full-omnitrix', 'omnitrix-master', 'nothing-to-copy', 'high-score']) {
    await bus('achievement:unlocked', { id });
    await sleep(900);
    await s.check(`hud-achievement-${id}`);
  }
  for (const [name, subtitle] of [['HUNTER-KILLER DRONE', "VILGAX'S RETRIEVAL UNIT"], ['ROADBREAKER', "VILGAX'S WAR RIG"], ['KING CROAK', "DR. ANIMO'S MASTERPIECE"], ['KEVIN 11', 'HE COPIES WHAT YOU USE']]) {
    await bus('boss:show', { name, subtitle });
    await bus('boss:health', { ratio: 0.5, phase: 2 });
    await bus('boss:copies', { list: [{ id: 'heatblast', level: 3 }, { id: 'xlr8', level: 2 }, { id: 'fourarms', level: 1 }, { id: 'wildmutt', level: 3 }, { id: 'stinkfly', level: 1 }, { id: 'upgrade', level: 2 }], current: 'heatblast' });
    await sleep(600);
    await s.check(`hud-boss-${name}`);
  }
  await bus('boss:hide');
  const prompts = [
    'WRONG ALIEN! {T} SWAPS BACK FOR HALF PRICE... OR KO SOMETHING: +2S',
    'ONLY XLR8 CAN CROSS: {DIAL} PICK HIM, {T} TRANSFORM',
    'LOCKDOWN! FIVE LOCKS, ONE ALIEN EACH. {T} SWAPS ON THE FLY',
    'TIP: {DIAL} PICK ANOTHER ALIEN, THEN {T} TO SWAP MID-FIGHT',
    'NO EYES, ALL NOSE: HIDDEN FOES AND SECRET DOORS SHOW UP NEAR HIM',
  ];
  for (const text of prompts) {
    await bus('hud:prompt', { id: 'qa', text, priority: 99 });
    await sleep(500);
    await s.check(`hud-prompt-${text.slice(0, 20)}`);
  }
  await bus('hud:promptClear', { id: 'qa' });
  // Chapter 1's first transformation: the big, pulsing prompt.
  await bus('hud:prompt', { id: 'transform', text: 'PRESS {T} TO TRANSFORM!', priority: 99 });
  await sleep(500);
  await s.check('hud-prompt-transform');
  await bus('hud:promptClear', { id: 'transform' });
  const lines = [
    { who: 'gwen', text: "THE NEWS SAID ITS MACHINES KEEP DYING FOR NO REASON. BEN. DON'T GO LOOKING FOR TROUBLE.", ms: 900 },
    { who: 'animo', text: 'THIS MUSEUM CALLED MY LIFE\'S WORK "AN ABOMINATION". TONIGHT ITS EXHIBITS AGREE WITH ME.', ms: 900 },
    { who: 'max', text: 'ROADBREAKER FRIED THE ALTERNATOR. I\'LL HAVE HER PURRING BY MORNING. ...PROBABLY.', ms: 900 },
  ];
  await s.page.evaluate((l) => window.__level.dialogue.play(l, { skippable: true }), lines);
  for (let i = 0; i < 3; i++) {
    await sleep(i === 0 ? 2600 : 900);
    await s.check(`hud-dialog-${i}`);
  }
  for (const text of ['*SNIFF SNIFF* (I CAN\'T SEE A THING... BUT I CAN SMELL EVERYTHING!)', 'WAIT... THERE WAS ONE OF THESE BACK IN DR. ANIMO!']) {
    await s.page.evaluate((t) => window.__level.speech.show(t, 3000), text);
    await sleep(500);
    await s.check(`hud-speech-${text.slice(0, 16)}`);
  }
}

// ------------------------------------------------------------------ fuzz

/** Random play at a checkpoint: inputs, dial picks, swaps, pauses, tab hides, quits and restarts, alien timeouts. */
async function fuzzCheckpoint(s, level, cp, seconds, seed) {
  const name = `fuzz-${level}-${cp ?? 'start'}`;
  await s.goto(`level=${level}${cp ? `&start=${cp}` : ''}&mute=1${level === 'training' ? '&training=1' : ''}`, name);
  await s.waitScene('Level');
  await s.skip(5);
  let rnd = seed;
  const rand = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'j', 'k', 'q', 'e', 't', '1', '2', '3', '4', '5', '6'];
  const held = new Set();
  const failures = [];
  const end = Date.now() + seconds * 1000;
  let lastX = null;
  let stuckSince = Date.now();
  while (Date.now() < end) {
    const r = rand();
    if (r < 0.55) {
      const k = keys[Math.floor(rand() * keys.length)];
      if (held.has(k)) {
        await s.page.keyboard.up(k);
        held.delete(k);
      } else {
        await s.page.keyboard.down(k);
        held.add(k);
      }
    } else if (r < 0.6) {
      await s.page.evaluate(() => window.__level?.omni?.drain?.(60000));
    } else if (r < 0.63) {
      await s.page.evaluate(() => window.__bus.emit('system:pause'));
      await sleep(250);
      await s.page.evaluate(() => window.__game.scene.getScene('Pause')?.sys.isActive() && window.__game.scene.getScene('Pause').resume());
    } else if (r < 0.64) {
      // Restart from the pause menu, at whatever moment this is (mid-transform, mid-gag, mid-cinematic).
      await s.page.evaluate(() => window.__bus.emit('system:pause'));
      await sleep(200);
      await s.page.evaluate(() => window.__game.scene.getScene('Pause')?.sys.isActive() && window.__game.scene.getScene('Pause').restart());
      await sleep(1200);
    }
    await sleep(60 + rand() * 200);
    const state = await s.page
      .evaluate(() => {
        const g = window.__game;
        const lvl = window.__level;
        const p = lvl?.player;
        const level = g.scene.getScene('Level');
        return {
          frame: g.loop.frame,
          active: g.scene.scenes.filter((x) => x.sys.isActive()).map((x) => x.sys.settings.key),
          levelActive: level.sys.isActive(),
          x: p?.x,
          y: p?.y,
          dead: p?.dead,
          ctl: p?.controlsEnabled,
          w: lvl?.world?.widthPx,
          h: lvl?.world?.heightPx,
          inSolid: p && !p.dead && lvl.world.isSolid(p.x, p.y - 4) && lvl.world.isSolid(p.x, p.y - 14),
          lostEnemies: (lvl?.drones ?? []).filter((d) => d.alive && (!Number.isFinite(d.x) || !Number.isFinite(d.y) || d.x < -200 || d.x > lvl.world.widthPx + 200 || d.y > lvl.world.heightPx + 200)).map((d) => `${d.kind ?? d.brain?.kind ?? 'enemy'}@${Math.round(d.x / 16)},${Math.round(d.y / 16)}`),
        };
      })
      .catch((e) => ({ error: e.message }));
    if (state.error) {
      failures.push(`evaluate failed: ${state.error}`);
      break;
    }
    if (!state.active.length) failures.push('no scene running');
    if (state.levelActive) {
      if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) failures.push(`player position ${state.x},${state.y}`);
      else if (state.x < -40 || state.x > state.w + 40 || state.y > state.h + 200) failures.push(`player out of the world at ${Math.round(state.x)},${Math.round(state.y)}`);
      if (state.inSolid) failures.push(`player inside solid ground at ${Math.round(state.x / 16)},${Math.round(state.y / 16)}`);
      if (state.lostEnemies.length) failures.push(`enemies out of the world: ${state.lostEnemies.join(' ')}`);
      if (lastX !== null && Math.abs(state.x - lastX) > 2) stuckSince = Date.now();
      lastX = state.x;
    }
    if (failures.length > 6) break;
  }
  for (const k of held) await s.page.keyboard.up(k);
  // The game loop must still be alive at the end.
  const f0 = await s.page.evaluate(() => window.__game.loop.frame).catch(() => -1);
  await sleep(600);
  const f1 = await s.page.evaluate(() => window.__game.loop.frame).catch(() => -1);
  if (f1 <= f0) failures.push('game loop stopped');
  return { name, failures: [...new Set(failures)] };
}

async function fuzz(s, seconds) {
  const results = [];
  let seed = 7;
  const only = args.levels ? String(args.levels).split(',') : null;
  for (const level of [...CHAPTERS, 'training'].filter((l) => !only || only.includes(l))) {
    const cps = level === 'training' ? [null] : [null, ...(await checkpointsOf(s, level))];
    for (const cp of cps) {
      const r = await fuzzCheckpoint(s, level, cp, seconds, seed++);
      results.push(r);
      console.log(`  ${r.name}: ${r.failures.length ? r.failures.join(' | ') : 'ok'}`);
    }
  }
  return results;
}

// ------------------------------------------------------------------ main

async function main() {
  if (!args['no-build']) build();
  fs.rmSync(RESULTS, { recursive: true, force: true });
  fs.mkdirSync(RESULTS, { recursive: true });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--autoplay-policy=no-user-gesture-required'] });
  const report = { issues: [], errors: [], fuzz: [] };
  try {
    for (const size of sizes) {
      const s = new Session(browser, base, size);
      await s.open();
      console.log(`== ${size}`);
      if (!args['only-fuzz']) {
        if (parts.has('menus')) await sweepMenus(s);
        if (parts.has('levels')) await sweepLevels(s);
        if (parts.has('hud')) await hudGauntlet(s);
      }
      if (args.fuzz && (size === sizes[0] || args['fuzz-all'])) report.fuzz.push(...(await fuzz(s, Number(args.seconds ?? 15))));
      report.issues.push(...s.issues);
      report.errors.push(...s.errors.map((e) => ({ size, ...e })));
      await s.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  fs.writeFileSync(path.join(RESULTS, 'report.json'), JSON.stringify(report, null, 2));
  const byKind = {};
  for (const i of report.issues) (byKind[i.kind] ??= []).push(i);
  console.log('\nText issues by kind:');
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`  ${kind}: ${list.length}`);
    const seen = new Set();
    for (const i of list) {
      const key = `${i.kind}|${i.text}|${i.detail}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`    [${i.size} ${i.where}] ${i.scene}: "${i.text}" ${i.detail}`);
    }
  }
  console.log(`Page errors: ${report.errors.length}`);
  for (const e of report.errors.slice(0, 30)) console.log(`  [${e.size} ${e.where}] ${e.error}`);
  const fuzzFails = report.fuzz.filter((f) => f.failures.length);
  if (report.fuzz.length) console.log(`Fuzz: ${report.fuzz.length} checkpoints, ${fuzzFails.length} with failures`);
  console.log(`Screenshots and report.json in ${path.relative(ROOT, RESULTS)}/`);
  if (report.issues.length || report.errors.length || fuzzFails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
