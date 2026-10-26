import { DEEPMAW_CARTOON } from '../../../../config/cartoon/deepmaw';
import { keyframes } from '../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { RigInfo, wave, type PartSpec, type Pose, type RigDef } from '../rig';

const C = DEEPMAW_CARTOON.colors;

/** The body's centre (from his belly on the floor). */
const CY = -24;

/** The great round body: dark back, warty pale belly, the coat in rags over his back, the broken collar. */
function body(p: Paint): void {
  // Dorsal spines along the back.
  for (let i = 0; i < 4; i++) {
    const x = -16 + i * 7;
    p.shape(p.poly([x - 2.4, CY - 19 + i * 0.6, x + 0.6, CY - 30 + i * 1.6, x + 2.6, CY - 19.6 + i * 0.6]), { fill: C.fin, ink: LINE * 0.8 });
    p.line([x, CY - 20, x + 0.6, CY - 29 + i * 1.6], LINE * 0.5, C.finLight, false, 0.6);
  }
  const shape = p.smooth([-26, CY + 2, -24, CY - 12, -14, CY - 22, 2, CY - 24, 16, CY - 20, 26, CY - 12, 30, CY - 2, 29, CY + 7, 20, CY + 18, 4, CY + 23, -12, CY + 20, -22, CY + 12]);
  p.shape(shape, {
    fill: { radial: [4, CY - 12, 2, 0, CY, 30], stops: [[0, C.skinLight], [0.55, C.skin], [1, C.skinDark]] },
    ink: LINE * 1.3,
    shade: C.skinDark,
    shadeDepth: 3.4,
    light: 0xc8e8d0,
    lightDepth: 1.0,
    lightAlpha: 0.45,
  });
  p.within(shape, () => {
    // The belly: pale and warty.
    p.fill(p.smooth([-20, CY + 14, -6, CY + 4, 14, CY + 4, 28, CY + 6, 22, CY + 18, 4, CY + 24, -14, CY + 22], true, 0.4), { linear: [0, CY + 2, 0, CY + 24], stops: [[0, C.belly], [1, C.bellyDark]] });
    for (const [x, y, r] of [[-8, 10, 1.1], [2, 14, 0.9], [10, 9, 1.0], [-14, 16, 0.8], [16, 15, 0.8], [-20, -4, 1.2], [-6, -14, 1.0], [8, -18, 0.9]] as const) {
      p.fill(p.circle(x, CY + y, r), y > 4 ? C.bellyDark : C.skinDark, 0.7);
      p.fill(p.circle(x - r * 0.3, CY + y - r * 0.3, r * 0.4), 0xffffff, 0.25);
    }
    // The coat in tatters over his back and shoulders, gold buttons and an epaulette.
    const coat = p.smooth([-27, CY + 4, -26, CY - 12, -16, CY - 22, -2, CY - 23, 4, CY - 18, 2, CY - 8, -2, CY + 2, -6, CY + 8, -9, CY + 2, -12, CY + 10, -16, CY + 4, -20, CY + 11, -23, CY + 4], true, 0.35);
    p.shape(coat, { fill: { linear: [-26, CY - 22, 4, CY + 8], stops: [[0, C.coatLight], [0.5, C.coat], [1, C.coatDark]] }, ink: LINE * 0.9, shade: C.coatDark, shadeDepth: 1.2 });
    p.line([-2, CY - 22, 4, CY - 18, 2, CY - 8, -2, CY + 2], LINE * 1.2, C.gold, true, 0.9);
    for (const y of [-14, -6]) p.shape(p.circle(1.0, CY + y, 1.2), { fill: C.gold, ink: LINE * 0.5 });
    p.shape(p.smooth([-10, CY - 21, -2, CY - 23, 1, CY - 19, -4, CY - 17, -10, CY - 18], true, 0.4), { fill: C.gold, ink: LINE * 0.6 });
    for (let i = 0; i < 4; i++) p.line([-9 + i * 2.4, CY - 17.6, -9.6 + i * 2.4, CY - 14.6], LINE * 0.6, C.gold, false, 0.9);
    // The broken stasis collar round his front: a steel band, a sprung clamp, a dead red light.
    p.line([8, CY - 22, 6, CY - 6, 9, CY + 10, 14, CY + 21], 4.2, INK, true);
    p.line([8, CY - 22, 6, CY - 6, 9, CY + 10, 14, CY + 21], 3.0, C.collar, true);
    p.line([8, CY - 21, 6.4, CY - 6, 8.8, CY + 9], 0.8, 0xffffff, true, 0.5);
    p.shape(p.rrect(3.2, CY - 4, 6, 7, 1.4), { fill: { linear: [3, CY - 4, 9, CY + 3], stops: [[0, C.collar], [1, C.collarDark]] }, ink: LINE * 0.7 });
    p.fill(p.circle(6.2, CY - 0.6, 1.1), 0x5a1010);
  });
  // Upper fangs along the jaw line (the snout overhangs them).
  for (let i = 0; i < 7; i++) {
    const x = 12 + i * 2.6;
    const len = 2.4 + (i % 2) * 1.6 + i * 0.25;
    p.shape(p.poly([x - 0.8, CY + 6.8 - i * 0.3, x + 0.8, CY + 6.8 - i * 0.3, x + 0.2, CY + 6.8 - i * 0.3 + len]), { fill: C.teeth, ink: LINE * 0.45 });
  }
}

