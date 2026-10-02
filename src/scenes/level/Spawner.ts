import Phaser from 'phaser';
import { TILE } from '../../config/constants';
import { checkpointsFor } from '../../levels/checkpoints';
import type { LevelData } from '../../levels/types';
import { Barricade } from '../../entities/props/Barricade';
import { Checkpoint } from '../../entities/props/Checkpoint';
import { Jammer } from '../../entities/props/Jammer';
import { Pickup } from '../../entities/props/Pickup';
import { Drone, type DroneWorld } from '../../entities/enemies/Drone';
import { createBrain } from '../../entities/enemies/brains';
import type { Fx } from '../../systems/Fx';
import { CrackedWall, type CrackedWallOptions, type WallBreaker } from '../../entities/props/CrackedWall';
import { Boulder } from '../../entities/props/Boulder';
import { Dummy } from '../../entities/props/Dummy';
import { cardAvailable } from '../../levels/secrets';

export { checkpointsFor };

export interface SpawnedEntities {
  drones: Drone[];
  barricades: Barricade[];
  checkpoints: Checkpoint[];
  pickups: Pickup[];
  jammer: Jammer | null;
  walls: CrackedWall[];
  boulders: Boulder[];
  dummies: Dummy[];
}

export interface SpawnOptions {
  /** Where play resumes (checkpoint x in pixels), 0 from the start. */
  resumeX: number;
  collectedCards: readonly string[];
  /** Aliens on the dial: cards and walls behind later aliens react to them. */
  aliens: readonly string[];
  /** The alien that can break a cracked wall, if it is on the dial. */
  breakerFor(alienId: string): WallBreaker | null;
  /** The locked silhouette a wall shows when its alien isn't on the dial yet. */
  lockedFor(alienId: string): CrackedWallOptions['locked'];
  /** Thrown boulders reform (Training). */
  respawningProps: boolean;
}

/**
 * Builds gameplay entities from level data. When resuming from a checkpoint,
 * everything behind it that the player already dealt with stays gone.
 */
export function spawnEntities(scene: Phaser.Scene, level: LevelData, droneWorld: DroneWorld, fx: Fx, opts: SpawnOptions): SpawnedEntities {
  const { resumeX, collectedCards, aliens } = opts;
  const out: SpawnedEntities = { drones: [], barricades: [], checkpoints: [], pickups: [], jammer: null, walls: [], boulders: [], dummies: [] };
  const behind = (tx: number) => resumeX > 0 && tx * TILE < resumeX - TILE;

  for (const cp of checkpointsFor(level)) {
    const c = new Checkpoint(scene, cp.id, cp.label, cp.x, cp.y, cp.hidden === true);
    if (behind(cp.x) || Math.abs(cp.x * TILE + TILE / 2 - resumeX) < TILE * 2) c.light();
    out.checkpoints.push(c);
  }

  for (const e of level.entities) {
    switch (e.type) {
      case 'drone':
        if (behind(e.x)) break;
        out.drones.push(new Drone(scene, droneWorld, e.x * TILE + TILE / 2, e.y * TILE + TILE / 2, createBrain(e.kind)));
        break;
      case 'mutant': {
        if (behind(e.x)) break;
        // Ground mutants stand on row y; a ceiling roach clings under the solid row y.
        const brain = createBrain(e.kind, { ceiling: e.ceiling });
        const half = brain.body.height / 2;
        const y = e.ceiling ? (e.y + 1) * TILE + half : e.y * TILE - half;
        out.drones.push(new Drone(scene, droneWorld, e.x * TILE + TILE / 2, y, brain));
        break;
      }
      case 'barricade':
        if (behind(e.x + e.w)) break;
        out.barricades.push(new Barricade(scene, e.id, e.x, e.y, e.w, e.h, fx));
        break;
      case 'smoothy':
        if (behind(e.x)) break;
        out.pickups.push(new Pickup(scene, 'smoothy', `smoothy-${e.x}`, e.x, e.y));
        break;
      case 'card':
        // Cards behind an alien this chapter unlocks on the way are there from the start.
        if (collectedCards.includes(e.id) || !cardAvailable(e, [...aliens, ...(level.story?.unlocks ?? []).map((u) => u.alien)])) break;
        out.pickups.push(new Pickup(scene, 'card', e.id, e.x, e.y));
        break;
      case 'crackedWall':
        out.walls.push(
          new CrackedWall(scene, e.id, e.x, e.y, e.h, fx, {
            rebuildMs: e.rebuildMs,
            requires: e.requires,
            breaker: aliens.includes(e.requires) ? opts.breakerFor(e.requires) : null,
            locked: aliens.includes(e.requires) ? null : opts.lockedFor(e.requires),
          }),
        );
        break;
      case 'boulder':
        out.boulders.push(new Boulder(scene, e.x, e.y, fx, opts.respawningProps));
        break;
      case 'dummy':
        out.dummies.push(new Dummy(scene, e.x, e.y, fx));
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
