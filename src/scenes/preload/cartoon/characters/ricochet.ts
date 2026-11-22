import { RICOCHET_CARTOON } from '../../../../config/cartoon/ricochet';
import { INK, LINE, type Paint } from '../paint';
import { TAU, wave, type PartSpec, type Pose, type RigDef } from '../rig';

const C = RICOCHET_CARTOON.colors;

/**
 * Ricochet's HD rig (an original alien, painted in code): the domed shell
 * and belly as one body, a small head under the shell's rim, short legs,
 * broad arms with shell bracers, and a separate ball for when he's curled
 * up (the body hides, the ball spins: the game plays the roll faster the
 * faster he goes).
 */

/** The domed back: copper plate bands with teal seams, the pale belly under its front. Pivot at the hips. */
function shell(p: Paint): void {
  // The belly first (it shows under the shell's front edge).
  const belly = p.smooth([-6, 2, 2, 5, 9, 2, 11, -4, 8, -9, 0, -7]);
  p.shape(belly, { fill: { linear: [0, -9, 0, 5], stops: [[0, C.hideLight], [1, C.hide]] }, shade: C.hideShade, shadeDepth: 1.4 });
  // The Omnitrix on the belly.
  p.fill(p.circle(7.2, -1.6, 2.1), INK);
  p.fill(p.circle(7.2, -1.6, 1.5), C.omnitrix);
  p.fill(p.circle(6.7, -2.1, 0.5), 0xffffff, 0.8);
  // The dome.
  const dome = p.smooth([-12, 1, -13, -8, -8, -16, 1, -18, 8, -14, 11, -8, 10, -4, 4, -6, -4, -3]);
  p.shape(dome, { fill: { radial: [-4, -14, 1, -2, -8, 15], stops: [[0, C.shellLight], [0.5, C.shell], [1, C.shellShade]] }, shade: C.shellDeep, shadeDepth: 1.8, light: 0xffe2c0, lightAlpha: 0.5 });
  p.within(dome, () => {
    // Plate bands, front to back, each seam glowing.
    for (const [x0, bend] of [[-7, -2.4], [-1.5, -1.2], [4, 0]] as const) {
      const seam = [x0 - 1, -19, x0 + bend, -10, x0 - 1 + bend * 0.5, 2];
      p.line(seam, LINE * 2.2, C.seamDeep, true);
      p.line(seam, LINE * 1.1, C.seam, true);
    }
    // Studs along the ridge.
    for (const [x, y] of [[-9, -12], [-3.6, -16], [2, -16.4], [7, -12.4]] as const) p.fill(p.circle(x, y, 0.8), C.shellLight, 0.9);
  });
  p.glow(-1.5, -10, 7, C.seam, 0.12);
}

/** His small head: a blunt snout, a brow plate, one amber eye showing (the far one is a hint behind). */
function head(p: Paint, variant: string): void {
  const skull = p.smooth([-4, 2, -4.6, -3, -1, -5.6, 4, -4.4, 6.4, -1, 6.2, 2.4, 2, 3.6]);
  p.shape(skull, { fill: { linear: [0, -5, 0, 3.6], stops: [[0, C.hideLight], [1, C.hide]] }, shade: C.hideShade, shadeDepth: 1.2 });
  // Nostrils on the blunt snout, and a wide flat mouth.
  p.fill(p.circle(5.6, -0.6, 0.35), INK);
  p.line([1.6, 2.2, 4.2, 2.4, 6, 1.8], LINE * 0.6, INK, true);
  // The brow plate.
  const brow = p.smooth([-4.4, -2.6, -1.6, -6, 3.6, -5.4, 5.2, -3.6, 1, -3.4]);
  p.shape(brow, { fill: C.shell, shade: C.shellShade, shadeDepth: 0.8 });
  if (variant === 'blink') {
    p.line([1.2, -1.8, 2.8, -1.4, 4.2, -1.8], LINE * 0.8, INK, true);
  } else if (variant === 'hurt') {
    p.line([1.2, -2.6, 4, -1.2], LINE * 0.8, INK).line([1.2, -1, 4, -2.4], LINE * 0.8, INK);
  } else {
    p.fill(p.ellipse(2.7, -1.6, 1.6, 1.5), 0xffffff);
    p.fill(p.ellipse(3.1, -1.6, 1.1, 1.2), C.eye);
    p.fill(p.circle(3.4, -1.6, 0.55), INK);
    p.fill(p.circle(2.9, -2.1, 0.32), 0xffffff);
    p.stroke(p.ellipse(2.7, -1.6, 1.6, 1.5), INK, LINE * 0.7);
  }
}

