import { GHOSTFREAK_CARTOON } from '../../../../config/cartoon/ghostfreak';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { LINE, mix, type Paint, type ShapeStyle } from '../paint';
import { wave, type ClipDef, type PartSpec, type Pose, type PoseData, type RigDef, type RigInfo } from '../rig';
import { omnitrixBadge } from './alienBits';

const C = GHOSTFREAK_CARTOON.colors;

export const GHOSTFREAK_DIMS: HumanDims = {
  hip: 12.4,
  thigh: 1,
  shin: 1,
  ankle: 0,
  torso: 13.0,
  shoulderF: { x: 2.6, y: -12.0 },
  shoulderB: { x: -3.4, y: -11.8 },
  upperArm: 5.6,
  forearm: 5.2,
  hipF: 0,
  hipB: 0,
  neck: { x: 0.4, y: -13.2 },
  eyes: { x: 3.4, y: -6.8 },
  mouth: { x: 3.6, y: -1.6 },
};

function ghost(far = false, r = 3): ShapeStyle {
  const base = far ? C.shade : C.body;
  return {
    fill: { linear: [-r, -r, r, r * 2.4], stops: [[0, far ? C.body : C.face], [0.55, base], [1, mix(base, C.deep, 0.5)]] },
    inkColor: C.rim,
    shade: C.shade,
    shadeDepth: r * 0.6,
    light: 0xffffff,
    lightDepth: r * 0.25,
    lightAlpha: far ? 0.2 : 0.6,
  };
}

function torso(p: Paint): void {
  const body = p.smooth([-5.8, -13.8, 0, -14.8, 5.0, -13.6, 4.4, -6.4, 2.4, 0.4, -3.6, 0.4, -6.2, -6.8]);
  p.shape(body, ghost(false, 5));
  p.within(body, () => {
    p.fill(p.poly([1.4, -14, 6, -14, 4, 0.6, 1.2, 0.6]), C.shade, 0.55);
    // Black stripe ribs.
    for (let i = 0; i < 3; i++) p.line([-6.0, -11.0 + i * 3.0, -3.4, -10.6 + i * 3.0, -1.0, -9.6 + i * 3.0], LINE * 1.15, C.stripe, true);
  });
  omnitrixBadge(p, 2.4, -8.6, 1.25, C.omnitrix);
}

function head(p: Paint): void {
  // A hooded skull: a high back that hooks forward over the crown, a pale face, the jaw stitched shut.
  const skull = p.smooth([-6.6, -5.0, -6.2, -11.0, -3.2, -15.6, 1.6, -16.6, 0.6, -13.4, 4.6, -12.0, 7.0, -7.4, 6.8, -2.6, 4.6, 0.6, -1.4, 0.8, -5.6, -1.6]);
  p.shape(skull, ghost(false, 6));
  p.within(skull, () => {
    p.fill(p.ellipse(-0.6, -8.6, 4.6, 4.4), C.face, 0.8);
    p.line([-6.0, -9.0, -3.6, -14.2, 0.2, -15.6], LINE * 1.2, C.stripe, true);
    p.line([-6.8, -4.0, -4.4, -9.6, -2.6, -11.6], LINE * 1.1, C.stripe, true);
    p.fill(p.ellipse(4.0, -4.6, 2.6, 1.2), C.shade, 0.4);
  });
}

/** His one great eye: violet in a black ring, a pinprick pupil. */
function eyes(p: Paint, v: string): void {
  const r = v === 'wide' ? 3.3 : 3.0;
  p.shape(p.circle(0, 0, r), { fill: C.stripe, inkColor: C.rim, ink: LINE * 0.6 });
  if (v === 'blink' || v === 'hurt') {
    p.line([-r * 0.7, 0, r * 0.7, 0.2], LINE * 0.9, C.eye, true);
    return;
  }
  const ir = r * (v === 'angry' ? 0.6 : 0.68);
  p.glow(0, 0, r * 2.2, C.eye, 0.45);
  p.fill(p.ellipse(0.2, 0, ir, v === 'angry' ? ir * 0.7 : ir), { radial: [-ir * 0.3, -ir * 0.3, 0, 0, 0, ir], stops: [[0, C.eyeGlow], [0.7, C.eye], [1, mix(C.eye, C.stripe, 0.4)]] });
  p.fill(p.circle(0.4, 0, ir * 0.22), 0xffffff, 0.95);
  p.fill(p.circle(-ir * 0.35, -ir * 0.45, ir * 0.25), 0xffffff, 0.9);
}

