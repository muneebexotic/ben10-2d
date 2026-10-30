import { BEN_CARTOON } from '../../../../config/cartoon/ben';
import { BEN_STYLE, EYES, humanRig, keyframes, MOUTHS, type HumanDims } from '../humanoid';
import { css, INK, type Paint } from '../paint';
import { wave, type PartSpec, type RigDef } from '../rig';
import { cel, celLimb, hardShadow, shifted, showEyes, showHand, showMouth, showOmnitrix, showShade, showSneaker, SHOW_DETAIL } from '../show';

const C = BEN_CARTOON.colors;

/**
 * Ben in the show look, from his model sheet (front, three-quarter, side and
 * back views and six expressions): about three and a half heads tall, a
 * little more head than the sheet so his face reads at play size. Facing
 * right we see his right side, so the near arm is his right one and the
 * Omnitrix is on the far (left) wrist, at the front edge of his body.
 */
/** The head is drawn from the sheet's close-up, then scaled to sit on the body (a touch bigger than the sheet's, for play size). */
const HEAD_K = 0.92;

export const BEN_DIMS: HumanDims = {
  hip: 12.2,
  thigh: 5.5,
  shin: 5.1,
  ankle: 1.6,
  torso: 9.3,
  shoulderF: { x: -1.9, y: -8.2 },
  shoulderB: { x: 2.05, y: -8.0 },
  upperArm: 4.4,
  forearm: 3.7,
  hipF: 0.9,
  hipB: -0.9,
  neck: { x: 0.45, y: -9.3 },
  eyes: { x: 2.3 * HEAD_K, y: -3.65 * HEAD_K },
  mouth: { x: 2.21 * HEAD_K, y: -2.06 * HEAD_K },
};

/** Shadows fall down and toward his back. */
const BACK = { x: -0.85, y: 0.5 };

function torso(p: Paint): void {
  const shirt = p.spiky([-2.75, -1.6, 2.9, -1.6, 2.95, -3.5, 3.15, -6.0, 2.65, -8.3, 1.6, -9.3, -0.7, -9.5, -2.45, -8.7, -3.0, -6.0, -2.85, -3.5], [true, true, false, false, false, false, false, false, false, false]);
  cel(p, shirt, { fill: C.shirt, shade: C.shirtShade, depth: 1.3, dir: BACK });
  p.within(shirt, () => {
    // The black stripe down the middle, from the collar to the hem.
    p.fill(p.poly([0.3, -9.8, 1.5, -9.8, 1.65, -1.2, 0.42, -1.2]), C.stripe);
    // The hem's shadow where the shirt hangs over his pants.
    p.fill(p.poly([-3.5, -2.2, 3.5, -2.2, 3.5, -1.4, -3.5, -1.4]), C.shirtShade);
  });
  // A fold under the chest and one at the waist.
  p.line([2.15, -4.6, 2.7, -3.9], SHOW_DETAIL, INK, false, 0.55);
  p.line([-1.8, -2.9, -1.0, -2.5], SHOW_DETAIL, INK, false, 0.5);
  // The black collar round his neck.
  const collar = new Path2D();
  collar.ellipse(0.5, -9.0, 1.75, 0.66, -0.06, 0, Math.PI * 2);
  collar.ellipse(0.45, -9.18, 1.1, 0.34, -0.06, 0, Math.PI * 2);
  p.ctx.fillStyle = css(C.stripe);
  p.ctx.fill(collar, 'evenodd');
}

function pelvis(p: Paint): void {
  const pants = p.spiky([-2.6, -2.4, 2.7, -2.4, 2.8, 1.5, 1.5, 2.6, -1.5, 2.6, -2.7, 1.5], [true, true, false, false, false, false]);
  cel(p, pants, { fill: C.pants, shade: C.pantsShade, depth: 1.0, dir: BACK });
  p.line([-2.6, -1.75, 2.75, -1.75], SHOW_DETAIL, INK, false, 0.7);
  p.line([1.55, -1.65, 1.4, 0.6, 1.0, 1.6], SHOW_DETAIL, INK, true, 0.75);
}

