import { PALETTE as P, lerpColor } from '../../config/palette';
import { FRAME } from '../../levels/tiles';
import { seeded, type PixelCanvas } from './PixelCanvas';

/**
 * Road Trip art: a desert highway at golden hour. Sandstone mesas, sand,
 * cacti, the roadside stops of a long American summer drive.
 */

// ---------------------------------------------------------------- Tileset

function sandBase(pc: PixelCanvas, seed: number, deep = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 16, deep ? P.sand0 : P.sand1);
  // Soft horizontal layering, like wind-packed sand.
  for (let y = 2; y < 16; y += 5) {
    const off = Math.floor(rnd() * 6);
    pc.rect(off, y, 6 + Math.floor(rnd() * 6), 1, deep ? 0x5e3726 : 0x94582f);
  }
  for (let i = 0; i < (deep ? 6 : 10); i++) {
    pc.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? P.sand2 : P.sand0);
  }
  if (!deep && rnd() < 0.6) {
    const x = 2 + Math.floor(rnd() * 11);
    const y = 4 + Math.floor(rnd() * 9);
    pc.rect(x, y, 2, 2, P.mesa1).px(x, y, P.mesa2);
  }
}

function mesaBase(pc: PixelCanvas, seed: number, variant = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 16, P.mesa1);
  // Strata: the striped layers that make a mesa read as a mesa.
  const bands = [3 + Math.floor(rnd() * 2), 8 + Math.floor(rnd() * 2), 13];
  for (const b of bands) {
    pc.rect(0, b, 16, 1, P.mesa0);
    pc.rect(0, b - 1, 16, 1, lerpColor(P.mesa1, P.mesa2, 0.5));
  }
  pc.line(Math.floor(rnd() * 16), 0, Math.floor(rnd() * 16), 16, lerpColor(P.mesa0, P.mesa1, 0.5));
  for (let i = 0; i < 6; i++) pc.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? P.mesa2 : P.mesa0);
  if (variant) pc.rect(5, 5, 4, 2, P.mesa3, 0.6).px(6, 5, P.sand3);
}

function sandTop(pc: PixelCanvas, seed: number, left: boolean, right: boolean, variant = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 4, P.sand2);
  pc.rect(0, 0, 16, 1, P.sand3);
  for (let x = 0; x < 16; x++) {
    if (rnd() > 0.5) pc.px(x, 4, P.sand2);
    if (rnd() > 0.8) pc.px(x, 1, 0xffe0a0);
  }
  if (variant) {
    // A little desert scrub on the lip.
    pc.px(4, 0, 0x6e8a3a).px(5, 0, 0x6e8a3a).px(4, 1, 0x4e6a2a).px(11, 1, 0x8a5a9a);
  }
  if (left) pc.rect(0, 0, 2, 16, P.sand0).rect(0, 0, 3, 3, P.sand2);
  if (right) pc.rect(14, 0, 2, 16, P.sand0).rect(13, 0, 3, 3, P.sand2);
}

function mesaTop(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 3, P.mesa3);
  pc.rect(0, 0, 16, 1, 0xf0a070);
  pc.rect(0, 3, 16, 1, P.mesa0);
  if (left) pc.rect(0, 0, 2, 16, P.mesa0).rect(0, 0, 3, 2, P.mesa3);
  if (right) pc.rect(14, 0, 2, 16, P.mesa0).rect(13, 0, 3, 2, P.mesa3);
}

function boards(pc: PixelCanvas, left: boolean, right: boolean): void {
  // Sun-bleached scaffold boards on a steel lip.
  const wood = 0xb08a5a;
  pc.rect(0, 0, 16, 5, wood);
  pc.rect(0, 0, 16, 1, 0xe0c090);
  pc.rect(0, 4, 16, 1, 0x6a4a2a);
  pc.vline(7, 1, 3, 0x8a6a3a);
  pc.px(3, 2, 0x6a4a2a).px(12, 2, 0x6a4a2a);
  if (left) {
    pc.rect(0, 0, 1, 5, 0x6a4a2a);
    pc.rect(2, 5, 2, 4, P.metal1);
  }
  if (right) {
    pc.rect(15, 0, 1, 5, 0x6a4a2a);
    pc.rect(12, 5, 2, 4, P.metal1);
  }
}

