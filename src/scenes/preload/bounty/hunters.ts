import { PALETTE as P } from '../../../config/palette';
import type { PixelCanvas } from '../PixelCanvas';
import { SIXSIX_COLORS, KRAAB_COLORS, TETRAX_COLORS } from './colors';
export { SIXSIX_COLORS, KRAAB_COLORS, TETRAX_COLORS } from './colors';

/**
 * Vilgax's three bounty hunters. Sixsix: slim, gunmetal armour, a jetpack,
 * wrist blades and shoulder cannons, an amber visor slit; he speaks in
 * clicks. Kraab: a crab in rust-bronze armour, eyestalks, a great claw that
 * is also a cannon glowing coral. Tetrax Shard: a Petrosapien like
 * Diamondhead, but sapphire-dark crystal under armour plates, calm and proud.
 * All drawn facing right.
 */

const INK = P.ink;

// ---------------------------------------------------------------- Sixsix (44x46, feet on row 45)

export const SIXSIX_FRAME = { w: 44, h: 46, feetY: 45 } as const;
export const SIXSIX_FRAMES = { idle: [0, 1], fly: [2, 3], windup: [4], slash: [5], cannon: [6], hurt: [7], crash: [8], land: [9] } as const;
export const SIXSIX_FRAME_COUNT = 10;

export function drawSixsix(pc: PixelCanvas, frame: number): void {
  const C = SIXSIX_COLORS;
  const flying = frame === 2 || frame === 3 || frame === 8;
  const bob = frame === 1 ? 1 : frame === 9 ? 3 : 0;
  const lean = frame === 5 ? 3 : frame === 4 ? -2 : frame === 7 ? -3 : flying ? 2 : 0;
  const cx = 20 + lean;
  const top = 6 + bob;
  // The jetpack on his back, two nozzles, flame when he flies.
  pc.rect(cx - 12, top + 12, 7, 14, C.armor1);
  pc.rect(cx - 13, top + 26, 4, 4, C.armor2).rect(cx - 8, top + 26, 4, 4, C.armor2);
  if (flying || frame === 0 || frame === 1) {
    const len = flying ? 9 + (frame % 2) * 3 : 3;
    for (const nx of [cx - 11, cx - 6]) {
      pc.rect(nx - 1, top + 30, 3, len, C.flame);
      pc.px(nx, top + 30, P.fire0).px(nx, top + 30 + len, P.fire3);
    }
  }
  if (frame === 8) for (let i = 0; i < 4; i++) pc.px(cx - 14 + i * 3, top + 20 + (i % 2) * 4, 0x8a8a9a);
  // Legs: slim, armoured, trailing when he flies.
  const legY = top + 28;
  if (flying) {
    pc.line(cx - 2, legY, cx - 8, legY + 13, C.armor1, 3).line(cx + 2, legY, cx - 3, legY + 14, C.armor2, 3);
  } else {
    const spread = frame === 9 ? 6 : 3;
    pc.line(cx - 2, legY, cx - spread - 1, 44, C.armor1, 3).line(cx + 2, legY, cx + spread, 44, C.armor2, 3);
    pc.rect(cx - spread - 3, 43, 5, 2, C.armor0).rect(cx + spread - 1, 43, 6, 2, C.armor0);
  }
  // Torso: a narrow armoured chest, amber lights down the centre.
  pc.poly([[cx - 6, top + 12], [cx + 6, top + 12], [cx + 5, top + 28], [cx - 5, top + 28]], C.armor2);
  pc.poly([[cx - 6, top + 12], [cx - 1, top + 12], [cx - 2, top + 28], [cx - 5, top + 28]], C.armor1);
  for (let i = 0; i < 3; i++) pc.px(cx + 1, top + 15 + i * 4, C.visor);
  // Shoulder pauldron with its cannon.
  pc.rect(cx - 2, top + 9, 10, 6, C.armor3);
  pc.rect(cx + 2, top + 6, 9, 4, C.armor1);
  pc.rect(cx + 10, top + 7, 3, 2, frame === 6 ? C.visorGlow : C.visor);
  // Helmet: a tall crested dome with the visor slit.
  pc.poly([[cx - 5, top + 11], [cx - 6, top + 3], [cx - 2, top - 3], [cx + 3, top - 2], [cx + 6, top + 3], [cx + 5, top + 11]], C.armor2);
  pc.poly([[cx - 5, top + 2], [cx - 2, top - 3], [cx, top - 6], [cx + 1, top - 2]], C.armor3);
  pc.rect(cx + 1, top + 3, 5, 2, C.visor);
  pc.px(cx + 4, top + 3, C.visorGlow);
  if (frame === 7) pc.rect(cx + 1, top + 3, 5, 2, P.white);
  // The arm and its wrist blade.
  const armX = cx + 4;
  const armY = top + 15;
  if (frame === 4) {
    pc.line(armX, armY, armX - 9, armY + 3, C.armor1, 3);
    pc.line(armX - 9, armY + 3, armX - 20, armY - 2, C.blade, 2);
    pc.px(armX - 20, armY - 2, P.white);
  } else if (frame === 5) {
    pc.line(armX, armY, armX + 9, armY + 1, C.armor1, 3);
    pc.line(armX + 9, armY + 1, armX + 22, armY + 2, C.blade, 2);
    pc.line(armX + 10, armY - 3, armX + 20, armY - 1, C.blade);
  } else if (frame === 6) {
    pc.line(armX, armY, armX + 8, armY - 1, C.armor1, 3);
  } else {
    pc.line(armX, armY, armX + 3, armY + 9, C.armor1, 3);
    pc.line(armX + 3, armY + 9, armX + 8, armY + 12, C.blade);
  }
  pc.outline(INK);
}

