import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { TEX } from '../../scenes/preload/assetKeys';

/**
 * Immediate-mode warning visuals (aim lines, target reticles, danger zones).
 * Cleared every frame; enemies redraw what they are about to do. Always emissive
 * so a telegraph is never hidden by the night. Danger zones always carry a
 * shape cue (stripes, chevrons or a cross) so they read without colour.
 */
export class Telegraphs {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly reticles: Phaser.GameObjects.Image[] = [];
  private used = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(DEPTH.emissive + 1).setBlendMode(Phaser.BlendModes.ADD);
  }

  begin(): void {
    this.g.clear();
    for (let i = 0; i < this.used; i++) this.reticles[i].setVisible(false);
    this.used = 0;
  }

  line(x1: number, y1: number, x2: number, y2: number, color: number, alpha: number, width = 1): void {
    this.g.lineStyle(width, color, alpha);
    this.g.lineBetween(x1, y1, x2, y2);
  }

  /** Dashed aim line; `phase` animates the dashes toward the target. */
  dashed(x1: number, y1: number, x2: number, y2: number, color: number, alpha: number, phase: number, width = 1): void {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;
    const dash = 6;
    const period = dash + 4;
    this.g.lineStyle(width, color, alpha);
    for (let d = -(phase % period); d < len; d += period) {
      const a = Math.max(0, d);
      const b = Math.min(len, d + dash);
      if (b <= a) continue;
      this.g.lineBetween(x1 + dx * a, y1 + dy * a, x1 + dx * b, y1 + dy * b);
    }
  }

  rect(x: number, y: number, w: number, h: number, color: number, alpha: number): void {
    this.g.fillStyle(color, alpha);
    this.g.fillRect(x, y, w, h);
  }

  /**
   * A danger zone that doesn't rely on colour alone: a tinted fill with bold
   * diagonal hazard stripes (they crawl with `phase`), or chevrons pointing
   * the way the attack will travel when `dir` is given. `strength` (0..1)
   * scales how loudly it reads as the attack gets close.
   */
  zone(x: number, y: number, w: number, h: number, color: number, strength: number, phase = 0, dir: 1 | -1 | 0 = 0): void {
    if (w <= 0 || h <= 0) return;
    const a = Math.max(0, Math.min(1, strength));
    this.g.fillStyle(color, 0.06 + a * 0.12);
    this.g.fillRect(x, y, w, h);
    this.g.lineStyle(1, color, 0.35 + a * 0.5);
    this.g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (dir !== 0) this.chevrons(x, y, w, h, color, 0.3 + a * 0.6, phase, dir);
    else this.stripes(x, y, w, h, color, 0.18 + a * 0.4, phase);
  }

  /** A circular impact marker with a cross through it (bombs, landings). */
  target(x: number, y: number, r: number, color: number, alpha: number): void {
    this.g.lineStyle(1, color, alpha);
    this.g.strokeCircle(x, y, r);
    const k = r * 0.62;
    this.g.lineStyle(2, color, alpha * 0.85);
    this.g.lineBetween(x - k, y - k, x + k, y + k);
    this.g.lineBetween(x - k, y + k, x + k, y - k);
  }

  /** 45-degree hazard stripes clipped to the rectangle. */
  private stripes(x: number, y: number, w: number, h: number, color: number, alpha: number, phase: number): void {
    const gap = 9;
    this.g.lineStyle(3, color, alpha);
    const offset = ((phase % gap) + gap) % gap;
    // Lines x - y = c, swept across the rectangle.
    for (let c = x - y - h + offset - gap; c <= x + w - y; c += gap) {
      // Intersect x = y + c with the rectangle [x, x+w] x [y, y+h].
      const y0 = Math.max(y, x - c);
      const y1 = Math.min(y + h, x + w - c);
      if (y1 <= y0) continue;
      this.g.lineBetween(y0 + c, y0, y1 + c, y1);
    }
  }

  /** Rows of chevrons (> > >) marching in the attack's direction. */
  private chevrons(x: number, y: number, w: number, h: number, color: number, alpha: number, phase: number, dir: 1 | -1): void {
    const step = 16;
    const half = Math.min(h / 2 - 1, 6);
    if (half < 2) return;
    const cy = y + h / 2;
    const offset = ((phase % step) + step) % step;
    this.g.lineStyle(2, color, alpha);
    for (let i = -1; i * step < w + step; i++) {
      const tip = dir > 0 ? x + i * step + offset : x + w - i * step - offset;
      const back = tip - dir * half;
      if (Math.min(tip, back) < x || Math.max(tip, back) > x + w) continue;
      this.g.lineBetween(back, cy - half, tip, cy);
      this.g.lineBetween(tip, cy, back, cy + half);
    }
  }

  circle(x: number, y: number, r: number, color: number, alpha: number, filled = false): void {
    if (filled) {
      this.g.fillStyle(color, alpha);
      this.g.fillCircle(x, y, r);
    } else {
      this.g.lineStyle(1, color, alpha);
      this.g.strokeCircle(x, y, r);
    }
  }

  reticle(x: number, y: number, color: number, scale: number, angle: number, alpha = 1): void {
    let img = this.reticles[this.used];
    if (!img) {
      img = this.scene.add.image(0, 0, TEX.reticle).setDepth(DEPTH.emissive + 2).setBlendMode(Phaser.BlendModes.ADD);
      this.reticles.push(img);
    }
    this.used++;
    img.setPosition(x, y).setTint(color).setScale(scale).setAngle(angle).setAlpha(alpha).setVisible(true);
  }
}
