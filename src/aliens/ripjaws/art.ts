import { PALETTE as P } from '../../config/palette';
import { drawRipjawsBack } from './back';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Ripjaws' textures. Add a `url` to an entry to load real art instead. */
export const RIPJAWS_TEX = {
  sheet: 'ripjaws',
  back: 'ripjaws-back',
  icon: 'ui-icon-ripjaws',
  touchAttack: 'ui-touch-jaws',
  touchSpecial: 'ui-touch-tail',
} as const;

export const RIPJAWS_COLORS = {
  skin: 0xb4c2cc,
  light: 0xe2ecf2,
  dark: 0x5c6e80,
  deep: 0x3a4858,
  belly: 0xf2f0e6,
  suit: 0x1a1c26,
  suitLight: 0x40465a,
  white: 0xf2f4f8,
  fin: 0x8ea4b8,
  eye: 0xd0f048,
  mouth: 0x3a0c18,
  teeth: 0xfffef4,
  lure: 0x7ff0e0,
} as const;

const C = RIPJAWS_COLORS;

export const RIPJAWS_FRAME = { w: 44, h: 40, feetY: 38 } as const;
export const RIPJAWS_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7],
  jump: [8],
  fall: [9],
  biteA: [10],
  biteB: [11],
  whip: [12, 13, 14, 15],
  dash: [16, 17],
  hurt: [18],
  swim: [19, 20, 21, 22],
  tread: [23, 24],
  gasp: [25, 26],
  swimBite: [27],
} as const;
const FRAME_COUNT = 28;

/** Drawing calls the pose makes, so the same fish-man can be drawn upright or level (swimming). */
interface Pen {
  rect(x: number, y: number, w: number, h: number, color: number): void;
  px(x: number, y: number, color: number): void;
  line(x0: number, y0: number, x1: number, y1: number, color: number, thickness?: number): void;
  poly(points: Array<[number, number]>, color: number): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, color: number): void;
}

/**
 * The upright rig turned level, head forward: rig (x, y) lands on frame
 * (41 - y, x + 5), so his back is up and his belly down.
 */
function levelPen(pc: PixelCanvas): Pen {
  const X = (_x: number, y: number) => 41 - y;
  const Y = (x: number) => x + 5;
  return {
    rect: (x, y, w, h, c) => pc.rect(X(x, y + h - 1), Y(x), h, w, c),
    px: (x, y, c) => pc.px(X(x, y), Y(x), c),
    line: (x0, y0, x1, y1, c, t = 1) => pc.line(X(x0, y0), Y(x0), X(x1, y1), Y(x1), c, t),
    poly: (pts, c) => pc.poly(pts.map(([x, y]) => [X(x, y), Y(x)] as [number, number]), c),
    ellipse: (cx, cy, rx, ry, c) => pc.ellipse(X(cx, cy), Y(cx), ry, rx, c),
  };
}

interface FishPose {
  /** Whole body up (negative) or down. */
  bob: number;
  lean: number;
  /** Jaw open, 0..5 px. */
  jaw: number;
  /** Tail: how far the fin swings (sideways in the upright view) and how coiled it is. */
  tailSwing: number;
  coil: number;
  /** Hands relative to their shoulders. */
  near: { x: number; y: number };
  far: { x: number; y: number };
  squint?: boolean;
  /** Lure bright. */
  glow?: boolean;
  /** Spinning (the whip): the tail is out to one side. */
  whip?: number;
}

const BASE: FishPose = { bob: 0, lean: 0, jaw: 1, tailSwing: 0, coil: 0, near: { x: 4, y: 6 }, far: { x: -3, y: 6 } };

