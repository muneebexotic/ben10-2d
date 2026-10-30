import { KEVIN_CARTOON } from '../../../../config/cartoon/kevin';
import { EYES, handPart, humanRig, keyframes, limb, MOUTHS, shoePart, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { wave, type BoneSpec, type ClipDef, type PartSpec, type RigDef, type RigInfo } from '../rig';
import { cutoutImage } from '../cutout/cutout';
import { cutHumanRig } from '../cutout/cutRig';
import { KEVIN_CUT } from '../cutout/kevin';
import { showHumanClips } from '../showClips';
import { cartoonEyes, cartoonMouth } from './face';

const C = KEVIN_CARTOON.colors;

export const KEVIN_DIMS: HumanDims = {
  hip: 13.4,
  thigh: 6.6,
  shin: 6.3,
  ankle: 0.5,
  torso: 9.4,
  shoulderF: { x: -0.4, y: -8.4 },
  shoulderB: { x: -1.8, y: -8.2 },
  upperArm: 4.6,
  forearm: 4.3,
  hipF: 1.1,
  hipB: -1.1,
  neck: { x: 0.4, y: -9.2 },
  eyes: { x: 3.3, y: -5.6 },
  mouth: { x: 3.9, y: -2.2 },
};

function torso(p: Paint): void {
  const body = p.smooth([-3.0, 1.0, 0.2, 1.3, 3.0, 1.0, 3.2, -2.0, 3.4, -5.6, 3.0, -8.2, 1.8, -9.4, 0.3, -9.7, -1.4, -9.5, -2.8, -8.6, -3.4, -5.2, -3.2, -1.4]);
  p.shape(body, { fill: { linear: [0, -9.7, 0, 1.3], stops: [[0, C.shirtLight], [1, C.shirt]] }, shade: shadeOf(C.shirt, 0.3), shadeDepth: 1.8, light: lightOf(C.shirtLight, 0.3), lightDepth: 0.7, lightAlpha: 0.5 });
  p.within(body, () => {
    // The grey long-sleeve shirt shows at the collar.
    p.fill(p.smooth([-1.4, -9.8, 0.3, -8.6, 2.0, -9.8, 0.3, -10.4], true, 0.4), C.sleeve);
  });
  p.line([-1.2, -9.5, 0.3, -8.5, 1.9, -9.5], LINE * 0.5, INK, true, 0.7);
  p.line([2.6, -5.0, 2.2, -2.6], LINE * 0.42, INK, true, 0.3);
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-3.0, -1.0, 3.0, -1.0, 3.1, 1.2, 1.6, 2.4, -1.6, 2.4, -3.2, 1.2]);
  p.shape(shape, { fill: C.jeans, shade: C.jeansShade, shadeDepth: 1.2, light: lightOf(C.jeans), lightDepth: 0.5 });
  p.line([1.3, -0.6, 1.1, 1.8], LINE * 0.42, lightOf(C.jeans, 0.3), true, 0.6);
}

function thigh(p: Paint, far: boolean): void {
  limb(p, KEVIN_DIMS.thigh, 1.7, 1.45, { fill: C.jeans, shade: C.jeansShade }, far);
  p.line([0.7, 1.0, 0.9, 5.8], LINE * 0.35, lightOf(C.jeans, 0.25), true, 0.5);
}

function shin(p: Paint, far: boolean): void {
  const fill = far ? shadeOf(C.jeans, 0.18) : C.jeans;
  const leg = p.smooth([-1.55, -1.3, 1.55, -1.3, 1.4, 3.2, 1.7, 6.1, 0.1, 6.5, -1.75, 6.1, -1.4, 3.2]);
  p.shape(leg, { fill, shade: C.jeansShade, shadeDepth: 1.1, light: lightOf(fill), lightDepth: 0.4, lightAlpha: far ? 0.2 : 0.45 });
  p.line([-1.6, 5.5, 1.6, 5.5], LINE * 0.4, lightOf(C.jeans, 0.3), false, 0.5);
}

