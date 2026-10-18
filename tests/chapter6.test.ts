import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { nextCharm, shuffledCharms } from '../src/entities/bosses/hex/rules';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CHAPTER_6 } from '../src/levels/chapter6';
import { checkpointsFor } from '../src/levels/checkpoints';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { availableCards, countedCards, lockedCards } from '../src/levels/secrets';
import { CELL } from '../src/levels/tiles';
import {
  flooded,
  GEAR_LAYOUT,
  gearSpin,
  newPipeBoard,
  openings,
  PENDULUM,
  pendulumAngle,
  pinDrops,
  PIPE_LAYOUT,
  pipeHint,
  pipesSolved,
  turnPipe,
} from '../src/scenes/engine/rules';
import { pendingUnlocks } from '../src/systems/Unlocks';

const reach = (id: string) => getAlien(id).reach;
const GREYMATTER = reach('greymatter');
const ALL: Capabilities[] = [HUMAN_CAPS, ...['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade', 'diamondhead', 'ghostfreak'].map(reach), GREYMATTER];
const BEFORE_IDS = ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly', 'upgrade', 'ghostfreak', 'diamondhead'];

const level = CHAPTER_6;
const grid = buildCells(level);
const story = level.story!;
const magic = story.magic!;

function entity<T extends (typeof level.entities)[number]['type']>(type: T) {
  return level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];
}
const card = (id: string) => entity('card').find((c) => c.id === id)!;
const cp = (id: string) => entity('checkpoint').find((c) => c.id === id)!;
const boss = entity('boss')[0];
const at = (id: string): Pos => ({ x: cp(id).x, y: cp(id).y - 1 });
const pastX = (x: number) => (p: Pos) => p.x >= x;

