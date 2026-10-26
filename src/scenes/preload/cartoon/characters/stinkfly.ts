import { STINKFLY_CARTOON } from '../../../../config/cartoon/stinkfly';
import { INK, LINE, lightOf, shadeOf, type Paint } from '../paint';
import { RigInfo, wave, type BoneSpec, type ClipDef, type PartSpec, type Pose, type RigDef } from '../rig';
import { cel, omnitrixBadge } from './alienBits';

const C = STINKFLY_CARTOON.colors;

const shell = (far = false, r = 3) => cel(C.body, { light: C.light, shade: C.dark, far, r });

function thorax(p: Paint): void {
  const body = p.smooth([-4.8, -1.0, -3.4, -4.2, 0.6, -5.0, 4.4, -3.4, 5.4, 0.4, 3.4, 4.0, -1.2, 4.4, -4.4, 2.4]);
  p.shape(body, shell(false, 5));
  p.within(body, () => {
    p.fill(p.ellipse(0.6, 3.6, 4.2, 1.8), C.belly, 0.75);
    p.line([-3.0, -3.6, 0.6, -4.4, 3.8, -3.0], LINE * 0.5, C.light, true, 0.7);
    p.line([-2.4, -4.4, -3.2, 3.6], LINE * 0.55, C.stripe, true, 0.6);
  });
  omnitrixBadge(p, 1.2, 0.8, 1.2, C.omnitrix);
}

function abdomen(p: Paint, len: number, r0: number, r1: number, bands: number): void {
  const path = p.smooth([0.6, -r0, -len * 0.5, -r0 * 1.05 - (r0 - r1) * 0.3, -len, -r1, -len - r1 * 0.6, 0, -len, r1, -len * 0.5, r0 * 0.95, 0.6, r0]);
  p.shape(path, shell(false, r0));
  p.within(path, () => {
    p.fill(p.rrect(-len - 2, r0 * 0.25, len + 3, r0 * 1.5, 0), C.belly, 0.65);
    for (let i = 1; i <= bands; i++) {
      const x = -len * (i / (bands + 0.6));
      p.line([x + 0.6, -r0 - 1, x - 0.4, r0 + 1], LINE * 0.9, C.stripe, false, 0.85);
    }
  });
}

function stinger(p: Paint): void {
  p.shape(p.horn(0, -1.4, -3.0, -0.6, -6.2, 1.8, 2.4), { fill: { linear: [0, -1, -6, 2], stops: [[0, C.body], [1, C.dark]] }, ink: LINE * 0.8, light: C.light, lightDepth: 0.4, lightAlpha: 0.5 });
}

function head(p: Paint): void {
  const shape = p.smooth([-2.6, 0.4, -1.8, -2.6, 1.4, -3.4, 4.2, -2.0, 4.8, 0.8, 3.0, 2.8, -0.6, 2.8]);
  p.shape(shape, shell(false, 3.5));
  p.within(shape, () => p.fill(p.ellipse(1.6, 2.0, 3.0, 1.2), C.belly, 0.5));
}

function mandible(p: Paint): void {
  for (const [dx, dy, a] of [[0, 0, 0.2], [-0.8, 0.9, 0.6]] as const) {
    p.shape(p.horn(dx - 0.5, dy - 0.6, dx + 1.8, dy - 0.2 + a, dx + 3.0, dy + 1.6 + a, 1.2), { fill: C.dark, ink: LINE * 0.6, light: C.body, lightDepth: 0.3 });
  }
}

function stalk(len: number, far: boolean): (p: Paint) => void {
  return (p) => p.shape(p.capsule(0, 0, 1.0, 0, -len, 0.75), shell(far, 1));
}

/** An eye on its stalk: big and yellow with a slit-ish pupil. */
function eye(r: number, far: boolean): (p: Paint, v: string) => void {
  return (p, v) => {
    const fill = far ? shadeOf(C.eye, 0.15) : C.eye;
    const ball = p.circle(0, -r * 0.8, r);
    if (v === 'blink' || v === 'hurt') {
      p.shape(ball, shell(far, r));
      p.line([-r * 0.8, -r * 0.8, r * 0.8, -r * 0.7], LINE * 0.8, INK);
      if (v === 'hurt') p.line([-r * 0.5, -r * 1.4, r * 0.5, -r * 0.2], LINE * 0.5, INK);
      return;
    }
    p.shape(ball, { fill: { radial: [-r * 0.3, -r * 1.2, 0, 0, -r * 0.8, r * 1.1], stops: [[0, lightOf(fill, 0.5)], [0.6, fill], [1, shadeOf(fill, 0.3)]] }, ink: LINE * 0.75 });
    const angry = v === 'angry';
    const pr = r * (v === 'wide' ? 0.32 : 0.45);
    p.fill(p.ellipse(r * 0.28, -r * 0.8, pr * 0.75, pr * 1.2), C.pupil);
    p.fill(p.circle(-r * 0.3, -r * 1.2, r * 0.25), 0xffffff, 0.9);
    if (angry) p.line([-r * 1.1, -r * 1.7, r * 1.0, -r * 1.2], LINE * 0.9, C.stripe, true);
  };
}

