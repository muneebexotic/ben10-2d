import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Wildmutt's textures. Add a `url` to an entry to load real art instead. */
export const WILDMUTT_TEX = {
  sheet: 'wildmutt',
  icon: 'ui-icon-wildmutt',
  touchAttack: 'ui-touch-rake',
  touchSpecial: 'ui-touch-pounce',
  portrait: 'portrait-wildmutt',
} as const;

export const WILDMUTT_COLORS = {
  fur: 0xe8842c,
  light: 0xffb45a,
  dark: 0xa4501c,
  deep: 0x6a2e12,
  mouth: 0x3a0a14,
  tongue: 0xd8466a,
  teeth: 0xfff4e0,
  gill: 0xffd8a0,
  claw: 0xf4ecd8,
  /** His senses: the warm ripple that finds what's hidden. */
  sense: 0xffc890,
} as const;

const C = WILDMUTT_COLORS;

/**
 * A wide frame with room above for the wall-climbing frames (the side rig
 * turned on end). Feet sit on row 39; climbing, his hind end hangs below it.
 */
export const WILDMUTT_FRAME = { w: 60, h: 48, feetY: 39 } as const;
export const WILDMUTT_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7, 8, 9],
  jump: [10],
  fall: [11],
  clawA: [12],
  clawB: [13],
  clawC: [14],
  pounce: [15],
  hurt: [16],
  climb: [17, 18, 19, 20],
  cling: [21, 22],
} as const;
const FRAME_COUNT = 23;
const GROUND = 39;

/** Drawing calls the rig makes, so the same rig can be drawn upright or turned onto a wall. */
interface Pen {
  rect(x: number, y: number, w: number, h: number, color: number): void;
  px(x: number, y: number, color: number): void;
  line(x0: number, y0: number, x1: number, y1: number, color: number, thickness?: number): void;
  poly(points: Array<[number, number]>, color: number): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, color: number): void;
}

/**
 * The rig turned 90° so "down" points at a wall on the right and "forward"
 * points up: rig (x, y) lands on frame (ax + y, ay - x).
 */
function wallPen(pc: PixelCanvas, ax: number, ay: number): Pen {
  return {
    rect: (x, y, w, h, c) => pc.rect(ax + y, ay - x - w + 1, h, w, c),
    px: (x, y, c) => pc.px(ax + y, ay - x, c),
    line: (x0, y0, x1, y1, c, t = 1) => pc.line(ax + y0, ay - x0, ax + y1, ay - x1, c, t),
    poly: (pts, c) => pc.poly(pts.map(([x, y]) => [ax + y, ay + 1 - x] as [number, number]), c),
    ellipse: (cx, cy, rx, ry, c) => pc.ellipse(ax + cy, ay - cx, ry, rx, c),
  };
}

interface Leg {
  /** Paw offset ahead of its hip or shoulder. */
  x: number;
  /** Paw height off the ground. */
  lift: number;
}

/** A low, heavy quadruped rig: hindquarters, a deep chest, and a huge eyeless head slung forward. */
interface BeastPose {
  bob: number;
  /** Chest height against the hips (negative rears up). */
  pitch: number;
  /** Body length change (stretched mid-gallop, bunched when gathering). */
  stretch: number;
  /** Mouth open, 0..4. */
  jaw: number;
  head: { x: number; y: number };
  /** Near and far front legs, near and far back legs. */
  fn: Leg;
  ff: Leg;
  bn: Leg;
  bf: Leg;
  /** Tail tip height (negative is up). */
  tail: number;
  /** A front paw lifted to rake: offset from the shoulder, replacing that leg. */
  rakeN?: { x: number; y: number };
  rakeF?: { x: number; y: number };
  /** Gills flared (breathing hard). */
  flare?: boolean;
}

const BASE: BeastPose = {
  bob: 0,
  pitch: 0,
  stretch: 0,
  jaw: 1,
  head: { x: 0, y: 0 },
  fn: { x: 1, lift: 0 },
  ff: { x: 3, lift: 0 },
  bn: { x: -1, lift: 0 },
  bf: { x: 1, lift: 0 },
  tail: 0,
};

