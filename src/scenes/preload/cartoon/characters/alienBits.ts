import { INK, LINE, lightOf, mix, shadeOf, type Paint, type ShapeStyle } from '../paint';

/**
 * The Omnitrix symbol every alien wears (on a chest, a belt, a collar): a
 * black disc in a grey ring with the green hourglass, glowing a little.
 */
export function omnitrixBadge(p: Paint, x: number, y: number, r: number, green: number, ring = 0xe8ecf4): void {
  p.glow(x, y, r * 2.2, green, 0.35);
  p.shape(p.circle(x, y, r), { fill: ring, ink: LINE * 0.55 });
  const core = p.circle(x, y, r * 0.72);
  p.fill(core, 0x0e1014);
  p.within(core, () => {
    p.fill(p.poly([x - r * 0.48, y - r * 0.6, x + r * 0.48, y - r * 0.6, x, y]), green);
    p.fill(p.poly([x - r * 0.48, y + r * 0.6, x + r * 0.48, y + r * 0.6, x, y]), green);
  });
  p.stroke(core, INK, LINE * 0.3, 0.6);
}

/**
 * The standard cel look for a body part in one colour: a soft gradient from
 * its light to its shade across the part (`r` is the part's rough radius), a
 * shadow crescent away from the light and a rim of light toward it. Far-side
 * limbs sit a step darker.
 */
export function cel(base: number, o: { light?: number; shade?: number; far?: boolean; r?: number } = {}): ShapeStyle {
  const r = o.r ?? 2;
  const fill = o.far ? shadeOf(base, 0.22) : base;
  const light = o.light ?? lightOf(base);
  const shade = o.shade ?? shadeOf(base);
  return {
    fill: { linear: [-r, -r, r, r * 2.5], stops: [[0, mix(light, fill, 0.45)], [0.5, fill], [1, mix(fill, shade, 0.6)]] },
    shade,
    shadeDepth: r * 0.6,
    light,
    lightDepth: r * 0.28,
    lightAlpha: o.far ? 0.2 : 0.55,
  };
}
