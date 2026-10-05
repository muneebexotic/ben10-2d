import { PALETTE as P } from '../../config/palette';
import { FRAME } from '../../levels/tiles';
import { lettering, letteringCentred } from './lettering';
import { seeded, type PixelCanvas } from './PixelCanvas';

/**
 * Chapter 4's set: downtown at dusk, the GAME ZONE arcade and its laser tag
 * arena, the abandoned subway Line 11 and the substation it feeds. Concrete
 * slabs with hazard-striped edges, brick, steel grating catwalks.
 */

// ---------------------------------------------------------------- Tiles

/** Poured concrete: speckled, with the seam of a slab. */
function concreteBase(pc: PixelCanvas, seed: number, deep = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 16, deep ? P.concrete0 : P.concrete1);
  for (let i = 0; i < 10; i++) pc.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? P.concrete0 : P.concrete2);
  if (seed % 3 === 0) pc.vline(Math.floor(rnd() * 14) + 1, 0, 15, P.concrete0);
  if (seed % 4 === 1) pc.px(Math.floor(rnd() * 14) + 1, Math.floor(rnd() * 14) + 1, 0x6a4a3a);
}

/** A slab's top: a bright edge, and hazard dashes where it ends (platform edges read at a glance). */
function concreteTop(pc: PixelCanvas, left: boolean, right: boolean, variant: boolean): void {
  pc.rect(0, 0, 16, 4, P.concrete2);
  pc.hline(0, 15, 0, P.concrete3);
  pc.hline(0, 15, 4, P.concrete0);
  if (variant) pc.px(5, 2, P.concrete3).px(11, 1, P.concrete1);
  if (left) {
    pc.rect(0, 0, 4, 3, P.hazard);
    pc.px(1, 0, P.ink).px(2, 1, P.ink);
  }
  if (right) {
    pc.rect(12, 0, 4, 3, P.hazard);
    pc.px(13, 0, P.ink).px(14, 1, P.ink);
  }
}

/** Brick: staggered courses, a soot-dark one now and then. */
function brickBase(pc: PixelCanvas, seed: number, variant = false): void {
  const rnd = seeded(seed + 11);
  pc.rect(0, 0, 16, 16, P.brick0);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 === 0 ? 0 : 4;
    for (let bx = -off; bx < 16; bx += 8) {
      const c = variant && rnd() < 0.35 ? P.brick1 : rnd() < 0.25 ? P.brick3 : P.brick2;
      pc.rect(bx + 1, row * 4 + 1, 7, 3, c);
      pc.hline(bx + 1, bx + 7, row * 4 + 1, rnd() < 0.5 ? P.brick3 : c);
    }
  }
}

/** Concrete coping along the top of a brick wall. */
function coping(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 4, P.concrete2);
  pc.hline(0, 15, 0, P.concrete3);
  pc.hline(0, 15, 3, P.concrete0);
  if (left) pc.rect(0, 0, 1, 4, P.concrete0);
  if (right) pc.rect(15, 0, 1, 4, P.concrete0);
}

/** A steel grating catwalk (one-way). */
function grating(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 4, P.concrete2);
  pc.hline(0, 15, 0, P.concrete3);
  for (let x = 1; x < 16; x += 3) pc.rect(x, 1, 2, 2, P.concrete0);
  pc.hline(0, 15, 4, P.concrete1);
  // Truss underneath.
  for (let x = 0; x < 16; x += 8) pc.line(x, 5, x + 4, 8, P.concrete1).line(x + 4, 8, x + 8, 5, P.concrete1);
  if (left) pc.rect(0, 0, 3, 3, P.hazard);
  if (right) pc.rect(13, 0, 3, 3, P.hazard);
}

