import { GREYMATTER_CARTOON } from '../../../../config/cartoon/greymatter';
import { humanRig, keyframes, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, type Paint } from '../paint';
import { wave, type ClipDef, type PartSpec, type PoseData, type RigDef, type RigInfo } from '../rig';
import { cel, omnitrixBadge } from './alienBits';

const C = GREYMATTER_CARTOON.colors;

export const GREYMATTER_DIMS: HumanDims = {
  hip: 3.7,
  thigh: 1.8,
  shin: 1.6,
  ankle: 0.3,
  torso: 5.0,
  shoulderF: { x: 0.6, y: -4.4 },
  shoulderB: { x: -0.6, y: -4.3 },
  upperArm: 2.0,
  forearm: 1.9,
  hipF: 0.6,
  hipB: -0.6,
  neck: { x: 0.6, y: -5.0 },
  eyes: { x: 2.2, y: -5.8 },
  mouth: { x: 3.6, y: -2.6 },
};

const skin = (far = false, r = 2) => cel(C.skin, { light: C.skinLight, shade: C.skinDark, far, r });
const suit = (far = false, r = 1.5) => ({ ...cel(far ? C.suit : C.suitLight, { light: 0x6a7090, shade: 0x0a0c12, r }), fill: { linear: [-r, -r, r, r * 2] as const, stops: [[0, far ? C.suitLight : 0x4a5064], [1, C.suit]] as const } });

function torso(p: Paint): void {
  const body = p.smooth([-2.2, 0.4, 2.2, 0.4, 2.6, -2.6, 2.2, -5.2, -1.8, -5.2, -2.6, -2.6], true, 0.4);
  p.shape(body, suit(false, 2));
  omnitrixBadge(p, 0.6, -2.8, 0.85, C.omnitrix);
}

function pelvis(p: Paint): void {
  p.shape(p.smooth([-2.0, -0.6, 2.0, -0.6, 1.8, 1.0, -1.8, 1.0], true, 0.4), suit(false, 1.2));
}

function head(p: Paint): void {
  // A head bigger than the rest of him: the face up front, the brain-case swept back and ridged.
  p.shape(p.capsule(0, 0.6, 0.8, 0.3, -1.6, 0.8), skin(false, 1));
  const shape = p.smooth([-6.2, -6.6, -4.4, -11.0, 0.6, -12.2, 4.6, -10.4, 6.4, -7.0, 6.6, -3.4, 5.4, -1.0, 2.4, 0.0, -1.0, -0.6, -4.6, -2.6]);
  p.shape(shape, skin(false, 6));
  p.within(shape, () => {
    p.fill(p.ellipse(-1.6, -9.0, 3.4, 1.8, -0.3), C.skinLight, 0.55);
    // Ridges across the brain-case.
    for (const pts of [[-6.0, -5.6, -4.6, -8.6, -2.2, -10.8], [-5.2, -3.0, -3.0, -6.6, -0.4, -9.6], [-3.4, -1.6, -1.2, -4.4, 1.6, -7.2]]) p.line(pts, LINE * 0.7, C.ridge, true, 0.9);
    p.fill(p.ellipse(4.6, -2.6, 2.2, 1.6), C.skinDark, 0.25);
  });
}

