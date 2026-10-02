import type { Damageable, Hazard, Liftable } from '../types';

/**
 * What a boss arena needs from its boss (the Hunter-Killer, ROADBREAKER):
 * health for the bar, its titles, and any extra pieces Combat must know
 * about (tires, armour plates, a body Four Arms can pick up).
 */
export interface ArenaBoss extends Damageable, Hazard {
  readonly name: string;
  readonly subtitle: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly phase: number;
  readonly defeated: boolean;
  /** Still making its entrance (no misfires in here, nothing hurts it yet). */
  readonly introducing: boolean;
  /** Banner when the second phase starts. */
  readonly phase2Title: string;
  /** Banner when it goes down. */
  readonly defeatTitle: string;
  readonly extraTargets: readonly Damageable[];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[];
  update(dtMs: number): void;
}
