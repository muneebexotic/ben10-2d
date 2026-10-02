import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/** Stinkfly: limited flight, slime that gums enemies up, and stink clouds that fire sets off. */
export const STINKFLY_MOTOR: MotorStats = {
  runSpeed: 158,
  accelGround: 1500,
  decelGround: 1700,
  accelAir: 1500,
  decelAir: 900,
  jumpVelocity: 356,
  coyoteMs: 110,
  jumpBufferMs: 140,
  jumpCutMultiplier: 0.5,
};

export const STINKFLY_FEEL: FormFeel = {
  stepMs: 110,
  stepVolume: 0.35,
  jumpPitch: 1.35,
  knockbackScale: 1.15,
  stunScale: 1,
  gravityScale: 0.92,
  emissive: false,
};

export const STINKFLY = {
  maxFormHealth: 5,
  /**
   * Wings: jump in the air (or hold jump after a jump) to fly. Flapping
   * drains stamina; the ground refills it. Out of stamina he can still glide.
   */
  flight: {
    /** Seconds of flapping on a full tank. */
    staminaSeconds: 1.9,
    /** Full refill on the ground takes this long (s). */
    refillSeconds: 0.75,
    /** Climbing while jump is held. */
    riseSpeed: 135,
    riseAccel: 900,
    /** Holding down while flying: a quick dive. */
    diveSpeed: 260,
    /** Not flapping and not diving: hover, sinking slowly. */
    hoverSink: 28,
    /** Out of stamina (or tired): wings spread, falling slowly. */
    glideMaxFall: 105,
    /** Hovering costs less than climbing. */
    hoverCost: 0.45,
    /** A burst of lift when flight starts. */
    takeoffVy: 210,
    /** Below this much stamina the wheel turns red and the wings stutter. */
    lowAt: 0.25,
  },
  /** J: slime globs from the eyestalks. They arc, slow whatever they hit, and three quick ones stick it. */
  slime: {
    damage: 1,
    speed: 330,
    gravity: 520,
    cooldownMs: 240,
    lifetimeMs: 1100,
    radius: 5,
    knockback: 60,
    slowMs: 2400,
    muzzleX: 12,
    muzzleY: -18,
    /** Aiming down while flying: a bombing run. */
    downDeg: 62,
    upDeg: 34,
    assistConeDeg: 26,
    assistRange: 300,
  },
  /** K: a stink cloud. Enemies inside choke (small damage, slowed); fire sets it off. */
  stink: {
    radius: 36,
    lifeMs: 3600,
    tickDamage: 0.5,
    tickSlowMs: 700,
    cooldownMs: 1300,
    /** Dropped a little behind and below him. */
    offsetX: -10,
    offsetY: -6,
    /** Venting a cloud in mid-air kicks him up a little. */
    recoilVy: 120,
  },
  /** Swap-in: a ring of slime sprayed all around. */
  spray: { count: 8, speed: 260, damage: 1, slowMs: 2600 },
  light: { color: 0xd4e83a },
} as const;
