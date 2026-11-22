import type { FormFeel } from '../../aliens/types';
import type { MotorStats } from '../../systems/PlatformerMotor';

/**
 * Ricochet (Chapter 8, an original alien): a stocky armoured creature with a
 * round back of copper shell plates who curls into a perfect ball. Walking
 * he's slow and solid; curled up he rolls, builds speed, keeps it, bounces
 * off walls and springs back up off the floor.
 */
export const RICOCHET_MOTOR: MotorStats = {
  // On his feet: short legs, a heavy shell. Slow to get going, hard to knock over.
  runSpeed: 100,
  accelGround: 900,
  decelGround: 1500,
  accelAir: 620,
  decelAir: 480,
  jumpVelocity: 350,
  coyoteMs: 85,
  jumpBufferMs: 130,
  jumpCutMultiplier: 0.5,
};

export const RICOCHET_FEEL: FormFeel = {
  stepMs: 320,
  stepVolume: 0.6,
  jumpPitch: 0.7,
  knockbackScale: 0.3,
  stunScale: 0.4,
  gravityScale: 1.08,
  emissive: false,
};

export const RICOCHET = {
  maxFormHealth: 8,
  /** J on his feet: forearm-shell bashes (hold for a chain); every third is a full-body SHELL SLAM. */
  bash: {
    damage: 2,
    slamDamage: 4,
    chain: 3,
    intervalMs: 240,
    reach: 22,
    height: 22,
    knockback: 170,
    slamKnockback: 320,
    slamStunMs: 700,
    hitStopMs: 45,
    slamHitStopMs: 90,
    /** He shoves forward a little with each bash, more with the slam. */
    lunge: 60,
    slamLunge: 140,
  },
  /** K: curl into a ball and roll (K again uncurls). */
  roll: {
    /** Speed built per second holding a direction (slow to build: momentum). */
    accel: 300,
    /** Top speed from rolling alone (boosts, ramps and bumpers can push past it for a while). */
    maxSpeed: 330,
    /** Hard cap on any speed (boosts, bumpers, kickers). */
    capSpeed: 480,
    /** Over the top speed, it bleeds back down this fast (px/s each second). */
    overspeedDecay: 160,
    /** Rolling on with nothing held: a ball keeps going (px/s each second). */
    friction: 55,
    /** Pushing against the roll brakes it (still takes a moment to turn around). */
    brake: 520,
    /** In the air he steers a little. */
    airAccel: 160,
    /** Curling up carries his speed and adds a push ahead. */
    curlKick: 80,
    /** Fast enough and he hurts what he rolls into (damage grows with speed). */
    hurtSpeed: 140,
    damageMin: 1.5,
    damagePer100: 1.6,
    knockback: 300,
    /** Fast enough and the hit is a smash: cracked walls, break-away walls. */
    smashSpeed: 220,
    /** A hit he doesn't bowl through bounces him back (most of the speed goes). */
    bounceOffKeep: 0.45,
    /** Each target can be hit again after this long (rolling through a tough one). */
    rehitMs: 320,
    /** A brief guard after a hit at speed (his shell took it). */
    guardMs: 260,
    hitStopMs: 40,
    /** Into a wall at least this fast he ricochets off it: BONK. */
    ricochetMin: 110,
    /** The speed he keeps off a wall. */
    restitution: 0.78,
    /** Ricochets this hard shake the screen and say BONK! */
    bonkSpeed: 220,
    /** Jump while rolling: a bounce, higher than a jump. */
    bounceJump: 420,
    /** Landing from a fall this fast, he bounces back up on his own. */
    landBounceMin: 230,
    /** ...with this share of his fall speed. */
    landRestitution: 0.45,
    /**
     * PERFECT BOUNCE: Jump pressed this close to landing (just before or just after)
     * springs him up higher, more each time in a row (three is the top).
     */
    perfectWindowMs: 110,
    perfectStep: 55,
    perfectChainMax: 3,
    /** Uncurling keeps this share of his speed (his feet take it from there). */
    uncurlKeep: 0.55,
    /** K twice this close together does nothing (no flicker between curled and not). */
    toggleMs: 220,
    /** A landing counts for a perfect bounce only coming down at least this fast (a real drop, not a step). */
    perfectMinFall: 150,
    /** A bounce still works this long after rolling off a ledge. */
    coyoteMs: 90,
    /** Curled up, gravity is this (no floaty jump curve: a ball's bounces are the same every time). */
    gravity: 1.12,
    /** Controls held off this long (a cutscene) and he uncurls, so the story can walk him. */
    uncurlAfterHeldMs: 600,
    /** Animation speed: the spin turns this many times faster at top speed than at rest. */
    spinRate: 2.6,
  },
  /** J while rolling: SPIN BOOST, a burst of speed in the way he's facing. */
  boost: { add: 170, cooldownMs: 750, minSpeed: 120 },
  /** Down in the air while rolling: SHELL DROP, straight down, smashing what's under him. */
  drop: { speed: 560, radius: 26, damageMin: 3, damageMax: 6.5, knockback: 260, stunMs: 600, hitStopMs: 80, bounce: 300 },
  /** Swap-in: he arrives already curled at full speed, bowling through what's in front. */
  swapIn: { speed: 380, radius: 34, damage: 2.5, knockback: 360, stunMs: 500 },
  /** His seams glow faintly. */
  light: { radius: 54, color: 0x6ae8d0, intensity: 0.55 },
} as const;
