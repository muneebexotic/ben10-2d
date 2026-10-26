/**
 * Swimming (Act 3). Every form swims its own way: speeds are px/s, accelerations
 * px/s², times ms. A `heavy` form doesn't swim at all: it sinks and walks the
 * bottom with floaty jumps. `breathMs` is how long it lasts under water
 * (Infinity: it doesn't need air).
 */
export interface SwimStats {
  /** Top swimming speed (any direction). */
  speed: number;
  accel: number;
  /** How fast it slows when the stick is let go (px/s²). */
  drag: number;
  /** Drift when doing nothing (positive sinks, negative floats up, 0 hangs still). */
  sink: number;
  /** JUMP under water: a stroke upward (its speed), at most every `strokeMs`. */
  stroke: number;
  strokeMs: number;
  /** JUMP at the surface: out of the water at this speed. */
  jumpOut: number;
  breathMs: number;
  /** How much currents push it (0 not at all, 1 fully). */
  currentScale: number;
  /** Walks the bottom instead of swimming: gravity and run speed scale, and its fall speed cap. */
  heavy?: { gravityScale: number; runScale: number; maxFall: number };
  /** Swims in the water and mutagen of the older chapters too (everyone else is thrown back out). */
  anyWater?: boolean;
}

/** Human Ben: a decent swimmer who needs to come up for air. */
export const SWIM_BEN: SwimStats = { speed: 92, accel: 420, drag: 300, sink: 22, stroke: 120, strokeMs: 320, jumpOut: 300, breathMs: 10_000, currentScale: 1 };

export const SWIM = {
  ben: SWIM_BEN,
  /** Hates it: slow, in a cloud of steam. */
  heatblast: { speed: 64, accel: 300, drag: 260, sink: 30, stroke: 100, strokeMs: 380, jumpOut: 300, breathMs: 9_000, currentScale: 1.1 },
  /** Sinks like the boulder he is and strides along the bottom. */
  fourarms: { speed: 0, accel: 0, drag: 0, sink: 0, stroke: 0, strokeMs: 0, jumpOut: 360, breathMs: 14_000, currentScale: 0.2, heavy: { gravityScale: 0.42, runScale: 0.72, maxFall: 130 } },
  /** Quick in water too. */
  xlr8: { speed: 150, accel: 700, drag: 420, sink: 18, stroke: 140, strokeMs: 260, jumpOut: 340, breathMs: 11_000, currentScale: 0.8 },
  /** Dog-paddles. */
  wildmutt: { speed: 96, accel: 440, drag: 320, sink: 14, stroke: 130, strokeMs: 300, jumpOut: 330, breathMs: 12_000, currentScale: 0.9 },
  /** Soaked wings: a slow paddle. */
  stinkfly: { speed: 70, accel: 320, drag: 280, sink: 26, stroke: 110, strokeMs: 340, jumpOut: 320, breathMs: 9_000, currentScale: 1.1 },
  /** Liquid metal: sinks slowly, no air needed. */
  upgrade: { speed: 82, accel: 360, drag: 300, sink: 34, stroke: 110, strokeMs: 340, jumpOut: 300, breathMs: Infinity, currentScale: 0.9 },
  /** Crystal sinks; no air needed. */
  diamondhead: { speed: 0, accel: 0, drag: 0, sink: 0, stroke: 0, strokeMs: 0, jumpOut: 340, breathMs: Infinity, currentScale: 0.25, heavy: { gravityScale: 0.45, runScale: 0.75, maxFall: 140 } },
  /** Drifts as if the water weren't there. */
  ghostfreak: { speed: 110, accel: 600, drag: 500, sink: 0, stroke: 120, strokeMs: 200, jumpOut: 320, breathMs: Infinity, currentScale: 0.3 },
  /** Small and slow. */
  greymatter: { speed: 66, accel: 380, drag: 300, sink: 16, stroke: 120, strokeMs: 300, jumpOut: 360, breathMs: 9_000, currentScale: 1.3 },
  /** A torpedo: the fastest thing in the game, in any direction, with momentum. */
  ripjaws: { speed: 260, accel: 900, drag: 360, sink: 0, stroke: 160, strokeMs: 160, jumpOut: 400, breathMs: Infinity, currentScale: 0.35, anyWater: true },
} as const satisfies Record<string, SwimStats>;

export const SWIM_FEEL = {
  /** Entering water keeps this much of the fall speed (a splash, not a stop). */
  entryKeep: 0.35,
  /** How far the head may sit above the surface while floating (a fraction of the body's height). */
  floatAbove: 0.42,
  /** The body counts as in the water once its centre is this far under the surface (px), and out again this far above. */
  enterDepth: 2,
  exitAbove: 3,
  /** Bubbles trail a swimmer every this many ms. */
  bubbleEveryMs: 260,
} as const;

/** Breath under water (forms that need air). */
export const BREATH = {
  /** Easy gives this much more air. */
  easyScale: 1.5,
  /** Refills from empty in this long, with the head above water or in an air pocket. */
  refillMs: 900,
  /** The ring goes red and the picture narrows under this fraction. */
  lowAt: 0.3,
  /** Out of air: a hit every this many ms. */
  damageEveryMs: 2000,
  damage: 1,
} as const;
