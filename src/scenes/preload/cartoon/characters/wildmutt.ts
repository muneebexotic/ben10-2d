import { WILDMUTT_CARTOON } from '../../../../config/cartoon/wildmutt';
import { keyframes } from '../humanoid';
import { LINE, type Paint } from '../paint';
import { RigInfo, wave, type BoneSpec, type ClipDef, type PartSpec, type Pose, type PoseData, type RigDef } from '../rig';
import { cel, omnitrixBadge } from './alienBits';

const C = WILDMUTT_CARTOON.colors;

/** Leg segment lengths (game px). */
const L = { thighB: 4.6, hockB: 4.0, armF: 4.4, foreF: 4.2 };
/** Where the chest sits ahead of the hips. */
const CHEST = { x: 15.5, y: -0.5 };

const fur = (far = false, r = 3) => cel(C.fur, { light: C.light, shade: C.dark, far, r });

/** A row of spiky dark tufts along a line (the spine), drawn over the body. */
function tufts(p: Paint, pts: ReadonlyArray<readonly [number, number]>, size: number): void {
  pts.forEach(([x, y], i) => {
    const h = size * (i % 2 === 0 ? 1 : 0.8);
    const tuft = p.spiky([x - size * 0.9, y + 0.6, x - size * 0.5, y - h * 0.6, x - size * 1.4, y - h, x + size * 0.1, y - h * 0.5, x + size * 0.7, y + 0.6], [false, false, true, false, false]);
    p.shape(tuft, { fill: { linear: [x, y - h, x, y + 0.6], stops: [[0, C.deep], [1, C.dark]] }, ink: LINE * 0.7, light: C.fur, lightDepth: 0.3, lightAlpha: 0.5 });
  });
}

function chest(p: Paint): void {
  const body = p.smooth([-15.2, -5.4, -8, -7.6, 0, -8.6, 5.2, -7.0, 8.2, -2.6, 7.2, 3.0, 3.0, 6.0, -6, 5.4, -14.2, 4.4]);
  p.shape(body, fur(false, 6));
  p.within(body, () => {
    // A lighter chest, a darker belly line.
    p.fill(p.ellipse(4.4, 0.6, 4.2, 5.2), C.light, 0.25);
    p.line([-13.4, 3.6, -4, 4.6, 4.4, 5.0], LINE * 0.6, C.dark, true, 0.6);
    p.line([-10, -6.4, -2, -7.8, 4, -6.6], LINE * 0.5, C.light, true, 0.5);
  });
  tufts(p, [[-11, -6.4], [-6.4, -7.6], [-1.8, -8.4], [2.6, -7.8]], 2.0);
  omnitrixBadge(p, 1.2, 2.8, 1.15, C.omnitrix);
}

function haunch(p: Paint): void {
  const shape = p.smooth([-6.4, -4.6, -1.0, -6.4, 4.6, -4.2, 6.4, 0.6, 3.8, 5.6, -2.2, 6.4, -6.6, 3.0]);
  p.shape(shape, fur(false, 5));
  p.within(shape, () => p.line([-3.6, -3.4, 1.4, -4.6], LINE * 0.5, C.light, true, 0.6));
  tufts(p, [[-3.8, -5.4], [0.6, -6.2]], 1.9);
}

