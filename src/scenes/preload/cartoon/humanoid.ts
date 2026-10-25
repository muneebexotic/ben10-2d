import { INK, LINE, lightOf, shadeOf, type Paint } from './paint';
import { compilePose, RigInfo, wave, type BoneSpec, type ClipDef, type CompiledPose, type PartSpec, type Pose, type PoseData, type RigDef } from './rig';

/**
 * The cartoon humanoid: a shared skeleton, limb painters and the standard
 * clips (idle, run, jump, fall, land, hurt, swim, story poses...). Ben, Gwen,
 * Max, Kevin and the two-legged aliens are built on it; each character brings
 * its own head, torso, colours and timing, and adds or replaces clips.
 *
 * Bones: hip (root) > torso > head > eyes, mouth; torso > armUF > armLF > handF
 * (the near arm), armUB > armLB > handB (the far arm); hip > thighF > shinF >
 * footF, thighB > shinB > footB.
 */

export interface HumanDims {
  /** Hip joint height above the feet. */
  hip: number;
  thigh: number;
  shin: number;
  /** Ankle to the floor (the sole's thickness under the ankle). */
  ankle: number;
  /** Hip joint to the neck joint. */
  torso: number;
  /** Shoulder joints (torso space, y up is negative). */
  shoulderF: { x: number; y: number };
  shoulderB: { x: number; y: number };
  upperArm: number;
  forearm: number;
  /** Hip spread: where each thigh joins (x). */
  hipF: number;
  hipB: number;
  /** Neck joint (torso space). */
  neck: { x: number; y: number };
  /** Face features (head space). */
  eyes: { x: number; y: number };
  mouth: { x: number; y: number };
}

export interface LimbColors {
  fill: number;
  shade?: number;
  light?: number;
}

/** A limb segment hanging down from its joint: a tapered capsule, outlined and cel shaded. */
export function limb(p: Paint, len: number, r0: number, r1: number, c: LimbColors, far = false): Path2D {
  const path = p.capsule(0, 0, r0, 0, len, r1);
  const fill = far ? shadeOf(c.fill, 0.18) : c.fill;
  p.shape(path, {
    fill: { linear: [-r0, 0, r0, len], stops: [[0, lightOf(fill, 0.12)], [1, fill]] },
    shade: c.shade ?? shadeOf(fill),
    shadeDepth: r0 * 0.8,
    light: c.light ?? lightOf(fill),
    lightDepth: r0 * 0.35,
    lightAlpha: far ? 0.25 : 0.5,
  });
  return path;
}

/** The standard skeleton for a humanoid with these proportions. Extra bones join through `extra`. */
export function humanBones(d: HumanDims, extra: readonly BoneSpec[] = []): BoneSpec[] {
  return [
    { id: 'hip', x: 0, y: -d.hip, part: 'pelvis', z: 40, dir: 1 },
    { id: 'thighB', parent: 'hip', x: d.hipB, y: 0, part: 'thighB', z: 12, dir: -1 },
    { id: 'shinB', parent: 'thighB', x: 0, y: d.thigh, part: 'shinB', z: 11, dir: -1 },
    { id: 'footB', parent: 'shinB', x: 0, y: d.shin, part: 'footB', z: 10, dir: -1 },
    { id: 'thighF', parent: 'hip', x: d.hipF, y: 0, part: 'thighF', z: 32, dir: -1 },
    { id: 'shinF', parent: 'thighF', x: 0, y: d.thigh, part: 'shinF', z: 31, dir: -1 },
    { id: 'footF', parent: 'shinF', x: 0, y: d.shin, part: 'footF', z: 30, dir: -1 },
    { id: 'armUB', parent: 'torso', x: d.shoulderB.x, y: d.shoulderB.y, part: 'armUB', z: 6, dir: -1 },
    { id: 'armLB', parent: 'armUB', x: 0, y: d.upperArm, part: 'armLB', z: 5, dir: -1 },
    { id: 'handB', parent: 'armLB', x: 0, y: d.forearm, part: 'handB', z: 4, dir: -1 },
    { id: 'torso', parent: 'hip', x: 0, y: -0.4, part: 'torso', z: 50, dir: 1 },
    { id: 'head', parent: 'torso', x: d.neck.x, y: d.neck.y, part: 'head', z: 70, dir: 1 },
    { id: 'eyes', parent: 'head', x: d.eyes.x, y: d.eyes.y, part: 'eyes', z: 72, dir: 1, blink: true },
    { id: 'mouth', parent: 'head', x: d.mouth.x, y: d.mouth.y, part: 'mouth', z: 73, dir: 1 },
    { id: 'armUF', parent: 'torso', x: d.shoulderF.x, y: d.shoulderF.y, part: 'armUF', z: 80, dir: -1 },
    { id: 'armLF', parent: 'armUF', x: 0, y: d.upperArm, part: 'armLF', z: 81, dir: -1 },
    { id: 'handF', parent: 'armLF', x: 0, y: d.forearm, part: 'handF', z: 82, dir: -1 },
    ...extra,
  ];
}