/** A long see-through wing from the shoulder backward, veined; `blur` is a beat smear. */
function wing(len: number, w: number, front: boolean): (p: Paint, v: string) => void {
  return (p, v) => {
    const blur = v === 'blur';
    const path = p.smooth([0, 0, -len * 0.3, -w, -len * 0.75, -w * 0.9, -len, 0, -len * 0.7, w * 0.6, -len * 0.25, w * 0.55], true, 0.45);
    if (blur) {
      p.fill(p.smooth([0, 0, -len * 0.4, -w * 3.2, -len * 1.05, -w * 1.2, -len * 0.9, w * 2.4, -len * 0.3, w * 1.8], true, 0.5), C.wing, front ? 0.28 : 0.2);
      p.fill(path, C.wing, front ? 0.35 : 0.25);
      return;
    }
    p.fill(path, { linear: [0, 0, -len, 0], stops: [[0, lightOf(C.wing, 0.3), front ? 0.7 : 0.5], [1, C.wing, front ? 0.45 : 0.3]] });
    p.stroke(path, C.vein, LINE * 0.55, front ? 0.9 : 0.6);
    p.line([0, 0, -len * 0.5, -w * 0.15, -len * 0.95, 0], LINE * 0.4, C.vein, true, 0.8);
    p.line([-len * 0.35, -w * 0.1, -len * 0.55, -w * 0.75], LINE * 0.3, C.vein, false, 0.6);
    p.line([-len * 0.55, -w * 0.12, -len * 0.75, w * 0.4], LINE * 0.3, C.vein, false, 0.6);
    p.fill(p.ellipse(-len * 0.35, -w * 0.4, len * 0.18, w * 0.18, -0.2), 0xffffff, front ? 0.55 : 0.3);
  };
}

function leg(len: number, r: number, far: boolean, foot: boolean): (p: Paint) => void {
  return (p) => {
    const color = far ? C.stripe : C.dark;
    p.shape(p.capsule(0, 0, r, 0, len, r * 0.75), { fill: color, ink: LINE * 0.6, light: C.body, lightDepth: 0.25, lightAlpha: far ? 0.2 : 0.5 });
    if (foot) p.shape(p.horn(-0.3, len - 0.2, 0.8, len + 0.6, 1.8, len + 0.5, 0.7), { fill: color, ink: LINE * 0.5 });
  };
}

const LEG = { upper: 4.2, lower: 6.6 };
const LEGS = [
  { id: '1', x: 2.8 },
  { id: '2', x: 0.4 },
  { id: '3', x: -2.2 },
] as const;

