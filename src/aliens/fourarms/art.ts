import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Four Arms' textures. Add a `url` to an entry to load real art instead. */
export const FOURARMS_TEX = {
  sheet: 'fourarms',
  icon: 'ui-icon-fourarms',
  touchAttack: 'ui-touch-fists',
  touchSpecial: 'ui-touch-slam',
} as const;

export const FOURARMS_COLORS = {
  skin: 0xd9483a,
  light: 0xff8a6a,
  dark: 0x9a2a22,
  pants: 0x1c1a26,
  pantsLight: 0x36313f,
  eye: 0xffe14a,
  hair: 0x16121c,
} as const;

const C = FOURARMS_COLORS;

export const FOURARMS_FRAME = { w: 52, h: 48, feetY: 47 } as const;
export const FOURARMS_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7, 8, 9],
  jump: [10],
  fall: [11],
  punchA: [12],
  punchB: [13],
  haymakerUp: [14],
  haymaker: [15],
  clap: [16],
  slamUp: [17],
  slam: [18],
  carry: [19],
  carryRun: [20, 21],
  throw: [22],
  hurt: [23],
  meteor: [24],
} as const;
const FRAME_COUNT = 25;

interface Foot {
  x: number;
  lift: number;
}

interface Hand {
  x: number;
  y: number;
}

/** A four-armed brute rig: hands are offsets from their shoulder joints. */
interface BrutePose {
  bob: number;
  lean: number;
  crouch: number;
  front: Foot;
  back: Foot;
  upperF: Hand;
  upperB: Hand;
  lowerF: Hand;
  lowerB: Hand;
  squint?: boolean;
  /** Arms raised overhead pass behind the head. */
  headFront?: boolean;
}

const RUN_FOOT = [5, 2, -1, -5, -2, 2];
const RUN_LIFT = [0, 0, 0, 2, 4, 2];

/** Idle stance: upper arms hang wide, lower arms bent forward, so all four read in silhouette. */
function hang(sway = 0): Pick<BrutePose, 'upperF' | 'upperB' | 'lowerF' | 'lowerB'> {
  return {
    upperF: { x: 6 + sway, y: 10 },
    upperB: { x: -6 - sway, y: 10 },
    lowerF: { x: 7, y: 4 + sway },
    lowerB: { x: -5, y: 5 },
  };
}

const CARRY_ARMS = { upperF: { x: 1, y: -16 }, upperB: { x: 0, y: -16 }, lowerF: { x: 4, y: 4 }, lowerB: { x: -3, y: 4 }, headFront: true };

