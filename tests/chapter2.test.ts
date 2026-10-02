import { describe, expect, it } from 'vitest';
import { CHAPTER_2 } from '../src/levels/chapter2';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CELL, isSolidCell } from '../src/levels/tiles';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { availableCards, countedCards, lockedCards, waitingSecrets } from '../src/levels/secrets';
import { getAlien } from '../src/aliens/registry';
import { pendingUnlocks } from '../src/systems/Unlocks';

const HEATBLAST = getAlien('heatblast').reach;
const XLR8 = getAlien('xlr8').reach;
const FOURARMS = getAlien('fourarms').reach;

const level = CHAPTER_2;
const grid = buildCells(level);
const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
const chase = level.story!.chase!;
/** Where play picks up after the chase (Ben steps out at the truck stop). */
const truckStop: Pos = { x: chase.endX, y: chase.endY - 1 };
const riverBank: Pos = { x: 124, y: 23 };

function entity<T extends (typeof level.entities)[number]['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];
}

/** Standing somewhere a jump straight up grabs the card. */
const grabs = (c: { x: number; y: number }, caps: Capabilities) => (p: Pos) => Math.abs(p.x - c.x) <= 1 && p.y >= c.y - 1 && p.y - c.y <= caps.jumpUp;
const card = (id: string) => entity('card').find((c) => c.id === id)!;

