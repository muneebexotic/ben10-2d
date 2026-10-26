import { XLR8_CARTOON } from '../../../../config/cartoon/xlr8';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { wave, type ClipDef, type PartSpec, type Pose, type PoseData, type RigDef, type RigInfo } from '../rig';
import { cel, omnitrixBadge } from './alienBits';

const C = XLR8_CARTOON.colors;

export const XLR8_DIMS: HumanDims = {
  hip: 12.4,
  thigh: 4.8,
  shin: 4.4,
  ankle: 3.4,
  torso: 8.6,
  shoulderF: { x: 1.4, y: -6.6 },
  shoulderB: { x: -0.4, y: -6.4 },
  upperArm: 3.4,
  forearm: 3.0,
  hipF: 0.7,
  hipB: -0.7,
  neck: { x: 1.0, y: -8.4 },
  eyes: { x: 4.4, y: -3.9 },
  mouth: { x: 5.0, y: -0.9 },
};

const body = (far = false, r = 2) => cel(C.body, { light: C.bodyLight, shade: C.navy, far, r });

function torso(p: Paint): void {
  const shape = p.smooth([-2.6, 0.8, 1.6, 1.2, 3.0, -1.6, 3.7, -5.4, 2.8, -8.4, 0.4, -9.6, -1.8, -8.6, -2.8, -4.6]);
  p.shape(shape, body(false, 3));
  p.within(shape, () => {
    // The pale belly band and a navy stripe down his back.
    p.line([2.6, 0.2, 3.5, -3.4, 3.1, -7.4], 1.5, C.blue, true, 0.9);
    p.line([2.9, -0.4, 3.7, -3.6, 3.3, -7.0], 0.5, C.light, true, 0.7);
    p.line([-2.4, -1.2, -2.2, -5.0, -0.8, -8.4], 1.1, C.navy, true, 0.9);
  });
  omnitrixBadge(p, 1.6, -5.4, 1.05, C.omnitrix);
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-2.8, -1.2, 2.4, -1.2, 2.6, 1.0, 0.8, 2.0, -1.6, 2.0, -3.0, 0.8]);
  p.shape(shape, body(false, 2));
  p.within(shape, () => p.line([-2.6, 1.0, 2.4, 0.6], 0.8, C.navy, true, 0.8));
}

function head(p: Paint): void {
  // Neck, then the sleek helmet pointing forward, the visor down over the eyes.
  p.shape(p.capsule(-0.2, 1.2, 1.5, 0.8, -2.0, 1.4), body(false, 1.5));
  const helmet = p.smooth([-3.6, -1.8, -1.8, -5.0, 2.6, -5.8, 6.4, -3.6, 7.4, -1.6, 5.0, 0.4, 0.4, 0.6, -2.4, -0.2]);
  p.shape(helmet, body(false, 3));
  p.within(helmet, () => {
    // Pale blue face under the visor, a navy stripe over the crown.
    p.fill(p.smooth([1.0, -2.4, 7.6, -2.4, 7.6, 1.0, 0.6, 1.0], true, 0.3), { linear: [0, -2.4, 0, 1], stops: [[0, lightOf(C.face, 0.25)], [1, C.face]] });
    p.line([-3.2, -1.8, -1.6, -4.4, 1.4, -5.4], 1.1, C.navy, true, 0.9);
  });
  // A swept fin at the back of the head.
  p.shape(p.spiky([-2.6, -3.6, -5.2, -4.6, -3.2, -2.0], [false, true, false]), body(false, 1));
  const visor = p.smooth([-0.8, -5.2, 3.2, -5.7, 6.8, -3.4, 7.5, -2.0, 1.0, -2.2], true, 0.35);
  p.shape(visor, { fill: { linear: [0, -5.7, 0, -2], stops: [[0, 0x2a3450], [0.6, C.visor], [1, C.visor]] }, ink: LINE * 0.8, gloss: { x: 2.6, y: -4.6, rx: 2.6, ry: 0.45, alpha: 0.55, angle: 0.08 } });
}

/** The visor's shine and the glow of his eyes behind it. */
function eyes(p: Paint, v: string): void {
  if (v !== 'blink' && v !== 'hurt') {
    const angry = v === 'angry';
    const r = v === 'wide' ? 1.15 : 0.85;
    p.glow(1.4, 0.2, 2.4, 0x7fe0ff, 0.45);
    p.fill(p.ellipse(1.4, 0.25, r * 1.2, angry ? r * 0.45 : r * 0.7, angry ? 0.25 : 0), 0xbff4ff, 0.95);
  }
  if (v === 'hurt') {
    p.line([-1.8, -0.6, 0, -0.2], LINE * 0.6, C.glint, false, 0.9);
    p.line([0.8, -0.1, 2.0, 0.2], LINE * 0.6, C.glint, false, 0.9);
    p.line([0.4, -0.9, 1.2, 0.8], LINE * 0.5, 0xffffff, false, 0.8);
    return;
  }
  p.line([-3.0, -0.9, 1.6, -0.7], LINE * 0.55, C.glint, true, 0.85);
}