/** A rotary gallop: gather, push off, full stretch, front landing, back legs swing through, bunch. */
const GALLOP: Array<Partial<BeastPose>> = [
  { bob: 1, stretch: -2, fn: { x: -2, lift: 0 }, ff: { x: 0, lift: 1 }, bn: { x: 4, lift: 0 }, bf: { x: 2, lift: 1 }, tail: -1, jaw: 1 },
  { bob: 0, pitch: -1, stretch: 1, fn: { x: 6, lift: 3 }, ff: { x: 8, lift: 2 }, bn: { x: -5, lift: 0 }, bf: { x: -3, lift: 1 }, tail: -3, jaw: 2 },
  { bob: -2, stretch: 4, fn: { x: 9, lift: 4 }, ff: { x: 7, lift: 5 }, bn: { x: -8, lift: 3 }, bf: { x: -6, lift: 4 }, tail: -4, jaw: 3 },
  { bob: -1, pitch: 1, stretch: 2, fn: { x: 5, lift: 0 }, ff: { x: 3, lift: 1 }, bn: { x: -5, lift: 4 }, bf: { x: -3, lift: 5 }, tail: -2, jaw: 2 },
  { bob: 0, pitch: 1, stretch: -1, fn: { x: -2, lift: 0 }, ff: { x: -4, lift: 1 }, bn: { x: 2, lift: 4 }, bf: { x: 4, lift: 5 }, tail: -1, jaw: 1 },
  { bob: -1, stretch: -3, fn: { x: -5, lift: 3 }, ff: { x: -3, lift: 4 }, bn: { x: 6, lift: 2 }, bf: { x: 5, lift: 3 }, tail: 0, jaw: 2 },
];

/** Crawling up a wall: diagonal pairs reach and pull. Lift is distance from the wall. */
const CLIMB: Array<Partial<BeastPose>> = [
  { fn: { x: 6, lift: 0 }, ff: { x: -1, lift: 2 }, bn: { x: -4, lift: 2 }, bf: { x: 3, lift: 0 }, head: { x: -2, y: -1 }, jaw: 1, tail: -5 },
  { fn: { x: 3, lift: 1 }, ff: { x: 2, lift: 1 }, bn: { x: -1, lift: 1 }, bf: { x: 0, lift: 1 }, head: { x: -2, y: -2 }, bob: -1, jaw: 2, tail: -6 },
  { fn: { x: -1, lift: 2 }, ff: { x: 6, lift: 0 }, bn: { x: 3, lift: 0 }, bf: { x: -4, lift: 2 }, head: { x: -2, y: -1 }, jaw: 1, tail: -5 },
  { fn: { x: 2, lift: 1 }, ff: { x: 3, lift: 1 }, bn: { x: 0, lift: 1 }, bf: { x: -1, lift: 1 }, head: { x: -2, y: -2 }, bob: -1, jaw: 2, tail: -6 },
];

