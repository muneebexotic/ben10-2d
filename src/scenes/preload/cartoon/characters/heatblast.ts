import { HEATBLAST_CARTOON } from '../../../../config/cartoon/heatblast';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { LINE, lightOf, shadeOf, type Paint } from '../paint';
import { wave, type PartSpec, type RigDef } from '../rig';
import { omnitrixBadge } from './alienBits';

const C = HEATBLAST_CARTOON.colors;

export const HEATBLAST_DIMS: HumanDims = {
  hip: 12.4,
  thigh: 6.2,
  shin: 5.8,
  ankle: 0.5,
  torso: 9.4,
  shoulderF: { x: -0.4, y: -8.4 },
  shoulderB: { x: -2.0, y: -8.2 },
  upperArm: 4.6,
  forearm: 4.4,
  hipF: 1.2,
  hipB: -1.2,
  neck: { x: 0.6, y: -9.0 },
  eyes: { x: 3.0, y: -5.4 },
  mouth: { x: 3.4, y: -2.6 },
};

/** Glowing seams of lava across a rock shape (drawn inside its clip). */
function seams(p: Paint, lines: ReadonlyArray<readonly number[]>, width = 0.55): void {
  for (const l of lines) {
    p.line(l, width * 2.6, C.lavaDeep, false, 0.35);
    p.line(l, width * 1.4, C.lava, false, 0.95);
    p.line(l, width * 0.5, C.lavaHot, false, 1);
  }
}

function rockStyle(far: boolean) {
  const fill = far ? shadeOf(C.rock, 0.25) : C.rock;
  return { fill: { linear: [-2, -2, 2, 6] as const, stops: [[0, C.rockLight], [0.5, fill], [1, C.rockShade]] as const }, shade: C.rockShade, shadeDepth: 1.2, light: lightOf(C.rockLight, 0.2), lightDepth: 0.5, lightAlpha: far ? 0.2 : 0.5 };
}

function torso(p: Paint): void {
  const body = p.smooth([-3.2, 1.0, 0.4, 1.4, 3.2, 0.8, 3.4, -2.6, 3.8, -6.0, 3.2, -8.6, 1.4, -9.8, -1.2, -9.6, -3.0, -8.6, -3.6, -5.0, -3.4, -1.6]);
  p.shape(body, rockStyle(false));
  p.within(body, () => {
    seams(p, [[-3.2, -6.0, -1.6, -5.2, -0.8, -3.0], [-2.8, -1.4, -1.0, -0.6, 0.6, -1.6, 2.6, -0.8], [3.0, -4.6, 2.2, -3.4]]);
    // The burning V over his chest.
    const v = p.poly([-0.6, -9.4, 1.8, -3.8, 4.2, -9.4, 3.0, -9.8, 1.8, -6.2, 0.6, -9.8]);
    p.fill(v, C.lavaDeep, 0.5);
    p.shape(v, { fill: { linear: [0, -9.6, 0, -4.4], stops: [[0, C.lavaHot], [1, C.lava]] }, ink: false });
    p.glow(1.8, -6.0, 3.4, C.lava, 0.45);
  });
  omnitrixBadge(p, 1.8, -3.2, 1.15, C.omnitrix);
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-3.2, -1.2, 3.2, -1.2, 3.3, 1.2, 1.6, 2.6, -1.6, 2.6, -3.4, 1.2]);
  p.shape(shape, rockStyle(false));
  p.within(shape, () => seams(p, [[-2.6, 0.4, -0.4, 1.4, 1.8, 0.2]]));
}

function limbRock(p: Paint, len: number, r0: number, r1: number, far: boolean, seam: readonly number[]): void {
  const path = p.capsule(0, 0, r0, 0, len, r1);
  p.shape(path, rockStyle(far));
  p.within(path, () => seams(p, [seam], far ? 0.4 : 0.5));
}

