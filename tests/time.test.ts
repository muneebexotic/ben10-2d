import { describe, expect, it } from 'vitest';
import { TimeController } from '../src/systems/TimeController';

describe('TimeController', () => {
  it('passes time through at normal speed', () => {
    const t = new TimeController();
    expect(t.step(16)).toBe(16);
    expect(t.scale).toBe(1);
  });

  it('hit-stop freezes gameplay time and then resumes', () => {
    const t = new TimeController();
    t.hitStop(50);
    expect(t.frozen).toBe(true);
    expect(t.step(16)).toBe(0);
    expect(t.step(16)).toBe(0);
    expect(t.step(16)).toBe(0);
    expect(t.step(16)).toBe(0);
    expect(t.frozen).toBe(false);
    expect(t.step(16)).toBe(16);
  });

  it('longer hit-stops win over shorter ones', () => {
    const t = new TimeController();
    t.hitStop(100);
    t.hitStop(20);
    t.step(60);
    expect(t.frozen).toBe(true);
  });

  it('slow motion scales time and eases back to normal', () => {
    const t = new TimeController();
    t.slowMo(0.25, 100, 100);
    expect(t.step(20)).toBeCloseTo(5);
    for (let i = 0; i < 5; i++) t.step(20);
    const during = t.step(20);
    expect(during).toBeGreaterThan(5);
    expect(during).toBeLessThan(20);
    for (let i = 0; i < 10; i++) t.step(20);
    expect(t.step(20)).toBe(20);
  });

  it('clearSlowMo snaps back to full speed', () => {
    const t = new TimeController();
    t.slowMo(0.1, 1000);
    t.clearSlowMo();
    expect(t.step(10)).toBe(10);
  });
});
