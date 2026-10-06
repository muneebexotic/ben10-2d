import { describe, expect, it } from 'vitest';
import { defaultSwitches, parseContextVariant, parseSwitches, switchLabel } from '../src/systems/PerfSwitches';
import { BENCH_SCENARIOS, BISECT, buildPlan, estimateMinutes, firstVisit, timing, variantById } from '../src/systems/autobench/plan';
import { refreshRate, summarize, type FrameSample } from '../src/systems/autobench/stats';
import { formatReport, formatRow, switchEffects, type RunResult } from '../src/systems/autobench/report';
import { deviceWarnings, inAppBrowser, type DeviceInfo } from '../src/systems/autobench/device';
import { scriptAt } from '../src/systems/Autopilot';
import type { Controls } from '../src/systems/InputMap';
import { QualityGovernor } from '../src/systems/Quality';
import { QUALITY } from '../src/config/quality';
import { autobenchSave, memoryStorage } from '../src/systems/autobench/fixture';
import { SAVE_KEY, SaveSystem } from '../src/systems/SaveSystem';

describe('perf switches', () => {
  it('defaults to normal play', () => {
    expect(parseSwitches('')).toEqual(defaultSwitches());
    expect(switchLabel(defaultSwitches())).toBe('');
  });

  it('reads every bisect switch, alone or combined', () => {
    const s = parseSwitches('?fx=0&particles=0&bg=0&scale=0.5&bodies=0&governor=0&orphan=1&css=smooth&audio=0');
    expect(s).toEqual({ fx: false, particles: false, bg: false, scale: 0.5, bodies: false, governor: false, orphan: true, smoothCss: true, audio: false });
    expect(switchLabel(s)).toBe('fx=0 particles=0 bg=0 scale=0.5 bodies=0 governor=0 orphan=1 css=smooth audio=0');
    expect(parseSwitches('?bodies=1').bodies).toBe(true);
  });

  it('ignores nonsense scales and context names', () => {
    expect(parseSwitches('?scale=3').scale).toBe(1);
    expect(parseSwitches('?scale=abc').scale).toBe(1);
    expect(parseContextVariant('?ctx=desync')).toBe('desync');
    expect(parseContextVariant('?ctx=lean')).toBe('lean');
    expect(parseContextVariant('?ctx=webgl9')).toBe('default');
  });
});

describe('autobench plan', () => {
  it('plays every heavy scene normally and then with each switch', () => {
    const plan = buildPlan({ contexts: false });
    const heavy = ['ch1-boss', 'ch2-convoy', 'ch2-boss', 'ch3-blackout', 'ch3-frog', 'ch4-arcade', 'ch4-kevin', 'misfire'];
    for (const id of heavy) {
      const runs = plan.filter((r) => r.scenario === id && !r.drift).map((r) => r.variant);
      expect(runs[0]).toBe('base');
      for (const v of BISECT) expect(runs).toContain(v.id);
    }
    expect(plan[0]).toMatchObject({ scenario: 'blank', variant: 'base' });
    expect(plan.filter((r) => r.drift)).toHaveLength(1);
    expect(plan.every((r) => r.page === 0)).toBe(true);
  });

  it('covers all four bosses, the convoy, the blackout, the arcade and the misfire gag', () => {
    const ids = BENCH_SCENARIOS.map((s) => s.id);
    for (const id of ['ch1-boss', 'ch2-boss', 'ch3-frog', 'ch4-kevin', 'ch2-convoy', 'ch3-blackout', 'ch4-arcade', 'misfire']) expect(ids).toContain(id);
  });

  it('puts context variants on their own pages, after everything else', () => {
    const plan = buildPlan({ only: ['calm'] });
    const pages = plan.map((r) => r.page);
    expect([...pages].sort((a, b) => a - b)).toEqual(pages);
    const reloaded = plan.filter((r) => r.page > 0);
    expect(reloaded.map((r) => `${r.page}:${r.ctx}`)).toEqual(['1:default', '2:desync', '3:lean']);
  });

  it('limits to the scenes asked for and estimates the time', () => {
    const plan = buildPlan({ only: ['ch3-frog'], contexts: false });
    expect(new Set(plan.map((r) => r.scenario))).toEqual(new Set(['blank', 'ch3-frog']));
    expect(estimateMinutes(buildPlan(), timing(false))).toBeGreaterThan(estimateMinutes(buildPlan(), timing(true)));
    expect(variantById('nope').id).toBe('base');
  });

  it('warms up longer on the first run of each scene and each page', () => {
    const plan = buildPlan({ only: ['calm'] });
    const firsts = plan.map((_, i) => firstVisit(plan, i));
    expect(firsts[0]).toBe(true);
    expect(firsts[1]).toBe(false); // blank again
    const calm = plan.findIndex((r) => r.scenario === 'calm');
    expect(firsts[calm]).toBe(true);
    expect(firsts[calm + 1]).toBe(false);
    for (let i = 0; i < plan.length; i++) if (plan[i].page !== plan[i - 1]?.page) expect(firsts[i]).toBe(true);
  });
});