/** Expressions every humanoid face supports (eyes, then mouth). */
export const EYES = ['open', 'blink', 'happy', 'angry', 'wide', 'hurt', 'side', 'sad', 'shut'] as const;
export const MOUTHS = ['smile', 'grin', 'open', 'o', 'grit', 'frown', 'smirk', 'shout', 'flat'] as const;

/** How a character moves: the knobs the standard clips read. */
export interface MoveStyle {
  /** Run cycle length (ms) and how far legs and arms swing (degrees). */
  runMs: number;
  stride: number;
  armSwing: number;
  /** Forward lean while running (degrees). */
  runLean: number;
  /** Up-and-down of the hips per step (game px). */
  bounce: number;
  /** Idle breathing cycle (ms) and sway (degrees). */
  idleMs: number;
  idleSway: number;
  /** Weight: heavier characters crouch deeper, land harder, swing slower. 0..1. */
  weight: number;
  /** How wide the arms sit when idle (degrees out from the body). */
  armRest: number;
}

export const BEN_STYLE: MoveStyle = { runMs: 440, stride: 40, armSwing: 46, runLean: 12, bounce: 0.9, idleMs: 1500, idleSway: 2.5, weight: 0.2, armRest: 8 };

type Keys = ReadonlyArray<readonly [number, CompiledPose]>;

/** Compiles keyframes against a rig (once, when the rig is built). */
export function keyframes(info: RigInfo, frames: ReadonlyArray<readonly [number, PoseData]>): Keys {
  return frames.map(([t, data]) => [t, compilePose(info, data)] as const);
}

/**
 * The standard humanoid clips for a rig, from its style. Characters add their
 * own (a cast, a punch) or replace any of these.
 */
