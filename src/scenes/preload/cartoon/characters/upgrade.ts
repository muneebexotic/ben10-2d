import { UPGRADE_CARTOON } from '../../../../config/cartoon/upgrade';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { LINE, mix, type Paint, type ShapeStyle } from '../paint';
import { wave, type ClipDef, type PartSpec, type PoseData, type RigDef, type RigInfo } from '../rig';
import { omnitrixBadge } from './alienBits';

const C = UPGRADE_CARTOON.colors;

export const UPGRADE_DIMS: HumanDims = {
  hip: 11.6,
  thigh: 5.4,
  shin: 5.0,
  ankle: 0.6,
  torso: 8.8,
  shoulderF: { x: 0.8, y: -7.8 },
  shoulderB: { x: -0.8, y: -7.6 },
  upperArm: 4.6,
  forearm: 4.4,
  hipF: 0.9,
  hipB: -0.9,
  neck: { x: 0.4, y: -9.0 },
  eyes: { x: 3.2, y: -6.6 },
  mouth: { x: 3.2, y: -3.0 },
};

/** Liquid metal: near-black with a cool sheen and a teal rim, inked in very dark teal. */
function metal(far = false, r = 2): ShapeStyle {
  const base = far ? C.body : mix(C.body, C.body2, 0.35);
  return {
    fill: { linear: [-r, -r, r, r * 2], stops: [[0, mix(C.sheen, base, 0.5)], [0.35, base], [1, C.body]] },
    inkColor: C.ink,
    shade: 0x050608,
    shadeDepth: r * 0.5,
    light: C.rim,
    lightDepth: r * 0.32,
    lightAlpha: far ? 0.35 : 0.8,
  };
}

/** A circuit line with glowing nodes. */
function circuit(p: Paint, pts: readonly number[], nodes: ReadonlyArray<readonly [number, number]>, far = false): void {
  p.line(pts, LINE * 1.2, C.dark, false, far ? 0.4 : 0.6);
  p.line(pts, LINE * 0.5, C.line, false, far ? 0.5 : 1);
  for (const [x, y] of nodes) {
    p.glow(x, y, 1.2, C.line, far ? 0.25 : 0.5);
    p.fill(p.circle(x, y, 0.42), C.glow, far ? 0.6 : 1);
  }
}

function torso(p: Paint): void {
  const body = p.smooth([-2.4, 0.8, 2.2, 0.8, 3.0, -3.4, 3.6, -7.6, 2.2, -9.4, -1.6, -9.4, -3.4, -7.8, -3.0, -3.6]);
  p.shape(body, metal(false, 3));
  p.within(body, () => {
    circuit(p, [0.6, -8.8, 0.6, 0.6], [[0.6, -8.2], [0.6, -1.0]]);
    circuit(p, [0.6, -6.6, 2.8, -5.0], [[2.8, -5.0]]);
    circuit(p, [0.6, -2.6, -2.2, -1.0], [[-2.2, -1.0]]);
  });
  omnitrixBadge(p, 0.6, -4.6, 1.15, C.omnitrix);
}

function pelvis(p: Paint): void {
  p.shape(p.smooth([-2.6, -1.0, 2.4, -1.0, 2.4, 1.2, 0.6, 2.2, -1.2, 2.2, -2.8, 1.2]), metal(false, 2));
}

function head(p: Paint): void {
  // A thin neck, then the smooth dome, circuits running back over it from the eye.
  p.shape(p.capsule(0, 1.0, 1.1, 0.4, -2.4, 1.0), metal(false, 1));
  const dome = p.ellipse(0.8, -6.4, 5.8, 6.0);
  p.shape(dome, { ...metal(false, 5), gloss: { x: -1.2, y: -10.0, rx: 2.6, ry: 1.1, alpha: 0.35, angle: -0.3 } });
  p.within(dome, () => {
    circuit(p, [-0.4, -9.6, -2.6, -8.4, -4.4, -6.0], [[-2.6, -8.4], [-4.4, -6.0]]);
    circuit(p, [0.0, -3.4, -2.4, -2.4, -4.2, -3.4], [[-2.4, -2.4]]);
  });
}

/** His one big eye: a glowing green ring around a black pupil. */
function eyes(p: Paint, v: string): void {
  const r = v === 'wide' ? 3.0 : 2.7;
  if (v === 'blink' || v === 'hurt') {
    p.line([-r, 0, r, 0.2], LINE * 1.1, C.line, true);
    if (v === 'hurt') p.line([-r * 0.7, -1.4, r * 0.7, 1.4], LINE * 0.6, C.line, false, 0.8);
    return;
  }
  const fire = v === 'fire';
  p.glow(0, 0, r * (fire ? 3.4 : 2.0), C.line, fire ? 0.8 : 0.45);
  p.shape(p.circle(0, 0, r), { fill: { radial: [0, 0, r * 0.5, 0, 0, r], stops: [[0, fire ? 0xffffff : C.line], [1, fire ? C.line : C.dark]] }, inkColor: C.ink, ink: LINE * 0.7 });
  p.fill(p.circle(0.2, 0, r * 0.62), fire ? C.glow : C.pupil);
  if (!fire) {
    p.fill(p.circle(0.5, -0.4, r * 0.3), v === 'angry' ? C.glow : C.line);
    p.fill(p.circle(0.9, -0.8, r * 0.12), 0xffffff);
  }
  if (v === 'angry') p.fill(p.poly([-r - 0.4, -r - 0.4, r + 0.4, -r * 0.2, r + 0.4, -r - 0.8]), C.body);
}

