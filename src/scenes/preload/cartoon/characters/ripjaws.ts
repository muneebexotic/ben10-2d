import { RIPJAWS_CARTOON } from '../../../../config/cartoon/ripjaws';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, mix, shadeOf, type Paint, type ShapeStyle } from '../paint';
import { wave, type ClipDef, type PartSpec, type Pose, type PoseData, type RigDef, type RigInfo } from '../rig';
import { omnitrixBadge } from './alienBits';

const C = RIPJAWS_CARTOON.colors;

export const RIPJAWS_DIMS: HumanDims = {
  hip: 11.0,
  thigh: 1,
  shin: 1,
  ankle: 0,
  torso: 11.2,
  shoulderF: { x: 2.0, y: -9.4 },
  shoulderB: { x: -2.8, y: -9.2 },
  upperArm: 3.8,
  forearm: 3.6,
  hipF: 0,
  hipB: 0,
  neck: { x: 1.2, y: -10.6 },
  eyes: { x: 4.8, y: -8.6 },
  mouth: { x: 4.0, y: -2.0 },
};

/** Tail segment lengths, top to bottom. */
const TAIL = [3.6, 3.6, 3.2] as const;
/** The jaw hinge (head space). */
const HINGE = { x: -2.4, y: -2.8 };

/** Fish skin: dark along the back, pale underneath (countershading), cel shaded. */
function fishSkin(far = false, r = 3, belly = 0.5): ShapeStyle {
  const top = far ? C.skinDeep : C.skinDark;
  const mid = far ? shadeOf(C.skin, 0.2) : C.skin;
  return {
    fill: { linear: [-r, -r, r * 0.6, r], stops: [[0, top], [belly, mid], [1, far ? C.skin : C.belly]] },
    shade: C.skinDeep,
    shadeDepth: r * 0.5,
    light: C.skinLight,
    lightDepth: r * 0.28,
    lightAlpha: far ? 0.25 : 0.6,
  };
}

function suit(far = false, r = 2): ShapeStyle {
  return {
    fill: { linear: [-r, -r, r, r * 2], stops: [[0, far ? C.suit : C.suitLight], [1, C.suit]] },
    shade: 0x07080c,
    shadeDepth: r * 0.5,
    light: 0x7a84a4,
    lightDepth: r * 0.28,
    lightAlpha: far ? 0.2 : 0.5,
  };
}

/** A fin: a membrane with rays fanning from its root. */
function finShape(p: Paint, root: readonly [number, number], outline: readonly number[], rays: number, far = false): void {
  const path = p.smooth(outline, true, 0.35);
  p.shape(path, { fill: { linear: [root[0], root[1], outline[2], outline[3]], stops: [[0, far ? C.fin : C.finLight], [1, far ? shadeOf(C.fin, 0.3) : C.fin]] }, light: 0xffffff, lightDepth: 0.3, lightAlpha: far ? 0.2 : 0.5 });
  p.within(path, () => {
    const n = outline.length / 2;
    for (let i = 1; i <= rays; i++) {
      const k = Math.min(n - 1, Math.round((i / (rays + 1)) * (n - 1)));
      p.line([root[0], root[1], outline[k * 2], outline[k * 2 + 1]], LINE * 0.35, C.skinDark, false, 0.55);
    }
  });
}

function torso(p: Paint): void {
  // The dorsal fin, behind the shoulders.
  finShape(p, [-4.0, -6.0], [-3.4, -10.4, -7.4, -15.2, -9.2, -14.6, -7.8, -9.0, -5.6, -4.6], 4);
  const body = p.smooth([-4.6, 0.6, 0.4, 1.4, 4.4, 0.4, 5.2, -3.6, 5.4, -8.0, 3.6, -11.4, -0.4, -12.2, -4.0, -11.2, -5.6, -7.4, -5.4, -3.0]);
  p.shape(body, suit(false, 5));
  p.within(body, () => {
    // The white chest panel, and a black belt line where the suit meets the tail.
    p.fill(p.smooth([0.8, -12.4, 4.0, -11.6, 5.6, -6.4, 4.8, -1.6, 2.6, -1.0, 1.4, -6.0], true, 0.4), { linear: [0, -12, 0, -1], stops: [[0, 0xffffff], [1, C.white]] });
    p.line([1.0, -11.8, 1.8, -6.2, 2.6, -1.2], LINE * 0.45, C.suitLight, true, 0.6);
    p.fill(p.ellipse(3.6, -9.4, 1.6, 0.9, -0.3), 0xffffff, 0.6);
  });
  omnitrixBadge(p, 3.2, -6.4, 1.25, C.omnitrix);
}

