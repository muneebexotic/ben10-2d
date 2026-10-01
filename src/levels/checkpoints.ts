import { activeDifficulty } from '../systems/Difficulty';
import type { Density, EntitySpawn, LevelData } from './types';

type CheckpointSpawn = Extract<EntitySpawn, { type: 'checkpoint' }>;

const DENSITY_RANK: Record<Density, number> = { sparse: 0, normal: 1, frequent: 2 };

/**
 * Checkpoints kept for a checkpoint density (default: the active difficulty's).
 * Each checkpoint is tagged with the sparsest density it still appears on:
 * Hard keeps only 'sparse' ones, Easy keeps them all.
 */
export function checkpointsFor(level: LevelData, density: Density = activeDifficulty().checkpoints): CheckpointSpawn[] {
  const allowed = DENSITY_RANK[density];
  return level.entities.filter((e): e is CheckpointSpawn => e.type === 'checkpoint' && DENSITY_RANK[e.density] <= allowed);
}