function parts(): PartSpec[] {
  const list: PartSpec[] = [
    { id: 'thorax', w: 12, h: 11, px: 5.5, py: 5.5, draw: (p) => thorax(p) },
    { id: 'abd1', w: 9, h: 9, px: 8, py: 4.5, draw: (p) => abdomen(p, 6.6, 3.6, 2.9, 2) },
    { id: 'abd2', w: 9, h: 7, px: 8, py: 3.5, draw: (p) => abdomen(p, 6.2, 2.9, 1.8, 2) },
    { id: 'stinger', w: 8, h: 5, px: 7, py: 2, draw: (p) => stinger(p) },
    { id: 'head', w: 9, h: 8, px: 3, py: 4.2, draw: (p) => head(p) },
    { id: 'mandible', w: 5, h: 4, px: 1.2, py: 1.2, draw: (p) => mandible(p) },
    { id: 'stalkF', w: 3, h: 9, px: 1.5, py: 8.2, draw: stalk(7.4, false) },
    { id: 'stalkB', w: 3, h: 8, px: 1.5, py: 7.4, draw: stalk(6.6, true) },
    { id: 'eyeF', w: 7, h: 7, px: 3.5, py: 5.8, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: eye(2.7, false) },
    { id: 'eyeB', w: 6, h: 6, px: 3, py: 5, variants: ['open', 'blink', 'angry', 'wide', 'hurt'], draw: eye(2.1, true) },
    { id: 'wingF', w: 20, h: 12, px: 18.5, py: 6, variants: ['still', 'blur'], draw: wing(17, 3.4, true) },
    { id: 'wingF2', w: 18, h: 10, px: 16.5, py: 5, variants: ['still', 'blur'], draw: wing(15, 2.9, true) },
    { id: 'wingB', w: 20, h: 12, px: 18.5, py: 6, variants: ['still', 'blur'], draw: wing(16.5, 3.1, false) },
    { id: 'wingB2', w: 18, h: 10, px: 16.5, py: 5, variants: ['still', 'blur'], draw: wing(14.5, 2.7, false) },
  ];
  for (const side of ['N', 'F'] as const) {
    list.push({ id: `legU${side}`, w: 3, h: 7, px: 1.5, py: 1.2, draw: leg(LEG.upper, 0.75, side === 'F', false) });
    list.push({ id: `legL${side}`, w: 4, h: 9, px: 1.5, py: 1.0, draw: leg(LEG.lower, 0.6, side === 'F', true) });
  }
  return list;
}

function bones(): BoneSpec[] {
  const list: BoneSpec[] = [
    { id: 'root', x: 0, y: 0, z: 0, dir: 1 },
    { id: 'thorax', parent: 'root', x: 2, y: -13, part: 'thorax', z: 40, dir: 1 },
    { id: 'abd1', parent: 'thorax', x: -3.8, y: 0.6, part: 'abd1', z: 32, dir: 1 },
    { id: 'abd2', parent: 'abd1', x: -6.2, y: 0.2, part: 'abd2', z: 31, dir: 1 },
    { id: 'stinger', parent: 'abd2', x: -5.8, y: 0.2, part: 'stinger', z: 30, dir: 1 },
    { id: 'head', parent: 'thorax', x: 4.6, y: -1.8, part: 'head', z: 50, dir: 1 },
    { id: 'mandible', parent: 'head', x: 3.4, y: 1.4, part: 'mandible', z: 51, dir: 1 },
    { id: 'stalkB', parent: 'head', x: 0.4, y: -2.4, part: 'stalkB', z: 44, dir: 1 },
    { id: 'eyeB', parent: 'stalkB', x: 0, y: -6.4, part: 'eyeB', z: 45, dir: 1, blink: true },
    { id: 'stalkF', parent: 'head', x: 1.6, y: -2.6, part: 'stalkF', z: 52, dir: 1 },
    { id: 'eyeF', parent: 'stalkF', x: 0, y: -7.2, part: 'eyeF', z: 53, dir: 1, blink: true },
    { id: 'wingB', parent: 'thorax', x: 0.2, y: -3.8, part: 'wingB', z: 10, dir: 1 },
    { id: 'wingB2', parent: 'thorax', x: 0.6, y: -3.6, part: 'wingB2', z: 11, dir: 1 },
    { id: 'wingF2', parent: 'thorax', x: 0.8, y: -3.8, part: 'wingF2', z: 60, dir: 1 },
    { id: 'wingF', parent: 'thorax', x: 1.2, y: -4.0, part: 'wingF', z: 61, dir: 1 },
  ];
  for (const side of ['N', 'F'] as const) {
    const near = side === 'N';
    for (const l of LEGS) {
      list.push({ id: `legU${side}${l.id}`, parent: 'thorax', x: l.x + (near ? 0.3 : -0.3), y: 3.0, part: `legU${side}`, z: near ? 46 : 20, dir: -1 });
      list.push({ id: `legL${side}${l.id}`, parent: `legU${side}${l.id}`, x: 0, y: LEG.upper, part: `legL${side}`, z: near ? 47 : 19, dir: -1 });
    }
  }
  return list;
}

/** Wing angles for the named poses of his pixel sheet: [back pair, front pair]. */
const WINGS = { fold: [-8, -4], up: [60, 72], mid: [28, 40], down: [-12, -8], spread: [12, 26] } as const;

function setWings(p: Pose, back: number, front: number, blur: boolean): void {
  p.set('wingB', back).set('wingB2', back - 10).set('wingF2', front - 10).set('wingF', front);
  const v = blur ? 'blur' : 'still';
  p.show('wingB', v).show('wingB2', v).show('wingF', v).show('wingF2', v);
}

