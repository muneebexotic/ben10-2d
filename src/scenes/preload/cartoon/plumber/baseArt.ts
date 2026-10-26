import type Phaser from 'phaser';
import { makeHdSheet, makeHdImage, makeHdTexture, type HdFrame } from '../hdTexture';
import { INK, LINE, lightOf, mix, shadeOf, type Paint } from '../paint';

/**
 * The Plumber base's HD world art (Chapter 7): back walls, windows onto the
 * sea, the sea itself, light shafts, the far silhouettes outside, and the
 * base's furniture. A 1970s space-cop outpost: rounded steel panels in
 * grey-blue, chunky bolts, green status lights, yellow trim, the Plumber
 * badge everywhere. Made once per load at the chapter's art resolution.
 */

export const PLUMBER_ART = {
  wall: 'hd-p-wall',
  window: 'hd-p-window',
  sea: 'hd-p-sea',
  ray: 'hd-p-ray',
  rocks: 'hd-p-rocks',
  baseFar: 'hd-p-basefar',
  kelp: 'hd-p-kelp',
  coral: 'hd-p-coral',
  fish: 'hd-p-fish',
  whale: 'hd-p-whale',
  capsule: 'hd-p-capsule',
  reactor: 'hd-p-reactor',
  props: 'hd-p-props',
  cell: 'hd-p-cell',
  snow: 'hd-p-snow',
  booth: 'hd-p-booth',
  machines: 'hd-p-machines',
} as const;

/** The back wall's panel variants (one 64x64 tile of wall each). */
export const WALL_VARIANTS = ['plain', 'porthole', 'pipes', 'badge', 'screen', 'vent', 'lights', 'dark'] as const;
export type WallVariant = (typeof WALL_VARIANTS)[number];

/** Furniture in the props atlas, by frame name. */
export const PROP_FRAMES = ['locker', 'lockerOpen', 'console', 'crate', 'lamp', 'pipeV', 'sign', 'tankGlass', 'bench', 'vent', 'cableReel', 'warning'] as const;
export type PropFrame = (typeof PROP_FRAMES)[number];

const STEEL = 0x5a6c88;
const STEEL_DARK = 0x34405a;
const STEEL_LIGHT = 0x9cb0cc;
const TRIM = 0xe8d040;
const GLOW = 0x7dffb0;
const SEA_TOP = 0x2a7aa8;
const SEA_DEEP = 0x061a34;

/** The Plumber badge: a gold shield with the stylised P. */
export function plumberBadge(p: Paint, x: number, y: number, r: number): void {
  const shield = p.smooth([x - r, y - r * 0.9, x, y - r * 1.15, x + r, y - r * 0.9, x + r * 0.9, y + r * 0.2, x, y + r * 1.2, x - r * 0.9, y + r * 0.2], true, 0.3);
  p.shape(shield, { fill: { linear: [x, y - r, x, y + r], stops: [[0, 0xfff0a0], [0.5, 0xe8b830], [1, 0xa87018]] }, ink: LINE * 0.8, light: 0xffffff, lightDepth: r * 0.15, lightAlpha: 0.6 });
  p.fill(p.circle(x, y, r * 0.48), 0x2a3450);
  p.line([x - r * 0.18, y + r * 0.32, x - r * 0.18, y - r * 0.32, x + r * 0.15, y - r * 0.32, x + r * 0.2, y - r * 0.05, x - r * 0.15, y], LINE * 0.9, 0x9affd0, true);
}

/** A sea view through glass: the gradient, a light shaft, a far rock, a few fish. */
function seaView(p: Paint, x: number, y: number, w: number, h: number, seed: number): void {
  p.fill(p.rrect(x, y, w, h, 0), { linear: [0, y, 0, y + h], stops: [[0, SEA_TOP], [1, SEA_DEEP]] });
  p.fill(p.poly([x + w * 0.2, y, x + w * 0.45, y, x + w * 0.8, y + h, x + w * 0.35, y + h]), 0xcff4ff, 0.12);
  p.fill(p.smooth([x - 2, y + h, x + w * 0.2, y + h * 0.7, x + w * 0.5, y + h * 0.78, x + w * 0.8, y + h * 0.62, x + w + 2, y + h * 0.75, x + w + 2, y + h + 2], true, 0.4), 0x0c2a44, 0.9);
  for (let i = 0; i < 3; i++) {
    const fx = x + w * (0.2 + ((seed * 0.37 + i * 0.29) % 0.6));
    const fy = y + h * (0.25 + i * 0.15);
    p.fill(p.ellipse(fx, fy, 1.6, 0.7), 0x9ad8f0, 0.7);
    p.fill(p.poly([fx - 1.4, fy, fx - 2.6, fy - 0.8, fx - 2.6, fy + 0.8]), 0x9ad8f0, 0.7);
  }
}

