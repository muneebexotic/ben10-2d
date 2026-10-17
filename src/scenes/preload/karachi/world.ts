import { PALETTE as P } from '../../../config/palette';
import { FRAME } from '../../../levels/tiles';
import { seeded, type PixelCanvas } from '../PixelCanvas';
import { KARACHI as K } from './colors';

/**
 * Chapter 6's ground and skies: the seafront promenade's paving over the
 * beach sand, the pink palace's sandstone blocks (its floors, walls and the
 * clock tower), carved wooden ledges for the one-way platforms, the night
 * sky over the Arabian Sea, the skyline (far landmarks only as silhouettes),
 * the port's cranes and the back walls of the palace, its library, the old
 * cellars, the tunnel and the clockwork.
 */

// ---------------------------------------------------------------- Tiles

/** Sand under the promenade: grains and the odd shell. */
function sandBase(pc: PixelCanvas, seed: number, deep = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 16, deep ? K.sand0 : K.sand1);
  for (let i = 0; i < 14; i++) pc.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? K.sand0 : K.sand2);
  if (seed % 4 === 0) pc.px(Math.floor(rnd() * 14) + 1, Math.floor(rnd() * 14) + 1, P.cream);
}

/** The promenade's top: square paving slabs with dark joints and a kerb line. */
function paving(pc: PixelCanvas, left: boolean, right: boolean, variant: boolean): void {
  pc.rect(0, 0, 16, 5, K.pave1);
  pc.hline(0, 15, 0, K.pave3);
  pc.hline(0, 15, 1, K.pave2);
  pc.vline(variant ? 4 : 11, 1, 4, K.pave0);
  pc.px(variant ? 9 : 3, 3, K.pave0).px(variant ? 13 : 7, 2, K.pave2);
  pc.hline(0, 15, 5, K.pave0);
  pc.rect(0, 6, 16, 1, K.sand0);
  if (left) pc.rect(0, 0, 1, 6, K.pave0);
  if (right) pc.rect(15, 0, 1, 6, K.pave0);
}

/** Pink sandstone ashlar: staggered blocks with a light top edge on each course. */
function sandstone(pc: PixelCanvas, seed: number, variant = false): void {
  const rnd = seeded(seed + 77);
  pc.rect(0, 0, 16, 16, K.stone1);
  // Two courses per tile, staggered.
  for (const [y, off] of [[0, 0], [8, 8]] as const) {
    pc.hline(0, 15, y, K.stone2);
    pc.hline(0, 15, y + 7, K.stone0);
    pc.vline((off + 7) % 16, y + 1, y + 6, K.stone0);
    pc.vline((off + 15) % 16, y + 1, y + 6, K.stone0);
  }
  for (let i = 0; i < 6; i++) pc.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? K.stone0 : K.stone2);
  if (variant) {
    // A carved rosette in one block.
    pc.px(4, 3, K.stone3).px(3, 4, K.stone3).px(5, 4, K.stone3).px(4, 5, K.stone3).px(4, 4, K.stone0);
  }
}

/** A palace floor's top: polished marble with a blue tile inlay strip. */
function marbleTop(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 4, K.marble);
  pc.hline(0, 15, 0, P.white);
  pc.hline(0, 15, 3, K.marbleShade);
  pc.rect(0, 4, 16, 2, K.tile1);
  for (let x = 0; x < 16; x += 4) pc.px(x + 1, 4, K.tile2).px(x + 2, 5, K.tile0);
  pc.hline(0, 15, 6, K.stone0);
  if (left) pc.rect(0, 0, 1, 7, K.stone0);
  if (right) pc.rect(15, 0, 1, 7, K.stone0);
}

/** Carved wooden ledge (one-way): a jharokha's balcony floor or a shelf. */
function carvedLedge(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 3, K.wood3);
  pc.hline(0, 15, 0, K.brass2);
  pc.hline(0, 15, 3, K.wood0);
  pc.rect(0, 4, 16, 2, K.wood2);
  // Scalloped trim underneath.
  for (let x = 0; x < 16; x += 4) pc.rect(x + 1, 6, 2, 1, K.wood1).px(x + 1, 7, K.wood1);
  if (left) pc.rect(1, 4, 2, 6, K.wood1).px(1, 10, K.brass1);
  if (right) pc.rect(13, 4, 2, 6, K.wood1).px(14, 10, K.brass1);
}

