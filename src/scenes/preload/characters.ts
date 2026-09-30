import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/** Frame layout shared by the placeholder generator and any future real sprite sheets. */
export const BEN_FRAME = { w: 24, h: 28 } as const;
export const BEN_FRAMES = {
  idle: [0, 1],
  run: [2, 3, 4, 5, 6, 7],
  jump: [8],
  fall: [9],
  punch: [10, 11],
  roll: [12, 13, 14, 15],
  hurt: [16],
  watch: [17],
} as const;
export const BEN_FRAME_COUNT = 18;

export const HEATBLAST_FRAME = { w: 32, h: 36 } as const;
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
export const HEATBLAST_FRAME_COUNT = 18;

interface LegPose {
  footX: number;
  lift: number;
}
interface ArmPose {
  hx: number;
  hy: number;
}
interface Pose {
  bob: number;
  lean: number;
  front: LegPose;
  back: LegPose;
  frontArm: ArmPose;
  backArm: ArmPose;
  fist?: boolean;
  eyesClosed?: boolean;
  mouthOpen?: boolean;
  glow?: number;
}

const RUN_FOOT = [3, 1, -1, -3, -1, 1];
const RUN_LIFT = [0, 0, 0, 1, 3, 2];
const RUN_BOB = [1, 0, 0, 1, 0, 0];

function runPose(i: number, stride: number): Pose {
  const b = (i + 3) % 6;
  const fx = Math.round(RUN_FOOT[i] * stride);
  const bx = Math.round(RUN_FOOT[b] * stride);
  return {
    bob: RUN_BOB[i],
    lean: 1,
    front: { footX: fx, lift: RUN_LIFT[i] },
    back: { footX: bx, lift: RUN_LIFT[b] },
    frontArm: { hx: -Math.round(fx * 0.9), hy: 5 - Math.abs(Math.round(fx / 2)) },
    backArm: { hx: -Math.round(bx * 0.9), hy: 5 - Math.abs(Math.round(bx / 2)) },
  };
}

// ---------------------------------------------------------------- Ben

function benPose(frame: number): Pose {
  switch (frame) {
    case 0:
    case 1:
      return {
        bob: frame,
        lean: 0,
        front: { footX: 1, lift: 0 },
        back: { footX: -1, lift: 0 },
        frontArm: { hx: 1, hy: 6 },
        backArm: { hx: -1, hy: 6 },
      };
    case 8:
      return {
        bob: 0,
        lean: 0,
        front: { footX: 2, lift: 3 },
        back: { footX: -2, lift: 1 },
        frontArm: { hx: 2, hy: -5 },
        backArm: { hx: -3, hy: -3 },
      };
    case 9:
      return {
        bob: 0,
        lean: 0,
        front: { footX: 3, lift: 1 },
        back: { footX: -3, lift: 2 },
        frontArm: { hx: 5, hy: -1 },
        backArm: { hx: -4, hy: -2 },
      };
    case 10:
      return {
        bob: 1,
        lean: -1,
        front: { footX: 2, lift: 0 },
        back: { footX: -2, lift: 0 },
        frontArm: { hx: -3, hy: 3 },
        backArm: { hx: 2, hy: 4 },
        fist: true,
      };
    case 11:
      return {
        bob: 1,
        lean: 2,
        front: { footX: 3, lift: 0 },
        back: { footX: -3, lift: 0 },
        frontArm: { hx: 8, hy: 0 },
        backArm: { hx: -3, hy: 4 },
        fist: true,
        mouthOpen: true,
      };
    case 16:
      return {
        bob: 0,
        lean: -2,
        front: { footX: 2, lift: 1 },
        back: { footX: -1, lift: 0 },
        frontArm: { hx: -3, hy: -4 },
        backArm: { hx: -5, hy: -3 },
        eyesClosed: true,
        mouthOpen: true,
      };
    case 17:
      return {
        bob: 0,
        lean: 0,
        front: { footX: 1, lift: 0 },
        back: { footX: -1, lift: 0 },
        frontArm: { hx: 4, hy: -3 },
        backArm: { hx: -1, hy: 6 },
        fist: true,
      };
    default:
      return runPose(frame - 2, 1);
  }
}

export function drawBen(pc: PixelCanvas, frame: number, withWatch: boolean): void {
  if (frame >= 12 && frame <= 15) {
    drawBenRoll(pc, frame - 12, withWatch);
    pc.outline(P.ink);
    return;
  }
  const pose = benPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;

  drawArm(pc, 10 + ux, 13 + uy, pose.backArm, P.shirtShade, P.skin1, false, false, 2);
  drawLeg(pc, 10, 21, pose.back, P.pants0, 3, 24, 2, 4);

  pc.rect(9, 19, 7, 2, P.pants0);
  pc.rect(9, 19, 7, 1, P.pants1);

  // Shirt with Ben's signature black stripe.
  pc.rect(9 + ux, 12 + uy, 7, 7, P.shirt);
  pc.rect(9 + ux, 12 + uy, 2, 7, P.shirtShade);
  pc.rect(12 + ux, 12 + uy, 2, 7, P.stripe);
  pc.rect(9 + ux, 18 + uy, 7, 1, P.shirtShade);

  drawLeg(pc, 13, 21, pose.front, P.pants1, 3, 24, 2, 4);
  drawBenHead(pc, 9 + ux, 3 + uy, pose);
  drawArm(pc, 14 + ux, 13 + uy, pose.frontArm, P.shirt, P.skin0, withWatch, pose.fist ?? false, 2);

  pc.outline(P.ink);
}

