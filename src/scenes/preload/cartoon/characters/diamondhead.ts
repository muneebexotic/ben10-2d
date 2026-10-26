import { DIAMONDHEAD_CARTOON } from '../../../../config/cartoon/diamondhead';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { LINE, mix, type Paint, type ShapeStyle } from '../paint';
import { wave, type ClipDef, type PartSpec, type PoseData, type RigDef, type RigInfo } from '../rig';
import { omnitrixBadge } from './alienBits';

const C = DIAMONDHEAD_CARTOON.colors;

export const DIAMONDHEAD_DIMS: HumanDims = {
  hip: 13.0,
  thigh: 6.4,
  shin: 6.0,
  ankle: 0.6,
  torso: 11.4,
  shoulderF: { x: 2.4, y: -10.0 },
  shoulderB: { x: -3.2, y: -9.8 },
  upperArm: 5.4,
  forearm: 5.0,
  hipF: 1.4,
  hipB: -1.4,
  neck: { x: 1.0, y: -11.4 },
  eyes: { x: 3.2, y: -5.8 },
  mouth: { x: 3.0, y: -2.2 },
};

function crystal(far = false): ShapeStyle {
  const main = far ? C.shade : C.main;
  return { fill: { linear: [-3, -3, 3, 4], stops: [[0, far ? C.main : C.light], [0.5, main], [1, far ? C.deep : C.shade]] }, inkColor: C.rim, light: C.glow, lightDepth: 0.4, lightAlpha: far ? 0.3 : 0.7 };
}

function suit(far = false): ShapeStyle {
  const base = far ? C.suit : C.suit2;
  return { fill: { linear: [-2, -2, 2, 4], stops: [[0, mix(base, 0x5a6a88, 0.35)], [1, base]] }, inkColor: C.rim, light: 0x6a7aa0, lightDepth: 0.35, lightAlpha: far ? 0.25 : 0.5, shade: 0x080a12, shadeDepth: 0.8 };
}

/**
 * A faceted crystal: the outline in its main colour, a bright plane toward
 * the light, a shaded plane away from it, a glinting ridge between them.
 */
function gem(p: Paint, outline: readonly number[], lit: readonly number[], dark: readonly number[], ridge: readonly number[] | null, far = false): void {
  const path = p.poly(outline);
  p.shape(path, crystal(far));
  p.within(path, () => {
    p.fill(p.poly(lit), far ? C.main : C.light, 0.85);
    p.fill(p.poly(dark), far ? C.deep : C.shade, 0.85);
    if (ridge) p.line(ridge, LINE * 0.45, C.glow, false, far ? 0.5 : 0.95);
  });
  p.stroke(path, C.rim, LINE * 0.85);
}

function torso(p: Paint): void {
  gem(
    p,
    [-7.2, -12.6, 7.4, -12.6, 6.4, -4.4, 4.2, 0.8, -5.0, 0.8, -7.2, -5.2],
    [-6.4, -11.8, 0.2, -11.8, -0.8, -5.4, -6.4, -6.0],
    [1.8, -10.8, 6.6, -11.8, 5.6, -4.2, 2.0, -3.6],
    [0.6, -12.2, 0.2, -4.0, 4.0, 0.4],
  );
  p.fill(p.circle(-4.6, -9.6, 0.6), 0xffffff, 0.9);
  omnitrixBadge(p, 1.4, -7.4, 1.4, C.omnitrix);
}