/** A short, thick leg with a copper knee plate and a wide three-toed foot. Pivot at the hip, hanging down. */
function leg(p: Paint, far: boolean): void {
  const hide = far ? C.hideShade : C.hide;
  const thigh = p.capsule(0, 0, 2.6, 0.6, 6.2, 2.4);
  p.shape(thigh, { fill: hide, shade: far ? 0x5a5470 : C.hideShade, shadeDepth: 1 });
  const knee = p.ellipse(0.4, 3.2, 1.9, 1.5);
  p.shape(knee, { fill: far ? C.shellShade : C.shell, ink: LINE * 0.8 });
  const foot = p.smooth([-2.6, 7.6, -2.4, 5.6, 1.2, 5.2, 4.4, 6.4, 4.6, 8]);
  p.shape(foot, { fill: hide, shade: far ? 0x5a5470 : C.hideShade, shadeDepth: 0.8 });
  for (const x of [1.6, 3, 4.2]) p.fill(p.circle(x, 7.9, 0.45), C.claw);
}

/** A broad arm with a shell bracer on the forearm and a three-fingered hand. Pivot at the shoulder, hanging down. */
function arm(p: Paint, far: boolean): void {
  const hide = far ? C.hideShade : C.hide;
  p.shape(p.capsule(0, 0, 2.1, 0.4, 8.6, 2.0), { fill: hide, shade: far ? 0x5a5470 : C.hideShade, shadeDepth: 0.9 });
  const bracer = p.smooth([-2.4, 3.6, 0, 2.8, 2.6, 4, 2.4, 7.6, -2.2, 7.8]);
  p.shape(bracer, { fill: { linear: [0, 3, 0, 8], stops: [[0, C.shellLight], [1, far ? C.shellShade : C.shell]] }, shade: C.shellDeep, shadeDepth: 0.8 });
  p.line([-2, 5.6, 2.4, 5.6], LINE * 0.9, C.seam);
  const hand = p.smooth([-2.2, 9, 0, 8.2, 2.4, 9.2, 2.2, 11.8, -2, 11.6]);
  p.shape(hand, { fill: far ? C.hideShade : C.hideLight, shade: C.hideShade, shadeDepth: 0.6 });
  for (const x of [-1.2, 0.4, 1.8]) p.fill(p.circle(x, 12, 0.5), C.claw);
}

/** Curled up: a perfect ball of plates, seams across it, the Omnitrix on its rim. Pivot at the centre. */
function ball(p: Paint): void {
  const r = 11;
  const disc = p.circle(0, 0, r);
  p.shape(disc, { fill: { radial: [-4, -4, 1, 0, 0, r], stops: [[0, C.shellLight], [0.55, C.shell], [1, C.shellShade]] }, ink: LINE * 1.1 });
  p.within(disc, () => {
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      const dx = Math.cos(a) * r;
      const dy = Math.sin(a) * r;
      p.line([-dx, -dy, dx * 0.1 + dy * 0.18, dy * 0.1 - dx * 0.18, dx, dy], LINE * 2.2, C.seamDeep, true);
      p.line([-dx, -dy, dx * 0.1 + dy * 0.18, dy * 0.1 - dx * 0.18, dx, dy], LINE * 1.1, C.seam, true);
    }
    // The ring of plates round the rim.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      p.fill(p.circle(Math.cos(a) * (r - 1.6), Math.sin(a) * (r - 1.6), 0.7), C.shellLight, 0.8);
    }
    // A sliver of hide where he tucked in.
    p.fill(p.ellipse(4.4, 6.6, 3.6, 1.6, -0.6), C.hide);
  });
  p.fill(p.circle(-6.4, 4.6, 2), INK);
  p.fill(p.circle(-6.4, 4.6, 1.4), C.omnitrix);
}

/** The shine on the ball stays where the light is while the ball turns under it. */
function shine(p: Paint): void {
  p.fill(p.ellipse(-4, -5.2, 3.6, 2, -0.6), 0xffffff, 0.42);
  p.fill(p.circle(-6.6, -6.4, 0.8), 0xffffff, 0.8);
}

function parts(): PartSpec[] {
  return [
    { id: 'shell', w: 28, h: 26, px: 14, py: 20, draw: (p) => shell(p) },
    { id: 'head', w: 14, h: 12, px: 5, py: 7, variants: ['open', 'blink', 'hurt'], draw: (p, v) => head(p, v) },
    { id: 'legF', w: 10, h: 11, px: 3, py: 2, draw: (p) => leg(p, false) },
    { id: 'legB', w: 10, h: 11, px: 3, py: 2, draw: (p) => leg(p, true) },
    { id: 'armF', w: 8, h: 15, px: 3, py: 2, draw: (p) => arm(p, false) },
    { id: 'armB', w: 8, h: 15, px: 3, py: 2, draw: (p) => arm(p, true) },
    { id: 'ball', w: 26, h: 26, px: 13, py: 13, draw: (p) => ball(p) },
    { id: 'shine', w: 18, h: 14, px: 9, py: 7, draw: (p) => shine(p) },
  ];
}

const BODY = ['body', 'head', 'legF', 'legB', 'armF', 'armB'] as const;

/** The standing parts hidden and the ball shown (curled), or the reverse. */
function curled(p: Pose, on: boolean): void {
  for (const b of BODY) p.hidden(b, on);
  p.hidden('ball', !on).hidden('shine', !on);
}

