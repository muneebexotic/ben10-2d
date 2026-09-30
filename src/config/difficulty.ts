export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface DifficultyPreset {
  label: string;
  transformDurationMs: number;
  cooldownMs: number;
  wrongTransformChance: number;
  damageTakenMultiplier: number;
  checkpoints: 'frequent' | 'normal' | 'sparse';
}

export const DIFFICULTY: Record<DifficultyId, DifficultyPreset> = {
  easy: {
    label: 'Easy',
    transformDurationMs: 30_000,
    cooldownMs: 6_000,
    wrongTransformChance: 0,
    damageTakenMultiplier: 0.5,
    checkpoints: 'frequent',
  },
  normal: {
    label: 'Normal',
    transformDurationMs: 20_000,
    cooldownMs: 10_000,
    wrongTransformChance: 0.1,
    damageTakenMultiplier: 1,
    checkpoints: 'normal',
  },
  hard: {
    label: 'Hard',
    transformDurationMs: 12_000,
    cooldownMs: 15_000,
    wrongTransformChance: 0.25,
    damageTakenMultiplier: 1.5,
    checkpoints: 'sparse',
  },
};

/** Difficulty selection arrives with Milestone 3; the vertical slice runs on Normal. */
export const ACTIVE_DIFFICULTY: DifficultyId = 'normal';

/** The watch beeps and flashes red for this long before timing out. */
export const OMNITRIX_WARNING_MS = 5_000;

export function getDifficulty(id: DifficultyId = ACTIVE_DIFFICULTY): DifficultyPreset {
  return DIFFICULTY[id];
}
