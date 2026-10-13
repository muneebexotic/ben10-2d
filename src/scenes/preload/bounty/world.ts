import { PALETTE as P } from '../../../config/palette';
import { FRAME } from '../../../levels/tiles';
import { seeded, type PixelCanvas } from '../PixelCanvas';

/**
 * Chapter 5's ground and skies: Silver Spur's packed-dirt street and the
 * Diamond Deep's dark rock veined with crystal, boardwalk planks for the
 * one-way ledges, a full-moon desert night and the back walls of the
 * saloon, the jail, the haunted hotel, the mine and the crystal caverns.
 */

export const WESTERN = {
  dirt0: 0x3a2418,
  dirt1: 0x5a3824,
  dirt2: 0x7a5034,
  dirt3: 0x9a6a44,
  road: 0xb08452,
  rock0: 0x1c1822,
  rock1: 0x2c2634,
  rock2: 0x433a4c,
  rock3: 0x5e5468,
  vein: P.diamondhead,
  plank0: 0x3a2214,
  plank1: 0x6b4226,
  plank2: 0x8f5c34,
  plank3: 0xb07a48,
  nightTop: 0x050818,
  nightMid: 0x101a3e,
  nightLow: 0x2a2a5a,
  horizon: 0x5a4a78,
  mesa0: 0x120e22,
  mesa1: 0x1e1834,
  mesa2: 0x2e2448,
  moonlit: 0x6a6aa8,
} as const;
const W = WESTERN;

// ---------------------------------------------------------------- Tiles

/** Packed desert dirt: grains and pebbles. */
function dirtBase(pc: PixelCanvas, seed: number, deep = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 16, deep ? W.dirt0 : W.dirt1);
  for (let i = 0; i < 12; i++) pc.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? W.dirt0 : W.dirt2);
  if (seed % 3 === 0) pc.rect(Math.floor(rnd() * 12) + 2, Math.floor(rnd() * 12) + 2, 2, 1, W.dirt3);
}

/** The street's surface: a lighter wheel-rutted crust with the odd dry tuft. */
function dirtTop(pc: PixelCanvas, left: boolean, right: boolean, variant: boolean): void {
  pc.rect(0, 0, 16, 4, W.dirt2);
  pc.hline(0, 15, 0, W.road);
  pc.hline(0, 15, 4, W.dirt0);
  pc.px(3, 2, W.dirt3).px(9, 1, W.dirt3).px(13, 3, W.dirt1);
  if (variant) {
    // A tuft of dry grass.
    pc.px(6, -0, 0x8a7a3a).line(5, 0, 4, -0, 0x8a7a3a);
    pc.px(10, 1, 0xa8904a);
  }
  if (left) pc.rect(0, 0, 1, 5, W.dirt0);
  if (right) pc.rect(15, 0, 1, 5, W.dirt0);
}

/** Mine rock: dark slate, cracks, and now and then a glint of crystal. */
function rockBase(pc: PixelCanvas, seed: number, variant = false): void {
  const rnd = seeded(seed + 41);
  pc.rect(0, 0, 16, 16, W.rock1);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(rnd() * 12);
    const y = Math.floor(rnd() * 12);
    pc.rect(x, y, 3 + Math.floor(rnd() * 3), 2, rnd() < 0.5 ? W.rock0 : W.rock2);
  }
  pc.line(Math.floor(rnd() * 16), 0, Math.floor(rnd() * 16), 15, W.rock0);
  if (variant || seed % 5 === 0) {
    const x = 3 + Math.floor(rnd() * 10);
    const y = 3 + Math.floor(rnd() * 10);
    pc.px(x, y, W.vein).px(x + 1, y - 1, P.diamondheadGlow).px(x - 1, y + 1, P.diamondheadDark);
  }
}

/** A worn rock floor: gravel along the top. */
function rockTop(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 3, W.rock3);
  for (let x = 0; x < 16; x += 2) pc.px(x + (x % 4 === 0 ? 1 : 0), 1, W.rock2);
  pc.hline(0, 15, 0, 0x7a7088);
  pc.hline(0, 15, 3, W.rock0);
  if (left) pc.rect(0, 0, 1, 4, W.rock0);
  if (right) pc.rect(15, 0, 1, 4, W.rock0);
}

