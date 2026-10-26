import type { SwimStats } from '../../config/swim';

/**
 * Pure swimming movement (Act 3): the stick swims in any direction with
 * momentum and drag, doing nothing drifts (each form its own way), JUMP is a
 * stroke upward, or a jump out at the surface. Currents carry the swimmer on
 * top of its own swimming. The Player feeds it the body and writes the result
 * back; `heavy` forms never come here (they walk the bottom).
 */

export interface SwimInput {
  moveX: -1 | 0 | 1;
  moveY: -1 | 0 | 1;
  jumpPressed: boolean;
}

export interface SwimWater {
  /** World y of the surface. */
  surface: number;
  /** A current's push here (px/s), 0 for still water. */
  currentX: number;
  currentY: number;
}

export interface SwimBodyState {
  /** Head (top of the body) and its height. */
  top: number;
  height: number;
}

export interface SwimState {
  /** The swimmer's own velocity (without the current). */
  vx: number;
  vy: number;
  strokeCooldown: number;
}

export interface SwimResult {
  vx: number;
  vy: number;
  stroked: boolean;
  jumpedOut: boolean;
  /** The head is up at the surface (breathing, treading water). */
  atSurface: boolean;
}

export function createSwimState(): SwimState {
  return { vx: 0, vy: 0, strokeCooldown: 0 };
}

/** Starts swimming with the body's velocity: a dive keeps a little of its speed. */
export function enterWater(state: SwimState, vx: number, vy: number, keep: number): void {
  state.vx = vx * 0.7;
  state.vy = vy * keep;
  state.strokeCooldown = 0;
}

function approach(v: number, target: number, rate: number, dt: number): number {
  const step = rate * dt;
  if (Math.abs(target - v) <= step) return target;
  return v + Math.sign(target - v) * step;
}

export function stepSwim(state: SwimState, input: SwimInput, stats: SwimStats, body: SwimBodyState, water: SwimWater, dtMs: number, floatAbove: number, speedMultiplier = 1): SwimResult {
  const dt = dtMs / 1000;
  state.strokeCooldown = Math.max(0, state.strokeCooldown - dtMs);
  const speed = stats.speed * speedMultiplier;
  const atSurface = body.top <= water.surface + 3;

  // Horizontal: swim toward the stick, coast to a stop without it.
  const tx = input.moveX * speed;
  state.vx = approach(state.vx, tx, input.moveX === 0 ? stats.drag : stats.accel, dt);

  // Vertical: the stick, or the form's own drift; floating forms tread water at the surface.
  let ty: number;
  if (input.moveY !== 0) ty = input.moveY * speed * 0.9;
  else if (atSurface && stats.sink >= 0) ty = 0;
  else ty = stats.sink;
  state.vy = approach(state.vy, ty, input.moveY === 0 && Math.abs(state.vy) > Math.abs(ty) ? stats.drag : stats.accel, dt);

  let stroked = false;
  let jumpedOut = false;
  if (input.jumpPressed) {
    if (atSurface && stats.jumpOut > 0) {
      state.vy = -stats.jumpOut;
      jumpedOut = true;
    } else if (state.strokeCooldown <= 0 && stats.stroke > 0) {
      state.vy = Math.min(state.vy, -stats.stroke);
      state.strokeCooldown = stats.strokeMs;
      stroked = true;
    }
  }

  // The surface holds a swimmer in unless it jumps out: the head can come up, not the rest.
  if (!jumpedOut && body.top < water.surface - body.height * floatAbove && state.vy < 0) state.vy = 0;

  return { vx: state.vx + water.currentX * stats.currentScale, vy: state.vy + water.currentY * stats.currentScale, stroked, jumpedOut, atSurface };
}
