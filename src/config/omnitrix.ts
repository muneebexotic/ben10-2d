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