function thigh(p: Paint, far: boolean): void {
  const fill = far ? showShade(C.pants, 0.16) : C.pants;
  const leg = p.smooth([-1.7, -1.6, 1.75, -1.6, 1.85, 1.6, 1.6, 5.3, 0.05, 5.9, -1.55, 5.3, -1.8, 1.9]);
  cel(p, leg, { fill, shade: far ? showShade(C.pantsShade, 0.16) : C.pantsShade, depth: 1.1, dir: { x: -1, y: 0.15 } });
  // The cargo pocket on the outside of the thigh.
  const pocket = p.rrect(-0.75, 2.1, 2.0, 2.3, 0.3);
  cel(p, pocket, { fill: far ? showShade(C.pocket, 0.16) : C.pocket, ink: SHOW_DETAIL, shade: showShade(C.pocket, 0.25), depth: 0.35, dir: { x: -1, y: 0.4 } });
  cel(p, p.rrect(-0.85, 1.85, 2.2, 0.75, 0.25), { fill: far ? showShade(C.pantsShade, 0.1) : C.pantsShade, ink: SHOW_DETAIL });
  p.line([-0.4, 5.15, 0.8, 5.5], SHOW_DETAIL, INK, false, 0.5);
}

function shin(p: Paint, far: boolean): void {
  const fill = far ? showShade(C.pants, 0.16) : C.pants;
  // Baggy: it starts above the knee (no gap when bent) and bunches over the shoe.
  const leg = p.spiky([-1.55, -1.5, 1.6, -1.5, 1.55, 2.1, 2.0, 4.7, 1.4, 5.2, -1.15, 5.3, -1.95, 4.85, -1.65, 2.1], [false, false, false, true, false, false, true, false]);
  cel(p, leg, { fill, shade: far ? showShade(C.pantsShade, 0.16) : C.pantsShade, depth: 1.05, dir: { x: -1, y: 0.15 } });
  p.line([-1.3, 3.8, -0.45, 4.15, 0.4, 3.85], SHOW_DETAIL, INK, true, 0.55);
  p.line([0.5, 4.5, 1.4, 4.3], SHOW_DETAIL, INK, false, 0.5);
}

function upperArm(p: Paint, far: boolean): void {
  celLimb(p, BEN_DIMS.upperArm, 0.85, 0.75, C.skin, C.skinShade, far);
  const fill = far ? showShade(C.shirt, 0.14) : C.shirt;
  const sleeve = p.spiky([-1.4, -1.0, 0.15, -1.7, 1.45, -0.95, 1.5, 2.05, -1.45, 2.15], [false, false, false, true, true]);
  cel(p, sleeve, { fill, shade: far ? showShade(C.shirtShade, 0.14) : C.shirtShade, depth: 0.75, dir: { x: -1, y: 0.3 } });
  p.within(sleeve, () => p.fill(p.rrect(-2, 1.45, 4, 0.9, 0), C.stripe));
}

function forearm(p: Paint, far: boolean, watch: boolean): void {
  celLimb(p, BEN_DIMS.forearm, 0.78, 0.7, C.skin, C.skinShade, far);
  if (watch) showOmnitrix(p, 0, 3.0, 0.7, { band: C.watch, grey: C.watchFace, glow: C.omnitrix });
}

/**
 * The hair's outline, the band of shine across it and the face, measured from
 * the model sheet's neutral close-up (game px from the neck joint): the fringe
 * swept forward in pointed locks, two spikes on top, a tuft at the back.
 */