/** The top of his tail, where the suit ends (the "hips"). */
function pelvis(p: Paint): void {
  const shape = p.smooth([-4.4, -1.0, 4.2, -1.0, 4.0, 2.4, 0, 3.6, -4.0, 2.4], true, 0.45);
  p.shape(shape, fishSkin(false, 4, 0.55));
}

function head(p: Paint): void {
  // The gill fin behind the jaw.
  finShape(p, [-4.4, -4.0], [-4.0, -6.0, -9.6, -6.6, -10.6, -4.4, -9.0, -2.2, -4.6, -1.8], 3);
  // A huge head that's mostly jaw: a domed back, a long snout, the upper jaw line low.
  const skull = p.smooth([-6.4, -2.4, -7.0, -7.4, -5.0, -11.8, -0.6, -13.6, 4.6, -12.6, 8.6, -9.6, 11.0, -6.6, 11.6, -4.0, 10.6, -2.4, 4.0, -2.0, -2.6, -1.6]);
  p.shape(skull, fishSkin(false, 8, 0.6));
  p.within(skull, () => {
    p.fill(p.ellipse(1.4, -11.0, 4.2, 1.4, -0.15), C.skinLight, 0.3);
    // Gill slits on the cheek.
    for (let i = 0; i < 3; i++) p.line([-4.4 + i * 1.2, -8.2 + i * 0.2, -4.8 + i * 1.2, -5.6 + i * 0.3, -4.4 + i * 1.2, -3.4], LINE * 0.7, C.skinDeep, true, 0.85);
    // A brow ridge over the eye, and a nostril on the snout.
    p.line([2.6, -10.4, 5.4, -10.8, 7.6, -9.8], LINE * 0.9, C.skinDeep, true, 0.7);
    p.fill(p.ellipse(10.2, -5.8, 0.55, 0.35, 0.3), C.skinDeep);
  });
  // Upper teeth: a row of fangs along the jaw line, the front ones longest.
  for (let i = 0; i < 7; i++) {
    const x = -0.6 + i * 1.6;
    const len = 1.0 + (i / 6) * 1.1;
    p.shape(p.poly([x - 0.62, -2.2, x + 0.62, -2.2, x + 0.1, -2.2 + len]), { fill: C.teeth, ink: LINE * 0.35 });
  }
}

/** His lure: a stalk curving over his brow to a glowing bulb. */
function lure(p: Paint, v: string): void {
  const bright = v === 'glow';
  p.line([0, 0, 1.0, -2.6, 3.0, -4.4, 5.0, -4.6], LINE * 1.9, INK, true);
  p.line([0, 0, 1.0, -2.6, 3.0, -4.4, 5.0, -4.6], LINE * 1.0, C.skin, true);
  p.glow(5.4, -4.4, bright ? 5.6 : 3.2, C.lure, bright ? 0.85 : 0.5);
  p.shape(p.circle(5.4, -4.4, bright ? 1.45 : 1.25), { fill: { radial: [5.0, -4.8, 0, 5.4, -4.4, 1.4], stops: [[0, C.lureCore], [1, C.lure]] }, ink: LINE * 0.55 });
}

