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
  /** Stink clouds (Stinkfly): how often they hit what's inside, and the blast when fire sets one off. */
  gas: {
    tickMs: 420,
    puffEveryMs: 110,
    ignite: { damage: 9, radiusScale: 1.45, knockback: 360 },
  },
  /**
   * Slime on enemies: each glob slows them for its `slowMs`; this many globs
   * inside `stackWindowMs` stick them in place. Short whiffs of gas only slow
   * (they're under `stackMinMs`).
   */
  slime: {
    slowFactor: 0.45,
    stickAt: 3,
    stackWindowMs: 2600,
    stackMinMs: 1000,
    stuckMs: 1700,
    stuckFactor: 0.05,
  },
  /** Upgrade's nanotech against machines: tech hits do extra to anything that isn't alive. */
  techVsMachine: 1.5,
  /**
   * A takeover: Upgrade pours into a machine enemy, it shakes with green
   * circuitry for `overloadMs`, then blows up and hits everything around it.
   */
  hack: { overloadMs: 650, blastRadius: 66, blastDamage: 6, blastKnockback: 320, blastStunMs: 900 },
} as const;
