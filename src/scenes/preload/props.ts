import { PALETTE as P } from '../../config/palette';
import { seeded, type PixelCanvas } from './PixelCanvas';

/** The Rustbucket, parked at camp with a warm light in the window. */
export function drawRv(pc: PixelCanvas): void {
  // Body.
  pc.rect(6, 8, 84, 30, P.cream);
  pc.poly([[84, 8], [94, 16], [94, 38], [84, 38]], P.cream);
  pc.rect(6, 6, 76, 3, 0xd9ccb0);
  pc.rect(6, 26, 88, 4, P.wood1);
  pc.rect(6, 30, 88, 2, P.wood2);
  pc.rect(6, 36, 88, 3, 0xb8ab90);
  // Windshield and windows (warm, lit).
  pc.poly([[85, 12], [92, 18], [92, 24], [85, 24]], 0x2a3050);
  pc.rect(20, 13, 14, 9, P.fire1).rect(21, 14, 12, 7, 0xffe7a0);
  pc.rect(40, 13, 14, 9, 0x2a3050);
  pc.rect(62, 13, 12, 9, P.fire1).rect(63, 14, 10, 7, 0xffe7a0);
  pc.vline(27, 13, 21, P.wood0).vline(68, 13, 21, P.wood0);
  // Door, ladder, bumper.
  pc.rect(56, 14, 4, 22, 0xd9ccb0).px(59, 25, P.wood0);
  for (let y = 10; y < 36; y += 4) pc.hline(1, 5, y, P.metal2);
  pc.vline(1, 8, 36, P.metal2).vline(5, 8, 36, P.metal2);
  pc.rect(88, 34, 8, 3, P.metal2);
  pc.rect(92, 30, 2, 3, P.fire1);
  // Wheels.
  for (const cx of [22, 76]) {
    pc.circle(cx, 40, 6, P.ink);
    pc.circle(cx, 40, 3, P.metal2);
    pc.px(cx, 40, P.metal3);
  }
  pc.outline(P.ink);
}

export function drawTent(pc: PixelCanvas, frame: number): void {
  const fabric = frame === 0 ? 0xe07a3a : 0x3a9e8c;
  const dark = frame === 0 ? 0xa04a22 : 0x226a5e;
  pc.poly([[20, 1], [39, 27], [1, 27]], fabric);
  pc.poly([[20, 1], [39, 27], [26, 27]], dark);
  pc.poly([[20, 9], [26, 27], [14, 27]], P.ink);
  pc.line(20, 0, 20, 2, P.wood1);
  pc.line(0, 27, 39, 27, P.wood0);
  pc.outline(P.ink);
}

export function drawCampfire(pc: PixelCanvas): void {
  pc.line(3, 8, 16, 4, P.wood1, 2);
  pc.line(3, 4, 16, 8, P.wood0, 2);
  for (const [x, y] of [[0, 8], [4, 9], [9, 9], [14, 9], [18, 8]]) pc.rect(x, y, 3, 2, P.rock1);
  pc.outline(P.ink);
}

export function drawLog(pc: PixelCanvas): void {
  pc.rect(0, 2, 26, 6, P.wood1);
  pc.rect(0, 2, 26, 1, P.wood2);
  pc.rect(0, 7, 26, 1, P.wood0);
  pc.ellipse(24, 5, 2, 3, 0xc08a50);
  pc.px(24, 5, P.wood0);
  pc.line(6, 4, 12, 4, P.wood0);
  pc.outline(P.ink);
}

export function drawSign(pc: PixelCanvas): void {
  pc.rect(6, 6, 2, 12, P.wood0);
  pc.poly([[0, 1], [11, 1], [14, 4], [11, 7], [0, 7]], P.wood1);
  pc.hline(1, 10, 2, P.wood2);
  pc.hline(3, 9, 4, P.cream);
  pc.px(8, 3, P.cream).px(8, 5, P.cream);
  pc.outline(P.ink);
}

export function drawBush(pc: PixelCanvas, frame: number): void {
  const rnd = seeded(frame * 91 + 7);
  const w = 18;
  for (let i = 0; i < 7; i++) {
    const cx = 3 + Math.floor(rnd() * (w - 6));
    const cy = 5 + Math.floor(rnd() * 3);
    pc.circle(cx, cy, 3 + Math.floor(rnd() * 2), i % 2 ? P.grass0 : 0x24573e);
  }
  pc.rect(1, 8, w - 2, 3, 0x1d4633);
  pc.px(5, 3, P.grass1).px(11, 2, P.grass1);
  if (frame === 1) pc.px(8, 5, 0xff6f91).px(13, 6, 0xff6f91);
  pc.outline(P.ink);
}

