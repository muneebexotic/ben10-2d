import { PALETTE as P } from '../../config/palette';
import { FRAME } from '../../levels/tiles';
import { seeded, type PixelCanvas } from './PixelCanvas';

/**
 * Chapter 3's set: the natural history museum at night and Dr. Animo's lab
 * under it. Polished marble floors, carved stone walls, brass balconies,
 * moonlit arched windows, skeletons and specimens.
 */

// ---------------------------------------------------------------- Tiles

/** Polished marble blocks: dark veined slabs with mortar lines. */
function marbleBase(pc: PixelCanvas, seed: number, deep = false): void {
  const rnd = seeded(seed);
  pc.rect(0, 0, 16, 16, deep ? P.marble0 : P.marble1);
  // Staggered slab joints.
  pc.hline(0, 15, 7, P.marble0);
  pc.vline(seed % 2 ? 4 : 11, 0, 7, P.marble0);
  pc.vline(seed % 2 ? 12 : 3, 8, 15, P.marble0);
  // Veins.
  let x = Math.floor(rnd() * 16);
  let y = Math.floor(rnd() * 6);
  for (let i = 0; i < 7; i++) {
    pc.px(x, y, deep ? P.marble1 : P.marble2, 0.6);
    x = (x + (rnd() < 0.5 ? 1 : 2)) % 16;
    y = Math.min(15, y + (rnd() < 0.6 ? 1 : 0));
  }
}

/** The floor's top: a checkerboard of polished tiles with a bright edge and a brass skirting line. */
function marbleTop(pc: PixelCanvas, left: boolean, right: boolean, variant: boolean): void {
  pc.rect(0, 0, 16, 5, P.marble3);
  for (let i = 0; i < 4; i++) if ((i + (variant ? 1 : 0)) % 2 === 0) pc.rect(i * 4, 1, 4, 3, P.marble2);
  pc.hline(0, 15, 0, P.white);
  pc.hline(0, 15, 4, P.brass);
  pc.hline(0, 15, 5, P.brassDark);
  // A glint of the floor's polish.
  pc.px(variant ? 9 : 3, 1, P.white).px(variant ? 10 : 4, 2, P.white, 0.5);
  if (left) pc.rect(0, 0, 1, 6, P.marble1);
  if (right) pc.rect(15, 0, 1, 6, P.marble1);
}

/** Carved stone walls: big ashlar blocks with a recessed panel. */
function stoneBase(pc: PixelCanvas, seed: number, variant = false): void {
  pc.rect(0, 0, 16, 16, P.hall2);
  pc.hline(0, 15, 0, P.hall3);
  pc.hline(0, 15, 15, P.hall1);
  pc.vline(seed % 3 === 0 ? 0 : 8, 0, 15, P.hall1);
  if (variant) {
    pc.rect(3, 4, 10, 8, P.hall1);
    pc.rect(4, 5, 8, 6, P.hall2);
    pc.hline(4, 11, 5, P.hall3);
  } else {
    const rnd = seeded(seed + 3);
    for (let i = 0; i < 5; i++) pc.px(1 + Math.floor(rnd() * 14), 2 + Math.floor(rnd() * 12), P.hall1);
  }
}

/** Top of a stone wall: a moulded cornice. */
function cornice(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 4, P.marble2);
  pc.hline(0, 15, 0, P.marble3);
  pc.hline(0, 15, 3, P.hall1);
  for (let x = 1; x < 16; x += 3) pc.px(x, 2, P.marble1);
  if (left) pc.rect(0, 0, 1, 4, P.hall1);
  if (right) pc.rect(15, 0, 1, 4, P.hall1);
}

/** A brass-railed balcony walkway (one-way: Ben jumps up through it). */
function balcony(pc: PixelCanvas, left: boolean, right: boolean): void {
  pc.rect(0, 0, 16, 4, P.hall3);
  pc.hline(0, 15, 0, P.marble3);
  pc.hline(0, 15, 3, P.hall1);
  // The rail's posts and the brass rail hang below the walkway like a frieze.
  for (let x = 2; x < 16; x += 5) pc.rect(x, 4, 1, 4, P.brassDark);
  pc.hline(0, 15, 8, P.brass);
  if (left) pc.rect(0, 0, 2, 9, P.brass);
  if (right) pc.rect(14, 0, 2, 9, P.brass);
}

