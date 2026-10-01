import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';
import { runPose, type ArmPose, type LegPose, type Pose } from './poses';

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
