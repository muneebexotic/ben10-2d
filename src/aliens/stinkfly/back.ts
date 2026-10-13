import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { STINKFLY_COLORS as C } from './art';

/** Stinkfly seen from behind in the ore cart: wings half open (0 idle, 1 spitting slime, 2 ducking). 30x26. */
export function drawStinkflyBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  // Wings first, behind the body.
  pc.ellipse(6, 12 + y, 6, 4, C.wing, 0.8);
  pc.ellipse(24, 12 + y, 6, 4, C.wing, 0.8);
  pc.line(2, 12 + y, 11, 14 + y, C.vein).line(28, 12 + y, 19, 14 + y, C.vein);
  pc.ellipse(15, 20 + y, 7, 6, C.body);
  pc.rect(10, 18 + y, 10, 1, C.stripe).rect(10, 21 + y, 10, 1, C.stripe);
  // The head with its eyes on stalks.
  pc.ellipse(15, 11 + y, 5, 4, C.dark);
  pc.line(12, 9 + y, 10, 3 + y, C.dark).line(18, 9 + y, 20, 3 + y, C.dark);
  pc.circle(10, 3 + y, 2, C.eye).circle(20, 3 + y, 2, C.eye);
  if (frame === 1) pc.circle(15, 3 + y, 2, C.light);
  pc.outline(0x10180a);
}