/** One small fierce eye in profile: yellow-green, a dark pupil, a heavy brow. */
function eyes(p: Paint, v: string): void {
  const rx = v === 'wide' ? 1.55 : 1.3;
  const ry = v === 'angry' ? 0.8 : v === 'wide' ? 1.5 : 1.15;
  if (v === 'blink' || v === 'hurt' || v === 'shut' || v === 'happy') {
    const curve = v === 'happy' ? -0.5 : 0.35;
    p.line([-rx, 0, 0, curve, rx, -0.1], LINE * 0.9, INK, true);
    if (v === 'hurt') p.line([-rx * 0.6, -0.9, rx * 0.6, 0.9], LINE * 0.6, INK);
    return;
  }
  const e = p.ellipse(0, 0, rx, ry, v === 'angry' ? 0.25 : 0.1);
  p.shape(e, { fill: { radial: [-0.4, -0.4, 0, 0, 0, rx * 1.1], stops: [[0, lightOf(C.eye, 0.4)], [0.6, C.eye], [1, C.eyeDark]] }, ink: LINE * 0.7 });
  p.fill(p.ellipse(0.35, 0.05, rx * 0.36, ry * 0.62), INK);
  p.fill(p.circle(-0.35, -ry * 0.4, 0.32), 0xffffff, 0.95);
  if (v === 'angry') p.line([-rx - 0.5, -ry - 0.3, rx + 0.4, -0.2], LINE * 1.1, C.skinDeep, true);
}

/** Inside his mouth, stretched with the jaw (it never shows under a closed one). */
function maw(p: Paint): void {
  const inside = p.poly([-0.4, -0.2, 11.6, -0.2, 10.4, 4.6, 0.4, 2.4]);
  p.fill(inside, C.mouth);
  p.within(inside, () => {
    p.fill(p.ellipse(5.6, 3.6, 4.8, 1.4, 0.25), C.tongue);
    p.fill(p.ellipse(2.0, 0.8, 2.4, 1.2), 0x000000, 0.35);
  });
}

/** The lower jaw: an underbite of huge fangs. */
function jaw(p: Paint): void {
  for (let i = 0; i < 6; i++) {
    const x = 1.6 + i * 1.95;
    const len = 1.4 + (i / 5) * 1.6;
    p.shape(p.poly([x - 0.75, 0.4, x + 0.75, 0.4, x + 0.15, 0.4 - len]), { fill: C.teeth, ink: LINE * 0.38 });
  }
  const shape = p.smooth([-1.2, -0.2, 6.0, 0.2, 13.6, 0.0, 13.2, 2.0, 10.2, 4.0, 3.6, 4.4, -0.6, 2.6]);
  p.shape(shape, { ...fishSkin(false, 3, 0.25), fill: { linear: [0, -0.2, 0, 4.4], stops: [[0, C.skin], [0.5, C.belly], [1, mix(C.belly, C.skin, 0.5)]] } });
  p.within(shape, () => p.line([1.0, 2.6, 7.0, 3.4, 12.0, 1.8], LINE * 0.45, C.skinDark, true, 0.5));
}

function sleeve(p: Paint, far: boolean): void {
  p.shape(p.capsule(0, 0, 1.55, 0, RIPJAWS_DIMS.upperArm, 1.25), suit(far, 1.5));
}

/** A grey forearm with a fin down the back of it. */
function forearm(p: Paint, far: boolean): void {
  const L = RIPJAWS_DIMS.forearm;
  finShape(p, [-0.8, L * 0.2], [-0.9, 0.2, -3.2, L * 0.55, -2.8, L * 0.85, -0.9, L * 0.9], 2, far);
  p.shape(p.capsule(0, 0, 1.25, 0, L, 1.05), fishSkin(far, 1.3, 0.4));
}

/** Webbed hands with three claws. */
function hand(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 7,
    h: 7,
    px: 3,
    py: 1.3,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      const spread = v === 'open' ? 1 : v === 'point' ? 0.15 : 0.45;
      const tips: Array<[number, number]> = [];
      for (let i = -1; i <= 1; i++) {
        const a = i * spread * 0.7 + 0.3;
        tips.push([Math.sin(a) * 3.0 + i * 0.2, 0.8 + Math.cos(a) * 2.8]);
      }
      // The web between the fingers.
      p.fill(p.smooth([-1.0, 0.4, tips[0][0], tips[0][1], tips[1][0], tips[1][1] + 0.2, tips[2][0], tips[2][1], 1.0, 0.4], true, 0.3), far ? C.fin : C.finLight, 0.85);
      p.shape(p.ellipse(0, 0.9, 1.15, 1.0), fishSkin(far, 1.2, 0.4));
      for (const [tx, ty] of tips) {
        p.shape(p.capsule(0, 1.0, 0.45, tx * 0.8, ty * 0.85, 0.35), fishSkin(far, 0.5, 0.4));
        p.shape(p.horn(tx * 0.8 - 0.3, ty * 0.85 - 0.1, tx * 0.9 + 0.3, ty * 0.95, tx + 0.5, ty + 0.4, 0.55), { fill: C.teeth, ink: LINE * 0.3 });
      }
    },
  };
}

