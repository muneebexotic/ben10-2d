import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { HEART_FRAMES } from '../scenes/preload/uiArt';
import type { FormTheme } from '../aliens/types';
import { pixelText } from './text';

/** Hearts for Ben, plus a segmented alien shield bar (in the alien's colours) while transformed. */
export class HealthDisplay {
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly shieldLabel: Phaser.GameObjects.BitmapText;
  private readonly shield: Phaser.GameObjects.Graphics;
  private hp = 5;
  private formHp = 0;
  private formMax = 0;
  private formVisible = false;
  private shakeLeft = 0;
  private lowPulse = 0;
  private theme: Pick<FormTheme, 'color' | 'light' | 'dark'> = { color: PALETTE.fire2, light: PALETTE.fire0, dark: 0x3a1a14 };

  constructor(private readonly scene: Phaser.Scene, private x: number, private readonly y: number, max: number) {
    for (let i = 0; i < max; i++) {
      this.hearts.push(scene.add.image(x + i * 11, y, TEX.heart, HEART_FRAMES.full).setOrigin(0, 0).setScale(1));
    }
    this.shieldLabel = pixelText(scene, x, y + 12, 'HEAT', { color: PALETTE.fire1 });
    this.shield = scene.add.graphics();
    this.setVisible(false);
  }

  /** Moves the hearts and shield bar (pinned to the left screen edge on wide screens). */
  setX(x: number): void {
    this.x = x;
    this.shieldLabel.setX(x);
  }

  setVisible(v: boolean): void {
    for (const h of this.hearts) h.setVisible(v);
    this.shieldLabel.setVisible(v && this.formVisible);
    this.shield.setVisible(v);
  }

  setHealth(hp: number, delta: number): void {
    this.hp = hp;
    if (delta < 0) this.shakeLeft = 300;
    for (let i = 0; i < this.hearts.length; i++) {
      const v = hp - i;
      const frame = v >= 1 ? HEART_FRAMES.full : v >= 0.5 ? HEART_FRAMES.half : HEART_FRAMES.empty;
      const heart = this.hearts[i];
      if (heart.frame.name !== String(frame) && delta > 0 && frame !== HEART_FRAMES.empty) {
        heart.setScale(1.8);
        this.scene.tweens.add({ targets: heart, scale: 1, duration: 300, ease: 'Back.easeOut' });
      }
      heart.setFrame(frame);
    }
  }

  setForm(hp: number, max: number, visible: boolean, delta: number, theme: FormTheme): void {
    this.formHp = hp;
    this.formMax = max;
    this.formVisible = visible;
    if (visible && theme.shieldLabel !== this.shieldLabel.text) {
      this.shieldLabel.setText(theme.shieldLabel);
    }
    if (visible) {
      this.theme = theme;
      this.shieldLabel.setTint(theme.color);
    }
    if (delta < 0 && visible) this.shakeLeft = 250;
    this.shieldLabel.setVisible(visible && this.hearts[0].visible);
  }

  update(dtMs: number, now: number): void {
    this.shakeLeft = Math.max(0, this.shakeLeft - dtMs);
    const sx = this.shakeLeft > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    const low = this.hp <= 1.5 && !this.formVisible;
    this.lowPulse = low ? (Math.sin(now * 0.012) + 1) / 2 : 0;
    for (let i = 0; i < this.hearts.length; i++) {
      const h = this.hearts[i];
      h.setX(this.x + i * 11 + sx);
      if (low && i === Math.ceil(this.hp) - 1) h.setScale(1 + this.lowPulse * 0.3);
    }
    const g = this.shield;
    g.clear();
    if (!this.formVisible || !this.hearts[0].visible || this.formMax <= 0) return;
    const bx = this.x + Math.max(24, this.shieldLabel.width + 4) + sx;
    const by = this.y + 13;
    const seg = 7;
    for (let i = 0; i < this.formMax; i++) {
      g.fillStyle(PALETTE.ink, 1);
      g.fillRect(bx + i * (seg + 1) - 1, by - 1, seg + 2, 7);
      const filled = this.formHp - i;
      g.fillStyle(this.theme.dark, 1);
      g.fillRect(bx + i * (seg + 1), by, seg, 5);
      if (filled > 0) {
        g.fillStyle(this.theme.color, 1);
        g.fillRect(bx + i * (seg + 1), by, filled >= 1 ? seg : Math.ceil(seg / 2), 5);
      }
      if (filled >= 1) {
        g.fillStyle(this.theme.light, 0.8);
        g.fillRect(bx + i * (seg + 1), by, seg, 1);
      }
    }
  }
}
