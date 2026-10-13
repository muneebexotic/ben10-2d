import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Ghostfreak's textures. Add a `url` to an entry to load real art instead. */
export const GHOSTFREAK_TEX = {
  sheet: 'ghostfreak',
  icon: 'ui-icon-ghostfreak',
  touchAttack: 'ui-touch-lash',
  touchSpecial: 'ui-touch-phase',
  portrait: 'portrait-ghostfreak',
  back: 'ghostfreak-back',
} as const;

export const GHOSTFREAK_COLORS = {
  body: 0xe6eaf2,
  shade: 0xaab0c4,
  deep: 0x6e7290,
  stripe: 0x15141f,
  eye: P.ghostfreakEye,
  eyeGlow: 0xd8a8ff,
  tentacle: 0xe070c8,
  tentacleDark: 0x8a2a78,
  glow: P.ghostfreakGlow,
  claw: 0x2a2836,
  rim: 0x1a1428,
} as const;

const C = GHOSTFREAK_COLORS;

/** A hunched, floating figure: the tail of mist is where his feet would be. Feet (the tail tip) on row 39. */
export const GHOSTFREAK_FRAME = { w: 36, h: 40, feetY: 39 } as const;
export const GHOSTFREAK_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7],
  jump: [8],
  fall: [9],
  lash: [10],
  lashLong: [11],
  phase: [12, 13],
  scream: [14, 15],
  hurt: [16],
} as const;
const FRAME_COUNT = 17;

interface GhostPose {
  /** Float bob (px, down). */
  bob: number;
  /** Lean forward (px). */
  lean: number;
  /** How far the misty tail streams back (0 still, 1 drifting fast). */
  stream: number;
  /** Front arm: hand offset from the shoulder. */
  front: { x: number; y: number };
  back: { x: number; y: number };
  /** Tentacles out of the chest: 0 none, 1 lash, 2 long lash. */
  lash?: 0 | 1 | 2;
  /** Mouth open wide (the scream). */
  mouth?: boolean;
  eyeClosed?: boolean;
  /** Arms wrapped in (phasing). */
  wrapped?: boolean;
  /** Tail wave phase. */
  wave: number;
}

function ghostPose(frame: number): GhostPose {
  if (frame <= 3) return { bob: [0, 1, 2, 1][frame], lean: 0, stream: 0.2, front: { x: 6, y: 9 }, back: { x: -5, y: 9 }, wave: frame };
  if (frame <= 7) return { bob: [0, 1, 1, 0][frame - 4], lean: 2, stream: 1, front: { x: 5, y: 10 }, back: { x: -7, y: 7 }, wave: frame };
  switch (frame) {
    case 8:
      return { bob: -1, lean: 0, stream: 0.6, front: { x: 7, y: -3 }, back: { x: -6, y: -2 }, wave: 0 };
    case 9:
      return { bob: 0, lean: 0, stream: 0.4, front: { x: 9, y: 1 }, back: { x: -8, y: 0 }, wave: 2 };
    case 10:
      return { bob: 0, lean: 1, stream: 0.3, front: { x: 4, y: 3 }, back: { x: -5, y: 8 }, lash: 1, wave: 1 };
    case 11:
      return { bob: 0, lean: 2, stream: 0.5, front: { x: 3, y: 1 }, back: { x: -6, y: 5 }, lash: 2, mouth: true, wave: 3 };
    case 12:
    case 13:
      return { bob: frame - 12, lean: -1, stream: 0.4, front: { x: -2, y: 5 }, back: { x: 3, y: 6 }, wrapped: true, wave: frame };
    case 14:
    case 15:
      return { bob: -1, lean: -1, stream: 0.3, front: { x: 10, y: -8 }, back: { x: -9, y: -7 }, mouth: true, wave: frame };
    default:
      return { bob: 0, lean: -2, stream: 0.3, front: { x: -6, y: -4 }, back: { x: -8, y: -2 }, eyeClosed: true, wave: 0 };
  }
}

/** A long, thin arm ending in three hooked claws. */
function drawArm(pc: PixelCanvas, sx: number, sy: number, hand: { x: number; y: number }, front: boolean): void {
  pc.line(sx, sy, sx + hand.x, sy + hand.y, front ? C.body : C.shade, 2);
  if (front) pc.px(sx + Math.round(hand.x / 2), sy + Math.round(hand.y / 2), C.stripe);
  const hx = sx + hand.x;
  const hy = sy + hand.y;
  const dir = hand.x >= 0 ? 1 : -1;
  for (let i = -1; i <= 1; i++) pc.line(hx, hy, hx + dir * 3, hy + 2 + i * 2, C.claw);
}

