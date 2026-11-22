import { CACKLEJACK_CARTOON, IRONJAW_CARTOON, TANGLE_CARTOON } from '../../../../../config/cartoon/circus';
import { INK, LINE, shadeOf, type Paint } from '../../paint';
import { TAU, wave, type Pose, type RigDef } from '../../rig';

/**
 * The big top's stars as HD rigs (original designs, painted in code):
 * CACKLEJACK the ringmaster, IRONJAW the strongman and THE TANGLE, and
 * Cacklejack's giant balloon head (the boss's third stage).
 */

const C = CACKLEJACK_CARTOON.colors;
const I = IRONJAW_CARTOON.colors;
const T = TANGLE_CARTOON.colors;

// ---------------------------------------------------------------- CACKLEJACK

/** His porcelain face: a long chin, a grin that never stops, acid-green diamond eyes (variants: grin, cackle, ouch, sly). */
function cackleFace(p: Paint, v: string): void {
  const skull = p.smooth([-6, -2, -5.4, -9, 0, -11.6, 5.6, -9.6, 7.2, -3, 6, 4, 2.4, 8.4, -1.6, 7, -5, 3]);
  p.shape(skull, { fill: { radial: [-1, -6, 0.5, 0, -1, 11], stops: [[0, 0xffffff], [0.7, C.face], [1, C.faceShade]] }, ink: LINE, shade: C.faceShade, shadeDepth: 1.4 });
  // Diamond eye paint and narrow eyes.
  for (const [x, s] of [[-1.2, 0.8], [4.2, 1]] as const) {
    p.fill(p.poly([x, -8.6 * s, x + 1.8 * s, -5.4, x, -2.4, x - 1.8 * s, -5.4]), 0x6a2aa8, 0.9);
    if (v === 'ouch') p.line([x - 1, -6.4, x + 1, -4.6], LINE * 0.8, INK).line([x - 1, -4.6, x + 1, -6.4], LINE * 0.8, INK);
    else {
      p.fill(p.ellipse(x, -5.4, 1.1 * s, 0.8), 0xffffff);
      p.fill(p.circle(x + 0.3, -5.4, 0.5), v === 'sly' ? C.eye : INK);
      p.glow(x + 0.3, -5.4, 1.6, C.eye, 0.5);
    }
  }
  // The grin: wide, red, full of small teeth; open wide when he cackles.
  const open = v === 'cackle';
  const mouth = open ? p.smooth([-3.6, 0.4, -1, 6.4, 4.2, 6.6, 6.6, 0.4, 2, 2.4, -1.4, 2.2]) : p.smooth([-3.4, 0.6, -1, 3.8, 4, 3.8, 6.4, 0.4, 2, 2, -1.2, 2]);
  if (v === 'ouch') p.shape(p.ellipse(1.4, 2.6, 1.6, 1.4), { fill: C.mouth, ink: LINE * 0.7 });
  else {
    p.shape(mouth, { fill: C.mouth, ink: LINE * 0.8 });
    p.fill(p.rrect(-2.4, open ? 1.6 : 1.4, 7.6, 0.9, 0.3), 0xfffbea);
    if (open) p.fill(p.rrect(-1.2, 5.2, 5.4, 0.8, 0.3), 0xfffbea);
  }
  // A beauty mark of a black diamond, and the red nose.
  p.fill(p.poly([6, -1, 6.6, 0, 6, 1, 5.4, 0]), INK);
  p.shape(p.circle(4.4, -1.6, 1.3), { fill: 0xd8324a, ink: LINE * 0.6 });
}

function cackleHat(p: Paint): void {
  // A crooked top hat with a green band and a spring poking out of the top.
  const crown = p.poly([-5, 0, -4, -13, 5, -15, 6, 0]);
  p.shape(crown, { fill: C.hat, ink: LINE, shade: 0x120a1a, shadeDepth: 1 });
  p.fill(p.rrect(-4.8, -4, 11, 2.4, 0), C.band);
  p.shape(p.ellipse(0.6, 0, 8.4, 1.8), { fill: C.hat, ink: LINE });
  const spring: number[] = [];
  for (let i = 0; i <= 6; i++) spring.push(0.5 + (i % 2 ? 1.6 : -1.6), -15 - i * 1.2);
  p.line(spring, 0.8, 0xc8c0d0);
}

