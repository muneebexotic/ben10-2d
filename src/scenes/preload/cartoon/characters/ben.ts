import { BEN_CARTOON } from '../../../../config/cartoon/ben';
import { BEN_STYLE, EYES, handPart, humanRig, keyframes, limb, MOUTHS, shoePart, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { wave, type PartSpec, type RigDef } from '../rig';
import { cartoonEyes, cartoonMouth, omnitrixWatch } from './face';

const C = BEN_CARTOON.colors;

export const BEN_DIMS: HumanDims = {
  hip: 9.6,
  thigh: 4.9,
  shin: 4.2,
  ankle: 0.5,
  torso: 7.6,
  shoulderF: { x: -0.3, y: -6.6 },
  shoulderB: { x: -1.5, y: -6.4 },
  upperArm: 3.7,
  forearm: 3.4,
  hipF: 1.1,
  hipB: -1.1,
  neck: { x: 0.3, y: -7.5 },
  eyes: { x: 3.3, y: -5.4 },
  mouth: { x: 3.9, y: -2.1 },
};

function torso(p: Paint): void {
  const body = p.smooth([-3.0, 1.0, 0.2, 1.3, 3.0, 1.0, 3.2, -1.6, 3.5, -4.4, 3.1, -6.5, 2.0, -7.6, 0.4, -8.0, -1.4, -7.8, -2.8, -6.9, -3.4, -4.2, -3.2, -1.2]);
  p.shape(body, {
    fill: { linear: [0, -8, 0, 1.4], stops: [[0, C.shirt], [1, 0xe4e6ee]] },
    shade: C.shirtShade,
    shadeDepth: 1.9,
    light: 0xffffff,
    lightDepth: 0.8,
    lightAlpha: 0.7,
  });
  p.within(body, () => {
    // The black stripe down the front, bending with his chest.
    p.fill(p.smooth([1.1, -8.6, 2.5, -8.6, 2.8, -4.6, 2.6, 1.6, 1.3, 1.6, 1.4, -4.6], true, 0.3), C.stripe);
    p.fill(p.smooth([2.1, -8.6, 2.5, -8.6, 2.8, -4.6, 2.6, 1.6, 2.3, 1.6, 2.5, -4.6], true, 0.3), 0x3a3a48);
    // Collar.
    p.stroke(p.smooth([-1.0, -7.9, 0.4, -7.0, 1.6, -7.9], false), C.stripe, 0.85);
    // Hem shadow where the shirt overhangs the pants.
    p.fill(p.rrect(-4, 0.3, 8, 1.3, 0.6), C.shirtShade, 0.45);
  });
  p.line([2.5, -4.0, 2.2, -2.4], LINE * 0.45, INK, true, 0.3);
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-3.0, -1.1, 3.0, -1.1, 3.1, 1.2, 1.6, 2.3, -1.6, 2.3, -3.2, 1.2]);
  p.shape(shape, { fill: C.pants, shade: C.pantsShade, shadeDepth: 1.2, light: lightOf(C.pants), lightDepth: 0.5 });
  p.line([1.4, -0.6, 1.2, 1.7], LINE * 0.45, INK, true, 0.45);
}

function thigh(p: Paint, far: boolean): void {
  limb(p, BEN_DIMS.thigh, 1.8, 1.55, { fill: C.pants, shade: C.pantsShade }, far);
  // The cargo pocket on the side.
  const pocket = p.rrect(-1.1, 1.5, 2.2, 2.0, 0.5);
  p.shape(pocket, { fill: far ? shadeOf(C.pants, 0.25) : lightOf(C.pants, 0.08), ink: LINE * 0.5, shade: C.pantsShade, shadeDepth: 0.5 });
  p.line([-1.1, 2.1, 1.1, 2.1], LINE * 0.4, INK, false, 0.45);
}

function shin(p: Paint, far: boolean): void {
  const fill = far ? shadeOf(C.pants, 0.18) : C.pants;
  // Starts above the knee so a bent leg never shows a gap.
  const leg = p.smooth([-1.7, -1.3, 1.7, -1.3, 1.55, 2.2, 1.9, 4.3, 0.2, 4.7, -1.95, 4.3, -1.5, 2.2]);
  p.shape(leg, { fill: { linear: [0, 0, 0, 4.6], stops: [[0, lightOf(fill, 0.08)], [1, fill]] }, shade: C.pantsShade, shadeDepth: 1.2, light: lightOf(fill), lightDepth: 0.4, lightAlpha: far ? 0.2 : 0.45 });
  p.line([-1.7, 3.6, 1.7, 3.6], LINE * 0.45, INK, false, 0.4);
}

