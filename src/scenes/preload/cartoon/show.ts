import { INK, mix, type Fill, type Paint } from './paint';
import type { PartSpec } from './rig';

/**
 * The show look (Act 3 characters redrawn from their model sheets, see
 * docs/DECISIONS.md): the original series' flat cel style. A thin, even ink
 * line, flat colour, one hard-edged shadow shape and at most a small crisp
 * highlight; no gradients, no rim light, no gloss. Characters move to it one
 * at a time; the softer paint-kit look stays for the ones still waiting.
 */

/** Outline width (game px): about 1.5-2 screen pixels in play. */
export const SHOW_INK = 0.34;
/** Inner detail lines: folds, seams, the mouth. */
export const SHOW_DETAIL = 0.22;

/** A darker, slightly warmer shade for hard shadows (the show's shadows lean warm). */
export function showShade(color: number, amount = 0.3): number {
  return mix(color, 0x2a140c, amount);
}

export interface CelStyle {
  fill: Fill;
  /** Hard shadow colour, cast toward (dx, dy) by `depth` game px (default: down and back). */
  shade?: number;
  depth?: number;
  dir?: { x: number; y: number };
  ink?: number | false;
  /** A small hard highlight toward the light. */
  hi?: number;
  hiDepth?: number;
}

const DOWN_BACK = { x: -0.35, y: 0.94 };

/**
 * A flat cel-shaded shape: ink under the fill (twice the width, so half shows),
 * the fill, then a hard shadow where a copy of the shape shifted toward the
 * light doesn't reach. The shadow falls down and back by default: the front of
 * the body faces the light, as in the model sheets.
 */
export function cel(p: Paint, path: Path2D, s: CelStyle): Path2D {
  const ink = s.ink === undefined ? SHOW_INK : s.ink;
  if (ink) p.stroke(path, INK, ink * 2);
  p.fill(path, s.fill);
  if (s.shade !== undefined) hardShadow(p, path, s.shade, s.depth ?? 0.8, s.dir ?? DOWN_BACK);
  if (s.hi !== undefined) hardShadow(p, path, s.hi, s.hiDepth ?? 0.35, { x: -(s.dir ?? DOWN_BACK).x, y: -(s.dir ?? DOWN_BACK).y });
  return path;
}

/** Fills the part of `path` that a copy shifted against `dir` by `depth` leaves uncovered. */
export function hardShadow(p: Paint, path: Path2D, color: number, depth: number, dir: { x: number; y: number }): void {
  const ctx = p.ctx;
  ctx.save();
  ctx.clip(path);
  const cover = new Path2D();
  cover.rect(-4000, -4000, 8000, 8000);
  cover.addPath(path, new DOMMatrix([1, 0, 0, 1, -dir.x * depth, -dir.y * depth]));
  ctx.fillStyle = cssOf(color);
  ctx.fill(cover, 'evenodd');
  ctx.restore();
}

/** A shape translated by (dx, dy). */
export function shifted(path: Path2D, dx: number, dy: number): Path2D {
  const out = new Path2D();
  out.addPath(path, new DOMMatrix([1, 0, 0, 1, dx, dy]));
  return out;
}

function cssOf(color: number): string {
  return `rgb(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255})`;
}

/** A limb segment hanging from its joint in the show look (a slightly tapered capsule). */
export function celLimb(p: Paint, len: number, r0: number, r1: number, fill: number, shade: number, far = false): Path2D {
  const f = far ? showShade(fill, 0.16) : fill;
  return cel(p, p.capsule(0, 0, r0, 0, len, r1), { fill: f, shade: far ? showShade(shade, 0.16) : shade, depth: r0 * 0.7, dir: { x: 1, y: 0.15 } });
}

