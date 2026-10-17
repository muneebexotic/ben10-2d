import { PALETTE as P, lerpColor } from '../../config/palette';
import { lettering } from './lettering';
import { seeded, type PixelCanvas } from './PixelCanvas';

/**
 * Pieces of Chapters 2 to 4's sets that the shared screens and other chapters also draw
 * (Chapter Select's windows, Chapter 5's tumbleweeds, roads, the sealed doors of older
 * secrets). Kept apart from each chapter's own art so that art can stay in the chapter's chunk.
 */

/** The asphalt cap laid over level ground where a road runs (16 px tall, tiles horizontally). */
export function drawRoadCap(pc: PixelCanvas): void {
  const w = pc.width;
  pc.rect(0, 0, w, 3, P.asphalt2);
  pc.rect(0, 0, w, 1, 0x6a6a74);
  pc.rect(0, 3, w, 8, P.asphalt1);
  pc.rect(4, 6, 22, 2, P.lineYellow);
  pc.rect(36, 6, 22, 2, P.lineYellow);
  pc.rect(0, 11, w, 2, P.asphalt0);
  pc.rect(0, 13, w, 3, 0x5a4a44);
  const rnd = seeded(17);
  for (let i = 0; i < 16; i++) pc.px(Math.floor(rnd() * w), 3 + Math.floor(rnd() * 8), P.asphalt0);
}

/** A big retro sun with stripes cut out of its lower half. */
export function drawSun(pc: PixelCanvas): void {
  const c = pc.width / 2;
  const r = c - 2;
  for (let y = -r; y <= r; y++) {
    const span = Math.floor(Math.sqrt(r * r - y * y));
    const t = (y + r) / (2 * r);
    const color = lerpColor(0xfff0a8, 0xff6a4a, t);
    // Stripes get thicker toward the bottom.
    if (y > 2) {
      const period = 7 - Math.floor(t * 3);
      if (y % period < Math.ceil(t * 3)) continue;
    }
    pc.rect(c - span, c + y, span * 2 + 1, 1, color);
  }
}

export function drawTumbleweed(pc: PixelCanvas): void {
  const rnd = seeded(12);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 2 + rnd() * 4;
    pc.line(7, 6, 7 + Math.cos(a) * r, 6 + Math.sin(a) * r * 0.8, rnd() < 0.5 ? 0xa8804a : 0x7a5a32);
  }
  pc.outline(P.ink);
}

/** The museum's front: steps, six columns, a pediment and lit bronze doors. 240x150. */
export function drawMuseumFacade(pc: PixelCanvas): void {
  const w = 240;
  const h = 150;
  // Wall behind the columns.
  pc.rect(16, 40, w - 32, h - 52, 0x2a2840);
  // Pediment.
  pc.poly([[8, 40], [w / 2, 4], [w - 8, 40]], P.marble2);
  pc.poly([[24, 36], [w / 2, 12], [w - 24, 36]], P.marble1);
  pc.rect(8, 38, w - 16, 6, P.marble3);
  pc.hline(8, w - 9, 44, P.marble1);
  // Lettering band (drawn as blocky glyph marks; the real title is a banner prop).
  pc.rect(40, 48, w - 80, 9, P.marble2);
  for (let x = 46; x < w - 46; x += 6) pc.rect(x, 50, 4, 5, P.marble0);
  // Lit doorway in the middle.
  pc.rect(w / 2 - 18, 74, 36, 52, 0x3a2a1c);
  pc.rect(w / 2 - 15, 77, 30, 49, 0xffc870);
  pc.rect(w / 2 - 1, 77, 2, 49, 0x8a5a2a);
  pc.rect(w / 2 - 15, 77, 30, 4, 0xffe8b0);
  // Six columns.
  for (let i = 0; i < 6; i++) {
    const cx = 30 + i * 36 + (i >= 3 ? 0 : 0);
    if (Math.abs(cx - w / 2) < 24) continue;
    pc.rect(cx - 6, 60, 12, 72, P.marble2);
    pc.rect(cx - 6, 60, 3, 72, P.marble3);
    pc.rect(cx + 4, 60, 2, 72, P.marble1);
    for (let k = -2; k <= 2; k += 2) pc.vline(cx + k, 64, 128, P.marble1);
    pc.rect(cx - 8, 56, 16, 5, P.marble3);
    pc.rect(cx - 8, 130, 16, 4, P.marble3);
  }
  // Steps.
  for (let s = 0; s < 4; s++) pc.rect(8 + s * 4, 134 + s * 4, w - 16 - s * 8, 4, s % 2 ? P.marble2 : P.marble3);
  pc.outline(P.ink);
}

export function drawBench(pc: PixelCanvas): void {
  pc.rect(0, 2, 32, 4, 0x5a3a24);
  pc.hline(0, 31, 2, 0x8a5a34);
  for (const x of [3, 27]) pc.rect(x, 6, 2, 6, 0x2a2a34);
  pc.outline(P.ink);
}

/** The GAME ZONE's front: a flashing marquee sign over glass doors. 112x100. */
export function drawArcadeFront(pc: PixelCanvas): void {
  pc.rect(0, 20, 112, 80, 0x2a1438);
  pc.rect(4, 0, 104, 26, 0x1a0a24);
  pc.rect(6, 2, 100, 22, 0x3a1a4a);
  // GAME ZONE in neon, a dark drop shadow under each letter.
  lettering(pc, 7, 7, 'GAME', 0x1a0a24, 2);
  lettering(pc, 6, 6, 'GAME', P.neonPink, 2);
  lettering(pc, 58, 7, 'ZONE', 0x1a0a24, 2);
  lettering(pc, 57, 6, 'ZONE', P.neonBlue, 2);
  for (let x = 8; x < 106; x += 6) pc.px(x, 3, P.gold).px(x + 3, 22, P.gold);
  pc.rect(26, 40, 60, 60, 0x0a0614);
  pc.rect(28, 42, 27, 58, 0x3a2a6a).rect(57, 42, 27, 58, 0x3a2a6a);
  pc.rect(30, 46, 23, 30, 0x6a4aa8).rect(59, 46, 23, 30, 0x6a4aa8);
  pc.vline(55, 42, 99, 0x0a0614);
  pc.rect(6, 34, 16, 50, 0x1a0e24).rect(90, 34, 16, 50, 0x1a0e24);
  pc.rect(8, 36, 12, 20, P.neonBlue).rect(92, 36, 12, 20, P.neonPink);
  pc.outline(P.ink);
}

/** A welded-shut door with no handle: whatever's behind it isn't for anyone. 26x48. */
export function drawSealedDoor(pc: PixelCanvas): void {
  pc.rect(0, 0, 26, 48, 0x3a3e48);
  pc.rect(3, 3, 20, 45, 0x2a2e38);
  for (let y = 6; y < 46; y += 8) pc.line(3, y, 22, y + 3, 0x8a5a3a);
  for (let y = 4; y < 48; y += 6) pc.px(2, y, 0xffb050).px(23, y + 3, 0xffb050);
  pc.rect(6, 18, 14, 8, P.hazard);
  pc.rect(8, 20, 10, 4, P.ink);
  pc.outline(P.ink);
}

/** Rails and sleepers laid along a track bed. 32x8. */
export function drawRails(pc: PixelCanvas): void {
  for (let x = 1; x < 32; x += 8) pc.rect(x, 3, 5, 5, 0x3a2a1e);
  pc.rect(0, 1, 32, 2, P.concrete3);
  pc.hline(0, 31, 3, P.concrete1);
}
