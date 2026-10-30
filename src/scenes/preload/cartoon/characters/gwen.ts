import { GWEN_CARTOON } from '../../../../config/cartoon/gwen';
import { EYES, humanRig, keyframes, MOUTHS, type HumanDims } from '../humanoid';
import { css, INK, type Paint } from '../paint';
import { wave, type BoneSpec, type ClipDef, type PartSpec, type RigDef, type RigInfo } from '../rig';
import { cutoutImage } from '../cutout/cutout';
import { cutHumanRig } from '../cutout/cutRig';
import { GWEN_CUT } from '../cutout/gwen';
import { cel, celLimb, hardShadow, shifted, showEyes, showHand, showMouth, showShade, showSneaker, SHOW_DETAIL } from '../show';
import { showHumanClips } from '../showClips';

const C = GWEN_CARTOON.colors;

/** The head is drawn from the sheet's close-up, then scaled to sit on the body (a touch bigger than the sheet's, for play size). */
const HEAD_K = 0.92;

/**
 * Gwen in the show look, from her model sheet: Ben's height and build but
 * slimmer, a hair shorter. As with Ben, her near arm and leg are her right
 * ones, at the back of her three-quarter body.
 */
export const GWEN_DIMS: HumanDims = {
  hip: 11.8,
  thigh: 5.3,
  shin: 4.9,
  ankle: 1.6,
  torso: 9.1,
  shoulderF: { x: -1.7, y: -8.0 },
  shoulderB: { x: 1.9, y: -7.8 },
  upperArm: 4.2,
  forearm: 3.5,
  hipF: 0.85,
  hipB: -0.85,
  neck: { x: 0.4, y: -8.8 },
  eyes: { x: 2.1 * HEAD_K, y: -4.45 * HEAD_K },
  mouth: { x: 2.2 * HEAD_K, y: -2.45 * HEAD_K },
};

const BACK = { x: -0.85, y: 0.5 };

function torso(p: Paint): void {
  const shirt = p.spiky([-2.55, -1.4, 2.65, -1.4, 2.7, -3.4, 2.9, -5.8, 2.45, -7.9, 1.45, -8.95, -0.6, -9.15, -2.25, -8.4, -2.8, -5.9, -2.65, -3.4], [true, true, false, false, false, false, false, false, false, false]);
  cel(p, shirt, { fill: C.top, shade: C.topShade, depth: 1.2, dir: BACK });
  p.within(shirt, () => {
    // The raglan sleeves' navy runs up to the collar on both shoulders.
    p.fill(p.poly([-3.4, -9.6, -0.9, -9.6, -1.9, -7.4, -3.4, -6.4]), C.sleeve);
    p.fill(p.poly([1.0, -9.6, 3.4, -9.6, 3.4, -6.5, 2.35, -7.2]), C.sleeve);
    p.fill(p.poly([-3, -2.0, 3, -2.0, 3, -1.3, -3, -1.3]), C.topShade);
  });
  // The white cat face on her chest.
  const cx = 1.15;
  const cy = -5.0;
  const cat = p.spiky([cx - 1.35, cy + 0.35, cx - 1.35, cy - 0.7, cx - 1.2, cy - 1.55, cx - 0.55, cy - 1.0, cx + 0.55, cy - 1.0, cx + 1.2, cy - 1.55, cx + 1.35, cy - 0.7, cx + 1.35, cy + 0.35, cx + 0.6, cy + 1.05, cx - 0.6, cy + 1.05], [false, false, true, false, false, true, false, false, false, false]);
  cel(p, cat, { fill: C.cat, ink: SHOW_DETAIL * 0.8 });
  p.fill(p.circle(cx - 0.48, cy - 0.1, 0.2), C.sleeve).fill(p.circle(cx + 0.48, cy - 0.1, 0.2), C.sleeve);
  p.fill(p.poly([cx - 0.14, cy + 0.28, cx + 0.14, cy + 0.28, cx, cy + 0.45]), C.sleeve);
  // The navy collar.
  const collar = new Path2D();
  collar.ellipse(0.45, -8.85, 1.5, 0.55, -0.06, 0, Math.PI * 2);
  collar.ellipse(0.4, -9.02, 1.0, 0.3, -0.06, 0, Math.PI * 2);
  p.ctx.fillStyle = css(C.sleeve);
  p.ctx.fill(collar, 'evenodd');
}

function pelvis(p: Paint): void {
  const pants = p.spiky([-2.45, -2.2, 2.55, -2.2, 2.65, 1.4, 1.4, 2.5, -1.4, 2.5, -2.55, 1.4], [true, true, false, false, false, false]);
  cel(p, pants, { fill: C.pants, shade: C.pantsShade, depth: 0.9, dir: BACK });
  p.line([-2.45, -1.6, 2.6, -1.6], SHOW_DETAIL, INK, false, 0.6);
  p.line([1.45, -1.5, 1.3, 0.6, 0.95, 1.5], SHOW_DETAIL, INK, true, 0.6);
}