export function drawRock(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.ellipse(6, 5, 6, 4, P.rock1);
    pc.rect(3, 2, 4, 2, P.rock2);
  } else {
    pc.ellipse(4, 3, 4, 3, P.rock1);
    pc.px(3, 1, P.rock2);
  }
  pc.outline(P.ink);
}

export function drawStump(pc: PixelCanvas): void {
  pc.rect(1, 3, 10, 8, P.wood1);
  pc.ellipse(6, 3, 5, 2, 0xc08a50);
  pc.px(6, 3, P.wood0);
  pc.rect(1, 9, 10, 2, P.wood0);
  pc.outline(P.ink);
}

export function drawGrass(pc: PixelCanvas, frame: number): void {
  const blades = frame === 0 ? [[1, 3], [3, 5], [5, 2], [7, 4]] : [[0, 2], [2, 4], [4, 5], [6, 3]];
  for (const [x, h] of blades) pc.vline(x, 5 - h, 5, frame === 0 ? P.grass1 : P.grass0);
  if (frame === 1) pc.px(4, 0, P.grass2);
}

/** Glowing forest mushrooms: little points of cyan light in the dark. */
export function drawMushroom(pc: PixelCanvas): void {
  pc.rect(2, 3, 1, 3, P.cream).rect(6, 2, 1, 4, P.cream);
  pc.ellipse(2, 2, 2, 1, 0x5ee6ff);
  pc.ellipse(6, 1, 2, 1, 0x7af0ff);
  pc.px(1, 2, P.white);
}

export function drawCrater(pc: PixelCanvas): void {
  pc.ellipse(24, 4, 23, 3, 0x1a1016);
  pc.ellipse(24, 4, 16, 2, 0x0e080c);
  const rnd = seeded(33);
  for (let i = 0; i < 14; i++) pc.px(2 + Math.floor(rnd() * 44), 2 + Math.floor(rnd() * 5), i % 3 ? P.fire3 : P.fire2);
}

export function drawWreck(pc: PixelCanvas): void {
  pc.poly([[0, 31], [8, 10], [30, 2], [46, 14], [40, 31]], P.metal1);
  pc.poly([[8, 10], [30, 2], [34, 8], [12, 16]], P.metal2);
  pc.line(14, 20, 36, 16, P.metal0);
  pc.line(18, 28, 40, 24, P.metal0);
  pc.rect(22, 20, 6, 4, P.ink);
  pc.px(24, 21, P.enemy).px(25, 22, P.enemy);
  pc.line(40, 12, 47, 6, P.metal3);
  pc.outline(P.ink);
}

export function drawDebris(pc: PixelCanvas): void {
  pc.poly([[0, 11], [4, 4], [12, 0], [20, 6], [16, 11]], P.metal0);
  pc.line(4, 8, 14, 4, P.metal2);
  pc.px(10, 7, P.enemy);
  pc.outline(P.ink);
}

export function drawBurningLogs(pc: PixelCanvas): void {
  pc.line(1, 7, 14, 3, P.wood0, 2);
  pc.line(2, 3, 15, 7, 0x2a1a14, 2);
  pc.px(6, 4, P.fire2).px(10, 6, P.fire3).px(12, 4, P.fire2);
  pc.outline(P.ink);
}

// ---------------------------------------------------------------- Story + gameplay props

export const POD_FRAMES = { closed: 0, open: 1 } as const;

export function drawPod(pc: PixelCanvas, frame: number): void {
  const open = frame === 1;
  pc.ellipse(12, 12, 11, 5, P.metal1);
  pc.ellipse(12, 11, 9, 3, P.metal2);
  if (open) {
    pc.ellipse(12, 10, 7, 3, P.omnitrixDeep);
    pc.ellipse(12, 10, 5, 2, P.omnitrix);
    pc.poly([[2, 8], [10, 0], [14, 1], [6, 9]], P.metal2);
    pc.line(4, 7, 11, 1, P.metal3);
  } else {
    pc.ellipse(12, 7, 9, 5, P.metal2);
    pc.ellipse(12, 6, 6, 3, P.metal3);
    pc.rect(6, 9, 13, 1, P.omnitrix);
    pc.px(12, 3, P.omnitrix);
  }
  pc.rect(3, 13, 2, 2, P.omnitrix).rect(19, 13, 2, 2, P.omnitrix);
  pc.outline(P.ink);
}

