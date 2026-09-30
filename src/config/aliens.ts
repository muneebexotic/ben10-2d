import type { MotorStats } from '../systems/PlatformerMotor';

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
} as const;