const HAIR = [
  -3.15, -7.68, -2.97, -7.54, -2.73, -7.03, -3.15, -6.74, -3.86, -5.67, -3.86, -5.48, -3.53, -5.67, -3.39, -5.62, -3.53, -5.15, -3.53, -4.45, -3.29, -3.65, -3.01, -3.28, -3.01, -3.14, -2.87, -3.14, -2.83, -3.04, -2.83, -3.47, -2.69, -3.79, -2.22, -4.12, -1.94, -4.12, -1.61, -3.98, -1.33, -3.47, -0.86, -3.09, -0.76, -3.79, -0.3, -4.36, -0.02, -4.87, 0.17, -5.76, 0.41, -5.86, 1.34, -5.2, 2.51, -4.64, 2.89, -4.54, 2.7, -5.11, 2.75, -5.25, 2.84, -5.25, 3.4, -4.54, 3.36, -4.4, 3.78, -4.68, 3.83, -4.54, 3.73, -4.31, 3.87, -4.22, 3.78, -3.93, 4.01, -4.36, 3.97, -4.87, 4.2, -4.92, 4.34, -4.68, 4.34, -4.4, 4.43, -4.4, 4.53, -4.59, 4.53, -5.25, 4.72, -5.25, 4.95, -4.64, 5.09, -5.06, 5.09, -5.86, 4.62, -6.84, 4.76, -6.89, 5.56, -6.46, 5.61, -6.51, 5.14, -7.35, 4.39, -8.06, 3.64, -8.48, 2.89, -8.67, 3.31, -9.18, 3.36, -9.51, 2.75, -9.23, 0.83, -9.04, -0.25, -8.62, -0.3, -8.81, 0.08, -9.37, 0.13, -9.7, -1.42, -8.71, -2.08, -7.96, -2.31, -7.49, -2.78, -7.68,
];
const HAIR_TIPS = [true, false, true, false, false, true, false, true, false, false, false, false, true, false, true, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false, true, false, false, true, true, false, true, true, true, false, true, true, false, true, false, false, true, false, true, false, false, true, false, true, true, false, false, false, true, false, true, false, false, true, false, false, true, false, false, true, false];
const HAIR_SHINE = [4.29, -7.96, 4.11, -8.15, 3.64, -8.38, 2.65, -7.78, 2.0, -7.63, 1.2, -7.63, 0.78, -7.35, 0.31, -7.21, -0.48, -7.17, -1.47, -7.35, -2.03, -6.89, -2.54, -6.65, -2.78, -6.32, -2.22, -6.18, -1.7, -6.56, -1.19, -6.65, -0.11, -6.51, 0.83, -6.6, 1.86, -7.03, 2.7, -7.26, 3.54, -7.26, 3.69, -7.63, 4.25, -7.82];
const FACE = [-2.4, -6.2, 0.0, -8.4, 3.0, -7.8, 3.9, -5.6, 3.85, -4.4, 3.88, -3.93, 3.78, -3.5, 3.86, -2.95, 3.72, -2.55, 3.6, -2.1, 3.45, -1.83, 3.1, -1.35, 2.7, -0.9, 2.4, -0.7, 1.4, -0.8, 0.45, -1.12, -0.8, -1.8, -1.75, -2.15, -2.6, -3.0, -2.85, -4.4];
const FACE_CORNERS = [false, false, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false, false, false, false];
/** Dark tufts at the nape, behind his jaw. */
const NAPE = [-3.0, -3.3, -3.4, -2.2, -2.8, -2.5, -2.6, -1.4, -2.1, -2.2, -1.7, -1.5, -1.5, -2.4];

