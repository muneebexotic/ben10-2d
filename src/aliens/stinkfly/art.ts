import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Stinkfly's textures. Add a `url` to an entry to load real art instead. */
export const STINKFLY_TEX = {
  sheet: 'stinkfly',
  icon: 'ui-icon-stinkfly',
  touchAttack: 'ui-touch-slime',
  touchSpecial: 'ui-touch-stink',
} as const;

export const STINKFLY_COLORS = {
  body: 0x9cc43c,
  light: 0xd4e83a,
  dark: 0x4e6a1c,
  belly: 0xe8e0a0,
  stripe: 0x2e3e14,
  eye: 0xffe44a,
  pupil: 0x1a1408,
  wing: 0xcff4ff,
  vein: 0x7fb0c8,
  stink: 0xa8c43a,
} as const;

const C = STINKFLY_COLORS;

export const STINKFLY_FRAME = { w: 48, h: 40, feetY: 37 } as const;
export const STINKFLY_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7],
  jump: [8],
  fall: [9],
  fly: [10, 11, 12, 11],
  glide: [13, 14],
  spit: [15],
  vent: [16],
  hurt: [17],
} as const;
const FRAME_COUNT = 18;

type WingPose = 'fold' | 'up' | 'mid' | 'down' | 'spread';

interface FlyPose {
  bob: number;
  /** Abdomen tip height (negative curls it up, venting). */
  tail: number;
  wing: WingPose;
  /** Leg sweep: 0 standing, otherwise a scuttle phase; null tucks them up (flying). */
  legs: number | null;
  /** Eyestalks lean forward (spitting) or back (hurt). */
  stalks: number;
  /** Head pushed forward. */
  lunge: number;
  /** Faint motion arcs behind the wings. */
  blur?: boolean;
}

function pose(frame: number): FlyPose {
  const base: FlyPose = { bob: 0, tail: 0, wing: 'fold', legs: 0, stalks: 0, lunge: 0 };
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return { ...base, bob: frame === 1 || frame === 2 ? 1 : 0, stalks: [0, 1, 0, -1][frame], wing: frame === 2 ? 'mid' : 'fold' };
    case 8:
      return { ...base, bob: -1, wing: 'up', legs: null, tail: 1, blur: true };
    case 9:
      return { ...base, wing: 'mid', legs: 3, tail: 2 };
    case 10:
      return { ...base, bob: -2, wing: 'up', legs: null, tail: 2, blur: true };
    case 11:
      return { ...base, bob: -1, wing: 'mid', legs: null, tail: 2, blur: true };
    case 12:
      return { ...base, bob: 0, wing: 'down', legs: null, tail: 1, blur: true };
    case 13:
    case 14:
      return { ...base, bob: frame === 13 ? 0 : 1, wing: 'spread', legs: null, tail: 1, stalks: -1 };
    case 15:
      return { ...base, wing: 'mid', stalks: 3, lunge: 2, tail: 1 };
    case 16:
      return { ...base, wing: 'up', tail: -7, stalks: -1, bob: -1 };
    case 17:
      return { ...base, wing: 'spread', legs: 3, stalks: -3, lunge: -2, tail: 3 };
    default: {
      const i = frame - 4;
      return { ...base, bob: i % 2, wing: i % 2 ? 'mid' : 'up', legs: i + 1, blur: true };
    }
  }
}

/** Wing tip offsets from the shoulder for each pose: [back pair, front pair]. */
const WING_TIPS: Record<WingPose, Array<[number, number]>> = {
  fold: [[-17, 2], [-15, 0]],
  up: [[-9, -15], [-4, -16]],
  mid: [[-16, -8], [-12, -10]],
  down: [[-14, 3], [-10, 2]],
  spread: [[-18, -4], [-13, -7]],
};

function drawWing(pc: PixelCanvas, sx: number, sy: number, tx: number, ty: number, front: boolean): void {
  // A long leaf shape from the shoulder to the tip, thin and translucent.
  const nx = -(ty - sy);
  const ny = tx - sx;
  const len = Math.hypot(nx, ny) || 1;
  const w = front ? 3.2 : 2.6;
  const ox = (nx / len) * w;
  const oy = (ny / len) * w;
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  pc.ctx.globalAlpha = front ? 0.85 : 0.6;
  pc.poly(
    [
      [sx, sy],
      [mx + ox, my + oy],
      [tx, ty],
      [mx - ox, my - oy],
    ],
    C.wing,
  );
  pc.ctx.globalAlpha = 1;
  pc.line(sx, sy, tx, ty, C.vein);
}

function drawLeg(pc: PixelCanvas, hx: number, hy: number, footX: number, footY: number, color: number): void {
  const kx = Math.round((hx + footX) / 2) + 2;
  const ky = Math.round((hy + footY) / 2) - 2;
  pc.line(hx, hy, kx, ky, color);
  pc.line(kx, ky, footX, footY, color);
}

