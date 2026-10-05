import { CHAPTER_1 } from './chapter1';
import { CHAPTER_2 } from './chapter2';
import { CHAPTER_3 } from './chapter3';
import { CHAPTER_4 } from './chapter4';
import { TRAINING_ARENA } from './training';
import type { LevelData } from './types';

/** Every playable level. Story chapters have a chapter number; the Training arena is chapter 0. */
const LEVELS: readonly LevelData[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, TRAINING_ARENA];

export function hasLevel(id: string): boolean {
  return LEVELS.some((l) => l.id === id);
}

export function getLevel(id: string): LevelData {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function storyLevels(): LevelData[] {
  return LEVELS.filter((l) => l.chapter > 0);
}

/** Chapter numbers whose level ids are in `completedIds`. */
export function completedChapters(completedIds: readonly string[]): number[] {
  return storyLevels()
    .filter((l) => completedIds.includes(l.id))
    .map((l) => l.chapter);
}