const frame = (interval: number, cpu: number, quality = 0): FrameSample => ({ interval, cpu, render: cpu / 2, draws: 40, fbBinds: 3, uploadBytes: 2048, texUploads: 0, quality });

describe('autobench stats', () => {
  it('matches the debug meter definitions', () => {
    const samples = Array.from({ length: 100 }, (_, i) => frame(i === 0 ? 50 : 20, 4, i < 50 ? 0 : 2));
    const s = summarize(samples);
    expect(s.fps).toBeCloseTo(1000 / ((50 + 99 * 20) / 100), 5);
    expect(s.low1).toBeCloseTo(20, 5); // p99 of 100 frames is the slowest
    expect(s.cpu).toBe(4);
    expect(s.idle).toBeCloseTo((50 + 99 * 20) / 100 - 4, 5);
    expect(s.uploadKb).toBe(2);
    expect(s.quality).toEqual([50, 0, 50]);
    expect(s.jankPct).toBe(1);
  });

  it('snaps the refresh rate to common rates', () => {
    expect(refreshRate(Array(60).fill(16.7))).toBe(60);
    expect(refreshRate(Array(60).fill(8.33))).toBe(120);
    expect(refreshRate(Array(60).fill(33.4))).toBe(30);
    expect(refreshRate(Array(60).fill(11.1))).toBe(90);
    expect(refreshRate([16, 17])).toBe(0);
  });
});

describe('autobench report', () => {
  const result = (scenario: string, variant: string, fps: number, extra: Partial<RunResult> = {}): RunResult => ({
    scenario,
    variant,
    ctx: 'default',
    page: 0,
    summary: { ...summarize([frame(1000 / fps, 4)]), fps },
    gpu: 10,
    gpuMethod: 'timer',
    longTasks: 0,
    heapMb: 30,
    fullscreen: true,
    flags: [],
    ...extra,
  });

  it('measures each switch against the same scene\'s base', () => {
    const effects = switchEffects([result('a', 'base', 40), result('a', 'fx=0', 50), result('b', 'base', 30), result('b', 'fx=0', 33), result('a', 'base', 20, { drift: true })]);
    expect(effects).toHaveLength(1);
    expect(effects[0].variant).toBe('fx=0');
    expect(effects[0].scenes).toBe(2);
    expect(effects[0].fpsDelta).toBe(10); // median of 10 and 3 (upper middle)
  });

  it('formats a compact report with device, rows, effects and drift', () => {
    const device: DeviceInfo = {
      ua: 'test',
      dpr: 2.6,
      screen: '915x412',
      viewport: '915x412',
      cores: 8,
      memoryGb: 4,
      refreshHz: 60,
      battery: '80% charging',
      saveData: false,
      reducedMotion: false,
      renderer: 'Mali-G57',
      vendor: 'ARM',
      webgl: 'WebGL 1.0',
      contextAttributes: 'alpha=0',
      maxTextureSize: 4096,
      timerQuery: 'webgl1 no, webgl2 no',
      canvas: 'backing 799x360',
      inApp: null,
    };
    const report = formatReport({
      version: 'v1',
      date: '2026-10-06',
      device,
      warnings: [],
      pages: [{ page: 0, ctx: 'default', contextAttributes: 'depth=1', fullscreen: true }],
      results: [result('calm', 'base', 45), result('calm', 'fx=0', 55), result('calm', 'base', 40, { drift: true }), result('calm', 'base', 44, { page: 2, ctx: 'desync' })],
      timing: { warmupMs: 3000, recordMs: 12000 },
    });
    expect(report).toContain('Mali-G57');
    expect(report).toContain('SWITCH EFFECT');
    expect(report).toContain('DRIFT: calm base 45.0 fps at the start, 40.0 at the end');
    expect(report).toContain('CONTEXT VARIANTS');
    expect(formatRow(result('calm', 'base', 45, { gpuMethod: 'sync', gpu: 12.34 }))).toContain('12.3~');
    // Fits a phone's clipboard comfortably and pastes as plain ASCII.
    expect(/^[\x20-\x7e\n]*$/.test(report)).toBe(true);
  });
});

