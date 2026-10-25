import { GWEN_CARTOON } from '../../../../config/cartoon/gwen';
import { EYES, handPart, humanRig, keyframes, limb, MOUTHS, shoePart, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { wave, type PartSpec, type RigDef } from '../rig';
import { cartoonEyes, cartoonMouth } from './face';

const C = GWEN_CARTOON.colors;

export const GWEN_DIMS: HumanDims = {
  hip: 9.4,
  thigh: 4.7,
  shin: 4.2,
  ankle: 0.5,
  torso: 7.2,
  shoulderF: { x: -0.4, y: -6.3 },
  shoulderB: { x: -1.6, y: -6.2 },
  upperArm: 3.5,
  forearm: 3.3,
  hipF: 1.0,
  hipB: -1.0,
  neck: { x: 0.3, y: -7.1 },
  eyes: { x: 3.2, y: -5.2 },
  mouth: { x: 3.8, y: -2.1 },
};

function torso(p: Paint): void {
  const body = p.smooth([-2.8, 1.0, 0.2, 1.2, 2.8, 1.0, 3.0, -1.6, 3.2, -4.4, 2.8, -6.3, 1.8, -7.3, 0.3, -7.6, -1.3, -7.4, -2.6, -6.6, -3.1, -4.0, -3.0, -1.2]);
  p.shape(body, { fill: { linear: [0, -8, 0, 1.2], stops: [[0, C.topLight], [0.35, C.top], [1, C.topShade]] }, shade: C.topShade, shadeDepth: 1.8, light: C.topLight, lightDepth: 0.7, lightAlpha: 0.6 });
  // The white cat on her chest: a round face, two ears, two eyes and whiskers.
  const cx = 1.6;
  const cy = -3.9;
  const head = p.smooth([cx - 1.4, cy + 0.2, cx - 1.3, cy - 1.6, cx - 0.6, cy - 0.9, cx + 0.6, cy - 0.9, cx + 1.3, cy - 1.6, cx + 1.4, cy + 0.2, cx, cy + 1.2]);
  p.shape(head, { fill: C.cat, ink: LINE * 0.45 });
  p.fill(p.circle(cx - 0.5, cy - 0.1, 0.22), C.topShade).fill(p.circle(cx + 0.5, cy - 0.1, 0.22), C.topShade);
  p.line([cx - 0.2, cy + 0.5, cx, cy + 0.65, cx + 0.2, cy + 0.5], LINE * 0.3, C.topShade);
  // Collar.
  p.stroke(p.smooth([-1.1, -7.5, 0.3, -6.7, 1.5, -7.5], false), C.topShade, 0.7);
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-2.8, -1.0, 2.8, -1.0, 2.9, 1.2, 1.5, 2.3, -1.5, 2.3, -3.0, 1.2]);
  p.shape(shape, { fill: C.pants, shade: C.pantsShade, shadeDepth: 1.2, light: 0xffffff, lightDepth: 0.5 });
}

function thigh(p: Paint, far: boolean): void {
  limb(p, GWEN_DIMS.thigh, 1.6, 1.4, { fill: C.pants, shade: C.pantsShade, light: 0xffffff }, far);
}

function shin(p: Paint, far: boolean): void {
  // Capris: white to mid-calf, then a little skin above the sneakers.
  limb(p, GWEN_DIMS.shin, 1.15, 0.95, { fill: C.skin, shade: C.skinShade }, far);
  const fill = far ? shadeOf(C.pants, 0.15) : C.pants;
  const cuff = p.smooth([-1.55, -1.2, 1.55, -1.2, 1.5, 1.4, 1.7, 2.4, 0, 2.7, -1.75, 2.4, -1.45, 1.4]);
  p.shape(cuff, { fill, shade: C.pantsShade, shadeDepth: 1.0, light: 0xffffff, lightDepth: 0.4 });
}

function upperArm(p: Paint, far: boolean): void {
  limb(p, GWEN_DIMS.upperArm, 1.25, 1.05, { fill: C.top, shade: C.topShade, light: C.topLight }, far);
}

function forearm(p: Paint, far: boolean): void {
  limb(p, GWEN_DIMS.forearm, 1.05, 0.95, { fill: C.top, shade: C.topShade, light: C.topLight }, far);
  // The long sleeve's cuff.
  p.shape(p.rrect(-1.15, 2.5, 2.3, 0.9, 0.4), { fill: far ? shadeOf(C.topShade, 0.15) : C.topShade, ink: LINE * 0.5 });
}