export function drawMuseumTile(pc: PixelCanvas, frame: number): void {
  const F = FRAME;
  const seed = frame * 97 + 5;
  switch (frame) {
    case F.GRASS_TOP:
    case F.GRASS_TOP_VAR:
    case F.GRASS_TOP_L:
    case F.GRASS_TOP_R:
    case F.GRASS_TOP_S:
      marbleBase(pc, seed);
      marbleTop(pc, frame === F.GRASS_TOP_L || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_R || frame === F.GRASS_TOP_S, frame === F.GRASS_TOP_VAR);
      return;
    case F.DIRT:
    case F.DIRT_VAR:
      marbleBase(pc, seed);
      return;
    case F.DIRT_DEEP:
      marbleBase(pc, seed, true);
      return;
    case F.DIRT_L:
      marbleBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.marble0);
      return;
    case F.DIRT_R:
      marbleBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.marble0);
      return;
    case F.DIRT_BOTTOM:
      marbleBase(pc, seed);
      pc.rect(0, 13, 16, 3, P.marble0);
      return;
    case F.ROCK:
    case F.ROCK_VAR:
      stoneBase(pc, seed, frame === F.ROCK_VAR);
      return;
    case F.ROCK_TOP:
    case F.ROCK_TOP_L:
    case F.ROCK_TOP_R:
    case F.ROCK_TOP_S:
      stoneBase(pc, seed);
      cornice(pc, frame === F.ROCK_TOP_L || frame === F.ROCK_TOP_S, frame === F.ROCK_TOP_R || frame === F.ROCK_TOP_S);
      return;
    case F.ROCK_L:
      stoneBase(pc, seed);
      pc.rect(0, 0, 2, 16, P.hall1);
      return;
    case F.ROCK_R:
      stoneBase(pc, seed);
      pc.rect(14, 0, 2, 16, P.hall1);
      return;
    case F.ROCK_BOTTOM:
      stoneBase(pc, seed);
      pc.rect(0, 12, 16, 4, P.hall1);
      pc.hline(0, 15, 12, P.marble2);
      return;
    case F.PLATFORM_L:
      balcony(pc, true, false);
      return;
    case F.PLATFORM_M:
      balcony(pc, false, false);
      return;
    case F.PLATFORM_R:
      balcony(pc, false, true);
      return;
    case F.PLATFORM_S:
      balcony(pc, true, true);
      return;
  }
}

// ---------------------------------------------------------------- Backdrops

/** The night sky over the town: deep blue to a sodium-lit haze at the horizon. 8x360. */
export function drawCitySky(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, 8, 360, [
    [0, 0x070a1c],
    [0.5, 0x141a3a],
    [0.8, 0x2a2848],
    [1, 0x4a3a52],
  ]);
}

/** Town rooftops and a water tower, lit windows dotted about. 384x120. */
export function drawCity(pc: PixelCanvas): void {
  const rnd = seeded(33);
  const { width: w, height: h } = pc;
  let x = 0;
  while (x < w) {
    const bw = 18 + Math.floor(rnd() * 34);
    const bh = 30 + Math.floor(rnd() * 70);
    pc.rect(x, h - bh, bw, bh, 0x161a30);
    pc.hline(x, x + bw - 1, h - bh, 0x262a48);
    for (let wy = h - bh + 5; wy < h - 4; wy += 7) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (rnd() < 0.18) pc.rect(wx, wy, 2, 3, rnd() < 0.7 ? 0xffd890 : 0x9fb8ff);
    }
    x += bw + Math.floor(rnd() * 4);
  }
  // Water tower.
  pc.rect(300, 20, 26, 14, 0x1e2240);
  pc.poly([[298, 20], [313, 12], [328, 20]], 0x1e2240);
  for (const lx of [302, 322]) pc.line(lx, 34, lx - 2, 60, 0x1e2240);
}

