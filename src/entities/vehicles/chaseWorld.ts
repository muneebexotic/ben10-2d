import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { Projectiles } from '../Projectiles';
import type { Telegraphs } from '../enemies/Telegraphs';
import type { Rustbucket } from './Rustbucket';

/** What the chase's vehicles and road junk can see and do. Built by the chase director. */
export interface ChaseWorld {
  now(): number;
  readonly fx: Fx;
  readonly lighting: Lighting;
  readonly telegraph: Telegraphs;
  readonly projectiles: Projectiles;
  readonly rv: Rustbucket;
  /** How fast the asphalt rushes past (px/s): anything lying on the road falls behind at this. */
  readonly roadSpeed: number;
  /** 0..1, how dark it is (headlights come on). */
  readonly night: number;
  readonly player: { readonly x: number; readonly y: number; readonly dead: boolean };
  /** A short explosion that hurts Ben if he's inside it (shells, barrels). */
  blast(x: number, y: number, radius: number, damage: number): void;
  /** An attack lands at game time `at` (perfect transforms). */
  threat(key: object, at: number): void;
  cancelThreat(key: object): void;
}