export function drawKarachiTile(pc: PixelCanvas, frame: number): void {
  const F = FRAME;
  const seed = frame * 61 + 23;
  switch (frame) {
    case F.GRASS_TOP:
    case F.GRASS_TOP_VAR:
    case F.GRASS_TOP_L:
    case F.GRASS_TOP_R:
    case F.GRASS_TOP_S:
      sandBase(pc, seed);
      paving(pc, frame === F.GRASS_TOP_L || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_R || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_VAR);
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
      pc.rect(0, 0, 2, 16, K.sand0);
      return;
    case F.DIRT_R:
      sandBase(pc, seed);
      pc.rect(14, 0, 2, 16, K.sand0);
      return;
    case F.DIRT_BOTTOM:
      sandBase(pc, seed);
      pc.rect(0, 13, 16, 3, K.sand0);
      return;
    case F.ROCK:
    case F.ROCK_VAR:
      sandstone(pc, seed, frame === F.ROCK_VAR);
      return;
    case F.ROCK_TOP:
    case F.ROCK_TOP_L:
    case F.ROCK_TOP_R:
    case F.ROCK_TOP_S:
      sandstone(pc, seed);
      marbleTop(pc, frame === F.ROCK_TOP_L || frame === F.ROCK_TOP_S, frame === F.ROCK_TOP_R || frame === F.ROCK_TOP_S);
      return;
    case F.ROCK_L:
      sandstone(pc, seed);
      pc.rect(0, 0, 2, 16, K.stone0);
      return;
    case F.ROCK_R:
      sandstone(pc, seed);
      pc.rect(14, 0, 2, 16, K.stone0);
      return;
    case F.ROCK_BOTTOM:
      sandstone(pc, seed);
      pc.rect(0, 12, 16, 4, K.stone0);
      pc.hline(0, 15, 12, K.stone2);
      return;
    case F.PLATFORM_L:
      carvedLedge(pc, true, false);
      return;
    case F.PLATFORM_M:
      carvedLedge(pc, false, false);
      return;
    case F.PLATFORM_R:
      carvedLedge(pc, false, true);
      return;
    case F.PLATFORM_S:
      carvedLedge(pc, true, true);
      return;
    default:
      return;
  }
}

// ---------------------------------------------------------------- Sky and sea

export function drawKarachiSky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, 8, 360, [
    [0, K.sky0],
    [0.45, K.sky1],
    [0.72, K.sky2],
    [0.9, K.sky3],
    [1, K.glow],
  ]);
}

/** A big pale moon over the sea. 40x40. */
export function drawKarachiMoon(pc: PixelCanvas): void {
  pc.circle(20, 20, 17, 0xf4ecd8);
  pc.circle(14, 16, 4, 0xe0d6c0).circle(24, 25, 5, 0xe0d6c0).circle(27, 13, 2, 0xe0d6c0);
  pc.circle(12, 27, 2, 0xd8ccb4);
}

/** The Arabian Sea at night: dark swell bands and broken streaks of reflected light. 384x80, tiles sideways. */
export function drawKarachiSea(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, 384, 80, [
    [0, K.sea2],
    [0.25, K.sea1],
    [1, K.sea0],
  ]);
  const rnd = seeded(606);
  for (let i = 0; i < 160; i++) {
    const y = Math.floor(Math.pow(rnd(), 1.6) * 78);
    const x = Math.floor(rnd() * 384);
    const len = 2 + Math.floor(rnd() * (10 - y / 10));
    pc.rect(x, y, Math.max(1, len), 1, rnd() < 0.25 ? K.seaGlint : K.sea2, y < 12 ? 0.9 : 0.6);
  }
  // A thin bright horizon line where the city's light hits the water.
  pc.rect(0, 0, 384, 1, K.glow, 0.5);
}

// ---------------------------------------------------------------- Skyline

