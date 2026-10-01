import { PALETTE as P } from '../../config/palette';
import type { PixelCanvas } from '../../scenes/preload/PixelCanvas';
import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../../scenes/preload/assetTypes';

/** XLR8's textures. Add a `url` to an entry to load real art instead. */
export const XLR8_TEX = {
  sheet: 'xlr8',
  icon: 'ui-icon-xlr8',
  touchAttack: 'ui-touch-claws',
  touchSpecial: 'ui-touch-dash',
} as const;

export const XLR8_COLORS = {
  navy: 0x1d3266,
  body: 0x3462bc,
  blue: 0x52a4ff,
  light: 0xb8e6ff,
  visor: 0x0b0d17,
  glint: 0x8fb8ff,
} as const;

const C = XLR8_COLORS;

export const XLR8_FRAME = { w: 40, h: 30, feetY: 29 } as const;
export const XLR8_FRAMES = {
  idle: [0, 1, 2, 3],
  run: [4, 5, 6, 7, 8, 9],
  jump: [10],
  fall: [11],
  strikeA: [12],
  strikeB: [13],
  kick: [14],
  dash: [15],
  hurt: [16],
} as const;
const FRAME_COUNT = 17;

interface Foot {
  x: number;
  lift: number;
}

/** A raptor rig: lean pushes the head and chest forward, the tail counterbalances. */
interface RaptorPose {
  bob: number;
  lean: number;
  /** Tail tip height (negative is up). */
  tail: number;
  front: Foot;
  back: Foot;
  claw: { x: number; y: number };
  claw2: { x: number; y: number };
  /** Motion smear behind the body (0 none, 1 run, 2 dash). */
  blur: number;
}

const RUN_FOOT = [7, 4, 0, -5, -2, 4];
const RUN_LIFT = [0, 0, 0, 2, 5, 3];

function pose(frame: number): RaptorPose {
  switch (frame) {
    case 0:
    case 1:
    case 2:
    case 3:
      return {
        bob: frame === 1 || frame === 2 ? 1 : 0,
        lean: 0,
        tail: [0, -1, -2, -1][frame],
        front: { x: 3, lift: 0 },
        back: { x: -2, lift: 0 },
        claw: { x: 3, y: 4 },
        claw2: { x: 1, y: 5 },
        blur: 0,
      };
    case 10:
      return { bob: 0, lean: 1, tail: -3, front: { x: 4, lift: 5 }, back: { x: -1, lift: 3 }, claw: { x: 3, y: -2 }, claw2: { x: 1, y: -1 }, blur: 0 };
    case 11:
      return { bob: 0, lean: 0, tail: 2, front: { x: 5, lift: 1 }, back: { x: -4, lift: 2 }, claw: { x: 4, y: 1 }, claw2: { x: -2, y: 2 }, blur: 0 };
    case 12:
      return { bob: 1, lean: 2, tail: -1, front: { x: 5, lift: 0 }, back: { x: -3, lift: 0 }, claw: { x: 9, y: 0 }, claw2: { x: 0, y: 4 }, blur: 0 };
    case 13:
      return { bob: 1, lean: 2, tail: -2, front: { x: 4, lift: 0 }, back: { x: -3, lift: 0 }, claw: { x: 1, y: 3 }, claw2: { x: 9, y: 2 }, blur: 0 };
    case 14:
      return { bob: 0, lean: -1, tail: 3, front: { x: 10, lift: 9 }, back: { x: -2, lift: 0 }, claw: { x: -2, y: 1 }, claw2: { x: -3, y: 2 }, blur: 0 };
    case 15:
      return { bob: 1, lean: 5, tail: 0, front: { x: -3, lift: 3 }, back: { x: -6, lift: 2 }, claw: { x: -4, y: 3 }, claw2: { x: -5, y: 3 }, blur: 2 };
    case 16:
      return { bob: 0, lean: -2, tail: 3, front: { x: 3, lift: 1 }, back: { x: -2, lift: 0 }, claw: { x: -1, y: -4 }, claw2: { x: -3, y: -3 }, blur: 0 };
    default: {
      const i = frame - 4;
      const b = (i + 3) % 6;
      return {
        bob: i % 3 === 0 ? 1 : 0,
        lean: 3,
        tail: -4,
        front: { x: RUN_FOOT[i], lift: RUN_LIFT[i] },
        back: { x: RUN_FOOT[b], lift: RUN_LIFT[b] },
        claw: { x: -3, y: 3 },
        claw2: { x: -4, y: 2 },
        blur: 1,
      };
    }
  }
}

