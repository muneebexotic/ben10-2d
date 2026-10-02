import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/**
 * Dr. Animo, his giant mutant frog, and Kevin (Act 1's last scene).
 * Animo: a gaunt scientist with a huge bald dome, white side tufts, sunken
 * eyes, a lab coat, and the Transmodulator: a brass crown with a purple gem
 * that bends animals to his will.
 */

const ANIMO_SKIN = 0xc8c8a8;
const ANIMO_SHADE = 0x8a8a6e;
const COAT = 0xe8e8ec;
const COAT_SHADE = 0xa8a8b8;
const CROWN = 0xb8a060;
const GEM = 0xb27ae8;

export const ANIMO_FRAME = { w: 32, h: 48 } as const;
/** 0-1 idle, 2 arms raised (the speech), 3 pointing the ray, 4-5 walk, 6 crouched (riding the frog), 7 knocked out. */
export const ANIMO_FRAME_COUNT = 8;

export function drawAnimo(pc: PixelCanvas, frame: number): void {
  if (frame === 7) {
    // Flat on his back, crown askew, seeing stars.
    pc.rect(2, 40, 26, 6, COAT);
    pc.rect(2, 40, 26, 2, COAT_SHADE);
    pc.ellipse(28, 41, 4, 4, ANIMO_SKIN);
    pc.rect(25, 35, 8, 3, CROWN);
    pc.px(29, 34, GEM);
    pc.rect(0, 44, 6, 2, 0x2a2a34);
    pc.outline(P.ink);
    return;
  }
  const crouch = frame === 6;
  const walk = frame === 4 || frame === 5;
  const bob = frame === 1 ? 1 : 0;
  const top = crouch ? 10 : 2 + bob;
  // Legs (dark trousers) and shoes.
  if (!crouch) {
    const lf = walk ? (frame === 4 ? 3 : -2) : 0;
    pc.rect(12 + lf, 36, 3, 10, 0x2a2a34);
    pc.rect(17 - lf, 36, 3, 10, 0x22222c);
    pc.rect(11 + lf, 45, 5, 2, P.ink).rect(16 - lf, 45, 5, 2, P.ink);
  } else {
    pc.rect(10, 40, 12, 4, 0x2a2a34);
    pc.rect(8, 43, 6, 2, P.ink).rect(19, 43, 6, 2, P.ink);
  }
  // Lab coat: long, flared, a little stained.
  const coatTop = top + 18;
  const coatBottom = crouch ? 42 : 40;
  pc.poly([[10, coatTop], [22, coatTop], [24, coatBottom], [8, coatBottom]], COAT);
  pc.vline(16, coatTop + 2, coatBottom - 1, COAT_SHADE);
  pc.rect(8, coatBottom - 1, 16, 1, COAT_SHADE);
  pc.px(19, coatTop + 9, P.mutagen).px(12, coatTop + 13, P.mutagen);
  // Dark shirt collar.
  pc.poly([[13, coatTop], [19, coatTop], [16, coatTop + 5]], 0x3a2a4a);
  // Arms.
  if (frame === 2) {
    pc.line(10, coatTop + 2, 4, coatTop - 9, COAT, 3).line(22, coatTop + 2, 28, coatTop - 9, COAT, 3);
    pc.rect(3, coatTop - 12, 3, 3, ANIMO_SKIN).rect(27, coatTop - 12, 3, 3, ANIMO_SKIN);
  } else if (frame === 3) {
    pc.line(10, coatTop + 2, 9, coatTop + 12, COAT_SHADE, 3);
    pc.line(22, coatTop + 2, 31, coatTop + 1, COAT, 3);
    pc.rect(29, coatTop - 1, 3, 3, ANIMO_SKIN);
  } else {
    pc.line(10, coatTop + 2, 8, coatTop + 13, COAT_SHADE, 3).line(22, coatTop + 2, 24, coatTop + 13, COAT, 3);
    pc.rect(7, coatTop + 13, 3, 3, ANIMO_SKIN).rect(23, coatTop + 13, 3, 3, ANIMO_SKIN);
  }
  // Thin neck, huge domed head, white tufts.
  pc.rect(15, top + 15, 3, 4, ANIMO_SHADE);
  pc.ellipse(17, top + 7, 7, 8, ANIMO_SKIN);
  pc.ellipse(18, top + 12, 4, 3, ANIMO_SKIN);
  pc.rect(9, top + 7, 3, 4, P.white).rect(23, top + 8, 2, 3, P.white);
  // Sunken eyes with tiny bright pupils, a sneer.
  pc.rect(17, top + 8, 3, 2, ANIMO_SHADE).rect(21, top + 8, 2, 2, ANIMO_SHADE);
  pc.px(18, top + 9, frame === 3 ? GEM : P.white).px(21, top + 9, frame === 3 ? GEM : P.white);
  pc.line(18, top + 13, 22, top + 12, 0x5a3a3a);
  // The Transmodulator crown.
  pc.rect(10, top + 2, 14, 3, CROWN);
  pc.rect(11, top + 1, 12, 1, 0xe8d090);
  for (const x of [12, 17, 22]) pc.rect(x, top - 1, 1, 3, CROWN);
  pc.rect(16, top - 2, 3, 3, GEM);
  pc.px(16, top - 2, P.white);
  pc.outline(P.ink);
}