export function drawCityTile(pc: PixelCanvas, frame: number): void {
  const F = FRAME;
  const seed = frame * 61 + 9;
  switch (frame) {
    case F.GRASS_TOP:
    case F.GRASS_TOP_VAR:
    case F.GRASS_TOP_L:
    case F.GRASS_TOP_R:
    case F.GRASS_TOP_S:
      concreteBase(pc, seed);
      concreteTop(pc, frame === F.GRASS_TOP_L || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_R || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_VAR);
      return;
    case F.DIRT:
    case F.DIRT_VAR:
      concreteBase(pc, seed);
      return;
    case F.DIRT_DEEP:
      concreteBase(pc, seed, true);
      return;
    case F.DIRT_L:
      concreteBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.concrete0);
      return;
    case F.DIRT_R:
      concreteBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.concrete0);
      return;
    case F.DIRT_BOTTOM:
      concreteBase(pc, seed);
      pc.rect(0, 13, 16, 3, P.concrete0);
      return;
    case F.ROCK:
    case F.ROCK_VAR:
      brickBase(pc, seed, frame === F.ROCK_VAR);
      return;
    case F.ROCK_TOP:
    case F.ROCK_TOP_L:
    case F.ROCK_TOP_R:
    case F.ROCK_TOP_S:
      brickBase(pc, seed);
      coping(pc, frame === F.ROCK_TOP_L || frame === F.ROCK_TOP_S, frame === F.ROCK_TOP_R || frame === F.ROCK_TOP_S);
      return;
    case F.ROCK_L:
      brickBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.brick0);
      return;
    case F.ROCK_R:
      brickBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.brick0);
      return;
    case F.ROCK_BOTTOM:
      brickBase(pc, seed);
      pc.rect(0, 12, 16, 4, P.concrete0);
      pc.hline(0, 15, 12, P.concrete1);
      return;
    case F.PLATFORM_L:
      grating(pc, true, false);
      return;
    case F.PLATFORM_M:
      grating(pc, false, false);
      return;
    case F.PLATFORM_R:
      grating(pc, false, true);
      return;
    case F.PLATFORM_S:
      grating(pc, true, true);
      return;
    default:
      return;
  }
}

// ---------------------------------------------------------------- Backdrop

/** Dusk over downtown: violet overhead, magenta, an orange glow at the horizon. 8x360. */
export function drawDuskSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, 8, 360, [
    [0, 0x0e0a24],
    [0.35, P.duskTop],
    [0.65, P.duskMid],
    [0.88, 0xd8606a],
    [1, P.duskLow],
  ]);
}

/** Far skyline: violet silhouettes, a few lit windows, blinking antennas. 384x140. */
export function drawSkylineFar(pc: PixelCanvas): void {
  const rnd = seeded(91);
  const { width: w, height: h } = pc;
  let x = 0;
  while (x < w) {
    const bw = 14 + Math.floor(rnd() * 26);
    const bh = 40 + Math.floor(rnd() * 90);
    pc.rect(x, h - bh, bw, bh, 0x2e1c44);
    pc.hline(x, x + bw - 1, h - bh, 0x40285a);
    for (let wy = h - bh + 6; wy < h - 4; wy += 6) for (let wx = x + 2; wx < x + bw - 2; wx += 4) if (rnd() < 0.12) pc.rect(wx, wy, 2, 2, rnd() < 0.8 ? 0xffc890 : 0xff8ac8);
    if (rnd() < 0.35) {
      pc.vline(x + Math.floor(bw / 2), h - bh - 10, h - bh, 0x40285a);
      pc.px(x + Math.floor(bw / 2), h - bh - 11, P.enemy);
    }
    x += bw + Math.floor(rnd() * 3);
  }
}

/** Near rooftops: water towers, a fire escape, a lit billboard. 384x170. */
export function drawSkylineNear(pc: PixelCanvas): void {
  const rnd = seeded(57);
  const { width: w, height: h } = pc;
  let x = 0;
  while (x < w) {
    const bw = 30 + Math.floor(rnd() * 40);
    const bh = 40 + Math.floor(rnd() * 70);
    pc.rect(x, h - bh, bw, bh, 0x1a1028);
    pc.rect(x, h - bh, bw, 2, 0x2a1a3a);
    for (let wy = h - bh + 8; wy < h - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 4; wx += 7) if (rnd() < 0.2) pc.rect(wx, wy, 3, 4, rnd() < 0.75 ? 0xffd890 : 0x8ac8ff);
    x += bw + 2;
  }
  // A water tower on stilts.
  pc.rect(60, 30, 24, 18, 0x22142e);
  pc.poly([[58, 30], [72, 22], [86, 30]], 0x22142e);
  for (const lx of [62, 82]) pc.line(lx, 48, lx, 76, 0x22142e);
  pc.line(62, 60, 82, 70, 0x22142e).line(82, 60, 62, 70, 0x22142e);
  // A billboard glowing pink and blue.
  pc.rect(230, 40, 64, 30, 0x22142e);
  pc.rect(232, 42, 60, 26, 0x3a1a4a);
  pc.rect(236, 46, 24, 6, P.neonPink).rect(236, 56, 40, 4, P.neonBlue);
  pc.circle(278, 52, 6, P.gold);
  for (const lx of [240, 284]) pc.vline(lx, 70, 90, 0x22142e);
}

