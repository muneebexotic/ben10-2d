import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import type { Tell } from '../../config/tells';
import { TEX } from '../../scenes/preload/assetKeys';

/** A plain colour, or a villain's tell: danger red with the villain's colour as an edge beside it. */
export type TellColor = number | Tell;

/**
 * Immediate-mode warning visuals (aim lines, target reticles, danger zones).
 * Cleared every frame; enemies redraw what they are about to do. Always emissive
 * so a telegraph is never hidden by the night. Danger zones always carry a
 * shape cue (stripes, chevrons or a cross) so they read without colour.
 *
 * A villain's tell (`TELL` in config/tells.ts) draws its red core as usual and
 * the villain's colour as a thin edge beside it, never on top (the layer is
 * additive, so overlapping the two would wash the red out).
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

  line(x1: number, y1: number, x2: number, y2: number, color: TellColor, alpha: number, width = 1): void {
    const core = coreOf(color);
    const edge = edgeOf(color);
    if (edge !== null) {
      const [ox, oy] = sideOffset(x1, y1, x2, y2, width);
      this.g.lineStyle(1, edge, alpha * EDGE_ALPHA);
      this.g.lineBetween(x1 + ox, y1 + oy, x2 + ox, y2 + oy);
      this.g.lineBetween(x1 - ox, y1 - oy, x2 - ox, y2 - oy);
    }
    this.g.lineStyle(width, core, alpha);
    this.g.lineBetween(x1, y1, x2, y2);
  }

  /** Dashed aim line; `phase` animates the dashes toward the target. */
  dashed(x1: number, y1: number, x2: number, y2: number, color: TellColor, alpha: number, phase: number, width = 1): void {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;
    const edge = edgeOf(color);
    if (edge !== null) {
      const [ox, oy] = sideOffset(x1, y1, x2, y2, width);
      this.g.lineStyle(1, edge, alpha * EDGE_ALPHA);
      this.dashes(x1 + ox, y1 + oy, x2 + ox, y2 + oy, len, phase);
      this.dashes(x1 - ox, y1 - oy, x2 - ox, y2 - oy, len, phase);
    }
    this.g.lineStyle(width, coreOf(color), alpha);
    this.dashes(x1, y1, x2, y2, len, phase);
  }

  private dashes(x1: number, y1: number, x2: number, y2: number, len: number, phase: number): void {
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;
    const dash = 6;
    const period = dash + 4;
    for (let d = -(phase % period); d < len; d += period) {
      const a = Math.max(0, d);
      const b = Math.min(len, d + dash);
      if (b <= a) continue;
      this.g.lineBetween(x1 + dx * a, y1 + dy * a, x1 + dx * b, y1 + dy * b);
    }
  }

  rect(x: number, y: number, w: number, h: number, color: TellColor, alpha: number): void {
    const edge = edgeOf(color);
    if (edge !== null) {
      this.g.fillStyle(edge, alpha * EDGE_ALPHA);
      this.g.fillRect(x, y - 1, w, 1);
      this.g.fillRect(x, y + h, w, 1);
    }
    this.g.fillStyle(coreOf(color), alpha);
    this.g.fillRect(x, y, w, h);
  }

  /**
   * A danger zone that doesn't rely on colour alone: a tinted fill with bold
   * diagonal hazard stripes (they crawl with `phase`), or chevrons pointing
   * the way the attack will travel when `dir` is given. `strength` (0..1)
   * scales how loudly it reads as the attack gets close.
   */
  zone(x: number, y: number, w: number, h: number, tell: TellColor, strength: number, phase = 0, dir: 1 | -1 | 0 = 0): void {
    if (w <= 0 || h <= 0) return;
    const a = Math.max(0, Math.min(1, strength));
    const color = coreOf(tell);
    const edge = edgeOf(tell);
    this.g.fillStyle(color, 0.06 + a * 0.12);
    this.g.fillRect(x, y, w, h);
    this.g.lineStyle(1, color, 0.35 + a * 0.5);
    this.g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (edge !== null) {
      // The villain's colour frames the zone from outside.
      this.g.lineStyle(1, edge, (0.35 + a * 0.5) * EDGE_ALPHA);
      this.g.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
    }
    if (dir !== 0) this.chevrons(x, y, w, h, color, 0.3 + a * 0.6, phase, dir);
    else this.stripes(x, y, w, h, color, 0.18 + a * 0.4, phase);
  }

  /** A circular impact marker with a cross through it (bombs, landings). */
  target(x: number, y: number, r: number, tell: TellColor, alpha: number): void {
    const color = coreOf(tell);
    const edge = edgeOf(tell);
    if (edge !== null) {
      this.g.lineStyle(1, edge, alpha * EDGE_ALPHA);
      this.g.strokeCircle(x, y, r + 2);
    }
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

  circle(x: number, y: number, r: number, tell: TellColor, alpha: number, filled = false): void {
    const color = coreOf(tell);
    const edge = edgeOf(tell);
    if (edge !== null) {
      this.g.lineStyle(1, edge, alpha * EDGE_ALPHA);
      this.g.strokeCircle(x, y, r + 2);
    }
    if (filled) {
      this.g.fillStyle(color, alpha);
      this.g.fillCircle(x, y, r);
    } else {
      this.g.lineStyle(1, color, alpha);
      this.g.strokeCircle(x, y, r);
    }
  }

  reticle(x: number, y: number, tell: TellColor, scale: number, angle: number, alpha = 1): void {
    const edge = edgeOf(tell);
    // The edge: a second, larger reticle in the villain's colour turning the other way.
    if (edge !== null) this.reticleImage(x, y, edge, scale * 1.35, -angle, alpha * EDGE_ALPHA);
    this.reticleImage(x, y, coreOf(tell), scale, angle, alpha);
  }

  private reticleImage(x: number, y: number, color: number, scale: number, angle: number, alpha: number): void {
    let img = this.reticles[this.used];
    if (!img) {
      img = this.scene.add.image(0, 0, TEX.reticle).setDepth(DEPTH.emissive + 2).setBlendMode(Phaser.BlendModes.ADD);
      this.reticles.push(img);
    }
    this.used++;
    img.setPosition(x, y).setTint(color).setScale(scale).setAngle(angle).setAlpha(alpha).setVisible(true);
  }
}

/** The edge is quieter than the core: it names the attacker, the red says danger. */
const EDGE_ALPHA = 0.8;

function coreOf(c: TellColor): number {
  return typeof c === 'number' ? c : c.core;
}

function edgeOf(c: TellColor): number | null {
  return typeof c === 'number' ? null : c.edge;
}

/** Perpendicular offset that puts an edge line just outside a line `width` px thick. */
function sideOffset(x1: number, y1: number, x2: number, y2: number, width: number): [number, number] {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const d = width / 2 + 1;
  return [(-(y2 - y1) / len) * d, ((x2 - x1) / len) * d];
}
