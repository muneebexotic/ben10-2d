import { CACKLEJACK as C } from '../../../config/cacklejack';

/** CACKLEJACK's rules as plain numbers (unit tested). */

export type CackleStage = 0 | 1 | 2;

/** The stage his health puts him in: FEAR GAS, THE HIGH WIRE, THE BIG HEAD. */
export function stageFor(ratio: number): CackleStage {
  if (ratio <= C.stageAt[1]) return 2;
  if (ratio <= C.stageAt[0]) return 1;
  return 0;
}

/** His health on a retry from a stage's checkpoint. */
export function stageStartHp(stage: CackleStage): number {
  return stage === 0 ? C.maxHp : Math.floor(C.maxHp * C.stageAt[stage - 1]);
}

/** How much of a hit lands on him: little while he dodges about, double while he takes a bow. */
export function bodyMultiplier(bowing: boolean): number {
  return bowing ? C.bowMultiplier : C.guardMultiplier;
}

/** Stage 1's trick order: pies, a hop, gas, a jack-in-the-box, and round again. */
export const FEAR_GAS_TRICKS = ['pies', 'pogo', 'gasPie', 'pogo', 'jackbox'] as const;
export type FearGasTrick = (typeof FEAR_GAS_TRICKS)[number];

export function trickAt(count: number): FearGasTrick {
  return FEAR_GAS_TRICKS[count % FEAR_GAS_TRICKS.length];
}

/** The big head's grin: where it is in its cycle (shut, the quiver that warns, open), from the time in the cycle. */
export function mouthAt(t: number, shutMs: number, quiverMs: number, openMs: number): 'shut' | 'quiver' | 'open' {
  const cycle = shutMs + quiverMs + openMs;
  const k = ((t % cycle) + cycle) % cycle;
  if (k < shutMs) return 'shut';
  if (k < shutMs + quiverMs) return 'quiver';
  return 'open';
}

/** The big head's size as it grows to fill the ring. */
export function headScale(ms: number): number {
  const B = C.bigHead;
  return B.startScale + (1 - B.startScale) * Math.min(1, ms / B.growMs);
}
