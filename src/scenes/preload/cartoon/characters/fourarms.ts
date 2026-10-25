import { FOURARMS_CARTOON } from '../../../../config/cartoon/fourarms';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { INK, LINE, shadeOf, type Paint } from '../paint';
import { type ClipDef, type PartSpec, type Pose, type PoseData, type RigDef, type RigInfo, wave } from '../rig';
import { omnitrixBadge } from './alienBits';

const C = FOURARMS_CARTOON.colors;

export const FOURARMS_DIMS: HumanDims = {
  hip: 14.2,
  thigh: 7.2,
  shin: 6.4,
  ankle: 0.7,
  torso: 16.4,
  shoulderF: { x: 3.4, y: -14.2 },
  shoulderB: { x: -5.6, y: -13.8 },
  upperArm: 7.4,
  forearm: 6.8,
  hipF: 2.6,
  hipB: -2.6,
  neck: { x: 1.8, y: -16.9 },
  eyes: { x: 2.3, y: -4.8 },
  mouth: { x: 3.0, y: -1.5 },
};

/** Where the lower pair joins the torso (torso space). */
const LOWER_F = { x: 2.8, y: -8.8 };
const LOWER_B = { x: -4.4, y: -8.4 };

function skinStyle(far: boolean, r: number) {
  const fill = far ? shadeOf(C.skin, 0.22) : C.skin;
  return { fill: { linear: [-r, -r, r, r * 3] as const, stops: [[0, C.skinLight], [0.45, fill], [1, C.skinShade]] as const }, shade: C.skinShade, shadeDepth: r * 0.7, light: C.skinLight, lightDepth: r * 0.28, lightAlpha: far ? 0.2 : 0.55 };
}

function torso(p: Paint): void {
  // A massive V of a chest: huge shoulders and traps, tapering hard to the waist.
  const body = p.smooth([-4.4, 1.2, 0.6, 1.6, 4.8, 1.0, 5.6, -3.6, 8.2, -9.0, 9.2, -13.6, 7.0, -16.6, 3.2, -17.6, -1.2, -17.8, -5.6, -16.8, -8.4, -14.0, -8.0, -8.8, -5.6, -3.8]);
  p.shape(body, skinStyle(false, 7));
  p.within(body, () => {
    // Pecs, a sternum groove, the six-pack and the lower pair's lats.
    p.fill(p.ellipse(4.6, -12.0, 4.2, 2.6, -0.15), C.skinLight, 0.22);
    p.line([-3.4, -10.6, 1.2, -9.0, 7.6, -10.6], LINE * 0.75, C.skinDeep, true, 0.6);
    p.line([1.2, -15.6, 1.4, -9.4], LINE * 0.55, C.skinDeep, true, 0.5);
    for (let i = 0; i < 3; i++) {
      const y = -7.4 + i * 2.1;
      p.line([-0.6, y, 1.5, y + 0.4, 3.8, y], LINE * 0.5, C.skinDeep, true, 0.45);
    }
    p.line([1.5, -8.6, 1.6, -1.6], LINE * 0.45, C.skinDeep, true, 0.4);
    p.line([-6.8, -8.2, -4.6, -4.6], LINE * 0.5, C.skinDeep, true, 0.4);
  });
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-5.0, -1.4, 5.2, -1.4, 5.6, 1.8, 2.6, 3.6, -2.6, 3.6, -5.4, 1.8]);
  p.shape(shape, { fill: C.pants, shade: shadeOf(C.pants, 0.3), shadeDepth: 1.4, light: C.pantsLight, lightDepth: 0.5 });
  // The white waistband with the Omnitrix on it.
  const band = p.smooth([-5.3, -1.6, 5.5, -1.6, 5.6, 0.4, -5.4, 0.4], true, 0.2);
  p.shape(band, { fill: { linear: [0, -1.6, 0, 0.4], stops: [[0, 0xffffff], [1, C.band]] }, ink: LINE * 0.6 });
  omnitrixBadge(p, 2.4, -0.6, 1.55, C.omnitrix);
}