/** Dialogue portrait (48x48): the dome, the crown, the gem glowing, a gleeful sneer. */
export function drawPortraitAnimo(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x241834);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.08);
  // Coat collar and dark shirt.
  pc.poly([[4, 48], [10, 38], [22, 36], [34, 36], [42, 40], [46, 48]], COAT);
  pc.poly([[20, 36], [26, 46], [32, 36]], 0x3a2a4a);
  // Head.
  pc.rect(22, 30, 8, 7, ANIMO_SHADE);
  pc.ellipse(26, 17, 14, 16, ANIMO_SKIN);
  pc.ellipse(27, 28, 8, 5, ANIMO_SKIN);
  // Tufts.
  pc.ellipse(11, 20, 3, 5, P.white).ellipse(41, 21, 3, 4, P.white);
  // Brow ridge, deep-set eyes, bags.
  pc.rect(20, 18, 7, 4, ANIMO_SHADE).rect(30, 18, 7, 4, ANIMO_SHADE);
  pc.rect(22, 19, 3, 2, P.white).rect(32, 19, 3, 2, P.white);
  pc.px(23, 19, P.ink).px(33, 19, P.ink);
  pc.line(19, 17, 26, 16, 0x5a5a48).line(30, 16, 37, 17, 0x5a5a48);
  pc.line(21, 23, 26, 23, ANIMO_SHADE).line(31, 23, 36, 23, ANIMO_SHADE);
  // Long nose, a thin sneering grin.
  pc.line(28, 21, 30, 27, ANIMO_SHADE);
  pc.line(22, 31, 34, 29, 0x5a3a3a);
  pc.px(34, 28, 0x5a3a3a);
  // Crown with its gem.
  pc.rect(13, 6, 26, 4, CROWN);
  pc.rect(14, 5, 24, 1, 0xe8d090);
  for (const x of [16, 25, 35]) pc.rect(x, 2, 2, 4, CROWN);
  pc.rect(24, 0, 5, 5, GEM);
  pc.px(25, 1, P.white);
  pc.outline(P.ink);
}

export const FROG_FRAME = { w: 112, h: 80 } as const;
/** 0-1 idle (throat pulsing), 2 crouch (leap tell), 3 airborne, 4 tongue (mouth open), 5 throat inflated (spit/burp tell), 6 dazed, 7 hurt flinch. */
export const FROG_FRAME_COUNT = 8;

const FROG = 0x5aa83a;
const FROG_DARK = 0x2e6a24;
const FROG_LIGHT = 0x9ad860;
const BELLY = 0xe8e0a0;

