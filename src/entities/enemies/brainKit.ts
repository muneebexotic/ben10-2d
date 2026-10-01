import { DRONE_SHARED, LASER } from '../../config/enemies';
import { PALETTE } from '../../config/palette';
import type { Drone, DroneWorld } from './Drone';

/** Steering and shooting helpers shared by every drone brain. */
export const rand = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);

export function steer(d: Drone, tx: number, ty: number, speed: number, gain = 2.2): void {
  // Boss adds (homeX < 0) roam the arena; level drones stay near home so they never pile up behind Ben.
  if (d.homeX >= 0) tx = Math.max(d.homeX - DRONE_SHARED.leash, Math.min(d.homeX + DRONE_SHARED.leash, tx));
  const dx = tx - d.x;
  const dy = ty - d.y;
  d.vx = Math.max(-speed, Math.min(speed, dx * gain));
  d.vy = Math.max(-speed, Math.min(speed, dy * gain));
}

export function aimAt(d: Drone, w: DroneWorld): number {
  return Math.atan2(w.player.centerY - d.y, w.player.x - d.x);
}

export function canShoot(d: Drone, w: DroneWorld, range: number): boolean {
  return w.aggressive && !w.player.dead && w.onScreen(d.x, d.y, 10) && Math.abs(w.player.x - d.x) < range;
}

export function fireLaser(d: Drone, w: DroneWorld, angle: number, speed: number, damage: number): void {
  const ox = d.x + Math.cos(angle) * 8;
  const oy = d.y + Math.sin(angle) * 8;
  w.projectiles.spawn('laser', 'enemy', ox, oy, Math.cos(angle) * speed, Math.sin(angle) * speed, damage, LASER.lifetimeMs, LASER.radius);
  w.fx.burst('red', ox, oy, 4);
  w.lighting.flash(ox, oy, 40, PALETTE.enemy, 120);
}
