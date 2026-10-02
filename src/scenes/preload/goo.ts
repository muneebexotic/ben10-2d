import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/** Stinkfly's slime glob: three wobble frames. 12x12. */
export function drawSlimeGlob(pc: PixelCanvas, frame: number): void {
  const rx = [4, 5, 4][frame];
  const ry = [4, 3, 5][frame];
  pc.ellipse(6, 6, rx, ry, 0x9cc43c);
  pc.ellipse(6, 6, rx - 1, ry - 1, P.slime);
  pc.px(4, 4, P.white).px(5, 4, P.white);
  pc.px(6 + [-3, 3, 0][frame], 6 + ry, 0x9cc43c);
  pc.outline(P.slimeDark);
}

/** A glob of glowing mutagen spat by Animo's mutants: three wobble frames. 12x12. */
export function drawSpitGlob(pc: PixelCanvas, frame: number): void {
  const rx = [4, 5, 4][frame];
  const ry = [4, 4, 5][frame];
  pc.ellipse(6, 6, rx, ry, P.mutagen);
  pc.ellipse(5, 5, rx - 2, ry - 2, P.mutagenGlow);
  pc.px(4, 3, P.white);
  pc.px(6 + [2, -2, 0][frame], 6 + ry, P.mutagen);
  pc.outline(P.mutagenDark);
}

/** A mutagen puddle on the floor: bubbling frames. 32x6. */
export function drawPuddle(pc: PixelCanvas, frame: number): void {
  pc.ellipse(16, 4, 15, 2, P.mutagenDark);
  pc.ellipse(16, 4, 13, 1, P.mutagen);
  pc.hline(8, 20, 3, P.mutagenGlow);
  const bubbles = [[6, 10, 22], [13, 19, 26], [9, 16, 24]][frame];
  for (const x of bubbles) pc.px(x, 2, P.mutagenGlow).px(x, 1, P.white);
}

/** Dr. Animo's glowing mutagen pooled on the floor (XLR8 can run on it). Same layout as water. 32x64. */
export function drawMutagenPool(pc: PixelCanvas, frame: number): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, P.mutagen, 0.9],
    [0.3, P.mutagenDark, 0.9],
    [1, 0x06261c, 0.95],
  ]);
  for (let x = 0; x < pc.width; x++) {
    const y = Math.round(1 + Math.sin((x + frame * 4) * 0.4) * 1);
    pc.px(x, y, P.mutagenGlow, 0.9);
  }
  for (let i = 0; i < 3; i++) pc.circle((i * 11 + frame * 5) % pc.width, 8 + i * 5, 1, P.mutagenGlow, 0.5);
}

/** A tar pit: thick, black, slow bubbles (too sticky to run on). 32x64. */
export function drawTarPool(pc: PixelCanvas, frame: number): void {
  pc.verticalGradient(0, 0, pc.width, pc.height, [
    [0, 0x2a2430, 1],
    [0.2, 0x14121a, 1],
    [1, 0x08070c, 1],
  ]);
  for (let x = 0; x < pc.width; x++) pc.px(x, Math.round(1 + Math.sin((x + frame * 2) * 0.25) * 0.6), 0x4a4252);
  const bx = (frame * 9 + 6) % pc.width;
  pc.circle(bx, 3, 2, 0x2a2430);
  pc.px(bx - 1, 2, 0x6a6272);
}
