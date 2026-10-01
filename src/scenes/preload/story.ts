import { PALETTE as P } from '../../config/palette';
import { seeded, type PixelCanvas } from './PixelCanvas';

export const VILGAX_SIZE = { w: 64, h: 76 } as const;

/**
 * Vilgax as a hologram bust: drawn in greys so an additive red tint turns the
 * brightest parts (eyes, armour edges) into glowing red light. Scanlines are
 * baked in.
 */
export function drawVilgax(pc: PixelCanvas): void {
  const skin = 0xb8b8b8;
  const skinDark = 0x7c7c7c;
  const armour = 0x9c9c9c;
  const armourLight = 0xe0e0e0;
  const shadow = 0x3a3a3a;

  // Torso and chest plate with the emblem.
  pc.poly([[13, 48], [51, 48], [47, 76], [17, 76]], 0x6e6e6e);
  pc.poly([[21, 50], [43, 50], [39, 68], [25, 68]], armour);
  pc.circle(32, 58, 5, armourLight);
  pc.circle(32, 58, 3, shadow);
  pc.px(32, 58, 0xffffff);

  // Huge spiked pauldrons.
  for (const side of [-1, 1]) {
    const x = (v: number) => 32 + side * v;
    pc.poly([[x(30), 47], [x(23), 36], [x(9), 38], [x(7), 51], [x(15), 57], [x(28), 55]], armour);
    pc.poly([[x(29), 46], [x(23), 37], [x(10), 39], [x(10), 41], [x(22), 40], [x(27), 46]], armourLight);
    pc.poly([[x(24), 38], [x(27), 26], [x(19), 37]], armourLight);
    pc.poly([[x(16), 38], [x(16), 28], [x(11), 38]], skin);
    pc.line(x(26), 50, x(14), 53, shadow);
  }

  // Neck and the great domed head with its crest.
  pc.rect(25, 34, 14, 14, skinDark);
  pc.ellipse(32, 20, 13, 16, skin);
  pc.ellipse(32, 12, 10, 8, 0xcacaca);
  pc.line(32, 4, 32, 15, skinDark).line(27, 6, 25, 15, skinDark).line(37, 6, 39, 15, skinDark);
  pc.line(22, 10, 21, 20, skinDark).line(42, 10, 43, 20, skinDark);

  // Angry brow and burning eyes.
  pc.line(20, 16, 30, 20, shadow, 2).line(44, 16, 34, 20, shadow, 2);
  pc.poly([[22, 20], [30, 22], [29, 25], [22, 23]], shadow);
  pc.poly([[42, 20], [34, 22], [35, 25], [42, 23]], shadow);
  pc.poly([[23, 21], [29, 22.5], [28.5, 24], [23, 22.5]], 0xffffff);
  pc.poly([[41, 21], [35, 22.5], [35.5, 24], [41, 22.5]], 0xffffff);

  // Tentacle beard: a dark mouth with separate, swaying strands.
  pc.poly([[21, 25], [43, 25], [40, 40], [32, 46], [24, 40]], shadow);
  const tentacles = [
    [21, 26, 10],
    [25, 27, 15],
    [29, 28, 19],
    [34, 28, 19],
    [38, 27, 15],
    [42, 26, 10],
  ];
  tentacles.forEach(([x0, y0, len], i) => {
    for (let t = 0; t <= len; t++) {
      const x = x0 + Math.round(Math.sin(t * 0.4 + i * 1.7) * 1.4);
      pc.rect(x, y0 + t, t > len - 3 ? 1 : 2, 1, 0xa8a8a8);
      if (t % 3 === 0) pc.px(x, y0 + t, 0xe8e8e8);
    }
  });
  pc.outline(0x2a2a2a);
  scanlines(pc, 3, 0.45);
}

