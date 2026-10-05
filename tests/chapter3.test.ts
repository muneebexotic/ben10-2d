import { describe, expect, it } from 'vitest';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { buildCells, cellAt, type TileGrid } from '../src/levels/buildLevel';
import { CELL, isSolidCell } from '../src/levels/tiles';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { availableCards, countedCards, lockedCards } from '../src/levels/secrets';
import { getAlien } from '../src/aliens/registry';
import { pendingUnlocks } from '../src/systems/Unlocks';
import { checkpointsFor } from '../src/levels/checkpoints';

const HEATBLAST = getAlien('heatblast').reach;
const XLR8 = getAlien('xlr8').reach;
const FOURARMS = getAlien('fourarms').reach;
const WILDMUTT = getAlien('wildmutt').reach;
const STINKFLY = getAlien('stinkfly').reach;
const ALL: Capabilities[] = [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS, WILDMUTT, STINKFLY];

const level = CHAPTER_3;
const grid = buildCells(level);
/** The atrium bridge after it collapses. */
const collapsed: TileGrid = (() => {
  const g = buildCells(level);
  const c = level.story!.atrium!.collapse;
  for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) g.cells[y][x] = CELL.EMPTY;
  return g;
})();
const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
/** The level once Wildmutt has sniffed open the lockdown's vent. */
const ventOpen = { ...level, entities: level.entities.filter((e) => !(e.type === 'hiddenDoor' && e.id === 'ch3-lock-door')) };

function entity<T extends (typeof level.entities)[number]['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];
}
const card = (id: string) => entity('card').find((c) => c.id === id)!;
const grabs = (c: { x: number; y: number }, caps: Capabilities) => (p: Pos) => Math.abs(p.x - c.x) <= 1 && p.y >= c.y - 1 && p.y - c.y <= caps.jumpUp;
const standAt = (x: number, row: number) => (p: Pos) => p.x === x && p.y === row - 1;

