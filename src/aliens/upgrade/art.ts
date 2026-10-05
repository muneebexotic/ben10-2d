import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { runPose, type ArmPose, type LegPose, type Pose } from '../../scenes/preload/poses';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Upgrade's textures. Add a `url` to an entry to load real art instead. */
export const UPGRADE_TEX = {
  sheet: 'upgrade',
  icon: 'ui-icon-upgrade',
  touchAttack: 'ui-touch-eyebeam',
  touchSpecial: 'ui-touch-merge',
  portrait: 'portrait-upgrade',
} as const;

export const UPGRADE_COLORS = {
  body: P.upgradeBody,
  body2: P.upgradeBody2,
  sheen: 0x464d63,
  line: P.upgrade,
  glow: P.upgradeGlow,
  dark: P.upgradeDark,
  /** A dark teal rim, so a black body still reads against a dark subway. */
  rim: 0x0f5a48,
  pupil: 0x04060a,
} as const;

const C = UPGRADE_COLORS;

/** A lanky frame: the dome head sits high. Feet on row 37. */
export const UPGRADE_FRAME = { w: 32, h: 38, feetY: 37 } as const;
export const UPGRADE_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7, 8, 9],
  jump: [10],
  fall: [11],
  laser: [12, 13],
  laserUp: [14],
  laserDown: [15],
  hurt: [16],
  merge: [17, 18, 19, 18],
} as const;
const FRAME_COUNT = 20;
const ANKLE = 34;

interface UpgradePose extends Pose {
  /** Head tilt for aiming the eye: -1 up, 1 down. */
  tilt?: number;
  /** 0 calm, 1 bright, 2 firing. */
  eye?: number;
}

function upgradePose(frame: number): UpgradePose {
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return {
        bob: frame === 1 || frame === 2 ? 1 : 0,
        lean: 0,
        front: { footX: 2, lift: 0 },
        back: { footX: -2, lift: 0 },
        frontArm: { hx: 2, hy: 8 + (frame === 2 ? 1 : 0) },
        backArm: { hx: -2, hy: 8 },
        eye: frame === 3 ? 1 : 0,
      };
    case 10:
      return { bob: 0, lean: 0, front: { footX: 3, lift: 4 }, back: { footX: -2, lift: 2 }, frontArm: { hx: 5, hy: -5 }, backArm: { hx: -5, hy: -3 } };
    case 11:
      return { bob: 0, lean: 0, front: { footX: 4, lift: 1 }, back: { footX: -4, lift: 2 }, frontArm: { hx: 7, hy: -1 }, backArm: { hx: -6, hy: -2 } };
    case 12:
    case 13:
      return {
        bob: 0,
        lean: frame === 12 ? 1 : 0,
        front: { footX: 4, lift: 0 },
        back: { footX: -4, lift: 0 },
        frontArm: { hx: -3, hy: 7 },
        backArm: { hx: -5, hy: 5 },
        eye: frame === 12 ? 2 : 1,
      };
    case 14:
      return { bob: 0, lean: -1, front: { footX: 3, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: -3, hy: 6 }, backArm: { hx: -5, hy: 4 }, eye: 2, tilt: -1 };
    case 15:
      return { bob: 0, lean: 1, front: { footX: 4, lift: 2 }, back: { footX: -3, lift: 1 }, frontArm: { hx: 4, hy: -3 }, backArm: { hx: -5, hy: -2 }, eye: 2, tilt: 1 };
    case 16:
      return { bob: 0, lean: -2, front: { footX: 3, lift: 2 }, back: { footX: -2, lift: 0 }, frontArm: { hx: -5, hy: -4 }, backArm: { hx: -6, hy: -2 }, eyesClosed: true };
    default: {
      const pose: UpgradePose = runPose(frame - 4, 1.5);
      pose.frontArm = { hx: pose.frontArm.hx, hy: pose.frontArm.hy + 2 };
      pose.backArm = { hx: pose.backArm.hx, hy: pose.backArm.hy + 2 };
      return pose;
    }
  }
}

