import { GRINNER_CARTOON, HOUND_CARTOON, JACKBOX_CARTOON, STILTS_CARTOON } from '../../../../../config/cartoon/circus';
import { INK, LINE, shadeOf, type Paint } from '../../paint';
import { TAU, wave, type Pose, type RigDef } from '../../rig';

/**
 * Chapter 8's goons and traps as HD rigs (original designs, painted in code):
 * the grinner, the jack-in-the-box, the balloon hound and the stilt walker.
 */

const G = GRINNER_CARTOON.colors;
const J = JACKBOX_CARTOON.colors;
const H = HOUND_CARTOON.colors;
const S = STILTS_CARTOON.colors;

/** A round clown face with a painted-on grin and diamond eyes (shared by the grinner and the stilt walker). */
function clownFace(p: Paint, r: number, face: number, hat: number | null, hair: number | null, mood: 'grin' | 'ouch'): void {
  if (hair !== null) for (const s of [-1, 1]) p.shape(p.circle(s * r * 0.9, -r * 0.1, r * 0.45), { fill: hair, ink: LINE * 0.8 });
  p.shape(p.circle(0, 0, r), { fill: { radial: [-r * 0.3, -r * 0.35, 0.5, 0, 0, r], stops: [[0, 0xffffff], [1, face]] }, ink: LINE, shade: shadeOf(face, 0.18), shadeDepth: r * 0.18 });
  // Diamond eye paint, small black eyes, a red nose, the grin.
  for (const s of [-1, 1]) {
    p.fill(p.poly([s * r * 0.38, -r * 0.62, s * r * 0.56, -r * 0.3, s * r * 0.38, -r * 0.02, s * r * 0.2, -r * 0.3]), 0x6a2aa8, 0.85);
    p.fill(p.circle(s * r * 0.38 + r * 0.06, -r * 0.3, r * 0.1), INK);
  }
  p.shape(p.circle(r * 0.12, r * 0.05, r * 0.2), { fill: 0xd8324a, ink: LINE * 0.6 });
  if (mood === 'grin') {
    p.shape(p.smooth([-r * 0.62, r * 0.28, -r * 0.3, r * 0.68, r * 0.36, r * 0.68, r * 0.66, r * 0.26, r * 0.3, r * 0.44, -r * 0.3, r * 0.46]), { fill: 0x8a0a2a, ink: LINE * 0.8 });
    p.fill(p.rrect(-r * 0.34, r * 0.44, r * 0.68, r * 0.12, r * 0.04), 0xfffbea);
  } else {
    p.shape(p.ellipse(r * 0.04, r * 0.48, r * 0.2, r * 0.16), { fill: 0x8a0a2a, ink: LINE * 0.8 });
  }
  if (hat !== null) {
    p.shape(p.rrect(-r * 0.52, -r * 1.36, r * 1.04, r * 0.58, r * 0.12), { fill: hat, ink: LINE * 0.8 });
    p.shape(p.ellipse(0, -r * 0.8, r * 0.82, r * 0.16), { fill: hat, ink: LINE * 0.8 });
    p.fill(p.rrect(-r * 0.52, -r * 0.96, r * 1.04, r * 0.14, 0), 0x9aff3a);
  }
}

// ---------------------------------------------------------------- The grinner

