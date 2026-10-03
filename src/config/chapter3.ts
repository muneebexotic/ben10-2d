/** Timings for Chapter 3's scripted moments (real milliseconds). */
export const MUSEUM_INTRO = {
  bannerAt: 400,
  linesAt: 1500,
  /** The guard bursts out of the staff door during the conversation's last lines. */
  guardRunMs: 2200,
  ratDelayMs: 500,
  fadeMs: 400,
} as const;

/** Dr. Animo's entrance in the Great Hall. */
export const VILLAIN_INTRO = {
  /** The lights dip and the crown's gem flares before he speaks. */
  appearMs: 900,
  /** After his last line: the zap that brings the exhibits to life. */
  zapMs: 700,
  /** A giant bat carries him off. */
  exitMs: 1600,
  /** Mutants he unleashes wait this long before they attack. */
  spawnGraceMs: 1400,
} as const;

/** The Night Gallery's power cut and Wildmutt's arrival. */
export const BLACKOUT = {
  /** Animo's voice over the PA, then lights clunk off one by one. */
  clunkEveryMs: 260,
  clunks: 4,
  /** Darkness settles this long before the watch reacts. */
  darkHoldMs: 1100,
  /** After the transformation: the first huge sense pulse. */
  pulseAt: 300,
} as const;

/** The atrium bridge collapsing and Stinkfly's arrival mid-fall. */
export const ATRIUM = {
  rumbleMs: 650,
  /** Ben drops this long before the watch catches him in mid-air. */
  fallMs: 260,
  /** Held in the air after the transformation until the player flaps (or this long). */
  flapWaitMs: 6000,
  /** Debris tiles tumble down for this long. */
  debrisMs: 1400,
} as const;
