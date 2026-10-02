import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/** The Rustbucket at full size (the roof is a 10-tile platform). Frames 0-1: wheels turning; 2: brake lights. */
export const RUSTBUCKET = { w: 176, h: 68, roofY: 10, wheelY: 58 } as const;

/** Grandpa Max's RV: cream body, the brown-and-orange stripe, roof hatch, AC box and the ladder on the back. */
export function drawRustbucket(pc: PixelCanvas, frame: number): void {
  const { w, h } = RUSTBUCKET;
  const cream = 0xece4cc;
  const shade = 0xc9bea0;
  const brown = 0x6b4128;
  const orange = 0xd8742c;
  const glass = 0x2a3a5e;
  // Roof gear.
  pc.rect(54, 2, 22, 8, 0xd8d8e0);
  pc.rect(54, 2, 22, 2, 0xf4f4fa);
  for (let x = 57; x < 74; x += 3) pc.rect(x, 5, 1, 4, 0x9a9aa6);
  pc.rect(100, 6, 18, 4, 0xbcb4a0);
  pc.rect(100, 6, 18, 1, 0xe0d8c4);
  // Body: boxy RV with a rounded cab over the front (right).
  pc.rect(8, 10, w - 40, 44, cream);
  pc.poly([[w - 32, 10], [w - 14, 14], [w - 4, 28], [w - 2, 54], [w - 32, 54]], cream);
  pc.rect(8, 10, w - 40, 3, 0xf8f2e2);
  pc.rect(8, 50, w - 10, 4, shade);
  // The stripe.
  pc.rect(8, 32, w - 10, 5, brown);
  pc.rect(8, 37, w - 10, 3, orange);
  pc.rect(8, 40, w - 10, 1, brown);
  // Windows: side windows glow warm (Gwen and Max are inside).
  for (const x of [22, 52, 82]) {
    pc.rect(x, 16, 20, 12, P.ink);
    pc.rect(x + 1, 17, 18, 10, P.fire1);
    pc.rect(x + 2, 18, 16, 8, 0xffe7a0);
    pc.rect(x + 2, 18, 5, 8, 0xfff3c8);
  }
  pc.rect(112, 16, 10, 22, glass);
  pc.rect(112, 16, 10, 2, 0x5a6a9e);
  pc.vline(121, 18, 34, 0x9a9aa6);
  // Windshield.
  pc.poly([[w - 30, 14], [w - 15, 17], [w - 7, 28], [w - 30, 28]], glass);
  pc.poly([[w - 26, 16], [w - 20, 17], [w - 24, 26], [w - 28, 26]], 0x6a7aae);
  // Headlight, grille, bumper.
  pc.rect(w - 8, 42, 6, 5, P.fire0);
  pc.rect(w - 6, 47, 6, 6, P.metal2);
  pc.rect(w - 12, 54, 12, 3, P.metal1);
  // Ladder and spare tire on the back (left).
  for (let y = 12; y < 52; y += 5) pc.hline(1, 7, y, P.metal2);
  pc.vline(1, 10, 52, P.metal2).vline(7, 10, 52, P.metal2);
  pc.rect(0, 52, 10, 3, P.metal1);
  const brake = frame === 2;
  pc.rect(8, 42, 3, 6, brake ? 0xff3a3a : 0x9a2a2a);
  if (brake) pc.rect(8, 42, 3, 2, 0xffb0a0);
  // Wheels (rear duals and the front).
  for (const cx of [36, 50, w - 36]) {
    pc.circle(cx, RUSTBUCKET.wheelY, 8, P.ink);
    pc.circle(cx, RUSTBUCKET.wheelY, 4, P.metal2);
    const spoke = frame === 1 ? 1 : 0;
    pc.px(cx - 2 + spoke * 4, RUSTBUCKET.wheelY - 2 + spoke * 2, P.metal3).px(cx + 2 - spoke * 4, RUSTBUCKET.wheelY + 2 - spoke * 2, P.metal3);
    pc.px(cx, RUSTBUCKET.wheelY, P.white);
  }
  pc.rect(20, 52, 40, 2, P.ink);
  pc.outline(P.ink);
  void h;
}

/** A convoy rig taken over by Vilgax drone tech: armoured cab, battering plow, a turret on the bed. Faces right. */
export const CONVOY = { w: 112, h: 56 } as const;

/**
 * Frames: 0-1 driving (wheels turning), 2 clamped (the harpoon arm raised and
 * hooked forward), 3 smashed (armour cracked, sparking).
 */
