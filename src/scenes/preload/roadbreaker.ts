import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/**
 * ROADBREAKER: the runaway hauler's cab rebuilt into a war rig. Red cab
 * panels and black armour from the hauler, Vilgax-red glow, and yellow-black
 * hazard stripes on everything only Four Arms can break (the plow, the chest plates).
 */
const RED = 0x8a1424;
const RED_HI = 0xc0283a;
const RED_LO = 0x5a0c18;
const STRIPE_Y = 0xf2c94c;

function stripes(pc: PixelCanvas, x: number, y: number, w: number, h: number): void {
  pc.rect(x, y, w, h, STRIPE_Y);
  for (let i = -h; i < w; i += 6) {
    for (let k = 0; k < 3; k++) {
      for (let yy = 0; yy < h; yy++) {
        const xx = i + k + yy;
        if (xx >= 0 && xx < w) pc.px(x + xx, y + yy, P.ink);
      }
    }
  }
}

/** Truck mode, facing right. Frames: 0-1 driving, 2 revving (headlights blazing, stacks spitting fire), 3 stalled (dented, dim). */
export const RB_TRUCK = { w: 128, h: 60 } as const;

export function drawRbTruck(pc: PixelCanvas, frame: number): void {
  const rev = frame === 2;
  const stalled = frame === 3;
  // Wheel wells (the wheels are their own sprites).
  pc.circle(32, 48, 13, P.ink).circle(98, 48, 13, P.ink);
  // Chassis rail.
  pc.rect(4, 38, 120, 6, P.metal0);
  // Rear bed with the barrel crane.
  pc.rect(4, 22, 54, 16, RED);
  pc.rect(4, 22, 54, 2, RED_HI);
  pc.rect(8, 26, 46, 8, RED_LO);
  for (const x of [12, 22, 32, 42]) pc.rect(x, 27, 6, 6, P.rust1).rect(x, 27, 6, 1, 0xc06a3a);
  pc.line(10, 22, 22, 6, P.metal2, 3);
  pc.line(22, 6, 40, 10, P.metal2, 2);
  pc.rect(38, 8, 6, 6, P.metal1);
  pc.px(41, 11, P.enemy);
  // Exhaust stacks.
  for (const x of [60, 67]) {
    pc.rect(x, 0, 4, 14, P.metal2);
    pc.rect(x, 0, 4, 2, P.metal3);
    if (rev) pc.rect(x, 0, 4, 3, P.fire1);
  }
  // Cab.
  pc.poly([[58, 10], [98, 10], [112, 22], [114, 38], [58, 38]], RED);
  pc.rect(58, 10, 40, 2, RED_HI);
  pc.poly([[78, 13], [96, 13], [107, 23], [78, 23]], P.ink);
  // The Vilgax core glaring through the windshield.
  const core = stalled ? P.enemyDark : P.enemy;
  pc.circle(92, 18, 4, P.metal0);
  pc.circle(92, 18, 3, core);
  if (!stalled) pc.px(91, 17, P.enemyGlow);
  // Black armour plating on the door, with the emblem.
  pc.rect(60, 26, 30, 12, P.metal1);
  pc.rect(60, 26, 30, 1, P.metal2);
  pc.poly([[70, 28], [80, 28], [75, 33]], P.enemyDark);
  pc.poly([[70, 36], [80, 36], [75, 31]], P.enemyDark);
  for (const x of [63, 87]) pc.px(x, 29, P.metal3).px(x, 35, P.metal3);
  // The striped battering plow.
  pc.poly([[112, 18], [127, 26], [127, 46], [112, 46]], P.metal1);
  stripes(pc, 114, 28, 12, 14);
  pc.rect(112, 44, 16, 3, P.metal0);
  // Headlights.
  pc.rect(108, 23, 4, 3, rev ? P.fire0 : stalled ? P.metal2 : 0xfff0c0);
  // Running lights along the rail.
  for (const x of [10, 26, 42, 56]) pc.px(x, 40, stalled ? P.enemyDark : P.enemy);
  if (stalled) {
    pc.line(80, 14, 88, 22, P.metal3).line(96, 14, 90, 22, P.metal3);
    pc.line(62, 28, 70, 37, P.ink).line(84, 27, 78, 37, P.ink);
    pc.rect(116, 30, 6, 4, P.metal0);
  }
  if (frame === 1) pc.px(91, 19, P.enemyGlow);
  pc.outline(P.ink);
}

/** A big tire. Frames 0-1 rolling, 2 shredded (flat, rubber flapping). */
export const RB_WHEEL = { w: 26, h: 26 } as const;

export function drawRbWheel(pc: PixelCanvas, frame: number): void {
  if (frame === 2) {
    pc.ellipse(13, 17, 12, 8, P.ink);
    pc.ellipse(13, 17, 10, 6, 0x2a2a34);
    pc.circle(13, 15, 5, P.metal1);
    pc.circle(13, 15, 2, P.metal2);
    pc.line(2, 20, 0, 25, 0x2a2a34, 2).line(23, 19, 26, 24, 0x2a2a34, 2);
    pc.outline(P.ink);
    return;
  }
  pc.circle(13, 13, 12, P.ink);
  pc.circle(13, 13, 11, 0x2a2a34);
  // Tread blocks.
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2 + (frame === 1 ? Math.PI / 10 : 0);
    pc.px(Math.round(13 + Math.cos(ang) * 10.5), Math.round(13 + Math.sin(ang) * 10.5), 0x4a4a58);
  }
  pc.circle(13, 13, 6, P.metal1);
  pc.circle(13, 13, 4, P.metal2);
  // Spokes and a red hub.
  for (let a = 0; a < 3; a++) {
    const ang = (a / 3) * Math.PI * 2 + (frame === 1 ? Math.PI / 3 : 0);
    pc.line(13, 13, Math.round(13 + Math.cos(ang) * 5), Math.round(13 + Math.sin(ang) * 5), P.metal3);
  }
  pc.circle(13, 13, 2, P.enemy);
}

