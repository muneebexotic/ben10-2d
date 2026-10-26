import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/**
 * Ripjaws: a Piscciss Volann. King of the deep, a fish out of water: in water
 * the fastest thing in the game; on land he hops on his tail, slow and
 * floppy, and the Omnitrix runs down fast.
 */
export const RIPJAWS_MOTOR: MotorStats = {
  // Hopping on his tail: slow, springy, a bit floppy in the air.
  runSpeed: 92,
  accelGround: 620,
  decelGround: 1100,
  accelAir: 520,
  decelAir: 380,
  jumpVelocity: 330,
  coyoteMs: 90,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.5,
};

export const RIPJAWS_FEEL: FormFeel = {
  // Each hop thuds down on his tail.
  stepMs: 380,
  stepVolume: 0.55,
  jumpPitch: 0.8,
  knockbackScale: 0.8,
  stunScale: 0.9,
  gravityScale: 1,
  emissive: false,
};

export const RIPJAWS = {
  maxFormHealth: 6,
  /** Out of water the timer runs this many times faster. */
  landDrain: 2.5,
  /** J: a snapping bite. Hold for a chain; every third is a lunging CHOMP (in water it carries him forward). */
  bite: {
    damage: 1.6,
    chompDamage: 3.6,
    chain: 3,
    intervalMs: 210,
    reach: 22,
    height: 22,
    knockback: 110,
    chompKnockback: 280,
    hitStopMs: 40,
    chompHitStopMs: 85,
    moveMultiplier: 0.55,
    /** The CHOMP's lunge: in water, and on land. */
    lungeWater: 260,
    lungeLand: 110,
  },
  /** K on land: the tail whip. A full spin that slaps everything round him and knocks shots back. */
  whip: {
    damage: 2.2,
    radius: 30,
    durationMs: 360,
    activeFromMs: 60,
    activeToMs: 300,
    cooldownMs: 600,
    knockback: 260,
    parrySpeed: 1.4,
    parryDamage: 2,
    hitStopMs: 50,
  },
  /** K in water: RIP DASH. A torpedo along the stick (or ahead) that bites through a line of enemies. */
  ripDash: {
    speed: 430,
    durationMs: 340,
    cooldownMs: 850,
    damage: 3.2,
    width: 26,
    height: 22,
    knockback: 320,
    hitStopMs: 55,
    /** He comes out of it still fast. */
    exitKeep: 0.55,
  },
  /** Swap-in: a burst of water out of nowhere that knocks everything round him back. */
  swapIn: { radius: 70, damage: 1.5, knockback: 380, stunMs: 500 },
  /** Out of water and standing still he gasps now and then ("NEED... WATER..."). */
  gasp: { afterMs: 1400, everyMs: 3600, forMs: 900 },
  /** His lure glows (more under water). */
  light: { radius: 46, color: 0x7ff0e0, intensity: 0.55, waterIntensity: 0.85 },
} as const;
