import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { WILDMUTT_COLORS as C } from './art';

/** Wildmutt seen from behind, hunched in the ore cart (0 idle, 1 lunging, 2 ducking). 30x26. */
export function drawWildmuttBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  // A low hunched back of fur, the spine ridge and the gills on his neck.
  pc.ellipse(15, 21 + y, 13, 7, C.fur);
  pc.ellipse(15, 18 + y, 10, 4, C.light);
  for (const x of [11, 15, 19]) pc.line(x, 14 + y, x, 20 + y, C.dark);
  pc.ellipse(15, 11 + y, 6, 5, C.fur);
  pc.line(10, 12 + y, 12, 15 + y, C.gill).line(20, 12 + y, 18, 15 + y, C.gill);
  if (frame === 1) {
    pc.rect(22, 10 + y, 4, 9, C.fur).line(24, 9 + y, 28, 6 + y, C.claw).line(25, 10 + y, 29, 8 + y, C.claw);
  } else {
    pc.rect(2, 21 + y, 4, 5, C.dark).rect(24, 21 + y, 4, 5, C.dark);
  }
  pc.outline(0x1a0a06);
}
