export const AUDIO = {
  masterVolume: 0.8,
  sfxVolume: 0.55,
  musicVolume: 0.32,
  musicFadeMs: 700,
  sfxMinIntervalMs: 28,
  /** Music more than this far behind (timers stalled: a long frame, a throttled tab) skips the missed steps instead of playing them all at once. */
  musicMaxLagS: 0.25,
} as const;
