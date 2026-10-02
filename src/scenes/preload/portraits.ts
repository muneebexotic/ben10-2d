import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/** Dialogue portraits: 48x48 busts facing right, drawn to sit in the dialogue box. */
export const PORTRAIT = { w: 48, h: 48 } as const;

const SKIN = 0xf2c29b;
const SKIN_SHADE = 0xd49a74;
const SKIN_DEEP = 0xb07a58;

function frame(pc: PixelCanvas, bg: number): void {
  pc.rect(0, 0, 48, 48, bg);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.08);
}

function eye(pc: PixelCanvas, x: number, y: number, iris: number): void {
  pc.rect(x, y, 4, 3, P.white);
  pc.rect(x + 1, y, 2, 3, iris);
  pc.px(x + 2, y + 1, P.ink);
  pc.px(x + 1, y, P.white);
}

/** Grandpa Max: grey hair at the sides, big friendly face, red Hawaiian shirt. */
export function drawPortraitMax(pc: PixelCanvas): void {
  frame(pc, 0x3a2a4a);
  const red = P.max;
  // Shirt with white flowers.
  pc.poly([[4, 48], [8, 38], [20, 34], [34, 34], [44, 40], [46, 48]], red);
  for (const [x, y] of [[12, 42], [30, 44], [38, 40], [20, 46]]) {
    pc.px(x, y, P.white).px(x + 1, y, P.white).px(x, y + 1, P.white).px(x + 1, y + 1, 0xffd84a);
  }
  pc.poly([[22, 34], [28, 40], [32, 34]], SKIN_SHADE);
  pc.line(22, 34, 26, 40, 0xa02a24).line(32, 34, 28, 40, 0xa02a24);
  // Neck and big head.
  pc.rect(20, 30, 12, 6, SKIN_SHADE);
  pc.ellipse(26, 18, 13, 14, SKIN);
  pc.rect(16, 28, 20, 4, SKIN);
  pc.ellipse(26, 30, 9, 3, SKIN_SHADE);
  // Grey hair: a fringe at the back and sides, thin on top.
  pc.ellipse(16, 14, 4, 8, 0xc8c8d0);
  pc.ellipse(26, 5, 10, 3, 0xd8d8e0);
  pc.rect(14, 8, 5, 10, 0xb0b0bc);
  pc.px(24, 3, 0xe8e8f0).px(28, 3, 0xe8e8f0);
  // Ear.
  pc.ellipse(16, 19, 2, 3, SKIN_SHADE);
  // Brows, eyes (kind, crinkled), the famous nose, a grin.
  pc.rect(25, 12, 6, 2, 0xb0b0bc).rect(33, 12, 4, 2, 0xb0b0bc);
  eye(pc, 26, 15, 0x4a6aa8);
  eye(pc, 33, 15, 0x4a6aa8);
  pc.px(30, 19, SKIN_DEEP).px(36, 19, SKIN_DEEP);
  pc.ellipse(36, 21, 3, 3, SKIN_SHADE);
  pc.px(37, 22, SKIN_DEEP);
  pc.rect(28, 26, 10, 2, 0x7a2a2a);
  pc.rect(29, 26, 8, 1, P.white);
  pc.px(27, 25, SKIN_DEEP).px(38, 25, SKIN_DEEP);
  pc.outline(P.ink);
}