export function grinnerRig(): RigDef {
  const body = (p: Paint) => {
    // A baggy two-tone suit split down the middle, big buttons.
    const suit = p.smooth([-7, 0, -8, -9, -5, -15, 5, -15, 8, -9, 7, 0]);
    p.shape(suit, { fill: G.suitA, ink: LINE, shade: shadeOf(G.suitA, 0.3), shadeDepth: 1.4 });
    p.within(suit, () => p.fill(p.rrect(0, -16, 9, 17, 0), G.suitB));
    for (const y of [-11, -6]) p.shape(p.circle(0, y, 1.1), { fill: 0xffe08a, ink: LINE * 0.5 });
    p.shape(p.smooth([-4, -15, 0, -13, 4, -15, 0, -17]), { fill: 0xffffff, ink: LINE * 0.6 });
  };
  const head = (p: Paint, v: string) => clownFace(p, 6.6, G.face, G.hat, 0xff8a2a, v === 'ouch' ? 'ouch' : 'grin');
  const arm = (p: Paint, far: boolean) => {
    p.shape(p.capsule(0, 0, 1.8, 0, 7, 1.6), { fill: far ? G.suitB : G.suitA, ink: LINE * 0.8 });
    p.shape(p.circle(0, 8.4, 2.4), { fill: G.glove, ink: LINE * 0.8 });
  };
  const leg = (p: Paint) => {
    p.shape(p.capsule(0, 0, 2, 0, 5, 1.8), { fill: G.suitB, ink: LINE * 0.8 });
    p.shape(p.smooth([-2.4, 6.4, 0, 4.8, 6.6, 5.6, 7.4, 7.4, -2.4, 7.6]), { fill: G.shoe, ink: LINE * 0.8, gloss: { x: 3, y: 5.4, rx: 2, ry: 0.8 } });
  };
  const pie = (p: Paint) => {
    p.shape(p.ellipse(0, 1.2, 4.6, 1.8), { fill: 0xb88a4a, ink: LINE * 0.6 });
    p.shape(p.smooth([-4, 0.6, -2.6, -2.6, 0, -3.4, 2.6, -2.6, 4, 0.6]), { fill: 0xfff8ee, ink: LINE * 0.6 });
    p.fill(p.circle(0, -3.4, 1), 0xd8324a);
  };
  const walkPose = (t: number, p: Pose) => {
    const s = wave(t);
    p.set('legF', s * 24).set('legB', -s * 24).set('armF', -s * 20).set('armB', s * 20).move('body', 0, -Math.abs(Math.cos(t * TAU)) * 1).set('body', 3);
    p.hidden('pie');
  };
  return {
    id: 'grinner',
    parts: [
      { id: 'body', w: 20, h: 20, px: 10, py: 17, draw: body },
      { id: 'head', w: 18, h: 22, px: 9, py: 12, variants: ['grin', 'ouch'], draw: head },
      { id: 'armF', w: 7, h: 13, px: 3, py: 2, draw: (p) => arm(p, false) },
      { id: 'armB', w: 7, h: 13, px: 3, py: 2, draw: (p) => arm(p, true) },
      { id: 'leg', w: 12, h: 10, px: 3, py: 1, draw: leg },
      { id: 'pie', w: 12, h: 8, px: 6, py: 4, draw: pie },
    ],
    bones: [
      { id: 'body', x: 0, y: -7, part: 'body', z: 20, dir: 1 },
      { id: 'legB', parent: 'body', x: -2.6, y: 0, part: 'leg', z: 8, dir: -1 },
      { id: 'legF', parent: 'body', x: 2.6, y: 0, part: 'leg', z: 24, dir: -1 },
      { id: 'armB', parent: 'body', x: -5, y: -13, part: 'armB', z: 10, dir: -1 },
      { id: 'head', parent: 'body', x: 0.6, y: -21, part: 'head', z: 30, dir: 1 },
      { id: 'armF', parent: 'body', x: 5, y: -13, part: 'armF', z: 40, dir: -1 },
      { id: 'pie', parent: 'armF', x: 0, y: 10, part: 'pie', z: 41, dir: -1 },
    ],
    fallback: 'idle',
    bounds: { left: -14, right: 16, top: -38, bottom: 2 },
    clips: {
      idle: { ms: 900, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.set('body', s * 4).set('head', s * 6).set('armF', 10 + s * 8).set('armB', -10 - s * 8).move('body', 0, -Math.abs(s) * 0.8);
        p.hidden('pie');
      } },
      walk: { ms: 560, loop: true, pose: walkPose },
      windup: { ms: 600, loop: false, pose: (t, p) => {
        // The pie up over his head and back: he leans into it.
        p.set('armF', 150 + t * 30).set('body', -10 * t).set('head', -8).set('armB', -20).set('legF', 10).set('legB', -10);
        p.hidden('pie', false);
      } },
      throw: { ms: 340, loop: false, pose: (t, p) => {
        p.set('armF', 180 - t * 230).set('body', 14 * t).set('head', 6).set('armB', -30).set('legF', 18).set('legB', -14);
        p.hidden('pie', t > 0.3);
      } },
      hurt: { ms: 300, loop: false, pose: (_t, p) => {
        p.set('body', -14).set('head', -10).show('head', 'ouch').set('armF', -50).set('armB', -60).hidden('pie');
      } },
    },
  };
}