/** The jaw: stitched shut, or gaping in a scream. */
function mouth(p: Paint, v: string): void {
  if (v === 'shout' || v === 'open' || v === 'o' || v === 'grin') {
    const gape = p.smooth([-2.8, -1.4, 3.0, -1.6, 2.6, 3.4, -2.4, 3.2], true, 0.35);
    p.shape(gape, { fill: C.stripe, inkColor: C.rim, ink: LINE * 0.6 });
    p.within(gape, () => {
      for (const x of [-1.6, 0.2, 2.0]) p.fill(p.poly([x - 0.5, -1.6, x + 0.5, -1.6, x, -0.6]), C.body);
      for (const x of [-0.8, 1.2]) p.fill(p.poly([x - 0.5, 3.4, x + 0.5, 3.4, x, 2.4]), C.body);
    });
    return;
  }
  p.line([-2.6, 0, 2.8, -0.2], LINE * 0.8, C.stripe, true);
  for (const x of [-1.6, 0.2, 2.0]) p.line([x, -0.9, x + 0.1, 0.8], LINE * 0.55, C.stripe);
}

function arm(p: Paint, len: number, r0: number, r1: number, far: boolean, stripe: boolean): void {
  const path = p.capsule(0, 0, r0, 0, len, r1);
  p.shape(path, ghost(far, r0));
  if (stripe) p.within(path, () => p.line([-r0, len * 0.45, r0, len * 0.55], LINE * 0.9, C.stripe));
}

/** Three hooked black claws. */
function claws(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 7,
    h: 7,
    px: 3,
    py: 1.2,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      p.shape(p.ellipse(0, 0.6, 1.0, 0.9), ghost(far, 1));
      const spread = v === 'open' ? 0.85 : v === 'point' ? 0.1 : 0.4;
      for (let i = -1; i <= 1; i++) {
        const a = i * spread + 0.35;
        p.shape(p.horn(i * 0.35 - 0.3, 0.8, Math.sin(a) * 2.0 + i * 0.3, 1.0 + Math.cos(a) * 2.0, Math.sin(a + 0.5) * 3.3 + 0.4, 1.2 + Math.cos(a + 0.5) * 3.0, 0.6), { fill: C.claw, inkColor: C.rim, ink: LINE * 0.4 });
      }
    },
  };
}

/** The misty tail: three tapering wisps that blend into one, fading out at the tip (ink only down the sides). */
function tail(len: number, r0: number, r1: number, fade: number): (p: Paint) => void {
  return (p) => {
    const top = -r0 * 0.6;
    const path = p.smooth([-r0, top, r0, top, r1 * 1.15, len * 0.6, r1, len + 0.8, -r1, len + 0.8, -r1 * 1.25, len * 0.5], true, 0.5);
    p.ctx.globalAlpha = fade;
    p.shape(path, { ...ghost(false, r0), ink: false });
    p.line([r0 + 0.1, 0, r1 * 1.2, len * 0.6, r1 + 0.05, len + 0.6], LINE * 0.85, C.rim, true);
    p.line([-r0 - 0.1, 0, -r1 * 1.3, len * 0.5, -r1 - 0.05, len + 0.6], LINE * 0.85, C.rim, true);
    if (r1 < 1) {
      p.line([-r1, len + 0.4, 0, len + 1.6, r1 * 0.6, len + 0.6], LINE * 0.85, C.rim, true);
      p.glow(0, len, 2.4, C.glow, 0.45);
    }
    p.ctx.globalAlpha = 1;
  };
}

/** A pink tentacle whipping forward from the chest. */
function tentacle(len: number): (p: Paint, v: string) => void {
  return (p, v) => {
    const L = v === 'long' ? len * 1.5 : len;
    const pts: number[] = [];
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(t * L, Math.sin(t * 5.2) * (1 - t) * 1.6);
    }
    p.line(pts, 2.4, C.rim, true);
    p.line(pts, 1.7, C.tentacleDark, true);
    p.line(pts, 1.0, C.tentacle, true);
    p.fill(p.circle(L, pts[pts.length - 1], 0.9), C.tentacle);
  };
}

const empty = (id: string): PartSpec => ({ id, w: 1, h: 1, px: 0.5, py: 0.5, draw: () => undefined });

