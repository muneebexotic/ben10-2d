import { MAX_CARTOON } from '../../../../config/cartoon/max';
import { EYES, handPart, humanRig, keyframes, limb, MOUTHS, shoePart, type HumanDims } from '../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { wave, type ClipDef, type PartSpec, type RigDef, type RigInfo } from '../rig';
import { cutoutImage, cutoutPart } from '../cutout/cutout';
import { cutHumanRig } from '../cutout/cutRig';
import { MAX_CUT } from '../cutout/max';
import { cartoonEyes, cartoonMouth } from './face';

const C = MAX_CARTOON.colors;

export const MAX_DIMS: HumanDims = {
  hip: 11.0,
  thigh: 5.4,
  shin: 5.1,
  ankle: 0.5,
  torso: 10.6,
  shoulderF: { x: -0.6, y: -9.4 },
  shoulderB: { x: -2.4, y: -9.2 },
  upperArm: 4.6,
  forearm: 4.2,
  hipF: 1.4,
  hipB: -1.4,
  neck: { x: 0.6, y: -10.4 },
  eyes: { x: 3.6, y: -6.2 },
  mouth: { x: 4.4, y: -2.4 },
};

/** Hibiscus flowers on the shirt, inside whatever shape is clipped. */
function flowers(p: Paint, spots: readonly number[], r: number): void {
  for (let i = 0; i < spots.length; i += 2) {
    const x = spots[i];
    const y = spots[i + 1];
    p.fill(p.ellipse(x + r * 0.9, y + r * 0.6, r * 0.9, r * 0.45, 0.6), C.leaf, 0.85);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + i;
      p.fill(p.circle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5), C.flower);
    }
    p.fill(p.circle(x, y, r * 0.3), 0xffd84a);
  }
}

function torso(p: Paint): void {
  // A big barrel chest and a belly over the belt.
  const body = p.smooth([-4.2, 1.0, 0.4, 1.6, 4.4, 0.8, 5.4, -2.4, 5.2, -6.0, 4.0, -9.4, 2.0, -10.8, 0, -11.0, -2.2, -10.6, -4.0, -9.6, -4.8, -6.0, -4.6, -2.0]);
  p.shape(body, { fill: { linear: [0, -11, 0, 1.6], stops: [[0, C.shirtLight], [0.35, C.shirt], [1, C.shirtShade]] }, shade: C.shirtShade, shadeDepth: 2.4, light: C.shirtLight, lightDepth: 0.9, lightAlpha: 0.5 });
  p.within(body, () => {
    flowers(p, [2.6, -7.6, -1.6, -8.6, 0.8, -4.2, 3.8, -2.0, -2.8, -3.4, -0.6, -0.4, 4.4, -5.2], 1.05);
    // The button line and the collar.
    p.line([2.2, -10.4, 2.6, -6.0, 2.8, 1.2], LINE * 0.45, shadeOf(C.shirtShade, 0.3), true, 0.6);
    p.fill(p.poly([0.2, -11.2, 2.4, -9.0, 3.8, -11.2]), C.skin);
    p.fill(p.rrect(-5, 0.3, 10, 1.4, 0.4), C.belt);
  });
  p.stroke(p.poly([0.2, -11.2, 2.4, -9.0, 3.8, -11.2], false), INK, LINE * 0.55);
  p.line([-0.6, -10.8, 0.4, -9.2, 2.4, -9.0], LINE * 0.5, INK, true, 0.7);
  p.shape(p.rrect(1.4, 0.2, 2.0, 1.5, 0.3), { fill: C.buckle, ink: LINE * 0.45 });
}

function pelvis(p: Paint): void {
  const shape = p.smooth([-4.2, -1.0, 4.2, -1.0, 4.3, 1.4, 2.0, 2.8, -2.0, 2.8, -4.4, 1.4]);
  p.shape(shape, { fill: C.pants, shade: C.pantsShade, shadeDepth: 1.4, light: lightOf(C.pants), lightDepth: 0.5 });
}

function thigh(p: Paint, far: boolean): void {
  limb(p, MAX_DIMS.thigh, 2.3, 2.0, { fill: C.pants, shade: C.pantsShade }, far);
  p.line([0.6, 0.8, 0.9, 4.6], LINE * 0.4, INK, true, 0.35);
}