function cackleCoat(p: Paint): void {
  // A long tailcoat in purple and acid-green diamonds, a white ruff at the neck.
  const coat = p.smooth([-6, 0, -7, -14, -4, -24, 4, -24, 7, -14, 7, 0, 9, 8, 3, 4, -3, 4, -9, 8]);
  p.shape(coat, { fill: C.coatA, ink: LINE, shade: C.coatDark, shadeDepth: 1.6 });
  p.within(coat, () => {
    for (let y = -24; y < 10; y += 6) for (let x = -10 + ((y / 6) % 2 ? 3 : 0); x < 12; x += 6) p.fill(p.poly([x, y, x + 3, y + 3, x, y + 6, x - 3, y + 3]), C.coatB, 0.85);
  });
  p.shape(p.smooth([-5, -24, -2, -21, 1, -24, 4, -21, 6, -24, 0, -27]), { fill: 0xffffff, ink: LINE * 0.7 });
  for (const y of [-18, -12]) p.shape(p.circle(1, y, 0.9), { fill: 0xf2c24a, ink: LINE * 0.4 });
}

function cackleArm(p: Paint): void {
  p.shape(p.capsule(0, 0, 1.6, 0, 11, 1.3), { fill: C.coatA, ink: LINE * 0.8 });
  // Long white-gloved fingers.
  p.shape(p.ellipse(0, 12.6, 1.8, 2.2), { fill: C.glove, ink: LINE * 0.7 });
  for (const dx of [-1.2, 0, 1.2]) p.line([dx, 13.6, dx * 1.6, 17], 0.9, INK).line([dx, 13.6, dx * 1.6, 17], 0.5, C.glove);
}

function cackleLeg(p: Paint): void {
  p.shape(p.capsule(0, 0, 1.6, 0, 14, 1.2), { fill: 0x1e1030, ink: LINE * 0.8 });
  p.shape(p.smooth([-1.6, 15.6, 0, 14, 6, 14.4, 8, 15.2, 6.4, 16.6, -1.6, 16.6]), { fill: 0x0e0816, ink: LINE * 0.7, gloss: { x: 3, y: 14.8, rx: 2, ry: 0.6 } });
}

function cackleCane(p: Paint, v: string): void {
  // A gold-topped cane; as a pogo stick, a spring at its foot.
  p.shape(p.rrect(-0.6, 0, 1.2, 22, 0.5), { fill: C.cane, ink: LINE * 0.6 });
  p.shape(p.circle(0, -0.4, 1.6), { fill: 0xfff0a0, ink: LINE * 0.6 });
  if (v === 'pogo') {
    const spring: number[] = [];
    for (let i = 0; i <= 8; i++) spring.push(i % 2 ? 1.6 : -1.6, 22 + i * 1);
    p.line(spring, 0.8, 0xc8c0d0);
    p.fill(p.rrect(-2, 30, 4, 1.4, 0.5), INK);
  }
}

const armsDown = (p: Pose, a = 6) => p.set('armF', a).set('armB', -a);