function pose(frame: number): BrutePose {
  const base = { bob: 0, lean: 0, crouch: 0, front: { x: 3, lift: 0 }, back: { x: -3, lift: 0 } };
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return { ...base, bob: frame >= 2 ? 1 : 0, ...hang(frame === 1 || frame === 2 ? 1 : 0) };
    case 10:
      return { ...base, front: { x: 4, lift: 5 }, back: { x: -2, lift: 3 }, upperF: { x: 4, y: -9 }, upperB: { x: -3, y: -8 }, lowerF: { x: 6, y: -2 }, lowerB: { x: -4, y: -1 } };
    case 11:
      return { ...base, front: { x: 5, lift: 1 }, back: { x: -5, lift: 2 }, upperF: { x: 8, y: -3 }, upperB: { x: -7, y: -2 }, lowerF: { x: 7, y: 2 }, lowerB: { x: -6, y: 3 } };
    case 12:
      return { ...base, lean: 2, front: { x: 5, lift: 0 }, back: { x: -4, lift: 0 }, upperF: { x: 14, y: -1 }, upperB: { x: -3, y: 6 }, lowerF: { x: 3, y: 6 }, lowerB: { x: -1, y: 7 } };
    case 13:
      return { ...base, lean: 2, front: { x: 5, lift: 0 }, back: { x: -4, lift: 0 }, upperF: { x: 2, y: 5 }, upperB: { x: -2, y: 8 }, lowerF: { x: 14, y: 1 }, lowerB: { x: -3, y: 5 } };
    case 14:
      return { ...base, lean: -2, front: { x: 4, lift: 0 }, back: { x: -5, lift: 0 }, upperF: { x: -4, y: 1 }, upperB: { x: -8, y: 0 }, lowerF: { x: -3, y: 5 }, lowerB: { x: -7, y: 4 }, squint: true };
    case 15:
      return { ...base, lean: 3, front: { x: 7, lift: 0 }, back: { x: -5, lift: 0 }, upperF: { x: 12, y: -2 }, upperB: { x: 11, y: -4 }, lowerF: { x: 12, y: 3 }, lowerB: { x: 11, y: 5 } };
    case 16:
      return { ...base, upperF: { x: -5, y: -18 }, upperB: { x: 7, y: -18 }, lowerF: { x: -1, y: -11 }, lowerB: { x: 4, y: -11 }, squint: true, headFront: true };
    case 17:
      return { ...base, lean: -1, front: { x: 4, lift: 0 }, back: { x: -4, lift: 0 }, upperF: { x: -4, y: -19 }, upperB: { x: 5, y: -19 }, lowerF: { x: -2, y: -13 }, lowerB: { x: 3, y: -13 }, headFront: true };
    case 18:
      return { ...base, lean: 2, crouch: 4, front: { x: 6, lift: 0 }, back: { x: -5, lift: 0 }, upperF: { x: 8, y: 18 }, upperB: { x: 7, y: 17 }, lowerF: { x: 10, y: 14 }, lowerB: { x: 9, y: 13 }, squint: true };
    case 19:
      return { ...base, ...CARRY_ARMS };
    case 20:
    case 21:
      return { ...base, bob: frame === 20 ? 1 : 0, front: { x: frame === 20 ? 4 : -2, lift: frame === 20 ? 0 : 2 }, back: { x: frame === 20 ? -3 : 3, lift: frame === 20 ? 2 : 0 }, ...CARRY_ARMS };
    case 22:
      return { ...base, lean: 3, front: { x: 6, lift: 0 }, back: { x: -5, lift: 0 }, upperF: { x: 12, y: -10 }, upperB: { x: 10, y: -11 }, lowerF: { x: -2, y: 6 }, lowerB: { x: -4, y: 5 } };
    case 23:
      return { ...base, lean: -3, front: { x: 3, lift: 2 }, back: { x: -2, lift: 0 }, upperF: { x: -3, y: -6 }, upperB: { x: -6, y: -4 }, lowerF: { x: 2, y: -3 }, lowerB: { x: -5, y: 1 }, squint: true };
    case 24:
      return { ...base, crouch: 2, front: { x: 3, lift: 5 }, back: { x: -3, lift: 4 }, upperF: { x: 3, y: 13 }, upperB: { x: 0, y: 13 }, lowerF: { x: 5, y: 10 }, lowerB: { x: 1, y: 10 }, squint: true };
    default: {
      const i = frame - 4;
      const b = (i + 3) % 6;
      const swing = RUN_FOOT[i];
      return {
        ...base,
        bob: i % 3 === 0 ? 1 : 0,
        lean: 1,
        front: { x: RUN_FOOT[i], lift: RUN_LIFT[i] },
        back: { x: RUN_FOOT[b], lift: RUN_LIFT[b] },
        upperF: { x: 2 - swing, y: 8 },
        upperB: { x: -1 + swing, y: 8 },
        lowerF: { x: 3 - Math.round(swing / 2), y: 7 },
        lowerB: { x: -1 + Math.round(swing / 2), y: 7 },
      };
    }
  }
}

function drawLeg(pc: PixelCanvas, hipX: number, hipY: number, foot: Foot, color: number, crouch: number): void {
  const ankleX = hipX + foot.x;
  const ankleY = 44 - foot.lift;
  const kneeX = hipX + Math.round(foot.x * 0.5) + 1 + Math.round(crouch / 2);
  const kneeY = Math.round((hipY + ankleY) / 2);
  pc.line(hipX, hipY, kneeX, kneeY, color, 5);
  pc.line(kneeX, kneeY, ankleX, ankleY, color, 5);
  pc.rect(ankleX - 2, 45 - foot.lift, 7, 3, C.dark);
  pc.rect(ankleX - 2, 45 - foot.lift, 7, 1, C.skin);
}

function drawArm(pc: PixelCanvas, sx: number, sy: number, hand: Hand, upper: boolean, back: boolean): void {
  const skin = back ? C.dark : C.skin;
  const hx = sx + hand.x;
  const hy = sy + hand.y;
  const w = upper ? 4 : 3;
  const f = upper ? 5 : 4;
  // Front arms get a dark edge so they read against the red torso.
  if (!back) {
    pc.line(sx, sy, hx, hy, P.ink, w + 2);
    pc.rect(hx - 3, hy - 3, f + 2, f + 2, P.ink);
  }
  pc.line(sx, sy, hx, hy, skin, w);
  if (!back) pc.line(sx, sy - 1, hx, hy - 1, C.light, 1);
  pc.rect(hx - 2, hy - 2, f, f, back ? C.dark : C.skin);
  pc.rect(hx - 2, hy - 2, f, 1, back ? C.skin : C.light);
}

function drawHead(pc: PixelCanvas, hx: number, hy: number, squint: boolean): void {
  // Topknot.
  pc.rect(hx - 4, hy - 3, 3, 4, C.hair).px(hx - 5, hy - 4, C.hair).px(hx - 3, hy - 4, C.hair);
  pc.rect(hx - 4, hy, 9, 8, C.skin);
  pc.rect(hx - 4, hy, 9, 1, C.light);
  pc.rect(hx - 4, hy + 6, 9, 2, C.dark);
  pc.rect(hx + 5, hy + 3, 1, 4, C.skin);
  // Four eyes, two rows.
  const eye = squint ? C.dark : C.eye;
  pc.rect(hx, hy + 2, 2, 1, eye).rect(hx + 3, hy + 2, 2, 1, eye);
  pc.rect(hx + 1, hy + 4, 2, 1, eye).rect(hx + 4, hy + 4, 1, 1, eye);
  if (squint) pc.rect(hx - 1, hy + 1, 7, 1, P.ink);
  pc.rect(hx + 1, hy + 6, 4, 1, P.ink);
}