function drawLeg(pc: PixelCanvas, hipX: number, hipY: number, foot: Foot, color: number): void {
  const ankleX = hipX + foot.x;
  const ankleY = 26 - foot.lift;
  const kneeX = hipX + Math.round(foot.x * 0.5) + 3;
  const kneeY = hipY + 4 - Math.round(foot.lift * 0.4);
  pc.line(hipX, hipY, kneeX, kneeY, color, 3);
  pc.line(kneeX, kneeY, ankleX, ankleY, color, 2);
  // Ball feet: XLR8 rolls rather than runs.
  pc.circle(ankleX + 1, 27 - foot.lift, 2, C.visor);
  pc.px(ankleX + 1, 26 - foot.lift, C.blue);
}

function drawTail(pc: PixelCanvas, hx: number, hy: number, tip: number): void {
  const pts: Array<[number, number]> = [
    [hx - 1, hy - 1],
    [hx - 6, hy - 1 + Math.round(tip * 0.3)],
    [hx - 11, hy - 2 + Math.round(tip * 0.7)],
    [Math.max(1, hx - 15), hy - 3 + tip],
  ];
  const widths = [3, 3, 2];
  for (let i = 0; i + 1 < pts.length; i++) {
    pc.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], i % 2 === 0 ? C.navy : C.blue, widths[i]);
  }
  pc.px(pts[3][0], pts[3][1], C.light);
}

function drawHead(pc: PixelCanvas, hx: number, hy: number): void {
  pc.poly(
    [
      [hx - 5, hy - 1],
      [hx - 2, hy - 4],
      [hx + 5, hy - 3],
      [hx + 8, hy + 1],
      [hx + 4, hy + 3],
      [hx - 3, hy + 3],
    ],
    C.body,
  );
  // Blue face under a black visor that sweeps forward.
  pc.rect(hx + 1, hy + 1, 6, 2, C.blue);
  pc.poly(
    [
      [hx - 1, hy - 3],
      [hx + 5, hy - 3],
      [hx + 8, hy + 1],
      [hx + 1, hy + 1],
    ],
    C.visor,
  );
  pc.line(hx, hy - 3, hx + 5, hy - 2, C.glint);
  pc.px(hx + 6, hy - 1, C.light);
  pc.line(hx - 4, hy - 1, hx - 1, hy - 3, C.blue);
  pc.rect(hx + 4, hy + 2, 3, 1, C.navy);
}

