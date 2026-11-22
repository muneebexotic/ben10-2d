import type Phaser from 'phaser';
import { TILE } from '../../../../config/constants';
import { makeHdImage, makeHdSheet } from '../hdTexture';
import { INK, LINE, mix, type Paint, shadeOf } from '../paint';
import { CIRCUS_ART } from './keys';

/**
 * Chapter 8's world art (HD, painted in code): the night over Driftwood Bay
 * (sky, sea, the lighthouse, the town), the midway (booths, bulbs, the
 * carousel, the high striker, Cacklejack's stage), the funhouse (its
 * clown-face front, wallpaper, the barrel), the rolling course's toys, the
 * mirror maze's glass, backstage (wagons, the shooting gallery) and the big
 * top's ring. Everything is this game's own design.
 */
export { CIRCUS_ART };

/** Frames of the mirror sheet. */
export const MIRROR_FRAME = { real: 0, lie: 1, door: 2, doorLit: 3, cracked: 4 } as const;

const NIGHT = { top: 0x0e0a26, mid: 0x2a1850, low: 0x5a2a5a, horizon: 0x8a4a5a } as const;
const STRIPE = { red: 0xd8324a, cream: 0xf4e8d0, purple: 0x6a2a8a, green: 0x7ad83a, gold: 0xf2c24a, teal: 0x3ac8c0 } as const;

function sky(p: Paint, w: number, h: number): void {
  p.fill(p.rrect(0, 0, w, h, 0), { linear: [0, 0, 0, h], stops: [[0, NIGHT.top], [0.55, NIGHT.mid], [0.85, NIGHT.low], [1, NIGHT.horizon]] });
  // Stars (fixed scatter) and a fat moon behind thin cloud.
  for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * w;
    const y = (Math.sin(i * 37.3 + 1) * 0.5 + 0.5) * h * 0.6;
    p.fill(p.circle(x, y, 0.3 + (i % 3) * 0.25), 0xffffff, 0.35 + (i % 4) * 0.15);
  }
  const mx = w * 0.64;
  const my = h * 0.3;
  p.glow(mx, my, 46, 0xf0e8ff, 0.25);
  p.fill(p.circle(mx, my, 16), { radial: [mx - 5, my - 5, 1, mx, my, 16], stops: [[0, 0xffffff], [1, 0xd8d0f0]] });
  for (const [cx, cy, r] of [[mx - 6, my, 4], [mx + 3, my - 6, 2.6], [mx + 5, my + 5, 3]] as const) p.fill(p.circle(cx, cy, r), 0xc0b8e0, 0.6);
  for (const [cx, cy, rx] of [[mx - 12, my + 6, 40], [w * 0.3, h * 0.18, 60], [w * 0.5, h * 0.4, 70]] as const) p.fill(p.ellipse(cx, cy, rx, 4), 0x6a4a8a, 0.35);
}

function sea(p: Paint, w: number, h: number): void {
  p.fill(p.rrect(0, 0, w, h, 0), { linear: [0, 0, 0, h], stops: [[0, 0x3a2a5a], [0.25, 0x1a1a3a], [1, 0x0a0a1a]] });
  for (let i = 0; i < 18; i++) {
    const y = 4 + i * (h / 18);
    p.line([0, y, w, y + 1], 0.5, 0x8a7ab8, false, 0.18 - i * 0.008);
  }
  // The moon's road on the water.
  for (let i = 0; i < 10; i++) p.fill(p.rrect(w * 0.76 - 8 + (i % 3) * 3, 3 + i * 3.2, 16 - i, 0.8, 0.4), 0xf0e8ff, 0.4 - i * 0.03);
  // The lighthouse on its point, left.
  const L = 150;
  p.fill(p.poly([L + 20, 2, L + 70, 2, L + 90, 10, L, 10]), 0x140e24);
  const tower = p.poly([L + 38, 2, L + 52, 2, L + 49, -38, L + 41, -38]);
  p.shape(tower, { fill: 0xe8e0e8, ink: LINE });
  p.within(tower, () => {
    for (const y of [-30, -18, -6]) p.fill(p.rrect(L + 30, y, 30, 5, 0), STRIPE.red);
  });
  p.fill(p.rrect(L + 39, -46, 12, 8, 1), 0x2a2238);
  p.glow(L + 45, -42, 12, 0xfff2b0, 0.8);
  p.fill(p.poly([L + 37, -46, L + 45, -54, L + 53, -46]), 0x2a2238);
}

/** The lighthouse's beam: a long soft wedge (added and swung by the backdrop). */
function beam(p: Paint): void {
  p.fill(p.poly([0, 0, 260, -22, 260, 22]), { linear: [0, 0, 260, 0], stops: [[0, 0xfff2c0, 0.55], [1, 0xfff2c0, 0]] });
}

function town(p: Paint, w: number, h: number): void {
  // Rooftops and a pier's lamps along the bay: flat silhouettes with lit windows.
  let x = 0;
  let i = 0;
  while (x < w) {
    const bw = 14 + ((i * 7) % 11);
    const bh = 18 + ((i * 13) % 26);
    const roof = i % 3 === 0 ? p.poly([x, h, x, h - bh, x + bw / 2, h - bh - 8, x + bw, h - bh, x + bw, h]) : p.rrect(x, h - bh, bw, bh, 0);
    p.fill(roof, mix(0x1a1230, 0x2a1a40, (i % 4) / 4));
    for (let wy = h - bh + 5; wy < h - 4; wy += 6) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 5) if ((wx * 7 + wy * 3 + i) % 5 < 2) p.fill(p.rrect(wx, wy, 2, 2.4, 0.3), 0xffd88a, 0.7);
    }
    x += bw + 2;
    i++;
  }
}