function pose(frame: number): BeastPose {
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return {
        ...BASE,
        bob: frame === 2 || frame === 3 ? 1 : 0,
        jaw: [1, 2, 2, 1][frame],
        head: { x: 0, y: frame === 1 || frame === 2 ? 1 : 0 },
        tail: [0, -1, -2, -1][frame],
        flare: frame === 1 || frame === 2,
      };
    case 10:
      return { ...BASE, pitch: -2, stretch: 1, jaw: 2, fn: { x: 4, lift: 6 }, ff: { x: 6, lift: 5 }, bn: { x: -6, lift: 3 }, bf: { x: -4, lift: 4 }, tail: -4 };
    case 11:
      return { ...BASE, pitch: 1, jaw: 3, fn: { x: 6, lift: 2 }, ff: { x: 7, lift: 1 }, bn: { x: -2, lift: 5 }, bf: { x: -1, lift: 6 }, tail: 1, head: { x: 0, y: 1 } };
    case 12:
      return { ...BASE, pitch: -3, bob: 0, jaw: 3, rakeN: { x: 10, y: -5 }, ff: { x: 4, lift: 0 }, bn: { x: -2, lift: 0 }, tail: -2, head: { x: 1, y: -1 } };
    case 13:
      return { ...BASE, pitch: -2, jaw: 3, fn: { x: 3, lift: 0 }, rakeF: { x: 11, y: -1 }, bn: { x: -2, lift: 0 }, tail: -2, head: { x: 1, y: 0 } };
    case 14:
      return { ...BASE, pitch: -6, stretch: 2, jaw: 4, rakeN: { x: 12, y: 1 }, rakeF: { x: 10, y: 4 }, bn: { x: -3, lift: 0 }, bf: { x: 0, lift: 0 }, tail: -4, head: { x: 2, y: 1 }, flare: true };
    case 15:
      return { ...BASE, bob: -3, pitch: -2, stretch: 3, jaw: 4, rakeN: { x: 12, y: -2 }, rakeF: { x: 10, y: 0 }, bn: { x: -10, lift: 6 }, bf: { x: -8, lift: 7 }, tail: -5, head: { x: 1, y: 0 } };
    case 16:
      return { ...BASE, pitch: -3, stretch: -2, jaw: 4, fn: { x: 5, lift: 3 }, ff: { x: 2, lift: 1 }, bn: { x: -4, lift: 0 }, bf: { x: 2, lift: 1 }, tail: 2, head: { x: -2, y: -3 }, flare: true };
    case 21:
    case 22:
      return { ...BASE, fn: { x: 4, lift: 0 }, ff: { x: 1, lift: 0 }, bn: { x: -3, lift: 0 }, bf: { x: 0, lift: 0 }, head: { x: -2, y: frame === 21 ? -2 : -3 }, jaw: frame === 21 ? 1 : 2, tail: -5, flare: frame === 22 };
    default:
      if (frame >= 17) return { ...BASE, ...CLIMB[frame - 17] };
      return { ...BASE, ...GALLOP[frame - 4] };
  }
}

function drawLeg(pen: Pen, jx: number, jy: number, leg: Leg, back: boolean, far: boolean): void {
  const fur = far ? C.dark : C.fur;
  const pawX = jx + leg.x;
  const pawY = GROUND - 1 - leg.lift;
  // Hind legs bend back at the hock; front legs come straight down.
  const midX = Math.round((jx + pawX) / 2) + (back ? -2 : 1);
  const midY = Math.round((jy + pawY) / 2);
  pen.line(jx, jy, midX, midY, fur, back ? 4 : 3);
  pen.line(midX, midY, pawX, pawY, fur, 3);
  pen.rect(pawX - 1, pawY, 5, 2, far ? C.deep : C.dark);
  pen.px(pawX + 4, pawY + 1, C.claw);
  if (!far) pen.px(pawX + 3, pawY + 1, C.claw);
}

/** A front leg lifted to rake: a thick forearm ending in three hooked claws. */
function drawRake(pen: Pen, sx: number, sy: number, r: { x: number; y: number }, far: boolean): void {
  const hx = sx + r.x;
  const hy = sy + r.y;
  pen.line(sx, sy, hx, hy, far ? C.dark : C.fur, 4);
  pen.rect(hx - 1, hy - 2, 4, 4, far ? C.deep : C.dark);
  for (let i = -1; i <= 1; i++) pen.line(hx + 3, hy + i * 2, hx + 5, hy + i * 2 + 1, C.claw);
}