export function humanClips(info: RigInfo, s: MoveStyle): Record<string, ClipDef> {
  const w = s.weight;
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);

  const idle: ClipDef = {
    ms: s.idleMs,
    loop: true,
    pose: (t, p) => {
      const b = wave(t);
      p.move('hip', 0, 0.25 + b * 0.25 * (1 + w));
      p.set('torso', 2 + b * 0.8).size('torso', 1, 1 + b * 0.012);
      p.set('head', -1 + wave(t, 0.15) * s.idleSway * 0.6);
      p.set('armUF', -s.armRest * 0.4 + b * 2).set('armLF', 14 + b * 3);
      p.set('armUB', s.armRest * 0.5 - b * 2).set('armLB', 16 - b * 2);
      p.set('thighF', 4).set('shinF', -4).set('footF', 0);
      p.set('thighB', -5).set('shinB', -3).set('footB', 8);
    },
  };

  const run: ClipDef = {
    ms: s.runMs,
    loop: true,
    pose: (t, p) => {
      const ph = t;
      // Legs half a cycle apart; knees fold most on the swing through.
      runLeg(p, 'thighF', 'shinF', 'footF', wave(ph), wave(ph, 0.25), s.stride);
      runLeg(p, 'thighB', 'shinB', 'footB', wave(ph, 0.5), wave(ph, 0.75), s.stride);
      p.set('armUF', -s.armSwing * wave(ph)).set('armLF', 78 + wave(ph, 0.25) * 10);
      p.set('armUB', s.armSwing * wave(ph)).set('armLB', 70 - wave(ph, 0.25) * 10);
      p.set('torso', s.runLean + wave(ph * 2, 0.1) * 2);
      p.set('head', -s.runLean * 0.5 + wave(ph * 2) * 1.5);
      p.move('hip', 0, -Math.abs(wave(ph)) * s.bounce + s.bounce * 0.4);
      p.show('mouth', 'smirk');
    },
  };

  const jumpKeys = k([
    [0, { hip: { y: 1.4 * (1 + w) }, torso: 10, head: -6, thighF: 34, shinF: -60, footF: 20, thighB: -10, shinB: -50, footB: 30, armUF: -30, armLF: 40, armUB: 30, armLB: 40 }],
    [0.35, { hip: { y: -0.6 }, torso: -4, head: -4, thighF: 30, shinF: -70, footF: 30, thighB: -18, shinB: -40, footB: 20, armUF: 150, armLF: 20, armUB: 120, armLB: 30, mouth: { v: 'open' } }],
    [1, { torso: 2, head: -2, thighF: 40, shinF: -80, footF: 25, thighB: -6, shinB: -60, footB: 30, armUF: 130, armLF: 30, armUB: 100, armLB: 40, mouth: { v: 'smile' } }],
  ]);
  const jump: ClipDef = { ms: 420, loop: false, pose: (t, p) => p.keys(jumpKeys, t) };

  const fall: ClipDef = {
    ms: 700,
    loop: true,
    pose: (t, p) => {
      const f = wave(t);
      p.set('torso', -4).set('head', 4);
      p.set('armUF', 120 + f * 14).set('armLF', 30 - f * 10);
      p.set('armUB', 100 - f * 14).set('armLB', 40 + f * 10);
      p.set('thighF', 22 + f * 8).set('shinF', -30 - f * 6).set('footF', 16);
      p.set('thighB', -14 - f * 8).set('shinB', -38).set('footB', 26);
      p.show('mouth', 'o').show('eyes', 'wide');
    },
  };

  const landKeys = k([
    [0, { hip: { y: 2.6 * (0.6 + w) }, torso: 16, head: -10, thighF: 50, shinF: -95, footF: 45, thighB: 30, shinB: -90, footB: 60, armUF: -20, armLF: 60, armUB: 40, armLB: 50 }],
    [1, { torso: 2, head: -1, thighF: 4, shinF: -4, thighB: -5, shinB: -3, footB: 8, armUF: -3, armLF: 14, armUB: 4, armLB: 16 }],
  ]);
  const land: ClipDef = { ms: 170 + w * 110, loop: false, pose: (t, p) => p.keys(landKeys, t) };

  const hurtKeys = k([
    [0, { hip: { x: -1, y: 0.5 }, torso: -22, head: -18, armUF: 130, armLF: 40, armUB: 150, armLB: 30, thighF: 30, shinF: -40, thighB: -20, shinB: -30, eyes: { v: 'hurt' }, mouth: { v: 'shout' } }],
    [1, { hip: { x: -0.5 }, torso: -14, head: -10, armUF: 100, armLF: 50, armUB: 120, armLB: 40, thighF: 20, shinF: -30, thighB: -12, shinB: -20, eyes: { v: 'hurt' }, mouth: { v: 'grit' } }],
  ]);
  const hurt: ClipDef = { ms: 320, loop: false, pose: (t, p) => p.keys(hurtKeys, t) };

  // Defeat: knocked flat, stars circling (the level spins the sprite off screen; this is the look).
  const defeat: ClipDef = {
    ms: 900,
    loop: true,
    pose: (t, p) => {
      p.set('torso', -30).set('head', -24 + wave(t) * 6);
      p.set('armUF', 160).set('armLF', 20).set('armUB', 170).set('armLB', 10);
      p.set('thighF', 60).set('shinF', -20).set('thighB', 40).set('shinB', -10);
      p.show('eyes', 'hurt').show('mouth', 'o');
    },
  };

  // Swimming: body flat, a front crawl and a flutter kick.
  const swim: ClipDef = {
    ms: 640,
    loop: true,
    pose: (t, p) => {
      p.set('hip', 78).move('hip', 0, -4);
      p.set('torso', 4).set('head', -70 + wave(t * 2) * 4);
      p.set('armUF', 160 + wave(t) * 150).set('armLF', 10 + Math.max(0, wave(t, 0.25)) * 50);
      p.set('armUB', 160 - wave(t) * 150).set('armLB', 10 + Math.max(0, wave(t, 0.75)) * 50);
      p.set('thighF', -8 + wave(t * 2) * 22).set('shinF', -14 - wave(t * 2, 0.2) * 12).set('footF', 40);
      p.set('thighB', -8 - wave(t * 2) * 22).set('shinB', -14 + wave(t * 2, 0.2) * 12).set('footB', 40);
      p.show('mouth', 'flat');
    },
  };

  // Treading water: upright, legs pedalling, hands sculling.
  const tread: ClipDef = {
    ms: 900,
    loop: true,
    pose: (t, p) => {
      p.move('hip', 0, wave(t) * 0.6);
      p.set('torso', 6).set('head', -4);
      p.set('armUF', 50 + wave(t) * 20).set('armLF', -30 + wave(t, 0.2) * 30);
      p.set('armUB', 40 - wave(t) * 20).set('armLB', -20 - wave(t, 0.2) * 30);
      p.set('thighF', 30 + wave(t) * 22).set('shinF', -60 - wave(t, 0.25) * 25).set('footF', 30);
      p.set('thighB', 30 - wave(t) * 22).set('shinB', -60 + wave(t, 0.25) * 25).set('footB', 30);
      p.show('mouth', 'flat');
    },
  };

  // Out of air: thrashing, cheeks puffed, eyes squeezed.
  const drown: ClipDef = {
    ms: 520,
    loop: true,
    pose: (t, p) => {
      const f = wave(t);
      p.move('hip', 0, f * 0.8);
      p.set('torso', -6 + f * 6).set('head', -14 + f * 6);
      p.set('armUF', 140 + f * 40).set('armLF', 30 - f * 30);
      p.set('armUB', 150 - f * 40).set('armLB', 20 + f * 30);
      p.set('thighF', 40 + f * 30).set('shinF', -70).set('thighB', 10 - f * 30).set('shinB', -60);
      p.show('eyes', 'hurt').show('mouth', 'grit');
    },
  };

  // Story poses: held, with a little life in them.
  const pose = (data: PoseData, life = 1): ClipDef => {
    const key = compilePose(info, data);
    return {
      ms: 1800,
      loop: true,
      pose: (t, p) => {
        p.apply(key);
        p.move('hip', 0, wave(t) * 0.2 * life);
        p.add('head', wave(t, 0.2) * 1.2 * life);
        p.add('torso', wave(t) * 0.6 * life);
      },
    };
  };

  const talk: ClipDef = {
    ms: 1300,
    loop: true,
    pose: (t, p) => {
      idle.pose(t, p);
      p.set('armUF', 50 + wave(t) * 22).set('armLF', 60 + wave(t, 0.3) * 20);
      p.show('handF', 'open');
      p.add('head', wave(t * 2) * 3);
      p.show('mouth', wave(t * 6) > 0 ? 'open' : 'smile');
    },
  };

  return {
    idle,
    run,
    walk: {
      ms: s.runMs * 1.7,
      loop: true,
      pose: (t, p) => {
        runLeg(p, 'thighF', 'shinF', 'footF', wave(t) * 0.6, wave(t, 0.25) * 0.5, s.stride);
        runLeg(p, 'thighB', 'shinB', 'footB', wave(t, 0.5) * 0.6, wave(t, 0.75) * 0.5, s.stride);
        p.set('armUF', -s.armSwing * 0.45 * wave(t)).set('armLF', 20);
        p.set('armUB', s.armSwing * 0.45 * wave(t)).set('armLB', 18);
        p.set('torso', 3).set('head', -1 + wave(t * 2) * 1);
        p.move('hip', 0, -Math.abs(wave(t)) * s.bounce * 0.5 + s.bounce * 0.25);
      },
    },
    jump,
    fall,
    land,
    hurt,
    defeat,
    swim,
    tread,
    drown,
    talk,
    point: pose({ torso: 4, head: -4, armUF: 92, armLF: 4, handF: { v: 'point' }, armUB: 10, armLB: 20, thighF: 6, shinF: -4, thighB: -6, mouth: { v: 'open' } }),
    shrug: pose({ torso: -2, head: -10, armUF: 40, armLF: -110, handF: { v: 'open' }, armUB: 40, armLB: -110, handB: { v: 'open' }, eyes: { v: 'side' }, mouth: { v: 'flat' } }),
    surprise: pose({ hip: { y: 0.6 }, torso: -10, head: -12, armUF: 60, armLF: -90, handF: { v: 'open' }, armUB: 70, armLB: -80, handB: { v: 'open' }, thighF: 10, shinF: -10, eyes: { v: 'wide' }, mouth: { v: 'o' } }, 0.6),
    cheer: pose({ hip: { y: -0.6 }, torso: -4, head: -10, armUF: 170, armLF: 10, armUB: 160, armLB: 20, eyes: { v: 'happy' }, mouth: { v: 'grin' } }, 1.8),
    think: pose({ torso: 2, head: 8, armUF: 30, armLF: -150, armUB: 20, armLB: -90, eyes: { v: 'side' }, mouth: { v: 'flat' } }),
    angry: pose({ torso: 10, head: 4, armUF: 10, armLF: 40, armUB: -10, armLB: 40, eyes: { v: 'angry' }, mouth: { v: 'grit' } }),
    sad: pose({ torso: 10, head: 16, armUF: 2, armLF: 6, armUB: -2, armLB: 6, eyes: { v: 'sad' }, mouth: { v: 'frown' } }, 0.5),
    lookHands: pose({ torso: 8, head: 22, armUF: 60, armLF: -80, handF: { v: 'open' }, armUB: 50, armLB: -70, handB: { v: 'open' }, eyes: { v: 'wide' }, mouth: { v: 'o' } }, 0.8),
    wave: {
      ms: 700,
      loop: true,
      pose: (t, p) => {
        idle.pose(t, p);
        p.set('armUF', 150).set('armLF', -40 + wave(t) * 35).show('handF', 'open').show('mouth', 'grin').show('eyes', 'happy');
      },
    },
  };
}

