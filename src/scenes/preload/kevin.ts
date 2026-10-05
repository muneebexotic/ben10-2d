import { PALETTE as P } from '../../config/palette';
import { runPose, type ArmPose, type LegPose, type Pose } from './poses';
import { PixelCanvas } from './PixelCanvas';

/**
 * Kevin Levin, eleven years old: long black hair, a black shirt over grey
 * sleeves, jeans. His side-view sheet for the chapter (buddy, villain, boss),
 * and KEVIN 11, the hybrid he becomes when he swallows every copy at once:
 * a base body plus one overlay per alien he copied.
 */

const SKIN = 0xe8b890;
const SKIN_DARK = 0xc8946c;
const HAIR = 0x14101a;
const HAIR_HI = 0x2e2638;
const SHIRT = 0x23232c;
const SLEEVE = 0x6e6e7e;
const JEANS = 0x2a3a5a;
const JEANS_DARK = 0x1e2a44;

export const KEVIN_ACTOR_FRAME = { w: 24, h: 36, feetY: 35 } as const;
export const KEVIN_ACTOR_FRAMES = {
  idle: [0, 1],
  run: [2, 3, 4, 5],
  jump: [6],
  fall: [7],
  absorb: [8, 9],
  windup: [10],
  throw: [11],
  hurt: [12],
  laugh: [13],
  lunge: [14],
  point: [15],
} as const;
export const KEVIN_ACTOR_FRAME_COUNT = 16;

interface KevinPose extends Pose {
  /** 0 normal, 1 glowing purple (using his power). */
  eyes?: number;
  headTilt?: number;
  /** The front hand crackles with stolen power. */
  charge?: number;
}

function kevinPose(frame: number): KevinPose {
  switch (frame) {
    case 0:
    case 1:
      return { bob: frame, lean: 0, front: { footX: 2, lift: 0 }, back: { footX: -2, lift: 0 }, frontArm: { hx: 1, hy: 8 }, backArm: { hx: -1, hy: 8 } };
    case 6:
      return { bob: 0, lean: 0, front: { footX: 3, lift: 4 }, back: { footX: -2, lift: 2 }, frontArm: { hx: 5, hy: -4 }, backArm: { hx: -5, hy: -3 } };
    case 7:
      return { bob: 0, lean: 0, front: { footX: 4, lift: 1 }, back: { footX: -4, lift: 2 }, frontArm: { hx: 6, hy: -1 }, backArm: { hx: -6, hy: -2 } };
    case 8:
    case 9:
      return { bob: 0, lean: 1, front: { footX: 4, lift: 0 }, back: { footX: -3, lift: 0 }, frontArm: { hx: 7, hy: 1 }, backArm: { hx: -3, hy: 6 }, eyes: 1, charge: frame === 8 ? 1 : 2 };
    case 10:
      return { bob: 0, lean: -1, front: { footX: 4, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: -6, hy: -4 }, backArm: { hx: -3, hy: 6 }, eyes: 1, charge: 2 };
    case 11:
      return { bob: 0, lean: 1, front: { footX: 5, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: 7, hy: -2 }, backArm: { hx: -5, hy: 4 }, eyes: 1, charge: 1 };
    case 12:
      return { bob: 0, lean: -2, front: { footX: 3, lift: 2 }, back: { footX: -2, lift: 0 }, frontArm: { hx: -5, hy: -4 }, backArm: { hx: -6, hy: -2 }, eyesClosed: true };
    case 13:
      return { bob: 0, lean: -1, front: { footX: 2, lift: 0 }, back: { footX: -2, lift: 0 }, frontArm: { hx: 3, hy: 6 }, backArm: { hx: -4, hy: 5 }, eyes: 1, mouthOpen: true, headTilt: -1 };
    case 14:
      return { bob: 2, lean: 2, front: { footX: 6, lift: 0 }, back: { footX: -6, lift: 0 }, frontArm: { hx: 6, hy: 2 }, backArm: { hx: -6, hy: 2 }, eyes: 1, charge: 2 };
    case 15:
      return { bob: 0, lean: 0, front: { footX: 3, lift: 0 }, back: { footX: -2, lift: 0 }, frontArm: { hx: 8, hy: -1 }, backArm: { hx: -2, hy: 7 } };
    default: {
      const pose: KevinPose = runPose(Math.floor((frame - 2) * 1.5), 1.4);
      pose.frontArm = { hx: pose.frontArm.hx, hy: pose.frontArm.hy + 2 };
      pose.backArm = { hx: pose.backArm.hx, hy: pose.backArm.hy + 2 };
      return pose;
    }
  }
}