function thigh(p: Paint, far: boolean): void {
  const D = FOURARMS_DIMS;
  const fill = far ? shadeOf(C.pants, 0.25) : C.pants;
  const path = p.smooth([-3.2, -0.6, 3.4, -0.6, 3.6, D.thigh * 0.45, 2.8, D.thigh + 0.6, -2.6, D.thigh + 0.6, -3.4, D.thigh * 0.45]);
  p.shape(path, { fill: { linear: [-3, 0, 3, D.thigh], stops: [[0, C.pantsLight], [1, fill]] }, shade: shadeOf(C.pants, 0.4), shadeDepth: 1.6, light: C.pantsLight, lightDepth: 0.6, lightAlpha: far ? 0.2 : 0.5 });
  p.line([1.0, 1.2, 1.4, D.thigh - 0.8], LINE * 0.45, C.pantsLight, true, 0.55);
}

function shin(p: Paint, far: boolean): void {
  const D = FOURARMS_DIMS;
  const fill = far ? shadeOf(C.pants, 0.25) : C.pants;
  // Bare red ankles under a flared cuff.
  p.shape(p.capsule(0.2, D.shin - 2.4, 2.2, 0.3, D.shin + 0.4, 2.0), skinStyle(far, 2));
  const leg = p.smooth([-2.8, -1.4, 2.8, -1.4, 2.7, D.shin * 0.5, 3.4, D.shin - 1.6, 0.2, D.shin - 1.0, -3.2, D.shin - 1.6, -2.7, D.shin * 0.5]);
  p.shape(leg, { fill, shade: shadeOf(C.pants, 0.4), shadeDepth: 1.4, light: C.pantsLight, lightDepth: 0.5, lightAlpha: far ? 0.2 : 0.45 });
}

function foot(p: Paint, far: boolean): void {
  // A big bare foot, two blunt toes forward.
  const foot = p.smooth([-2.8, -1.8, 1.0, -2.0, 4.6, -1.0, 6.8, 0.0, 6.6, 0.8, -3.0, 0.8], true, 0.45);
  p.shape(foot, skinStyle(far, 2));
  p.line([4.2, -0.6, 4.6, 0.8], LINE * 0.5, C.skinDeep, false, 0.7);
  p.fill(p.ellipse(5.8, -0.2, 0.7, 0.4), C.skinLight, far ? 0.15 : 0.5);
}

/** An upper arm: a big round deltoid, then a bulging bicep down to the elbow. */
function upperArm(p: Paint, far: boolean, lower: boolean): void {
  const D = FOURARMS_DIMS;
  const k = lower ? 0.8 : 1;
  const len = D.upperArm * (lower ? 0.86 : 1);
  const path = p.smooth([0, -3.4 * k, 3.4 * k, -2.2 * k, 3.6 * k, len * 0.35, 3.0 * k, len * 0.72, 2.2 * k, len + 1.6 * k, -2.2 * k, len + 1.6 * k, -2.8 * k, len * 0.6, -3.5 * k, len * 0.2, -3.0 * k, -2.4 * k]);
  p.shape(path, skinStyle(far, 3.4 * k));
  p.within(path, () => {
    p.line([-1.6 * k, len * 0.18, 1.8 * k, len * 0.3], LINE * 0.45, C.skinDeep, true, 0.5);
    p.fill(p.ellipse(1.2 * k, len * 0.5, 1.2 * k, 2.0 * k), C.skinLight, far ? 0.08 : 0.3);
  });
}

/** A forearm, thickest just below the elbow (Popeye, but red). */
function forearm(p: Paint, far: boolean, lower: boolean): void {
  const D = FOURARMS_DIMS;
  const k = lower ? 0.82 : 1;
  const len = D.forearm * (lower ? 0.86 : 1);
  const path = p.smooth([-2.4 * k, -1.0, 2.6 * k, -1.0, 3.2 * k, len * 0.35, 2.2 * k, len + 0.6, -2.0 * k, len + 0.6, -2.9 * k, len * 0.3]);
  p.shape(path, skinStyle(far, 2.8 * k));
  p.within(path, () => p.line([0.8 * k, len * 0.2, 1.0 * k, len * 0.75], LINE * 0.4, C.skinDeep, true, 0.4));
}