/** A circuit trace along a limb: a dark green line with bright nodes, one of them lit by the pulse. */
function trace(pc: PixelCanvas, sx: number, sy: number, dx: number, dy: number, pulse: number): void {
  const steps = Math.max(1, Math.round(Math.hypot(dx, dy)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const node = i % 3 === 0;
    const lit = node && (i / 3 + pulse) % 3 === 0;
    pc.px(Math.round(sx + dx * t), Math.round(sy + dy * t), lit ? C.glow : node ? C.line : C.dark);
  }
}

function drawArm(pc: PixelCanvas, sx: number, sy: number, arm: ArmPose, color: number, pulse: number, front: boolean): void {
  const steps = Math.ceil(Math.max(1, Math.hypot(arm.hx, arm.hy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pc.rect(Math.round(sx + arm.hx * t), Math.round(sy + arm.hy * t), 2, 2, color);
  }
  if (front) trace(pc, sx, sy, arm.hx, arm.hy, pulse);
  // Rounded fingertips, like dripping metal.
  const hx = sx + arm.hx;
  const hy = sy + arm.hy;
  pc.rect(hx - 1, hy, 3, 3, color);
  pc.px(hx, hy + 1, front ? C.line : C.dark);
}

function drawLeg(pc: PixelCanvas, hipX: number, hipY: number, leg: LegPose, color: number, pulse: number, front: boolean): void {
  const ankleY = ANKLE - leg.lift;
  const rows = Math.max(1, ankleY - hipY);
  for (let r = 0; r <= rows; r++) {
    const x = hipX + Math.round(leg.footX * (r / rows));
    pc.rect(x, hipY + r, 3, 1, color);
  }
  if (front) trace(pc, hipX + 1, hipY, leg.footX, rows, pulse + 1);
  const fx = hipX + leg.footX;
  pc.rect(fx - 1, ankleY + 1, 5, 2, color);
  pc.px(fx + 3, ankleY + 2, front ? C.line : C.dark);
}

/** The dome head with its one big eye: a green ring around a black pupil. */
function drawHead(pc: PixelCanvas, x: number, y: number, pose: UpgradePose, pulse: number): void {
  const tilt = pose.tilt ?? 0;
  pc.ellipse(x, y, 6, 6, C.body);
  pc.ellipse(x - 1, y - 2, 4, 3, C.body2);
  pc.px(x - 3, y - 4, C.sheen).px(x - 2, y - 5, C.sheen);
  // Neck.
  pc.rect(x - 2, y + 5, 3, 3, C.body);
  // Circuits running back over the skull from the eye.
  for (let i = 0; i < 3; i++) pc.px(x - 2 - i * 2, y - 3 + i, (i + pulse) % 3 === 0 ? C.glow : C.line);
  pc.px(x - 5, y + 1, C.line).px(x - 4, y + 3, C.dark);
  const ex = x + 3;
  const ey = y + tilt * 2;
  const eye = pose.eye ?? 0;
  if (pose.eyesClosed) {
    pc.rect(ex - 2, ey, 5, 1, C.line);
    return;
  }
  pc.circle(ex, ey, 3, eye >= 2 ? C.glow : C.line);
  pc.circle(ex, ey, 2, C.pupil);
  pc.rect(ex, ey - 1, 2, 2, eye >= 1 ? C.glow : C.line);
  pc.px(ex + 1, ey - 1, P.white);
}

function drawPuddle(pc: PixelCanvas, stage: number): void {
  if (stage === 0) {
    // Melting: the body slumps into a blob, the eye riding on top.
    pc.ellipse(16, 33, 9, 4, C.body);
    pc.poly([[12, 33], [13, 26], [16, 24], [19, 26], [20, 33]], C.body);
    pc.ellipse(15, 27, 2, 2, C.body2);
    pc.circle(19, 27, 2, C.line);
    pc.rect(19, 26, 2, 2, C.pupil);
    pc.px(20, 26, C.glow);
    for (const [x, y] of [[9, 34], [13, 31], [22, 33], [16, 29]] as const) pc.px(x, y, C.line);
    return;
  }
  // A flat puddle of liquid metal sliding along, the eye peeking out of the front.
  const rx = stage === 1 ? 11 : 12;
  pc.ellipse(15, 35, rx, stage === 1 ? 2 : 1, C.body);
  pc.rect(4, 35, 22, 2, C.body);
  pc.hline(6, 22, 34, C.body2);
  const ex = stage === 1 ? 23 : 24;
  pc.circle(ex, 33, 2, C.line);
  pc.rect(ex, 32, 2, 2, C.pupil);
  pc.px(ex + 1, 32, C.glow);
  // Circuit dots ripple through the puddle.
  for (let x = 5 + stage; x < 22; x += 3) pc.px(x, 36, (x + stage) % 2 === 0 ? C.line : C.dark);
  pc.px(2, 36, C.body).px(1, 36, C.dark);
}

function drawUpgrade(pc: PixelCanvas, frame: number): void {
  if (frame >= 17) {
    drawPuddle(pc, frame - 17);
    pc.outline(C.rim);
    return;
  }
  const pose = upgradePose(frame);
  const ux = pose.lean;
  const uy = pose.bob;
  const pulse = frame % 4;

  drawArm(pc, 13 + ux, 17 + uy, pose.backArm, C.body2, pulse, false);
  drawLeg(pc, 12, 26, pose.back, C.body2, pulse, false);

  // A slim, slightly hunched torso of liquid metal.
  pc.poly(
    [
      [11 + ux, 16 + uy],
      [20 + ux, 16 + uy],
      [19 + ux, 22 + uy],
      [18, 27],
      [13, 27],
      [12 + ux, 22 + uy],
    ],
    C.body,
  );
  pc.vline(12 + ux, 17 + uy, 22 + uy, C.sheen);
  // The chest circuit: a spine of light with branches, the Omnitrix symbol at its heart.
  pc.vline(16 + ux, 17 + uy, 26, C.line);
  pc.line(16 + ux, 19 + uy, 19 + ux, 21 + uy, C.line);
  pc.line(16 + ux, 23 + uy, 13 + ux, 25, C.line);
  pc.px(16 + ux, 17 + uy + ((pulse * 3) % 9), C.glow);
  pc.rect(15 + ux, 20 + uy, 3, 3, P.omnitrix);
  pc.px(16 + ux, 21 + uy, P.white);

  drawLeg(pc, 16, 26, pose.front, C.body, pulse, true);
  drawHead(pc, 16 + ux, 9 + uy, pose, pulse);
  drawArm(pc, 18 + ux, 17 + uy, pose.frontArm, C.body, pulse, true);

  pc.outline(C.rim);
}

/** Clears a filled circle (icons are white shapes with holes, so they tint cleanly). */
function clearCircle(pc: PixelCanvas, cx: number, cy: number, r: number): void {
  for (let y = -r; y <= r; y++) {
    const span = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
    pc.ctx.clearRect(pc.ox + cx - span, pc.oy + cy + y, span * 2 + 1, 1);
  }
}

/** Dial hologram: the dome head and its ring eye. 16x16, white for tinting. */
function drawIcon(pc: PixelCanvas): void {
  pc.ellipse(7, 7, 6, 6, P.white);
  pc.rect(5, 12, 4, 3, P.white);
  clearCircle(pc, 10, 7, 3);
  pc.circle(10, 7, 1, P.white);
  pc.ctx.clearRect(pc.ox + 2, pc.oy + 5, 2, 1);
  pc.ctx.clearRect(pc.ox + 3, pc.oy + 8, 2, 1);
}

/** An eye firing a beam. */
function drawTouchEyeBeam(pc: PixelCanvas): void {
  pc.circle(4, 8, 3, P.white);
  clearCircle(pc, 4, 8, 1);
  pc.rect(8, 7, 8, 2, P.white);
  pc.px(9, 5, P.white).px(9, 10, P.white);
}

/** A drip melting into a puddle, with an arrow: flow into it. */
function drawTouchMerge(pc: PixelCanvas): void {
  pc.poly([[5, 2], [8, 7], [8, 9], [2, 9], [2, 7]], P.white);
  pc.rect(1, 12, 14, 2, P.white);
  pc.rect(3, 11, 10, 1, P.white);
  pc.line(10, 4, 14, 8, P.white).line(14, 8, 10, 8, P.white);
}

/** Dialogue portrait (48x48): the dome and the great green eye filling the frame. */
function drawPortrait(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x061a16);
  for (let y = 0; y < 48; y += 2) pc.rect(0, y, 48, 1, 0x000000, 0.12);
  for (let i = 0; i < 6; i++) pc.hline(0, 47, 6 + i * 8, 0x0a2a22);
  pc.ellipse(24, 26, 19, 20, C.body);
  pc.ellipse(19, 18, 10, 8, C.body2);
  pc.line(9, 14, 15, 9, C.sheen, 2);
  pc.circle(30, 25, 10, C.line);
  pc.circle(30, 25, 7, C.pupil);
  pc.circle(30, 25, 2, C.glow);
  pc.rect(32, 20, 3, 3, P.white);
  for (const [x0, y0, x1, y1] of [[20, 25, 8, 25], [22, 33, 12, 41], [24, 15, 18, 6], [30, 36, 30, 46]] as const) pc.line(x0, y0, x1, y1, C.line);
  for (const [x, y] of [[8, 25], [12, 41], [18, 6], [30, 46]] as const) pc.rect(x - 1, y - 1, 3, 3, C.glow);
  pc.outline(C.rim);
}

export const UPGRADE_ASSETS: AssetDef[] = [
  one(UPGRADE_TEX.portrait, 48, 48, drawPortrait),
  sheet(UPGRADE_TEX.sheet, UPGRADE_FRAME.w, UPGRADE_FRAME.h, FRAME_COUNT, drawUpgrade),
  one(UPGRADE_TEX.icon, 16, 16, drawIcon),
  one(UPGRADE_TEX.touchAttack, 16, 16, drawTouchEyeBeam),
  one(UPGRADE_TEX.touchSpecial, 16, 16, drawTouchMerge),
];

export const UPGRADE_ANIMS: AnimDef[] = animsFor('upgrade', UPGRADE_TEX.sheet, UPGRADE_FRAMES, { idle: 6, run: 14, laser: 20, merge: 14 }, ['idle', 'run', 'merge']);