function shin(p: Paint, far: boolean): void {
  const fill = far ? shadeOf(C.pants, 0.18) : C.pants;
  const leg = p.smooth([-2.1, -1.4, 2.1, -1.4, 1.9, 2.6, 2.1, 5.0, 0.1, 5.4, -2.1, 5.0, -1.9, 2.6]);
  p.shape(leg, { fill, shade: C.pantsShade, shadeDepth: 1.4, light: lightOf(fill), lightDepth: 0.4, lightAlpha: far ? 0.2 : 0.4 });
}

function upperArm(p: Paint, far: boolean): void {
  limb(p, MAX_DIMS.upperArm, 1.85, 1.6, { fill: C.skin, shade: C.skinShade }, far);
  const fill = far ? shadeOf(C.shirt, 0.18) : C.shirt;
  const sleeve = p.smooth([-2.3, -0.8, -0.2, -2.0, 2.3, -1.0, 2.5, 2.2, 0.2, 2.9, -2.4, 2.2]);
  p.shape(sleeve, { fill, shade: C.shirtShade, shadeDepth: 1.2, light: C.shirtLight, lightDepth: 0.5 });
  p.within(sleeve, () => flowers(p, [-0.8, 0.4, 1.4, 1.8], 0.9));
}

function forearm(p: Paint, far: boolean): void {
  limb(p, MAX_DIMS.forearm, 1.55, 1.35, { fill: C.skin, shade: C.skinShade }, far);
}

/** His old Plumber blaster: a chunky silver pistol with a green energy cell (held in the hand variant 'blaster'). */
function blaster(p: Paint): void {
  const body = p.smooth([-1.2, -0.6, 4.6, -1.2, 5.6, -0.4, 5.4, 0.8, 1.4, 1.2, 0.8, 3.0, -0.8, 3.0, -0.8, 0.8]);
  p.shape(body, { fill: { linear: [0, -1.2, 0, 3], stops: [[0, lightOf(C.blaster, 0.3)], [1, C.blasterDark]] }, shade: C.blasterDark, shadeDepth: 0.6 });
  p.fill(p.rrect(1.6, -0.8, 2.4, 0.9, 0.3), C.plumber);
  p.glow(5.6, 0.1, 1.4, C.plumber, 0.6);
}

function hand(far: boolean): PartSpec {
  const base = handPart(far ? 'handB' : 'handF', C.skin, 1.55, far);
  if (far) return base;
  return {
    ...base,
    w: 14,
    variants: ['fist', 'open', 'point', 'blaster', 'badge'],
    px: 4,
    draw: (p, v) => {
      if (v === 'blaster') {
        base.draw(p, 'fist');
        p.ctx.save();
        p.ctx.translate(0.2, 1.4);
        p.ctx.rotate(Math.PI / 2);
        blaster(p);
        p.ctx.restore();
        return;
      }
      if (v === 'badge') {
        base.draw(p, 'open');
        const badge = p.circle(0.4, 2.4, 1.8);
        p.shape(badge, { fill: { radial: [-0.2, 1.8, 0.2, 0.4, 2.4, 1.8], stops: [[0, 0xfff2a0], [1, C.badge]] }, shade: shadeOf(C.badge, 0.4), shadeDepth: 0.5 });
        p.fill(p.circle(0.4, 2.4, 0.9), 0x1a1a22);
        p.fill(p.circle(0.4, 2.4, 0.35), C.plumber);
        p.glow(0.4, 2.4, 2.6, C.plumber, 0.45);
        return;
      }
      base.draw(p, v);
    },
  };
}