function head(p: Paint): void {
  p.ctx.scale(HEAD_K, HEAD_K);
  cel(p, p.spiky(NAPE, [false, true, false, true, false, true, false]), { fill: C.hairShade });
  // Neck, in the jaw's shadow at the top; it stops inside the collar.
  const neck = p.capsule(0.0, 0.35, 0.82, -0.05, -1.4, 0.8);
  cel(p, neck, { fill: C.skin });
  p.within(neck, () => p.fill(p.poly([-1.2, -2.2, 1.2, -2.2, 1.2, -0.75, -1.2, -0.95]), C.skinShade));
  const face = p.spiky(FACE, FACE_CORNERS);
  cel(p, face, { fill: C.skin });
  const hair = p.spiky(HAIR, HAIR_TIPS);
  // The fringe casts a hard shadow on his forehead; the jaw a thin one along its edge.
  p.within(face, () => p.fill(shifted(hair, 0.08, 0.28), C.skinShade));
  hardShadow(p, face, C.skinShade, 0.22, { x: -0.3, y: 1 });
  p.line([3.5, -2.58, 3.78, -2.7], SHOW_DETAIL, INK, false, 0.8);
  cel(p, hair, { fill: C.hair, shade: C.hairShade, depth: 0.55, dir: { x: -0.5, y: 0.87 } });
  p.within(hair, () => p.fill(p.poly(HAIR_SHINE), C.hairLight));
  for (const s of [[4.2, -6.2, 3.3, -7.0], [2.75, -5.25, 1.9, -6.2], [0.4, -5.86, -0.2, -6.4], [-3.2, -5.0, -2.9, -6.0], [1.4, -8.6, 2.2, -8.1]]) p.line(s, SHOW_DETAIL, INK, false, 0.6);
  // The ear, in front of the hair.
  const ear = p.ellipse(-2.1, -3.1, 0.62, 0.95, 0.1);
  cel(p, ear, { fill: C.skin, shade: C.skinShade, depth: 0.3, dir: { x: 1, y: 0.3 } });
  p.line([-1.95, -3.65, -2.3, -3.1, -1.95, -2.55], SHOW_DETAIL, INK, true, 0.8);
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 10, h: 13, px: 5, py: 11, draw: (p) => torso(p) },
    { id: 'pelvis', w: 8, h: 7, px: 4, py: 3, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 7, h: 10, px: 3.5, py: 2.4, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 7, h: 10, px: 3.5, py: 2.4, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 7, h: 9, px: 3.5, py: 2.2, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 7, h: 9, px: 3.5, py: 2.2, draw: (p) => shin(p, true) },
    showSneaker('footF', { upper: C.shoe, toe: C.shoeToe, panel: C.shoeToe, sole: C.sole, length: 4.9, ankle: BEN_DIMS.ankle }),
    showSneaker('footB', { upper: C.shoe, toe: C.shoeToe, panel: C.shoeToe, sole: C.sole, length: 4.9, ankle: BEN_DIMS.ankle, far: true }),
    { id: 'armUF', w: 6, h: 8, px: 3, py: 2.4, draw: (p) => upperArm(p, false) },
    { id: 'armUB', w: 6, h: 8, px: 3, py: 2.4, draw: (p) => upperArm(p, true) },
    { id: 'armLF', w: 6, h: 7, px: 3, py: 1.6, draw: (p) => forearm(p, false, false) },
    { id: 'armLB', w: 6, h: 7, px: 3, py: 1.6, draw: (p) => forearm(p, true, true) },
    showHand('handF', C.skin, C.skinShade, 1.02),
    showHand('handB', C.skin, C.skinShade, 1.02, true),
    { id: 'head', w: 11, h: 12, px: 4.6, py: 10.4, draw: (p) => head(p) },
    {
      id: 'eyes',
      w: 7,
      h: 5,
      px: 3,
      py: 2.6,
      variants: EYES,
      draw: (p, v) => {
        p.ctx.scale(HEAD_K, HEAD_K);
        showEyes(p, v, { iris: C.eye, brow: C.brow, skin: C.skin, near: { x: -0.96, y: 0, rx: 0.95, ry: 0.62, inner: 1 }, far: { x: 1.1, y: -0.02, rx: 0.46, ry: 0.58, inner: -1 }, browW: 0.42 });
      },
    },
    { id: 'mouth', w: 4, h: 3.6, px: 1.8, py: 1.6, variants: MOUTHS, draw: (p, v) => {
        p.ctx.scale(HEAD_K, HEAD_K);
        showMouth(p, v, { mouth: C.mouth, tongue: C.tongue, width: 0.62 });
      },
    },
  ];
}

/** The watch arm (his far, left arm) comes in front of everything while he looks at or slams the Omnitrix. */
const FRONT = 85;