function shin(p: Paint, far: boolean): void {
  limbRock(p, HEATBLAST_DIMS.shin, 1.6, 1.5, far, [-1.2, 1.4, 0.4, 2.2, -0.6, 3.6]);
}

function foot(p: Paint, far: boolean): void {
  const L = 4.6;
  const boot = p.smooth([-1.8, -1.2, 1.0, -1.0, L * 0.6, -0.4, L, 0.0, L - 0.2, 0.5, -2.0, 0.5]);
  p.shape(boot, rockStyle(far));
  p.within(boot, () => seams(p, [[-1.2, 0.0, 1.4, -0.3, 3.6, 0.1]], 0.4));
}

function hand(far: boolean): PartSpec {
  return {
    id: far ? 'handB' : 'handF',
    w: 8,
    h: 8,
    px: 4,
    py: 2,
    variants: ['fist', 'open', 'blaze'],
    draw: (p, v) => {
      if (v === 'blaze') p.glow(0.2, 1.4, 4.2, C.flame, 0.7);
      const fist = p.ellipse(0.1, 1.2, 1.55, 1.45);
      p.shape(fist, rockStyle(far));
      p.within(fist, () => seams(p, [[-1.0, 0.6, 0.2, 1.4, 1.2, 0.8]], 0.4));
      if (v !== 'fist') {
        p.glow(0.6, 1.6, 2.4, C.lavaHot, v === 'blaze' ? 0.95 : 0.6);
        p.fill(p.circle(0.7, 1.6, 0.7), C.flameCore, 0.95);
      }
    },
  };
}

/** The flame head: tongues of fire, a white-hot core, a face in it; four flicker frames. */
function flameHead(p: Paint, frame: number): void {
  const sway = [0, 0.5, -0.3, 0.8][frame];
  const lift = [0, 0.8, 0.4, -0.3][frame];
  // Outer flame: tall tongues that lick backward (he faces right; fire streams up and back).
  const outer = p.spiky(
    [-3.6, -0.6, -4.8, -4.0, -6.6 + sway, -8.6 - lift, -4.0, -8.0, -4.4 + sway, -12.6 - lift, -2.0, -10.2, -0.8 + sway, -14.4 - lift, 0.8, -10.8, 2.6 + sway, -13.2 - lift, 3.4, -9.6, 5.6 + sway * 0.5, -10.4 - lift * 0.6, 5.6, -7.0, 6.0, -4.4, 5.0, -1.0, 2.0, 0.4],
    [false, false, true, false, true, false, true, false, true, false, true, false, false, false, false],
  );
  p.glow(0.6, -6.0, 9, C.flameMid, 0.35);
  p.shape(outer, { fill: { linear: [0, -14, 0, 0], stops: [[0, C.flameOuter], [0.45, C.flameMid], [1, C.flame]] }, ink: LINE * 0.8, inkColor: 0x5a1406 });
  const mid = p.spiky(
    [-2.6, -1.0, -3.6, -4.6, -4.6 + sway, -8.6 - lift, -2.4, -7.6, -1.0 + sway, -11.2 - lift, 0.8, -8.4, 2.4 + sway, -10.6 - lift, 3.4, -7.4, 4.6, -4.6, 4.0, -1.4, 1.6, -0.4],
    [false, false, true, false, true, false, true, false, false, false, false],
  );
  p.fill(mid, { linear: [0, -11, 0, 0], stops: [[0, C.flameMid], [0.5, C.flame], [1, C.flameCore]] });
  // The face sits in the brightest part.
  p.fill(p.ellipse(2.2, -4.0, 3.2, 3.4), { radial: [2.4, -4.4, 0.2, 2.2, -4.0, 3.4], stops: [[0, C.flameCore, 0.9], [0.6, C.flame, 0.7], [1, C.flame, 0]] });
}