function parts(): PartSpec[] {
  const D = GHOSTFREAK_DIMS;
  return [
    { id: 'torso', w: 14, h: 18, px: 7, py: 16, draw: (p) => torso(p) },
    empty('pelvis'),
    empty('thighF'),
    empty('thighB'),
    empty('shinF'),
    empty('shinB'),
    empty('footF'),
    empty('footB'),
    { id: 'armUF', w: 4, h: 8, px: 2, py: 1.4, draw: (p) => arm(p, D.upperArm, 1.15, 0.9, false, true) },
    { id: 'armUB', w: 4, h: 8, px: 2, py: 1.4, draw: (p) => arm(p, D.upperArm, 1.15, 0.9, true, false) },
    { id: 'armLF', w: 4, h: 7, px: 2, py: 1.2, draw: (p) => arm(p, D.forearm, 0.9, 0.75, false, false) },
    { id: 'armLB', w: 4, h: 7, px: 2, py: 1.2, draw: (p) => arm(p, D.forearm, 0.9, 0.75, true, false) },
    claws('handF', false),
    claws('handB', true),
    { id: 'head', w: 16, h: 20, px: 7.2, py: 17.6, draw: (p) => head(p) },
    { id: 'eyes', w: 14, h: 14, px: 7, py: 7, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 8, h: 7, px: 3.5, py: 2.5, variants: ['smile', 'shout', 'open', 'o', 'grin', 'grit', 'frown', 'flat', 'smirk'], draw: (p, v) => mouth(p, v) },
    { id: 'tail1', w: 10, h: 8, px: 5, py: 1, draw: tail(5.2, 4.2, 3.0, 1) },
    { id: 'tail2', w: 8, h: 7, px: 4, py: 1, draw: tail(4.6, 3.0, 1.8, 0.92) },
    { id: 'tail3', w: 6, h: 7, px: 3, py: 1, draw: tail(4.4, 1.8, 0.4, 0.75) },
    { id: 'tentA', w: 26, h: 6, px: 1, py: 3, variants: ['short', 'long'], draw: tentacle(10) },
    { id: 'tentB', w: 26, h: 6, px: 1, py: 3, variants: ['short', 'long'], draw: tentacle(9) },
  ];
}

function tailWave(p: Pose, t: number, stream: number): void {
  p.set('tail1', -stream * 20 + wave(t) * 6).set('tail2', -stream * 26 + wave(t, 0.2) * 12).set('tail3', -stream * 30 + wave(t, 0.4) * 18);
}

function ghostClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const out: Record<string, ClipDef> = {};
  // Every shared clip floats: no legs, a live tail, no tentacles unless he lashes.
  for (const [name, clip] of Object.entries(base)) {
    out[name] = {
      ...clip,
      pose: (t, p) => {
        clip.pose(t, p);
        p.move('hip', 0, wave(t) * 0.5);
        tailWave(p, t, 0.2);
        p.hidden('tentA').hidden('tentB');
      },
    };
  }
  const idle: ClipDef = {
    ms: 2000,
    loop: true,
    pose: (t, p) => {
      const b = wave(t);
      p.move('hip', 0, -0.4 + b * 1.0);
      p.set('torso', 6 + b * 1.5).set('head', -4 + wave(t, 0.2) * 3);
      p.set('armUF', 34 + b * 4).set('armLF', 20 + wave(t, 0.3) * 6).set('armUB', 20 - b * 4).set('armLB', 24);
      tailWave(p, t, 0.2);
      p.hidden('tentA').hidden('tentB');
    },
  };
  const lash = (long: boolean): ClipDef => {
    const keys = k([
      [0, { torso: 2, head: -2, armUF: 20, armLF: 30, armUB: 10, armLB: 30 }],
      [0.3, { torso: 12, head: -6, armUF: 30, armLF: 20, armUB: 50, armLB: 30, eyes: { v: 'angry' }, mouth: { v: long ? 'shout' : 'smile' } }],
      [1, { torso: 10, head: -4, armUF: 26, armLF: 22, armUB: 46, armLB: 30, eyes: { v: 'angry' }, mouth: { v: long ? 'shout' : 'smile' } }],
    ]);
    return {
      ms: long ? 280 : 220,
      loop: false,
      pose: (t, p) => {
        p.keys(keys, t);
        tailWave(p, t, 0.4);
        const out = Math.min(1, t / 0.3);
        const v = long ? 'long' : 'short';
        p.show('tentA', v).show('tentB', v).size('tentA', out, 1).size('tentB', out * 0.92, 1);
        p.set('tentA', wave(t * 2) * 6 - 4).set('tentB', wave(t * 2, 0.3) * 6 + 6);
      },
    };
  };
  return {
    ...out,
    idle,
    run: {
      ms: 700,
      loop: true,
      pose: (t, p) => {
        p.move('hip', 0, wave(t * 2) * 0.6);
        p.set('torso', 18).set('head', -10);
        p.set('armUF', -30 + wave(t) * 8).set('armLF', 30).set('armUB', -40 - wave(t) * 8).set('armLB', 30);
        tailWave(p, t * 2, 1);
        p.hidden('tentA').hidden('tentB');
      },
    },
    jump: {
      ms: 400,
      loop: false,
      pose: (t, p) => {
        p.set('torso', -2).set('head', -6).set('armUF', 120 - t * 30).set('armLF', 20).set('armUB', 110 - t * 30).set('armLB', 20);
        tailWave(p, t, 0.6);
        p.hidden('tentA').hidden('tentB');
      },
    },
    fall: {
      ms: 1200,
      loop: true,
      pose: (t, p) => {
        p.set('torso', 2).set('head', 4).set('armUF', 140 + wave(t) * 10).set('armLF', 20).set('armUB', 130 - wave(t) * 10).set('armLB', 24);
        tailWave(p, t, 0.1);
        p.add('tail1', 10).add('tail2', 10);
        p.hidden('tentA').hidden('tentB');
      },
    },
    land: {
      ms: 300,
      loop: false,
      pose: (t, p) => {
        const s = 1 - t;
        idle.pose(0, p);
        p.move('hip', 0, s * 1.2).size('torso', 1 + s * 0.06, 1 - s * 0.08);
      },
    },
    lash: lash(false),
    lashLong: lash(true),
    phase: {
      ms: 900,
      loop: true,
      pose: (t, p) => {
        // Arms wrapped round himself, claws hooked over the shoulders.
        p.move('hip', 0, wave(t) * 0.8);
        p.set('torso', -4).set('head', 6).set('armUF', 150).set('armLF', -140).set('armUB', 140).set('armLB', -130);
        p.front('armUF', 76).front('armLF', 77).front('handF', 78);
        tailWave(p, t, 0.3);
        p.show('eyes', 'shut').hidden('tentA').hidden('tentB');
      },
    },
    scream: {
      ms: 300,
      loop: true,
      pose: (t, p) => {
        const s = wave(t * 2) * 0.5;
        p.set('torso', -10 + s).set('head', -16 + s * 2).set('armUF', 150 + s * 4).set('armLF', -20).set('armUB', 160 - s * 4).set('armLB', -16);
        p.show('handF', 'open').show('handB', 'open').show('mouth', 'shout').show('eyes', 'wide');
        tailWave(p, t, 0.3);
        p.hidden('tentA').hidden('tentB');
      },
    },
    hurt: {
      ...base.hurt,
      pose: (t, p) => {
        base.hurt.pose(t, p);
        tailWave(p, t, -0.6);
        p.show('eyes', 'hurt').hidden('tentA').hidden('tentB');
      },
    },
    swim: {
      ms: 1400,
      loop: true,
      pose: (t, p) => {
        idle.pose(t, p);
        p.set('torso', 22).set('head', -14);
        tailWave(p, t * 2, 0.8);
      },
    },
  };
}

/** Ghostfreak's HD rig: the humanoid kit floating on a misty tail, with his one eye, a gaping scream, claws and chest tentacles. */
export function ghostfreakRig(): RigDef {
  return humanRig({
    id: 'ghostfreak',
    dims: GHOSTFREAK_DIMS,
    parts: parts(),
    style: GHOSTFREAK_CARTOON.style!,
    extraBones: [
      { id: 'tail1', parent: 'hip', x: -0.4, y: 0.2, part: 'tail1', z: 51, dir: -1 },
      { id: 'tail2', parent: 'tail1', x: 0, y: 5.0, part: 'tail2', z: 29, dir: -1 },
      { id: 'tail3', parent: 'tail2', x: 0, y: 4.4, part: 'tail3', z: 28, dir: -1 },
      { id: 'tentA', parent: 'torso', x: 3.8, y: -8.0, part: 'tentA', z: 75, dir: 1 },
      { id: 'tentB', parent: 'torso', x: 3.6, y: -6.6, part: 'tentB', z: 74, dir: 1 },
    ],
    bounds: { left: -16, right: 26, top: -38, bottom: 2 },
    clips: ghostClips,
  });
}
