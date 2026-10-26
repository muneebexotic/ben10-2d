import { WARDEN_CARTOON } from '../../../../../config/cartoon/warden';
import { plumberBadge } from '../../plumber/baseArt';
import { INK, LINE, type Paint } from '../../paint';
import { keyframes } from '../../humanoid';
import { RigInfo, wave, type PartSpec, type RigDef } from '../../rig';

const C = WARDEN_CARTOON.colors;

/** The sentry's steel ball: lit from the top left, the yellow band round its middle, rivets, the badge. */
function shell(p: Paint): void {
  const ball = p.circle(0, 0, 9.4);
  p.shape(ball, { fill: { radial: [-3.4, -4.2, 0.5, 0, 0, 10.4], stops: [[0, C.steelLight], [0.55, C.steel], [1, C.steelDark]] }, ink: LINE * 1.1, light: 0xffffff, lightDepth: 0.7, lightAlpha: 0.5, gloss: { x: -3.6, y: -5.0, rx: 2.6, ry: 1.3, alpha: 0.5, angle: -0.5 } });
  p.within(ball, () => {
    // The lower hull: a darker cap with vents.
    p.fill(p.ellipse(0, 8.6, 11, 5.2), C.steelDark, 0.75);
    for (let i = -2; i <= 2; i++) p.line([i * 2.2, 5.6, i * 2.2 + 0.4, 7.4], LINE * 0.5, 0x10141e, false, 0.8);
    // The trim band, curving round the ball.
    p.line([-9.6, 0.6, -4, 2.6, 2, 2.8, 9.6, 0.8], 2.0, INK, true);
    p.line([-9.6, 0.6, -4, 2.6, 2, 2.8, 9.6, 0.8], 1.3, C.trim, true);
    // A seam and rivets on the dome.
    p.line([-7.6, -4.6, -3, -7.6, 3.4, -7.8, 7.6, -4.8], LINE * 0.4, 0x1a2234, true, 0.7);
    for (const [x, y] of [[-6.2, -2.2], [-3.4, -4.4], [-7.4, 3.6]] as const) p.fill(p.circle(x, y, 0.45), 0x1a2234);
  });
  plumberBadge(p, -3.6, -0.6, 2.2);
}

/** The big camera lens (its glass green on patrol, red when it locks). */
function lens(p: Paint, v: string): void {
  const color = v === 'red' ? C.red : C.green;
  p.shape(p.circle(0, 0, 4.6), { fill: { linear: [-4, -4, 4, 4], stops: [[0, C.steelLight], [1, C.steelDark]] }, ink: LINE });
  const glass = p.circle(0.3, 0, 3.4);
  p.shape(glass, { fill: { radial: [0.6, 0, 0.2, 0.3, 0, 3.4], stops: [[0, 0xffffff], [0.25, color], [1, C.lens]] }, ink: LINE * 0.6 });
  p.glow(0.6, 0, 6, color, v === 'red' ? 0.7 : 0.45);
  p.within(glass, () => {
    p.fill(p.circle(0.9, 0, 1.0), INK, 0.85);
    p.fill(p.ellipse(-1.0, -1.4, 1.2, 0.6, -0.5), 0xffffff, 0.75);
  });
}

/** A stubby stabiliser fin. */
function fin(p: Paint, far: boolean): void {
  const f = p.smooth([0, 1.6, -1.2, -1.4, -5.6, -3.8, -6.6, -2.4, -3.4, 1.8], true, 0.3);
  p.shape(f, { fill: { linear: [0, 0, -6, -3], stops: [[0, far ? C.steelDark : C.steel], [1, far ? 0x1e2638 : C.steelDark]] }, ink: LINE * 0.8, light: C.steelLight, lightDepth: 0.4, lightAlpha: far ? 0.2 : 0.5 });
  p.line([-1.4, -1.0, -5.8, -3.2], LINE * 0.8, C.trim, true, far ? 0.5 : 0.9);
}

/** The stun emitter under its chin. */
function barrel(p: Paint): void {
  p.shape(p.rrect(-1.6, -1.6, 6, 3.2, 1.2), { fill: { linear: [0, -1.6, 0, 1.6], stops: [[0, C.steelLight], [1, C.steelDark]] }, ink: LINE * 0.8 });
  p.shape(p.rrect(3.6, -2.0, 1.8, 4.0, 0.6), { fill: C.steelDark, ink: LINE * 0.6 });
  p.fill(p.circle(5.6, 0, 0.9), C.red);
  p.glow(5.6, 0, 2.4, C.red, 0.5);
}