function pose(frame: number): FishPose {
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return { ...BASE, bob: [0, 1, 1, 0][frame], jaw: [1, 2, 3, 1][frame], coil: [0, 1, 1, 0][frame] };
    case 4:
    case 5:
    case 6:
    case 7: {
      // Hopping on his tail: coil, spring, sail, land.
      const k = frame - 4;
      return { ...BASE, bob: [1, -1, -2, 0][k], coil: [2, 0, 0, 1][k], lean: 1, jaw: [1, 2, 2, 1][k], near: [{ x: 3, y: 6 }, { x: 5, y: 1 }, { x: 6, y: -1 }, { x: 4, y: 4 }][k], far: [{ x: -3, y: 6 }, { x: -4, y: 2 }, { x: -5, y: 0 }, { x: -3, y: 4 }][k] };
    }
    case 8:
      return { ...BASE, bob: -2, coil: 0, jaw: 2, near: { x: 4, y: -5 }, far: { x: -4, y: -4 } };
    case 9:
      return { ...BASE, bob: -1, jaw: 3, tailSwing: 2, near: { x: 6, y: -2 }, far: { x: -6, y: -1 } };
    case 10:
      return { ...BASE, lean: 2, jaw: 0, near: { x: 7, y: 2 }, far: { x: 2, y: 5 }, squint: true };
    case 11:
      return { ...BASE, lean: 4, jaw: 5, near: { x: 8, y: -1 }, far: { x: 6, y: 1 }, squint: true, glow: true };
    case 12:
    case 13:
    case 14:
    case 15:
      return { ...BASE, bob: -1, jaw: 2, whip: frame - 12, near: { x: 6, y: 1 }, far: { x: -6, y: 1 }, squint: true };
    case 16:
    case 17:
      return { ...BASE, jaw: 4, tailSwing: frame === 16 ? -3 : 3, near: { x: -3, y: 8 }, far: { x: -4, y: 8 }, squint: true, glow: true };
    case 18:
      return { ...BASE, lean: -3, jaw: 4, tailSwing: 2, near: { x: -3, y: -5 }, far: { x: -5, y: -3 }, squint: true };
    case 19:
    case 20:
    case 21:
    case 22:
      return { ...BASE, jaw: 1, tailSwing: [3, 1, -3, -1][frame - 19], near: { x: -2, y: 8 }, far: { x: -3, y: 8 } };
    case 23:
    case 24:
      return { ...BASE, bob: frame === 23 ? 0 : 1, jaw: 1, tailSwing: frame === 23 ? 2 : -2, near: { x: 5, y: 2 + (frame - 23) * 2 }, far: { x: -4, y: 3 - (frame - 23) * 2 } };
    case 25:
    case 26:
      // Gasping: a hand at his gills, mouth working.
      return { ...BASE, bob: 1, coil: 1, lean: 1, jaw: frame === 25 ? 5 : 1, near: { x: -2, y: -6 }, far: { x: -3, y: 6 }, squint: frame === 26 };
    default:
      return { ...BASE, jaw: frame === 27 ? 5 : 1, tailSwing: 1, near: { x: 4, y: 6 }, far: { x: 2, y: 7 }, squint: true, glow: true };
  }
}

function drawArm(pen: Pen, sx: number, sy: number, hand: { x: number; y: number }, front: boolean): void {
  const hx = sx + hand.x;
  const hy = sy + hand.y;
  const mx = Math.round(sx + hand.x * 0.45);
  const my = Math.round(sy + hand.y * 0.45);
  // A black sleeve, then a grey forearm with a fin, then a webbed claw.
  pen.line(sx, sy, mx, my, front ? C.suitLight : C.suit, 3);
  pen.line(mx, my, hx, hy, front ? C.skin : C.dark, 2);
  pen.px(mx - 1, my + 1, front ? C.fin : C.deep);
  pen.rect(hx - 1, hy - 1, 3, 3, front ? C.skin : C.dark);
  pen.px(hx + (hand.x >= 0 ? 2 : -2), hy + 1, C.teeth);
}