/** Ben's HD rig: the humanoid kit with his own parts, plus his punch, roll, watch and transform slam. */
export function benRig(): RigDef {
  return humanRig({
    id: 'ben',
    dims: BEN_DIMS,
    parts: parts(),
    style: BEN_CARTOON.style ?? BEN_STYLE,
    bounds: { left: -12, right: 14, top: -34, bottom: 2 },
    clips: (info, base) => {
      // The poses follow his action sheet (docs/art-refs/ben-action-poses.webp).
      // Punch: the watch arm jabs, the near fist guards his chest, feet wide.
      const punchKeys = keyframes(info, [
        [0, { torso: -4, head: -2, armUB: 25, armLB: 105, armUF: -25, armLF: 105, thighF: 18, shinF: -12, footF: -4, thighB: -16, shinB: -6, footB: 12, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
        [0.45, { hip: { x: 1.2 }, torso: 14, head: -10, armUB: 86, armLB: 2, armUF: -20, armLF: 118, thighF: 26, shinF: -18, footF: 2, thighB: -24, shinB: -10, footB: 18, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
        [1, { hip: { x: 0.8 }, torso: 11, head: -8, armUB: 80, armLB: 10, armUF: -22, armLF: 112, thighF: 23, shinF: -16, footF: 2, thighB: -21, shinB: -9, footB: 14, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
      ]);
      // The far (watch) arm comes up in front of his face.
      const watchKeys = keyframes(info, [
        [0, { torso: 4, head: 8, armUB: { a: 40, z: FRONT }, armLB: { a: -60, z: FRONT + 1 }, handB: { z: FRONT + 2 }, armUF: 6, armLF: 14 }],
        [1, { torso: 6, head: 16, armUB: { a: 62, z: FRONT }, armLB: { a: -112, z: FRONT + 1 }, handB: { z: FRONT + 2 }, armUF: 20, armLF: 20, eyes: { v: 'wide' }, mouth: { v: 'o' } }],
      ]);
      // Watch arm across his chest, the near hand raised, then slammed down on the dial.
      const slamKeys = keyframes(info, [
        [0, { torso: 2, head: 8, armUB: { a: 32, z: FRONT }, armLB: { a: 58, z: FRONT + 1 }, handB: { z: FRONT + 2 }, armUF: { a: 120, z: FRONT + 3 }, armLF: { a: 30, z: FRONT + 3 }, handF: { v: 'open', z: FRONT + 4 }, thighF: 16, shinF: -10, thighB: -16, shinB: -6, footB: 12, eyes: { v: 'angry' }, mouth: { v: 'smirk' } }],
        [0.6, { hip: { y: 0.8 }, torso: 12, head: 10, armUB: { a: 30, z: FRONT }, armLB: { a: 60, z: FRONT + 1 }, handB: { z: FRONT + 2 }, armUF: { a: 76, z: FRONT + 3 }, armLF: { a: 14, z: FRONT + 3 }, handF: { v: 'open', z: FRONT + 4 }, thighF: 22, shinF: -26, thighB: -22, shinB: -14, footB: 16, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
        [1, { hip: { y: 0.6 }, torso: 10, head: 8, armUB: { a: 30, z: FRONT }, armLB: { a: 60, z: FRONT + 1 }, handB: { z: FRONT + 2 }, armUF: { a: 74, z: FRONT + 3 }, armLF: { a: 16, z: FRONT + 3 }, handF: { v: 'open', z: FRONT + 4 }, thighF: 20, shinF: -22, thighB: -20, shinB: -12, footB: 14, eyes: { v: 'angry' }, mouth: { v: 'grin' } }],
      ]);
      // His near arm hangs at his back, so arms flung up go up behind his head
      // and the watch arm up in front, never across his face.
      // Jump: the near knee drives up, the far leg tucks under, fists in close.
      const jumpKeys = keyframes(info, [
        [0, { hip: { y: 1.8 }, torso: 14, head: -8, thighF: 40, shinF: -70, footF: 20, thighB: -6, shinB: -60, footB: 30, armUF: -45, armLF: 60, armUB: 20, armLB: 70 }],
        [0.35, { hip: { y: -0.6 }, torso: 4, head: -6, thighF: 78, shinF: -98, footF: 30, thighB: -4, shinB: -112, footB: 40, armUF: -50, armLF: 85, armUB: 48, armLB: 88, mouth: { v: 'open' } }],
        [1, { torso: 6, head: -4, thighF: 72, shinF: -95, footF: 25, thighB: 0, shinB: -105, footB: 35, armUF: -45, armLF: 80, armUB: 42, armLB: 84, mouth: { v: 'smile' } }],
      ]);
      // Landing: a deep crouch, the watch hand down to the floor.
      const landKeys = keyframes(info, [
        [0, { hip: { y: 3.6 }, torso: 30, head: -22, thighF: 64, shinF: -112, footF: 44, thighB: 26, shinB: -104, footB: 70, armUB: 14, armLB: -4, handB: { v: 'open' }, armUF: -50, armLF: 80 }],
        [1, { torso: 2, head: -1, thighF: 13, shinF: -6, footF: -6, thighB: -12, shinB: -1, footB: 12, armUF: -6, armLF: 14, armUB: 7, armLB: 16 }],
      ]);
      // Breaststroke: glide, pull, hands in under the chin, then kick and reach.
      const swimKeys = keyframes(info, [
        [0, { armUF: 172, armLF: 4, armUB: 176, armLB: 2, handF: { v: 'open' }, handB: { v: 'open' }, thighF: -4, shinF: -8, footF: 40, thighB: 4, shinB: -10, footB: 40 }],
        [0.35, { armUF: 112, armLF: -40, armUB: 116, armLB: -40, handF: { v: 'open' }, handB: { v: 'open' }, thighF: 30, shinF: -80, footF: 30, thighB: 34, shinB: -86, footB: 30 }],
        [0.55, { armUF: 130, armLF: -100, armUB: 135, armLB: -100, thighF: 50, shinF: -120, footF: 20, thighB: 52, shinB: -122, footB: 20 }],
        [0.75, { armUF: 168, armLF: -10, armUB: 172, armLB: -8, handF: { v: 'open' }, handB: { v: 'open' }, thighF: -8, shinF: -6, footF: 45, thighB: -2, shinB: -4, footB: 45 }],
      ]);
      // Hit: thrown back, arms flung out, one knee up, face screwed shut.
      const hurtKeys = keyframes(info, [
        [0, { hip: { x: -1, y: 0.4 }, torso: -26, head: -20, armUB: 70, armLB: 25, handB: { v: 'open' }, armUF: -35, armLF: 30, handF: { v: 'open' }, thighF: 38, shinF: -45, footF: 20, thighB: -14, shinB: -20, eyes: { v: 'hurt' }, mouth: { v: 'grit' } }],
        [1, { hip: { x: -0.5 }, torso: -16, head: -12, armUB: 55, armLB: 25, handB: { v: 'open' }, armUF: -30, armLF: 30, handF: { v: 'open' }, thighF: 25, shinF: -32, thighB: -10, shinB: -16, eyes: { v: 'hurt' }, mouth: { v: 'grit' } }],
      ]);
      return {
        jump: { ms: base.jump.ms, loop: false, pose: (t, p) => p.keys(jumpKeys, t) },
        fall: {
          ms: base.fall.ms,
          loop: true,
          pose: (t, p) => {
            // Both arms up in a V, hands open, legs dangling.
            base.fall.pose(t, p);
            const f = wave(t);
            p.set('armUF', -135 + f * 8).set('armLF', -18 - f * 6).show('handF', 'open');
            p.set('armUB', 135 - f * 8).set('armLB', 20 + f * 6).show('handB', 'open');
            p.set('thighF', 10 + f * 4).set('shinF', -12).set('footF', 25);
            p.set('thighB', -8 - f * 4).set('shinB', -16).set('footB', 30);
            p.show('eyes', 'wide').show('mouth', 'shout');
          },
        },
        hurt: { ms: base.hurt.ms, loop: false, pose: (t, p) => p.keys(hurtKeys, t) },
        land: { ms: base.land.ms, loop: false, pose: (t, p) => p.keys(landKeys, t) },
        swim: {
          ms: 900,
          loop: true,
          pose: (t, p) => {
            base.swim.pose(t, p);
            p.keys(swimKeys, t, true);
          },
        },
        defeat: {
          ms: base.defeat.ms,
          loop: true,
          pose: (t, p) => {
            base.defeat.pose(t, p);
            p.set('armUF', -140).set('armLF', -20).set('armUB', -120).set('armLB', -10);
          },
        },
        drown: {
          ms: base.drown.ms,
          loop: true,
          pose: (t, p) => {
            base.drown.pose(t, p);
            const f = wave(t);
            p.set('armUF', -130 + f * 30).set('armLF', -30 - f * 20);
            p.set('armUB', 110 - f * 30).set('armLB', 50 + f * 20);
          },
        },
        cheer: {
          ms: base.cheer.ms,
          loop: true,
          pose: (t, p) => {
            base.cheer.pose(t, p);
            p.set('armUF', -160).set('armLF', -10).set('armUB', 140).set('armLB', 30);
          },
        },
        wave: {
          ms: base.wave.ms,
          loop: true,
          pose: (t, p) => {
            base.idle.pose(t, p);
            p.set('armUB', 84).front('armUB', FRONT).set('armLB', 80 + wave(t) * 22).front('armLB', FRONT + 1).show('handB', 'open').front('handB', FRONT + 2);
            p.show('mouth', 'grin').show('eyes', 'happy');
          },
        },
        // The sheet's stance: feet apart, weight back a little.
        idle: {
          ms: base.idle.ms,
          loop: true,
          pose: (t, p) => {
            base.idle.pose(t, p);
            p.set('thighF', 13).set('shinF', -6).set('footF', -6);
            p.set('thighB', -12).set('shinB', -1).set('footB', 12);
          },
        },
        punch: { ms: 220, loop: false, pose: (t, p) => p.keys(punchKeys, t) },
        roll: {
          ms: 320,
          loop: true,
          pose: (t, p) => {
            // Tucked into a ball and spun once round the hips, lower to the ground.
            p.set('hip', t * 360).move('hip', 0, 3.6);
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
            p.set('torso', 3).set('head', 4 + wave(t, 0.1) * 2).set('armUF', -4).set('armLF', 14).set('armUB', 8).set('armLB', 16);
            p.set('thighF', 4).set('shinF', -4).set('thighB', -5).set('shinB', -3).set('footB', 8);
          },
        },
      };
    },
  });
}
