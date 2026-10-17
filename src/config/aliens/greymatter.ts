import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';
import { PALETTE } from '../palette';

/** Grey Matter: a Galvan, the size of a hamster and the smartest thing in the room. Quick, springy, fragile. */
export const GREYMATTER_MOTOR: MotorStats = {
  runSpeed: 150,
  accelGround: 2100,
  decelGround: 2400,
  accelAir: 1400,
  decelAir: 800,
  // He jumps very high for his size (about five tiles).
  jumpVelocity: 430,
  coyoteMs: 110,
  jumpBufferMs: 140,
  jumpCutMultiplier: 0.42,
};

export const GREYMATTER_FEEL: FormFeel = {
  stepMs: 110,
  stepVolume: 0.45,
  jumpPitch: 1.6,
  // Tiny: everything throws him around.
  knockbackScale: 1.3,
  stunScale: 1.15,
  gravityScale: 0.95,
  emissive: false,
};

export const GREYMATTER = {
  maxFormHealth: 3,
  /** His body: small enough for vents and gaps a tile high (the shared body is 10x22). */
  body: { width: 8, height: 10 },
  /** A big hit flattens him; shots are smaller than he is and often miss. */
  damageScale: { shot: 0.8, contact: 1.3 },
  /** J: a nip. Hold for a quick chain; every third is a hop-and-chomp. */
  bite: {
    damage: 0.9,
    finisherDamage: 1.8,
    chain: 3,
    intervalMs: 170,
    reach: 14,
    height: 12,
    knockback: 60,
    finisherKnockback: 140,
    finisherHop: -150,
    hitStopMs: 24,
    moveMultiplier: 0.7,
  },
  /**
   * K: ANALYZE. A scan cone ahead finds the nearest enemy (or boss) and marks
   * its weak point: every hit there does triple damage, from any alien, for a
   * few seconds. Analyse, then swap to the muscle.
   */
  analyze: {
    range: 230,
    height: 120,
    scanMs: 420,
    weakMs: 6500,
    multiplier: 3,
    cooldownMs: 1100,
    /** While scanning he's rooted (thinking takes focus). */
    rootMs: 260,
  },
  /** Swap-in: a quick read of everything nearby: short weak points on them all. */
  swapScan: { radius: 120, weakMs: 2600 },
  light: { radius: 34, color: PALETTE.greymatter, intensity: 0.45 },
} as const;