function limb(p: Paint, len: number, r0: number, r1: number, far: boolean, trace: boolean): void {
  p.shape(p.capsule(0, 0, r0, 0, len, r1), metal(far, r0));
  if (trace) p.within(p.capsule(0, 0, r0, 0, len, r1), () => circuit(p, [0.2, 0.6, 0.2, len], [[0.2, len * 0.5]], far));
}

/** Rounded fingertips, like dripping metal. */
function hand(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 5,
    h: 5,
    px: 2.5,
    py: 1,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      const blob = v === 'open' ? p.smooth([-1.2, 0, 1.2, 0, 1.6, 1.6, 0.8, 2.8, -0.6, 2.8, -1.6, 1.4]) : p.ellipse(0, 1.1, 1.25, 1.3);
      p.shape(blob, metal(far, 1.2));
      if (v === 'point') p.shape(p.capsule(0.3, 1.4, 0.5, 0.6, 3.4, 0.45), metal(far, 0.6));
      p.fill(p.circle(0.3, 1.2, 0.35), C.line, far ? 0.4 : 0.9);
    },
  };
}

function foot(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 6,
    h: 3,
    px: 1.5,
    py: 1,
    draw: (p) => {
      p.shape(p.smooth([-1.2, -0.6, 1.4, -0.8, 3.6, 0.0, 3.8, 0.8, -1.4, 0.8], true, 0.45), metal(far, 1));
      p.fill(p.circle(2.8, 0.2, 0.35), C.line, far ? 0.4 : 0.9);
    },
  };
}

/** The puddle he melts into, the eye riding at the front. */
function puddle(p: Paint, v: string): void {
  const melt = v === 'melt';
  if (melt) {
    const blob = p.smooth([-6.0, 0, -4.6, -1.6, -2.2, -5.2, 0.6, -6.8, 3.2, -5.0, 4.6, -1.4, 6.4, 0]);
    p.shape(blob, metal(false, 4));
    p.within(blob, () => circuit(p, [-4.6, -0.6, -1.0, -2.6, 2.4, -1.0], [[-1.0, -2.6], [2.4, -1.0]]));
    return;
  }
  const pool = p.smooth([-9.0, 0.2, -7.0, -1.4, 0, -2.0, 6.6, -1.6, 9.4, 0.2], true, 0.45);
  p.shape(pool, { ...metal(false, 2), gloss: { x: -1, y: -1.4, rx: 5, ry: 0.4, alpha: 0.3 } });
  p.within(pool, () => circuit(p, [-7.4, -0.4, -2.0, -1.2, 3.0, -0.6, 7.0, -0.8], [[-4.6, -0.8], [0.6, -1.0], [5.0, -0.7]]));
}