/** Sixsix in the dialogue box: the crested helmet and the amber slit. */
export function drawSixsixPortrait(pc: PixelCanvas): void {
  const C = SIXSIX_COLORS;
  pc.rect(0, 0, 48, 48, 0x0e0c14);
  for (let y = 0; y < 48; y += 3) pc.hline(0, 47, y, 0x14121c);
  pc.poly([[8, 47], [10, 30], [16, 14], [24, 4], [32, 12], [38, 28], [40, 47]], C.armor2);
  pc.poly([[10, 30], [16, 14], [24, 4], [22, 30]], C.armor3);
  pc.poly([[20, 6], [24, 0], [28, 6]], C.armor1);
  pc.rect(22, 24, 18, 5, C.visor);
  pc.rect(30, 25, 6, 3, C.visorGlow);
  pc.rect(4, 38, 40, 10, C.armor1);
  pc.rect(32, 36, 14, 6, C.armor0).rect(42, 37, 4, 3, C.visor);
  pc.outline(INK);
}

// ---------------------------------------------------------------- Kraab (64x52, feet on row 51)

export const KRAAB_FRAME = { w: 64, h: 52, feetY: 51 } as const;
export const KRAAB_FRAMES = { idle: [0, 1], walk: [2, 3], burrow: [4], mound: [5], erupt: [6], charge: [7], fire: [8], hurt: [9], buried: [10], guard: [11] } as const;
export const KRAAB_FRAME_COUNT = 12;

function kraabEyes(pc: PixelCanvas, x: number, y: number, frame: number): void {
  const C = KRAAB_COLORS;
  const wave = frame % 2;
  pc.line(x, y + 6, x - 2, y - wave, C.shell2, 2).line(x + 6, y + 6, x + 8, y + wave, C.shell2, 2);
  pc.circle(x - 2, y - 2 - wave, 3, C.eye).circle(x + 8, y - 2 + wave, 3, C.eye);
  pc.px(x - 1, y - 2 - wave, INK).px(x + 9, y - 2 + wave, INK);
}

