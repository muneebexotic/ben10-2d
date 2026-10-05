import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CHAPTER_4 } from '../src/levels/chapter4';
import { checkpointsFor } from '../src/levels/checkpoints';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { availableCards, countedCards, lockedCards } from '../src/levels/secrets';
import { CELL, isSolidCell } from '../src/levels/tiles';
import { pendingUnlocks } from '../src/systems/Unlocks';

const HEATBLAST = getAlien('heatblast').reach;
const XLR8 = getAlien('xlr8').reach;
const FOURARMS = getAlien('fourarms').reach;
const WILDMUTT = getAlien('wildmutt').reach;
const STINKFLY = getAlien('stinkfly').reach;
const UPGRADE = getAlien('upgrade').reach;
const ACT1: Capabilities[] = [HUMAN_CAPS, HEATBLAST, XLR8, FOURARMS, WILDMUTT, STINKFLY];
const ALL: Capabilities[] = [...ACT1, UPGRADE];
const ACT1_IDS = ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly'];

const level = CHAPTER_4;
const grid = buildCells(level);
const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };

function entity<T extends (typeof level.entities)[number]['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];
}
const card = (id: string) => entity('card').find((c) => c.id === id)!;
const standAt = (x: number, row: number) => (p: Pos) => p.x === x && p.y === row - 1;
const grabs = (c: { x: number; y: number }, caps: Capabilities) => (p: Pos) => Math.abs(p.x - c.x) <= 1 && p.y >= c.y - 1 && p.y - c.y <= caps.jumpUp;
/** Only `who` (one or more) can get from `from` to `goal`. */
function only(from: Pos, goal: (p: Pos) => boolean, who: Capabilities[], pool: Capabilities[] = ALL): void {
  for (const caps of pool) expect(canReach(level, grid, from, goal, caps), JSON.stringify(caps)).toBe(who.includes(caps));
}

