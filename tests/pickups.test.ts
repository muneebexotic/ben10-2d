import { describe, expect, it } from 'vitest';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { CHAPTER_2 } from '../src/levels/chapter2';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { CHAPTER_4 } from '../src/levels/chapter4';
import { buildCells } from '../src/levels/buildLevel';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import { allAliens } from '../src/aliens/registry';
import { checkpointsFor } from '../src/levels/checkpoints';
import type { LevelData } from '../src/levels/types';

/**
 * Every Mr. Smoothy cup in Chapters 1-4 can be picked up: from the checkpoint
 * before it (or the start), at least one form the chapter gives reaches it.
 * Cards have their own per-chapter tests (each needs a specific alien).
 */
const LEVELS: LevelData[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4];

function formsFor(level: LevelData): Capabilities[] {
  return [HUMAN_CAPS, ...allAliens().filter((a) => (a.unlockChapter ?? 1) <= level.chapter).map((a) => a.reach)];
}

/**
 * Set pieces that need several aliens in a row (the reachability model plays one form at a time; their own
 * tests check the chain): a cup inside one is checked from just past the lock in front of it.
 */
const PAST_LOCK: Record<string, Pos> = {
  // LOCKDOWN: past the Four Arms wall (lock 3), after the Heatblast vines and the XLR8 lock.
  'ch3@318,24': { x: 317, y: 23 },
};

/** Where a run can start before x: the last checkpoint (any difficulty) at or before it, or the level start. */
function startBefore(level: LevelData, x: number): Pos {
  const cps = [...checkpointsFor(level), ...level.entities.filter((e) => e.type === 'checkpoint')]
    .filter((c): c is Extract<typeof c, { type: 'checkpoint' }> => c.type === 'checkpoint' && c.x <= x)
    .sort((a, b) => b.x - a.x);
  const cp = cps[0];
  return cp ? { x: cp.x + 1, y: cp.y - 1 } : { x: level.playerStart.x, y: level.playerStart.y - 1 };
}

describe('every smoothie can be picked up', () => {
  for (const level of LEVELS) {
    it(`${level.name}: every cup is in reach of a form the chapter has`, () => {
      const grid = buildCells(level);
      const forms = formsFor(level);
      const cups = level.entities.filter((e): e is Extract<typeof e, { type: 'smoothy' }> => e.type === 'smoothy');
      expect(cups.length).toBeGreaterThan(0);
      const missed: string[] = [];
      for (const cup of cups) {
        const start = PAST_LOCK[`${level.id}@${cup.x},${cup.y}`] ?? startBefore(level, cup.x);
        const ok = forms.some((caps) => canReach(level, grid, start, (p) => Math.abs(p.x - cup.x) <= 1 && p.y >= cup.y - 2 && p.y - cup.y <= caps.jumpUp, caps));
        if (!ok) missed.push(`${cup.x},${cup.y} (from ${start.x},${start.y})`);
      }
      expect(missed).toEqual([]);
    });
  }
});