function upperArm(p: Paint, far: boolean): void {
  limb(p, KEVIN_DIMS.upperArm, 1.25, 1.05, { fill: C.sleeve, shade: C.sleeveShade }, far);
  const fill = far ? shadeOf(C.shirt, 0.15) : C.shirt;
  const sleeve = p.smooth([-1.6, -0.6, -0.2, -1.6, 1.6, -0.8, 1.8, 1.4, 0.1, 2.0, -1.8, 1.5]);
  p.shape(sleeve, { fill, shade: shadeOf(C.shirt, 0.3), shadeDepth: 0.9, light: C.shirtLight, lightDepth: 0.4 });
}

function forearm(p: Paint, far: boolean): void {
  limb(p, KEVIN_DIMS.forearm, 1.05, 0.92, { fill: C.sleeve, shade: C.sleeveShade }, far);
}

function head(p: Paint): void {
  p.shape(p.capsule(0, 0.6, 1.0, 0.3, -1.6, 1.0), { fill: C.skinShade });
  const back = p.spiky([-4.0, 1.4, -5.6, -3.8, -5.2, -9.0, -1.4, -11.0, 2.4, -10.6, 1.4, -5.4, -0.4, 0.6, -1.4, -0.2, -2.4, 1.8, -3.0, 0.4], [true, false, false, false, false, false, true, false, true, false]);
  p.shape(back, { fill: C.hair, shade: shadeOf(C.hair, 0.2), shadeDepth: 1.2 });
  const face = p.smooth([-3.0, -2.2, -3.6, -6.0, -2.2, -9.3, 1.6, -10.0, 4.6, -8.6, 5.6, -6.4, 5.8, -5.4, 6.5, -4.4, 5.8, -3.8, 5.6, -2.6, 4.2, -0.8, 1.8, -0.4, -0.6, -1.0]);
  p.shape(face, { fill: { radial: [3, -6.6, 0.5, 2, -5, 7.2], stops: [[0, lightOf(C.skin, 0.1)], [1, C.skin]] }, shade: C.skinShade, shadeDepth: 1.5, light: 0xfff0e0, lightDepth: 0.6, lightAlpha: 0.5 });
  // Shaggy hair: a crown that sits close, long ragged strands over his ears and neck, a fringe hanging into his eyes.
  const hair = p.spiky(
    [-4.6, 1.6, -5.0, -2.4, -5.8, -4.0, -5.2, -6.8, -4.4, -9.6, -1.4, -11.2, 2.2, -11.0, 4.6, -9.6, 5.8, -7.4, 5.0, -7.6, 5.4, -5.8, 4.2, -6.8, 3.6, -5.2, 2.8, -6.8, 1.8, -5.6, 1.1, -7.0, 0.1, -5.8, -0.3, -3.2, -0.8, -0.6, -1.6, 1.9, -2.6, 0.2, -3.4, 1.4],
    [true, false, true, false, false, false, false, false, false, true, false, true, false, true, false, true, false, false, true, true, false, true],
  );
  p.shape(hair, { fill: { linear: [-3, -12, 3, 0], stops: [[0, C.hairLight], [0.35, C.hair], [1, C.hair]] }, shade: shadeOf(C.hair, 0.25), shadeDepth: 1.0, light: lightOf(C.hairLight, 0.3), lightDepth: 0.5, lightAlpha: 0.6 });
  p.line([-3.4, -9.8, -0.4, -11.0, 2.4, -10.6], LINE * 0.7, lightOf(C.hairLight, 0.35), true, 0.7);
  for (const [x0, y0, x1, y1] of [[2.2, -10.2, 3.6, -7.2], [0.2, -10.4, 1.0, -7.4], [-2.4, -9.6, -3.4, -4.0], [-1.0, -7.0, -1.6, -1.0]] as const) p.line([x0, y0, x1, y1], LINE * 0.4, lightOf(C.hairLight, 0.2), true, 0.6);
}

