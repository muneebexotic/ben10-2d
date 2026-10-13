import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { UPGRADE_COLORS as C } from './art';

/** Upgrade seen from behind in the ore cart: circuits glowing down his back (0 idle, 1 firing, 2 ducking). 30x26. */
export function drawUpgradeBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  pc.poly([[5, 25 + y], [7, 15 + y], [23, 15 + y], [25, 25 + y]], C.body);
  pc.line(15, 15 + y, 15, 24 + y, C.line).line(10, 17 + y, 13, 21 + y, C.line).line(20, 17 + y, 17, 21 + y, C.line);
  pc.px(15, 19 + y, C.glow);
  // The dome head.
  pc.ellipse(15, 9 + y, 7, 7, C.body);
  pc.ellipse(13, 7 + y, 3, 3, C.sheen);
  pc.line(15, 3 + y, 15, 14 + y, C.line);
  if (frame === 1) pc.rect(22, 6 + y, 4, 10, C.body).circle(24, 5 + y, 2, C.glow);
  else pc.rect(3, 21 + y, 4, 4, C.body).rect(23, 21 + y, 4, 4, C.body);
  pc.outline(C.rim);
}