/** A lit building block with windows. */
function building(pc: PixelCanvas, x: number, top: number, w: number, base: number, color: number, rnd: () => number, lit: number, cool = false): void {
  pc.rect(x, top, w, base - top, color);
  for (let y = top + 3; y < base - 3; y += 5) {
    for (let wx = x + 2; wx < x + w - 2; wx += 4) {
      if (rnd() < lit) pc.rect(wx, y, 2, 2, rnd() < 0.2 && cool ? K.windowCool : K.window, 0.5 + rnd() * 0.5);
    }
  }
}

/**
 * The far skyline, tiling sideways: towers, a single-dome mosque with two
 * minarets and Mazar-e-Quaid's white dome lit at night, far off and small.
 * Landmarks are silhouettes in the distance only (DECISIONS.md). 512x150.
 */
export function drawSkylineFar(pc: PixelCanvas): void {
  const rnd = seeded(818);
  const base = 150;
  // A low band of the city.
  for (let x = 0; x < 512; ) {
    const w = 10 + Math.floor(rnd() * 22);
    const h = 18 + Math.floor(rnd() * 40);
    building(pc, x, base - h, w, base, rnd() < 0.5 ? K.far0 : K.far1, rnd, 0.18);
    x += w;
  }
  // A few tall towers.
  for (const tx of [40, 132, 300, 420, 468]) {
    const h = 70 + Math.floor(rnd() * 30);
    building(pc, tx, base - h, 14 + Math.floor(rnd() * 8), base, K.far1, rnd, 0.3, true);
    pc.px(tx + 6, base - h - 2, P.enemy).px(tx + 6, base - h - 1, P.enemy);
  }
  // Mazar-e-Quaid: a square white base with tall pointed arches, a broad dome, on a terrace. Softly lit.
  const mx = 210;
  const mb = base - 26;
  pc.rect(mx - 30, mb, 60, 4, K.domeShade);
  pc.rect(mx - 18, mb - 22, 36, 22, K.domeLit);
  for (const ax of [-11, 0, 11]) {
    pc.rect(mx + ax - 3, mb - 16, 6, 16, K.domeShade);
    pc.px(mx + ax - 2, mb - 17, K.domeShade).px(mx + ax + 1, mb - 17, K.domeShade).px(mx + ax - 1, mb - 18, K.domeShade).px(mx + ax, mb - 18, K.domeShade);
  }
  pc.rect(mx - 18, mb - 24, 36, 2, K.domeShade);
  pc.ellipse(mx, mb - 30, 15, 9, K.domeLit);
  pc.rect(mx - 15, mb - 30, 31, 6, K.domeLit);
  pc.rect(mx - 1, mb - 43, 2, 4, K.domeShade);
  // A single-dome mosque with two slender minarets, further along.
  const qx = 372;
  const qb = base - 22;
  pc.rect(qx - 16, qb - 12, 32, 12, K.far1);
  pc.ellipse(qx, qb - 15, 10, 8, K.far1);
  pc.rect(qx - 10, qb - 15, 21, 4, K.far1);
  for (const side of [-1, 1]) {
    const tx = qx + side * 22;
    pc.rect(tx - 2, qb - 42, 4, 42, K.far1);
    pc.rect(tx - 3, qb - 30, 6, 2, K.far1);
    pc.poly([[tx - 2, qb - 42], [tx + 2, qb - 42], [tx, qb - 48]], K.far1);
    pc.px(tx, qb - 36, K.window, 0.8);
  }
  for (let wx = qx - 12; wx < qx + 12; wx += 6) pc.rect(wx, qb - 8, 2, 3, K.window, 0.55);
}

