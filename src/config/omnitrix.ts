/**
 * Perfect transform: hit T in a short window around the moment a drone fires
 * or attacks. Optional mastery, never required: the normal transform already
 * has invulnerability and a shockwave.
 */
export const PERFECT_TRANSFORM = {
  /** How early (before the shot or attack lands) a press still counts. */
  earlyMs: 140,
  /** How late (after it fired) a press still counts. */
  lateMs: 220,
  /** The attacker must be at most this far from Ben. */
  range: 260,
  /** Touch taps transform on release; up to this much of the tap's length is credited back. */
  touchLeadCapMs: 160,
  shockwaveRadius: 132,
  shockwaveDamage: 3,
  knockback: 520,
  /** Enemy shots inside the shockwave are turned around instead of erased. */
  reflectSpeedMultiplier: 1.7,
  reflectDamage: 3,
  slowMoScale: 0.18,
  slowMoMs: 560,
  hitStopMs: 110,
  /** Extra alien time as a reward. */
  bonusMs: 3000,
  /** Before this many transforms (with no perfect yet) a tip explains the mechanic. */
  tipAfterTransforms: 2,
} as const;

/**
 * Omnitrix swap: with a different alien on the dial, pressing transform while
 * transformed swaps straight into it. It costs alien time, so the timer and
 * cooldown still drive the loop; the payoff is that every alien arrives with an
 * entrance attack.
 */
export const SWAP = {
  enabled: true,
  /** Alien time the swap uses up. Not allowed with less than this left. */
  costMs: 3000,
  /** Minimum time between transform/swap and the next swap. */
  lockoutMs: 1200,
  invulnMs: 450,
  hitStopMs: 50,
  slowMoScale: 0.35,
  slowMoMs: 140,
  /** Swap input is ignored for this long afterwards (prevents double taps). */
  busyMs: 160,
  quipChance: 0.4,
} as const;

/**
 * Wrong transformations ("misfires"). The base chance comes from the
 * difficulty; these numbers shape the rules and the comedy beat.
 */
export const MISFIRE = {
  /** Swaps misfire at this fraction of the difficulty's chance (half: a swap is a deliberate combat move). */
  swapChanceScale: 0.5,
  /** After a misfire the Omnitrix "owes you one": the next swap costs this fraction and can't misfire. */
  fixCostScale: 0.5,
  /** Roll with it instead: the first KO as the misfired alien refunds this much alien time. */
  improviseBonusMs: 2000,
  /** Transform wind-up gets this much longer while the watch sputters (the tell). */
  glitchWindupMs: 260,
  /** The gag waits this long after the transformation burst (the flash clears and the wrong alien is standing there). */
  revealDelayMs: 300,
  swapRevealDelayMs: 110,
  /** The record-scratch freeze: real time, gameplay slowed to `freezeScale`. */
  freezeMs: 760,
  swapFreezeMs: 520,
  freezeScale: 0.05,
  releaseMs: 260,
  /** Comedic camera punch onto Ben's face (and a small dutch tilt, scaled by Screen Shake). */
  zoom: 2,
  swapZoom: 1.5,
  zoomInMs: 110,
  tiltDeg: -4,
  /** How far the freeze-frame fades to sepia (0..1). */
  sepia: 0.7,
  /** Music cuts out for this long after the scratch, then comes back with the new alien's layer. */
  musicGapMs: 650,
  /** Ben is invulnerable through the beat plus this much. */
  invulnAfterMs: 500,
  lineMs: 2300,
  /** The WANTED / GOT card holds this long. */
  cardMs: 1900,
} as const;
