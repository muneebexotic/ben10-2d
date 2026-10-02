import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/constants';
import { PALETTE } from '../config/palette';
import { a11y } from '../systems/Accessibility';
import { pixelText } from './text';
import type { ViewFrame } from './view';

const NARRATION = [
  'MEANWHILE, AT 500 MILES PER HOUR...',
  'IN LESS TIME THAN IT TAKES TO BLINK...',
  'THE DRONES NEVER SAW HIM COMING.',
  'TOO FAST TO DRAW. WE TRIED.',
];

/**
 * XLR8's multi-cut: the world freezes into a comic panel. Halftone dots,
 * speed lines rushing at him, an ink border, a narration caption and a big
 * "SHHHK!", then everything he passed bursts at once.
 */
export class ComicPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly caption: Phaser.GameObjects.BitmapText;
  private readonly captionBox: Phaser.GameObjects.Graphics;
  private readonly sfxWord: Phaser.GameObjects.Container;
  private readonly countText: Phaser.GameObjects.BitmapText;
  private left = 0;
  private narration = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly frame: ViewFrame) {
    this.g = scene.add.graphics();
    this.captionBox = scene.add.graphics();
    this.caption = pixelText(scene, 0, 0, '', { color: PALETTE.ink });
    const word = pixelText(scene, 0, 0, 'SHHHK!', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.white });
    word.setTint(PALETTE.white, PALETTE.white, 0x9fd8ff, 0x9fd8ff);
    const wordShadow = pixelText(scene, 4, 4, 'SHHHK!', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    this.countText = pixelText(scene, 0, 26, '', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.gold });
    this.sfxWord = scene.add.container(0, 0, [wordShadow, word, this.countText]);
    this.root = scene.add.container(0, 0, [this.g, this.sfxWord, this.captionBox, this.caption]).setDepth(470).setVisible(false);
  }

  /** `x`/`y`: XLR8 on screen (view coordinates). */
  show(count: number, x: number, y: number, dir: 1 | -1, color: number, ms: number): void {
    this.left = ms;
    const f = this.frame;
    // View coordinates to frame coordinates (the HUD camera slides on wide screens).
    const px = x + f.left;
    const py = y;
    const L = f.left;
    const R = f.right;
    const H = GAME_HEIGHT;
    const g = this.g;
    g.clear();

    // Halftone dots, bigger toward the edges.
    for (let gy = 6; gy < H; gy += 9) {
      for (let gx = L + ((gy / 9) % 2) * 4.5 + 4; gx < R; gx += 9) {
        const d = Math.hypot((gx - px) / (R - L), (gy - py) / H);
        const r = Math.max(0, (d - 0.22) * 4.2);
        if (r > 0.4) g.fillStyle(PALETTE.white, 0.16).fillCircle(gx, gy, Math.min(3, r));
      }
    }
    // Speed lines rushing in at XLR8.
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const far = 520;
      const near = 46 + Math.random() * 60;
      g.lineStyle(i % 3 === 0 ? 2 : 1, i % 4 === 0 ? color : PALETTE.white, 0.75);
      g.lineBetween(px + Math.cos(a) * far, py + Math.sin(a) * far, px + Math.cos(a) * near, py + Math.sin(a) * near);
    }
    // The ink border of the panel.
    g.lineStyle(5, PALETTE.ink, 1).strokeRect(L + 6, 6, R - L - 12, H - 12);
    g.lineStyle(1, PALETTE.white, 0.9).strokeRect(L + 9.5, 9.5, R - L - 19, H - 19);

    // Narration caption across the top (clear of the dial and the timer).
    this.caption.setText(NARRATION[this.narration++ % NARRATION.length]);
    const cw = this.caption.width + 16;
    const cx = (L + R) / 2 - cw / 2;
    this.caption.setPosition(cx + 8, 34);
    const cb = this.captionBox;
    cb.clear();
    cb.fillStyle(PALETTE.gold, 1).fillRect(cx, 28, cw, 20);
    cb.lineStyle(2, PALETTE.ink, 1).strokeRect(cx, 28, cw, 20);

    // The sound effect, on the side he's heading to.
    const wx = Phaser.Math.Clamp(px + dir * 120, L + 90, R - 90);
    this.sfxWord.setPosition(wx, Math.max(70, py - 70)).setAngle(dir * -8).setScale(2.4).setAlpha(0);
    this.countText.setText(`X${count} CUT!`);
    this.scene.tweens.add({ targets: this.sfxWord, scale: 1, alpha: 1, duration: 140, ease: 'Back.easeOut' });

    this.root.setVisible(true).setAlpha(1);
    this.root.setScale(1.04);
    this.scene.tweens.add({ targets: this.root, scale: 1, duration: 120, ease: 'Quad.easeOut' });
  }

  update(dtMs: number): void {
    if (this.left <= 0) return;
    this.left -= dtMs;
    if (this.left > 0) return;
    // Snap back: the panel tears away as everything bursts.
    this.scene.tweens.add({ targets: this.root, alpha: 0, duration: a11y.reduceFlashing ? 220 : 120, onComplete: () => this.root.setVisible(false) });
  }

  hide(): void {
    this.left = 0;
    this.root.setVisible(false);
  }
}