/** One leg of a run cycle: `sw` is where the leg is in its swing (-1 back, 1 forward), `swing` a quarter cycle on (the knee folds while it rises). */
export function runLeg(p: Pose, thigh: string, shin: string, foot: string, sw: number, swing: number, stride: number): void {
  p.set(thigh, stride * sw - 6);
  p.set(shin, -12 - Math.max(0, swing) * (stride * 1.55));
  p.set(foot, -8 + Math.max(0, -sw) * 28);
}

/** A standard humanoid rig: its parts, bones and clips (characters pass their own pieces). */
export function humanRig(def: {
  id: string;
  dims: HumanDims;
  parts: readonly PartSpec[];
  style: MoveStyle;
  extraBones?: readonly BoneSpec[];
  clips?: (info: RigInfo, base: Record<string, ClipDef>) => Record<string, ClipDef>;
  alias?: Record<string, string>;
  bounds?: RigDef['bounds'];
}): RigDef {
  const bones = humanBones(def.dims, def.extraBones);
  const draft: RigDef = { id: def.id, parts: def.parts, bones, clips: {}, fallback: 'idle', alias: def.alias, bounds: def.bounds ?? { left: -14, right: 14, top: -34, bottom: 2 } };
  const info = new RigInfo(draft);
  const base = humanClips(info, def.style);
  return { ...draft, clips: def.clips ? { ...base, ...def.clips(info, base) } : base };
}

