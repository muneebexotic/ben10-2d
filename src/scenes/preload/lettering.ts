import { GLYPHS } from '../../ui/glyphs';
import type { PixelCanvas } from './PixelCanvas';

/** Width in pixels of `text` in the pixel font at `scale` (1px between letters, 3px for a space). */
export function letteringWidth(text: string, scale = 1): number {
  let w = 0;
  for (const ch of text) w += ch === ' ' ? 3 * scale : ((GLYPHS[ch]?.[0].length ?? 3) + 1) * scale;
  return Math.max(0, w - scale);
}

/** Letters `text` onto a texture in the pixel font (signs, marquees). (x, y) is the top-left. */
export function lettering(pc: PixelCanvas, x: number, y: number, text: string, color: number, scale = 1): void {
  let cx = x;
  for (const ch of text) {
    if (ch === ' ') {
      cx += 3 * scale;
      continue;
    }
    const g = GLYPHS[ch];
    if (!g) {
      cx += 4 * scale;
      continue;
    }
    for (let row = 0; row < g.length; row++) {
      for (let col = 0; col < g[row].length; col++) if (g[row][col] === '#') pc.rect(cx + col * scale, y + row * scale, scale, scale, color);
    }
    cx += (g[0].length + 1) * scale;
  }
}

/** Letters `text` centred on `cx`. */
export function letteringCentred(pc: PixelCanvas, cx: number, y: number, text: string, color: number, scale = 1): void {
  lettering(pc, Math.round(cx - letteringWidth(text, scale) / 2), y, text, color, scale);
}
