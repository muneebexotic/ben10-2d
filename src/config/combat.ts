/** Shared combat tuning: projectiles, ground shockwaves and thrown objects. */
export const COMBAT = {
  /** Knockback for shots that don't set their own (reflected lasers). */
  defaultKnockback: 130,
  /** Half-height of a ground shockwave. */
  waveRadius: 7,
  /** Thrown objects: gravity, tumble speed, how close counts as a hit, and when they give up. */
  throwGravity: 900,
  throwSpinRadPerSec: 9,
  thrownHitRadius: 12,
  throwMaxMs: 2600,
  /** A throw keeps this much of its speed after bowling over each enemy. */
  bowlingSlowdown: 0.82,
  /** STRIKE!: a throw that bowls over at least this many enemies. */
  strikeHits: 2,
} as const;