function tentFar(p: Paint): void {
  // The big top far off down the pier: a striped cone with a pennant.
  const tent = p.poly([0, 60, 10, 30, 50, 6, 90, 30, 100, 60]);
  p.shape(tent, { fill: STRIPE.cream, ink: LINE });
  p.within(tent, () => {
    for (let i = 0; i < 8; i++) p.fill(p.poly([50, 6, 6 + i * 12, 60, 12 + i * 12, 60]), STRIPE.red);
  });
  p.line([50, 6, 50, -6], 0.8, INK);
  p.fill(p.poly([50, -6, 60, -3, 50, 0]), STRIPE.green);
  p.glow(50, 40, 30, 0xffb070, 0.2);
}

function fog(p: Paint, w: number, h: number): void {
  for (let i = 0; i < 9; i++) p.fill(p.ellipse((i + 0.5) * (w / 9), h * 0.55 + Math.sin(i * 2.1) * 4, w / 8, h * 0.35), 0xc8b8e8, 0.11);
}

/** A sagging string of coloured bulbs (frames: two light patterns). */
function bulbs(p: Paint, frame: number): void {
  const w = 96;
  const pts: number[] = [];
  for (let i = 0; i <= 12; i++) pts.push((i / 12) * w, 2 + Math.sin((i / 12) * Math.PI) * 8);
  p.line(pts, 0.5, INK, true);
  const colors = [STRIPE.red, STRIPE.gold, STRIPE.green, STRIPE.teal, 0xff7ad8];
  for (let i = 1; i < 12; i++) {
    const x = (i / 12) * w;
    const y = 3.4 + Math.sin((i / 12) * Math.PI) * 8;
    const on = (i + frame) % 2 === 0;
    const c = colors[i % colors.length];
    if (on) p.glow(x, y, 4, c, 0.45);
    p.fill(p.circle(x, y, 1.2), on ? mix(c, 0xffffff, 0.35) : shadeOf(c, 0.45));
  }
}

/** A midway booth: a counter, a striped awning, a game behind (frames: ring toss, duck pond, star shoot). */
function booth(p: Paint, frame: number): void {
  const colors = [[STRIPE.red, STRIPE.cream], [STRIPE.purple, STRIPE.gold], [STRIPE.teal, STRIPE.cream]][frame % 3];
  // Back wall and posts.
  p.shape(p.rrect(-36, -44, 72, 44, 1), { fill: { linear: [0, -44, 0, 0], stops: [[0, 0x3a2040], [1, 0x1e1022]] }, ink: LINE });
  for (const x of [-36, 32]) p.shape(p.rrect(x, -50, 4, 50, 0.6), { fill: 0x8a5a3a, ink: LINE });
  // The prizes or the game.
  if (frame % 3 === 0) {
    for (let i = 0; i < 5; i++) {
      p.shape(p.rrect(-26 + i * 11, -24, 4, 8, 0.4), { fill: 0x5ae8a0, ink: LINE * 0.6 });
      p.stroke(p.ellipse(-24 + i * 11, -30, 4, 1.4), STRIPE.gold, 0.7);
    }
  } else if (frame % 3 === 1) {
    p.fill(p.rrect(-30, -18, 60, 6, 1), 0x2a6ab8);
    for (let i = 0; i < 5; i++) {
      p.shape(p.ellipse(-24 + i * 12, -19, 3.4, 2.4), { fill: 0xffd84a, ink: LINE * 0.6 });
      p.fill(p.circle(-22 + i * 12, -21.6, 1.6), 0xffd84a);
      p.fill(p.poly([-20 + i * 12, -21.6, -18.4 + i * 12, -21, -20 + i * 12, -20.6]), 0xff8a2a);
    }
  } else {
    for (let i = 0; i < 4; i++) p.fill(p.star(-22 + i * 15, -26 + (i % 2) * 6, 4.4, 1.8, 5), STRIPE.gold);
  }
  // Stuffed prizes hanging over the counter.
  for (let i = 0; i < 4; i++) p.shape(p.circle(-24 + i * 16, -38, 3.2), { fill: [0xff8ad8, 0x8ad8ff, 0xffe08a, 0xa0ff8a][i], ink: LINE * 0.6 });
  // Counter.
  p.shape(p.rrect(-38, -12, 76, 12, 1), { fill: { linear: [0, -12, 0, 0], stops: [[0, colors[1]], [1, shadeOf(colors[1], 0.3)]] }, ink: LINE });
  p.fill(p.rrect(-38, -12, 76, 2.4, 0), colors[0]);
  // Awning: scalloped stripes.
  const aw = p.poly([-42, -58, 42, -58, 42, -48, -42, -48]);
  p.shape(aw, { fill: colors[1], ink: LINE });
  p.within(aw, () => {
    for (let i = 0; i < 9; i++) p.fill(p.rrect(-42 + i * 10, -58, 5, 10, 0), colors[0]);
  });
  for (let i = 0; i < 9; i++) p.shape(p.ellipse(-37 + i * 10, -48, 5, 2.6), { fill: i % 2 ? colors[1] : colors[0], ink: LINE * 0.7 });
}