/** The misty tail: tapers from the hips down to a curling wisp at row 39. */
function drawTail(pc: PixelCanvas, x: number, top: number, pose: GhostPose): void {
  const rows = 39 - top;
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const half = Math.max(1, Math.round(6 * (1 - t) + 1));
    const drift = Math.round(-pose.stream * 9 * t * t + Math.sin(t * 5 + pose.wave * 1.6) * 1.5 * t);
    const cx = x + drift;
    pc.rect(cx - half, top + r, half * 2, 1, t > 0.7 ? C.shade : C.body, t > 0.75 ? 0.75 : 1);
    if (t < 0.6 && r % 3 === 1) pc.px(cx + half - 1, top + r, C.shade);
  }
}

function drawHead(pc: PixelCanvas, x: number, y: number, pose: GhostPose): void {
  // A hooded skull: a high back that hooks forward, the great eye set in the front.
  pc.ellipse(x, y, 7, 7, C.body);
  pc.poly([[x - 7, y - 1], [x - 4, y - 9], [x + 1, y - 10], [x - 1, y - 5]], C.body);
  pc.ellipse(x - 2, y - 2, 4, 4, 0xf6f8ff);
  // The stripes: black bands over the crown.
  pc.line(x - 6, y - 3, x - 2, y - 9, C.stripe).line(x - 7, y + 2, x - 3, y - 5, C.stripe);
  // The eye: violet, ringed in black, a pinprick pupil.
  const ex = x + 3;
  const ey = y - 1;
  pc.circle(ex, ey, 3, C.stripe);
  if (pose.eyeClosed) pc.hline(ex - 2, ex + 2, ey, C.eye);
  else {
    pc.circle(ex, ey, 2, C.eye);
    pc.px(ex + 1, ey - 1, P.white).px(ex, ey, C.eyeGlow);
  }
  // The jaw: stitched shut, or gaping in a scream.
  if (pose.mouth) {
    pc.rect(x + 1, y + 4, 6, 5, C.stripe);
    pc.hline(x + 1, x + 6, y + 4, C.body).px(x + 2, y + 8, C.body).px(x + 5, y + 8, C.body);
  } else {
    pc.hline(x + 1, x + 6, y + 5, C.stripe);
    for (let i = 0; i < 3; i++) pc.px(x + 2 + i * 2, y + 4, C.stripe).px(x + 2 + i * 2, y + 6, C.stripe);
  }
}

function drawGhostfreak(pc: PixelCanvas, frame: number): void {
  const pose = ghostPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;
  const cx = 16 + ux;

  drawArm(pc, cx - 3, 15 + uy, pose.back, false);
  drawTail(pc, 16, 25 + uy, pose);
  // A narrow, hunched torso with black stripe ribs.
  pc.poly([[cx - 6, 13 + uy], [cx + 5, 13 + uy], [cx + 4, 21 + uy], [cx + 2, 27 + uy], [cx - 4, 27 + uy], [cx - 6, 20 + uy]], C.body);
  pc.poly([[cx + 1, 14 + uy], [cx + 5, 14 + uy], [cx + 3, 26 + uy], [cx + 1, 26 + uy]], C.shade);
  for (let i = 0; i < 3; i++) pc.line(cx - 5, 16 + uy + i * 3, cx - 1, 17 + uy + i * 3, C.stripe);
  // The Omnitrix symbol on the chest, where the tentacles come from.
  pc.rect(cx + 1, 17 + uy, 3, 3, P.omnitrixDark);
  pc.px(cx + 2, 18 + uy, P.omnitrix);
  if (pose.lash) {
    const len = pose.lash === 2 ? 15 : 10;
    for (let k = 0; k < 2; k++) {
      const y0 = 19 + uy + k * 2;
      for (let i = 0; i <= len; i++) {
        const wy = Math.round(Math.sin(i * 0.8 + k * 2) * (1 - i / len) * 2);
        pc.rect(cx + 4 + i, y0 + wy, 2, 2, i < len - 2 ? C.tentacle : C.tentacleDark);
      }
    }
  }
  drawHead(pc, cx, 8 + uy, pose);
  if (pose.wrapped) {
    // Arms crossed over himself, claws hooked over the shoulders.
    pc.line(cx - 5, 15 + uy, cx + 5, 22 + uy, C.body, 2).line(cx + 4, 15 + uy, cx - 5, 22 + uy, C.shade, 2);
  } else {
    drawArm(pc, cx + 3, 15 + uy, pose.front, true);
  }
  pc.outline(C.rim);
}

