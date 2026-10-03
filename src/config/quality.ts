/** Frame-rate governor: drops particle density on slow devices so the game stays smooth. */
export const QUALITY = {
  /** Particle multipliers for each quality level, best first. */
  particleLevels: [1, 0.6, 0.35] as readonly number[],
  /** Averaging window: 1 s answers a sudden heavy moment (a boss blowing up) while it is still on screen. */
  windowMs: 1000,
  /** Average FPS below this over a window steps quality down. */
  downgradeFps: 50,
  /** Average FPS above this for `upgradeAfterMs` steps quality back up. */
  upgradeFps: 58,
  upgradeAfterMs: 10_000,
  /** Ignore the first moments of a scene (shader warm-up) and frames longer than this (tab switches). */
  warmupMs: 1500,
  maxSampleMs: 250,
} as const;
