import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/** Heatblast: ranged fire, a charged burst and the rocket jump. */
export const HEATBLAST_MOTOR: MotorStats = {
  runSpeed: 150,
  accelGround: 1700,
  decelGround: 2100,
  accelAir: 1150,
  decelAir: 700,
  jumpVelocity: 392,
  coyoteMs: 95,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.45,
};

export const HEATBLAST_FEEL: FormFeel = {
  stepMs: 230,
  stepVolume: 1.4,
  jumpPitch: 0.8,
  knockbackScale: 1,
  stunScale: 1,
  gravityScale: 1,
  emissive: true,
};

export const HEATBLAST = {
  maxFormHealth: 6,
  lightRadius: 150,
  lightColor: 0xffb060,
  fireball: {
    damage: 2,
    speed: 390,
    cooldownMs: 165,
    lifetimeMs: 880,
    radius: 5,
    knockback: 130,
    muzzleX: 12,
    muzzleY: -5,
    recoil: 26,
    spreadDeg: 2.5,
    assistConeDeg: 34,
    assistRange: 340,
  },
  burst: {
    minChargeMs: 120,
    fullChargeMs: 850,
    minRadius: 42,
    maxRadius: 88,
    minDamage: 3,
    maxDamage: 8,
    knockback: 330,
    moveMultiplier: 0.45,
    cooldownMs: 520,
    fullChargeHop: 150,
  },
  rocketJump: {
    velocity: 470,
    horizontalBoost: 70,
    blastRadius: 30,
    blastDamage: 2,
    glideMaxFall: 140,
  },
  /** Landing this hard (fraction of max fall speed) throws embers and shakes the camera. */
  hardLandingImpact: 0.8,
  /** Swap-in entrance: a ring of fire around Heatblast as he arrives. */
  flameNova: {
    radius: 64,
    damage: 3,
    knockback: 300,
  },
} as const;