function spikes(p: Paint): void {
  // Crystal growths out of the back and shoulders: his silhouette.
  gem(p, [-6.4, 0.6, -11.6, -12.6, -3.4, -1.4], [-7.0, 0.0, -11.0, -11.6, -8.2, -2.0], [-6.0, -1.6, -10.4, -10.0, -3.8, -1.6], [-11.0, -11.6, -6.2, -0.4], true);
  gem(p, [-4.6, -0.4, -7.6, -8.4, -1.4, -0.8], [-4.8, -0.8, -7.4, -7.8, -5.8, -1.4], [-3.6, -1.2, -7.0, -7.0, -1.8, -1.0], [-7.4, -7.8, -4.0, -0.8]);
  gem(p, [5.6, -0.2, 9.8, -7.0, 8.4, 0.6], [6.0, -0.4, 9.4, -6.4, 7.6, -0.6], [8.0, -1.4, 9.6, -6.6, 8.6, 0.4], [9.6, -6.6, 7.6, 0.2]);
}

function pelvis(p: Paint): void {
  p.shape(p.smooth([-5.0, -1.4, 4.6, -1.4, 4.6, 1.6, 2.6, 2.8, -2.8, 2.8, -5.0, 1.6], true, 0.3), suit(false));
  p.line([-4.8, -1.2, 4.4, -1.2], LINE * 0.5, 0x6a7aa0, false, 0.8);
}

function head(p: Paint): void {
  // The gem head: a tall faceted crystal peaking at the top, a dark face band with a hard brow and a jutting jaw.
  gem(
    p,
    [-6.0, -5.0, -4.0, -14.2, 0.2, -20.4, 4.4, -15.0, 7.4, -7.0, 5.6, 0.4, -4.0, 0.4],
    [-5.2, -5.8, -3.2, -14.0, 0.2, -19.4, -0.8, -7.2],
    [1.2, -18.4, 4.4, -14.2, 6.6, -7.0, 2.4, -7.6],
    [0.2, -19.4, -0.8, -7.2],
  );
  p.fill(p.circle(-2.2, -13.0, 0.55), 0xffffff, 0.95);
  p.fill(p.circle(-3.0, -10.8, 0.35), 0xffffff, 0.8);
  const band = p.smooth([-2.4, -7.6, 7.2, -7.8, 7.4, -3.4, -2.2, -3.2], true, 0.25);
  p.shape(band, { fill: { linear: [0, -7.8, 0, -3.2], stops: [[0, 0x163650], [1, C.core]] }, inkColor: C.rim, ink: LINE * 0.6 });
  gem(p, [-2.2, -3.4, 7.2, -3.6, 6.4, -0.2, -1.2, 0.2], [-1.8, -3.0, 6.6, -3.2, 6.2, -2.2, -1.6, -2.0], [-1.0, -0.8, 6.2, -1.0, 6.0, -0.4, -1.0, -0.2], null);
}

function eyes(p: Paint, v: string): void {
  for (const [x, r] of [[-1.6, 0.85], [2.0, 1.0]] as const) {
    if (v === 'blink' || v === 'hurt') {
      p.line([x - r, 0.1, x + r, -0.1], LINE * 0.8, C.eye, true);
      continue;
    }
    const ry = v === 'angry' ? r * 0.55 : v === 'wide' ? r * 1.2 : r * 0.85;
    p.glow(x, 0, r * 2.4, C.eye, 0.5);
    p.fill(p.ellipse(x, 0, r * (v === 'wide' ? 1.15 : 1), ry, v === 'angry' ? 0.25 : 0), C.eye);
    p.fill(p.circle(x - r * 0.3, -ry * 0.35, r * 0.3), 0xffffff, 0.95);
  }
  if (v === 'angry') p.line([-2.8, -1.2, 0.2, -0.4, 3.4, -1.2], LINE * 0.9, C.light, false, 0.9);
}

function limb(p: Paint, len: number, w0: number, w1: number, far: boolean, kind: 'crystal' | 'leg'): void {
  if (kind === 'leg') {
    p.shape(p.capsule(0, 0, w0, 0, len, w1), suit(far));
    return;
  }
  gem(p, [-w0, -0.6, w0, -0.6, w1, len + 0.4, -w1, len + 0.4], [-w0 + 0.3, -0.2, 0, -0.2, 0, len, -w1 + 0.3, len], [w0 * 0.4, 0, w0 - 0.2, 0, w1 - 0.2, len, w1 * 0.4, len], [0, 0, 0, len], far);
}