export function drawFrog(pc: PixelCanvas, frame: number): void {
  const crouch = frame === 2;
  const air = frame === 3;
  const tongue = frame === 4;
  const inflate = frame === 5;
  const dazed = frame === 6;
  const flinch = frame === 7;
  const squash = crouch ? 6 : air ? -6 : frame === 1 ? 1 : 0;
  const by = 52 + squash;
  // Back legs: huge, folded (or kicked out mid-leap).
  if (air) {
    pc.line(30, by + 4, 8, by + 18, FROG_DARK, 8).line(8, by + 18, 2, by + 24, FROG_DARK, 5);
    pc.line(38, by + 6, 20, by + 22, FROG, 8).line(20, by + 22, 12, by + 27, FROG, 5);
  } else {
    pc.ellipse(26, by + 10, 16, 12, FROG_DARK);
    pc.ellipse(34, by + 12, 16, 12, FROG);
    pc.rect(14, 76, 26, 4, FROG_DARK);
    for (const x of [16, 24, 32]) pc.rect(x, 75, 5, 3, FROG_LIGHT);
  }
  // Body: a hunched dome with warts and mutagen-glowing spots.
  pc.ellipse(54, by - 4, 34, 24 - Math.max(0, squash), FROG);
  pc.ellipse(60, by + 6, 26, 14, BELLY);
  for (const [x, y] of [[36, by - 18], [48, by - 22], [62, by - 20], [42, by - 8], [70, by - 12]]) {
    pc.circle(x, y, 2, FROG_DARK);
    pc.px(x, y - 1, P.mutagen);
  }
  // Throat sac: glows when it swells.
  if (inflate) {
    pc.ellipse(84, by + 4, 16, 14, 0xc8f070);
    pc.ellipse(84, by + 4, 12, 10, P.mutagenGlow);
    pc.px(80, by, P.white).px(81, by - 1, P.white);
  } else {
    pc.ellipse(82, by + 6, 10, 7, BELLY);
  }
  // Front legs.
  if (!air) {
    pc.line(74, by + 10, 80, 75, FROG, 6);
    pc.rect(76, 75, 12, 4, FROG_LIGHT);
  } else {
    pc.line(74, by + 8, 92, by + 18, FROG, 6);
  }
  // Head: wide flat head with bulging eyes on top.
  const hx = 86;
  const hy = by - 14 + (flinch ? 3 : 0);
  pc.ellipse(hx, hy + 4, 22, 12, FROG);
  pc.ellipse(hx + 4, hy + 8, 18, 6, FROG_LIGHT);
  // Mouth line, or wide open for the tongue.
  if (tongue) {
    pc.poly([[hx - 12, hy + 6], [hx + 22, hy + 2], [hx + 22, hy + 18], [hx - 8, hy + 12]], 0x5a1a2a);
    pc.ellipse(hx + 14, hy + 12, 6, 3, 0xe85a7a);
  } else {
    pc.line(hx - 14, hy + 8, hx + 20, hy + 6, FROG_DARK, 2);
  }
  // Eyes: huge, yellow, slit pupils; spirals when dazed.
  for (const [ex, ey] of [[hx - 6, hy - 8], [hx + 10, hy - 9]]) {
    pc.circle(ex, ey, 7, FROG);
    pc.circle(ex, ey, 5, dazed ? P.white : 0xf0d040);
    if (dazed) {
      pc.line(ex - 3, ey, ex + 3, ey, P.ink).line(ex, ey - 3, ex, ey + 3, P.ink);
    } else {
      pc.rect(ex, ey - 4, 2, 8, P.ink);
      pc.px(ex - 2, ey - 2, P.white);
    }
  }
  // Animo's control collar: a brass band with a purple light.
  pc.rect(70, by - 8, 6, 16, CROWN);
  pc.rect(71, by - 2, 4, 4, GEM);
  pc.outline(P.ink);
}

/** The frog's tongue: a pink segment that tiles sideways (8x6) — the tip is frame 1. */
export function drawTongue(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.rect(0, 1, 8, 4, 0xe85a7a);
    pc.hline(0, 7, 1, 0xff9ab0);
    pc.hline(0, 7, 4, 0xa83a5a);
  } else {
    pc.ellipse(4, 3, 3, 3, 0xe85a7a);
    pc.px(3, 1, 0xffc0d0);
    pc.outline(0xa83a5a);
  }
}

