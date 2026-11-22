import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** Ricochet's textures. Add a `url` to an entry to load real art instead. */
export const RICOCHET_TEX = {
  sheet: 'ricochet',
  back: 'ricochet-back',
  icon: 'ui-icon-ricochet',
  touchAttack: 'ui-touch-bash',
  touchSpecial: 'ui-touch-curl',
} as const;

/**
 * An original alien: copper shell plates over a round back, teal seams that
 * glow, a pale lilac-grey hide, amber eyes under the shell's rim.
 */
export const RICOCHET_COLORS = {
  shell: 0xc8743a,
  shellLight: 0xf0a868,
  shellDark: 0x7a3c1e,
  shellDeep: 0x4e2412,
  seam: 0x5ae8c8,
  seamDark: 0x1e8a78,
  hide: 0xb8b4c4,
  hideLight: 0xe2deea,
  hideDark: 0x7a7488,
  eye: 0xffc83a,
  pupil: 0x2a1a10,
  claw: 0xece6d2,
} as const;

const C = RICOCHET_COLORS;

export const RICOCHET_FRAME = { w: 36, h: 34, feetY: 32 } as const;
export const RICOCHET_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7],
  jump: [8],
  fall: [9],
  bashA: [10],
  bashB: [11],
  slam: [12, 13],
  roll: [14, 15, 16, 17, 18, 19, 20, 21],
  hurt: [22],
} as const;
const FRAME_COUNT = 23;

/** Where the ball's centre sits in a frame (it rests on the feet). */
const BALL = { x: 18, y: 21, r: 11 } as const;

interface Pose {
  /** Whole body up (negative) or down. */
  bob: number;
  /** Shell tipped forward (px at the top). */
  lean: number;
  /** Near and far legs: forward offset of the foot, and lift. */
  near: { dx: number; lift: number };
  far: { dx: number; lift: number };
  /** Near arm's hand, relative to the shoulder. */
  hand: { x: number; y: number };
  /** Squint (hurt). */
  hurt: boolean;
}

function pose(frame: number): Pose {
  const rest: Pose = { bob: 0, lean: 0, near: { dx: 0, lift: 0 }, far: { dx: 0, lift: 0 }, hand: { x: 4, y: 6 }, hurt: false };
  if (frame <= 3) return { ...rest, bob: frame === 1 || frame === 2 ? -1 : 0, hand: { x: 4, y: 6 + (frame === 2 ? -1 : 0) } };
  if (frame <= 7) {
    // A stomping waddle: the legs swap, the shell rocks.
    const k = frame - 4;
    const s = k === 0 ? 1 : k === 2 ? -1 : 0;
    return { ...rest, bob: k % 2 ? -1 : 0, lean: 1, near: { dx: 2 * s, lift: k === 1 ? 1 : 0 }, far: { dx: -2 * s, lift: k === 3 ? 1 : 0 }, hand: { x: 3 - s * 2, y: 6 } };
  }
  if (frame === 8) return { ...rest, bob: -2, near: { dx: 2, lift: 2 }, far: { dx: -1, lift: 1 }, hand: { x: 5, y: 2 } };
  if (frame === 9) return { ...rest, bob: -1, near: { dx: 1, lift: 1 }, far: { dx: 1, lift: 0 }, hand: { x: 6, y: 4 } };
  if (frame === 10) return { ...rest, lean: 2, near: { dx: 2, lift: 0 }, hand: { x: 10, y: 1 } };
  if (frame === 11) return { ...rest, lean: 2, far: { dx: 2, lift: 0 }, hand: { x: 9, y: 3 } };
  if (frame === 12) return { ...rest, bob: -2, lean: -1, hand: { x: 2, y: -6 } };
  if (frame === 13) return { ...rest, bob: 1, lean: 4, near: { dx: 3, lift: 0 }, hand: { x: 10, y: 8 } };
  return { ...rest, lean: -2, hand: { x: 1, y: 4 }, hurt: true };
}

/** The domed shell: copper plates in bands, teal seams between them. */
function drawShell(pc: PixelCanvas, cx: number, cy: number, lean: number): void {
  pc.ellipse(cx, cy, 11, 10, C.shellDark);
  pc.ellipse(cx - 1, cy - 1, 10, 9, C.shell);
  pc.ellipse(cx - 3, cy - 4, 6, 4, C.shellLight);
  // Seams: three bands across the back, leaning with the body.
  for (const [dx, h] of [[-6, 7], [-1, 9], [4, 8]] as const) {
    const x = cx + dx + Math.round(lean * 0.5);
    pc.line(x, cy - h + 1, x - 1, cy + h - 3, C.seamDark);
    pc.line(x + 1, cy - h + 1, x, cy + h - 3, C.seam);
  }
  // The rim of the shell over the head, and its studs.
  pc.line(cx + 6, cy - 6, cx + 10, cy - 2, C.shellDeep);
  pc.px(cx - 4, cy - 7, C.shellLight).px(cx + 2, cy - 8, C.shellLight);
}

