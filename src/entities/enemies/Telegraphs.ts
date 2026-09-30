import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { TEX } from '../../scenes/preload/assetKeys';

/**
 * Immediate-mode warning visuals (aim lines, target reticles, danger zones).
 * Cleared every frame; enemies redraw what they are about to do. Always emissive
 * so a telegraph is never hidden by the night.
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
