import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

export const HEART_FRAMES = { full: 0, half: 1, empty: 2 } as const;

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

export function drawHeart(pc: PixelCanvas, frame: number): void {
  for (let y = 0; y < HEART.length; y++) {
    for (let x = 0; x < HEART[y].length; x++) {
      if (HEART[y][x] !== '#') continue;
      let color: number = P.heart;
      if (frame === 2 || (frame === 1 && x > 3)) color = 0x3a2436;
      else if (frame === 1 && x === 3) color = P.heart;
      pc.px(x + 1, y + 1, color);
    }
  }
  if (frame !== 2) pc.px(2, 2, P.white).px(3, 2, 0xffb0c0);
  pc.outline(P.ink);
}

/** Omnitrix dial bezel: dark ring with green inlays. The timer ring is drawn live on top. */
export function drawDialFrame(pc: PixelCanvas): void {
  const c = pc.width / 2;
  pc.circle(c, c, c - 1, P.ink);
  pc.circle(c, c, c - 3, 0x2a2f3f);
  pc.circle(c, c, c - 7, 0x161a26);
  pc.circle(c, c, c - 9, P.omnitrixDeep);
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]) {
    pc.rect(c + dx * (c - 5) - 1, c + dy * (c - 5) - 1, 3, 3, 0x4a5064);
    pc.px(c + dx * (c - 5), c + dy * (c - 5), P.omnitrixDark);
  }
}

export function drawBenIcon(pc: PixelCanvas): void {
  pc.rect(2, 3, 8, 8, P.skin0);
  pc.rect(2, 2, 8, 3, P.hair0).rect(2, 2, 2, 6, P.hair0);
  pc.px(3, 1, P.hair0).px(5, 0, P.hair0).px(7, 1, P.hair0);
  pc.px(7, 6, P.ink).px(8, 6, 0x3fae52);
  pc.outline(P.ink);
}

export function drawCardIcon(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.rect(1, 1, 7, 9, 0x2a2f45);
    pc.rect(2, 2, 5, 7, 0x1a1d2e);
  } else {
    pc.rect(1, 1, 7, 9, P.gold);
    pc.rect(2, 2, 5, 7, 0xd8323e);
    pc.rect(3, 3, 3, 3, 0xffe0b8);
  }
  pc.outline(P.ink);
}

export function drawDroneIcon(pc: PixelCanvas): void {
  pc.circle(5, 4, 3, P.metal2);
  pc.rect(4, 3, 3, 2, P.enemy);
  pc.rect(0, 3, 2, 2, P.metal1).rect(9, 3, 2, 2, P.metal1);
  pc.outline(P.ink);
}

export function drawBossIcon(pc: PixelCanvas): void {
  pc.poly([[2, 1], [11, 1], [13, 5], [11, 9], [2, 9], [0, 5]], P.metal1);
  pc.circle(7, 5, 2, P.enemy);
  pc.outline(P.ink);
}

/** Soft screen-edge vignette, tinted at runtime (low health, death). */
export function drawVignette(pc: PixelCanvas): void {
  const ctx = pc.ctx;
  const w = pc.width;
  const h = pc.height;
  const grad = ctx.createRadialGradient(pc.ox + w / 2, pc.oy + h / 2, h * 0.35, pc.ox + w / 2, pc.oy + h / 2, w * 0.62);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(pc.ox, pc.oy, w, h);
}

/** On-screen control icons: white so they tint with the button. 16x16. */
export function drawTouchJump(pc: PixelCanvas): void {
  for (let i = 0; i < 6; i++) {
    pc.rect(7 - i, 3 + i, 2, 2, P.white).rect(7 + i, 3 + i, 2, 2, P.white);
  }
  pc.rect(7, 5, 2, 9, P.white);
}

export function drawTouchPunch(pc: PixelCanvas): void {
  pc.rect(3, 5, 9, 7, P.white);
  pc.rect(4, 4, 7, 1, P.white).rect(4, 12, 7, 1, P.white);
  pc.rect(12, 7, 2, 4, P.white);
  for (let x = 5; x < 12; x += 2) pc.px(x, 7, P.ink);
  pc.rect(0, 7, 2, 1, P.white).rect(0, 10, 2, 1, P.white);
}

export function drawTouchRoll(pc: PixelCanvas): void {
  for (let a = 0.6; a < Math.PI * 1.8; a += 0.22) pc.rect(8 + Math.cos(a) * 5, 8 + Math.sin(a) * 5, 2, 2, P.white);
  pc.poly([[11, 1], [15, 5], [10, 6]], P.white);
}

export function drawTouchPause(pc: PixelCanvas): void {
  pc.rect(4, 3, 3, 10, P.white).rect(9, 3, 3, 10, P.white);
}

/** Achievement badge icons, 12x12: 0 Omnitrix, 1 star, 2 skull, 3 laughing face, 4 stopwatch. */
export const ACH_ICON_FRAMES = { omnitrix: 0, star: 1, skull: 2, laugh: 3, clock: 4 } as const;

export function drawAchievementIcon(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.circle(6, 6, 5, P.ink);
    pc.circle(6, 6, 4, P.omnitrixDeep);
    pc.poly([[3, 2], [9, 2], [7, 6], [9, 10], [3, 10], [5, 6]], P.omnitrix);
    pc.px(6, 6, P.white);
  } else if (frame === 1) {
    pc.poly([[6, 0], [8, 4], [12, 4], [9, 7], [10, 11], [6, 9], [2, 11], [3, 7], [0, 4], [4, 4]], P.gold);
    pc.px(6, 4, P.white).px(5, 5, 0xfff2b0);
    pc.outline(P.ink);
  } else if (frame === 2) {
    pc.circle(6, 5, 4, P.cream);
    pc.rect(4, 8, 5, 3, P.cream);
    pc.rect(3, 4, 2, 2, P.ink).rect(7, 4, 2, 2, P.ink);
    pc.px(6, 7, P.ink).px(5, 10, P.ink).px(7, 10, P.ink);
    pc.outline(P.ink);
  } else if (frame === 3) {
    pc.circle(6, 6, 5, P.gold);
    pc.hline(3, 4, 4, P.ink).hline(7, 8, 4, P.ink);
    pc.rect(3, 7, 6, 2, P.ink);
    pc.hline(4, 7, 9, P.ink);
    pc.px(4, 8, 0xff6a6a).px(7, 8, 0xff6a6a);
    pc.outline(P.ink);
  } else {
    pc.rect(5, 0, 2, 2, P.metal2);
    pc.circle(6, 7, 5, P.cream);
    pc.vline(6, 3, 7, P.ink);
    pc.hline(6, 8, 7, P.ink);
    pc.px(6, 3, 0xd8323e);
    pc.outline(P.ink);
  }
}
