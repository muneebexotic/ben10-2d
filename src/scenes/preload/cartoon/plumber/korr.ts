import type Phaser from 'phaser';
import { makeHdImage } from '../hdTexture';
import { INK, LINE } from '../paint';
import { HD_PORTRAITS } from '../portraitKeys';
import { PORTRAIT } from '../../portraits';

/** The hologram's colours: everything in one cool cyan, brightest where light hits. */
const H = { bg: 0x041a20, deep: 0x0c4a56, mid: 0x1d8a96, light: 0x58d8de, hot: 0xc8fff8, glow: 0x3ae0d8 };

/**
 * MAGISTER KORR's dialogue portrait (Chapter 7's ending), painted in code until
 * the owner's art arrives: an old Plumber built like a bull tortoise, two
 * horns swept back, a heavy brow, a long braided beard, a coat with shoulder
 * plates and a glowing badge, all as a flickering cyan hologram.
 */
export function makeKorrPortrait(scene: Phaser.Scene, res: number): void {
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
