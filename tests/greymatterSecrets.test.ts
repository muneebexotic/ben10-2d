import { describe, expect, it } from 'vitest';
import { getAlien } from '../src/aliens/registry';
import { buildCells } from '../src/levels/buildLevel';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { CHAPTER_4 } from '../src/levels/chapter4';
import { CHAPTER_5 } from '../src/levels/chapter5';
import { CHAPTER_6 } from '../src/levels/chapter6';
import { canReach, HUMAN_CAPS, type Capabilities, type Pos } from '../src/levels/reachability';
import type { LevelData } from '../src/levels/types';

/**
 * The secrets the earlier chapters left for Grey Matter (Chapter 6): each card
 * sits somewhere only a body a tile high gets into, and every other form
 * stays outside, whatever it can do.
 */
const OTHERS: Array<[string, Capabilities]> = [
  ['human', HUMAN_CAPS],
  ...['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade', 'diamondhead', 'ghostfreak'].map((id): [string, Capabilities] => [id, getAlien(id).reach]),
];
const GREYMATTER = getAlien('greymatter').reach;

/** Wildmutt's senses open the museum wing's hidden vent for good; then it's a swap to Grey Matter. */
const VENT_OPEN: LevelData = { ...CHAPTER_3, entities: CHAPTER_3.entities.filter((e) => !(e.type === 'hiddenDoor' && e.id === 'ch3-lock-door')) };

const SECRETS: Array<{ level: LevelData; card: string; from: Pos }> = [
  { level: VENT_OPEN, card: 'ch3-card-vent', from: { x: 340, y: 8 } },
  { level: CHAPTER_4, card: 'ch4-card-claw', from: { x: CHAPTER_4.playerStart.x, y: CHAPTER_4.playerStart.y - 1 } },
  { level: CHAPTER_5, card: 'ch5-card-mouse', from: { x: CHAPTER_5.playerStart.x, y: CHAPTER_5.playerStart.y - 1 } },
  { level: CHAPTER_6, card: 'ch6-card-vent', from: { x: 390, y: 39 } },
];

describe("Grey Matter's secrets", () => {
  for (const s of SECRETS) {
    it(`${s.card}: only Grey Matter gets to it`, () => {
      const grid = buildCells(s.level);
      const c = s.level.entities.find((e) => e.type === 'card' && e.id === s.card) as { x: number; y: number; requires?: string };
      expect(c.requires).toBe('greymatter');
      // Standing beside the card, inside its hiding place (a card floats over the row it names).
      const there = (p: Pos) => p.y === c.y - 1 && Math.abs(p.x - c.x) <= 1;
      expect(canReach(s.level, grid, s.from, there, GREYMATTER)).toBe(true);
      for (const [name, caps] of OTHERS) expect(canReach(s.level, grid, s.from, there, caps), name).toBe(false);
    });
  }

  it('each one in an earlier chapter has a hint that tells the player to come back tiny', () => {
    for (const s of SECRETS.filter((x) => x.level.id !== 'ch6')) expect(s.level.entities.some((e) => e.type === 'alienHint' && e.alien === 'greymatter'), s.card).toBe(true);
  });
});
