import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/**
 * Dr. Animo's mutants, drawn facing right. Each frame is centred on the
 * enemy's body (the Drone sprite's origin), feet near the bottom. Frame 2 is
 * always the tell (crouch, hiss, aim, pound, screech).
 */
export const MUTANT_SIZES = {
  rat: { w: 22, h: 14 },
  roach: { w: 24, h: 13 },
  lurker: { w: 28, h: 16 },
  brute: { w: 44, h: 38 },
  bat: { w: 24, h: 16 },
} as const;

const VEIN = P.mutagen;

export function drawRat(pc: PixelCanvas, frame: number): void {
  const fur = 0x8a7464;
  const dark = 0x4e3e36;
  const crouch = frame === 2;
  const leap = frame === 3;
  const by = crouch ? 9 : leap ? 6 : 8;
  // Long naked tail.
  pc.line(5, by, 1, by - 3 + (frame === 1 ? 1 : 0), 0xd8909a);
  pc.px(0, by - 4 + (frame === 1 ? 1 : 0), 0xd8909a);
  // Hunched body with a mutagen-swollen back.
  pc.ellipse(10, by, 6, crouch ? 3 : 4, fur);
  pc.ellipse(9, by - 2, 4, 2, dark);
  pc.line(7, by - 3, 11, by - 4, VEIN);
  pc.px(9, by - 4, P.mutagenGlow);
  // Head: pointed snout, red eye, ears, a tooth.
  pc.poly([[14, by - 3], [20, by], [15, by + 2], [13, by + 1]], fur);
  pc.rect(14, by - 5, 2, 2, 0xd8909a);
  pc.px(16, by - 1, P.enemyGlow).px(20, by, P.ink).px(18, by + 1, P.white);
  // Legs.
  const legs = leap ? [[7, 3], [13, 3]] : frame === 0 ? [[6, 0], [13, 1]] : frame === 1 ? [[8, 1], [11, 0]] : [[7, 0], [13, 0]];
  for (const [x, lift] of legs) pc.rect(x, by + 2 - lift, 2, Math.max(2, 13 - (by + 2) - lift), dark);
  pc.outline(P.ink);
}

export function drawRoach(pc: PixelCanvas, frame: number): void {
  const shell = 0x5a3a1e;
  const hi = 0x9a6a3a;
  const hiss = frame === 2;
  const by = hiss ? 6 : 7;
  // Legs: three pairs, scuttling.
  for (let i = 0; i < 3; i++) {
    const x = 7 + i * 5;
    const sw = (frame + i) % 2 === 0 ? -1 : 1;
    pc.line(x, by + 2, x + sw * 2, 11, 0x2e1e10);
  }
  // Shell.
  pc.ellipse(11, by, 9, 4, shell);
  pc.line(4, by - 2, 17, by - 3, hi);
  pc.vline(11, by - 3, by + 2, 0x2e1e10);
  pc.px(8, by - 1, VEIN).px(14, by - 1, VEIN);
  // Head and antennae (raised when it hisses).
  pc.ellipse(20, by + 1, 2, 2, 0x3a2614);
  pc.px(21, by, hiss ? P.enemyGlow : P.mutagen);
  const ant = hiss ? -6 : -3;
  pc.line(21, by - 1, 23, by + ant, hi).line(20, by - 1, 22, by + ant - 1, hi);
  pc.outline(P.ink);
}

export function drawLurker(pc: PixelCanvas, frame: number): void {
  const skin = 0x5aa848;
  const dark = 0x2e6a2a;
  const light = 0xa8e070;
  const aim = frame === 2;
  const spit = frame === 3;
  // Curled tail.
  pc.line(6, 10, 2, 9, dark, 2);
  pc.line(2, 9, 1, 6, dark, 2);
  pc.px(3, 6, dark).px(3, 7, dark);
  // Body low to the ground, patterned.
  pc.ellipse(12, 10, 7, 3, skin);
  pc.line(7, 8, 16, 7, light);
  for (const x of [9, 12, 15]) pc.px(x, 9, dark);
  // Legs splayed.
  pc.line(8, 12, 6, 14, dark).line(15, 12, 17, 14, dark);
  // Head with a turret eye; throat swells green when it's about to spit.
  pc.ellipse(21, 9, 4, 3, skin);
  if (aim) pc.ellipse(21, 12, 3, 2, P.mutagen);
  pc.circle(21, 7, 2, light);
  pc.px(22, 7, aim ? P.white : P.ink);
  if (aim) pc.px(23, 6, P.white);
  if (spit) {
    pc.poly([[24, 9], [27, 8], [27, 12], [24, 11]], 0x3a0a14);
    pc.px(27, 10, P.mutagen);
  } else pc.line(23, 10, 25, 10, dark);
  if (frame === 1) pc.px(21, 7, light).px(22, 7, dark);
  pc.outline(P.ink);
}

