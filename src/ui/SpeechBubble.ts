import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';
import { BakedGraphics } from './BakedGraphics';

/** Ben's quips, floating above his head in world space. */
export class SpeechBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly bg: BakedGraphics;
  private readonly text: Phaser.GameObjects.BitmapText;
  private left = 0;

  constructor(private readonly scene: Phaser.Scene) {
    // Room for the longest quip (the bubble is centred on Ben's head).
    this.bg = new BakedGraphics(scene, -320, -9, 640, 24);
    this.text = pixelText(scene, 0, 0, '', { originX: 0.5, originY: 0.5, color: PALETTE.ink });
    this.container = scene.add.container(0, 0, [this.bg.image, this.text]).setDepth(DEPTH.worldUi).setVisible(false);
  }

  show(message: string, durationMs = 1800, color: number = PALETTE.white): void {
    this.text.setText(message);
    this.text.setTint(color);
    const w = Math.ceil(this.text.width) + 10;
    const h = 15;
    this.bg.draw((g) => {
      g.fillStyle(PALETTE.white, 1);
      g.fillRoundedRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 4);
      g.fillStyle(PALETTE.uiPanel, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
      g.fillStyle(PALETTE.white, 1);
      g.fillTriangle(-4, h / 2, 4, h / 2, -2, h / 2 + 6);
      g.fillStyle(PALETTE.uiPanel, 1);
      g.fillTriangle(-3, h / 2 - 1, 2, h / 2 - 1, -2, h / 2 + 4);
    });
    this.text.setPosition(0, 0);
    this.left = durationMs;
    this.container.setVisible(true).setScale(0.3).setAlpha(1);
    this.scene.tweens.add({ targets: this.container, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  update(x: number, headY: number, dtMs: number): void {
    if (this.left <= 0) return;
    this.left -= dtMs;
    this.container.setPosition(Math.round(x), Math.round(headY - 14));
    if (this.left <= 250) this.container.setAlpha(Math.max(0, this.left / 250));
    if (this.left <= 0) this.container.setVisible(false);
  }

  get visible(): boolean {
    return this.left > 0;
  }
}