/** The carousel: a striped canopy on gilded poles, painted horses, a round deck (it stands on the deck tiles). */
function carousel(p: Paint): void {
  // Canopy (its top is the roof platform, about 8 tiles above the deck).
  const canopyY = -7.4 * TILE;
  for (let i = -3; i <= 3; i++) {
    const x = i * 14;
    p.shape(p.rrect(x - 1.2, canopyY + 6, 2.4, -canopyY - 6, 0.8), { fill: { linear: [x - 1.2, 0, x + 1.2, 0], stops: [[0, 0xfff0a0], [1, 0xc8941a]] }, ink: LINE * 0.6 });
  }
  // Horses at different heights.
  for (let i = -2; i <= 2; i++) {
    const x = i * 17 + 4;
    const y = -22 - (i % 2 ? 6 : 0);
    const body = p.smooth([x - 7, y, x - 5, y - 5, x + 5, y - 5, x + 7, y - 1, x + 5, y + 2, x - 5, y + 2]);
    p.shape(body, { fill: [0xf4e8d0, 0xd8a0e8, 0xa8e0ff, 0xffd0a0, 0xf4e8d0][i + 2], ink: LINE * 0.7 });
    p.shape(p.smooth([x + 4, y - 4, x + 7, y - 12, x + 11, y - 11, x + 9, y - 6]), { fill: [0xf4e8d0, 0xd8a0e8, 0xa8e0ff, 0xffd0a0, 0xf4e8d0][i + 2], ink: LINE * 0.7 });
    p.line([x - 4, y + 2, x - 6, y + 8], 1.1, INK).line([x + 4, y + 2, x + 6, y + 8], 1.1, INK);
    p.fill(p.rrect(x - 3, y - 6, 6, 2.4, 0.6), STRIPE.red);
  }
  const canopy = p.poly([-62, canopyY + 8, 0, canopyY - 14, 62, canopyY + 8]);
  p.shape(canopy, { fill: STRIPE.cream, ink: LINE });
  p.within(canopy, () => {
    for (let i = 0; i < 12; i++) p.fill(p.poly([0, canopyY - 14, -62 + i * 11, canopyY + 8, -56 + i * 11, canopyY + 8]), STRIPE.red);
  });
  p.shape(p.rrect(-64, canopyY + 6, 128, 7, 1), { fill: STRIPE.gold, ink: LINE });
  for (let i = 0; i < 16; i++) {
    p.glow(-60 + i * 8, canopyY + 9.5, 3, 0xfff0a0, 0.5);
    p.fill(p.circle(-60 + i * 8, canopyY + 9.5, 1), 0xfffbe0);
  }
  p.fill(p.star(0, canopyY - 18, 5, 2.2, 5), STRIPE.gold);
}

/** The high striker: a tall pole with its scale, the bell on top, the pad at its foot. Origin at the foot. */
function striker(p: Paint): void {
  const top = -12 * TILE;
  p.shape(p.rrect(-3, top, 6, -top - 4, 1), { fill: { linear: [-3, 0, 3, 0], stops: [[0, 0xf4e8d0], [1, 0xc8b898]] }, ink: LINE });
  for (let i = 0; i < 10; i++) {
    const y = -12 - i * ((-top - 24) / 10);
    p.fill(p.rrect(-2.4, y - 2, 4.8, 3, 0.4), mix(0x4ad83a, STRIPE.red, i / 9));
  }
  p.shape(p.circle(0, top - 4, 6), { fill: { radial: [-2, top - 6, 0.5, 0, top - 4, 6], stops: [[0, 0xfff4b0], [1, 0xc8941a]] }, ink: LINE });
  p.fill(p.rrect(-14, -6, 28, 6, 1), 0x6a3a2a);
  p.shape(p.rrect(-8, -9, 16, 4, 1), { fill: STRIPE.red, ink: LINE });
  p.fill(p.rrect(-20, -60, 10, 40, 1), 0x2a1a30, 0.6);
}

function puck(p: Paint): void {
  p.shape(p.rrect(-3, -2.6, 6, 5.2, 1.4), { fill: STRIPE.gold, ink: LINE * 0.8 });
}

/** Cacklejack's stage: a back curtain, a marquee of bulbs over it (it stands on the stage tiles). */
function stage(p: Paint): void {
  const w = 11 * TILE;
  const curtain = p.rrect(-w / 2, -96, w, 96, 2);
  p.shape(curtain, { fill: { linear: [0, -96, 0, 0], stops: [[0, 0x6a1a2a], [1, 0x3a0a18]] }, ink: LINE });
  p.within(curtain, () => {
    for (let x = -w / 2 + 6; x < w / 2; x += 9) p.line([x, -96, x + 2, 0], 1.6, 0x2a0610, false, 0.6);
  });
  p.shape(p.rrect(-w / 2 - 4, -108, w + 8, 14, 2), { fill: 0x2a1a3a, ink: LINE });
  for (let i = 0; i < 22; i++) {
    const x = -w / 2 + 2 + i * (w / 21);
    p.glow(x, -101, 3, 0xfff0a0, 0.45);
    p.fill(p.circle(x, -101, 1), 0xfffbe0);
  }
  // A grinning mask over the marquee.
  p.shape(p.ellipse(0, -114, 14, 10), { fill: 0xf4f0f8, ink: LINE });
  p.line([-8, -112, 0, -107, 8, -112], LINE, INK, true);
  p.fill(p.poly([-7, -118, -3, -120, -4, -116]), 0x9a3aff).fill(p.poly([7, -118, 3, -120, 4, -116]), 0x9a3aff);
}

function lamp(p: Paint): void {
  p.shape(p.rrect(-1.2, -44, 2.4, 44, 0.6), { fill: 0x2a2238, ink: LINE * 0.6 });
  p.glow(0, -46, 14, 0xffd88a, 0.5);
  p.shape(p.circle(0, -46, 3), { fill: 0xfff2c8, ink: LINE * 0.7 });
}

function bench(p: Paint): void {
  p.shape(p.rrect(-12, -8, 24, 2.4, 0.6), { fill: 0x8a5a3a, ink: LINE * 0.7 });
  p.shape(p.rrect(-12, -14, 24, 2.4, 0.6), { fill: 0x8a5a3a, ink: LINE * 0.7 });
  for (const x of [-10, 9]) p.fill(p.rrect(x, -8, 1.6, 8, 0.4), 0x2a2238);
}

/** A townsperson the circus drained: grey all over, slumped (frames: sitting, standing, slumped). */
function folk(p: Paint, frame: number): void {
  const grey = [0x9a96a8, 0x8a8698, 0xa8a4b4][frame % 3];
  const dark = shadeOf(grey, 0.3);
  const sit = frame === 0;
  const h = sit ? 16 : 22;
  p.shape(p.rrect(-4, -h, 8, h - (sit ? 4 : 8), 3), { fill: grey, ink: LINE * 0.8 });
  p.shape(p.circle(frame === 2 ? 2 : 0, -h - 3.4 + (frame === 2 ? 2 : 0), 3.6), { fill: mix(grey, 0xffffff, 0.15), ink: LINE * 0.8 });
  if (sit) p.fill(p.rrect(-4, -6, 10, 3, 1), dark);
  else for (const x of [-3, 1]) p.fill(p.rrect(x, -8, 2.4, 8, 0.6), dark);
  // Blank, staring eyes.
  p.fill(p.circle(frame === 2 ? 3 : 1.4, -h - 3.6 + (frame === 2 ? 2 : 0), 0.6), 0xffffff, 0.9);
}

