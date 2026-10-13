import type { Hit } from '../types';

/**
 * Chapter 5's small pure rules, kept free of Phaser so they're unit tested
 * (tests/chapter5.test.ts): whose shell stops a hit, what cracks the pillar,
 * and which alien the lift's forced misfire hands Ben.
 */

/**
 * Does Kraab's front shell stop this hit? Smashes always get through, and
 * so does anything while his claw is open (charging the cannon) or he's
 * reeling.
 */
export function kraabShelled(face: 1 | -1, kraabX: number, open: boolean, hit: Pick<Hit, 'x' | 'kind' | 'heavy'>): boolean {
  if (open || hit.kind === 'smash' || hit.heavy) return false;
  return Math.sign(hit.x - kraabX) === face || hit.x === kraabX;
}

/**
 * Is this hit stopped by a crab-bot's front shell? Heavy hits never are
 * (they flip it), and nothing is while it's on its back.
 */
export function crabShelled(face: 1 | -1, crabX: number, flipped: boolean, hit: Pick<Hit, 'x' | 'kind' | 'heavy'>): boolean {
  if (flipped || hit.heavy || hit.kind === 'smash') return false;
  return Math.sign(hit.x - crabX) === face || hit.x === crabX;
}

/** Only hits with weight crack THE HUNTERS' pillar: a smash, a thrown enemy, or Kraab's own blast sent back. */
export function cracksPillar(hit: Pick<Hit, 'kind' | 'heavy' | 'shot'>): boolean {
  return hit.kind === 'smash' || hit.heavy === true || (hit.kind === 'reflect' && hit.shot === 'claw');
}

/** The lift's misfire is picked so it can be survived with skill, best first (never the alien Ben asked for). */
export const SURVIVABLE_MISFIRES = ['ghostfreak', 'xlr8', 'fourarms', 'stinkfly', 'heatblast', 'upgrade', 'wildmutt', 'diamondhead'] as const;

/** The alien the watch gives Ben instead of `wanted` on the lift, from what's on the dial. */
export function pickForcedMisfire(wanted: string, dial: readonly string[]): string | null {
  for (const id of SURVIVABLE_MISFIRES) if (id !== wanted && dial.includes(id)) return id;
  return dial.find((id) => id !== wanted) ?? null;
}