export function drawKraab(pc: PixelCanvas, frame: number): void {
  const C = KRAAB_COLORS;
  if (frame === 5) {
    // Underground: only the ridge of his shell breaking the dirt.
    pc.ellipse(32, 50, 20, 4, 0x3a2418);
    pc.ellipse(32, 48, 14, 4, C.shell1);
    for (let i = 0; i < 5; i++) pc.px(20 + i * 6, 46 + (i % 2), C.shell3);
    pc.outline(INK);
    return;
  }
  if (frame === 10) {
    // Buried up to the eyestalks under the cave-in.
    for (let i = 0; i < 9; i++) pc.ellipse(10 + i * 6, 47 - (i % 3) * 2, 6, 5, i % 2 ? 0x3a3440 : 0x4a4250);
    kraabEyes(pc, 29, 34, 0);
    pc.rect(46, 38, 8, 6, C.shell2);
    pc.outline(INK);
    return;
  }
  const bob = frame === 1 ? 1 : frame === 4 ? 12 : frame === 6 ? -4 : frame === 11 ? 4 : 0;
  const lean = frame === 8 ? -3 : frame === 9 ? -4 : frame === 6 ? 2 : 0;
  const bx = 28 + lean;
  const by = 26 + bob;
  // Legs: four spiny crab legs, scuttling.
  if (frame !== 4) {
    const step = frame === 2 ? 2 : frame === 3 ? -2 : 0;
    for (const [hx, fx, f] of [[-12, -22, step], [-6, -14, -step], [6, 14, step], [12, 22, -step]] as const) {
      pc.line(bx + hx, by + 14, bx + hx + (fx - hx) * 0.5 + f, by + 18, C.shell1, 3);
      pc.line(bx + hx + (fx - hx) * 0.5 + f, by + 18, bx + fx + f, 50, C.shell1, 2);
      pc.px(bx + fx + f, 50, C.shell0);
    }
  }
  // The shell: a wide armoured dome with plates and spines.
  pc.ellipse(bx, by + 6, 18, 12, C.shell1);
  pc.ellipse(bx - 2, by + 2, 15, 8, C.shell2);
  pc.ellipse(bx - 5, by - 1, 7, 3, C.shell3);
  for (let i = 0; i < 5; i++) pc.poly([[bx - 14 + i * 7, by - 4 + Math.abs(i - 2)], [bx - 12 + i * 7, by - 9 + Math.abs(i - 2) * 2], [bx - 10 + i * 7, by - 4 + Math.abs(i - 2)]], C.shell3);
  pc.ellipse(bx + 4, by + 12, 12, 4, C.belly);
  // Mandibles and eyestalks.
  pc.rect(bx + 12, by + 6, 5, 4, C.shell0);
  pc.line(bx + 16, by + 9, bx + 19, by + 12, C.shell3);
  kraabEyes(pc, bx + 6, by - 12, frame);
  // The small claw, tucked under.
  pc.ellipse(bx - 14, by + 12, 5, 3, C.shell2);
  // The great claw: a cannon. Aimed when charging or firing, raised to erupt.
  const charging = frame === 7;
  const firing = frame === 8;
  const clawUp = frame === 6;
  const ax = bx + 14;
  const ay = by + 2;
  const tx = clawUp ? ax + 4 : ax + 18;
  const ty = clawUp ? ay - 22 : firing ? ay - 2 : ay;
  pc.line(ax, ay, tx - 4, ty, C.shell1, 5);
  pc.ellipse(tx, ty, 8, 6, C.shell2);
  pc.poly([[tx + 2, ty - 6], [tx + 12, ty - 3], [tx + 4, ty - 1]], C.shell3);
  pc.poly([[tx + 2, ty + 5], [tx + 11, ty + 3], [tx + 4, ty + 1]], C.shell1);
  pc.rect(tx + 4, ty - 1, 6, 3, C.metal);
  pc.rect(tx + 9, ty - 1, 2, 3, charging || firing ? C.glow : C.glowDark);
  if (charging) pc.circle(tx + 12, ty, 3, C.glow).px(tx + 12, ty, P.white);
  if (frame === 4) {
    // Sinking: dirt thrown up around him.
    for (let i = 0; i < 7; i++) pc.ellipse(8 + i * 8, 49 - (i % 2) * 2, 5, 3, 0x5a3824);
  }
  if (frame === 11) pc.ellipse(bx + 10, by + 4, 9, 12, C.shell3);
  pc.outline(INK);
}

/** Kraab in the dialogue box: eyestalks, mandibles, the claw raised. */
export function drawKraabPortrait(pc: PixelCanvas): void {
  const C = KRAAB_COLORS;
  pc.rect(0, 0, 48, 48, 0x140a10);
  pc.ellipse(22, 40, 22, 14, C.shell1);
  pc.ellipse(20, 36, 18, 10, C.shell2);
  for (let i = 0; i < 4; i++) pc.poly([[6 + i * 9, 30], [9 + i * 9, 24], [12 + i * 9, 30]], C.shell3);
  pc.line(16, 28, 13, 10, C.shell2, 3).line(26, 28, 29, 10, C.shell2, 3);
  pc.circle(13, 8, 5, C.eye).circle(29, 8, 5, C.eye);
  pc.circle(14, 8, 2, INK).circle(30, 8, 2, INK);
  pc.rect(17, 38, 10, 4, C.shell0);
  pc.ellipse(41, 28, 7, 10, C.shell2);
  pc.rect(42, 22, 5, 4, C.metal).rect(45, 22, 3, 4, C.glow);
  pc.outline(INK);
}

// ---------------------------------------------------------------- Tetrax (44x52, feet on row 51)

export const TETRAX_FRAME = { w: 44, h: 52, feetY: 51 } as const;
export const TETRAX_FRAMES = { idle: [0, 1], walk: [2, 3, 4, 5], glint: [6], strike: [7], volley: [8], hurt: [9], guard: [10], yield: [11] } as const;
export const TETRAX_FRAME_COUNT = 12;

