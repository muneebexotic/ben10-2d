import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/** XLR8: blinding speed. Flurries up close, dashes through enemies, runs across water. Fragile. */
export const XLR8_MOTOR: MotorStats = {
  runSpeed: 255,
  accelGround: 2600,
  decelGround: 2300,
  accelAir: 1700,
  decelAir: 900,
  jumpVelocity: 380,
  // Extra coyote time: at full speed he crosses small gaps before gravity notices.
  coyoteMs: 150,
  jumpBufferMs: 140,
  jumpCutMultiplier: 0.45,
};

export const XLR8_FEEL: FormFeel = {
  stepMs: 110,
  stepVolume: 0.6,
  jumpPitch: 1.3,
  knockbackScale: 1.15,
  stunScale: 0.8,
  gravityScale: 1,
  emissive: false,
};

export const XLR8 = {
  /** Fragile: he is meant to avoid hits, not take them. */
  maxFormHealth: 4,
  light: { radius: 110, color: 0x9fd8ff, intensity: 1 },
  strike: {
    damage: 1,
    /** Every `chain`th strike is a finishing kick. */
    chain: 6,
    finisherDamage: 2.5,
    intervalMs: 70,
    finisherRecoverMs: 240,
    bufferMs: 160,
    reach: 22,
    finisherReach: 28,
    height: 24,
    knockback: 60,
    finisherKnockback: 280,
    lunge: 46,
    hitStopMs: 16,
    finisherHitStopMs: 70,
    /** Ground speed while striking (fraction of run speed): still faster than most things. */
    moveMultiplier: 0.85,
    /** Striking in mid-air hangs XLR8 in place for a few hits. */
    airHoverFall: 40,
    airHoverMs: 110,
    airStrikes: 8,
    /** A pause this long ends the flurry and resets the kick count. */
    resetMs: 320,
  },
  dash: {
    speed: 640,
    durationMs: 160,
    invulnMs: 230,
    cooldownMs: 360,
    upAngleDeg: 32,
    /** Speed kept after the dash, as a fraction of run speed. */
    exitSpeed: 0.95,
    /** Everything the dash passed through gets cut this long after it ends. */
    damage: 3,
    knockback: 220,
    detonateDelayMs: 110,
    hitStopMs: 90,
    sweep: { width: 28, height: 40 },
  },
  /** Dodging a shot mid-dash: the world slows for a beat and the dash comes straight back. */
  tooSlow: {
    slowMoScale: 0.25,
    slowMoMs: 420,
  },
  waterRun: {
    /** Fraction of run speed needed to stay on top of the water. */
    minSpeedRatio: 0.55,
    /** How long he can dip below that speed before sinking. */
    graceMs: 220,
  },
  speedFx: {
    minSpeedRatio: 0.75,
    afterimageEveryMs: 34,
    afterimageLifeMs: 170,
    afterimageAlpha: 0.42,
    lineEveryMs: 45,
  },
} as const;
