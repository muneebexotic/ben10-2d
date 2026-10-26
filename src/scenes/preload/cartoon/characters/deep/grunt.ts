import { GRUNT_CARTOON } from '../../../../../config/cartoon/grunt';
import { humanRig, keyframes, limb, type HumanDims } from '../../humanoid';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../../paint';
import { wave, type PartSpec, type Pose, type RigDef } from '../../rig';

const C = GRUNT_CARTOON.colors;

const DIMS: HumanDims = {
  hip: 9.4,
  thigh: 4.4,
  shin: 3.8,
  ankle: 1.2,
  torso: 8.6,
  shoulderF: { x: 1.6, y: -7.4 },
  shoulderB: { x: -2.2, y: -7.2 },
  upperArm: 4.2,
  forearm: 3.8,
  hipF: 1.2,
  hipB: -1.4,
  neck: { x: 0.6, y: -8.6 },
  eyes: { x: 2.4, y: -5.8 },
  mouth: { x: 4.6, y: -3.2 },
};

const canvas = (far: boolean) => ({ fill: far ? shadeOf(C.suit, 0.2) : C.suit, shade: C.suitDark, light: C.suitLight });

/** The diving suit's body: patched canvas, a brass chest plate with a dial, a belt of lead weights. */
function torso(p: Paint): void {
  const body = p.smooth([-4.8, 0.6, 4.4, 0.6, 5.6, -3.4, 5.0, -7.8, 2.4, -9.4, -2.6, -9.4, -5.4, -7.6, -6.0, -3.0]);
  p.shape(body, { fill: { linear: [-5, -9, 5, 0], stops: [[0, C.suitLight], [0.5, C.suit], [1, C.suitDark]] }, shade: C.suitDark, shadeDepth: 1.4, light: C.suitLight, lightDepth: 0.5, ink: LINE });
  p.within(body, () => {
    // A patch, stitched on.
    p.fill(p.rrect(-4.6, -6.4, 3.4, 3.0, 0.6), C.patch);
    for (let i = 0; i < 4; i++) p.line([-4.4 + i * 0.9, -6.6, -4.2 + i * 0.9, -6.2], LINE * 0.3, INK, false, 0.7);
    // The weight belt.
    p.fill(p.rrect(-6.2, -1.6, 12.4, 2.2, 0.6), 0x2a2a34);
    for (const x of [-3.6, 0, 3.4]) p.shape(p.rrect(x - 1.1, -2.0, 2.2, 3.0, 0.5), { fill: 0x5a5a6a, ink: LINE * 0.4 });
  });
  // The brass chest plate with its pressure dial.
  const plate = p.smooth([-1.4, -8.4, 4.4, -8.6, 5.2, -5.0, 3.6, -3.6, 0.2, -3.8, -1.6, -5.4], true, 0.4);
  p.shape(plate, { fill: { linear: [0, -8.6, 0, -3.6], stops: [[0, lightOf(C.brass, 0.3)], [1, C.brassDark]] }, ink: LINE * 0.7, light: 0xffffff, lightDepth: 0.3, lightAlpha: 0.6 });
  p.shape(p.circle(2.0, -6.2, 1.3), { fill: 0xf0ecd8, ink: LINE * 0.5 });
  p.line([2.0, -6.2, 2.7, -6.8], LINE * 0.45, 0xd02a2a);
}

function pelvis(p: Paint): void {
  p.shape(p.smooth([-5.0, -1.2, 4.6, -1.2, 4.8, 2.4, 0, 3.2, -4.8, 2.4], true, 0.4), { fill: C.suitDark, shade: 0x0e1e24, shadeDepth: 0.8, ink: LINE * 0.8 });
}

/** A heavy lead diving boot. */
function boot(p: Paint, far: boolean): void {
  const fill = far ? shadeOf(C.boot, 0.25) : C.boot;
  const b = p.smooth([-2.4, -1.0, 2.0, -1.0, 4.6, 0.4, 5.4, 2.0, 4.8, 2.8, -2.8, 2.8, -3.0, 0.6], true, 0.3);
  p.shape(b, { fill: { linear: [0, -1, 0, 3], stops: [[0, lightOf(fill, 0.2)], [1, fill]] }, ink: LINE * 0.8, light: 0x9aa0b4, lightDepth: 0.3, lightAlpha: far ? 0.2 : 0.5 });
  p.fill(p.rrect(-3.0, 1.8, 8.4, 1.1, 0.4), far ? 0x5a4020 : C.brassDark);
}