export function drawTetrax(pc: PixelCanvas, frame: number): void {
  const C = TETRAX_COLORS;
  const kneel = frame === 11;
  const bob = frame === 1 ? 1 : kneel ? 10 : 0;
  const lean = frame === 7 ? 3 : frame === 9 ? -3 : frame === 6 ? -1 : 0;
  const cx = 20 + lean;
  const top = 4 + bob;
  const walk = frame >= 2 && frame <= 5 ? [3, 1, -3, -1][frame - 2] : 0;
  // Legs: armoured plates over crystal.
  if (kneel) {
    pc.rect(cx - 6, 44, 12, 6, C.armor).rect(cx + 2, 40, 8, 10, C.armor2);
  } else {
    pc.line(cx - 3, top + 32, cx - 4 - walk, 49, C.armor, 4).line(cx + 3, top + 32, cx + 4 + walk, 49, C.armor2, 4);
    pc.rect(cx - 7 - walk, 48, 7, 3, C.crystal1).rect(cx + 2 + walk, 48, 7, 3, C.crystal2);
  }
  // Torso: a crystal chest with a dark harness and belt.
  pc.poly([[cx - 8, top + 14], [cx + 8, top + 14], [cx + 7, top + 32], [cx - 7, top + 32]], C.crystal2);
  pc.poly([[cx - 8, top + 14], [cx - 1, top + 14], [cx - 2, top + 32], [cx - 7, top + 32]], C.crystal1);
  pc.line(cx - 7, top + 15, cx + 6, top + 30, C.armor, 2);
  pc.rect(cx - 8, top + 29, 16, 4, C.armor);
  pc.rect(cx - 2, top + 29, 4, 4, C.crystal3);
  // Shoulder crystals.
  pc.poly([[cx - 9, top + 16], [cx - 13, top + 4], [cx - 5, top + 14]], C.crystal1);
  pc.poly([[cx + 6, top + 14], [cx + 11, top + 6], [cx + 9, top + 17]], C.crystal2);
  // The head: a dark faceted gem with a ridge crest.
  pc.poly([[cx - 5, top + 13], [cx - 6, top + 4], [cx - 2, top - 3], [cx + 3, top - 4], [cx + 6, top + 3], [cx + 5, top + 13]], C.crystal1);
  pc.poly([[cx - 2, top - 3], [cx + 3, top - 4], [cx + 1, top + 6]], C.crystal2);
  pc.line(cx + 1, top - 3, cx, top + 12, C.crystal3);
  pc.rect(cx + 1, top + 5, 4, 2, kneel ? C.crystal3 : C.eye);
  // The striking arm: a crystal blade grows from the forearm.
  const ax = cx + 6;
  const ay = top + 17;
  if (frame === 6) {
    pc.line(ax, ay, ax + 3, ay - 12, C.crystal2, 3);
    pc.poly([[ax + 2, ay - 12], [ax + 6, ay - 26], [ax + 6, ay - 12]], C.crystal3);
    pc.px(ax + 5, ay - 25, C.glint).px(ax + 6, ay - 24, C.glint).px(ax + 4, ay - 24, C.glint);
  } else if (frame === 7) {
    pc.line(ax, ay, ax + 10, ay + 4, C.crystal2, 3);
    pc.poly([[ax + 9, ay + 1], [ax + 24, ay + 6], [ax + 9, ay + 7]], C.crystal3);
    pc.line(ax + 10, ay + 3, ax + 22, ay + 6, C.glint);
  } else if (frame === 8) {
    pc.line(ax, ay, ax + 11, ay - 2, C.crystal2, 3);
    for (const [dx, dy] of [[14, -6], [16, 0], [14, 6]] as const) pc.poly([[ax + dx, ay + dy - 1], [ax + dx + 5, ay + dy], [ax + dx, ay + dy + 1]], C.crystal3);
  } else if (frame === 10) {
    pc.line(ax, ay, ax + 6, ay - 4, C.crystal2, 3);
    pc.poly([[ax + 4, ay - 14], [ax + 10, ay - 10], [ax + 10, ay + 8], [ax + 4, ay + 10]], C.crystal3);
  } else if (kneel) {
    pc.line(ax - 2, ay, ax + 4, ay + 12, C.crystal2, 3);
  } else {
    pc.line(ax, ay, ax + 3 - walk, ay + 12, C.crystal2, 3);
  }
  pc.outline(INK);
}

/** Tetrax in the dialogue box: the dark gem head and the green eyes, unreadable. */
export function drawTetraxPortrait(pc: PixelCanvas): void {
  const C = TETRAX_COLORS;
  pc.rect(0, 0, 48, 48, 0x080c1c);
  for (let i = 0; i < 6; i++) pc.line(i * 9, 48, i * 9 + 12, 0, 0x0c1228);
  pc.poly([[8, 32], [11, 14], [22, 2], [33, 12], [38, 30], [34, 47], [12, 47]], C.crystal1);
  pc.poly([[11, 30], [13, 14], [22, 3], [20, 28]], C.crystal2);
  pc.line(22, 3, 20, 28, C.crystal3, 2);
  pc.rect(16, 28, 20, 6, C.crystal0);
  pc.rect(20, 29, 5, 3, C.eye).rect(29, 29, 5, 3, C.eye);
  pc.rect(6, 40, 36, 8, C.armor);
  pc.line(6, 40, 30, 47, C.armor2, 2);
  pc.outline(INK);
}