/** Inside the GAME ZONE: deep purple walls, neon zigzag bands, stars, framed game posters. 128x192. */
export function drawArcadeWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  const rnd = seeded(23);
  pc.rect(0, 0, w, h, P.arcadeWall);
  for (let i = 0; i < 40; i++) pc.px(Math.floor(rnd() * w), Math.floor(rnd() * 120), rnd() < 0.5 ? 0x3a2a5a : 0x5a3a7a);
  // Neon zigzag bands.
  for (const [y, c] of [[30, P.neonPink], [44, P.neonBlue]] as const) {
    for (let x = 0; x < w; x += 8) pc.line(x, y, x + 4, y - 4, c).line(x + 4, y - 4, x + 8, y, c);
  }
  // Framed posters.
  for (const [px, c] of [[16, P.neonPink], [80, P.gold]] as const) {
    pc.rect(px, 66, 32, 44, 0x2a1a3a);
    pc.rect(px + 2, 68, 28, 40, 0x1a0e2a);
    pc.circle(px + 16, 84, 8, c);
    pc.rect(px + 6, 98, 20, 3, P.white);
    pc.rect(px + 9, 103, 14, 2, c);
  }
  // Dado rail and a darker wainscot.
  pc.rect(0, 150, w, h - 150, 0x1a0e2e);
  pc.hline(0, w - 1, 150, P.neonPink);
  pc.hline(0, w - 1, 151, 0x5a2a5a);
  for (let x = 4; x < w; x += 16) pc.rect(x, 160, 8, 8, 0x241438);
}

/** The LASER LAIR: black walls under UV light, glowing grid lines and paint splatters. 128x192. */
export function drawLairWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  const rnd = seeded(5);
  pc.rect(0, 0, w, h, 0x0a0614);
  for (let x = 0; x < w; x += 32) pc.vline(x, 0, h - 1, 0x2a1a5a);
  for (let y = 8; y < h; y += 32) pc.hline(0, w - 1, y, 0x2a1a5a);
  for (let i = 0; i < 18; i++) {
    const c = [P.neonPink, P.omnitrix, P.neonBlue, P.gold][Math.floor(rnd() * 4)];
    const sx = Math.floor(rnd() * w);
    const sy = 20 + Math.floor(rnd() * 140);
    pc.circle(sx, sy, 1 + Math.floor(rnd() * 2), c);
    for (let k = 0; k < 3; k++) pc.px(sx + Math.floor((rnd() - 0.5) * 10), sy + Math.floor((rnd() - 0.5) * 10), c);
  }
  pc.rect(0, 156, w, h - 156, 0x120a24);
  pc.hline(0, w - 1, 156, P.laserUv);
}

/** Rosewood Station: cream tiles, a green band with the station's stripe, grime. 128x192. */
export function drawSubwayWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  const rnd = seeded(13);
  pc.rect(0, 0, w, h, 0x8a8e84);
  for (let y = 0; y < h; y += 5) for (let x = (y / 5) % 2 === 0 ? 0 : 5; x < w; x += 10) pc.rect(x, y, 9, 4, rnd() < 0.08 ? 0xb8bcae : P.subwayTile);
  // The band.
  pc.rect(0, 112, w, 14, P.subwayBand);
  pc.hline(0, w - 1, 112, 0x46b07a);
  pc.hline(0, w - 1, 125, 0x1a5a3a);
  // Grime streaks and the ceiling's shadow.
  for (let i = 0; i < 10; i++) {
    const gx = Math.floor(rnd() * w);
    pc.rect(gx, 0, 2, 20 + Math.floor(rnd() * 60), 0x5a5e54, 0.35);
  }
  pc.verticalGradient(0, 0, w, 30, [
    [0, 0x2a2c28, 0.9],
    [1, 0x2a2c28, 0],
  ]);
  pc.rect(0, 170, w, h - 170, 0x4a4e44);
}

/** The service tunnels: concrete ribs, cable runs, a caged lamp. 128x192. */
export function drawTunnelWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  const rnd = seeded(31);
  pc.rect(0, 0, w, h, 0x1a1c24);
  for (let i = 0; i < 60; i++) pc.px(Math.floor(rnd() * w), Math.floor(rnd() * h), 0x24262e);
  for (let x = 0; x < w; x += 32) {
    pc.rect(x, 0, 6, h, 0x24262f);
    pc.vline(x + 6, 0, h - 1, 0x121318);
  }
  for (const [y, c] of [[70, 0x3a2a1e], [76, 0x1e2a3a], [82, 0x3a1e1e]] as const) {
    pc.rect(0, y, w, 3, c);
    for (let x = 10; x < w; x += 32) pc.rect(x, y - 1, 3, 5, 0x0e0f14);
  }
  pc.rect(0, 160, w, h - 160, 0x14151c);
}