/** A thick canvas glove (fist or open). */
function glove(p: Paint, v: string, far: boolean): void {
  const fill = far ? shadeOf(C.suitLight, 0.25) : C.suitLight;
  const style = { fill, shade: C.suitDark, shadeDepth: 0.6, light: 0xd0f0f0, lightDepth: 0.3, ink: LINE * 0.7 } as const;
  p.shape(p.rrect(-1.6, -0.6, 3.2, 1.6, 0.6), { fill: C.brass, ink: LINE * 0.5 });
  if (v === 'open') p.shape(p.smooth([-1.6, 0.6, 1.8, 0.6, 2.0, 2.8, 0.4, 4.0, -1.4, 3.4], true, 0.4), style);
  else p.shape(p.ellipse(0.2, 2.0, 1.9, 1.7), style);
}

/** The harpoon: a steel shaft with a barbed head (it points along +y, the way its bone does). */
function harpoon(p: Paint): void {
  p.line([0, -7, 0, 9], LINE * 2.2, INK);
  p.line([0, -7, 0, 9], LINE * 1.2, C.harpoon);
  p.line([-0.3, -6, -0.3, 8], LINE * 0.4, 0xffffff, false, 0.5);
  const head = p.poly([0, 13.6, -1.6, 9.2, -0.5, 9.8, 0, 8.6, 0.5, 9.8, 1.6, 9.2]);
  p.shape(head, { fill: { linear: [-1.6, 9, 1.6, 13], stops: [[0, 0xffffff], [1, C.tip]] }, ink: LINE * 0.6 });
  // Its rope coil at the butt.
  p.stroke(p.ellipse(0, -7.4, 1.2, 0.8), 0xc8b07a, LINE * 0.8);
}

/** The fish's head: orange, bug-eyed, all lips, fins for ears (inside the bowl, or out of it). */
function head(p: Paint): void {
  // The brass collar the bowl sits in.
  p.shape(p.rrect(-4.6, -1.4, 9.4, 2.4, 1.0), { fill: { linear: [0, -1.4, 0, 1], stops: [[0, lightOf(C.brass, 0.3)], [1, C.brassDark]] }, ink: LINE * 0.8 });
  for (const x of [-3.2, 0, 3.2]) p.fill(p.circle(x, -0.2, 0.4), C.brassDark);
  // The fish: a fat round head pointing forward.
  const fish = p.smooth([-3.6, -1.4, -4.4, -5.4, -2.4, -9.0, 1.6, -9.6, 4.6, -7.6, 5.8, -4.6, 5.2, -2.0, 1.6, -1.2]);
  p.shape(fish, { fill: { radial: [0.4, -7.4, 0.5, 0.8, -5, 6.6], stops: [[0, C.fishLight], [0.6, C.fish], [1, C.fishDark]] }, ink: LINE * 0.8, shade: C.fishDark, shadeDepth: 1.0, light: 0xffffff, lightDepth: 0.4, lightAlpha: 0.5 });
  p.within(fish, () => {
    // Scales and a gill line.
    for (let i = 0; i < 3; i++) p.line([-2.6 + i * 1.6, -4.0, -2.0 + i * 1.6, -3.0, -2.6 + i * 1.6, -2.0], LINE * 0.35, C.fishDark, true, 0.6);
    p.line([-1.2, -7.6, -0.4, -5.4, -1.0, -3.0], LINE * 0.5, C.fishDark, true, 0.8);
  });
  // A head fin on top, frilly.
  p.shape(p.smooth([-2.4, -8.6, -1.6, -11.6, 0.6, -10.8, 1.6, -12.0, 2.8, -9.4], true, 0.3), { fill: C.fin, ink: LINE * 0.6 });
}

/** The glass bowl over the fish: water inside (a tint, a surface line, bubbles), highlights in front. Broken: a jagged rim. */
function bowl(p: Paint, v: string): void {
  if (v === 'broken') {
    const rim = p.poly([-5.6, -1.0, -5.8, -3.4, -4.6, -2.2, -3.8, -4.6, -2.6, -2.0, -1.0, -3.0, 0.4, -1.4, 2.4, -3.8, 3.4, -1.8, 4.8, -4.2, 5.8, -2.4, 6.0, -1.0]);
    p.shape(rim, { fill: C.glass, ink: LINE * 0.6, alpha: 0.7 });
    return;
  }
  const glass = p.circle(0.6, -6.0, 7.4);
  p.fill(glass, C.water, 0.28);
  p.within(glass, () => {
    p.line([-6.8, -9.6, -2, -9.2, 3, -9.8, 8.0, -9.4], LINE * 0.6, 0xe0ffff, true, 0.7);
    p.fill(p.rrect(-7, -14, 16, 4.4, 0), 0xffffff, 0.1);
    for (const [x, y, r] of [[3.4, -6.4, 0.6], [4.4, -8.0, 0.45], [3.8, -11.4, 0.35]] as const) p.stroke(p.circle(x, y, r), 0xffffff, 0.35, 0.9);
  });
  p.stroke(glass, INK, LINE * 0.9, 0.85);
  p.stroke(glass, C.glass, LINE * 0.5, 0.8);
  p.fill(p.ellipse(-2.6, -10.2, 2.6, 1.2, -0.6), 0xffffff, 0.55);
  p.fill(p.ellipse(4.6, -2.6, 1.2, 0.5, -0.8), 0xffffff, 0.35);
}

