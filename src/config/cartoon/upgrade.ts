import type { CartoonManifest } from './types';

/** Upgrade: a Galvanic Mechamorph. A slim figure of black liquid metal traced with glowing green circuits, a smooth dome head with one big ringed eye, the Omnitrix at the heart of his chest circuit. */
export const UPGRADE_CARTOON: CartoonManifest = {
  id: 'upgrade',
  name: 'UPGRADE',
  sheets: [{ texture: 'upgrade', frame: { w: 32, h: 38, feetY: 37 } }],
  colors: {
    body: 0x16181f,
    body2: 0x2a2e3a,
    sheen: 0x5a6680,
    line: 0x3cffc0,
    glow: 0xc8fff0,
    dark: 0x0a8a66,
    rim: 0x1a8a70,
    ink: 0x061a16,
    pupil: 0x04060a,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 460, stride: 38, armSwing: 40, runLean: 10, bounce: 1.1, idleMs: 1600, idleSway: 3, weight: 0.2, armRest: 8 },
  clips: {
    idle: 'a loose, liquid sway, circuits pulsing', run: 'a rubbery run, limbs stretching', jump: 'push off', fall: 'arms up, stretching', land: 'a splashy landing that wobbles',
    laser: 'firing the eye beam ahead', laserUp: 'the eye beam up', laserDown: 'the eye beam down', merge: 'melting into a puddle of liquid metal and sliding along',
    hurt: 'knocked back, ripples through his body', defeat: 'down, circuits flickering', swim: 'sinking slowly, swimming in a liquid ripple', tread: 'bobbing upright', drown: 'thrashing (he does not need air)',
    talk: 'eye pulsing as he talks', point: 'pointing', cheer: 'arms up', surprise: 'eye wide', think: 'scanning',
  },
};
