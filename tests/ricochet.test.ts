import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { misfireLines } from '../src/aliens/misfire';
import { RICOCHET } from '../src/config/aliens/ricochet';
import { clampSpeed, dropDamage, landingBounce, ricochetOff, rollDamage, rollSmashes, spinRate, stepRollSpeed } from '../src/aliens/ricochet/rollMotor';
import { buildCells } from '../src/levels/buildLevel';
import { CHAPTER_5 } from '../src/levels/chapter5';
import { canReach, HUMAN_CAPS, type Pos } from '../src/levels/reachability';

const R = RICOCHET.roll;
const RICO = getAlien('ricochet');

/** Rolls for `ms` holding `move`, 16 ms a frame. */
function roll(v: number, move: -1 | 0 | 1, ms: number, grounded = true): number {
  for (let t = 0; t < ms; t += 16) v = stepRollSpeed(v, move, grounded, 16);
  return v;
}

describe('Ricochet', () => {
  it('joins the dial in Chapter 8, smashes and rolls', () => {
    expect(RICO.unlockChapter).toBe(8);
    expect(RICO.reach.canSmash).toBe(true);
    expect(RICO.reach.canRoll).toBe(true);
    expect(RICO.swim?.heavy).toBeDefined();
  });

  it('builds speed slowly up to the top speed, and keeps rolling with nothing held', () => {
    const after = roll(0, 1, 300);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(R.maxSpeed);
    const top = roll(0, 1, 3000);
    expect(top).toBe(R.maxSpeed);
    // A second later with nothing held he's still going most of the way.
    expect(roll(top, 0, 1000)).toBeGreaterThan(top * 0.7);
    // Pushing the other way brakes him and turns him round.
    expect(roll(top, -1, 1500)).toBeLessThan(0);
  });

  it('bleeds back down to the top speed after a boost, never past the cap', () => {
    expect(clampSpeed(10_000)).toBe(R.capSpeed);
    const boosted = roll(R.capSpeed, 1, 3000);
    expect(boosted).toBe(R.maxSpeed);
  });

  it('ricochets off a wall fast enough, and just stops against it slower', () => {
    expect(ricochetOff(300)).toBeCloseTo(-300 * R.restitution);
    expect(ricochetOff(-300)).toBeCloseTo(300 * R.restitution);
    expect(ricochetOff(R.ricochetMin - 1)).toBe(0);
  });

  it('hurts what it rolls into only fast enough, harder the faster, and smashes at speed', () => {
    expect(rollDamage(R.hurtSpeed - 1)).toBe(0);
    expect(rollDamage(R.hurtSpeed)).toBeGreaterThan(0);
    expect(rollDamage(R.maxSpeed)).toBeGreaterThan(rollDamage(R.hurtSpeed));
    expect(rollSmashes(R.smashSpeed - 1)).toBe(false);
    expect(rollSmashes(R.maxSpeed)).toBe(true);
  });

  it('bounces off a hard landing on its own; a perfect bounce climbs, three in a row at most', () => {
    expect(landingBounce(R.landBounceMin - 1, false, 0).vy).toBe(0);
    expect(landingBounce(R.landBounceMin + 100, false, 2)).toEqual({ vy: -(R.landBounceMin + 100) * R.landRestitution, chain: 0 });
    let chain = 0;
    const heights: number[] = [];
    for (let i = 0; i < 5; i++) {
      const b = landingBounce(0, true, chain);
      chain = b.chain;
      heights.push(-b.vy);
    }
    expect(heights[1]).toBeGreaterThan(heights[0]);
    expect(heights[2]).toBeGreaterThan(heights[1]);
    expect(heights[4]).toBe(heights[2]);
    expect(chain).toBe(R.perfectChainMax);
    // The highest stays under the body's top speed (640 px/s), so it isn't clipped.
    expect(heights[4]).toBeLessThanOrEqual(640);
  });

  it("a shell drop from high enough breaks museum skylights; the spin follows the speed", () => {
    expect(dropDamage(RICOCHET.drop.speed, RICOCHET.drop.speed)).toBeGreaterThanOrEqual(5.5);
    expect(dropDamage(0, RICOCHET.drop.speed)).toBe(RICOCHET.drop.damageMin);
    expect(spinRate(0)).toBe(1);
    expect(spinRate(R.maxSpeed)).toBeCloseTo(R.spinRate);
  });

  it('has a misfire line for every other alien, both ways', () => {
    for (const other of ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly', 'upgrade', 'diamondhead', 'ghostfreak', 'greymatter', 'ripjaws']) {
      expect(misfireLines(other, 'ricochet').length, `${other} > ricochet`).toBeGreaterThan(0);
      expect(misfireLines('ricochet', other).length, `ricochet > ${other}`).toBeGreaterThan(0);
    }
  });

  it("opens Chapter 5's mine-cart loop (a ball gate he bounces up into); human Ben can't", () => {
    const card = CHAPTER_5.entities.find((e) => e.type === 'card' && e.id === 'ch5-card-loop') as { x: number; y: number; requires?: string };
    expect(card.requires).toBe('ricochet');
    const grid = buildCells(CHAPTER_5);
    const from: Pos = { x: 308, y: 39 };
    const goal = (p: Pos) => Math.abs(p.x - card.x) <= 1 && Math.abs(p.y - card.y) <= 2;
    expect(canReach(CHAPTER_5, grid, from, goal, RICO.reach)).toBe(true);
    expect(canReach(CHAPTER_5, grid, from, goal, HUMAN_CAPS)).toBe(false);
  });
});
