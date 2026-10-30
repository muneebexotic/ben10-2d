import { BEN_CARTOON } from '../../../../config/cartoon/ben';
import { BEN_STYLE, EYES, humanRig, keyframes, MOUTHS, type HumanDims } from '../humanoid';
import { css, INK, type Paint } from '../paint';
import { wave, type ClipDef, type PartSpec, type Pose, type RigDef, type RigInfo } from '../rig';
import { frameRig, spinAboutMiddle, type FrameClip } from '../cutout/frameRig';
import { BEN_FRAMES } from '../cutout/benFrames';
import { cutoutImage } from '../cutout/cutout';
import { cutHumanRig } from '../cutout/cutRig';
import { BEN_CUT } from '../cutout/ben';
import { SHOW_FRONT, showHumanClips } from '../showClips';
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
  p.line([3.6, -2.62, 3.8, -2.7], SHOW_DETAIL, INK, false, 0.45);
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
const FRONT = SHOW_FRONT;

/**
 * Ben's HD rig: cut from his model sheet when the sheet's image has loaded
 * (cutout/ben.ts), else the drawn parts above; the same skeleton and clips
 * either way.
 */
export function benRig(): RigDef {
  // Frame by frame from his drawings when they've loaded (the chapter loads them), else cut from his model sheet, else drawn.
  const frames = cutoutImage(BEN_FRAMES.id);
  if (frames) return frameRig({ id: 'ben', meta: BEN_FRAMES, img: frames, clips: BEN_FRAME_CLIPS, fallback: 'idle' });
  const img = cutoutImage('ben');
  const style = BEN_CARTOON.style ?? BEN_STYLE;
  if (!img) return humanRig({ id: 'ben', dims: BEN_DIMS, parts: parts(), style, bounds: BOUNDS, clips: benClips });
  return cutHumanRig({ id: 'ben', meta: BEN_CUT, img, style, bounds: BOUNDS, clips: benClips });
}

/** Where the middle of his shirt sits while he swims (game px above the game sprite's feet). */
const SWIM_Y = -13;

const bob = (amount: number, phase = 0) => (t: number, p: Pose) => p.move('body', 0, wave(t, phase) * amount);

/**
 * Which of his drawings each animation plays (docs/art-refs: the run and swim
 * cycles, the idle/run, action and story-pose sheets). The rare poses without
 * a drawing of their own borrow the nearest one.
 */
export const BEN_FRAME_CLIPS: Readonly<Record<string, FrameClip>> = {
  idle: { frames: ['idle0', 'idle1', 'idle2', 'idle3'], fps: 2.5, loop: true },
  // The sheet's fourth drawing repeats the eighth's stride: the third is held instead.
  run: { frames: ['run0', 'run1', 'run2', 'run2', 'run4', 'run5', 'run6', 'run7'], fps: 15, loop: true },
  walk: { frames: ['run0', 'run1', 'run2', 'run2', 'run4', 'run5', 'run6', 'run7'], fps: 10, loop: true },
  // A beat of crouch, then the tuck.
  jump: { frames: ['land', 'jump', 'jump', 'jump', 'jump', 'jump'], ms: 420, loop: false },
  fall: { frames: ['fall'], ms: 700, loop: true, motion: bob(0.4) },
  land: { frames: ['land'], ms: 170, loop: false },
  hurt: { frames: ['hurt'], ms: 320, loop: false, motion: (t, p) => p.move('body', -1.2 * (1 - t), 0) },
  defeat: { frames: ['hurt'], ms: 900, loop: true, motion: (_t, p, h) => spinAboutMiddle(p, -70, h) },
  punch: { frames: ['punch'], ms: 220, loop: false, motion: (t, p) => p.move('body', Math.sin(Math.PI * Math.min(1, t * 2)) * 1.5, 0) },
  roll: { frames: ['jump'], ms: 320, loop: true, motion: (t, p, h) => spinAboutMiddle(p, t * 360, h) },
  watch: { frames: ['slam'], ms: 260, loop: false },
  slam: { frames: ['slam'], ms: 340, loop: false },
  // Breaststroke: glide, the arms sweep out and pull in, the legs bend and kick; the glide (first and last) holds twice as long.
  swim: { frames: ['swim0', 'swim1', 'swim2', 'swim3', 'swim4', 'swim5'], fps: 8, loop: true, motion: (t, p) => p.move('body', 0, SWIM_Y + wave(t, 0.25) * 0.5) },
  tread: { frames: ['idle0'], ms: 900, loop: true, motion: bob(0.6) },
  drown: { frames: ['hurt'], ms: 520, loop: true, motion: (t, p) => p.set('body', wave(t) * 6) },
  talk: { frames: ['talk'], ms: 1300, loop: true, motion: bob(0.25) },
  listen: { frames: ['idle0', 'idle1', 'idle2', 'idle3'], fps: 2, loop: true },
  point: { frames: ['point'], ms: 1800, loop: true, motion: bob(0.2) },
  shrug: { frames: ['shrug'], ms: 1800, loop: true, motion: bob(0.2) },
  surprise: { frames: ['surprise'], ms: 1800, loop: true },
  cheer: { frames: ['cheer'], ms: 700, loop: true, motion: (t, p) => p.move('body', 0, -Math.abs(wave(t)) * 1.2) },
  think: { frames: ['think'], ms: 1800, loop: true, motion: bob(0.2) },
  angry: { frames: ['stand'], ms: 1800, loop: true },
  sad: { frames: ['idle0'], ms: 1800, loop: true },
  lookHands: { frames: ['hands'], ms: 1800, loop: true, motion: bob(0.2) },
  wave: { frames: ['wave'], ms: 700, loop: true, motion: (t, p) => p.set('body', wave(t) * 1.5) },
};

const BOUNDS = { left: -12, right: 14, top: -34, bottom: 2 };

/** His own clips on top of the shared ones: punch, roll, watch, transform slam, listen. */
function benClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
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
  return {
    ...showHumanClips(info, base),
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
}
