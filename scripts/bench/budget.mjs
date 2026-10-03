// The performance budget (docs/PERFORMANCE.md). Checked by `npm run bench` on the phone viewport at
// 4x CPU throttle: every scenario must stay inside these numbers, and the leak check must stay flat.
// Numbers are CPU time per frame of the game step (update + render submission) in headless
// Chromium; see docs/PERFORMANCE.md for why it is CPU time and not FPS.

export const BUDGET = {
  device: 'phone',
  throttle: 4,
  /** Mean CPU per frame, ms. */
  cpuMeanMs: 26,
  /** 99th percentile CPU per frame, ms. */
  cpuP99Ms: 70,
  /** Frames whose game step alone took over 50 ms (per 12 s window). */
  longSteps: 12,
  /** Longest garbage collection pause, ms. */
  gcMaxMs: 15,
  /** Garbage collections per second. */
  gcPerSec: 4,
  /** WebGL framebuffers created per second in steady play (render targets must be reused). */
  framebufferAllocsPerSec: 0.5,
  /** Phaser's render-target pool: one per camera filter pass, not one per frame. */
  renderPool: 4,
  /** JS heap kept after a forced GC across one scenario, MB. */
  retainedGrowthMb: 3,
  leak: {
    /** EventBus and game event listeners must come back to the same count after every chapter cycle. */
    listenerGrowth: 0,
    /** Heap after GC, first cycle to last, MB. */
    heapGrowthMb: 2,
    /** Live Web Audio sources (oscillators, buffer sources), first cycle to last. Music voices make this noisy. */
    audioSourceGrowth: 6,
    /** Held sounds (sources with no stop scheduled, e.g. loops) still playing after a level ends. */
    heldSounds: 0,
    /** Textures in the Texture Manager, first cycle to last. */
    textureGrowth: 0,
  },
};

const LIMITS = [
  ['cpuMean', 'cpuMeanMs', 'mean CPU per frame (ms)'],
  ['cpuP99', 'cpuP99Ms', 'p99 CPU per frame (ms)'],
  ['longSteps', 'longSteps', 'frames over 50 ms'],
  ['gcMaxMs', 'gcMaxMs', 'longest GC pause (ms)'],
  ['gcPerSec', 'gcPerSec', 'GCs per second'],
  ['fbAllocsPerSec', 'framebufferAllocsPerSec', 'framebuffers created per second'],
  ['renderPool', 'renderPool', 'render-target pool size'],
  ['retainedGrowthMb', 'retainedGrowthMb', 'heap kept after the scenario (MB)'],
];

/** Every way a report breaks the budget, as readable lines (empty when it passes). */
export function checkBudget(report, budget) {
  const out = [];
  if (!budget.throttle) return out;
  if (report.device === budget.device) {
    for (const row of report.scenarios.filter((r) => r.x === budget.throttle)) {
      for (const [stat, key, label] of LIMITS) {
        const value = row[stat];
        if (value === undefined || value === null || budget[key] === undefined) continue;
        if (value > budget[key]) out.push(`${row.scenario}: ${label} ${value} > ${budget[key]}`);
      }
    }
  }
  const leak = report.leak;
  if (leak && leak.length >= 2) {
    const first = leak[0];
    const last = leak[leak.length - 1];
    const grow = (k) => last[k] - first[k];
    if (grow('bus') > budget.leak.listenerGrowth) out.push(`leak: EventBus listeners ${first.bus} -> ${last.bus}`);
    if (grow('gameEvents') > budget.leak.listenerGrowth) out.push(`leak: game event listeners ${first.gameEvents} -> ${last.gameEvents}`);
    if (grow('heapMb') > budget.leak.heapGrowthMb) out.push(`leak: heap ${first.heapMb} -> ${last.heapMb} MB`);
    if (grow('audioSources') > budget.leak.audioSourceGrowth) out.push(`leak: live audio sources ${first.audioSources} -> ${last.audioSources}`);
    if (last.audioHeld > budget.leak.heldSounds) out.push(`leak: ${last.audioHeld} held sounds still playing in the menu after a cycle`);
    if (grow('textures') > budget.leak.textureGrowth) out.push(`leak: textures ${first.textures} -> ${last.textures}`);
  }
  const held = report.heldSounds;
  if (held && held.perRestart.length >= 2) {
    const growth = held.perRestart[held.perRestart.length - 1] - held.perRestart[0];
    if (growth > 0) out.push(`leak: held sounds pile up across restarts (${held.perRestart.join(' ')})`);
    if (held.menuAfter > budget.leak.heldSounds) out.push(`leak: ${held.menuAfter} held sounds still playing in the menu`);
  }
  return out;
}