/** Inside the mouth (only seen when the jaw drops): dark, the gums, a fat tongue. */
function maw(p: Paint): void {
  p.fill(p.poly([0, -2, 26, -4, 22, 12, 2, 6]), C.mouth);
  p.fill(p.ellipse(10, 6, 9, 3.4, -0.1), C.gum, 0.9);
  p.fill(p.ellipse(16, 1, 3, 1.4), 0x000000, 0.5);
}

/** The lower jaw: a huge underbite, its fangs pointing up. */
function jaw(p: Paint): void {
  const j = p.smooth([-2, -1.6, 10, -1.2, 22, -3.6, 30, -6.4, 31, -2, 26, 4, 14, 7, 2, 6, -3, 2]);
  p.shape(j, { fill: { linear: [0, -6, 0, 7], stops: [[0, C.skin], [0.6, C.belly], [1, C.bellyDark]] }, ink: LINE * 1.1, shade: C.skinDark, shadeDepth: 1.2, light: 0xd0e0c0, lightDepth: 0.4, lightAlpha: 0.4 });
  p.within(j, () => p.line([2, 3, 14, 4.6, 26, 0.6], LINE * 0.5, C.bellyDark, true, 0.6));
  for (let i = 0; i < 8; i++) {
    const x = 4 + i * 3.3;
    const base = -1.4 - Math.max(0, i - 4) * 1.1;
    const len = 3.0 + (i % 2) * 2.2 + i * 0.3;
    p.shape(p.poly([x - 0.9, base, x + 0.9, base, x + 0.3, base - len]), { fill: C.teeth, ink: LINE * 0.5 });
  }
}

/** One bulging yellow eye (it spins when he's dazed). */
function eye(p: Paint, v: string): void {
  if (v === 'shut') {
    p.shape(p.circle(0, 0, 4.2), { fill: C.skin, ink: LINE });
    p.line([-3.6, 0.4, 0, 1.6, 3.6, 0.4], LINE * 1.1, INK, true);
    return;
  }
  const r = v === 'wide' ? 4.8 : 4.2;
  p.shape(p.circle(0, 0, r + 0.9), { fill: C.skinDark, ink: LINE });
  const ball = p.circle(0, 0, r);
  p.shape(ball, { fill: { radial: [-1.2, -1.4, 0.3, 0, 0, r], stops: [[0, lightOf(C.eye, 0.5)], [0.65, C.eye], [1, C.eyeDark]] }, ink: LINE * 0.8 });
  p.within(ball, () => {
    if (v === 'dizzy') {
      p.line([0, 0, 1.2, -0.6, 1.4, 1.2, -0.6, 2.0, -2.2, 0.2, -1.4, -2.2, 1.4, -2.8, 3.0, -0.6], LINE * 0.9, INK, true);
      return;
    }
    const px = v === 'angry' ? 1.0 : 0.8;
    p.fill(p.ellipse(px, 0.2, 1.0, r * 0.75), INK);
    p.fill(p.circle(-1.4, -1.8, 0.9), 0xffffff, 0.95);
  });
  // A heavy, scarred brow.
  if (v !== 'wide') p.line([-r - 0.6, -r + (v === 'angry' ? 0.8 : -0.4), r + 0.8, -r - (v === 'angry' ? -2.2 : 0.4)], LINE * 2.0, C.skinDark, true);
  p.line([-1.4, -r - 1.6, 0.6, -r + 1.8], LINE * 0.6, C.skinLight, false, 0.6);
}

/** A lure stalk segment (fleshy, jointed). */
function stalk(p: Paint, x1: number, y1: number, r: number): void {
  p.shape(p.capsule(0, 0, r, x1, y1, r * 0.8), { fill: { linear: [-r, 0, r, 0], stops: [[0, C.skinLight], [1, C.skin]] }, ink: LINE * 0.8 });
}