/** Boardwalk planks on a beam (the one-way ledges: porches, balconies, scaffolds). */
function planks(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 4, W.plank2);
  pc.hline(0, 15, 0, W.plank3);
  pc.vline(5, 1, 3, W.plank0).vline(11, 1, 3, W.plank0);
  pc.px(2, 2, W.plank0).px(14, 2, W.plank0);
  pc.hline(0, 15, 4, W.plank0);
  pc.rect(0, 5, 16, 2, W.plank1);
  if (left) pc.rect(1, 5, 3, 6, W.plank1).vline(1, 5, 10, W.plank0);
  if (right) pc.rect(12, 5, 3, 6, W.plank1).vline(14, 5, 10, W.plank0);
}

export function drawWesternTile(pc: PixelCanvas, frame: number): void {
  const F = FRAME;
  const seed = frame * 53 + 17;
  switch (frame) {
    case F.GRASS_TOP:
    case F.GRASS_TOP_VAR:
    case F.GRASS_TOP_L:
    case F.GRASS_TOP_R:
    case F.GRASS_TOP_S:
      dirtBase(pc, seed);
      dirtTop(pc, frame === F.GRASS_TOP_L || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_R || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_VAR);
      return;
    case F.DIRT:
    case F.DIRT_VAR:
      dirtBase(pc, seed);
      return;
    case F.DIRT_DEEP:
      dirtBase(pc, seed, true);
      return;
    case F.DIRT_L:
      dirtBase(pc, seed);
      pc.rect(0, 0, 2, 16, W.dirt0);
      return;
    case F.DIRT_R:
      dirtBase(pc, seed);
      pc.rect(14, 0, 2, 16, W.dirt0);
      return;
    case F.DIRT_BOTTOM:
      dirtBase(pc, seed);
      pc.rect(0, 13, 16, 3, W.dirt0);
      return;
    case F.ROCK:
    case F.ROCK_VAR:
      rockBase(pc, seed, frame === F.ROCK_VAR);
      return;
    case F.ROCK_TOP:
    case F.ROCK_TOP_L:
    case F.ROCK_TOP_R:
    case F.ROCK_TOP_S:
      rockBase(pc, seed);
      rockTop(pc, frame === F.ROCK_TOP_L || frame === F.ROCK_TOP_S, frame === F.ROCK_TOP_R || frame === F.ROCK_TOP_S);
      return;
    case F.ROCK_L:
      rockBase(pc, seed);
      pc.rect(0, 0, 2, 16, W.rock0);
      return;
    case F.ROCK_R:
      rockBase(pc, seed);
      pc.rect(14, 0, 2, 16, W.rock0);
      return;
    case F.ROCK_BOTTOM:
      rockBase(pc, seed);
      pc.rect(0, 12, 16, 4, W.rock0);
      pc.px(4, 13, W.rock2).px(11, 14, W.rock2);
      return;
    case F.PLATFORM_L:
      planks(pc, true, false);
      return;
    case F.PLATFORM_M:
      planks(pc, false, false);
      return;
    case F.PLATFORM_R:
      planks(pc, false, true);
      return;
    case F.PLATFORM_S:
      planks(pc, true, true);
      return;
    default:
      return;
  }
}

// ---------------------------------------------------------------- Sky

/** A full-moon desert night: deep blue overhead, a pale violet band where the land meets it. 8x360. */
export function drawWesternSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, 8, 360, [
    [0, W.nightTop],
    [0.45, W.nightMid],
    [0.78, W.nightLow],
    [1, W.horizon],
  ]);
}

/** The full moon, big and close, with its seas. 64x64. */
export function drawBigMoon(pc: PixelCanvas): void {
  pc.radial(32, 32, 32, [
    [0, 0xfff8e8, 1],
    [0.7, 0xe8e4ff, 1],
    [0.9, 0xb8c0ff, 0.5],
    [1, 0xb8c0ff, 0],
  ]);
  pc.circle(32, 32, 22, 0xf4f0e0);
  for (const [x, y, r] of [[25, 26, 5], [38, 22, 3], [36, 38, 6], [22, 38, 3], [42, 31, 2]] as const) pc.circle(x, y, r, 0xd8d0c0);
  pc.circle(30, 28, 1, 0xc8c0b0);
}

