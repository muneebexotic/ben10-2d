import type { EnemyKind } from '../levels/types';

/**
 * ALIEN FILES: what the bot does in the Training arena to show each move
 * (one demo per line of the alien's `moves`, in the same order). The demo
 * loops: Ben is put back at `x` (tile) as the alien, `enemy` spawns if the
 * move needs one, then the steps play, each holding its keys for `ms`.
 *
 * The arena: water 4-17, the plaza with the dummy at 41 (floor row 24), a
 * trench at 62-67, the cracked wall at 80, the raised ledge 96-107 (row 20).
 */
export type DemoKey = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'special' | 'transform';

export interface DemoStep {
  keys: readonly DemoKey[];
  ms: number;
}

export interface MoveDemo {
  /** Start tile (feet on the floor below it). */
  x: number;
  steps: readonly DemoStep[];
  /** An enemy for the move to work on, this many tiles in front of Ben. */
  enemy?: { kind: EnemyKind; dx: number };
  /** Start as this alien and swap into the demo's alien with the step's `transform` (a swap-in move). */
  swapFrom?: string;
  /** Another alien on the dial to swap to (Grey Matter's analyse-then-swap). */
  dial?: string;
}

const s = (keys: readonly DemoKey[], ms: number): DemoStep => ({ keys, ms });
const tap = (key: DemoKey, ms = 260): DemoStep[] => [s([key], 90), s([], ms)];
const wait = (ms: number): DemoStep => s([], ms);

/** A beat of nothing at the end of every loop, so a move reads as one move. */
export const DEMO = {
  restMs: 700,
  /** How long the first loop waits for the arena (and the transformation) to settle. */
  settleMs: 900,
} as const;