/** The substation: riveted grey panels, conduits, a hazard band at the floor. 128x192. */
export function drawSubstationWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  pc.rect(0, 0, w, h, 0x2a2e38);
  for (let x = 0; x < w; x += 32) {
    for (let y = 0; y < 150; y += 40) {
      pc.rect(x + 1, y + 1, 30, 38, P.substation);
      pc.hline(x + 1, x + 30, y + 1, 0x4a4e5a);
      for (const [rx, ry] of [[3, 3], [28, 3], [3, 36], [28, 36]] as const) pc.px(x + rx, y + ry, 0x5a5e6a);
    }
  }
  pc.rect(0, 52, w, 4, 0x1a1c22).rect(0, 58, w, 2, 0x5a3a1e);
  for (let x = 20; x < w; x += 48) pc.rect(x, 50, 6, 12, 0x1a1c22);
  pc.rect(0, 160, w, h - 160, 0x1e2028);
  for (let x = -6; x < w; x += 12) pc.poly([[x, 172], [x + 6, 160], [x + 12, 160], [x + 6, 172]], P.hazard);
  pc.hline(0, w - 1, 159, 0x4a4e5a);
}

// ---------------------------------------------------------------- Decor: Main Street

/** A shuttered shop under a striped awning. Frame picks the awning colour. 96x72. */
export function drawStorefront(pc: PixelCanvas, frame: number): void {
  const awning = [0xd8323e, 0x2a8a5a, 0x3a6ad8][frame % 3];
  pc.rect(0, 10, 96, 62, P.brick1);
  for (let y = 12; y < 70; y += 4) for (let x = (y % 8 === 0 ? 0 : 4); x < 96; x += 8) pc.rect(x, y, 7, 3, P.brick2);
  pc.rect(6, 0, 84, 12, 0x1a1018);
  pc.rect(10, 3, 76, 6, [0xffd890, 0xc8ffd8, 0xc8d8ff][frame % 3]);
  pc.rect(12, 4, 72, 4, 0x2a1a20);
  for (let x = 16; x < 80; x += 9) pc.rect(x, 5, 5, 2, [0xffd890, 0xc8ffd8, 0xc8d8ff][frame % 3]);
  for (let x = 0; x < 96; x += 12) pc.poly([[x, 22], [x + 6, 22], [x + 6, 30], [x + 3, 32], [x, 30]], awning);
  for (let x = 6; x < 96; x += 12) pc.poly([[x, 22], [x + 6, 22], [x + 6, 30], [x + 3, 32], [x, 30]], P.cream);
  pc.rect(0, 20, 96, 3, 0x1a1018);
  pc.rect(8, 36, 50, 36, 0x0e0a14);
  pc.rect(10, 38, 46, 30, 0x2a3a5a);
  for (let y = 38; y < 68; y += 3) pc.hline(10, 55, y, 0x22304a);
  pc.rect(64, 36, 22, 36, 0x3a2418);
  pc.rect(66, 38, 18, 14, 0xffd890);
  pc.px(80, 56, P.gold);
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

export function drawStreetLamp(pc: PixelCanvas): void {
  pc.rect(6, 10, 2, 54, 0x2a2a34);
  pc.rect(4, 60, 6, 4, 0x1a1a22);
  pc.line(7, 10, 12, 4, 0x2a2a34, 2);
  pc.rect(9, 2, 5, 3, 0x2a2a34);
  pc.rect(10, 5, 3, 2, 0xffe7a0);
  pc.outline(P.ink);
}

/** A wooden power pole with a crossbar, insulators and a transformer can. 20x120. */
export function drawPowerPole(pc: PixelCanvas): void {
  pc.rect(8, 0, 4, 120, 0x4a3022);
  pc.vline(9, 0, 119, 0x5a3a2a);
  pc.rect(0, 10, 20, 3, 0x4a3022);
  for (const x of [1, 9, 17]) pc.rect(x, 7, 2, 3, 0x8ad8ff);
  pc.rect(12, 26, 7, 12, 0x5a5e6a);
  pc.hline(12, 18, 27, 0x7a7f92);
  pc.outline(P.ink);
}

export function drawNewsstand(pc: PixelCanvas): void {
  pc.rect(2, 6, 28, 24, 0x2a5a3a);
  pc.rect(0, 2, 32, 6, 0x1a3a26);
  pc.rect(5, 10, 22, 12, 0xd8dcce);
  for (let y = 11; y < 21; y += 3) pc.hline(6, 25, y, 0x5a5e5a);
  pc.rect(7, 12, 8, 4, P.enemy);
  pc.outline(P.ink);
}

export function drawHydrant(pc: PixelCanvas): void {
  pc.rect(2, 3, 6, 9, 0xd8323e);
  pc.rect(1, 2, 8, 2, 0xa8202a);
  pc.rect(0, 6, 10, 2, 0xa8202a);
  pc.rect(3, 0, 4, 2, 0xa8202a);
  pc.rect(1, 12, 8, 1, P.ink);
  pc.outline(P.ink);
}

export function drawTrashCan(pc: PixelCanvas): void {
  pc.rect(1, 3, 10, 13, 0x3a4a3a);
  for (let x = 2; x < 11; x += 3) pc.vline(x, 4, 15, 0x2a3a2a);
  pc.rect(0, 1, 12, 3, 0x4a5a4a);
  pc.outline(P.ink);
}

/** A neon sign in a window: frame 0 OPEN, 1 PIZZA, 2 a joystick. 48x20. */
export function drawNeonSign(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 0, 48, 20, 0x14081c);
  const c = [P.neonPink, P.gold, P.neonBlue][frame % 3];
  if (frame % 3 === 2) {
    pc.rect(18, 12, 12, 4, c);
    pc.line(24, 12, 28, 4, c, 2);
    pc.circle(28, 4, 2, P.enemy);
  } else {
    letteringCentred(pc, 24, 7, frame % 3 === 0 ? 'OPEN' : 'PIZZA', c);
    pc.rect(3, 3, 42, 1, c, 0.5).rect(3, 16, 42, 1, c, 0.5);
  }
  pc.outline(0x3a1a4a);
}