/** Fist, open hand and pointing hand, blocky as in the show (the hand hangs below the wrist joint). */
export function showHand(id: string, skin: number, shade: number, r: number, far = false): PartSpec {
  const fill = far ? showShade(skin, 0.14) : skin;
  const sh = far ? showShade(shade, 0.14) : shade;
  return {
    id,
    w: r * 4 + 2,
    h: r * 4 + 2,
    px: r * 2 + 1,
    py: r + 0.5,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      const st = { fill, shade: sh, depth: r * 0.45, dir: { x: 0.6, y: 0.8 } };
      if (v === 'fist') {
        cel(p, p.rrect(-r * 0.95, -r * 0.15, r * 2.0, r * 1.95, r * 0.55), st);
        // Knuckles and the thumb folded across.
        p.line([r * 0.15, r * 0.35, r * 0.15, r * 1.55], SHOW_DETAIL, INK, false, 0.7);
        p.line([r * 0.6, r * 0.45, r * 0.6, r * 1.5], SHOW_DETAIL, INK, false, 0.6);
        cel(p, p.rrect(-r * 0.75, r * 0.55, r * 1.25, r * 0.62, r * 0.3), { fill, ink: SHOW_DETAIL * 0.8 });
      } else if (v === 'open') {
        const palm = p.spiky([-r * 0.85, -0.1, r * 0.85, -0.1, r * 1.0, r * 1.25, r * 0.55, r * 2.35, -r * 0.45, r * 2.3, -r * 0.95, r * 1.2], [false, false, false, true, true, false]);
        cel(p, palm, st);
        p.line([-r * 0.05, r * 1.4, -r * 0.05, r * 2.2], SHOW_DETAIL, INK, false, 0.6);
        p.line([r * 0.45, r * 1.3, r * 0.5, r * 2.1], SHOW_DETAIL, INK, false, 0.6);
        cel(p, p.capsule(r * 0.85, r * 0.55, r * 0.33, r * 1.6, r * 0.2, r * 0.27), { fill, ink: SHOW_DETAIL * 1.2 });
      } else {
        cel(p, p.rrect(-r * 0.9, -r * 0.1, r * 1.8, r * 1.7, r * 0.5), st);
        cel(p, p.capsule(r * 0.25, r * 1.2, r * 0.33, r * 0.35, r * 2.75, r * 0.3), { fill, ink: SHOW_DETAIL * 1.2 });
      }
    },
  };
}

export interface SneakerLook {
  upper: number;
  toe: number;
  panel: number;
  sole: number;
  length: number;
  /** Ankle joint to the floor. */
  ankle: number;
  far?: boolean;
}

/** A chunky sneaker in the show look: dark upper, pale toe cap and side panel, pale sole (the foot points forward from the ankle). */
export function showSneaker(id: string, o: SneakerLook): PartSpec {
  const L = o.length;
  const B = o.ankle;
  const k = o.far ? 0.18 : 0;
  const dim = (c: number) => (k ? showShade(c, k) : c);
  return {
    id,
    w: L + 4.5,
    h: B + 3.4,
    px: 2.4,
    py: 1.9,
    draw: (p) => {
      const shoe = p.spiky([-1.8, -1.3, 0.9, -1.35, L * 0.48, B - 1.9, L - 0.6, B - 1.75, L + 0.3, B - 0.9, L + 0.25, B, -2.05, B, -2.25, B - 1.1], [false, false, false, false, false, false, true, false]);
      cel(p, shoe, { fill: dim(o.upper), ink: SHOW_INK });
      p.within(shoe, () => {
        // A white toe cap, the stripe of the side panel and a white sole: the upper stays mostly dark.
        p.fill(p.ellipse(L * 1.0, B - 0.85, L * 0.3, 1.05), dim(o.toe));
        p.fill(p.poly([-0.6, B - 0.85, L * 0.32, B - 1.5, L * 0.5, B - 1.2, L * 0.22, B - 0.7]), dim(o.panel));
        p.fill(p.rrect(-3, B - 0.45, L + 4, 0.45, 0), dim(o.sole));
        p.line([-3, B - 0.45, L + 1, B - 0.45], SHOW_DETAIL, INK, false, 0.9);
      });
    },
  };
}

