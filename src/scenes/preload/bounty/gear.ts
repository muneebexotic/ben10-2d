import { PALETTE as P } from '../../../config/palette';
import type { PixelCanvas } from '../PixelCanvas';
import { KRAAB_COLORS, SIXSIX_COLORS, TETRAX_COLORS } from './hunters';
import { WESTERN as W } from './world';

/** The hunters' gear and the mine's machinery: drones, crab-bots, crystal sentries, dynamite, the net, phase walls, lasers. */

const INK = P.ink;

/** Sixsix's tracker drone: a sleek dart with an amber lens: 0-1 hover, 2 painting (lens blazing). 22x14. */
export function drawTracker(pc: PixelCanvas, frame: number): void {
  const C = SIXSIX_COLORS;
  pc.poly([[1, 7], [6, 3], [17, 4], [21, 7], [17, 10], [6, 11]], C.armor1);
  pc.poly([[6, 3], [17, 4], [15, 6], [7, 6]], C.armor3);
  pc.poly([[8, 3], [11, 0], [13, 3]], C.armor2);
  pc.poly([[8, 11], [10, 14 - (frame % 2)], [12, 11]], C.armor2);
  pc.circle(16, 7, 2, frame === 2 ? C.visorGlow : C.visor);
  if (frame === 2) pc.px(16, 7, P.white).px(19, 7, C.visorGlow);
  pc.rect(2, 6, 3, 2, frame === 1 ? P.fire1 : P.fire2);
  pc.outline(INK);
}

/**
 * Kraab's crab-bot: a squat robot crab with a front shell: 0-1 scuttle,
 * 2 claws up (the pinch's tell), 3 burrowed (a mound), 4 flipped on its back. 28x18.
 */
export function drawCrabbot(pc: PixelCanvas, frame: number): void {
  const C = KRAAB_COLORS;
  if (frame === 3) {
    pc.ellipse(14, 16, 12, 2, 0x5a3824);
    pc.ellipse(14, 15, 8, 2, C.shell1);
    pc.px(10, 13, C.eye).px(17, 13, C.eye);
    pc.outline(INK);
    return;
  }
  if (frame === 4) {
    pc.ellipse(14, 12, 11, 5, C.metal);
    pc.ellipse(14, 10, 9, 3, 0x5a5a66);
    for (const x of [6, 11, 17, 22]) pc.line(x, 8, x + (x < 14 ? -2 : 2), 3, C.shell1, 2);
    pc.circle(14, 12, 2, C.glow);
    pc.outline(INK);
    return;
  }
  const step = frame === 1 ? 1 : 0;
  for (const [x, d] of [[6, -1], [10, 1], [18, -1], [22, 1]] as const) pc.line(x, 12, x + d * 3 + (step ? d : 0), 17, C.shell1, 2);
  pc.ellipse(14, 10, 10, 5, C.shell1);
  pc.ellipse(13, 8, 8, 3, C.shell2);
  pc.hline(9, 17, 7, C.shell3);
  // The front shell plate (it faces right, the way it scuttles).
  pc.poly([[20, 5], [26, 8], [25, 14], [20, 14]], C.shell3);
  pc.line(21, 6, 24, 13, C.shell2);
  // Eyes on stalks.
  pc.vline(16, 3, 5, C.shell2).vline(19, 3, 5, C.shell2);
  pc.px(16, 2, C.eye).px(19, 2, C.eye);
  // Claws: low and ready, or up for the pinch.
  if (frame === 2) {
    pc.line(4, 8, 1, 1, C.shell2, 2).line(24, 6, 27, 0, C.shell2, 2);
    pc.rect(0, 0, 3, 2, C.shell3).rect(25, 0, 3, 2, C.shell3);
  } else {
    pc.ellipse(3, 11, 3, 2, C.shell2);
  }
  pc.outline(INK);
}

