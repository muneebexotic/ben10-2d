export const AUDIO = {
  masterVolume: 0.8,
  sfxVolume: 0.55,
  musicVolume: 0.32,
  /** The music's share of its volume while the pause menu is open. */
  pauseDuck: 0.3,
  /** Settings' MUSIC and EFFECTS sliders: steps of this much (0 to 1, multiplying the volumes above). */
  volumeStep: 0.1,
  musicFadeMs: 700,
  sfxMinIntervalMs: 28,
  /** Music more than this far behind (timers stalled: a long frame, a throttled tab) skips the missed steps instead of playing them all at once. */
  musicMaxLagS: 0.25,
} as const;