function mouth(p: Paint, v: string): void {
  if (v === 'grin' || v === 'open' || v === 'shout' || v === 'grit' || v === 'o') {
    const m = v === 'o' ? p.ellipse(0, 0.2, 0.7, 0.6) : p.smooth([-1.8, -0.5, 1.6, -0.7, 1.2, 0.8, -1.2, 0.7], true, 0.4);
    p.shape(m, { fill: C.mouth, ink: LINE * 0.6 });
    if (v !== 'o') p.within(m, () => p.fill(p.rrect(-2, -1, 4, 0.8, 0.2), 0xffffff));
    return;
  }
  if (v === 'smirk') {
    p.line([-1.4, 0.1, 0.4, 0.2, 1.6, -0.5], LINE * 0.7, INK, true);
    return;
  }
  p.line([-1.5, -0.2, 0, 0.35, 1.6, -0.3], LINE * 0.7, INK, true);
}

function limb(p: Paint, len: number, r0: number, r1: number, far: boolean, stripe?: number): void {
  const path = p.capsule(0, 0, r0, 0, len, r1);
  p.shape(path, body(far, r0));
  if (stripe !== undefined) p.within(path, () => p.line([r0 * 0.2, len * 0.2, r1 * 0.3, len * 0.85], 0.7, stripe, true, far ? 0.5 : 0.85));
}

function forearm(p: Paint, far: boolean): void {
  limb(p, XLR8_DIMS.forearm, 1.0, 0.85, far);
  p.shape(p.rrect(-1.1, XLR8_DIMS.forearm - 1.0, 2.2, 0.9, 0.4), { fill: far ? shadeOf(C.blue, 0.2) : C.blue, ink: LINE * 0.45 });
}

/** Three white claws at the end of each hand. */
function clawHand(id: string, far: boolean): PartSpec {
  const claw = far ? shadeOf(C.claw, 0.2) : C.claw;
  return {
    id,
    w: 7,
    h: 7,
    px: 3,
    py: 1.5,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      p.shape(p.ellipse(0, 0.8, 1.1, 1.0), body(far, 1));
      const spread = v === 'open' ? 0.9 : v === 'point' ? 0.15 : 0.45;
      for (let i = -1; i <= 1; i++) {
        const a = i * spread;
        const x0 = 0.2 + i * 0.4;
        const tip = [x0 + Math.sin(a + 0.5) * 3.0, 1.2 + Math.cos(a + 0.5) * 3.0];
        p.shape(p.horn(x0 - 0.35, 1.2, x0 + Math.sin(a + 0.3) * 2.2 - 0.2, 1.6 + Math.cos(a + 0.3) * 1.6, tip[0], tip[1], 0.75), { fill: { linear: [0, 1, 0, 4], stops: [[0, 0xffffff], [1, claw]] }, ink: LINE * 0.45 });
      }
    },
  };
}

/** A ball foot: he rolls rather than runs. A stripe through it shows the spin. */
function ballFoot(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 6,
    h: 6,
    px: 2.6,
    py: 0.8,
    draw: (p) => {
      const ball = p.circle(0.3, 1.8, 2.0);
      p.shape(ball, { fill: { radial: [-0.4, 1.0, 0.2, 0.3, 1.8, 2.2], stops: [[0, far ? 0x2a3450 : 0x3c4c74], [0.6, C.ball], [1, 0x05060a]] }, ink: LINE * 0.7 });
      p.within(ball, () => {
        p.line([-1.8, 1.8, 2.4, 1.8], 0.6, C.blue, false, far ? 0.4 : 0.85);
        p.stroke(p.ellipse(0.3, 1.8, 1.5, 1.5), C.blue, 0.25, 0.35);
      });
      p.fill(p.ellipse(-0.5, 0.9, 0.7, 0.35, -0.5), 0xffffff, far ? 0.25 : 0.6);
    },
  };
}