/** Gwen: short orange-red hair with a blue clip, green eyes, a smirk, her blue cat shirt. */
export function drawPortraitGwen(pc: PixelCanvas): void {
  frame(pc, 0x1e3a4a);
  const hair = 0xd8572c;
  const hairHi = 0xff8a4a;
  // Blue shirt with the cat face.
  pc.poly([[8, 48], [12, 40], [22, 36], [32, 36], [40, 41], [44, 48]], 0x3a8ad8);
  pc.ellipse(27, 44, 5, 3, P.white);
  pc.px(24, 41, P.white).px(30, 41, P.white).px(25, 44, P.ink).px(29, 44, P.ink);
  // Neck, face.
  pc.rect(22, 30, 9, 7, SKIN_SHADE);
  pc.ellipse(27, 21, 11, 12, SKIN);
  // Hair: a bob with a side part.
  pc.ellipse(23, 13, 12, 8, hair);
  pc.rect(12, 13, 7, 18, hair);
  pc.rect(13, 13, 2, 16, hairHi);
  pc.poly([[24, 7], [38, 10], [36, 15], [26, 13]], hair);
  pc.line(20, 8, 34, 10, hairHi);
  // Hair clip.
  pc.rect(31, 11, 5, 2, 0x5fd8ff);
  pc.px(31, 12, 0x2a7ab8);
  // Brows (one raised: unimpressed), eyes, freckles, smirk.
  pc.rect(26, 15, 4, 1, 0xa83a1a).line(32, 14, 36, 13, 0xa83a1a);
  eye(pc, 26, 17, 0x3fae52);
  eye(pc, 32, 17, 0x3fae52);
  pc.px(30, 22, SKIN_SHADE).px(35, 22, SKIN_SHADE);
  pc.px(34, 21, SKIN_DEEP);
  pc.line(29, 26, 34, 25, 0x8a3a3a);
  pc.px(35, 24, 0x8a3a3a);
  pc.outline(P.ink);
}

/** Ben: spiky brown hair, green eyes, cocky grin, the black-striped white shirt. */
export function drawPortraitBen(pc: PixelCanvas): void {
  frame(pc, 0x16301e);
  pc.poly([[8, 48], [12, 39], [22, 35], [32, 35], [40, 40], [44, 48]], P.shirt);
  pc.rect(24, 36, 6, 12, P.stripe);
  pc.rect(22, 30, 9, 7, SKIN_SHADE);
  pc.ellipse(27, 21, 11, 12, SKIN);
  // Spiky hair.
  pc.ellipse(24, 12, 12, 7, P.hair0);
  pc.rect(13, 12, 6, 12, P.hair0);
  for (const [x, y] of [[14, 6], [19, 3], [25, 2], [31, 4], [36, 7]]) pc.poly([[x, y], [x + 5, y + 6], [x - 3, y + 7]], P.hair0);
  pc.line(19, 8, 30, 6, P.hair1).line(15, 12, 17, 20, P.hair1);
  // Eyes (green, of course), cocky grin.
  pc.rect(26, 15, 4, 1, P.hair0).rect(32, 15, 4, 1, P.hair0);
  eye(pc, 26, 17, 0x3fae52);
  eye(pc, 32, 17, 0x3fae52);
  pc.px(34, 22, SKIN_DEEP);
  pc.rect(28, 25, 8, 2, 0x7a2a2a);
  pc.rect(29, 25, 6, 1, P.white);
  pc.px(36, 24, 0x7a2a2a);
  // The Omnitrix peeking in at the corner.
  pc.rect(38, 42, 8, 6, P.ink);
  pc.rect(39, 43, 6, 4, P.omnitrix);
  pc.px(41, 44, P.ink).px(42, 45, P.ink);
  pc.outline(P.ink);
}

/** Vilgax, as his red hologram (greys tinted red in the dialogue box). */
export function drawPortraitVilgax(pc: PixelCanvas): void {
  frame(pc, 0x2a0a12);
  const skin = 0x8a2a3a;
  const dark = 0x4a1020;
  pc.poly([[4, 48], [10, 36], [38, 36], [46, 48]], 0x5a5a6a);
  pc.poly([[6, 40], [14, 30], [20, 40]], 0x8a8a9a).poly([[44, 40], [36, 30], [30, 40]], 0x8a8a9a);
  pc.ellipse(26, 18, 13, 15, skin);
  pc.ellipse(26, 10, 10, 7, 0xa83a4a);
  pc.line(26, 3, 26, 12, dark).line(20, 6, 18, 14, dark).line(32, 6, 34, 14, dark);
  pc.line(15, 15, 24, 19, P.ink, 2).line(37, 15, 28, 19, P.ink, 2);
  pc.rect(17, 19, 6, 2, P.enemyGlow).rect(29, 19, 6, 2, P.enemyGlow);
  pc.poly([[16, 24], [36, 24], [33, 36], [26, 40], [19, 36]], dark);
  for (let i = 0; i < 6; i++) pc.line(18 + i * 3, 25, 17 + i * 3 + (i % 2), 36 + (i % 3), 0xb84a5a);
  pc.outline(P.ink);
}