describe('chapter 3 layout', () => {
  it('builds a grid of the declared size', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
  });

  it('the player starts standing in the plaza', () => {
    expect(isSolidCell(cellAt(grid, level.playerStart.x, level.playerStart.y))).toBe(true);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('checkpoints, smoothies and standing cards sit on a surface with open space above', () => {
    const floating = ['ch3-card-roof', 'ch3-card-bear', 'ch3-card-whale', 'ch3-card-vat', 'ch3-card-vent', 'ch3-card-egg'];
    const standing = level.entities.filter((e) => ['checkpoint', 'smoothy', 'card'].includes(e.type) && !('id' in e && floating.includes(e.id))) as Array<{ x: number; y: number; type: string }>;
    for (const e of standing) {
      expect(cellAt(grid, e.x, e.y) !== CELL.EMPTY, `${e.type} at ${e.x},${e.y} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${e.type} at ${e.x},${e.y} is buried`).not.toBe(CELL.GROUND);
    }
  });

  it('enemies start in open space inside the level', () => {
    const waves = entity('wave').flatMap((w) => w.spawns);
    for (const d of [...entity('drone'), ...waves]) expect(cellAt(grid, d.x, d.y), `flyer at ${d.x},${d.y}`).toBe(CELL.EMPTY);
    for (const m of entity('mutant')) {
      if (m.ceiling) {
        expect(isSolidCell(cellAt(grid, m.x, m.y)), `roach ceiling ${m.x},${m.y}`).toBe(true);
        expect(cellAt(grid, m.x, m.y + 1)).toBe(CELL.EMPTY);
      } else {
        expect(cellAt(grid, m.x, m.y) !== CELL.EMPTY, `mutant floor ${m.x},${m.y}`).toBe(true);
        expect(cellAt(grid, m.x, m.y - 1), `mutant ${m.x},${m.y}`).toBe(CELL.EMPTY);
      }
    }
  });

  it('Wildmutt and Stinkfly join at their story beats; a restart past a beat already has them', () => {
    const unlocks = level.story!.unlocks!;
    const before = ['heatblast', 'fourarms', 'xlr8'];
    expect(pendingUnlocks(unlocks, before, null)).toEqual(['wildmutt', 'stinkfly']);
    expect(pendingUnlocks(unlocks, before, 182)).toEqual(['stinkfly']);
    expect(pendingUnlocks(unlocks, before, 269)).toEqual([]);
  });

  it('counts eight cards: five this chapter, three waiting for later aliens', () => {
    expect(countedCards(level)).toHaveLength(8);
    const now = ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly'];
    expect(availableCards(level, now)).toHaveLength(5);
    expect(lockedCards(level, now).map((c) => c.id)).toEqual(['ch3-card-security', 'ch3-card-vent', 'ch3-card-vat']);
  });

  it('every story checkpoint exists on Hard for each set piece: the blackout, the atrium, the lockdown, the boss', () => {
    const hard = checkpointsFor(level, 'sparse').map((c) => c.id);
    for (const id of ['cp-dark', 'cp-atrium', 'cp-lockdown', 'cp-frog']) expect(hard).toContain(id);
  });
});

describe('chapter 3 progression', () => {
  it('anyone walks from the plaza through the Great Hall and the Hall of Mammals into the Night Gallery', () => {
    for (const caps of ALL) expect(canReach(level, grid, start, standAt(156, 30), caps)).toBe(true);
  });

  it('only a climber gets up the wall, and only senses open the gallery door', () => {
    const top = (p: Pos) => p.x >= 199 && p.x <= 222 && p.y === 13;
    expect(canReach(level, grid, { x: 186, y: 29 }, top, WILDMUTT)).toBe(true);
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS]) expect(canReach(level, grid, { x: 186, y: 29 }, top, caps)).toBe(false);
    // Stinkfly can fly up the wall, but the door stays shut without senses.
    expect(canReach(level, grid, { x: 186, y: 29 }, top, STINKFLY)).toBe(false);
  });

  it('the plinth alcove opens only to senses', () => {
    const c = card('ch3-card-dark');
    expect(canReach(level, grid, start, standAt(c.x, c.y), WILDMUTT)).toBe(true);
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS, STINKFLY]) expect(canReach(level, grid, start, standAt(c.x, c.y), caps)).toBe(false);
  });

  it('once the bridge falls, only Stinkfly crosses the atrium to the far balcony', () => {
    const bridge: Pos = { x: 225, y: 13 };
    const far = (p: Pos) => p.x >= 262 && p.x <= 275 && p.y === 13;
    expect(canReach(level, collapsed, bridge, far, STINKFLY)).toBe(true);
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS, WILDMUTT]) expect(canReach(level, collapsed, bridge, far, caps)).toBe(false);
  });

  it('the lockdown: each lock needs its own alien', () => {
    const entry: Pos = { x: 277, y: 23 };
    const pastVines = (p: Pos) => p.x >= 282 && p.x <= 287 && p.y === 23;
    const pastMoat = (p: Pos) => p.x >= 312 && p.x <= 314 && p.y === 23;
    const inRoom = (p: Pos) => p.x >= 316 && p.x <= 324 && p.y === 23;
    const inVent = (p: Pos) => p.x >= 326 && p.x <= 345 && p.y === 8;
    const pastPit = (p: Pos) => p.x >= 359 && p.x <= 368 && p.y === 9;
    const only = (from: Pos, goal: (p: Pos) => boolean, who: Capabilities, lvl = level) => {
      for (const caps of ALL) expect(canReach(lvl, grid, from, goal, caps), JSON.stringify(caps)).toBe(caps === who);
    };
    only(entry, pastVines, HEATBLAST);
    only({ x: 286, y: 23 }, pastMoat, XLR8);
    only({ x: 313, y: 23 }, inRoom, FOURARMS);
    only({ x: 320, y: 23 }, inVent, WILDMUTT);
    only({ x: 340, y: 8 }, pastPit, STINKFLY, ventOpen);
  });

  it('from the far ledge anyone drops into the lab and walks to KING CROAK', () => {
    const boss = entity('boss')[0];
    for (const caps of ALL) expect(canReach(level, grid, { x: 361, y: 9 }, (p) => p.x >= boss.triggerX && p.y === 29, caps)).toBe(true);
  });

  it('every card can be reached with the right form', () => {
    expect(canReach(level, grid, start, grabs(card('ch3-card-roof'), HEATBLAST), HEATBLAST)).toBe(true);
    expect(canReach(level, grid, start, grabs(card('ch3-card-roof'), HUMAN_CAPS), HUMAN_CAPS)).toBe(false);
    const egg = card('ch3-card-egg');
    expect(canReach(level, grid, start, standAt(egg.x, egg.y), FOURARMS)).toBe(true);
    for (const caps of [HUMAN_CAPS, HEATBLAST, XLR8, WILDMUTT, STINKFLY]) expect(canReach(level, grid, start, standAt(egg.x, egg.y), caps)).toBe(false);
    expect(canReach(level, grid, start, grabs(card('ch3-card-bear'), FOURARMS), FOURARMS)).toBe(true);
    expect(canReach(level, collapsed, { x: 225, y: 13 }, grabs(card('ch3-card-whale'), STINKFLY), STINKFLY)).toBe(true);
  });

  it('the later-alien cards are out of every current alien\'s reach', () => {
    // Sealed in a nook too small to stand in, and sunk at the bottom of the vat.
    for (const id of ['ch3-card-vent', 'ch3-card-vat']) {
      const c = card(id);
      for (const caps of ALL) expect(canReach(ventOpen, grid, { x: 340, y: 8 }, standAt(c.x, c.y), caps), id).toBe(false);
    }
  });
});