/** Power: a purple crackle in his hands while he absorbs or throws. */
function power(p: Paint, big: boolean): void {
  const r = big ? 3.6 : 2.4;
  p.glow(0, 0, r * 1.6, C.glow, 0.6);
  p.shape(p.star(0, 0, r, r * 0.35, 7, big ? 0.4 : 0), { fill: { radial: [0, 0, 0, 0, 0, r], stops: [[0, 0xffffff], [0.45, C.glow], [1, C.glowDark]] }, ink: false });
  p.line([-r, 0.2, -r * 0.3, -0.5, r * 0.2, 0.4, r, -0.3], LINE * 0.4, 0xffffff, false, 0.9);
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 8, h: 12, px: 4, py: 11, draw: (p) => torso(p) },
    { id: 'pelvis', w: 8, h: 5, px: 4, py: 1.8, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 5, h: 10, px: 2.5, py: 2, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 5, h: 10, px: 2.5, py: 2, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 5, h: 9, px: 2.5, py: 1.6, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 5, h: 9, px: 2.5, py: 1.6, draw: (p) => shin(p, true) },
    shoePart('footF', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 4.8, height: 2.2, ankle: 0.5 }),
    shoePart('footB', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 4.8, height: 2.2, ankle: 0.5, far: true }),
    { id: 'armUF', w: 5, h: 8, px: 2.5, py: 1.8, draw: (p) => upperArm(p, false) },
    { id: 'armUB', w: 5, h: 8, px: 2.5, py: 1.8, draw: (p) => upperArm(p, true) },
    { id: 'armLF', w: 4, h: 7, px: 2, py: 1.4, draw: (p) => forearm(p, false) },
    { id: 'armLB', w: 4, h: 7, px: 2, py: 1.4, draw: (p) => forearm(p, true) },
    handPart('handF', C.skin, 1.2),
    handPart('handB', C.skin, 1.2, true),
    { id: 'head', w: 15, h: 16, px: 7, py: 14, draw: (p) => head(p) },
    {
      id: 'eyes',
      w: 8,
      h: 7,
      px: 2.4,
      py: 3.8,
      variants: [...EYES, 'glow'],
      draw: (p, v) => {
        if (v === 'glow') {
          cartoonEyes(p, 'angry', { iris: C.glow, brow: C.brow, near: { x: -0.2, y: 0, rx: 1.15, ry: 1.4 }, far: { x: 2.2, y: 0.05, rx: 0.8, ry: 1.3 }, skin: C.skin, irisScale: 0.95 });
          p.glow(-0.2, 0, 2.4, C.glow, 0.6).glow(2.2, 0, 1.8, C.glow, 0.5);
          return;
        }
        cartoonEyes(p, v, { iris: C.eye, brow: C.brow, near: { x: -0.2, y: 0, rx: 1.1, ry: 1.25 }, far: { x: 2.3, y: 0.05, rx: 0.76, ry: 1.15 }, skin: C.skin, irisScale: 0.7, browWeight: 1.2, restLid: 0.32 });
      },
    },
    { id: 'mouth', w: 5, h: 4, px: 2.5, py: 2, variants: MOUTHS, draw: (p, v) => cartoonMouth(p, v, { mouth: C.mouth, tongue: C.tongue, lip: C.skinShade, width: 1.8 }) },
    { id: 'power', w: 12, h: 12, px: 6, py: 6, variants: ['a', 'b'], draw: (p, v) => power(p, v === 'b') },
  ];
}

/** Kevin's HD rig: slouching, smirking; his absorb, wind-up, throw, lunge and laugh. */
export function kevinRig(): RigDef {
  const style = KEVIN_CARTOON.style!;
  const img = cutoutImage('kevin');
  if (!img) return humanRig({ id: 'kevin', dims: KEVIN_DIMS, parts: parts(), style, extraBones: [POWER], bounds: BOUNDS, clips: kevinClips });
  // Cut from his model sheet; the absorbed energy stays painted.
  const power = parts().find((p) => p.id === 'power')!;
  return cutHumanRig({ id: 'kevin', meta: KEVIN_CUT, img, style, bounds: BOUNDS, clips: kevinClips, extraParts: [power], extraBones: [POWER] });
}

const BOUNDS = { left: -12, right: 14, top: -40, bottom: 2 };
const POWER: BoneSpec = { id: 'power', parent: 'handF', x: 0.5, y: 1.5, part: 'power', z: 90, dir: -1 };

