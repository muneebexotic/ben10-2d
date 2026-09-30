import Phaser from 'phaser';
import { FONT_KEY, FONT_SIZE } from './PixelFont';

export interface TextOptions {
  scale?: number;
  color?: number;
  originX?: number;
  originY?: number;
  align?: 'left' | 'center' | 'right';
  depth?: number;
  scrollFactor?: number;
  maxWidth?: number;
}

const ALIGN = { left: 0, center: 1, right: 2 } as const;

/** Pixel-font text at integer scales so glyphs stay crisp. */
export function pixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: TextOptions = {},
): Phaser.GameObjects.BitmapText {
  const scale = opts.scale ?? 1;
  const t = scene.add.bitmapText(Math.round(x), Math.round(y), FONT_KEY, text, FONT_SIZE * scale, ALIGN[opts.align ?? 'left']);
  t.setOrigin(opts.originX ?? 0, opts.originY ?? 0);
  if (opts.color !== undefined) t.setTint(opts.color);
  if (opts.depth !== undefined) t.setDepth(opts.depth);
  if (opts.scrollFactor !== undefined) t.setScrollFactor(opts.scrollFactor);
  if (opts.maxWidth !== undefined) t.setMaxWidth(opts.maxWidth);
  return t;
}
