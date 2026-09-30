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

/** Alien head icon for the dial, drawn in one colour so it can be tinted as a hologram. */
export function drawHeatblastIcon(pc: PixelCanvas): void {
  const flames = [3, 5, 4, 6, 5, 6, 4, 5, 3];
  for (let i = 0; i < flames.length; i++) pc.vline(3 + i, 7 - flames[i], 6, P.white);
  pc.rect(4, 6, 8, 8, P.white);
  const ctx = pc.ctx;
  ctx.clearRect(pc.ox + 5, pc.oy + 9, 2, 2);
  ctx.clearRect(pc.ox + 9, pc.oy + 9, 2, 2);
  ctx.clearRect(pc.ox + 6, pc.oy + 12, 4, 1);
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