// ------------------------------------------------------------ shared painters

/** Fist, open hand and pointing hand in a skin colour (the hand hangs below the wrist joint). */
export function handPart(id: string, skin: number, r: number, far = false, glove?: number): PartSpec {
  const fill = far ? shadeOf(glove ?? skin, 0.15) : (glove ?? skin);
  return {
    id,
    w: r * 4 + 2,
    h: r * 4 + 2,
    px: r * 2 + 1,
    py: r + 0.5,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      const style = { fill, shade: shadeOf(fill), shadeDepth: r * 0.5, light: lightOf(fill), lightDepth: r * 0.3 } as const;
      if (v === 'fist') {
        const fist = p.ellipse(0.1, r * 0.9, r * 1.05, r * 1.0);
        p.shape(fist, style);
        p.line([r * 0.15, r * 0.25, r * 0.55, r * 1.2], LINE * 0.45, INK, false, 0.6);
        p.fill(p.ellipse(r * 0.75, r * 0.55, r * 0.35, r * 0.28), fill);
        p.line([r * 0.55, r * 0.35, r * 0.95, r * 0.8], LINE * 0.45, INK, false, 0.7);
      } else if (v === 'open') {
        const palm = p.smooth([-r * 0.9, 0, r * 0.9, 0, r * 1.05, r * 1.3, r * 0.4, r * 2.3, -r * 0.5, r * 2.2, -r * 1.0, r * 1.1]);
        p.shape(palm, style);
        p.line([-r * 0.1, r * 1.6, -r * 0.1, r * 2.1], LINE * 0.4, INK, false, 0.55);
        p.line([r * 0.4, r * 1.4, r * 0.45, r * 2.0], LINE * 0.4, INK, false, 0.55);
        p.shape(p.capsule(r * 0.9, r * 0.6, r * 0.35, r * 1.7, r * 0.2, r * 0.28), style);
      } else {
        const fist = p.ellipse(0, r * 0.8, r * 0.95, r * 0.9);
        p.shape(fist, style);
        p.shape(p.capsule(r * 0.2, r * 1.2, r * 0.34, r * 0.3, r * 2.7, r * 0.3), style);
      }
    },
  };
}