describe('chapter 6 layout', () => {
  it('builds a grid of the declared size, Ben starting on the seafront', () => {
    expect(grid.cells).toHaveLength(level.height);
    expect(grid.cells[0]).toHaveLength(level.width);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y)).not.toBe(CELL.EMPTY);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('checkpoints, chai and juice stalls sit on a surface with open space above', () => {
    for (const e of [...entity('checkpoint'), ...entity('smoothy')]) {
      const name = `${e.type} ${'id' in e ? e.id : ''} at ${e.x},${e.y}`;
      expect(cellAt(grid, e.x, e.y) !== CELL.EMPTY || level.platforms.some((p) => e.x >= p.x && e.x < p.x + p.w && p.y === e.y), `${name} has no surface`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1), `${name} is buried`).not.toBe(CELL.GROUND);
    }
    // Mr. Smoothy has no branch in Karachi: the stalls are chai and juice.
    expect(entity('smoothy').every((s) => s.look === 'chai' || s.look === 'juice')).toBe(true);
  });

  it('walking foes stand on floors and the kites fly in the open', () => {
    for (const m of entity('magic')) {
      const name = `${m.kind} at ${m.x},${m.y}`;
      if (m.kind === 'kite' || (m.kind === 'gargoyle' && cellAt(grid, m.x, m.y) === CELL.EMPTY)) {
        expect(cellAt(grid, m.x, m.y), name).toBe(CELL.EMPTY);
        continue;
      }
      expect(cellAt(grid, m.x, m.y) !== CELL.EMPTY || level.platforms.some((p) => m.x >= p.x && m.x < p.x + p.w && p.y === m.y), `${name} has no floor`).toBe(true);
      expect(cellAt(grid, m.x, m.y - 1), name).not.toBe(CELL.GROUND);
    }
  });

  it('the three locals stand at the fair, before the palace gate', () => {
    const locals = entity('local');
    expect(locals.map((l) => l.who).sort()).toEqual(['rafiq', 'rauf', 'zain']);
    for (const l of locals) expect(l.x).toBeLessThan(magic.gate.triggerX);
  });

  it('counts seven cards: six this chapter, one waiting for gills (with a hint)', () => {
    expect(countedCards(level)).toHaveLength(7);
    const now = [...BEFORE_IDS, 'greymatter'];
    expect(availableCards(level, now)).toHaveLength(6);
    expect(lockedCards(level, now).map((c) => c.id)).toEqual(['ch6-card-cistern']);
    expect(entity('alienHint').some((h) => h.alien === card('ch6-card-cistern').requires)).toBe(true);
    // The vent card is one only Grey Matter fits in to.
    expect(card('ch6-card-vent').requires).toBe('greymatter');
  });

  it('every set piece has its own checkpoint on Hard: the cage, the Engine, the Wrap, the boss', () => {
    const hard = checkpointsFor(level, 'sparse').map((c) => c.id);
    for (const id of ['cp-cage', 'cp-engine', 'cp-wrap', 'cp-towertop']) expect(hard).toContain(id);
    expect(cp('cp-cage').x).toBeLessThan(magic.cage.triggerX);
    expect(cp('cp-engine').x).toBeLessThan(magic.engine.ventX);
    expect(cp('cp-wrap').x).toBeLessThan(magic.tower.x);
    expect(cp('cp-wrap').x).toBeGreaterThan(magic.engine.ventX);
    expect(magic.tower.checkpoint).toBe('cp-towertop');
    expect(cp('cp-towertop').x).toBeLessThan(boss.triggerX);
    expect(boss.arenaFrom).toBeLessThanOrEqual(cp('cp-towertop').x);
  });

  it("only Easy also checkpoints the Engine's halfway point", () => {
    expect(checkpointsFor(level, 'frequent').map((c) => c.id)).toContain('cp-engine-2');
    expect(checkpointsFor(level, 'normal').map((c) => c.id)).not.toContain('cp-engine-2');
    expect(cp('cp-engine-2').hidden).toBe(true);
  });

  it('Grey Matter joins in the cage, and a restart past it already has him', () => {
    expect(pendingUnlocks(story.unlocks!, BEFORE_IDS, null)).toEqual(['greymatter']);
    expect(pendingUnlocks(story.unlocks!, BEFORE_IDS, cp('cp-tunnel').x)).toEqual([]);
    expect(story.unlocks!.every((u) => u.scripted)).toBe(true);
    expect(magic.cage.alien).toBe('greymatter');
    expect(story.unlocks![0].x).toBe(magic.cage.triggerX);
  });

  it("Gwen learns her spells in order, each in its own part of the level", () => {
    expect(magic.lessons.map((l) => l.spell)).toEqual(['shield', 'stun', 'reveal']);
    const xs = magic.lessons.map((l) => l.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(xs[0]).toBeGreaterThan(magic.gate.gateX);
    expect(xs[2]).toBeLessThan(magic.cage.triggerX);
  });

  it('the act ends here, after the outro', () => {
    expect(story.actEnd).toBe(2);
    expect(story.outro?.length).toBeGreaterThan(0);
  });
});

describe('chapter 6 progression', () => {
  it('anyone walks the fair to the palace gate, and through it once the Rustbucket has rammed it', () => {
    const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
    for (const caps of ALL) expect(canReach(level, grid, start, pastX(magic.gate.triggerX), caps)).toBe(true);
    for (const caps of ALL) expect(canReach(level, grid, at('cp-palace'), pastX(cp('cp-hall').x), caps)).toBe(true);
  });

  it('anyone gets from the hall through the library to the cellars, and past the illusions to the cage', () => {
    for (const caps of ALL) {
      expect(canReach(level, grid, at('cp-hall'), pastX(cp('cp-cellar').x), caps)).toBe(true);
      expect(canReach(level, grid, at('cp-cellar'), pastX(cp('cp-cage').x), caps)).toBe(true);
    }
  });

  it('only Grey Matter walks out of the cage (the bars are a tile apart)', () => {
    const cell: Pos = { x: magic.cage.toX - 1, y: magic.cage.floor - 1 };
    for (const caps of ALL) expect(canReach(level, grid, cell, pastX(cp('cp-tunnel').x), caps)).toBe(caps === GREYMATTER);
  });

  it('anyone gets from the tunnel to the Engine, and from there round the tower to the boss', () => {
    for (const caps of ALL) {
      expect(canReach(level, grid, at('cp-tunnel'), pastX(cp('cp-engine').x), caps)).toBe(true);
      expect(canReach(level, grid, at('cp-engine'), pastX(boss.triggerX), caps)).toBe(true);
    }
  });

  it("the tunnel's vent card is Grey Matter's alone", () => {
    // In the crawlspace over the tunnel's roof (the roof is between it and anyone jumping below).
    const c = card('ch6-card-vent');
    const inVent = (p: Pos) => p.y === c.y - 1 && Math.abs(p.x - c.x) <= 1;
    for (const caps of ALL) expect(canReach(level, grid, at('cp-tunnel'), inVent, caps)).toBe(caps === GREYMATTER);
  });
});

