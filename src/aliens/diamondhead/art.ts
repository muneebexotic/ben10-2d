import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { runPose, type ArmPose, type LegPose, type Pose } from '../../scenes/preload/poses';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Diamondhead's textures. Add a `url` to an entry to load real art instead. */
export const DIAMONDHEAD_TEX = {
  sheet: 'diamondhead',
  icon: 'ui-icon-diamondhead',
  touchAttack: 'ui-touch-shards',
  touchSpecial: 'ui-touch-shield',
  portrait: 'portrait-diamondhead',
  back: 'diamondhead-back',
} as const;

export const DIAMONDHEAD_COLORS = {
  glow: P.diamondheadGlow,
  light: 0x9af0ff,
  main: 0x5ad0f0,
  shade: 0x2a90c0,
  deep: P.diamondheadDark,
  core: P.diamondheadDeep,
  suit: 0x161c2a,
  suit2: 0x283246,
  eye: 0xa8ffd8,
  rim: 0x08202e,
} as const;

const C = DIAMONDHEAD_COLORS;

/** Tall and blocky: the gem head peaks at the top. Feet on row 41. */
export const DIAMONDHEAD_FRAME = { w: 42, h: 42, feetY: 41 } as const;
export const DIAMONDHEAD_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7, 8, 9],
  jump: [10],
  fall: [11],
  shoot: [12, 13],
  shootUp: [14],
  shield: [15],
  shieldUp: [16],
  shieldDown: [17],
  grow: [18],
  spikes: [19],
  hurt: [20],
} as const;
const FRAME_COUNT = 21;
const ANKLE = 38;
const CX = 18;

interface DiamondPose extends Pose {
  /** -1 up, 0 level, 1 down: the shield's tilt (frames 15-17). */
  shield?: -1 | 0 | 1;
  /** A crystal forming at the front hand (shooting). */
  charge?: boolean;
  /** Fists down at the ground (the spike burst). */
  slam?: boolean;
}

function diamondPose(frame: number): DiamondPose {
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return { bob: frame === 1 || frame === 2 ? 1 : 0, lean: 0, front: { footX: 3, lift: 0 }, back: { footX: -3, lift: 0 }, frontArm: { hx: 3, hy: 10 }, backArm: { hx: -3, hy: 10 } };
    case 10:
      return { bob: 0, lean: 0, front: { footX: 4, lift: 5 }, back: { footX: -2, lift: 2 }, frontArm: { hx: 6, hy: -4 }, backArm: { hx: -6, hy: -2 } };
    case 11:
      return { bob: 0, lean: 0, front: { footX: 4, lift: 1 }, back: { footX: -4, lift: 3 }, frontArm: { hx: 8, hy: 0 }, backArm: { hx: -7, hy: -1 } };
    case 12:
    case 13:
      return { bob: 0, lean: 1, front: { footX: 4, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: 11, hy: 1 }, backArm: { hx: -4, hy: 8 }, charge: frame === 12 };
    case 14:
      return { bob: 0, lean: 0, front: { footX: 4, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: 9, hy: -8 }, backArm: { hx: -4, hy: 8 }, charge: true };
    case 15:
      return { bob: 0, lean: 1, front: { footX: 5, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: 8, hy: 2 }, backArm: { hx: 7, hy: 6 }, shield: 0 };
    case 16:
      return { bob: 0, lean: 0, front: { footX: 5, lift: 0 }, back: { footX: -4, lift: 0 }, frontArm: { hx: 8, hy: -3 }, backArm: { hx: 7, hy: 1 }, shield: -1 };
    case 17:
      return { bob: 1, lean: 1, front: { footX: 5, lift: 0 }, back: { footX: -5, lift: 0 }, frontArm: { hx: 8, hy: 6 }, backArm: { hx: 7, hy: 9 }, shield: 1 };
    case 18:
      return { bob: 0, lean: -1, front: { footX: 4, lift: 0 }, back: { footX: -3, lift: 0 }, frontArm: { hx: 8, hy: -9 }, backArm: { hx: -4, hy: 8 }, charge: true };
    case 19:
      return { bob: 3, lean: 1, front: { footX: 6, lift: 0 }, back: { footX: -6, lift: 0 }, frontArm: { hx: 6, hy: 14 }, backArm: { hx: -5, hy: 14 }, slam: true };
    case 20:
      return { bob: 0, lean: -2, front: { footX: 3, lift: 2 }, back: { footX: -2, lift: 0 }, frontArm: { hx: -6, hy: -2 }, backArm: { hx: -7, hy: 0 }, eyesClosed: true };
    default:
      return runPose(frame - 4, 1.6);
  }
}