function hand(id: string, far: boolean, lower: boolean): PartSpec {
  const r = lower ? 2.5 : 3.0;
  return {
    id,
    w: r * 4.4,
    h: r * 4.4,
    px: r * 2.2,
    py: r * 0.9,
    variants: ['fist', 'open'],
    draw: (p, v) => {
      if (v === 'open') {
        // Palm out, four thick fingers spread.
        const palm = p.smooth([-r * 1.05, -0.2, r * 1.05, -0.2, r * 1.2, r * 1.1, r * 1.1, r * 2.3, r * 0.4, r * 2.7, -r * 0.4, r * 2.7, -r * 1.1, r * 2.3, -r * 1.3, r * 1.0]);
        p.shape(palm, skinStyle(far, r));
        for (const x of [-0.55, -0.05, 0.45]) p.line([r * x, r * 1.8, r * (x + 0.08), r * 2.6], LINE * 0.45, C.skinDeep, false, 0.6);
        p.shape(p.capsule(-r * 1.0, r * 0.7, r * 0.42, -r * 1.7, r * 1.6, r * 0.36), skinStyle(far, r * 0.4));
        return;
      }
      // A huge fist: knuckles forward, thumb wrapped over.
      const fist = p.smooth([-r * 1.1, 0, r * 0.9, -0.1, r * 1.35, r * 0.7, r * 1.3, r * 1.75, r * 0.6, r * 2.3, -r * 0.7, r * 2.2, -r * 1.25, r * 1.4], true, 0.45);
      p.shape(fist, skinStyle(far, r));
      p.within(fist, () => {
        for (let i = 0; i < 3; i++) p.line([r * 0.55, r * (0.55 + i * 0.52), r * 1.35, r * (0.6 + i * 0.52)], LINE * 0.42, C.skinDeep, false, 0.65);
        p.line([-r * 0.9, r * 1.25, r * 0.4, r * 1.45], LINE * 0.5, C.skinDeep, true, 0.6);
      });
    },
  };
}

function head(p: Paint): void {
  // A thick neck, then a small blocky head: heavy brow, square jaw.
  p.shape(p.capsule(0.2, 1.4, 3.4, 0.8, -2.8, 3.1), skinStyle(false, 3));
  const face = p.smooth([-3.6, -0.8, -4.2, -4.8, -3.2, -8.6, 0.6, -9.6, 4.0, -8.8, 5.4, -6.8, 5.6, -5.0, 6.4, -3.8, 5.8, -1.2, 3.6, 0.6, -0.4, 0.6]);
  p.shape(face, skinStyle(false, 5));
  p.within(face, () => {
    p.fill(p.ellipse(0.6, -7.6, 2.6, 1.3), C.skinLight, 0.35);
    p.line([-1.6, -0.4, 3.4, 0.2], LINE * 0.6, C.skinDeep, true, 0.45);
  });
  // The topknot: a black tuft tied with a white band at the back of the crown.
  const knot = p.spiky([-3.2, -8.0, -1.6, -9.8, -3.0, -13.0, -0.8, -11.6, 0.2, -14.2, 1.0, -11.0, 2.4, -12.4, 1.8, -9.2], [false, false, true, false, true, false, true, false]);
  p.shape(knot, { fill: { linear: [0, -14.2, 0, -8.6], stops: [[0, 0x4a4256], [1, C.hair]] }, shade: shadeOf(C.hair, 0.3), shadeDepth: 0.6 });
  p.shape(p.rrect(-2.2, -10.4, 4.0, 1.3, 0.45), { fill: C.band, ink: LINE * 0.5 });
}