function thigh(p: Paint, far: boolean): void {
  const leg = p.smooth([-1.55, -1.6, 1.6, -1.6, 1.68, 1.5, 1.45, 5.0, 0.0, 5.6, -1.4, 5.0, -1.65, 1.8]);
  cel(p, leg, { fill: far ? showShade(C.pants, 0.14) : C.pants, shade: C.pantsShade, depth: 0.9, dir: { x: -1, y: 0.15 } });
  // The cargo pocket.
  cel(p, p.rrect(-0.6, 2.0, 1.8, 2.1, 0.25), { fill: far ? showShade(C.pants, 0.14) : C.pants, ink: SHOW_DETAIL, shade: C.pantsShade, depth: 0.3, dir: { x: -1, y: 0.4 } });
  p.line([-0.65, 2.55, 1.25, 2.55], SHOW_DETAIL, INK, false, 0.6);
}

function shin(p: Paint, far: boolean): void {
  // Capris: the skin of her calf below a rolled white cuff.
  celLimb(p, GWEN_DIMS.shin, 0.82, 0.68, C.skin, C.skinShade, far);
  const leg = p.spiky([-1.45, -1.4, 1.5, -1.4, 1.45, 1.6, 1.6, 2.3, -1.6, 2.3, -1.5, 1.6], [false, false, false, true, true, false]);
  cel(p, leg, { fill: far ? showShade(C.pants, 0.14) : C.pants, shade: C.pantsShade, depth: 0.8, dir: { x: -1, y: 0.15 } });
  p.line([-1.5, 1.7, 1.5, 1.7], SHOW_DETAIL, INK, false, 0.7);
}

function upperArm(p: Paint, far: boolean): void {
  celLimb(p, GWEN_DIMS.upperArm, 0.88, 0.8, C.sleeve, C.sleeveShade, far);
}

function forearm(p: Paint, far: boolean): void {
  celLimb(p, GWEN_DIMS.forearm, 0.8, 0.72, C.sleeve, C.sleeveShade, far);
  p.line([-0.72, 3.0, 0.72, 3.0], SHOW_DETAIL, INK, false, 0.6);
}

/** Behind her face: the bob, falling to her jaw in uneven points behind her ear. */
const BOB = [
  0.4, -10.1, -2.0, -9.45, -3.6, -8.1, -4.25, -6.9, -4.45, -5.6, -4.35, -3.6, -4.5, -2.6, -4.9, -1.85, -4.1, -2.0, -4.3, -1.3, -3.4, -1.25, -3.35, -0.95, -2.75, -0.9, -2.15, -1.4, -2.3, -0.85, -1.3, -0.9, -1.05, -1.6, -0.2, -2.6, 0.8, -5.0,
  3.0, -6.0, 4.4, -6.4, 4.7, -6.8, 4.4, -7.9, 3.65, -8.85, 2.4, -9.75,
];
const BOB_TIPS = [false, false, false, false, false, false, false, true, false, true, false, true, true, false, true, true, false, false, false, false, false, false, false, false, false];
/** Her face, measured from the sheet's close-up (game px from the neck joint): a soft jaw, a small pointed nose. */
const FACE = [-2.35, -6.4, 0.6, -7.1, 3.4, -6.6, 4.05, -5.6, 4.0, -5.15, 3.82, -4.55, 3.95, -3.45, 3.78, -3.15, 3.7, -2.75, 3.45, -2.15, 2.9, -1.55, 2.1, -1.2, 1.2, -1.25, -0.2, -1.8, -1.3, -2.55, -2.3, -2.75, -2.45, -4.6];
const FACE_CORNERS = [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false];
/** The crown and the blunt fringe with its little notches, and the lock down her temple. */
const FRINGE = [
  -3.6, -8.1, -2.0, -9.45, 0.4, -10.1, 2.4, -9.75, 3.65, -8.85, 4.35, -7.75, 4.72, -6.75, 4.65, -6.05, 3.95, -6.0, 3.85, -6.7, 3.62, -6.0, 2.35, -6.05, 2.22, -6.7, 2.02, -6.05, 0.95, -6.12, 0.88, -6.7, 0.72, -6.1, -0.5, -5.95, -0.72, -5.0,
  -0.95, -3.7, -1.55, -4.3, -2.4, -4.9, -3.1, -5.6, -3.6, -6.7,
];
const FRINGE_TIPS = [false, false, false, false, false, false, false, true, true, true, true, true, true, true, true, true, true, true, false, true, false, false, false, false];
const SHINE = [4.05, -8.25, 3.3, -9.05, 2.3, -9.0, 1.6, -8.66, -0.2, -8.56, -1.3, -7.98, -2.1, -8.0, -3.5, -7.25, -3.95, -7.25, -4.25, -6.4, -4.25, -5.6, -3.9, -6.2, -3.4, -6.65, -2.6, -7.0, -2.2, -7.65, -1.65, -7.55, -0.6, -7.62, 0.1, -7.88, 0.85, -8.0, 2.45, -8.12, 3.0, -8.4, 3.55, -8.27, 3.8, -8.37];