/** Big round fish eyes. */
function eyes(p: Paint, v: string): void {
  const shut = v === 'blink' || v === 'shut' || v === 'hurt' || v === 'happy';
  for (const [x, r] of [[0, 1.5], [2.0, 1.15]] as const) {
    if (shut) {
      p.line([x - r, 0, x, 0.4, x + r, 0], LINE * 0.8, INK, true);
      continue;
    }
    const e = p.circle(x, 0, r * (v === 'wide' ? 1.15 : 1));
    p.shape(e, { fill: C.eye, ink: LINE * 0.7 });
    p.fill(p.circle(x + r * 0.25, v === 'angry' ? 0.2 : 0, r * 0.5), INK);
    p.fill(p.circle(x - r * 0.15, -r * 0.35, r * 0.2), 0xffffff);
    if (v === 'angry') p.line([x - r, -r - 0.2, x + r, -r + 0.6], LINE * 0.8, C.fishDark);
  }
}

/** Big fish lips. */
function mouth(p: Paint, v: string): void {
  const open = v === 'open' || v === 'shout' || v === 'o';
  if (open) {
    p.shape(p.ellipse(0, 0, 1.4, v === 'shout' ? 1.6 : 1.2), { fill: 0x5a1020, ink: LINE * 0.6 });
    p.stroke(p.ellipse(0, 0, 1.6, v === 'shout' ? 1.8 : 1.4), 0xff9a7a, LINE * 0.8);
  } else {
    p.shape(p.smooth([-1.4, -0.4, 1.4, -0.8, 1.6, 0.4, -1.2, 0.8], true, 0.5), { fill: 0xff9a7a, ink: LINE * 0.6 });
    p.line([-1.2, 0.1, 1.4, -0.1], LINE * 0.4, 0x8a2a1a);
  }
}

function parts(): PartSpec[] {
  return [
    { id: 'torso', w: 14, h: 13, px: 7, py: 11, draw: torso },
    { id: 'pelvis', w: 12, h: 6, px: 6, py: 2, draw: pelvis },
    { id: 'thighF', w: 7, h: 8, px: 3.5, py: 2.4, draw: (p) => limb(p, DIMS.thigh, 2.2, 1.9, canvas(false)) },
    { id: 'thighB', w: 7, h: 8, px: 3.5, py: 2.4, draw: (p) => limb(p, DIMS.thigh, 2.2, 1.9, canvas(true), true) },
    { id: 'shinF', w: 6, h: 7, px: 3, py: 2, draw: (p) => limb(p, DIMS.shin, 1.9, 1.7, canvas(false)) },
    { id: 'shinB', w: 6, h: 7, px: 3, py: 2, draw: (p) => limb(p, DIMS.shin, 1.9, 1.7, canvas(true), true) },
    { id: 'footF', w: 10, h: 6, px: 3.4, py: 1.4, draw: (p) => boot(p, false) },
    { id: 'footB', w: 10, h: 6, px: 3.4, py: 1.4, draw: (p) => boot(p, true) },
    { id: 'armUF', w: 6, h: 8, px: 3, py: 2.2, draw: (p) => limb(p, DIMS.upperArm, 1.9, 1.6, canvas(false)) },
    { id: 'armUB', w: 6, h: 8, px: 3, py: 2.2, draw: (p) => limb(p, DIMS.upperArm, 1.9, 1.6, canvas(true), true) },
    { id: 'armLF', w: 5, h: 7, px: 2.5, py: 1.8, draw: (p) => limb(p, DIMS.forearm, 1.6, 1.5, canvas(false)) },
    { id: 'armLB', w: 5, h: 7, px: 2.5, py: 1.8, draw: (p) => limb(p, DIMS.forearm, 1.6, 1.5, canvas(true), true) },
    { id: 'handF', w: 6, h: 7, px: 3, py: 1.2, variants: ['fist', 'open'], draw: (p, v) => glove(p, v, false) },
    { id: 'handB', w: 6, h: 7, px: 3, py: 1.2, variants: ['fist', 'open'], draw: (p, v) => glove(p, v, true) },
    { id: 'head', w: 13, h: 15, px: 5, py: 13, draw: head },
    { id: 'eyes', w: 7, h: 6, px: 2.4, py: 3, variants: ['open', 'blink', 'angry', 'wide', 'hurt', 'shut'], draw: eyes },
    { id: 'mouth', w: 5, h: 5, px: 2.5, py: 2.5, variants: ['flat', 'open', 'o', 'shout'], draw: mouth },
    { id: 'bowl', w: 18, h: 18, px: 8.4, py: 15, variants: ['whole', 'broken'], draw: bowl },
    { id: 'harpoon', w: 6, h: 24, px: 3, py: 8.4, draw: harpoon },
  ];
}

