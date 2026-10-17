import type { HitKind } from '../entities/types';
import { hasAlien } from '../aliens/registry';
import { inRoster } from '../config/roster';
import type { LevelMeta } from './manifest';
import type { EntitySpawn, LevelData } from './types';

/** Only a heavy smash (Four Arms) cracks a cracked wall. Everything else bounces off. */
export function breaksCrackedWall(kind: HitKind): boolean {
  return kind === 'smash';
}

type CardSpawn = Extract<EntitySpawn, { type: 'card' }>;
/** What the card rules need of a card: which one, and who it waits for. */
export type CardRef = Pick<CardSpawn, 'id' | 'requires' | 'reward'>;
/** A level's data, or its manifest entry (the menus don't load chapters). */
export type CardSource = Pick<LevelData, 'entities'> | Pick<LevelMeta, 'cards'>;

/** Level data gives whole card spawns (with positions); a manifest gives what the rules need. */
type CardsOf<S extends CardSource> = S extends Pick<LevelData, 'entities'> ? CardSpawn : CardRef;

function cardsOf<S extends CardSource>(source: S): Array<CardsOf<S>> {
  return ('cards' in source ? [...source.cards] : source.entities.filter((e): e is CardSpawn => e.type === 'card')) as Array<CardsOf<S>>;
}

/** A card behind a later alien's obstacle only exists once that alien is on the dial. */
export function cardAvailable(card: CardRef, aliens: readonly string[]): boolean {
  return !card.requires || aliens.includes(card.requires);
}

export function availableCards<S extends CardSource>(level: S, aliens: readonly string[]): Array<CardsOf<S>> {
  return cardsOf(level).filter((c) => cardAvailable(c, aliens));
}

export function lockedCards<S extends CardSource>(level: S, aliens: readonly string[]): Array<CardsOf<S>> {
  return cardsOf(level).filter((c) => !cardAvailable(c, aliens));
}

/**
 * Cards that count toward a chapter's total: every card whose alien is in the
 * roster, even one the player (or the game) doesn't have yet ("come back with
 * Stinkfly"). The totals never change as new aliens arrive.
 */
export function countedCards<S extends CardSource>(level: S): Array<CardsOf<S>> {
  return cardsOf(level).filter((c) => !c.requires || hasAlien(c.requires) || inRoster(c.requires));
}

/**
 * Secrets worth going back for: cards behind an alien's obstacle that the
 * file now has the alien for, still not found.
 */
export function waitingSecrets<S extends CardSource>(level: S, aliens: readonly string[], found: readonly string[]): Array<CardsOf<S>> {
  return availableCards(level, aliens).filter((c) => c.requires !== undefined && !found.includes(c.id));
}
