import type { CartoonManifest } from './types';

/** Heatblast: a Pyronite. Plates of dark magma rock with lava glowing in the seams, a living flame for a head with a face in it, a burning V on his chest around the Omnitrix. */
export const HEATBLAST_CARTOON: CartoonManifest = {
  id: 'heatblast',
  name: 'HEATBLAST',
  sheets: [{ texture: 'heatblast', frame: { w: 32, h: 36, feetY: 35 } }],
  colors: {
    rock: 0x5e1e12,
    rockLight: 0x8e3a22,
    rockShade: 0x2a0a08,
    lava: 0xffa22a,
    lavaHot: 0xfff07a,
    lavaDeep: 0xe0401a,
    flameCore: 0xfffbd0,
    flame: 0xffd23a,
    flameMid: 0xff9a22,
    flameOuter: 0xe8461a,
    face: 0x3a0e06,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 400, stride: 40, armSwing: 46, runLean: 12, bounce: 1, idleMs: 1300, idleSway: 3, weight: 0.3, armRest: 10 },
  clips: {
    idle: 'a flickering stance, head ablaze', run: 'a run cycle, flames streaming back', jump: 'push off', fall: 'arms out, flames up', land: 'landing',
    shoot: 'a fireball from the near hand', charge: 'both hands drawn in, charging a burst, flames roaring', rocket: 'rocket jump: arms down, fire from the feet',
    hurt: 'knocked back, flame gutters', defeat: 'down, embers', swim: 'swimming in a cloud of steam (he hates water)', tread: 'treading water, hissing', drown: 'sputtering',
  },
};
