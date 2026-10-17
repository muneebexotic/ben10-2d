import { chapterModule, knownLevelIds } from '../chapters/registry';
import { LEVEL_META, type LevelMeta } from './manifest';
import type { LevelData } from './types';

/** A level id the game knows (a story chapter or Training). */
export function hasLevel(id: string): boolean {
  return knownLevelIds().includes(id);
}

/** A loaded level's data (the level scene's own: its chapter loaded before it started). */
export function getLevel(id: string): LevelData {
  return chapterModule(id).level;
}

/** What the menus know about a story level without loading it. */
export function levelMeta(id: string): LevelMeta {
  const meta = LEVEL_META.find((m) => m.id === id);
  if (!meta) throw new Error(`Unknown level: ${id}`);
  return meta;
}

export function storyMetas(): readonly LevelMeta[] {
  return LEVEL_META;
}

/** Chapter numbers whose level ids are in `completedIds`. */
export function completedChapters(completedIds: readonly string[]): number[] {
  return LEVEL_META.filter((l) => completedIds.includes(l.id)).map((l) => l.chapter);
}