function drawLeg(pc: PixelCanvas, x: number, top: number, foot: { dx: number; lift: number }, near: boolean): void {
  const fx = x + foot.dx;
  const fy = 32 - foot.lift;
  pc.poly([[x - 2, top], [x + 2, top], [fx + 3, fy - 1], [fx - 2, fy - 1]], near ? C.hide : C.hideDark);
  // A copper knee plate, and the wide three-toed foot.
  pc.rect(x - 1 + Math.round(foot.dx / 2), top + 2, 3, 2, near ? C.shell : C.shellDark);
  pc.rect(fx - 3, fy - 1, 7, 2, near ? C.hideDark : C.shellDeep);
  if (near) pc.px(fx + 3, fy, C.claw).px(fx + 1, fy, C.claw);
}

function drawArm(pc: PixelCanvas, sx: number, sy: number, hand: { x: number; y: number }): void {
  const hx = sx + hand.x;
  const hy = sy + hand.y;
  pc.line(sx, sy, hx, hy, C.hide, 3);
  // The forearm's shell bracer and the three-fingered hand.
  const bx = Math.round((sx + hx) / 2 + (hx - sx) * 0.2);
  const by = Math.round((sy + hy) / 2 + (hy - sy) * 0.2);
  pc.ellipse(bx, by, 2, 2, C.shell);
  pc.px(bx - 1, by - 1, C.shellLight);
  pc.ellipse(hx, hy, 2, 2, C.hideLight);
  pc.px(hx + 2, hy - 1, C.claw).px(hx + 2, hy + 1, C.claw).px(hx + 1, hy + 2, C.claw);
}

function drawHead(pc: PixelCanvas, x: number, y: number, hurt: boolean): void {
  pc.ellipse(x, y, 4, 3, C.hide);
  pc.ellipse(x + 1, y - 1, 2, 1, C.hideLight);
  // A short blunt snout and the brow plate.
  pc.rect(x + 3, y, 2, 2, C.hideDark);
  pc.line(x - 3, y - 3, x + 3, y - 3, C.shell);
  if (hurt) {
    pc.line(x + 1, y - 1, x + 3, y, C.pupil);
  } else {
    pc.rect(x + 1, y - 1, 2, 2, C.eye);
    pc.px(x + 2, y - 1, C.pupil);
  }
}

function drawStanding(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  const cx = 15 + Math.round(p.lean / 2);
  const cy = 18 + p.bob;
  drawLeg(pc, 12, 25 + p.bob, p.far, false);
  // The belly and hide under the shell.
  pc.ellipse(18 + Math.round(p.lean / 2), 23 + p.bob, 8, 6, C.hide);
  drawLeg(pc, 19, 25 + p.bob, p.near, true);
  drawShell(pc, cx, cy, p.lean);
  // The belly's front, and the Omnitrix on it.
  pc.ellipse(22 + Math.round(p.lean / 2), 24 + p.bob, 4, 4, C.hideLight);
  pc.rect(22 + Math.round(p.lean / 2), 23 + p.bob, 3, 3, P.omnitrixDark);
  pc.px(23 + Math.round(p.lean / 2), 24 + p.bob, P.omnitrix);
  drawHead(pc, 26 + p.lean, 17 + p.bob + Math.max(0, p.lean - 1), p.hurt);
  drawArm(pc, 22 + Math.round(p.lean / 2), 20 + p.bob, p.hand);
}

