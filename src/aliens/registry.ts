import type { FormDefinition } from './types';
import { HEATBLAST_FORM } from './heatblast';
import { HUMAN_FORM } from './human';
import { XLR8_FORM } from './xlr8';

/**
 * Every alien the Omnitrix can become, in dial order. Adding an alien = one new
 * module in src/aliens/ + one line here; Player, Omnitrix, HUD, touch controls,
 * music and the asset map all read from this list.
 */
const ALIENS: readonly FormDefinition[] = [HEATBLAST_FORM, XLR8_FORM];

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

/** Human Ben or any alien. */
export function getForm(id: string): FormDefinition {
  return id === HUMAN_FORM.id ? HUMAN_FORM : getAlien(id);
}

/** Aliens the watch has by the start of a chapter, in dial order. */
export function aliensUnlockedBy(chapter: number): string[] {
  return ALIENS.filter((a) => a.unlockChapter > 0 && a.unlockChapter <= chapter).map((a) => a.id);
}

export { HUMAN_FORM };