/** The fishbowl grunt's HD rig (Chapter 7): Deepmaw's crew, a fish in a diving suit. */
export function gruntRig(): RigDef {
  return humanRig({
    id: 'grunt',
    dims: DIMS,
    parts: parts(),
    style: GRUNT_CARTOON.style!,
    extraBones: [
      { id: 'bowl', parent: 'head', x: 0, y: 0, part: 'bowl', z: 76, dir: 1 },
      { id: 'harpoon', parent: 'handF', x: 0.2, y: 2.0, part: 'harpoon', z: 79, dir: -1 },
    ],
    bounds: { left: -16, right: 18, top: -36, bottom: 3 },
    clips: (info, base) => {
      const bare = (p: Pose) => p.show('bowl', 'broken');
      // Harpoon on the shoulder: the arm bent up, the spear pointing up and back.
      const shoulder = (p: Pose) => p.set('armUF', 28).set('armLF', 110).set('harpoon', 120);
      const windKeys = keyframes(info, [
        [0, { torso: 2, armUF: 28, armLF: 110, harpoon: 120, eyes: { v: 'angry' }, mouth: { v: 'flat' } }],
        [1, { torso: -10, head: -6, armUF: -150, armLF: 40, harpoon: 160, thighF: 18, shinF: -10, thighB: -18, shinB: -4, eyes: { v: 'angry' }, mouth: { v: 'shout' } }],
      ]);
      const throwKeys = keyframes(info, [
        [0, { torso: -10, head: -6, armUF: -150, armLF: 40, harpoon: { a: 160, hide: true }, thighF: 18, shinF: -10, thighB: -18, shinB: -4, handF: { v: 'open' }, mouth: { v: 'shout' } }],
        [0.3, { torso: 14, head: 6, armUF: 70, armLF: 0, harpoon: { hide: true }, thighF: 22, shinF: -12, thighB: -20, shinB: -4, handF: { v: 'open' }, mouth: { v: 'open' } }],
        [1, { torso: 6, armUF: 30, armLF: 10, harpoon: { hide: true }, handF: { v: 'open' }, mouth: { v: 'flat' } }],
      ]);
      const flop = {
        ms: 520,
        loop: true,
        pose: (t: number, p: Pose) => {
          // Flat on its back, everything flapping, eyes popping.
          p.move('hip', 0, 5.6).set('hip', -84 + wave(t) * 10);
          p.set('torso', wave(t, 0.2) * 14).set('head', -wave(t, 0.4) * 18);
          p.set('thighF', 40 + wave(t) * 30).set('shinF', -20).set('thighB', 10 - wave(t) * 30).set('shinB', -16);
          p.set('armUF', 120 + wave(t * 2) * 30).set('armLF', -30).set('armUB', 90 - wave(t * 2) * 30).set('armLB', -20);
          p.hidden('harpoon').show('handF', 'open').show('handB', 'open');
          p.show('eyes', 'wide').show('mouth', wave(t * 2) > 0 ? 'o' : 'open').show('bowl', 'broken');
        },
      };
      const withBowlGone = (clip: (typeof base)['idle']) => ({ ...clip, pose: (t: number, p: Pose) => { clip.pose(t, p); bare(p); } });
      const idle = { ...base.idle, pose: (t: number, p: Pose) => { base.idle.pose(t, p); shoulder(p); } };
      const walk = { ...base.run, ms: GRUNT_CARTOON.style!.runMs, pose: (t: number, p: Pose) => { base.run.pose(t, p); shoulder(p); p.move('hip', 0, Math.abs(wave(t)) * 0.6); } };
      const windup = { ms: 620, loop: false, pose: (t: number, p: Pose) => p.keys(windKeys, t) };
      const thrown = { ms: 320, loop: false, pose: (t: number, p: Pose) => p.keys(throwKeys, t) };
      return {
        idle,
        walk,
        windup,
        throw: thrown,
        flop,
        idleBare: withBowlGone(idle),
        walkBare: withBowlGone(walk),
        windupBare: withBowlGone(windup),
        throwBare: withBowlGone(thrown),
      };
    },
  });
}
