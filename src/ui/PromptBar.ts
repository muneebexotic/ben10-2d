import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_MAX_WIDTH, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { pixelText } from './text';
import { inputMode } from '../systems/InputMode';
import { BakedGraphics } from './BakedGraphics';

interface Prompt {
  id: string;
  text: string;
  priority: number;
}

/** Contextual control hints at the bottom of the screen; the highest priority wins. */
export class PromptBar {
  private readonly prompts: Prompt[] = [];
  private readonly root: Phaser.GameObjects.Container;
  private readonly bg: BakedGraphics;
  private readonly label: Phaser.GameObjects.BitmapText;
  private shownId = '';

  constructor(private readonly scene: Phaser.Scene) {
    // Wide enough for the longest prompt on the widest view.
    this.bg = new BakedGraphics(scene, -GAME_MAX_WIDTH / 2, -10, GAME_MAX_WIDTH, 20);
    this.label = pixelText(scene, 0, 0, '', { originX: 0.5, originY: 0.5, color: PALETTE.white });
    this.root = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 52, [this.bg.image, this.label]).setVisible(false).setDepth(300);
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

  /** Re-renders the current prompt (the player switched between keys and touch). */
  rerender(): void {
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
    this.label.setText(inputMode.format(top.text));
    const w = Math.ceil(this.label.width) + 18;
    this.bg.draw((g) => {
      g.fillStyle(PALETTE.ink, 0.85);
      g.fillRoundedRect(-w / 2, -9, w, 18, 4);
      g.lineStyle(1, PALETTE.omnitrixDark, 1);
      g.strokeRoundedRect(-w / 2, -9, w, 18, 4);
    });
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