/** A faceted crystal limb: a light edge on top, the main colour, a shaded edge under. */
function drawArm(pc: PixelCanvas, sx: number, sy: number, arm: ArmPose, front: boolean): void {
  const steps = Math.ceil(Math.max(1, Math.hypot(arm.hx, arm.hy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(sx + arm.hx * t);
    const y = Math.round(sy + arm.hy * t);
    pc.rect(x, y, 3, 3, front ? C.main : C.shade);
    pc.px(x, y, front ? C.light : C.main);
  }
  // A blocky crystal fist.
  const hx = sx + arm.hx;
  const hy = sy + arm.hy;
  pc.rect(hx - 1, hy, 4, 4, front ? C.main : C.shade);
  pc.px(hx, hy, front ? C.glow : C.light).px(hx + 2, hy + 3, C.deep);
}

function drawLeg(pc: PixelCanvas, hipX: number, hipY: number, leg: LegPose, front: boolean): void {
  const ankleY = ANKLE - leg.lift;
  const rows = Math.max(1, ankleY - hipY);
  for (let r = 0; r <= rows; r++) {
    const x = hipX + Math.round(leg.footX * (r / rows));
    pc.rect(x, hipY + r, 4, 1, front ? C.suit2 : C.suit);
    // Crystal shin guards.
    if (r > rows * 0.5) pc.px(x + 3, hipY + r, front ? C.main : C.shade);
  }
  const fx = hipX + leg.footX;
  pc.rect(fx - 1, ankleY + 1, 6, 2, front ? C.main : C.shade);
  pc.hline(fx - 1, fx + 4, ankleY + 1, front ? C.light : C.main);
  pc.px(fx + 5, ankleY + 2, C.deep);
}

/** The gem head: a tall faceted crystal peaking at the top, with a hard brow over glowing eyes. */
function drawHead(pc: PixelCanvas, x: number, y: number, pose: DiamondPose): void {
  // Outer gem.
  pc.poly([[x - 6, y + 4], [x - 4, y - 5], [x, y - 11], [x + 4, y - 6], [x + 7, y + 2], [x + 5, y + 9], [x - 4, y + 9]], C.main);
  // Facets: a bright left plane, a shaded right plane, a ridge down the middle.
  pc.poly([[x - 5, y + 3], [x - 3, y - 5], [x, y - 10], [x - 1, y + 2]], C.light);
  pc.poly([[x + 1, y - 9], [x + 4, y - 5], [x + 6, y + 2], [x + 2, y + 1]], C.shade);
  pc.line(x, y - 10, x - 1, y + 2, C.glow);
  pc.px(x - 2, y - 4, C.glow).px(x - 3, y - 2, C.glow);
  // The face: a dark band with two eyes and a jutting jaw.
  pc.rect(x - 2, y + 2, 9, 4, C.core);
  if (pose.eyesClosed) pc.hline(x + 1, x + 5, y + 4, C.eye);
  else {
    pc.rect(x + 1, y + 3, 2, 2, C.eye).rect(x + 5, y + 3, 2, 2, C.eye);
    pc.px(x + 1, y + 3, P.white).px(x + 5, y + 3, P.white);
  }
  pc.poly([[x - 2, y + 6], [x + 7, y + 6], [x + 6, y + 9], [x - 1, y + 9]], C.shade);
  pc.hline(x - 1, x + 6, y + 6, C.light);
}

/** Crystal growths out of the shoulders and back: his silhouette. */
function drawSpikes(pc: PixelCanvas, x: number, y: number): void {
  pc.poly([[x - 9, y + 4], [x - 13, y - 9], [x - 6, y + 2]], C.shade);
  pc.poly([[x - 7, y + 3], [x - 9, y - 6], [x - 4, y + 2]], C.main);
  pc.line(x - 12, y - 7, x - 8, y + 2, C.light);
  pc.poly([[x + 6, y + 3], [x + 10, y - 4], [x + 9, y + 4]], C.main);
  pc.line(x + 9, y - 3, x + 8, y + 3, C.glow);
  pc.poly([[x - 4, y + 2], [x - 5, y - 4], [x - 1, y + 2]], C.light);
}

/** A big hexagonal crystal plate held out in front (the shield), tilted up or down. */
function drawShield(pc: PixelCanvas, x: number, y: number, tilt: number): void {
  const top = y - 14 + tilt * 3;
  const bottom = y + 14 + tilt * 3;
  const lean = -tilt * 4;
  const pts: Array<[number, number]> = [
    [x + lean, top],
    [x + 5 + lean, top + 4],
    [x + 6, y + tilt * 3],
    [x + 5 - lean, bottom - 4],
    [x - lean, bottom],
    [x - 3 - lean, bottom - 5],
    [x - 3, y + tilt * 3],
    [x - 3 + lean, top + 5],
  ];
  pc.poly(pts, C.main);
  pc.poly([[x + lean, top + 1], [x + 4 + lean, top + 5], [x + 4, y + tilt * 3], [x + 1, y + tilt * 3]], C.light);
  pc.poly([[x + 1, y + tilt * 3 + 2], [x + 4, y + tilt * 3 + 2], [x + 4 - lean, bottom - 5], [x - lean, bottom - 1]], C.shade);
  pc.line(x + lean, top + 2, x - lean, bottom - 2, C.glow);
  pc.px(x + 2 + lean, top + 6, P.white).px(x + 3, y + tilt * 3 - 2, P.white);
}

function drawDiamondhead(pc: PixelCanvas, frame: number): void {
  const pose = diamondPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;

  if (pose.shield === undefined) drawArm(pc, CX - 4 + ux, 18 + uy, pose.backArm, false);
  drawLeg(pc, CX - 4, 28 + Math.min(uy, 2), pose.back, false);

  // A broad crystal chest over a dark suit.
  pc.poly([[CX - 7 + ux, 16 + uy], [CX + 7 + ux, 16 + uy], [CX + 6 + ux, 24 + uy], [CX + 4, 29 + Math.min(uy, 2)], [CX - 5, 29 + Math.min(uy, 2)], [CX - 7 + ux, 23 + uy]], C.main);
  pc.poly([[CX - 6 + ux, 17 + uy], [CX + ux, 17 + uy], [CX - 1 + ux, 23 + uy], [CX - 6 + ux, 22 + uy]], C.light);
  pc.poly([[CX + 2 + ux, 18 + uy], [CX + 6 + ux, 17 + uy], [CX + 5 + ux, 24 + uy], [CX + 2 + ux, 25 + uy]], C.shade);
  pc.rect(CX - 5, 25 + Math.min(uy, 2), 10, 4, C.suit);
  pc.hline(CX - 5, CX + 4, 25 + Math.min(uy, 2), C.suit2);
  // The Omnitrix symbol on the chest.
  pc.rect(CX - 1 + ux, 19 + uy, 4, 4, P.omnitrixDark);
  pc.rect(CX + ux, 20 + uy, 2, 2, P.omnitrix);

  drawSpikes(pc, CX + ux, 14 + uy);
  drawLeg(pc, CX, 28 + Math.min(uy, 2), pose.front, true);
  drawHead(pc, CX + 1 + ux, 9 + uy, pose);

  if (pose.shield !== undefined) {
    drawArm(pc, CX + 2 + ux, 18 + uy, pose.backArm, false);
    drawArm(pc, CX + 4 + ux, 18 + uy, pose.frontArm, true);
    drawShield(pc, CX + 15 + ux, 20 + uy, pose.shield);
  } else {
    drawArm(pc, CX + 4 + ux, 18 + uy, pose.frontArm, true);
    if (pose.charge) {
      // A shard forming at the fist.
      const hx = CX + 4 + ux + pose.frontArm.hx + 3;
      const hy = 18 + uy + pose.frontArm.hy + 1;
      pc.poly([[hx, hy - 2], [hx + 5, hy], [hx, hy + 2]], C.glow);
      pc.px(hx + 2, hy, P.white);
    }
  }
  if (pose.slam) {
    for (const dx of [-12, -7, 15, 20]) pc.poly([[CX + dx, 41], [CX + dx + 2, 33 + (dx % 3)], [CX + dx + 4, 41]], C.light);
  }
  pc.outline(C.rim);
}

/** Clears a filled circle (icons are white shapes with holes, so they tint cleanly). */
function clearRect(pc: PixelCanvas, x: number, y: number, w: number, h: number): void {
  pc.ctx.clearRect(pc.ox + x, pc.oy + y, w, h);
}

/** Dial hologram: the gem head with its brow and eyes. 16x16, white for tinting. */
function drawIcon(pc: PixelCanvas): void {
  pc.poly([[3, 9], [5, 3], [8, 0], [11, 3], [13, 9], [11, 15], [5, 15]], P.white);
  clearRect(pc, 5, 9, 2, 2);
  clearRect(pc, 9, 9, 2, 2);
  clearRect(pc, 4, 12, 8, 1);
  pc.ctx.clearRect(pc.ox + 8, pc.oy + 2, 1, 5);
}

/** Three crystal shards flying right. */
function drawTouchShards(pc: PixelCanvas): void {
  for (const [x, y] of [[2, 3], [6, 8], [1, 12]] as const) pc.poly([[x, y - 2], [x + 9, y], [x, y + 2]], P.white);
}

/** A hexagonal crystal shield with a ricochet arrow. */
function drawTouchShield(pc: PixelCanvas): void {
  pc.poly([[8, 1], [13, 4], [13, 11], [8, 15], [3, 11], [3, 4]], P.white);
  clearRect(pc, 6, 5, 4, 1);
  clearRect(pc, 6, 10, 4, 1);
  pc.ctx.clearRect(pc.ox + 8, pc.oy + 3, 1, 10);
}

/** Dialogue portrait (48x48): the gem head filling the frame, eyes glowing. */
function drawPortrait(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 48, 0x0a1c2a);
  for (let i = 0; i < 9; i++) pc.line(i * 6 - 4, 48, i * 6 + 10, 0, 0x10283a);
  pc.poly([[8, 30], [12, 12], [24, 1], [36, 12], [41, 28], [36, 47], [12, 47]], C.main);
  pc.poly([[10, 29], [13, 13], [24, 3], [22, 26]], C.light);
  pc.poly([[26, 4], [35, 13], [39, 27], [27, 25]], C.shade);
  pc.line(24, 3, 22, 26, C.glow, 2);
  pc.rect(14, 27, 24, 9, C.core);
  pc.rect(19, 29, 5, 4, C.eye).rect(30, 29, 5, 4, C.eye);
  pc.rect(19, 29, 2, 2, P.white).rect(30, 29, 2, 2, P.white);
  pc.poly([[14, 36], [38, 36], [35, 46], [17, 46]], C.shade);
  pc.hline(15, 37, 36, C.light);
  pc.outline(C.rim);
}

/** Riding the cart, seen from behind (THE DEEP DIVE): 0 idle, 1 attack, 2 duck. */
function drawBack(pc: PixelCanvas, frame: number): void {
  const duck = frame === 2;
  const y = duck ? 9 : 0;
  // Shoulders and back crystals.
  pc.poly([[4, 24 + y], [6, 14 + y], [24, 14 + y], [26, 24 + y]], C.shade);
  pc.poly([[6, 14 + y], [2, 3 + y], [10, 13 + y]], C.main);
  pc.poly([[24, 14 + y], [28, 4 + y], [20, 13 + y]], C.main);
  pc.line(3, 4 + y, 8, 13 + y, C.light).line(27, 5 + y, 22, 13 + y, C.light);
  pc.rect(10, 16 + y, 10, 6, C.main);
  pc.line(15, 15 + y, 15, 23 + y, C.light);
  // The back of the gem head.
  pc.poly([[9, 13 + y], [11, 4 + y], [15, -0 + y], [19, 4 + y], [21, 13 + y]], C.main);
  pc.poly([[10, 12 + y], [12, 4 + y], [15, 1 + y], [14, 12 + y]], C.light);
  // Arms on the cart rim, or one thrown forward.
  if (frame === 1) {
    pc.rect(22, 10 + y, 4, 10, C.main).poly([[22, 10], [28, 2], [26, 11]], C.glow);
  } else {
    pc.rect(2, 20 + y, 4, 5, C.shade).rect(24, 20 + y, 4, 5, C.shade);
  }
  pc.outline(C.rim);
}

export const DIAMONDHEAD_ASSETS: AssetDef[] = [
  one(DIAMONDHEAD_TEX.portrait, 48, 48, drawPortrait),
  sheet(DIAMONDHEAD_TEX.sheet, DIAMONDHEAD_FRAME.w, DIAMONDHEAD_FRAME.h, FRAME_COUNT, drawDiamondhead),
  sheet(DIAMONDHEAD_TEX.back, 30, 26, 3, drawBack),
  one(DIAMONDHEAD_TEX.icon, 16, 16, drawIcon),
  one(DIAMONDHEAD_TEX.touchAttack, 16, 16, drawTouchShards),
  one(DIAMONDHEAD_TEX.touchSpecial, 16, 16, drawTouchShield),
];

export const DIAMONDHEAD_ANIMS: AnimDef[] = animsFor('diamondhead', DIAMONDHEAD_TEX.sheet, DIAMONDHEAD_FRAMES, { idle: 5, run: 12, shoot: 16 }, ['idle', 'run']);