/** Far mesas: flat-topped silhouettes, moonlight catching their rims. 384x140. */
export function drawMesasFar(pc: PixelCanvas): void {
  const rnd = seeded(51);
  const tops: Array<[number, number, number]> = [];
  let x = -10;
  while (x < 384) {
    const w = 40 + Math.floor(rnd() * 70);
    const h = 30 + Math.floor(rnd() * 55);
    tops.push([x, w, h]);
    x += w + Math.floor(rnd() * 30);
  }
  for (const [mx, w, h] of tops) {
    const top = 140 - h;
    pc.poly([[mx, 140], [mx + 6, top + 4], [mx + 10, top], [mx + w - 10, top], [mx + w - 5, top + 5], [mx + w, 140]], W.mesa1);
    pc.hline(mx + 10, mx + w - 11, top, W.moonlit);
    pc.hline(mx + 8, mx + w - 8, top + 1, W.mesa2);
    for (let k = 0; k < 3; k++) pc.vline(mx + 14 + Math.floor(rnd() * (w - 24)), top + 6, top + 6 + Math.floor(rnd() * h * 0.6), W.mesa0);
  }
  pc.rect(0, 128, 384, 12, W.mesa0);
}

/** Near buttes and the ridge Silver Spur sits under, saguaros and a far mine headframe. 384x170. */
export function drawMesasNear(pc: PixelCanvas): void {
  const rnd = seeded(77);
  let y = 120;
  for (let x = 0; x < 384; x++) {
    y += Math.round((rnd() - 0.5) * 2);
    y = Math.max(100, Math.min(140, y));
    pc.vline(x, y, 169, W.mesa0);
    if (x % 3 === 0) pc.px(x, y, W.mesa2);
  }
  // A butte with a moonlit face.
  pc.poly([[200, 170], [208, 70], [214, 62], [252, 62], [258, 70], [270, 170]], W.mesa0);
  pc.poly([[252, 62], [258, 70], [270, 170], [252, 170]], W.mesa1);
  pc.hline(214, 251, 62, W.moonlit);
  // Saguaros.
  for (const sx of [40, 118, 300, 352]) {
    const base = 128 + Math.floor(rnd() * 8);
    pc.rect(sx, base - 26, 3, 26, W.mesa0);
    pc.rect(sx - 5, base - 18, 3, 8, W.mesa0).rect(sx - 5, base - 12, 5, 2, W.mesa0);
    pc.rect(sx + 5, base - 22, 3, 9, W.mesa0).rect(sx + 3, base - 15, 5, 2, W.mesa0);
  }
  // A far headframe.
  pc.line(150, 112, 160, 80, W.mesa0, 2).line(170, 112, 160, 80, W.mesa0, 2).line(152, 100, 168, 100, W.mesa0);
  pc.circle(160, 80, 4, W.mesa0);
}

// ---------------------------------------------------------------- Interior walls (128x192, floor at the bottom)

/** The saloon: plank wainscot, red-flock wallpaper, a mirror's frame. */
export function drawSaloonWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, 0x3a1418);
  for (let y = 4; y < 132; y += 12) for (let x = (y / 12) % 2 === 0 ? 4 : 10; x < 128; x += 12) pc.poly([[x, y], [x + 3, y + 3], [x, y + 6], [x - 3, y + 3]], 0x5a2228);
  pc.rect(0, 132, 128, 60, W.plank1);
  for (let x = 0; x < 128; x += 8) pc.vline(x, 132, 191, W.plank0);
  pc.rect(0, 130, 128, 3, W.plank3);
  pc.rect(0, 186, 128, 6, W.plank0);
  pc.rect(40, 40, 48, 36, 0x8a6a2a);
  pc.rect(43, 43, 42, 30, 0x1a1a2e);
  pc.line(46, 46, 60, 60, 0x2e2e48);
}