export function drawConvoyTruck(pc: PixelCanvas, frame: number): void {
  const { w, h } = CONVOY;
  const hull = P.metal1;
  const dark = P.metal0;
  const light = P.metal2;
  const smashed = frame === 3;
  // Bed and turret.
  pc.rect(6, 26, 54, 16, hull);
  pc.rect(6, 26, 54, 2, light);
  pc.rect(10, 18, 22, 9, dark);
  pc.rect(12, 16, 16, 4, hull);
  pc.rect(30, 19, 18, 3, dark);
  pc.px(48, 20, P.enemy);
  pc.rect(16, 21, 4, 3, P.enemy);
  // Cab.
  pc.poly([[60, 14], [86, 14], [96, 28], [96, 44], [60, 44]], hull);
  pc.rect(60, 14, 26, 2, light);
  pc.poly([[70, 17], [85, 17], [92, 27], [70, 27]], P.ink);
  // The drone core glaring through the windshield.
  pc.circle(80, 22, 3, P.enemyDark);
  pc.circle(80, 22, 2, P.enemy);
  pc.px(79, 21, P.enemyGlow);
  // Armour plates and rivets.
  pc.rect(62, 30, 32, 12, light);
  pc.rect(62, 30, 32, 1, P.metal3);
  for (const x of [65, 75, 85]) pc.px(x, 33, P.metal3).px(x, 39, P.metal3);
  pc.rect(6, 42, w - 16, 4, dark);
  // Battering plow on the front.
  pc.poly([[96, 26], [w - 2, 32], [w - 2, 48], [96, 48]], P.metal3);
  for (let y = 30; y < 48; y += 4) pc.line(97, y, w - 3, y + 2, light);
  pc.rect(96, 46, 14, 3, dark);
  // Red running lights.
  for (const x of [12, 30, 48]) pc.px(x, 40, P.enemy);
  if (frame === 2) {
    // Harpoon clamp arm raised forward and hooked.
    pc.line(74, 15, 96, 2, P.metal2, 3);
    pc.line(96, 2, w - 2, 4, P.metal2, 3);
    pc.rect(w - 6, 2, 5, 8, P.metal3);
    pc.rect(w - 6, 8, 5, 2, P.enemy);
  } else {
    pc.line(66, 15, 74, 9, P.metal2, 2);
  }
  if (smashed) {
    pc.line(64, 31, 72, 40, P.ink).line(72, 31, 66, 38, P.ink).line(84, 30, 90, 41, P.ink);
    pc.rect(68, 34, 3, 2, P.fire1).rect(86, 36, 3, 2, P.fire2);
  }
  // Wheels.
  for (const cx of [22, 44, 82]) {
    pc.circle(cx, h - 8, 7, P.ink);
    pc.circle(cx, h - 8, 3, P.metal2);
    const s = frame === 1 ? 1 : 0;
    pc.px(cx - 2 + s * 4, h - 10 + s * 2, P.metal3).px(cx + 2 - s * 4, h - 6 - s * 2, P.metal3);
  }
  pc.outline(P.ink);
}

/** The runaway rig's cab: black and red, a glowing Vilgax grille. */
export const HAULER_CAB = { w: 92, h: 76 } as const;
export const HAULER_TRAILER = { w: 168, h: 64 } as const;

export function drawHaulerCab(pc: PixelCanvas, frame: number): void {
  const { w, h } = HAULER_CAB;
  const red = 0x8a1424;
  const redHi = 0xc0283a;
  pc.rect(4, 10, 50, 50, red);
  pc.rect(4, 10, 50, 3, redHi);
  pc.poly([[54, 22], [78, 26], [88, 38], [88, 60], [54, 60]], red);
  pc.poly([[56, 25], [76, 28], [82, 37], [56, 37]], P.ink);
  pc.circle(70, 31, 3, P.enemy);
  pc.px(69, 30, P.enemyGlow);
  // Exhaust stacks.
  for (const x of [8, 16]) {
    pc.rect(x, 0, 4, 12, P.metal2);
    pc.rect(x, 0, 4, 2, P.metal3);
  }
  // The grille: a Vilgax emblem glowing red.
  pc.rect(78, 40, 12, 18, P.ink);
  for (let y = 42; y < 57; y += 3) pc.rect(79, y, 10, 1, frame === 1 ? P.enemyGlow : P.enemy);
  pc.rect(84, 60, 6, 4, P.metal2);
  pc.rect(54, 44, 22, 8, P.metal1);
  pc.rect(2, 56, 86, 4, P.metal0);
  for (const cx of [20, 66]) {
    pc.circle(cx, h - 10, 9, P.ink);
    pc.circle(cx, h - 10, 4, P.metal2);
    pc.px(cx, h - 10, P.white);
  }
  pc.outline(P.ink);
  void w;
}

/** The trailer: a steel box with a hornet hatch on top. Frame 1: the hatch open, red light pouring out. */
export function drawHaulerTrailer(pc: PixelCanvas, frame: number): void {
  const { w, h } = HAULER_TRAILER;
  pc.rect(2, 4, w - 4, 44, 0x5a5a6a);
  pc.rect(2, 4, w - 4, 2, 0x8a8a9a);
  for (let x = 8; x < w - 4; x += 10) pc.rect(x, 8, 1, 38, 0x4a4a58);
  pc.rect(2, 26, w - 4, 3, P.enemyDark);
  pc.rect(w / 2 - 14, 0, 28, 6, frame === 1 ? P.enemy : P.metal1);
  if (frame === 1) pc.rect(w / 2 - 12, 0, 24, 3, P.enemyGlow);
  pc.rect(0, 48, w, 4, P.metal0);
  for (const cx of [18, 34, w - 30]) {
    pc.circle(cx, h - 8, 8, P.ink);
    pc.circle(cx, h - 8, 3, P.metal2);
  }
  pc.outline(P.ink);
}