function head(p: Paint): void {
  p.ctx.scale(HEAD_K, HEAD_K);
  cel(p, p.spiky(BOB, BOB_TIPS), { fill: C.hair, shade: C.hairShade, depth: 0.9, dir: { x: 0.8, y: 0.6 } });
  const neck = p.capsule(0.05, 0.3, 0.72, -0.25, -1.5, 0.7);
  cel(p, neck, { fill: C.skin });
  p.within(neck, () => p.fill(p.poly([-1.2, -2.2, 1.2, -2.2, 1.2, -0.85, -1.2, -1.05]), C.skinShade));
  const face = p.spiky(FACE, FACE_CORNERS);
  cel(p, face, { fill: C.skin });
  const fringe = p.spiky(FRINGE, FRINGE_TIPS);
  p.within(face, () => p.fill(shifted(fringe, 0.05, 0.16), C.skinShade));
  hardShadow(p, face, C.skinShade, 0.22, { x: -0.3, y: 1 });
  cel(p, fringe, { fill: C.hair, shade: C.hairShade, depth: 0.5, dir: { x: -0.5, y: 0.87 } });
  p.within(fringe, () => p.fill(p.poly(SHINE), C.hairLight));
  p.line([-2.6, -5.6, -3.2, -7.0], SHOW_DETAIL, INK, false, 0.4);
  // The ear and its stud, in front of the hair.
  cel(p, p.ellipse(-2.5, -3.9, 0.58, 0.82, 0.1), { fill: C.skin, shade: C.skinShade, depth: 0.28, dir: { x: 1, y: 0.3 } });
  p.line([-2.35, -4.4, -2.68, -3.9, -2.38, -3.4], SHOW_DETAIL, INK, true, 0.8);
  cel(p, p.circle(-2.25, -3.02, 0.2), { fill: C.earring, ink: SHOW_DETAIL * 0.6 });
  // The blue cat clip.
  const clip = p.spiky([-2.1, -6.65, -2.2, -7.5, -2.05, -7.95, -1.7, -7.6, -1.3, -7.6, -0.95, -7.95, -0.8, -7.5, -0.9, -6.65, -1.5, -6.4], [false, false, true, false, false, true, false, false, false]);
  cel(p, clip, { fill: C.clip, ink: SHOW_DETAIL * 1.1, hi: 0xffffff, hiDepth: 0.15 });
  p.fill(p.circle(-1.75, -7.15, 0.12), C.sleeve).fill(p.circle(-1.25, -7.15, 0.12), C.sleeve);
  p.line([-1.7, -6.85, -1.5, -6.72, -1.3, -6.85], SHOW_DETAIL * 0.7, C.sleeve, true);
}

function mana(p: Paint, big: boolean): void {
  const r = big ? 3.4 : 2.6;
  p.glow(0, 0, r * 1.5, C.mana, 0.55);
  p.fill(p.star(0, 0, r, r * 0.45, 6, big ? 0.3 : 0), { radial: [0, 0, 0, 0, 0, r], stops: [[0, 0xffffff], [0.5, 0xffb8e8], [1, C.mana]] });
  p.fill(p.circle(0, 0, r * 0.35), 0xffffff, 0.9);
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 10, h: 12, px: 5, py: 10, draw: (p) => torso(p) },
    { id: 'pelvis', w: 8, h: 7, px: 4, py: 3, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 6, h: 10, px: 3, py: 2.4, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 6, h: 10, px: 3, py: 2.4, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 6, h: 9, px: 3, py: 2.2, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 6, h: 9, px: 3, py: 2.2, draw: (p) => shin(p, true) },
    showSneaker('footF', { upper: C.shoe, toe: C.shoeToe, panel: C.shoeToe, sole: C.sole, length: 3.7, ankle: GWEN_DIMS.ankle, top: 0.6 }),
    showSneaker('footB', { upper: C.shoe, toe: C.shoeToe, panel: C.shoeToe, sole: C.sole, length: 3.7, ankle: GWEN_DIMS.ankle, far: true, top: 0.6 }),
    { id: 'armUF', w: 5, h: 7, px: 2.5, py: 1.6, draw: (p) => upperArm(p, false) },
    { id: 'armUB', w: 5, h: 7, px: 2.5, py: 1.6, draw: (p) => upperArm(p, true) },
    { id: 'armLF', w: 5, h: 6, px: 2.5, py: 1.4, draw: (p) => forearm(p, false) },
    { id: 'armLB', w: 5, h: 6, px: 2.5, py: 1.4, draw: (p) => forearm(p, true) },
    showHand('handF', C.skin, C.skinShade, 0.95),
    showHand('handB', C.skin, C.skinShade, 0.95, true),
    { id: 'head', w: 11, h: 12, px: 4.8, py: 10.4, draw: (p) => head(p) },
    {
      id: 'eyes',
      w: 7,
      h: 5,
      px: 3.4,
      py: 2.6,
      variants: EYES,
      draw: (p, v) => {
        p.ctx.scale(HEAD_K, HEAD_K);
        showEyes(p, v, { iris: C.eye, brow: C.brow, skin: C.skin, near: { x: -1.32, y: 0, rx: 1.0, ry: 0.8, inner: 1 }, far: { x: 1.32, y: 0, rx: 0.6, ry: 0.72, inner: -1 }, browW: 0.22, browSet: 0.05, lash: true, browGap: 0.62 });
      },
    },
    {
      id: 'mouth',
      w: 4,
      h: 3.6,
      px: 1.8,
      py: 1.6,
      variants: MOUTHS,
      draw: (p, v) => {
        p.ctx.scale(HEAD_K, HEAD_K);
        showMouth(p, v, { mouth: C.mouth, tongue: C.tongue, width: 0.6 });
      },
    },
    // Mana in her hands while she casts.
    { id: 'mana', w: 10, h: 10, px: 5, py: 5, variants: ['a', 'b'], draw: (p, v) => mana(p, v === 'b') },
  ];
}