/** Four yellow eyes, two rows (the near column bigger), glowing a little. */
function eyes(p: Paint, v: string): void {
  const spots = [[-0.2, -1.2, 1.05, 0.72], [0.2, 1.1, 0.95, 0.64], [2.6, -1.1, 0.72, 0.6], [2.8, 1.1, 0.66, 0.54]] as const;
  for (const [x, y, rx, ry] of spots) {
    if (v === 'blink' || v === 'hurt') {
      p.line([x - rx, y, x + rx, y + 0.1], LINE * 0.9, INK);
      continue;
    }
    const grow = v === 'wide' ? 1.2 : 1;
    const e = p.ellipse(x, y, rx * grow, ry * grow * (v === 'angry' ? 0.72 : 1), v === 'angry' ? 0.22 : 0);
    p.glow(x, y, rx * 2.2, C.eye, 0.3);
    p.shape(e, { fill: { radial: [x - rx * 0.3, y - ry * 0.3, 0, x, y, rx], stops: [[0, 0xffffff], [0.4, C.eye], [1, shadeOf(C.eye, 0.25)]] }, ink: LINE * 0.6 });
    p.fill(p.circle(x + rx * 0.3, y, ry * 0.42), INK);
  }
  if (v === 'angry') p.line([-1.6, -2.3, 1.4, -1.5, 3.6, -2.1], LINE * 1.25, C.skinDeep, true);
  else p.line([-1.4, -2.6, 1.4, -2.4, 3.6, -2.2], LINE * 0.9, C.skinDeep, true, 0.8);
}

function mouth(p: Paint, v: string): void {
  if (v === 'shout' || v === 'grit' || v === 'open' || v === 'grin') {
    const m = v === 'grit' ? p.rrect(-2.2, -0.9, 4.6, 1.8, 0.5) : p.smooth([-2.2, -0.8, 2.4, -1.0, 1.8, 1.4, -1.6, 1.2], true, 0.4);
    p.shape(m, { fill: C.mouth, ink: LINE * 0.7 });
    p.within(m, () => {
      p.fill(p.rrect(-3, -1.4, 6, 1.25, 0.3), C.teeth);
      if (v === 'grit') p.fill(p.rrect(-3, 0.2, 6, 1.2, 0.3), C.teeth);
    });
    return;
  }
  p.line([-2.0, 0, 0, 0.4, 2.2, -0.3], LINE * 0.85, INK, true);
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 20, h: 22, px: 9.5, py: 19, draw: (p) => torso(p) },
    { id: 'pelvis', w: 13, h: 7, px: 6.5, py: 2.6, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 9, h: 11, px: 4.5, py: 1.6, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 9, h: 11, px: 4.5, py: 1.6, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 9, h: 10, px: 4.5, py: 2.2, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 9, h: 10, px: 4.5, py: 2.2, draw: (p) => shin(p, true) },
    { id: 'footF', w: 12, h: 5, px: 4, py: 3, draw: (p) => foot(p, false) },
    { id: 'footB', w: 12, h: 5, px: 4, py: 3, draw: (p) => foot(p, true) },
    { id: 'armUF', w: 9, h: 15, px: 4.5, py: 4.2, draw: (p) => upperArm(p, false, false) },
    { id: 'armUB', w: 9, h: 15, px: 4.5, py: 4.2, draw: (p) => upperArm(p, true, false) },
    { id: 'armLF', w: 8, h: 10, px: 4, py: 1.6, draw: (p) => forearm(p, false, false) },
    { id: 'armLB', w: 8, h: 10, px: 4, py: 1.6, draw: (p) => forearm(p, true, false) },
    hand('handF', false, false),
    hand('handB', true, false),
    { id: 'armUF2', w: 8, h: 13, px: 4, py: 3.4, draw: (p) => upperArm(p, false, true) },
    { id: 'armUB2', w: 8, h: 13, px: 4, py: 3.4, draw: (p) => upperArm(p, true, true) },
    { id: 'armLF2', w: 7, h: 9, px: 3.5, py: 1.4, draw: (p) => forearm(p, false, true) },
    { id: 'armLB2', w: 7, h: 9, px: 3.5, py: 1.4, draw: (p) => forearm(p, true, true) },
    hand('handF2', false, true),
    hand('handB2', true, true),
    { id: 'head', w: 13, h: 19, px: 5, py: 15.5, draw: (p) => head(p) },
    { id: 'eyes', w: 7, h: 7, px: 2.2, py: 3.4, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 7, h: 4, px: 3.5, py: 2, variants: ['smile', 'open', 'grit', 'shout', 'grin'], draw: (p, v) => mouth(p, v) },
  ];
}

/** The lower arms follow the upper ones a beat behind unless a clip poses them. */
function followArms(p: Pose): void {
  const a = p.a;
  const i = p.info;
  a[i.bone('armUF2')] = a[i.bone('armUF')] * 0.8 - 6;
  a[i.bone('armLF2')] = a[i.bone('armLF')] * 0.9 + 6;
  a[i.bone('armUB2')] = a[i.bone('armUB')] * 0.8 + 6;
  a[i.bone('armLB2')] = a[i.bone('armLB')] * 0.9 + 6;
}

