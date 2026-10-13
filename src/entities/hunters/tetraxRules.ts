import { TETRAX } from '../../config/hunters';
import type { Hit } from '../types';

export interface TetraxHitResult {
  damage: number;
  /** A fire hit adds heat. */
  heats: boolean;
  /** Hot crystal took a hit that wasn't fire: it shatters (the combo's payoff, heat spent). */
  shatter: boolean;
  /** A smash cracked him (a stagger). */
  cracked: boolean;
  /** His guard was up and the hit came from the front. */
  blocked: boolean;
}

/**
 * Crystal on crystal: how much a hit does to Tetrax. Pure, unit tested.
 * Shards (Diamondhead's, or anything crystal) barely scratch him; a smash
 * cracks him; fire heats him, and hot crystal shatters under the next hit
 * that isn't fire. His guard stops anything from the front.
 */
export function tetraxDamage(hit: Pick<Hit, 'damage' | 'kind' | 'shot' | 'heavy' | 'x'>, state: { heated: boolean; guarding: boolean; x: number; facing: 1 | -1 }): TetraxHitResult {
  const R = TETRAX.rules;
  const fromFront = Math.sign(hit.x - state.x) === state.facing || hit.x === state.x;
  if (state.guarding && fromFront && hit.kind !== 'smash') return { damage: 0, heats: false, shatter: false, cracked: false, blocked: true };
  const fire = hit.kind === 'fire' || hit.kind === 'burst';
  let damage = hit.damage;
  if (hit.shot === 'shard') damage *= R.shardMultiplier;
  const cracked = hit.kind === 'smash' || hit.heavy === true;
  if (cracked) damage *= R.smashMultiplier;
  const shatter = state.heated && !fire;
  if (shatter) damage *= R.heatedMultiplier;
  return { damage, heats: fire, shatter, cracked, blocked: false };
}
