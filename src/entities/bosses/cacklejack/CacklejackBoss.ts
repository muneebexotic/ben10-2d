import type Phaser from 'phaser';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld } from '../HunterDrone';

/** CACKLEJACK (placeholder while the fight is built). */
export class CacklejackBoss implements ArenaBoss {
  readonly name = 'CACKLEJACK';
  readonly subtitle = 'RINGMASTER OF FRIGHTS';
  readonly maxHp = 120;
  readonly phase2Title = 'THE HIGH WIRE';
  readonly defeatTitle = "THE SHOW'S OVER!";
  readonly countsAsEnemy = true;
  readonly extraTargets: readonly Damageable[] = [];
  readonly extraHazards: readonly Hazard[] = [];
  readonly liftables: readonly Liftable[] = [];
  hp = 120;
  lastDamage = 0;
  phase = 1;
  defeated = false;
  introducing = false;
  alive = true;
  readonly damage = 1;
  constructor(_scene: Phaser.Scene, _w: BossWorld, _x: number) {}
  hurtbox(_out: Rect): boolean {
    return false;
  }
  hitbox(_out: Rect): boolean {
    return false;
  }
  get active(): boolean {
    return false;
  }
  takeHit(_hit: Hit): HitResult {
    return 'none';
  }
  update(_dtMs: number): void {}
}
