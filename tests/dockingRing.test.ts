import { describe, expect, it } from 'vitest';
import { CH7_BEATS } from '../src/config/chapter7';
import { GAIT, GAIT_RATE } from '../src/config/cartoon/gait';
import { CHAPTER_7 } from '../src/levels/chapter7';

const plan = CHAPTER_7.story!.plumber!;
const find = (type: string, id: string) => CHAPTER_7.entities.find((e) => e.type === type && 'id' in e && e.id === id);

describe("Chapter 7's docking ring", () => {
  it('its beats come in walking order, with the hatches and consoles they use', () => {
    const r = plan.ring;
    const bay = find('hatch', plan.dock.hatch);
    const hub = find('hatch', r.hubHatch);
    expect(bay && hub).toBeTruthy();
    const bayX = (bay as { x: number }).x;
    expect(CHAPTER_7.playerStart.x).toBeLessThan(r.revealX);
    expect(r.revealX).toBeLessThan(bayX);
    expect(bayX).toBeLessThan(r.lockerX);
    expect(r.lockerX).toBeLessThan(r.lockdownX);
    expect(r.lockdownX).toBeLessThan(r.hubX);
    expect(r.hubX).toBeLessThan((hub as { x: number }).x);
    // The ring's console lights the ring; Max wakes the hub's.
    expect(find('baseConsole', 'c-ring')).toMatchObject({ wakes: 'ring' });
    expect(find('baseConsole', 'c-hub')).toMatchObject({ wakes: 'hub' });
    // Max stops at his locker, under the shelf with its card.
    const card = find('card', 'ch7-card-locker') as { x: number } | undefined;
    expect(Math.abs((card?.x ?? 0) - r.lockerX)).toBeLessThan(2);
  });

  it('Max and Gwen move at speeds their drawn cycles can keep their feet planted at', () => {
    const R = CH7_BEATS.ring;
    const ok = (speed: number, gait: number) => speed >= gait * GAIT_RATE.min && speed <= gait * GAIT_RATE.max;
    expect(ok(R.maxWalk, GAIT.max.walk)).toBe(true);
    expect(ok(R.maxHurry, GAIT.max.walk)).toBe(true);
    expect(ok(R.gwenRun, GAIT.gwen.run)).toBe(true);
    expect(ok(R.gwenFollow, GAIT.gwen.run)).toBe(true);
  });

  it('Max and Gwen wait at the hub on the floor beside the console\'s dais, not on it', () => {
    const hubPx = plan.ring.hubX * 16;
    for (const dx of [CH7_BEATS.ring.hubMax, CH7_BEATS.ring.hubGwen]) expect(hubPx + dx).toBeLessThan(hubPx);
  });
});
