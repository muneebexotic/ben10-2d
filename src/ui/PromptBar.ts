import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';

interface Prompt {
  id: string;
  text: string;
  priority: number;
}

/** Contextual control hints at the bottom of the screen; the highest priority wins. */
export class PromptBar {
  private readonly prompts: Prompt[] = [];
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.BitmapText;
  private shownId = '';

  constructor(private readonly scene: Phaser.Scene) {
    this.bg = scene.add.graphics();
    this.label = pixelText(scene, 0, 0, '', { originX: 0.5, originY: 0.5, color: PALETTE.white });
    this.root = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 52, [this.bg, this.label]).setVisible(false).setDepth(300);
  }

  add(id: string, text: string, priority = 1): void {
    const existing = this.prompts.find((p) => p.id === id);
    if (existing) {
      existing.text = text;
      existing.priority = priority;
    } else this.prompts.push({ id, text, priority });
    this.refresh();
  }

  clear(id: string): void {
    const i = this.prompts.findIndex((p) => p.id === id);
    if (i >= 0) this.prompts.splice(i, 1);
    this.refresh();
  }

  clearAll(): void {
    this.prompts.length = 0;
    this.refresh();
  }

  private refresh(): void {
    const top = [...this.prompts].sort((a, b) => b.priority - a.priority)[0];
    if (!top) {
      this.shownId = '';
      this.root.setVisible(false);
      return;
    }
    this.label.setText(top.text);
    const w = Math.ceil(this.label.width) + 18;
    this.bg.clear();
    this.bg.fillStyle(PALETTE.ink, 0.85);
    this.bg.fillRoundedRect(-w / 2, -9, w, 18, 4);
    this.bg.lineStyle(1, PALETTE.omnitrixDark, 1);
    this.bg.strokeRoundedRect(-w / 2, -9, w, 18, 4);
    if (top.id !== this.shownId) {
      this.root.setVisible(true).setScale(0.6).setAlpha(0);
      this.scene.tweens.add({ targets: this.root, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    }
    this.shownId = top.id;
  }

  update(now: number): void {
    if (!this.root.visible) return;
    const big = this.shownId === 'transform';
    const pulse = (Math.sin(now * (big ? 0.012 : 0.005)) + 1) / 2;
    this.label.setTint(big ? (pulse > 0.5 ? PALETTE.omnitrix : PALETTE.white) : PALETTE.white);
    if (big) this.root.setScale(1.3 + pulse * 0.15);
  }
}
