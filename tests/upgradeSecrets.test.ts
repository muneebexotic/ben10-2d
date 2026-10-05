import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { buildCells } from '../src/levels/buildLevel';
import { cardInfo } from '../src/levels/cards';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { CHAPTER_2 } from '../src/levels/chapter2';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { canReach, HUMAN_CAPS, type Pos } from '../src/levels/reachability';
import { waitingSecrets } from '../src/levels/secrets';
import type { LevelData } from '../src/levels/types';

const UPGRADE = getAlien('upgrade').reach;
const OTHERS = [HUMAN_CAPS, ...['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly'].map((id) => getAlien(id).reach)];
const standAt = (x: number, row: number) => (p: Pos) => p.x === x && p.y === row - 1;

/** Upgrade opens one older secret in every Act 1 chapter. */
const CASES: Array<{ level: LevelData; card: string; from: Pos }> = [
  { level: CHAPTER_1, card: 'ch1-card-hatch', from: { x: 208, y: 23 } },
  { level: CHAPTER_2, card: 'ch2-card-garage', from: { x: 318, y: 23 } },
  { level: CHAPTER_3, card: 'ch3-card-security', from: { x: 320, y: 23 } },
];

describe('Upgrade opens older secrets', () => {
  for (const { level, card, from } of CASES) {
    const grid = buildCells(level);
    const c = level.entities.find((e) => e.type === 'card' && e.id === card);

    it(`${card}: behind a dead machine only Upgrade wakes`, () => {
      expect(c && c.type === 'card' && c.requires).toBe('upgrade');
      if (!c || c.type !== 'card') return;
      expect(canReach(level, grid, from, standAt(c.x, c.y), UPGRADE)).toBe(true);
      for (const caps of OTHERS) expect(canReach(level, grid, from, standAt(c.x, c.y), caps), JSON.stringify(caps)).toBe(false);
    });

    it(`${card}: has an album entry, a hint for players without Upgrade, and shows as SECRET WAITING once he's on the file`, () => {
      expect(cardInfo(card)).toBeDefined();
      expect(level.entities.some((e) => e.type === 'alienHint' && e.alien === 'upgrade')).toBe(true);
      expect(waitingSecrets(level, ['heatblast', 'upgrade'], []).map((s) => s.id)).toContain(card);
      expect(waitingSecrets(level, ['heatblast'], []).map((s) => s.id)).not.toContain(card);
    });
  }
});
