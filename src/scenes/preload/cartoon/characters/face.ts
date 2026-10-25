import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';

/** One eye's ellipse, relative to the eyes bone. */
export interface EyeShape {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface EyesLook {
  iris: number;
  brow: number;
  near: EyeShape;
  far: EyeShape;
  /** The colour lids close in (default: a warm skin). */
  skin?: number;
  /** Brows heavier or lighter (default 1). */
  browWeight?: number;
  /** Iris size within the eye (default 0.62). */
  irisScale?: number;
  /** How far the lids rest closed when the eyes are just open (a sly or sleepy look; default 0). */
  restLid?: number;
}

/**
 * A pair of cartoon eyes in three-quarter view (the near one bigger) with
 * brows, in one of the shared expressions: open, blink, happy, angry, wide,
 * hurt, side, sad, shut.
 */
export function cartoonEyes(p: Paint, variant: string, look: EyesLook): void {
  const { near, far } = look;
  const skin = look.skin ?? 0xf6c8a0;
  const bw = (look.browWeight ?? 1) * LINE * 1.15;
  const closed = (e: EyeShape, curve: number) => p.line([e.x - e.rx, e.y + curve * 0.2, e.x, e.y + e.ry * 0.35 * curve, e.x + e.rx, e.y + curve * 0.2], LINE * 0.85, INK, true);
  const brow = (e: EyeShape, lift: number, tiltIn: number, scale = 1) => {
    const y = e.y - e.ry - 0.7 - lift;
    const x0 = e.x - e.rx * 1.05 * scale;
    const x1 = e.x + e.rx * 1.0 * scale;
    p.line([x0, y + tiltIn * -0.5 + 0.2, (x0 + x1) / 2, y - 0.35, x1, y + tiltIn * 0.5], bw * scale, look.brow, true);
  };
  const eye = (e: EyeShape, lx: number, ly: number, lid: number, irisScale = look.irisScale ?? 0.62, grow = 1) => {
    const rx = e.rx * grow;
    const ry = e.ry * grow;
    const white = p.ellipse(e.x, e.y, rx, ry);
    // A thin rim all round, and a heavy upper lid (lash line): eyes, not goggles.
    p.shape(white, { fill: { linear: [e.x, e.y - ry, e.x, e.y + ry], stops: [[0, 0xffffff], [1, 0xdde4ee]] }, ink: LINE * 0.42 });
    p.within(white, () => {
      const ix = e.x + lx * rx * 0.42;
      const iy = e.y + ly * ry * 0.32;
      const ir = Math.min(rx, ry * 0.9) * irisScale * 1.15;
      p.fill(p.ellipse(ix, iy, ir, ir * 1.08), { radial: [ix - ir * 0.3, iy - ir * 0.4, 0, ix, iy, ir * 1.1], stops: [[0, lightOf(look.iris, 0.35)], [0.65, look.iris], [1, shadeOf(look.iris, 0.45)]] });
      p.fill(p.ellipse(ix + lx * 0.1, iy, ir * 0.5, ir * 0.56), INK);
      p.fill(p.circle(ix - ir * 0.38, iy - ir * 0.45, ir * 0.32), 0xffffff, 0.95);
      p.fill(p.circle(ix + ir * 0.35, iy + ir * 0.4, ir * 0.14), 0xffffff, 0.7);
      if (lid > 0) {
        const top = e.y - ry + lid * ry * 2;
        p.fill(p.rrect(e.x - rx - 1, e.y - ry * 2.5, rx * 2 + 2, top - (e.y - ry * 2.5), 0), skin);
        p.line([e.x - rx - 0.2, top, e.x + rx + 0.2, top - 0.2], LINE * 0.75, INK);
      }
    });
    if (lid <= 0) {
      const lash = new Path2D();
      lash.ellipse(e.x, e.y, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.97);
      p.stroke(lash, INK, LINE * 0.9);
    }
  };
  switch (variant) {
    case 'blink':
    case 'shut':
      closed(near, variant === 'shut' ? -0.6 : 1);
      closed(far, variant === 'shut' ? -0.6 : 1);
      brow(near, variant === 'shut' ? -0.5 : 0, variant === 'shut' ? 1 : 0);
      brow(far, variant === 'shut' ? -0.5 : 0, variant === 'shut' ? 1 : 0, 0.75);
      return;
    case 'happy':
      p.line([near.x - near.rx, near.y + 0.3, near.x, near.y - near.ry * 0.55, near.x + near.rx, near.y + 0.3], LINE * 0.95, INK, true);
      p.line([far.x - far.rx, far.y + 0.3, far.x, far.y - far.ry * 0.5, far.x + far.rx, far.y + 0.3], LINE * 0.85, INK, true);
      brow(near, 0.5, -0.3);
      brow(far, 0.5, -0.3, 0.75);
      return;
    case 'hurt':
      p.line([near.x - near.rx, near.y - near.ry * 0.6, near.x + near.rx * 0.7, near.y, near.x - near.rx, near.y + near.ry * 0.6], LINE * 0.9, INK);
      p.line([far.x + far.rx, far.y - far.ry * 0.6, far.x - far.rx * 0.6, far.y, far.x + far.rx, far.y + far.ry * 0.6], LINE * 0.8, INK);
      brow(near, 0.2, 1.4);
      brow(far, 0.2, 1.4, 0.75);
      return;
    case 'angry':
      eye(near, 0.65, 0.1, 0.32);
      eye(far, 0.65, 0.1, 0.32);
      brow(near, -0.6, 2.4);
      brow(far, -0.5, 2.0, 0.8);
      return;
    case 'wide':
      eye(near, 0.2, 0, 0, 0.42, 1.15);
      eye(far, 0.2, 0, 0, 0.42, 1.12);
      brow(near, 1.4, -0.8);
      brow(far, 1.3, -0.8, 0.75);
      return;
    case 'side':
      eye(near, -0.85, 0.05, 0.12);
      eye(far, -0.85, 0.05, 0.12);
      brow(near, 0.1, 0.4);
      brow(far, 0.3, -0.2, 0.75);
      return;
    case 'sad':
      eye(near, 0.3, 0.55, 0.18);
      eye(far, 0.3, 0.55, 0.18);
      brow(near, 0.4, -1.8);
      brow(far, 0.4, -1.6, 0.75);
      return;
    default:
      eye(near, 0.6, 0.05, look.restLid ?? 0);
      eye(far, 0.6, 0.05, look.restLid ?? 0);
      brow(near, 0.1, 0.3);
      brow(far, 0.2, 0, 0.75);
  }
}

export interface MouthLook {
  mouth: number;
  tongue: number;
  /** Lip line colour (a darker skin). */
  lip: number;
  width: number;
  teeth?: number;
}

/** A cartoon mouth in one of the shared shapes: smile, grin, open, o, grit, frown, smirk, shout, flat. */
export function cartoonMouth(p: Paint, variant: string, m: MouthLook): void {
  const w = m.width;
  const teeth = m.teeth ?? 0xffffff;
  const open = (path: Path2D, tongue: boolean, top: boolean) => {
    p.shape(path, { fill: m.mouth, ink: LINE * 0.75 });
    p.within(path, () => {
      if (top) p.fill(p.rrect(-w, -2, w * 2, 1.55, 0.3), teeth);
      if (tongue) p.fill(p.ellipse(0.2, 1.5, w * 0.6, 0.9), m.tongue);
    });
  };
  switch (variant) {
    case 'grin':
      open(p.smooth([-w * 0.85, -0.5, 0, -0.75, w, -0.6, w * 0.6, 0.7, 0, 1.0, -w * 0.6, 0.6], true, 0.4), true, true);
      return;
    case 'open':
      open(p.ellipse(0.1, 0.2, w * 0.55, 0.85), true, false);
      return;
    case 'o':
      open(p.ellipse(0.2, 0.2, w * 0.32, 0.55), false, false);
      return;
    case 'shout':
      open(p.smooth([-w * 0.9, -0.7, w, -0.9, w * 0.75, 1.3, 0, 1.75, -w * 0.7, 1.2], true, 0.45), true, true);
      return;
    case 'grit': {
      const bar = p.rrect(-w * 0.85, -0.6, w * 1.8, 1.25, 0.5);
      p.shape(bar, { fill: teeth, ink: LINE * 0.7 });
      p.line([-w * 0.85, 0.02, w * 0.95, 0.02], LINE * 0.35, INK, false, 0.8);
      for (const x of [-w * 0.35, w * 0.15, w * 0.6]) p.line([x, -0.6, x, 0.65], LINE * 0.3, INK, false, 0.6);
      return;
    }
    case 'frown':
      p.line([-w * 0.8, 0.5, 0, -0.3, w * 0.8, 0.5], LINE * 0.75, INK, true);
      return;
    case 'smirk':
      p.line([-w * 0.6, 0.15, w * 0.2, 0.25, w * 0.85, -0.45], LINE * 0.75, INK, true);
      p.line([w * 0.8, -0.65, w * 0.95, -0.25], LINE * 0.5, INK, true, 0.7);
      return;
    case 'flat':
      p.line([-w * 0.6, 0.1, w * 0.7, 0], LINE * 0.75, INK, true);
      return;
    default:
      p.line([-w * 0.75, -0.2, 0, 0.45, w * 0.8, -0.35], LINE * 0.75, INK, true);
      p.line([w * 0.72, -0.55, w * 0.9, -0.15], LINE * 0.5, m.lip, true, 0.8);
  }
}

/**
 * The Omnitrix on a wrist (the forearm hangs down from its joint): the chunky
 * band and the dial turned toward the viewer, with its green hourglass.
 */
export function omnitrixWatch(p: Paint, x: number, y: number, armR: number, c: { band: number; face: number; glow: number }): void {
  const band = p.rrect(x - armR - 0.35, y - 0.75, armR * 2 + 0.7, 1.5, 0.5);
  p.shape(band, { fill: { linear: [0, y - 0.75, 0, y + 0.75], stops: [[0, lightOf(c.band, 0.25)], [1, c.band]] }, ink: LINE * 0.6 });
  const r = 1.05;
  const dial = p.circle(x + 0.15, y, r);
  p.shape(dial, { fill: c.face, ink: LINE * 0.6, shade: shadeOf(c.face, 0.4), shadeDepth: 0.4 });
  const core = p.circle(x + 0.15, y, r * 0.66);
  p.fill(core, 0x11141a);
  p.within(core, () => {
    p.fill(p.poly([x + 0.15 - r * 0.42, y - r * 0.5, x + 0.15 + r * 0.42, y - r * 0.5, x + 0.15, y]), c.glow);
    p.fill(p.poly([x + 0.15 - r * 0.42, y + r * 0.5, x + 0.15 + r * 0.42, y + r * 0.5, x + 0.15, y]), c.glow);
  });
  p.glow(x + 0.15, y, 1.6, c.glow, 0.35);
}