/** The lure's bulb: dim, glowing, or flaring white (the tell). */
function bulb(p: Paint, v: string): void {
  const k = v === 'flare' ? 1.6 : v === 'glow' ? 1 : 0.45;
  p.glow(0, 0, 9 * k, C.lure, Math.min(1, 0.55 * k));
  const b = p.circle(0, 0, 2.8 + k * 0.4);
  p.shape(b, { fill: { radial: [-0.6, -0.8, 0.2, 0, 0, 3.4], stops: [[0, v === 'flare' ? 0xffffff : C.lureCore], [0.6, v === 'dim' ? shadeOf(C.lure, 0.3) : C.lure], [1, shadeOf(C.lure, 0.4)]] }, ink: LINE * 0.7 });
  if (v === 'flare') p.sparkle(0, 0, 8, 0xffffff, 0.9);
}

/** A ragged pectoral fin. */
function fin(p: Paint, far: boolean): void {
  const f = p.smooth([0, -2.4, -4, 2, -8, 10, -4.6, 12, -2.6, 9.4, -0.6, 12.4, 2, 8.6, 3.6, 2]);
  p.shape(f, { fill: { linear: [0, 0, -4, 12], stops: [[0, far ? C.fin : C.finLight], [1, far ? C.skinDark : C.fin]] }, ink: LINE * 0.9, light: 0xd0f0e0, lightDepth: 0.4, lightAlpha: far ? 0.2 : 0.45 });
  p.within(f, () => {
    for (const x of [-5, -2.4, 0.4]) p.line([0.6, -1, x, 11], LINE * 0.45, C.skinDark, false, 0.6);
  });
}

/** The tail: a stubby stalk and a ragged, notched fluke. */
function tail(p: Paint): void {
  const t = p.smooth([2, -7, -8, -5, -14, -12, -20, -14, -18, -4, -22, 2, -19, 10, -14, 8, -8, 5, 2, 7]);
  p.shape(t, { fill: { linear: [2, 0, -22, 0], stops: [[0, C.skin], [0.5, C.fin], [1, C.finLight]] }, ink: LINE * 1.0, shade: C.skinDark, shadeDepth: 1.0 });
  p.within(t, () => {
    for (const y of [-10, -4, 2, 7]) p.line([-8, 0, -20, y], LINE * 0.5, C.skinDark, false, 0.55);
  });
}

/** The battered tricorn (the lure pokes out through it). */
function hat(p: Paint): void {
  const h = p.smooth([-10, 1.4, -8, -3.4, -4, -6.6, 2, -7.4, 7, -5.6, 10, -1.2, 6, 0.6, 0, -1.0, -5, 0.4]);
  p.shape(h, { fill: { linear: [0, -7.4, 0, 1.4], stops: [[0, 0x4a4656], [1, C.hat]] }, ink: LINE, light: 0x9a96aa, lightDepth: 0.4, lightAlpha: 0.5 });
  p.line([-9, 0.6, -4, -0.8, 0, -1.4, 6, -0.4, 9.4, -1.0], LINE * 0.9, C.gold, true, 0.9);
  // A skull and crossbones.
  p.fill(p.circle(0.6, -4.0, 1.4), 0xf0ecdc);
  p.line([-1.4, -1.8, 2.6, -1.6], LINE * 0.5, 0xf0ecdc);
}

function parts(): PartSpec[] {
  return [
    { id: 'body', w: 62, h: 58, px: 28, py: 52, draw: body },
    { id: 'maw', w: 30, h: 18, px: 2, py: 5, draw: maw },
    { id: 'jaw', w: 36, h: 18, px: 4, py: 9, draw: jaw },
    { id: 'eye', w: 13, h: 13, px: 6.5, py: 6.5, variants: ['open', 'angry', 'wide', 'dizzy', 'shut'], draw: eye },
    { id: 'stalk', w: 12, h: 14, px: 3, py: 11, draw: (p) => stalk(p, 6, -8, 1.6) },
    { id: 'stalk2', w: 14, h: 10, px: 2.5, py: 4, draw: (p) => stalk(p, 8, 2, 1.3) },
    { id: 'bulb', w: 26, h: 26, px: 13, py: 13, variants: ['glow', 'dim', 'flare'], draw: bulb },
    { id: 'finF', w: 16, h: 18, px: 9, py: 4, draw: (p) => fin(p, false) },
    { id: 'finB', w: 16, h: 18, px: 9, py: 4, draw: (p) => fin(p, true) },
    { id: 'tail', w: 28, h: 26, px: 4, py: 14, draw: tail },
    { id: 'hat', w: 24, h: 12, px: 11, py: 9, draw: hat },
  ];
}