/** Tetrax's crystal sentry: a cluster of spikes that fires shard volleys: 0 idle, 1 glinting (the tell), 2 spent. 20x30. */
export function drawSentry(pc: PixelCanvas, frame: number): void {
  const C = TETRAX_COLORS;
  pc.ellipse(10, 28, 9, 3, 0x1a1e2e);
  const spent = frame === 2;
  const tall = spent ? 12 : 26;
  pc.poly([[4, 29], [10, 29 - tall], [16, 29]], C.crystal2);
  pc.poly([[5, 29], [10, 30 - tall], [10, 29]], C.crystal3);
  pc.poly([[0, 29], [3, 14], [7, 29]], C.crystal1);
  pc.poly([[13, 29], [17, 16], [20, 29]], C.crystal1);
  if (frame === 1) {
    pc.px(10, 4, C.glint).px(9, 5, C.glint).px(11, 5, C.glint).px(10, 6, C.glint);
    pc.line(10, 1, 10, 9, P.white).line(6, 5, 14, 5, P.white);
  }
  pc.outline(0x08102a);
}

/** A crate of dynamite: 0 sitting there, 1 its fuse lit. 16x14. */
export function drawDynamite(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 2, 16, 12, W.plank1);
  pc.rect(1, 3, 14, 10, W.plank2);
  pc.hline(1, 14, 7, W.plank0);
  for (const x of [3, 7, 11]) pc.rect(x, 0, 3, 5, 0xc82a2a).px(x + 1, 0, 0xe85a4a);
  pc.rect(4, 9, 8, 3, 0xd8c08a);
  pc.px(5, 10, 0x8a1a1a).px(7, 10, 0x8a1a1a).px(9, 10, 0x8a1a1a);
  if (frame === 1) pc.px(8, -0, P.fire0).px(9, 0, P.fire1);
  pc.outline(INK);
}

/** A falling rock: three shapes. 16x14. */
export function drawFallingRock(pc: PixelCanvas, frame: number): void {
  const shapes: Array<Array<[number, number]>> = [
    [[2, 4], [7, 0], [13, 2], [15, 9], [9, 13], [2, 11]],
    [[1, 6], [5, 1], [12, 1], [15, 7], [11, 13], [4, 12]],
    [[3, 2], [11, 0], [15, 5], [13, 12], [5, 13], [0, 8]],
  ];
  pc.poly(shapes[frame], W.rock2);
  pc.poly(shapes[frame].map(([x, y]) => [Math.round(x * 0.6 + 2), Math.round(y * 0.6 + 1)] as [number, number]), W.rock3);
  pc.outline(INK);
}

/** Sixsix's energy net generator: a spiked puck humming amber: 2 frames. 20x16. */
export function drawNetGenerator(pc: PixelCanvas, frame: number): void {
  const C = SIXSIX_COLORS;
  pc.ellipse(10, 11, 9, 4, C.armor1);
  pc.ellipse(10, 9, 7, 3, C.armor2);
  for (const x of [3, 10, 17]) pc.line(x, 8, x + (x - 10) * 0.2, 2, C.armor3);
  pc.circle(10, 8, 2, frame === 0 ? C.visor : C.visorGlow);
  pc.outline(INK);
}

/** The energy net: a mesh of amber light (wraps Ben, seals the cell door). 32x32, 2 frames. */
export function drawEnergyNet(pc: PixelCanvas, frame: number): void {
  const c = frame === 0 ? P.sixsix : 0xffe0a0;
  for (let i = 0; i <= 32; i += 6) {
    pc.line(i - frame, 0, i - frame + 10, 31, c);
    pc.line(i + frame, 0, i + frame - 10, 31, c);
  }
  for (let y = 0; y < 32; y += 8) for (let x = (y / 8) % 2 === 0 ? 2 : 5; x < 32; x += 6) pc.px(x, y, P.white);
}

/** Phase walls (Ghostfreak walks through them): 0 iron bars, 1 stone with a ghostly sigil, 2 a boarded door. 16x16 tiles. */
export function drawPhaseWall(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.rect(0, 0, 16, 2, 0x2a2a34).rect(0, 14, 16, 2, 0x2a2a34);
    for (const x of [1, 6, 11]) {
      pc.rect(x, 0, 3, 16, 0x3a3a46);
      pc.vline(x, 0, 15, 0x5a5a6a);
    }
  } else if (frame === 1) {
    pc.rect(0, 0, 16, 16, 0x4a3a30);
    pc.rect(1, 1, 14, 6, 0x56463a).rect(1, 9, 6, 6, 0x4e3e33).rect(9, 9, 6, 6, 0x56463a);
    pc.circle(8, 8, 3, 0x2a2440, 0.5);
    pc.px(8, 8, P.ghostfreak);
  } else {
    pc.rect(0, 0, 16, 16, W.plank0);
    for (const x of [1, 6, 11]) pc.rect(x, 0, 4, 16, W.plank1);
    pc.line(0, 4, 15, 10, W.plank2, 2);
    pc.px(3, 3, 0x8a8a9a).px(12, 12, 0x8a8a9a);
  }
}

