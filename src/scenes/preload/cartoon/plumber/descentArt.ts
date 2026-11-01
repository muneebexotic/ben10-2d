import Phaser from 'phaser';

/** Chapter 7's opening, drawn when it plays: the jetty and the sea in pixels (the Act 2 look). */
export const DESCENT_TEX = { pixel: 'ch7-descent-px', car: 'ch7-descent-car' } as const;

/** Where things sit in the opening's column (game px; the column is one screen wide and three tall). */
export interface DescentLayout {
  w: number;
  h: number;
  /** The column's height: the jetty's screen, then two screens of sea down to the base. */
  H: number;
  waterline: number;
  /** The deck's top, the jetty's far end and the bollard Max scans his badge on. */
  deck: number;
  jettyEnd: number;
  bollardX: number;
}

export function descentLayout(w: number, h: number): DescentLayout {
  const waterline = Math.round(h * 0.66);
  const jettyEnd = Math.round(w * 0.58);
  return { w, h, H: h * 3, waterline, deck: waterline - 6, jettyEnd, bollardX: jettyEnd - 8 };
}

/** A small repeatable random (the same stars and windows every time). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Bands of colour down the column, dithered where they meet like the pixel chapters' skies. */
function bands(ctx: CanvasRenderingContext2D, w: number, from: number, to: number, colors: readonly string[]): void {
  const n = colors.length;
  const step = (to - from) / n;
  for (let i = 0; i < n; i++) {
    const y0 = Math.round(from + i * step);
    const y1 = Math.round(from + (i + 1) * step);
    ctx.fillStyle = colors[i];
    ctx.fillRect(0, y0, w, y1 - y0);
    if (i + 1 < n) {
      ctx.fillStyle = colors[i + 1];
      for (let y = y1 - 3; y < y1; y++) for (let x = (y % 2) * 1; x < w; x += 2) ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** Keamari at midnight, then down through the sea to the base on the floor: the pixel version. */
export function makeDescentPixels(scene: Phaser.Scene, L: DescentLayout): void {
  if (scene.textures.exists(DESCENT_TEX.pixel)) scene.textures.remove(DESCENT_TEX.pixel);
  const tex = scene.textures.createCanvas(DESCENT_TEX.pixel, L.w, L.H);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  const r = rng(77);
  const { w, waterline: wl } = L;
  // The night sky.
  bands(ctx, w, 0, wl, ['#070b22', '#0a1030', '#0e1640', '#141e50', '#1c285e']);
  ctx.fillStyle = '#c8d0ff';
  for (let i = 0; i < 70; i++) ctx.fillRect(Math.floor(r() * w), Math.floor(r() * (wl - 40)), 1, 1);
  // The moon.
  const mx = Math.round(w * 0.8);
  const my = Math.round(L.h * 0.16);
  ctx.fillStyle = '#f2efd0';
  for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) if (x * x + y * y <= 64) ctx.fillRect(mx + x, my + y, 1, 1);
  ctx.fillStyle = '#d4d0ae';
  ctx.fillRect(mx - 3, my - 2, 2, 2);
  ctx.fillRect(mx + 2, my + 3, 3, 2);
  // Keamari's harbour skyline, cranes and lit windows.
  for (let x = 0; x < w; ) {
    const bw = 6 + Math.floor(r() * 12);
    const bh = 6 + Math.floor(r() * 22);
    ctx.fillStyle = '#10163a';
    ctx.fillRect(x, wl - bh, bw, bh);
    ctx.fillStyle = '#f6d27a';
    for (let i = 0; i < bw * bh * 0.03; i++) ctx.fillRect(x + 1 + Math.floor(r() * (bw - 2)), wl - bh + 1 + Math.floor(r() * (bh - 2)), 1, 1);
    x += bw + Math.floor(r() * 3);
  }
  ctx.fillStyle = '#10163a';
  for (const cx of [Math.round(w * 0.12), Math.round(w * 0.86)]) {
    ctx.fillRect(cx, wl - 44, 2, 44);
    ctx.fillRect(cx - 14, wl - 44, 30, 2);
    ctx.fillRect(cx - 12, wl - 42, 1, 10);
  }
  // The sea, darker with depth, the moon's path on its surface.
  bands(ctx, w, wl, L.H, ['#0c2a52', '#0a2347', '#081c3c', '#061631', '#051126', '#040d1f', '#030a18', '#020711', '#02050d']);
  ctx.fillStyle = '#8aa0d8';
  for (let i = 0; i < 14; i++) {
    const y = wl + 2 + i * 2;
    const len = Math.max(2, 14 - i);
    ctx.fillRect(mx - Math.floor(len / 2) + Math.floor((r() - 0.5) * 6), y, len, 1);
  }
  // Fish and a far rock or two in the dark.
  ctx.fillStyle = '#0d2448';
  for (let i = 0; i < 18; i++) {
    const fx = Math.floor(r() * (w - 6));
    const fy = wl + 30 + Math.floor(r() * (L.H - wl - 120));
    ctx.fillRect(fx, fy, 4, 2);
    ctx.fillRect(fx + 4, fy - 1, 1, 4);
  }
  // The base on the floor: domes, unlit.
  const floor = L.H - 14;
  ctx.fillStyle = '#071226';
  ctx.fillRect(0, floor, w, 14);
  for (const [dx, rx, ry] of [[0.3, 34, 22], [0.52, 46, 30], [0.74, 30, 18]] as const) {
    const cx = Math.round(w * dx);
    ctx.fillStyle = '#0a1830';
    for (let y = -ry; y <= 0; y++) {
      const half = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
      ctx.fillRect(cx - half, floor + y, half * 2, 1);
    }
  }
  // The old navy jetty: planks, posts down into the water, the bollard at the end.
  ctx.fillStyle = '#3a2414';
  for (let x = 4; x < L.jettyEnd; x += 14) ctx.fillRect(x, L.deck, 3, wl - L.deck + 12);
  ctx.fillStyle = '#6b4428';
  ctx.fillRect(0, L.deck, L.jettyEnd, 4);
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(0, L.deck, L.jettyEnd, 1);
  ctx.fillStyle = '#2a1a10';
  for (let x = 9; x < L.jettyEnd; x += 9) ctx.fillRect(x, L.deck + 1, 1, 3);
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(L.bollardX - 3, L.deck - 7, 6, 7);
  ctx.fillStyle = '#6a6a74';
  ctx.fillRect(L.bollardX - 4, L.deck - 8, 8, 2);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  makeCar(scene);
}

/** The glass elevator car, in pixels: a steel frame round green-tinted glass, a light on top. 64x50. */
export const CAR = { w: 64, h: 50, floor: 7 } as const;

function makeCar(scene: Phaser.Scene): void {
  if (scene.textures.exists(DESCENT_TEX.car)) return;
  const tex = scene.textures.createCanvas(DESCENT_TEX.car, CAR.w, CAR.h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2a3a48';
  ctx.fillRect(0, 5, CAR.w, CAR.h - 5);
  ctx.fillStyle = 'rgba(120, 220, 210, 0.3)';
  ctx.fillRect(3, 8, CAR.w - 6, CAR.h - 8 - CAR.floor);
  ctx.fillStyle = 'rgba(220, 255, 250, 0.5)';
  ctx.fillRect(6, 10, 2, 16);
  ctx.fillRect(9, 10, 1, 9);
  ctx.fillStyle = '#5a6a78';
  ctx.fillRect(0, CAR.h - CAR.floor, CAR.w, CAR.floor);
  ctx.fillRect(CAR.w / 2 - 8, 0, 16, 6);
  ctx.fillStyle = '#7dffb0';
  ctx.fillRect(CAR.w / 2 - 2, 1, 4, 2);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
