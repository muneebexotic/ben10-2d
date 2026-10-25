import Phaser from 'phaser';
import { GLYPHS } from '../../../ui/glyphs';
import { FONT_SIZE } from '../../../ui/PixelFont';
import { css } from './paint';

/**
 * The HD font (Act 3): the pixel font's own glyphs, redrawn as smooth rounded
 * marker strokes with an ink outline, at the very same metrics (every glyph
 * the same width, height and advance in game pixels), so every text box,
 * wrap and QA check in the game holds unchanged. White fill: tints recolour it.
 */

const GLYPH_H = 7;
const CELL_H = GLYPH_H + 2;
const OUTLINE = 0x0b0d17;
/** Stroke width of a letter (game px) and of the ink around it. */
const STROKE = 1.08;
const INK_W = 0.62;

export const HD_FONT_TEXTURE = 'hd-font';

/** The strokes that draw one glyph: segments between the centres of touching pixels, plus lone dots. */
export function glyphStrokes(rows: readonly string[]): { segments: Array<[number, number, number, number]>; dots: Array<[number, number]> } {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] === '#';
  const segments: Array<[number, number, number, number]> = [];
  const dots: Array<[number, number]> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      let linked = false;
      // Right and down always; diagonals only where no orthogonal path joins the two.
      if (on(x + 1, y)) {
        segments.push([x, y, x + 1, y]);
        linked = true;
      }
      if (on(x, y + 1)) {
        segments.push([x, y, x, y + 1]);
        linked = true;
      }
      if (on(x + 1, y + 1) && !on(x + 1, y) && !on(x, y + 1)) {
        segments.push([x, y, x + 1, y + 1]);
        linked = true;
      }
      if (on(x - 1, y + 1) && !on(x - 1, y) && !on(x, y + 1)) {
        segments.push([x, y, x - 1, y + 1]);
        linked = true;
      }
      const touched = linked || on(x - 1, y) || on(x, y - 1) || (on(x - 1, y - 1) && !on(x - 1, y) && !on(x, y - 1)) || (on(x + 1, y - 1) && !on(x + 1, y) && !on(x, y - 1));
      if (!touched) dots.push([x, y]);
    }
  }
  return { segments, dots };
}

/** Paints the HD font at `res` and returns the bitmap font data for Phaser's cache (made once). */
export function makeHdFont(scene: Phaser.Scene, res: number): { texture: string; data: unknown } {
  const chars = Object.keys(GLYPHS);
  const perRow = 16;
  const layout: Array<{ char: string; x: number; y: number; w: number }> = [];
  let texW = 0;
  for (let r = 0; r * perRow < chars.length; r++) {
    let x = 1;
    for (const char of chars.slice(r * perRow, (r + 1) * perRow)) {
      const w = GLYPHS[char][0].length;
      layout.push({ char, x, y: 1 + r * (CELL_H + 2), w });
      x += w + 2 + 2;
    }
    texW = Math.max(texW, x);
  }
  const texH = Math.ceil(chars.length / perRow) * (CELL_H + 2) + 2;
  const pw = Math.ceil(texW * res);
  const ph = Math.ceil(texH * res);
  if (!scene.textures.exists(HD_FONT_TEXTURE)) {
    const tex = scene.textures.createCanvas(HD_FONT_TEXTURE, pw, ph);
    if (tex) {
      const ctx = tex.getContext();
      ctx.setTransform(res, 0, 0, res, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const g of layout) {
        const { segments, dots } = glyphStrokes(GLYPHS[g.char]);
        const path = new Path2D();
        const cx = (x: number) => g.x + 1 + x + 0.5;
        const cy = (y: number) => g.y + 1 + y + 0.5;
        for (const [x0, y0, x1, y1] of segments) {
          path.moveTo(cx(x0), cy(y0));
          path.lineTo(cx(x1), cy(y1));
        }
        for (const [x, y] of dots) {
          path.moveTo(cx(x) - 0.01, cy(y));
          path.lineTo(cx(x) + 0.01, cy(y));
        }
        ctx.strokeStyle = css(OUTLINE);
        ctx.lineWidth = STROKE + INK_W * 2;
        ctx.stroke(path);
        const grad = ctx.createLinearGradient(0, g.y + 1, 0, g.y + 1 + GLYPH_H);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#dfe4ee');
        ctx.strokeStyle = grad;
        ctx.lineWidth = STROKE;
        ctx.stroke(path);
      }
      tex.refresh();
      tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
  }
  const glyphData: Record<number, unknown> = {};
  for (const g of layout) {
    const w = g.w + 2;
    const entry = {
      x: Math.round(g.x * res),
      y: Math.round(g.y * res),
      width: w,
      height: CELL_H,
      centerX: Math.floor(w / 2),
      centerY: Math.floor(CELL_H / 2),
      xOffset: 0,
      yOffset: 0,
      xAdvance: g.w + 1,
      data: {},
      kerning: {},
      u0: (g.x * res) / pw,
      v0: 1 - (g.y * res) / ph,
      u1: ((g.x + w) * res) / pw,
      v1: 1 - ((g.y + CELL_H) * res) / ph,
    };
    glyphData[g.char.charCodeAt(0)] = entry;
    const lower = g.char.toLowerCase();
    if (lower !== g.char) glyphData[lower.charCodeAt(0)] = entry;
  }
  return { texture: HD_FONT_TEXTURE, data: { font: 'pixel', size: FONT_SIZE, lineHeight: CELL_H + 2, chars: glyphData } };
}