// ---------------------------------------------------------------- Decor: the GAME ZONE

/** The prize counter: a glass case of plush toys under shelves of prizes. 96x34. */
export function drawPrizeCounter(pc: PixelCanvas): void {
  pc.rect(0, 6, 96, 28, 0x3a2a4a);
  pc.rect(2, 8, 92, 16, 0x6a8ab8);
  pc.rect(3, 9, 90, 14, 0x2a3a5a);
  const toys = [P.neonPink, P.gold, P.omnitrix, P.neonBlue, 0xd8323e, P.kevin];
  for (let i = 0; i < 9; i++) pc.circle(9 + i * 10, 17, 3, toys[i % toys.length]);
  pc.rect(0, 0, 96, 6, 0x5a3a6a);
  pc.hline(0, 95, 0, P.neonPink);
  pc.rect(0, 26, 96, 8, 0x2a1a3a);
  pc.outline(P.ink);
}

export function drawTicketMachine(pc: PixelCanvas): void {
  pc.rect(2, 4, 12, 30, 0x5a2a6a);
  pc.rect(4, 8, 8, 6, 0x1a0e24);
  pc.rect(5, 9, 6, 2, P.gold);
  pc.rect(6, 18, 4, 2, P.ink);
  // A ribbon of tickets spilling out.
  for (let i = 0; i < 6; i++) pc.rect(7 + (i % 2), 20 + i * 2, 3, 2, i % 2 ? 0xffd890 : 0xff9a5a);
  pc.rect(0, 0, 16, 5, P.neonBlue);
  pc.outline(P.ink);
}

/** A double claw machine, one Sumo Slammers card glinting under the prizes on the left. 64x56. */
export function drawClawMachine(pc: PixelCanvas): void {
  const toys = [P.neonPink, P.gold, P.omnitrix, 0xd8323e, P.neonBlue];
  for (const [bx, top] of [[0, 0], [32, 4]] as const) {
    pc.rect(bx + 1, top, 30, 8, 0x3a6ad8);
    pc.rect(bx + 3, top + 2, 26, 4, P.neonBlue);
    pc.rect(bx + 1, top + 8, 30, 22 - top, 0x9ab8d8);
    pc.rect(bx + 3, top + 10, 26, 18 - top, 0x1a2a4a);
    pc.vline(bx + 16, top + 10, top + 15, P.concrete3);
    pc.line(bx + 13, top + 17, bx + 16, top + 15, P.concrete3).line(bx + 19, top + 17, bx + 16, top + 15, P.concrete3);
    for (let i = 0; i < 7; i++) pc.circle(bx + 6 + i * 3.6, 26 - (i % 2) * 2, 3, toys[(i + bx) % toys.length]);
  }
  letteringCentred(pc, 16, 2, 'CLAW', P.white);
  letteringCentred(pc, 48, 6, 'WIN!', P.gold);
  // The card, half buried in prizes.
  pc.rect(14, 22, 5, 6, P.gold);
  pc.rect(15, 23, 3, 4, P.white);
  // The cabinet base (it hides the pedestal it stands on).
  pc.rect(0, 30, 64, 26, 0x2a4a8a);
  pc.rect(0, 30, 64, 2, 0x3a6ad8);
  for (const bx of [8, 40]) {
    pc.rect(bx, 35, 14, 4, P.ink);
    pc.circle(bx + 3, 45, 2, P.enemy);
    pc.rect(bx + 8, 43, 4, 6, P.concrete1);
  }
  pc.rect(28, 40, 8, 12, 0x1a2a5a);
  pc.outline(P.ink);
}

