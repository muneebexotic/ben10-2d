import { describe, expect, it } from 'vitest';
import { TRAINING_ARENA } from '../src/levels/training';
import { buildCells, cellAt } from '../src/levels/buildLevel';
import { CELL, isSolidCell } from '../src/levels/tiles';
import { canReach, HUMAN_CAPS, type Pos } from '../src/levels/reachability';
import { allAliens, getAlien } from '../src/aliens/registry';
import { DpsMeter, formatDamage } from '../src/systems/DpsMeter';
import { TRAINING_ENEMIES } from '../src/systems/TrainingState';
import { getLevel } from '../src/levels/registry';
import { TRACKS } from '../src/systems/audio/Music';

const level = TRAINING_ARENA;
const grid = buildCells(level);
const start: Pos = { x: level.playerStart.x, y: level.playerStart.y - 1 };
const entity = <T extends (typeof level.entities)[number]['type']>(type: T) =>
  level.entities.filter((e) => e.type === type) as Extract<(typeof level.entities)[number], { type: T }>[];

describe('training arena', () => {
  it('is registered as a level outside the story', () => {
    expect(getLevel('training')).toBe(level);
    expect(level.chapter).toBe(0);
    expect(level.theme).toBe('sim');
  });

  it('starts Ben on solid ground', () => {
    expect(isSolidCell(cellAt(grid, level.playerStart.x, level.playerStart.y))).toBe(true);
    expect(cellAt(grid, level.playerStart.x, level.playerStart.y - 1)).toBe(CELL.EMPTY);
  });

  it('has a dummy, boulders and a self-repairing cracked wall', () => {
    expect(entity('dummy')).toHaveLength(1);
    expect(entity('boulder').length).toBeGreaterThanOrEqual(2);
    const [wall] = entity('crackedWall');
    expect(wall.rebuildMs).toBeGreaterThan(0);
    for (let y = wall.y; y < wall.y + wall.h; y++) expect(cellAt(grid, wall.x, y)).toBe(CELL.EMPTY);
  });

  it('boulders and the dummy stand on solid surfaces', () => {
    for (const e of [...entity('boulder'), ...entity('dummy')]) {
      expect(isSolidCell(cellAt(grid, e.x, e.y)), `${e.type} at ${e.x}`).toBe(true);
      expect(cellAt(grid, e.x, e.y - 1)).toBe(CELL.EMPTY);
    }
  });

  it('every form can reach the dummy and the smash zone', () => {
    const dummy = entity('dummy')[0];
    for (const caps of [HUMAN_CAPS, ...allAliens().map((a) => a.reach)]) {
      expect(canReach(level, grid, start, (p) => Math.abs(p.x - dummy.x) <= 1 && p.y === dummy.y - 1, caps)).toBe(true);
      expect(canReach(level, grid, start, (p) => p.x >= 82 && p.x <= 95, caps)).toBe(true);
    }
  });

  it('the trench never traps anyone', () => {
    expect(canReach(level, grid, { x: 64, y: 26 }, (p) => p.x >= 70, HUMAN_CAPS)).toBe(true);
  });

  it('XLR8 runs the pool; Four Arms and human Ben cannot cross it (Heatblast can rocket via the platform)', () => {
    const farBank = (p: Pos) => p.x <= 3 && p.y === 23;
    expect(canReach(level, grid, start, farBank, getAlien('xlr8').reach)).toBe(true);
    expect(canReach(level, grid, start, farBank, getAlien('heatblast').reach)).toBe(true);
    expect(canReach(level, grid, start, farBank, getAlien('fourarms').reach)).toBe(false);
    expect(canReach(level, grid, start, farBank, HUMAN_CAPS)).toBe(false);
  });

  it('can spawn every enemy type, including the two new ones', () => {
    expect(TRAINING_ENEMIES.map((e) => e.kind)).toEqual(['scout', 'striker', 'gunner', 'armored', 'hornet']);
  });
});

describe('dummy damage meter', () => {
  it('totals hits and averages damage per second over the burst', () => {
    const m = new DpsMeter(3000);
    m.add(0, 3);
    m.add(500, 3);
    m.add(2000, 4);
    expect(m.total).toBe(10);
    expect(m.hits).toBe(3);
    expect(m.dps()).toBeCloseTo(5);
  });

  it('a single hit reads as damage over one second, not infinity', () => {
    const m = new DpsMeter(3000);
    m.add(100, 6);
    expect(m.dps()).toBe(6);
  });

  it('a pause starts a new burst', () => {
    const m = new DpsMeter(1000);
    m.add(0, 5);
    expect(m.active(500)).toBe(true);
    m.add(5000, 2);
    expect(m.total).toBe(2);
    expect(m.active(6500)).toBe(false);
  });

  it('formats damage numbers', () => {
    expect(formatDamage(3)).toBe('3');
    expect(formatDamage(2.5)).toBe('2.5');
    expect(formatDamage(0.15)).toBe('0.15');
    expect(formatDamage(12.6)).toBe('13');
  });
});

describe('music', () => {
  it('every track has whole bars for every part', () => {
    for (const [name, track] of Object.entries(TRACKS)) {
      const steps = track.bars * 16;
      expect(track.bass.length, name).toBe(steps);
      if (track.arp.length) expect(track.arp.length, name).toBe(steps);
      if (track.lead.length) expect(track.lead.length, name).toBe(steps);
    }
  });
});
