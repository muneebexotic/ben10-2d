import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';
import { PALETTE } from '../palette';

/** Diamondhead: living crystal. Shards, a reflecting shield, and platforms he grows out of thin air. */
export const DIAMONDHEAD_MOTOR: MotorStats = {
  runSpeed: 138,
  accelGround: 1500,
  decelGround: 2000,
  accelAir: 1000,
  decelAir: 620,
  jumpVelocity: 372,
  coyoteMs: 95,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.45,
};

export const DIAMONDHEAD_FEEL: FormFeel = {
  stepMs: 250,
  stepVolume: 1.1,
  jumpPitch: 0.9,
  // Solid crystal: hard to push around.
  knockbackScale: 0.55,
  stunScale: 0.7,
  gravityScale: 1.05,
  emissive: false,
};

export const DIAMONDHEAD = {
  maxFormHealth: 7,
  /**
   * Lasers, bolts and missiles glance off crystal; a heavy blow (a claw, a
   * body slam) cracks it. Scales the damage his shield takes by source.
   */
  damageScale: { shot: 0.5, contact: 1.4 },
  /** J: crystal shards. Hold to keep firing; every third volley is a fan of three. */
  shard: {
    damage: 1.3,
    speed: 430,
    cooldownMs: 210,
    lifetimeMs: 640,
    radius: 4,
    knockback: 110,
    muzzleX: 13,
    muzzleY: -22,
    fanEvery: 3,
    fanDeg: 11,
    assistConeDeg: 26,
    assistRange: 300,
    /** Up aims high. */
    upDeg: 34,
  },
  /** Hold K: a crystal shield in front that turns shots (and laser beams) around. Up/Down tilt it. */
  shield: {
    moveMultiplier: 0.3,
    /** The reflecting face, in front of him (px). */
    area: { width: 20, height: 40, ahead: 6 },
    reflectSpeed: 1.45,
    reflectDamage: 3,
    /** Up or Down while holding tilts the face this far. */
    tiltDeg: 40,
    /** It cracks after holding this long, then needs a moment. */
    maxHoldMs: 4200,
    cooldownMs: 650,
  },
  /** Up+K: a crystal platform grows where he aims (two at a time; each shatters after a while). */
  platform: {
    max: 2,
    widthPx: 48,
    lifeMs: 6500,
    /** It flickers this long before it shatters. */
    warnMs: 1300,
    /** On the ground: this far ahead, level with his feet (a bridge). In the air: right under his feet. */
    aheadPx: 52,
    cooldownMs: 380,
  },
  /** Swap-in: crystal spikes burst out of the ground around him. */
  spikes: { radius: 74, damage: 3, knockback: 260, stunMs: 500 },
  /** Shards from crystal sentries feed him instead of hurting him. */
  absorb: { shield: 0.5, timeMs: 400 },
  light: { radius: 52, color: PALETTE.diamondhead, intensity: 0.5 },
} as const;
