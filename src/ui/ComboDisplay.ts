import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';

/** Right-edge hit counter that pops on every hit and cracks apart when the combo drops. */
export class ComboDisplay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly count: Phaser.GameObjects.BitmapText;
  private readonly label: Phaser.GameObjects.BitmapText;
  private hideAt = 0;
  private pop = 1;

  constructor(private readonly scene: Phaser.Scene) {
    this.count = pixelText(scene, 0, 0, '0', { scale: 3, originX: 1, originY: 0.5, color: PALETTE.gold });
    this.label = pixelText(scene, 0, 14, 'HIT COMBO', { originX: 1, originY: 0.5, color: PALETTE.cream });
    this.root = scene.add.container(GAME_WIDTH - 10, 78, [this.count, this.label]).setVisible(false);
  }

  set(count: number, now: number): void {
    this.count.setText(String(count));
    const color = count >= 25 ? PALETTE.enemyGlow : count >= 12 ? PALETTE.fire1 : PALETTE.gold;
    this.count.setTint(color);
    this.label.setText(count >= 25 ? 'UNSTOPPABLE!' : count >= 12 ? 'HERO TIME!' : 'HIT COMBO');
    this.root.setVisible(true).setAlpha(1);
    this.pop = 1.6;
    this.hideAt = now + 2400;
  }

  hide(): void {
    this.root.setVisible(false).setAlpha(1).setX(GAME_WIDTH - 10);
  }

  drop(count: number): void {
    if (!this.root.visible) return;
    this.label.setText(`x${count} DONE`);
    this.scene.tweens.add({ targets: this.root, alpha: 0, x: this.root.x + 20, duration: 500, onComplete: () => this.root.setVisible(false).setX(GAME_WIDTH - 10) });
  }

  update(dtMs: number, now: number): void {
    if (!this.root.visible) return;
    this.pop += (1 - this.pop) * Math.min(1, dtMs / 80);
    this.count.setScale(this.pop * 1);
    if (now > this.hideAt && this.root.alpha === 1) this.root.setAlpha(0.5);
  }
}
