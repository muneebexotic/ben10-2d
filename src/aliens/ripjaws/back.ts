import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { RIPJAWS_COLORS as C } from './art';

/** Ripjaws seen from behind, riding the ore cart (0 idle, 1 lunging ahead, 2 ducking). 30x26. */
export function drawRipjawsBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 8 : frame === 1 ? -2 : 0;
  // The wetsuit's back and the dorsal fin up the middle.
  pc.poly([[4, 26 + y], [7, 15 + y], [23, 15 + y], [26, 26 + y]], C.suit);
  pc.rect(8, 16 + y, 14, 2, C.suitLight);
  pc.poly([[15, 9 + y], [12, 18 + y], [18, 18 + y]], C.fin);
  pc.line(15, 10 + y, 15, 17 + y, C.dark);
  // The big round head, the lure over it, the gill fins either side.
  pc.ellipse(15, 9 + y, 8, 6, C.skin);
  pc.ellipse(15, 7 + y, 6, 3, C.dark);
  pc.poly([[7, 10 + y], [2, 12 + y], [7, 13 + y]], C.fin).poly([[23, 10 + y], [28, 12 + y], [23, 13 + y]], C.fin);
  pc.line(15, 3 + y, 16, 0 + y, C.skin);
  pc.rect(16, 0 + y, 2, 2, C.lure);
  if (frame === 1) {
    pc.line(22, 16 + y, 27, 10 + y, C.skin, 2);
    pc.px(28, 9 + y, C.teeth);
  } else {
    pc.line(6, 18 + y, 2, 24 + y, C.skin, 2).line(24, 18 + y, 28, 24 + y, C.skin, 2);
  }
  pc.outline(P.ink);
}