export interface ShowEye {
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Which side the inner corner (by the nose) is on: 1 right, -1 left. */
  inner: 1 | -1;
}

export interface ShowEyesLook {
  iris: number;
  brow: number;
  skin: number;
  near: ShowEye;
  far: ShowEye;
  /** Brow thickness (game px). */
  browW?: number;
  /** How the brows sit at rest: >0 drawn down toward the nose (determined). */
  browSet?: number;
}

/** The almond eye's outline: an angled upper lid, a softer lower one, sharp corners. */
function almond(p: Paint, e: ShowEye, open = 1): Path2D {
  const { x, y, rx } = e;
  const ry = e.ry * open;
  const i = e.inner;
  return p.spiky(
    [x - rx * i, y - ry * 0.05, x - rx * 0.35 * i, y - ry * 1.0, x + rx * 0.45 * i, y - ry * 0.85, x + rx * i, y - ry * 0.15, x + rx * 0.3 * i, y + ry * 0.75, x - rx * 0.45 * i, y + ry * 0.7],
    [true, false, false, true, false, false],
  );
}

/**
 * The show's eyes in three-quarter view (near one wider) with heavy angled
 * brows, in the shared expressions: open, blink, happy, angry, wide, hurt,
 * side, sad, shut.
 */
export function showEyes(p: Paint, variant: string, look: ShowEyesLook): void {
  const bw = look.browW ?? 0.34;
  const set = look.browSet ?? 0.35;
  const lidLine = (e: ShowEye, curve: number) => p.line([e.x - e.rx, e.y + 0.05, e.x, e.y + e.ry * 0.45 * curve, e.x + e.rx, e.y + 0.05], SHOW_INK * 0.9, INK, true);
  // A brow: a tapered wedge, its inner end (by the nose) pulled down by `down`.
  const brow = (e: ShowEye, lift: number, down: number) => {
    const outer = e.x - e.rx * 1.15 * e.inner;
    const inner = e.x + e.rx * 1.05 * e.inner;
    const y = e.y - e.ry - 0.42 - lift;
    const yi = y + down * 0.55;
    const yo = y - down * 0.2;
    const w = bw * (e === look.far ? 0.8 : 1);
    p.fill(p.poly([outer, yo - w * 0.35, (outer + inner) / 2, Math.min(yo, yi) - w * 0.75, inner, yi - w * 0.5, inner, yi + w * 0.45, (outer + inner) / 2, (yo + yi) / 2 + w * 0.25, outer, yo + w * 0.3]), look.brow);
  };
  const eye = (e: ShowEye, lx: number, ly: number, open = 1, irisK = 0.92) => {
    const shape = almond(p, e, open);
    p.fill(shape, 0xf6f4ee);
    p.within(shape, () => {
      const ir = e.ry * irisK;
      const ix = e.x + lx * e.rx * 0.45;
      const iy = e.y + ly * e.ry * 0.3;
      p.fill(p.ellipse(ix, iy, ir * Math.min(1, e.rx / e.ry), ir), look.iris);
      p.fill(p.ellipse(ix, iy - ir * 0.62, ir * Math.min(1, e.rx / e.ry), ir * 0.42), showShade(look.iris, 0.22));
      p.fill(p.ellipse(ix + lx * 0.05, iy + ir * 0.05, ir * 0.46 * Math.min(1, e.rx / e.ry), ir * 0.5), INK);
      p.fill(p.circle(ix - ir * 0.3, iy - ir * 0.32, ir * 0.27), 0xffffff);
    });
    // Heavy upper lid, light lower one.
    const lid = new Path2D();
    const i = e.inner;
    const ry = e.ry * open;
    lid.moveTo(e.x - e.rx * i, e.y - ry * 0.05);
    lid.lineTo(e.x - e.rx * 0.35 * i, e.y - ry * 1.0);
    lid.lineTo(e.x + e.rx * 0.45 * i, e.y - ry * 0.85);
    lid.lineTo(e.x + e.rx * i, e.y - ry * 0.15);
    p.stroke(lid, INK, SHOW_INK * 1.35);
    p.stroke(shape, INK, SHOW_DETAIL * 0.75);
  };
  const { near, far } = look;
  switch (variant) {
    case 'blink':
    case 'shut': {
      const c = variant === 'shut' ? -0.7 : 1;
      lidLine(near, c);
      lidLine(far, c);
      brow(near, variant === 'shut' ? -0.25 : 0, variant === 'shut' ? set + 0.5 : set);
      brow(far, variant === 'shut' ? -0.25 : 0, variant === 'shut' ? set + 0.5 : set);
      return;
    }
    case 'happy':
      p.line([near.x - near.rx, near.y + 0.25, near.x, near.y - near.ry * 0.5, near.x + near.rx, near.y + 0.25], SHOW_INK, INK, true);
      p.line([far.x - far.rx, far.y + 0.25, far.x, far.y - far.ry * 0.45, far.x + far.rx, far.y + 0.25], SHOW_INK * 0.9, INK, true);
      brow(near, 0.35, -0.1);
      brow(far, 0.35, -0.1);
      return;
    case 'hurt':
      p.line([near.x - near.rx, near.y - near.ry * 0.55, near.x + near.rx * 0.6, near.y, near.x - near.rx, near.y + near.ry * 0.55], SHOW_INK, INK);
      p.line([far.x + far.rx, far.y - far.ry * 0.55, far.x - far.rx * 0.5, far.y, far.x + far.rx, far.y + far.ry * 0.55], SHOW_INK * 0.9, INK);
      brow(near, 0.1, 1.2);
      brow(far, 0.1, 1.2);
      return;
    case 'angry':
      eye(near, 0.7, 0.15, 0.75);
      eye(far, 0.7, 0.15, 0.75);
      brow(near, -0.3, set + 1.0);
      brow(far, -0.3, set + 0.9);
      return;
    case 'wide':
      eye(near, 0.25, 0, 1.25, 0.7);
      eye(far, 0.25, 0, 1.25, 0.7);
      brow(near, 0.55, -0.5);
      brow(far, 0.55, -0.5);
      return;
    case 'side':
      eye(near, -0.8, 0.05, 0.9);
      eye(far, -0.8, 0.05, 0.9);
      brow(near, 0.05, set);
      brow(far, 0.2, set - 0.4);
      return;
    case 'sad':
      eye(near, 0.3, 0.5, 0.85);
      eye(far, 0.3, 0.5, 0.85);
      brow(near, 0.25, -1.0);
      brow(far, 0.25, -1.0);
      return;
    default:
      eye(near, 0.65, 0.05);
      eye(far, 0.65, 0.05);
      brow(near, 0, set);
      brow(far, 0, set);
  }
}

