import { DEFAULT_DIFFICULTY, getDifficulty, type DifficultyId, type DifficultyPreset } from '../config/difficulty';

/**
 * The difficulty being played right now (the active save file's). Gameplay
 * reads it live, so a change from the Settings screen applies straight away.
 * Kept free of Phaser so enemy logic that reads it stays unit-testable;
 * `Session` announces changes on the EventBus.
 */
let active: DifficultyId = DEFAULT_DIFFICULTY;

export function activeDifficultyId(): DifficultyId {
  return active;
}

export function activeDifficulty(): DifficultyPreset {
  return getDifficulty(active);
}

/** Returns true if it changed. */
export function setActiveDifficulty(id: DifficultyId): boolean {
  if (id === active) return false;
  active = id;
  return true;
}

/**
 * Enemy pacing for the active difficulty. Telegraph lengths never change
 * (attacks stay readable on Hard); these scale the gaps around them.
 */
export const pace = {
  /** Rest before an enemy's next attack. */
  rest: (ms: number): number => ms * activeDifficulty().enemyRest,
  /** Grace between an enemy waking up and its first attack. */
  wake: (ms: number): number => ms * activeDifficulty().enemyWake,
  /** How long an enemy stays open after a whiff or a break (a stuck Striker, an exposed core, a stunned boss). */
  punish: (ms: number): number => ms * activeDifficulty().punishWindow,
  /** Rest between the boss's attacks. */
  bossRest: (ms: number): number => ms * activeDifficulty().bossRest,
};
