import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import { pixelText } from './text';
import { blinkOn } from '../systems/Accessibility';
import { BakedGraphics } from './BakedGraphics';
import { getAlien, hasAlien } from '../aliens/registry';

const W = 300;
/** Copy meter entries, right-aligned on the name row. */
const COPY_STEP = 18;

export class BossBar {
  private readonly root: Phaser.GameObjects.Container;
  private readonly bar: BakedGraphics;
  private barKey = '';
  private readonly name: Phaser.GameObjects.BitmapText;
  private ratio = 1;
  private trail = 1;
  private phase = 0;
  private shakeLeft = 0;
  private readonly copyIcons: Phaser.GameObjects.Image[] = [];
  private readonly copyPips: BakedGraphics;
  private readonly copyLabel: Phaser.GameObjects.BitmapText;
  private copies: ReadonlyArray<{ id: string; level: number }> = [];
  private current: string | null = null;

  constructor(private readonly scene: Phaser.Scene, y: number) {
    this.bar = new BakedGraphics(scene, -W / 2 - 2, -1, W + 4, 10);
    const icon = scene.add.image(-W / 2 - 10, 3, TEX.bossIcon);
    this.name = pixelText(scene, -W / 2, -11, '', { color: PALETTE.enemyGlow });
    this.copyPips = new BakedGraphics(scene, -W / 2, -22, W, 20);
    this.copyLabel = pixelText(scene, 0, -11, 'COPIES', { originX: 1, color: PALETTE.kevin }).setVisible(false);
    this.root = scene.add.container(GAME_WIDTH / 2, y, [this.bar.image, icon, this.name, this.copyPips.image, this.copyLabel]).setVisible(false);
  }

  /**
   * Kevin's copy meter: one icon per alien he has data on, with pips for its
   * copy level (I-III), the one he's copying now lit up.
   */
  setCopies(list: ReadonlyArray<{ id: string; level: number }>, current: string | null): void {
    this.copies = list.filter((e) => hasAlien(e.id));
    this.current = current;
    while (this.copyIcons.length < this.copies.length) {
      const img = this.scene.add.image(0, 0, TEX.bossIcon).setScale(0.7);
      this.copyIcons.push(img);
      this.root.add(img);
    }
    const n = this.copies.length;
    const right = W / 2 - 12;
    this.copyIcons.forEach((img, i) => {
      const e = this.copies[i];
      if (!e) {
        img.setVisible(false);
        return;
      }
      const a = getAlien(e.id);
      const x = right - (n - 1 - i) * COPY_STEP;
      const on = e.id === current;
      img.setTexture(a.hudIcon).setPosition(x, -13).setVisible(true).setTint(on ? PALETTE.kevin : a.theme.color).setAlpha(on || e.level > 0 ? 1 : 0.5).setScale(on ? 0.85 : 0.65);
    });
    this.copyLabel.setVisible(n > 0).setX(right - (n - 1) * COPY_STEP - 10);
    this.copyPips.draw((g) => {
      this.copies.forEach((e, i) => {
        // The icon's centre; its level pips stack up just right of it.
        const ix = right - (n - 1 - i) * COPY_STEP;
        for (let l = 0; l < 3; l++) {
          const filled = l < e.level;
          g.fillStyle(filled ? (e.level >= 3 ? PALETTE.enemy : PALETTE.kevin) : PALETTE.inkSoft, 1);
          g.fillRect(ix + 7, -8 - l * 4, 3, 3);
        }
        if (e.id === this.current) {
          g.lineStyle(1, PALETTE.kevin, 1);
          g.strokeRect(ix - 8, -21, 19, 17);
        }
      });
    });
  }

  show(name: string): void {
    this.name.setText(name);
    this.setCopies([], null);
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
    // The shake moves the bar; it is redrawn only when a fill covers a different number of pixels.
    this.bar.image.setX(this.shakeLeft > 0 ? Math.round((Math.random() - 0.5) * 3) : 0);
    const pulse = this.phase === 1 && !blinkOn(now, 160);
    const trailW = Math.floor(W * this.trail + 0.5);
    const ratioW = Math.floor(W * this.ratio + 0.5);
    const key = `${trailW}|${ratioW}|${pulse}`;
    if (key === this.barKey) return;
    this.barKey = key;
    const x = -W / 2;
    this.bar.draw((g) => {
      g.fillStyle(PALETTE.ink, 1);
      g.fillRect(x - 2, -1, W + 4, 10);
      g.fillStyle(0x2a1018, 1);
      g.fillRect(x, 1, W, 6);
      g.fillStyle(PALETTE.white, 0.9);
      g.fillRect(x, 1, trailW, 6);
      g.fillStyle(pulse ? PALETTE.fire3 : PALETTE.enemy, 1);
      g.fillRect(x, 1, ratioW, 6);
      g.fillStyle(PALETTE.enemyGlow, 0.6);
      g.fillRect(x, 1, ratioW, 1);
      g.fillStyle(PALETTE.ink, 1);
      g.fillRect(x + W * 0.5 - 1, -1, 2, 10);
    });
  }
}