function drawXlr8(pc: PixelCanvas, frame: number): void {
  const p = pose(frame);
  const hipX = 13;
  const hipY = 17 + p.bob;
  const chestX = 20 + p.lean;
  const chestY = 12 + p.bob + Math.round(p.lean * 0.3);
  const headX = 25 + Math.round(p.lean * 1.3);
  const headY = 7 + p.bob + Math.round(p.lean * 0.5);

  drawTail(pc, hipX, hipY, p.tail);
  drawLeg(pc, hipX - 1, hipY + 1, p.back, C.navy);
  pc.line(chestX - 1, chestY + 1, chestX - 1 + p.claw2.x, chestY + 1 + p.claw2.y, C.navy, 2);
  pc.px(chestX - 1 + p.claw2.x + Math.sign(p.claw2.x || 1), chestY + 1 + p.claw2.y, C.light);

  // Torso: a forward-leaning wedge with a blue belly band.
  pc.poly(
    [
      [hipX - 3, hipY - 2],
      [hipX - 2, hipY + 3],
      [chestX + 3, chestY + 4],
      [chestX + 3, chestY - 2],
      [chestX - 2, chestY - 3],
    ],
    C.body,
  );
  pc.line(hipX - 1, hipY + 2, chestX + 2, chestY + 3, C.blue);
  pc.line(hipX - 2, hipY - 2, chestX - 1, chestY - 3, C.navy);
  pc.line(chestX, chestY - 1, headX - 2, headY + 2, C.body, 3);
  pc.rect(chestX, chestY + 1, 2, 2, P.omnitrix);

  drawLeg(pc, hipX + 1, hipY + 1, p.front, C.body);
  drawHead(pc, headX, headY);
  pc.line(chestX + 1, chestY + 1, chestX + 1 + p.claw.x, chestY + 1 + p.claw.y, C.body, 2);
  const tipX = chestX + 1 + p.claw.x + Math.sign(p.claw.x || 1);
  pc.px(tipX, chestY + 1 + p.claw.y, C.light).px(tipX, chestY + 2 + p.claw.y, C.light);

  pc.outline(P.ink);

  // Motion smear drawn after the outline so it stays thin and bright.
  if (p.blur > 0) {
    const rows = p.blur === 2 ? [headY, chestY, chestY + 4, hipY + 2, 24] : [chestY + 2, hipY + 3, 25];
    for (const [i, y] of rows.entries()) {
      const len = (p.blur === 2 ? 9 : 5) + ((i * 3 + frame) % 4);
      pc.rect(Math.max(0, hipX - 6 - len), y, len, 1, i % 2 ? C.blue : C.light, 0.75);
    }
  }
  if (frame === 12 || frame === 13) {
    const y = chestY + (frame === 12 ? 0 : 3);
    pc.rect(chestX + 9, y - 2, 1, 5, C.light, 0.8);
    pc.rect(chestX + 11, y - 1, 1, 3, P.white, 0.7);
  }
}

/** Dial hologram: XLR8's visored head in profile, white for tinting. 16x16. */
function drawIcon(pc: PixelCanvas): void {
  pc.poly([[2, 8], [5, 3], [11, 3], [15, 8], [11, 12], [3, 12]], P.white);
  const ctx = pc.ctx;
  ctx.clearRect(pc.ox + 6, pc.oy + 5, 6, 2);
  ctx.clearRect(pc.ox + 11, pc.oy + 7, 2, 1);
  pc.rect(4, 13, 6, 2, P.white);
}

/** Three claw slashes. */
function drawTouchClaws(pc: PixelCanvas): void {
  for (let i = 0; i < 3; i++) pc.line(4 + i * 3, 13, 9 + i * 3, 2, P.white, 2);
}

/** Dash: an arrow with speed lines behind it. */
function drawTouchDash(pc: PixelCanvas): void {
  pc.poly([[8, 3], [15, 8], [8, 13], [10, 8]], P.white);
  pc.rect(1, 5, 6, 1, P.white).rect(0, 8, 8, 1, P.white).rect(2, 11, 5, 1, P.white);
}

export const XLR8_ASSETS: AssetDef[] = [
  sheet(XLR8_TEX.sheet, XLR8_FRAME.w, XLR8_FRAME.h, FRAME_COUNT, drawXlr8),
  one(XLR8_TEX.icon, 16, 16, drawIcon),
  one(XLR8_TEX.touchAttack, 16, 16, drawTouchClaws),
  one(XLR8_TEX.touchSpecial, 16, 16, drawTouchDash),
];

export const XLR8_ANIMS: AnimDef[] = animsFor('xlr8', XLR8_TEX.sheet, XLR8_FRAMES, { idle: 7, run: 22 }, ['idle', 'run']);
