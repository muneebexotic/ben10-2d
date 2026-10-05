import { PHYSICS } from '../config/constants';

/**
 * How many physics steps a frame of `dtMs` needs so a body moving at (vx, vy)
 * never travels more than PHYSICS.maxStepX / maxStepY in one. Arcade picks the
 * side of a static body from where a step ends, so one long step that sinks
 * Ben past a wall's middle pops him out of the far side (XLR8's dash on a
 * 30 fps frame went through cracked walls and shutters).
 */
export function physicsSteps(vx: number, vy: number, dtMs: number): number {
  const reach = Math.max(Math.abs(vx) / PHYSICS.maxStepX, Math.abs(vy) / PHYSICS.maxStepY) * (dtMs / 1000);
  return Math.min(PHYSICS.maxSubsteps, Math.max(1, Math.ceil(reach)));
}
