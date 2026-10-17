import { PALETTE as P } from '../../../config/palette';
import { seeded, type PixelCanvas } from '../PixelCanvas';
import { CHARM_COLORS, KARACHI as K, type CharmElement } from './colors';

/**
 * Chapter 6's people: Hex (the "great magician", violet robes, grey-blue
 * skin, a staff with the Charms of Bezel), his niece Charmcaster (silver
 * hair, magenta, spell bags on her belt), and three locals at the fair:
 * Rauf the chai-wala, Rafiq the rickshaw driver and Zain, Ben's biggest fan.
 * Sprites face right; portraits are 48x48 busts for the dialogue box.
 */

const BROWN = 0xc08a62;
const BROWN_SHADE = 0x9a6a48;
const BROWN_DEEP = 0x7a5034;

// ---------------------------------------------------------------- Hex (32x46)

export const HEX_FRAME = { w: 32, h: 46, feetY: 45 } as const;
export const HEX_FRAMES = { idle: [0, 1], cast: [2], point: [3], hurt: [4], float: [5] } as const;
export const HEX_FRAME_COUNT = 6;

/** Frames: 0-1 idle (robes sway), 2 staff raised (casting), 3 pointing, 4 hurt, 5 floating (arms out). */
export function drawHex(pc: PixelCanvas, frame: number): void {
  const sway = frame === 1 ? 1 : 0;
  // Robe: long, flaring, with a gold trim.
  pc.poly([[9, 18], [22, 18], [26 + sway, 45], [5 - sway, 45]], K.hex1);
  pc.poly([[12, 18], [16, 18], [14, 45], [8, 45]], K.hex0);
  pc.hline(5 - sway, 26 + sway, 44, K.brass2);
  pc.vline(16, 20, 43, K.brass1);
  // The tall collar that frames his head.
  pc.poly([[8, 10], [12, 18], [20, 18], [24, 10], [20, 14], [12, 14]], K.hex2);
  // Head: grey-blue skin, slicked black hair in a peak, pale glowing eyes.
  pc.rect(12, 6, 9, 10, K.hexSkin);
  pc.rect(11, 3, 11, 4, 0x14101e);
  pc.px(16, 7, 0x14101e).px(17, 7, 0x14101e);
  const hurt = frame === 4;
  pc.rect(17, 9, 3, 1, hurt ? P.white : K.hexGlow);
  pc.rect(13, 9, 2, 1, hurt ? P.white : K.hexGlow);
  pc.rect(14, 13, 5, 1, 0x3a4a5a);
  // Arms and the staff.
  const staff = (x: number, y0: number, y1: number) => {
    pc.rect(x, y0, 2, y1 - y0, K.wood1);
    pc.circle(x + 1, y0 - 2, 3, K.brass1);
    pc.circle(x + 1, y0 - 2, 1, K.hexGlow);
  };
  switch (frame) {
    case 2:
      pc.rect(22, 10, 3, 9, K.hex1);
      staff(23, 0, 22);
      pc.rect(6, 18, 3, 8, K.hex1);
      break;
    case 3:
      pc.rect(22, 18, 9, 3, K.hex1);
      pc.rect(30, 18, 2, 2, K.hexSkin);
      staff(5, 12, 44);
      break;
    case 4:
      pc.rect(4, 14, 3, 8, K.hex1).rect(24, 14, 3, 8, K.hex1);
      staff(2, 16, 40);
      break;
    case 5:
      pc.rect(2, 18, 8, 3, K.hex1).rect(23, 18, 8, 3, K.hex1);
      staff(28, 8, 34);
      break;
    default:
      pc.rect(22, 19, 3, 10, K.hex1);
      staff(25, 10 - sway, 45);
      pc.rect(7, 19, 3, 10, K.hex1);
  }
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Charmcaster (26x34)

export const CHARMCASTER_FRAME = { w: 26, h: 34, feetY: 33 } as const;
export const CHARMCASTER_FRAMES = { idle: [0, 1], throw: [2], summon: [3], hurt: [4] } as const;
export const CHARMCASTER_FRAME_COUNT = 5;

/** Frames: 0-1 idle (cape sways), 2 throwing a spell bag, 3 summoning (arms up, runes), 4 hurt. */
export function drawCharmcaster(pc: PixelCanvas, frame: number): void {
  const sway = frame === 1 ? 1 : 0;
  // Cape behind.
  pc.poly([[7, 10], [17, 10], [21 + sway, 32], [3 - sway, 32]], K.charm0);
  // Legs and boots.
  pc.rect(9, 24, 3, 9, 0x3a3a48).rect(14, 24, 3, 9, 0x3a3a48);
  pc.rect(8, 31, 5, 2, 0x1a1a22).rect(13, 31, 5, 2, 0x1a1a22);
  // Tunic with the belt of spell bags.
  pc.rect(8, 12, 10, 13, K.charm1);
  pc.rect(8, 20, 10, 2, 0x3a2a1a);
  for (const bx of [8, 12, 16]) pc.rect(bx, 22, 3, 3, K.charm2);
  // Head: pale skin, long silver-white hair, a circlet.
  pc.rect(9, 4, 8, 8, 0xe8d8d0);
  pc.rect(8, 2, 10, 4, 0xe8e8f4);
  pc.rect(7, 4, 2, 12, 0xd8d8e8).rect(17, 4, 2, 10, 0xd8d8e8);
  pc.hline(9, 16, 3, K.charm2);
  pc.px(13, 6, K.charmGlow).px(15, 6, K.charmGlow);
  pc.rect(12, 9, 3, 1, 0x8a3a5a);
  // Arms.
  switch (frame) {
    case 2:
      pc.rect(18, 12, 7, 3, K.charm1);
      pc.circle(24, 12, 2, K.charm2);
      pc.rect(5, 13, 3, 8, K.charm1);
      break;
    case 3:
      pc.rect(4, 2, 3, 11, K.charm1).rect(19, 2, 3, 11, K.charm1);
      pc.px(5, 0, K.charmGlow).px(20, 0, K.charmGlow);
      break;
    case 4:
      pc.rect(3, 8, 5, 3, K.charm1).rect(18, 8, 5, 3, K.charm1);
      break;
    default:
      pc.rect(5, 13, 3, 9, K.charm1).rect(18, 13, 3, 9, K.charm1);
  }
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- The locals (24x32 / 18x24)

export const LOCAL_FRAME = { w: 24, h: 32, feetY: 31 } as const;
export const ZAIN_FRAME = { w: 18, h: 24, feetY: 23 } as const;

/** Rauf the chai-wala: white shalwar kameez, a waistcoat, a moustache, his kettle. Frames: 0 idle, 1 pouring. */
export function drawRauf(pc: PixelCanvas, frame: number): void {
  pc.rect(8, 22, 3, 9, 0xe8e4dc).rect(13, 22, 3, 9, 0xe8e4dc);
  pc.rect(7, 30, 4, 2, 0x5a3a22).rect(13, 30, 4, 2, 0x5a3a22);
  pc.rect(6, 11, 12, 13, 0xf0ece4);
  pc.rect(7, 11, 10, 8, 0x5a6a3a);
  pc.vline(12, 11, 18, 0xf0ece4);
  pc.rect(8, 3, 8, 8, BROWN);
  pc.rect(7, 1, 10, 3, 0xe8e4dc);
  pc.rect(9, 8, 6, 1, 0x2a1a14);
  pc.px(9, 5, P.ink).px(13, 5, P.ink);
  pc.rect(4, 12, 3, 9, 0xf0ece4);
  if (frame === 1) {
    pc.rect(17, 11, 6, 3, 0xf0ece4);
    pc.ellipse(21, 9, 3, 3, 0xb8c0c8);
    pc.line(23, 8, 23, 14, 0xc88a4a);
  } else {
    pc.rect(17, 12, 3, 8, 0xf0ece4);
    pc.ellipse(19, 22, 3, 3, 0xb8c0c8);
  }
  pc.outline(P.ink);
}

/** Rafiq the rickshaw driver: checked shirt, a cap, a big moustache. Frames: 0 idle, 1 waving. */
export function drawRafiq(pc: PixelCanvas, frame: number): void {
  pc.rect(8, 22, 3, 9, 0x3a3a48).rect(13, 22, 3, 9, 0x3a3a48);
  pc.rect(7, 30, 4, 2, 0x1a1a22).rect(13, 30, 4, 2, 0x1a1a22);
  pc.rect(6, 11, 12, 12, 0x3a6aa8);
  for (let y = 12; y < 23; y += 3) pc.hline(6, 17, y, 0x2a4a7a);
  for (let x = 7; x < 18; x += 3) pc.vline(x, 11, 22, 0x2a4a7a);
  pc.rect(8, 3, 8, 8, BROWN_SHADE);
  pc.rect(7, 1, 10, 3, 0x2a2a30).rect(14, 3, 5, 1, 0x2a2a30);
  pc.rect(9, 8, 6, 2, 0x1a1414);
  pc.px(10, 5, P.ink).px(14, 5, P.ink);
  pc.rect(4, 12, 3, 9, 0x3a6aa8);
  if (frame === 1) pc.rect(17, 3, 3, 9, 0x3a6aa8).rect(17, 1, 3, 2, BROWN_SHADE);
  else pc.rect(17, 12, 3, 9, 0x3a6aa8);
  pc.outline(P.ink);
}

/** Zain: a kid in a green shirt with a big 10 on it and a backwards cap. Frames: 0 idle, 1 jumping for joy. */
export function drawZain(pc: PixelCanvas, frame: number): void {
  const up = frame === 1 ? 2 : 0;
  pc.rect(6, 16 - up, 2, 7, 0x2a3a5a).rect(10, 16 - up, 2, 7, 0x2a3a5a);
  pc.rect(5, 22 - up, 3, 1, P.white).rect(10, 22 - up, 3, 1, P.white);
  pc.rect(5, 8 - up, 8, 9, P.omnitrix);
  pc.rect(7, 10 - up, 1, 4, P.white).rect(9, 10 - up, 3, 4, P.white).rect(10, 11 - up, 1, 2, P.omnitrix);
  pc.rect(5, 2 - up, 7, 6, BROWN);
  pc.rect(4, 1 - up, 9, 2, K.truckRed).rect(2, 2 - up, 3, 1, K.truckRed);
  pc.px(7, 4 - up, P.ink).px(10, 4 - up, P.ink);
  pc.rect(8, 6 - up, 2, 1, 0x8a3a2a);
  if (frame === 1) pc.rect(2, 2, 3, 7, P.omnitrix).rect(13, 2, 3, 7, P.omnitrix);
  else pc.rect(2, 9, 3, 6, P.omnitrix).rect(13, 9, 3, 6, P.omnitrix);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- The Charms of Bezel (10x10, four frames)

const CHARM_ORDER: readonly CharmElement[] = ['fire', 'lightning', 'stone', 'wind'];

/** A Charm of Bezel: a little carved amulet glowing its element's colour. Frames: fire, lightning, stone, wind. */
export function drawCharm(pc: PixelCanvas, frame: number): void {
  const c = CHARM_COLORS[CHARM_ORDER[frame % 4]];
  pc.circle(5, 5, 4, K.brass1);
  pc.circle(5, 5, 3, c);
  pc.px(4, 3, P.white);
  pc.px(5, 0, K.brass2);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Portraits (48x48)

function frame(pc: PixelCanvas, bg: number): void {
  pc.rect(0, 0, 48, 48, bg);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.08);
}

function eye(pc: PixelCanvas, x: number, y: number, iris: number): void {
  pc.rect(x, y, 4, 3, P.white);
  pc.rect(x + 1, y, 2, 3, iris);
  pc.px(x + 2, y + 1, P.ink);
}

/** Hex: grey-blue face framed by a tall violet collar, slicked black hair in a peak, eyes that glow. */
export function drawPortraitHex(pc: PixelCanvas): void {
  frame(pc, 0x1a0e2a);
  pc.poly([[2, 48], [6, 36], [16, 32], [36, 32], [44, 38], [46, 48]], K.hex1);
  pc.vline(26, 34, 47, K.brass2);
  pc.poly([[8, 12], [16, 36], [36, 36], [44, 12], [36, 28], [16, 28]], K.hex2);
  pc.rect(16, 10, 20, 22, K.hexSkin);
  pc.rect(16, 26, 20, 6, 0x5a7a8a);
  pc.poly([[14, 4], [38, 4], [38, 12], [26, 9], [14, 12]], 0x14101e);
  pc.rect(20, 16, 5, 2, K.hexGlow).rect(29, 16, 5, 2, K.hexGlow);
  pc.rect(19, 14, 6, 1, 0x14101e).rect(29, 14, 6, 1, 0x14101e);
  pc.rect(25, 18, 2, 6, 0x5a7a8a);
  pc.rect(21, 27, 10, 1, 0x2a3a4a);
  pc.outline(P.ink);
}

/** Charmcaster: long silver hair, a magenta circlet and collar, a cold smile. */
export function drawPortraitCharmcaster(pc: PixelCanvas): void {
  frame(pc, 0x2a0e22);
  pc.poly([[4, 48], [10, 38], [20, 34], [32, 34], [42, 40], [44, 48]], K.charm1);
  pc.rect(10, 6, 30, 40, 0xd8d8e8);
  pc.rect(16, 10, 18, 22, 0xf0e0d8);
  pc.rect(14, 6, 22, 6, 0xe8e8f4);
  pc.hline(14, 35, 8, K.charm2);
  pc.circle(25, 8, 2, K.charmGlow);
  eye(pc, 18, 17, K.charm2);
  eye(pc, 27, 17, K.charm2);
  pc.rect(22, 26, 7, 1, 0x8a3a5a).px(29, 25, 0x8a3a5a);
  pc.rect(20, 30, 10, 4, 0xe8d8d0);
  pc.outline(P.ink);
}

/** Rauf: a warm face, a big grey moustache, a white cap. */
export function drawPortraitRauf(pc: PixelCanvas): void {
  frame(pc, 0x2a3a2a);
  pc.poly([[4, 48], [10, 38], [20, 34], [32, 34], [42, 40], [44, 48]], 0xf0ece4);
  pc.poly([[12, 48], [14, 38], [22, 36], [22, 48]], 0x5a6a3a).poly([[38, 48], [36, 38], [30, 36], [30, 48]], 0x5a6a3a);
  pc.ellipse(26, 20, 12, 14, BROWN);
  pc.rect(14, 4, 24, 8, 0xe8e4dc);
  for (let x = 15; x < 37; x += 3) pc.px(x, 6, 0xc8c4bc);
  eye(pc, 19, 17, 0x3a2a1a);
  eye(pc, 28, 17, 0x3a2a1a);
  pc.rect(18, 14, 6, 1, 0x8a8a8a).rect(28, 14, 6, 1, 0x8a8a8a);
  pc.rect(24, 21, 3, 4, BROWN_SHADE);
  pc.rect(17, 26, 18, 3, 0xb8b8b8);
  pc.rect(22, 29, 8, 2, 0x8a3a2a);
  pc.outline(P.ink);
}

/** Rafiq: a grin under a black moustache, a cap pushed back. */
export function drawPortraitRafiq(pc: PixelCanvas): void {
  frame(pc, 0x1a2a3a);
  pc.poly([[4, 48], [10, 38], [20, 34], [32, 34], [42, 40], [44, 48]], 0x3a6aa8);
  for (let x = 8; x < 44; x += 4) pc.vline(x, 38, 47, 0x2a4a7a);
  pc.ellipse(26, 21, 12, 14, BROWN_SHADE);
  pc.rect(13, 5, 26, 7, 0x2a2a30).rect(30, 9, 12, 3, 0x2a2a30);
  eye(pc, 19, 17, 0x2a1a14);
  eye(pc, 28, 17, 0x2a1a14);
  pc.rect(24, 21, 3, 4, BROWN_DEEP);
  pc.rect(17, 26, 18, 3, 0x14100e);
  pc.rect(20, 29, 12, 2, P.white);
  pc.outline(P.ink);
}

/** Zain: a beaming kid in a backwards red cap, eyes huge with excitement. */
export function drawPortraitZain(pc: PixelCanvas): void {
  frame(pc, 0x1a3a2a);
  pc.poly([[6, 48], [12, 38], [20, 35], [32, 35], [40, 39], [42, 48]], P.omnitrix);
  pc.rect(23, 39, 2, 7, P.white).rect(27, 39, 5, 7, P.white).rect(28, 41, 3, 3, P.omnitrix);
  pc.ellipse(26, 22, 11, 12, BROWN);
  pc.rect(14, 8, 24, 7, K.truckRed).rect(8, 12, 8, 3, K.truckRed);
  pc.rect(16, 12, 20, 3, 0x1a1414);
  eye(pc, 19, 19, 0x3a2a1a);
  eye(pc, 28, 19, 0x3a2a1a);
  pc.px(20, 19, P.white).px(29, 19, P.white);
  pc.ellipse(26, 29, 5, 3, 0x6a1a1a);
  pc.rect(22, 27, 9, 2, P.white);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- The port

/** A ship-to-shore crane close up, its cables hanging down. 120x200. */
export function drawCrane(pc: PixelCanvas): void {
  pc.rect(10, 40, 6, 160, 0x3a3a52).rect(70, 40, 6, 160, 0x3a3a52);
  for (let y = 50; y < 200; y += 30) {
    pc.line(16, y, 70, y + 26, 0x3a3a52, 2);
    pc.line(70, y, 16, y + 26, 0x3a3a52, 2);
  }
  pc.rect(0, 30, 120, 10, 0x4a4a62);
  pc.rect(0, 30, 120, 2, 0x6a6a88);
  pc.rect(24, 12, 30, 18, 0x4a4a62);
  pc.rect(28, 16, 10, 8, K.window);
  for (const x of [2, 118]) pc.px(x, 29, P.enemy).px(x, 28, P.enemy);
  pc.line(39, 12, 2, 30, 0x3a3a52).line(39, 12, 118, 30, 0x3a3a52);
}

/** A cargo ship's hull and its stacks of containers, side on. 320x80. */
export function drawShip(pc: PixelCanvas): void {
  pc.poly([[0, 40], [320, 40], [306, 80], [16, 80]], 0x2a2a3a);
  pc.rect(0, 40, 320, 6, 0x8a2a2a);
  for (let x = 20; x < 300; x += 6) pc.px(x, 50, 0x4a4a5a);
  const rnd = seeded(808);
  const colors = [0x8a2a2a, 0x2a4a8a, 0x2a7a4a, 0x8a6a2a, 0x5a5a6a, 0xd87a2a];
  for (let x = 30; x < 250; x += 22) {
    const n = 1 + Math.floor(rnd() * 3);
    for (let s = 0; s < n; s++) {
      pc.rect(x, 32 - s * 9, 20, 8, colors[Math.floor(rnd() * colors.length)]);
      pc.vline(x + 10, 33 - s * 9, 38 - s * 9, 0x00000);
    }
  }
  pc.rect(262, 6, 40, 34, 0xe8e4dc);
  for (let x = 266; x < 300; x += 6) pc.rect(x, 12, 4, 4, K.window).rect(x, 24, 4, 4, K.window);
  pc.rect(284, 0, 6, 6, 0x8a2a2a);
}

/** A puff of extinguisher foam (Max's weapon of choice). 16x16. */
export function drawExtinguisherCloud(pc: PixelCanvas): void {
  pc.circle(8, 8, 7, 0xf4f4f0, 0.85);
  pc.circle(6, 6, 3, P.white);
  pc.circle(11, 9, 2, 0xd8e0e8);
}
