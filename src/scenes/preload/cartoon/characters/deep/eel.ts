import { EEL_CARTOON } from '../../../../../config/cartoon/eel';
import { INK, LINE, lightOf, type Paint } from '../../paint';
import { wave, type PartSpec, type Pose, type RigDef } from '../../rig';

const C = EEL_CARTOON.colors;

/** Body segments, head to tail: length and the radius at each end. */
const SEGS: ReadonlyArray<readonly [number, number, number]> = [
  [5.0, 3.0, 2.8],
  [5.0, 2.8, 2.5],
  [5.0, 2.5, 2.0],
  [4.6, 2.0, 1.5],
  [4.4, 1.5, 0.6],
];

/** One body segment (pointing back along -x): dark back, pale belly, the frill on top, a glowing spot. */
function segment(p: Paint, i: number, v: string): void {
  const [len, r0, r1] = SEGS[i];
  const glow = v === 'glow';
  // The fin frill along the back (and a short one underneath near the tail).
  p.fill(p.smooth([0.4, -r0 + 0.2, -len * 0.3, -r0 - 1.6, -len * 0.7, -r1 - 1.4, -len - 0.4, -r1 + 0.2, -len - 0.4, -r1 + 1, 0.4, -r0 + 1], true, 0.4), C.fin, 0.9);
  p.line([0.4, -r0 + 0.2, -len * 0.3, -r0 - 1.6, -len * 0.7, -r1 - 1.4, -len - 0.4, -r1 + 0.2], LINE * 0.5, INK, true, 0.8);
  const body = p.capsule(0, 0, r0, -len, 0, r1);
  p.shape(body, { fill: { linear: [0, -r0, 0, r0], stops: [[0, C.body], [0.55, C.bodyLight], [0.7, C.belly], [1, lightOf(C.belly, 0.2)]] }, ink: LINE * 0.8, light: 0xbad0ff, lightDepth: 0.3, lightAlpha: 0.4 });
  // A glowing spot on the flank.
  const sx = -len * 0.5;
  const sy = -r0 * 0.15;
  if (glow) p.glow(sx, sy, 3.2, C.spot, 0.9);
  p.fill(p.circle(sx, sy, glow ? 0.9 : 0.7), glow ? 0xffffff : C.spot, glow ? 1 : 0.85);
}

/** The head: a blunt, grumpy wedge with a wide mouth and a small fierce eye. */
function head(p: Paint, v: string): void {
  const glow = v === 'glow' || v === 'zap';
  const open = v === 'zap';
  const skull = p.smooth([-1.0, -3.2, 2.6, -3.4, 5.4, -2.2, 6.6, -0.6, 6.2, 1.0, 4.4, 2.2, 1.0, 3.0, -1.0, 2.8]);
  p.shape(skull, { fill: { linear: [0, -3.4, 0, 3], stops: [[0, C.body], [0.5, C.bodyLight], [0.75, C.belly], [1, C.belly]] }, ink: LINE * 0.9, light: 0xbad0ff, lightDepth: 0.35, lightAlpha: 0.5 });
  p.within(skull, () => {
    // The mouth line, turned down; open, it shows teeth.
    if (open) {
      p.fill(p.poly([6.8, 0.2, 1.8, 0.6, 6.0, 2.6]), C.mouth);
      for (let i = 0; i < 3; i++) p.fill(p.poly([5.6 - i * 1.2, 0.3, 5.1 - i * 1.2, 0.3, 5.35 - i * 1.2, 1.2]), 0xffffff);
    } else {
      p.line([6.6, 0.3, 4, 0.8, 2.0, 1.4], LINE * 0.7, INK, true);
    }
    // Gill slit.
    p.line([0.4, -1.8, 0.0, 0.0, 0.4, 1.6], LINE * 0.5, C.body, true, 0.8);
  });
  // The eye.
  p.shape(p.circle(3.8, -1.4, 0.9), { fill: C.eye, ink: LINE * 0.5 });
  p.fill(p.ellipse(4.0, -1.4, 0.32, 0.7), INK);
  p.line([2.8, -2.6, 4.8, -2.0], LINE * 0.7, INK);
  if (glow) {
    p.glow(3.8, -1.4, 3, C.spot, 0.6);
    for (const [x, y] of [[1.4, 1.6], [4.8, 1.6]] as const) p.glow(x, y, 2, C.spot, 0.7);
  }
}

function parts(): PartSpec[] {
  const out: PartSpec[] = [{ id: 'head', w: 9, h: 8, px: 1.4, py: 4, variants: ['calm', 'glow', 'zap'], draw: head }];
  SEGS.forEach(([len, r0], i) => out.push({ id: `seg${i}`, w: len + r0 + 1.6, h: r0 * 2 + 4.6, px: len + 0.6, py: r0 + 2.6, variants: ['dim', 'glow'], draw: (p, v) => segment(p, i, v) }));
  return out;
}

const SEG_IDS = SEGS.map((_, i) => `seg${i}`);

function glowAll(p: Pose): void {
  p.show('head', 'glow');
  for (const s of SEG_IDS) p.show(s, 'glow');
}

/** The zapper eel's HD rig (Chapter 7): a chain of segments behind a grumpy head. */
export function eelRig(): RigDef {
  const bones: RigDef['bones'][number][] = [{ id: 'head', x: 8, y: 0, part: 'head', z: 30, dir: 1 }];
  SEGS.forEach((_, i) => bones.push({ id: `seg${i}`, parent: i === 0 ? 'head' : `seg${i - 1}`, x: i === 0 ? 0 : -SEGS[i - 1][0] + 0.4, y: 0, part: `seg${i}`, z: 28 - i * 2, dir: 1 }));
  const swim = (amp: number) => (t: number, p: Pose) => {
    p.set('head', wave(t) * amp * 0.4).move('head', 0, wave(t, 0.25) * 0.6);
    SEG_IDS.forEach((s, i) => p.set(s, wave(t, -0.14 * (i + 1)) * amp * (0.6 + i * 0.14)));
  };
  return {
    id: 'eel',
    parts: parts(),
    bones,
    fallback: 'swim',
    alias: { idle: 'swim' },
    bounds: { left: -20, right: 16, top: -10, bottom: 10 },
    clips: {
      swim: { ms: 1100, loop: true, pose: swim(12) },
      charge: {
        ms: 140,
        loop: true,
        pose: (t, p) => {
          // Coiled into an S, trembling.
          p.set('head', -18 + wave(t) * 2).move('head', -1, 0);
          const coil = [34, 30, -28, -34, -20];
          SEG_IDS.forEach((s, i) => p.set(s, coil[i] + wave(t, i * 0.3) * 3));
          glowAll(p);
        },
      },
      zap: {
        ms: 300,
        loop: false,
        pose: (t, p) => {
          // Rigid and straight, buzzing.
          p.set('head', wave(t * 6) * 3).show('head', 'zap');
          SEG_IDS.forEach((s, i) => p.set(s, wave(t * 6, i * 0.5) * 4));
          for (const s of SEG_IDS) p.show(s, 'glow');
        },
      },
      flop: {
        ms: 480,
        loop: true,
        pose: (t, p) => {
          const k = wave(t);
          p.set('head', -20 * k).move('head', 0, 6);
          SEG_IDS.forEach((s, i) => p.set(s, (i < 2 ? 24 : -16) * k));
        },
      },
    },
  };
}