// ---------------------------------------------------------------- The jack-in-the-box

export function jackboxRig(): RigDef {
  const box = (p: Paint) => {
    const b = p.rrect(-9, -16, 18, 16, 1.2);
    p.shape(b, { fill: { linear: [0, -16, 0, 0], stops: [[0, J.boxLight], [1, J.box]] }, ink: LINE, shade: shadeOf(J.box, 0.35), shadeDepth: 1.4 });
    p.within(b, () => {
      p.fill(p.star(0, -8, 4.6, 2, 5), J.trim);
      p.stroke(p.rrect(-7.4, -14.4, 14.8, 12.8, 0.8), J.trim, 0.6);
    });
  };
  const lid = (p: Paint) => {
    p.shape(p.rrect(-10, -2.2, 20, 2.6, 0.8), { fill: J.box, ink: LINE });
    p.fill(p.rrect(-10, -2.2, 20, 0.8, 0.4), J.trim);
  };
  const crank = (p: Paint, v: string) => {
    if (v === 'broken') {
      p.line([0, 0, 2.4, 1], 1.2, INK).line([0, 0, 2.4, 1], 0.7, J.crank);
      return;
    }
    p.line([0, 0, 5, 0, 5, -4], 1.6, INK).line([0, 0, 5, 0, 5, -4], 0.9, J.crank);
    p.shape(p.circle(5, -4.6, 1.2), { fill: 0xd8324a, ink: LINE * 0.6 });
  };
  const jack = (p: Paint) => {
    const pts: number[] = [];
    for (let i = 0; i <= 8; i++) pts.push(Math.sin(i * 1.7) * 2.2, -i * 1.6);
    p.line(pts, 1, J.crank, true);
    clownFace(p, 4.2, J.jack, null, 0x9aff3a, 'grin');
  };
  return {
    id: 'jackbox',
    parts: [
      { id: 'box', w: 22, h: 20, px: 11, py: 18, draw: box },
      { id: 'lid', w: 24, h: 6, px: 12, py: 3, draw: lid },
      { id: 'crank', w: 10, h: 10, px: 2, py: 6, variants: ['ok', 'broken'], draw: (p, v) => crank(p, v) },
      { id: 'jack', w: 12, h: 26, px: 6, py: 18, draw: jack },
    ],
    bones: [
      { id: 'box', x: 0, y: 0, part: 'box', z: 20, dir: 1 },
      { id: 'jack', parent: 'box', x: 0, y: -14, part: 'jack', z: 15, dir: 1 },
      { id: 'lid', parent: 'box', x: -9, y: -16, part: 'lid', z: 30, dir: 1 },
      { id: 'crank', parent: 'box', x: 9, y: -9, part: 'crank', z: 25, dir: 1 },
    ],
    fallback: 'idle',
    bounds: { left: -12, right: 16, top: -40, bottom: 2 },
    clips: {
      idle: { ms: 2000, loop: true, pose: (t, p) => {
        p.hidden('jack').move('lid', 9, 0).set('crank', wave(t) * 10);
      } },
      wind: { ms: 300, loop: true, pose: (t, p) => {
        // The crank going round, the box shivering, the lid bulging.
        p.set('crank', t * 360).set('box', wave(t * 2) * 3).move('box', wave(t * 3) * 0.6, 0);
        p.move('lid', 9, -Math.abs(wave(t * 2)) * 1.4).hidden('jack');
      } },
      pop: { ms: 400, loop: false, pose: (t, p) => {
        const k = Math.min(1, t * 3);
        p.move('lid', 9, 0).set('lid', -110 * k).move('jack', 0, -10 * k + wave(t * 4) * (1 - t) * 3).set('jack', wave(t * 3) * 14 * (1 - t));
      } },
      jammed: { ms: 800, loop: true, pose: (t, p) => {
        p.show('crank', 'broken').move('lid', 9, 0).set('lid', -12 + wave(t) * 4).hidden('jack').set('box', -4);
      } },
    },
  };
}

// ---------------------------------------------------------------- The balloon hound