function shin(p: Paint, far: boolean): void {
  const D = DIAMONDHEAD_DIMS;
  p.shape(p.capsule(0, 0, 1.6, 0, D.shin, 1.3), suit(far));
  gem(p, [0.0, D.shin * 0.3, 2.2, D.shin * 0.4, 2.0, D.shin + 0.2, 0.2, D.shin], [0.2, D.shin * 0.35, 1.2, D.shin * 0.38, 1.0, D.shin, 0.2, D.shin], [1.4, D.shin * 0.42, 2.0, D.shin * 0.5, 1.9, D.shin, 1.2, D.shin], null, far);
}

function fist(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 6,
    h: 6,
    px: 3,
    py: 1,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      if (v === 'open') {
        gem(p, [-1.6, 0, 1.6, 0, 2.0, 2.4, 0.6, 3.6, -1.2, 3.4, -1.8, 1.8], [-1.2, 0.4, 0.4, 0.4, 0.0, 3.0, -1.4, 1.8], [1.0, 0.6, 1.8, 2.2, 0.8, 3.2, 0.6, 1.2], null, far);
        return;
      }
      gem(p, [-1.8, 0, 1.6, -0.2, 2.2, 1.8, 1.6, 3.4, -1.6, 3.4, -2.0, 1.6], [-1.6, 0.4, 0.2, 0.2, -0.2, 1.8, -1.6, 1.6], [0.8, 1.8, 2.0, 1.9, 1.4, 3.0, 0.4, 3.0], null, far);
    },
  };
}

function boot(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 8,
    h: 4,
    px: 2,
    py: 1.5,
    draw: (p) => gem(p, [-1.8, -1.0, 2.0, -1.2, 5.4, 0.0, 5.6, 1.2, -2.0, 1.2], [-1.6, -0.8, 1.8, -1.0, 4.8, -0.1, -1.6, 0.0], [0.0, 0.6, 5.4, 0.6, 5.4, 1.1, -1.8, 1.1], null, far),
  };
}

function shield(p: Paint): void {
  // A big hexagonal crystal plate.
  gem(p, [0, -14.0, 5.4, -9.6, 6.2, 0, 5.4, 9.6, 0, 14.0, -3.0, 9.0, -3.2, 0, -3.0, -9.0], [0, -13.0, 4.6, -9.0, 4.6, 0, 1.0, 0], [1.0, 2.0, 4.6, 2.0, 4.4, 9.0, 0, 13.0], [0, -12.6, 0, 12.6]);
  p.glow(1.6, -4, 6, C.glow, 0.25);
  p.fill(p.circle(2.2, -7.6, 0.7), 0xffffff, 0.9);
  p.fill(p.circle(3.2, -2.2, 0.45), 0xffffff, 0.8);
}

function shard(p: Paint): void {
  p.glow(2.4, 0, 3.4, C.glow, 0.5);
  gem(p, [0, -1.8, 5.6, 0, 0, 1.8], [0, -1.6, 5.0, -0.1, 0.6, -0.2], [0.6, 0.4, 5.0, 0.2, 0, 1.6], [0, 0, 5.4, 0]);
}

function groundSpikes(p: Paint): void {
  for (const [x, h, w] of [[-12, 7, 2.2], [-7, 9, 2.6], [14, 8, 2.4], [19, 6, 2.0]] as const) {
    gem(p, [x - w, 0, x + 0.2, -h, x + w, 0], [x - w + 0.3, 0, x + 0.1, -h + 0.8, x - 0.2, 0], [x + 0.6, -h * 0.4, x + 0.3, -h + 1, x + w - 0.3, 0], [x + 0.2, -h, x, 0]);
  }
}