export const KEVIN_FRAME = { w: 24, h: 36 } as const;
/** 0 at the machine, 1 hand on it (absorbing), 2 turned to the camera, eyes glowing. */
export function drawKevin(pc: PixelCanvas, frame: number): void {
  const shirt = 0x2a2a34;
  const sleeve = 0x5a5a6a;
  const skin = 0xe8b890;
  const hair = 0x14101a;
  // Legs.
  pc.rect(8, 26, 3, 9, 0x2a3a5a).rect(13, 26, 3, 9, 0x22304a);
  pc.rect(7, 34, 5, 2, P.ink).rect(12, 34, 5, 2, P.ink);
  // Two-tone shirt.
  pc.rect(6, 14, 12, 13, shirt);
  pc.rect(6, 14, 3, 13, sleeve);
  pc.rect(15, 14, 3, 13, sleeve);
  // Arm: reaching to the machine when absorbing.
  if (frame === 1) pc.line(17, 16, 23, 15, sleeve, 3);
  else pc.line(17, 16, 18, 25, sleeve, 3);
  // Head and long black hair.
  pc.ellipse(12, 8, 5, 6, skin);
  pc.ellipse(11, 5, 6, 4, hair);
  pc.rect(5, 5, 4, 10, hair);
  if (frame === 2) {
    // Turned toward us: a grin and glowing purple eyes.
    pc.rect(10, 8, 2, 1, 0xc89cff).rect(14, 8, 2, 1, 0xc89cff);
    pc.line(10, 11, 15, 11, 0x5a2a2a);
    pc.px(15, 10, 0x5a2a2a);
  } else {
    pc.px(15, 8, P.ink);
  }
  pc.outline(P.ink);
}

/** An arcade cabinet: Sumo Slammers glowing on the screen. 26x44, frame 1 is the dead screen. */
export function drawArcade(pc: PixelCanvas, frame: number): void {
  pc.rect(2, 0, 22, 44, 0x2a1e3a);
  pc.rect(2, 0, 22, 6, 0x4a2a6a);
  pc.rect(5, 1, 16, 4, frame === 0 ? 0xff5ac8 : 0x2a1e3a);
  pc.rect(4, 8, 18, 14, 0x0a0a12);
  if (frame === 0) {
    pc.rect(5, 9, 16, 12, 0x1a3a6a);
    pc.ellipse(10, 16, 3, 4, 0xf2c29b).ellipse(16, 16, 3, 4, 0xe8a070);
    pc.rect(6, 19, 14, 2, 0x3a7a3a);
  }
  pc.rect(3, 24, 20, 6, 0x3a2a4a);
  pc.circle(9, 26, 1, P.enemy).circle(15, 26, 1, P.gold).circle(18, 27, 1, P.omnitrix);
  pc.rect(6, 32, 14, 10, 0x221832);
  pc.outline(P.ink);
}

/** Kevin's portrait for the cliffhanger: half in shadow, a crooked grin, eyes glowing purple. 48x48. */
export function drawPortraitKevin(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x120c1c);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.1);
  pc.poly([[4, 48], [10, 38], [38, 38], [44, 48]], 0x2a2a34);
  pc.poly([[4, 48], [10, 38], [16, 38], [14, 48]], 0x5a5a6a);
  pc.rect(21, 30, 8, 8, 0x8a6a58);
  pc.ellipse(25, 20, 11, 13, 0xc89a78);
  // Shadow over half the face.
  pc.ellipse(18, 20, 6, 12, 0x6a4a40);
  // Long hair over the brow.
  pc.ellipse(23, 9, 13, 7, 0x14101a);
  pc.rect(11, 8, 6, 22, 0x14101a);
  pc.poly([[16, 10], [34, 10], [30, 16], [20, 15]], 0x14101a);
  pc.rect(20, 18, 4, 2, 0xc89cff).rect(28, 18, 4, 2, 0xc89cff);
  pc.px(21, 18, P.white).px(29, 18, P.white);
  pc.line(21, 27, 31, 25, 0x5a2a2a);
  pc.px(31, 24, 0x5a2a2a);
  pc.outline(P.ink);
}