function drawStinkfly(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  const g = STINKFLY_FRAME.feetY;
  const by = 24 + p.bob;
  const thx = 26;
  const headX = 34 + p.lunge;

  // Wings behind (back pair) first.
  const tips = WING_TIPS[p.wing];
  const sx = thx + 1;
  const sy = by - 4;
  drawWing(pc, sx, sy, sx + tips[0][0], sy + tips[0][1], false);

  // Legs: three thin pairs under the thorax.
  if (p.legs === null) {
    for (const [hx, fx] of [[24, 22], [27, 26], [30, 31]]) drawLeg(pc, hx, by + 3, fx, by + 9, C.dark);
  } else {
    const ph = p.legs;
    const sway = (k: number) => (ph === 0 ? 0 : Math.round(Math.sin((ph + k) * 1.6) * 3));
    for (const [i, [hx, fx]] of [[22, 19], [26, 26], [30, 33]].entries()) drawLeg(pc, hx, by + 3, fx + sway(i * 2), g, i === 1 ? C.stripe : C.dark);
  }

  // Abdomen: a long segmented tail curving back to a stinger.
  const tailY = by + 3 + p.tail;
  pc.poly(
    [
      [thx - 3, by - 3],
      [thx - 3, by + 4],
      [9, tailY + 3],
      [5, tailY],
      [8, tailY - 3],
    ],
    C.body,
  );
  pc.line(thx - 3, by + 3, 8, tailY + 2, C.belly);
  for (let k = 0; k < 4; k++) {
    const t = (k + 1) / 5;
    const x = Math.round(thx - 3 + (5 - (thx - 3)) * t);
    const yTop = Math.round(by - 3 + (tailY - 3 - (by - 3)) * t);
    pc.line(x, yTop, x + 1, yTop + 5 - Math.round(t * 2), C.stripe);
  }
  pc.line(5, tailY, 2, tailY + 3 + Math.max(0, -p.tail >> 1), C.dark, 2);

  // Thorax.
  pc.ellipse(thx, by, 5, 4, C.body);
  pc.line(thx - 3, by - 3, thx + 3, by - 4, C.light);
  pc.rect(thx - 1, by + 1, 2, 2, P.omnitrix);

  // Head with mandibles, and the eyestalks that spit slime.
  pc.ellipse(headX, by - 1, 4, 3, C.body);
  pc.line(headX + 3, by + 1, headX + 6, by + 3, C.dark);
  pc.line(headX + 2, by + 2, headX + 4, by + 4, C.dark);
  // Two stalks splayed apart so both eyes read: one leaning forward, one back.
  const eyes: Array<[number, number]> = [
    [headX + 5 + p.stalks, by - 11],
    [headX - 2 + p.stalks, by - 10],
  ];
  pc.line(headX + 1, by - 3, eyes[1][0], eyes[1][1], C.dark, 2);
  pc.line(headX + 2, by - 3, eyes[0][0], eyes[0][1], C.body, 2);

  // Front wings over the body.
  drawWing(pc, sx + 1, sy, sx + 1 + tips[1][0], sy + tips[1][1], true);

  for (const [i, [ex, ey]] of eyes.entries()) {
    pc.circle(ex, ey, i === 0 ? 3 : 2, i === 0 ? C.eye : 0xd8bc30);
    pc.px(ex + 1, ey, C.pupil).px(ex + 1, ey - 1, C.pupil);
    if (i === 0) pc.px(ex - 1, ey - 1, P.white);
  }

  pc.outline(P.ink);

  if (p.blur) {
    // Wingbeat arcs: drawn after the outline so they stay faint.
    pc.ctx.globalAlpha = 0.35;
    for (const [tx, ty] of tips) pc.line(sx + tx + 2, sy + ty - 2, sx + tx - 3, sy + ty + 4, C.wing);
    pc.ctx.globalAlpha = 1;
  }
}

/** Dial hologram: his head with both eyestalks, white for tinting. 16x16. */
function drawIcon(pc: PixelCanvas): void {
  pc.ellipse(7, 11, 5, 3, P.white);
  pc.line(6, 9, 4, 3, P.white, 2).line(9, 9, 11, 3, P.white, 2);
  pc.circle(4, 3, 2, P.white).circle(11, 3, 2, P.white);
  const ctx = pc.ctx;
  ctx.clearRect(pc.ox + 4, pc.oy + 3, 1, 1);
  ctx.clearRect(pc.ox + 11, pc.oy + 3, 1, 1);
  pc.line(5, 14, 3, 15, P.white).line(9, 14, 11, 15, P.white);
}

/** A slime glob mid-flight with drips. */
function drawTouchSlime(pc: PixelCanvas): void {
  pc.circle(8, 6, 4, P.white);
  pc.rect(6, 10, 2, 3, P.white).rect(10, 9, 1, 2, P.white).px(6, 14, P.white);
  pc.ctx.clearRect(pc.ox + 6, pc.oy + 4, 2, 1);
}

/** Three wavy stink lines. */
function drawTouchStink(pc: PixelCanvas): void {
  for (let i = 0; i < 3; i++) {
    const x = 3 + i * 5;
    pc.line(x, 14, x - 1, 10, P.white).line(x - 1, 10, x + 1, 6, P.white).line(x + 1, 6, x, 2, P.white);
  }
}

export const STINKFLY_ASSETS: AssetDef[] = [
  sheet(STINKFLY_TEX.sheet, STINKFLY_FRAME.w, STINKFLY_FRAME.h, FRAME_COUNT, drawStinkfly),
  one(STINKFLY_TEX.icon, 16, 16, drawIcon),
  one(STINKFLY_TEX.touchAttack, 16, 16, drawTouchSlime),
  one(STINKFLY_TEX.touchSpecial, 16, 16, drawTouchStink),
];

export const STINKFLY_ANIMS: AnimDef[] = animsFor('stinkfly', STINKFLY_TEX.sheet, STINKFLY_FRAMES, { idle: 5, run: 14, fly: 24, glide: 6 }, ['idle', 'run', 'fly', 'glide']);