/** Six legs standing (`step` 0) or scuttling in a tripod gait. */
function setLegs(p: Pose, t: number, step: number): void {
  const spread = [26, 4, -22];
  for (const side of ['N', 'F'] as const) {
    LEGS.forEach((l, i) => {
      const phase = (i + (side === 'F' ? 1 : 0)) % 2 === 0 ? 0 : 0.5;
      const sw = wave(t, phase) * step;
      const lift = Math.max(0, wave(t, phase + 0.25)) * step;
      p.set(`legU${side}${l.id}`, spread[i] + 50 + sw * 22 + lift * 20 + (side === 'F' ? 6 : 0));
      p.set(`legL${side}${l.id}`, -spread[i] * 0.5 - 68 - lift * 30);
    });
  }
}

/** Legs tucked up under him (flying). */
function tuckLegs(p: Pose): void {
  for (const side of ['N', 'F'] as const) LEGS.forEach((l, i) => p.set(`legU${side}${l.id}`, 40 - i * 14).set(`legL${side}${l.id}`, -20 - i * 8));
}

function tail(p: Pose, lift: number, t = 0, amp = 0): void {
  p.set('abd1', -6 + lift + wave(t) * amp).set('abd2', -4 + lift * 0.6 + wave(t, 0.2) * amp).set('stinger', 4 + lift * 0.4 + wave(t, 0.4) * amp);
}

function stalks(p: Pose, lean: number, t = 0, amp = 0): void {
  p.set('stalkF', 10 + lean + wave(t) * amp).set('stalkB', -18 + lean + wave(t, 0.3) * amp);
  p.set('eyeF', -10 - lean).set('eyeB', 14 - lean);
}

