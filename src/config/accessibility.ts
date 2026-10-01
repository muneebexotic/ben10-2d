export const ACCESSIBILITY = {
  /** Shortest on/off phase of any blink with Reduce Flashing on: at most 2.5 flashes per second (WCAG allows 3). */
  minBlinkHalfPeriodMs: 200,
  /** Peak opacity and minimum length of a full-screen flash with Reduce Flashing on. */
  reducedFlashAlpha: 0.2,
  reducedFlashMinMs: 360,
  /** Screen shake used when the OS asks for reduced motion and the player has not chosen one. */
  reducedMotionShake: 0,
  /** Slider step for the screen shake setting. */
  shakeStep: 0.1,
  /** Slow, gentle alarm pulse used instead of the strobing boss-arena alarm. */
  reducedAlarmPeriodMs: 2400,
  reducedAlarmMix: 0.55,
} as const;