/** Two huge glossy green eyes in three-quarter view (the far one peeks past the brow). */
function eyes(p: Paint, v: string): void {
  const glow = v === 'glow';
  const list = [[0, 0, 2.7, 2.9], [4.2, -0.5, 1.5, 2.4]] as const;
  for (const [x, y, rx, ry] of list) {
    if (v === 'blink' || v === 'hurt' || v === 'happy') {
      // Big eyes close behind big lids.
      const curve = v === 'happy' ? -1 : 1;
      p.shape(p.ellipse(x, y, rx, ry * 0.9, -0.15), { ...skin(false, rx), inkColor: C.rim, ink: LINE * 0.6 });
      p.line([x - rx * 0.9, y + 0.2, x, y + curve * ry * 0.35, x + rx * 0.9, y + 0.1], LINE * 0.9, INK, true);
      if (v === 'hurt') p.line([x - rx * 0.5, y - ry * 0.5, x + rx * 0.5, y + ry * 0.5], LINE * 0.6, INK);
      continue;
    }
    const squash = v === 'angry' ? 0.6 : 1;
    const grow = v === 'wide' ? 1.15 : 1;
    const e = p.ellipse(x, y, rx * grow, ry * grow * squash, -0.15);
    if (glow) p.glow(x, y, rx * 3, C.scan, 0.7);
    p.shape(e, { fill: { radial: [x - rx * 0.4, y - ry * 0.5, 0, x, y, ry * 1.1], stops: [[0, glow ? 0xffffff : lightOf(C.eye, 0.4)], [0.6, glow ? C.eyeGlow : C.eye], [1, C.eyeDark]] }, inkColor: C.rim, ink: LINE * 0.7 });
    if (!glow) {
      p.fill(p.ellipse(x + rx * 0.35, y + 0.1, rx * 0.38, ry * 0.45 * squash), C.pupil);
      p.fill(p.ellipse(x - rx * 0.3, y - ry * 0.45 * squash, rx * 0.3, ry * 0.22), 0xffffff, 0.95);
    }
  }
  if (v === 'angry') p.line([-2.4, -2.6, 0.6, -1.6, 4.8, -2.4], LINE * 0.9, C.skinDark, true);
}

function mouth(p: Paint, v: string): void {
  if (v === 'open' || v === 'shout' || v === 'grin' || v === 'o') {
    const m = v === 'o' ? p.ellipse(0, 0.2, 0.6, 0.6) : p.smooth([-1.4, -0.4, 1.6, -0.6, 1.2, 0.9, -1.0, 0.8], true, 0.4);
    p.shape(m, { fill: C.mouth, inkColor: C.rim, ink: LINE * 0.55 });
    if (v !== 'o') p.within(m, () => p.fill(p.rrect(-2, -0.9, 4, 0.6, 0.2), C.teeth));
    return;
  }
  if (v === 'smirk' || v === 'smile' || v === 'grit') {
    p.line([-1.2, 0, 0.2, 0.3, 1.4, -0.4], LINE * 0.6, C.skinDark, true);
    return;
  }
  p.line([-1.2, 0.1, 1.3, 0], LINE * 0.6, C.skinDark, true);
}

function limb(p: Paint, len: number, r: number, far: boolean, kind: 'skin' | 'suit'): void {
  p.shape(p.capsule(0, 0, r, 0, len, r * 0.85), kind === 'skin' ? skin(far, r) : suit(far, r));
}

function hand(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 3,
    h: 3,
    px: 1.5,
    py: 0.6,
    variants: ['fist', 'open', 'point'],
    draw: (p, v) => {
      p.shape(p.ellipse(0, 0.5, 0.6, 0.6), skin(far, 0.6));
      if (v === 'point') p.shape(p.capsule(0.1, 0.6, 0.25, 0.3, 1.8, 0.22), skin(far, 0.3));
    },
  };
}

function foot(id: string, far: boolean): PartSpec {
  return { id, w: 3, h: 2, px: 0.8, py: 0.6, draw: (p) => p.shape(p.smooth([-0.6, -0.3, 0.8, -0.3, 1.6, 0.3, -0.7, 0.4], true, 0.4), skin(far, 0.6)) };
}

function scanLines(p: Paint): void {
  for (let i = 0; i < 3; i++) {
    p.line([0, -0.6 + i * 0.6, 6 + i * 2, -2.2 + i * 2.2], 0.5, C.scan, false, 0.6 - i * 0.12);
  }
  p.glow(5, 0, 4, C.scan, 0.25);
}