function arm(pc: PixelCanvas, sx: number, sy: number, a: ArmPose, sleeve: number, charge: number): void {
  const steps = Math.ceil(Math.max(1, Math.hypot(a.hx, a.hy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pc.rect(Math.round(sx + a.hx * t), Math.round(sy + a.hy * t), 2, 2, t < 0.7 ? sleeve : SKIN);
  }
  const hx = sx + a.hx;
  const hy = sy + a.hy;
  pc.rect(hx, hy, 2, 2, SKIN);
  if (charge > 0) {
    pc.rect(hx - 1, hy - 1, 4, 4, P.kevin);
    pc.px(hx, hy, P.white);
    if (charge > 1) pc.px(hx + 3, hy - 2, P.kevin).px(hx - 2, hy + 3, P.kevin).px(hx + 3, hy + 3, P.white);
  }
}

function leg(pc: PixelCanvas, hipX: number, hipY: number, l: LegPose, color: number): void {
  const ankleY = 32 - l.lift;
  const rows = Math.max(1, ankleY - hipY);
  for (let r = 0; r <= rows; r++) pc.rect(hipX + Math.round(l.footX * (r / rows)), hipY + r, 3, 1, color);
  const fx = hipX + l.footX;
  pc.rect(fx - 1, ankleY + 1, 5, 2, HAIR);
  pc.hline(fx - 1, fx + 3, ankleY + 2, 0xd8d8e0);
}

function head(pc: PixelCanvas, x: number, y: number, pose: KevinPose): void {
  // Same build as Ben's head (an 8x8 block, facing right) so they read as two kids side by side.
  const t = pose.headTilt ?? 0;
  pc.rect(x, y + t, 8, 8, SKIN);
  pc.rect(x, y + 7 + t, 8, 1, SKIN_DARK);
  // Long black hair: a heavy fringe, and a curtain down the back to the shoulders.
  pc.rect(x - 1, y - 1 + t, 9, 3, HAIR);
  pc.rect(x - 1, y + t, 4, 10, HAIR);
  pc.rect(x + 3, y + 2 + t, 2, 1, HAIR).px(x + 6, y + 2 + t, HAIR).px(x + 7, y + 2 + t, HAIR);
  pc.px(x, y - 2 + t, HAIR).px(x + 2, y - 2 + t, HAIR).px(x + 4, y - 2 + t, HAIR).px(x + 6, y - 1 + t, HAIR);
  pc.rect(x + 1, y - 1 + t, 3, 1, HAIR_HI).px(x + 5, y + t, HAIR_HI);
  const ey = y + 4 + t;
  if (pose.eyesClosed) pc.rect(x + 5, ey, 2, 1, P.ink);
  else if (pose.eyes) {
    // Powered up: the eyes burn purple.
    pc.rect(x + 5, ey - 1, 2, 2, P.kevin);
    pc.px(x + 6, ey - 1, P.white);
  } else {
    pc.rect(x + 5, ey, 1, 2, P.ink);
    pc.px(x + 6, ey, 0x4a3a2a);
  }
  // A heavy brow and a smirk (or a laugh).
  pc.hline(x + 4, x + 6, ey - 1, HAIR);
  if (pose.mouthOpen) pc.rect(x + 5, ey + 2, 2, 2, 0x5a2a2a);
  else pc.px(x + 5, ey + 3, 0x5a2a2a).px(x + 6, ey + 2, 0x5a2a2a);
}

export function drawKevinActor(pc: PixelCanvas, frame: number): void {
  const pose = kevinPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;
  const charge = pose.charge ?? 0;
  arm(pc, 9 + ux, 15 + uy, pose.backArm, SLEEVE, 0);
  leg(pc, 9, 25, pose.back, JEANS_DARK);
  // Two-tone shirt: black body over grey sleeves.
  pc.poly([[8 + ux, 14 + uy], [16 + ux, 14 + uy], [15 + ux, 20 + uy], [15, 26], [9, 26], [8 + ux, 20 + uy]], SHIRT);
  pc.rect(8 + ux, 14 + uy, 2, 4, SLEEVE);
  pc.hline(9 + ux, 15 + ux, 24 + Math.min(1, uy), 0x3a3a46);
  leg(pc, 12, 25, pose.front, JEANS);
  head(pc, 9 + ux, 4 + uy, pose);
  arm(pc, 13 + ux, 15 + uy, pose.frontArm, SLEEVE, charge);
  pc.outline(P.ink);
}

/** Kevin's portrait in the box once he's introduced himself: daylight (well, arcade light), a cocky grin. 48x48. */
export function drawPortraitKevinGrin(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x2a1438);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.1);
  pc.rect(0, 30, 48, 18, 0x1e0e2a);
  pc.poly([[4, 48], [10, 38], [38, 38], [44, 48]], SHIRT);
  pc.poly([[4, 48], [10, 38], [16, 38], [13, 48]], SLEEVE).poly([[44, 48], [38, 38], [33, 38], [36, 48]], SLEEVE);
  pc.rect(21, 30, 8, 8, SKIN_DARK);
  pc.ellipse(25, 20, 11, 13, SKIN);
  pc.ellipse(23, 9, 13, 7, HAIR);
  pc.rect(11, 8, 6, 24, HAIR).rect(34, 9, 4, 18, HAIR);
  pc.poly([[14, 10], [36, 10], [32, 16], [20, 14]], HAIR);
  pc.rect(19, 19, 4, 2, P.ink).rect(28, 19, 4, 2, P.ink);
  pc.line(18, 17, 22, 16, HAIR).line(28, 16, 32, 17, HAIR);
  // The grin, crooked to one side.
  pc.line(21, 27, 31, 25, 0x5a2a2a);
  pc.px(31, 24, 0x5a2a2a).px(22, 28, P.white).px(28, 26, P.white);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- KEVIN 11, the hybrid

export const CHIMERA_FRAME = { w: 52, h: 56, feetY: 55 } as const;
/** Frames: 0-1 idle (heaving), 2 attacking (arms out), 3 overloading (doubled over, crackling). */
export const CHIMERA_FRAME_COUNT = 4;
const MUT = 0x8a7aa8;
const MUT_DARK = 0x5a4a7a;
const MUT_HI = 0xb4a6d0;

/** Where the hybrid's body is in each frame (overlays line up with it). */
function chimeraRig(frame: number): { bob: number; lean: number; reach: number; hunch: number } {
  if (frame === 2) return { bob: 0, lean: 3, reach: 1, hunch: 0 };
  if (frame === 3) return { bob: 3, lean: -1, reach: 0, hunch: 1 };
  return { bob: frame === 1 ? 1 : 0, lean: 0, reach: 0, hunch: 0 };
}

export function drawChimeraBase(pc: PixelCanvas, frame: number): void {
  const r = chimeraRig(frame);
  const ux = r.lean;
  const uy = r.bob + r.hunch * 2;
  // Legs: thick and mismatched, one still in torn jeans.
  pc.rect(16, 38, 7, 15, JEANS_DARK).rect(14, 52, 10, 3, HAIR);
  pc.rect(28, 38, 8, 15, MUT_DARK).rect(27, 52, 11, 3, 0x2a1e3a);
  pc.poly([[28, 52], [26, 55], [30, 53]], 0xd8d8e0).poly([[35, 52], [37, 55], [33, 53]], 0xd8d8e0);
  // Hulking torso, shaded from the top right, in what's left of his shirt.
  pc.ellipse(26 + ux, 28 + uy, 14, 12, MUT_DARK);
  pc.ellipse(27 + ux, 27 + uy, 12, 10, MUT);
  pc.ellipse(30 + ux, 24 + uy, 6, 4, MUT_HI);
  pc.poly([[15 + ux, 25 + uy], [37 + ux, 23 + uy], [36 + ux, 31 + uy], [16 + ux, 32 + uy]], SHIRT);
  for (let i = 0; i < 5; i++) pc.poly([[15 + ux + i * 4.4, 31 + uy], [18 + ux + i * 4.4, 31 + uy], [16 + ux + i * 4.4, 35 + uy - (i % 2) * 2]], SHIRT);
  pc.line(20 + ux, 25 + uy, 18 + ux, 31 + uy, SLEEVE).line(33 + ux, 24 + uy, 34 + ux, 30 + uy, SLEEVE);
  // Abs under the rags, and the waistband of his jeans.
  pc.hline(22 + ux, 30 + ux, 35 + uy, MUT_DARK).vline(26 + ux, 33 + uy, 37, MUT_DARK);
  pc.rect(15, 37, 22, 2, JEANS);
  pc.ellipse(26 + ux, 22 + uy, 10, 4, MUT);
  pc.hline(22 + ux, 32 + ux, 20 + uy, MUT_HI);
  // Arms: one Kevin-sized, one swollen.
  const reach = r.reach * 4;
  pc.line(15 + ux, 24 + uy, 9 + ux - reach * 0.3, 36 + uy - reach, MUT_DARK, 5);
  pc.line(37 + ux, 24 + uy, 44 + ux + reach, 34 + uy - reach, MUT, 6);
  pc.rect(42 + ux + reach, 33 + uy - reach, 6, 5, MUT_DARK);
  for (let i = 0; i < 3; i++) pc.px(47 + ux + reach, 34 + uy - reach + i * 2, 0xd8d8e0);
  // The head: still Kevin's hair, still Kevin's grin, eyes burning purple.
  const hx = 27 + ux + r.lean;
  const hy = 12 + uy;
  pc.rect(hx - 9, hy - 2, 7, 14, HAIR);
  pc.ellipse(hx, hy + 1, 7, 7, MUT);
  pc.ellipse(hx - 1, hy - 4, 8, 4, HAIR);
  pc.poly([[hx - 7, hy - 4], [hx + 7, hy - 5], [hx + 4, hy + 1], [hx - 3, hy - 1]], HAIR);
  pc.rect(hx + 1, hy, 3, 2, P.kevin).rect(hx + 5, hy, 2, 2, P.kevin);
  pc.px(hx + 2, hy, P.white);
  pc.line(hx, hy + 5, hx + 6, hy + 4, 0x3a1a2a);
  pc.px(hx + 1, hy + 5, P.white).px(hx + 4, hy + 4, P.white);
  if (frame === 3) for (const [x, y] of [[8, 14], [44, 18], [22, 4], [40, 42]] as const) pc.line(x, y, x + 3, y + 4, P.kevin);
  pc.outline(P.ink);
}

/**
 * One overlay per alien the hybrid can wear, lined up with drawChimeraBase:
 * the parts of the copies he swallowed. Unknown aliens get a generic set of
 * spines tinted in their colour at runtime.
 */
export const CHIMERA_PARTS = ['heatblast', 'fourarms', 'xlr8', 'wildmutt', 'stinkfly', 'upgrade', 'generic'] as const;
export type ChimeraPart = (typeof CHIMERA_PARTS)[number];

export function drawChimeraPart(part: ChimeraPart): (pc: PixelCanvas, frame: number) => void {
  return (pc, frame) => {
    const r = chimeraRig(frame);
    const ux = r.lean;
    const uy = r.bob + r.hunch * 2;
    const hx = 27 + ux + r.lean;
    const hy = 12 + uy;
    const reach = r.reach * 4;
    switch (part) {
      case 'heatblast':
        // A crown of flame and a magma fist.
        for (let i = 0; i < 9; i++) {
          const h = [3, 5, 4, 7, 5, 6, 4, 5, 3][(i + frame) % 9];
          for (let k = 0; k < h; k++) pc.px(hx - 5 + i, hy - 6 - k, k < h * 0.4 ? P.fire1 : k < h * 0.75 ? P.fire2 : P.fire3);
        }
        pc.rect(42 + ux + reach, 32 + uy - reach, 7, 7, P.magma1);
        pc.rect(43 + ux + reach, 33 + uy - reach, 3, 3, P.fire1);
        break;
      case 'fourarms':
        // A second pair of red arms out of the ribs.
        pc.line(16 + ux, 30 + uy, 6 + ux, 40 + uy - reach * 0.5, 0xd84030, 5);
        pc.line(36 + ux, 30 + uy, 46 + ux + reach, 42 + uy - reach * 0.5, 0xd84030, 5);
        pc.rect(3 + ux, 39 + uy - reach * 0.5, 6, 5, 0xa82a20).rect(44 + ux + reach, 41 + uy - reach * 0.5, 6, 5, 0xa82a20);
        break;
      case 'xlr8':
        // XLR8's visor over the eyes, and a striped tail.
        pc.rect(hx - 1, hy - 1, 10, 4, 0x2a5ad8);
        pc.hline(hx, hx + 8, hy - 1, 0x8ac8ff);
        for (let i = 0; i < 6; i++) pc.rect(12 - i * 2, 40 + i, 3, 2, i % 2 ? 0x2a5ad8 : P.ink);
        break;
      case 'wildmutt':
        // An orange mane over the shoulders and hooked claws.
        for (let i = 0; i < 6; i++) pc.poly([[15 + ux + i * 4, 21 + uy], [19 + ux + i * 4, 21 + uy], [16 + ux + i * 4, 14 + uy - (i % 2) * 2]], 0xe8842c);
        pc.ellipse(26 + ux, 22 + uy, 12, 3, 0xe8842c);
        for (let i = -1; i <= 1; i++) pc.line(9 + ux - reach * 0.3, 37 + uy - reach + i * 2, 5 + ux - reach * 0.3, 39 + uy - reach + i * 2, 0xf4ecd8);
        break;
      case 'stinkfly':
        // Bug wings off the back, and eyestalks.
        pc.ellipse(10 + ux, 18 + uy - frame, 9, 4, 0xcff4ff, 0.7);
        pc.ellipse(8 + ux, 26 + uy, 8, 3, 0xcff4ff, 0.6);
        pc.line(hx - 2, hy - 4, hx - 5, hy - 12, 0x7f9a2a, 2).line(hx + 2, hy - 4, hx + 4, hy - 12, 0x7f9a2a, 2);
        pc.circle(hx - 5, hy - 13, 2, 0xd4e83a).circle(hx + 4, hy - 13, 2, 0xd4e83a);
        break;
      case 'upgrade':
        // Upgrade's circuitry crawling over him, and his eye on the chest.
        pc.line(20 + ux, 24 + uy, 20 + ux, 36, P.upgrade).line(20 + ux, 30 + uy, 30 + ux, 30 + uy, P.upgrade).line(32 + ux, 24 + uy, 34 + ux, 36, P.upgrade);
        pc.circle(27 + ux, 32 + uy, 3, P.upgrade);
        pc.circle(27 + ux, 32 + uy, 2, P.upgradeBody);
        pc.px(28 + ux, 31 + uy, P.white);
        break;
      case 'generic':
        for (let i = 0; i < 5; i++) pc.poly([[16 + ux + i * 5, 22 + uy], [19 + ux + i * 5, 22 + uy], [17 + ux + i * 5, 13 + uy]], P.white);
        break;
    }
  };
}