function head(p: Paint): void {
  p.shape(p.capsule(0, 0.6, 1.0, 0.3, -1.8, 1.0), { fill: C.skinShade });
  // Hair behind the head: the bob falls to her jaw in three points.
  const back = p.spiky([-4.0, -0.4, -5.4, -4.6, -4.4, -9.6, -0.6, -11.0, 2.0, -10.4, 1.0, -4.6, -0.6, 0.2, -1.6, -0.6, -2.6, 0.8, -3.2, -0.2], [true, false, false, false, false, false, true, false, true, false]);
  p.shape(back, { fill: { linear: [-5, -10, 0, 0], stops: [[0, C.hair], [1, C.hairShade]] }, shade: C.hairShade, shadeDepth: 1.2 });
  const face = p.smooth([-3.1, -2.4, -3.7, -6.0, -2.2, -9.4, 1.6, -10.3, 4.6, -8.8, 5.6, -6.6, 5.8, -5.6, 6.4, -4.6, 5.8, -4.0, 5.6, -2.8, 4.4, -1.1, 2.0, -0.6, -0.5, -1.2]);
  p.shape(face, { fill: { radial: [3, -6.6, 0.5, 2, -5, 7.2], stops: [[0, lightOf(C.skin, 0.12)], [1, C.skin]] }, shade: C.skinShade, shadeDepth: 1.4, light: 0xfff4e6, lightDepth: 0.6, lightAlpha: 0.6 });
  p.within(face, () => p.glow(4.2, -3.2, 1.5, 0xff8a8a, 0.3));
  // The bob: a cap over the crown, a fringe cut straight across with little notches, a side lock past the ear to her jaw.
  const hair = p.spiky(
    [-4.4, -2.4, -5.2, -6.2, -3.6, -10.2, 0.4, -11.6, 4.0, -10.9, 5.7, -8.8, 6.0, -7.4, 5.0, -7.9, 4.4, -7.1, 3.6, -7.8, 2.8, -7.1, 2.0, -7.7, 1.2, -7.0, 0.3, -7.4, 0.0, -5.6, -0.2, -3.0, 0.3, -0.3, -0.9, -1.6, -1.6, -4.4, -2.6, -4.4, -3.3, -1.8],
    [false, false, false, false, false, false, true, false, true, false, true, false, true, false, false, false, true, false, false, false, true],
  );
  p.shape(hair, { fill: { linear: [-3, -11.5, 3, -1], stops: [[0, C.hairLight], [0.45, C.hair], [1, C.hairShade]] }, shade: C.hairShade, shadeDepth: 1.2, light: lightOf(C.hairLight, 0.3), lightDepth: 0.55, lightAlpha: 0.7 });
  // Strands and a shine across the crown.
  p.line([3.0, -10.2, 4.3, -8.0], LINE * 0.42, INK, true, 0.45);
  p.line([0.8, -10.4, 1.8, -7.8], LINE * 0.42, INK, true, 0.45);
  p.line([-2.6, -9.0, -2.4, -5.2], LINE * 0.42, INK, true, 0.4);
  p.line([-0.6, -6.0, -0.6, -2.4], LINE * 0.4, INK, true, 0.4);
  p.line([-3.0, -9.6, -0.2, -10.9, 2.6, -10.4], LINE * 0.75, lightOf(C.hairLight, 0.45), true, 0.75);
  // The blue cat clip over her temple.
  const clip = p.smooth([0.4, -8.4, 1.0, -9.4, 1.4, -8.8, 2.2, -9.3, 2.4, -8.2, 1.4, -7.6]);
  p.shape(clip, { fill: C.clip, ink: LINE * 0.6, light: 0xffffff, lightDepth: 0.3 });
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 8, h: 10, px: 4, py: 9, draw: (p) => torso(p) },
    { id: 'pelvis', w: 8, h: 5, px: 4, py: 1.8, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 5, h: 8, px: 2.5, py: 2, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 5, h: 8, px: 2.5, py: 2, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 5, h: 7, px: 2.5, py: 1.5, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 5, h: 7, px: 2.5, py: 1.5, draw: (p) => shin(p, true) },
    shoePart('footF', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 4.3, height: 2.1, ankle: 0.5, lace: C.shoeToe }),
    shoePart('footB', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 4.3, height: 2.1, ankle: 0.5, far: true }),
    { id: 'armUF', w: 5, h: 7, px: 2.5, py: 1.6, draw: (p) => upperArm(p, false) },
    { id: 'armUB', w: 5, h: 7, px: 2.5, py: 1.6, draw: (p) => upperArm(p, true) },
    { id: 'armLF', w: 5, h: 6, px: 2.5, py: 1.4, draw: (p) => forearm(p, false) },
    { id: 'armLB', w: 5, h: 6, px: 2.5, py: 1.4, draw: (p) => forearm(p, true) },
    handPart('handF', C.skin, 1.2),
    handPart('handB', C.skin, 1.2, true),
    { id: 'head', w: 15, h: 16, px: 7, py: 14, draw: (p) => head(p) },
    { id: 'eyes', w: 8, h: 7, px: 2.4, py: 3.8, variants: EYES, draw: (p, v) => cartoonEyes(p, v, { iris: C.eye, brow: C.brow, near: { x: -0.2, y: 0, rx: 1.22, ry: 1.62 }, far: { x: 2.35, y: 0.05, rx: 0.8, ry: 1.46 }, skin: C.skin, irisScale: 0.74, browWeight: 0.8 }) },
    { id: 'mouth', w: 5, h: 4, px: 2.5, py: 2, variants: MOUTHS, draw: (p, v) => cartoonMouth(p, v, { mouth: C.mouth, tongue: C.tongue, lip: C.skinShade, width: 1.7 }) },
    // Mana in her hands while she casts.
    { id: 'mana', w: 10, h: 10, px: 5, py: 5, variants: ['a', 'b'], draw: (p, v) => mana(p, v === 'b') },
  ];
}