/** The mine's security laser emitter (points right; rotated for other directions). 14x14. */
export function drawLaserEmitter(pc: PixelCanvas): void {
  pc.rect(0, 2, 10, 10, 0x2a2e3a);
  pc.rect(1, 3, 8, 8, 0x444a5c);
  pc.rect(9, 4, 5, 6, 0x1a1c24);
  pc.rect(12, 5, 2, 4, P.enemy);
  pc.px(3, 5, P.enemyGlow);
  pc.outline(INK);
}

/** A crystal receiver: catches a laser and opens a gate: 0 dark, 1 lit. 14x14. */
export function drawReceiver(pc: PixelCanvas, frame: number): void {
  pc.rect(2, 8, 10, 6, 0x2a2e3a);
  pc.poly([[3, 9], [7, 0], [11, 9]], frame === 1 ? 0x9af0ff : 0x2a5a7a);
  pc.line(7, 1, 6, 8, frame === 1 ? P.white : 0x4a8aaa);
  if (frame === 1) pc.px(7, 3, P.white);
  pc.outline(INK);
}

/** A crystal gate across a passage: a lattice of crystal bars, 0 shut, 1 cracking. 16x16 tiles. */
export function drawCrystalGate(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 0, 16, 16, 0x0e2236);
  for (const x of [2, 7, 12]) {
    pc.rect(x, 0, 3, 16, frame === 1 ? 0x3a90b8 : 0x2a6a8a);
    pc.vline(x, 0, 15, 0x9af0ff);
  }
  pc.hline(0, 15, 7, 0x1e4a6a);
  if (frame === 1) pc.line(3, 2, 13, 14, P.white);
}

/** Tetrax's crystal shard volleys and Kraab's cannon blast reuse the shared shard and bolt; this is the cannon's glob. 14x10. */
export function drawClawBlast(pc: PixelCanvas, frame: number): void {
  const C = KRAAB_COLORS;
  pc.ellipse(7, 5, 6 + frame, 4, C.glow);
  pc.ellipse(8, 5, 3, 2, P.white);
  pc.px(1, 3, C.glow).px(0, 6, C.glowDark);
}

/** The cart's cut brake cable: a snapped steel line. 24x6. */
export function drawCable(pc: PixelCanvas): void {
  pc.line(0, 3, 23, 2, 0x8a8a9a);
  pc.line(20, 1, 23, 0, 0xc8c8d8);
}

/** THE DEEP DIVE's ore cart seen from behind: an iron bucket on four wheels, rivets and a dented rim. 64x36. */
export function drawDiveCart(pc: PixelCanvas): void {
  // Wheels peeking out under the bucket.
  for (const x of [8, 56]) {
    pc.ellipse(x, 31, 6, 4, 0x2a2a30);
    pc.ellipse(x, 31, 3, 2, 0x55555f);
  }
  pc.poly([[2, 6], [62, 6], [57, 30], [7, 30]], 0x4a4a54);
  pc.poly([[5, 9], [59, 9], [55, 27], [9, 27]], 0x5e5e6a);
  pc.rect(2, 4, 60, 4, 0x6e6e7a);
  pc.hline(3, 60, 4, 0x9a9aa8);
  for (const x of [8, 20, 32, 44, 56]) pc.px(x, 6, 0xb8b8c4).px(x - 1, 28, 0x2a2a30);
  pc.rect(27, 14, 10, 8, 0x3a3a44);
  pc.px(29, 16, W.plank3).px(34, 19, W.plank3);
  pc.line(12, 12, 16, 24, 0x3e3e48).line(50, 12, 46, 24, 0x3e3e48);
  pc.outline(INK);
}

/** A fallen timber beam across the haulage way (duck!). 64x10. */
export function drawDiveBeam(pc: PixelCanvas): void {
  pc.rect(0, 1, 64, 8, W.plank1);
  pc.rect(0, 1, 64, 2, W.plank2);
  for (let x = 4; x < 64; x += 11) pc.vline(x, 3, 8, W.plank0);
  pc.px(10, 4, 0x8a8a9a).px(40, 5, 0x8a8a9a);
  pc.outline(INK);
}
