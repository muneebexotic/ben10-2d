import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';
import { PALETTE } from '../palette';

/** Upgrade: living nanotech. An eye laser, and he merges with machines (or takes them over). */
export const UPGRADE_MOTOR: MotorStats = {
  runSpeed: 150,
  accelGround: 1700,
  decelGround: 2000,
  accelAir: 1150,
  decelAir: 650,
  jumpVelocity: 380,
  coyoteMs: 100,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.44,
};

export const UPGRADE_FEEL: FormFeel = {
  stepMs: 210,
  stepVolume: 0.55,
  jumpPitch: 1.25,
  knockbackScale: 0.9,
  stunScale: 0.9,
  gravityScale: 0.95,
  emissive: false,
};

export const UPGRADE = {
  maxFormHealth: 5,
  /** J: an instant beam from his eye. Hold to keep firing; every fourth is a triple beam. */
  laser: {
    damage: 1.4,
    tripleDamage: 1.8,
    tripleEvery: 4,
    /** The triple beam's outer beams sit this far above and below the middle one. */
    tripleSpread: 6,
    intervalMs: 210,
    range: 156,
    /** Hit boxes along the beam are this many px apart (and this big). */
    step: 10,
    knockback: 90,
    hitStopMs: 22,
    beamMs: 110,
    moveMultiplier: 0.75,
    /** Up aims up and forward; Down in the air aims down and forward. */
    diagonal: Math.PI / 4,
  },
  /** K: he melts into a puddle that slides along the floor, merging with the first machine it reaches. */
  merge: {
    speed: 360,
    durationMs: 300,
    cooldownMs: 520,
    area: { width: 22, height: 16 },
    /** Anything the puddle washes through takes a little. */
    glideDamage: 1.5,
    glideKnockback: 160,
    /** Popping back out of a machine (or a taken-over robot). */
    popVy: 300,
    popVx: 70,
    /** Merging in this long ago or more before K ejects (the press that merged doesn't). */
    ejectAfterMs: 220,
  },
  /** Swap-in: a splash of nanites that shorts out machines nearby. */
  emp: { radius: 92, damage: 1.5, stunMs: 1600, knockback: 140 },
  /** He glows a little: a dark body would vanish in the subway. */
  light: { radius: 44, color: PALETTE.upgrade, intensity: 0.55 },
} as const;
