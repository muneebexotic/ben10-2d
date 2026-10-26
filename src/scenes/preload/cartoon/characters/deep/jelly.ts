import { JELLY_CARTOON } from '../../../../../config/cartoon/jelly';
import { INK, LINE, type Paint } from '../../paint';
import { wave, type PartSpec, type RigDef } from '../../rig';

const C = JELLY_CARTOON.colors;

/** The bell: a glassy dome, its frilled rim, the glowing core showing through. */
function bell(p: Paint): void {
  p.glow(0, -2, 10, C.bell, 0.35);
  const dome = p.smooth([-7.4, 2.6, -7.0, -2.4, -4.4, -6.6, 0, -7.8, 4.4, -6.6, 7.0, -2.4, 7.4, 2.6, 5.6, 1.8, 3.8, 3.0, 1.8, 2.0, 0, 3.0, -1.8, 2.0, -3.8, 3.0, -5.6, 1.8]);
  p.fill(dome, { radial: [-2, -4.6, 0.4, 0, -1, 8.4], stops: [[0, C.bellLight, 0.95], [0.6, C.bell, 0.82], [1, C.bellDark, 0.9]] });
  p.stroke(dome, INK, LINE * 0.7, 0.75);
  p.within(dome, () => {
    // The core and the inner canals.
    p.glow(0, -2.4, 4.6, C.core, 0.8);
    p.fill(p.ellipse(0, -2.4, 2.2, 1.6), C.core, 0.9);
    for (const a of [-0.9, -0.3, 0.3, 0.9]) p.line([0, -2.4, Math.sin(a) * 6, 2.0], LINE * 0.35, C.bellDark, true, 0.6);
  });
  // The shine.
  p.fill(p.ellipse(-3.2, -4.8, 2.4, 1.1, -0.5), 0xffffff, 0.6);
  p.fill(p.circle(3.4, -5.2, 0.5), 0xffffff, 0.5);
}

/** A stinging tendril (two per bone chain), hanging from its joint. */
function tendril(p: Paint, long: boolean): void {
  const len = long ? 7 : 5.5;
  p.line([0, 0, 0.6, len * 0.35, -0.4, len * 0.7, 0.2, len], LINE * 1.5, INK, true, 0.5);
  p.line([0, 0, 0.6, len * 0.35, -0.4, len * 0.7, 0.2, len], LINE * 0.9, C.tendril, true, 0.95);
  for (let i = 1; i <= 3; i++) p.fill(p.circle(0.1, (len * i) / 3.2, 0.35), 0xffffff, 0.8);
}

function parts(): PartSpec[] {
  return [
    { id: 'bell', w: 22, h: 18, px: 11, py: 10, draw: bell },
    { id: 'tA', w: 4, h: 9, px: 2, py: 1, draw: (p) => tendril(p, true) },
    { id: 'tB', w: 4, h: 8, px: 2, py: 1, draw: (p) => tendril(p, false) },
  ];
}

/** The jelly mine's HD rig (Chapter 7): a pulsing bell and four two-part tendrils. */
export function jellyRig(): RigDef {
  const roots = [-4.4, -1.6, 1.4, 4.2];
  const bones: RigDef['bones'][number][] = [{ id: 'bell', x: 0, y: -1, part: 'bell', z: 20, dir: 1 }];
  roots.forEach((x, i) => {
    bones.push({ id: `t${i}`, parent: 'bell', x, y: 2.4, part: 'tA', z: i % 2 ? 10 : 22, dir: -1 });
    bones.push({ id: `t${i}b`, parent: `t${i}`, x: 0, y: 6.6, part: 'tB', z: i % 2 ? 9 : 21, dir: -1 });
  });
  return {
    id: 'jelly',
    parts: parts(),
    bones,
    fallback: 'pulse',
    alias: { idle: 'pulse' },
    bounds: { left: -12, right: 12, top: -12, bottom: 18 },
    clips: {
      pulse: {
        ms: 1200,
        loop: true,
        pose: (t, p) => {
          // A squeeze (the push), then a slow open.
          const k = Math.max(0, wave(t));
          p.size('bell', 1 - k * 0.14, 1 + k * 0.12).move('bell', 0, -k * 1.2);
          roots.forEach((_, i) => {
            p.set(`t${i}`, (i - 1.5) * 6 * (1 - k) + wave(t, i * 0.2) * 8);
            p.set(`t${i}b`, wave(t, i * 0.2 + 0.25) * 16);
          });
        },
      },
    },
  };
}
