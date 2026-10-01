import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Lighting } from '../../systems/Lighting';

export class Checkpoint {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly x: number;
  readonly y: number;
  lit = false;

  constructor(scene: Phaser.Scene, readonly id: string, readonly label: string, tx: number, ty: number) {
    this.x = tx * TILE + TILE / 2;
    this.y = ty * TILE;
    this.sprite = scene.add.sprite(this.x, this.y, TEX.checkpoint, 0).setOrigin(0.5, 1).setDepth(DEPTH.props);
  }

  light(): void {
    this.lit = true;
    this.sprite.setFrame(1);
  }

  contains(px: number, py: number): boolean {
    return Math.abs(px - this.x) < 14 && py > this.y - 48 && py <= this.y + 4;
  }

  update(lighting: Lighting, now: number): void {
    const pulse = this.lit ? 0.8 + Math.sin(now * 0.005) * 0.15 : 0.35;
    lighting.add(this.x, this.y - 24, this.lit ? 70 : 30, this.lit ? PALETTE.omnitrix : PALETTE.omnitrixDark, pulse);
  }
}
