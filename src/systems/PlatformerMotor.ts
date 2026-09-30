/**
 * Pure platformer movement: acceleration, coyote time, jump buffering and
 * variable jump height. The Player feeds it body state each frame and writes
 * the returned velocity back to its physics body.
 */

export interface MotorStats {
  runSpeed: number;
  accelGround: number;
  decelGround: number;
  accelAir: number;
  decelAir: number;
  jumpVelocity: number;
  coyoteMs: number;
  jumpBufferMs: number;
  /** Upward velocity is multiplied by this when jump is released early. */
  jumpCutMultiplier: number;
}

export interface MotorInput {
  moveX: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
}

export interface BodySnapshot {
  vx: number;
  vy: number;
  grounded: boolean;
}

export interface MotorState {
  coyoteMs: number;
  bufferMs: number;
  /** True from takeoff until the jump is cut or the apex is reached. */
  rising: boolean;
  wasGrounded: boolean;
}

export interface MotorResult {
  vx: number;
  vy: number;
  jumped: boolean;
  landed: boolean;
  /** Jump was pressed in the air with no ground jump available. Forms may consume it (rocket jump). */
  airJumpRequested: boolean;
}

export interface GravityTuning {
  fallMultiplier: number;
  apexMultiplier: number;
  apexThreshold: number;
}

export function createMotorState(): MotorState {
  return { coyoteMs: 0, bufferMs: 0, rising: false, wasGrounded: false };
}

export function stepMotor(
  state: MotorState,
  input: MotorInput,
  stats: MotorStats,
  body: BodySnapshot,
  dtMs: number,
  speedMultiplier = 1,
): MotorResult {
  const dt = dtMs / 1000;
  let { vx, vy } = body;
  const landed = body.grounded && !state.wasGrounded;

  if (body.grounded) {
    state.coyoteMs = stats.coyoteMs;
    if (vy >= 0) state.rising = false;
  } else {
    state.coyoteMs = Math.max(0, state.coyoteMs - dtMs);
  }

  if (input.jumpPressed) state.bufferMs = stats.jumpBufferMs;
  else state.bufferMs = Math.max(0, state.bufferMs - dtMs);

  let jumped = false;
  let airJumpRequested = false;
  const canGroundJump = body.grounded || state.coyoteMs > 0;

  if (state.bufferMs > 0 && canGroundJump) {
    vy = -stats.jumpVelocity;
    jumped = true;
    state.bufferMs = 0;
    state.coyoteMs = 0;
    state.rising = true;
  } else if (input.jumpPressed && !canGroundJump) {
    airJumpRequested = true;
  }

  if (state.rising && !jumped) {
    if (vy >= 0) {
      state.rising = false;
    } else if (!input.jumpHeld) {
      vy *= stats.jumpCutMultiplier;
      state.rising = false;
    }
  }

  vx = approachVelocity(vx, input.moveX, stats, body.grounded, dt, speedMultiplier);

  state.wasGrounded = body.grounded && !jumped;
  return { vx, vy, jumped, landed, airJumpRequested };
}

/** Clears the buffered jump after a form consumed an air-jump request. */
export function consumeJumpBuffer(state: MotorState): void {
  state.bufferMs = 0;
}

/** Called when something other than a ground jump launches the body upward (rocket jump, bounce). */
export function markLaunched(state: MotorState, cuttable: boolean): void {
  state.rising = cuttable;
  state.coyoteMs = 0;
  state.bufferMs = 0;
  state.wasGrounded = false;
}

export function gravityScale(vy: number, jumpHeld: boolean, tuning: GravityTuning): number {
  if (vy > 0) {
    return Math.abs(vy) < tuning.apexThreshold && jumpHeld ? tuning.apexMultiplier : tuning.fallMultiplier;
  }
  if (Math.abs(vy) < tuning.apexThreshold && jumpHeld) return tuning.apexMultiplier;
  return 1;
}

function approachVelocity(
  vx: number,
  moveX: -1 | 0 | 1,
  stats: MotorStats,
  grounded: boolean,
  dt: number,
  speedMultiplier: number,
): number {
  const target = moveX * stats.runSpeed * speedMultiplier;
  const accel = grounded ? stats.accelGround : stats.accelAir;
  const decel = grounded ? stats.decelGround : stats.decelAir;

  let rate: number;
  if (moveX === 0) rate = decel;
  else if (vx !== 0 && Math.sign(vx) !== moveX) rate = accel + decel;
  else if (Math.abs(vx) > Math.abs(target)) rate = decel;
  else rate = accel;

  const delta = target - vx;
  const step = rate * dt;
  if (Math.abs(delta) <= step) return target;
  return vx + Math.sign(delta) * step;
}