function tail(len: number, r0: number, r1: number): (p: Paint) => void {
  return (p) => {
    const path = p.capsule(0, 0, r0, 0, len, r1);
    p.shape(path, { ...fishSkin(false, r0, 0.5), fill: { linear: [-r0, 0, r0, 0], stops: [[0, C.skinDark], [0.45, C.skin], [1, C.belly]] } });
    // Scale ridges across the tail.
    p.within(path, () => {
      for (let i = 0; i < 2; i++) p.line([-r0, len * (0.3 + i * 0.4), 0, len * (0.4 + i * 0.4), r0, len * (0.3 + i * 0.4)], LINE * 0.4, C.skinDark, true, 0.45);
    });
  };
}

/** The forked tail fin: two lobes, flat on the floor when he stands, a shark's tail when he swims. */
function fluke(p: Paint): void {
  for (const dir of [-1, 1] as const) {
    finShape(p, [0, 0.4], [0, -0.6, dir * 4.2, 0.2, dir * 7.4, 2.6, dir * 6.2, 3.4, dir * 2.4, 2.6, 0, 1.8], 3, dir < 0);
  }
  p.shape(p.ellipse(0, 0.6, 1.8, 1.4), fishSkin(false, 1.6, 0.4));
}

const empty = (id: string): PartSpec => ({ id, w: 1, h: 1, px: 0.5, py: 0.5, draw: () => undefined });

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 17, h: 19, px: 10, py: 16.4, draw: (p) => torso(p) },
    { id: 'pelvis', w: 10, h: 6, px: 5, py: 1.8, draw: (p) => pelvis(p) },
    empty('thighF'),
    empty('thighB'),
    empty('shinF'),
    empty('shinB'),
    empty('footF'),
    empty('footB'),
    { id: 'armUF', w: 5, h: 7, px: 2.5, py: 2, draw: (p) => sleeve(p, false) },
    { id: 'armUB', w: 5, h: 7, px: 2.5, py: 2, draw: (p) => sleeve(p, true) },
    { id: 'armLF', w: 6, h: 7, px: 3.6, py: 1.6, draw: (p) => forearm(p, false) },
    { id: 'armLB', w: 6, h: 7, px: 3.6, py: 1.6, draw: (p) => forearm(p, true) },
    hand('handF', false),
    hand('handB', true),
    { id: 'head', w: 24, h: 16, px: 11.5, py: 14.4, draw: (p) => head(p) },
    { id: 'eyes', w: 5, h: 5, px: 2.5, py: 2.5, variants: ['open', 'blink', 'angry', 'wide', 'hurt', 'happy', 'shut'], draw: (p, v) => eyes(p, v) },
    empty('mouth'),
    { id: 'lure', w: 18, h: 16, px: 5.5, py: 11, variants: ['dim', 'glow'], draw: (p, v) => lure(p, v) },
    { id: 'maw', w: 15, h: 8, px: 1, py: 1, draw: (p) => maw(p) },
    { id: 'jaw', w: 16, h: 7, px: 2, py: 2.5, draw: (p) => jaw(p) },
    { id: 'tail1', w: 9, h: 9, px: 4.5, py: 4, draw: tail(TAIL[0], 3.8, 3.2) },
    { id: 'tail2', w: 8, h: 8, px: 4, py: 3.4, draw: tail(TAIL[1], 3.2, 2.4) },
    { id: 'tail3', w: 6, h: 7, px: 3, py: 2.6, draw: tail(TAIL[2], 2.4, 1.6) },
    { id: 'fluke', w: 17, h: 6, px: 8.5, py: 1.6, draw: (p) => fluke(p) },
  ];
}

/** The mouth's inside stretches with the jaw. */
function openMaw(p: Pose): void {
  const a = p.a[p.info.bone('jaw')];
  p.size('maw', 1, Math.max(0.05, Math.min(1.15, a / 32)));
}

