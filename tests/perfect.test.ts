import { describe, expect, it } from 'vitest';
import { PERFECT_TRANSFORM } from '../src/config/omnitrix';
import { Omnitrix } from '../src/systems/Omnitrix';
import { PerfectWindow } from '../src/systems/PerfectTransform';

const cfg = { earlyMs: 100, lateMs: 200, range: 150 };
const droneA = {};
const droneB = {};

describe('perfect transform timing', () => {
  it('counts a press just after a shot fires', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 1000, 100, 0);
    expect(w.check(1150, 50, 0)?.key).toBe(droneA);
  });

  it('counts a press just before a telegraphed shot lands', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 1000, 100, 0);
    expect(w.check(920, 50, 0)).not.toBeNull();
  });

  it('window edges are inclusive and nothing outside them counts', () => {
    const early = new PerfectWindow(cfg);
    early.register(droneA, 1000, 0, 0);
    expect(early.check(1000 - cfg.earlyMs - 1, 0, 0)).toBeNull();
    expect(early.check(1000 - cfg.earlyMs, 0, 0)).not.toBeNull();

    const late = new PerfectWindow(cfg);
    late.register(droneA, 1000, 0, 0);
    expect(late.check(1000 + cfg.lateMs + 1, 0, 0)).toBeNull();

    const edge = new PerfectWindow(cfg);
    edge.register(droneA, 1000, 0, 0);
    expect(edge.check(1000 + cfg.lateMs, 0, 0)).not.toBeNull();
  });

  it('ignores attackers out of range unless the attack is arena-wide', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 1000, 400, 0);
    expect(w.check(1000, 0, 0)).toBeNull();
    w.register(droneB, 1000, 400, 0, Infinity);
    expect(w.check(1000, 0, 0)?.key).toBe(droneB);
  });

  it('one shot only ever earns one perfect', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 1000, 0, 0);
    expect(w.check(1000, 0, 0)).not.toBeNull();
    expect(w.check(1010, 0, 0)).toBeNull();
  });

  it('a cancelled attack (drone stunned mid-telegraph) does not count', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 1000, 0, 0);
    w.cancel(droneA);
    expect(w.check(1000, 0, 0)).toBeNull();
  });

  it('re-registering replaces the predicted time with the real one', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 1000, 0, 0);
    w.register(droneA, 1500, 0, 0);
    expect(w.count).toBe(1);
    expect(w.check(1000, 0, 0)).toBeNull();
    expect(w.check(1500, 0, 0)).not.toBeNull();
  });

  it('picks the attack closest in time and prunes stale ones', () => {
    const w = new PerfectWindow(cfg);
    w.register(droneA, 900, 0, 0);
    w.register(droneB, 1040, 0, 0);
    expect(w.check(1030, 0, 0)?.key).toBe(droneB);
    w.prune(5000);
    expect(w.count).toBe(0);
  });

  it('the shipped window is short but humanly reachable', () => {
    const total = PERFECT_TRANSFORM.earlyMs + PERFECT_TRANSFORM.lateMs;
    expect(total).toBeGreaterThanOrEqual(250);
    expect(total).toBeLessThanOrEqual(450);
  });
});

describe('Omnitrix.extend (perfect bonus)', () => {
  const config = { transformDurationMs: 10_000, cooldownMs: 5_000, warningMs: 3_000, wrongTransformChance: 0 };

  it('adds time only while transformed', () => {
    const o = new Omnitrix(config, ['heatblast']);
    o.extend(2000);
    expect(o.timeRemainingMs).toBe(0);
    o.transform();
    o.update(4000);
    o.extend(2000);
    expect(o.timeRemainingMs).toBe(8000);
  });

  it('re-arms the warning beeps if the bonus lifts the timer out of the warning zone', () => {
    const o = new Omnitrix(config, ['heatblast']);
    o.transform();
    const first = o.update(7500);
    expect(first.some((e) => e.type === 'warning')).toBe(true);
    o.extend(2000);
    expect(o.isWarning).toBe(false);
    const again = o.update(1600);
    expect(again).toContainEqual({ type: 'warning', secondsLeft: 3 });
  });
});
