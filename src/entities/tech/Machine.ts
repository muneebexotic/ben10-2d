import type Phaser from 'phaser';
import type { MachineHandle } from '../../aliens/types';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { Projectiles } from '../Projectiles';
import type { Telegraphs } from '../enemies/Telegraphs';
import type { Hit, Rect } from '../types';

/**
 * A machine Upgrade can merge into. The ability only sees the MachineHandle
 * part (anchor, holding, control, release); the level drives the rest.
 */
export interface Machine extends MachineHandle {
  readonly id: string;
  /** Where Upgrade's puddle has to touch to merge, or false when it can't right now (spent, broken, already open). */
  mergeBox(out: Rect): boolean;
  /** Upgrade poured in, flowing in direction `facing`. */
  enter(facing: 1 | -1): void;
  update(dtMs: number): void;
  destroy(): void;
}

/** What machines may touch. Built by the level's TechSystem. */
export interface TechDeps {
  scene: Phaser.Scene;
  fx: Fx;
  lighting: Lighting;
  projectiles: Projectiles;
  telegraph: Telegraphs;
  /** Game time (pauses with hit-stop). */
  now(): number;
  player: { readonly x: number; readonly y: number; readonly centerY: number; readonly dead: boolean };
  isSolid(x: number, y: number): boolean;
  groundBelow(x: number, y: number): number;
  addSolid(rect: Rect): void;
  removeSolid(rect: Rect): void;
  /** Hits everything in a circle (a cabinet's GAME OVER blast, a cart's horn). Returns how many. */
  blast(x: number, y: number, radius: number, hit: Hit): number;
  /** Hits everything in a box (a cart ramming through), each target once per `key`. */
  ram(area: Rect, hit: Hit, key: object): number;
  /** A hostile machine's attack lands at `at` (perfect transform window). */
  threat(key: object, at: number): void;
  cancelThreat(key: object): void;
}