/** The jail: big sandstone blocks, a barred window high up. */
export function drawJailWall(pc: PixelCanvas): void {
  const rnd = seeded(23);
  pc.rect(0, 0, 128, 192, 0x4a3a30);
  for (let row = 0; row < 16; row++) {
    const off = row % 2 === 0 ? 0 : 12;
    for (let x = -off; x < 128; x += 24) {
      const c = rnd() < 0.3 ? 0x56463a : rnd() < 0.5 ? 0x44352c : 0x4e3e33;
      pc.rect(x + 1, row * 12 + 1, 22, 10, c);
      pc.hline(x + 1, x + 22, row * 12 + 1, 0x5e4c3e);
    }
  }
  pc.rect(52, 40, 24, 20, 0x0c0e1e);
  for (let x = 55; x < 76; x += 5) pc.rect(x, 40, 2, 20, 0x2a2a30);
  pc.rect(0, 180, 128, 12, 0x2a2018);
}

/** The haunted hotel: faded striped wallpaper peeling, a crooked picture frame, a sconce. */
export function drawHotelWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, 0x2a2238);
  for (let x = 0; x < 128; x += 10) pc.rect(x, 0, 4, 150, 0x332a44);
  pc.rect(0, 150, 128, 42, 0x231a14);
  pc.rect(0, 148, 128, 3, 0x5a4428);
  for (let x = 0; x < 128; x += 16) pc.rect(x + 2, 156, 12, 30, 0x2e2218);
  // A peeling strip and a crooked frame.
  pc.poly([[90, 20], [100, 20], [104, 60], [96, 52]], 0x1a1424);
  pc.line(30, 50, 62, 54, 0x6a5428, 2).line(62, 54, 60, 84, 0x6a5428, 2).line(60, 84, 28, 80, 0x6a5428, 2).line(28, 80, 30, 50, 0x6a5428, 2);
  pc.rect(33, 56, 25, 22, 0x14101e);
  pc.ellipse(45, 66, 5, 7, 0x2a2440);
}

/** The mine: raw rock between timber sets (posts and a cap beam). */
export function drawMineWall(pc: PixelCanvas): void {
  const rnd = seeded(91);
  pc.rect(0, 0, 128, 192, 0x15121a);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * 128);
    const y = Math.floor(rnd() * 192);
    pc.rect(x, y, 4 + Math.floor(rnd() * 8), 2 + Math.floor(rnd() * 3), rnd() < 0.5 ? 0x1e1a24 : 0x241f2c);
  }
  for (const px of [6, 70]) {
    pc.rect(px, 60, 8, 132, W.plank0);
    pc.vline(px + 1, 60, 191, W.plank1);
  }
  pc.rect(0, 52, 128, 8, W.plank0);
  pc.hline(0, 127, 53, W.plank1);
  for (let i = 0; i < 4; i++) pc.px(20 + i * 30, 120 + (i % 2) * 20, P.diamondheadDark);
}

/** The crystal caverns: dark stone thick with glowing crystal clusters. */
export function drawCavernWall(pc: PixelCanvas): void {
  const rnd = seeded(13);
  pc.rect(0, 0, 128, 192, 0x0c1424);
  for (let i = 0; i < 40; i++) pc.rect(Math.floor(rnd() * 128), Math.floor(rnd() * 192), 6, 3, 0x111c30);
  for (let i = 0; i < 7; i++) {
    const cx = Math.floor(rnd() * 120) + 4;
    const cy = Math.floor(rnd() * 170) + 10;
    for (let k = 0; k < 3; k++) {
      const h = 8 + Math.floor(rnd() * 14);
      const dx = (k - 1) * 5;
      const lean = (k - 1) * 3;
      pc.poly([[cx + dx - 3, cy], [cx + dx + lean, cy - h], [cx + dx + 3, cy]], k === 1 ? 0x2a6a8a : 0x1e4a6a);
      pc.line(cx + dx + lean, cy - h + 1, cx + dx - 1, cy - 1, 0x4a9aba);
    }
  }
}

/** A mine shaft: cribbing timbers stacked up the walls. */
export function drawShaftWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, 0x14111a);
  for (let y = 0; y < 192; y += 24) {
    pc.rect(0, y, 128, 6, W.plank0);
    pc.hline(0, 127, y + 1, W.plank1);
    for (let x = 10; x < 128; x += 36) pc.rect(x, y + 6, 6, 18, 0x231a14);
  }
}