function head(p: Paint, v: string): void {
  const flare = v === 'flare';
  // The neck ruff with his gills: slits that open pale when he breathes hard.
  const ruff = p.spiky([-4.4, -2.6, -3.2, -4.8, -1.0, -4.6, 1.6, -4.2, 2.0, 2.6, -1.6, 4.0, -4.6, 2.6, -5.8, 0.2], [false, true, false, false, false, false, true, true]);
  p.shape(ruff, fur(false, 4));
  for (let i = 0; i < 3; i++) {
    const x = -2.6 + i * 1.5;
    if (flare) {
      p.shape(p.ellipse(x, 0.2, 0.55, 2.2, 0.15), { fill: C.gill, ink: LINE * 0.45 });
      p.line([x, -1.2, x + 0.2, 1.6], LINE * 0.35, C.deep, false, 0.8);
    } else {
      p.line([x - 0.2, -1.6, x + 0.3, 1.8], LINE * 0.7, C.deep, true, 0.9);
    }
  }
  // The skull: smooth and round, no eyes at all. Then the long upper jaw.
  const skull = p.smooth([0.2, -3.6, 2.2, -6.8, 5.6, -7.4, 8.4, -5.8, 11.2, -3.8, 11.6, -1.2, 10.8, 1.2, 1.2, 1.6, -0.4, -0.8]);
  p.shape(skull, fur(false, 5));
  p.within(skull, () => {
    p.fill(p.ellipse(4.4, -5.6, 3.2, 1.3, -0.2), C.light, 0.45);
    p.line([7.2, -5.8, 10.6, -3.4], LINE * 0.45, C.light, true, 0.6);
    p.fill(p.ellipse(10.6, -2.4, 0.55, 0.4), C.deep);
  });
  // Upper teeth along the jaw line.
  for (let x = 2.4; x <= 10.4; x += 1.6) {
    p.shape(p.poly([x - 0.6, 1.2, x + 0.6, 1.2, x + 0.05, 2.6]), { fill: C.teeth, ink: LINE * 0.35 });
  }
}

/** Inside his mouth (stretched with the jaw): dark, with a long tongue. */
function maw(p: Paint): void {
  const inside = p.poly([-0.6, -0.4, 10.4, -0.4, 9.6, 5.4, 0.2, 2.0]);
  p.fill(inside, C.mouth);
  p.within(inside, () => {
    p.fill(p.ellipse(4.6, 3.0, 4.2, 1.2, 0.2), C.tongue);
    p.fill(p.ellipse(1.6, 0.6, 2.0, 1.0), 0x000000, 0.35);
  });
}

function jaw(p: Paint): void {
  for (let x = 2.0; x <= 9.0; x += 1.6) {
    p.shape(p.poly([x - 0.55, 0.4, x + 0.55, 0.4, x, -1.0]), { fill: C.teeth, ink: LINE * 0.35 });
  }
  const shape = p.smooth([-0.8, -0.2, 9.8, 0.2, 9.2, 1.8, 6.0, 3.2, 0.6, 3.4, -1.2, 1.6]);
  p.shape(shape, cel(C.dark, { light: C.fur, shade: C.deep, r: 2 }));
}

function tail(p: Paint): void {
  p.shape(p.capsule(0, 0, 2.2, -5.0, -2.4, 1.3), fur(false, 2));
  const tip = p.spiky([-4.0, -3.6, -6.4, -5.6, -5.6, -3.4, -8.0, -3.0, -5.6, -1.6, -4.2, -1.2], [false, true, false, true, false, false]);
  p.shape(tip, { fill: C.deep, ink: LINE * 0.7, light: C.dark, lightDepth: 0.3 });
}

function limb(id: string, len: number, r0: number, r1: number, far: boolean, z: number): PartSpec {
  return {
    id,
    w: r0 * 2 + 2,
    h: len + r0 + r1 + 1,
    px: r0 + 1,
    py: r0 + 0.5,
    draw: (p) => {
      p.shape(p.capsule(0, 0, r0, 0, len, r1), fur(far, r0));
      if (z > 30) p.line([r0 * 0.25, len * 0.15, r1 * 0.3, len * 0.8], LINE * 0.4, C.light, true, 0.45);
    },
  };
}

