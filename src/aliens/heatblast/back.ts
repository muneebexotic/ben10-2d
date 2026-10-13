import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';

/** Heatblast seen from behind, riding the ore cart (frames: 0 idle, 1 throwing fire, 2 ducking). 30x26. */
export function drawHeatblastBack(pc: PixelCanvas, frame: number): void {
  const y = frame === 2 ? 9 : 0;
  // Magma-rock shoulders with glowing seams.
  pc.poly([[3, 25 + y], [5, 15 + y], [25, 15 + y], [27, 25 + y]], 0x4a2a1c);
  pc.line(8, 17 + y, 12, 24 + y, P.fire1).line(22, 16 + y, 19, 24 + y, P.fire2).line(15, 16 + y, 15, 23 + y, P.fire1);
  // The flame head, licking upward.
  pc.poly([[9, 15 + y], [8, 7 + y], [11, 9 + y], [12, 1 + y], [15, 7 + y], [17, 0 + y], [19, 8 + y], [22, 6 + y], [21, 15 + y]], P.fire1);
  pc.poly([[11, 15 + y], [12, 8 + y], [15, 11 + y], [17, 5 + y], [19, 15 + y]], P.fire2);
  pc.poly([[13, 15 + y], [15, 10 + y], [17, 15 + y]], P.fire3);
  if (frame === 1) {
    pc.rect(22, 9 + y, 4, 8, 0x4a2a1c).circle(25, 6 + y, 3, P.fire2).px(25, 6 + y, P.fire3);
  } else {
    pc.rect(1, 20 + y, 4, 5, 0x4a2a1c).rect(25, 20 + y, 4, 5, 0x4a2a1c);
  }
  pc.outline(P.ink);
}