/** The pier gate: an arch of bulbs with the circus's name in shapes (no font in the art). Origin at its foot. */
function gate(p: Paint): void {
  for (const x of [-34, 30]) p.shape(p.rrect(x, -72, 4, 72, 0.8), { fill: 0x3a2a4a, ink: LINE });
  const arch = p.poly([-38, -72, -30, -92, 0, -102, 30, -92, 38, -72, 30, -80, 0, -90, -30, -80]);
  p.shape(arch, { fill: STRIPE.purple, ink: LINE });
  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const x = -34 + t * 68;
    const y = -79 - Math.sin(t * Math.PI) * 15;
    p.glow(x, y, 3, STRIPE.gold, 0.5);
    p.fill(p.circle(x, y, 1), 0xfffbe0);
  }
  p.shape(p.ellipse(0, -100, 9, 7), { fill: 0xf4f0f8, ink: LINE });
  p.line([-5, -99, 0, -95, 5, -99], LINE * 0.8, INK, true);
}

/** The funhouse front: a giant clown face, its open mouth the door (the door is 2 tiles wide, 4 tall, at its foot). */
function facade(p: Paint): void {
  const w = 120;
  const face = p.smooth([-w / 2, 0, -w / 2 + 6, -110, -30, -160, 30, -160, w / 2 - 6, -110, w / 2, 0]);
  p.shape(face, { fill: { linear: [0, -160, 0, 0], stops: [[0, 0xf8f2fa], [1, 0xc8c0d8]] }, ink: LINE * 1.4, shade: 0x9a90b0, shadeDepth: 4 });
  // Hair tufts and a crooked little hat.
  for (const s of [-1, 1]) p.shape(p.smooth([s * 44, -120, s * 70, -140, s * 74, -110, s * 66, -96]), { fill: STRIPE.green, ink: LINE });
  p.shape(p.poly([-18, -158, 14, -172, 24, -150]), { fill: STRIPE.purple, ink: LINE });
  // Diamond eyes with tiny pupils.
  for (const s of [-1, 1]) {
    p.shape(p.poly([s * 24, -128, s * 34, -112, s * 24, -98, s * 14, -112]), { fill: 0x9a3aff, ink: LINE });
    p.fill(p.ellipse(s * 24, -112, 4, 6), 0xffffff);
    p.fill(p.circle(s * 24 + 1, -112, 1.6), INK);
  }
  p.shape(p.circle(0, -90, 8), { fill: STRIPE.red, ink: LINE, gloss: { x: -2.6, y: -93, rx: 2.4, ry: 1.6 } });
  // The grin, with the door (black) in the middle of it.
  const grin = p.smooth([-46, -64, -24, -36, 0, -30, 24, -36, 46, -64, 24, -50, 0, -46, -24, -50]);
  p.shape(grin, { fill: STRIPE.red, ink: LINE });
  p.fill(p.rrect(-16, -64, 32, 64, 6), 0x0a0610);
  p.stroke(p.rrect(-16, -64, 32, 64, 6), INK, LINE * 1.2);
  for (let i = 0; i < 4; i++) p.fill(p.rrect(-14 + i * 7.6, -64, 5, 6, 1), 0xfffbea);
}

/** Funhouse wallpaper panels (4 tiles square): stripes, a diamond pattern, a framed poster, a warped mirror. */
function wall(p: Paint, frame: number): void {
  const s = 4 * TILE;
  p.fill(p.rrect(0, 0, s, s, 0), frame === 1 ? 0x2a1640 : 0x341a4a);
  if (frame === 0) for (let x = 0; x < s; x += 8) p.fill(p.rrect(x, 0, 4, s, 0), 0x40205a, 0.8);
  if (frame === 1) {
    for (let y = 0; y < s; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < s; x += 16) p.fill(p.poly([x + 8, y, x + 16, y + 8, x + 8, y + 16, x, y + 8]), 0x48245e, 0.9);
  }
  if (frame === 2) {
    p.shape(p.rrect(14, 10, 36, 44, 2), { fill: 0xe8d8b8, ink: LINE });
    p.fill(p.circle(32, 26, 9), 0xf4f0f8);
    p.line([26, 28, 32, 32, 38, 28], LINE, INK, true);
    p.fill(p.rrect(18, 42, 28, 6, 1), STRIPE.red);
  }
  if (frame === 3) {
    const glass = p.ellipse(32, 32, 16, 24);
    p.shape(glass, { fill: { linear: [16, 8, 48, 56], stops: [[0, 0xc8d8ff], [0.5, 0x7a8ab8], [1, 0xb8c8f0]] }, ink: LINE * 1.2 });
    p.stroke(glass, STRIPE.gold, 1.2);
  }
  p.fill(p.rrect(0, s - 6, s, 6, 0), 0x1a0c28, 0.6);
}

/** The spinning barrel's drum seen end-on across the room: a wide band of stripes (frames scroll the stripes). */
function barrel(p: Paint, frame: number): void {
  const w = 15 * TILE;
  const h = 9 * TILE;
  p.fill(p.rrect(0, 0, w, h, 6), 0x1a0e28);
  const band = p.rrect(2, 2, w - 4, h - 4, 6);
  p.within(band, () => {
    for (let x = -32 + (frame % 4) * 8; x < w + 32; x += 32) p.fill(p.poly([x, 0, x + 16, 0, x + 16 - 40, h, x - 40, h]), frame % 2 ? STRIPE.purple : 0x5a2a7a, 0.85);
  });
  p.stroke(band, STRIPE.gold, 1.4);
  for (let i = 0; i < 12; i++) p.fill(p.circle(8 + i * ((w - 16) / 11), 4, 1.2), STRIPE.gold);
}

