import { describe, expect, it } from 'vitest';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { autotile, buildCells, cellAt } from '../src/levels/buildLevel';
import { CELL, FRAME, isSolidCell } from '../src/levels/tiles';
import { canReach, HUMAN_CAPS, type Pos } from '../src/levels/reachability';
import { availableCards, breaksCrackedWall, lockedCards } from '../src/levels/secrets';
import { aliensUnlockedBy, getAlien } from '../src/aliens/registry';

const HEATBLAST_CAPS = getAlien('heatblast').reach;

const level = CHAPTER_1;
const grid = buildCells(level);
const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };

function entity<T extends (typeof level.entities)[number]['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];
}

describe('chapter 1 layout', () => {
  it('builds a grid of the declared size', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
  });

  it('the player starts standing on solid ground', () => {
    expect(isSolidCell(cellAt(grid, level.playerStart.x, level.playerStart.y))).toBe(true);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('every standing entity sits on a surface with open space above', () => {
    const standing = level.entities.filter((e) =>
      ['checkpoint', 'smoothy', 'card', 'jammer', 'pod', 'decor'].includes(e.type),
    ) as Array<{ x: number; y: number; type: string }>;
    for (const e of standing) {
      const surface = cellAt(grid, e.x, e.y);
      expect(surface !== CELL.EMPTY, `${e.type} at ${e.x},${e.y} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${e.type} at ${e.x},${e.y} is buried`).not.toBe(CELL.GROUND);
    }
  });

  it('every drone spawns in open air inside the level', () => {
    for (const d of [...entity('drone'), ...level.introSpawns]) {
      expect(d.x).toBeGreaterThan(0);
      expect(d.x).toBeLessThan(level.width);
      expect(cellAt(grid, d.x, d.y), `drone at ${d.x},${d.y}`).toBe(CELL.EMPTY);
    }
  });

  it('barricades fill open passages', () => {
    for (const b of entity('barricade')) {
      for (let y = b.y; y < b.y + b.h; y++) {
        for (let x = b.x; x < b.x + b.w; x++) expect(cellAt(grid, x, y), `barricade ${b.id}`).toBe(CELL.EMPTY);
      }
    }
  });

  it('autotiles grass on exposed ground tops and one-way frames on platforms', () => {
    const frames = autotile(grid);
    const top = frames[level.playerStart.y][level.playerStart.x];
    expect([FRAME.GRASS_TOP, FRAME.GRASS_TOP_VAR]).toContain(top);
    const p = level.platforms[0];
    expect(frames[p.y][p.x]).toBe(FRAME.PLATFORM_L);
    expect(frames[p.y][p.x + 1]).toBe(FRAME.PLATFORM_M);
    expect(frames[p.y][p.x + p.w - 1]).toBe(FRAME.PLATFORM_R);
    expect(frames[0][10]).toBe(FRAME.EMPTY);
  });

  it('has three secret cards now, one vault card for later, and a boss', () => {
    expect(availableCards(level, aliensUnlockedBy(level.chapter))).toHaveLength(3);
    expect(lockedCards(level, aliensUnlockedBy(level.chapter)).map((c) => c.id)).toEqual(['ch1-card-vault', 'ch1-card-den']);
    expect(availableCards(level, ['heatblast', 'fourarms'])).toHaveLength(4);
    expect(entity('boss')).toHaveLength(1);
  });

  it('the cracked wall seals an open vault in the cliff face', () => {
    const [wall] = entity('crackedWall');
    for (let y = wall.y; y < wall.y + wall.h; y++) expect(cellAt(grid, wall.x, y), `wall row ${y}`).toBe(CELL.EMPTY);
    expect(cellAt(grid, wall.x - 1, wall.y + wall.h - 1)).toBe(CELL.EMPTY);
    expect(isSolidCell(cellAt(grid, wall.x, wall.y + wall.h))).toBe(true);
  });
});

describe('chapter 1 progression', () => {
  const boss = entity('boss')[0];
  const jammer = entity('jammer')[0];
  const cliffTop = (p: Pos) => p.x >= 102 && p.x <= 125 && p.y === 16;
  const inArena = (p: Pos) => p.x >= boss.triggerX && p.x < boss.arenaTo;

  it('is completable start to finish with Heatblast available', () => {
    expect(canReach(level, grid, start, inArena, HEATBLAST_CAPS)).toBe(true);
  });

  it('human Ben cannot get past the barricade tunnel on his own', () => {
    expect(canReach(level, grid, start, (p) => p.x >= 80, HUMAN_CAPS)).toBe(false);
  });

  it('the cliff requires the rocket jump', () => {
    const base: Pos = { x: 100, y: 23 };
    expect(canReach(level, grid, base, cliffTop, HUMAN_CAPS)).toBe(false);
    expect(canReach(level, grid, base, cliffTop, HEATBLAST_CAPS)).toBe(true);
  });

  it('the jammer ravine can be crossed as human Ben', () => {
    const entrance: Pos = { x: 128, y: 23 };
    expect(canReach(level, grid, entrance, (p) => p.x === jammer.x && p.y === jammer.y - 1, HUMAN_CAPS)).toBe(true);
  });

  it('the drone nest can be crossed as human Ben while the watch recharges', () => {
    const nest: Pos = { x: 182, y: 23 };
    expect(canReach(level, grid, nest, inArena, HUMAN_CAPS)).toBe(true);
  });

  it('every card can be reached with the right form', () => {
    const [ridge, creek, alcove] = availableCards(level, aliensUnlockedBy(level.chapter));
    const at = (c: { x: number; y: number }) => (p: Pos) => p.x === c.x && p.y === c.y - 1;
    expect(canReach(level, grid, start, at(ridge), HEATBLAST_CAPS)).toBe(true);
    expect(canReach(level, grid, { x: 92, y: 14 }, at(ridge), HUMAN_CAPS)).toBe(false);
    expect(canReach(level, grid, { x: 128, y: 23 }, at(creek), HUMAN_CAPS)).toBe(true);
    expect(canReach(level, grid, { x: 182, y: 23 }, at(alcove), HEATBLAST_CAPS)).toBe(true);
    expect(canReach(level, grid, { x: 182, y: 23 }, at(alcove), HUMAN_CAPS)).toBe(false);
  });

  it('the vault card needs Four Arms: no current form can get past the cracked wall', () => {
    const [vault] = lockedCards(level, aliensUnlockedBy(level.chapter));
    const at = (p: Pos) => p.x === vault.x && p.y === vault.y - 1;
    const smasher = { ...HEATBLAST_CAPS, canSmash: true };
    expect(canReach(level, grid, start, at, HEATBLAST_CAPS)).toBe(false);
    expect(canReach(level, grid, start, at, HUMAN_CAPS)).toBe(false);
    expect(canReach(level, grid, start, at, smasher)).toBe(true);
    expect(breaksCrackedWall('smash')).toBe(true);
    for (const kind of ['melee', 'fire', 'burst', 'rocket', 'reflect', 'transform'] as const) expect(breaksCrackedWall(kind)).toBe(false);
  });

  it("Wildmutt's den under the ridge opens only to senses", () => {
    const den = lockedCards(level, aliensUnlockedBy(level.chapter)).find((c) => c.id === 'ch1-card-den')!;
    expect(den.requires).toBe('wildmutt');
    const at = (p: Pos) => p.x === den.x && p.y === den.y - 1;
    expect(canReach(level, grid, start, at, HEATBLAST_CAPS)).toBe(false);
    expect(canReach(level, grid, start, at, { ...HEATBLAST_CAPS, canSmash: true })).toBe(false);
    expect(canReach(level, grid, start, at, { ...HEATBLAST_CAPS, canSense: true })).toBe(true);
  });

  it('every checkpoint is reachable', () => {
    for (const cp of entity('checkpoint')) {
      expect(canReach(level, grid, start, (p) => p.x === cp.x && p.y === cp.y - 1, HEATBLAST_CAPS), cp.id).toBe(true);
    }
  });
});
