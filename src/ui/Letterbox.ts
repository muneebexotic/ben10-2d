import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

const BAR = 34;

export class Letterbox {
  private readonly top: Phaser.GameObjects.Rectangle;
  private readonly bottom: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene) {
    this.top = scene.add.rectangle(0, -BAR, GAME_WIDTH, BAR, 0x000000).setOrigin(0, 0).setDepth(900);
    this.bottom = scene.add.rectangle(0, GAME_HEIGHT, GAME_WIDTH, BAR, 0x000000).setOrigin(0, 0).setDepth(900);
  }

  private shown = false;

  set(visible: boolean): void {
    if (visible === this.shown) return;
    this.shown = visible;
    this.scene.tweens.add({ targets: this.top, y: visible ? 0 : -BAR, duration: 350, ease: 'Cubic.easeInOut' });
    this.scene.tweens.add({ targets: this.bottom, y: visible ? GAME_HEIGHT - BAR : GAME_HEIGHT, duration: 350, ease: 'Cubic.easeInOut' });
  }
}