/** A spiked wall closing in (one tile wide, the barrel's height): points facing right. */
function spikes(p: Paint): void {
  const h = 8 * TILE;
  p.shape(p.rrect(0, 0, 6, h, 1), { fill: 0x5a4a6a, ink: LINE });
  for (let y = 4; y < h; y += 8) p.shape(p.poly([6, y - 3, 13, y, 6, y + 3]), { fill: 0xd8d0e0, ink: LINE * 0.7 });
}

/** A trampoline pad, two tiles wide (frames: at rest, squashed). Origin at its foot. */
function pad(p: Paint, frame: number): void {
  const sq = frame === 1 ? 2 : 0;
  for (const x of [-12, 10]) p.fill(p.rrect(x, -6, 2.4, 6, 0.4), 0x2a2238);
  p.shape(p.ellipse(0, -6 + sq, 15, 3.4 - sq * 0.8), { fill: { linear: [0, -9, 0, -3], stops: [[0, 0x6af0ff], [1, 0x2a8ab8]] }, ink: LINE });
  p.shape(p.rrect(-16, -5, 32, 3, 1.2), { fill: STRIPE.red, ink: LINE * 0.8 });
  for (let i = 0; i < 5; i++) p.fill(p.circle(-12 + i * 6, -3.5, 0.6), 0xffffff, 0.8);
}

/** A pinball bumper (frames: idle, lit when struck). Origin at its centre. */
function bumper(p: Paint, frame: number): void {
  const lit = frame === 1;
  if (lit) p.glow(0, 0, 18, 0xff5ac8, 0.7);
  p.shape(p.circle(0, 0, 9), { fill: { radial: [-3, -3, 1, 0, 0, 9], stops: [[0, lit ? 0xffd0f0 : 0xff8ad8], [1, lit ? 0xff3aa8 : 0xa81a6a]] }, ink: LINE * 1.1 });
  p.shape(p.circle(0, 0, 5), { fill: lit ? 0xffffff : 0xffe08a, ink: LINE * 0.8 });
  p.fill(p.star(0, 0, 3.4, 1.4, 5), lit ? STRIPE.gold : 0xffb02a);
}

/** A kicker ramp facing right, one tile high (frames: idle, firing). Origin at its foot, left edge. */
function kicker(p: Paint, frame: number): void {
  const ramp = p.poly([0, 0, 18, 0, 18, -14, 12, -12]);
  p.shape(ramp, { fill: { linear: [0, 0, 18, -14], stops: [[0, 0x3a2a5a], [1, 0x8a4ab8]] }, ink: LINE });
  p.line([1, -1, 17, -13], 1.2, frame ? 0xfff2a0 : STRIPE.gold);
  for (const t of [0.3, 0.6, 0.9]) p.fill(p.poly([t * 16, -t * 12.5 - 1, t * 16 + 3, -t * 12.5 - 3, t * 16 + 1.4, -t * 12.5 + 0.4]), 0xffffff, frame ? 0.9 : 0.4);
}

/** The loop-de-loop's track: a thick ring with a gap at its foot (it's centred on the loop). */
function loop(p: Paint, r: number): void {
  const R = r * TILE + 11;
  p.stroke(p.circle(0, 0, R + 2), INK, 4.6);
  p.stroke(p.circle(0, 0, R + 2), 0xd8324a, 3);
  p.stroke(p.circle(0, 0, R + 2), 0xff8aa0, 0.8);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    p.fill(p.circle(Math.cos(a) * (R + 2), Math.sin(a) * (R + 2), 0.8), 0xfff2c0, 0.9);
  }
  // Struts down to the floor either side of the foot.
  p.line([-R * 0.7, R * 0.7, -R * 0.8, R + 12], 1.8, 0x5a4a6a).line([R * 0.7, R * 0.7, R * 0.8, R + 12], 1.8, 0x5a4a6a);
}

/** An angled mirror in a gilt frame (frames: facing up-right, flashing). One tile, centred. */
function deflector(p: Paint, frame: number): void {
  const glass = p.poly([-8, 6, 6, -8, 8, -6, -6, 8]);
  if (frame) p.glow(0, 0, 14, 0xd8f0ff, 0.8);
  p.shape(glass, { fill: { linear: [-8, 8, 8, -8], stops: [[0, 0x8aa8e8], [0.5, 0xf0f8ff], [1, 0x9ab8f0]] }, ink: LINE });
  p.stroke(glass, STRIPE.gold, 0.9);
  p.shape(p.rrect(-8, -8, 16, 16, 2), { fill: 0x000000, alpha: 0, ink: LINE * 0.5 });
}

/** A break-away wall (one tile by three): striped boards with a cartoon crack (the HD twin of the cracked wall). */
function breakaway(p: Paint): void {
  const w = TILE;
  const h = 3 * TILE;
  p.shape(p.rrect(0, 0, w, h, 1), { fill: STRIPE.cream, ink: LINE });
  p.within(p.rrect(0, 0, w, h, 1), () => {
    for (let y = -8; y < h; y += 10) p.fill(p.poly([0, y, w, y + 6, w, y + 11, 0, y + 5]), STRIPE.red);
  });
  p.line([3, 10, 8, 16, 5, 22, 11, 30, 8, 38], LINE * 1.1, INK);
  p.fill(p.star(8, 24, 5, 2, 4), 0xffffff, 0.5);
}

