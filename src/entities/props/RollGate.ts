import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import type { Rect } from '../types';

/**
 * A seal only a rolling ball breaks (Ricochet curled up): copper shell plates
 * over a chute, set into the rock. Drawn as vectors (it looks the same in the
 * pixel chapters and the HD ones); the rock behind it stays solid until it
 * gives, then those cells clear for good.
 */
export class RollGate {
  readonly rect: Rect;
  broken = false;
  private readonly art: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    tx: number,
    ty: number,
    tw: number,
    th: number,
  ) {
    this.rect = { x: tx * TILE, y: ty * TILE, w: tw * TILE, h: th * TILE };
    const r = this.rect;
    const g = scene.add.graphics().setDepth(DEPTH.terrain + 1);
    // Overlapping plates with teal seams and rivets: it reads as "a ball could crack this".
    g.fillStyle(0x6a3a1e, 1).fillRect(r.x, r.y, r.w, r.h);
    for (let x = r.x; x < r.x + r.w; x += 8) {
      g.fillStyle(0xc8743a, 1).fillRoundedRect(x + 0.5, r.y + 1, 7, r.h - 2, 2);
      g.fillStyle(0xf0a868, 0.8).fillRect(x + 1.5, r.y + 2, 4, 1.5);
    }
    g.lineStyle(1, 0x5ae8c8, 0.9);
    for (let x = r.x + 8; x < r.x + r.w; x += 8) g.lineBetween(x, r.y + 1, x, r.y + r.h - 1);
    g.lineStyle(1, 0x1a1422, 1).strokeRect(r.x, r.y, r.w, r.h);
    this.art = g;
  }

  /** The ball is touching it (a pixel or two either side counts). */
  touches(x: number, y: number, radius: number): boolean {
    const r = this.rect;
    return x + radius > r.x - 2 && x - radius < r.x + r.w + 2 && y + radius > r.y - 3 && y - radius < r.y + r.h + 3;
  }

  break(): void {
    this.broken = true;
    this.art.destroy();
  }
}