function tail(id: string, len: number, r0: number, r1: number, z: number): PartSpec {
  return {
    id,
    w: len + r0 * 2 + 1,
    h: r0 * 2 + 1.5,
    px: len + r0 + 0.5,
    py: r0 + 0.75,
    draw: (p) => {
      const path = p.capsule(0, 0, r0, -len, 0, r1);
      p.shape(path, body(false, r0));
      p.within(path, () => {
        // Alternating navy and blue bands down the tail.
        p.fill(p.rrect(-len * 0.62, -r0 - 1, len * 0.3, r0 * 2 + 2, 0), z > 2 ? C.navy : C.blue, 0.9);
        p.line([0, -r0 * 0.4, -len, -r1 * 0.4], 0.35, C.light, false, 0.4);
      });
      if (r1 < 0.5) p.glow(-len, 0, 1.4, C.light, 0.5);
    },
  };
}

function streak(): PartSpec {
  return {
    id: 'streak',
    w: 22,
    h: 14,
    px: 20,
    py: 8,
    variants: ['a', 'b'],
    draw: (p, v) => {
      const rows = v === 'a' ? [[-7, 14, C.light], [-3.5, 18, C.blue], [0, 12, C.light], [3, 16, C.blue]] : [[-6, 16, C.blue], [-2.5, 13, C.light], [1, 18, C.light], [4, 11, C.blue]];
      for (const [y, len, c] of rows) {
        p.line([-1, y, -1 - len, y], 1.1, c, false, 0.35);
        p.line([-1, y, -1 - len * 0.6, y], 0.45, 0xffffff, false, 0.6);
      }
    },
  };
}

function parts(): PartSpec[] {
  const D = XLR8_DIMS;
  return [
    { id: 'torso', w: 9, h: 12, px: 3.5, py: 10.5, draw: (p) => torso(p) },
    { id: 'pelvis', w: 7, h: 5, px: 3.5, py: 1.8, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 5, h: 8, px: 2.5, py: 2.2, draw: (p) => limb(p, D.thigh, 1.9, 1.3, false, C.blue) },
    { id: 'thighB', w: 5, h: 8, px: 2.5, py: 2.2, draw: (p) => limb(p, D.thigh, 1.9, 1.3, true, C.blue) },
    { id: 'shinF', w: 4, h: 7, px: 2, py: 1.6, draw: (p) => limb(p, D.shin, 1.2, 0.9, false, C.light) },
    { id: 'shinB', w: 4, h: 7, px: 2, py: 1.6, draw: (p) => limb(p, D.shin, 1.2, 0.9, true, C.light) },
    ballFoot('footF', false),
    ballFoot('footB', true),
    { id: 'armUF', w: 4, h: 6, px: 2, py: 1.5, draw: (p) => limb(p, D.upperArm, 1.2, 1.0, false) },
    { id: 'armUB', w: 4, h: 6, px: 2, py: 1.5, draw: (p) => limb(p, D.upperArm, 1.2, 1.0, true) },
    { id: 'armLF', w: 4, h: 6, px: 2, py: 1.4, draw: (p) => forearm(p, false) },
    { id: 'armLB', w: 4, h: 6, px: 2, py: 1.4, draw: (p) => forearm(p, true) },
    clawHand('handF', false),
    clawHand('handB', true),
    { id: 'head', w: 14, h: 10, px: 5, py: 7.5, draw: (p) => head(p) },
    { id: 'eyes', w: 7, h: 4, px: 4, py: 2, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 5, h: 3, px: 2.5, py: 1.4, variants: ['smile', 'grin', 'open', 'o', 'grit', 'shout', 'smirk'], draw: (p, v) => mouth(p, v) },
    tail('tail1', 5.0, 1.8, 1.3, 1),
    tail('tail2', 4.6, 1.3, 0.9, 3),
    tail('tail3', 4.4, 0.9, 0.3, 1),
    streak(),
  ];
}

function tailSway(p: Pose, t: number, lift: number, amp: number): void {
  p.set('tail1', lift + wave(t) * amp).set('tail2', 4 + wave(t, 0.15) * amp * 1.3).set('tail3', 6 + wave(t, 0.3) * amp * 1.6);
}

