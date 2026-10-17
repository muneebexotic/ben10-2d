import { PALETTE as P } from '../../config/palette';
import { drawArm, drawLeg } from './characters';
import type { PixelCanvas } from './PixelCanvas';
import { runPose, type Pose } from './poses';

/**
 * Gwen and Grandpa Max in the world (until Chapter 6 they were portraits in
 * the dialogue box): Gwen as Ben's companion, Max in the field. Same rig as Ben.
 */
export const GWEN_FRAME = { w: 24, h: 28, feetY: 27 } as const;
export const GWEN_FRAMES = {
  idle: [0, 1],
  run: [2, 3, 4, 5, 6, 7],
  jump: [8],
  fall: [9],
  cast: [10, 11],
  point: [12],
  hurt: [13],
} as const;
export const GWEN_FRAME_COUNT = 14;

export const MAX_FRAME = { w: 28, h: 34, feetY: 33 } as const;
export const MAX_FRAMES = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  spray: [6, 7],
  point: [8],
  cheer: [9],
} as const;
export const MAX_FRAME_COUNT = 10;

const G = {
  hair: 0xe8662a,
  hairLight: 0xff9a52,
  clip: 0x4ab8ff,
  top: 0x3a7ad8,
  topShade: 0x2a58a8,
  cat: 0xf4f4f0,
  pants: 0xf0f0e8,
  pantsShade: 0xc8ccd8,
  eye: 0x2e9a52,
} as const;

function gwenPose(frame: number): Pose {
  switch (frame) {
    case 0:
    case 1:
      return { bob: frame, lean: 0, front: { footX: 1, lift: 0 }, back: { footX: -1, lift: 0 }, frontArm: { hx: 1, hy: 6 }, backArm: { hx: -1, hy: 6 } };
    case 8:
      return { bob: 0, lean: 0, front: { footX: 2, lift: 3 }, back: { footX: -2, lift: 1 }, frontArm: { hx: 3, hy: -5 }, backArm: { hx: -3, hy: -4 } };
    case 9:
      return { bob: 0, lean: 0, front: { footX: 3, lift: 1 }, back: { footX: -3, lift: 2 }, frontArm: { hx: 5, hy: -2 }, backArm: { hx: -4, hy: -2 } };
    case 10:
    case 11:
      // Casting: both hands thrust forward, a glow between them.
      return { bob: 0, lean: 1, front: { footX: 3, lift: 0 }, back: { footX: -2, lift: 0 }, frontArm: { hx: 7, hy: frame === 10 ? 0 : -2 }, backArm: { hx: 6, hy: frame === 10 ? 1 : -1 }, mouthOpen: frame === 11, glow: frame === 10 ? 1 : 2 };
    case 12:
      return { bob: 0, lean: 0, front: { footX: 1, lift: 0 }, back: { footX: -1, lift: 0 }, frontArm: { hx: 7, hy: -4 }, backArm: { hx: -1, hy: 6 }, mouthOpen: true };
    case 13:
      return { bob: 0, lean: -2, front: { footX: 2, lift: 1 }, back: { footX: -1, lift: 0 }, frontArm: { hx: -3, hy: -4 }, backArm: { hx: -5, hy: -3 }, eyesClosed: true, mouthOpen: true };
    default:
      return runPose(frame - 2, 1);
  }
}

export function drawGwen(pc: PixelCanvas, frame: number): void {
  const pose = gwenPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;
  drawArm(pc, 10 + ux, 13 + uy, pose.backArm, G.topShade, P.skin1, false, false, 2);
  drawLeg(pc, 10, 21, pose.back, G.pantsShade, 3, 23, 2, 4);
  pc.rect(9, 19, 7, 2, G.pants);
  // A blue long-sleeved top with a little white cat face on it.
  pc.rect(9 + ux, 12 + uy, 7, 8, G.top);
  pc.rect(9 + ux, 12 + uy, 2, 8, G.topShade);
  pc.rect(12 + ux, 15 + uy, 2, 2, G.cat);
  pc.px(12 + ux, 14 + uy, G.cat).px(13 + ux, 14 + uy, G.cat);
  drawLeg(pc, 13, 21, pose.front, G.pants, 3, 23, 2, 4);
  drawGwenHead(pc, 9 + ux, 3 + uy, pose);
  drawArm(pc, 14 + ux, 13 + uy, pose.frontArm, G.top, P.skin0, false, false, 2);
  if (pose.glow) {
    const hx = 14 + ux + pose.frontArm.hx;
    const hy = 13 + uy + pose.frontArm.hy;
    pc.circle(hx + 2, hy + 1, pose.glow + 1, P.mana, 0.6);
    pc.px(hx + 2, hy + 1, P.manaGlow);
  }
  pc.outline(P.ink);
}