/** Same frame layout as the forest tileset: sand where the forest has grass, sandstone where it has rock. */
export function drawDesertTile(pc: PixelCanvas, frame: number): void {
  const F = FRAME;
  const seed = frame * 131 + 7;
  switch (frame) {
    case F.GRASS_TOP:
    case F.GRASS_TOP_VAR:
    case F.GRASS_TOP_L:
    case F.GRASS_TOP_R:
    case F.GRASS_TOP_S:
      sandBase(pc, seed);
      sandTop(pc, seed, frame === F.GRASS_TOP_L || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_R || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_VAR);
      return;
    case F.DIRT:
    case F.DIRT_VAR:
      sandBase(pc, seed);
      return;
    case F.DIRT_DEEP:
      sandBase(pc, seed, true);
      return;
    case F.DIRT_L:
      sandBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.sand0);
      return;
    case F.DIRT_R:
      sandBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.sand0);
      return;
    case F.DIRT_BOTTOM:
      sandBase(pc, seed);
      pc.rect(0, 13, 16, 3, P.sand0);
      return;
    case F.ROCK:
    case F.ROCK_VAR:
      mesaBase(pc, seed, frame === F.ROCK_VAR);
      return;
    case F.ROCK_TOP:
    case F.ROCK_TOP_L:
    case F.ROCK_TOP_R:
    case F.ROCK_TOP_S:
      mesaBase(pc, seed);
      mesaTop(pc, frame === F.ROCK_TOP_L || frame === F.ROCK_TOP_S, frame === F.ROCK_TOP_R || frame === F.ROCK_TOP_S);
      return;
    case F.ROCK_L:
      mesaBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.mesa0);
      return;
    case F.ROCK_R:
      mesaBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.mesa0);
      return;
    case F.ROCK_BOTTOM:
      mesaBase(pc, seed);
      pc.rect(0, 14, 16, 2, P.mesa0);
      return;
    case F.PLATFORM_L:
      boards(pc, true, false);
      return;
    case F.PLATFORM_M:
      boards(pc, false, false);
      return;
    case F.PLATFORM_R:
      boards(pc, false, true);
      return;
    case F.PLATFORM_S:
      boards(pc, true, true);
      return;
  }
}

// ---------------------------------------------------------------- Road

/**
 * One 64 px stretch of two-lane highway seen from the side: the yellow edge
 * line, the asphalt, the white shoulder line, then gravel and packed sand
 * underneath. Tiles horizontally; the chase scrolls it.
 */
export function drawRoad(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  const rnd = seeded(91);
  pc.rect(0, 0, w, 3, P.asphalt2);
  pc.rect(0, 0, w, 1, 0x6a6a74);
  pc.rect(0, 3, w, 9, P.asphalt1);
  for (let i = 0; i < 40; i++) pc.px(Math.floor(rnd() * w), 3 + Math.floor(rnd() * 9), rnd() < 0.5 ? P.asphalt0 : P.asphalt2);
  // Dashed lane paint seen edge-on.
  pc.rect(4, 6, 22, 2, P.lineYellow);
  pc.rect(36, 6, 22, 2, P.lineYellow);
  pc.rect(0, 12, w, 2, P.asphalt0);
  // Gravel shoulder and sand.
  pc.rect(0, 14, w, 6, 0x5a4a44);
  for (let i = 0; i < 30; i++) pc.px(Math.floor(rnd() * w), 14 + Math.floor(rnd() * 6), rnd() < 0.5 ? 0x8a7a6a : 0x3a2e2a);
  pc.rect(0, 20, w, h - 20, P.sand1);
  for (let y = 24; y < h; y += 6) {
    const off = Math.floor(rnd() * 30);
    pc.rect(off, y, 14 + Math.floor(rnd() * 20), 1, 0x94582f);
  }
  for (let i = 0; i < 60; i++) pc.px(Math.floor(rnd() * w), 20 + Math.floor(rnd() * (h - 20)), rnd() < 0.5 ? P.sand2 : P.sand0);
}

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

