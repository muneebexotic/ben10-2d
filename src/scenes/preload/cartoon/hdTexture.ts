import Phaser from 'phaser';
import { setTextureResolution } from '../../../systems/HdRender';
import { Paint } from './paint';

/**
 * Makes HD textures for the cartoon chapters: frames painted with the paint
 * kit at `res` texels per game pixel, packed into one canvas texture whose
 * frames report their game-pixel size (so an Image of one shows at game size,
 * crisp on an HD canvas). Smooth filtering: cartoon art scales and turns.
 */

export interface HdFrame {
  name: string;
  /** Size in game pixels. */
  w: number;
  h: number;
  /** Where (0, 0) of the drawing sits inside the frame (game px): a part's pivot, a sheet's centre. Default the top-left. */
  ox?: number;
  oy?: number;
  draw(p: Paint): void;
}

/** Texels of padding around every frame (no bleeding between neighbours under smooth filtering). */
const PAD = 2;
/** Widest atlas (texels): safe on every phone GPU. */
const MAX_W = 2048;

export interface PackedFrame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Shelf-packs frames of the given texel sizes, tallest first. Pure (unit tested). */
export function packFrames(sizes: ReadonlyArray<{ name: string; w: number; h: number }>, maxW = MAX_W): { frames: PackedFrame[]; width: number; height: number } {
  const order = [...sizes].sort((a, b) => b.h - a.h || b.w - a.w);
  const frames: PackedFrame[] = [];
  let x = PAD;
  let y = PAD;
  let shelf = 0;
  let width = 0;
  for (const s of order) {
    if (x + s.w + PAD > maxW && x > PAD) {
      x = PAD;
      y += shelf + PAD;
      shelf = 0;
    }
    frames.push({ name: s.name, x, y, w: s.w, h: s.h });
    x += s.w + PAD;
    shelf = Math.max(shelf, s.h);
    width = Math.max(width, x);
  }
  return { frames, width: Math.max(1, width), height: Math.max(1, y + shelf + PAD) };
}

/**
 * Paints `frames` into a new texture `key` at `res` (replacing nothing: a key
 * that exists is kept). Returns how long it took (ms).
 */
export function makeHdTexture(scene: Phaser.Scene, key: string, frames: readonly HdFrame[], res: number): number {
  if (scene.textures.exists(key)) return 0;
  const t0 = performance.now();
  const sizes = frames.map((f) => ({ name: f.name, w: Math.ceil(f.w * res), h: Math.ceil(f.h * res) }));
  const packed = packFrames(sizes);
  const texture = scene.textures.createCanvas(key, packed.width, packed.height);
  if (!texture) return 0;
  const ctx = texture.getContext();
  const byName = new Map(frames.map((f) => [f.name, f]));
  for (const pf of packed.frames) {
    const f = byName.get(pf.name);
    if (!f) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pf.x, pf.y, pf.w, pf.h);
    ctx.clip();
    const paint = new Paint(ctx, res, pf.x / res + (f.ox ?? 0), pf.y / res + (f.oy ?? 0));
    f.draw(paint);
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  texture.refresh();
  // Added in the caller's order: the first frame is the one an image without a frame name shows.
  const at = new Map(packed.frames.map((pf) => [pf.name, pf]));
  for (const f of frames) {
    const pf = at.get(f.name);
    if (pf) texture.add(pf.name, 0, pf.x, pf.y, pf.w, pf.h);
  }
  setTextureResolution(texture, res);
  texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return performance.now() - t0;
}

/** A sheet of `count` same-size frames named 0..count-1 (simple animated props and effects). */
export function makeHdSheet(scene: Phaser.Scene, key: string, w: number, h: number, count: number, res: number, draw: (p: Paint, frame: number) => void, origin?: { x: number; y: number }): number {
  const frames: HdFrame[] = [];
  for (let i = 0; i < count; i++) frames.push({ name: String(i), w, h, ox: origin?.x, oy: origin?.y, draw: (p) => draw(p, i) });
  return makeHdTexture(scene, key, frames, res);
}

/** One image. */
export function makeHdImage(scene: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (p: Paint) => void, origin?: { x: number; y: number }): number {
  return makeHdTexture(scene, key, [{ name: '0', w, h, ox: origin?.x, oy: origin?.y, draw }], res);
}
