import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import type { Projectiles } from '../Projectiles';
import type { Telegraphs } from '../enemies/Telegraphs';

/** What a bounty hunter can see and do, in a story set piece or the boss fight. */
export interface HunterWorld {
  readonly now: number;
  fx: Fx;
  lighting: Lighting;
  telegraph: Telegraphs;
  projectiles: Projectiles;
  player: { readonly x: number; readonly y: number; readonly centerY: number; readonly dead: boolean; readonly cloaked: boolean; readonly formId: string };
  isSolid(x: number, y: number): boolean;
  groundBelow(x: number, y: number): number;
  /** Sixsix's missile salvo onto (x, floorY). */
  salvo(x: number, floorY: number, count?: number, spread?: number, warnMs?: number): void;
  /** An explosion that hurts Ben (a claw blast landing, a crystal spike). */
  blastPlayer(x: number, y: number, radius: number, damage: number): void;
  /** A rock dropping from the ceiling over x (after the dust warning). */
  rockfall?(x: number, ceilingY: number): void;
  /** The attack lands at game time `at` (perfect transform timing). */
  threat(key: object, at: number): void;
  cancelThreat(key: object): void;
  /** One of their lines over the action (portrait box, never blocking). */
  say?(who: 'sixsix' | 'kraab' | 'tetrax', text: string, ms: number): void;
}
