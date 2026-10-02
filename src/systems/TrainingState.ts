import type { EnemyKind } from '../levels/types';

/** Training sandbox switches. Kept for the whole session (not saved). */
export interface TrainingOptions {
  /** False: the alien timer never runs out and the Omnitrix recharges instantly. */
  alienTimer: boolean;
  /** False: enemies move but never attack (practise combos in peace). */
  enemiesAttack: boolean;
  damageNumbers: boolean;
  /** Index into TRAINING.misfireSteps (0: the watch behaves). */
  misfireStep: number;
}

export const trainingOptions: TrainingOptions = {
  alienTimer: true,
  enemiesAttack: true,
  damageNumbers: true,
  misfireStep: 0,
};

/** Every enemy Training can spawn, in menu order, with its menu name. */
export const TRAINING_ENEMIES: ReadonlyArray<{ kind: EnemyKind; label: string; hint: string }> = [
  { kind: 'scout', label: 'SCOUT', hint: 'AIMED LASER. PUNCH IT BACK!' },
  { kind: 'striker', label: 'STRIKER', hint: 'DIVE-BOMBS, THEN GETS STUCK. GRAB IT!' },
  { kind: 'gunner', label: 'GUNNER', hint: 'THREE-WAY SPREAD. BURST IT.' },
  { kind: 'armored', label: 'ARMORED', hint: 'ONLY SMASH HITS HURT. BREAK THE ARMOR!' },
  { kind: 'hornet', label: 'HORNET', hint: 'DODGES FIREBALLS. XLR8 IS FASTER.' },
  { kind: 'rat', label: 'MUTANT RAT', hint: 'SQUEAK = LEAP. CLEAR THE PACK.' },
  { kind: 'roach', label: 'MUTANT ROACH', hint: 'SHELL SHRUGS OFF CLAWS. FIRE COOKS IT.' },
  { kind: 'lurker', label: 'LURKER', hint: 'INVISIBLE. SENSE IT OR SLIME IT.' },
  { kind: 'brute', label: 'BRUTE', hint: 'TUSKS BLOCK THE FRONT. LET IT HIT A WALL.' },
  { kind: 'bat', label: 'MUTANT BAT', hint: 'SCREECH = SWOOP. ONE GLOB GROUNDS IT.' },
];
