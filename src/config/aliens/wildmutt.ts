import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/** Wildmutt: no eyes, all senses. Climbs walls, pounces, and sniffs out what nobody else can see. */
export const WILDMUTT_MOTOR: MotorStats = {
  runSpeed: 172,
  accelGround: 1900,
  decelGround: 2100,
  accelAir: 1250,
  decelAir: 700,
  jumpVelocity: 396,
  coyoteMs: 105,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.45,
};

export const WILDMUTT_FEEL: FormFeel = {
  stepMs: 150,
  stepVolume: 0.7,
  jumpPitch: 0.9,
  knockbackScale: 0.85,
  stunScale: 0.85,
  gravityScale: 1,
  emissive: false,
  // He has no eyes: the world's light means nothing to him. What he senses stands out instead.
  vision: { ambientScale: 0.62, light: { radius: 190, color: 0xffc890, intensity: 0.5 } },
};

export const WILDMUTT = {
  maxFormHealth: 6,
  /** Claws: hold J for a chain of swipes; every third is a double rake that knocks back. */
  claw: {
    damage: 1.5,
    finisherDamage: 3,
    chain: 3,
    intervalMs: 150,
    finisherRecoverMs: 260,
    bufferMs: 180,
    reach: 24,
    height: 22,
    knockback: 120,
    finisherKnockback: 300,
    lunge: 70,
    hitStopMs: 32,
    finisherHitStopMs: 75,
    moveMultiplier: 0.6,
    resetMs: 380,
  },
  /** K: a long leap that rakes through whatever it passes. Landing on an enemy from above is a POUNCE. */
  pounce: {
    vx: 300,
    vy: 262,
    /** Up + K: a high pounce. */
    upVx: 150,
    upVy: 470,
    cooldownMs: 420,
    damage: 3,
    /** Coming down on an enemy: big damage, a stun and a bounce off its back. */
    landDamage: 6,
    landStunMs: 1200,
    bounceVy: 300,
    knockback: 200,
    hitStopMs: 95,
    area: { width: 26, height: 26 },
    /** The pounce ends after this long even without landing (it falls normally after). */
    maxMs: 900,
  },
  /** Walls: push into one to grab it; climb toward it, slide down, leap off. */
  climb: {
    upSpeed: 128,
    slideSpeed: 165,
    /** Hanging on without pushing: a slow slip. */
    gripSlide: 22,
    /** Leaping off: away from the wall and up. */
    leapVx: 230,
    leapVy: 390,
    /** Can't grab the same wall again for a moment after leaping off it. */
    regrabMs: 220,
    /** Pulling up over the top of a wall. */
    vaultVx: 120,
    vaultVy: 300,
  },
  /** Senses: how far he picks up hidden things, and a pulse that ripples out to that range. */
  senses: {
    radius: 172,
    pulseEveryMs: 1350,
    pulseMs: 760,
    /** Swapping in (or the discovery) sends one huge pulse out. */
    burstRadius: 320,
    burstMs: 900,
  },
  /** Swap-in: lands with a roar that stuns everything close. */
  roar: { radius: 72, damage: 2, stunMs: 900, knockback: 260 },
  light: { color: 0xffb070 },
} as const;
