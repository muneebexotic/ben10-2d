import { ROADBREAKER as RB } from '../../../config/roadbreaker';
import type { HitKind } from '../../types';

/** Fireballs, Heatblast's burst and rocket: what overheats an open vent. */
export function isFire(kind: HitKind): boolean {
  return kind === 'fire' || kind === 'burst' || kind === 'rocket';
}

/** What ROADBREAKER's body is doing when a hit lands. */
export interface CoreState {
  mode: 'truck' | 'robot';
  stalled: boolean;
  seized: boolean;
  ventOpen: boolean;
  platesBroken: number;
}

/**
 * How much of a hit gets through to ROADBREAKER itself. The truck's armour
 * only gives to smash (or anything, once it's stalled); the robot's core is
 * shielded until Four Arms breaks its plates, fire pours in through open
 * vents, and a seized robot takes extra from everything.
 */
export function coreMultiplier(s: CoreState, kind: HitKind): number {
  if (s.mode === 'truck') return s.stalled ? RB.truck.stalledMultiplier : kind === 'smash' ? 1 : RB.truck.armour;
  let mult: number = RB.robot.coreArmour[Math.min(RB.robot.plates, s.platesBroken)];
  if (s.seized) mult *= RB.robot.vent.seizedMultiplier;
  if (s.ventOpen && isFire(kind)) mult *= RB.robot.vent.fireMultiplier;
  return mult;
}

/** Tires shred to melee (XLR8's cuts), barely notice fire. */
export function tireMultiplier(kind: HitKind): number {
  const T = RB.truck.tire;
  if (kind === 'melee') return T.meleeMultiplier;
  return isFire(kind) ? T.fireMultiplier : 1;
}
