import type { MotorStats } from '../systems/PlatformerMotor';

/** Numbers shared by every form Ben can take. */
export const PLAYER = {
  body: { width: 10, height: 22 },
  maxHealth: 5,
  hurtInvulnMs: 1100,
  hurtKnockback: { x: 170, y: -210 },
  hurtStunMs: 260,
  fallGravityMultiplier: 1.5,
  apexGravityMultiplier: 0.55,
  apexThreshold: 45,
  maxFallSpeed: 440,
  pitDamage: 1,
  pitRespawnInvulnMs: 1200,
  dropThroughMs: 220,
  transformInvulnMs: 900,
  revertInvulnMs: 1300,
  lightRadiusWithWatch: 92,
  lightRadiusNoWatch: 64,
  safeGroundEveryMs: 200,
} as const;

export const HUMAN_MOTOR: MotorStats = {
  runSpeed: 132,
  accelGround: 1500,
  decelGround: 2000,
  accelAir: 1000,
  decelAir: 600,
  jumpVelocity: 372,
  coyoteMs: 95,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.42,
};

export const HUMAN_COMBAT = {
  punch: {
    damage: 1,
    reach: 20,
    height: 18,
    startupMs: 30,
    activeMs: 100,
    cooldownMs: 270,
    knockback: 170,
    lunge: 70,
    parrySpeedMultiplier: 1.8,
    parryDamage: 2,
  },
  roll: {
    speed: 250,
    durationMs: 320,
    cooldownMs: 560,
  },
} as const;