/** A mirror panel, one tile by `h` (frames: real glass, a lying one (a faint seam), a door unlit, a door lit pink, cracked). */
function mirror(p: Paint, frame: number, h: number): void {
  const H = h * TILE;
  const glass = p.rrect(1.2, 0.6, TILE - 2.4, H - 1.2, 2);
  const lit = frame === MIRROR_FRAME.doorLit;
  if (lit) p.glow(TILE / 2, H / 2, H * 0.6, 0xff7ad8, 0.55);
  p.shape(glass, { fill: { linear: [0, 0, TILE, H], stops: [[0, lit ? 0xffc8f0 : 0xb8c8f0], [0.45, lit ? 0xfff0fa : 0xe8f0ff], [1, lit ? 0xd88ae8 : 0x8a9ad0]] }, ink: LINE * 1.1 });
  p.within(glass, () => {
    for (let y = -10; y < H; y += 14) p.line([0, y + 10, TILE, y], 0.9, 0xffffff, false, 0.45);
    if (frame === MIRROR_FRAME.lie) p.line([TILE / 2, 2, TILE / 2 + 1, H - 2], 0.4, 0x4a5a8a, false, 0.35);
    if (frame === MIRROR_FRAME.cracked) p.line([3, H * 0.2, 9, H * 0.45, 5, H * 0.6, 12, H * 0.8], LINE, INK);
  });
  p.stroke(glass, lit ? 0xff5ac8 : STRIPE.gold, 1);
  p.fill(p.rrect(0, 0, TILE, 2, 0.6), STRIPE.gold);
  p.fill(p.rrect(0, H - 2, TILE, 2, 0.6), STRIPE.gold);
}

/** The heart of the maze: a tall oval mirror in an ornate frame (Gwen is shown inside it by the story). Origin at its foot. */
function heart(p: Paint): void {
  const glass = p.ellipse(0, -40, 18, 38);
  p.glow(0, -40, 46, 0xff7ad8, 0.4);
  p.shape(p.ellipse(0, -40, 22, 42), { fill: { linear: [-22, -82, 22, 2], stops: [[0, 0xffe08a], [1, 0xb8841a]] }, ink: LINE * 1.2 });
  p.shape(glass, { fill: { linear: [-18, -78, 18, -2], stops: [[0, 0xffc8f0], [0.5, 0xfff0fa], [1, 0xd88ae8]] }, ink: LINE });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    p.fill(p.circle(Math.cos(a) * 20, -40 + Math.sin(a) * 40, 1.4), 0xfff2c0);
  }
  p.fill(p.poly([-10, -84, 0, -96, 10, -84]), STRIPE.gold);
}

/** A circus wagon (frames: the cage wagon, a prop wagon). Its top is a ledge. Origin at its foot, centred; 7 tiles wide, 3 high. */
function wagon(p: Paint, frame: number): void {
  const w = 7 * TILE;
  const h = 3 * TILE;
  const body = p.rrect(-w / 2, -h, w, h - 8, 2);
  p.shape(body, { fill: frame ? STRIPE.red : 0x2a6a8a, ink: LINE, shade: frame ? 0x8a1a2a : 0x1a3a5a, shadeDepth: 2 });
  if (!frame) {
    p.fill(p.rrect(-w / 2 + 8, -h + 6, w - 16, h - 20, 1), 0x0a0a14);
    for (let x = -w / 2 + 12; x < w / 2 - 8; x += 7) p.line([x, -h + 6, x, -14], 1.2, 0xc8c0d0);
  } else {
    p.fill(p.star(0, -h / 2 - 4, 10, 4, 5), STRIPE.gold);
  }
  p.fill(p.rrect(-w / 2, -h, w, 3, 0), STRIPE.gold);
  for (const x of [-w / 2 + 14, w / 2 - 14]) {
    p.shape(p.circle(x, -6, 7), { fill: STRIPE.gold, ink: LINE });
    for (let i = 0; i < 6; i++) p.line([x, -6, x + Math.cos(i) * 6, -6 + Math.sin(i) * 6], 0.6, 0x6a4a1a);
  }
}

/** The shooting gallery: a booth front with tin targets over the prize shelf (its shutter is the door). Origin at its foot, left edge. */
function gallery(p: Paint): void {
  const w = 8 * TILE;
  p.shape(p.rrect(0, -5 * TILE, w, TILE, 1), { fill: STRIPE.purple, ink: LINE });
  for (let i = 0; i < 6; i++) p.shape(p.circle(10 + i * 19, -4.5 * TILE, 4), { fill: i % 2 ? 0xffe08a : 0xc8d0e0, ink: LINE * 0.7 });
  p.fill(p.rrect(2 * TILE - 2, -4 * TILE, 6 * TILE, 4 * TILE, 0), 0x1a1022, 0.85);
}

/** The prize shelf's shutter (the HD twin of the security shutter): corrugated tin with a padlock. */
function shutter(p: Paint): void {
  const h = 4 * TILE;
  p.shape(p.rrect(0, 0, TILE, h, 1), { fill: { linear: [0, 0, TILE, 0], stops: [[0, 0x8a8aa0], [1, 0x5a5a70]] }, ink: LINE });
  for (let y = 3; y < h; y += 4) p.line([0, y, TILE, y], 0.6, 0x3a3a4a);
  p.shape(p.rrect(4, h / 2 - 3, 8, 6, 1), { fill: STRIPE.gold, ink: LINE * 0.8 });
}

/** The big top's canvas inside (4 tiles square): red and cream panels, a dark band at the top. */
function canvas(p: Paint, frame: number): void {
  const s = 4 * TILE;
  p.fill(p.rrect(0, 0, s, s, 0), frame ? 0xb82a42 : 0xe8dcc4);
  p.fill(p.rrect(0, 0, s, s, 0), { linear: [0, 0, 0, s], stops: [[0, 0x000000, 0.25], [1, 0x000000, 0]] });
  p.line([0, 0, 0, s], 0.8, 0x4a1a2a, false, 0.5);
}

/** The ring's curb (a long low wall, 40 tiles), drawn as one image. Origin at its foot, left edge. */
function ring(p: Paint): void {
  const w = 40 * TILE;
  p.shape(p.rrect(0, -6, w, 6, 2), { fill: STRIPE.red, ink: LINE });
  for (let x = 4; x < w; x += 12) p.fill(p.star(x, -3, 2.2, 0.9, 5), STRIPE.gold);
}