/** His own clips: absorbing, the wind-up and throw, the lunge, the laugh and the smirk (the energy shows only while he holds it). */
function kevinClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const noPower = (clip: (typeof base)[string]) => ({ ...clip, pose: (t: number, p: Parameters<typeof clip.pose>[1]) => { clip.pose(t, p); p.hidden('power'); } });
  const out: typeof base = {};
  // The show-look clips keep raised arms off his face.
  for (const [name, clip] of Object.entries({ ...base, ...showHumanClips(info, base) })) out[name] = noPower(clip);
  const absorbKeys = keyframes(info, [[0, { hip: { y: 0.6 }, torso: 6, head: -4, armUF: 80, armLF: -20, handF: { v: 'open' }, armUB: 70, armLB: -10, handB: { v: 'open' }, thighF: 14, shinF: -14, thighB: -16, shinB: -10, eyes: { v: 'glow' }, mouth: { v: 'grin' }, power: { v: 'b' } }]]);
  const windKeys = keyframes(info, [[0, { torso: -8, head: -2, armUF: -50, armLF: 90, armUB: 30, armLB: 40, thighF: 10, shinF: -8, thighB: -14, eyes: { v: 'glow' }, mouth: { v: 'smirk' }, power: { v: 'a' } }]]);
  const throwKeys = keyframes(info, [
    [0, { torso: -8, head: -2, armUF: -50, armLF: 90, armUB: 30, armLB: 40, eyes: { v: 'glow' }, power: { v: 'a' } }],
    [0.5, { hip: { x: 1 }, torso: 16, head: -8, armUF: 110, armLF: 0, handF: { v: 'open' }, armUB: -40, armLB: 60, thighF: 26, shinF: -20, thighB: -24, shinB: -12, eyes: { v: 'glow' }, mouth: { v: 'shout' }, power: { hide: true } }],
    [1, { hip: { x: 0.8 }, torso: 12, head: -6, armUF: 96, armLF: 6, handF: { v: 'open' }, armUB: -30, armLB: 50, thighF: 22, shinF: -18, thighB: -20, shinB: -10, eyes: { v: 'angry' }, mouth: { v: 'grin' }, power: { hide: true } }],
  ]);
  const lungeKeys = keyframes(info, [[0, { hip: { x: 1.5, y: 1 }, torso: 30, head: -18, armUF: 110, armLF: -10, handF: { v: 'open' }, armUB: 100, armLB: -6, handB: { v: 'open' }, thighF: 40, shinF: -40, thighB: -30, shinB: -20, footB: 20, eyes: { v: 'angry' }, mouth: { v: 'grit' }, power: { hide: true } }]]);
  return {
    ...out,
    absorb: { ms: 260, loop: true, pose: (t, p) => { p.keys(absorbKeys, 0); p.add('torso', wave(t) * 2).size('power', 1 + wave(t) * 0.15); } },
    windup: { ms: 300, loop: false, pose: (t, p) => { p.keys(windKeys, 0); p.size('power', 0.5 + t * 0.6); } },
    throw: { ms: 240, loop: false, pose: (t, p) => p.keys(throwKeys, t) },
    lunge: noPower({ ms: 200, loop: false, pose: (_t, p) => p.keys(lungeKeys, 0) }),
    laugh: noPower({
      ms: 500,
      loop: true,
      pose: (t, p) => {
        p.move('hip', 0, Math.abs(wave(t)) * -0.5);
        p.set('torso', -10 + wave(t * 2) * 3).set('head', -18 + wave(t * 2) * 4);
        p.set('armUF', 30).set('armLF', -100).set('armUB', 20).set('armLB', -90);
        p.show('eyes', 'happy').show('mouth', 'grin');
      },
    }),
    smirk: noPower({
      ms: 2000,
      loop: true,
      pose: (t, p) => {
        p.move('hip', 0, wave(t) * 0.2);
        p.set('torso', -4).set('head', -6 + wave(t, 0.3) * 1.5);
        p.set('armUF', -12).set('armLF', 30).set('armUB', 10).set('armLB', 24);
        p.set('thighF', 8).set('shinF', -2).set('thighB', -6).set('shinB', -4).set('footB', 12);
        p.show('eyes', 'side').show('mouth', 'smirk');
      },
    }),
    idle: noPower({ ...base.idle, pose: (t, p) => { base.idle.pose(t, p); p.add('torso', -5).add('head', -2).show('mouth', 'smirk'); } }),
  };
}