export function drawOmnitrixItem(pc: PixelCanvas): void {
  pc.rect(0, 3, 10, 4, P.ink);
  pc.circle(5, 5, 4, P.metal1);
  pc.circle(5, 5, 3, P.omnitrix);
  pc.poly([[3, 3], [7, 3], [5, 5]], P.ink);
  pc.poly([[3, 7], [7, 7], [5, 5]], P.ink);
}

export function drawBarricade(pc: PixelCanvas, w: number, h: number): void {
  const rnd = seeded(w * 13 + h * 7);
  // Crossed logs lashed together with Vilgax tech bands.
  pc.rect(1, 0, w - 2, h, 0x241612);
  for (let y = 2; y < h; y += 7) {
    const tilt = Math.round((rnd() - 0.5) * 4);
    pc.line(0, y + tilt, w - 1, y - tilt, P.wood1, 4);
    pc.line(0, y + tilt - 1, w - 1, y - tilt - 1, P.wood2);
  }
  pc.line(3, 0, w - 5, h - 1, P.wood0, 3);
  pc.line(w - 4, 0, 4, h - 1, P.wood0, 3);
  for (let y = 6; y < h; y += 14) {
    pc.rect(0, y, w, 2, P.metal1);
    pc.px(Math.floor(w / 2), y, P.enemy);
  }
  // Thorny brambles.
  for (let i = 0; i < (w * h) / 40; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h);
    pc.px(x, y, 0x3a5a2a);
    pc.px(x + 1, y - 1, 0x2a4a22);
  }
  pc.outline(P.ink);
}

export const CHECKPOINT_FRAMES = { off: 0, on: 1 } as const;

export function drawCheckpoint(pc: PixelCanvas, frame: number): void {
  const on = frame === 1;
  pc.rect(5, 8, 3, 20, P.metal1);
  pc.rect(5, 8, 1, 20, P.metal2);
  pc.rect(2, 25, 9, 3, P.metal0);
  pc.rect(1, 0, 11, 9, P.metal0);
  pc.rect(2, 1, 9, 7, on ? P.omnitrix : P.omnitrixDeep);
  pc.poly([[3, 2], [10, 2], [6, 4]], on ? P.omnitrixGlow : P.metal1);
  pc.poly([[3, 7], [10, 7], [6, 5]], on ? P.omnitrixGlow : P.metal1);
  pc.outline(P.ink);
}

/** Mr. Smoothy cup: the health pickup. */
export function drawSmoothy(pc: PixelCanvas): void {
  pc.poly([[1, 5], [12, 5], [10, 17], [3, 17]], 0xff5fa2);
  pc.rect(2, 9, 9, 3, P.cream);
  pc.px(5, 10, 0xff5fa2).px(7, 10, 0xff5fa2);
  pc.ellipse(6, 5, 6, 2, 0x9fe8ff);
  pc.ellipse(6, 4, 4, 1, 0xd8f7ff);
  pc.line(8, 3, 11, 0, 0xff3048, 1);
  pc.outline(P.ink);
}

/** Sumo Slammers trading card. Frame 0 is the front, 1 the back. */
export function drawCard(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.rect(0, 0, 11, 15, P.gold);
    pc.rect(1, 1, 9, 13, 0xd8323e);
    pc.rect(2, 2, 7, 7, 0xffe0b8);
    pc.circle(5, 5, 2, 0x5a3a2a);
    pc.rect(3, 7, 5, 2, 0x5a3a2a);
    pc.rect(2, 10, 7, 1, P.gold).rect(2, 12, 5, 1, P.gold);
  } else {
    pc.rect(0, 0, 11, 15, P.gold);
    pc.rect(1, 1, 9, 13, 0x2a4aa8);
    pc.circle(5, 7, 3, P.gold);
    pc.px(5, 7, 0x2a4aa8);
  }
  pc.outline(P.ink);
}