function xlr8Clips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const stance: PoseData = { hip: { y: 0.8 }, torso: 26, head: -22, armUF: 40, armLF: 70, armUB: 30, armLB: 64, thighF: 14, shinF: -26, thighB: -6, shinB: -20, tail1: 4, tail2: 6, tail3: 8 };
  const strike = (data: PoseData, wind: PoseData, ms: number): ClipDef => {
    const keys = k([[0, { ...stance, ...wind }], [0.35, { ...stance, ...data }], [1, { ...stance, ...data }]]);
    return { ms, loop: false, pose: (t, p) => p.keys(keys, t) };
  };
  // Every shared clip gets his forward lean and a live tail; the streaks only show at speed.
  const out: Record<string, ClipDef> = {};
  for (const [name, clip] of Object.entries(base)) {
    const lean = name === 'swim' || name === 'drown' || name === 'defeat' ? 0 : 1;
    out[name] = {
      ...clip,
      pose: (t, p) => {
        clip.pose(t, p);
        p.add('torso', 20 * lean).add('head', -18 * lean);
        tailSway(p, t, 6, 5);
        p.hidden('streak');
      },
    };
  }
  const clips: Record<string, ClipDef> = {
    idle: {
      ms: 900,
      loop: true,
      pose: (t, p) => {
        const b = Math.abs(wave(t));
        p.move('hip', 0, 1.0 - b * 0.9);
        p.set('torso', 26 + wave(t) * 2).set('head', -22 - wave(t) * 2);
        p.set('armUF', 40 + wave(t, 0.1) * 6).set('armLF', 70).set('armUB', 30 - wave(t, 0.1) * 6).set('armLB', 64);
        p.set('thighF', 14 + b * 4).set('shinF', -26 - b * 8).set('thighB', -6 + b * 4).set('shinB', -20 - b * 8);
        tailSway(p, t, 4, 6);
        p.hidden('streak');
      },
    },
    run: {
      ms: 240,
      loop: true,
      pose: (t, p) => {
        base.run.pose(t, p);
        p.set('torso', 46 + wave(t * 2) * 2).set('head', -40);
        p.set('armUF', -56 + wave(t) * 10).set('armLF', 70).set('armUB', -64 - wave(t) * 10).set('armLB', 60);
        p.set('footF', -t * 1080).set('footB', -t * 1080 - 90);
        p.set('tail1', 16 + wave(t * 2) * 3).set('tail2', -4 + wave(t * 2, 0.2) * 4).set('tail3', -6 + wave(t * 2, 0.4) * 6);
        p.show('streak', t < 0.5 ? 'a' : 'b').show('eyes', 'angry').show('mouth', 'grit');
      },
    },
    strikeA: strike({ torso: 34, head: -28, armUF: 108, armLF: 6, handF: { v: 'open' }, eyes: { v: 'angry' }, mouth: { v: 'grit' } }, { armUF: 150, armLF: -40, handF: { v: 'open' } }, 170),
    strikeB: strike({ torso: 36, head: -30, armUB: 112, armLB: 4, handB: { v: 'open' }, armUF: -20, eyes: { v: 'angry' }, mouth: { v: 'shout' } }, { armUB: 150, armLB: -40, handB: { v: 'open' } }, 170),
    kick: strike({ torso: -6, head: -2, thighF: 116, shinF: 4, footF: 0, thighB: -14, shinB: -20, armUF: -40, armLF: 60, armUB: -30, tail1: 26, tail2: 10, eyes: { v: 'angry' }, mouth: { v: 'shout' } }, { thighF: 70, shinF: -90 }, 200),
    hurt: {
      ...base.hurt,
      pose: (t, p) => {
        base.hurt.pose(t, p);
        p.add('torso', 8);
        p.set('tail1', 30).set('tail2', 20).set('tail3', 14);
        p.hidden('streak');
      },
    },
  };
  const dashKeys = k([[0, { torso: 62, head: -58, armUF: -86, armLF: 30, armUB: -92, armLB: 26, thighF: -30, shinF: -70, thighB: -56, shinB: -46, tail1: 22, tail2: -6, tail3: -8 }]]);
  clips.dash = {
    ms: 200,
    loop: true,
    pose: (t, p) => {
      p.keys(dashKeys, 0);
      p.set('footF', -t * 1440).set('footB', -t * 1440);
      p.move('hip', 0, -0.5 + wave(t * 2) * 0.3);
      p.show('streak', t < 0.5 ? 'a' : 'b').show('eyes', 'angry').show('mouth', 'grit');
    },
  };
  return { ...out, ...clips };
}

/** XLR8's HD rig: the humanoid kit leaning into a raptor's stance, with a three-part tail, claws, ball feet and speed streaks. */
export function xlr8Rig(): RigDef {
  const D = XLR8_DIMS;
  return humanRig({
    id: 'xlr8',
    dims: D,
    parts: parts(),
    style: XLR8_CARTOON.style!,
    extraBones: [
      { id: 'tail1', parent: 'hip', x: -2.2, y: -0.2, part: 'tail1', z: 9, dir: 1 },
      { id: 'tail2', parent: 'tail1', x: -4.8, y: 0, part: 'tail2', z: 8.5, dir: 1 },
      { id: 'tail3', parent: 'tail2', x: -4.4, y: 0, part: 'tail3', z: 8, dir: 1 },
      { id: 'streak', parent: 'hip', x: -2, y: -3, part: 'streak', z: 1, dir: 1 },
    ],
    bounds: { left: -26, right: 16, top: -28, bottom: 2 },
    clips: xlr8Clips,
  });
}
