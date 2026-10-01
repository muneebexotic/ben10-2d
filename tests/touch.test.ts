import { describe, expect, it } from 'vitest';
import { TOUCH } from '../src/config/touch';
import { QualityGovernor } from '../src/systems/Quality';
import { formatControls } from '../src/systems/controlLabels';
import { pad, stickDirections } from '../src/systems/VirtualPad';

const tuning = { radius: 30, deadZone: 0.3, upSlope: 0.6, downSlope: 1 };

describe('touch stick', () => {
  it('does nothing inside the dead zone', () => {
    expect(stickDirections(5, -4, tuning)).toEqual({ left: false, right: false, up: false, down: false });
  });

  it('a push sideways and a little up is still just running', () => {
    expect(stickDirections(25, -8, tuning)).toEqual({ left: false, right: true, up: false, down: false });
  });

  it('a clear upward push aims up, even while running', () => {
    expect(stickDirections(0, -25, tuning).up).toBe(true);
    expect(stickDirections(-20, -20, tuning)).toEqual({ left: true, right: false, up: true, down: false });
  });

  it('dropping through a platform needs a steep downward push', () => {
    expect(stickDirections(20, 15, tuning).down).toBe(false);
    expect(stickDirections(5, 25, tuning).down).toBe(true);
  });

  it('the shipped tuning is sane', () => {
    expect(TOUCH.stick.deadZone).toBeGreaterThan(0.1);
    expect(TOUCH.stick.deadZone).toBeLessThan(0.5);
  });
});

describe('virtual pad', () => {
  it('latches a press once and tracks the hold separately', () => {
    pad.reset();
    pad.press('jump');
    expect(pad.consume('jump')).toBe(true);
    expect(pad.consume('jump')).toBe(false);
    expect(pad.isHeld('jump')).toBe(true);
    pad.release('jump');
    expect(pad.isHeld('jump')).toBe(false);
  });

  it('reset forgets everything (pausing never leaves a button stuck)', () => {
    pad.press('special');
    pad.tap();
    pad.setStick({ left: true, right: false, up: false, down: false });
    pad.reset();
    expect(pad.isHeld('special')).toBe(false);
    expect(pad.consumeTap()).toBe(false);
    expect(pad.stick.left).toBe(false);
  });
});

describe('control labels', () => {
  it('renders the same prompt for keys or touch', () => {
    expect(formatControls('PRESS {T} TO TRANSFORM!', 'keyboard')).toBe('PRESS [T] TO TRANSFORM!');
    expect(formatControls('PRESS {T} TO TRANSFORM!', 'touch')).toBe('PRESS [OMNITRIX] TO TRANSFORM!');
    expect(formatControls('{MOVE}: MOVE  {JUMP}: JUMP', 'touch')).toBe('STICK: MOVE  [JUMP]: JUMP');
    expect(formatControls('UNKNOWN {NOPE}', 'touch')).toBe('UNKNOWN {NOPE}');
  });
});

describe('quality governor', () => {
  const config = { particleLevels: [1, 0.5, 0.25], windowMs: 1000, downgradeFps: 50, upgradeFps: 58, upgradeAfterMs: 3000, warmupMs: 500, maxSampleMs: 250 };
  const run = (q: QualityGovernor, frameMs: number, totalMs: number) => {
    for (let t = 0; t < totalMs; t += frameMs) q.sample(frameMs);
  };

  it('ignores warm-up frames and tab-switch spikes', () => {
    const q = new QualityGovernor(config);
    run(q, 40, 400);
    q.sample(5000);
    expect(q.level).toBe(0);
  });

  it('steps down when a device runs slow and stops at the lowest level', () => {
    const q = new QualityGovernor(config);
    run(q, 16.7, 600);
    run(q, 30, 1100);
    expect(q.level).toBe(1);
    run(q, 30, 5000);
    expect(q.level).toBe(2);
    expect(q.lowest).toBe(true);
    expect(q.particleScale).toBe(0.25);
  });

  it('a steady 60 fps never downgrades, and recovers only after a sustained good stretch', () => {
    const q = new QualityGovernor(config);
    run(q, 16.7, 600 + 10_000);
    expect(q.level).toBe(0);
    run(q, 30, 1100);
    expect(q.level).toBe(1);
    run(q, 16.7, 2000);
    expect(q.level).toBe(1);
    run(q, 16.7, 2500);
    expect(q.level).toBe(0);
  });

  it('scales particle counts without losing small bursts entirely', () => {
    const q = new QualityGovernor(config);
    run(q, 16.7, 600);
    run(q, 30, 1100);
    expect(q.scaleCount(10, () => 0.99)).toBe(5);
    expect(q.scaleCount(1, () => 0.1)).toBe(1);
    expect(q.scaleCount(1, () => 0.9)).toBe(0);
  });
});
