import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { FOURARMS_COLORS as C } from './art';

/** Four Arms seen from behind, riding the ore cart (0 idle, 1 punching ahead, 2 ducking). 30x26. */
export function drawFourarmsBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  // Huge shoulders: all four arms on the cart's rim.
  pc.poly([[0, 25 + y], [2, 13 + y], [28, 13 + y], [30, 25 + y]], C.skin);
  pc.rect(4, 14 + y, 22, 3, C.light);
  pc.line(15, 13 + y, 15, 24 + y, C.dark);
  pc.rect(0, 21 + y, 4, 5, C.dark).rect(26, 21 + y, 4, 5, C.dark);
  // The head and its top-knot.
  pc.rect(10, 5 + y, 10, 9, C.skin);
  pc.rect(10, 5 + y, 10, 2, C.light);
  pc.rect(13, 1 + y, 4, 4, C.hair).rect(14, 0 + y, 2, 2, C.hair);
  if (frame === 1) {
    pc.rect(24, 4 + y, 5, 10, C.skin).rect(23, 1 + y, 7, 5, C.dark);
  }
  pc.outline(0x140c10);
}
