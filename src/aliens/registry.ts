import type { FormDefinition } from './types';
import { HEATBLAST_FORM } from './heatblast';
import { HUMAN_FORM } from './human';

/**
 * Every alien the Omnitrix can become. Adding an alien = one new file + one line here;
 * Player and Omnitrix code never change.
 */
const ALIENS: readonly FormDefinition[] = [HEATBLAST_FORM];

const BY_ID = new Map(ALIENS.map((a) => [a.id, a]));

export function getAlien(id: string): FormDefinition {
  const alien = BY_ID.get(id);
  if (!alien) throw new Error(`Unknown alien: ${id}`);
  return alien;
}

export function hasAlien(id: string): boolean {
  return BY_ID.has(id);
}

export function allAliens(): readonly FormDefinition[] {
  return ALIENS;
}

/** Aliens the watch has by the start of a chapter. */
export function aliensUnlockedBy(chapter: number): string[] {
  return ALIENS.filter((a) => a.unlockChapter > 0 && a.unlockChapter <= chapter).map((a) => a.id);
}

export { HUMAN_FORM };