function drawHead(pen: Pen, hx: number, hy: number, jaw: number, flare: boolean): void {
  // Neck gills: the slits he breathes and smells through.
  pen.ellipse(hx - 6, hy + 1, 4, 4, C.fur);
  for (let i = 0; i < 3; i++) {
    pen.line(hx - 8 + i * 2, hy - 1, hx - 9 + i * 2, hy + 3, flare ? C.gill : C.deep);
    if (flare) pen.px(hx - 8 + i * 2, hy + 1, C.deep);
  }
  // Skull: smooth, rounded, no eyes at all.
  pen.ellipse(hx - 1, hy - 1, 6, 5, C.fur);
  pen.line(hx - 5, hy - 5, hx + 2, hy - 6, C.light);
  pen.line(hx + 2, hy - 6, hx + 6, hy - 4, C.light);
  // Upper jaw and snout.
  pen.poly(
    [
      [hx - 2, hy - 4],
      [hx + 6, hy - 4],
      [hx + 8, hy - 1],
      [hx + 8, hy + 1],
      [hx - 3, hy + 1],
    ],
    C.fur,
  );
  pen.px(hx + 7, hy - 2, C.deep);
  // The mouth: a dark gash full of teeth that opens wide.
  const open = Math.max(0, jaw);
  if (open > 0) {
    pen.poly(
      [
        [hx - 3, hy + 1],
        [hx + 8, hy + 1],
        [hx + 7, hy + 2 + open],
        [hx - 2, hy + 2 + open],
      ],
      C.mouth,
    );
    pen.line(hx, hy + 1 + open, hx + 4, hy + 1 + open, C.tongue);
  }
  // Lower jaw.
  pen.poly(
    [
      [hx - 3, hy + 1 + open],
      [hx + 7, hy + 2 + open],
      [hx + 5, hy + 4 + open],
      [hx - 2, hy + 4 + open],
    ],
    C.dark,
  );
  for (let x = hx; x <= hx + 7; x += 2) {
    pen.px(x, hy + 1, C.teeth);
    if (open > 0) pen.px(x - 1, hy + 1 + open, C.teeth);
  }
}

function drawBeast(pen: Pen, p: BeastPose): void {
  const hipX = 22 - Math.min(0, p.stretch);
  const hipY = 27 + p.bob;
  const shX = 38 + Math.max(0, p.stretch);
  const shY = 26 + p.bob + p.pitch;

  // Far legs and the stub of a tail first.
  if (p.rakeF) drawRake(pen, shX + 1, shY + 2, p.rakeF, true);
  else drawLeg(pen, shX + 1, shY + 3, p.ff, false, true);
  drawLeg(pen, hipX + 1, hipY + 2, p.bf, true, true);
  pen.line(hipX - 6, hipY - 2, hipX - 10, hipY - 5 + p.tail, C.dark, 3);
  pen.line(hipX - 10, hipY - 5 + p.tail, hipX - 12, hipY - 6 + p.tail, C.fur, 2);

  // Body: muscular hindquarters, a deep chest, a dark stripe down the back.
  pen.ellipse(hipX, hipY, 8, 6, C.fur);
  pen.ellipse(shX - 1, shY - 1, 8, 7, C.fur);
  pen.poly(
    [
      [hipX - 2, hipY - 6],
      [shX - 2, shY - 8],
      [shX + 2, shY + 5],
      [hipX + 2, hipY + 5],
    ],
    C.fur,
  );
  pen.line(hipX - 5, hipY + 3, shX + 3, shY + 5, C.dark);
  pen.line(hipX - 4, hipY - 4, shX - 4, shY - 6, C.light);
  // Spiky fur tufts along the spine.
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = Math.round(hipX - 3 + (shX - hipX) * t);
    const y = Math.round(hipY - 6 + (shY - hipY - 2) * t);
    pen.poly(
      [
        [x - 2, y + 1],
        [x + 2, y + 1],
        [x - 3, y - 3 - (i % 2)],
      ],
      C.dark,
    );
    pen.px(x - 2, y - 2 - (i % 2), C.light);
  }
  // Omnitrix low on the shoulder (high up it reads as an eye, and he has none).
  pen.rect(shX - 6, shY + 2, 2, 2, P.omnitrix);

  drawLeg(pen, hipX - 1, hipY + 3, p.bn, true, false);
  if (p.rakeN) drawRake(pen, shX - 1, shY + 2, p.rakeN, false);
  else drawLeg(pen, shX - 1, shY + 3, p.fn, false, false);

  drawHead(pen, shX + 9 + p.head.x, shY - 3 + p.head.y, p.jaw, p.flare ?? false);
}

