import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/**
 * SUMO SLAMMERS' two wrestlers, drawn like a 90s coin-op: big round bodies,
 * tiny top-knots. Variant 0 is the player's (green mawashi, brown hair),
 * variant 1 is KEV's (purple mawashi, long black hair, a scowl). Both face
 * right; KEV is flipped on screen. 44x40.
 * Frames: 0-1 idle, 2 slap, 3 arms up (the tell), 4 shove, 5 sidestep,
 * 6 stagger, 7 down.
 */
export const SUMO_FRAME = { w: 44, h: 40 } as const;
export const SUMO_FRAME_COUNT = 8;
export const SUMO_POSE = { idle: 0, slap: 2, tell: 3, shove: 4, dodge: 5, stagger: 6, down: 7 } as const;

const SKIN = 0xf0c098;
const SKIN_DARK = 0xd09870;

export function drawSumo(variant: 0 | 1): (pc: PixelCanvas, frame: number) => void {
  const belt = variant === 0 ? 0x2ea84a : 0x7a3ac8;
  const beltDark = variant === 0 ? 0x1e7a34 : 0x4e2290;
  const hair = variant === 0 ? 0x6a3a1a : 0x14101a;
  return (pc, frame) => {
    if (frame === SUMO_POSE.down) {
      // Flat on his back.
      pc.ellipse(22, 33, 18, 6, SKIN);
      pc.rect(10, 31, 24, 4, belt);
      pc.circle(38, 32, 5, SKIN).px(39, 30, P.ink).px(37, 30, P.ink);
      pc.rect(40, 27, 3, 3, hair);
      pc.outline(P.ink);
      return;
    }
    const lean = frame === SUMO_POSE.slap ? 3 : frame === SUMO_POSE.shove ? 5 : frame === SUMO_POSE.stagger ? -4 : frame === SUMO_POSE.dodge ? -2 : 0;
    const bob = frame === 1 ? 1 : 0;
    const dx = frame === SUMO_POSE.dodge ? -6 : 0;
    const cx = 20 + lean + dx;
    // Legs: wide stance.
    pc.rect(11 + dx, 30, 7, 8, SKIN_DARK).rect(24 + dx + Math.max(0, lean), 30, 7, 8, SKIN_DARK);
    pc.rect(10 + dx, 37, 9, 2, SKIN_DARK).rect(23 + dx + Math.max(0, lean), 37, 9, 2, SKIN_DARK);
    // The round body and the mawashi.
    pc.ellipse(cx, 22 + bob, 14, 12, SKIN);
    pc.ellipse(cx + 3, 18 + bob, 7, 5, 0xf8d4b0);
    pc.rect(cx - 13, 27 + bob, 26, 5, belt);
    pc.rect(cx - 2, 27 + bob, 4, 9, beltDark);
    // The head with its top-knot.
    const hx = cx + 6;
    const hy = 8 + bob;
    pc.circle(hx, hy, 6, SKIN);
    pc.rect(hx - 6, hy - 6, 10, 4, hair).rect(hx - 2, hy - 10, 4, 4, hair);
    if (variant === 1) pc.rect(hx - 7, hy - 4, 3, 9, hair);
    pc.px(hx + 3, hy, P.ink).px(hx + 3, hy - 1, P.ink);
    if (variant === 1) pc.line(hx + 1, hy - 3, hx + 5, hy - 2, P.ink);
    pc.px(hx + 4, hy + 3, 0x8a3a2a);
    // Arms.
    const arm = (x0: number, y0: number, x1: number, y1: number) => {
      pc.line(x0, y0, x1, y1, SKIN, 4);
      pc.circle(x1, y1, 3, SKIN);
    };
    switch (frame) {
      case SUMO_POSE.tell:
        arm(cx - 6, 16, cx - 9, 1);
        arm(cx + 6, 16, cx + 10, 1);
        break;
      case SUMO_POSE.slap:
        arm(cx + 8, 18, cx + 19, 17);
        arm(cx - 6, 20, cx - 2, 26);
        break;
      case SUMO_POSE.shove:
        arm(cx + 6, 16, cx + 18, 14);
        arm(cx + 6, 22, cx + 18, 22);
        break;
      case SUMO_POSE.stagger:
        arm(cx - 6, 16, cx - 14, 10);
        arm(cx + 6, 16, cx + 12, 8);
        break;
      default:
        arm(cx + 7, 18, cx + 13, 25);
        arm(cx - 7, 18, cx - 11, 25);
    }
    pc.outline(P.ink);
  };
}

/** The ring seen from the side: a raised clay dohyo with its straw border. 240x28. */
export function drawSumoRing(pc: PixelCanvas): void {
  pc.poly([[12, 6], [228, 6], [240, 28], [0, 28]], 0xc89a5a);
  pc.rect(12, 4, 216, 4, 0xe0b878);
  for (let x = 16; x < 226; x += 6) pc.rect(x, 4, 4, 2, 0xa8844a);
  pc.rect(118, 8, 4, 2, P.white);
  pc.rect(110, 10, 20, 1, 0xa8844a);
  for (let y = 12; y < 28; y += 4) pc.hline(Math.round(12 - (y - 6) * 0.55), Math.round(228 + (y - 6) * 0.55), y, 0xb88a4a);
  pc.outline(P.ink);
}
