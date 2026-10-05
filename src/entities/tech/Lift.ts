import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TECH } from '../../config/tech';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Controls } from '../../systems/InputMap';
import { playSfx } from '../../systems/audio/Sfx';
import { chance } from '../../systems/Pacing';
import type { Rect } from '../types';
import type { Machine, TechDeps } from './Machine';

/**
 * A dead scissor lift. Upgrade pours into its motor and rides it up; it stays
 * up when he hops off (a lift only goes one way in this town).
 */
export class Lift implements Machine {
  readonly kind = 'lift';
  readonly rect: Rect;
  readonly body: Phaser.Physics.Arcade.Image;
  private readonly deck: Phaser.GameObjects.TileSprite;
  private readonly scissor: Phaser.GameObjects.Graphics;
  private readonly floorY: number;
  private readonly topY: number;
  private state: 'down' | 'rising' | 'up' = 'down';
  holding = false;

  constructor(
    private readonly d: TechDeps,
    readonly id: string,
    tx: number,
    ty: number,
    tw: number,
    toY: number,
  ) {
    // The pad is a tile tall, resting on row ty's floor.
    this.floorY = ty * TILE;
    this.topY = toY * TILE;
    this.rect = { x: tx * TILE, y: (ty - 1) * TILE, w: tw * TILE, h: TILE };
    const r = this.rect;
    this.scissor = d.scene.add.graphics().setDepth(DEPTH.terrain);
    this.deck = d.scene.add.tileSprite(r.x, r.y, r.w, 10, TEX.liftDeck).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    this.body = d.scene.physics.add.staticImage(r.x + r.w / 2, r.y + r.h / 2, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(r.w, r.h).refreshBody();
    d.addSolid(this.rect);
    this.drawScissor();
  }

  get anchorX(): number {
    return this.rect.x + this.rect.w / 2;
  }

  get anchorY(): number {
    return this.rect.y;
  }

  mergeBox(out: Rect): boolean {
    if (this.state !== 'down') return false;
    const r = this.rect;
    out.x = r.x - 6;
    out.y = r.y - 18;
    out.w = r.w + 12;
    out.h = r.h + 18;
    return true;
  }

  enter(): void {
    this.state = 'rising';
    this.holding = true;
    playSfx('liftHum', 0.9);
  }

  control(_c: Controls, _dtMs: number): void {
    // It knows where it's going.
  }

  /** Once powered it rises all the way, rider or not. */
  release(): void {
    this.holding = false;
  }

  update(dtMs: number): void {
    if (this.state !== 'rising') return;
    const r = this.rect;
    r.y = Math.max(this.topY, r.y - TECH.lift.speed * (dtMs / 1000));
    this.deck.setY(r.y);
    this.body.setPosition(r.x + r.w / 2, r.y + r.h / 2).refreshBody();
    this.drawScissor();
    this.d.lighting.add(r.x + r.w / 2, r.y + 4, 40, PALETTE.upgrade, 0.7);
    if (chance(0.3)) this.d.fx.trail('circuit', r.x + Math.random() * r.w, r.y + r.h);
    if (r.y <= this.topY) {
      this.state = 'up';
      this.holding = false;
      this.d.fx.burst('dust', r.x + r.w / 2, r.y + r.h, 6);
      playSfx('clamp', 0.7);
    }
  }

  /** The criss-cross arms from the floor up to the deck. */
  private drawScissor(): void {
    const r = this.rect;
    const g = this.scissor;
    g.clear();
    const bottom = this.floorY;
    const top = r.y + r.h;
    const h = bottom - top;
    g.fillStyle(PALETTE.concrete0, 1).fillRect(r.x + 2, top, r.w - 4, 3);
    if (h <= 2) return;
    const folds = Math.max(1, Math.round(h / 22));
    const step = h / folds;
    g.lineStyle(2, PALETTE.hazard, 1);
    for (let i = 0; i < folds; i++) {
      const y0 = top + i * step;
      const y1 = y0 + step;
      g.lineBetween(r.x + 4, y0, r.x + r.w - 4, y1);
      g.lineBetween(r.x + r.w - 4, y0, r.x + 4, y1);
    }
  }

  destroy(): void {
    this.deck.destroy();
    this.scissor.destroy();
  }
}
