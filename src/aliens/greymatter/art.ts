import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Grey Matter's textures. Add a `url` to an entry to load real art instead. */
export const GREYMATTER_TEX = {
  sheet: 'greymatter',
  icon: 'ui-icon-greymatter',
  touchAttack: 'ui-touch-bite',
  touchSpecial: 'ui-touch-analyze',
  back: 'greymatter-back',
  reticle: 'fx-weak-point',
} as const;

export const GREYMATTER_COLORS = {
  skin: 0x9aa2ac,
  skinLight: 0xc4ccd6,
  skinDark: 0x646a74,
  ridge: 0x7a828c,
  eye: 0x7ee04a,
  eyeDark: 0x2e6a1a,
  pupil: 0x10161a,
  suit: 0x1a1d26,
  suitLight: 0x3a3f50,
  mouth: 0x3a1a22,
  teeth: 0xf4f4ea,
  scan: P.greymatter,
  rim: 0x14161c,
} as const;

const C = GREYMATTER_COLORS;

/** Tiny: half Ben's height, a head bigger than the rest of him. Feet on row 19. */
export const GREYMATTER_FRAME = { w: 22, h: 20, feetY: 19 } as const;
export const GREYMATTER_FRAMES = {
  idle: [0, 1],
  run: [2, 3, 4, 5],
  jump: [6],
  fall: [7],
  biteA: [8],
  biteB: [9],
  scan: [10, 11],
  hurt: [12],
  cheer: [13],
} as const;
const FRAME_COUNT = 14;

interface GalvanPose {
  bob: number;
  lean: number;
  /** Leg stride: front foot's offset, back foot's offset (px). */
  stride: [number, number];
  /** Hands relative to the shoulder. */
  front: { x: number; y: number };
  back: { x: number; y: number };
  mouth?: 'open' | 'wide';
  /** Eyes lit up green (analysing). */
  glow?: boolean;
  squint?: boolean;
}

function pose(frame: number): GalvanPose {
  switch (frame) {
    case 0:
      return { bob: 0, lean: 0, stride: [1, -1], front: { x: 3, y: 3 }, back: { x: -2, y: 3 } };
    case 1:
      return { bob: 1, lean: 0, stride: [1, -1], front: { x: 3, y: 4 }, back: { x: -2, y: 4 } };
    case 2:
    case 3:
    case 4:
    case 5: {
      const k = frame - 2;
      const f = [3, 1, -2, 1][k];
      return { bob: [0, 1, 0, 1][k], lean: 1, stride: [f, -f], front: { x: -f + 1, y: 2 }, back: { x: f - 1, y: 2 } };
    }
    case 6:
      return { bob: -1, lean: 0, stride: [2, -2], front: { x: 3, y: -3 }, back: { x: -3, y: -2 } };
    case 7:
      return { bob: 0, lean: 0, stride: [1, 0], front: { x: 4, y: -1 }, back: { x: -4, y: 0 } };
    case 8:
      return { bob: 0, lean: 2, stride: [2, -2], front: { x: 4, y: 1 }, back: { x: -3, y: 2 }, mouth: 'open' };
    case 9:
      return { bob: -1, lean: 3, stride: [3, -1], front: { x: 5, y: 0 }, back: { x: -2, y: 1 }, mouth: 'wide' };
    case 10:
    case 11:
      return { bob: 0, lean: 0, stride: [1, -1], front: { x: 1, y: -6 + (frame - 10) }, back: { x: -3, y: 3 }, glow: true, squint: frame === 11 };
    case 12:
      return { bob: 0, lean: -2, stride: [0, -2], front: { x: -3, y: -3 }, back: { x: -4, y: -1 }, squint: true, mouth: 'open' };
    default:
      return { bob: -1, lean: 0, stride: [1, -1], front: { x: 2, y: -6 }, back: { x: -2, y: -6 }, mouth: 'open' };
  }
}

function drawGreyMatter(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  const cx = 10 + p.lean;
  const by = p.bob;
  // Legs: short and quick.
  pc.line(cx - 1, 16 + by, cx - 1 + p.stride[1], 19, C.skinDark, 1);
  pc.line(cx + 1, 16 + by, cx + 1 + p.stride[0], 19, C.skin, 1);
  pc.px(cx - 1 + p.stride[1] + 1, 19, C.skinDark).px(cx + 1 + p.stride[0] + 1, 19, C.skin);
  // Back arm.
  pc.line(cx - 1, 12 + by, cx - 1 + p.back.x, 12 + by + p.back.y, C.skinDark, 1);
  // Body: a little dark suit with the Omnitrix on the chest.
  pc.rect(cx - 2, 11 + by, 5, 6, C.suit);
  pc.vline(cx + 2, 11 + by, 16 + by, C.suitLight);
  pc.px(cx, 13 + by, P.omnitrix).px(cx + 1, 13 + by, P.omnitrixDark);
  // The head: bigger than the rest of him, swept back over a ridged brain-case.
  const hx = cx + 1;
  const hy = 6 + by;
  pc.ellipse(hx - 1, hy - 1, 6, 5, C.skin);
  pc.ellipse(hx + 1, hy + 1, 5, 4, C.skin);
  pc.ellipse(hx - 2, hy - 2, 3, 2, C.skinLight);
  // Ridges across the brain-case.
  pc.line(hx - 6, hy - 1, hx - 3, hy - 5, C.ridge).line(hx - 5, hy + 2, hx - 1, hy - 4, C.ridge);
  // The big front eye and the far one, green and glossy (blazing while he analyses).
  const eye = p.glow ? P.greymatterGlow : C.eye;
  // Front eye: a big green almond with a dark pupil and a highlight; the far eye peeks past the brow.
  pc.ellipse(hx + 2, hy, 2, p.squint ? 1 : 2, C.eyeDark);
  pc.ellipse(hx + 2, hy, 2, p.squint ? 0 : 1, eye);
  pc.px(hx + 3, hy, p.glow ? P.white : C.pupil).px(hx + 1, hy - (p.squint ? 0 : 1), P.white);
  pc.px(hx + 6, hy - 1, C.eyeDark).px(hx + 6, hy, p.glow ? P.greymatterGlow : C.eye);
  // The mouth: a thin line, or open with tiny teeth.
  if (p.mouth === 'wide') {
    pc.rect(hx + 2, hy + 3, 4, 2, C.mouth).hline(hx + 2, hx + 5, hy + 3, C.teeth).px(hx + 3, hy + 4, C.teeth);
  } else if (p.mouth === 'open') {
    pc.rect(hx + 3, hy + 3, 3, 1, C.mouth).px(hx + 3, hy + 3, C.teeth);
  } else {
    pc.hline(hx + 3, hx + 5, hy + 3, C.skinDark);
  }
  // Front arm.
  pc.line(cx + 1, 12 + by, cx + 1 + p.front.x, 12 + by + p.front.y, C.skin, 1);
  pc.px(cx + 1 + p.front.x, 12 + by + p.front.y, C.skinLight);
  pc.outline(C.rim);
  if (p.glow) {
    // Scan lines out of his eyes.
    for (let i = 0; i < 3; i++) pc.px(hx + 7 + i * 2, hy - 1 + i, C.scan, 0.8);
  }
}