export function houndRig(): RigDef {
  const seg = (rx: number, ry: number) => (p: Paint) => {
    p.shape(p.ellipse(0, 0, rx, ry), { fill: { radial: [-rx * 0.3, -ry * 0.4, 0.3, 0, 0, Math.max(rx, ry)], stops: [[0, H.balloonLight], [0.5, H.balloon], [1, H.balloonDark]] }, ink: LINE * 0.9 });
    p.fill(p.ellipse(-rx * 0.35, -ry * 0.45, rx * 0.3, ry * 0.2, -0.4), 0xffffff, 0.6);
  };
  const head = (p: Paint) => {
    seg(4.4, 3.2)(p);
    // Ears and a snout knot, and painted eyes.
    p.shape(p.ellipse(-2, -4, 1.8, 3), { fill: H.balloon, ink: LINE * 0.7 });
    p.shape(p.ellipse(5.4, 0.6, 2, 1.6), { fill: H.balloon, ink: LINE * 0.7 });
    p.fill(p.circle(6.8, 0.6, 0.8), H.knot);
    p.fill(p.circle(1.6, -1, 0.9), INK).fill(p.circle(1.4, -1.3, 0.3), 0xffffff);
  };
  return {
    id: 'hound',
    parts: [
      { id: 'body', w: 18, h: 10, px: 9, py: 5, draw: seg(7.6, 3.4) },
      { id: 'head', w: 18, h: 14, px: 6, py: 7, draw: head },
      { id: 'leg', w: 6, h: 10, px: 3, py: 1, draw: (p) => p.shape(p.ellipse(0, 3.6, 1.8, 3.8), { fill: H.balloon, ink: LINE * 0.8 }) },
      { id: 'tail', w: 6, h: 10, px: 3, py: 8, draw: (p) => p.shape(p.ellipse(0, -3.6, 1.6, 3.6), { fill: H.balloonLight, ink: LINE * 0.8 }) },
    ],
    bones: [
      { id: 'body', x: 0, y: -8, part: 'body', z: 20, dir: 1 },
      { id: 'legB', parent: 'body', x: -5, y: 2, part: 'leg', z: 10, dir: -1 },
      { id: 'legB2', parent: 'body', x: 5, y: 2, part: 'leg', z: 10, dir: -1 },
      { id: 'legF', parent: 'body', x: -4, y: 2.4, part: 'leg', z: 26, dir: -1 },
      { id: 'legF2', parent: 'body', x: 6, y: 2.4, part: 'leg', z: 26, dir: -1 },
      { id: 'tail', parent: 'body', x: -7, y: -1, part: 'tail', z: 15, dir: 1 },
      { id: 'head', parent: 'body', x: 7, y: -3, part: 'head', z: 30, dir: 1 },
    ],
    fallback: 'float',
    alias: { idle: 'float' },
    bounds: { left: -14, right: 16, top: -22, bottom: 4 },
    clips: {
      float: { ms: 1200, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.move('body', 0, s * 1.2).set('tail', -30 + wave(t * 3) * 20).set('head', s * 6);
        for (const l of ['legB', 'legB2', 'legF', 'legF2']) p.set(l, wave(t, l.length * 0.1) * 12);
      } },
      stretch: { ms: 500, loop: true, pose: (t, p) => {
        // Stretching long and thin before the swoop: the squeak.
        const k = 0.5 + 0.5 * wave(t * 2);
        p.size('body', 1 + 0.35 * k, 1 - 0.25 * k).move('head', 3 * k, 0).move('tail', -2 * k, 0).set('tail', -60);
        for (const l of ['legB', 'legB2', 'legF', 'legF2']) p.set(l, -20);
      } },
      swoop: { ms: 400, loop: true, pose: (_t, p) => {
        p.size('body', 1.2, 0.85).set('body', 12).set('tail', -80).set('head', -10);
        for (const l of ['legB', 'legB2', 'legF', 'legF2']) p.set(l, -50);
      } },
    },
  };
}

// ---------------------------------------------------------------- The stilt walker