function drawGwenHead(pc: PixelCanvas, x: number, y: number, pose: Pose): void {
  pc.rect(x, y, 8, 8, P.skin0);
  pc.rect(x, y + 7, 8, 1, P.skin1);
  // Orange hair in a bob down to the jaw, with a blue clip.
  pc.rect(x - 1, y - 1, 9, 3, G.hair);
  pc.rect(x - 1, y, 3, 8, G.hair);
  pc.px(x + 2, y + 2, G.hair).px(x + 7, y + 2, G.hair);
  pc.rect(x + 2, y - 1, 4, 1, G.hairLight);
  pc.rect(x + 3, y + 1, 2, 1, G.clip);
  if (pose.eyesClosed) pc.rect(x + 5, y + 4, 2, 1, P.ink);
  else {
    pc.rect(x + 5, y + 4, 1, 2, P.ink);
    pc.px(x + 6, y + 4, G.eye);
  }
  if (pose.mouthOpen) pc.rect(x + 5, y + 6, 2, 1, 0x7a2a2a);
  else pc.px(x + 6, y + 6, P.skin1);
}

// ---------------------------------------------------------------- Grandpa Max

const M = {
  shirt: 0xd83a3a,
  shirtShade: 0xa82a2a,
  flower: 0xf4f0d0,
  pants: 0xc8a878,
  pantsShade: 0xa0845a,
  hair: 0xd8d8d0,
  skin: 0xe8b08a,
  skinShade: 0xc88a68,
  can: 0xd82a2a,
} as const;

function maxPose(frame: number): Pose {
  switch (frame) {
    case 0:
    case 1:
      return { bob: frame, lean: 0, front: { footX: 1, lift: 0 }, back: { footX: -1, lift: 0 }, frontArm: { hx: 1, hy: 7 }, backArm: { hx: -1, hy: 7 } };
    case 6:
    case 7:
      // The fire extinguisher, both hands on it, spraying ahead.
      return { bob: 0, lean: 1, front: { footX: 3, lift: 0 }, back: { footX: -3, lift: 0 }, frontArm: { hx: 6, hy: 2 }, backArm: { hx: 4, hy: 4 }, mouthOpen: frame === 7 };
    case 8:
      return { bob: 0, lean: 0, front: { footX: 1, lift: 0 }, back: { footX: -1, lift: 0 }, frontArm: { hx: 8, hy: -3 }, backArm: { hx: -1, hy: 7 } };
    case 9:
      return { bob: -1, lean: 0, front: { footX: 2, lift: 0 }, back: { footX: -2, lift: 0 }, frontArm: { hx: 3, hy: -7 }, backArm: { hx: -3, hy: -7 }, mouthOpen: true };
    default: {
      const p = runPose([0, 1, 3, 4][frame - 2], 0.7);
      p.lean = 0;
      return p;
    }
  }
}