/** Empty stands round the ring (a band of grey benches with drained folk). 4 tiles wide. */
function stands(p: Paint): void {
  const s = 4 * TILE;
  for (let r = 0; r < 4; r++) p.fill(p.rrect(0, r * 10, s, 8, 1), mix(0x3a2a4a, 0x5a4a6a, r / 3));
  for (let i = 0; i < 5; i++) p.fill(p.circle(6 + i * 12, 4 + (i % 2) * 10, 3), 0x8a8698, 0.8);
}

function pole(p: Paint): void {
  p.shape(p.rrect(-3, -32 * TILE, 6, 32 * TILE, 2), { fill: { linear: [-3, 0, 3, 0], stops: [[0, 0xf4e8d0], [1, 0xa8988a]] }, ink: LINE });
  for (let y = -32 * TILE + 10; y < 0; y += 24) p.fill(p.rrect(-3, y, 6, 6, 0), STRIPE.red);
}

function trapeze(p: Paint): void {
  p.line([-8, -40, -8, 0], 0.7, 0xd8c8a8).line([8, -40, 8, 0], 0.7, 0xd8c8a8);
  p.shape(p.rrect(-10, -1.4, 20, 2.8, 1.2), { fill: STRIPE.gold, ink: LINE * 0.7 });
}

function net(p: Paint): void {
  const w = 24 * TILE;
  const n = p.smooth([0, 0, w / 2, 14, w, 0], false);
  p.line([0, 0, w / 2, 14, w, 0], 1.4, 0xd8c8a8, true);
  for (let x = 8; x < w; x += 10) p.line([x, 0, x, 14 * Math.sin((x / w) * Math.PI)], 0.4, 0xd8c8a8, false, 0.6);
  void n;
}

/** Max's cage, hanging over the ring. Origin at its bottom centre. */
function cage(p: Paint): void {
  p.line([0, -60, 0, -36], 0.9, 0xc8c0d0);
  p.shape(p.rrect(-14, -36, 28, 36, 3), { fill: 0x000000, alpha: 0.18, ink: LINE });
  for (let x = -12; x <= 12; x += 4) p.line([x, -34, x, -1], 1.1, 0xb8b0c8);
  p.fill(p.rrect(-16, -38, 32, 4, 1), STRIPE.gold).fill(p.rrect(-16, -2, 32, 3, 1), STRIPE.gold);
}

function confetti(p: Paint, frame: number): void {
  p.fill(p.rrect(-1.2, -0.6, 2.4, 1.2, 0.3), [STRIPE.red, STRIPE.gold, STRIPE.green, STRIPE.teal, 0xff7ad8][frame % 5]);
}

/** A cream pie in a tin (thrown by grinners and Cacklejack). */
function pie(p: Paint): void {
  p.shape(p.ellipse(0, 1.4, 5.6, 2.2), { fill: 0xb88a4a, ink: LINE * 0.7 });
  p.shape(p.smooth([-5, 0.6, -3.4, -3, 0, -4.2, 3.4, -3, 5, 0.6]), { fill: 0xfff8ee, ink: LINE * 0.7 });
  p.fill(p.circle(0, -4.4, 1.2), STRIPE.red);
}

/** Fear gas: a sickly green puff with a ghost of a face in it (frames: two puffs). */
function gas(p: Paint, frame: number): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + frame;
    p.fill(p.circle(Math.cos(a) * 6, Math.sin(a) * 4, 7 - (i % 2)), 0x9aff3a, 0.22);
  }
  p.fill(p.circle(0, 0, 8), 0xc8ff8a, 0.18);
  p.fill(p.circle(-2.4, -1.4, 1.2), 0x1a2a0a, 0.5).fill(p.circle(2.4, -1.4, 1.2), 0x1a2a0a, 0.5);
  p.line([-2.6, 2.4, 0, 3.6, 2.6, 2.4], 0.8, 0x1a2a0a, true, 0.5);
}

/** The jack-in-the-box's glove on its spring, punching right. Origin at the spring's root. */
function glove(p: Paint): void {
  const pts: number[] = [];
  for (let i = 0; i <= 12; i++) pts.push(i * 2.2, Math.sin(i * 1.6) * 2.6);
  p.line(pts, 1, 0xc8c0d0, true);
  p.shape(p.smooth([26, -5, 34, -6, 37, 0, 34, 6, 26, 5]), { fill: STRIPE.red, ink: LINE, gloss: { x: 31, y: -2.6, rx: 3, ry: 1.4 } });
  p.fill(p.rrect(23, -4, 4, 8, 1), 0xf4f0f8);
}

function kettlebell(p: Paint): void {
  p.stroke(p.ellipse(0, -6, 3.6, 3), INK, 1.8);
  p.stroke(p.ellipse(0, -6, 3.6, 3), 0x5a5a6a, 1);
  p.shape(p.circle(0, 0, 6), { fill: { radial: [-2, -2, 0.5, 0, 0, 6], stops: [[0, 0x8a8a9a], [1, 0x2a2a3a]] }, ink: LINE });
  p.fill(p.rrect(-3, -1, 6, 2.4, 0.6), STRIPE.red);
}