describe('chapter 2 layout', () => {
  it('builds a grid of the declared size', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
  });

  it('the player starts standing on the rest stop', () => {
    expect(isSolidCell(cellAt(grid, level.playerStart.x, level.playerStart.y))).toBe(true);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('standing entities sit on a surface with open space above (floating cards excepted)', () => {
    const floating = ['ch2-card-river', 'ch2-card-sign'];
    const standing = level.entities.filter((e) => ['checkpoint', 'smoothy', 'card', 'decor'].includes(e.type) && !('id' in e && floating.includes(e.id))) as Array<{
      x: number;
      y: number;
      type: string;
    }>;
    for (const e of standing) {
      expect(cellAt(grid, e.x, e.y) !== CELL.EMPTY, `${e.type} at ${e.x},${e.y} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${e.type} at ${e.x},${e.y} is buried`).not.toBe(CELL.GROUND);
    }
  });

  it('every drone and ambush spawns in open air inside the level', () => {
    const waves = entity('wave').flatMap((w) => w.spawns);
    for (const d of [...entity('drone'), ...level.introSpawns, ...waves]) {
      expect(d.x).toBeGreaterThan(0);
      expect(d.x).toBeLessThan(level.width);
      expect(cellAt(grid, d.x, d.y), `drone at ${d.x},${d.y}`).toBe(CELL.EMPTY);
    }
  });

  it('the chase arena is one flat stretch of road walled off from the rest', () => {
    for (let x = 248; x < 306; x++) expect(isSolidCell(cellAt(grid, x, chase.roadY)), `road at ${x}`).toBe(true);
    expect(canReach(level, grid, { x: 210, y: 23 }, (p) => p.x >= 248, { ...HEATBLAST, canRunWater: true, canSmash: true })).toBe(false);
  });

  it('counts five cards: three now, the vault once Four Arms joins, one waiting for Stinkfly', () => {
    expect(countedCards(level)).toHaveLength(5);
    expect(availableCards(level, ['heatblast']).map((c) => c.id)).toEqual(['ch2-card-diner', 'ch2-card-hoodoo', 'ch2-card-river']);
    expect(availableCards(level, ['heatblast', 'xlr8', 'fourarms'])).toHaveLength(4);
    expect(lockedCards(level, ['heatblast', 'xlr8', 'fourarms']).map((c) => c.id)).toEqual(['ch2-card-sign']);
  });

  it('XLR8 and Four Arms join at their story beats; a restart past a beat already has the alien', () => {
    const unlocks = level.story!.unlocks!;
    expect(pendingUnlocks(unlocks, ['heatblast'], null)).toEqual(['xlr8', 'fourarms']);
    expect(pendingUnlocks(unlocks, ['heatblast'], 152)).toEqual(['fourarms']);
    expect(pendingUnlocks(unlocks, ['heatblast'], 318)).toEqual([]);
    expect(pendingUnlocks(unlocks, ['heatblast', 'xlr8', 'fourarms'], null)).toEqual([]);
  });

  it('a Camp Crash vault card becomes a secret worth going back for once Four Arms is on the file', () => {
    expect(waitingSecrets(level, ['heatblast'], [])).toEqual([]);
    expect(waitingSecrets(level, ['heatblast', 'xlr8', 'fourarms'], []).map((c) => c.id)).toEqual(['ch2-card-vault']);
    expect(waitingSecrets(level, ['heatblast', 'xlr8', 'fourarms'], ['ch2-card-vault'])).toEqual([]);
  });
});

describe('chapter 2 progression', () => {
  const boss = entity('boss')[0];
  const inArena = (p: Pos) => p.x >= boss.triggerX && p.x < boss.arenaTo;
  const farBank = (p: Pos) => p.x >= 200 && p.x < 244;

  it('human Ben cannot get past the drone barricade; Heatblast burns through', () => {
    expect(canReach(level, grid, start, (p) => p.x >= 60, HUMAN_CAPS)).toBe(false);
    expect(canReach(level, grid, start, (p) => p.x >= 60, HEATBLAST)).toBe(true);
  });

  it('the canyon road leads to the washed-out bridge', () => {
    expect(canReach(level, grid, start, (p) => p.x === riverBank.x && p.y === riverBank.y, HEATBLAST)).toBe(true);
  });

  it('only XLR8 can cross the river', () => {
    expect(canReach(level, grid, riverBank, farBank, XLR8)).toBe(true);
    for (const caps of [HUMAN_CAPS, HEATBLAST, FOURARMS]) expect(canReach(level, grid, riverBank, farBank, caps)).toBe(false);
  });

  it('the truck stop leads to ROADBREAKER on foot, whatever form Ben is in', () => {
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS]) expect(canReach(level, grid, truckStop, inArena, caps)).toBe(true);
  });

  it('every current card can be reached with the right form', () => {
    expect(canReach(level, grid, start, grabs(card('ch2-card-diner'), HUMAN_CAPS), HUMAN_CAPS)).toBe(true);
    // The hoodoo needs Heatblast's rocket jump.
    expect(canReach(level, grid, { x: 90, y: 16 }, grabs(card('ch2-card-hoodoo'), HUMAN_CAPS), HUMAN_CAPS)).toBe(false);
    expect(canReach(level, grid, start, grabs(card('ch2-card-hoodoo'), HEATBLAST), HEATBLAST)).toBe(true);
    // The river card hangs over open water between the islands.
    expect(canReach(level, grid, riverBank, grabs(card('ch2-card-river'), XLR8), XLR8)).toBe(true);
    expect(canReach(level, grid, riverBank, grabs(card('ch2-card-river'), HEATBLAST), HEATBLAST)).toBe(false);
  });

  it('the vault card needs a smash: no other form gets past the cracked wall', () => {
    const vault = card('ch2-card-vault');
    const at = (p: Pos) => p.x === vault.x && p.y === vault.y - 1;
    expect(canReach(level, grid, truckStop, at, FOURARMS)).toBe(true);
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8]) expect(canReach(level, grid, truckStop, at, caps)).toBe(false);
  });

  it("the sign card is out of every current alien's reach (Stinkfly's, in Chapter 3)", () => {
    const sign = card('ch2-card-sign');
    expect(sign.requires).toBe('stinkfly');
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS]) expect(canReach(level, grid, truckStop, grabs(sign, caps), caps)).toBe(false);
  });

  it('every checkpoint is reachable in its stretch of the level', () => {
    const from = (cpX: number): [Pos, Capabilities] => (cpX < 125 ? [start, HEATBLAST] : cpX < 244 ? [riverBank, XLR8] : [truckStop, HUMAN_CAPS]);
    for (const cp of entity('checkpoint')) {
      if (cp.hidden) continue;
      const [origin, caps] = from(cp.x);
      expect(canReach(level, grid, origin, (p) => p.x === cp.x && p.y === cp.y - 1, caps), cp.id).toBe(true);
    }
  });
});
