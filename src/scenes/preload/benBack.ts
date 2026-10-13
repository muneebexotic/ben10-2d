import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from './PixelCanvas';

/** Ben seen from behind in the ore cart: the white shirt's black stripe, messy brown hair (0 idle, 1 punching, 2 ducking). 30x26. */
export function drawBenBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  pc.poly([[7, 25 + y], [8, 16 + y], [22, 16 + y], [23, 25 + y]], P.shirt);
  pc.rect(14, 16 + y, 3, 9, P.stripe);
  pc.rect(8, 16 + y, 2, 9, P.shirtShade);
  // The back of his head: all hair.
  pc.rect(10, 6 + y, 10, 10, P.hair0);
  pc.rect(11, 6 + y, 8, 2, P.hair1);
  pc.px(10, 5 + y, P.hair0).px(13, 4 + y, P.hair0).px(16, 5 + y, P.hair0).px(19, 5 + y, P.hair0);
  pc.rect(9, 10 + y, 1, 3, P.skin1).rect(20, 10 + y, 1, 3, P.skin1);
  if (frame === 1) pc.rect(21, 9 + y, 3, 8, P.shirt).rect(21, 6 + y, 4, 4, P.skin0);
  else pc.rect(5, 21 + y, 3, 4, P.skin0).rect(22, 21 + y, 3, 4, P.skin0);
  pc.outline(P.ink);
}
