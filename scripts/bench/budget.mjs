// The performance gate (docs/PERFORMANCE.md), checked by `npm run bench` on the phone viewport.
//
// CPU time depends on the machine, so CPU limits are relative: every scenario is played by this
// build and by a build of current main on the same machine, alternating, and this build must not
// be slower than main by more than run-to-run noise (REGRESSION). A scenario main can't play (a
// new chapter's) is held to main's heaviest scenario instead: a new chapter may not add a moment
// heavier than the heaviest one the game already has.
//
// What doesn't depend on the machine stays absolute (ABSOLUTE and the leak check): render targets
// created, the render-target pool, heap kept after a scenario, listeners, textures, held sounds.

/** How much slower than main a scenario may measure before it counts as a regression: base * scale + slack. */
export const REGRESSION = {
  throttle: 4,
  /**
   * Mean CPU per frame (ms). Two builds of the same commit, alternating, differ by up to ~14% in a
   * single run but within ~6% on the best of two rounds, which is what's compared (BEST_OF).
   */
  cpuMean: { scale: 1.1, slack: 0.6, label: 'mean CPU per frame (ms)' },
  /** 95th percentile CPU per frame (ms). */
  cpuP95: { scale: 1.15, slack: 1.5, label: 'p95 CPU per frame (ms)' },
  /** 99th percentile: one or two frames of a 12 s run, so a coarse guard. */
  cpuP99: { scale: 1.3, slack: 4, label: 'p99 CPU per frame (ms)' },
  /** Frames whose game step alone took over 50 ms, per 12 s scenario. */
  longSteps: { scale: 1, slack: 3, label: 'frames over 50 ms' },
  /** Garbage collections per second (they scale with frames per second, so with the machine). */
  gcPerSec: { scale: 1.3, slack: 0.4, label: 'GCs per second' },
  /**
   * Longest GC pause (ms): a major GC lands in a random round, so even the best of two rounds of
   * one build read 5.7 and 15.2 ms in the A/A run, hence the wide margin. A leak or an allocation
   * storm shows up in gcPerSec and the leak check first.
   */
  gcMaxMs: { scale: 2, slack: 10, label: 'longest GC pause (ms)' },
};

/** Machine-independent per-scenario limits (any build, any machine). */
export const ABSOLUTE = {
  /** WebGL framebuffers created per second in steady play (render targets must be reused; 5-7 before the performance pass). */
  fbAllocsPerSec: { max: 0.5, label: 'framebuffers created per second' },
  /** Phaser's render-target pool: one per camera filter pass, not one per frame (16-28 before the pass). */
  renderPool: { max: 4, label: 'render-target pool size' },
  /** JS heap kept after a forced GC across one scenario, MB (worst: 3.3, the explosion storm filling its pools). */
  retainedGrowthMb: { max: 4.5, label: 'heap kept after the scenario (MB)' },
};

export const LEAK = {
  /** EventBus and game event listeners must come back to the same count after every chapter cycle. */
  listenerGrowth: 0,
  /** Heap after GC, first cycle to the lowest of the last three, MB (a 12-cycle run levels off about 1.3 MB up). */
  heapGrowthMb: 2,
  /** Live Web Audio sources (oscillators, buffer sources), first cycle to last. Music voices make this noisy. */
  audioSourceGrowth: 6,
  /** Held sounds (sources with no stop scheduled, e.g. loops) still playing after a level ends. */
  heldSounds: 0,
  /** Textures in the Texture Manager, first cycle to last. */
  textureGrowth: 0,
};

/**
 * The absolute CPU numbers the budget used before it became relative, from the machine that set
 * them. Reported for reference only (`--absolute` checks them, e.g. on that machine).
 */
export const LEGACY_CPU = { cpuMean: 26, cpuP95: 45, cpuP99: 95, longSteps: 8, gcMaxMs: 30, gcPerSec: 4 };

/**
 * Timing stats compared on each build's best round: background load only ever makes a run slower,
 * so the fastest round is the least noisy estimate (a real regression is slow in every round).
 */
export const BEST_OF = new Set(['cpuMean', 'cpuP95', 'cpuP99', 'longSteps', 'gcMaxMs']);
/** Worst-case counts (the render-target pool only grows). */
const WORST_OF = new Set(['renderPool']);

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const round = (v) => Math.round(v * 100) / 100;

/**
 * Folds the rounds of each scenario and throttle into one row per (build, scenario, throttle):
 * timing on the best round (BEST_OF), the render-target pool on the worst, the rest averaged.
 */
