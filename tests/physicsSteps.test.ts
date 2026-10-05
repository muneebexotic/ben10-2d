import { describe, expect, it } from 'vitest';
import { physicsSteps } from '../src/systems/PhysicsSteps';
import { PHYSICS } from '../src/config/constants';
import { XLR8 } from '../src/config/aliens/xlr8';
import { UPGRADE } from '../src/config/aliens/upgrade';
import { HUMAN_MOTOR, PLAYER } from '../src/config/player';

const SLOW = PHYSICS.maxFrameMs;
const FAST = 1000 / 60;
const travel = (v: number, dt: number) => (Math.abs(v) * dt) / 1000 / physicsSteps(v, 0, dt);

describe('physics steps stay short enough not to pass through walls', () => {
  it('takes one step for ordinary movement, even on a slow frame', () => {
    expect(physicsSteps(HUMAN_MOTOR.runSpeed, 0, SLOW)).toBe(1);
    expect(physicsSteps(0, PLAYER.maxFallSpeed, SLOW)).toBe(1);
    expect(physicsSteps(XLR8.dash.speed, 0, FAST)).toBe(1);
  });

  it("splits XLR8's dash and Upgrade's flow on a slow frame", () => {
    expect(physicsSteps(XLR8.dash.speed, 0, SLOW)).toBeGreaterThan(1);
    expect(physicsSteps(-UPGRADE.merge.speed, 0, SLOW)).toBeGreaterThan(1);
    expect(travel(XLR8.dash.speed, SLOW)).toBeLessThanOrEqual(PHYSICS.maxStepX);
    expect(travel(UPGRADE.merge.speed, SLOW)).toBeLessThanOrEqual(PHYSICS.maxStepX);
  });

  it('keeps every step under half of (a one-tile wall + the narrowest body), so no step sinks past a wall middle', () => {
    expect(PHYSICS.maxStepX).toBeLessThan((16 + 10) / 2);
    expect(PHYSICS.maxStepX).toBeLessThan((PHYSICS.barrierWidth + 10) / 2);
  });

  it('never runs away', () => {
    expect(physicsSteps(1e9, 1e9, SLOW)).toBe(PHYSICS.maxSubsteps);
    expect(physicsSteps(0, 0, 0)).toBe(1);
  });
});