export interface ShowMouthLook {
  mouth: number;
  tongue: number;
  width: number;
  teeth?: number;
}

/** A small show mouth in one of the shared shapes: smile, grin, open, o, grit, frown, smirk, shout, flat. */
export function showMouth(p: Paint, variant: string, m: ShowMouthLook): void {
  const w = m.width;
  const teeth = m.teeth ?? 0xffffff;
  const open = (path: Path2D, tongue: boolean, top: boolean, bottom = false) => {
    cel(p, path, { fill: m.mouth, ink: SHOW_DETAIL * 1.1 });
    p.within(path, () => {
      if (top) p.fill(p.rrect(-w * 1.2, -1.6, w * 2.4, 1.32, 0.2), teeth);
      if (bottom) p.fill(p.rrect(-w * 1.2, 0.55, w * 2.4, 1.2, 0.2), teeth);
      if (tongue) p.fill(p.ellipse(0.1, 1.0, w * 0.55, 0.5), m.tongue);
    });
    p.stroke(path, INK, SHOW_DETAIL * 1.1);
  };
  switch (variant) {
    case 'grin':
      open(p.spiky([-w, -0.3, 0, -0.55, w * 1.05, -0.5, w * 0.55, 0.55, -w * 0.5, 0.45], [true, false, true, false, false]), false, true, true);
      p.line([-w * 0.8, 0.02, w * 0.9, -0.02], SHOW_DETAIL * 0.6, INK, false, 0.7);
      return;
    case 'open':
      open(p.ellipse(0.1, 0.15, w * 0.5, 0.55), true, false);
      return;
    case 'o':
      open(p.ellipse(0.15, 0.15, w * 0.3, 0.42), false, false);
      return;
    case 'shout':
      open(p.spiky([-w * 0.95, -0.45, w * 1.05, -0.65, w * 0.7, 1.0, -w * 0.15, 1.3, -w * 0.75, 0.75], [true, true, false, false, false]), true, true);
      return;
    case 'grit': {
      const bar = p.spiky([-w * 0.95, -0.35, w, -0.45, w * 0.9, 0.4, -w * 0.85, 0.42], [true, true, true, true]);
      cel(p, bar, { fill: teeth, ink: SHOW_DETAIL * 1.1 });
      p.line([-w * 0.9, 0.02, w * 0.95, -0.02], SHOW_DETAIL * 0.7, INK, false, 0.9);
      for (const x of [-w * 0.35, w * 0.15, w * 0.6]) p.line([x, -0.38, x, 0.4], SHOW_DETAIL * 0.6, INK, false, 0.7);
      return;
    }
    case 'frown':
      p.line([-w * 0.7, 0.35, 0, -0.15, w * 0.75, 0.3], SHOW_DETAIL * 1.3, INK, true);
      return;
    case 'smirk':
      p.line([-w * 0.55, 0.12, w * 0.25, 0.15, w * 0.8, -0.3], SHOW_DETAIL * 1.3, INK, true);
      return;
    case 'flat':
      p.line([-w * 0.55, 0.05, w * 0.65, 0], SHOW_DETAIL * 1.3, INK, true);
      return;
    default:
      // The show's resting half-smile: a short line, the back end turned up.
      p.line([-w * 0.6, -0.12, 0, 0.12, w * 0.7, 0.02], SHOW_DETAIL * 1.3, INK, true);
  }
}