export function drawSkeeBall(pc: PixelCanvas): void {
  pc.poly([[0, 34], [0, 26], [36, 14], [48, 14], [48, 34]], 0x5a3a2a);
  pc.poly([[2, 32], [2, 27], [36, 16], [46, 16], [46, 32]], 0x8a5a3a);
  pc.rect(38, 0, 10, 16, 0x3a2a4a);
  for (const [cx, cy, r, c] of [[43, 5, 3, P.neonPink], [43, 11, 2, P.gold]] as const) pc.circle(cx, cy, r, c);
  for (let i = 0; i < 3; i++) pc.circle(6 + i * 6, 29, 2, 0xd8d8e0);
  pc.outline(P.ink);
}

/** The TOKEN TOONS' stage backdrop: velvet curtains, speakers, a painted sign. 144x80. */
export function drawBandStage(pc: PixelCanvas): void {
  pc.rect(0, 0, 144, 80, 0x2a0e1a);
  for (let x = 0; x < 144; x += 6) pc.rect(x, 6, 4, 74, x % 12 === 0 ? 0x8a1a2e : 0x6a1022);
  pc.rect(0, 0, 144, 8, 0x5a0e1a);
  for (let x = 0; x < 144; x += 12) pc.poly([[x, 8], [x + 12, 8], [x + 6, 14]], 0x8a1a2e);
  pc.rect(40, 16, 64, 14, 0x1a0a12);
  pc.rect(42, 18, 60, 10, P.gold);
  pc.rect(46, 20, 52, 6, 0x2a0e1a);
  for (let i = 0; i < 6; i++) pc.rect(49 + i * 8, 21, 5, 4, P.gold);
  for (const sx of [4, 124]) {
    pc.rect(sx, 44, 16, 36, 0x14080e);
    pc.circle(sx + 8, 54, 5, 0x2a1a24);
    pc.circle(sx + 8, 69, 6, 0x2a1a24);
    pc.circle(sx + 8, 69, 2, 0x5a4a54);
  }
}

/** The breaker box Kevin juices: frame 0 normal, 1 overloaded (sparks, warning lamp). 24x32. */
export function drawBreakerBox(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 0, 24, 32, 0x5a5e6a);
  pc.rect(2, 2, 20, 28, 0x3a3e48);
  for (let y = 6; y < 26; y += 5) {
    pc.rect(5, y, 6, 3, P.concrete0).rect(13, y, 6, 3, P.concrete0);
    pc.rect(frame ? 9 : 5, y + 1, 2, 1, P.white).rect(frame ? 17 : 13, y + 1, 2, 1, P.white);
  }
  pc.rect(9, 0, 6, 2, frame ? P.enemy : P.omnitrix);
  for (let x = 2; x < 24; x += 5) pc.px(x, 30, P.hazard);
  if (frame) pc.line(20, 4, 23, 0, P.kevin).line(1, 20, 0, 24, P.kevin);
  pc.outline(P.ink);
}

/** Game posters: three designs (frame). 22x30. */
export function drawPoster(pc: PixelCanvas, frame: number): void {
  const bg = [0x2a1a5a, 0x5a1a2a, 0x1a4a3a][frame % 3];
  pc.rect(0, 0, 22, 30, bg);
  pc.rect(1, 1, 20, 28, 0x0a0614);
  if (frame % 3 === 0) {
    // SUMO SLAMMERS.
    pc.circle(11, 13, 6, 0xf2c29b);
    pc.rect(5, 17, 12, 3, P.enemy);
    pc.rect(3, 23, 16, 3, P.gold);
  } else if (frame % 3 === 1) {
    // A rocket game.
    pc.poly([[11, 4], [15, 16], [7, 16]], P.white);
    pc.rect(9, 16, 4, 4, P.fire2);
    pc.rect(3, 23, 16, 3, P.neonPink);
  } else {
    // A maze game.
    for (let y = 4; y < 20; y += 4) pc.hline(3, 18, y, P.neonBlue);
    pc.circle(8, 10, 2, P.gold);
    pc.rect(3, 23, 16, 3, P.omnitrix);
  }
  pc.outline(P.ink);
}

