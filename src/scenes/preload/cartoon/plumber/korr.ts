import type Phaser from 'phaser';
import { makeHdImage } from '../hdTexture';
import { INK, LINE } from '../paint';
import { HD_PORTRAITS } from '../portraitKeys';
import { PORTRAIT } from '../../portraits';
import { cutoutImage } from '../cutout/cutout';
import { KORR_FRAMES } from '../cutout/korrFrames';

/** The hologram's colours: everything in one cool cyan, brightest where light hits. */
const H = { bg: 0x041a20, deep: 0x0c4a56, mid: 0x1d8a96, light: 0x58d8de, hot: 0xc8fff8, glow: 0x3ae0d8 };

/** The hologram's ramp, dark to bright: each pixel of the drawing takes the colour of its brightness. */
const RAMP = [H.bg, H.deep, H.mid, H.light, H.hot];
/** Where the bust's top sits in the portrait (game px); the panel crops the coat below. */
const BUST_TOP = 1.5;

/**
 * MAGISTER KORR's dialogue portrait (Chapter 7's ending): the owner's drawing
 * (docs/art-refs/korr-portrait-sheet.webp, the stern close-up) as a
 * flickering cyan hologram. Painted in code if the drawing hasn't loaded.
 */
export function makeKorrPortrait(scene: Phaser.Scene, res: number): void {
  const img = cutoutImage(KORR_FRAMES.id);
  const bust = KORR_FRAMES.frames['body:bust'];
  if (img && bust) drawnKorr(scene, res, img, bust);
  else paintedKorr(scene, res);
}

/** The drawing, recoloured by brightness into the hologram's ramp, framed in the portrait with scanlines over it. */
function drawnKorr(scene: Phaser.Scene, res: number, img: HTMLImageElement, f: { x: number; y: number; w: number; h: number }): void {
  const { w, h } = PORTRAIT;
  const holo = hologram(img, f);
  makeHdImage(scene, HD_PORTRAITS.korr, w, h, res, (p) => {
    const panel = p.rrect(0.5, 0.5, w - 1, h - 1, 4);
    p.fill(panel, H.bg);
    p.within(panel, () => {
      p.glow(w / 2, h * 0.45, w * 0.6, H.glow, 0.3);
      if (holo) {
        const T = KORR_FRAMES.texel;
        p.ctx.drawImage(holo, (w - f.w / T) / 2, BUST_TOP, f.w / T, f.h / T);
      }
      for (let y = 1; y < h; y += 2) p.fill(p.rrect(0, y, w, 0.5, 0), H.bg, 0.28);
      p.fill(p.rrect(0, 18, w, 2.5, 0), H.hot, 0.12);
    });
    p.stroke(panel, INK, LINE * 0.8);
  });
}

/** The drawing on its own canvas, each pixel taking the hologram colour of its brightness (alpha kept, a little see-through). */
function hologram(img: HTMLImageElement, f: { x: number; y: number; w: number; h: number }): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = f.w;
  canvas.height = f.h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  const data = ctx.getImageData(0, 0, f.w, f.h);
  const px = data.data;
  const ramp = RAMP.map((c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    // Brightness, stretched so the drawing's darkest ink and lightest beard span the ramp.
    const l = Math.min(1, Math.max(0, ((0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255 - 0.05) * 1.35));
    const k = l * (ramp.length - 1);
    const a = Math.min(ramp.length - 2, Math.floor(k));
    const t = k - a;
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(ramp[a][c] + (ramp[a + 1][c] - ramp[a][c]) * t);
    px[i + 3] = Math.round(px[i + 3] * 0.94);
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/**
 * The fallback, painted in code: an old Plumber built like a bull tortoise, two
 * horns swept back, a heavy brow, a long braided beard, a coat with shoulder
 * plates and a glowing badge, all as a flickering cyan hologram.
 */
function paintedKorr(scene: Phaser.Scene, res: number): void {
  const { w, h } = PORTRAIT;
  makeHdImage(scene, HD_PORTRAITS.korr, w, h, res, (p) => {
    const panel = p.rrect(0.5, 0.5, w - 1, h - 1, 4);
    p.fill(panel, H.bg);
    p.within(panel, () => {
      p.glow(w / 2, h * 0.45, w * 0.6, H.glow, 0.3);
      // The coat and its shoulder plates.
      const coat = p.smooth([4, 48, 7, 38, 15, 33, 33, 33, 41, 38, 44, 48]);
      p.fill(coat, H.deep).stroke(coat, INK, LINE * 0.7);
      for (const [x, y] of [[11, 36], [37, 36]]) {
        const plate = p.ellipse(x, y, 6, 3, x < 24 ? -0.35 : 0.35);
        p.fill(plate, H.light).stroke(plate, INK, LINE * 0.6);
      }
      p.glow(30, 43, 4, H.hot, 0.9);
      const badge = p.circle(30, 43, 2);
      p.fill(badge, H.hot).stroke(badge, INK, LINE * 0.5);
      // The horns, swept back over the head.
      for (const [x0, y0, cx, cy, x1, y1] of [[17, 13, 9, 9, 5, 15], [21, 10, 15, 3, 9, 5]]) {
        const horn = p.horn(x0, y0, cx, cy, x1, y1, 3.2);
        p.fill(horn, H.light).stroke(horn, INK, LINE * 0.6);
      }
      // The head: broad and leathery, the brow a heavy ridge.
      const head = p.smooth([13, 22, 15, 12, 24, 8, 33, 11, 36, 19, 35, 27, 28, 31, 18, 30]);
      p.fill(head, H.mid).stroke(head, INK, LINE * 0.8);
      p.within(head, () => p.fill(p.poly([13, 26, 36, 22, 36, 32, 13, 32]), H.deep, 0.5));
      const brow = p.smooth([20, 17, 26, 14, 36, 16, 35, 19, 27, 18, 21, 20]);
      p.fill(brow, H.deep).stroke(brow, INK, LINE * 0.5);
      // Small, wise eyes under the brow.
      for (const x of [27, 32.5]) {
        p.glow(x, 20.4, 1.8, H.hot, 0.8);
        p.fill(p.ellipse(x, 20.4, 1, 0.7), H.hot);
      }
      // The long braided beard.
      const beard = p.smooth([22, 27, 34, 26, 31, 33, 29, 40, 27, 44, 25, 40, 23, 33]);
      p.fill(beard, H.light).stroke(beard, INK, LINE * 0.7);
      for (let y = 30; y < 43; y += 3) p.line([24.5 + (y - 30) * 0.12, y, 31 - (y - 30) * 0.25, y + 1.5], LINE * 0.5, H.deep, false, 0.9);
      // Scanlines and a flicker band: it's a hologram.
      for (let y = 1; y < h; y += 2) p.fill(p.rrect(0, y, w, 0.5, 0), H.bg, 0.28);
      p.fill(p.rrect(0, 18, w, 2.5, 0), H.hot, 0.12);
    });
    p.stroke(panel, INK, LINE * 0.8);
  });
}