describe('device warnings', () => {
  const ok = { refreshHz: 60, battery: { level: 0.8, charging: true }, inApp: null, saveData: false, fullscreen: true, touch: true, zoom: 1 };

  it('stays quiet on a healthy phone', () => {
    expect(deviceWarnings(ok)).toEqual([]);
  });

  it('flags battery saver (a 30 Hz cap), low battery, in-app browsers and zoom', () => {
    expect(deviceWarnings({ ...ok, refreshHz: 30 })[0]).toContain('BATTERY SAVER');
    expect(deviceWarnings({ ...ok, refreshHz: 48 })[0]).toContain('LIMITING THE REFRESH RATE');
    expect(deviceWarnings({ ...ok, battery: { level: 0.1, charging: false } })[0]).toContain('PLUG IN');
    expect(deviceWarnings({ ...ok, inApp: 'Instagram' })[0]).toContain('INSTAGRAM');
    expect(deviceWarnings({ ...ok, fullscreen: false })[0]).toContain('NOT FULLSCREEN');
    expect(deviceWarnings({ ...ok, zoom: 1.5 })[0]).toContain('ZOOMED');
  });

  it('recognises in-app browsers from the user agent', () => {
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/141.0 Mobile Safari/537.36')).toBeNull();
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14; wv) Instagram 300.0')).toBe('Instagram');
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14; SM-A515F Build/UP1A; wv) AppleWebKit Chrome/141.0 Mobile')).toBe('an Android WebView');
    expect(inAppBrowser('Mozilla/5.0 [FBAN/EMA;FBLC/en_US]')).toBe('Facebook');
  });
});

// InputMap pulls in Phaser (no DOM in tests): a blank Controls by hand.
const emptyControls = (): Controls => ({
  left: false,
  right: false,
  up: false,
  down: false,
  jumpPressed: false,
  jumpHeld: false,
  attackPressed: false,
  attackHeld: false,
  specialPressed: false,
  specialHeld: false,
  specialReleased: false,
  dialPrev: false,
  dialNext: false,
  dialPick: null,
  transform: false,
  transformLeadMs: 0,
  pause: false,
  confirm: false,
  anyPressed: false,
});

describe('autopilot', () => {
  it('plays the bench brawler: attack, jump, attack, special, attack, dial, transform', () => {
    expect(scriptAt('brawl', 100, 0)).toMatchObject({ attack: true, right: true });
    expect(scriptAt('brawl', 800, 0)).toMatchObject({ jump: true, right: true });
    expect(scriptAt('brawl', 1500, 0)).toMatchObject({ special: true, right: false, left: false });
    expect(scriptAt('brawl', 2160, 0).dialPrev).toBe(true);
    expect(scriptAt('brawl', 2220, 0).transform).toBe(true);
    expect(scriptAt('brawl', 2250 + 100, 0)).toMatchObject({ attack: true, left: true });
    expect(scriptAt('brawlNoSwap', 2220, 0).transform).toBe(false);
  });

  it('skips cinematics early, then stops tapping', () => {
    expect(scriptAt('idle', 10, 2400).confirm).toBe(true);
    expect(scriptAt('idle', 410, 2400).confirm).toBe(true);
    expect(scriptAt('idle', 200, 2400).confirm).toBe(false);
    expect(scriptAt('idle', 2810, 2400).confirm).toBe(false);
  });

  it('merges into Controls with press edges only once', async () => {
    const { autopilot } = await import('../src/systems/Autopilot');
    autopilot.start('advance', 0, 0);
    const a = emptyControls();
    autopilot.merge(a, 10);
    expect(a.right && a.attackPressed && a.attackHeld).toBe(true);
    const b = emptyControls();
    autopilot.merge(b, 30);
    expect(b.attackHeld).toBe(true);
    expect(b.attackPressed).toBe(false);
    autopilot.stop();
    const c = emptyControls();
    autopilot.merge(c, 40);
    expect(c.right).toBe(false);
  });
});

describe('quality governor reset', () => {
  it('jumps to a level and starts a fresh warm-up', () => {
    const q = new QualityGovernor(QUALITY);
    q.setLevel(2);
    expect(q.lowest).toBe(true);
    q.setLevel(0);
    expect(q.level).toBe(0);
    q.setLevel(9);
    expect(q.level).toBe(QUALITY.particleLevels.length - 1);
  });
});

describe('autobench save isolation', () => {
  it('plays a throwaway file with every alien, kept in memory', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(autobenchSave(0)) });
    const save = new SaveSystem(storage);
    expect(save.getSlot(0)?.unlockedAliens).toContain('upgrade');
    save.setMuted(true);
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).muted).toBe(true);
  });
});