/** Paints all of Chapter 8's world art at `res` (each key once). */
export function makeCircusArt(scene: Phaser.Scene, res: number): void {
  const A = CIRCUS_ART;
  makeHdImage(scene, A.sky, 640, 360, Math.min(res, 2), (p) => sky(p, 640, 360));
  makeHdImage(scene, A.sea, 640, 96, res, (p) => sea(p, 640, 40), { x: 0, y: 56 });
  makeHdImage(scene, A.beam, 260, 44, Math.min(res, 2), beam, { x: 0, y: 22 });
  makeHdImage(scene, A.town, 600, 60, res, (p) => town(p, 600, 60));
  makeHdImage(scene, A.tentFar, 100, 72, res, tentFar, { x: 0, y: 8 });
  makeHdImage(scene, A.fog, 320, 40, Math.min(res, 2), (p) => fog(p, 320, 40));
  makeHdSheet(scene, A.bulbs, 96, 14, 2, res, bulbs);
  makeHdSheet(scene, A.booth, 86, 62, 3, res, booth, { x: 43, y: 60 });
  makeHdImage(scene, A.carousel, 136, 140, res, carousel, { x: 68, y: 136 });
  makeHdImage(scene, A.striker, 44, 210, res, striker, { x: 22, y: 206 });
  makeHdImage(scene, A.puck, 8, 7, res, puck, { x: 4, y: 3.5 });
  makeHdImage(scene, A.stage, 186, 128, res, stage, { x: 93, y: 126 });
  makeHdImage(scene, A.lamp, 30, 62, res, lamp, { x: 15, y: 60 });
  makeHdImage(scene, A.bench, 28, 16, res, bench, { x: 14, y: 15 });
  makeHdSheet(scene, A.folk, 14, 30, 3, res, folk, { x: 7, y: 29 });
  makeHdImage(scene, A.gate, 84, 108, res, gate, { x: 42, y: 106 });
  makeHdImage(scene, A.facade, 156, 178, res, facade, { x: 78, y: 176 });
  makeHdSheet(scene, A.wall, 64, 64, 4, res, wall);
  makeHdSheet(scene, A.barrel, 15 * TILE, 9 * TILE, 4, res, barrel);
  makeHdImage(scene, A.spikes, 14, 8 * TILE, res, spikes);
  makeHdSheet(scene, A.pad, 34, 12, 2, res, pad, { x: 17, y: 11 });
  makeHdSheet(scene, A.bumper, 40, 40, 2, res, bumper, { x: 20, y: 20 });
  makeHdSheet(scene, A.kicker, 20, 16, 2, res, kicker, { x: 1, y: 15 });
  makeHdImage(scene, A.loop, 4 * TILE * 2 + 40, 4 * TILE * 2 + 60, res, (p) => loop(p, 4), { x: 4 * TILE + 20, y: 4 * TILE + 20 });
  makeHdSheet(scene, A.deflector, 20, 20, 2, res, deflector, { x: 10, y: 10 });
  makeHdImage(scene, A.breakaway, TILE, 3 * TILE, res, breakaway);
  for (const h of [3, 4, 6, 7, 10]) makeHdSheet(scene, `${A.mirror}-${h}`, TILE, h * TILE, 5, res, (p, f) => mirror(p, f, h));
  makeHdImage(scene, A.heart, 50, 100, res, heart, { x: 25, y: 98 });
  makeHdSheet(scene, A.wagon, 7 * TILE + 4, 3 * TILE + 4, 2, res, wagon, { x: (7 * TILE + 4) / 2, y: 3 * TILE + 2 });
  makeHdImage(scene, A.gallery, 8 * TILE, 5 * TILE + 2, res, gallery, { x: 0, y: 5 * TILE + 1 });
  makeHdImage(scene, A.shutter, TILE, 4 * TILE, res, shutter);
  makeHdSheet(scene, A.canvas, 64, 64, 2, Math.min(res, 2), canvas);
  makeHdImage(scene, A.ring, 40 * TILE, 8, res, ring, { x: 0, y: 7 });
  makeHdImage(scene, A.stands, 64, 40, Math.min(res, 2), stands);
  makeHdImage(scene, A.pole, 10, 32 * TILE + 2, Math.min(res, 2), pole, { x: 5, y: 32 * TILE + 1 });
  makeHdImage(scene, A.trapeze, 24, 44, res, trapeze, { x: 12, y: 42 });
  makeHdImage(scene, A.net, 24 * TILE, 18, Math.min(res, 2), net, { x: 0, y: 2 });
  makeHdImage(scene, A.cage, 36, 64, res, cage, { x: 18, y: 62 });
  makeHdSheet(scene, A.confetti, 4, 3, 5, res, confetti, { x: 2, y: 1.5 });
  makeHdImage(scene, A.pie, 14, 10, res, pie, { x: 7, y: 5 });
  makeHdSheet(scene, A.gas, 30, 22, 2, Math.min(res, 2), gas, { x: 15, y: 11 });
  makeHdImage(scene, A.glove, 40, 16, res, glove, { x: 1, y: 8 });
  makeHdImage(scene, A.kettlebell, 16, 20, res, kettlebell, { x: 8, y: 12 });
}

/** The mirror sheet for a panel `h` tiles tall (the art only comes in these heights). */
export function mirrorKey(h: number): string {
  return `${CIRCUS_ART.mirror}-${h}`;
}

/** Where each placed prop's foot (or hanging point) is, as a fraction of its image (matches the paint origins above). */
export const CIRCUS_ORIGIN: Readonly<Record<string, { x: number; y: number }>> = {
  [CIRCUS_ART.lamp]: { x: 15 / 30, y: 60 / 62 },
  [CIRCUS_ART.bench]: { x: 0.5, y: 15 / 16 },
  [CIRCUS_ART.folk]: { x: 0.5, y: 29 / 30 },
  [CIRCUS_ART.gate]: { x: 0.5, y: 106 / 108 },
  [CIRCUS_ART.bulbs]: { x: 0, y: 0 },
  [CIRCUS_ART.booth]: { x: 0.5, y: 60 / 62 },
  [CIRCUS_ART.carousel]: { x: 0.5, y: 136 / 140 },
  [CIRCUS_ART.striker]: { x: 0.5, y: 206 / 210 },
  [CIRCUS_ART.stage]: { x: 0.5, y: 126 / 128 },
  [CIRCUS_ART.facade]: { x: 0.5, y: 176 / 178 },
  [CIRCUS_ART.barrel]: { x: 0, y: 0 },
  [CIRCUS_ART.wagon]: { x: 0.5, y: (3 * TILE + 2) / (3 * TILE + 4) },
  [CIRCUS_ART.gallery]: { x: 0, y: (5 * TILE + 1) / (5 * TILE + 2) },
  [CIRCUS_ART.pole]: { x: 0.5, y: (32 * TILE + 1) / (32 * TILE + 2) },
  [CIRCUS_ART.trapeze]: { x: 0.5, y: 0 },
  [CIRCUS_ART.ring]: { x: 0, y: 7 / 8 },
};