/** One 64x64 panel of the base's back wall. */
function wallPanel(p: Paint, v: WallVariant): void {
  const S = 64;
  const dark = v === 'dark';
  p.fill(p.rrect(0, 0, S, S, 0), { linear: [0, 0, 0, S], stops: [[0, dark ? 0x1c2436 : 0x3a4862], [1, dark ? 0x141a28 : 0x2a344a]] });
  // Two big rounded plates with a seam between them.
  for (const [px, py, pw, ph] of [[2, 2, 60, 28], [2, 34, 60, 28]] as const) {
    const plate = p.rrect(px, py, pw, ph, 4);
    p.fill(plate, { linear: [0, py, 0, py + ph], stops: [[0, dark ? 0x262f44 : 0x4a5a78], [1, dark ? 0x1a2132 : 0x3a4762]] });
    p.stroke(plate, 0x1a2234, 1.1, 0.9);
    p.line([px + 3, py + 1.4, px + pw - 3, py + 1.4], 0.7, 0xffffff, false, dark ? 0.06 : 0.16);
    for (const [bx, by] of [[px + 4, py + 4], [px + pw - 4, py + 4], [px + 4, py + ph - 4], [px + pw - 4, py + ph - 4]] as const) {
      p.fill(p.circle(bx, by, 1.2), 0x1a2234);
      p.fill(p.circle(bx - 0.3, by - 0.3, 0.75), dark ? 0x3a4660 : 0x7a8cac);
    }
  }
  // A trim line along the seam.
  p.fill(p.rrect(0, 31, S, 2, 0), TRIM, dark ? 0.15 : 0.5);
  switch (v) {
    case 'porthole': {
      const ring = p.circle(32, 16, 11);
      p.shape(ring, { fill: { linear: [21, 5, 43, 27], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
      const glass = p.circle(32, 16, 8.4);
      p.within(glass, () => seaView(p, 23, 7, 18, 18, 1));
      p.stroke(glass, INK, LINE);
      p.fill(p.ellipse(28.5, 12.5, 3, 1.6, -0.6), 0xffffff, 0.5);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        p.fill(p.circle(32 + Math.cos(a) * 9.8, 16 + Math.sin(a) * 9.8, 0.7), 0x2a3450);
      }
      break;
    }
    case 'pipes':
      for (const [y, c] of [[40, 0x6a8a9a], [48, 0x8a6a5a], [55, 0x5a7a8a]] as const) {
        const pipe = p.rrect(-2, y, S + 4, 4.5, 2.2);
        p.shape(pipe, { fill: { linear: [0, y, 0, y + 4.5], stops: [[0, lightOf(c, 0.3)], [1, shadeOf(c, 0.3)]] }, ink: LINE * 0.8 });
        for (const x of [14, 46]) p.shape(p.rrect(x - 2, y - 1, 4, 6.5, 1), { fill: STEEL_DARK, ink: LINE * 0.6 });
      }
      break;
    case 'badge':
      plumberBadge(p, 32, 16, 9);
      break;
    case 'screen': {
      const screen = p.rrect(14, 6, 36, 20, 2.5);
      p.shape(screen, { fill: 0x0a1a1c, ink: LINE });
      p.within(screen, () => {
        for (let i = 0; i < 5; i++) p.line([17, 10 + i * 3.4, 17 + 8 + ((i * 7) % 18), 10 + i * 3.4], 1.2, GLOW, false, 0.8);
        p.stroke(p.circle(42, 16, 5), GLOW, 0.8, 0.7);
        p.line([42, 16, 45.5, 12.5], 0.8, GLOW, false, 0.9);
      });
      p.glow(32, 16, 22, GLOW, 0.12);
      break;
    }
    case 'vent':
      p.shape(p.rrect(18, 38, 28, 20, 3), { fill: 0x1a2232, ink: LINE });
      for (let i = 0; i < 5; i++) p.line([21, 41.5 + i * 3.4, 43, 41.5 + i * 3.4], 1.4, 0x5a6c88, false, 0.8);
      break;
    case 'lights':
      for (const x of [12, 32, 52]) {
        p.glow(x, 16, 9, GLOW, 0.35);
        p.shape(p.rrect(x - 4, 13, 8, 6, 2), { fill: { linear: [0, 13, 0, 19], stops: [[0, 0xe8fff2], [1, GLOW]] }, ink: LINE * 0.7 });
      }
      break;
    default:
      break;
  }
}

/** A big viewing window onto the sea: thick steel frame, rivets, glass glare. 96x64. */
function bigWindow(p: Paint): void {
  const frame = p.rrect(0, 0, 96, 64, 10);
  p.shape(frame, { fill: { linear: [0, 0, 0, 64], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE * 1.2 });
  const glass = p.rrect(7, 7, 82, 50, 6);
  p.within(glass, () => {
    seaView(p, 7, 7, 82, 50, 3);
    // The base's own lights outside, and a far tower.
    p.fill(p.rrect(64, 22, 7, 35, 2), 0x0a2034, 0.95);
    for (let i = 0; i < 4; i++) p.glow(67.5, 26 + i * 7, 2.2, 0xffe08a, 0.8);
  });
  p.stroke(glass, INK, LINE * 1.1);
  p.fill(p.poly([14, 9, 30, 9, 16, 55, 10, 55]), 0xffffff, 0.12);
  p.fill(p.poly([34, 9, 38, 9, 24, 55, 20, 55]), 0xffffff, 0.08);
  for (let i = 0; i < 10; i++) {
    const x = 6 + i * 9.4;
    p.fill(p.circle(x, 3.5, 0.9), 0x2a3450);
    p.fill(p.circle(x, 60.5, 0.9), 0x2a3450);
  }
}

/** The far side of the sea: a ragged ridge of rock (tiles across). 320x120. */
function rocks(p: Paint): void {
  const ridge = p.smooth([0, 120, 0, 70, 30, 58, 62, 74, 96, 44, 130, 52, 170, 30, 205, 50, 240, 40, 280, 66, 320, 56, 320, 120], true, 0.5);
  p.fill(ridge, { linear: [0, 30, 0, 120], stops: [[0, 0x18405a], [1, 0x0a2034]] });
  p.within(ridge, () => {
    for (const [x, y] of [[96, 46], [170, 32], [240, 42]] as const) p.fill(p.poly([x, y, x + 30, y + 70, x - 20, y + 70]), 0x28587a, 0.25);
  });
}

/** The base seen from outside: a dome, towers, docking arms, rows of lit windows. 400x160. */
function baseFar(p: Paint): void {
  const fill = 0x0e2a40;
  const dome = p.ellipse(200, 120, 120, 70);
  p.fill(dome, { linear: [0, 50, 0, 160], stops: [[0, 0x1e4a66], [1, fill]] });
  p.fill(p.rrect(110, 40, 26, 120, 6), fill);
  p.fill(p.rrect(268, 20, 30, 140, 8), fill);
  p.fill(p.ellipse(283, 20, 22, 10), 0x1e4a66);
  p.fill(p.rrect(10, 112, 120, 10, 4), fill);
  p.fill(p.rrect(280, 104, 120, 10, 4), fill);
  for (let i = 0; i < 12; i++) p.glow(132 + i * 12, 108, 2.6, 0xffe08a, 0.85);
  for (let i = 0; i < 9; i++) p.glow(283, 34 + i * 13, 2.2, 0x9affd0, 0.8);
  for (let i = 0; i < 6; i++) p.glow(123, 52 + i * 16, 2.2, 0xffe08a, 0.7);
  p.glow(200, 50, 14, 0x9affd0, 0.35);
  p.fill(p.circle(200, 50, 3), 0xe8fff4);
}

/** Kelp: a tall swaying frond (frames sway). 24x96. */
function kelp(p: Paint, f: number): void {
  const sway = (f - 1.5) * 2.2;
  const pts: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(12 + Math.sin(t * 3 + f) * 3 + sway * t * t, 96 - t * 92);
  }
  p.line(pts, 3.2, 0x0e3a2a, true);
  p.line(pts, 2.0, 0x3a8a5a, true);
  for (let i = 1; i < 8; i++) {
    const x = pts[i * 2];
    const y = pts[i * 2 + 1];
    const side = i % 2 ? 1 : -1;
    p.shape(p.smooth([x, y, x + side * 7, y - 3 + sway * 0.3, x + side * 9, y + 1, x + side * 3, y + 3], true, 0.4), { fill: { linear: [x, y, x + side * 9, y], stops: [[0, 0x4a9a62], [1, 0x2a6a46]] }, ink: LINE * 0.6, inkColor: 0x0a2a1c });
  }
}

/** Coral: three kinds (fan, brain, tube). 40x30. */
function coral(p: Paint, f: number): void {
  if (f === 0) {
    const fan = p.smooth([20, 30, 6, 18, 4, 8, 12, 2, 20, 6, 28, 2, 36, 8, 34, 18], true, 0.4);
    p.shape(fan, { fill: { radial: [20, 26, 2, 20, 18, 22], stops: [[0, 0xff9ac0], [1, 0xc04a7a]] }, ink: LINE });
    p.within(fan, () => {
      for (let i = 0; i < 7; i++) p.line([20, 30, 6 + i * 4.6, 4], 0.6, 0x7a1a40, false, 0.5);
    });
  } else if (f === 1) {
    const brain = p.ellipse(20, 22, 14, 9);
    p.shape(brain, { fill: { linear: [6, 13, 34, 31], stops: [[0, 0xffd27a], [1, 0xc0802a]] }, ink: LINE });
    p.within(brain, () => {
      for (let i = 0; i < 5; i++) p.line([8 + i * 5, 16, 10 + i * 5, 22, 7 + i * 5, 28], 0.7, 0x8a5018, true, 0.6);
    });
  } else {
    for (const [x, h, c] of [[10, 22, 0x9a7aff], [18, 28, 0xb89aff], [26, 18, 0x8a6af0], [32, 24, 0xa88aff]] as const) {
      const tube = p.rrect(x - 3, 30 - h, 6, h, 3);
      p.shape(tube, { fill: { linear: [x - 3, 0, x + 3, 0], stops: [[0, lightOf(c, 0.3)], [1, shadeOf(c, 0.3)]] }, ink: LINE * 0.8 });
      p.fill(p.ellipse(x, 30 - h + 1.5, 2, 1), 0x2a1a5a);
    }
  }
}

/** A little fish (school member), two frames of tail. 10x6. */
function fish(p: Paint, f: number): void {
  const body = p.smooth([1, 3, 4, 1, 8, 2, 9.4, 3, 8, 4, 4, 5], true, 0.4);
  p.shape(body, { fill: { linear: [0, 1, 0, 5], stops: [[0, 0xb8e8ff], [1, 0x4a9ac8]] }, ink: LINE * 0.6 });
  p.fill(p.poly([1.4, 3, -0.6, 1 + f * 0.8, -0.6, 5 - f * 0.8]), 0x4a9ac8);
  p.fill(p.circle(7.4, 2.7, 0.55), INK);
}

/** A whale-sized shadow passing far above. 200x70. */
function whale(p: Paint): void {
  const body = p.smooth([4, 34, 30, 18, 90, 12, 150, 20, 196, 32, 160, 46, 90, 54, 30, 50], true, 0.5);
  p.fill(body, 0x061a2c, 0.85);
  p.fill(p.poly([4, 34, -2, 18, 14, 30, -2, 50]), 0x061a2c, 0.85);
  p.fill(p.poly([110, 50, 128, 68, 100, 54]), 0x061a2c, 0.85);
}

/** The docked capsule: a glass elevator car in a steel collar, its hatch, the tube going up. 72x120. */
function capsule(p: Paint): void {
  // The tube rising out of the top of the frame.
  p.fill(p.rrect(16, 0, 40, 40, 0), 0xa8e0ff, 0.18);
  p.line([16, 0, 16, 40], 1.2, 0xcff4ff, false, 0.6);
  p.line([56, 0, 56, 40], 1.2, 0xcff4ff, false, 0.6);
  for (let y = 6; y < 40; y += 12) p.fill(p.rrect(14, y, 44, 3, 1), STEEL_DARK);
  // The car: a rounded glass cylinder between steel caps.
  const glass = p.rrect(12, 44, 48, 62, 10);
  p.fill(glass, { linear: [12, 0, 60, 0], stops: [[0, 0x8ad0f0, 0.35], [0.5, 0xd8f4ff, 0.18], [1, 0x6ab0d8, 0.35]] });
  p.stroke(glass, INK, LINE * 1.1);
  p.fill(p.rrect(16, 48, 6, 54, 3), 0xffffff, 0.22);
  for (const [y, h] of [[38, 10], [104, 12]] as const) {
    const cap = p.rrect(6, y, 60, h, 4);
    p.shape(cap, { fill: { linear: [0, y, 0, y + h], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
    p.fill(p.rrect(10, y + h / 2 - 0.8, 52, 1.6, 0.8), TRIM, 0.8);
    for (const x of [12, 36, 60]) p.glow(x, y + h / 2, 2.5, GLOW, 0.7);
  }
  plumberBadge(p, 36, 43, 3.4);
}

/** The reactor core: a tall glass column of churning green energy in a ribbed cage. 96x140. Frames: 0 running, 1 drained (dark). */
function reactor(p: Paint, f: number): void {
  const live = f === 0;
  const core = p.rrect(30, 14, 36, 112, 14);
  if (live) p.glow(48, 70, 70, 0x5dff9a, 0.35);
  p.fill(core, { linear: [30, 0, 66, 0], stops: [[0, live ? 0x2aa86a : 0x1a2a2a], [0.5, live ? 0xd8ffe8 : 0x2a3a3a], [1, live ? 0x2aa86a : 0x1a2a2a]] });
  p.within(core, () => {
    for (let i = 0; i < 6; i++) p.line([30, 24 + i * 18, 48, 30 + i * 18, 66, 22 + i * 18], 2, live ? 0xffffff : 0x3a4a4a, true, live ? 0.55 : 0.4);
  });
  p.stroke(core, INK, LINE * 1.2);
  for (const [y, h] of [[0, 18], [122, 18]] as const) {
    const cap = p.rrect(14, y, 68, h, 6);
    p.shape(cap, { fill: { linear: [0, y, 0, y + h], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
    for (let i = 0; i < 5; i++) p.glow(22 + i * 13, y + h / 2, 2.6, live ? GLOW : 0xff4a3a, 0.8);
  }
  // The ribbed cage.
  for (const x of [22, 74]) {
    const bar = p.rrect(x - 3, 14, 6, 112, 3);
    p.shape(bar, { fill: { linear: [x - 3, 0, x + 3, 0], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE * 0.8 });
  }
  for (let y = 30; y < 122; y += 24) {
    p.line([20, y, 76, y], 3, INK, false, 0.9);
    p.line([20, y, 76, y], 1.8, STEEL, false);
  }
  plumberBadge(p, 48, 9, 5);
}

/** Base furniture, one frame each. */
function prop(p: Paint, f: PropFrame): void {
  switch (f) {
    case 'locker':
    case 'lockerOpen': {
      const body = p.rrect(1, 1, 14, 30, 2);
      p.shape(body, { fill: { linear: [0, 0, 16, 0], stops: [[0, 0x7a8aa8], [1, 0x4a5a78]] }, ink: LINE });
      if (f === 'lockerOpen') {
        p.fill(p.rrect(3, 3, 10, 26, 1), 0x141a28);
        // Max's old armour (it shrank) and his blaster rack.
        p.shape(p.rrect(5, 6, 6, 10, 2), { fill: 0xe8e8f0, ink: LINE * 0.6 });
        plumberBadge(p, 8, 10, 1.6);
        p.shape(p.rrect(4, 20, 8, 3, 1), { fill: 0x5a6a7a, ink: LINE * 0.6 });
        p.shape(p.poly([15, 3, 22, 6, 22, 28, 15, 31]), { fill: 0x6a7a98, ink: LINE });
      } else {
        for (let i = 0; i < 3; i++) p.line([4, 4 + i * 1.6, 12, 4 + i * 1.6], 0.6, INK, false, 0.6);
        p.fill(p.rrect(11, 15, 2, 4, 1), TRIM);
        p.line([8, 2, 8, 30], 0.6, INK, false, 0.5);
      }
      break;
    }
    case 'console': {
      const desk = p.poly([1, 22, 4, 10, 20, 10, 23, 22]);
      p.shape(desk, { fill: { linear: [0, 10, 0, 22], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
      p.shape(p.rrect(5, 1, 14, 10, 1.5), { fill: 0x0a1a1c, ink: LINE });
      p.line([7, 4, 13, 4], 0.9, GLOW, false, 0.9);
      p.line([7, 7, 16, 7], 0.9, GLOW, false, 0.7);
      for (const [x, c] of [[7, 0xff5a4a], [11, GLOW], [15, TRIM], [19, 0x6ab8ff]] as const) p.fill(p.circle(x, 15, 1), c);
      break;
    }
    case 'crate': {
      const box = p.rrect(1, 1, 18, 14, 2);
      p.shape(box, { fill: { linear: [0, 0, 0, 16], stops: [[0, 0x8a96a8], [1, 0x5a6678]] }, ink: LINE });
      p.line([1, 8, 19, 8], 0.8, INK, false, 0.6);
      p.fill(p.rrect(7, 4, 6, 2, 0.5), TRIM, 0.85);
      break;
    }
    case 'lamp': {
      p.glow(8, 6, 10, 0xfff0c0, 0.5);
      p.shape(p.smooth([2, 2, 14, 2, 12, 8, 4, 8], true, 0.3), { fill: { linear: [0, 2, 0, 8], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE * 0.8 });
      p.fill(p.ellipse(8, 8, 4, 1.4), 0xfff8e0);
      break;
    }
    case 'pipeV': {
      const pipe = p.rrect(4, 0, 6, 48, 3);
      p.shape(pipe, { fill: { linear: [4, 0, 10, 0], stops: [[0, 0x9ab0c0], [1, 0x4a5a6a]] }, ink: LINE * 0.8 });
      for (const y of [8, 24, 40]) p.shape(p.rrect(2.5, y - 1.5, 9, 3, 1), { fill: STEEL_DARK, ink: LINE * 0.6 });
      break;
    }
    case 'sign': {
      const sign = p.rrect(1, 1, 30, 12, 2);
      p.shape(sign, { fill: 0x1a2a3a, ink: LINE });
      p.fill(p.rrect(3, 3, 26, 8, 1), mix(TRIM, 0x000000, 0.1));
      for (let i = 0; i < 6; i++) p.fill(p.poly([3 + i * 5, 11, 6 + i * 5, 3, 8 + i * 5, 3, 5 + i * 5, 11]), 0x1a1a1a, 0.9);
      break;
    }
    case 'tankGlass': {
      const glass = p.rrect(1, 1, 22, 34, 6);
      p.fill(glass, { linear: [0, 0, 0, 36], stops: [[0, 0x6ac0e0, 0.4], [1, 0x1a5a8a, 0.6]] });
      p.stroke(glass, INK, LINE);
      p.fill(p.rrect(4, 4, 3, 28, 1.5), 0xffffff, 0.25);
      for (let i = 0; i < 4; i++) p.stroke(p.circle(10 + i * 3, 30 - i * 7, 1), 0xffffff, 0.5, 0.6);
      break;
    }
    case 'bench': {
      p.shape(p.rrect(1, 5, 30, 4, 1.5), { fill: { linear: [0, 5, 0, 9], stops: [[0, STEEL_LIGHT], [1, STEEL]] }, ink: LINE });
      for (const x of [5, 27]) p.shape(p.rrect(x - 1.5, 8, 3, 6, 1), { fill: STEEL_DARK, ink: LINE * 0.6 });
      break;
    }
    case 'vent': {
      p.shape(p.rrect(1, 1, 14, 6, 1.5), { fill: 0x1a2232, ink: LINE });
      for (let i = 0; i < 3; i++) p.line([3, 2.5 + i * 1.6, 13, 2.5 + i * 1.6], 0.7, 0x6a7a98, false, 0.9);
      break;
    }
    case 'cableReel': {
      const reel = p.circle(10, 10, 9);
      p.shape(reel, { fill: { radial: [7, 7, 1, 10, 10, 9], stops: [[0, 0xe8c070], [1, 0x9a6a2a]] }, ink: LINE });
      p.stroke(p.circle(10, 10, 6), 0x6a3a1a, 1.4, 0.8);
      p.fill(p.circle(10, 10, 2), STEEL_DARK);
      break;
    }
    case 'warning': {
      const tri = p.poly([10, 1, 19, 17, 1, 17]);
      p.shape(tri, { fill: TRIM, ink: LINE });
      p.line([10, 6, 10, 11.5], 1.6, INK, false);
      p.fill(p.circle(10, 14, 0.9), INK);
      break;
    }
  }
}

/** A containment cell door: thick glass in a steel frame, with a dark shape behind it (or nobody: Cell 7). Frames: 0-3 prisoners, 4 empty (Cell 7, its glass cracked). 40x64. */
function cell(p: Paint, f: number): void {
  const frame = p.rrect(0, 0, 40, 64, 4);
  p.shape(frame, { fill: { linear: [0, 0, 0, 64], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
  const glass = p.rrect(5, 8, 30, 50, 3);
  p.fill(glass, 0x0a1426);
  p.within(glass, () => {
    p.glow(20, 30, 26, 0x6ab0ff, 0.25);
    const shapes = [
      () => p.fill(p.smooth([12, 58, 10, 34, 16, 22, 24, 22, 30, 34, 28, 58], true, 0.4), 0x02060e),
      () => {
        p.fill(p.ellipse(20, 40, 12, 16), 0x02060e);
        for (const x of [12, 28]) p.fill(p.poly([x, 28, x + (x < 20 ? -4 : 4), 16, x + (x < 20 ? 2 : -2), 26]), 0x02060e);
      },
      () => {
        p.fill(p.rrect(10, 30, 20, 28, 6), 0x02060e);
        p.fill(p.circle(20, 24, 7), 0x02060e);
        p.fill(p.circle(17, 23, 1.2), 0xff4a3a);
        p.fill(p.circle(23, 23, 1.2), 0xff4a3a);
      },
      () => p.fill(p.smooth([6, 58, 8, 40, 20, 30, 34, 40, 34, 58], true, 0.5), 0x02060e),
    ];
    if (f < 4) shapes[f]();
    else {
      // Cell 7: empty, the stasis collar's clamp hanging open, the glass cracked.
      p.line([20, 8, 20, 20], 1.4, 0x5a6a88);
      p.shape(p.rrect(14, 20, 12, 5, 2), { fill: 0x6a7a98, ink: LINE * 0.6 });
    }
  });
  p.stroke(glass, INK, LINE);
  p.fill(p.poly([8, 10, 14, 10, 8, 40]), 0xffffff, 0.08);
  if (f === 4) {
    p.line([24, 14, 28, 22, 26, 30, 31, 38], 0.7, 0xffffff, false, 0.8);
    p.line([28, 22, 33, 24], 0.6, 0xffffff, false, 0.7);
  }
  p.shape(p.rrect(14, 1.5, 12, 5, 1.5), { fill: 0x0a1a1c, ink: LINE * 0.6 });
  p.line([16, 4, 24, 4], 1, f === 4 ? 0xff4a3a : GLOW, false, 0.9);
}

/** Max's booth over the moon pool: a lit window with the pump controls. 144x80. */
function booth(p: Paint): void {
  const frame = p.rrect(0, 0, 144, 80, 10);
  p.shape(frame, { fill: { linear: [0, 0, 0, 80], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE * 1.2 });
  const glass = p.rrect(10, 10, 124, 56, 6);
  p.fill(glass, { linear: [0, 10, 0, 66], stops: [[0, 0x2a4a5a], [1, 0x0e2030]] });
  p.within(glass, () => {
    p.glow(72, 50, 50, GLOW, 0.25);
    for (let i = 0; i < 6; i++) p.fill(p.rrect(16 + i * 19, 52, 14, 10, 2), 0x0a1a1c, 0.9);
    for (let i = 0; i < 6; i++) p.line([18 + i * 19, 56, 27 + i * 19, 56], 1, i % 2 ? GLOW : TRIM, false, 0.9);
  });
  p.stroke(glass, INK, LINE);
  p.fill(p.poly([18, 12, 40, 12, 24, 64, 14, 64]), 0xffffff, 0.1);
  plumberBadge(p, 72, 74, 4);
}

/** The base's working machines, by frame name. */
export const MACHINE_FRAMES = ['pump', 'pumpRun', 'pumpDone', 'valve', 'valveStand', 'consoleDead', 'consoleLive', 'lampRed', 'lampGreen', 'hatch10', 'pdoor15', 'pdoor10', 'grate'] as const;
export type MachineFrame = (typeof MACHINE_FRAMES)[number];

const MACHINE_SIZES: Record<MachineFrame, { w: number; h: number }> = {
  pump: { w: 26, h: 34 },
  pumpRun: { w: 26, h: 34 },
  pumpDone: { w: 26, h: 34 },
  valve: { w: 22, h: 22 },
  valveStand: { w: 14, h: 26 },
  consoleDead: { w: 26, h: 28 },
  consoleLive: { w: 26, h: 28 },
  lampRed: { w: 10, h: 10 },
  lampGreen: { w: 10, h: 10 },
  hatch10: { w: 18, h: 160 },
  pdoor15: { w: 18, h: 240 },
  pdoor10: { w: 18, h: 160 },
  grate: { w: 34, h: 14 },
};

/** A heavy sliding door: riveted plates, a hazard band, a porthole (pressure doors carry a gauge too). */
function door(p: Paint, h: number, pressure: boolean): void {
  const body = p.rrect(1, 0, 16, h, 2);
  p.shape(body, { fill: { linear: [1, 0, 17, 0], stops: [[0, 0x8a9cba], [0.5, 0x5a6c88], [1, 0x3a4862]] }, ink: LINE * 1.1 });
  p.within(body, () => {
    for (let y = 16; y < h; y += 32) p.line([1, y, 17, y], 0.8, 0x262e44, false, 0.8);
    for (let y = 8; y < h; y += 16) {
      p.fill(p.circle(4, y, 0.8), 0x262e44);
      p.fill(p.circle(14, y, 0.8), 0x262e44);
    }
    // Hazard stripes at the foot.
    for (let i = 0; i < 6; i++) p.fill(p.poly([1 + i * 4, h, 4 + i * 4, h - 8, 6 + i * 4, h - 8, 3 + i * 4, h]), i % 2 ? 0x1a1a1a : TRIM);
    p.fill(p.rrect(1, h - 8, 16, 0.8, 0), INK, 0.6);
  });
  const port = p.circle(9, h * 0.32, 4.2);
  p.shape(port, { fill: { linear: [5, 0, 13, 0], stops: [[0, 0x2a6a8a], [1, 0x0a2a44]] }, ink: LINE });
  p.fill(p.ellipse(7.6, h * 0.32 - 1.4, 1.6, 0.9, -0.6), 0xffffff, 0.5);
  if (pressure) {
    // The gauge: a dial with a needle and the PRESSURE plate.
    const dial = p.circle(9, h * 0.55, 4.6);
    p.shape(dial, { fill: 0xf0f0e0, ink: LINE });
    p.within(dial, () => {
      p.fill(p.poly([9, h * 0.55, 4, h * 0.55 - 5, 14, h * 0.55 - 5]), 0x5dff9a, 0.4);
      p.fill(p.poly([9, h * 0.55, 13.6, h * 0.55 - 2, 13.6, h * 0.55 + 4]), 0xff5a4a, 0.5);
    });
    p.fill(p.rrect(4, h * 0.55 + 6, 10, 3, 1), 0x1a2232);
  }
}

function machine(p: Paint, f: MachineFrame): void {
  switch (f) {
    case 'pump':
    case 'pumpRun':
    case 'pumpDone': {
      // A pump console: a squat cabinet with pipes in, a screen and the big round button.
      for (const x of [3, 21]) p.shape(p.rrect(x, 0, 3, 14, 1.5), { fill: { linear: [x, 0, x + 3, 0], stops: [[0, 0x9ab0c0], [1, 0x4a5a6a]] }, ink: LINE * 0.6 });
      const cab = p.rrect(1, 10, 24, 24, 3);
      p.shape(cab, { fill: { linear: [0, 10, 0, 34], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
      const screen = p.rrect(5, 13, 16, 9, 1.5);
      p.shape(screen, { fill: 0x0a1a1c, ink: LINE * 0.7 });
      const on = f !== 'pump';
      p.within(screen, () => {
        const c = f === 'pumpDone' ? GLOW : f === 'pumpRun' ? 0x6ad8ff : 0x3a8a6a;
        for (let i = 0; i < 4; i++) p.fill(p.rrect(7 + i * 3.4, 20 - (2 + ((i * 3) % 5)), 2.4, 2 + ((i * 3) % 5), 0.3), c, on ? 0.95 : 0.5);
        if (f === 'pumpDone') p.line([8, 17, 11, 20, 18, 14], 1.2, 0xffffff, false, 0.95);
      });
      if (on) p.glow(13, 17, 12, f === 'pumpDone' ? GLOW : 0x6ad8ff, 0.3);
      const button = p.circle(13, 28, 3.6);
      p.shape(button, { fill: { radial: [12, 27, 0.5, 13, 28, 3.6], stops: [[0, 0xffa0a0], [1, f === 'pumpDone' ? 0x2aa86a : 0xd02a2a]] }, ink: LINE * 0.8 });
      p.fill(p.ellipse(12, 26.8, 1.4, 0.8), 0xffffff, 0.6);
      break;
    }
    case 'valve': {
      const rim = p.circle(11, 11, 9.5);
      p.stroke(rim, INK, 4.6);
      p.stroke(rim, 0xd04a3a, 3);
      p.stroke(rim, 0xff8a6a, 0.8, 0.8);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        p.line([11, 11, 11 + Math.cos(a) * 9, 11 + Math.sin(a) * 9], 3.2, INK);
        p.line([11, 11, 11 + Math.cos(a) * 9, 11 + Math.sin(a) * 9], 1.8, 0xb83a2a);
      }
      p.shape(p.circle(11, 11, 2.6), { fill: STEEL_LIGHT, ink: LINE * 0.7 });
      break;
    }
    case 'valveStand': {
      const pipe = p.rrect(4, 4, 6, 22, 2);
      p.shape(pipe, { fill: { linear: [4, 0, 10, 0], stops: [[0, 0x9ab0c0], [1, 0x4a5a6a]] }, ink: LINE * 0.8 });
      p.shape(p.rrect(1, 22, 12, 4, 1), { fill: STEEL_DARK, ink: LINE * 0.7 });
      p.shape(p.rrect(2.5, 2, 9, 4, 1.5), { fill: STEEL, ink: LINE * 0.7 });
      break;
    }
    case 'consoleDead':
    case 'consoleLive': {
      const live = f === 'consoleLive';
      const desk = p.poly([1, 28, 3, 13, 23, 13, 25, 28]);
      p.shape(desk, { fill: { linear: [0, 13, 0, 28], stops: [[0, STEEL_LIGHT], [1, STEEL_DARK]] }, ink: LINE });
      const screen = p.rrect(4, 1, 18, 13, 2);
      p.shape(screen, { fill: live ? 0x0a2a24 : 0x0a0e14, ink: LINE });
      if (live) {
        p.within(screen, () => {
          plumberBadge(p, 13, 7.4, 3.6);
          p.line([6, 12, 20, 12], 0.8, GLOW, false, 0.8);
        });
        p.glow(13, 7, 14, GLOW, 0.3);
      } else {
        p.fill(p.ellipse(9, 5, 4, 1.4, -0.3), 0xffffff, 0.08);
        p.line([6, 10, 9, 8, 12, 11], 0.6, 0xff4a3a, false, 0.6);
      }
      for (const [x, c] of [[7, live ? GLOW : 0x3a2a2a], [13, live ? TRIM : 0x3a3a2a], [19, live ? 0x6ab8ff : 0x2a2a3a]] as const) p.fill(p.circle(x, 20, 1.3), c);
      // The big button you hit.
      p.shape(p.rrect(9, 22, 8, 3, 1.2), { fill: live ? 0x2aa86a : 0xd0a02a, ink: LINE * 0.6 });
      break;
    }
    case 'lampRed':
    case 'lampGreen': {
      const c = f === 'lampRed' ? 0xff4a3a : 0x5dff9a;
      p.glow(5, 5, 5, c, 0.6);
      p.shape(p.circle(5, 5, 2.4), { fill: { radial: [4.2, 4.2, 0.2, 5, 5, 2.4], stops: [[0, 0xffffff], [1, c]] }, ink: LINE * 0.6 });
      break;
    }
    case 'hatch10':
      door(p, 160, false);
      break;
    case 'pdoor15':
      door(p, 240, true);
      break;
    case 'pdoor10':
      door(p, 160, true);
      break;
    case 'grate': {
      const g = p.rrect(1, 1, 32, 12, 3);
      p.shape(g, { fill: 0x1a2232, ink: LINE });
      p.within(g, () => {
        for (let x = 4; x < 32; x += 3.5) p.line([x, 1, x, 13], 1.4, 0x6a7a98, false, 0.9);
      });
      p.fill(p.rrect(1, 1, 32, 2, 1), TRIM, 0.6);
      break;
    }
  }
}

/** Marine snow: a soft speck. 3x3. */
function snow(p: Paint): void {
  p.glow(1.5, 1.5, 1.5, 0xffffff, 0.8, 0.4);
}

/** Paints every texture the chapter's world uses (once). */
export function makePlumberArt(scene: Phaser.Scene, res: number): void {
  const wall: HdFrame[] = WALL_VARIANTS.map((v) => ({ name: v, w: 64, h: 64, draw: (p) => wallPanel(p, v) }));
  makeHdTexture(scene, PLUMBER_ART.wall, wall, res);
  makeHdImage(scene, PLUMBER_ART.window, 96, 64, res, bigWindow);
  makeHdImage(scene, PLUMBER_ART.sea, 8, 128, 1, (p) => p.fill(p.rrect(0, 0, 8, 128, 0), { linear: [0, 0, 0, 128], stops: [[0, 0x2a86b0], [0.45, 0x0e3a62], [1, SEA_DEEP]] }));
  makeHdImage(scene, PLUMBER_ART.ray, 48, 200, Math.min(res, 2), (p) => {
    p.fill(p.poly([14, 0, 34, 0, 48, 200, 0, 200]), { linear: [0, 0, 0, 200], stops: [[0, 0xffffff, 0.55], [1, 0xffffff, 0]] });
  });
  makeHdImage(scene, PLUMBER_ART.rocks, 320, 120, Math.min(res, 2), rocks);
  makeHdImage(scene, PLUMBER_ART.baseFar, 400, 160, Math.min(res, 2), baseFar);
  makeHdSheet(scene, PLUMBER_ART.kelp, 24, 96, 4, res, kelp);
  makeHdSheet(scene, PLUMBER_ART.coral, 40, 30, 3, res, coral);
  makeHdSheet(scene, PLUMBER_ART.fish, 10, 6, 2, res, fish);
  makeHdImage(scene, PLUMBER_ART.whale, 200, 70, Math.min(res, 2), whale);
  makeHdImage(scene, PLUMBER_ART.capsule, 72, 120, res, capsule);
  makeHdSheet(scene, PLUMBER_ART.reactor, 96, 140, 2, res, reactor);
  makeHdTexture(scene, PLUMBER_ART.props, PROP_FRAMES.map((f) => ({ name: f, w: f === 'pipeV' ? 14 : f === 'sign' ? 32 : f === 'bench' ? 32 : f === 'lockerOpen' ? 24 : 24, h: f === 'pipeV' ? 48 : f === 'locker' || f === 'lockerOpen' ? 32 : f === 'tankGlass' ? 36 : 24, draw: (p) => prop(p, f) })), res);
  makeHdSheet(scene, PLUMBER_ART.cell, 40, 64, 5, res, cell);
  makeHdImage(scene, PLUMBER_ART.booth, 144, 80, res, booth);
  makeHdImage(scene, PLUMBER_ART.snow, 3, 3, res, snow);
  makeHdTexture(scene, PLUMBER_ART.machines, MACHINE_FRAMES.map((f) => ({ name: f, w: MACHINE_SIZES[f].w, h: MACHINE_SIZES[f].h, draw: (p) => machine(p, f) })), res);
}