function eyes(p: Paint, v: string): void {
  const slit = (x: number, y: number, rx: number, ry: number, tilt: number) => {
    const e = p.ellipse(x, y, rx, ry, tilt);
    p.fill(e, C.face);
    p.fill(p.ellipse(x + rx * 0.25, y - ry * 0.3, rx * 0.35, ry * 0.25, tilt), C.lavaHot, 0.9);
  };
  switch (v) {
    case 'blink':
      p.line([-1.2, 0.2, 0, 0.5, 1.0, 0.2], LINE, C.face, true);
      p.line([1.8, 0.2, 2.6, 0.5, 3.2, 0.2], LINE * 0.9, C.face, true);
      return;
    case 'hurt':
      p.line([-1.2, -0.8, 0.6, 0, -1.2, 0.8], LINE, C.face);
      p.line([3.2, -0.8, 1.8, 0, 3.2, 0.8], LINE * 0.9, C.face);
      return;
    case 'angry':
      slit(-0.1, 0.2, 1.1, 0.75, 0.25);
      slit(2.5, 0.2, 0.75, 0.65, 0.25);
      p.line([-1.4, -1.0, 1.0, -0.2], LINE * 1.1, C.face).line([1.8, -0.4, 3.4, -1.0], LINE, C.face);
      return;
    case 'wide':
      slit(-0.1, 0, 1.0, 1.25, 0);
      slit(2.5, 0, 0.72, 1.1, 0);
      return;
    default:
      slit(-0.1, 0, 1.0, 1.0, 0.1);
      slit(2.5, 0, 0.72, 0.9, 0.1);
      p.line([-1.3, -1.3, 0.9, -1.0], LINE * 0.9, C.face, true);
  }
}

function mouth(p: Paint, v: string): void {
  switch (v) {
    case 'shout':
    case 'open':
    case 'grit': {
      const m = p.smooth([-1.4, -0.5, 1.6, -0.6, 1.0, 1.0, -0.8, 0.9], true, 0.4);
      p.fill(m, C.face);
      p.fill(p.ellipse(0.1, 0.4, 0.8, 0.35), C.lava, 0.9);
      return;
    }
    default:
      p.line([-1.4, -0.1, 0.0, 0.5, 1.5, -0.3], LINE * 0.9, C.face, true);
  }
}

function parts(): PartSpec[] {
  const D = HEATBLAST_DIMS;
  return [
    { id: 'torso', w: 9, h: 12, px: 4.5, py: 10.5, draw: (p) => torso(p) },
    { id: 'pelvis', w: 8, h: 5, px: 4, py: 1.8, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 6, h: 9, px: 3, py: 2, draw: (p) => limbRock(p, D.thigh, 1.75, 1.55, false, [-0.8, 1.2, 0.6, 2.8, -0.2, 4.6]) },
    { id: 'thighB', w: 6, h: 9, px: 3, py: 2, draw: (p) => limbRock(p, D.thigh, 1.75, 1.55, true, [-0.8, 1.2, 0.6, 2.8, -0.2, 4.6]) },
    { id: 'shinF', w: 6, h: 9, px: 3, py: 1.8, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 6, h: 9, px: 3, py: 1.8, draw: (p) => shin(p, true) },
    { id: 'footF', w: 8, h: 4, px: 2.5, py: 1.5, draw: (p) => foot(p, false) },
    { id: 'footB', w: 8, h: 4, px: 2.5, py: 1.5, draw: (p) => foot(p, true) },
    { id: 'armUF', w: 6, h: 8, px: 3, py: 1.8, draw: (p) => limbRock(p, D.upperArm, 1.5, 1.3, false, [-0.6, 0.8, 0.5, 2.0, -0.2, 3.4]) },
    { id: 'armUB', w: 6, h: 8, px: 3, py: 1.8, draw: (p) => limbRock(p, D.upperArm, 1.5, 1.3, true, [-0.6, 0.8, 0.5, 2.0, -0.2, 3.4]) },
    { id: 'armLF', w: 5, h: 7, px: 2.5, py: 1.4, draw: (p) => limbRock(p, D.forearm, 1.3, 1.15, false, [0.5, 0.8, -0.4, 2.2, 0.3, 3.6]) },
    { id: 'armLB', w: 5, h: 7, px: 2.5, py: 1.4, draw: (p) => limbRock(p, D.forearm, 1.3, 1.15, true, [0.5, 0.8, -0.4, 2.2, 0.3, 3.6]) },
    hand(false),
    hand(true),
    { id: 'head', w: 15, h: 17, px: 7, py: 15.5, variants: ['f0', 'f1', 'f2', 'f3'], draw: (p, v) => flameHead(p, Number(v.slice(1))) },
    { id: 'eyes', w: 7, h: 5, px: 2.2, py: 2.5, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 5, h: 4, px: 2.5, py: 2, variants: ['smile', 'open', 'grit', 'shout'], draw: (p, v) => mouth(p, v) },
  ];
}