/** Tail on dry land: an S-curve down to the fin flat on the floor (`squash` coils it tighter). */
function landTail(p: Pose, squash = 0): void {
  p.set('tail1', 14 + squash * 30).set('tail2', -26 - squash * 40).set('tail3', -16 - squash * 10).set('fluke', 28 + squash * 20);
}

/** Tail beating while he swims: a wave travelling down it. */
function swimTail(p: Pose, t: number, amp: number): void {
  p.set('tail1', wave(t) * amp * 0.5).set('tail2', wave(t, -0.15) * amp * 0.8).set('tail3', wave(t, -0.3) * amp).set('fluke', wave(t, -0.45) * amp * 1.1);
}

function ripClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const finish = (p: Pose, lureGlow = false) => {
    p.show('lure', lureGlow ? 'glow' : 'dim');
    openMaw(p);
  };
  const out: Record<string, ClipDef> = {};
  // Shared clips stand him on his tail.
  for (const [name, clip] of Object.entries(base)) {
    out[name] = {
      ...clip,
      pose: (t, p) => {
        clip.pose(t, p);
        landTail(p);
        p.set('jaw', 8);
        finish(p);
      },
    };
  }
  const idle: ClipDef = {
    ms: 1200,
    loop: true,
    pose: (t, p) => {
      const b = wave(t);
      p.move('hip', 0, 0.4 + b * 0.4);
      landTail(p, 0.1 + b * 0.08);
      p.set('torso', 6 + b * 1.5).set('head', -6 + wave(t, 0.2) * 2);
      p.set('armUF', 24 + b * 4).set('armLF', 56).set('armUB', 14 - b * 4).set('armLB', 50);
      // Out of water his jaw works and gasps a little.
      p.set('jaw', 8 + Math.max(0, wave(t * 2)) * 10);
      p.set('lure', wave(t, 0.3) * 8);
      finish(p);
    },
  };
  const hop: ClipDef = {
    ms: 380,
    loop: true,
    pose: (t, p) => {
      // Bounding along on his tail: coil, spring, sail, land.
      const air = Math.sin(Math.PI * t);
      p.move('hip', 0, -air * 4.2 + (1 - air) * 1.2);
      landTail(p, (1 - air) * 0.5 - air * 0.25);
      p.set('torso', 12 + air * 4).set('head', -10 - air * 4);
      p.set('armUF', -20 + air * 70).set('armLF', 50).set('armUB', 30 - air * 60).set('armLB', 40);
      p.set('jaw', 10 + air * 10).set('lure', -air * 14);
      finish(p);
    },
  };
  const swim: ClipDef = {
    ms: 520,
    loop: true,
    pose: (t, p) => {
      // Level in the water, head forward, the tail driving him.
      p.set('hip', 86).move('hip', -2, -6 + wave(t * 2) * 0.4);
      p.set('torso', 0).set('head', -78 + wave(t, 0.2) * 3);
      p.set('armUF', -150 + wave(t) * 14).set('armLF', 10).set('armUB', -160 - wave(t) * 14).set('armLB', 10);
      swimTail(p, t, 26);
      p.set('jaw', 10).set('lure', 6);
      finish(p);
    },
  };
  const tread: ClipDef = {
    ms: 1300,
    loop: true,
    pose: (t, p) => {
      p.set('hip', 16).move('hip', 0, -3 + wave(t) * 0.8);
      p.set('torso', 4).set('head', -14);
      p.set('armUF', 60 + wave(t) * 24).set('armLF', -30 + wave(t, 0.2) * 20).set('armUB', 40 - wave(t) * 24).set('armLB', -20);
      swimTail(p, t, 14);
      p.add('tail1', -8);
      p.set('jaw', 6 + Math.max(0, wave(t)) * 4).set('lure', wave(t, 0.3) * 10);
      finish(p);
    },
  };
  const dash: ClipDef = {
    ms: 180,
    loop: true,
    pose: (t, p) => {
      p.set('hip', 90).move('hip', -2, -6);
      p.set('torso', 0).set('head', -88);
      p.set('armUF', -172).set('armLF', 0).set('armUB', -176).set('armLB', 0);
      swimTail(p, t, 34);
      p.set('jaw', 34 + wave(t * 2) * 4).set('lure', -10);
      p.show('eyes', 'angry');
      finish(p, true);
    },
  };
  const biteKeys = (lunge: boolean) =>
    k([
      [0, { torso: 6, head: -16, jaw: lunge ? 52 : 40, armUF: 40, armLF: 40, armUB: 30, armLB: 40, eyes: { v: 'angry' } }],
      [0.55, { hip: { x: lunge ? 1.6 : 0.4 }, torso: lunge ? 22 : 14, head: lunge ? 4 : 0, jaw: 0, armUF: 70, armLF: 10, armUB: 60, armLB: 20, eyes: { v: 'angry' } }],
      [1, { hip: { x: lunge ? 1.2 : 0.3 }, torso: lunge ? 18 : 10, head: -2, jaw: 4, armUF: 60, armLF: 20, armUB: 50, armLB: 24, eyes: { v: 'angry' } }],
    ]);
  const bite = (lunge: boolean): ClipDef => {
    const keys = biteKeys(lunge);
    return {
      ms: lunge ? 280 : 190,
      loop: false,
      pose: (t, p) => {
        landTail(p, 0.2);
        p.keys(keys, t);
        finish(p, lunge);
      },
    };
  };
  const whip: ClipDef = {
    ms: 360,
    loop: false,
    pose: (t, p) => {
      // A full spin with the tail out: everything around him gets slapped.
      p.set('hip', t * 360).move('hip', 0, -4);
      p.set('torso', 0).set('head', -10);
      p.set('armUF', 90).set('armLF', 10).set('armUB', 90).set('armLB', 10);
      p.set('tail1', 30).set('tail2', 10).set('tail3', 6).set('fluke', 10);
      p.set('jaw', 20);
      p.show('eyes', 'angry');
      finish(p);
    },
  };
  const gasp: ClipDef = {
    ms: 700,
    loop: true,
    pose: (t, p) => {
      const g = Math.max(0, wave(t * 2));
      p.move('hip', 0, 1.2);
      landTail(p, 0.45);
      p.set('torso', 18 + g * 4).set('head', -24 + g * 10);
      p.set('armUF', 150).set('armLF', -150).show('handF', 'open').set('armUB', 10).set('armLB', 30);
      p.set('jaw', 6 + g * 34).show('eyes', g > 0.5 ? 'shut' : 'wide');
      finish(p);
    },
  };
  return {
    ...out,
    idle,
    run: hop,
    walk: hop,
    jump: {
      ms: 380,
      loop: false,
      pose: (t, p) => {
        landTail(p, -0.4 + t * 0.2);
        p.add('tail1', -10);
        p.set('torso', -4).set('head', -8).set('armUF', 130).set('armLF', 20).set('armUB', 110).set('armLB', 30);
        p.set('jaw', 16).set('lure', -16);
        finish(p);
      },
    },
    fall: {
      ms: 700,
      loop: true,
      pose: (t, p) => {
        landTail(p, -0.2);
        p.add('tail1', wave(t) * 6).add('fluke', wave(t, 0.3) * 10);
        p.set('torso', -2).set('head', 2).set('armUF', 110 + wave(t) * 10).set('armLF', 30).set('armUB', 96 - wave(t) * 10).set('armLB', 30);
        p.set('jaw', 22).set('lure', 14).show('eyes', 'wide');
        finish(p);
      },
    },
    land: {
      ms: 240,
      loop: false,
      pose: (t, p) => {
        const s = 1 - t;
        p.move('hip', 0, s * 2.6);
        landTail(p, s * 0.7);
        p.set('torso', 6 + s * 14).set('head', -6 - s * 10).set('armUF', 24 + s * 20).set('armLF', 56).set('armUB', 14).set('armLB', 50);
        p.set('jaw', 8 + s * 10);
        finish(p);
      },
    },
    swim,
    tread,
    dash,
    biteA: bite(false),
    biteB: bite(true),
    swimBite: {
      ms: 220,
      loop: false,
      pose: (t, p) => {
        // A bite on the move: level in the water, jaws wide, then shut.
        swim.pose(t, p);
        p.set('jaw', t < 0.45 ? 48 : Math.max(0, 48 - (t - 0.45) * 200));
        p.add('head', t < 0.45 ? -8 : 4).show('eyes', 'angry');
        finish(p, true);
      },
    },
    whip,
    gasp,
    hurt: {
      ...base.hurt,
      pose: (t, p) => {
        base.hurt.pose(t, p);
        landTail(p, 0.3);
        p.add('tail1', -20).set('jaw', 30 - t * 14);
        finish(p);
      },
    },
    defeat: {
      ms: 600,
      loop: true,
      pose: (t, p) => {
        // Flopping on his side.
        p.set('hip', 90).move('hip', -3, 6.6 + Math.max(0, wave(t)) * -1.2);
        p.set('torso', 0).set('head', -70 + wave(t) * 6);
        p.set('armUF', 160).set('armLF', 10).set('armUB', 170).set('armLB', 10);
        swimTail(p, t, 20);
        p.set('jaw', 26).show('eyes', 'hurt');
        finish(p);
      },
    },
    drown: {
      ms: 500,
      loop: true,
      pose: (t, p) => {
        tread.pose(t, p);
        swimTail(p, t * 2, 30);
        p.set('jaw', 30).show('eyes', 'hurt');
        finish(p);
      },
    },
    roar: {
      ms: 900,
      loop: true,
      pose: (t, p) => {
        const s = wave(t * 3) * 0.5;
        p.set('hip', 12).move('hip', 0, -2);
        swimTail(p, t, 12);
        p.set('torso', -14 + s).set('head', -22 + s * 2);
        p.set('armUF', 150 + s * 6).set('armLF', -30).show('handF', 'open').set('armUB', 160 - s * 6).set('armLB', -24).show('handB', 'open');
        p.set('jaw', 48 + s * 4).set('lure', -12).show('eyes', 'angry');
        finish(p, true);
      },
    },
    talk: {
      ms: 600,
      loop: true,
      pose: (t, p) => {
        idle.pose(t, p);
        p.set('jaw', 6 + Math.max(0, wave(t * 2)) * 16).set('armUF', 50 + wave(t) * 16).set('armLF', 40).show('handF', 'open');
        openMaw(p);
      },
    },
    cheer: {
      ms: 500,
      loop: true,
      pose: (t, p) => {
        p.move('hip', 0, -Math.abs(wave(t)) * 2.6);
        landTail(p, Math.abs(wave(t)) * -0.3);
        p.set('torso', -4).set('head', -12).set('armUF', 165).set('armLF', 10).set('armUB', 155).set('armLB', 20);
        p.set('jaw', 22).show('eyes', 'happy');
        finish(p);
      },
    },
  };
}