function withLowerArms(clip: ClipDef): ClipDef {
  return { ...clip, pose: (t, p) => { clip.pose(t, p); followArms(p); } };
}

function fourArmClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const stance: PoseData = { hip: { y: 0.6 }, torso: 6, head: -4, armUF: 30, armLF: 80, armUB: 20, armLB: 70, armUF2: 10, armLF2: 70, armUB2: 4, armLB2: 60, thighF: 12, shinF: -10, thighB: -12, shinB: -6 };
  const stanceKeys = k([[0, stance]]);
  // Arms raised overhead pass behind the head (as in his pixel sheet).
  const headFront = (data: PoseData): PoseData => {
    const face = (id: string, z: number) => {
      const key = data[id];
      return typeof key === 'object' ? { ...key, z } : key === undefined ? { z } : { a: key, z };
    };
    return { ...data, head: face('head', 90), eyes: face('eyes', 91), mouth: face('mouth', 92) };
  };
  const hold = (data: PoseData, ms = 120): ClipDef => {
    const keys = k([[0, stance], [1, data]]);
    return { ms, loop: false, pose: (t, p) => p.keys(keys, t) };
  };
  const carry = headFront({ torso: -2, head: -6, armUF: 165, armLF: 20, armUB: 158, armLB: 24, armUF2: 120, armLF2: -70, armUB2: 112, armLB2: -66, handF: { v: 'open' }, handB: { v: 'open' } });
  const carryKeys = k([[0, carry]]);
  const out: Record<string, ClipDef> = {};
  for (const [name, clip] of Object.entries(base)) out[name] = withLowerArms(clip);
  return {
    ...out,
    idle: {
      ms: 1700,
      loop: true,
      pose: (t, p) => {
        const b = wave(t);
        p.keys(stanceKeys, 0);
        p.move('hip', 0, b * 0.5).size('torso', 1 + b * 0.02, 1 + b * 0.025);
        p.add('armUF', b * 3).add('armUF2', -b * 3).add('head', wave(t, 0.2) * 1.5);
      },
    },
    punchA: hold({ hip: { x: 1.4 }, torso: 16, head: -8, armUF: 92, armLF: 0, armUB: -30, armLB: 90, armUF2: 20, armLF2: 90, armUB2: 10, armLB2: 70, thighF: 22, shinF: -14, thighB: -20, shinB: -10, eyes: { v: 'angry' }, mouth: { v: 'grit' } }, 90),
    punchB: hold({ hip: { x: 1.6 }, torso: 18, head: -8, armUF: 40, armLF: 90, armUB: 10, armLB: 70, armUF2: 92, armLF2: 0, armUB2: -40, armLB2: 90, thighF: 24, shinF: -14, thighB: -22, shinB: -10, eyes: { v: 'angry' }, mouth: { v: 'shout' } }, 90),
    haymakerUp: hold({ hip: { x: -1 }, torso: -14, head: 0, armUF: -70, armLF: 60, armUB: 40, armLB: 60, armUF2: -60, armLF2: 70, armUB2: 30, armLB2: 60, thighF: 20, shinF: -14, thighB: -16, shinB: -12, eyes: { v: 'angry' }, mouth: { v: 'grit' } }, 160),
    haymaker: hold({ hip: { x: 2.4, y: 1 }, torso: 26, head: -14, armUF: 104, armLF: -10, armUB: -40, armLB: 70, armUF2: 96, armLF2: -4, armUB2: -50, armLB2: 80, thighF: 34, shinF: -26, thighB: -30, shinB: -12, footB: 24, eyes: { v: 'angry' }, mouth: { v: 'shout' } }, 80),
    clap: hold(headFront({ torso: -4, head: -12, armUF: 172, armLF: -16, armUB: 168, armLB: -20, armUF2: 120, armLF2: -40, armUB2: 112, armLB2: -36, handF: { v: 'open' }, handB: { v: 'open' }, eyes: { v: 'angry' }, mouth: { v: 'shout' } }), 110),
    slamUp: hold(headFront({ hip: { y: -1 }, torso: -6, head: -10, armUF: 170, armLF: 6, armUB: 165, armLB: 10, armUF2: 150, armLF2: 10, armUB2: 146, armLB2: 14, thighF: 50, shinF: -80, footF: 30, thighB: 20, shinB: -70, footB: 30, eyes: { v: 'angry' }, mouth: { v: 'shout' } }), 160),
    slam: hold({ hip: { y: 4 }, torso: 32, head: -14, armUF: 50, armLF: 10, armUB: 46, armLB: 14, armUF2: 40, armLF2: 10, armUB2: 34, armLB2: 14, thighF: 60, shinF: -100, footF: 40, thighB: 40, shinB: -100, footB: 60, eyes: { v: 'angry' }, mouth: { v: 'grit' } }, 70),
    meteor: hold({ torso: 34, head: -20, armUF: 20, armLF: 0, armUB: 16, armLB: 4, armUF2: 10, armLF2: 0, armUB2: 6, armLB2: 4, thighF: 70, shinF: -110, footF: 30, thighB: 60, shinB: -110, footB: 30, eyes: { v: 'angry' }, mouth: { v: 'shout' } }, 140),
    carry: { ms: 1200, loop: true, pose: (t, p) => { p.keys(carryKeys, 0); p.move('hip', 0, wave(t) * 0.5); p.set('thighF', 10).set('shinF', -8).set('thighB', -10).set('shinB', -6); } },
    carryRun: {
      ms: 620,
      loop: true,
      pose: (t, p) => {
        base.run.pose(t, p);
        p.keys(carryKeys, 0);
        p.set('torso', 4);
      },
    },
    throw: hold({ hip: { x: 1.6 }, torso: 20, head: -10, armUF: 120, armLF: 0, armUB: 110, armLB: 6, armUF2: 90, armLF2: 0, armUB2: 80, armLB2: 6, handF: { v: 'open' }, handB: { v: 'open' }, thighF: 28, shinF: -20, thighB: -24, shinB: -10, eyes: { v: 'angry' }, mouth: { v: 'shout' } }, 90),
    swim: withLowerArms({
      ms: 900,
      loop: true,
      pose: (t, p) => {
        base.walk.pose(t, p);
        p.set('armUF', 60 + wave(t) * 40).set('armLF', 20).set('armUB', 50 - wave(t) * 40).set('armLB', 20);
        p.set('torso', 14);
      },
    }),
    tread: withLowerArms({
      ms: 1100,
      loop: true,
      pose: (t, p) => {
        p.keys(stanceKeys, 0);
        p.set('armUF', 70 + wave(t) * 30).set('armLF', -20).set('armUB', 60 - wave(t) * 30).set('armLB', -20);
      },
    }),
  };
}

