import type { ContextVariant, PerfSwitches } from '../PerfSwitches';

/**
 * The on-device autobench's plan: which scenes it plays, with which switches,
 * in what order. Pure data and functions (unit-tested); AutobenchScene runs it.
 */

/** How the scripted player behaves (the same moves as `npm run bench`). */
export type Driver = 'brawl' | 'brawlNoSwap' | 'advance' | 'idle' | 'none';

export interface BenchScenario {
  id: string;
  title: string;
  /** null: no level at all (the blank canvas). */
  levelId: string | null;
  checkpoint: string | null;
  driver: Driver;
  setup?: 'kevinArena' | 'misfireChaos';
}

export const BENCH_SCENARIOS: readonly BenchScenario[] = [
  { id: 'blank', title: 'Empty canvas: the browser and compositor alone', levelId: null, checkpoint: null, driver: 'none' },
  { id: 'calm', title: 'Ch1 forest at night, standing still', levelId: 'ch1', checkpoint: 'cp-cliff', driver: 'idle' },
  { id: 'ch1-boss', title: 'Ch1 Hunter-Killer drone', levelId: 'ch1', checkpoint: 'cp-arena', driver: 'brawlNoSwap' },
  { id: 'ch2-convoy', title: 'Ch2 roof ride and convoy', levelId: 'ch2', checkpoint: 'cp-convoy', driver: 'brawl' },
  { id: 'ch2-boss', title: 'Ch2 ROADBREAKER', levelId: 'ch2', checkpoint: 'cp-arena', driver: 'brawl' },
  { id: 'ch3-blackout', title: 'Ch3 blackout', levelId: 'ch3', checkpoint: 'cp-dark', driver: 'advance' },
  { id: 'ch3-frog', title: 'Ch3 KING CROAK', levelId: 'ch3', checkpoint: 'cp-frog', driver: 'brawl' },
  { id: 'ch4-arcade', title: 'Ch4 GAME ZONE', levelId: 'ch4', checkpoint: 'cp-arcade', driver: 'brawl' },
  { id: 'ch4-kevin', title: 'Ch4 KEVIN 11', levelId: 'ch4', checkpoint: 'cp-kevin', driver: 'brawl', setup: 'kevinArena' },
  { id: 'misfire', title: 'Training, misfires on CHAOS', levelId: 'training', checkpoint: null, driver: 'brawl', setup: 'misfireChaos' },
];

export interface BenchVariant {
  id: string;
  switches: Partial<PerfSwitches>;
}

/** Normal play, then the owner's bisect switches one at a time. */
export const BASE: BenchVariant = { id: 'base', switches: {} };
export const BISECT: readonly BenchVariant[] = [
  { id: 'fx=0', switches: { fx: false } },
  { id: 'particles=0', switches: { particles: false } },
  { id: 'bg=0', switches: { bg: false } },
  { id: 'scale=0.5', switches: { scale: 0.5 } },
  // Normal play draws no bodies; this run adds what ?debug=1 draws, to size its cost.
  { id: 'bodies=1', switches: { bodies: true } },
  { id: 'governor=0', switches: { governor: false } },
];
/** Extra diagnostics on a calm and a heavy scene: driver behaviour, the compositor, audio, and everything off. */
export const EXTRAS: readonly BenchVariant[] = [
  { id: 'orphan=1', switches: { orphan: true } },
  { id: 'css=smooth', switches: { smoothCss: true } },
  { id: 'audio=0', switches: { audio: false } },
  { id: 'all-off', switches: { fx: false, particles: false, bg: false } },
];
const EXTRA_SCENES = new Set(['calm', 'ch4-arcade']);
/** Context variants need a fresh page (WebGL context attributes are fixed at creation). */
const CONTEXT_SCENES = ['calm', 'ch4-arcade'];
const CONTEXTS: readonly ContextVariant[] = ['default', 'desync', 'lean'];

export function variantById(id: string): BenchVariant {
  return [BASE, ...BISECT, ...EXTRAS].find((v) => v.id === id) ?? BASE;
}

export function scenarioById(id: string): BenchScenario | undefined {
  return BENCH_SCENARIOS.find((s) => s.id === id);
}

export interface BenchRun {
  scenario: string;
  variant: string;
  ctx: ContextVariant;
  /** Runs on the same page share one page load; a new page means a reload (context variants). */
  page: number;
  /** A repeat of the first base run at the end, to see if the phone slowed down (heat, battery). */
  drift?: boolean;
}

export interface PlanOptions {
  /** Only these scenario ids (the blank canvas is always kept). */
  only?: readonly string[] | null;
  /** Skip the page reloads that test WebGL context variants. */
  contexts?: boolean;
}

export function buildPlan(opts: PlanOptions = {}): BenchRun[] {
  const only = opts.only && opts.only.length > 0 ? new Set(opts.only) : null;
  const want = (id: string) => !only || only.has(id);
  const runs: BenchRun[] = [
    { scenario: 'blank', variant: 'base', ctx: 'default', page: 0 },
    { scenario: 'blank', variant: 'css=smooth', ctx: 'default', page: 0 },
  ];
  for (const s of BENCH_SCENARIOS) {
    if (s.id === 'blank' || !want(s.id)) continue;
    runs.push({ scenario: s.id, variant: 'base', ctx: 'default', page: 0 });
    for (const v of BISECT) runs.push({ scenario: s.id, variant: v.id, ctx: 'default', page: 0 });
    if (EXTRA_SCENES.has(s.id)) for (const v of EXTRAS) runs.push({ scenario: s.id, variant: v.id, ctx: 'default', page: 0 });
  }
  const first = runs.find((r) => r.scenario !== 'blank');
  if (first) runs.push({ scenario: first.scenario, variant: 'base', ctx: 'default', page: 0, drift: true });
  if (opts.contexts !== false) {
    const scenes = CONTEXT_SCENES.filter(want);
    // The default context runs again on a fresh page too, so each variant compares with a page loaded the same way.
    CONTEXTS.forEach((ctx, i) => {
      for (const id of scenes) runs.push({ scenario: id, variant: 'base', ctx, page: i + 1 });
    });
  }
  return runs;
}

export interface Timing {
  warmupMs: number;
  recordMs: number;
  /**
   * Extra warm-up for a scene's first run and a page's first run: the first
   * visit compiles shaders and uploads textures, which would make the base run
   * (always first) look slower than the switches that follow it.
   */
  firstVisitMs: number;
}

export function timing(quick: boolean): Timing {
  return quick ? { warmupMs: 2000, recordMs: 6000, firstVisitMs: 3000 } : { warmupMs: 3000, recordMs: 12000, firstVisitMs: 4000 };
}

/** Whether run `i` is the first of its scene, or the first on its page. */
export function firstVisit(runs: readonly BenchRun[], i: number): boolean {
  const prev = runs[i - 1];
  return !prev || prev.scenario !== runs[i].scenario || prev.page !== runs[i].page;
}

/** Rough minutes for a plan (each run also takes about 1.5 s to load, a page reload about 8 s). */
export function estimateMinutes(runs: readonly BenchRun[], t: Timing): number {
  let ms = 0;
  let page = 0;
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    ms += t.warmupMs + t.recordMs + 1500 + (firstVisit(runs, i) ? t.firstVisitMs : 0);
    if (r.page !== page) ms += 8000;
    page = r.page;
  }
  return Math.max(1, Math.round(ms / 60000));
}