// ---------------------------------------------------------------- Sky and backdrop

export function drawSunsetSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, P.sunsetTop],
    [0.38, 0x5a2a6e],
    [0.6, P.sunsetMid],
    [0.8, P.sunsetLow],
    [1, P.sunsetGlow],
  ]);
}

export function drawDuskSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, 0x0c0f2e],
    [0.45, 0x241c52],
    [0.75, 0x5a2a62],
    [0.92, 0x9c3f5e],
    [1, 0xd8604a],
  ]);
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

function silhouetteRidge(pc: PixelCanvas, seed: number, base: number, color: number, rim: number, mesas: number): void {
  const rnd = seeded(seed);
  const w = pc.width;
  const tops = new Array<number>(w).fill(pc.height);
  // Flat-topped mesas and narrow buttes, wrapped so the strip tiles seamlessly.
  for (let i = 0; i < mesas; i++) {
    const cx = Math.floor((i / mesas) * w + rnd() * (w / mesas) * 0.5);
    const half = 10 + Math.floor(rnd() * 34);
    const top = base - 14 - Math.floor(rnd() * (base * 0.55));
    const slope = 2 + Math.floor(rnd() * 5);
    for (let dx = -half - slope * 6; dx <= half + slope * 6; dx++) {
      const x = (cx + dx + w) % w;
      const over = Math.max(0, Math.abs(dx) - half);
      const y = top + Math.round(over * (6 / slope) * 0.6 + (over > 0 ? 2 : 0));
      tops[x] = Math.min(tops[x], y);
    }
  }
  for (let x = 0; x < w; x++) {
    const top = Math.min(tops[x], base + Math.round(Math.sin((x / w) * Math.PI * 6) * 3));
    pc.vline(x, top, pc.height - 1, color);
    pc.px(x, top, rim);
  }
}

export function drawFarMesas(pc: PixelCanvas): void {
  silhouetteRidge(pc, 404, pc.height * 0.75, lerpColor(P.mesa0, P.sunsetMid, 0.45), lerpColor(P.mesa2, P.sunsetGlow, 0.3), 5);
}

export function drawNearButtes(pc: PixelCanvas): void {
  silhouetteRidge(pc, 909, pc.height * 0.82, P.mesa0, P.mesa2, 3);
  // Saguaro silhouettes along the base.
  const rnd = seeded(77);
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(rnd() * pc.width);
    const h = 14 + Math.floor(rnd() * 16);
    const base = pc.height - 4;
    const c = 0x2a1424;
    pc.rect(x, base - h, 3, h, c);
    pc.rect(x - 4, base - h * 0.6, 4, 2, c).rect(x - 4, base - h * 0.85, 2, h * 0.25, c);
    pc.rect(x + 3, base - h * 0.45, 4, 2, c).rect(x + 5, base - h * 0.7, 2, h * 0.25, c);
  }
}

/** Telephone poles with sagging wires, one every 128 px. */
export function drawPoles(pc: PixelCanvas): void {
  const c = 0x170c18;
  const h = pc.height;
  for (const x of [20, 148]) {
    pc.rect(x, 10, 2, h - 10, c);
    pc.rect(x - 7, 14, 16, 2, c);
    pc.rect(x - 5, 22, 12, 1, c);
    pc.px(x - 7, 13, c).px(x + 8, 13, c).px(x - 5, 21, c).px(x + 6, 21, c);
  }
  // Wires sag between poles and wrap around the strip.
  for (const [y0, sag] of [[15, 9], [22, 7]] as const) {
    for (let x = 0; x < pc.width; x++) {
      const t = ((x - 21 + pc.width) % 128) / 128;
      pc.px(x, Math.round(y0 + Math.sin(t * Math.PI) * sag), c);
    }
  }
}

