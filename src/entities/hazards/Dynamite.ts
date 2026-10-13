import Phaser from 'phaser';
import { DYNAMITE } from '../../config/bounty';
import { DEPTH, FX, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { CH5_TEX } from '../../scenes/preload/bounty';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import { dynamiteBoom, fuse } from '../../systems/audio/bountySfx';
import { chance } from '../../systems/Pacing';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../types';

/** Hits that light a fuse: fire, explosions, rockets. */
export function lightsFuse(kind: HitKind): boolean {
  return kind === 'fire' || kind === 'burst' || kind === 'rocket';
}

export interface DynamiteWorld {
  fx: Fx;
  lighting: Lighting;
  /** The bang: enemies around it (Ben's side of the fight: he lit it). */
  blastEnemies(x: number, y: number, radius: number, damage: number): void;
  /** And Ben, if he's standing too close. */
  hurtPlayer(x: number, y: number, radius: number, damage: number): void;
  /** Cracked rock it clears (tiles). */
  clearRock(rect: { x: number; y: number; w: number; h: number }): void;
  /** The blast lights anything else nearby. */
  onExplode(x: number, y: number, radius: number): void;
  /** Ben hit it with something that doesn't light it: a hint, once. */
  onDud(): void;
}

/**
 * A crate of dynamite. Fire (or a blast, or a missile landing nearby) lights
 * the fuse; a moment later it goes off, hurting everything around it and
 * clearing the cracked rock it was stacked against (`breaks`).
 */
export class Dynamite implements Damageable {
  readonly countsAsEnemy = false;
  readonly sprite: Phaser.GameObjects.Sprite;
  alive = true;
  lastDamage = 0;
  private fuseLeft = -1;
  readonly x: number;
  readonly y: number;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    tx: number,
    ty: number,
    private readonly breaks: { x: number; y: number; w: number; h: number } | undefined,
    private readonly w: DynamiteWorld,
  ) {
    this.x = tx * TILE + TILE / 2;
    this.y = ty * TILE;
    this.sprite = scene.add.sprite(this.x, this.y, CH5_TEX.dynamite, 0).setOrigin(0.5, 1).setDepth(DEPTH.props);
  }

  get lit(): boolean {
    return this.fuseLeft >= 0;
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.lit) return false;
    out.x = this.x - 8;
    out.y = this.y - 14;
    out.w = 16;
    out.h = 14;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.lit) return 'none';
    if (!lightsFuse(hit.kind)) {
      this.w.fx.burst('dust', this.x, this.y - 6, 3);
      playSfx('punchHit', 0.4, 0.7);
      this.w.onDud();
      return 'blocked';
    }
    this.light();
    return 'hit';
  }

  /** Lights the fuse (a blast nearby, a fireball). */
  light(delayMs: number = DYNAMITE.fuseMs): void {
    if (!this.alive || this.lit) return;
    this.fuseLeft = delayMs;
    this.sprite.setFrame(1);
    playSfx(fuse, 0.7);
  }

  near(x: number, y: number, radius: number): boolean {
    return Math.abs(this.x - x) < radius + 8 && Math.abs(this.y - 7 - y) < radius + 8;
  }

  update(dtMs: number, now: number): void {
    if (!this.alive || !this.lit) return;
    this.fuseLeft -= dtMs;
    // The fuse burns down: sparks, and the crate shakes harder.
    const k = 1 - Math.max(0, this.fuseLeft) / DYNAMITE.fuseMs;
    if (chance(0.8)) this.w.fx.trail('spark', this.x + 1, this.y - 14);
    this.sprite.setX(this.x + Math.round(Math.sin(now * 0.08) * k * 1.5));
    this.sprite.setTint(Math.floor(now / 90) % 2 === 0 ? 0xffffff : 0xffb0a0);
    this.w.lighting.add(this.x, this.y - 14, 20 + k * 20, PALETTE.fire1, 0.9);
    if (this.fuseLeft <= 0) this.explode();
  }

  private explode(): void {
    this.alive = false;
    this.sprite.setVisible(false);
    const { fx } = this.w;
    const x = this.x;
    const y = this.y - 8;
    fx.explosion(x, y, 'big');
    fx.burst('debris', x, y, 20);
    fx.burst('smoke', x, y, 8);
    fx.ring(x, y, PALETTE.fire1, DYNAMITE.radius, 360);
    fx.light(x, y, 160, PALETTE.fire1, 400);
    fx.shake(FX.shakeHeavy, 320);
    fx.hitStop(50);
    playSfx(dynamiteBoom, 1, 0.9 + Math.random() * 0.15);
    this.w.blastEnemies(x, y, DYNAMITE.radius, DYNAMITE.damage);
    this.w.hurtPlayer(x, y, DYNAMITE.radius * 0.8, DYNAMITE.playerDamage);
    if (this.breaks) this.w.clearRock(this.breaks);
    this.w.onExplode(x, y, DYNAMITE.radius);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
