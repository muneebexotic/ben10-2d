import { describe, expect, it } from 'vitest';
import { TILE } from '../src/config/constants';
import { PLAYER } from '../src/config/player';
import { CHAPTER_1 } from '../src/levels/chapter1';
import { CHAPTER_2 } from '../src/levels/chapter2';
import { CHAPTER_3 } from '../src/levels/chapter3';
import { CHAPTER_4 } from '../src/levels/chapter4';
import { checkpointSpawn } from '../src/levels/checkpoints';
import { CART_TILES } from '../src/levels/reachability';
import type { LevelData } from '../src/levels/types';

/**
 * Ben never appears inside something solid that isn't part of the tile map:
 * a parked cart, a lift, a shutter, a hidden door or vines. Arcade Physics
 * doesn't push a body out of a deep overlap, so he'd stand inside it (the QA
 * fuzz runs found the MAINTENANCE LINE checkpoint spawning him in the cart).
 */
const LEVELS: LevelData[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4];

interface Box {
  what: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function solidsOf(level: LevelData): Box[] {
  const out: Box[] = [];
  for (const e of level.entities) {
    if (e.type === 'cart') out.push({ what: `cart ${e.id}`, x: e.x * TILE, y: e.y * TILE - 30, w: CART_TILES * TILE, h: 30 });
    else if (e.type === 'lift') out.push({ what: `lift ${e.id}`, x: e.x * TILE, y: (e.y - 1) * TILE, w: e.w * TILE, h: TILE });
    else if (e.type === 'techDoor' || e.type === 'hiddenDoor' || e.type === 'vines') out.push({ what: `${e.type} ${e.id}`, x: e.x * TILE, y: e.y * TILE, w: e.w * TILE, h: e.h * TILE });
  }
  return out;
}

describe('checkpoint spawns are clear of moving and hidden solids', () => {
  for (const level of LEVELS) {
    it(level.name, () => {
      const solids = solidsOf(level);
      const half = PLAYER.body.width / 2;
      const inside: string[] = [];
      for (const cp of level.entities) {
        if (cp.type !== 'checkpoint') continue;
        const s = checkpointSpawn(cp);
        for (const b of solids) {
          if (s.x + half > b.x && s.x - half < b.x + b.w && s.y > b.y && s.y - PLAYER.body.height < b.y + b.h) inside.push(`${cp.id} inside ${b.what}`);
        }
      }
      expect(inside).toEqual([]);
    });
  }
});