export function drawBrute(pc: PixelCanvas, frame: number): void {
  const fur = 0x6a4028;
  const furLight = 0x9a6a40;
  const dark = 0x3a2014;
  const tusk = 0xf0e6c8;
  const pound = frame === 2;
  const charge = frame === 3;
  const bob = frame === 1 ? 1 : 0;
  const by = 20 + bob + (charge ? 2 : 0);
  const rear = pound ? -4 : 0;
  // Back legs and front legs: thick pillars.
  const step = frame === 1 ? 2 : frame === 3 ? -3 : 0;
  pc.rect(9 - step, by + 6, 6, 34 - (by + 6) + 1, dark);
  pc.rect(25 + step, by + 6 + rear, 6, 34 - (by + 6 + rear) + 1, pound ? fur : dark);
  pc.rect(13 + step, by + 6, 6, 34 - (by + 6) + 1, fur);
  pc.rect(28 - step, by + 6 + rear, 6, 34 - (by + 6 + rear) + 1, fur);
  for (const x of [9 - step, 13 + step, 25 + step, 28 - step]) pc.rect(x, 33, 6, 2, furLight);
  // Shaggy body, humped back with glowing mutagen spines.
  pc.ellipse(20, by, 15, 10, fur);
  pc.ellipse(18, by - 3, 11, 6, furLight);
  for (let i = 0; i < 4; i++) {
    const x = 10 + i * 5;
    const y = by - 9 + Math.abs(i - 1.5);
    pc.poly([[x - 2, y + 2], [x + 2, y + 2], [x, y - 4]], P.mutagenDark);
    pc.px(x, y - 2, P.mutagen);
  }
  // Shaggy fringe.
  for (let x = 7; x < 34; x += 3) pc.line(x, by + 7, x + 1, by + 10, fur);
  // Head: lowered when charging, raised when pounding.
  const hx = 34;
  const hy = by - 2 + rear + (charge ? 4 : 0);
  pc.ellipse(hx, hy, 7, 7, fur);
  pc.ellipse(hx + 1, hy - 3, 5, 3, furLight);
  // Glowing eye.
  pc.rect(hx + 2, hy - 2, 2, 2, pound || charge ? P.enemyGlow : P.mutagenGlow);
  // Trunk.
  if (charge) pc.line(hx + 5, hy + 3, hx + 8, hy + 8, fur, 3);
  else if (pound) pc.line(hx + 5, hy + 2, hx + 9, hy - 4, fur, 3);
  else pc.line(hx + 5, hy + 3, hx + 6, hy + 10, fur, 3);
  // Tusks: the front it guards with.
  pc.line(hx + 3, hy + 4, hx + 9, hy + 6 + (charge ? 1 : 0), tusk, 2);
  pc.px(hx + 9, hy + 5 + (charge ? 1 : 0), P.white);
  pc.outline(P.ink);
}

export function drawBat(pc: PixelCanvas, frame: number): void {
  const wing = 0x6a3a8a;
  const body = 0x3a1e4e;
  if (frame === 3) {
    // Roosting upside down, wrapped in its wings.
    pc.ellipse(12, 8, 4, 6, wing);
    pc.line(12, 1, 12, 2, body);
    pc.px(11, 12, P.enemy).px(13, 12, P.enemy);
    pc.outline(P.ink);
    return;
  }
  const up = frame === 0;
  const screech = frame === 2;
  // Wings.
  if (up) {
    pc.poly([[11, 8], [2, 1], [4, 6], [1, 8]], wing);
    pc.poly([[13, 8], [22, 1], [20, 6], [23, 8]], wing);
  } else {
    pc.poly([[11, 7], [1, 9], [4, 12], [6, 10]], wing);
    pc.poly([[13, 7], [23, 9], [20, 12], [18, 10]], wing);
  }
  // Body and head with ears.
  pc.ellipse(12, 8, 3, 4, body);
  pc.px(10, 3, body).px(14, 3, body);
  pc.px(11, 6, screech ? P.white : P.enemy).px(13, 6, screech ? P.white : P.enemy);
  if (screech) pc.rect(11, 9, 3, 2, 0x3a0a14);
  pc.px(12, 11, VEIN);
  pc.outline(P.ink);
}