function parts(): PartSpec[] {
  const D = DIAMONDHEAD_DIMS;
  return [
    { id: 'torso', w: 17, h: 16, px: 8, py: 14, draw: (p) => torso(p) },
    { id: 'spikes', w: 24, h: 16, px: 13, py: 14, draw: (p) => spikes(p) },
    { id: 'pelvis', w: 12, h: 6, px: 6, py: 2, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 5, h: 9, px: 2.5, py: 2.2, draw: (p) => limb(p, D.thigh, 2.0, 1.6, false, 'leg') },
    { id: 'thighB', w: 5, h: 9, px: 2.5, py: 2.2, draw: (p) => limb(p, D.thigh, 2.0, 1.6, true, 'leg') },
    { id: 'shinF', w: 6, h: 8, px: 2.5, py: 1.8, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 6, h: 8, px: 2.5, py: 1.8, draw: (p) => shin(p, true) },
    boot('footF', false),
    boot('footB', true),
    { id: 'armUF', w: 6, h: 8, px: 3, py: 1.4, draw: (p) => limb(p, D.upperArm, 1.9, 1.5, false, 'crystal') },
    { id: 'armUB', w: 6, h: 8, px: 3, py: 1.4, draw: (p) => limb(p, D.upperArm, 1.9, 1.5, true, 'crystal') },
    { id: 'armLF', w: 5, h: 7, px: 2.5, py: 1.2, draw: (p) => limb(p, D.forearm, 1.5, 1.4, false, 'crystal') },
    { id: 'armLB', w: 5, h: 7, px: 2.5, py: 1.2, draw: (p) => limb(p, D.forearm, 1.5, 1.4, true, 'crystal') },
    fist('handF', false),
    fist('handB', true),
    { id: 'head', w: 16, h: 23, px: 6.8, py: 21.6, draw: (p) => head(p) },
    { id: 'eyes', w: 9, h: 6, px: 4, py: 3, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 1, h: 1, px: 0.5, py: 0.5, draw: () => undefined },
    { id: 'shield', w: 12, h: 31, px: 4, py: 15.5, draw: (p) => shield(p) },
    { id: 'shard', w: 10, h: 8, px: 2, py: 4, draw: (p) => shard(p) },
    { id: 'groundSpikes', w: 38, h: 11, px: 15, py: 10, draw: (p) => groundSpikes(p) },
  ];
}

const EXTRAS = ['shield', 'shard', 'groundSpikes'] as const;

function diamondClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const stance: PoseData = { torso: 2, head: -1, armUF: 6, armLF: 14, armUB: -4, armLB: 14, thighF: 8, shinF: -6, thighB: -8, shinB: -4, footB: 6 };
  const out: Record<string, ClipDef> = {};
  for (const [name, clip] of Object.entries(base)) {
    out[name] = {
      ...clip,
      pose: (t, p) => {
        clip.pose(t, p);
        for (const e of EXTRAS) p.hidden(e);
      },
    };
  }
  const held = (frames: ReadonlyArray<readonly [number, PoseData]>, ms: number, show: readonly (typeof EXTRAS)[number][], extra?: (t: number, p: Parameters<ClipDef['pose']>[1]) => void): ClipDef => {
    const keys = k(frames);
    return {
      ms,
      loop: false,
      pose: (t, p) => {
        p.keys(keys, t);
        for (const e of EXTRAS) p.hidden(e, !show.includes(e));
        extra?.(t, p);
      },
    };
  };
  const shieldPose = (tilt: number): ClipDef =>
    held(
      [
        [0, { ...stance, armUF: 40, armLF: 40, armUB: 30, armLB: 40 }],
        [0.5, { ...stance, torso: 8, armUF: 84 - tilt * 30, armLF: 10, handF: { v: 'open' }, armUB: 80 - tilt * 30, armLB: 14, handB: { v: 'open' }, thighF: 18, shinF: -12, thighB: -16, shinB: -6, shield: { a: -tilt * 18, y: tilt * 3 }, eyes: { v: 'angry' } }],
      ],
      220,
      ['shield'],
      (t, p) => p.size('shield', Math.min(1, t * 2.2)),
    );
  return {
    ...out,
    shoot: held(
      [
        [0, { ...stance, torso: 4, armUF: 60, armLF: 50 }],
        [0.4, { ...stance, torso: 8, armUF: 92, armLF: 2, handF: { v: 'open' }, armUB: -20, armLB: 30, thighF: 16, shinF: -10, thighB: -14, shinB: -6, eyes: { v: 'angry' } }],
        [1, { ...stance, torso: 7, armUF: 88, armLF: 4, handF: { v: 'open' }, armUB: -16, armLB: 28, thighF: 16, shinF: -10, thighB: -14, shinB: -6, eyes: { v: 'angry' } }],
      ],
      180,
      ['shard'],
      (t, p) => p.size('shard', t < 0.4 ? 0.4 + t * 1.5 : 1),
    ),
    shootUp: held(
      [
        [0, { ...stance, armUF: 100, armLF: 40 }],
        [0.4, { ...stance, torso: -4, head: -16, armUF: 150, armLF: 4, handF: { v: 'open' }, armUB: -10, armLB: 20, eyes: { v: 'angry' } }],
      ],
      180,
      ['shard'],
    ),
    shield: shieldPose(0),
    shieldUp: shieldPose(-1),
    shieldDown: shieldPose(1),
    grow: held(
      [
        [0, stance],
        [0.5, { ...stance, torso: -6, head: -10, armUF: 160, armLF: 6, handF: { v: 'open' }, armUB: -10, armLB: 30, eyes: { v: 'wide' } }],
      ],
      300,
      ['shard'],
      (t, p) => p.size('shard', 0.6 + wave(t * 3) * 0.2),
    ),
    spikes: held(
      [
        [0, { ...stance, hip: { y: -1 }, torso: -6, armUF: 160, armLF: 10, armUB: 150, armLB: 10 }],
        [0.35, { hip: { y: 3 }, torso: 26, head: -12, armUF: 30, armLF: 10, armUB: 26, armLB: 10, thighF: 50, shinF: -80, footF: 30, thighB: 30, shinB: -80, footB: 50, eyes: { v: 'angry' } }],
        [1, { hip: { y: 2.6 }, torso: 24, head: -10, armUF: 26, armLF: 10, armUB: 22, armLB: 10, thighF: 46, shinF: -76, footF: 30, thighB: 28, shinB: -76, footB: 48, eyes: { v: 'angry' } }],
      ],
      320,
      ['groundSpikes'],
      (t, p) => p.size('groundSpikes', 1, Math.max(0.05, Math.min(1, (t - 0.3) * 4))),
    ),
    idle: {
      ms: 1800,
      loop: true,
      pose: (t, p) => {
        base.idle.pose(t, p);
        for (const e of EXTRAS) p.hidden(e);
      },
    },
  };
}

/** Diamondhead's HD rig: the humanoid kit in faceted crystal, with his back spikes, a crystal shield, shards and a ground burst. */
export function diamondheadRig(): RigDef {
  const D = DIAMONDHEAD_DIMS;
  return humanRig({
    id: 'diamondhead',
    dims: D,
    parts: parts(),
    style: DIAMONDHEAD_CARTOON.style!,
    extraBones: [
      { id: 'spikes', parent: 'torso', x: 0, y: -9.6, part: 'spikes', z: 55, dir: 1 },
      { id: 'shield', parent: 'torso', x: 12.4, y: -6.4, part: 'shield', z: 95, dir: 1 },
      { id: 'shard', parent: 'handF', x: 0.6, y: 2.4, part: 'shard', z: 90, dir: -1 },
      { id: 'groundSpikes', parent: 'hip', x: 0, y: D.hip, part: 'groundSpikes', z: 96, dir: 1 },
    ],
    bounds: { left: -20, right: 22, top: -44, bottom: 2 },
    clips: diamondClips,
  });
}