/** The near skyline, tiling sideways: blocks of flats with rooftop water tanks, a billboard, palms. 512x170. */
export function drawSkylineNear(pc: PixelCanvas): void {
  const rnd = seeded(919);
  const base = 170;
  for (let x = 0; x < 512; ) {
    const w = 22 + Math.floor(rnd() * 40);
    const h = 40 + Math.floor(rnd() * 70);
    const top = base - h;
    building(pc, x, top, w, base, rnd() < 0.5 ? K.near0 : K.near1, rnd, 0.32, true);
    // Water tanks and dish antennas on the roofs.
    if (rnd() < 0.7) pc.rect(x + 4, top - 5, 6, 5, K.near1).rect(x + 4, top - 6, 6, 1, K.far1);
    if (rnd() < 0.4) pc.rect(x + w - 8, top - 4, 1, 4, K.far1).rect(x + w - 10, top - 6, 5, 2, K.far1);
    // Lines of laundry or fairy lights between some roofs.
    if (rnd() < 0.3) for (let lx = x; lx < x + w; lx += 3) pc.px(lx, top + 2 + Math.round(Math.sin(lx * 0.3)), rnd() < 0.5 ? K.bulbWarm : K.truckPink, 0.8);
    x += w + Math.floor(rnd() * 6);
  }
  // A billboard on stilts with a happy chai cup.
  const bx = 180;
  pc.rect(bx, base - 120, 64, 26, K.near1);
  pc.rect(bx + 2, base - 118, 60, 22, K.truckYellow);
  pc.rect(bx + 8, base - 113, 12, 12, P.white).rect(bx + 10, base - 111, 8, 3, K.wood2);
  pc.rect(bx + 26, base - 113, 30, 3, K.truckRed).rect(bx + 26, base - 107, 22, 2, K.truckRed).rect(bx + 26, base - 102, 26, 2, K.truckRed);
  pc.rect(bx + 10, base - 94, 2, 30, K.near1).rect(bx + 52, base - 94, 2, 30, K.near1);
  // Palms.
  for (const px of [100, 330, 470]) {
    pc.rect(px, base - 60, 2, 60, K.near0);
    for (const [dx, dy] of [[-8, 2], [8, 2], [-6, -2], [6, -2], [0, -4]] as const) pc.line(px + 1, base - 60, px + 1 + dx, base - 60 + dy + 4, K.near0, 2);
  }
}

/** The port: ship-to-shore cranes with red lights and stacks of containers. 512x120, tiles sideways. */
export function drawPort(pc: PixelCanvas): void {
  const rnd = seeded(515);
  const base = 120;
  const colors = [0x8a2a2a, 0x2a4a8a, 0x2a7a4a, 0x8a6a2a, 0x5a5a6a];
  for (let x = 0; x < 512; x += 18) {
    const stacks = 1 + Math.floor(rnd() * 3);
    for (let s = 0; s < stacks; s++) pc.rect(x, base - 8 - s * 8, 16, 7, colors[Math.floor(rnd() * colors.length)], 0.85);
  }
  for (const cx of [60, 220, 380]) {
    // Legs, the boom and its counterweight, a cab, red warning lights.
    pc.rect(cx, base - 70, 3, 70, K.near1).rect(cx + 24, base - 70, 3, 70, K.near1);
    pc.line(cx, base - 30, cx + 26, base - 70, K.near1).line(cx + 26, base - 30, cx, base - 70, K.near1);
    pc.rect(cx - 30, base - 74, 96, 4, K.near1);
    pc.rect(cx + 50, base - 80, 14, 6, K.near1);
    pc.rect(cx + 6, base - 84, 14, 10, K.near1);
    pc.line(cx + 13, base - 84, cx - 26, base - 74, K.near1).line(cx + 13, base - 84, cx + 60, base - 74, K.near1);
    pc.px(cx - 29, base - 75, P.enemy).px(cx + 64, base - 81, P.enemy).px(cx + 13, base - 85, P.enemy);
  }
}

/** Manora's lighthouse across the harbour: a tall white tower with a lamp room. 24x80. */
export function drawLighthouse(pc: PixelCanvas): void {
  pc.poly([[8, 80], [16, 80], [14, 18], [10, 18]], K.domeShade);
  pc.poly([[9, 80], [12, 80], [12, 18], [10, 18]], K.domeLit);
  for (let y = 30; y < 80; y += 14) pc.rect(9, y, 6, 2, 0x9a3a3a);
  pc.rect(7, 16, 10, 2, K.near1);
  pc.rect(9, 9, 6, 7, K.bulb);
  pc.rect(8, 6, 8, 3, K.near1);
  pc.px(12, 4, K.near1).px(12, 5, K.near1);
}