export function stiltsRig(): RigDef {
  const torso = (p: Paint) => {
    const shirt = p.smooth([-5, 0, -6, -10, -4, -16, 4, -16, 6, -10, 5, 0]);
    p.shape(shirt, { fill: S.shirtA, ink: LINE });
    p.within(shirt, () => {
      for (let y = -15; y < 0; y += 4) p.fill(p.rrect(-7, y, 14, 2, 0), S.shirtB);
    });
    p.shape(p.rrect(-5, -1, 10, 4, 1), { fill: S.pants, ink: LINE * 0.8 });
  };
  const head = (p: Paint, v: string) => clownFace(p, 5.6, S.face, null, S.hair, v === 'ouch' ? 'ouch' : 'grin');
  const arm = (p: Paint) => {
    p.shape(p.capsule(0, 0, 1.4, 0, 10, 1.2), { fill: S.shirtA, ink: LINE * 0.7 });
    p.shape(p.circle(0, 11, 1.8), { fill: 0xffffff, ink: LINE * 0.7 });
  };
  const stilt = (p: Paint, far: boolean) => {
    // Baggy trouser leg over a long wooden pole, a tiny shoe at its foot.
    p.shape(p.rrect(-2.4, 0, 4.8, 10, 1.6), { fill: far ? shadeOf(S.pants, 0.3) : S.pants, ink: LINE * 0.8 });
    p.shape(p.rrect(-1, 9, 2, 26, 0.6), { fill: far ? S.stiltDark : S.stilt, ink: LINE * 0.7 });
    p.shape(p.smooth([-2, 35, 0, 34, 3.4, 34.6, 3.6, 36, -2, 36.2]), { fill: 0xd8324a, ink: LINE * 0.7 });
  };
  return {
    id: 'stilts',
    parts: [
      { id: 'torso', w: 16, h: 22, px: 8, py: 18, draw: torso },
      { id: 'head', w: 16, h: 16, px: 8, py: 8, variants: ['grin', 'ouch'], draw: head },
      { id: 'arm', w: 6, h: 16, px: 3, py: 2, draw: arm },
      { id: 'stiltF', w: 10, h: 40, px: 3, py: 2, draw: (p) => stilt(p, false) },
      { id: 'stiltB', w: 10, h: 40, px: 3, py: 2, draw: (p) => stilt(p, true) },
    ],
    bones: [
      { id: 'torso', x: 0, y: -36, part: 'torso', z: 20, dir: 1 },
      { id: 'stiltB', parent: 'torso', x: -2, y: 2, part: 'stiltB', z: 8, dir: -1 },
      { id: 'stiltF', parent: 'torso', x: 2, y: 2, part: 'stiltF', z: 24, dir: -1 },
      { id: 'armB', parent: 'torso', x: -4, y: -14, part: 'arm', z: 10, dir: -1 },
      { id: 'head', parent: 'torso', x: 0.6, y: -21, part: 'head', z: 30, dir: 1 },
      { id: 'armF', parent: 'torso', x: 4, y: -14, part: 'arm', z: 40, dir: -1 },
    ],
    fallback: 'walk',
    alias: { idle: 'walk' },
    bounds: { left: -20, right: 22, top: -66, bottom: 2 },
    clips: {
      walk: { ms: 1100, loop: true, pose: (t, p) => {
        const s = wave(t);
        p.set('stiltF', s * 14).set('stiltB', -s * 14).set('armF', -s * 24).set('armB', s * 24).set('torso', s * 3).move('torso', 0, -Math.abs(Math.cos(t * TAU)) * 1.4);
      } },
      windup: { ms: 600, loop: false, pose: (t, p) => {
        p.set('stiltF', -40 * t).set('stiltB', 6).set('torso', 12 * t).set('armF', 60 * t).set('armB', 80 * t).set('head', 8 * t);
      } },
      kick: { ms: 320, loop: false, pose: (t, p) => {
        p.set('stiltF', -40 + 110 * Math.min(1, t * 2)).set('stiltB', -6).set('torso', -10).set('armF', -40).set('armB', -60);
      } },
      topple: { ms: 700, loop: false, pose: (t, p) => {
        // Over like a tree: forward, onto the floor.
        p.set('torso', 90 * Math.min(1, t * 1.4)).move('torso', 6 * t, 30 * Math.min(1, t * 1.4)).show('head', 'ouch');
        p.set('stiltF', -30).set('stiltB', -50).set('armF', 120).set('armB', 100);
      } },
      down: { ms: 900, loop: true, pose: (t, p) => {
        p.set('torso', 90).move('torso', 6, 30).show('head', 'ouch').set('armF', 100 + wave(t) * 30).set('armB', 80 - wave(t) * 30);
        p.set('stiltF', -30 + wave(t) * 8).set('stiltB', -50);
      } },
    },
  };
}
