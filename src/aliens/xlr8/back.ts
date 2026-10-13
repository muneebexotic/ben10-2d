import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { XLR8_COLORS as C } from './art';

/** XLR8 seen from behind, riding the ore cart (0 idle, 1 slashing ahead, 2 ducking). 30x26. */
export function drawXlr8Back(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  pc.poly([[5, 25 + y], [7, 15 + y], [23, 15 + y], [25, 25 + y]], C.navy);
  pc.rect(9, 16 + y, 12, 8, C.body);
  pc.line(15, 16 + y, 15, 24 + y, C.blue);
  // The helmet, with its crest swept back.
  pc.poly([[9, 15 + y], [9, 6 + y], [15, 2 + y], [21, 6 + y], [21, 15 + y]], C.navy);
  pc.poly([[14, 2 + y], [15, -0 + y], [16, 2 + y], [16, 12 + y], [14, 12 + y]], C.blue);
  pc.px(11, 7 + y, C.glint).px(19, 7 + y, C.glint);
  if (frame === 1) pc.line(22, 14 + y, 28, 4 + y, C.light, 2).line(26, 3 + y, 29, 1 + y, C.light);
  else pc.rect(3, 21 + y, 4, 4, C.navy).rect(23, 21 + y, 4, 4, C.navy);
  pc.outline(0x05070f);
}