export function averageRuns(rows) {
  const groups = new Map();
  for (const r of rows) {
    const k = `${r.build}|${r.scenario}|${r.x}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const out = [];
  for (const list of groups.values()) {
    const avg = { ...list[0], runs: list.length };
    for (const key of Object.keys(list[0])) {
      if (typeof list[0][key] !== 'number' || key === 'x') continue;
      const values = list.map((r) => r[key] ?? 0);
      avg[key] = BEST_OF.has(key) ? Math.min(...values) : WORST_OF.has(key) ? Math.max(...values) : round(mean(values));
    }
    out.push(avg);
  }
  return out;
}

/**
 * Every way `current` regresses against `base` (both averaged rows, one per scenario and throttle),
 * plus every absolute limit it breaks, as readable lines. Empty when it passes.
 */
export function checkRegression(base, current, opts = {}) {
  const out = [];
  const throttle = opts.throttle ?? REGRESSION.throttle;
  const baseRows = base.filter((r) => r.x === throttle);
  // The heaviest of main's scenarios, stat by stat: the bar for a scenario main can't play.
  const heaviest = {};
  for (const key of Object.keys(REGRESSION)) {
    if (key === 'throttle') continue;
    heaviest[key] = Math.max(0, ...baseRows.map((r) => r[key] ?? 0));
  }
  for (const row of current.filter((r) => r.x === throttle)) {
    const ref = baseRows.find((r) => r.scenario === row.scenario);
    for (const [key, rule] of Object.entries(REGRESSION)) {
      if (key === 'throttle' || row[key] === undefined || row[key] === null) continue;
      const against = ref ? ref[key] : heaviest[key];
      if (against === undefined || against === null) continue;
      const limit = round(against * rule.scale + rule.slack);
      if (row[key] > limit) out.push(`${row.scenario}: ${rule.label} ${row[key]} > ${limit} (${ref ? 'main' : "main's heaviest scenario"}: ${against})`);
    }
  }
  for (const row of current) {
    for (const [key, rule] of Object.entries(ABSOLUTE)) {
      const v = row[key];
      if (v !== undefined && v !== null && v > rule.max) out.push(`${row.scenario} @ ${row.x}x: ${rule.label} ${v} > ${rule.max}`);
    }
  }
  return out;
}

/** The old absolute CPU check, for `--absolute` (only meaningful on the machine that set LEGACY_CPU). */
export function checkAbsoluteCpu(rows, throttle = REGRESSION.throttle) {
  const out = [];
  for (const row of rows.filter((r) => r.x === throttle)) {
    for (const [key, max] of Object.entries(LEGACY_CPU)) {
      if (row[key] !== undefined && row[key] > max) out.push(`${row.scenario}: ${key} ${row[key]} > ${max}`);
    }
  }
  return out;
}

/** Leaks: absolute on any machine. */
export function checkLeaks(report, leak = LEAK) {
  const out = [];
  const rows = report.leak;
  if (rows && rows.length >= 2) {
    const first = rows[0];
    const last = rows[rows.length - 1];
    const grow = (k) => last[k] - first[k];
    if (grow('bus') > leak.listenerGrowth) out.push(`leak: EventBus listeners ${first.bus} -> ${last.bus}`);
    if (grow('gameEvents') > leak.listenerGrowth) out.push(`leak: game event listeners ${first.gameEvents} -> ${last.gameEvents}`);
    // A single cycle can read a megabyte or two high (whatever the last scene left for the next GC); a leak
    // raises every cycle, so compare the lowest of the last three with the first.
    const settled = Math.min(...rows.slice(-3).map((r) => r.heapMb));
    if (settled - first.heapMb > leak.heapGrowthMb) out.push(`leak: heap ${first.heapMb} -> ${rows.map((r) => r.heapMb).join(', ')} MB`);
    if (grow('audioSources') > leak.audioSourceGrowth) out.push(`leak: live audio sources ${first.audioSources} -> ${last.audioSources}`);
    if (last.audioHeld > leak.heldSounds) out.push(`leak: ${last.audioHeld} held sounds still playing in the menu after a cycle`);
    if (grow('textures') > leak.textureGrowth) out.push(`leak: textures ${first.textures} -> ${last.textures}`);
  }
  const held = report.heldSounds;
  if (held && held.perRestart.length >= 2) {
    const growth = held.perRestart[held.perRestart.length - 1] - held.perRestart[0];
    if (growth > 0) out.push(`leak: held sounds pile up across restarts (${held.perRestart.join(' ')})`);
    if (held.menuAfter > leak.heldSounds) out.push(`leak: ${held.menuAfter} held sounds still playing in the menu`);
  }
  return out;
}
