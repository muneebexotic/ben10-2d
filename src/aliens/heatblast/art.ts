import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';
import { runPose, type ArmPose, type LegPose, type Pose } from '../../scenes/preload/poses';

/** Heatblast's textures. The keys are what Preload loads; add a `url` to an entry to use real art. */
export const HEATBLAST_TEX = {
  sheet: 'heatblast',
  icon: 'ui-icon-heatblast',
  touchAttack: 'ui-touch-fire',
  touchSpecial: 'ui-touch-burst',
} as const;

export const HEATBLAST_FRAME = { w: 32, h: 36, feetY: 35 } as const;
export const HEATBLAST_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7, 8, 9],
  jump: [10],
  fall: [11],
  shoot: [12, 13],
  charge: [14, 15],
  rocket: [16],
  hurt: [17],
} as const;
const FRAME_COUNT = 18;

const FLAME_PATTERNS = [
  [3, 5, 7, 6, 8, 7, 5, 6, 4, 2],
  [2, 6, 6, 8, 7, 8, 6, 5, 3, 3],
  [3, 4, 7, 7, 6, 9, 7, 4, 5, 2],
  [2, 5, 8, 6, 8, 6, 8, 6, 3, 2],
];

function heatblastPose(frame: number): Pose {
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return {
        bob: frame >= 2 ? 1 : 0,
        lean: 0,
        front: { footX: 2, lift: 0 },
        back: { footX: -2, lift: 0 },
        frontArm: { hx: 2, hy: 8 },
        backArm: { hx: -2, hy: 8 },
      };
    case 10:
      return {
        bob: 0,
        lean: 0,
        front: { footX: 3, lift: 4 },
        back: { footX: -2, lift: 2 },
        frontArm: { hx: 4, hy: -6 },
        backArm: { hx: -4, hy: -4 },
      };
    case 11:
      return {
        bob: 0,
        lean: 0,
        front: { footX: 4, lift: 1 },
        back: { footX: -4, lift: 2 },
        frontArm: { hx: 7, hy: -2 },
        backArm: { hx: -6, hy: -3 },
      };
    case 12:
    case 13:
      return {
        bob: 0,
        lean: frame === 12 ? 1 : -1,
        front: { footX: 4, lift: 0 },
        back: { footX: -4, lift: 0 },
        frontArm: { hx: frame === 12 ? 10 : 8, hy: 0 },
        backArm: { hx: -3, hy: 6 },
        fist: true,
        glow: frame === 12 ? 2 : 1,
      };
    case 14:
    case 15:
      return {
        bob: 1,
        lean: 0,
        front: { footX: 4, lift: 0 },
        back: { footX: -4, lift: 0 },
        frontArm: { hx: -2, hy: 4 },
        backArm: { hx: 3, hy: 4 },
        glow: frame === 14 ? 2 : 3,
      };
    case 16:
      return {
        bob: 0,
        lean: 0,
        front: { footX: 1, lift: 0 },
        back: { footX: -1, lift: 0 },
        frontArm: { hx: 3, hy: 9 },
        backArm: { hx: -4, hy: 8 },
        glow: 2,
      };
    case 17:
      return {
        bob: 0,
        lean: -2,
        front: { footX: 3, lift: 2 },
        back: { footX: -2, lift: 0 },
        frontArm: { hx: -4, hy: -5 },
        backArm: { hx: -6, hy: -3 },
        eyesClosed: true,
      };
    default: {
      const pose = runPose(frame - 4, 1.4);
      pose.frontArm = { hx: pose.frontArm.hx, hy: pose.frontArm.hy + 2 };
      pose.backArm = { hx: pose.backArm.hx, hy: pose.backArm.hy + 2 };
      return pose;
    }
  }
}

export function drawHeatblast(pc: PixelCanvas, frame: number): void {
  const pose = heatblastPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;
  const glow = pose.glow ?? 0;
  const flames = FLAME_PATTERNS[frame % FLAME_PATTERNS.length];

  drawMagmaArm(pc, 11 + ux, 14 + uy, pose.backArm, P.magma0, false);
  drawMagmaLeg(pc, 12, 24, pose.back, P.magma0);

  // Torso: broad magma chest tapering to the waist.
  pc.poly(
    [
      [10 + ux, 13 + uy],
      [22 + ux, 13 + uy],
      [21 + ux, 19 + uy],
      [20, 24],
      [12, 24],
      [11 + ux, 19 + uy],
    ],
    P.magma1,
  );
  pc.rect(12 + ux, 14 + uy, 2, 8, P.magma0);
  // Glowing cracks and core.
  const crack = glow >= 2 ? P.fire1 : P.fire2;
  pc.line(13 + ux, 15 + uy, 15 + ux, 19 + uy, crack);
  pc.line(19 + ux, 15 + uy, 17 + ux, 19 + uy, crack);
  pc.line(16 + ux, 20 + uy, 16, 23, P.fire3);
  pc.rect(15 + ux, 18 + uy, 3, 2, glow >= 1 ? P.fire0 : P.fire1);
  if (glow >= 3) pc.rect(14 + ux, 17 + uy, 5, 4, P.fire0);
  // Shoulder boulders.
  pc.rect(9 + ux, 12 + uy, 4, 3, P.magma0);
  pc.rect(19 + ux, 12 + uy, 4, 3, P.magma0);
  pc.px(10 + ux, 12 + uy, P.fire3).px(21 + ux, 12 + uy, P.fire3);

  drawMagmaLeg(pc, 17, 24, pose.front, P.magma1);
  drawHeatblastHead(pc, 12 + ux, 5 + uy, pose, flames, glow);
  drawMagmaArm(pc, 20 + ux, 14 + uy, pose.frontArm, P.magma1, pose.fist ?? false);

  if (frame === 16) {
    // Rocket frame: jets of fire under both feet.
    pc.rect(12, 34, 4, 2, P.fire1).rect(17, 34, 4, 2, P.fire1);
    pc.rect(13, 34, 2, 2, P.fire0).rect(18, 34, 2, 2, P.fire0);
  }

  pc.outline(0x2a0806);
}