/** Darkens every `every`th row so a sprite reads as a projected image. */
function scanlines(pc: PixelCanvas, every: number, keep: number): void {
  const { ctx, ox, oy, width, height } = pc;
  const img = ctx.getImageData(ox, oy, width, height);
  for (let y = 0; y < height; y += every) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      img.data[i] *= keep;
      img.data[i + 1] *= keep;
      img.data[i + 2] *= keep;
    }
  }
  ctx.putImageData(img, ox, oy);
}

/** Small Vilgax projector disc that pops out of the crater. */
export function drawHoloProjector(pc: PixelCanvas): void {
  pc.ellipse(9, 7, 8, 2, P.metal0);
  pc.ellipse(9, 6, 7, 2, P.metal1);
  pc.rect(5, 3, 9, 3, P.metal2);
  pc.ellipse(9, 3, 4, 1, P.metal3);
  pc.rect(8, 1, 3, 2, P.enemy);
  pc.px(9, 1, P.enemyGlow);
  pc.px(3, 6, P.enemy).px(15, 6, P.enemy);
  pc.outline(P.ink);
}

/** A rock slab split by cracks with something golden glinting behind it. Only a much stronger alien could break it. */
export function drawCrackedWall(pc: PixelCanvas): void {
  const rnd = seeded(41);
  const { width: w, height: h } = pc;
  pc.rect(0, 0, w, h, P.rock1);
  for (let i = 0; i < 40; i++) pc.px(Math.floor(rnd() * w), Math.floor(rnd() * h), rnd() < 0.5 ? P.rock0 : P.rock2);
  for (let y = 0; y < h; y += 12) pc.hline(0, w - 1, y + Math.floor(rnd() * 3), P.rock0);
  // Main crack with gold seeping through, and branches.
  const crack: Array<[number, number]> = [[8, 0], [6, 7], [10, 13], [5, 20], [9, 26], [6, 33], [11, 40], [7, h - 1]];
  for (let i = 0; i + 1 < crack.length; i++) {
    const [ax, ay] = crack[i];
    const [bx, by] = crack[i + 1];
    pc.line(ax, ay, bx, by, P.ink, 2);
    if (i % 2 === 1) pc.px((ax + bx) / 2, (ay + by) / 2, P.gold);
  }
  pc.line(10, 13, 15, 16, P.ink).line(5, 20, 0, 23, P.ink).line(9, 26, 14, 29, P.ink).line(6, 33, 1, 37, P.ink);
  pc.px(12, 14, P.goldDark).px(3, 21, P.goldDark).px(11, 27, P.goldDark);
  // Four huge knuckle dents: a hint about who can break it.
  for (const [x, y] of [[3, 4], [11, 5], [3, h - 8], [11, h - 9]]) {
    pc.rect(x, y, 3, 2, P.rock0);
    pc.px(x + 1, y + 2, P.rock0);
  }
}

/**
 * Locked alien silhouette (Four Arms). Dark body with a white rim so it can be
 * tinted Omnitrix green; the question mark sits on top.
 */
export function drawLockedSilhouette(pc: PixelCanvas): void {
  const body = P.ink;
  // Legs.
  pc.rect(13, 30, 6, 13, body).rect(23, 30, 6, 13, body);
  // Torso: a huge V-shaped chest.
  pc.poly([[7, 12], [35, 12], [30, 31], [12, 31]], body);
  // Head with a topknot.
  pc.rect(17, 4, 8, 9, body);
  pc.rect(19, 1, 4, 3, body);
  // Upper arms flexing up, lower arms hanging out.
  pc.poly([[8, 13], [2, 9], [1, 2], [5, 1], [7, 7], [11, 12]], body);
  pc.poly([[34, 13], [40, 9], [41, 2], [37, 1], [35, 7], [31, 12]], body);
  pc.poly([[9, 18], [3, 24], [2, 33], [6, 34], [8, 26], [12, 22]], body);
  pc.poly([[33, 18], [39, 24], [40, 33], [36, 34], [34, 26], [30, 22]], body);
  pc.outline(P.white);
  // Question mark.
  const q = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
  q.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') pc.px(19 + x, 15 + y, P.white);
  });
}
