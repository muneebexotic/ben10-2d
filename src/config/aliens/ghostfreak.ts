import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';
import { PALETTE } from '../palette';

/** Ghostfreak: an Ectonurite. Floats, phases through walls, turns invisible, and doesn't quite want to leave. */
export const GHOSTFREAK_MOTOR: MotorStats = {
  runSpeed: 150,
  accelGround: 1300,
  decelGround: 1500,
  accelAir: 1100,
  decelAir: 500,
  jumpVelocity: 345,
  coyoteMs: 140,
  jumpBufferMs: 140,
  jumpCutMultiplier: 0.5,
};

export const GHOSTFREAK_FEEL: FormFeel = {
  // He drifts: barely any footsteps.
  stepMs: 400,
  stepVolume: 0.15,
  jumpPitch: 1.4,
  knockbackScale: 1.1,
  stunScale: 0.9,
  gravityScale: 0.75,
  emissive: true,
};

export const GHOSTFREAK = {
  maxFormHealth: 5,
  /** He sinks slowly: a ghost doesn't fall, it settles. */
  maxFallSpeed: 115,
  /** J: his chest tentacles lash out (hold to keep lashing; every third reaches further and drags). */
  lash: {
    damage: 1.7,
    range: 46,
    height: 18,
    cooldownMs: 260,
    knockback: 70,
    longEvery: 3,
    longRange: 66,
    longDamage: 2.4,
    /** The long lash pulls whatever it catches toward him (negative knockback). */
    pull: -170,
    hitStopMs: 26,
  },
  /** Hold K: phase. Intangible (walls, enemies, shots), can't attack; held still, he vanishes. */
  phase: {
    maxMs: 3600,
    cooldownMs: 900,
    /** Still for this long while phased: invisible, and enemies lose track. */
    vanishAfterMs: 420,
    /** Moving slower than this counts as still (px/s). */
    stillSpeed: 14,
    alpha: 0.5,
    vanishAlpha: 0.14,
    moveMultiplier: 0.85,
  },
  /** Swap-in: a scream that sends enemies fleeing. */
  scream: { radius: 120, fearMs: 1800, damage: 1, knockback: 60 },
  light: { radius: 40, color: PALETTE.ghostfreakEye, intensity: 0.4 },
  /** Something doesn't want to let go: at timeout, sometimes he holds on a moment. */
  hesitate: { chance: 0.4, minMs: 900, maxMs: 1900 },
  /** A whisper every so often while he's out. */
  whisperEveryMs: [7000, 13000] as const,
} as const;