function drawBenHead(pc: PixelCanvas, x: number, y: number, pose: Pose): void {
  pc.rect(x, y, 8, 8, P.skin0);
  pc.rect(x, y + 7, 8, 1, P.skin1);
  // Hair: swept brown with spikes and a highlight.
  pc.rect(x, y, 8, 3, P.hair0);
  pc.rect(x, y, 3, 6, P.hair0);
  pc.rect(x + 3, y + 3, 1, 1, P.hair0);
  pc.px(x + 1, y - 1, P.hair0).px(x + 3, y - 1, P.hair0).px(x + 5, y - 1, P.hair0).px(x + 2, y - 2, P.hair0);
  pc.px(x + 7, y + 3, P.hair0);
  pc.rect(x + 3, y, 3, 1, P.hair1).px(x + 2, y - 1, P.hair1);
  // Face (facing right).
  pc.px(x + 2, y + 5, P.skin1).px(x + 2, y + 4, P.skin1);
  if (pose.eyesClosed) {
    pc.rect(x + 5, y + 4, 2, 1, P.ink);
  } else {
    pc.rect(x + 5, y + 4, 1, 2, P.ink);
    pc.px(x + 6, y + 4, 0x3fae52);
  }
  pc.px(x + 7, y + 5, P.skin1);
  if (pose.mouthOpen) pc.rect(x + 5, y + 6, 2, 1, 0x7a2a2a);
  else pc.px(x + 6, y + 6, P.skin1);
}

function drawLeg(
  pc: PixelCanvas,
  hipX: number,
  hipY: number,
  leg: LegPose,
  color: number,
  width: number,
  ankleBase: number,
  shoeH: number,
  shoeW: number,
): void {
  const ankleY = ankleBase - leg.lift;
  const rows = Math.max(1, ankleY - hipY);
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const x = hipX + Math.round(leg.footX * t);
    pc.rect(x, hipY + r, width, 1, color);
  }
  const fx = hipX + leg.footX;
  pc.rect(fx, ankleY + 1, shoeW, shoeH, P.shoe);
  pc.rect(fx, ankleY + shoeH, shoeW, 1, 0xd8dbe6);
}

function drawArm(
  pc: PixelCanvas,
  sx: number,
  sy: number,
  arm: ArmPose,
  sleeve: number,
  skin: number,
  watch: boolean,
  fist: boolean,
  thickness: number,
): void {
  const hx = sx + arm.hx;
  const hy = sy + arm.hy;
  const len = Math.max(1, Math.hypot(arm.hx, arm.hy));
  const steps = Math.ceil(len);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(sx + arm.hx * t);
    const y = Math.round(sy + arm.hy * t);
    pc.rect(x, y, thickness, thickness, i < 2 ? sleeve : skin);
  }
  if (watch) {
    const wx = Math.round(sx + arm.hx * 0.72);
    const wy = Math.round(sy + arm.hy * 0.72);
    pc.rect(wx, wy, 2, 2, P.ink);
    pc.px(wx, wy, P.omnitrix);
  }
  const f = fist ? 3 : 2;
  pc.rect(hx - (f === 3 ? 0 : 0), hy, f, f, skin);
}

function drawBenRoll(pc: PixelCanvas, i: number, withWatch: boolean): void {
  const cx = 12;
  const cy = 20;
  const r = 7;
  const angle = (i * Math.PI) / 2;
  // A curled-up Ben: sectors of hair, skin, shirt and pants rotating as he tumbles.
  const sectors = [P.hair0, P.shirt, P.pants1, P.shirt];
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r + r * 0.6) continue;
      const a = Math.atan2(y, x) - angle + Math.PI * 2;
      const sector = Math.floor(((a + Math.PI / 4) % (Math.PI * 2)) / (Math.PI / 2)) % 4;
      pc.px(cx + x, cy + y, sectors[sector]);
    }
  }
  const sx = Math.round(cx + Math.cos(angle + Math.PI) * 3);
  const sy = Math.round(cy + Math.sin(angle + Math.PI) * 3);
  pc.rect(sx - 1, sy - 1, 2, 2, P.stripe);
  if (withWatch) {
    const wx = Math.round(cx + Math.cos(angle + Math.PI / 2) * 5);
    const wy = Math.round(cy + Math.sin(angle + Math.PI / 2) * 5);
    pc.px(wx, wy, P.omnitrix);
  }
}

// ---------------------------------------------------------------- Heatblast

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
