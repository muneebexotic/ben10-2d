import { FROG } from '../../../config/frog';
import type { Hit } from '../../types';

/** What the frog is doing when a hit lands (only what changes the damage). */
export interface FrogExposure {
  /** Throat swollen for a spit. */
  inflated: boolean;
  /** Stuck in the floor after a leap, or dazed after a flop or a yank. */
  recovering: boolean;
  /** Glued down by slime. */
  gummed: boolean;
  /** Top of its head (hits above this y come down on Animo too). */
  headTopY: number;
}

/**
 * Damage multiplier for a hit on the frog's body. Pure, so the switching
 * rewards are unit tested: the throat is soft when swollen, a gummed or
 * recovering frog is open, and hits from above land on its rider too.
 */
export function frogMultiplier(hit: Pick<Hit, 'kind' | 'y'>, e: FrogExposure): number {
  let m = 1;
  if (e.inflated) m = Math.max(m, FROG.spit.throatMultiplier);
  if (e.gummed) m = Math.max(m, FROG.gum.stuckMultiplier);
  if (e.recovering) m = Math.max(m, FROG.leap.recoverMultiplier);
  if (hit.y < e.headTopY + FROG.fromAbove.margin) m *= FROG.fromAbove.multiplier;
  return m;
}

/** Fire on the swollen throat pops it: the spit is cancelled and the frog reels. */
export function popsThroat(hit: Pick<Hit, 'kind'>, inflated: boolean): boolean {
  return inflated && (hit.kind === 'fire' || hit.kind === 'burst' || hit.kind === 'rocket');
}

/** A smash on the outstretched tongue yanks the frog face-first. */
export function yanksTongue(hit: Pick<Hit, 'kind'>): boolean {
  return hit.kind === 'smash';
}

/**
 * Slime globs on the frog's feet within the window. Returns the new list of
 * glob times and whether this one glued it down.
 */
export function gumFeet(globs: readonly number[], now: number): { globs: number[]; stuck: boolean } {
  const recent = [...globs.filter((t) => now - t <= FROG.gum.windowMs), now];
  if (recent.length >= FROG.gum.globs) return { globs: [], stuck: true };
  return { globs: recent, stuck: false };
}