/** The lighthouse beam: a long soft cone, brightest at its root. 256x32. Additive. */
export function drawBeam(pc: PixelCanvas): void {
  for (let x = 0; x < 256; x++) {
    const t = x / 256;
    const half = 2 + t * 14;
    const a = 0.55 * (1 - t) * (1 - t);
    for (let y = Math.floor(16 - half); y <= Math.ceil(16 + half); y++) {
      const edge = 1 - Math.abs(y - 16) / (half + 1);
      pc.px(x, y, K.bulb, a * edge);
    }
  }
}

// ---------------------------------------------------------------- Back walls (128x192, the floor at the bottom)

/** A pointed (Mughal-style) arch outline filled with `fill`, `w` wide from (x, base) up to `top`. */
function pointedArch(pc: PixelCanvas, x: number, base: number, w: number, top: number, fill: number, rim: number): void {
  const spring = top + Math.round(w * 0.6);
  pc.rect(x, spring, w, base - spring, fill);
  const half = w / 2;
  for (let i = 0; i <= half; i++) {
    const y = spring - Math.round(Math.sin((i / half) * (Math.PI / 2)) * (spring - top));
    pc.rect(x + i, y, 1, spring - y, fill);
    pc.rect(x + w - 1 - i, y, 1, spring - y, fill);
    pc.px(x + i, y - 1, rim).px(x + w - 1 - i, y - 1, rim);
  }
  pc.vline(x - 1, spring, base - 1, rim).vline(x + w, spring, base - 1, rim);
}

/** The palace's halls: pink sandstone, blind pointed arches, a blue tile dado and a carved frieze. */
export function drawPalaceWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, K.stone1);
  const rnd = seeded(31);
  for (let y = 0; y < 192; y += 8) {
    pc.hline(0, 127, y, K.stone2);
    for (let x = (y / 8) % 2 === 0 ? 0 : 12; x < 128; x += 24) pc.vline(x, y + 1, y + 7, K.stone0);
  }
  for (let i = 0; i < 40; i++) pc.px(Math.floor(rnd() * 128), Math.floor(rnd() * 192), K.stone0);
  // Carved frieze high up.
  pc.rect(0, 40, 128, 10, K.stone3);
  for (let x = 0; x < 128; x += 8) pc.rect(x + 2, 42, 4, 6, K.stone2).px(x + 3, 44, K.stone0).px(x + 4, 45, K.stone0);
  // Two blind arches with lattice (jali) screens.
  for (const ax of [14, 78]) {
    pointedArch(pc, ax, 168, 36, 70, K.stone0, K.stone3);
    for (let y = 100; y < 166; y += 4) for (let x = ax + 2; x < ax + 34; x += 4) pc.px(x + ((y / 4) % 2) * 2, y, K.stone2);
  }
  // Blue tile dado along the floor.
  pc.rect(0, 168, 128, 24, K.tile0);
  for (let x = 0; x < 128; x += 8) {
    pc.rect(x + 1, 170, 6, 6, K.tile1).px(x + 3, 172, K.tile2).px(x + 4, 173, K.tile2);
    pc.rect(x + 1, 180, 6, 6, K.tile1).px(x + 4, 182, P.white);
  }
  pc.hline(0, 127, 168, K.marble);
}

