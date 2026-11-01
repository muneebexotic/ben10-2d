import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { CH7_BEATS, CH7_LATE, CH7_OPENING, CH7_REACTOR } from '../src/config/chapter7';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CHAPTER_7 } from '../src/levels/chapter7';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { CELL } from '../src/levels/tiles';
import type { LevelData } from '../src/levels/types';
import { pendingUnlocks } from '../src/systems/Unlocks';

const level = CHAPTER_7;
const grid = buildCells(level);
const story = level.story!;
const plan = story.plumber!;

type Entity = (typeof level.entities)[number];
function entity<T extends Entity['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<Entity, { type: T }>[];
}
const byId = (type: Entity['type'], id: string) => level.entities.find((e) => e.type === type && 'id' in e && e.id === id) as (Entity & { x: number; y: number }) | undefined;
const tank = (id: string) => entity('tank').find((t) => t.id === id)!;

describe('chapter 7 layout', () => {
  it('builds a grid of the declared size, Ben starting on the docking bay floor', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y)).not.toBe(CELL.EMPTY);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('checkpoints and smoothies sit on a surface with open space above', () => {
    for (const e of [...entity('checkpoint'), ...entity('smoothy')]) {
      const name = `${e.type} ${'id' in e ? e.id : ''} at ${e.x},${e.y}`;
      expect(cellAt(grid, e.x, e.y) !== CELL.EMPTY || level.platforms.some((p) => e.x >= p.x && e.x < p.x + p.w && p.y === e.y), `${name} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${name} is buried`).not.toBe(CELL.GROUND);
    }
  });

  it('everything the story plan names is in the level', () => {
    for (const id of [plan.dock.hatch, plan.ring.hubHatch, ...plan.reactor.hatches]) expect(byId('hatch', id), id).toBeDefined();
    for (const id of [plan.reactor.tank, plan.moonPool.tank]) expect(byId('tank', id), id).toBeDefined();
    for (const id of plan.pumps) expect(byId('pump', id), id).toBeDefined();
    expect(getAlien(plan.reactor.alien).id).toBe('ripjaws');
    expect(story.unlocks?.some((u) => u.alien === plan.reactor.alien)).toBe(true);
  });

  it("the story's beats come in walking order", () => {
    const x = (type: Entity['type'], id: string) => byId(type, id)!.x;
    const order = [
      level.playerStart.x,
      plan.ring.revealX,
      x('hatch', plan.dock.hatch),
      plan.ring.lockerX,
      plan.ring.lockdownX,
      plan.ring.hubX,
      x('hatch', plan.ring.hubHatch),
      plan.glimpse.triggerX,
      plan.glimpse.windowX,
      x('hatch', plan.reactor.hatches[0]),
      plan.reactor.triggerX,
      plan.reactor.kevinX,
      plan.reactor.glass.x,
      CH7_LATE.pumpHallX,
      plan.containment.maxX,
      plan.containment.cellX,
      entity('boss')[0].triggerX,
    ];
    for (let i = 1; i < order.length; i++) expect(order[i], `beat ${i}`).toBeGreaterThan(order[i - 1]);
    expect(CH7_LATE.deepBreath.fromX).toBeLessThan(CH7_LATE.deepBreath.toX);
    expect(CH7_LATE.deepBreath.toX).toBeLessThanOrEqual(plan.reactor.triggerX);
  });

  it("the reactor's glass is solid until Ripjaws smashes it, and its water reaches the sea once he does", () => {
    const g = plan.reactor.glass;
    for (let y = g.y; y < g.y + g.h; y++) expect(cellAt(grid, g.x, y), `glass ${g.x},${y}`).not.toBe(CELL.EMPTY);
    const reactor = tank(plan.reactor.tank);
    const sea = entity('tank').find((t) => t.sea)!;
    // The reactor's tank reaches into the glass column, and the sea starts right after it.
    expect(reactor.x + reactor.w - 1).toBe(g.x);
    expect(sea.x).toBe(g.x + 1);
    expect(plan.reactor.floodTo).toBeGreaterThanOrEqual(reactor.top);
    expect(plan.reactor.floodTo).toBeLessThan(g.y);
  });

  it('the opening plays its beats in order and docks last', () => {
    const O = CH7_OPENING;
    const order = [O.walkFrom, O.scanAt, O.riseAt, O.boardAt, O.descendAt, O.pings[0], O.pings[1], O.pings[2], O.lampsAt, O.titleAt, O.dockAt];
    for (let i = 1; i < order.length; i++) expect(order[i], `step ${i}`).toBeGreaterThan(order[i - 1]);
    expect(O.resolveAt).toBe(O.pings[1]);
    expect(O.descendAt + O.descendMs).toBeLessThanOrEqual(O.dockAt);
    expect(O.hdSteps[O.hdSteps.length - 1]).toBe(1);
  });

  it('the family and Kevin move at speeds their drawn cycles keep up with', () => {
    // Twice the gait is the most a cycle plays (config/cartoon/gait.ts): Max walks 36, Gwen runs 63, Kevin runs 73.
    expect(CH7_BEATS.ring.maxHurry).toBeLessThanOrEqual(72);
    expect(CH7_LATE.max.speed).toBeLessThanOrEqual(72);
    expect(CH7_REACTOR.glimpse.speed).toBeLessThanOrEqual(146);
  });
});

