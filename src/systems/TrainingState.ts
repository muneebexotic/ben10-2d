import type { DroneKind } from '../levels/types';

/** Training sandbox switches. Kept for the whole session (not saved). */
export interface TrainingOptions {
  /** False: the alien timer never runs out and the Omnitrix recharges instantly. */
  alienTimer: boolean;
  /** False: enemies move but never attack (practise combos in peace). */
  enemiesAttack: boolean;
  damageNumbers: boolean;
}

export const trainingOptions: TrainingOptions = {
  alienTimer: true,
  enemiesAttack: true,
  damageNumbers: true,
};

/** Every enemy Training can spawn, in menu order, with its menu name. */
export const TRAINING_ENEMIES: ReadonlyArray<{ kind: DroneKind; label: string; hint: string }> = [
  { kind: 'scout', label: 'SCOUT', hint: 'AIMED LASER. PUNCH IT BACK!' },
  { kind: 'striker', label: 'STRIKER', hint: 'DIVE-BOMBS, THEN GETS STUCK. GRAB IT!' },
  { kind: 'gunner', label: 'GUNNER', hint: 'THREE-WAY SPREAD. BURST IT.' },
  { kind: 'armored', label: 'ARMORED', hint: 'ONLY SMASH HITS HURT. BREAK THE ARMOR!' },
  { kind: 'hornet', label: 'HORNET', hint: 'DODGES FIREBALLS. XLR8 IS FASTER.' },
];