function parts(): PartSpec[] {
  const D = UPGRADE_DIMS;
  return [
    { id: 'torso', w: 9, h: 12, px: 4, py: 10.5, draw: (p) => torso(p) },
    { id: 'pelvis', w: 7, h: 5, px: 3.5, py: 1.8, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 4, h: 8, px: 2, py: 1.8, draw: (p) => limb(p, D.thigh, 1.5, 1.2, false, true) },
    { id: 'thighB', w: 4, h: 8, px: 2, py: 1.8, draw: (p) => limb(p, D.thigh, 1.5, 1.2, true, false) },
    { id: 'shinF', w: 4, h: 7, px: 2, py: 1.5, draw: (p) => limb(p, D.shin, 1.2, 1.0, false, true) },
    { id: 'shinB', w: 4, h: 7, px: 2, py: 1.5, draw: (p) => limb(p, D.shin, 1.2, 1.0, true, false) },
    foot('footF', false),
    foot('footB', true),
    { id: 'armUF', w: 4, h: 7, px: 2, py: 1.5, draw: (p) => limb(p, D.upperArm, 1.15, 0.95, false, true) },
    { id: 'armUB', w: 4, h: 7, px: 2, py: 1.5, draw: (p) => limb(p, D.upperArm, 1.15, 0.95, true, false) },
    { id: 'armLF', w: 4, h: 7, px: 2, py: 1.3, draw: (p) => limb(p, D.forearm, 0.95, 0.85, false, true) },
    { id: 'armLB', w: 4, h: 7, px: 2, py: 1.3, draw: (p) => limb(p, D.forearm, 0.95, 0.85, true, false) },
    hand('handF', false),
    hand('handB', true),
    { id: 'head', w: 14, h: 16, px: 6.2, py: 13.6, draw: (p) => head(p) },
    { id: 'eyes', w: 20, h: 20, px: 10, py: 10, variants: ['open', 'blink', 'angry', 'wide', 'hurt', 'fire'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 1, h: 1, px: 0.5, py: 0.5, draw: () => undefined },
    { id: 'puddle', w: 20, h: 9, px: 10, py: 7.5, variants: ['pool', 'melt'], draw: (p, v) => puddle(p, v) },
  ];
}

const BODY = ['torso', 'hip', 'thighF', 'thighB', 'shinF', 'shinB', 'footF', 'footB', 'armUF', 'armUB', 'armLF', 'armLB', 'handF', 'handB', 'head', 'mouth'] as const;

function upgradeClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const out: Record<string, ClipDef> = {};
  // The puddle only shows when he merges.
  for (const [name, clip] of Object.entries(base)) out[name] = { ...clip, pose: (t, p) => { clip.pose(t, p); p.hidden('puddle'); } };
  const beam = (head: number, arms: PoseData): ClipDef => {
    const keys = k([[0, { torso: 4, head: 0, armUF: -30, armLF: 20, armUB: -40, armLB: 20, thighF: 14, shinF: -10, thighB: -14, shinB: -6, ...arms }], [0.3, { torso: 6, head, armUF: -40, armLF: 30, armUB: -50, armLB: 30, thighF: 16, shinF: -12, thighB: -16, shinB: -6, ...arms }]]);
    return {
      ms: 200,
      loop: true,
      pose: (t, p) => {
        p.keys(keys, Math.min(1, t * 3));
        p.show('eyes', 'fire').hidden('puddle');
        p.size('head', 1 + wave(t * 2) * 0.02);
      },
    };
  };
  return {
    ...out,
    idle: {
      ms: 1600,
      loop: true,
      pose: (t, p) => {
        base.idle.pose(t, p);
        // Liquid: a slow wobble through the whole body.
        p.size('torso', 1 + wave(t, 0.1) * 0.03, 1 - wave(t, 0.1) * 0.03);
        p.size('head', 1 - wave(t, 0.3) * 0.025, 1 + wave(t, 0.3) * 0.025);
        p.add('head', wave(t, 0.4) * 3);
        p.hidden('puddle');
      },
    },
    land: {
      ...base.land,
      pose: (t, p) => {
        base.land.pose(t, p);
        const s = 1 - t;
        p.size('torso', 1 + s * 0.14, 1 - s * 0.16).size('head', 1 + s * 0.12, 1 - s * 0.12);
        p.hidden('puddle');
      },
    },
    laser: beam(0, {}),
    laserUp: beam(-28, { torso: -6 }),
    laserDown: beam(30, { torso: 14 }),
    merge: {
      ms: 600,
      loop: false,
      pose: (t, p) => {
        // Melting: the body sinks and spreads, then only the puddle and his eye remain.
        const melt = Math.min(1, t / 0.3);
        if (melt < 1) {
          base.idle.pose(0, p);
          p.move('hip', 0, melt * 6).size('torso', 1 + melt * 0.5, 1 - melt * 0.6).size('head', 1 + melt * 0.3, 1 - melt * 0.5);
          p.set('armUF', 40 * melt).set('armUB', -40 * melt);
          p.show('puddle', 'melt').size('puddle', 0.4 + melt * 0.6, 0.3 + melt * 0.7);
          return;
        }
        for (const b of BODY) p.hidden(b);
        // The hips sink to the floor; the puddle stays on it and the eye rides at its front.
        const sink = UPGRADE_DIMS.hip - 1.0;
        p.move('hip', 0, sink).move('puddle', 0, -sink);
        p.show('puddle', 'pool').size('puddle', 1 + wave(t * 3) * 0.04, 1 - wave(t * 3) * 0.1);
        p.set('torso', 0).set('head', 0).move('head', 2.4, 15.0 + wave(t * 3) * 0.3);
      },
    },
    hurt: {
      ...base.hurt,
      pose: (t, p) => {
        base.hurt.pose(t, p);
        const r = (1 - t) * wave(t * 4);
        p.size('torso', 1 + r * 0.12, 1 - r * 0.12).size('head', 1 - r * 0.1, 1 + r * 0.1);
        p.hidden('puddle');
      },
    },
  };
}

/** Upgrade's HD rig: the humanoid kit in liquid metal, with circuits, one eye, an eye beam and a melt into a puddle. */
export function upgradeRig(): RigDef {
  return humanRig({
    id: 'upgrade',
    dims: UPGRADE_DIMS,
    parts: parts(),
    style: UPGRADE_CARTOON.style!,
    extraBones: [{ id: 'puddle', parent: 'hip', x: 0, y: UPGRADE_DIMS.hip - 0.2, part: 'puddle', z: 90, dir: 1 }],
    bounds: { left: -14, right: 14, top: -32, bottom: 2 },
    clips: upgradeClips,
  });
}

