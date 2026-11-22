import { RICOCHET } from '../../config/aliens/ricochet';

const R = RICOCHET.roll;

/**
 * Ricochet's roll as plain numbers (unit tested): how the ball's speed builds,
 * holds and bleeds away, what a wall does to it, and how a landing bounces.
 * Speeds are signed px/s along x (positive: right).
 */

/** One frame of rolling speed. `move` is the stick (-1, 0, 1). */
export function stepRollSpeed(v: number, move: -1 | 0 | 1, grounded: boolean, dtMs: number): number {
  const dt = dtMs / 1000;
  const speed = Math.abs(v);
  const dir = Math.sign(v);
  if (!grounded) {
    // A little steering in the air, no friction.
    if (move !== 0) v += move * R.airAccel * dt;
  } else if (move !== 0 && (dir === 0 || move === dir)) {
    // Pushing the way it rolls: speed builds slowly, up to the top speed.
    if (speed < R.maxSpeed) v = dir === 0 ? move * Math.min(R.maxSpeed, R.accel * dt) : dir * Math.min(R.maxSpeed, speed + R.accel * dt);
  } else if (move !== 0) {
    // Pushing against it: brakes, then rolls back the other way.
    v += move * R.brake * dt;
  } else {
    // Nothing held: it keeps rolling, slowing only a little.
    const next = speed - R.friction * dt;
    v = next <= 0 ? 0 : dir * next;
  }
  // Past the top speed (a boost, a bumper, a ramp), it bleeds back down.
  const s = Math.abs(v);
  if (s > R.maxSpeed) v = Math.sign(v) * Math.max(R.maxSpeed, s - R.overspeedDecay * dt);
  return clampSpeed(v);
}

export function clampSpeed(v: number): number {
  return Math.max(-R.capSpeed, Math.min(R.capSpeed, v));
}

/** Into a wall at speed `v`: the speed it leaves with (0 when it just stops against it). */
export function ricochetOff(v: number): number {
  return Math.abs(v) >= R.ricochetMin ? -v * R.restitution : 0;
}

/** Damage a roll at `speed` does to what it hits, or 0 below the speed that hurts. */
export function rollDamage(speed: number): number {
  const s = Math.abs(speed);
  if (s < R.hurtSpeed) return 0;
  return Math.round((R.damageMin + ((s - R.hurtSpeed) / 100) * R.damagePer100) * 2) / 2;
}

/** Whether a roll at `speed` smashes (cracked walls, break-away walls). */
export function rollSmashes(speed: number): boolean {
  return Math.abs(speed) >= R.smashSpeed;
}

/**
 * Landing while curled: the bounce (an upward speed, px/s, negative is up) and the new perfect-bounce chain.
 * `fallSpeed` is how fast he came down; `perfect` is Jump pressed inside the window around the landing.
 */
export function landingBounce(fallSpeed: number, perfect: boolean, chain: number): { vy: number; chain: number } {
  if (perfect) {
    const next = Math.min(R.perfectChainMax, chain + 1);
    return { vy: -(R.bounceJump + next * R.perfectStep), chain: next };
  }
  if (fallSpeed >= R.landBounceMin) return { vy: -fallSpeed * R.landRestitution, chain: 0 };
  return { vy: 0, chain: 0 };
}

/** SHELL DROP's smash damage from how far he fell (its speed at the bottom). */
export function dropDamage(fallSpeed: number, maxFall: number): number {
  const D = RICOCHET.drop;
  const k = Math.max(0, Math.min(1, fallSpeed / maxFall));
  return Math.round((D.damageMin + (D.damageMax - D.damageMin) * k) * 2) / 2;
}

/** How fast the roll animation plays (1 at rest, `spinRate` at top speed). */
export function spinRate(speed: number): number {
  return 1 + (R.spinRate - 1) * Math.min(1.4, Math.abs(speed) / R.maxSpeed);
}