export function cacklejackRig(): RigDef {
  const walk = (t: number, p: Pose) => {
    const s = wave(t);
    p.set('legF', s * 22).set('legB', -s * 22).set('armF', -s * 18 + 10).set('armB', s * 18).move('coat', 0, -Math.abs(Math.cos(t * TAU)) * 1.2).set('coat', 6);
    p.set('cane', -20 + s * 10).set('head', s * 4);
  };
  return {
    id: 'cacklejack',
    parts: [
      { id: 'coat', w: 22, h: 38, px: 11, py: 28, draw: cackleCoat },
      { id: 'head', w: 18, h: 22, px: 7, py: 13, variants: ['grin', 'blink', 'cackle', 'ouch', 'sly'], draw: (p, v) => cackleFace(p, v) },
      { id: 'hat', w: 20, h: 26, px: 9, py: 23, draw: cackleHat },
      { id: 'arm', w: 6, h: 20, px: 3, py: 2, draw: cackleArm },
      { id: 'leg', w: 12, h: 19, px: 3, py: 1, draw: cackleLeg },
      { id: 'cane', w: 6, h: 34, px: 3, py: 2, variants: ['cane', 'pogo'], draw: (p, v) => cackleCane(p, v) },
    ],
    bones: [
      { id: 'coat', x: 0, y: -16, part: 'coat', z: 20, dir: 1 },
      { id: 'legB', parent: 'coat', x: -2, y: 0, part: 'leg', z: 8, dir: -1 },
      { id: 'legF', parent: 'coat', x: 2, y: 0, part: 'leg', z: 24, dir: -1 },
      { id: 'armB', parent: 'coat', x: -3, y: -22, part: 'arm', z: 10, dir: -1 },
      { id: 'head', parent: 'coat', x: 1, y: -27, part: 'head', z: 30, dir: 1, blink: true },
      { id: 'hat', parent: 'head', x: 0, y: -10.4, part: 'hat', z: 32, dir: 1 },
      { id: 'armF', parent: 'coat', x: 3.6, y: -22, part: 'arm', z: 40, dir: -1 },
      { id: 'cane', parent: 'armF', x: 0, y: 13, part: 'cane', z: 39, dir: -1 },
    ],
    fallback: 'idle',
    alias: { talk: 'idle' },
    bounds: { left: -20, right: 22, top: -66, bottom: 6 },
    clips: {
      idle: { ms: 1400, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.set('coat', s * 4).set('head', -s * 6).set('hat', s * 8);
        armsDown(p, 14 + s * 6);
        p.set('cane', -10 + wave(t * 2) * 25).set('legF', 6).set('legB', -6);
      } },
      walk: { ms: 900, loop: true, pose: walk },
      laugh: { ms: 600, loop: true, pose: (t, p) => {
        const s = Math.abs(wave(t * 2));
        p.set('coat', -10 - s * 6).set('head', -18 - s * 6).show('head', 'cackle').set('hat', -10).move('hat', 0, -s * 2);
        p.set('armF', 60 + s * 20).set('armB', 50).set('legF', 6).set('legB', -6).set('cane', -40);
      } },
      bow: { ms: 900, loop: false, pose: (t, p) => {
        const k = Math.min(1, t * 2);
        p.set('coat', 50 * k).set('head', 10 * k).show('head', 'sly').set('armF', 90 * k).set('armB', -40 * k).move('hat', 6 * k, 4 * k).set('hat', -30 * k).set('legF', 10).set('legB', -14);
      } },
      throw: { ms: 380, loop: false, pose: (t, p) => {
        p.set('armF', 170 - t * 230).set('coat', -8 + 18 * t).set('head', 6).show('head', 'sly').set('armB', -30).set('cane', -20);
      } },
      pogo: { ms: 500, loop: true, pose: (t, p) => {
        // Both hands on the cane under him, knees tucked, the spring doing the work.
        const s = Math.abs(wave(t));
        p.show('cane', 'pogo').set('armF', 20).set('armB', 30).set('cane', -20).set('legF', 70).set('legB', 50).move('coat', 0, -2 - s * 2).set('head', -8).show('head', 'cackle');
      } },
      swing: { ms: 1600, loop: true, pose: (t, p) => {
        // Upside down by his knees from a trapeze bar.
        const s = wave(t);
        p.set('coat', 180 + s * 16).move('coat', 0, -30).set('legF', 120).set('legB', 120).set('armF', 160 + s * 20).set('armB', 150 - s * 20).set('head', 0).show('head', 'cackle');
      } },
      hurt: { ms: 300, loop: false, pose: (_t, p) => {
        p.set('coat', -16).set('head', -14).show('head', 'ouch').set('hat', -24).move('hat', -2, -3).set('armF', -50).set('armB', -60);
      } },
      inflate: { ms: 900, loop: false, pose: (t, p) => {
        p.size('coat', 1 + t * 0.4, 1 + t * 0.2).size('head', 1 + t * 0.6).show('head', 'cackle').set('armF', 80 * t).set('armB', 80 * t);
      } },
      defeat: { ms: 800, loop: false, pose: (t, p) => {
        const k = Math.min(1, t * 1.6);
        p.size('coat', 1 - 0.3 * k, 1 - 0.5 * k).move('coat', 0, 8 * k).set('coat', -60 * k).show('head', 'ouch').set('armF', 90).set('armB', 80).move('hat', 10 * k, 6 * k).set('hat', 70 * k);
      } },
    },
  };
}