function drawTail(pen: Pen, hipX: number, hipY: number, p: FishPose): void {
  const swing = p.tailSwing;
  const coil = p.coil;
  const whip = p.whip ?? -1;
  if (whip >= 0) {
    // Mid-spin: the tail swung right out to one side.
    const dir = whip < 2 ? 1 : -1;
    const ex = hipX + dir * 15;
    pen.line(hipX, hipY + 2, ex, hipY + 4, C.skin, 5);
    pen.line(hipX, hipY + 4, ex, hipY + 6, C.belly, 2);
    pen.poly([[ex, hipY + 4], [ex + dir * 5, hipY - 2], [ex + dir * 3, hipY + 5], [ex + dir * 5, hipY + 11]], C.fin);
    return;
  }
  const bottom = 34 + Math.round(coil * 0.5);
  const tipX = hipX + swing;
  pen.poly([[hipX - 5, hipY], [hipX + 5, hipY], [tipX + 3, bottom - 3], [tipX + 1, bottom], [tipX - 1, bottom], [tipX - 3, bottom - 3]], C.skin);
  // Pale belly side, scale ridges across.
  pen.line(hipX + 3, hipY + 1, tipX + 2, bottom - 2, C.belly);
  pen.line(hipX - 4, hipY + 1, tipX - 2, bottom - 3, C.dark);
  for (let i = 1; i <= 2; i++) {
    const t = i / 3;
    const y = Math.round(hipY + (bottom - hipY) * t);
    const x = Math.round(hipX + swing * t);
    pen.line(x - 3 + i, y, x + 3 - i, y + 1, C.dark);
  }
  // The forked fin flat on the floor.
  pen.poly([[tipX, bottom - 1], [tipX - 9 - coil, 37], [tipX - 5, bottom - 1]], C.fin);
  pen.poly([[tipX, bottom - 1], [tipX + 9 + coil, 37], [tipX + 5, bottom - 1]], C.fin);
  pen.line(tipX - 2, bottom, tipX - 7, 37, C.dark);
  pen.line(tipX + 2, bottom, tipX + 7, 37, C.dark);
}

function drawHead(pen: Pen, hx: number, hy: number, p: FishPose): void {
  // The gill fin behind the jaw.
  pen.poly([[hx - 7, hy + 1], [hx - 12, hy + 3], [hx - 7, hy + 5]], C.fin);
  // The dome of his head: dark on top, paler under.
  pen.ellipse(hx, hy - 1, 9, 6, C.skin);
  pen.poly([[hx + 2, hy - 6], [hx + 9, hy - 3], [hx + 11, hy + 1], [hx + 2, hy + 2]], C.skin);
  pen.ellipse(hx - 1, hy - 4, 7, 3, C.dark);
  pen.line(hx - 6, hy - 5, hx + 2, hy - 7, C.light);
  // Gill slits.
  for (let i = 0; i < 3; i++) pen.line(hx - 5 + i * 2, hy - 2, hx - 6 + i * 2, hy + 1, C.deep);
  // The eye under a heavy brow.
  pen.rect(hx + 3, hy - 3, 3, 2, p.squint ? C.deep : C.eye);
  pen.px(hx + 5, hy - 3, P.ink);
  pen.line(hx + 2, hy - 4, hx + 6, hy - 4, C.deep);
  // The lure on its stalk.
  pen.line(hx - 1, hy - 7, hx + 1, hy - 9, C.skin);
  pen.line(hx + 1, hy - 9, hx + 4, hy - 9, C.skin);
  pen.rect(hx + 4, hy - 10, 2, 2, p.glow ? P.white : C.lure);
  // Upper jaw: fangs along it.
  const jawY = hy + 2;
  for (let x = hx - 2; x <= hx + 10; x += 2) pen.px(x, jawY, C.teeth);
  // The mouth opening and the huge lower jaw (an underbite).
  const open = p.jaw;
  if (open > 0) pen.poly([[hx - 3, jawY], [hx + 11, jawY], [hx + 10, jawY + open], [hx - 2, jawY + Math.min(open, 2)]], C.mouth);
  pen.poly([[hx - 4, jawY + open], [hx + 12, jawY + open - 1], [hx + 11, jawY + open + 3], [hx - 3, jawY + open + 3]], C.belly);
  pen.line(hx - 3, jawY + open + 3, hx + 10, jawY + open + 3, C.skin);
  for (let x = hx - 1; x <= hx + 11; x += 2) pen.px(x, jawY + open - 1, C.teeth);
}

/**
 * The fish-man. `head` draws the head (the same pen upright; swimming, the body
 * is turned level but his head still faces forward, so it's drawn upright at
 * the front of the body).
 */
