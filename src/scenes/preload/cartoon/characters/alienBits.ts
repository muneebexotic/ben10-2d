import { INK, LINE, type Paint } from '../paint';

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