/** A laser tag barrier: plywood with neon edges, the arena's number painted on. 32x32. */
export function drawLaserBarrier(pc: PixelCanvas, frame: number): void {
  const c = frame % 2 === 0 ? P.neonPink : P.omnitrix;
  pc.rect(0, 0, 32, 32, 0x1a1028);
  pc.rect(2, 2, 28, 28, 0x24163a);
  pc.rect(0, 0, 32, 2, c).rect(0, 0, 2, 32, c).rect(30, 0, 2, 32, c);
  for (let i = 0; i < 4; i++) pc.line(4 + i * 7, 28, 10 + i * 7, 6, 0x2e1c48);
  pc.rect(10, 10, 12, 10, c);
  pc.rect(12, 12, 8, 6, 0x24163a);
}

/** A UV tube on the ceiling. 16x8. */
export function drawUvLight(pc: PixelCanvas): void {
  pc.rect(0, 0, 16, 3, P.concrete1);
  pc.rect(1, 3, 14, 3, P.laserUv);
  pc.hline(2, 13, 4, 0xd8c8ff);
}

// ---------------------------------------------------------------- Decor: the subway and substation

/** ROSEWOOD on the station wall. 96x18. */
export function drawStationSign(pc: PixelCanvas): void {
  pc.rect(0, 0, 96, 18, 0x14141a);
  pc.rect(2, 2, 92, 14, P.subwayBand);
  letteringCentred(pc, 48, 6, 'ROSEWOOD', 0x14141a);
  letteringCentred(pc, 48, 5, 'ROSEWOOD', P.white);
  pc.rect(6, 6, 4, 4, P.white).rect(86, 6, 4, 4, P.white);
  lettering(pc, 7, 7, '1', P.subwayBand);
  lettering(pc, 87, 7, '1', P.subwayBand);
  pc.outline(P.ink);
}

/** The line map: Line 11 crossed out in red. 48x32. */
export function drawSubwayMap(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 32, 0x1a1a22);
  pc.rect(2, 2, 44, 28, P.cream);
  pc.line(6, 24, 22, 10, P.subwayBand, 2).line(22, 10, 42, 10, P.subwayBand, 2);
  pc.line(6, 8, 42, 26, 0x3a6ad8, 2);
  for (const [x, y] of [[6, 24], [22, 10], [42, 10], [24, 17]] as const) pc.circle(x, y, 2, P.white);
  pc.line(30, 20, 40, 28, P.enemy, 2).line(40, 20, 30, 28, P.enemy, 2);
  pc.outline(P.ink);
}

/** A tiled station pillar. 16x96. */
export function drawPillar(pc: PixelCanvas): void {
  pc.rect(2, 0, 12, 96, 0xb8bcae);
  for (let y = 0; y < 96; y += 5) pc.hline(2, 13, y, 0x8a8e84);
  pc.rect(2, 60, 12, 6, P.subwayBand);
  pc.rect(0, 0, 16, 6, P.concrete2).rect(0, 90, 16, 6, P.concrete2);
  pc.outline(P.ink);
}

export function drawTurnstile(pc: PixelCanvas): void {
  pc.rect(0, 6, 8, 20, P.concrete2);
  pc.rect(16, 6, 8, 20, P.concrete2);
  pc.rect(1, 8, 6, 3, P.omnitrix);
  pc.line(8, 14, 16, 12, P.concrete3, 2).line(8, 14, 14, 20, P.concrete3, 2);
  pc.outline(P.ink);
}

/** A caged work lamp. 10x10. */
export function drawTunnelLight(pc: PixelCanvas): void {
  pc.rect(3, 0, 4, 2, P.concrete1);
  pc.circle(5, 5, 3, P.workLight);
  pc.vline(3, 2, 8, P.concrete0).vline(7, 2, 8, P.concrete0).hline(2, 8, 5, P.concrete0);
}

/** Cables sagging between hangers. 64x20. */
export function drawCables(pc: PixelCanvas): void {
  for (const [c, sag, off] of [[0x1a1a22, 10, 0], [0x3a2a1e, 14, 2], [0x1e2a3a, 8, 4]] as const) {
    for (let x = 0; x < 64; x++) {
      const t = x / 63;
      pc.px(x, off + Math.round(Math.sin(t * Math.PI) * sag), c);
    }
  }
  pc.rect(0, 0, 3, 4, P.concrete1).rect(61, 0, 3, 4, P.concrete1);
}

