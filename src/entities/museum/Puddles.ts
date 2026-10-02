import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { PUDDLE } from '../../config/mutants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Lighting } from '../../systems/Lighting';
import type { Hazard, Rect } from '../types';

interface Puddle {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  life: number;
}

/**
 * Mutagen that splashes onto the floor and stings for a few seconds (the
 * frog's spit, the lurkers'). One pooled hazard for all of them.
 */
export class Puddles implements Hazard {
  readonly damage = PUDDLE.damage;
  private readonly items: Puddle[] = [];
  private hitIndex = -1;

  constructor(private readonly scene: Phaser.Scene) {}

  get active(): boolean {
    return this.items.some((p) => p.life > 0);
  }

  /** A puddle on the floor at (x, floorY). */
  spill(x: number, floorY: number): void {
    let p = this.items.find((q) => q.life <= 0);
    if (!p) {
      p = { sprite: this.scene.add.sprite(0, 0, TEX.puddle).setDepth(DEPTH.terrain + 2).play('puddle-bubble'), x: 0, y: 0, life: 0 };
      this.items.push(p);
    }
    p.x = x;
    p.y = floorY;
    p.life = PUDDLE.lifeMs;
    p.sprite.setPosition(Math.round(x), Math.round(floorY - 2)).setVisible(true).setAlpha(1).setScale(0.4, 1);
    this.scene.tweens.add({ targets: p.sprite, scaleX: 1, duration: 180, ease: 'Quad.easeOut' });
  }

  update(dtMs: number, lighting: Lighting): void {
    for (const p of this.items) {
      if (p.life <= 0) continue;
      p.life -= dtMs;
      p.sprite.setAlpha(Math.min(1, p.life / 500));
      if (p.life <= 0) p.sprite.setVisible(false);
      else lighting.add(p.x, p.y - 2, 30, PALETTE.mutagen, 0.6);
    }
  }

  /** Hazards report one box at a time: cycle through the live puddles, one per frame. */
  hitbox(out: Rect): boolean {
    const live = this.items.filter((p) => p.life > 300);
    if (live.length === 0) return false;
    this.hitIndex = (this.hitIndex + 1) % live.length;
    const p = live[this.hitIndex];
    out.x = p.x - PUDDLE.width / 2;
    out.y = p.y - 4;
    out.w = PUDDLE.width;
    out.h = 6;
    return true;
  }

  clear(): void {
    for (const p of this.items) {
      p.life = 0;
      p.sprite.setVisible(false);
    }
  }
}