/** Near-foreground desert scrub that streaks past the bottom edge. */
export function drawScrub(pc: PixelCanvas): void {
  const rnd = seeded(505);
  const base = pc.height;
  const c = 0x120810;
  for (let x = 0; x < pc.width; x += 2) {
    const h = 2 + Math.floor(rnd() * 5) + (Math.sin(x * 0.07) + 1) * 2;
    pc.vline(x, base - h, base - 1, c);
  }
  for (let i = 0; i < 6; i++) {
    const cx = Math.floor(rnd() * pc.width);
    const size = 8 + Math.floor(rnd() * 10);
    for (let k = -3; k <= 3; k++) pc.line(cx, base, cx + k * size * 0.4, base - size + Math.abs(k) * 2, c, 1);
  }
}

// ---------------------------------------------------------------- Roadside props

export function drawCactus(pc: PixelCanvas): void {
  const g0 = 0x2e5a34;
  const g1 = 0x4a8a46;
  const g2 = 0x7ab85a;
  const h = pc.height;
  pc.rect(8, 4, 5, h - 4, g1);
  pc.rect(8, 4, 1, h - 4, g2);
  pc.rect(12, 4, 1, h - 4, g0);
  pc.ellipse(10, 4, 2, 2, g1);
  // Arms.
  pc.rect(2, 16, 6, 4, g1).rect(2, 8, 4, 10, g1).rect(2, 8, 1, 10, g2);
  pc.rect(13, 20, 5, 4, g1).rect(15, 12, 4, 11, g1).rect(15, 12, 1, 11, g2);
  for (let y = 7; y < h - 2; y += 4) pc.px(10, y, g0).px(9, y + 2, 0xd8e8b0);
  pc.px(10, 2, 0xff8fb8).px(11, 3, 0xffd27a);
  pc.outline(P.ink);
}

export function drawCactusSmall(pc: PixelCanvas): void {
  const g1 = 0x4a8a46;
  pc.ellipse(7, 9, 5, 4, g1);
  pc.ellipse(4, 5, 3, 3, 0x5a9a50);
  pc.ellipse(10, 4, 2, 3, 0x5a9a50);
  pc.px(4, 3, 0xff8fb8).px(10, 2, 0xffd27a);
  for (const [x, y] of [[5, 8], [9, 10], [7, 6]]) pc.px(x, y, 0xd8e8b0);
  pc.outline(P.ink);
}