/** Dial hologram: the big head and its two great eyes. 16x16, white for tinting. */
function drawIcon(pc: PixelCanvas): void {
  pc.ellipse(8, 7, 6, 5, P.white);
  pc.ellipse(9, 9, 5, 4, P.white);
  pc.rect(6, 12, 4, 3, P.white);
  pc.ctx.clearRect(pc.ox + 9, pc.oy + 6, 2, 3);
  pc.ctx.clearRect(pc.ox + 12, pc.oy + 6, 2, 2);
  pc.ctx.clearRect(pc.ox + 3, pc.oy + 4, 1, 3);
}

/** A nip: two rows of tiny teeth. */
function drawTouchBite(pc: PixelCanvas): void {
  for (let i = 0; i < 4; i++) {
    pc.poly([[2 + i * 3, 4], [5 + i * 3, 4], [3.5 + i * 3, 8]], P.white);
    pc.poly([[2 + i * 3, 13], [5 + i * 3, 13], [3.5 + i * 3, 9]], P.white);
  }
}

/** ANALYZE: a scanning eye inside crosshairs. */
function drawTouchAnalyze(pc: PixelCanvas): void {
  pc.circle(8, 8, 6, P.white);
  pc.circle(8, 8, 5, 0x000000);
  pc.ctx.clearRect(pc.ox + 3, pc.oy + 3, 11, 11);
  pc.ellipse(8, 8, 4, 2, P.white);
  pc.px(8, 8, 0x000000);
  pc.ctx.clearRect(pc.ox + 8, pc.oy + 8, 1, 1);
  for (const [x, y, w, h] of [[7, 0, 2, 3], [7, 13, 2, 3], [0, 7, 3, 2], [13, 7, 3, 2]] as const) pc.rect(x, y, w, h, P.white);
}

/** The weak-point reticle ANALYZE puts on a target: four corner brackets around a dot. 16x16, white. */
function drawReticle(pc: PixelCanvas): void {
  for (const [x, y, dx, dy] of [[0, 0, 1, 1], [15, 0, -1, 1], [0, 15, 1, -1], [15, 15, -1, -1]] as const) {
    pc.hline(Math.min(x, x + dx * 4), Math.max(x, x + dx * 4), y, P.white);
    pc.vline(x, Math.min(y, y + dy * 4), Math.max(y, y + dy * 4), P.white);
  }
  pc.rect(7, 7, 2, 2, P.white);
}

/** Riding the cart, seen from behind: 0 idle, 1 attack (a lunge), 2 duck. The cart dwarfs him: he stands on the rim. */
function drawBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 7 : frame === 1 ? -2 : 0;
  pc.rect(12, 18 + y, 6, 6, C.suit);
  pc.ellipse(15, 12 + y, 7, 6, C.skin);
  pc.ellipse(14, 10 + y, 4, 3, C.skinLight);
  pc.line(9, 12 + y, 12, 7 + y, C.ridge).line(18, 12 + y, 20, 8 + y, C.ridge);
  pc.line(12, 20 + y, 8, 24 + y, C.skin).line(18, 20 + y, 22, 24 + y, C.skin);
  pc.outline(C.rim);
}

export const GREYMATTER_ASSETS: AssetDef[] = [
  sheet(GREYMATTER_TEX.sheet, GREYMATTER_FRAME.w, GREYMATTER_FRAME.h, FRAME_COUNT, drawGreyMatter),
  sheet(GREYMATTER_TEX.back, 30, 26, 3, drawBack),
  one(GREYMATTER_TEX.icon, 16, 16, drawIcon),
  one(GREYMATTER_TEX.touchAttack, 16, 16, drawTouchBite),
  one(GREYMATTER_TEX.touchSpecial, 16, 16, drawTouchAnalyze),
  one(GREYMATTER_TEX.reticle, 16, 16, drawReticle),
];

export const GREYMATTER_ANIMS: AnimDef[] = animsFor('greymatter', GREYMATTER_TEX.sheet, GREYMATTER_FRAMES, { idle: 3, run: 16, scan: 10 }, ['idle', 'run', 'scan']);