/** The library: tall lancet windows full of moonlight, dark wood panelling, a painted band at the top. */
export function drawLibraryWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, K.cellar1);
  // A painted ceiling band (gold vines on deep blue).
  pc.rect(0, 0, 128, 22, K.tile0);
  for (let x = 0; x < 128; x += 2) pc.px(x, 10 + Math.round(Math.sin(x * 0.25) * 4), K.brass2);
  for (let x = 6; x < 128; x += 16) pc.circle(x, 10, 2, K.truckRed, 0.9);
  pc.rect(0, 22, 128, 3, K.brass1);
  // Gothic lancet windows.
  for (const wx of [20, 84]) {
    pointedArch(pc, wx, 120, 24, 36, 0x2a3a6a, K.stone2);
    pc.vline(wx + 12, 52, 119, K.stone2);
    pc.hline(wx, wx + 23, 80, K.stone2);
    for (let y = 56; y < 118; y += 3) pc.px(wx + 4 + ((y * 7) % 16), y, 0x9ab8ff, 0.7);
  }
  // Wood panelling below.
  pc.rect(0, 124, 128, 68, K.wood1);
  for (let x = 0; x < 128; x += 16) pc.rect(x + 2, 130, 12, 56, K.wood2).rect(x + 3, 131, 10, 1, K.wood3);
  pc.hline(0, 127, 124, K.brass1);
}

/** The cellars: low brick vaults in old stone, a drain channel, damp. */
export function drawCellarWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, K.cellar0);
  const rnd = seeded(47);
  for (let y = 0; y < 192; y += 6) {
    pc.hline(0, 127, y, K.cellar1);
    for (let x = (y / 6) % 2 === 0 ? 0 : 7; x < 128; x += 14) pc.vline(x, y + 1, y + 5, K.cellar1);
  }
  for (const ax of [8, 72]) {
    // Vault arches.
    for (let i = 0; i <= 24; i++) {
      const y = 110 - Math.round(Math.sin((i / 24) * Math.PI) * 40);
      pc.rect(ax + i * 2, y, 2, 3, K.cellar2);
    }
    pc.rect(ax, 110, 3, 82, K.cellar2).rect(ax + 47, 110, 3, 82, K.cellar2);
  }
  for (let i = 0; i < 60; i++) pc.px(Math.floor(rnd() * 128), Math.floor(rnd() * 192), rnd() < 0.5 ? K.cellar2 : 0x1a2a2a);
  // Damp streaks.
  for (const dx of [30, 90, 110]) pc.rect(dx, 60, 1, 50 + (dx % 30), 0x22343a);
}

/** The tunnel under the old city: rough rock, a brick-lined arch, a cable run. */
export function drawTunnelWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, 0x1e1a22);
  const rnd = seeded(53);
  for (let i = 0; i < 70; i++) pc.rect(Math.floor(rnd() * 124), Math.floor(rnd() * 188), 2 + Math.floor(rnd() * 5), 2 + Math.floor(rnd() * 3), rnd() < 0.5 ? K.cellar1 : 0x161218);
  for (let i = 0; i <= 32; i++) {
    const y = 120 - Math.round(Math.sin((i / 32) * Math.PI) * 48);
    pc.rect(16 + i * 3, y, 3, 4, i % 2 === 0 ? 0x5a3a2a : 0x4a2e22);
  }
  pc.rect(16, 120, 4, 72, 0x4a2e22).rect(110, 120, 4, 72, 0x4a2e22);
  pc.rect(0, 64, 128, 2, 0x2a2a30);
  for (let x = 4; x < 128; x += 20) pc.rect(x, 62, 2, 6, 0x3a3a40);
}

/** The clock's insides: dark beams and brass gears behind the machinery. */
export function drawClockworkWall(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 192, 0x1a1420);
  for (let x = 0; x < 128; x += 32) pc.rect(x, 0, 4, 192, K.wood0);
  for (let y = 0; y < 192; y += 48) pc.rect(0, y, 128, 4, K.wood0);
  const gear = (cx: number, cy: number, r: number, teeth: number, c: number) => {
    pc.circle(cx, cy, r, c);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      pc.rect(cx + Math.cos(a) * (r + 1) - 1, cy + Math.sin(a) * (r + 1) - 1, 3, 3, c);
    }
    pc.circle(cx, cy, Math.max(2, Math.round(r * 0.6)), 0x1a1420);
    pc.circle(cx, cy, Math.max(1, Math.round(r * 0.25)), c);
  };
  gear(30, 60, 18, 14, K.brass0);
  gear(62, 40, 10, 9, K.brass1);
  gear(98, 110, 22, 16, K.brass0);
  gear(40, 150, 12, 10, K.brass1);
  gear(118, 30, 8, 8, K.brass0);
}
