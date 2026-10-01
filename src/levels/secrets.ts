import type { HitKind } from '../entities/types';
import { hasAlien } from '../aliens/registry';
import type { EntitySpawn, LevelData } from './types';

/** Only a heavy smash (Four Arms) cracks a cracked wall. Everything else bounces off. */
export function breaksCrackedWall(kind: HitKind): boolean {
  return kind === 'smash';
}

type CardSpawn = Extract<EntitySpawn, { type: 'card' }>;

/** A card behind a later alien's obstacle only exists once that alien is on the dial. */
export function cardAvailable(card: CardSpawn, aliens: readonly string[]): boolean {
  return !card.requires || aliens.includes(card.requires);
}

export function availableCards(level: LevelData, aliens: readonly string[]): CardSpawn[] {
  return level.entities.filter((e): e is CardSpawn => e.type === 'card' && cardAvailable(e, aliens));
}

export function lockedCards(level: LevelData, aliens: readonly string[]): CardSpawn[] {
  return level.entities.filter((e): e is CardSpawn => e.type === 'card' && !cardAvailable(e, aliens));
}

/**
 * Cards that count toward a chapter's total: every card whose alien exists in
 * the game, even if the player hasn't unlocked it yet ("come back with Four Arms").
 */
export function countedCards(level: LevelData): CardSpawn[] {
  return level.entities.filter((e): e is CardSpawn => e.type === 'card' && (!e.requires || hasAlien(e.requires)));
}