/** Robot mode legs (the plow and chassis rails as pistons). Frames: 0 stand, 1-2 stride, 3 kneel. */
export const RB_LEGS = { w: 68, h: 38 } as const;

export function drawRbLegs(pc: PixelCanvas, frame: number): void {
  const kneel = frame === 3;
  const lift = frame === 1 ? [-3, 0] : frame === 2 ? [0, -3] : [0, 0];
  // Hips.
  pc.rect(14, 0, 40, 8, P.metal1);
  pc.rect(14, 0, 40, 2, P.metal2);
  pc.px(34, 4, P.enemy);
  for (const [i, side] of [[0, -1], [1, 1]] as const) {
    const cx = 34 + side * 15;
    const up = lift[i];
    if (kneel) {
      pc.line(cx, 6, cx + side * 8, 24, P.metal1, 7);
      pc.line(cx + side * 8, 24, cx + side * 2, 34, P.metal2, 6);
      pc.rect(cx + side * 2 - 9, 32, 18, 6, RED);
      continue;
    }
    // Thigh piston, shin with stripes, a heavy foot.
    pc.rect(cx - 4, 6 + up, 8, 14, P.metal1);
    pc.rect(cx - 2, 8 + up, 4, 10, P.metal2);
    pc.rect(cx - 6, 18 + up, 12, 12, RED);
    pc.rect(cx - 6, 18 + up, 12, 2, RED_HI);
    stripes(pc, cx - 5, 22 + up, 10, 4);
    pc.rect(cx - 9, 30 + up, 18, 8 - Math.max(0, -up), P.metal0);
    pc.rect(cx - 9, 30 + up, 18, 2, P.metal2);
  }
  pc.outline(P.ink);
}

/** Robot torso: the cab stood on end. Frames: 0 normal, 1 vents open (glowing), 2 seized (overheated, dim). */
export const RB_TORSO = { w: 84, h: 58 } as const;

export function drawRbTorso(pc: PixelCanvas, frame: number): void {
  const vent = frame === 1;
  const seized = frame === 2;
  // Shoulder housings (the wheels sit on them as their own sprites).
  pc.rect(0, 10, 16, 18, P.metal1).rect(68, 10, 16, 18, P.metal1);
  pc.rect(0, 10, 16, 2, P.metal2).rect(68, 10, 16, 2, P.metal2);
  // Body.
  pc.poly([[14, 6], [70, 6], [74, 40], [62, 58], [22, 58], [10, 40]], RED);
  pc.rect(14, 6, 56, 3, RED_HI);
  pc.line(18, 12, 22, 50, RED_LO).line(66, 12, 62, 50, RED_LO);
  // Head: the windshield turned visor, the core glaring through.
  pc.rect(28, 0, 28, 12, P.metal0);
  pc.rect(30, 3, 24, 5, P.ink);
  const eye = seized ? P.enemyDark : P.enemy;
  pc.rect(32, 4, 20, 3, eye);
  if (!seized) pc.rect(38, 4, 8, 1, P.enemyGlow);
  // Chest core (the plates cover it until Four Arms breaks them).
  pc.circle(42, 28, 9, P.metal0);
  pc.circle(42, 28, 7, P.enemyDark);
  pc.circle(42, 28, 4, seized ? P.fire3 : P.enemy);
  pc.px(41, 27, P.enemyGlow);
  // Belly radiator.
  pc.rect(28, 42, 28, 10, P.metal0);
  for (let y = 43; y < 52; y += 2) pc.rect(30, y, 24, 1, vent ? (y % 4 === 1 ? P.fire1 : P.fire2) : seized ? P.fire3 : P.metal1);
  // Exhaust stacks over the shoulders.
  for (const x of [16, 64]) pc.rect(x, 0, 4, 8, P.metal2);
  pc.outline(P.ink);
}

/** An arm: piston upper arm and a huge fist. Origin at the shoulder (top). */
export const RB_ARM = { w: 26, h: 52 } as const;

export function drawRbArm(pc: PixelCanvas): void {
  pc.rect(9, 0, 8, 26, P.metal1);
  pc.rect(11, 2, 4, 22, P.metal2);
  pc.circle(13, 4, 5, P.metal0);
  pc.px(13, 4, P.enemy);
  // Fist.
  pc.rect(2, 26, 22, 24, RED);
  pc.rect(2, 26, 22, 3, RED_HI);
  for (const x of [4, 10, 16]) pc.rect(x, 44, 5, 5, P.metal2);
  pc.rect(2, 36, 22, 2, RED_LO);
  pc.outline(P.ink);
}

/** A chest plate: hazard-striped armour only smash damage cracks. Frames: 0 whole, 1 cracked. */
export const RB_PLATE = { w: 18, h: 14 } as const;

export function drawRbPlate(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 0, 18, 14, P.metal1);
  stripes(pc, 2, 2, 14, 10);
  pc.rect(0, 0, 18, 1, P.metal3);
  for (const [x, y] of [[1, 1], [16, 1], [1, 12], [16, 12]]) pc.px(x, y, P.metal3);
  if (frame === 1) pc.line(4, 1, 9, 7, P.ink).line(9, 7, 7, 13, P.ink).line(9, 7, 15, 5, P.ink);
  pc.outline(P.ink);
}
