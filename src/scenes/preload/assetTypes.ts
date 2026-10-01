import type { PixelCanvas } from './PixelCanvas';

/** One texture in the asset map: generated in code today, or loaded from `url` once real art exists. */
export interface AssetDef {
  key: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  /** Optional real art under public/. When present the file is loaded instead of generating. */
  url?: string;
  draw: (pc: PixelCanvas, frame: number) => void;
}

export interface AnimDef {
  key: string;
  texture: string;
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

export const one = (key: string, w: number, h: number, draw: (pc: PixelCanvas) => void): AssetDef => ({
  key,
  frameWidth: w,
  frameHeight: h,
  frames: 1,
  draw: (pc) => draw(pc),
});

export const sheet = (key: string, w: number, h: number, frames: number, draw: (pc: PixelCanvas, f: number) => void): AssetDef => ({
  key,
  frameWidth: w,
  frameHeight: h,
  frames,
  draw,
});

/** Builds the standard animation list for a character sheet from a frame table. */
export function animsFor(
  prefix: string,
  texture: string,
  frames: Record<string, readonly number[]>,
  rates: Record<string, number>,
  looping: readonly string[],
): AnimDef[] {
  return Object.entries(frames).map(([name, list]) => ({
    key: `${prefix}-${name}`,
    texture,
    frames: list,
    frameRate: rates[name] ?? 1,
    repeat: looping.includes(name) ? -1 : 0,
  }));
}
