import type Phaser from 'phaser';
import { cutoutImage, type CutoutMeta } from '../cutout/cutout';
import { makeHdImage } from '../hdTexture';
import { INK, LINE } from '../paint';

/** The surface camera's picture of Kevin's getaway (the owner's painting, docs/art-refs/kevin-pod-still.webp). */
export const KEVIN_POD_STILL: CutoutMeta = {
  id: 'kevin-pod-still',
  image: 'assets/stills/kevin-pod.webp',
  texel: 1,
  scale: 1,
  headScale: 1,
  width: 1280,
  height: 720,
  joints: {},
  frames: {},
  bends: {},
};

/** Its texture, as the ending's lines name it (`still` on a dialogue line). */
export const KEVIN_POD_FEED = 'hd-feed-kevin-pod';

/** The feed's size on screen (game px): 16:9, under the dialogue box. */
const FEED = { w: 224, h: 126 };

/**
 * The surface camera's feed: the owner's painting as it is, with a camera's
 * scanlines, a recording light and a thin frame over it. Nothing is made if
 * the painting hasn't loaded (the lines then play without it).
 */
export function makeCameraFeed(scene: Phaser.Scene, res: number): void {
  const img = cutoutImage(KEVIN_POD_STILL.id);
  if (!img || scene.textures.exists(KEVIN_POD_FEED)) return;
  const { w, h } = FEED;
  makeHdImage(scene, KEVIN_POD_FEED, w, h, res, (p) => {
    p.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
    for (let y = 1; y < h; y += 2) p.fill(p.rrect(0, y, w, 0.5, 0), 0x000000, 0.16);
    // The recording light, top left.
    p.glow(9, 9, 4, 0xff3030, 0.6);
    p.fill(p.circle(9, 9, 2.2), 0xff4040).stroke(p.circle(9, 9, 2.2), INK, LINE * 0.4);
    p.stroke(p.rrect(0.5, 0.5, w - 1, h - 1, 2), INK, LINE * 1.2);
  });
}
