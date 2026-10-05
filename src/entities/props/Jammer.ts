import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { barrierBody } from '../barrier';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hit, HitResult, Rect } from '../types';
import { chance } from '../../systems/Pacing';

const JAMMER_HP = 3;

/**
 * Vilgax signal jammer. Its field reverts any alien that enters and blocks
 * transforming inside; an energy gate seals the exit until the core is smashed.
 */
export class Jammer implements Damageable {
  readonly countsAsEnemy = false;
  readonly pylon: Phaser.GameObjects.Sprite;
  readonly gate: Phaser.Physics.Arcade.Image;
  private readonly gateTiles: Phaser.GameObjects.Sprite[] = [];
  private readonly fieldOverlay: Phaser.GameObjects.TileSprite;
  private readonly edge: Phaser.GameObjects.TileSprite;
  readonly fieldLeft: number;
  readonly fieldRight: number;
  alive = true;
  private hp = JAMMER_HP;
  private pulseT = 0;
  private flashLeft = 0;
  onDestroyed: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    tx: number,
    ty: number,
    fieldFrom: number,
    gateX: number,
    gateTop: number,
    private readonly fx: Fx,
  ) {
    const x = tx * TILE + TILE / 2;
    const groundY = ty * TILE;
    this.pylon = scene.add.sprite(x, groundY, TEX.jammer, 0).setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.pylon.play('jammer-pulse');
    this.fieldLeft = fieldFrom * TILE;
    this.fieldRight = gateX * TILE;

    const gateH = (ty - gateTop) * TILE;
    const gx = gateX * TILE + 4;
    // Ben comes from the left and is held there until the jammer goes down.
    this.gate = barrierBody(scene, gx - 4, -1, gateTop * TILE, gateTop * TILE + gateH);
    for (let y = gateTop * TILE; y < groundY; y += TILE) {
      const tile = scene.add.sprite(gx, y + 8, TEX.gate, 0).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD);
      tile.play('gate-hum');
      this.gateTiles.push(tile);
    }

    const height = 20 * TILE;
    const top = groundY - height + 4 * TILE;
    this.fieldOverlay = scene.add
      .tileSprite(this.fieldLeft, top, this.fieldRight - this.fieldLeft, height, TEX.gate)
      .setOrigin(0, 0)
      .setDepth(DEPTH.emissive - 1)
      .setAlpha(0.06)
      .setTint(PALETTE.jammer)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.edge = scene.add
      .tileSprite(this.fieldLeft, top, 8, height, TEX.gate)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.emissive)
      .setAlpha(0.45)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  get fieldActive(): boolean {
    return this.alive;
  }

  inField(x: number): boolean {
    return this.alive && x > this.fieldLeft && x < this.fieldRight;
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.pylon.x - 9;
    out.y = this.pylon.y - 28;
    out.w = 18;
    out.h = 18;
    return true;
  }

  takeHit(_hit: Hit): HitResult {
    if (!this.alive) return 'none';
    this.hp -= 1;
    this.flashLeft = 120;
    this.pylon.stop().setFrame(2);
    this.fx.burst('blue', this.pylon.x, this.pylon.y - 19, 12);
    this.fx.burst('spark', this.pylon.x, this.pylon.y - 19, 6);
    playSfx('jammed', 0.6);
    if (this.hp <= 0) {
      this.destroy();
      return 'killed';
    }
    return 'hit';
  }

  private destroy(): void {
    this.alive = false;
    this.pylon.stop().setFrame(3);
    const cx = this.pylon.x;
    const cy = this.pylon.y - 20;
    this.fx.explosion(cx, cy, 'big');
    this.fx.burst('blue', cx, cy, 40);
    this.fx.ring(cx, cy, PALETTE.jammer, 260, 700);
    this.fx.light(cx, cy, 260, PALETTE.jammer, 900);
    playSfx('gateDown');
    this.gate.disableBody(true, true);
    for (const t of this.gateTiles) {
      this.fx.burst('blue', t.x, t.y, 3);
      t.setVisible(false);
    }
    this.fieldOverlay.setVisible(false);
    this.edge.setVisible(false);
    this.onDestroyed?.();
  }

  update(dtMs: number, lighting: Lighting, now: number): void {
    this.fieldOverlay.tilePositionY -= dtMs * 0.02;
    this.edge.tilePositionY += dtMs * 0.05;
    if (!this.alive) {
      if (chance(0.05)) this.fx.trail('smoke', this.pylon.x, this.pylon.y - 30);
      return;
    }
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.flashLeft <= 0 && !this.pylon.anims.isPlaying) this.pylon.play('jammer-pulse');
    this.pulseT += dtMs;
    if (this.pulseT > 1600) {
      this.pulseT = 0;
      this.fx.ring(this.pylon.x, this.pylon.y - 19, PALETTE.jammer, 90, 900);
    }
    const cx = this.pylon.x;
    lighting.add(cx, this.pylon.y - 20, 90 + Math.sin(now * 0.006) * 10, PALETTE.jammer, 1);
    lighting.add(this.fieldRight, this.pylon.y - 60, 80, PALETTE.jammer, 0.8);
    lighting.add(this.fieldLeft, this.pylon.y - 60, 60, PALETTE.jammer, 0.5);
  }
}