export const ALIEN_DEMOS: Readonly<Record<string, readonly MoveDemo[]>> = {
  heatblast: [
    { x: 33, steps: [...tap('attack', 320), ...tap('attack', 320), ...tap('attack', 400), s(['up', 'attack'], 90), s(['up'], 600)] },
    { x: 37, steps: [s(['special'], 1300), wait(1200)] },
    { x: 30, steps: [...tap('jump', 220), s(['jump', 'right'], 1500), wait(900)] },
  ],
  fourarms: [
    { x: 38, steps: [...tap('attack', 240), ...tap('attack', 240), ...tap('attack', 700), s(['up', 'attack'], 90), wait(900)] },
    { x: 37, steps: [...tap('special', 1000), ...tap('jump', 260), ...tap('special', 1200)] },
    // The dummy is the readiest thing to lift (a downed drone or a boulder works the same).
    { x: 39, steps: [...tap('attack', 600), s(['right'], 300), ...tap('attack', 1300)] },
  ],
  xlr8: [
    { x: 39, steps: [s(['attack'], 1600), wait(500)] },
    { x: 34, steps: [...tap('special', 900), s(['left'], 120), s(['up', 'special'], 90), wait(1000)] },
    { x: 24, steps: [s(['left'], 1900), wait(400)] },
  ],
  wildmutt: [
    { x: 39, steps: [s(['attack'], 1500), wait(500)] },
    { x: 35, steps: [...tap('special', 900), s(['left'], 100), s(['up', 'special'], 90), wait(1100)] },
    { x: 37, steps: [s(['jump', 'right'], 420), s(['right'], 300), wait(800)] },
    { x: 92, steps: [s(['right'], 1400), ...tap('jump', 900)] },
    { x: 34, enemy: { kind: 'lurker', dx: 6 }, steps: [s(['right'], 600), wait(1600)] },
  ],
  stinkfly: [
    { x: 33, steps: [...tap('jump', 200), s(['jump', 'right'], 1300), wait(1000)] },
    { x: 33, steps: [...tap('jump', 200), s(['jump'], 700), s(['down', 'right'], 700), wait(800)] },
    { x: 35, steps: [...tap('attack', 120), ...tap('attack', 120), ...tap('attack', 900)] },
    { x: 37, steps: [...tap('special', 1800)] },
  ],
  upgrade: [
    { x: 34, steps: [s(['attack'], 1200), s(['up', 'attack'], 900), wait(400)] },
    { x: 38, enemy: { kind: 'scout', dx: 2 }, steps: [...tap('special', 1600)] },
    { x: 38, enemy: { kind: 'scout', dx: 2 }, steps: [...tap('special', 900), s(['right'], 500), ...tap('attack', 700)] },
    { x: 38, enemy: { kind: 'scout', dx: 2 }, steps: [...tap('special', 900), ...tap('attack', 500), ...tap('attack', 500), ...tap('special', 900)] },
    { x: 38, enemy: { kind: 'scout', dx: 2 }, steps: [...tap('special', 1600)] },
  ],
  diamondhead: [
    { x: 34, steps: [s(['attack'], 1200), s(['up', 'attack'], 900), wait(400)] },
    { x: 36, enemy: { kind: 'scout', dx: 7 }, steps: [s(['special'], 2600), wait(500)] },
    { x: 36, enemy: { kind: 'scout', dx: 7 }, steps: [s(['special'], 600), s(['special', 'up'], 1600), wait(500)] },
    { x: 34, steps: [s(['up', 'special'], 90), wait(500), s(['jump', 'right'], 500), wait(900)] },
    { x: 36, enemy: { kind: 'scout', dx: 7 }, steps: [wait(2600)] },
  ],
  ghostfreak: [
    { x: 38, steps: [s(['attack'], 1500), wait(500)] },
    { x: 76, steps: [s(['special'], 200), s(['special', 'right'], 1700), wait(500)] },
    { x: 36, enemy: { kind: 'scout', dx: 6 }, steps: [s(['special'], 2600), wait(400)] },
    { x: 99, steps: [s(['left'], 900), wait(1400)] },
    { x: 38, swapFrom: 'heatblast', enemy: { kind: 'scout', dx: 4 }, steps: [wait(500), ...tap('transform', 1800)] },
  ],
  greymatter: [
    { x: 39, steps: [s(['attack'], 1500), wait(500)] },
    { x: 37, steps: [...tap('special', 1600)] },
    { x: 37, dial: 'fourarms', steps: [...tap('special', 700), ...tap('transform', 900), s(['right'], 250), ...tap('attack', 260), ...tap('attack', 900)] },
    { x: 33, steps: [s(['right'], 1400), s(['jump', 'right'], 500), wait(500)] },
    { x: 38, swapFrom: 'fourarms', enemy: { kind: 'scout', dx: 4 }, steps: [wait(500), ...tap('transform', 1800)] },
  ],
  ripjaws: [
    { x: 39, steps: [s(['attack'], 1500), wait(500)] },
    { x: 38, enemy: { kind: 'gunner', dx: 6 }, steps: [...tap('special', 900), ...tap('special', 1100)] },
    // In the arena's pool: a torpedo one way, then back along the stick.
    { x: 8, steps: [wait(700), s(['right', 'special'], 90), wait(700), s(['left', 'special'], 90), wait(800)] },
    { x: 7, steps: [wait(500), s(['right'], 700), s(['right', 'down'], 500), s(['left', 'up'], 800), wait(300)] },
    { x: 26, steps: [s(['right'], 1500), wait(900)] },
    { x: 38, swapFrom: 'fourarms', enemy: { kind: 'scout', dx: 4 }, steps: [wait(500), ...tap('transform', 1800)] },
  ],
};

/** Where a demo is in its loop at `t` ms: the keys held now (pure, for tests). */
export function demoKeysAt(demo: MoveDemo, t: number): readonly DemoKey[] {
  let at = 0;
  for (const step of demo.steps) {
    if (t < at + step.ms) return step.keys;
    at += step.ms;
  }
  return [];
}

/** One loop of a demo: its steps and the rest after them. */
export function demoLoopMs(demo: MoveDemo): number {
  return demo.steps.reduce((sum, st) => sum + st.ms, 0) + DEMO.restMs;
}