/** DEEPMAW's HD rig (Chapter 7's boss). */
export function deepmawRig(): RigDef {
  const draft: RigDef = {
    id: 'deepmaw',
    parts: parts(),
    bones: [
      { id: 'body', x: 0, y: 0, part: 'body', z: 20, dir: 1 },
      { id: 'tail', parent: 'body', x: -24, y: CY - 2, part: 'tail', z: 10, dir: 1 },
      { id: 'finB', parent: 'body', x: -6, y: CY + 8, part: 'finB', z: 8, dir: -1 },
      { id: 'maw', parent: 'body', x: 7, y: CY + 7, part: 'maw', z: 17, dir: 1 },
      { id: 'jaw', parent: 'body', x: 6, y: CY + 8, part: 'jaw', z: 22, dir: 1 },
      { id: 'eye', parent: 'body', x: 16, y: CY - 9, part: 'eye', z: 24, dir: 1 },
      { id: 'hat', parent: 'body', x: -2, y: CY - 21, part: 'hat', z: 26, dir: 1 },
      { id: 'stalk', parent: 'body', x: 6, y: CY - 22, part: 'stalk', z: 27, dir: 1 },
      { id: 'stalk2', parent: 'stalk', x: 6, y: -8, part: 'stalk2', z: 28, dir: 1 },
      { id: 'bulb', parent: 'stalk2', x: 8, y: 2, part: 'bulb', z: 29, dir: 1 },
      { id: 'finF', parent: 'body', x: -2, y: CY + 10, part: 'finF', z: 30, dir: -1 },
    ],
    clips: {},
    fallback: 'idle',
    alias: { swim: 'idle' },
    bounds: { left: -50, right: 50, top: -64, bottom: 6 },
  };
  const info = new RigInfo(draft);
  /** The water hold: everything gently alive. */
  const hover = (t: number, p: Pose, k = 1) => {
    p.move('body', 0, wave(t) * 1.2 * k).set('body', wave(t, 0.2) * 2 * k);
    p.set('tail', wave(t, 0.1) * 16 * k).set('finF', 10 + wave(t * 2) * 18 * k).set('finB', 6 - wave(t * 2, 0.2) * 14 * k);
    p.set('stalk', wave(t, 0.3) * 6 * k).set('stalk2', wave(t, 0.5) * 10 * k);
    p.set('jaw', 4 + wave(t, 0.4) * 2);
  };
  const lungeKeys = keyframes(info, [
    [0, { body: { a: 6, x: -3 }, jaw: 46, tail: -22, finF: 60, finB: 50, stalk: -14, stalk2: -10, bulb: { v: 'flare' }, eye: { v: 'angry' } }],
    [0.3, { body: { a: 10, x: 4 }, jaw: 58, tail: 26, finF: 80, finB: 70, stalk: -26, stalk2: -18, bulb: { v: 'glow' }, eye: { v: 'angry' } }],
    [0.75, { body: { a: 4, x: 2 }, jaw: 8, tail: -10, finF: 30, finB: 20, stalk: -6, bulb: { v: 'glow' }, eye: { v: 'angry' } }],
    [1, { body: 0, jaw: 4, finF: 10, finB: 6, bulb: { v: 'glow' } }],
  ]);
  const slamKeys = keyframes(info, [
    [0, { body: { a: -18, y: -4 }, tail: 50, finF: -20, finB: -20, jaw: 20, eye: { v: 'angry' } }],
    [0.55, { body: { a: -26, y: -8 }, tail: 70, finF: -30, finB: -30, jaw: 26, eye: { v: 'angry' } }],
    [0.7, { body: { a: 12, y: 0 }, tail: -40, finF: 20, finB: 20, jaw: 30, eye: { v: 'wide' } }],
    [1, { body: { a: 4 }, tail: -10, finF: 10, finB: 10, jaw: 10, eye: { v: 'angry' } }],
  ]);
  return {
    ...draft,
    clips: {
      idle: { ms: 2200, loop: true, pose: (t, p) => hover(t, p) },
      lure: {
        ms: 1800,
        loop: true,
        pose: (t, p) => {
          hover(t, p, 0.6);
          // The lure dangled out ahead, swaying like bait; jaws ajar.
          p.set('stalk', 18 + wave(t) * 10).set('stalk2', 30 + wave(t, 0.3) * 16).set('jaw', 12 + wave(t * 2) * 4);
        },
      },
      flare: {
        ms: 200,
        loop: true,
        pose: (t, p) => {
          // Dead still but for a shiver; the bulb blazing.
          p.set('stalk', 26).set('stalk2', 40).show('bulb', 'flare');
          p.set('jaw', 14 + wave(t) * 1).set('tail', -16).set('finF', 40).set('finB', 30).move('body', -1.5 + wave(t) * 0.4, 0);
          p.show('eye', 'angry');
        },
      },
      lunge: { ms: 700, loop: false, pose: (t, p) => p.keys(lungeKeys, t) },
      spit: {
        ms: 800,
        loop: false,
        pose: (t, p) => {
          const k = t < 0.6 ? t / 0.6 : 1 - (t - 0.6) / 0.4;
          p.set('body', -12 * k).set('stalk', -20 * k).set('stalk2', -30 * k).set('jaw', 20 * k);
          p.show('bulb', t > 0.45 && t < 0.7 ? 'flare' : 'glow').show('eye', 'angry');
          p.set('finF', 20 + 30 * k).set('finB', 20 + 20 * k).set('tail', 20 * k);
        },
      },
      stunned: {
        ms: 900,
        loop: true,
        pose: (t, p) => {
          // Dazed: tilting, jaw hanging wide (the opening), the lure limp.
          p.set('body', -8 + wave(t) * 5).move('body', 0, 2 + wave(t, 0.3) * 1);
          p.set('jaw', 40 + wave(t * 2) * 4).set('stalk', 50 + wave(t) * 6).set('stalk2', 50).show('bulb', 'dim');
          p.set('finF', 70).set('finB', 60).set('tail', -10 + wave(t) * 6).show('eye', 'dizzy');
        },
      },
      flop: {
        ms: 700,
        loop: true,
        pose: (t, p) => {
          // On the deck, propped on his fins, flopping and gasping.
          p.set('body', wave(t) * 6).move('body', 0, Math.abs(wave(t)) * -3);
          p.set('finF', -40 + wave(t) * 12).set('finB', -36 - wave(t) * 12).set('tail', wave(t * 2) * 24);
          p.set('jaw', 10 + Math.max(0, wave(t * 2)) * 18).set('stalk', 30).set('stalk2', 40).show('bulb', 'dim');
        },
      },
      slam: { ms: 900, loop: false, pose: (t, p) => p.keys(slamKeys, t) },
      roll: {
        ms: 300,
        loop: true,
        pose: (t, p) => {
          // Curled for the rolling chomp: fins tucked, jaws open.
          p.set('finF', 120).set('finB', 110).set('tail', 60).set('jaw', 36 + wave(t) * 6).set('stalk', -40).set('stalk2', -50).show('eye', 'angry');
        },
      },
      leap: {
        ms: 600,
        loop: true,
        pose: (t, p) => {
          p.set('body', 8).set('finF', -80 + wave(t * 2) * 10).set('finB', -70 - wave(t * 2) * 10).set('tail', -30).set('jaw', 24).show('eye', 'wide');
        },
      },
      swallow: {
        ms: 600,
        loop: true,
        pose: (t, p) => {
          hover(t, p, 0.4);
          p.set('jaw', 62 + wave(t * 2) * 4).set('body', -6).set('stalk', -30).set('stalk2', -20).show('bulb', 'glow').show('eye', 'angry');
          p.set('finF', 60 + wave(t * 2) * 20).set('finB', 50 - wave(t * 2) * 20);
        },
      },
      hurt: {
        ms: 320,
        loop: false,
        pose: (t, p) => {
          const k = Math.sin(t * Math.PI);
          p.set('body', -12 * k).move('body', -3 * k, 0).set('jaw', 26 * k).show('eye', 'wide').set('finF', 40 * k);
        },
      },
      defeat: {
        ms: 1600,
        loop: true,
        pose: (t, p) => {
          // Belly up, done.
          p.set('body', 170).move('body', 0, -40).set('jaw', 30).set('finF', 30 + wave(t) * 8).set('finB', 20).set('tail', wave(t) * 6);
          p.set('stalk', 60).set('stalk2', 60).show('bulb', 'dim').show('eye', 'shut');
        },
      },
      talk: {
        ms: 600,
        loop: true,
        pose: (t, p) => {
          hover(t * 0.5, p, 0.6);
          p.set('jaw', 8 + Math.max(0, wave(t * 2)) * 18).show('eye', 'angry');
        },
      },
      roar: {
        ms: 1000,
        loop: true,
        pose: (t, p) => {
          hover(t, p, 0.4);
          p.set('body', -10).set('jaw', 64 + wave(t * 4) * 3).set('stalk', -24).set('stalk2', -30).show('bulb', 'flare').show('eye', 'angry');
          p.set('finF', 90).set('finB', 80).set('tail', wave(t * 2) * 30);
        },
      },
    },
  };
}
