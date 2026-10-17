import { TOWER } from '../../config/tower';
import { landing, spiralEnd, type Ledge } from './rules';

/** Ben on the spiral: arc position, height, velocities. */
export interface Climber {
  s: number;
  h: number;
  vs: number;
  vh: number;
  grounded: boolean;
}

export interface ClimbInput {
  /** -1 left, 0, 1 right. */
  move: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  /** Extra speed along the surface this frame (a wind gust). */
  push: number;
}

/** What happened this step (one reused object). */
export interface ClimbStep {
  jumped: boolean;
  landed: boolean;
  /** How far `s` moved to land on another turn of the spiral (the camera moves with it). */
  shift: number;
}

const step: ClimbStep = { jumped: false, landed: false, shift: 0 };

/**
 * The riser in front of Ben: a ledge at arc position `s` that's higher than
 * his feet but within a jump (a step up, or the step beside a gap's catch
 * ledge). Ledges a whole turn above don't count: they're overhead, not ahead.
 */
export function wallAt(ledges: readonly Ledge[], s: number, h: number): Ledge | null {
  for (const l of ledges) {
    if (s < l.s0 || s > l.s1) continue;
    if (l.h > h + 0.5 && l.h < h + TOWER.wallReach) return l;
  }
  return null;
}

/** The ledge under Ben's feet at (s, h). */
function under(ledges: readonly Ledge[], s: number, h: number): boolean {
  for (const l of ledges) if (s >= l.s0 && s <= l.s1 && Math.abs(l.h - h) < 1) return true;
  return false;
}

/**
 * One step of the climb (pure, so it can be tested without the scene): run
 * along the ledge, stop at risers, jump, fall, and land on whichever turn of
 * the spiral is underneath. `run` and `jump` are the current form's speed and
 * jump velocity.
 */
export function stepClimber(c: Climber, input: ClimbInput, run: number, jump: number, dt: number, ledges: readonly Ledge[]): ClimbStep {
  step.jumped = false;
  step.landed = false;
  step.shift = 0;
  c.vs = input.move * run + input.push;
  if (input.jumpPressed && c.grounded) {
    c.vh = jump;
    c.grounded = false;
    step.jumped = true;
  }
  // Along the surface, unless a riser is in the way.
  const next = c.s + c.vs * dt;
  const wall = c.vs !== 0 ? wallAt(ledges, next, c.h) : null;
  if (wall) c.s = c.vs > 0 ? Math.min(c.s, wall.s0 - 0.01) : Math.max(c.s, wall.s1 + 0.01);
  else c.s = Math.min(next, spiralEnd(ledges));
  if (c.grounded) {
    if (!under(ledges, c.s, c.h)) {
      // Walked off the end of a step.
      c.grounded = false;
      c.vh = 0;
    }
    return step;
  }
  // Letting go of jump early cuts the jump short (more gravity on the way up).
  const g = TOWER.gravity * (!input.jumpHeld && c.vh > 0 ? TOWER.releaseGravity : 1);
  c.vh = Math.max(-TOWER.maxFall, c.vh - g * dt);
  const from = c.h;
  c.h += c.vh * dt;
  if (c.vh <= 0) {
    const hit = landing(ledges, c.s, from, c.h);
    if (hit.ledge) {
      c.s += hit.shift;
      c.h = hit.ledge.h;
      c.vh = 0;
      c.grounded = true;
      step.landed = true;
      step.shift = hit.shift;
    }
  }
  return step;
}