/**
 * The Omnitrix as the show draws it: a chunky black cuff wider than the wrist
 * with grey studs, and a raised dial (grey ring, black face, green hourglass)
 * turned toward the viewer. (x, y) is the wrist centre on a forearm of radius armR.
 */
export function showOmnitrix(p: Paint, x: number, y: number, armR: number, c: { band: number; grey: number; glow: number }): void {
  const w = armR * 2 + 0.9;
  const band = p.rrect(x - w / 2, y - 0.85, w, 1.7, 0.45);
  cel(p, band, { fill: c.band, shade: showShade(c.band, 0.5), depth: 0.35, dir: { x: 0.3, y: 1 } });
  // Studs along the cuff's edges.
  for (const sx of [-0.62, 0.62]) {
    cel(p, p.rrect(x + sx * w * 0.5 - 0.28, y - 1.0, 0.56, 0.42, 0.15), { fill: c.grey, ink: SHOW_DETAIL });
    cel(p, p.rrect(x + sx * w * 0.5 - 0.28, y + 0.58, 0.56, 0.42, 0.15), { fill: c.grey, ink: SHOW_DETAIL });
  }
  const r = 0.82;
  cel(p, p.circle(x + 0.15, y, r), { fill: c.grey, shade: showShade(c.grey, 0.35), depth: 0.22, dir: { x: 0.5, y: 0.8 } });
  const face = p.circle(x + 0.15, y, r * 0.7);
  p.fill(face, 0x101214);
  p.within(face, () => {
    const cx = x + 0.15;
    p.fill(p.poly([cx - r * 0.42, y - r * 0.55, cx + r * 0.42, y - r * 0.55, cx, y]), c.glow);
    p.fill(p.poly([cx - r * 0.42, y + r * 0.55, cx + r * 0.42, y + r * 0.55, cx, y]), c.glow);
  });
  p.glow(x + 0.15, y, 1.4, c.glow, 0.3);
}