export const JAMMER_FRAMES = { idle: 0, pulse: 1, damaged: 2, broken: 3 } as const;

export function drawJammer(pc: PixelCanvas, frame: number): void {
  const broken = frame === 3;
  // Base.
  pc.rect(2, 52, 20, 10, P.metal0);
  pc.rect(4, 50, 16, 3, P.metal1);
  pc.rect(3, 60, 18, 2, P.metal1);
  // Mast.
  if (broken) {
    pc.poly([[9, 50], [15, 50], [16, 38], [12, 34], [8, 40]], P.metal1);
    pc.line(12, 34, 17, 30, P.metal2, 2);
  } else {
    pc.rect(9, 10, 6, 40, P.metal1);
    pc.rect(9, 10, 2, 40, P.metal2);
    for (const y of [14, 24, 34]) {
      pc.rect(5, y, 14, 2, P.metal2);
      pc.px(5, y, P.jammer).px(18, y, P.jammer);
    }
    pc.line(12, 0, 12, 10, P.metal2);
    pc.px(12, 0, frame === 1 ? P.white : P.jammer);
  }
  // Core orb.
  const coreColor = broken ? P.metal0 : frame === 2 ? P.enemy : frame === 1 ? P.white : P.jammer;
  pc.circle(12, 44, 5, P.jammerDark);
  pc.circle(12, 44, 3, coreColor);
  if (!broken) pc.px(11, 43, P.white);
  if (frame >= 2) {
    pc.line(8, 40, 12, 46, P.ink);
    pc.line(16, 41, 13, 45, P.ink);
  }
  pc.outline(P.ink);
}

/** Energy barrier column tile. Frames animate the scanlines. */
export function drawEnergyWall(pc: PixelCanvas, frame: number, color: number, dark: number): void {
  pc.rect(0, 0, 8, 16, dark, 0.55);
  pc.rect(3, 0, 2, 16, color, 0.9);
  for (let y = 0; y < 16; y += 4) pc.rect(0, (y + frame * 2) % 16, 8, 1, color, 0.8);
  pc.px(1, (frame * 5) % 16, P.white).px(6, (frame * 5 + 8) % 16, P.white);
}

/** Liftable boulder, 18x16. */
export function drawBoulder(pc: PixelCanvas): void {
  pc.poly([[2, 15], [0, 9], [3, 3], [8, 0], [14, 2], [17, 7], [17, 13], [14, 15]], P.rock1);
  pc.poly([[4, 4], [8, 1], [13, 3], [10, 6], [5, 7]], P.rock2);
  pc.line(9, 7, 13, 12, P.rock0).line(9, 7, 5, 11, P.rock0).line(13, 12, 15, 11, P.rock0);
  pc.px(6, 3, 0x7c86b0).px(12, 9, P.rock2).px(3, 12, P.rock0);
  pc.rect(2, 14, 13, 1, P.rock0);
  pc.outline(P.ink);
}

/** Training dummy: a scrap robot on a spring with a target on its chest. 20x32, origin bottom-centre. */
export function drawDummy(pc: PixelCanvas): void {
  // Base and spring.
  pc.rect(4, 29, 12, 3, P.metal0).rect(5, 29, 10, 1, P.metal2);
  for (let y = 22; y < 29; y += 2) pc.rect(7, y, 6, 1, P.metal3).rect(8, y + 1, 4, 1, P.metal1);
  // Barrel body with a painted target.
  pc.rect(3, 9, 14, 13, P.metal1);
  pc.rect(3, 9, 14, 2, P.metal2);
  pc.rect(3, 20, 14, 2, P.metal0);
  pc.circle(10, 15, 4, P.white);
  pc.circle(10, 15, 3, P.enemy);
  pc.circle(10, 15, 1, P.white);
  // Stubby arms and a bucket head with one green lens.
  pc.rect(0, 11, 3, 6, P.metal2).rect(17, 11, 3, 6, P.metal2);
  pc.rect(5, 2, 10, 7, P.metal2);
  pc.rect(5, 2, 10, 1, P.metal3);
  pc.rect(7, 4, 6, 3, P.ink);
  pc.rect(8, 5, 2, 1, P.omnitrix);
  pc.vline(13, 0, 2, P.metal3);
  pc.px(13, 0, P.omnitrix);
  pc.outline(P.ink);
}