function head(p: Paint): void {
  p.shape(p.capsule(0, 0.8, 1.6, 0.5, -1.6, 1.6), { fill: C.skinShade });
  // A big square jaw, a round nose, ears; the crew cut sits flat on top.
  const face = p.smooth([-3.6, -1.6, -4.4, -6.0, -3.2, -10.2, 0.8, -11.4, 4.6, -10.4, 6.0, -7.8, 6.4, -6.4, 7.6, -5.4, 7.4, -3.8, 6.4, -3.2, 6.2, -1.8, 4.8, 0.2, 1.6, 0.6, -1.2, -0.2]);
  p.shape(face, { fill: { radial: [3.2, -7, 0.5, 2, -5, 8.4], stops: [[0, lightOf(C.skin, 0.1)], [1, C.skin]] }, shade: C.skinShade, shadeDepth: 1.8, light: 0xfff0e0, lightDepth: 0.6, lightAlpha: 0.55 });
  p.within(face, () => {
    p.glow(6.6, -4.6, 1.8, 0xff7a6a, 0.3);
    // Laugh lines and a jowl.
    p.line([5.2, -3.4, 5.6, -1.4], LINE * 0.4, INK, true, 0.35);
  });
  const nose = p.ellipse(7.0, -4.6, 1.4, 1.2);
  p.shape(nose, { fill: C.skin, shade: C.skinShade, shadeDepth: 0.5, ink: LINE * 0.7 });
  const ear = p.ellipse(-1.8, -5.6, 1.5, 1.9, 0.2);
  p.shape(ear, { fill: C.skin, shade: C.skinShade, shadeDepth: 0.6 });
  p.line([-1.7, -6.4, -2.2, -5.5, -1.6, -4.7], LINE * 0.45, INK, true, 0.55);
  const hair = p.smooth([-4.6, -5.2, -4.8, -9.0, -3.4, -11.4, 0.6, -12.6, 4.4, -12.0, 5.6, -10.4, 4.0, -10.6, 1.0, -10.8, -1.0, -10.2, -2.4, -8.0, -2.6, -5.6]);
  p.shape(hair, { fill: { linear: [0, -12.6, 0, -6], stops: [[0, 0xffffff], [1, C.hair]] }, shade: C.hairShade, shadeDepth: 0.8, light: 0xffffff, lightDepth: 0.4 });
  // Bristles.
  for (let x = -3.4; x < 4.4; x += 1.1) p.line([x, -11.7 + Math.abs(x) * 0.08, x + 0.3, -12.3 + Math.abs(x) * 0.1], LINE * 0.35, C.hairShade, false, 0.6);
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 12, h: 14, px: 6, py: 12, draw: (p) => torso(p) },
    { id: 'pelvis', w: 10, h: 6, px: 5, py: 2.2, draw: (p) => pelvis(p) },
    { id: 'thighF', w: 6, h: 10, px: 3, py: 2.6, draw: (p) => thigh(p, false) },
    { id: 'thighB', w: 6, h: 10, px: 3, py: 2.6, draw: (p) => thigh(p, true) },
    { id: 'shinF', w: 6, h: 8, px: 3, py: 1.8, draw: (p) => shin(p, false) },
    { id: 'shinB', w: 6, h: 8, px: 3, py: 1.8, draw: (p) => shin(p, true) },
    shoePart('footF', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 5.4, height: 2.5, ankle: 0.5 }),
    shoePart('footB', { upper: C.shoe, toe: C.shoeToe, sole: C.sole, length: 5.4, height: 2.5, ankle: 0.5, far: true }),
    { id: 'armUF', w: 7, h: 9, px: 3.5, py: 2.4, draw: (p) => upperArm(p, false) },
    { id: 'armUB', w: 7, h: 9, px: 3.5, py: 2.4, draw: (p) => upperArm(p, true) },
    { id: 'armLF', w: 5, h: 7, px: 2.5, py: 1.8, draw: (p) => forearm(p, false) },
    { id: 'armLB', w: 5, h: 7, px: 2.5, py: 1.8, draw: (p) => forearm(p, true) },
    hand(false),
    hand(true),
    { id: 'head', w: 15, h: 17, px: 6, py: 15, draw: (p) => head(p) },
    { id: 'eyes', w: 8, h: 7, px: 2.4, py: 3.8, variants: EYES, draw: (p, v) => cartoonEyes(p, v, { iris: C.eye, brow: C.brow, near: { x: -0.2, y: 0, rx: 1.0, ry: 1.25 }, far: { x: 2.2, y: 0.05, rx: 0.72, ry: 1.15 }, skin: C.skin, irisScale: 0.72, browWeight: 1.5 }) },
    { id: 'mouth', w: 6, h: 4, px: 3, py: 2, variants: MOUTHS, draw: (p, v) => cartoonMouth(p, v, { mouth: C.mouth, tongue: C.tongue, lip: C.skinShade, width: 2.1 }) },
  ];
}

/** Grandpa Max's HD rig: heavy, warm, a little stiff; his blaster, his badge, a salute, a console. */
export function maxRig(): RigDef {
  const style = MAX_CARTOON.style!;
  const img = cutoutImage('max');
  if (!img) return humanRig({ id: 'max', dims: MAX_DIMS, parts: parts(), style, bounds: BOUNDS, clips: maxClips });
  // Cut from his model sheet: the holster rides on his belt; the blaster and badge are painted into his near hand.
  return cutHumanRig({
    id: 'max',
    meta: MAX_CUT,
    img,
    style,
    bounds: BOUNDS,
    clips: maxClips,
    handVariants: HAND_LOOKS,
    hands: (p, v, far) => {
      if (far) return;
      if (v === 'blaster') heldBlaster(p);
      else if (v === 'badge') heldBadge(p);
    },
    extraParts: [cutoutPart(MAX_CUT, img, 'holster')],
    extraBones: [{ id: 'holster', parent: 'hip', x: 0, y: 0, part: 'holster', z: 52, dir: 1 }],
  });
}