function upperArm(p: Paint, far: boolean): void {
  limb(p, BEN_DIMS.upperArm, 1.3, 1.1, { fill: C.skin, shade: C.skinShade }, far);
  const fill = far ? shadeOf(C.shirt, 0.15) : C.shirt;
  const sleeve = p.smooth([-1.6, -0.6, -0.2, -1.6, 1.6, -0.8, 1.85, 1.3, 0.1, 1.9, -1.8, 1.4]);
  p.shape(sleeve, { fill, shade: C.shirtShade, shadeDepth: 0.9, light: 0xffffff, lightDepth: 0.45 });
}

function forearm(p: Paint, far: boolean, watch: boolean): void {
  limb(p, BEN_DIMS.forearm, 1.1, 0.98, { fill: C.skin, shade: C.skinShade }, far);
  if (watch) omnitrixWatch(p, 0, 2.5, 0.98, { band: C.watch, face: C.watchFace, glow: C.omnitrix });
}

function head(p: Paint): void {
  // Neck, in the shadow of the chin.
  p.shape(p.capsule(0, 0.6, 1.1, 0.3, -1.8, 1.1), { fill: C.skinShade });
  // The face: a big round cartoon head with a small nose.
  const face = p.smooth([-3.2, -2.4, -3.8, -6.0, -2.2, -9.6, 1.6, -10.6, 4.8, -9.0, 5.8, -6.6, 6.0, -5.6, 6.8, -4.5, 6.0, -3.9, 5.8, -2.8, 4.6, -1.0, 2.0, -0.5, -0.6, -1.2]);
  p.shape(face, {
    fill: { radial: [3.2, -6.8, 0.5, 2, -5, 7.5], stops: [[0, lightOf(C.skin, 0.12)], [1, C.skin]] },
    shade: C.skinShade,
    shadeDepth: 1.5,
    light: 0xfff2e2,
    lightDepth: 0.6,
    lightAlpha: 0.6,
  });
  p.within(face, () => p.glow(4.4, -3.2, 1.5, 0xff8a7a, 0.25));
  // Hair: one messy mass with spikes, the fringe swept forward over his forehead.
  const hair = p.spiky(
    [-2.4, -2.6, -4.5, -3.3, -4.5, -5.3, -6.1, -6.5, -5.0, -8.0, -6.0, -10.1, -3.6, -10.4, -3.0, -12.3, -1.0, -11.5, 0.7, -12.8, 2.0, -11.4, 4.2, -11.9, 4.7, -10.3, 7.1, -9.4, 5.5, -8.7, 6.3, -7.9, 4.4, -8.1, 4.5, -7.6, 3.0, -8.0, 2.0, -7.5, 0.7, -7.9, -0.5, -6.6, -1.5, -4.5],
    [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, false, false],
  );
  p.shape(hair, { fill: { linear: [-4, -13, 4, -6], stops: [[0, C.hairLight], [0.5, C.hair], [1, C.hairShade]] }, shade: C.hairShade, shadeDepth: 1.4, light: lightOf(C.hairLight, 0.25), lightDepth: 0.6, lightAlpha: 0.7 });
  // Strands: a few lines of ink and two streaks of light.
  p.line([3.6, -11.2, 5.4, -9.4], LINE * 0.45, INK, true, 0.5);
  p.line([1.2, -11.0, 2.6, -9.0], LINE * 0.45, INK, true, 0.5);
  p.line([-2.6, -10.4, -1.2, -8.6], LINE * 0.45, INK, true, 0.45);
  p.line([-3.4, -9.6, -0.6, -11.0, 2.2, -10.8], LINE * 0.75, lightOf(C.hairLight, 0.4), true, 0.75);
  // The ear, in front of the hair.
  const ear = p.ellipse(-1.5, -4.7, 1.1, 1.45, 0.2);
  p.shape(ear, { fill: C.skin, shade: C.skinShade, shadeDepth: 0.55 });
  p.line([-1.4, -5.3, -1.8, -4.6, -1.35, -4.0], LINE * 0.45, INK, true, 0.55);
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 9, h: 11, px: 4.5, py: 9.5, draw: (p) => torso(p) },
    { id: 'pelvis', w: 8, h: 5, px: 4, py: 1.8, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 6, h: 9, px: 3, py: 2.2, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 6, h: 9, px: 3, py: 2.2, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 6, h: 7, px: 3, py: 1, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 6, h: 7, px: 3, py: 1, draw: (p) => shin(p, true) },
    shoePart('footF', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 4.6, height: 2.3, ankle: 0.5, lace: 0xffffff }),
    shoePart('footB', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 4.6, height: 2.3, ankle: 0.5, far: true }),
    { id: 'armUF', w: 6, h: 7, px: 3, py: 2, draw: (p) => upperArm(p, false) },
    { id: 'armUB', w: 6, h: 7, px: 3, py: 2, draw: (p) => upperArm(p, true) },
    { id: 'armLF', w: 5, h: 6, px: 2.5, py: 1.4, draw: (p) => forearm(p, false, true) },
    { id: 'armLB', w: 5, h: 6, px: 2.5, py: 1.4, draw: (p) => forearm(p, true, false) },
    handPart('handF', C.skin, 1.3),
    handPart('handB', C.skin, 1.3, true),
    { id: 'head', w: 15, h: 17, px: 7, py: 15, draw: (p) => head(p) },
    { id: 'eyes', w: 8, h: 7, px: 2.4, py: 3.8, variants: EYES, draw: (p, v) => cartoonEyes(p, v, { iris: C.eye, brow: C.brow, near: { x: -0.25, y: 0, rx: 1.22, ry: 1.58 }, far: { x: 2.25, y: 0.05, rx: 0.84, ry: 1.46 }, skin: C.skin, irisScale: 0.72 }) },
    { id: 'mouth', w: 5, h: 4, px: 2.5, py: 2, variants: MOUTHS, draw: (p, v) => cartoonMouth(p, v, { mouth: C.mouth, tongue: C.tongue, lip: C.skinShade, width: 1.9 }) },
  ];
}