function paw(id: string, far: boolean): PartSpec {
  return {
    id,
    w: 7,
    h: 4,
    px: 2.2,
    py: 1.2,
    draw: (p) => {
      const pad = p.smooth([-1.8, -0.4, 1.6, -0.8, 3.4, 0.4, 3.6, 1.6, -2.0, 1.6], true, 0.45);
      p.shape(pad, cel(far ? C.deep : C.dark, { light: C.fur, shade: C.deep, r: 1.2 }));
      for (const x of far ? [3.2] : [2.4, 3.6]) p.shape(p.horn(x - 0.6, 0.8, x + 0.4, 0.9, x + 0.9, 1.9, 0.6), { fill: C.claw, ink: LINE * 0.35 });
    },
  };
}

function parts(): PartSpec[] {
  return [
    { id: 'chest', w: 26, h: 17, px: 16.5, py: 10, draw: (p) => chest(p) },
    { id: 'haunch', w: 15, h: 15, px: 7.5, py: 8, draw: (p) => haunch(p) },
    { id: 'head', w: 19, h: 12, px: 6.5, py: 8.2, variants: ['calm', 'flare'], draw: (p, v) => head(p, v) },
    { id: 'maw', w: 12, h: 7, px: 1, py: 1, draw: (p) => maw(p) },
    { id: 'jaw', w: 13, h: 6, px: 2, py: 2, draw: (p) => jaw(p) },
    { id: 'tail', w: 11, h: 8, px: 8.6, py: 6.2, draw: (p) => tail(p) },
    limb('thighBN', L.thighB, 2.6, 1.8, false, 50),
    limb('thighBF', L.thighB, 2.6, 1.8, true, 10),
    limb('hockBN', L.hockB, 1.6, 1.2, false, 49),
    limb('hockBF', L.hockB, 1.6, 1.2, true, 9),
    limb('armFN', L.armF, 2.2, 1.7, false, 52),
    limb('armFF', L.armF, 2.2, 1.7, true, 12),
    limb('foreFN', L.foreF, 1.7, 1.4, false, 51),
    limb('foreFF', L.foreF, 1.7, 1.4, true, 11),
    paw('pawBN', false),
    paw('pawBF', true),
    paw('pawFN', false),
    paw('pawFF', true),
  ];
}

function bones(): BoneSpec[] {
  return [
    // The root turns the whole beast onto a wall when he climbs.
    { id: 'root', x: 0, y: 0, z: 0, dir: 1 },
    { id: 'hip', parent: 'root', x: -8, y: -12.5, part: 'haunch', z: 40, dir: 1 },
    { id: 'tail', parent: 'hip', x: -6.0, y: -2.6, part: 'tail', z: 20, dir: 1 },
    { id: 'chest', parent: 'hip', x: CHEST.x, y: CHEST.y, part: 'chest', z: 38, dir: 1 },
    { id: 'head', parent: 'chest', x: 8.0, y: -3.4, part: 'head', z: 60, dir: 1 },
    { id: 'maw', parent: 'head', x: 1.2, y: 1.5, part: 'maw', z: 57, dir: 1 },
    { id: 'jaw', parent: 'head', x: 1.2, y: 1.5, part: 'jaw', z: 58, dir: 1 },
    { id: 'thighBF', parent: 'hip', x: 0.8, y: 2.6, part: 'thighBF', z: 10, dir: -1 },
    { id: 'hockBF', parent: 'thighBF', x: 0, y: L.thighB, part: 'hockBF', z: 9, dir: -1 },
    { id: 'pawBF', parent: 'hockBF', x: 0, y: L.hockB, part: 'pawBF', z: 8, dir: -1 },
    { id: 'armFF', parent: 'chest', x: 1.2, y: 2.8, part: 'armFF', z: 12, dir: -1 },
    { id: 'foreFF', parent: 'armFF', x: 0, y: L.armF, part: 'foreFF', z: 11, dir: -1 },
    { id: 'pawFF', parent: 'foreFF', x: 0, y: L.foreF, part: 'pawFF', z: 10.5, dir: -1 },
    { id: 'thighBN', parent: 'hip', x: -0.6, y: 3.0, part: 'thighBN', z: 50, dir: -1 },
    { id: 'hockBN', parent: 'thighBN', x: 0, y: L.thighB, part: 'hockBN', z: 49, dir: -1 },
    { id: 'pawBN', parent: 'hockBN', x: 0, y: L.hockB, part: 'pawBN', z: 48, dir: -1 },
    { id: 'armFN', parent: 'chest', x: -0.8, y: 3.2, part: 'armFN', z: 52, dir: -1 },
    { id: 'foreFN', parent: 'armFN', x: 0, y: L.armF, part: 'foreFN', z: 53, dir: -1 },
    { id: 'pawFN', parent: 'foreFN', x: 0, y: L.foreF, part: 'pawFN', z: 54, dir: -1 },
  ];
}