/** Ripjaws' HD rig: a fish-man's upper body on a tail, a hinged jaw full of fangs, a lure, fins, and every move he has in and out of water. */
export function ripjawsRig(): RigDef {
  return humanRig({
    id: 'ripjaws',
    dims: RIPJAWS_DIMS,
    parts: parts(),
    style: RIPJAWS_CARTOON.style!,
    extraBones: [
      { id: 'lure', parent: 'head', x: 1.0, y: -12.8, part: 'lure', z: 69, dir: 1 },
      { id: 'maw', parent: 'head', x: HINGE.x, y: HINGE.y, part: 'maw', z: 66, dir: 1 },
      { id: 'jaw', parent: 'head', x: HINGE.x, y: HINGE.y, part: 'jaw', z: 67, dir: 1 },
      { id: 'tail1', parent: 'hip', x: 0, y: 1.0, part: 'tail1', z: 30, dir: -1 },
      { id: 'tail2', parent: 'tail1', x: 0, y: TAIL[0], part: 'tail2', z: 29, dir: -1 },
      { id: 'tail3', parent: 'tail2', x: 0, y: TAIL[1], part: 'tail3', z: 28, dir: -1 },
      { id: 'fluke', parent: 'tail3', x: 0, y: TAIL[2], part: 'fluke', z: 27, dir: -1 },
    ],
    bounds: { left: -20, right: 24, top: -38, bottom: 2 },
    clips: ripClips,
  });
}