export function ricochetRig(): RigDef {
  return {
    id: 'ricochet',
    parts: parts(),
    bones: [
      { id: 'body', x: 0, y: -8, part: 'shell', z: 20, dir: 1 },
      { id: 'legB', parent: 'body', x: -3.4, y: 0, part: 'legB', z: 6, dir: -1 },
      { id: 'legF', parent: 'body', x: 2.6, y: 0.4, part: 'legF', z: 30, dir: -1 },
      { id: 'armB', parent: 'body', x: 5, y: -7, part: 'armB', z: 8, dir: -1 },
      { id: 'head', parent: 'body', x: 10.4, y: -6, part: 'head', z: 26, dir: 1, blink: true },
      { id: 'armF', parent: 'body', x: 6.6, y: -5.6, part: 'armF', z: 40, dir: -1 },
      { id: 'ball', x: 0, y: -11, part: 'ball', z: 50, dir: 1 },
      { id: 'shine', x: 0, y: -11, part: 'shine', z: 51, dir: 1 },
    ],
    fallback: 'idle',
    alias: { swim: 'run', tread: 'idle', drown: 'hurt', watch: 'idle' },
    bounds: { left: -16, right: 18, top: -28, bottom: 2 },
    clips: {
      idle: {
        ms: 1600,
        loop: true,
        pose: (t, p) => {
          curled(p, false);
          const b = wave(t);
          p.move('body', 0, -b * 0.4).size('body', 1 + b * 0.012, 1 - b * 0.012);
          p.set('armF', 8 + b * 3).set('armB', 4 - b * 2).set('head', b * 2);
          p.set('legF', 4).set('legB', -4);
        },
      },
      run: {
        ms: 540,
        loop: true,
        pose: (t, p) => {
          curled(p, false);
          const s = wave(t);
          p.move('body', 0, -Math.abs(Math.cos(t * TAU)) * 1.2).set('body', 4 + s * 2);
          p.set('legF', s * 26).set('legB', -s * 26);
          p.set('armF', -s * 22 + 6).set('armB', s * 22);
          p.set('head', -3 - s * 2);
        },
      },
      jump: {
        ms: 300,
        loop: false,
        pose: (t, p) => {
          curled(p, false);
          p.set('legF', 30).set('legB', -12).set('armF', 120 + t * 20).set('armB', 100).set('head', -6).move('body', 0, -1);
        },
      },
      fall: {
        ms: 400,
        loop: true,
        pose: (t, p) => {
          curled(p, false);
          p.set('legF', 18).set('legB', -18).set('armF', 70 + wave(t) * 6).set('armB', 60).set('head', 4);
        },
      },
      land: {
        ms: 220,
        loop: false,
        pose: (t, p) => {
          curled(p, false);
          const k = 1 - t;
          p.size('body', 1 + k * 0.12, 1 - k * 0.14).move('body', 0, k * 1.5).set('armF', 20).set('armB', 10);
        },
      },
      bashA: {
        ms: 200,
        loop: false,
        pose: (t, p) => {
          curled(p, false);
          const k = Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5);
          p.set('body', 10 * k).set('armF', 20 + 80 * k).set('armB', -10).set('legF', 14 * k).set('legB', -12).set('head', -4);
        },
      },
      bashB: {
        ms: 200,
        loop: false,
        pose: (t, p) => {
          curled(p, false);
          const k = Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5);
          p.set('body', 8 * k).set('armB', 10 + 85 * k).set('armF', -14).front('armB', 45).set('legB', 12 * k).set('legF', -10).set('head', -3);
        },
      },
      slam: {
        ms: 300,
        loop: false,
        pose: (t, p) => {
          curled(p, false);
          // Up and back, then the whole shell thrown forward.
          const up = t < 0.4;
          const k = up ? t / 0.4 : (t - 0.4) / 0.6;
          if (up) p.set('body', -12 * k).set('armF', 150 * k).set('armB', 140 * k).move('body', 0, -2 * k);
          else p.set('body', -12 + 42 * k).set('armF', 150 - 60 * k).set('armB', 140 - 60 * k).move('body', 2 * k, 1.5 * k).set('head', -10 * k);
          p.set('legF', 18).set('legB', -16);
        },
      },
      roll: {
        ms: 520,
        loop: true,
        pose: (t, p) => {
          curled(p, true);
          // Facing right, the ball turns clockwise as it rolls forward.
          p.set('ball', t * 360);
        },
      },
      hurt: {
        ms: 300,
        loop: false,
        pose: (_t, p) => {
          curled(p, false);
          p.set('body', -14).set('head', -12).show('head', 'hurt').set('armF', -30).set('armB', -40).set('legF', 20).set('legB', 8);
        },
      },
      defeat: {
        ms: 600,
        loop: false,
        pose: (t, p) => {
          curled(p, false);
          // Over onto his shell, legs kicking.
          p.set('body', -90 * Math.min(1, t * 2)).move('body', -4 * t, 5 * t).show('head', 'hurt');
          p.set('legF', 60 + wave(t * 3) * 20).set('legB', 50 - wave(t * 3) * 20).set('armF', 70).set('armB', 60);
        },
      },
    },
  };
}