/** A roadside diner: chrome trim, a lit window band and a red EAT sign on the roof. */
export function drawDiner(pc: PixelCanvas): void {
  const w = pc.width;
  const h = pc.height;
  const wall = 0xe8dcc0;
  // Roof sign (the body starts 26 px down, level with a platform row on the roof).
  pc.rect(w / 2 - 22, 0, 44, 16, P.ink);
  pc.rect(w / 2 - 20, 2, 40, 12, 0x7a1424);
  for (const [i, x] of [w / 2 - 15, w / 2 - 3, w / 2 + 9].entries()) {
    // E A T as chunky blocks.
    const c = P.neonPink;
    if (i === 0) pc.rect(x, 4, 2, 8, c).rect(x, 4, 6, 2, c).rect(x, 7, 5, 2, c).rect(x, 10, 6, 2, c);
    if (i === 1) pc.rect(x, 4, 6, 2, c).rect(x, 4, 2, 8, c).rect(x + 4, 4, 2, 8, c).rect(x, 7, 6, 2, c);
    if (i === 2) pc.rect(x, 4, 6, 2, c).rect(x + 2, 4, 2, 8, c);
  }
  pc.rect(w / 2 - 2, 16, 4, 10, P.metal1);
  // Body.
  pc.rect(2, 26, w - 4, h - 26, wall);
  pc.rect(2, 26, w - 4, 3, 0xc9b88a);
  pc.rect(0, 24, w, 3, P.metal2);
  pc.rect(2, 44, w - 4, 16, 0x2a3050);
  for (let x = 6; x < w - 8; x += 14) {
    pc.rect(x, 45, 12, 14, P.fire1);
    pc.rect(x + 1, 46, 10, 12, 0xffe7a0);
    pc.rect(x + 1, 46, 4, 12, 0xfff3c8);
  }
  pc.rect(2, 64, w - 4, 3, 0xc23a4a);
  pc.rect(2, 67, w - 4, 2, 0xe8e8f0);
  pc.rect(w - 28, 52, 16, h - 52, 0x6a7a90);
  pc.rect(w - 26, 54, 12, h - 56, 0x2a3050);
  pc.px(w - 16, 72, P.gold);
  // Awning over the door.
  pc.rect(w - 34, 44, 28, 4, 0xc23a4a);
  for (let x = w - 34; x < w - 6; x += 6) pc.rect(x, 44, 3, 4, P.cream);
  pc.outline(P.ink);
}

export function drawGasPump(pc: PixelCanvas): void {
  const red = 0xc23a3a;
  pc.rect(2, 4, 10, 20, red);
  pc.rect(2, 4, 10, 2, 0xe86060);
  pc.rect(4, 8, 6, 5, P.ink);
  pc.rect(5, 9, 4, 2, P.omnitrixGlow);
  pc.rect(4, 15, 6, 2, P.cream);
  pc.rect(0, 24, 14, 2, P.metal1);
  pc.rect(12, 10, 2, 8, P.ink);
  pc.rect(11, 18, 2, 3, P.metal2);
  pc.rect(4, 0, 6, 4, P.cream);
  pc.outline(P.ink);
}

/** Mr. Smoothy: a little kiosk with a giant smoothie cup on the roof. */
export function drawSmoothyStand(pc: PixelCanvas): void {
  const w = pc.width;
  const h = pc.height;
  // The giant cup.
  pc.poly([[14, 6], [34, 6], [31, 26], [17, 26]], 0xff8fc8);
  pc.poly([[14, 6], [34, 6], [33, 10], [15, 10]], 0xffffff);
  pc.ellipse(24, 6, 10, 3, 0xffd0e8);
  pc.ellipse(24, 4, 7, 3, 0xffb0d8);
  pc.rect(26, 0, 2, 6, 0x5fd8ff);
  pc.rect(19, 14, 10, 6, 0xc23a7a);
  pc.rect(21, 16, 6, 2, P.cream);
  // Kiosk.
  pc.rect(4, 28, w - 8, h - 28, 0xf0e8f8);
  pc.rect(2, 26, w - 4, 4, 0x5fd8ff);
  for (let x = 2; x < w - 2; x += 6) pc.rect(x, 26, 3, 4, 0xff8fc8);
  pc.rect(8, 34, w - 16, 10, 0x2a3050);
  pc.rect(9, 35, w - 18, 8, P.fire1);
  pc.rect(10, 36, w - 20, 6, 0xffe7a0);
  pc.rect(6, 44, w - 12, 3, 0xd8c8e8);
  pc.outline(P.ink);
}