/**
 * The museum's inner wall, tiling sideways: tall arched windows full of
 * moonlight between fluted pilasters, a frieze, panelling below. 128x192.
 */
export function drawHallWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  pc.rect(0, 0, w, h, 0x1c1828);
  // Frieze along the top.
  pc.rect(0, 10, w, 8, 0x2a2438);
  for (let x = 2; x < w; x += 8) pc.rect(x, 12, 4, 4, 0x221e30);
  pc.hline(0, w - 1, 18, 0x3a3450);
  // Two arched windows with moonlight.
  for (const cx of [32, 96]) {
    const top = 34;
    pc.rect(cx - 15, top + 13, 30, 92, 0x141220);
    pc.ellipse(cx, top + 13, 15, 13, 0x141220);
    pc.rect(cx - 12, top + 14, 24, 88, 0x34407a);
    pc.ellipse(cx, top + 14, 12, 11, 0x34407a);
    pc.verticalGradient(cx - 12, top + 4, 24, 98, [
      [0, 0x6a7ec0],
      [0.6, 0x3a4886],
      [1, 0x26305e],
    ]);
    // Muntins.
    pc.vline(cx, top + 3, top + 101, 0x141220);
    for (let y = top + 20; y < top + 100; y += 18) pc.hline(cx - 12, cx + 11, y, 0x141220);
    // Moon glint.
    pc.rect(cx - 9, top + 22, 3, 6, 0xb8c8ff, 0.6);
  }
  // Pilasters between windows.
  for (const px of [0, 64]) {
    pc.rect(px - 5, 20, 10, 150, 0x2a2438);
    for (let k = -3; k <= 3; k += 2) pc.vline(px + k, 26, 164, 0x221e30);
    pc.rect(px - 7, 20, 14, 5, 0x3a3450);
  }
  // Wainscot panelling.
  pc.rect(0, 150, w, h - 150, 0x241e30);
  pc.hline(0, w - 1, 150, 0x3a3450);
  for (let x = 6; x < w; x += 32) {
    pc.rect(x, 158, 24, 26, 0x2a2438);
    pc.rect(x + 2, 160, 20, 22, 0x201a2c);
  }
}

/** The lab under the museum: tiled walls, pipes, a dim green cast. 128x192. */
export function drawLabWall(pc: PixelCanvas): void {
  const { width: w, height: h } = pc;
  pc.rect(0, 0, w, h, 0x121c1c);
  for (let y = 0; y < h; y += 8) pc.hline(0, w - 1, y, 0x182624);
  for (let x = 0; x < w; x += 8) pc.vline(x, 0, h - 1, 0x162220);
  // Pipes.
  pc.rect(0, 26, w, 6, 0x2a3a3a);
  pc.hline(0, w - 1, 26, 0x46605c);
  pc.rect(0, 40, w, 3, 0x22302e);
  for (let x = 12; x < w; x += 40) {
    pc.rect(x, 24, 4, 10, 0x3a4c4a);
    pc.rect(x + 18, 32, 3, 60, 0x22302e);
  }
  // A dripping mutagen leak stain.
  pc.rect(70, 34, 2, 30, P.mutagenDark, 0.6);
  pc.rect(69, 64, 4, 2, P.mutagenDark, 0.5);
}

// ---------------------------------------------------------------- Exhibits