/** Dial hologram: the hooded head and its single eye. 16x16, white for tinting. */
function drawIcon(pc: PixelCanvas): void {
  pc.ellipse(8, 9, 6, 6, P.white);
  pc.poly([[2, 8], [4, 2], [9, 1], [7, 5]], P.white);
  pc.ctx.clearRect(pc.ox + 9, pc.oy + 7, 3, 3);
  pc.px(10, 8, P.white);
  pc.ctx.clearRect(pc.ox + 8, pc.oy + 12, 5, 1);
}

/** Two tentacles whipping right. */
function drawTouchLash(pc: PixelCanvas): void {
  for (let k = 0; k < 2; k++) for (let i = 0; i < 14; i++) pc.rect(1 + i, 5 + k * 5 + Math.round(Math.sin(i * 0.7 + k * 2) * 2), 2, 2, P.white);
}

/** A ghost passing through a wall. */
function drawTouchPhase(pc: PixelCanvas): void {
  pc.rect(9, 0, 3, 16, P.white);
  pc.ctx.clearRect(pc.ox + 9, pc.oy + 5, 3, 6);
  pc.ellipse(7, 7, 4, 4, P.white);
  pc.poly([[3, 8], [11, 8], [9, 14], [6, 15], [4, 12]], P.white);
  pc.ctx.clearRect(pc.ox + 8, pc.oy + 6, 2, 2);
}

/** Dialogue portrait (48x48): the hooded skull and the eye, too close. */
function drawPortrait(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x0c0a14);
  for (let i = 0; i < 6; i++) pc.ellipse(8 + i * 7, 46, 6, 10, 0x15122a);
  pc.ellipse(26, 28, 20, 20, C.body);
  pc.poly([[6, 22], [12, 4], [26, 0], [20, 14]], C.body);
  pc.ellipse(20, 22, 10, 10, 0xf6f8ff);
  pc.line(8, 18, 16, 4, C.stripe, 2).line(6, 30, 14, 12, C.stripe, 2);
  pc.circle(31, 24, 9, C.stripe);
  pc.circle(31, 24, 6, C.eye);
  pc.circle(31, 24, 2, C.eyeGlow);
  pc.rect(33, 20, 2, 2, P.white);
  pc.hline(22, 40, 40, C.stripe);
  for (let i = 0; i < 5; i++) pc.px(24 + i * 4, 39, C.stripe).px(24 + i * 4, 41, C.stripe);
  pc.outline(C.rim);
}

/** Riding the cart, seen from behind: 0 idle, 1 attack (tentacles out), 2 duck. */
function drawBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 8 : 0;
  pc.poly([[5, 26 + y], [7, 14 + y], [23, 14 + y], [25, 26 + y]], C.body);
  for (let i = 0; i < 4; i++) pc.line(9, 16 + y + i * 3, 21, 16 + y + i * 3, C.stripe);
  pc.vline(15, 15 + y, 26 + y, C.shade);
  pc.ellipse(15, 8 + y, 7, 7, C.body);
  pc.poly([[9, 6 + y], [12, -1 + y], [17, 0 + y], [14, 5 + y]], C.body);
  pc.line(10, 7 + y, 14, 0 + y, C.stripe).line(16, 9 + y, 19, 3 + y, C.stripe);
  if (frame === 1) {
    for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) pc.rect(18 + k * 3 + Math.round(Math.sin(i + k) * 1.5), 12 - i + y, 2, 2, C.tentacle);
  } else {
    pc.line(6, 18 + y, 2, 25 + y, C.body, 2).line(24, 18 + y, 28, 25 + y, C.body, 2);
  }
  pc.outline(C.rim);
}

export const GHOSTFREAK_ASSETS: AssetDef[] = [
  one(GHOSTFREAK_TEX.portrait, 48, 48, drawPortrait),
  sheet(GHOSTFREAK_TEX.sheet, GHOSTFREAK_FRAME.w, GHOSTFREAK_FRAME.h, FRAME_COUNT, drawGhostfreak),
  sheet(GHOSTFREAK_TEX.back, 30, 26, 3, drawBack),
  one(GHOSTFREAK_TEX.icon, 16, 16, drawIcon),
  one(GHOSTFREAK_TEX.touchAttack, 16, 16, drawTouchLash),
  one(GHOSTFREAK_TEX.touchSpecial, 16, 16, drawTouchPhase),
];

export const GHOSTFREAK_ANIMS: AnimDef[] = animsFor('ghostfreak', GHOSTFREAK_TEX.sheet, GHOSTFREAK_FRAMES, { idle: 5, run: 8, phase: 6, scream: 12 }, ['idle', 'run', 'phase', 'scream']);
