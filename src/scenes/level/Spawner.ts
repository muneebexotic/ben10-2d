import Phaser from 'phaser';
import { TILE } from '../../config/constants';
import { getDifficulty } from '../../config/difficulty';
import type { Density, EntitySpawn, LevelData } from '../../levels/types';
import { Barricade } from '../../entities/props/Barricade';
import { Checkpoint } from '../../entities/props/Checkpoint';
import { Jammer } from '../../entities/props/Jammer';
import { Pickup } from '../../entities/props/Pickup';
import { Drone, type DroneWorld } from '../../entities/enemies/Drone';
import { createBrain } from '../../entities/enemies/brains';
import type { Fx } from '../../systems/Fx';

export interface SpawnedEntities {
  drones: Drone[];
  barricades: Barricade[];
  checkpoints: Checkpoint[];
  pickups: Pickup[];
  jammer: Jammer | null;
}

const DENSITY_RANK: Record<Density, number> = { sparse: 0, normal: 1, frequent: 2 };
const DIFFICULTY_DENSITY: Record<'sparse' | 'normal' | 'frequent', number> = { sparse: 0, normal: 1, frequent: 2 };

/** Checkpoints kept for the active difficulty (Hard drops the optional ones). */
export function checkpointsFor(level: LevelData): Array<Extract<EntitySpawn, { type: 'checkpoint' }>> {
  const allowed = DIFFICULTY_DENSITY[getDifficulty().checkpoints];
  return level.entities.filter(
    (e): e is Extract<EntitySpawn, { type: 'checkpoint' }> => e.type === 'checkpoint' && DENSITY_RANK[e.density] <= allowed,
  );
}

/**
 * Builds gameplay entities from level data. When resuming from a checkpoint,
 * everything behind it that the player already dealt with stays gone.
 */
export function spawnEntities(
  scene: Phaser.Scene,
  level: LevelData,
  droneWorld: DroneWorld,
  fx: Fx,
  resumeX: number,
  collectedCards: readonly string[],
): SpawnedEntities {
  const out: SpawnedEntities = { drones: [], barricades: [], checkpoints: [], pickups: [], jammer: null };
  const behind = (tx: number) => resumeX > 0 && tx * TILE < resumeX - TILE;

  for (const cp of checkpointsFor(level)) {
    const c = new Checkpoint(scene, cp.id, cp.x, cp.y);
    if (behind(cp.x) || Math.abs(cp.x * TILE + TILE / 2 - resumeX) < 2) c.light();
    out.checkpoints.push(c);
  }

  for (const e of level.entities) {
    switch (e.type) {
      case 'drone':
        if (behind(e.x)) break;
        out.drones.push(new Drone(scene, droneWorld, e.x * TILE + TILE / 2, e.y * TILE + TILE / 2, createBrain(e.kind)));
        break;
      case 'barricade':
        if (behind(e.x + e.w)) break;
        out.barricades.push(new Barricade(scene, e.id, e.x, e.y, e.w, e.h, fx));
        break;
      case 'smoothy':
        if (behind(e.x)) break;
        out.pickups.push(new Pickup(scene, 'smoothy', `smoothy-${e.x}`, e.x, e.y));
        break;
      case 'card':
        if (collectedCards.includes(e.id)) break;
        out.pickups.push(new Pickup(scene, 'card', e.id, e.x, e.y));
        break;
      case 'jammer':
        if (behind(e.gateX)) break;
        out.jammer = new Jammer(scene, e.x, e.y, e.fieldFrom, e.gateX, e.gateTop, fx);
        break;
      default:
        break;
    }
  }
  return out;
}
