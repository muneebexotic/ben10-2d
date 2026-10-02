import { MUTANT_SHARED as M } from '../../../config/mutants';
import type { Drone, DroneWorld } from '../Drone';

/** What the ground under and ahead of a walking mutant looks like this frame. */
export interface Footing {
  grounded: boolean;
  /** A wall right in front (in the direction it's moving or facing). */
  wall: boolean;
  /** No floor a short step ahead. */
  ledge: boolean;
}

const footing: Footing = { grounded: false, wall: false, ledge: false };

export const faceOf = (d: Drone): 1 | -1 => ((d.memo.face ?? 1) >= 0 ? 1 : -1);

export function setFace(d: Drone, dir: number): void {
  if (dir !== 0) d.memo.face = dir > 0 ? 1 : -1;
}

/**
 * Gravity and collisions for mutants that walk. Drone moves the body after
 * the brain runs, so this sets velocities that land exactly on the floor and
 * stop dead at walls. Knockback's upward kick becomes a hop under gravity.
 */
export function walkPhysics(d: Drone, w: DroneWorld, dtMs: number): Footing {
  const dt = dtMs / 1000;
  const half = d.brain.body.height / 2;
  const halfW = d.brain.body.width / 2;
  if (d.ky !== 0) {
    d.vy += d.ky;
    d.ky = 0;
  }
  const feet = d.y + half;
  const ground = w.groundBelow(d.x, d.y - half + 1);
  footing.grounded = feet >= ground - 1 && d.vy >= 0;
  if (footing.grounded) {
    d.y = ground - half;
    d.vy = 0;
  } else {
    d.vy = Math.min(M.maxFall, d.vy + M.gravity * dt);
    if (d.vy > 0 && dt > 0 && feet + d.vy * dt > ground) d.vy = (ground - feet) / dt;
  }
  const moving = d.vx + d.kx;
  const dir = Math.abs(moving) > 1 ? Math.sign(moving) : faceOf(d);
  footing.wall = w.isSolid(d.x + dir * (halfW + 2), d.y) || w.isSolid(d.x + dir * (halfW + 2), d.y - half + 2);
  if (footing.wall) {
    if (Math.sign(d.vx) === dir) d.vx = 0;
    if (Math.sign(d.kx) === dir) d.kx = 0;
  }
  footing.ledge = footing.grounded && w.groundBelow(d.x + dir * (halfW + 4), d.y) > d.y + half + 20;
  // Into water or a pool of tar: gone.
  if (w.isWater(d.x, d.y + half + 2)) d.kill();
  return footing;
}

/** Ben is close enough, roughly level, and fair game. */
export function notices(d: Drone, w: DroneWorld, rangeX: number = M.noticeX, rangeY: number = M.noticeY): boolean {
  const p = w.player;
  return w.aggressive && !p.dead && Math.abs(p.x - d.x) < rangeX && Math.abs(p.centerY - d.y) < rangeY && w.onScreen(d.x, d.y, -20);
}

/** Wanders back and forth near its spawn, turning at walls and ledges. */
export function patrol(d: Drone, f: Footing, speed: number, leash = 70): void {
  let dir = faceOf(d);
  if (f.wall || f.ledge || (dir > 0 && d.x > d.homeX + leash) || (dir < 0 && d.x < d.homeX - leash)) dir = dir > 0 ? -1 : 1;
  setFace(d, dir);
  d.vx = f.grounded ? dir * speed : d.vx;
}