/** Its thruster glow (two flickers). */
function jet(p: Paint, v: string): void {
  const long = v === 'b';
  p.glow(0, 2.6, long ? 5.6 : 4.6, C.jet, 0.55);
  p.fill(p.smooth([-2.0, 0, 2.0, 0, 0.6, long ? 6.4 : 5.0, -0.6, long ? 6.4 : 5.0], true, 0.4), { linear: [0, 0, 0, 6], stops: [[0, 0xffffff, 0.95], [1, C.jet, 0]] });
}

function antenna(p: Paint, v: string): void {
  p.line([0, 0, 0.4, -4.6], LINE * 1.3, INK);
  p.line([0, 0, 0.4, -4.6], LINE * 0.6, C.steelLight);
  const on = v === 'on';
  if (on) p.glow(0.4, -5.2, 2.6, C.red, 0.7);
  p.shape(p.circle(0.4, -5.2, 0.9), { fill: on ? 0xffa0a0 : 0x6a2a2a, ink: LINE * 0.5 });
}

function parts(): PartSpec[] {
  return [
    { id: 'shell', w: 22, h: 22, px: 11, py: 11, draw: shell },
    { id: 'lens', w: 16, h: 16, px: 8, py: 8, variants: ['green', 'red'], draw: lens },
    { id: 'finT', w: 9, h: 8, px: 7.5, py: 5, draw: (p) => fin(p, false) },
    { id: 'finR', w: 9, h: 8, px: 7.5, py: 5, draw: (p) => fin(p, true) },
    { id: 'barrel', w: 9, h: 6, px: 2.5, py: 3, draw: barrel },
    { id: 'jet', w: 12, h: 13, px: 6, py: 1.5, variants: ['a', 'b'], draw: jet },
    { id: 'antenna', w: 6, h: 9, px: 2.5, py: 7.5, variants: ['off', 'on'], draw: antenna },
  ];
}

/** The Plumber sentry's HD rig (Chapter 7): a floating ball with a camera lens for an eye. */
export function wardenRig(): RigDef {
  const draft: RigDef = {
    id: 'warden',
    parts: parts(),
    bones: [
      { id: 'body', x: 0, y: 0, part: 'shell', z: 20, dir: 1 },
      { id: 'jet', parent: 'body', x: -0.6, y: 8.4, part: 'jet', z: 2, dir: -1, cycle: { variants: ['a', 'b'], fps: 14 } },
      { id: 'finR', parent: 'body', x: -6.4, y: 1.4, part: 'finR', z: 6, dir: 1 },
      { id: 'antenna', parent: 'body', x: -2.6, y: -8.8, part: 'antenna', z: 8, dir: 1, cycle: { variants: ['off', 'on'], fps: 1.5 } },
      { id: 'barrel', parent: 'body', x: 3.4, y: 6.6, part: 'barrel', z: 15, dir: 1 },
      { id: 'finT', parent: 'body', x: -2.4, y: -6.6, part: 'finT', z: 24, dir: 1 },
      { id: 'lens', parent: 'body', x: 5.2, y: -1.0, part: 'lens', z: 30, dir: 1 },
    ],
    clips: {},
    fallback: 'idle',
    bounds: { left: -16, right: 16, top: -16, bottom: 16 },
  };
  const info = new RigInfo(draft);
  const fireKeys = keyframes(info, [
    [0, { body: { a: -16, x: -2.4 }, lens: { v: 'red', x: 0.4 }, barrel: { x: -1.4 }, finR: -24, finT: -12 }],
    [0.4, { body: { a: -6, x: -1 }, lens: { v: 'red' }, barrel: { x: -0.4 }, finR: -10, finT: -4 }],
    [1, { body: 0, lens: { v: 'red' } }],
  ]);
  return {
    ...draft,
    clips: {
      idle: {
        ms: 1800,
        loop: true,
        pose: (t, p) => {
          p.move('body', 0, wave(t) * 0.7).set('body', wave(t, 0.25) * 4);
          p.move('lens', wave(t * 2, 0.1) * 0.5, wave(t, 0.4) * 0.4);
          p.set('finR', wave(t * 2) * 14).set('finT', wave(t * 2, 0.3) * 8).set('antenna', -wave(t, 0.25) * 10);
        },
      },
      lock: {
        ms: 320,
        loop: true,
        pose: (t, p) => {
          p.set('body', 12 + wave(t) * 1.5).move('body', 1, 0);
          p.show('lens', 'red').move('lens', 0.6, 0);
          p.set('finR', -26 + wave(t * 2) * 6).set('finT', -16);
          p.set('antenna', -18).show('antenna', 'on');
        },
      },
      fire: { ms: 260, loop: false, pose: (t, p) => p.keys(fireKeys, t) },
    },
  };
}
