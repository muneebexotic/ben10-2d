import { DEEP_SHARED } from '../../../config/plumber';
import type { WaterProvider } from '../../../scenes/level/Swimming';
import type { Drone, DroneWorld } from '../Drone';

/**
 * What Chapter 7's enemies know about the base beyond the drone world: its
 * water (the tanks, which come and go as the pumps run) and the jelly mines
 * that pop together. The base's systems fill it in and clear it.
 */
export const deepEnv: { water: WaterProvider | null; readonly jellies: Set<Drone> } = { water: null, jellies: new Set() };

/** The surface (px) of the water at (x, y), or null when (x, y) is dry. */
export function surfaceAt(x: number, y: number): number | null {
  const w = deepEnv.water?.waterAt(x, y);
  return w && y > w.surface ? w.surface : null;
}

/**
 * A water enemy's frame: true while it's in water (kept under the surface and
 * off the walls); out of water it sinks to the floor and lies there flapping.
 */
export function swimPhysics(d: Drone, w: DroneWorld, dtMs: number): boolean {
  const half = d.brain.body.height / 2;
  const surface = surfaceAt(d.x, d.y);
  if (surface === null) {
    // High and dry: it drops to the floor.
    d.vx *= 0.8;
    const ground = w.groundBelow(d.x, d.y - half + 1);
    d.vy = d.y + half < ground - 1 ? DEEP_SHARED.dryFall : 0;
    if (d.vy > 0 && d.y + half + (d.vy * dtMs) / 1000 > ground) d.vy = ((ground - d.y - half) * 1000) / Math.max(1, dtMs);
    return false;
  }
  const top = surface + half + DEEP_SHARED.surfaceMargin;
  if (d.y < top && d.vy < 0) d.vy = Math.max(d.vy, (top - d.y) * 3);
  if (d.y < top - 2) d.vy = Math.max(d.vy, 40);
  const halfW = d.brain.body.width / 2;
  if ((d.vx > 0 && w.isSolid(d.x + halfW + 2, d.y)) || (d.vx < 0 && w.isSolid(d.x - halfW - 2, d.y))) d.vx = 0;
  if ((d.vy > 0 && w.isSolid(d.x, d.y + half + 2)) || (d.vy < 0 && w.isSolid(d.x, d.y - half - 2))) d.vy = 0;
  return true;
}

/** Ben is near and fair game (in reach, not phased out, on screen). */
export function seesBen(d: Drone, w: DroneWorld, range: number): boolean {
  const p = w.player;
  return w.aggressive && !p.dead && !p.cloaked && Math.hypot(p.x - d.x, p.centerY - d.y) < range && w.onScreen(d.x, d.y, -10);
}