/** Two billboards: frame 0 the World's Largest Ball of Yarn (Grandpa Max's dream), frame 1 Mr. Smoothy. */
export function drawBillboard(pc: PixelCanvas, frame: number): void {
  const w = pc.width;
  const h = pc.height;
  pc.rect(16, 30, 3, h - 30, 0x5a3a24).rect(w - 19, 30, 3, h - 30, 0x5a3a24);
  pc.rect(12, 40, w - 24, 2, 0x5a3a24);
  pc.rect(0, 0, w, 32, P.cream);
  pc.rect(2, 2, w - 4, 28, frame === 0 ? 0x3a7ab8 : 0xff8fc8);
  if (frame === 0) {
    // A giant ball of yarn with a loose strand, and an arrow pointing down the road.
    pc.circle(24, 16, 11, 0xd8473f);
    for (let i = -9; i <= 9; i += 4) pc.line(24 + i, 6, 24 - i, 26, 0xa8302a);
    pc.line(35, 18, 48, 24, 0xd8473f);
    pc.poly([[52, 12], [80, 12], [80, 8], [90, 16], [80, 24], [80, 20], [52, 20]], P.gold);
  } else {
    pc.poly([[14, 6], [30, 6], [27, 26], [17, 26]], 0xffffff);
    pc.rect(17, 12, 10, 6, 0xc23a7a);
    pc.rect(24, 2, 2, 5, 0x5fd8ff);
    pc.rect(38, 8, 44, 4, 0xffffff).rect(38, 16, 36, 4, 0xffffff).rect(38, 23, 26, 3, 0x7a1424);
  }
  pc.outline(P.ink);
}

export function drawRoadSign(pc: PixelCanvas): void {
  pc.rect(7, 12, 2, pc.height - 12, P.metal2);
  pc.poly([[8, 0], [16, 8], [8, 16], [0, 8]], P.lineYellow);
  pc.poly([[8, 2], [14, 8], [8, 14], [2, 8]], 0xffde60);
  pc.line(6, 11, 6, 7, P.ink).line(6, 7, 10, 5, P.ink).px(9, 4, P.ink).px(10, 4, P.ink).px(10, 6, P.ink);
  pc.outline(P.ink);
}

export function drawMileMarker(pc: PixelCanvas): void {
  pc.rect(3, 4, 2, 12, P.metal2);
  pc.rect(0, 0, 8, 7, 0x2a7a4a);
  pc.rect(1, 1, 6, 5, 0x3a9a5a);
  pc.rect(2, 2, 4, 1, P.white).rect(2, 4, 3, 1, P.white);
  pc.outline(P.ink);
}

/** The end of the washed-out bridge: snapped concrete deck, dangling rebar. */
export function drawBridgeEnd(pc: PixelCanvas): void {
  const w = pc.width;
  pc.rect(0, 0, w - 6, 10, 0x8a8a96);
  pc.rect(0, 0, w - 6, 2, 0xb0b0bc);
  pc.rect(0, 2, w - 6, 3, P.asphalt1);
  pc.rect(4, 3, 10, 1, P.lineYellow).rect(22, 3, 10, 1, P.lineYellow);
  pc.poly([[w - 6, 0], [w, 4], [w - 4, 7], [w - 1, 10], [w - 8, 10]], 0x8a8a96);
  for (const x of [w - 10, w - 5, w - 2]) pc.line(x, 9, x + 2, 16 + (x % 4), 0x6a4a3a);
  pc.rect(6, 10, 6, pc.height - 10, 0x7a7a86);
  pc.rect(6, 10, 2, pc.height - 10, 0x9a9aa6);
  pc.outline(P.ink);
}

/** A twisted section of steel truss sticking out of the river. */
export function drawGirder(pc: PixelCanvas): void {
  const c = 0x6a6a7a;
  const hi = 0x9a9aac;
  pc.line(2, pc.height - 2, 20, 2, c, 2);
  pc.line(20, 2, 44, 6, c, 2);
  pc.line(44, 6, 60, pc.height - 4, c, 2);
  for (let i = 0; i < 4; i++) pc.line(6 + i * 10, pc.height - 4, 16 + i * 10, 4 + i, c);
  pc.line(20, 3, 44, 7, hi);
  pc.outline(P.ink);
}