/** Curled into a ball, turned `angle` (radians): seams and the Omnitrix travel round as it spins. */
export function drawBall(pc: PixelCanvas, cx: number, cy: number, r: number, angle: number): void {
  pc.circle(cx, cy, r, C.shellDark);
  pc.circle(cx - 0.5, cy - 0.5, r - 1, C.shell);
  // Three seams through the middle, turning with the ball.
  for (let i = 0; i < 3; i++) {
    const a = angle + (i * Math.PI) / 3;
    const dx = Math.cos(a) * (r - 1);
    const dy = Math.sin(a) * (r - 1);
    pc.line(Math.round(cx - dx), Math.round(cy - dy), Math.round(cx + dx), Math.round(cy + dy), i === 0 ? C.seam : C.seamDark);
  }
  // The Omnitrix rides round the rim.
  const ox = Math.round(cx + Math.cos(angle + 0.8) * (r - 4));
  const oy = Math.round(cy + Math.sin(angle + 0.8) * (r - 4));
  pc.rect(ox - 1, oy - 1, 3, 3, P.omnitrixDark);
  pc.px(ox, oy, P.omnitrix);
  // The light stays put: a shine up and to the left.
  pc.ellipse(cx - 4, cy - 5, 3, 2, C.shellLight);
  pc.px(cx - 6, cy - 6, P.white);
}

function drawRicochet(pc: PixelCanvas, frame: number): void {
  const rolling = frame >= 14 && frame <= 21;
  if (rolling) drawBall(pc, BALL.x, BALL.y, BALL.r, ((frame - 14) / 8) * Math.PI * 2);
  else drawStanding(pc, frame);
  pc.outline(P.ink);
}

/** Seen from behind on the ore cart: the domed shell, hands on the rim (0 idle, 1 bashing ahead, 2 curled down). 30x26. */
function drawBack(pc: PixelCanvas, frame: number): void {
  if (frame === 2) {
    drawBall(pc, 15, 17, 9, 0.4);
    pc.outline(P.ink);
    return;
  }
  const y = frame === 1 ? -2 : 0;
  pc.ellipse(15, 15 + y, 12, 10, C.shellDark);
  pc.ellipse(15, 14 + y, 11, 9, C.shell);
  for (const x of [9, 15, 21]) pc.line(x, 6 + y, x, 22 + y, C.seam);
  pc.ellipse(11, 10 + y, 4, 3, C.shellLight);
  if (frame === 1) pc.line(24, 16 + y, 29, 8 + y, C.hide, 3).px(29, 7 + y, C.claw);
  else pc.ellipse(3, 20 + y, 2, 2, C.hide).ellipse(27, 20 + y, 2, 2, C.hide);
  pc.outline(P.ink);
}

/** Dial hologram: the curled ball with its seams cut out and a speed line. 16x16, white for tinting. */
function drawIcon(pc: PixelCanvas): void {
  pc.circle(8, 8, 7, P.white);
  const ctx = pc.ctx;
  for (const [x0, y0, x1, y1] of [[4, 3, 6, 13], [8, 2, 9, 14], [11, 3, 12, 13]] as const) {
    for (let i = 0; i <= 10; i++) ctx.clearRect(pc.ox + Math.round(x0 + ((x1 - x0) * i) / 10), pc.oy + Math.round(y0 + ((y1 - y0) * i) / 10), 1, 1);
  }
  ctx.clearRect(pc.ox + 0, pc.oy + 0, 2, 16);
}

/** A shell-plated fist. */
function drawTouchBash(pc: PixelCanvas): void {
  pc.rect(3, 5, 9, 7, P.white);
  pc.rect(12, 6, 3, 5, P.white);
  pc.line(3, 4, 11, 4, P.white).line(1, 8, 2, 8, P.white);
  pc.ctx.clearRect(pc.ox + 7, pc.oy + 5, 1, 7);
}

/** A ball rolling, with speed lines behind it. */
function drawTouchRoll(pc: PixelCanvas): void {
  pc.circle(10, 9, 5, P.white);
  pc.line(0, 6, 4, 6, P.white).line(1, 9, 4, 9, P.white).line(0, 12, 4, 12, P.white);
  pc.ctx.clearRect(pc.ox + 9, pc.oy + 5, 1, 9);
}

export const RICOCHET_ASSETS: AssetDef[] = [
  sheet(RICOCHET_TEX.back, 30, 26, 3, drawBack),
  sheet(RICOCHET_TEX.sheet, RICOCHET_FRAME.w, RICOCHET_FRAME.h, FRAME_COUNT, drawRicochet),
  one(RICOCHET_TEX.icon, 16, 16, drawIcon),
  one(RICOCHET_TEX.touchAttack, 16, 16, drawTouchBash),
  one(RICOCHET_TEX.touchSpecial, 16, 16, drawTouchRoll),
];

export const RICOCHET_ANIMS: AnimDef[] = animsFor('ricochet', RICOCHET_TEX.sheet, RICOCHET_FRAMES, { idle: 5, run: 9, slam: 8, roll: 14 }, ['idle', 'run', 'roll']);
