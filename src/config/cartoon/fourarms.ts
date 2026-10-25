import type { CartoonManifest } from './types';

/** Four Arms: a Tetramand. Huge and red, four arms, four yellow eyes, a black topknot, black pants with the Omnitrix on the belt, bare three-toed feet. */
export const FOURARMS_CARTOON: CartoonManifest = {
  id: 'fourarms',
  name: 'FOUR ARMS',
  sheets: [{ texture: 'fourarms', frame: { w: 52, h: 48, feetY: 47 } }],
  colors: {
    skin: 0xdc4a3a,
    skinLight: 0xff8a6a,
    skinShade: 0x9a2a22,
    skinDeep: 0x6a1a18,
    pants: 0x22202c,
    pantsLight: 0x3c3848,
    band: 0xf2f2ea,
    eye: 0xffe14a,
    hair: 0x18141e,
    mouth: 0x5a1416,
    teeth: 0xfff8ea,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 560, stride: 30, armSwing: 34, runLean: 10, bounce: 1.4, idleMs: 1700, idleSway: 2, weight: 0.85, armRest: 14 },
  clips: {
    idle: 'a heavy stance, four fists ready, chest heaving', run: 'a pounding run, all four arms pumping', jump: 'a heavy push off', fall: 'arms spread', land: 'a ground-shaking landing',
    punchA: 'a jab with the upper near arm', punchB: 'a jab with the lower near arm', haymakerUp: 'winding up the haymaker', haymaker: 'the haymaker: everything behind one swing',
    clap: 'the overhead clap', slamUp: 'leaping up for the ground slam, all arms raised', slam: 'the ground slam', meteor: 'the meteor drop: plunging fists first',
    carry: 'holding something overhead', carryRun: 'running with it overhead', throw: 'hurling it', hurt: 'knocked back (barely)', defeat: 'down',
    swim: 'striding along the bottom, arms paddling (he sinks)', tread: 'standing on the bottom, arms paddling', drown: 'out of air',
  },
};
