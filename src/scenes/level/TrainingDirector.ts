import Phaser from 'phaser';
import { TILE } from '../../config/constants';
import { activeDifficulty } from '../../systems/Difficulty';
import { PALETTE } from '../../config/palette';
import { TRAINING } from '../../config/training';
import type { Drone } from '../../entities/enemies/Drone';
import type { Damageable, Hit, HitResult, Rect } from '../../entities/types';
import type { EnemyKind } from '../../levels/types';
import { formatDamage } from '../../systems/DpsMeter';
import { EventBus } from '../../systems/EventBus';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import { trainingOptions, TRAINING_ENEMIES } from '../../systems/TrainingState';
import type { Omnitrix } from '../../systems/Omnitrix';

export interface TrainingDeps {
  scene: Phaser.Scene;
  fx: Fx;
  omnitrix: Omnitrix;
  player: { x: number; y: number };
  setAggressive(on: boolean): void;
  /** Spawns a drone hovering at (x, y) and registers it with the level. */
  spawnDrone(kind: EnemyKind, x: number, y: number): Drone;
  groundBelow(x: number, y: number): number;
  isSolid(x: number, y: number): boolean;
  worldWidth: number;
}

const HIT_COLORS: Partial<Record<Hit['kind'], number>> = {
  smash: 0xff7a4a,
  melee: PALETTE.white,
  fire: PALETTE.fire1,
  burst: PALETTE.fire1,
  rocket: PALETTE.fire1,
  reflect: PALETTE.omnitrix,
  transform: PALETTE.omnitrix,
};

/**
 * Omnitrix Training: spawns any enemy on request (from the pause menu),
 * applies the sandbox switches and floats a damage number off every hit.
 * Built as a director so a future Free Play mode can reuse it on story levels.
 */
export class TrainingDirector {
  private readonly spawned: Drone[] = [];
  private readonly box: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(private readonly d: TrainingDeps) {
    EventBus.on('training:spawn', (p) => this.spawn(p.kind), this);
    EventBus.on('training:clear', () => this.clear(), this);
    EventBus.on('training:options', (o) => {
      Object.assign(trainingOptions, o);
      this.apply();
    }, this);
    this.apply();
  }

  /** Pushes the sandbox switches into the Omnitrix and the drones. */
  apply(): void {
    const o = this.d.omnitrix;
    const diff = activeDifficulty();
    o.setTimerFrozen(!trainingOptions.alienTimer);
    const misfire = TRAINING.misfireSteps[trainingOptions.misfireStep] ?? 0;
    o.setConfig({ ...o.settings, cooldownMs: trainingOptions.alienTimer ? diff.cooldownMs : 0, wrongTransformChance: misfire });
    this.d.setAggressive(trainingOptions.enemiesAttack);
  }

  spawn(kind: EnemyKind): void {
    this.prune();
    const sameKind = this.spawned.filter((dr) => dr.brain.kind === kind).length;
    if (sameKind >= TRAINING.maxPerKind || this.spawned.length >= TRAINING.maxEnemies) {
      playSfx('denied');
      return;
    }
    const { player } = this.d;
    const side = Math.random() < 0.5 ? -1 : 1;
    let x = player.x + side * (120 + Math.random() * 60);
    if (x < TILE * 4 || x > this.d.worldWidth - TILE * 4 || this.d.isSolid(x, player.y - 60)) x = player.x - side * 140;
    x = Phaser.Math.Clamp(x, TILE * 4, this.d.worldWidth - TILE * 4);
    const ground = this.d.groundBelow(x, player.y - 80);
    const y = Math.min(ground, player.y) - (kind === 'armored' ? 52 : kind === 'striker' ? 110 : 76);
    const drone = this.d.spawnDrone(kind, x, y);
    this.spawned.push(drone);

    // The simulation renders it in: a green scan ring and a burst of pixels.
    const fx = this.d.fx;
    fx.ring(x, y, PALETTE.omnitrix, 26, 360);
    fx.rays(x, y, PALETTE.omnitrix, 50, 400);
    fx.burst('green', x, y, 18);
    playSfx('holoOn', 0.6);
    const label = TRAINING_ENEMIES.find((e) => e.kind === kind)?.label ?? kind.toUpperCase();
    fx.popText(x, y - 14, label, PALETTE.omnitrixGlow);
  }

  /** Derezzes every enemy Training spawned. */
  clear(): void {
    for (const drone of this.spawned) {
      if (!drone.alive) continue;
      drone.vanish();
      this.d.fx.burst('green', drone.x, drone.y, 14);
      this.d.fx.ring(drone.x, drone.y, PALETTE.omnitrix, 18, 260);
    }
    this.spawned.length = 0;
    playSfx('holoOff', 0.6);
  }

  /** A floating number off every hit while damage numbers are on. */
  onHit(target: Damageable, result: HitResult, hit: Hit): void {
    if (!trainingOptions.damageNumbers || (result !== 'hit' && result !== 'killed')) return;
    const dealt = target.lastDamage ?? hit.damage;
    let x: number;
    let y: number;
    if (target.hurtbox(this.box)) {
      x = this.box.x + this.box.w / 2;
      y = this.box.y - 2;
    } else {
      // Killed: the hurtbox is gone, but drones still know where they were.
      const at = target as Partial<{ x: number; y: number }>;
      if (typeof at.x !== 'number' || typeof at.y !== 'number') return;
      x = at.x;
      y = at.y - 10;
    }
    // Rapid hits fan out instead of stacking on one spot.
    x += (Math.random() - 0.5) * 18;
    y -= Math.random() * 8;
    const glancing = dealt < hit.damage * 0.5;
    const color = glancing ? PALETTE.uiDim : (HIT_COLORS[hit.kind] ?? PALETTE.white);
    this.d.fx.popText(x, y, formatDamage(dealt), color);
  }

  private prune(): void {
    for (let i = this.spawned.length - 1; i >= 0; i--) if (!this.spawned[i].alive) this.spawned.splice(i, 1);
  }

  destroy(): void {
    EventBus.offContext(this);
  }
}