describe('chapter 4 layout', () => {
  it('builds a grid of the declared size, the player starting on Main Street', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
    expect(isSolidCell(cellAt(grid, level.playerStart.x, level.playerStart.y))).toBe(true);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('checkpoints, smoothies and standing cards sit on a surface with open space above', () => {
    const floating = ['ch4-card-sign', 'ch4-card-sumo'];
    const standing = level.entities.filter((e) => ['checkpoint', 'smoothy', 'card'].includes(e.type) && !('id' in e && floating.includes(e.id))) as Array<{ x: number; y: number; type: string; id?: string }>;
    for (const e of standing) {
      expect(cellAt(grid, e.x, e.y) !== CELL.EMPTY, `${e.type} ${e.id ?? ''} at ${e.x},${e.y} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${e.type} ${e.id ?? ''} at ${e.x},${e.y} is buried`).not.toBe(CELL.GROUND);
    }
  });

  it('robots stand on floors, turrets on floors or under ceilings, and every machine is inside the level', () => {
    for (const s of entity('robot')) {
      expect(cellAt(grid, s.x, s.y) !== CELL.EMPTY, `robot floor ${s.x},${s.y}`).toBe(true);
      expect(cellAt(grid, s.x, s.y - 1), `robot ${s.x},${s.y}`).toBe(CELL.EMPTY);
    }
    for (const t of entity('turret')) {
      if (t.ceiling) expect(isSolidCell(cellAt(grid, t.x, t.y)), `ceiling turret ${t.id}`).toBe(true);
      else expect(cellAt(grid, t.x, t.y) !== CELL.EMPTY, `turret floor ${t.id}`).toBe(true);
    }
    for (const e of [...entity('techDoor'), ...entity('lift'), ...entity('cabinet'), ...entity('cart')]) {
      expect(e.x >= 0 && e.x < level.width, `machine at ${e.x}`).toBe(true);
    }
  });

  it('counts eight cards: five this chapter, three waiting for later aliens', () => {
    expect(countedCards(level)).toHaveLength(8);
    const now = [...ACT1_IDS, 'upgrade'];
    expect(availableCards(level, now)).toHaveLength(5);
    expect(lockedCards(level, now).map((c) => c.id).sort()).toEqual(['ch4-card-claw', 'ch4-card-laser', 'ch4-card-sealed']);
    for (const id of ['ch4-card-claw', 'ch4-card-laser', 'ch4-card-sealed']) {
      const c = card(id);
      expect(level.entities.some((e) => e.type === 'alienHint' && e.alien === c.requires), `${id} has a hint`).toBe(true);
    }
  });

  it('every set piece has its own checkpoint on Hard: the lair, the line, the turn, the boss', () => {
    const hard = checkpointsFor(level, 'sparse').map((c) => c.id);
    for (const id of ['cp-lair', 'cp-line', 'cp-turn', 'cp-kevin']) expect(hard).toContain(id);
    const story = level.story!;
    const cp = (id: string) => entity('checkpoint').find((c) => c.id === id)!.x;
    // Each one sits just before its set piece.
    expect(cp('cp-lair')).toBeLessThan(story.lair!.triggerX);
    expect(cp('cp-turn')).toBeLessThan(story.absorb!.triggerX);
    expect(cp('cp-kevin')).toBeLessThan(entity('boss')[0].triggerX);
  });

  it('Upgrade joins in the LASER LAIR; a restart past it already has him', () => {
    const unlocks = level.story!.unlocks!;
    expect(pendingUnlocks(unlocks, ACT1_IDS, null)).toEqual(['upgrade']);
    expect(pendingUnlocks(unlocks, ACT1_IDS, 164)).toEqual([]);
    expect(unlocks[0].scripted).toBe(true);
  });

  it("the set pieces' geometry is consistent: the seal behind the trigger, Kevin inside the turn's walls, the hunt before the hall", () => {
    const s = level.story!;
    expect(s.lair!.fromX).toBeLessThan(s.lair!.triggerX);
    expect(s.lair!.kevinX).toBeLessThan(s.lair!.fromX);
    expect(s.absorb!.kevinX).toBeGreaterThan(s.absorb!.triggerX);
    expect(s.absorb!.kevinX).toBeLessThan(s.absorb!.toX);
    expect(s.drain!.triggerX).toBeGreaterThan(s.drain!.fromX);
    expect(s.hunt!.toX).toBeLessThanOrEqual(entity('boss')[0].triggerX);
    // The turn's exit is the shutter Kevin shorts out.
    expect(entity('techDoor').some((d) => d.x >= s.absorb!.toX && d.x <= s.absorb!.exitX)).toBe(true);
  });
});

describe('chapter 4 progression', () => {
  const lairIn: Pos = { x: level.story!.lair!.triggerX + 1, y: level.story!.lair!.floor - 1 };

  it('anyone walks from Main Street through the GAME ZONE to the LASER LAIR', () => {
    for (const caps of ALL) expect(canReach(level, grid, start, (p) => p.x === lairIn.x && p.y === lairIn.y, caps)).toBe(true);
  });

  it("only Upgrade gets out of the lair (the shutter's keypad is dead)", () => {
    only(lairIn, (p) => p.x >= 162 && p.x <= 170, [UPGRADE]);
  });

  it('only Upgrade rides the maintenance cart through the barricade', () => {
    only({ x: 263, y: 32 }, (p) => p.x >= 297 && p.x <= 302, [UPGRADE]);
  });

  it('the power depot: Upgrade takes the lift or the shutter; flyers can go over the top; walkers are stuck', () => {
    const boss = entity('boss')[0];
    const hall = (p: Pos) => p.x >= boss.triggerX && p.y === (boss.floor ?? 33) - 1;
    expect(canReach(level, grid, { x: 337, y: 32 }, hall, UPGRADE)).toBe(true);
    for (const caps of [HUMAN_CAPS, XLR8, FOURARMS]) expect(canReach(level, grid, { x: 337, y: 32 }, hall, caps), JSON.stringify(caps)).toBe(false);
  });

  it('the lair catwalk card: Upgrade rides the dead lift up (flyers can reach it too); walkers cannot', () => {
    const c = card('ch4-card-lair');
    expect(canReach(level, grid, lairIn, grabs(c, UPGRADE), UPGRADE)).toBe(true);
    for (const caps of [HUMAN_CAPS, XLR8, FOURARMS]) expect(canReach(level, grid, lairIn, grabs(c, caps), caps), JSON.stringify(caps)).toBe(false);
  });

  it("the depot's cracked wall needs Four Arms (and Upgrade to get that far)", () => {
    const c = card('ch4-card-depot');
    // From past the depot's shutter, only Four Arms breaks in.
    const pastDoor: Pos = { x: 360, y: 32 };
    only(pastDoor, standAt(c.x, c.y), [FOURARMS], ACT1);
  });

  it('behind the band stage only senses find the door', () => {
    const c = card('ch4-card-stage');
    only({ x: 94, y: 29 }, standAt(c.x, c.y), [WILDMUTT], ACT1);
  });

  it('the rooftop sign card needs flight or a rocket jump', () => {
    const c = card('ch4-card-sign');
    for (const caps of [HEATBLAST, STINKFLY]) expect(canReach(level, grid, start, grabs(c, caps), caps), JSON.stringify(caps)).toBe(true);
    for (const caps of [HUMAN_CAPS, XLR8, FOURARMS]) expect(canReach(level, grid, start, grabs(c, caps), caps), JSON.stringify(caps)).toBe(false);
  });
});