export function drawGuardrail(pc: PixelCanvas): void {
  const w = pc.width;
  pc.rect(0, 1, w, 4, 0xa8a8b4);
  pc.rect(0, 1, w, 1, 0xd8d8e4);
  pc.rect(0, 4, w, 1, 0x6a6a76);
  for (const x of [4, w - 6]) pc.rect(x, 5, 2, pc.height - 5, 0x6a6a76);
  pc.outline(P.ink);
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

export function drawSkull(pc: PixelCanvas): void {
  pc.ellipse(7, 4, 4, 3, P.cream);
  pc.rect(5, 6, 4, 2, P.cream);
  pc.line(3, 2, 0, 0, P.cream).line(11, 2, 13, 0, P.cream);
  pc.px(5, 4, P.ink).px(9, 4, P.ink);
  pc.outline(P.ink);
}

export function drawBarrel(pc: PixelCanvas): void {
  pc.rect(1, 1, 10, 14, P.rust1);
  pc.rect(1, 1, 3, 14, 0xc06a3a);
  pc.rect(1, 4, 10, 1, P.rust0).rect(1, 11, 10, 1, P.rust0);
  pc.rect(4, 6, 4, 4, P.gold);
  pc.px(5, 7, P.ink).px(6, 8, P.ink);
  pc.outline(P.ink);
}

export function drawCarWreck(pc: PixelCanvas): void {
  const w = pc.width;
  const body = 0x6a8a9a;
  pc.poly([[2, 14], [12, 12], [18, 4], [38, 4], [46, 12], [w - 2, 14], [w - 2, 20], [2, 20]], body);
  pc.poly([[20, 6], [36, 6], [41, 12], [17, 12]], 0x1a1d2e);
  pc.rect(2, 14, w - 4, 2, 0x8aaabb);
  for (let i = 0; i < 18; i++) pc.px(4 + ((i * 13) % (w - 8)), 14 + (i % 6), P.rust1);
  pc.rect(6, 18, 10, 6, P.ink).rect(w - 16, 18, 10, 6, P.ink);
  pc.outline(P.ink);
}

/** The truck stop's towering pole sign. The card glints on its top. */
export function drawPoleSign(pc: PixelCanvas): void {
  const w = pc.width;
  const h = pc.height;
  pc.rect(w / 2 - 3, 30, 6, h - 30, P.metal1);
  pc.rect(w / 2 - 3, 30, 2, h - 30, P.metal2);
  for (let y = 40; y < h - 4; y += 14) pc.rect(w / 2 - 3, y, 6, 1, P.metal0);
  pc.rect(0, 0, w, 30, P.ink);
  pc.rect(2, 2, w - 4, 26, 0x1a3a7a);
  pc.rect(4, 4, w - 8, 9, P.neonBlue);
  pc.rect(4, 15, w - 8, 9, P.neonPink);
  pc.rect(6, 6, w - 12, 5, 0xc8f4ff);
  pc.rect(6, 17, w - 12, 5, 0xffd0e8);
  pc.outline(P.ink);
}

export function drawGarage(pc: PixelCanvas): void {
  const w = pc.width;
  const h = pc.height;
  pc.rect(0, 10, w, h - 10, 0xc8b89a);
  pc.poly([[0, 10], [w / 2, 0], [w, 10]], 0x7a3a2a);
  pc.rect(0, 10, w, 2, 0x5a2a1e);
  pc.rect(10, 22, w - 20, h - 22, 0x5a5a66);
  for (let y = 24; y < h; y += 5) pc.rect(10, y, w - 20, 1, 0x3a3a46);
  pc.rect(w / 2 - 14, 13, 28, 6, P.cream);
  pc.rect(w / 2 - 12, 15, 24, 2, P.rust1);
  pc.outline(P.ink);
}

/** A neon MOTEL-style sign. Frame 1 is the flicker (off). */
export function drawNeon(pc: PixelCanvas, frame: number): void {
  const w = pc.width;
  pc.rect(0, 0, w, pc.height - 4, P.ink);
  pc.rect(w / 2 - 1, pc.height - 4, 2, 4, P.metal1);
  const on = frame === 0;
  const c = on ? P.neonPink : 0x5a2a40;
  const c2 = on ? P.neonBlue : 0x24405a;
  pc.rect(3, 3, w - 6, 1, c2).rect(3, pc.height - 8, w - 6, 1, c2);
  for (let i = 0; i < 5; i++) {
    const x = 5 + i * ((w - 10) / 5);
    pc.rect(x, 6, 5, 8, c);
    pc.rect(x + 1, 7, 3, 6, on ? 0xffd0e8 : 0x3a1a28);
  }
}

/** The runaway rig after it smashed through the truck stop gate. */
export function drawHaulerWreck(pc: PixelCanvas): void {
  const w = pc.width;
  const h = pc.height;
  pc.poly([[0, h - 8], [8, 14], [w - 40, 8], [w - 36, h - 10]], 0x4a4a58);
  pc.rect(10, 18, w - 54, 4, 0x6a6a7a);
  for (let x = 14; x < w - 50; x += 12) pc.rect(x, 22, 1, h - 34, 0x3a3a46);
  pc.poly([[w - 40, 12], [w - 4, 18], [w - 2, h - 6], [w - 38, h - 6]], 0x8a1424);
  pc.rect(w - 30, 22, 14, 10, P.ink);
  pc.rect(w - 28, 24, 10, 6, P.enemyDark);
  pc.rect(w - 10, h - 20, 8, 12, P.metal1);
  for (const x of [20, 40, w - 30]) pc.circle(x, h - 6, 5, P.ink);
  pc.outline(P.ink);
}

export function drawFence(pc: PixelCanvas): void {
  const w = pc.width;
  const wood = 0x8a6a42;
  for (const x of [2, w - 4]) pc.rect(x, 0, 2, pc.height, wood);
  pc.rect(0, 3, w, 2, 0xa8844f).rect(0, 8, w, 2, 0xa8844f);
  pc.outline(P.ink);
}

/**
 * The truck stop's old service shed: tin roof, cinder-block walls, a faded
 * GARAGE sign. The right-hand bay is left open (transparent) so its roll-up
 * shutter, a machine in the level, shows through. 80x64.
 */
export function drawShed(pc: PixelCanvas): void {
  const w = pc.width;
  const h = pc.height;
  // Walls: cinder blocks, left four fifths only (the last 16 px are the doorway).
  pc.rect(0, 10, w - 16, h - 10, 0xb8a888);
  for (let y = 14; y < h; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < w - 16; x += 12) pc.rect(x, y, 11, 5, 0xc8b898);
  pc.rect(w - 18, 10, 2, h - 10, 0x8a7a5a);
  // The door frame and lintel around the open bay.
  pc.rect(w - 16, 10, 16, 6, 0x8a7a5a);
  pc.rect(w - 2, 10, 2, h - 10, 0x8a7a5a);
  // Tin roof.
  pc.poly([[-2, 12], [6, 0], [w - 4, 0], [w + 2, 12]], 0x8a9098);
  for (let x = 4; x < w; x += 5) pc.vline(x, 1, 11, 0x6a7078);
  // A faded GARAGE sign and a grimy window.
  pc.rect(12, 18, 36, 8, 0xe8dcc0);
  for (const [i, x] of [16, 21, 26, 31, 36, 41].entries()) pc.rect(x, 20, 3, 4, i % 2 ? 0xa83a2a : 0x8a2a1e);
  pc.rect(18, 34, 22, 14, 0x3a4a5a);
  pc.line(18, 34, 40, 48, 0x5a6a7a);
  pc.rect(17, 33, 24, 1, 0x6a5a3a).rect(17, 48, 24, 1, 0x6a5a3a);
  // An oil stain by the bay.
  pc.ellipse(w - 22, h - 1, 7, 1, 0x2a2a30);
  pc.outline(P.ink);
}