// ---------------------------------------------------------------- The big head (stage 3)

/**
 * Cacklejack blown up into a giant balloon of his own face (game px: about 9 tiles across at full size; the boss
 * scales it as it fills). Parts: the balloon, the jaw that drops open on his laugh, the valve deep in the throat.
 */
export function bigHeadRig(): RigDef {
  const R = 72;
  const balloon = (p: Paint) => {
    const face = p.smooth([-R, 0, -R * 0.9, -R * 0.9, 0, -R * 1.2, R * 0.9, -R * 0.9, R, 0, R * 0.75, R * 0.55, 0, R * 0.7, -R * 0.75, R * 0.55]);
    p.shape(face, { fill: { radial: [-R * 0.3, -R * 0.5, 4, 0, -R * 0.2, R * 1.2], stops: [[0, 0xffffff], [0.6, C.face], [1, C.faceShade]] }, ink: LINE * 2, shade: C.faceShade, shadeDepth: 8, gloss: { x: -R * 0.4, y: -R * 0.7, rx: R * 0.22, ry: R * 0.12, alpha: 0.6 } });
    for (const s of [-1, 1]) {
      p.fill(p.poly([s * R * 0.4, -R * 0.85, s * R * 0.6, -R * 0.45, s * R * 0.4, -R * 0.08, s * R * 0.2, -R * 0.45]), 0x6a2aa8, 0.9);
      p.fill(p.ellipse(s * R * 0.4, -R * 0.45, R * 0.1, R * 0.07), 0xffffff);
      p.fill(p.circle(s * R * 0.4, -R * 0.45, R * 0.045), INK);
      p.glow(s * R * 0.4, -R * 0.45, R * 0.14, C.eye, 0.5);
    }
    p.shape(p.circle(0, -R * 0.16, R * 0.13), { fill: 0xd8324a, ink: LINE * 1.4, gloss: { x: -R * 0.04, y: -R * 0.22, rx: R * 0.04, ry: R * 0.025 } });
    // The knot at the bottom, and a patch.
    p.shape(p.poly([-6, R * 0.68, 6, R * 0.68, 0, R * 0.8]), { fill: C.faceShade, ink: LINE });
    p.fill(p.rrect(R * 0.5, -R * 0.2, 14, 10, 2), 0xd8c8e0).line([R * 0.5 + 2, -R * 0.2 + 5, R * 0.5 + 12, -R * 0.2 + 5], 0.6, INK);
  };
  const jaw = (p: Paint, v: string) => {
    // The grin: closed, or dropped open on the laugh with the throat (red) behind.
    const open = v === 'open';
    if (open) p.shape(p.ellipse(0, 10, R * 0.42, R * 0.3), { fill: { radial: [0, 6, 2, 0, 10, R * 0.4], stops: [[0, 0xff5a5a], [1, 0x3a0612]] }, ink: LINE * 1.6 });
    const lips = open ? p.smooth([-R * 0.5, 0, -R * 0.42, R * 0.32, 0, R * 0.42, R * 0.42, R * 0.32, R * 0.5, 0, R * 0.3, R * 0.2, 0, R * 0.26, -R * 0.3, R * 0.2]) : p.smooth([-R * 0.5, 0, -R * 0.3, R * 0.18, R * 0.3, R * 0.18, R * 0.5, 0, R * 0.3, R * 0.08, -R * 0.3, R * 0.08]);
    p.shape(lips, { fill: C.mouth, ink: LINE * 1.6 });
    p.fill(p.rrect(-R * 0.34, open ? 2 : R * 0.07, R * 0.68, 4, 1), 0xfffbea);
  };
  const valve = (p: Paint) => {
    p.glow(0, 0, 10, 0xff5a5a, 0.6);
    p.shape(p.circle(0, 0, 5), { fill: { radial: [-1.4, -1.4, 0.4, 0, 0, 5], stops: [[0, 0xfff0a0], [1, 0xc8941a]] }, ink: LINE });
    p.line([-3, 0, 3, 0], 1, INK).line([0, -3, 0, 3], 1, INK);
  };
  return {
    id: 'bighead',
    parts: [
      { id: 'balloon', w: R * 2 + 8, h: R * 2.1, px: R + 4, py: R * 1.25, draw: balloon },
      { id: 'jaw', w: R * 1.1, h: R * 0.8, px: R * 0.55, py: R * 0.1, variants: ['shut', 'open'], draw: (p, v) => jaw(p, v) },
      { id: 'valve', w: 22, h: 22, px: 11, py: 11, draw: valve },
    ],
    bones: [
      { id: 'balloon', x: 0, y: 0, part: 'balloon', z: 10, dir: 1 },
      { id: 'valve', parent: 'balloon', x: 0, y: R * 0.24, part: 'valve', z: 11, dir: 1 },
      { id: 'jaw', parent: 'balloon', x: 0, y: R * 0.12, part: 'jaw', z: 12, dir: 1 },
    ],
    fallback: 'shut',
    bounds: { left: -R - 4, right: R + 4, top: -R * 1.25, bottom: R * 0.9 },
    clips: {
      shut: { ms: 1200, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.size('balloon', 1 + s * 0.015, 1 - s * 0.015).hidden('valve');
      } },
      quiver: { ms: 260, loop: true, pose: (t, p) => {
        // The tell: the lips quiver and a red glow shows inside.
        p.move('jaw', wave(t * 2) * 1.2, 0).size('jaw', 1 + wave(t) * 0.04).hidden('valve');
      } },
      open: { ms: 1000, loop: true, pose: (t, p) => {
        p.show('jaw', 'open').size('balloon', 1 + wave(t * 3) * 0.02).move('valve', 0, 6);
      } },
      pop: { ms: 900, loop: false, pose: (t, p) => {
        p.show('jaw', 'open').size('balloon', 1 - t * 0.8, 1 - t * 0.85).set('balloon', t * 540).hidden('valve');
      } },
    },
  };
}