describe('chapter 7 reachability (every form swims the base\'s tanks)', () => {
  // The tanks as water at their fullest, the doors open (the story opens the hatches, the valve and pumps level the
  // water for the pressure doors) and the glass gone (Ripjaws smashes it before the open sea).
  const swimLevel: LevelData = {
    ...level,
    entities: level.entities.filter((e) => e.type !== 'pressureDoor' && e.type !== 'hatch'),
    water: entity('tank').map((t) => ({ x: t.x, w: t.w, surface: t.top, depth: t.bottom - t.top })),
  };
  const swimGrid = buildCells(level);
  const g = plan.reactor.glass;
  for (let y = g.y; y < g.y + g.h; y++) swimGrid.cells[y][g.x] = CELL.EMPTY;
  // A door is the wall between two rooms while it's shut (Doors fills and clears its column).
  for (const d of [...entity('pressureDoor'), ...entity('hatch')]) for (let y = d.y; y < d.y + d.h; y++) swimGrid.cells[y][d.x] = CELL.EMPTY;
  const forms = ['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade', 'diamondhead', 'ghostfreak', 'greymatter', 'ripjaws'].map((id) => getAlien(id).reach);
  const ALL: Capabilities[] = [HUMAN_CAPS, ...forms].map((c) => ({ ...c, canSwim: true }));
  const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
  const reachable = (goal: Pos) => ALL.some((caps) => canReach(swimLevel, swimGrid, start, (p) => p.x === goal.x && Math.abs(p.y - goal.y) <= 1, caps));

  it('every checkpoint can be reached from the start', () => {
    for (const cp of entity('checkpoint')) expect(reachable({ x: cp.x, y: cp.y - 1 }), cp.id).toBe(true);
  });

  it('every card for the aliens Ben has can be reached', () => {
    for (const c of entity('card').filter((c) => !c.requires)) expect(reachable({ x: c.x, y: c.y - 1 }), c.id).toBe(true);
  });
});

describe('ripjaws joins at the reactor', () => {
  it('stays off the dial until the reactor, and is on it for a run resumed past it', () => {
    const unlocks = story.unlocks ?? [];
    expect(pendingUnlocks(unlocks, [], null)).toContain('ripjaws');
    expect(pendingUnlocks(unlocks, [], plan.reactor.triggerX - 10)).toContain('ripjaws');
    expect(pendingUnlocks(unlocks, [], byId('checkpoint', 'cp-sea')!.x)).not.toContain('ripjaws');
  });
});