function stinkflyClips(_info: RigInfo): Record<string, ClipDef> {
  const idle: ClipDef = {
    ms: 1400,
    loop: true,
    pose: (t, p) => {
      p.move('thorax', 0, wave(t) * 0.35);
      setLegs(p, 0, 0);
      tail(p, 0, t, 2);
      stalks(p, 0, t, 5);
      const twitch = Math.max(0, wave(t * 2) - 0.85) * 60;
      setWings(p, WINGS.fold[0] + twitch, WINGS.fold[1] + twitch, false);
      p.set('mandible', wave(t * 3) * 6);
    },
  };
  const fly: ClipDef = {
    ms: 150,
    loop: true,
    pose: (t, p) => {
      p.set('thorax', 6).move('thorax', 0, -2 + wave(t) * 0.5);
      tuckLegs(p);
      tail(p, 6);
      stalks(p, -4);
      const f = wave(t);
      setWings(p, 24 + f * 36, 34 + f * 38, true);
    },
  };
  const pose = (ms: number, loop: boolean, build: (t: number, p: Pose) => void): ClipDef => ({ ms, loop, pose: build });
  return {
    idle,
    run: pose(320, true, (t, p) => {
      p.move('thorax', 0, -Math.abs(wave(t * 2)) * 0.6);
      setLegs(p, t, 1);
      tail(p, 2, t * 2, 2);
      stalks(p, -4, t * 2, 4);
      setWings(p, 18 + wave(t * 4) * 30, 26 + wave(t * 4) * 32, true);
    }),
    jump: pose(300, false, (t, p) => {
      p.set('thorax', -6 + t * 8).move('thorax', 0, -1);
      tuckLegs(p);
      tail(p, 4);
      stalks(p, -6);
      setWings(p, WINGS.up[0], WINGS.up[1], true);
    }),
    fall: pose(400, true, (t, p) => {
      p.set('thorax', 4);
      setLegs(p, 0, 0);
      for (const side of ['N', 'F'] as const) LEGS.forEach((l) => p.add(`legU${side}${l.id}`, -20));
      tail(p, 8, t, 3);
      stalks(p, -8);
      setWings(p, WINGS.mid[0] + wave(t * 2) * 10, WINGS.mid[1] + wave(t * 2) * 10, false);
    }),
    land: pose(220, false, (t, p) => {
      const s = 1 - t;
      p.move('thorax', 0, s * 1.6).size('thorax', 1 + s * 0.08, 1 - s * 0.08);
      setLegs(p, 0, 0);
      for (const side of ['N', 'F'] as const) LEGS.forEach((l) => p.add(`legU${side}${l.id}`, s * 20).add(`legL${side}${l.id}`, -s * 20));
      tail(p, -4 * s);
      stalks(p, 6 * s);
      setWings(p, WINGS.down[0], WINGS.down[1], false);
    }),
    fly,
    glide: pose(900, true, (t, p) => {
      p.set('thorax', 4).move('thorax', 0, -2 + wave(t) * 0.6);
      tuckLegs(p);
      tail(p, 4, t, 2);
      stalks(p, -6, t, 2);
      setWings(p, WINGS.spread[0] + wave(t) * 3, WINGS.spread[1] + wave(t) * 3, false);
    }),
    spit: pose(240, false, (t, p) => {
      const kick = t < 0.35 ? -t / 0.35 : 1 - (t - 0.35) * 0.6;
      setLegs(p, 0, 0);
      p.move('head', kick * 1.6, 0);
      tail(p, 0);
      stalks(p, kick * 26);
      p.set('mandible', 20).show('eyeF', 'angry').show('eyeB', 'angry');
      setWings(p, WINGS.mid[0], WINGS.mid[1], false);
    }),
    vent: pose(320, false, (t, p) => {
      const up = Math.min(1, t / 0.3);
      setLegs(p, 0, 0);
      p.set('thorax', -4 * up);
      tail(p, 46 * up);
      p.add('abd2', 20 * up).add('stinger', 30 * up);
      stalks(p, -6);
      setWings(p, WINGS.up[0], WINGS.up[1], false);
    }),
    hurt: pose(320, false, (t, p) => {
      const s = 1 - t * 0.5;
      p.set('thorax', -14 * s).move('thorax', -1 * s, 0);
      setLegs(p, 0, 0);
      for (const side of ['N', 'F'] as const) LEGS.forEach((l) => p.add(`legU${side}${l.id}`, 30 * s));
      tail(p, 14 * s);
      stalks(p, -30 * s);
      p.show('eyeF', 'hurt').show('eyeB', 'hurt');
      setWings(p, WINGS.spread[0], WINGS.spread[1], false);
    }),
    defeat: pose(800, true, (t, p) => {
      // Flipped on his back, legs kicking feebly.
      p.set('root', 180).move('root', 0, -16);
      setLegs(p, t, 0.4);
      tail(p, -6);
      stalks(p, 10 + wave(t) * 6);
      p.show('eyeF', 'hurt').show('eyeB', 'hurt');
      setWings(p, WINGS.fold[0], WINGS.fold[1], false);
    }),
    swim: pose(700, true, (t, p) => {
      p.set('thorax', 10);
      setLegs(p, t, 1.4);
      tail(p, 4, t, 6);
      stalks(p, -8, t, 3);
      setWings(p, WINGS.fold[0] - 6, WINGS.fold[1] - 6, false);
    }),
    tread: pose(900, true, (t, p) => {
      p.move('thorax', 0, wave(t) * 0.5);
      setLegs(p, t, 1);
      tail(p, 2, t, 3);
      stalks(p, 0, t, 3);
      setWings(p, WINGS.fold[0], WINGS.fold[1], false);
    }),
    drown: pose(500, true, (t, p) => {
      p.set('thorax', wave(t) * 10);
      setLegs(p, t * 2, 1.4);
      tail(p, 10, t * 2, 10);
      stalks(p, -14, t * 2, 10);
      p.show('eyeF', 'hurt').show('eyeB', 'hurt');
      setWings(p, WINGS.mid[0] + wave(t * 2) * 20, WINGS.mid[1] + wave(t * 2) * 20, false);
    }),
    talk: pose(800, true, (t, p) => {
      idle.pose(t, p);
      stalks(p, wave(t * 2) * 8, t, 4);
      p.set('mandible', Math.max(0, wave(t * 4)) * 16);
    }),
    cheer: pose(400, true, (t, p) => {
      p.move('thorax', 0, -1.5 - Math.abs(wave(t)) * 2);
      tuckLegs(p);
      tail(p, 10, t, 6);
      stalks(p, -10, t, 10);
      setWings(p, 24 + wave(t * 3) * 36, 34 + wave(t * 3) * 38, true);
    }),
  };
}

/** Stinkfly's HD rig: an insect skeleton (thorax, a three-part abdomen, a head with eyestalks and mandibles, four wings, six legs). */
export function stinkflyRig(): RigDef {
  const draft: RigDef = { id: 'stinkfly', parts: parts(), bones: bones(), clips: {}, fallback: 'idle', bounds: { left: -24, right: 16, top: -36, bottom: 2 } };
  const info = new RigInfo(draft);
  return { ...draft, clips: stinkflyClips(info) };
}