const BOUNDS = { left: -14, right: 16, top: -38, bottom: 2 };
const HAND_LOOKS = ['fist', 'open', 'point', 'blaster', 'badge'] as const;

/** His blaster in the fist, pointing along the forearm. */
function heldBlaster(p: Paint): void {
  p.ctx.save();
  p.ctx.translate(0.2, 1.4);
  p.ctx.rotate(Math.PI / 2);
  blaster(p);
  p.ctx.restore();
}

/** His Plumber badge held up in the fist. */
function heldBadge(p: Paint): void {
  const badge = p.circle(0.4, 2.4, 1.8);
  p.shape(badge, { fill: { radial: [-0.2, 1.8, 0.2, 0.4, 2.4, 1.8], stops: [[0, 0xfff2a0], [1, C.badge]] }, shade: shadeOf(C.badge, 0.4), shadeDepth: 0.5 });
  p.fill(p.circle(0.4, 2.4, 0.9), 0x1a1a22);
  p.fill(p.circle(0.4, 2.4, 0.35), C.plumber);
  p.glow(0.4, 2.4, 2.6, C.plumber, 0.45);
}

/** His own clips: the blaster, the badge, a salute, the pump console. */
function maxClips(info: RigInfo, base: Record<string, ClipDef>): Record<string, ClipDef> {
  const blastKeys = keyframes(info, [
    [0, { torso: 4, head: -2, armUF: 86, armLF: 0, handF: { v: 'blaster' }, armUB: -20, armLB: 45, thighF: 14, shinF: -10, thighB: -14, shinB: -6, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
    [0.2, { hip: { x: -0.6 }, torso: -4, head: -6, armUF: 100, armLF: -6, handF: { v: 'blaster' }, armUB: -26, armLB: 50, thighF: 14, shinF: -10, thighB: -14, shinB: -6, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
    [1, { torso: 4, head: -2, armUF: 86, armLF: 0, handF: { v: 'blaster' }, armUB: -20, armLB: 45, thighF: 14, shinF: -10, thighB: -14, shinB: -6, eyes: { v: 'angry' }, mouth: { v: 'grit' } }],
  ]);
  const held = (data: Parameters<typeof keyframes>[1][number][1], life = 1) => {
    const k = keyframes(info, [[0, data]]);
    return {
      ms: 2000,
      loop: true,
      pose: (t: number, p: Parameters<typeof base.idle.pose>[1]) => {
        p.keys(k, 0);
        p.move('hip', 0, wave(t) * 0.25 * life);
        p.add('head', wave(t, 0.2) * 1.2 * life);
      },
    };
  };
  return {
    spray: { ms: 220, loop: true, pose: (t, p) => p.keys(blastKeys, t) },
    blast: { ms: 260, loop: false, pose: (t, p) => p.keys(blastKeys, t) },
    badge: held({ torso: 2, head: -4, armUF: 96, armLF: -30, handF: { v: 'badge' }, armUB: 8, armLB: 14, mouth: { v: 'smirk' } }),
    salute: held({ torso: -2, head: -4, armUF: 140, armLF: -150, handF: { v: 'open' }, armUB: 2, armLB: 6, mouth: { v: 'flat' } }, 0.4),
    console: {
      ms: 900,
      loop: true,
      pose: (t, p) => {
        p.set('torso', 14).set('head', 10);
        p.set('armUF', 60 + wave(t * 2) * 8).set('armLF', -30 + wave(t * 2, 0.3) * 10).show('handF', 'open');
        p.set('armUB', 50 - wave(t * 2) * 8).set('armLB', -20).show('handB', 'open');
        p.set('thighF', 6).set('shinF', -4).set('thighB', -6);
        p.show('eyes', 'angry').show('mouth', 'flat');
      },
    },
    cheer: { ...base.cheer, pose: (t, p) => { base.cheer.pose(t, p); p.set('armUB', 10).set('armLB', 20); } },
  };
}