function drawFish(pen: Pen, p: FishPose, head: { pen: Pen; x: number; y: number } | null): void {
  const cx = 22;
  const hipY = 26 + p.bob + p.coil;
  const tx = cx + p.lean;
  const ty = 21 + p.bob + p.coil;
  // Far arm, the dorsal fin and the tail behind the body.
  drawArm(pen, tx - 4, ty - 4, p.far, false);
  pen.poly([[tx - 5, ty - 4], [tx - 10, ty - 11], [tx - 3, ty - 7]], C.fin);
  pen.line(tx - 9, ty - 10, tx - 5, ty - 5, C.dark);
  drawTail(pen, cx, hipY, p);
  // The wetsuit body: black, a white chest panel, the Omnitrix on it.
  pen.ellipse(tx, ty, 7, 6, C.suit);
  pen.rect(tx - 6, ty - 3, 2, 6, C.suitLight);
  pen.poly([[tx + 1, ty - 6], [tx + 5, ty - 4], [tx + 6, ty + 2], [tx + 2, ty + 5]], C.white);
  pen.rect(tx + 2, ty - 2, 3, 3, P.omnitrixDark);
  pen.px(tx + 3, ty - 1, P.omnitrix);
  if (head) drawHead(head.pen, head.x, head.y, p);
  else drawHead(pen, tx + 2 + p.lean, ty - 11, p);
  drawArm(pen, tx + 4, ty - 4, p.near, true);
}

function drawRipjaws(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  // Swimming frames: the body turned level, head forward (drawn upright at the front).
  const level = (frame >= 16 && frame <= 17) || (frame >= 19 && frame <= 22) || frame === 27;
  if (level) drawFish(levelPen(pc), p, { pen: pc, x: 30, y: 25 + (frame % 2) });
  else drawFish(pc, p, null);
  pc.outline(P.ink);
  if (level && frame !== 27) {
    // A wake of bubbles behind him.
    for (const [x, y] of [[2, 24], [5, 30], [1, 33]] as const) pc.px(x + (frame % 2), y, C.light);
  }
}

/** Dial hologram: his head in profile, the lure and the jaw of fangs. 16x16, white for tinting. */
function drawIcon(pc: PixelCanvas): void {
  pc.ellipse(7, 7, 6, 5, P.white);
  pc.poly([[8, 5], [15, 8], [15, 10], [6, 10]], P.white);
  pc.poly([[2, 11], [15, 11], [14, 14], [3, 14]], P.white);
  pc.line(6, 2, 8, 0, P.white).line(8, 0, 11, 0, P.white);
  pc.rect(11, 0, 2, 2, P.white);
  const ctx = pc.ctx;
  ctx.clearRect(pc.ox + 9, pc.oy + 5, 2, 1);
  for (const x of [5, 8, 11, 14]) ctx.clearRect(pc.ox + x, pc.oy + 10, 1, 1);
}

/** Two rows of fangs: a bite. */
function drawTouchJaws(pc: PixelCanvas): void {
  pc.rect(1, 2, 14, 3, P.white);
  pc.rect(1, 11, 14, 3, P.white);
  for (let i = 0; i < 4; i++) {
    pc.poly([[1 + i * 4, 5], [4 + i * 4, 5], [2.5 + i * 4, 8]], P.white);
    pc.poly([[3 + i * 3, 11], [5 + i * 3, 11], [4 + i * 3, 8]], P.white);
  }
}

/** A forked tail fin mid-swish with a swirl. */
function drawTouchTail(pc: PixelCanvas): void {
  pc.line(3, 13, 8, 8, P.white, 2);
  pc.poly([[8, 8], [15, 2], [11, 8], [15, 12]], P.white);
  pc.line(1, 6, 4, 3, P.white).line(4, 3, 8, 3, P.white);
  pc.px(1, 9, P.white).px(2, 11, P.white);
}

export const RIPJAWS_ASSETS: AssetDef[] = [
  sheet(RIPJAWS_TEX.back, 30, 26, 3, drawRipjawsBack),
  sheet(RIPJAWS_TEX.sheet, RIPJAWS_FRAME.w, RIPJAWS_FRAME.h, FRAME_COUNT, drawRipjaws),
  one(RIPJAWS_TEX.icon, 16, 16, drawIcon),
  one(RIPJAWS_TEX.touchAttack, 16, 16, drawTouchJaws),
  one(RIPJAWS_TEX.touchSpecial, 16, 16, drawTouchTail),
];

export const RIPJAWS_ANIMS: AnimDef[] = animsFor('ripjaws', RIPJAWS_TEX.sheet, RIPJAWS_FRAMES, { idle: 6, run: 10, whip: 12, dash: 14, swim: 10, tread: 4, gasp: 3 }, ['idle', 'run', 'dash', 'swim', 'tread', 'gasp']);