function mana(p: Paint, big: boolean): void {
  const r = big ? 3.4 : 2.6;
  p.glow(0, 0, r * 1.5, C.mana, 0.55);
  p.shape(p.star(0, 0, r, r * 0.45, 6, big ? 0.3 : 0), { fill: { radial: [0, 0, 0, 0, 0, r], stops: [[0, 0xffffff], [0.5, 0xffb8e8], [1, C.mana]] }, ink: false });
  p.fill(p.circle(0, 0, r * 0.35), 0xffffff, 0.9);
}

/** Gwen's HD rig: her cast (a glow of mana between her hands) and an unimpressed fold of the arms. */
export function gwenRig(): RigDef {
  return humanRig({
    id: 'gwen',
    dims: GWEN_DIMS,
    parts: parts(),
    style: GWEN_CARTOON.style!,
    extraBones: [{ id: 'mana', parent: 'handF', x: 0.6, y: 1.4, part: 'mana', z: 90, dir: -1 }],
    bounds: { left: -12, right: 14, top: -32, bottom: 2 },
    clips: (info, base) => {
      const castKeys = keyframes(info, [
        [0, { torso: -4, head: -4, armUF: 30, armLF: 40, armUB: 20, armLB: 40, mana: { hide: true }, eyes: { v: 'angry' } }],
        [0.4, { hip: { x: 0.6 }, torso: 10, head: -6, armUF: 88, armLF: 4, handF: { v: 'open' }, armUB: 84, armLB: 10, handB: { v: 'open' }, thighF: 18, shinF: -14, thighB: -18, shinB: -8, mana: { v: 'b', hide: false }, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
        [1, { hip: { x: 0.4 }, torso: 8, head: -5, armUF: 84, armLF: 8, handF: { v: 'open' }, armUB: 80, armLB: 12, handB: { v: 'open' }, thighF: 16, shinF: -12, thighB: -16, shinB: -8, mana: { v: 'a', hide: false }, eyes: { v: 'angry' }, mouth: { v: 'open' } }],
      ]);
      const hideMana = (clip: (typeof base)[string]) => ({ ...clip, pose: (t: number, p: Parameters<typeof clip.pose>[1]) => { clip.pose(t, p); p.hidden('mana'); } });
      const out: typeof base = {};
      for (const [name, clip] of Object.entries(base)) out[name] = hideMana(clip);
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
    },
  });
}