function drawWildmutt(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  const climbing = frame >= 17;
  // On a wall: paws against the wall (frame x 37), head up, hind end just below the feet line.
  drawBeast(climbing ? wallPen(pc, -1, 56) : pc, p);
  pc.outline(P.ink);
}

/** Dial hologram: his eyeless head, all jaw and teeth, white for tinting. 16x16. */
function drawIcon(pc: PixelCanvas): void {
  pc.ellipse(7, 6, 6, 5, P.white);
  pc.poly([[3, 7], [15, 8], [14, 13], [4, 13]], P.white);
  const ctx = pc.ctx;
  ctx.clearRect(pc.ox + 5, pc.oy + 9, 9, 2);
  for (const x of [6, 9, 12]) pc.px(x, 9, P.white);
  for (const x of [5, 8, 11]) pc.px(x, 10, P.white);
  for (const [x, y] of [[2, 4], [3, 6], [2, 8]]) ctx.clearRect(pc.ox + x, pc.oy + y, 1, 1);
}

/** Three hooked claw marks. */
function drawTouchRake(pc: PixelCanvas): void {
  for (let i = 0; i < 3; i++) {
    pc.line(3 + i * 4, 2, 6 + i * 4, 12, P.white, 2);
    pc.px(7 + i * 4, 13, P.white);
  }
}

/** A pouncing arc ending in a paw. */
function drawTouchPounce(pc: PixelCanvas): void {
  pc.line(1, 13, 4, 6, P.white).line(4, 6, 8, 3, P.white).line(8, 3, 11, 4, P.white);
  pc.rect(10, 5, 5, 4, P.white);
  for (const x of [10, 12, 14]) pc.px(x, 10, P.white);
}

/** Dialogue portrait (48x48): all mouth and teeth, gills flared, no eyes. */
function drawPortrait(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x3a1e10);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.08);
  pc.ellipse(24, 30, 22, 18, C.fur);
  pc.ellipse(22, 16, 16, 12, C.fur);
  pc.line(10, 8, 30, 5, C.light, 2);
  for (let i = 0; i < 3; i++) pc.line(6 + i * 4, 22, 5 + i * 4, 32, C.deep, 2);
  pc.poly([[14, 24], [46, 22], [44, 40], [16, 36]], C.mouth);
  pc.line(20, 34, 36, 34, C.tongue, 2);
  for (let x = 16; x < 46; x += 4) {
    pc.poly([[x, 23], [x + 3, 23], [x + 1, 28]], C.teeth);
    pc.poly([[x + 1, 38], [x + 4, 38], [x + 2, 33]], C.teeth);
  }
  for (let i = 0; i < 4; i++) pc.poly([[8 + i * 7, 6], [12 + i * 7, 6], [6 + i * 7, 0]], C.dark);
  pc.outline(P.ink);
}

export const WILDMUTT_ASSETS: AssetDef[] = [
  one(WILDMUTT_TEX.portrait, 48, 48, drawPortrait),
  sheet(WILDMUTT_TEX.sheet, WILDMUTT_FRAME.w, WILDMUTT_FRAME.h, FRAME_COUNT, drawWildmutt),
  one(WILDMUTT_TEX.icon, 16, 16, drawIcon),
  one(WILDMUTT_TEX.touchAttack, 16, 16, drawTouchRake),
  one(WILDMUTT_TEX.touchSpecial, 16, 16, drawTouchPounce),
];

export const WILDMUTT_ANIMS: AnimDef[] = animsFor('wildmutt', WILDMUTT_TEX.sheet, WILDMUTT_FRAMES, { idle: 6, run: 16, climb: 10, cling: 3 }, ['idle', 'run', 'climb', 'cling']);
