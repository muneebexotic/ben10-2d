import { CHAPTER_1 } from '../../src/levels/chapter1';
import { CHAPTER_2 } from '../../src/levels/chapter2';
import { CHAPTER_3 } from '../../src/levels/chapter3';
import { CHAPTER_4 } from '../../src/levels/chapter4';
import { CHAPTER_5 } from '../../src/levels/chapter5';
import { CHAPTER_6 } from '../../src/levels/chapter6';
import { CHAPTER_7 } from '../../src/levels/chapter7';
import type { LevelData } from '../../src/levels/types';

/** Every story level's data (the game loads each with its chapter's chunk; tests import them directly). */
export const STORY_LEVELS: readonly LevelData[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5, CHAPTER_6, CHAPTER_7];

export function storyLevel(id: string): LevelData {
  const level = STORY_LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}