function drawFourArms(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  const tx = 24 + p.lean;
  const ty = 16 + p.bob + p.crouch;
  const hipY = 34 + p.bob + Math.round(p.crouch / 2);
  const upF = { x: tx + 7, y: ty + 3 };
  const upB = { x: tx - 6, y: ty + 3 };
  const loF = { x: tx + 6, y: ty + 9 };
  const loB = { x: tx - 5, y: ty + 9 };

  drawArm(pc, upB.x, upB.y, p.upperB, true, true);
  drawArm(pc, loB.x, loB.y, p.lowerB, false, true);
  drawLeg(pc, 21, hipY, p.back, C.pants, p.crouch);

  // V-shaped torso, belt and pants.
  pc.poly(
    [
      [tx - 9, ty + 1],
      [tx + 9, ty + 1],
      [tx + 10, ty + 6],
      [tx + 6, ty + 16],
      [tx - 5, ty + 17],
      [tx - 8, ty + 7],
    ],
    C.skin,
  );
  pc.rect(tx - 9, ty + 1, 3, 6, C.dark);
  pc.hline(tx - 5, tx + 6, ty + 2, C.light);
  // Pecs and a six-pack: a curved chest line and a centre groove with short ridges.
  pc.line(tx - 5, ty + 6, tx + 1, ty + 7, C.dark).line(tx + 1, ty + 7, tx + 7, ty + 5, C.dark);
  pc.vline(tx + 1, ty + 8, ty + 14, C.dark);
  for (const y of [ty + 10, ty + 13]) pc.px(tx - 1, y, C.dark).px(tx + 3, y, C.dark);
  pc.rect(tx - 6, ty + 16, 13, 3, C.pants);
  pc.rect(tx - 6, ty + 16, 13, 1, C.pantsLight);
  pc.rect(tx + 1, ty + 16, 3, 2, P.omnitrix);

  drawLeg(pc, 27, hipY, p.front, C.pantsLight, p.crouch);
  if (!p.headFront) drawHead(pc, tx + 3, ty - 9, p.squint ?? false);
  drawArm(pc, loF.x, loF.y, p.lowerF, false, false);
  drawArm(pc, upF.x, upF.y, p.upperF, true, false);
  if (p.headFront) drawHead(pc, tx + 3, ty - 9, p.squint ?? false);

  pc.outline(P.ink);
}

/** Dial hologram: Four Arms' head with his topknot and four eyes, white for tinting. 16x16. */
function drawIcon(pc: PixelCanvas): void {
  pc.rect(3, 5, 10, 9, P.white);
  pc.rect(2, 7, 12, 5, P.white);
  pc.rect(6, 1, 4, 4, P.white);
  const ctx = pc.ctx;
  for (const [x, y] of [[4, 7], [10, 7], [5, 9], [9, 9]]) ctx.clearRect(pc.ox + x, pc.oy + y, 2, 1);
  ctx.clearRect(pc.ox + 6, pc.oy + 12, 4, 1);
}

/** Two big fists. */
function drawTouchFists(pc: PixelCanvas): void {
  for (const [x, y] of [[1, 2], [7, 8]]) {
    pc.rect(x, y, 8, 6, P.white);
    pc.rect(x + 8, y + 2, 2, 3, P.white);
    for (let k = 1; k < 8; k += 2) pc.px(x + k, y + 1, P.ink);
  }
}

/** A fist driving into cracked ground. */
function drawTouchSlam(pc: PixelCanvas): void {
  pc.rect(5, 1, 6, 7, P.white);
  pc.rect(4, 2, 1, 4, P.white);
  pc.rect(0, 12, 16, 2, P.white);
  pc.line(8, 11, 4, 9, P.white).line(8, 11, 12, 9, P.white);
  pc.px(2, 10, P.white).px(13, 10, P.white).px(8, 9, P.white);
}

export const FOURARMS_ASSETS: AssetDef[] = [
  sheet(FOURARMS_TEX.sheet, FOURARMS_FRAME.w, FOURARMS_FRAME.h, FRAME_COUNT, drawFourArms),
  one(FOURARMS_TEX.icon, 16, 16, drawIcon),
  one(FOURARMS_TEX.touchAttack, 16, 16, drawTouchFists),
  one(FOURARMS_TEX.touchSpecial, 16, 16, drawTouchSlam),
];

export const FOURARMS_ANIMS: AnimDef[] = animsFor('fourarms', FOURARMS_TEX.sheet, FOURARMS_FRAMES, { idle: 5, run: 10, carryRun: 7 }, ['idle', 'run', 'carryRun']);