/** A big transformer with cooling fins. 40x48. */
export function drawTransformer(pc: PixelCanvas): void {
  pc.rect(4, 10, 32, 38, 0x4a5a4a);
  for (let x = 6; x < 34; x += 4) pc.rect(x, 14, 2, 30, 0x3a4a3a);
  pc.rect(2, 6, 36, 6, 0x5a6a5a);
  for (const x of [10, 20, 30]) {
    pc.rect(x - 2, 0, 4, 6, 0x8ad8ff);
    pc.hline(x - 2, x + 1, 2, 0x5a8aa8);
  }
  pc.rect(14, 26, 12, 10, P.hazard);
  pc.line(17, 28, 21, 34, P.ink).line(21, 28, 17, 34, P.ink);
  pc.outline(P.ink);
}

export function drawGenerator(pc: PixelCanvas): void {
  pc.rect(0, 12, 56, 32, 0x3a3e48);
  pc.rect(2, 14, 52, 6, 0x4a4e5a);
  pc.circle(16, 30, 9, 0x24262e);
  pc.circle(16, 30, 6, 0x5a5e6a);
  pc.circle(16, 30, 2, P.hazard);
  for (let y = 24; y < 40; y += 3) pc.hline(30, 50, y, 0x24262e);
  pc.rect(40, 0, 6, 12, 0x24262e);
  pc.rect(32, 16, 6, 3, P.omnitrix);
  pc.outline(P.ink);
}

/** DANGER: HIGH VOLTAGE. 18x18. */
export function drawWarningSign(pc: PixelCanvas): void {
  pc.poly([[9, 0], [18, 17], [0, 17]], P.hazard);
  pc.poly([[10, 5], [7, 11], [10, 11], [8, 15], [12, 9], [9, 9]], P.ink);
  pc.outline(P.ink);
}

/** A security laser emitter post: the red beam itself is drawn by the level's light. 20x48. */
export function drawSecurityLaser(pc: PixelCanvas): void {
  pc.rect(6, 0, 8, 48, P.concrete1);
  pc.rect(4, 0, 12, 4, P.concrete2).rect(4, 44, 12, 4, P.concrete2);
  for (const y of [12, 24, 36]) {
    pc.rect(13, y, 4, 4, P.enemy);
    pc.px(15, y + 1, P.white);
  }
  pc.rect(8, 6, 4, 2, P.enemy);
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

/** A catwalk railing. 32x10. */
export function drawCatwalkRail(pc: PixelCanvas): void {
  pc.hline(0, 31, 0, P.hazard);
  pc.hline(0, 31, 1, 0x8a6a1e);
  for (let x = 0; x < 32; x += 8) pc.rect(x, 0, 2, 10, P.concrete2);
  pc.hline(0, 31, 5, P.concrete2);
}

/** Rails and sleepers laid along a track bed. 32x8. */
export function drawRails(pc: PixelCanvas): void {
  for (let x = 1; x < 32; x += 8) pc.rect(x, 3, 5, 5, 0x3a2a1e);
  pc.rect(0, 1, 32, 2, P.concrete3);
  pc.hline(0, 31, 3, P.concrete1);
}

/**
 * A tesla coil in the substation hall: a ribbed column on an insulated base,
 * a copper torus on top. Frame 0 idle, 1 charged (rings lit). 28x80.
 */
export function drawTeslaCoil(pc: PixelCanvas, frame: number): void {
  const lit = frame === 1;
  // Base: a squat concrete plinth with hazard stripes.
  pc.rect(2, 68, 24, 12, 0x3a3e48);
  for (let x = 2; x < 26; x += 6) pc.poly([[x, 80], [x + 3, 80], [x + 6, 74], [x + 3, 74]], P.hazard);
  pc.rect(2, 66, 24, 3, 0x5a5e6a);
  // Ceramic insulator stack.
  for (let y = 54; y < 66; y += 3) pc.rect(8, y, 12, 2, 0xd8d0c0).hline(8, 19, y + 2, 0x8a8478);
  // The copper winding column.
  pc.rect(10, 18, 8, 36, 0x8a4a22);
  for (let y = 19; y < 54; y += 2) pc.hline(10, 17, y, lit ? 0xffc890 : 0xc87a3a);
  pc.vline(11, 18, 53, lit ? 0xffe0b0 : 0xd89a5a);
  // The torus on top.
  pc.ellipse(14, 12, 13, 6, 0x6a6e7a);
  pc.ellipse(14, 11, 11, 4, lit ? P.kevin : 0x9aa0ae);
  pc.ellipse(14, 10, 6, 2, lit ? P.white : 0xc8ccd6);
  pc.rect(13, 2, 2, 6, 0x9aa0ae);
  pc.circle(14, 2, 2, lit ? P.white : 0xc8ccd6);
  if (lit) for (const [x, y] of [[2, 6], [25, 8], [4, 16], [24, 18]] as const) pc.px(x, y, P.kevin);
  pc.outline(P.ink);
}