/** Ben's HD rig: the humanoid kit with his own parts, plus his punch, roll, watch and transform slam. */
export function benRig(): RigDef {
  return humanRig({
    id: 'ben',
    dims: BEN_DIMS,
    parts: parts(),
    style: BEN_CARTOON.style ?? BEN_STYLE,
    bounds: { left: -12, right: 14, top: -34, bottom: 2 },
    clips: (info) => {
      const punchKeys = keyframes(info, [
        [0, { torso: -6, head: -2, armUF: -40, armLF: 100, armUB: 30, armLB: 60, thighF: 14, shinF: -10, thighB: -14, shinB: -8, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
        [0.45, { hip: { x: 1.2 }, torso: 18, head: -10, armUF: 92, armLF: 0, armUB: -55, armLB: 85, thighF: 28, shinF: -20, footF: 4, thighB: -26, shinB: -14, footB: 20, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
        [1, { hip: { x: 0.8 }, torso: 14, head: -8, armUF: 86, armLF: 8, armUB: -45, armLB: 80, thighF: 24, shinF: -18, thighB: -22, shinB: -12, footB: 14, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
      ]);
      const watchKeys = keyframes(info, [
        [0, { torso: 4, head: 8, armUF: 40, armLF: -60, armUB: 6, armLB: 14 }],
        [1, { torso: 6, head: 16, armUF: 70, armLF: -112, handF: { v: 'open' }, armUB: 30, armLB: -60, eyes: { v: 'wide' }, mouth: { v: 'o' } }],
      ]);
      const slamKeys = keyframes(info, [
        [0, { torso: 2, head: 10, armUF: 70, armLF: -110, armUB: 150, armLB: 20, handB: { v: 'open' }, eyes: { v: 'angry' }, mouth: { v: 'smirk' } }],
        [0.6, { hip: { y: 0.8 }, torso: 14, head: 14, armUF: 70, armLF: -100, armUB: 40, armLB: -70, handB: { v: 'open' }, thighF: 20, shinF: -30, thighB: -20, shinB: -20, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
        [1, { hip: { y: 0.6 }, torso: 12, head: 12, armUF: 66, armLF: -100, armUB: 36, armLB: -70, handB: { v: 'open' }, thighF: 18, shinF: -26, thighB: -18, shinB: -18, eyes: { v: 'angry' }, mouth: { v: 'grin' } }],
      ]);
      return {
        punch: { ms: 220, loop: false, pose: (t, p) => p.keys(punchKeys, t) },
        roll: {
          ms: 320,
          loop: true,
          pose: (t, p) => {
            // Tucked into a ball and spun once round the hips, lower to the ground.
            p.set('hip', t * 360).move('hip', 0, 3.4);
            p.set('torso', 40).set('head', 30);
            p.set('thighF', 110).set('shinF', -150).set('footF', 30);
            p.set('thighB', 100).set('shinB', -150).set('footB', 30);
            p.set('armUF', 60).set('armLF', -120).set('armUB', 70).set('armLB', -110);
            p.show('eyes', 'shut').show('mouth', 'grit');
          },
        },
        watch: { ms: 260, loop: false, pose: (t, p) => p.keys(watchKeys, t) },
        slam: { ms: 340, loop: false, pose: (t, p) => p.keys(slamKeys, t) },
        // A bob of the shoulders between lines in a cinematic: idle, but talking.
        listen: {
          ms: 1500,
          loop: true,
          pose: (t, p) => {
            p.move('hip', 0, 0.25 + wave(t) * 0.25);
            p.set('torso', 3).set('head', 4 + wave(t, 0.1) * 2).set('armUF', -4).set('armLF', 14).set('armUB', 6).set('armLB', 16);
            p.set('thighF', 4).set('shinF', -4).set('thighB', -5).set('shinB', -3).set('footB', 8);
          },
        },
      };
    },
  });
}