// ---------------------------------------------------------------- IRONJAW

export function ironjawRig(): RigDef {
  const torso = (p: Paint) => {
    // A barrel chest in a striped singlet, a wide belt with a gold buckle.
    const chest = p.smooth([-10, 0, -12, -14, -9, -26, 9, -26, 12, -14, 10, 0]);
    p.shape(chest, { fill: I.skin, ink: LINE, shade: I.skinShade, shadeDepth: 2 });
    const singlet = p.smooth([-9, 0, -10, -14, -6, -22, 6, -22, 10, -14, 9, 0]);
    p.shape(singlet, { fill: I.singletB, ink: LINE * 0.8 });
    p.within(singlet, () => {
      for (let y = -22; y < 0; y += 5) p.fill(p.rrect(-12, y, 24, 2.4, 0), I.singletA);
    });
    p.shape(p.rrect(-10, -2, 20, 5, 1), { fill: I.belt, ink: LINE });
    p.shape(p.rrect(-3, -2, 6, 5, 1), { fill: I.buckle, ink: LINE * 0.6 });
  };
  const head = (p: Paint, v: string) => {
    p.shape(p.ellipse(0, -5, 6.4, 7), { fill: I.skin, ink: LINE, shade: I.skinShade, shadeDepth: 1.2 });
    // The iron jaw plate, bolted on.
    p.shape(p.smooth([-6, -1, 6.8, -1, 7.4, 3, 4, 5.6, -4, 5.4, -6.4, 2.6]), { fill: { linear: [0, -1, 0, 5.6], stops: [[0, I.ironLight], [1, I.iron]] }, ink: LINE });
    for (const x of [-4, 0, 4]) p.fill(p.circle(x, 1.6, 0.6), 0x4a4a5a);
    // A topknot, heavy brows, small determined eyes.
    p.shape(p.ellipse(-1, -12.8, 2.2, 1.6), { fill: I.hair, ink: LINE * 0.7 });
    p.line([-1, -11.4, -1, -12], 1, I.hair);
    p.line([0.6, -8, 5.4, -7.4], 1.2, I.hair);
    if (v === 'dazed') p.line([2, -6, 4.4, -5], 0.8, INK).line([2, -5, 4.4, -6], 0.8, INK);
    else p.fill(p.circle(3.4, -5.6, 0.8), INK);
  };
  const arm = (p: Paint) => {
    p.shape(p.capsule(0, 0, 3.6, 0.6, 12, 3), { fill: I.skin, ink: LINE, shade: I.skinShade, shadeDepth: 1.2 });
    p.shape(p.circle(0.6, 14, 3.4), { fill: I.skin, ink: LINE });
  };
  const leg = (p: Paint) => {
    p.shape(p.capsule(0, 0, 3.4, 0, 10, 2.8), { fill: I.singletA, ink: LINE });
    p.shape(p.smooth([-3, 12, 0, 10.4, 6, 11, 7, 13, -3, 13.4]), { fill: 0x2a1a14, ink: LINE * 0.8 });
  };
  return {
    id: 'ironjaw',
    parts: [
      { id: 'torso', w: 28, h: 32, px: 14, py: 28, draw: torso },
      { id: 'head', w: 18, h: 22, px: 8, py: 16, variants: ['grim', 'dazed'], draw: (p, v) => head(p, v) },
      { id: 'arm', w: 10, h: 20, px: 4, py: 3, draw: arm },
      { id: 'leg', w: 12, h: 16, px: 4, py: 2, draw: leg },
    ],
    bones: [
      { id: 'torso', x: 0, y: -13, part: 'torso', z: 20, dir: 1 },
      { id: 'legB', parent: 'torso', x: -4, y: 1, part: 'leg', z: 8, dir: -1 },
      { id: 'legF', parent: 'torso', x: 4, y: 1, part: 'leg', z: 24, dir: -1 },
      { id: 'armB', parent: 'torso', x: -9, y: -22, part: 'arm', z: 10, dir: -1 },
      { id: 'head', parent: 'torso', x: 1, y: -25, part: 'head', z: 30, dir: 1 },
      { id: 'armF', parent: 'torso', x: 9, y: -22, part: 'arm', z: 40, dir: -1 },
    ],
    fallback: 'idle',
    alias: { talk: 'idle' },
    bounds: { left: -24, right: 24, top: -56, bottom: 2 },
    clips: {
      idle: { ms: 1500, loop: true, pose: (t, p) => {
        // Flexing: arms up and in, the chest swelling.
        const s = wave(t);
        p.set('armF', 120 + s * 10).set('armB', 110 - s * 10).size('torso', 1 + s * 0.02).set('head', s * 3).set('legF', 8).set('legB', -8);
      } },
      walk: { ms: 800, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.set('legF', s * 22).set('legB', -s * 22).set('armF', -s * 14 + 10).set('armB', s * 14).move('torso', 0, -Math.abs(Math.cos(t * TAU)) * 2).set('torso', 4);
      } },
      throw: { ms: 500, loop: false, pose: (t, p) => {
        const k = t < 0.5 ? t * 2 : 1;
        p.set('armF', t < 0.5 ? 160 * k : 160 - (t - 0.5) * 2 * 220).set('torso', t < 0.5 ? -10 * k : 14).set('armB', -20).set('legF', 14).set('legB', -16);
      } },
      stomp: { ms: 600, loop: false, pose: (t, p) => {
        const up = t < 0.55;
        p.set('legF', up ? 70 * (t / 0.55) : 70 - 70 * Math.min(1, (t - 0.55) * 6)).set('torso', up ? -6 : 8).set('armF', 60).set('armB', 50);
      } },
      carry: { ms: 900, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.set('armF', 170 + s * 4).set('armB', 175 - s * 4).set('legF', s * 18).set('legB', -s * 18).set('head', -4);
      } },
      dazed: { ms: 1200, loop: true, pose: (t, p) => {
        p.set('torso', -90).move('torso', -6, 9).show('head', 'dazed').set('head', wave(t) * 10).set('armF', 70).set('armB', 50).set('legF', 40).set('legB', 20);
      } },
    },
  };
}

