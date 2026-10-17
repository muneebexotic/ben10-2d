import { describe, expect, it } from 'vitest';
import { TOWER } from '../src/config/tower';
import { stepClimber, wallAt, type ClimbInput, type Climber } from '../src/scenes/tower/climber';
import { CIRCUMFERENCE, landing, project, topHeight, towerLedges, wrapAngle } from '../src/scenes/tower/rules';

const ledges = towerLedges();
const top = topHeight(ledges);
const DT = 1 / 60;

const fresh = (): Climber => ({ s: 20, h: 0, vs: 0, vh: 0, grounded: true });
const input = (move: number, jump = false): ClimbInput => ({ move, jumpPressed: jump, jumpHeld: jump, push: 0 });

function onGround(s: number, h: number): boolean {
  return ledges.some((l) => s >= l.s0 && s <= l.s1 && Math.abs(l.h - h) < 1);
}

/** A simple bot: run right, jump at every riser and every gap. Returns seconds to the top (or Infinity). */
function climb(run: number, jump: number, maxS = 240): number {
  const c = fresh();
  let held = 0;
  for (let t = 0; t < maxS; t += DT) {
    const blocked = wallAt(ledges, c.s + 14, c.h) !== null;
    const edge = !onGround(c.s + 10, c.h);
    const press = c.grounded && (blocked || edge);
    if (press) held = 0.3;
    held -= DT;
    stepClimber(c, { move: 1, jumpPressed: press, jumpHeld: held > 0, push: 0 }, run, jump, DT, ledges);
    if (c.grounded && c.h >= top - 0.5) return t;
  }
  return Infinity;
}

describe('THE TOWER WRAP: the spiral', () => {
  it('climbs three turns, every step a jump up and a gap every few steps', () => {
    expect(top).toBeGreaterThan(TOWER.step.rise * 20);
    const gaps = ledges.filter((l, i) => i > 0 && l.h < ledges[i - 1].h);
    expect(gaps.length).toBeGreaterThan(2);
    // Every gap has a catch ledge the whole way across it.
    for (const g of gaps) expect(g.s1 - g.s0).toBe(TOWER.gapLength);
  });

  it('a step is always within one jump of the last, and a catch ledge within one jump of the next step', () => {
    const jumpHeight = (TOWER.jumpVelocity * 0.9) ** 2 / (2 * TOWER.gravity);
    for (let i = 1; i < ledges.length; i++) expect(ledges[i].h - ledges[i - 1].h).toBeLessThan(jumpHeight - 4);
  });

  it('the turns of the spiral sit far enough apart that a riser is never confused with a ledge overhead', () => {
    const perTurn = top / TOWER.revolutions;
    expect(perTurn).toBeGreaterThan(TOWER.wallReach + 40);
    expect(TOWER.wallReach).toBeGreaterThan(TOWER.step.rise + TOWER.catchDrop);
  });
});

describe('THE TOWER WRAP: climbing', () => {
  it('running into a riser stops Ben at it (it never drops him a turn)', () => {
    const c = fresh();
    for (let i = 0; i < 300; i++) stepClimber(c, input(1), TOWER.runSpeed, TOWER.jumpVelocity, DT, ledges);
    expect(c.h).toBe(0);
    expect(c.grounded).toBe(true);
    expect(c.s).toBeLessThan(ledges[1].s0);
    expect(c.s).toBeGreaterThan(ledges[1].s0 - 4);
  });

  it('a missed gap lands on its catch ledge, and Ben can jump out of it toward the next step', () => {
    const gapIndex = ledges.findIndex((l, i) => i > 0 && l.h < ledges[i - 1].h);
    const before = ledges[gapIndex - 1];
    const catchLedge = ledges[gapIndex];
    const after = ledges[gapIndex + 1];
    const c: Climber = { s: before.s1 - 4, h: before.h, vs: 0, vh: 0, grounded: true };
    for (let i = 0; i < 40; i++) stepClimber(c, input(1), TOWER.runSpeed, TOWER.jumpVelocity, DT, ledges);
    expect(c.grounded).toBe(true);
    expect(c.h).toBe(catchLedge.h);
    for (let i = 0; i < 90 && !(c.grounded && c.h === after.h); i++) {
      stepClimber(c, { move: 1, jumpPressed: i === 0, jumpHeld: true, push: 0 }, TOWER.runSpeed, TOWER.jumpVelocity * 0.9, DT, ledges);
    }
    expect(c.h).toBe(after.h);
  });

  it('ends at a long top step that Ben can\'t run or jump past', () => {
    const last = ledges[ledges.length - 1];
    expect(last.h).toBe(top);
    expect(last.s1 - last.s0).toBe(TOWER.topLength);
    const c: Climber = { s: last.s1 - 5, h: last.h, vs: 0, vh: 0, grounded: true };
    for (let i = 0; i < 120; i++) stepClimber(c, input(1, i === 0), TOWER.runSpeed * 1.35, TOWER.jumpVelocity * 1.15, DT, ledges);
    expect(c.s).toBeLessThanOrEqual(last.s1);
    expect(c.h).toBe(top);
  });

  it('can be climbed to the top by every form, from the slowest to the springiest', () => {
    const slow = climb(TOWER.runSpeed * 0.85, TOWER.jumpVelocity * 0.9);
    const fast = climb(TOWER.runSpeed * 1.35, TOWER.jumpVelocity * 1.15);
    expect(slow).toBeLessThan(120);
    expect(fast).toBeLessThan(slow);
    // Long enough to be a set piece, short enough not to drag.
    expect(climb(TOWER.runSpeed, TOWER.jumpVelocity)).toBeGreaterThan(15);
  });

  it('plays the same at 120 Hz as at 60 Hz (within a few percent)', () => {
    const at = (dt: number) => {
      const c = fresh();
      c.s = ledges[1].s0 - 2;
      stepClimber(c, input(0, true), TOWER.runSpeed, TOWER.jumpVelocity, dt, ledges);
      let peak = 0;
      for (let t = 0; t < 1; t += dt) {
        stepClimber(c, input(0, true), TOWER.runSpeed, TOWER.jumpVelocity, dt, ledges);
        peak = Math.max(peak, c.h);
      }
      return peak;
    };
    expect(Math.abs(at(1 / 120) - at(1 / 60))).toBeLessThan(3);
  });

  it('a fall lands on whichever turn of the spiral is underneath', () => {
    const second = ledges.find((l) => l.s0 > CIRCUMFERENCE + 100)!;
    const sameSpotBelow = second.s0 + 5 - CIRCUMFERENCE;
    const hit = landing(ledges, sameSpotBelow, second.h + 10, second.h - 5);
    expect(hit.ledge).toBe(second);
    expect(hit.shift).toBeCloseTo(CIRCUMFERENCE);
  });
});

describe('THE TOWER WRAP: projection', () => {
  it('wraps angles into one turn', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(-Math.PI);
    expect(wrapAngle(0.5)).toBeCloseTo(0.5);
    expect(wrapAngle(-Math.PI * 2 + 0.5)).toBeCloseTo(0.5);
  });

  it('puts the camera side in front and the far side behind', () => {
    const o = { dx: 0, depth: 0 };
    expect(project(100, 100, 0, o).depth).toBeCloseTo(1);
    expect(project(100 + CIRCUMFERENCE / 2, 100, 0, o).depth).toBeCloseTo(-1);
    expect(project(100 + CIRCUMFERENCE / 4, 100, 0, o).dx).toBeCloseTo(TOWER.radius);
  });
});