describe('the Spell Engine', () => {
  it('the mana pipes start scrambled, and turning every path tile to its place sends the mana down the drain', () => {
    const b = newPipeBoard();
    expect(pipesSolved(b)).toBe(false);
    for (const i of PIPE_LAYOUT.path) {
      const [kind, rot] = PIPE_LAYOUT.tiles[i];
      const want = openings({ kind, rot }).sort().join();
      for (let k = 0; k < 4 && openings(b.tiles[i]).sort().join() !== want; k++) turnPipe(b, i);
    }
    expect(pipesSolved(b)).toBe(true);
    expect(pipeHint(b)).toBeNull();
  });

  it('nothing on the path starts in place, and the hint always points at the first wrong tile on it', () => {
    for (const i of PIPE_LAYOUT.path) expect(PIPE_LAYOUT.scramble[i] % 4).not.toBe(0);
    const b = newPipeBoard();
    expect(pipeHint(b)).toBe(PIPE_LAYOUT.path[0]);
    expect(flooded(b).size).toBeLessThan(PIPE_LAYOUT.path.length);
  });

  it('the train turns on any dead-end slot, and jams only on the slot that closes a ring of three', () => {
    const filled = new Set(GEAR_LAYOUT.filled);
    expect(gearSpin(filled).jammed).toBe(false);
    for (const slot of GEAR_LAYOUT.empty) {
      const spin = gearSpin(new Set([...filled, slot]));
      expect(spin.jammed, slot).toBe(slot === GEAR_LAYOUT.answer);
    }
    // Meshed gears turn opposite ways.
    const ok = gearSpin(filled);
    for (const [a, b] of GEAR_LAYOUT.mesh) if (ok.spin.has(a) && ok.spin.has(b)) expect(ok.spin.get(a)).toBe(-ok.spin.get(b)!);
  });

  it('the pendulum lets a pin drop only near the middle of its swing, and the last window is still fair', () => {
    expect(pinDrops(pendulumAngle(0, PENDULUM.periodMs), PENDULUM.windowRad)).toBe(true);
    expect(pinDrops(pendulumAngle(PENDULUM.periodMs / 4, PENDULUM.periodMs), PENDULUM.windowRad)).toBe(false);
    const lastWindow = PENDULUM.windowRad * PENDULUM.tighten ** (PENDULUM.pins - 1);
    const lastPeriod = PENDULUM.periodMs * PENDULUM.quicken ** (PENDULUM.pins - 1);
    // Time the bob spends inside the window each pass: over a tenth of a second even at the end.
    const passMs = (2 * Math.asin(lastWindow / PENDULUM.amplitude) * lastPeriod) / (2 * Math.PI);
    expect(passMs).toBeGreaterThan(100);
  });
});

describe('HEX AND CHARMCASTER', () => {
  it('Hex uses each of the four Charms once before any repeats', () => {
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const bag = shuffledCharms(rnd);
    expect([...bag].sort()).toEqual(['fire', 'lightning', 'stone', 'wind']);
    const drawn = Array.from({ length: 8 }, () => nextCharm(bag, rnd));
    expect(new Set(drawn.slice(0, 4)).size).toBe(4);
    expect(new Set(drawn.slice(4)).size).toBe(4);
  });
});