function parts(): PartSpec[] {
  const D = GREYMATTER_DIMS;
  return [
    { id: 'torso', w: 7, h: 7, px: 3.2, py: 6, draw: (p) => torso(p) },
    { id: 'pelvis', w: 5, h: 3, px: 2.5, py: 1, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.thigh, 0.55, false, 'skin') },
    { id: 'thighB', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.thigh, 0.55, true, 'skin') },
    { id: 'shinF', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.shin, 0.5, false, 'skin') },
    { id: 'shinB', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.shin, 0.5, true, 'skin') },
    foot('footF', false),
    foot('footB', true),
    { id: 'armUF', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.upperArm, 0.5, false, 'skin') },
    { id: 'armUB', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.upperArm, 0.5, true, 'skin') },
    { id: 'armLF', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.forearm, 0.45, false, 'skin') },
    { id: 'armLB', w: 2, h: 3, px: 1, py: 0.6, draw: (p) => limb(p, D.forearm, 0.45, true, 'skin') },
    hand('handF', false),
    hand('handB', true),
    { id: 'head', w: 15, h: 15, px: 7, py: 13, draw: (p) => head(p) },
    { id: 'eyes', w: 24, h: 20, px: 10, py: 10, variants: ['open', 'blink', 'angry', 'wide', 'hurt', 'happy', 'glow'], draw: (p, v) => eyes(p, v) },
    { id: 'mouth', w: 5, h: 3, px: 2.5, py: 1.2, variants: ['smile', 'grin', 'open', 'o', 'grit', 'shout', 'smirk', 'flat', 'frown'], draw: (p, v) => mouth(p, v) },
    { id: 'scan', w: 16, h: 14, px: 2, py: 7, draw: (p) => scanLines(p) },
  ];
}

function greyClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const out: Record<string, ClipDef> = {};
  for (const [name, clip] of Object.entries(base)) out[name] = { ...clip, pose: (t, p) => { clip.pose(t, p); p.hidden('scan'); } };
  const bite = (lunge: boolean): ClipDef => {
    const keys = k([
      [0, { head: -6, torso: 2, mouth: { v: 'open' } }],
      [0.35, { hip: { x: lunge ? 1.2 : 0.4 }, torso: lunge ? 24 : 12, head: lunge ? 14 : 8, armUF: 40, armLF: 30, armUB: -30, thighF: 30, shinF: -20, thighB: -30, eyes: { v: 'angry' }, mouth: { v: lunge ? 'shout' : 'open' } }],
      [1, { hip: { x: lunge ? 1 : 0.3 }, torso: lunge ? 20 : 10, head: lunge ? 10 : 6, armUF: 30, armLF: 30, armUB: -20, thighF: 26, shinF: -18, thighB: -26, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
    ]);
    return { ms: lunge ? 220 : 160, loop: false, pose: (t, p) => { p.keys(keys, t); p.hidden('scan'); } };
  };
  return {
    ...out,
    idle: {
      ms: 1300,
      loop: true,
      pose: (t, p) => {
        base.idle.pose(t, p);
        // Head tilting as he sizes things up.
        p.set('head', -3 + wave(t, 0.1) * 6).set('armUF', 30).set('armLF', -100).set('armUB', 20).set('armLB', -90);
        p.show('mouth', 'smirk').hidden('scan');
      },
    },
    biteA: bite(false),
    biteB: bite(true),
    scan: {
      ms: 600,
      loop: true,
      pose: (t, p) => {
        base.idle.pose(t, p);
        p.set('head', -6).set('armUF', 150).set('armLF', -150).show('handF', 'point').set('armUB', 10).set('armLB', 20);
        p.show('eyes', 'glow').show('mouth', 'flat');
        p.size('scan', 0.9 + wave(t * 2) * 0.1, 1);
      },
    },
    cheer: {
      ms: 500,
      loop: true,
      pose: (t, p) => {
        base.cheer.pose(t, p);
        p.move('hip', 0, -Math.abs(wave(t)) * 0.8).show('mouth', 'grin').show('eyes', 'happy').hidden('scan');
      },
    },
  };
}

/** Grey Matter's HD rig: a tiny humanoid with a huge head, big glossy eyes, a nip and his ANALYZE scan. */
export function greymatterRig(): RigDef {
  return humanRig({
    id: 'greymatter',
    dims: GREYMATTER_DIMS,
    parts: parts(),
    style: GREYMATTER_CARTOON.style!,
    extraBones: [{ id: 'scan', parent: 'eyes', x: 1.6, y: 0, part: 'scan', z: 95, dir: 1 }],
    bounds: { left: -10, right: 12, top: -20, bottom: 1 },
    clips: greyClips,
  });
}