export function drawMax(pc: PixelCanvas, frame: number): void {
  const pose = maxPose(frame);
  const ux = pose.lean;
  const uy = pose.bob;
  drawArm(pc, 11 + ux, 15 + uy, pose.backArm, M.shirtShade, M.skinShade, false, false, 3);
  drawLeg(pc, 11, 25, pose.back, M.pantsShade, 4, 29, 3, 5);
  // A big man in a red Hawaiian shirt.
  pc.rect(9 + ux, 13 + uy, 11, 11, M.shirt);
  pc.rect(9 + ux, 13 + uy, 3, 11, M.shirtShade);
  for (const [fx, fy] of [[13, 15], [17, 17], [14, 20], [18, 22]] as const) pc.px(fx + ux, fy + uy, M.flower).px(fx + 1 + ux, fy + uy, M.flower);
  pc.rect(10 + ux, 23 + uy, 9, 2, M.pants);
  drawLeg(pc, 15, 25, pose.front, M.pants, 4, 29, 3, 5);
  // Head: grey buzz cut, a strong jaw.
  const hx = 11 + ux;
  const hy = 3 + uy;
  pc.rect(hx, hy, 9, 10, M.skin);
  pc.rect(hx, hy + 9, 9, 1, M.skinShade);
  pc.rect(hx, hy, 9, 2, M.hair);
  pc.rect(hx, hy, 2, 5, M.hair);
  pc.rect(hx + 6, hy + 4, 1, 2, P.ink);
  pc.rect(hx + 5, hy + 3, 3, 1, M.hair);
  if (pose.mouthOpen) pc.rect(hx + 5, hy + 7, 3, 1, 0x7a2a2a);
  else pc.rect(hx + 6, hy + 7, 2, 1, M.skinShade);
  drawArm(pc, 17 + ux, 15 + uy, pose.frontArm, M.shirt, M.skin, false, frame >= 8, 3);
  if (frame === 6 || frame === 7) {
    const ex = 17 + ux + pose.frontArm.hx;
    const ey = 15 + uy + pose.frontArm.hy;
    pc.rect(ex - 3, ey - 1, 5, 8, M.can);
    pc.rect(ex - 3, ey - 1, 5, 1, 0x2a2a2a);
    pc.rect(ex + 2, ey, 3, 2, 0x2a2a2a);
  }
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Gwen's HUD and touch icons (16x16, white for tinting)

/** Gwen's face for the HUD and the touch button: the bob and the clip. */
export function drawGwenIcon(pc: PixelCanvas): void {
  pc.rect(3, 2, 10, 4, P.white);
  pc.rect(3, 2, 3, 11, P.white);
  pc.rect(11, 4, 2, 7, P.white);
  pc.rect(6, 6, 6, 7, P.white);
  pc.ctx.clearRect(pc.ox + 9, pc.oy + 8, 1, 2);
  pc.ctx.clearRect(pc.ox + 7, pc.oy + 3, 3, 1);
}

/** SHIELD: a bubble. */
export function drawSpellShield(pc: PixelCanvas): void {
  ring(pc, 8, 8, 6.5, 1.2);
  pc.rect(5, 4, 2, 2, P.white);
}

/** A one- or two-pixel ring (white) around (cx, cy). */
function ring(pc: PixelCanvas, cx: number, cy: number, r: number, width: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (Math.abs(d - r) <= width / 2 + 0.25) pc.px(x, y, P.white);
    }
  }
}

/** STUN: a star burst. */
export function drawSpellStun(pc: PixelCanvas): void {
  pc.poly([[8, 0], [10, 6], [16, 8], [10, 10], [8, 16], [6, 10], [0, 8], [6, 6]], P.white);
}

/** REVEAL: an open eye. */
export function drawSpellReveal(pc: PixelCanvas): void {
  for (let x = 1; x <= 15; x++) {
    const h = Math.round(Math.sqrt(Math.max(0, 1 - ((x - 8) / 7) ** 2)) * 4);
    pc.px(x, 8 - h, P.white).px(x, 8 + h, P.white);
  }
  ring(pc, 8.5, 8.5, 2.5, 1.2);
  pc.rect(8, 8, 1, 1, P.white);
}

/** A mana bolt: a bright core in a soft pink halo (white core so spells can be tinted). 10x10. */
export function drawManaOrb(pc: PixelCanvas): void {
  pc.circle(5, 5, 4, P.mana, 0.5);
  pc.circle(5, 5, 3, P.manaGlow);
  pc.circle(5, 5, 1, P.white);
}

/** Gwen's shield: a bubble of mana with a glint, drawn once and tinted. 48x48. */
export function drawManaBubble(pc: PixelCanvas): void {
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      const d = Math.hypot(x + 0.5 - 24, y + 0.5 - 24);
      if (d > 23.5) continue;
      if (d > 21.5) pc.px(x, y, P.white, 0.95);
      else if (d > 19) pc.px(x, y, P.manaGlow, 0.35);
      else pc.px(x, y, P.mana, 0.08);
    }
  }
  pc.line(12, 14, 17, 9, P.white).line(13, 16, 15, 14, P.white);
}