// ---------------------------------------------------------------- THE TANGLE

export function tangleRig(): RigDef {
  const body = (p: Paint) => {
    const leo = p.smooth([-4, 0, -5, -10, -3, -18, 3, -18, 5, -10, 4, 0]);
    p.shape(leo, { fill: T.leoA, ink: LINE });
    p.within(leo, () => {
      for (let i = -4; i < 6; i++) p.fill(p.poly([i * 3, -20, i * 3 + 1.6, -20, i * 3 + 8, 2, i * 3 + 6.4, 2]), T.leoB, 0.9);
    });
  };
  const head = (p: Paint, v: string) => {
    p.shape(p.ellipse(0, -4.4, 4.4, 5), { fill: T.skin, ink: LINE, shade: shadeOf(T.skin, 0.2), shadeDepth: 0.8 });
    p.shape(p.smooth([-4.6, -6, -3.6, -10.6, 2, -10.6, 4.6, -7.6, 1, -8.6, -2, -7]), { fill: T.hair, ink: LINE * 0.8 });
    // A domino mask, a sly smile.
    p.shape(p.smooth([-3.4, -5.6, 0, -6.6, 4.4, -5.8, 4.2, -3.6, 0.6, -4.2, -3.2, -3.4]), { fill: T.mask, ink: LINE * 0.6 });
    p.fill(p.ellipse(2.6, -4.8, 0.9, 0.6), v === 'dazed' ? 0x8a8a9a : 0xffffff);
    p.line([0.8, -1.4, 2.4, -0.8, 3.6, -1.6], LINE * 0.6, INK, true);
  };
  // A limb that stretches: drawn as one long taffy tube; the clip stretches its bone.
  const limb = (color: number, len: number) => (p: Paint) => {
    p.shape(p.capsule(0, 0, 1.3, 0, len, 1.1), { fill: color, ink: LINE * 0.8 });
    p.shape(p.circle(0, len + 1.2, 1.5), { fill: T.skin, ink: LINE * 0.6 });
  };
  return {
    id: 'tangle',
    parts: [
      { id: 'body', w: 18, h: 24, px: 9, py: 20, draw: body },
      { id: 'head', w: 12, h: 16, px: 6, py: 12, variants: ['sly', 'dazed'], draw: (p, v) => head(p, v) },
      { id: 'arm', w: 5, h: 15, px: 2.5, py: 2, draw: limb(T.skin, 11) },
      { id: 'leg', w: 5, h: 17, px: 2.5, py: 2, draw: limb(T.leoA, 13) },
    ],
    bones: [
      { id: 'body', x: 0, y: -14, part: 'body', z: 20, dir: 1 },
      { id: 'legB', parent: 'body', x: -2, y: 0, part: 'leg', z: 8, dir: -1 },
      { id: 'legF', parent: 'body', x: 2, y: 0, part: 'leg', z: 24, dir: -1 },
      { id: 'armB', parent: 'body', x: -3, y: -16, part: 'arm', z: 10, dir: -1 },
      { id: 'head', parent: 'body', x: 0.5, y: -18, part: 'head', z: 30, dir: 1 },
      { id: 'armF', parent: 'body', x: 3, y: -16, part: 'arm', z: 40, dir: -1 },
    ],
    fallback: 'idle',
    alias: { talk: 'idle' },
    bounds: { left: -20, right: 60, top: -44, bottom: 2 },
    clips: {
      idle: { ms: 2000, loop: true, pose: (t, p) => {
        // Twisting into a knot and out again.
        const s = wave(t);
        p.set('body', s * 20).set('head', -s * 30).set('armF', 90 + s * 70).set('armB', -90 - s * 70).set('legF', s * 40).set('legB', -s * 40);
      } },
      swing: { ms: 1600, loop: true, pose: (t, p) => {
        // Hanging by her hands from a bar overhead, legs together, swinging.
        const s = wave(t);
        p.set('armF', 180).set('armB', 180).set('body', s * 20).set('legF', -s * 10).set('legB', -s * 10).move('body', 0, 12);
      } },
      reach: { ms: 500, loop: false, pose: (t, p) => {
        // The arm out long (stretched along its bone) toward the floor in front.
        p.set('armF', 60).size('armF', 1, 1 + t * 3.4).set('body', 8).set('head', 6);
      } },
      grab: { ms: 400, loop: false, pose: (t, p) => {
        p.set('armF', 60 + t * 40).size('armF', 1, 4.4 - t * 3.4).set('body', -6).set('head', -6);
      } },
      dazed: { ms: 1200, loop: true, pose: (t, p) => {
        p.set('body', 70).move('body', 4, 10).show('head', 'dazed').set('armF', 200 + wave(t) * 20).set('armB', -160).set('legF', 120).set('legB', -100);
      } },
    },
  };
}
