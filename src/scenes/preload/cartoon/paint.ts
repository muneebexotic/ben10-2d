/**
 * The HD cartoon paint kit (Act 3). Everything is drawn with vector shapes on
 * a 2D canvas scaled by the texture resolution, in game pixels: bold ink
 * outlines, cel shading (one shadow crescent away from the light, one rim of
 * light toward it), soft gradients and glows. Kept free of Phaser so art can
 * be unit tested and drawn anywhere.
 */

/** Ink: the outline colour every character, prop and effect shares. */
export const INK = 0x1a1422;
/** Default outline width in game pixels (about 3-4 screen pixels in HD). */
export const LINE = 0.85;
/** Where the light comes from (up and to the left), as a unit offset. */
export const LIGHT = { x: -0.62, y: -0.78 } as const;

export type Stops = ReadonlyArray<readonly [number, number] | readonly [number, number, number]>;

/** A flat colour, or a gradient in the shape's own coordinates. */
export type Fill =
  | number
  | { linear: readonly [number, number, number, number]; stops: Stops }
  | { radial: readonly [number, number, number, number, number, number]; stops: Stops };

export interface ShapeStyle {
  fill: Fill;
  /** Outline width (game px); 0 or false for none. */
  ink?: number | false;
  inkColor?: number;
  /** Shadow crescent away from the light: its colour, and how far the lit copy shifts (game px). */
  shade?: number;
  shadeDepth?: number;
  /** Rim of light toward the light: colour, alpha and depth. */
  light?: number;
  lightAlpha?: number;
  lightDepth?: number;
  /** A soft gloss highlight ellipse (centre and radii in shape coordinates). */
  gloss?: { x: number; y: number; rx: number; ry: number; alpha?: number; angle?: number };
  alpha?: number;
}