/** A sneaker or shoe (the foot points forward from the ankle; the sole sits `ankle` below it). */
export function shoePart(id: string, o: { upper: number; toe: number; sole: number; length: number; height: number; ankle: number; far?: boolean; lace?: number }): PartSpec {
  const L = o.length;
  const H = o.height;
  const far = o.far ?? false;
  const upper = far ? shadeOf(o.upper, 0.2) : o.upper;
  return {
    id,
    w: L + 4,
    h: H + o.ankle + 3,
    px: 2,
    py: 1.5,
    draw: (p) => {
      const bottom = o.ankle;
      const shoe = p.smooth([-1.6, -0.6, 1.0, -0.8, L * 0.55, bottom - H * 0.55, L - 0.6, bottom - H * 0.35, L, bottom - 0.4, L * 0.7, bottom, -1.8, bottom, -2.0, bottom - H * 0.6]);
      p.shape(shoe, { fill: upper, shade: shadeOf(upper), shadeDepth: 0.9, light: lightOf(upper), lightDepth: 0.4 });
      p.within(shoe, () => {
        p.fill(p.ellipse(L * 0.85, bottom - H * 0.2, L * 0.38, H * 0.55), far ? shadeOf(o.toe, 0.2) : o.toe);
        p.fill(p.rrect(-3, bottom - H * 0.32, L + 4, H * 0.4, 0.4), far ? shadeOf(o.sole, 0.2) : o.sole);
        if (o.lace !== undefined) p.line([L * 0.25, bottom - H * 0.9, L * 0.45, bottom - H * 0.65], LINE * 0.45, o.lace, false, 0.9);
      });
      p.stroke(shoe, INK, LINE * 0.6, 0.5);
    },
  };
}