function drawHeatblastHead(pc: PixelCanvas, x: number, y: number, pose: Pose, flames: number[], glow: number): void {
  // Flame crown, drawn first so the face sits in front.
  for (let i = 0; i < flames.length; i++) {
    const h = flames[i];
    const cx = x - 1 + i;
    for (let k = 0; k < h; k++) {
      const yy = y + 2 - k;
      const t = k / h;
      const color = t < 0.35 ? P.fire1 : t < 0.7 ? P.fire2 : P.fire3;
      pc.px(cx, yy, color);
    }
    if (h > 5 && i > 1 && i < 8) pc.px(cx, y + 1, P.fire0);
  }
  pc.rect(x, y + 1, 8, 7, P.fire2);
  pc.rect(x + 1, y + 1, 6, 3, P.fire1);
  pc.rect(x, y + 6, 8, 2, P.fire3);
  pc.rect(x + 1, y + 7, 6, 1, P.magma1);
  if (pose.eyesClosed) {
    pc.rect(x + 3, y + 4, 2, 1, P.ink).rect(x + 6, y + 4, 2, 1, P.ink);
  } else {
    pc.rect(x + 3, y + 3, 2, 2, P.ink).rect(x + 6, y + 3, 2, 2, P.ink);
    pc.px(x + 4, y + 3, glow >= 2 ? P.fire0 : P.fire1).px(x + 7, y + 3, glow >= 2 ? P.fire0 : P.fire1);
  }
  pc.rect(x + 4, y + 6, 4, 1, P.ink);
}

function drawMagmaArm(pc: PixelCanvas, sx: number, sy: number, arm: ArmPose, color: number, fist: boolean): void {
  const steps = Math.ceil(Math.max(1, Math.hypot(arm.hx, arm.hy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pc.rect(Math.round(sx + arm.hx * t), Math.round(sy + arm.hy * t), 3, 3, color);
  }
  const hx = sx + arm.hx;
  const hy = sy + arm.hy;
  const s = fist ? 4 : 3;
  pc.rect(hx, hy, s, s, P.fire2);
  pc.rect(hx + 1, hy + 1, s - 2, s - 2, P.fire0);
}

function drawMagmaLeg(pc: PixelCanvas, hipX: number, hipY: number, leg: LegPose, color: number): void {
  const ankleY = 31 - leg.lift;
  const rows = Math.max(1, ankleY - hipY);
  for (let r = 0; r <= rows; r++) {
    const x = hipX + Math.round(leg.footX * (r / rows));
    pc.rect(x, hipY + r, 4, 1, color);
    if (r % 3 === 1) pc.px(x + 1, hipY + r, P.fire3);
  }
  const fx = hipX + leg.footX;
  pc.rect(fx - 1, ankleY + 1, 6, 3, P.magma0);
  pc.rect(fx, ankleY + 3, 5, 1, P.fire3);
}

/** Alien head icon for the dial, drawn in one colour so it can be tinted as a hologram. */
function drawIcon(pc: PixelCanvas): void {
  const flames = [3, 5, 4, 6, 5, 6, 4, 5, 3];
  for (let i = 0; i < flames.length; i++) pc.vline(3 + i, 7 - flames[i], 6, P.white);
  pc.rect(4, 6, 8, 8, P.white);
  const ctx = pc.ctx;
  ctx.clearRect(pc.ox + 5, pc.oy + 9, 2, 2);
  ctx.clearRect(pc.ox + 9, pc.oy + 9, 2, 2);
  ctx.clearRect(pc.ox + 6, pc.oy + 12, 4, 1);
}

/** Touch button icons: white so they tint with the button. 16x16. */
function drawTouchFire(pc: PixelCanvas): void {
  pc.circle(9, 9, 4, P.white);
  pc.poly([[5, 9], [0, 6], [2, 9], [0, 12]], P.white);
  pc.px(10, 8, P.ink).px(9, 9, P.ink);
}

function drawTouchBurst(pc: PixelCanvas): void {
  pc.circle(8, 8, 3, P.white);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pc.rect(8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, 2, 2, P.white);
  }
}

export const HEATBLAST_ASSETS: AssetDef[] = [
  sheet(HEATBLAST_TEX.sheet, HEATBLAST_FRAME.w, HEATBLAST_FRAME.h, FRAME_COUNT, drawHeatblast),
  one(HEATBLAST_TEX.icon, 16, 16, drawIcon),
  one(HEATBLAST_TEX.touchAttack, 16, 16, drawTouchFire),
  one(HEATBLAST_TEX.touchSpecial, 16, 16, drawTouchBurst),
];

export const HEATBLAST_ANIMS: AnimDef[] = animsFor(
  'heatblast',
  HEATBLAST_TEX.sheet,
  HEATBLAST_FRAMES,
  { idle: 8, run: 14, shoot: 18, charge: 12 },
  ['idle', 'run', 'charge'],
);