export function css(color: number, alpha = 1): string {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return alpha >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

/** Mixes two colours (t = 0: a, 1: b). */
export function mix(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const ch = (shift: number) => Math.round(((a >> shift) & 255) * (1 - k) + ((b >> shift) & 255) * k);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** A darker, slightly cooler shade of a colour (cel shadow). */
export function shadeOf(color: number, amount = 0.32): number {
  return mix(color, 0x2a1840, amount);
}

/** A lighter, slightly warmer tint of a colour (highlight). */
export function lightOf(color: number, amount = 0.38): number {
  return mix(color, 0xfff6e0, amount);
}

/** Paints in game pixels on a canvas region drawn at `res` texels per game pixel. */
export class Paint {
  readonly ctx: CanvasRenderingContext2D;

  constructor(
    ctx: CanvasRenderingContext2D,
    readonly res: number,
    /** Top-left of the region (game px). */
    readonly ox = 0,
    readonly oy = 0,
  ) {
    this.ctx = ctx;
    ctx.setTransform(res, 0, 0, res, ox * res, oy * res);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.imageSmoothingEnabled = true;
  }

  // ------------------------------------------------------------ paths

  ellipse(cx: number, cy: number, rx: number, ry: number, angle = 0): Path2D {
    const p = new Path2D();
    p.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), angle, 0, Math.PI * 2);
    return p;
  }

  circle(cx: number, cy: number, r: number): Path2D {
    return this.ellipse(cx, cy, r, r);
  }

  rrect(x: number, y: number, w: number, h: number, r: number | readonly [number, number, number, number]): Path2D {
    const p = new Path2D();
    const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
    const k = (v: number) => Math.max(0, Math.min(v, w / 2, h / 2));
    p.moveTo(x + k(tl), y);
    p.lineTo(x + w - k(tr), y);
    p.quadraticCurveTo(x + w, y, x + w, y + k(tr));
    p.lineTo(x + w, y + h - k(br));
    p.quadraticCurveTo(x + w, y + h, x + w - k(br), y + h);
    p.lineTo(x + k(bl), y + h);
    p.quadraticCurveTo(x, y + h, x, y + h - k(bl));
    p.lineTo(x, y + k(tl));
    p.quadraticCurveTo(x, y, x + k(tl), y);
    p.closePath();
    return p;
  }

  /** A straight-sided polygon through flat [x0, y0, x1, y1, ...]. */
  poly(pts: readonly number[], closed = true): Path2D {
    const p = new Path2D();
    p.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]);
    if (closed) p.closePath();
    return p;
  }

  /** A smooth curve through flat points (Catmull-Rom), closed by default: blobs, hair, flames, fins. */
  smooth(pts: readonly number[], closed = true, tension = 0.5): Path2D {
    const p = new Path2D();
    const n = pts.length / 2;
    if (n < 2) return p;
    const at = (i: number): [number, number] => {
      const j = closed ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i));
      return [pts[j * 2], pts[j * 2 + 1]];
    };
    p.moveTo(pts[0], pts[1]);
    const last = closed ? n : n - 1;
    const t = tension / 3;
    for (let i = 0; i < last; i++) {
      const [x0, y0] = at(i - 1);
      const [x1, y1] = at(i);
      const [x2, y2] = at(i + 1);
      const [x3, y3] = at(i + 2);
      p.bezierCurveTo(x1 + (x2 - x0) * t, y1 + (y2 - y0) * t, x2 - (x3 - x1) * t, y2 - (y3 - y1) * t, x2, y2);
    }
    if (closed) p.closePath();
    return p;
  }

  /** A tapered capsule from (x1, y1) radius r1 to (x2, y2) radius r2: limbs, tails, tentacles. */
  capsule(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): Path2D {
    const p = new Path2D();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 0.0001;
    const a = Math.atan2(dy, dx);
    // The tangent offset for circles of different radii.
    const d = Math.max(-0.99, Math.min(0.99, (r1 - r2) / len));
    const off = Math.acos(d);
    p.arc(x1, y1, r1, a + off, a - off + Math.PI * 2, false);
    p.arc(x2, y2, r2, a - off, a + off, false);
    p.closePath();
    return p;
  }

  /** A curved, tapering stroke shape (a lock of hair, a flame tongue, a claw): from (x0, y0) bending through (cx, cy) to a point at (x1, y1). */
  horn(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, width: number): Path2D {
    const p = new Path2D();
    const nx = -(cy - y0);
    const ny = cx - x0;
    const nl = Math.hypot(nx, ny) || 1;
    const ox = (nx / nl) * width * 0.5;
    const oy = (ny / nl) * width * 0.5;
    p.moveTo(x0 + ox, y0 + oy);
    p.quadraticCurveTo(cx + ox * 0.6, cy + oy * 0.6, x1, y1);
    p.quadraticCurveTo(cx - ox * 0.6, cy - oy * 0.6, x0 - ox, y0 - oy);
    p.closePath();
    return p;
  }

  /**
   * An outline through flat points where each point is sharp (a spike's tip)
   * or round (a curve's control): hair with pointed locks, flames, fins.
   * `sharp[i]` true makes point i a corner; others are rounded through.
   */
  spiky(pts: readonly number[], sharp: readonly boolean[]): Path2D {
    const p = new Path2D();
    const n = pts.length / 2;
    const px = (i: number) => pts[((i + n) % n) * 2];
    const py = (i: number) => pts[((i + n) % n) * 2 + 1];
    // Start between the last point and the first.
    const mx = (i: number) => (px(i) + px(i + 1)) / 2;
    const my = (i: number) => (py(i) + py(i + 1)) / 2;
    p.moveTo(mx(n - 1), my(n - 1));
    for (let i = 0; i < n; i++) {
      if (sharp[i]) {
        p.lineTo(px(i), py(i));
        p.lineTo(mx(i), my(i));
      } else {
        p.quadraticCurveTo(px(i), py(i), mx(i), my(i));
      }
    }
    p.closePath();
    return p;
  }

  /** A star / burst of `points` spikes (impact flashes, sparkles). */
  star(cx: number, cy: number, outer: number, inner: number, points: number, rot = -Math.PI / 2): Path2D {
    const pts: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = rot + (i * Math.PI) / points;
      pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    return this.poly(pts);
  }

  // ------------------------------------------------------------ painting

  fillStyle(fill: Fill): string | CanvasGradient {
    const ctx = this.ctx;
    if (typeof fill === 'number') return css(fill);
    let g: CanvasGradient;
    if ('linear' in fill) g = ctx.createLinearGradient(fill.linear[0], fill.linear[1], fill.linear[2], fill.linear[3]);
    else g = ctx.createRadialGradient(fill.radial[0], fill.radial[1], fill.radial[2], fill.radial[3], fill.radial[4], fill.radial[5]);
    for (const s of fill.stops) g.addColorStop(Math.max(0, Math.min(1, s[0])), css(s[1], s[2] ?? 1));
    return g;
  }

  fill(path: Path2D, fill: Fill, alpha = 1): this {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.fillStyle(fill);
    ctx.fill(path);
    ctx.globalAlpha = 1;
    return this;
  }

  stroke(path: Path2D, color: number, width: number, alpha = 1): this {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = css(color);
    ctx.lineWidth = width;
    ctx.stroke(path);
    ctx.globalAlpha = 1;
    return this;
  }

  /** A line of ink (a crease, a seam, a mouth). */
  line(pts: readonly number[], width = LINE * 0.7, color = INK, smooth = false, alpha = 1): this {
    return this.stroke(smooth ? this.smooth(pts, false) : this.poly(pts, false), color, width, alpha);
  }

  /**
   * The workhorse: an outlined, cel-shaded shape. The ink goes on first (twice
   * the outline width, so the fill covers its inner half), then the fill, the
   * shadow crescent, the rim light and an optional gloss.
   */
  shape(path: Path2D, style: ShapeStyle): this {
    const ctx = this.ctx;
    const alpha = style.alpha ?? 1;
    const ink = style.ink === undefined ? LINE : style.ink;
    if (ink) this.stroke(path, style.inkColor ?? INK, ink * 2, alpha);
    this.fill(path, style.fill, alpha);
    if (style.shade !== undefined) this.crescent(path, style.shade, style.shadeDepth ?? 1.6, 1, alpha);
    if (style.light !== undefined) this.crescent(path, style.light, style.lightDepth ?? 0.9, -1, (style.lightAlpha ?? 0.55) * alpha);
    if (style.gloss) {
      const g = style.gloss;
      ctx.save();
      ctx.clip(path);
      this.fill(this.ellipse(g.x, g.y, g.rx, g.ry, g.angle ?? -0.5), 0xffffff, (g.alpha ?? 0.45) * alpha);
      ctx.restore();
    }
    return this;
  }

  /**
   * A crescent inside `path`: the part of the shape a copy shifted toward the
   * light (`side` 1: a shadow away from the light) or away from it (`side` -1:
   * a rim of light) doesn't cover.
   */
  crescent(path: Path2D, color: number, depth: number, side: 1 | -1, alpha = 1): this {
    const ctx = this.ctx;
    const dx = -LIGHT.x * depth * side;
    const dy = -LIGHT.y * depth * side;
    ctx.save();
    ctx.clip(path);
    const cover = new Path2D();
    cover.rect(-4000, -4000, 8000, 8000);
    cover.addPath(path, new DOMMatrix([1, 0, 0, 1, -dx, -dy]));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = css(color);
    ctx.fill(cover, 'evenodd');
    ctx.restore();
    ctx.globalAlpha = 1;
    return this;
  }

  /** Draws inside a shape only (patterns, stripes, markings that must not spill past the outline). */
  within(path: Path2D, draw: () => void): this {
    const ctx = this.ctx;
    ctx.save();
    ctx.clip(path);
    draw();
    ctx.restore();
    return this;
  }

  /** A soft round glow (additive light, embers, lenses). */
  glow(cx: number, cy: number, r: number, color: number, alpha = 1, core = 0.15): this {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, css(color, alpha));
    g.addColorStop(core, css(color, alpha * 0.85));
    g.addColorStop(1, css(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    return this;
  }

  /** A soft drop shadow under a shape (contact shadows, depth). */
  shadow(path: Path2D, blur: number, color = 0x000000, alpha = 0.35, dx = 0, dy = 0): this {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = css(color, alpha);
    ctx.shadowBlur = blur * this.res;
    ctx.shadowOffsetX = dx * this.res;
    ctx.shadowOffsetY = dy * this.res;
    ctx.fillStyle = css(color, alpha);
    ctx.fill(path);
    ctx.restore();
    return this;
  }

  /**
   * A cartoon eye looking along `look` (-1..1 each way): white with an ink
   * rim, a coloured iris, a pupil and a catch light. `lid` closes it from the
   * top (0 open, 1 shut: a line).
   */
  eye(cx: number, cy: number, rx: number, ry: number, iris: number, look: { x: number; y: number }, lid = 0, irisScale = 0.62): this {
    if (lid >= 0.95) return this.line([cx - rx, cy + ry * 0.1, cx, cy + ry * 0.35, cx + rx, cy + ry * 0.1], LINE * 0.8, INK, true);
    const white = this.ellipse(cx, cy, rx, ry);
    this.shape(white, { fill: { linear: [cx, cy - ry, cx, cy + ry], stops: [[0, 0xffffff], [1, 0xdfe6f0]] }, ink: LINE * 0.75 });
    this.within(white, () => {
      const ix = cx + look.x * rx * 0.42;
      const iy = cy + look.y * ry * 0.3;
      const ir = Math.min(rx, ry) * irisScale;
      this.fill(this.circle(ix, iy, ir), { radial: [ix - ir * 0.3, iy - ir * 0.3, 0, ix, iy, ir], stops: [[0, lightOf(iris, 0.3)], [0.7, iris], [1, shadeOf(iris, 0.4)]] });
      this.fill(this.circle(ix, iy, ir * 0.48), INK);
      this.fill(this.circle(ix - ir * 0.38, iy - ir * 0.42, ir * 0.3), 0xffffff, 0.95);
      if (lid > 0) this.fill(this.ellipse(cx, cy - ry * 2 + lid * ry * 2, rx * 1.3, ry * 1.2), shadeOf(0xf0c8a0, 0.1));
    });
    return this;
  }

  /** Little speed or motion ticks around a point (for effects and title art). */
  sparkle(cx: number, cy: number, r: number, color = 0xffffff, alpha = 1): this {
    this.fill(this.star(cx, cy, r, r * 0.22, 4), color, alpha);
    return this;
  }
}
