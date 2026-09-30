import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

export function drawSoft(pc: PixelCanvas): void {
  const r = pc.width / 2;
  pc.radial(r, r, r, [
    [0, 0xffffff, 1],
    [0.35, 0xffffff, 0.55],
    [1, 0xffffff, 0],
  ]);
}

/** Lightmap stamp: a smooth falloff so overlapping lights blend naturally. */
export function drawLight(pc: PixelCanvas): void {
  const r = pc.width / 2;
  pc.radial(r, r, r, [
    [0, 0xffffff, 1],
    [0.25, 0xffffff, 0.85],
    [0.6, 0xffffff, 0.35],
    [1, 0xffffff, 0],
  ]);
}

export function drawPixel(pc: PixelCanvas): void {
  pc.rect(0, 0, pc.width, pc.height, P.white);
}

export function drawSpark(pc: PixelCanvas): void {
  pc.rect(1, 0, 1, 3, P.white).rect(0, 1, 3, 1, P.white);
}

export function drawEmber(pc: PixelCanvas): void {
  pc.rect(1, 0, 1, 3, P.white).rect(0, 1, 3, 1, P.white);
  pc.px(1, 1, P.white);
}

export function drawSmoke(pc: PixelCanvas): void {
  pc.radial(6, 6, 6, [
    [0, 0xffffff, 0.9],
    [0.6, 0xffffff, 0.45],
    [1, 0xffffff, 0],
  ]);
}

export function drawRing(pc: PixelCanvas): void {
  const r = pc.width / 2;
  const ctx = pc.ctx;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(pc.ox + r, pc.oy + r, r - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pc.ox + r, pc.oy + r, r - 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Radial light rays for the transformation burst. */
export function drawRays(pc: PixelCanvas): void {
  const r = pc.width / 2;
  const ctx = pc.ctx;
  ctx.save();
  ctx.translate(pc.ox + r, pc.oy + r);
  const rays = 16;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const spread = i % 2 === 0 ? 0.09 : 0.05;
    const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * r, Math.sin(a) * r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - spread) * r, Math.sin(a - spread) * r);
    ctx.lineTo(Math.cos(a + spread) * r, Math.sin(a + spread) * r);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** The Omnitrix hourglass emblem, white so it can be tinted. */
export function drawHourglass(pc: PixelCanvas): void {
  const s = pc.width;
  const c = s / 2;
  const ctx = pc.ctx;
  ctx.save();
  ctx.translate(pc.ox, pc.oy);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c, c, c - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(c, c, c - s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.moveTo(c - s * 0.32, c - s * 0.36);
  ctx.lineTo(c + s * 0.32, c - s * 0.36);
  ctx.lineTo(c + s * 0.05, c);
  ctx.lineTo(c + s * 0.32, c + s * 0.36);
  ctx.lineTo(c - s * 0.32, c + s * 0.36);
  ctx.lineTo(c - s * 0.05, c);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawFireball(pc: PixelCanvas, frame: number): void {
  // Pointing right; rotated at runtime to match velocity.
  const tail = frame === 0 ? [[2, 6], [4, 4], [4, 8]] : frame === 1 ? [[1, 5], [3, 3], [3, 8]] : [[2, 7], [3, 4], [5, 9]];
  for (const [x, y] of tail) pc.rect(x, y, 3, 2, P.fire3);
  pc.ellipse(9, 6, 4, 4, P.fire2);
  pc.ellipse(10, 6, 3, 3, P.fire1);
  pc.ellipse(10, 6, 1, 1, P.fire0);
  pc.px(11, 5, P.white);
  pc.px(5, 5, P.fire2).px(6, 7, P.fire2);
}

export function drawLaser(pc: PixelCanvas): void {
  pc.rect(0, 1, 12, 3, P.enemy);
  pc.rect(1, 2, 10, 1, P.white);
  pc.rect(9, 0, 3, 5, P.enemyGlow);
  pc.rect(10, 1, 2, 3, P.white);
}

export function drawBossBolt(pc: PixelCanvas): void {
  pc.circle(5, 5, 4, P.enemy);
  pc.circle(5, 5, 2, P.enemyGlow);
  pc.px(5, 5, P.white).px(4, 4, P.white);
}

export function drawShockwave(pc: PixelCanvas, frame: number): void {
  const h = pc.height;
  for (let x = 0; x < pc.width; x++) {
    const peak = Math.round(h - 2 - Math.abs(Math.sin((x + frame * 3) * 0.5)) * (h - 5) * (1 - Math.abs(x - pc.width / 2) / pc.width));
    pc.vline(x, peak, h - 1, x % 3 === frame % 3 ? P.enemyGlow : P.enemy);
    pc.px(x, peak, P.white);
  }
}

export function drawBomb(pc: PixelCanvas, frame: number): void {
  pc.ellipse(4, 6, 3, 4, P.metal1);
  pc.rect(2, 0, 5, 3, P.metal2);
  pc.px(4, 6, frame === 0 ? P.enemy : P.white);
  pc.outline(P.ink);
}

export function drawReticle(pc: PixelCanvas): void {
  const c = 8;
  const ctx = pc.ctx;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pc.ox + c, pc.oy + c, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  pc.rect(c - 1, 0, 2, 4, P.white).rect(c - 1, 12, 2, 4, P.white);
  pc.rect(0, c - 1, 4, 2, P.white).rect(12, c - 1, 4, 2, P.white);
  pc.rect(c - 1, c - 1, 2, 2, P.white);
}

/** Beam cross-section, stretched horizontally at runtime. */
export function drawBeam(pc: PixelCanvas): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, P.enemy, 0],
    [0.2, P.enemy, 0.9],
    [0.4, P.enemyGlow, 1],
    [0.5, P.white, 1],
    [0.6, P.enemyGlow, 1],
    [0.8, P.enemy, 0.9],
    [1, P.enemy, 0],
  ]);
}

export function drawDebrisBits(pc: PixelCanvas, frame: number): void {
  const shapes = [
    [[0, 0, 3, 2]],
    [[0, 0, 2, 3]],
    [[0, 1, 3, 1], [1, 0, 1, 3]],
    [[0, 0, 2, 2]],
  ];
  for (const [x, y, w, h] of shapes[frame]) pc.rect(x, y, w, h, frame % 2 ? P.metal2 : P.metal3);
}

export function drawLeaf(pc: PixelCanvas): void {
  pc.rect(0, 0, 2, 1, P.white).px(1, 1, P.white);
}

export function drawShadow(pc: PixelCanvas): void {
  pc.ellipse(pc.width / 2, pc.height / 2, pc.width / 2 - 1, pc.height / 2 - 1, P.ink, 0.6);
}

export function drawWater(pc: PixelCanvas, frame: number): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, P.water1, 0.85],
    [0.25, P.water0, 0.85],
    [1, 0x0a1a33, 0.95],
  ]);
  for (let x = 0; x < pc.width; x++) {
    const y = Math.round(1 + Math.sin((x + frame * 4) * 0.4) * 1);
    pc.px(x, y, P.water2, 0.9);
  }
  for (let i = 0; i < 3; i++) pc.rect((i * 11 + frame * 3) % pc.width, 6 + i * 3, 4, 1, P.water2, 0.35);
}

export function drawAfterimage(pc: PixelCanvas): void {
  pc.rect(0, 0, pc.width, pc.height, P.white);
}
