import { describe, expect, it } from 'vitest';
import {
  createMotorState,
  gravityScale,
  markLaunched,
  stepMotor,
  consumeJumpBuffer,
  type BodySnapshot,
  type MotorInput,
} from '../src/systems/PlatformerMotor';
import { HUMAN_MOTOR, PLAYER } from '../src/config/player';

const IDLE: MotorInput = { moveX: 0, jumpPressed: false, jumpHeld: false };
const GROUND: BodySnapshot = { vx: 0, vy: 0, grounded: true };
const AIR: BodySnapshot = { vx: 0, vy: 50, grounded: false };

describe('PlatformerMotor', () => {
  it('jumps from the ground immediately', () => {
    const state = createMotorState();
    const result = stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, GROUND, 16);
    expect(result.jumped).toBe(true);
    expect(result.vy).toBe(-HUMAN_MOTOR.jumpVelocity);
  });

  it('allows a jump shortly after walking off a ledge (coyote time)', () => {
    const state = createMotorState();
    stepMotor(state, IDLE, HUMAN_MOTOR, GROUND, 16);
    stepMotor(state, IDLE, HUMAN_MOTOR, AIR, HUMAN_MOTOR.coyoteMs - 20);
    const result = stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, AIR, 10);
    expect(result.jumped).toBe(true);
  });

  it('rejects a late jump after coyote time and flags an air-jump request instead', () => {
    const state = createMotorState();
    stepMotor(state, IDLE, HUMAN_MOTOR, GROUND, 16);
    stepMotor(state, IDLE, HUMAN_MOTOR, AIR, HUMAN_MOTOR.coyoteMs + 10);
    const result = stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, AIR, 16);
    expect(result.jumped).toBe(false);
    expect(result.airJumpRequested).toBe(true);
  });

  it('buffers a jump pressed just before landing', () => {
    const state = createMotorState();
    stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, AIR, 16);
    stepMotor(state, { moveX: 0, jumpPressed: false, jumpHeld: true }, HUMAN_MOTOR, AIR, 60);
    const result = stepMotor(state, { moveX: 0, jumpPressed: false, jumpHeld: true }, HUMAN_MOTOR, GROUND, 16);
    expect(result.jumped).toBe(true);
    expect(result.landed).toBe(true);
  });

  it('drops a buffered jump that is too old', () => {
    const state = createMotorState();
    stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: false }, HUMAN_MOTOR, AIR, 16);
    stepMotor(state, IDLE, HUMAN_MOTOR, AIR, HUMAN_MOTOR.jumpBufferMs + 10);
    const result = stepMotor(state, IDLE, HUMAN_MOTOR, GROUND, 16);
    expect(result.jumped).toBe(false);
  });

  it('consumeJumpBuffer cancels a buffered jump (used by rocket jump)', () => {
    const state = createMotorState();
    stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, AIR, 16);
    consumeJumpBuffer(state);
    expect(stepMotor(state, IDLE, HUMAN_MOTOR, GROUND, 16).jumped).toBe(false);
  });

  it('cuts upward velocity when jump is released early (variable height)', () => {
    const state = createMotorState();
    stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, GROUND, 16);
    const rising: BodySnapshot = { vx: 0, vy: -300, grounded: false };
    const result = stepMotor(state, { moveX: 0, jumpPressed: false, jumpHeld: false }, HUMAN_MOTOR, rising, 16);
    expect(result.vy).toBeCloseTo(-300 * HUMAN_MOTOR.jumpCutMultiplier);
    const again = stepMotor(state, IDLE, HUMAN_MOTOR, { vx: 0, vy: -100, grounded: false }, 16);
    expect(again.vy).toBe(-100);
  });

  it('keeps full velocity while jump is held', () => {
    const state = createMotorState();
    stepMotor(state, { moveX: 0, jumpPressed: true, jumpHeld: true }, HUMAN_MOTOR, GROUND, 16);
    const result = stepMotor(state, { moveX: 0, jumpPressed: false, jumpHeld: true }, HUMAN_MOTOR, { vx: 0, vy: -300, grounded: false }, 16);
    expect(result.vy).toBe(-300);
  });

  it('a non-cuttable launch ignores jump release', () => {
    const state = createMotorState();
    markLaunched(state, false);
    const result = stepMotor(state, IDLE, HUMAN_MOTOR, { vx: 0, vy: -400, grounded: false }, 16);
    expect(result.vy).toBe(-400);
  });

  it('accelerates toward run speed and caps there', () => {
    const state = createMotorState();
    let vx = 0;
    for (let i = 0; i < 60; i++) {
      vx = stepMotor(state, { moveX: 1, jumpPressed: false, jumpHeld: false }, HUMAN_MOTOR, { vx, vy: 0, grounded: true }, 16).vx;
    }
    expect(vx).toBe(HUMAN_MOTOR.runSpeed);
  });

  it('turns around faster than it accelerates from rest', () => {
    const state = createMotorState();
    const fromRest = stepMotor(state, { moveX: -1, jumpPressed: false, jumpHeld: false }, HUMAN_MOTOR, { vx: 0, vy: 0, grounded: true }, 16).vx;
    const turning = stepMotor(state, { moveX: -1, jumpPressed: false, jumpHeld: false }, HUMAN_MOTOR, { vx: 100, vy: 0, grounded: true }, 16).vx;
    expect(100 - turning).toBeGreaterThan(Math.abs(fromRest));
  });

  it('decelerates to a stop with no input', () => {
    const state = createMotorState();
    let vx = HUMAN_MOTOR.runSpeed;
    for (let i = 0; i < 30; i++) vx = stepMotor(state, IDLE, HUMAN_MOTOR, { vx, vy: 0, grounded: true }, 16).vx;
    expect(vx).toBe(0);
  });

  it('applies a speed multiplier (e.g. while charging)', () => {
    const state = createMotorState();
    let vx = 0;
    for (let i = 0; i < 60; i++) {
      vx = stepMotor(state, { moveX: 1, jumpPressed: false, jumpHeld: false }, HUMAN_MOTOR, { vx, vy: 0, grounded: true }, 16, 0.5).vx;
    }
    expect(vx).toBe(HUMAN_MOTOR.runSpeed * 0.5);
  });

  it('human Ben can clear 3 tiles but not 4 with a full jump', () => {
    const g = 1150;
    const apexHeight = (HUMAN_MOTOR.jumpVelocity * HUMAN_MOTOR.jumpVelocity) / (2 * g);
    expect(apexHeight).toBeGreaterThan(3 * 16 + 4);
    expect(apexHeight).toBeLessThan(4 * 16 + PLAYER.body.height * 0);
  });

  it('falls faster than it rises and hangs slightly at the apex', () => {
    const tuning = {
      fallMultiplier: PLAYER.fallGravityMultiplier,
      apexMultiplier: PLAYER.apexGravityMultiplier,
      apexThreshold: PLAYER.apexThreshold,
    };
    expect(gravityScale(-300, true, tuning)).toBe(1);
    expect(gravityScale(200, false, tuning)).toBe(PLAYER.fallGravityMultiplier);
    expect(gravityScale(10, true, tuning)).toBe(PLAYER.apexGravityMultiplier);
    expect(gravityScale(-10, false, tuning)).toBe(1);
  });
});