/** Heatblast's HD rig: his fireball, the charged burst, the rocket jump; the flame head flickers on its own. */
export function heatblastRig(): RigDef {
  const rig = humanRig({
    id: 'heatblast',
    dims: HEATBLAST_DIMS,
    parts: parts(),
    style: HEATBLAST_CARTOON.style!,
    bounds: { left: -14, right: 16, top: -40, bottom: 2 },
    alias: { punch: 'shoot' },
    clips: (info) => {
      const shootKeys = keyframes(info, [
        [0, { torso: -4, head: -2, armUF: 20, armLF: 70, handF: { v: 'open' }, armUB: 20, armLB: 40, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
        [0.4, { hip: { x: 0.8 }, torso: 12, head: -6, armUF: 92, armLF: 0, handF: { v: 'blaze' }, armUB: -40, armLB: 70, thighF: 22, shinF: -16, thighB: -20, shinB: -10, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
        [1, { hip: { x: 0.6 }, torso: 10, head: -5, armUF: 88, armLF: 4, handF: { v: 'open' }, armUB: -34, armLB: 60, thighF: 20, shinF: -14, thighB: -18, shinB: -10, eyes: { v: 'angry' }, mouth: { v: 'open' } }],
      ]);
      const chargeKeys = keyframes(info, [[0, { hip: { y: 1.2 }, torso: 14, head: 6, armUF: 50, armLF: -110, handF: { v: 'blaze' }, armUB: 40, armLB: -100, handB: { v: 'blaze' }, thighF: 30, shinF: -40, thighB: -24, shinB: -30, eyes: { v: 'angry' }, mouth: { v: 'grit' } }]]);
      const rocketKeys = keyframes(info, [[0, { torso: -6, head: -8, armUF: 20, armLF: 10, handF: { v: 'blaze' }, armUB: 30, armLB: 10, handB: { v: 'blaze' }, thighF: 6, shinF: -10, footF: 30, thighB: -4, shinB: -16, footB: 40, eyes: { v: 'wide' }, mouth: { v: 'shout' } }]]);
      return {
        shoot: { ms: 140, loop: false, pose: (t, p) => p.keys(shootKeys, t) },
        charge: { ms: 260, loop: true, pose: (t, p) => { p.keys(chargeKeys, 0); p.add('torso', wave(t * 2) * 2).move('hip', wave(t * 4) * 0.3, 0); } },
        rocket: { ms: 300, loop: true, pose: (t, p) => { p.keys(rocketKeys, 0); p.add('armUF', wave(t) * 6).add('armUB', -wave(t) * 6); } },
      };
    },
  });
  // The flame head and its glow flicker on their own.
  return { ...rig, bones: rig.bones.map((b) => (b.id === 'head' ? { ...b, cycle: { variants: ['f0', 'f1', 'f2', 'f3'], fps: 12 } } : b)) };
}
