import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/** Four Arms: slow, heavy, unstoppable. Smash damage, shockwaves, and anything stunned gets thrown. */
export const FOURARMS_MOTOR: MotorStats = {
  runSpeed: 108,
  accelGround: 900,
  decelGround: 1500,
  accelAir: 650,
  decelAir: 500,
  // A big leaper, but heavy: he gets up high and comes down hard.
  jumpVelocity: 410,
  coyoteMs: 85,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.5,
};

export const FOURARMS_FEEL: FormFeel = {
  stepMs: 330,
  stepVolume: 0.5,
  jumpPitch: 0.6,
  /** Super armour: hits barely move him. */
  knockbackScale: 0.25,
  stunScale: 0.35,
  gravityScale: 1.12,
  emissive: false,
};

export const FOURARMS = {
  /** Tanky: the biggest shield of any alien. */
  maxFormHealth: 9,
  light: { radius: 104, color: 0xffb08a, intensity: 0.95 },
  /** Two quick heavy punches, then a four-fisted haymaker that knocks drones out of the sky. */
  punch: {
    damage: 3,
    reach: 30,
    height: 26,
    startupMs: 95,
    activeMs: 80,
    recoverMs: 150,
    knockback: 280,
    hitStopMs: 85,
    lunge: 60,
    moveMultiplier: 0.35,
    bufferMs: 220,
    /** The chain resets if the next punch doesn't come within this long. */
    chainWindowMs: 450,
  },
  haymaker: {
    damage: 5,
    reach: 36,
    height: 32,
    startupMs: 170,
    activeMs: 90,
    recoverMs: 300,
    knockback: 460,
    stunMs: 1400,
    hitStopMs: 130,
  },
  /** Up + J: claps all four hands overhead. Anti-air, erases shots, knocks drones down. */
  clap: {
    damage: 2,
    radius: 72,
    offsetY: -34,
    startupMs: 120,
    recoverMs: 240,
    cooldownMs: 650,
    stunMs: 1500,
    knockback: 240,
    hitStopMs: 90,
  },
  /** K on the ground: pounds the floor; a blast at his feet plus a shockwave each way. */
  slam: {
    startupMs: 210,
    recoverMs: 300,
    cooldownMs: 850,
    damage: 4,
    radius: 56,
    stunMs: 1500,
    knockback: 300,
    hitStopMs: 120,
    wave: { speed: 250, lifeMs: 650, damage: 3, knockback: 220, stunMs: 1200 },
  },
  /** K in the air: plunges; the higher the drop, the bigger the impact. */
  meteor: {
    speed: 640,
    minDamage: 4,
    maxDamage: 7,
    minRadius: 56,
    maxRadius: 86,
    /** Falling this far (px) gives the full-power impact. */
    fullPowerDrop: 150,
    waveLifeMs: 850,
  },
  /** Landing hard on his own still cracks the ground and jolts nearby enemies. */
  landing: { impact: 0.78, damage: 1, radius: 30 },
  grab: { reach: 28, height: 30, liftMs: 170, carryMultiplier: 0.8, overhead: 36 },
  throw: { vx: 430, vy: -170, upVx: 170, upVy: -470, damage: 6, splash: 34, stunMs: 1300, knockback: 380 },
  /** Every footstep nudges the camera. */
  stepShake: 0.0018,
} as const;
