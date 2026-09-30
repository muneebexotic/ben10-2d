import { toCss } from '../../config/palette';

/** Tiny pixel-art drawing helper over a region of a 2D canvas. All coordinates are frame-local. */
export class PixelCanvas {
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly ox: number,
    readonly oy: number,
    readonly width: number,
    readonly height: number,
  ) {}

  px(x: number, y: number, color: number, alpha = 1): this {
    this.rect(x, y, 1, 1, color, alpha);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, color: number, alpha = 1): this {
    if (w <= 0 || h <= 0) return this;
    this.ctx.fillStyle = toCss(color, alpha);
    this.ctx.fillRect(this.ox + Math.round(x), this.oy + Math.round(y), Math.round(w), Math.round(h));
    return this;
  }

  hline(x0: number, x1: number, y: number, color: number): this {
    const a = Math.min(x0, x1);
    return this.rect(a, y, Math.abs(x1 - x0) + 1, 1, color);
  }

  vline(x: number, y0: number, y1: number, color: number): this {
    const a = Math.min(y0, y1);
    return this.rect(x, a, 1, Math.abs(y1 - y0) + 1, color);
  }

  /** Bresenham line, optionally `thickness` pixels wide (square brush). */
  line(x0: number, y0: number, x1: number, y1: number, color: number, thickness = 1): this {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const half = Math.floor((thickness - 1) / 2);
    for (;;) {
      this.rect(x0 - half, y0 - half, thickness, thickness, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return this;
  }

  circle(cx: number, cy: number, r: number, color: number, alpha = 1): this {
    for (let y = -r; y <= r; y++) {
      const span = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
      this.rect(cx - span, cy + y, span * 2 + 1, 1, color, alpha);
    }
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: number, alpha = 1): this {
    for (let y = -ry; y <= ry; y++) {
      const t = y / (ry + 0.5);
      const span = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      this.rect(cx - span, cy + y, span * 2 + 1, 1, color, alpha);
    }
    return this;
  }

  /** Filled polygon via scanlines (convex or simple concave shapes). */
  poly(points: Array<[number, number]>, color: number): this {
    const ys = points.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys));
    const maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[(i + 1) % points.length];
        const sy = y + 0.5;
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) {
          xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = Math.round(xs[i]);
        const b = Math.round(xs[i + 1]);
        if (b > a) this.rect(a, y, b - a, 1, color);
      }
    }
    return this;
  }

  /** Adds a 1px outline around every opaque pixel (4-neighbour), the core of the cohesive pixel look. */
  outline(color: number, diagonal = false): this {
    const { ctx, ox, oy, width, height } = this;
    const image = ctx.getImageData(ox, oy, width, height);
    const src = new Uint8ClampedArray(image.data);
    const d = image.data;
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    const opaque = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < width && y < height && src[(y * width + x) * 4 + 3] > 40;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (src[i + 3] > 40) continue;
        let near = opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1);
        if (!near && diagonal) {
          near = opaque(x - 1, y - 1) || opaque(x + 1, y - 1) || opaque(x - 1, y + 1) || opaque(x + 1, y + 1);
        }
        if (near) {
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = b;
          d[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(image, ox, oy);
    return this;
  }

  /** Mirrors the frame horizontally in place. */
  flipX(): this {
    const { ctx, ox, oy, width, height } = this;
    const image = ctx.getImageData(ox, oy, width, height);
    const out = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = (y * width + x) * 4;
        const t = (y * width + (width - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) out.data[t + k] = image.data[s + k];
      }
    }
    ctx.putImageData(out, ox, oy);
    return this;
  }

  radial(cx: number, cy: number, radius: number, stops: Array<[number, number, number]>): this {
    const grad = this.ctx.createRadialGradient(this.ox + cx, this.oy + cy, 0, this.ox + cx, this.oy + cy, radius);
    for (const [offset, color, alpha] of stops) grad.addColorStop(offset, toCss(color, alpha));
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(this.ox + cx - radius, this.oy + cy - radius, radius * 2, radius * 2);
    return this;
  }

  verticalGradient(x: number, y: number, w: number, h: number, stops: Array<[number, number, number?]>): this {
    const grad = this.ctx.createLinearGradient(0, this.oy + y, 0, this.oy + y + h);
    for (const [offset, color, alpha] of stops) grad.addColorStop(offset, toCss(color, alpha ?? 1));
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(this.ox + x, this.oy + y, w, h);
    return this;
  }
}

/** Seeded PRNG so generated art is identical on every load. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