/** Gwen's HD rig: the show-look clips she shares with Ben, her cast (a glow of mana between her hands) and an unimpressed fold of the arms. */
export function gwenRig(): RigDef {
  const style = GWEN_CARTOON.style!;
  const img = cutoutImage('gwen');
  if (!img) return humanRig({ id: 'gwen', dims: GWEN_DIMS, parts: parts(), style, extraBones: [MANA], bounds: BOUNDS, clips: gwenClips });
  // Cut from her model sheet; the spell's glow stays painted.
  const mana = parts().find((p) => p.id === 'mana')!;
  return cutHumanRig({ id: 'gwen', meta: GWEN_CUT, img, style, bounds: BOUNDS, clips: gwenClips, extraParts: [mana], extraBones: [MANA] });
}

const BOUNDS = { left: -12, right: 14, top: -32, bottom: 2 };
const MANA: BoneSpec = { id: 'mana', parent: 'handF', x: 0.6, y: 1.4, part: 'mana', z: 90, dir: -1 };

/** Her own clips on top of the shared ones: the cast and arms folded (the spell's glow shows only in the cast). */
function gwenClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const castKeys = keyframes(info, [
    [0, { torso: -4, head: -4, armUF: 30, armLF: 40, armUB: 20, armLB: 40, mana: { hide: true }, eyes: { v: 'angry' } }],
    [0.4, { hip: { x: 0.6 }, torso: 10, head: -6, armUF: 88, armLF: 4, handF: { v: 'open' }, armUB: 84, armLB: 10, handB: { v: 'open' }, thighF: 18, shinF: -14, thighB: -18, shinB: -8, mana: { v: 'b', hide: false }, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
    [1, { hip: { x: 0.4 }, torso: 8, head: -5, armUF: 84, armLF: 8, handF: { v: 'open' }, armUB: 80, armLB: 12, handB: { v: 'open' }, thighF: 16, shinF: -12, thighB: -16, shinB: -8, mana: { v: 'a', hide: false }, eyes: { v: 'angry' }, mouth: { v: 'open' } }],
  ]);
  const hideMana = (clip: (typeof base)[string]) => ({ ...clip, pose: (t: number, p: Parameters<typeof clip.pose>[1]) => { clip.pose(t, p); p.hidden('mana'); } });
  const out: typeof base = {};
  for (const [name, clip] of Object.entries({ ...base, ...showHumanClips(info, base) })) out[name] = hideMana(clip);
  return {
    ...out,
    cast: { ms: 300, loop: true, pose: (t, p) => { p.keys(castKeys, Math.min(1, t * 2.5)); p.size('mana', 1 + wave(t * 2) * 0.12); } },
    folded: hideMana({
      ms: 1800,
      loop: true,
      pose: (t, p) => {
        p.move('hip', 0, 0.2 + wave(t) * 0.2);
        p.set('torso', -2).set('head', -6 + wave(t, 0.2) * 1.5);
        p.set('armUF', 50).set('armLF', -120).set('armUB', 40).set('armLB', -115);
        p.set('thighF', 6).set('shinF', -2).set('thighB', -8).set('shinB', -4).set('footB', 10);
        p.show('eyes', 'side').show('mouth', 'flat');
      },
    }),
  };
}