export function drawLampPost(pc: PixelCanvas): void {
  pc.rect(5, 12, 2, 44, 0x1e2230);
  pc.rect(3, 52, 6, 4, 0x1e2230);
  pc.rect(2, 4, 8, 9, 0x2a2e40);
  pc.rect(3, 5, 6, 6, 0xffe0a0);
  pc.rect(4, 6, 2, 3, P.white);
  pc.poly([[1, 4], [6, 0], [11, 4]], 0x1e2230);
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

/** A T-rex skeleton mid-roar on a plinth. 150x110. */
export function drawTrex(pc: PixelCanvas): void {
  const bone = 0xe8dcc0;
  const shade = 0xa89a7a;
  // Plinth.
  pc.rect(20, 100, 110, 10, P.marble2);
  pc.hline(20, 129, 100, P.marble3);
  // Support rods.
  for (const x of [56, 92]) pc.rect(x, 62, 2, 38, 0x4a4a5a);
  // Tail sweeping back, spine up to the neck.
  const spine: Array<[number, number]> = [[4, 70], [20, 62], [38, 56], [56, 52], [72, 50], [88, 48], [100, 44], [108, 36]];
  for (let i = 0; i + 1 < spine.length; i++) pc.line(spine[i][0], spine[i][1], spine[i + 1][0], spine[i + 1][1], bone, 3);
  for (let i = 1; i < spine.length - 1; i++) pc.line(spine[i][0], spine[i][1], spine[i][0] + 1, spine[i][1] - 5, shade);
  // Ribcage.
  for (let x = 64; x <= 96; x += 5) pc.line(x, 50, x - 4, 50 + 16 - Math.abs(x - 80) * 0.4, bone);
  // Legs.
  pc.line(60, 54, 54, 76, bone, 4);
  pc.line(54, 76, 62, 98, bone, 3);
  pc.line(78, 54, 76, 78, shade, 4);
  pc.line(76, 78, 84, 98, shade, 3);
  pc.rect(58, 97, 10, 3, bone).rect(80, 97, 10, 3, shade);
  // Tiny arms.
  pc.line(98, 52, 104, 58, bone).line(104, 58, 106, 56, bone);
  // Skull, jaws open.
  pc.poly([[104, 34], [118, 22], [140, 24], [146, 32], [126, 36]], bone);
  pc.poly([[110, 38], [138, 40], [134, 46], [114, 44]], bone);
  pc.rect(118, 26, 6, 4, 0x2a2438);
  pc.rect(128, 28, 8, 3, shade);
  for (let x = 120; x < 144; x += 4) pc.px(x, 33, P.white).px(x - 1, 39, P.white);
  pc.outline(P.ink);
}

/** A mammoth skeleton with long curved tusks. 110x80. */
export function drawMammoth(pc: PixelCanvas): void {
  const bone = 0xe0d4b8;
  const shade = 0x9a8c6c;
  pc.rect(6, 72, 98, 8, P.marble2);
  pc.hline(6, 103, 72, P.marble3);
  // Spine (humped).
  pc.line(14, 34, 40, 18, bone, 3);
  pc.line(40, 18, 74, 26, bone, 3);
  for (let x = 24; x <= 70; x += 6) pc.line(x, 24 + Math.abs(x - 44) * 0.2, x - 3, 44, shade);
  // Legs.
  for (const [x, c] of [[22, shade], [32, bone], [62, shade], [70, bone]] as const) pc.line(x, 36, x + 1, 71, c, 4);
  // Skull and tusks.
  pc.ellipse(84, 30, 10, 11, bone);
  pc.rect(80, 26, 4, 4, 0x2a2438);
  pc.line(90, 38, 102, 52, tusk(), 3);
  pc.line(102, 52, 96, 62, tusk(), 3);
  pc.line(94, 64, 90, 60, tusk(), 2);
  pc.outline(P.ink);
}

function tusk(): number {
  return 0xf4ead0;
}

/** A blue whale skeleton hanging on cables from the atrium ceiling. 220x60. */
export function drawWhale(pc: PixelCanvas): void {
  const bone = 0xd8d0c0;
  const shade = 0x8a8478;
  for (const x of [40, 110, 180]) pc.vline(x, 0, 22, 0x4a4a5a);
  pc.line(6, 36, 60, 30, bone, 3);
  pc.line(60, 30, 150, 28, bone, 4);
  pc.line(150, 28, 200, 32, bone, 3);
  for (let x = 66; x <= 146; x += 7) pc.line(x, 30, x - 3, 30 + 18 - Math.abs(x - 106) * 0.18, shade);
  // Huge jaw.
  pc.poly([[196, 26], [218, 30], [214, 42], [196, 38]], bone);
  pc.line(198, 42, 216, 46, shade, 2);
  // Flippers and tail flukes.
  pc.line(84, 44, 72, 56, bone, 2);
  pc.poly([[2, 30], [8, 34], [2, 42]], bone);
  pc.outline(P.ink);
}

/** A pterosaur model on wires, wings spread. 70x30. */
export function drawPterosaur(pc: PixelCanvas): void {
  const skin = 0x8a5a4a;
  pc.vline(20, 0, 10, 0x4a4a5a).vline(50, 0, 10, 0x4a4a5a);
  pc.poly([[2, 18], [35, 12], [68, 18], [50, 24], [35, 20], [20, 24]], skin);
  pc.line(35, 14, 44, 10, skin, 2);
  pc.poly([[44, 8], [56, 10], [44, 12]], 0xb07a5a);
  pc.line(42, 7, 38, 4, 0xb07a5a);
  pc.outline(P.ink);
}

/** A glass case with an ammonite fossil inside, on a dark wood base. 32x30. */
export function drawDisplayCase(pc: PixelCanvas): void {
  pc.rect(2, 20, 28, 10, 0x3a2418);
  pc.hline(2, 29, 20, 0x5a3a24);
  pc.rect(4, 4, 24, 16, 0x9fb8ff, 0.25);
  pc.rect(4, 4, 24, 1, 0xd8e4ff);
  pc.vline(4, 4, 19, 0xd8e4ff).vline(27, 4, 19, 0xd8e4ff);
  pc.circle(16, 14, 5, 0xb89a6a);
  pc.circle(16, 14, 3, 0x8a6a4a);
  pc.circle(16, 14, 1, 0xb89a6a);
  pc.line(7, 6, 10, 10, P.white, 1);
  pc.outline(P.ink);
}

/** A stuffed grizzly rearing on a plinth. 30x44. */
export function drawStuffedBear(pc: PixelCanvas): void {
  const fur = 0x6a4428;
  pc.rect(0, 38, 30, 6, P.marble2);
  pc.ellipse(15, 24, 8, 12, fur);
  pc.ellipse(15, 8, 6, 6, fur);
  pc.rect(10, 1, 3, 3, fur).rect(18, 1, 3, 3, fur);
  pc.rect(14, 10, 4, 3, 0x9a7a5a);
  pc.px(12, 7, P.ink).px(18, 7, P.ink);
  pc.line(8, 16, 2, 10, fur, 3);
  pc.line(22, 16, 28, 10, fur, 3);
  for (const x of [1, 27]) pc.px(x, 8, P.white);
  pc.rect(9, 34, 4, 4, fur).rect(17, 34, 4, 4, fur);
  pc.outline(P.ink);
}

/** A tall red exhibit banner with a gold dinosaur emblem. 24x56. */
export function drawBanner(pc: PixelCanvas): void {
  pc.rect(0, 0, 24, 3, P.brass);
  pc.rect(2, 3, 20, 46, P.velvet);
  pc.poly([[2, 49], [12, 55], [22, 49]], P.velvet);
  pc.rect(2, 3, 2, 46, P.velvetDark);
  // Emblem: a little T-rex head.
  pc.poly([[7, 22], [14, 16], [19, 18], [17, 22]], P.brass);
  pc.poly([[8, 24], [17, 24], [15, 27], [9, 27]], P.brass);
  pc.hline(5, 18, 34, P.brass).hline(5, 18, 38, P.brass);
  pc.outline(P.ink);
}

/** A gilt-framed portrait (a stern founder). 40x30. */
export function drawPainting(pc: PixelCanvas): void {
  pc.rect(0, 0, 40, 30, P.brass);
  pc.rect(2, 2, 36, 26, P.brassDark);
  pc.rect(4, 4, 32, 22, 0x2a3a2e);
  pc.ellipse(20, 13, 5, 6, 0xc89a7a);
  pc.rect(13, 19, 14, 7, 0x1a1a24);
  pc.rect(16, 6, 8, 3, 0xd8d8d8);
  pc.px(18, 12, P.ink).px(22, 12, P.ink);
  pc.outline(P.ink);
}

/** Brass stanchions with a sagging red velvet rope. 32x16. */
export function drawVelvetRope(pc: PixelCanvas): void {
  for (const x of [2, 28]) {
    pc.rect(x, 3, 2, 12, P.brass);
    pc.rect(x - 1, 14, 4, 2, P.brassDark);
    pc.circle(x + 1, 2, 1, P.brass);
  }
  pc.line(4, 4, 16, 8, P.velvet, 2);
  pc.line(16, 8, 28, 4, P.velvet, 2);
  pc.outline(P.ink);
}

export function drawBench(pc: PixelCanvas): void {
  pc.rect(0, 2, 32, 4, 0x5a3a24);
  pc.hline(0, 31, 2, 0x8a5a34);
  for (const x of [3, 27]) pc.rect(x, 6, 2, 6, 0x2a2a34);
  pc.outline(P.ink);
}

export function drawExitSign(pc: PixelCanvas): void {
  pc.rect(0, 0, 20, 10, 0x0e3a1e);
  pc.rect(1, 1, 18, 8, P.omnitrix);
  for (let x = 3; x < 17; x += 4) pc.rect(x, 3, 3, 4, 0x0e3a1e);
}

/** "LA BREA TAR PITS" exhibit sign: a wooden board on posts. 40x30. */
export function drawTarSign(pc: PixelCanvas): void {
  pc.rect(4, 12, 3, 18, 0x4a3018).rect(33, 12, 3, 18, 0x4a3018);
  pc.rect(0, 0, 40, 14, 0x6a4424);
  pc.hline(0, 39, 0, 0x8a5a34);
  for (let x = 4; x < 36; x += 5) pc.rect(x, 4, 3, 6, 0x2a1a0c);
  // A bubbling tar blob icon.
  pc.ellipse(20, 22, 6, 3, 0x14121a);
  pc.outline(P.ink);
}

/** The museum's prize: a meteorite fragment on a pedestal under a spotlight. 40x44. */
export function drawMeteorite(pc: PixelCanvas): void {
  pc.rect(8, 28, 24, 16, P.marble2);
  pc.hline(8, 31, 28, P.marble3);
  pc.rect(6, 26, 28, 3, P.marble3);
  pc.poly([[10, 26], [14, 12], [24, 8], [32, 16], [30, 26]], 0x3a3440);
  pc.poly([[14, 22], [18, 14], [24, 12], [26, 18]], 0x5a5468);
  for (const [x, y] of [[18, 18], [24, 15], [27, 21]]) pc.px(x, y, P.omnitrix);
  pc.outline(P.ink);
}

/** A tall glass tank of glowing mutagen with something curled up inside. 28x56. */
export function drawMutagenTank(pc: PixelCanvas): void {
  pc.rect(2, 48, 24, 8, 0x2a3434);
  pc.rect(2, 0, 24, 6, 0x2a3434);
  pc.hline(2, 25, 0, 0x4a5a5a);
  pc.rect(4, 6, 20, 42, P.mutagenDark);
  pc.verticalGradient(4, 6, 20, 42, [
    [0, P.mutagen],
    [1, P.mutagenDark],
  ]);
  // The specimen: a curled tadpole-thing.
  pc.ellipse(14, 30, 5, 4, 0x2a6a4a);
  pc.line(10, 32, 7, 38, 0x2a6a4a, 2);
  pc.px(16, 29, P.white);
  // Bubbles and glass shine.
  for (const [x, y] of [[8, 12], [18, 18], [10, 22], [20, 40]]) pc.px(x, y, P.mutagenGlow);
  pc.rect(6, 8, 1, 39, P.white, 0.5);
  pc.outline(P.ink);
}

/** A steel cage; something inside watches with glowing eyes. 36x32. */
export function drawCage(pc: PixelCanvas): void {
  pc.rect(0, 28, 36, 4, 0x3a3a44);
  pc.rect(0, 0, 36, 3, 0x3a3a44);
  pc.rect(2, 3, 32, 25, 0x0e0e16);
  for (let x = 2; x < 36; x += 4) pc.vline(x, 3, 27, 0x6a6a7a);
  pc.px(14, 16, P.mutagen).px(19, 16, P.mutagen);
  pc.outline(P.ink);
}

/** Animo's console: green screens, a DNA helix, a big lever. 48x34. */
export function drawLabConsole(pc: PixelCanvas): void {
  pc.rect(0, 14, 48, 20, 0x2a3434);
  pc.hline(0, 47, 14, 0x4a5a5a);
  pc.rect(4, 0, 18, 13, 0x101818);
  pc.rect(5, 1, 16, 11, 0x0e3a2a);
  for (let y = 2; y < 11; y++) {
    const s = Math.round(Math.sin(y * 0.9) * 5);
    pc.px(13 + s, y, P.mutagen).px(13 - s, y, P.mutagenGlow);
  }
  pc.rect(26, 2, 18, 11, 0x101818);
  pc.rect(27, 3, 16, 9, 0x0e3a2a);
  for (let x = 28; x < 42; x += 3) pc.vline(x, 11 - ((x * 7) % 7), 11, P.mutagen);
  for (let x = 4; x < 44; x += 6) pc.rect(x, 18, 4, 3, [P.enemy, P.gold, P.mutagen][(x / 6) % 3 | 0]);
  pc.rect(40, 22, 3, 8, 0x6a6a7a);
  pc.circle(41, 22, 2, P.enemy);
  pc.outline(P.ink);
}

/** Lab pipes with a pressure gauge. 64x24. */
export function drawPipes(pc: PixelCanvas): void {
  pc.rect(0, 6, 64, 5, 0x3a4c4a);
  pc.hline(0, 63, 6, 0x5a706c);
  pc.rect(0, 15, 64, 4, 0x2a3a3a);
  pc.rect(20, 0, 4, 24, 0x3a4c4a);
  pc.circle(44, 8, 5, 0xd8d8d8);
  pc.line(44, 8, 47, 5, P.enemy);
  pc.outline(P.ink);
}

/** A grey staff door: STAFF ONLY. 24x40. */
export function drawStaffDoor(pc: PixelCanvas): void {
  pc.rect(0, 0, 24, 40, 0x2a2a34);
  pc.rect(2, 2, 20, 38, 0x4a4a5a);
  pc.rect(4, 8, 16, 5, 0xd8d8d8);
  for (let x = 5; x < 19; x += 3) pc.rect(x, 9, 2, 3, 0x2a2a34);
  pc.rect(17, 22, 3, 2, P.brass);
  pc.outline(P.ink);
}

/** A free-standing marble column (back decor in the halls). 24x112. */
export function drawColumn(pc: PixelCanvas): void {
  pc.rect(2, 0, 20, 6, P.marble2);
  pc.hline(2, 21, 0, P.marble3);
  pc.rect(5, 6, 14, 100, P.marble1);
  pc.rect(5, 6, 3, 100, P.marble2);
  for (let k = 10; k <= 16; k += 3) pc.vline(k, 8, 104, P.marble0);
  pc.rect(2, 106, 20, 6, P.marble2);
  pc.hline(2, 21, 106, P.marble3);
  pc.outline(P.ink);
}

/** Dr. Animo's mutant vines: thick green stems, thorns and glowing pods. Tiles vertically. 16x16. */
export function drawVines(pc: PixelCanvas): void {
  pc.rect(0, 0, 16, 16, 0x0e2416, 0.85);
  pc.line(3, 0, 6, 8, 0x2e7a3a, 3).line(6, 8, 3, 15, 0x2e7a3a, 3);
  pc.line(12, 0, 9, 7, 0x3a8a3a, 3).line(9, 7, 12, 15, 0x3a8a3a, 3);
  pc.line(4, 4, 11, 11, 0x24602e, 2);
  for (const [x, y] of [[8, 3], [2, 11], [13, 9]]) pc.px(x, y, 0xd8e8a0);
  pc.circle(7, 13, 1, P.mutagen);
  pc.px(7, 13, P.mutagenGlow);
}

/** A skylight pane seen edge-on: thick glass in a brass frame. Tiles sideways. 16x8. */
export function drawGlass(pc: PixelCanvas): void {
  pc.rect(0, 0, 16, 8, 0x9fd8ff, 0.35);
  pc.rect(0, 0, 16, 2, P.brass);
  pc.rect(0, 6, 16, 2, P.brassDark);
  pc.line(3, 2, 6, 5, P.white, 1);
  pc.rect(15, 0, 1, 8, P.brassDark);
}
