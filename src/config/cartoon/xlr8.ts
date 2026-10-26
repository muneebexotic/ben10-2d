import type { CartoonManifest } from './types';

/** XLR8: a Kinecelerantan. A lean blue raptor leaning into every move, a black visor that slides over his face, a long striped tail, ball feet he rolls on. */
export const XLR8_CARTOON: CartoonManifest = {
  id: 'xlr8',
  name: 'XLR8',
  sheets: [{ texture: 'xlr8', frame: { w: 40, h: 30, feetY: 29 } }],
  colors: {
    navy: 0x1a2c5e,
    body: 0x3462bc,
    bodyLight: 0x6a98e8,
    blue: 0x52a4ff,
    light: 0xb8e6ff,
    visor: 0x0b0d17,
    glint: 0x8fb8ff,
    face: 0x5ab0ff,
    mouth: 0x0e1430,
    claw: 0xeef4ff,
    ball: 0x10141e,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 240, stride: 52, armSwing: 18, runLean: 42, bounce: 0.6, idleMs: 900, idleSway: 3, weight: 0.1, armRest: 12 },
  clips: {
    idle: 'bouncing on his ball feet, tail flicking, claws ready', run: 'a blur of a run: leaning flat out, feet a spin, speed streaks', jump: 'a springy push off', fall: 'tail up for balance', land: 'a skidding landing',
    strikeA: 'a claw slash with the near hand', strikeB: 'a claw slash with the far hand', kick: 'a high kick', dash: 'the dash: flat out, streaks everywhere',
    hurt: 'knocked back, tail up', defeat: 'down, dazed', swim: 'kicking along like a torpedo', tread: 'running in place on the water', drown: 'thrashing',
    talk: 'talking fast', point: 'pointing', cheer: 'arms up', surprise: 'jolted',
  },
};