/** Four Arms' HD rig: the humanoid kit with a second pair of arms and every punch, slam and throw he has. */
export function fourarmsRig(): RigDef {
  const D = FOURARMS_DIMS;
  return humanRig({
    id: 'fourarms',
    dims: D,
    parts: parts(),
    style: FOURARMS_CARTOON.style!,
    extraBones: [
      { id: 'armUB2', parent: 'torso', x: LOWER_B.x, y: LOWER_B.y, part: 'armUB2', z: 7, dir: -1 },
      { id: 'armLB2', parent: 'armUB2', x: 0, y: D.upperArm * 0.86, part: 'armLB2', z: 6.5, dir: -1 },
      { id: 'handB2', parent: 'armLB2', x: 0, y: D.forearm * 0.86, part: 'handB2', z: 6.2, dir: -1 },
      { id: 'armUF2', parent: 'torso', x: LOWER_F.x, y: LOWER_F.y, part: 'armUF2', z: 76, dir: -1 },
      { id: 'armLF2', parent: 'armUF2', x: 0, y: D.upperArm * 0.86, part: 'armLF2', z: 77, dir: -1 },
      { id: 'handF2', parent: 'armLF2', x: 0, y: D.forearm * 0.86, part: 'handF2', z: 78, dir: -1 },
    ],
    bounds: { left: -26, right: 28, top: -50, bottom: 2 },
    clips: fourArmClips,
  });
}
