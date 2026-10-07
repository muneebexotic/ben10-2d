import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { HEART_FRAMES } from '../scenes/preload/uiArt';
import type { FormTheme } from '../aliens/types';
import { pixelText } from './text';
import { BakedGraphics } from './BakedGraphics';

const SEG = 7;
/** The shield bar's texture fits this many segments (Four Arms has 9). */
const MAX_SEGMENTS = 16;

/** Hearts for Ben, plus a segmented alien shield bar (in the alien's colours) while transformed. */
export class HealthDisplay {
  private readonly hearts: Phaser.GameObjects.Image[] = [];
  private readonly shieldLabel: Phaser.GameObjects.BitmapText;
  private readonly shield: BakedGraphics;
  private shieldKey = '';
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
    this.shield = new BakedGraphics(scene, -1, -1, MAX_SEGMENTS * (SEG + 1) + 2, 7);
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
    this.shield.image.setVisible(v && this.formVisible && this.formMax > 0);
  }

  setHealth(hp: number, delta: number): void {
    this.hp = hp;
    if (delta < 0) this.shakeLeft = 300;
    for (let i = 0; i < this.hearts.length; i++) {
      const v = hp - i;
      const frame = v >= 1 ? HEART_FRAMES.full : v >= 0.5 ? HEART_FRAMES.half : HEART_FRAMES.empty;
      const heart = this.hearts[i];
      if (String(heart.frame.name) !== String(frame) && delta > 0 && frame !== HEART_FRAMES.empty) {
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
    const shown = this.formVisible && this.hearts[0].visible && this.formMax > 0;
    this.shield.image.setVisible(shown);
    if (!shown) return;
    // The shake moves the bar; it is only redrawn when the segments change.
    this.shield.image.setPosition(this.x + Math.max(24, this.shieldLabel.width + 4) + sx, this.y + 13);
    const { dark, color, light } = this.theme;
    const key = `${this.formMax}|${this.formHp}|${dark}|${color}|${light}`;
    if (key === this.shieldKey) return;
    this.shieldKey = key;
    this.shield.draw((g) => {
      for (let i = 0; i < Math.min(this.formMax, MAX_SEGMENTS); i++) {
        const x = i * (SEG + 1);
        g.fillStyle(PALETTE.ink, 1);
        g.fillRect(x - 1, -1, SEG + 2, 7);
        const filled = this.formHp - i;
        g.fillStyle(dark, 1);
        g.fillRect(x, 0, SEG, 5);
        if (filled > 0) {
          g.fillStyle(color, 1);
          g.fillRect(x, 0, filled >= 1 ? SEG : Math.ceil(SEG / 2), 5);
        }
        if (filled >= 1) {
          g.fillStyle(light, 0.8);
          g.fillRect(x, 0, SEG, 1);
        }
      }
    });
  }
}