/** A hind leg: `sw` its swing (-1 back, 1 forward), `lift` how high its paw comes up. */
function hindLeg(p: Pose, side: 'N' | 'F', sw: number, lift: number): void {
  p.set(`thighB${side}`, 18 + sw * 26 + lift * 18).set(`hockB${side}`, -42 - lift * 36).set(`pawB${side}`, 22 + lift * 30);
}

/** A front leg: folds at the wrist as it lifts. */
function foreLeg(p: Pose, side: 'N' | 'F', sw: number, lift: number): void {
  p.set(`armF${side}`, sw * 30 + lift * 14).set(`foreF${side}`, -lift * 70).set(`pawF${side}`, -lift * 30);
}

/** The mouth's inside stretches with the jaw (so it never shows under a closed one). */
function openMaw(p: Pose): void {
  const jawAngle = p.a[p.info.bone('jaw')];
  p.size('maw', 1, Math.max(0.05, Math.min(1.3, jawAngle / 30)));
}

function wildmuttClips(info: RigInfo): Record<string, ClipDef> {
  const k = (frames: ReadonlyArray<readonly [number, PoseData]>) => keyframes(info, frames);
  const legsRest: PoseData = { thighBN: 14, hockBN: -40, pawBN: 26, thighBF: 22, hockBF: -40, pawBF: 18, armFN: -4, foreFN: 4, armFF: 4, foreFF: 0 };
  const stance: PoseData = { ...legsRest, head: -4, jaw: 10, tail: 8 };
  const clip = (ms: number, loop: boolean, frames: ReadonlyArray<readonly [number, PoseData]>, extra?: (t: number, p: Pose) => void): ClipDef => {
    const keys = k(frames);
    return {
      ms,
      loop,
      pose: (t, p) => {
        p.keys(keys, t, loop);
        extra?.(t, p);
        openMaw(p);
      },
    };
  };
  const live = (t: number, p: Pose) => p.add('tail', wave(t * 2) * 8);
  const idle: ClipDef = {
    ms: 1500,
    loop: true,
    pose: (t, p) => {
      const b = wave(t);
      p.move('hip', 0, 0.3 + b * 0.25);
      hindLeg(p, 'N', -0.2, 0);
      hindLeg(p, 'F', 0.15, 0);
      foreLeg(p, 'N', -0.1, 0);
      foreLeg(p, 'F', 0.1, 0);
      p.set('chest', b * 1.2).size('chest', 1, 1 + b * 0.03);
      // Sniffing: quick little nods of his eyeless head.
      p.set('head', -4 + Math.max(0, wave(t * 3)) * 4).set('jaw', 10 + (b + 1) * 5);
      p.set('tail', 8 + wave(t * 2) * 10);
      p.show('head', b > 0 ? 'flare' : 'calm');
      openMaw(p);
    },
  };
  const run: ClipDef = {
    ms: 420,
    loop: true,
    pose: (t, p) => {
      // A rotary gallop: the hind pair and the front pair half a cycle apart, the back stretching and bunching.
      hindLeg(p, 'N', wave(t, 0.5), Math.max(0, wave(t, 0.75)));
      hindLeg(p, 'F', wave(t, 0.58), Math.max(0, wave(t, 0.83)));
      foreLeg(p, 'N', wave(t), Math.max(0, wave(t, 0.25)));
      foreLeg(p, 'F', wave(t, 0.08), Math.max(0, wave(t, 0.33)));
      const stretch = wave(t, 0.25);
      p.move('chest', stretch * 2.2, 0);
      p.move('hip', 0, -Math.abs(wave(t)) * 1.6 + 0.6);
      p.set('hip', wave(t, 0.1) * 5).set('chest', -wave(t, 0.1) * 3);
      p.set('head', -wave(t, 0.1) * 4 + 2).set('jaw', 16 + (stretch + 1) * 8);
      p.set('tail', 24 + wave(t * 2) * 10);
      p.show('head', 'flare');
      openMaw(p);
    },
  };
  const rake = (side: 'N' | 'F', ms: number) =>
    clip(ms, false, [
      [0, { ...stance, hip: -6, [`armF${side}`]: 140, [`foreF${side}`]: -40, [`pawF${side}`]: -20, jaw: 30, head: -10 }],
      [0.4, { ...stance, hip: -4, chest: 4, [`armF${side}`]: 70, [`foreF${side}`]: 10, [`pawF${side}`]: 20, jaw: 40, head: 4 }],
      [1, { ...stance, hip: -3, chest: 3, [`armF${side}`]: 60, [`foreF${side}`]: 14, jaw: 34, head: 2 }],
    ]);
  const clips: Record<string, ClipDef> = {
    idle,
    run,
    jump: clip(380, false, [
      [0, { ...stance, hip: { y: 1.6 }, thighBN: 40, hockBN: -90, pawBN: 50, thighBF: 44, hockBF: -90, pawBF: 46, armFN: 20, foreFN: -40, armFF: 24, foreFF: -40, jaw: 14 }],
      [0.4, { hip: -14, chest: -4, thighBN: -30, hockBN: -10, pawBN: 30, thighBF: -24, hockBF: -10, pawBF: 30, armFN: 60, foreFN: -50, pawFN: -20, armFF: 50, foreFF: -60, head: -4, jaw: 30, tail: 30 }],
      [1, { hip: -8, chest: -2, thighBN: -20, hockBN: -30, pawBN: 30, thighBF: -14, hockBF: -30, pawBF: 30, armFN: 50, foreFN: -70, pawFN: -20, armFF: 40, foreFF: -70, head: 0, jaw: 24, tail: 24 }],
    ]),
    fall: {
      ms: 600,
      loop: true,
      pose: (t, p) => {
        const f = wave(t);
        p.set('hip', 8).set('chest', 2).set('head', -10 + f * 3).set('jaw', 34 + f * 6).set('tail', -6 + f * 6);
        p.set('armFN', 50 + f * 8).set('foreFN', -10).set('armFF', 40 - f * 8).set('foreFF', -14);
        p.set('thighBN', 40 + f * 6).set('hockBN', -30).set('thighBF', 30 - f * 6).set('hockBF', -34);
        p.show('head', 'flare');
        openMaw(p);
      },
    },
    land: clip(260, false, [
      [0, { ...stance, hip: { y: 2.4 }, chest: 6, head: -12, thighBN: 50, hockBN: -100, pawBN: 50, thighBF: 54, hockBF: -100, pawBF: 46, armFN: 24, foreFN: -50, armFF: 26, foreFF: -50, jaw: 24 }],
      [1, stance],
    ]),
    clawA: rake('N', 200),
    clawB: rake('F', 200),
    clawC: clip(260, false, [
      [0, { ...stance, hip: -22, chest: -6, armFN: 160, foreFN: -50, armFF: 150, foreFF: -60, thighBN: 30, hockBN: -60, thighBF: 36, hockBF: -60, jaw: 40, head: -16, tail: 30 }],
      [0.45, { ...stance, hip: -8, chest: 8, armFN: 80, foreFN: 10, armFF: 70, foreFF: 14, jaw: 46, head: 8, tail: 20 }],
      [1, { ...stance, hip: -6, chest: 6, armFN: 70, foreFN: 14, armFF: 60, foreFF: 14, jaw: 40, head: 6, tail: 16 }],
    ], (_t, p) => p.show('head', 'flare')),
    pounce: clip(240, false, [
      [0, { hip: -10, chest: -4, head: -6, jaw: 40, armFN: 100, foreFN: -10, pawFN: -10, armFF: 90, foreFF: -10, thighBN: -60, hockBN: -10, pawBN: 30, thighBF: -56, hockBF: -14, pawBF: 30, tail: 10 }],
      [1, { hip: -4, chest: 2, head: 0, jaw: 46, armFN: 96, foreFN: 0, pawFN: -10, armFF: 86, foreFF: 0, thighBN: -70, hockBN: -6, pawBN: 34, thighBF: -64, hockBF: -10, pawBF: 34, tail: 4 }],
    ], (_t, p) => {
      p.move('chest', 2.4, 0);
      p.show('head', 'flare');
    }),
    hurt: clip(320, false, [
      [0, { ...stance, hip: { x: -1, y: 0.4, a: -12 }, chest: -8, head: -30, jaw: 44, tail: 40, armFN: 40, foreFN: -50, armFF: 30, foreFF: -50 }],
      [1, { ...stance, hip: { a: -6 }, chest: -4, head: -16, jaw: 30, tail: 20 }],
    ], (_t, p) => p.show('head', 'flare')),
    // Flat on his belly, legs splayed, tongue out.
    defeat: clip(1400, true, [
      [0, { hip: { y: 6.2, a: 4 }, chest: -2, head: 12, jaw: 22, tail: -30, thighBN: -80, hockBN: -10, pawBN: 30, thighBF: -70, hockBF: -16, pawBF: 30, armFN: 84, foreFN: 4, pawFN: 10, armFF: 76, foreFF: 4 }],
      [0.5, { hip: { y: 6.4, a: 4 }, chest: -2, head: 14, jaw: 26, tail: -28, thighBN: -80, hockBN: -10, pawBN: 30, thighBF: -70, hockBF: -16, pawBF: 30, armFN: 84, foreFN: 4, pawFN: 10, armFF: 76, foreFF: 4 }],
    ]),
    climb: {
      ms: 520,
      loop: true,
      pose: (t, p) => {
        // On a wall: the whole beast turned to face up it, diagonal pairs reaching and pulling.
        p.set('root', -90).move('root', 8, -13);
        hindLeg(p, 'N', wave(t, 0.5) * 0.8, Math.max(0, wave(t, 0.75)) * 0.6);
        hindLeg(p, 'F', wave(t) * 0.8, Math.max(0, wave(t, 0.25)) * 0.6);
        foreLeg(p, 'N', wave(t) * 0.9, Math.max(0, wave(t, 0.25)) * 0.8);
        foreLeg(p, 'F', wave(t, 0.5) * 0.9, Math.max(0, wave(t, 0.75)) * 0.8);
        p.move('hip', 0, -Math.abs(wave(t)) * 0.6);
        p.set('head', -14).set('jaw', 14 + Math.abs(wave(t)) * 8).set('tail', -10 + wave(t * 2) * 8);
        openMaw(p);
      },
    },
    cling: {
      ms: 1400,
      loop: true,
      pose: (t, p) => {
        p.set('root', -90).move('root', 8, -13);
        hindLeg(p, 'N', -0.2, 0);
        hindLeg(p, 'F', 0.2, 0);
        foreLeg(p, 'N', 0.2, 0);
        foreLeg(p, 'F', -0.1, 0);
        p.set('head', -24 + Math.max(0, wave(t * 2)) * 6).set('jaw', 12 + (wave(t) + 1) * 5).set('tail', -16 + wave(t) * 6);
        p.show('head', wave(t) > 0 ? 'flare' : 'calm');
        openMaw(p);
      },
    },
    swim: {
      ms: 700,
      loop: true,
      pose: (t, p) => {
        // Dog-paddling: head up, front paws churning, back legs kicking.
        p.set('hip', 10).set('chest', -14).set('head', -10).set('jaw', 12).set('tail', 6 + wave(t * 2) * 10);
        foreLeg(p, 'N', wave(t) * 1.4, Math.max(0, wave(t, 0.25)) * 1.2);
        foreLeg(p, 'F', wave(t, 0.5) * 1.4, Math.max(0, wave(t, 0.75)) * 1.2);
        hindLeg(p, 'N', wave(t, 0.25) * 1.2 - 0.6, 0.4);
        hindLeg(p, 'F', wave(t, 0.75) * 1.2 - 0.6, 0.4);
        p.show('head', 'flare');
        openMaw(p);
      },
    },
    tread: {
      ms: 900,
      loop: true,
      pose: (t, p) => {
        p.set('hip', 4).set('chest', -10).set('head', -14 + wave(t) * 2).set('jaw', 10).set('tail', wave(t * 2) * 8);
        p.move('hip', 0, wave(t) * 0.5);
        foreLeg(p, 'N', wave(t), Math.max(0, wave(t, 0.25)));
        foreLeg(p, 'F', wave(t, 0.5), Math.max(0, wave(t, 0.75)));
        hindLeg(p, 'N', wave(t, 0.25) * 0.8 - 0.4, 0.3);
        hindLeg(p, 'F', wave(t, 0.75) * 0.8 - 0.4, 0.3);
        openMaw(p);
      },
    },
    drown: clip(500, true, [
      [0, { ...stance, hip: -16, chest: -10, head: -30, jaw: 40, armFN: 80, foreFN: -60, armFF: 40, foreFF: -40, tail: 30 }],
      [0.5, { ...stance, hip: -6, chest: -4, head: -20, jaw: 24, armFN: 30, foreFN: -20, armFF: 80, foreFF: -60, tail: 10 }],
    ], (_t, p) => p.show('head', 'flare')),
    talk: {
      ms: 600,
      loop: true,
      pose: (t, p) => {
        idle.pose(t, p);
        p.set('jaw', 8 + Math.max(0, wave(t * 2)) * 18).set('head', -6 + wave(t * 2) * 3);
        openMaw(p);
      },
    },
    sniff: clip(900, true, [
      [0, { ...stance, hip: { a: 6 }, chest: 10, head: 30, jaw: 4, tail: 20 }],
      [0.5, { ...stance, hip: { a: 6 }, chest: 12, head: 36, jaw: 6, tail: 26 }],
    ], (t, p) => {
      live(t, p);
      p.show('head', wave(t * 4) > 0 ? 'flare' : 'calm');
    }),
    howl: clip(1200, true, [
      [0, { ...stance, hip: { a: -10 }, chest: -12, head: -40, jaw: 34, tail: 30 }],
      [0.5, { ...stance, hip: { a: -12 }, chest: -14, head: -46, jaw: 40, tail: 36 }],
    ], (_t, p) => p.show('head', 'flare')),
    cheer: {
      ms: 500,
      loop: true,
      pose: (t, p) => {
        idle.pose(t, p);
        p.move('hip', 0, -Math.abs(wave(t)) * 2.4);
        p.set('tail', 30 + wave(t * 2) * 24).set('jaw', 30).set('head', -12);
        openMaw(p);
      },
    },
  };
  return clips;
}

/** Wildmutt's HD rig: a quadruped skeleton (haunch, chest, a head with a hinged jaw, four legs, a tail) with every gait and attack he has. */
export function wildmuttRig(): RigDef {
  const draft: RigDef = { id: 'wildmutt', parts: parts(), bones: bones(), clips: {}, fallback: 'idle', bounds: { left: -26, right: 28, top: -30, bottom: 3 } };
  const info = new RigInfo(draft);
  return { ...draft, clips: wildmuttClips(info) };
}
