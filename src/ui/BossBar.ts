import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { pixelText } from './text';
import { blinkOn } from '../systems/Accessibility';

const W = 300;

export class BossBar {
  private readonly root: Phaser.GameObjects.Container;
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.BitmapText;
  private ratio = 1;
  private trail = 1;
  private phase = 0;
  private shakeLeft = 0;

  constructor(private readonly scene: Phaser.Scene, y: number) {
    this.bar = scene.add.graphics();
    const icon = scene.add.image(-W / 2 - 10, 3, TEX.bossIcon);
    this.name = pixelText(scene, -W / 2, -11, '', { color: PALETTE.enemyGlow });
    this.root = scene.add.container(GAME_WIDTH / 2, y, [this.bar, icon, this.name]).setVisible(false);
  }

  show(name: string): void {
    this.name.setText(name);
    this.ratio = 1;
    this.trail = 1;
    this.root.setVisible(true).setAlpha(0).setY(this.root.y + 20);
    this.scene.tweens.add({ targets: this.root, alpha: 1, y: this.root.y - 20, duration: 500, ease: 'Cubic.easeOut' });
  }

  hide(): void {
    if (!this.root.visible) return;
    this.scene.tweens.add({ targets: this.root, alpha: 0, duration: 400, onComplete: () => this.root.setVisible(false) });
  }

  setHealth(ratio: number, phase: number): void {
    if (ratio < this.ratio) this.shakeLeft = 150;
    this.ratio = ratio;
    this.phase = phase;
  }

  update(dtMs: number, now: number): void {
    if (!this.root.visible) return;
    this.trail += (this.ratio - this.trail) * Math.min(1, dtMs / 400);
    this.shakeLeft = Math.max(0, this.shakeLeft - dtMs);
    const g = this.bar;
    g.clear();
    const sx = this.shakeLeft > 0 ? (Math.random() - 0.5) * 3 : 0;
    const x = -W / 2 + sx;
    g.fillStyle(PALETTE.ink, 1);
    g.fillRect(x - 2, -1, W + 4, 10);
    g.fillStyle(0x2a1018, 1);
    g.fillRect(x, 1, W, 6);
    g.fillStyle(PALETTE.white, 0.9);
    g.fillRect(x, 1, W * this.trail, 6);
    const pulse = this.phase === 1 && !blinkOn(now, 160);
    g.fillStyle(pulse ? PALETTE.fire3 : PALETTE.enemy, 1);
    g.fillRect(x, 1, W * this.ratio, 6);
    g.fillStyle(PALETTE.enemyGlow, 0.6);
    g.fillRect(x, 1, W * this.ratio, 1);
    g.fillStyle(PALETTE.ink, 1);
    g.fillRect(x + W * 0.5 - 1, -1, 2, 10);
  }
}
