import type { CartoonManifest } from './types';

/** Grey Matter: a Galvan. Tiny and grey, a head bigger than the rest of him swept back over a ridged brain-case, two huge glossy green eyes, a thin mouth with tiny teeth, a little black suit with the Omnitrix on the chest. */
export const GREYMATTER_CARTOON: CartoonManifest = {
  id: 'greymatter',
  name: 'GREY MATTER',
  sheets: [{ texture: 'greymatter', frame: { w: 22, h: 20, feetY: 19 } }],
  colors: {
    skin: 0x9aa2ac,
    skinLight: 0xc4ccd6,
    skinDark: 0x646a74,
    ridge: 0x7a828c,
    eye: 0x7ee04a,
    eyeDark: 0x2e6a1a,
    eyeGlow: 0xe0ffc8,
    pupil: 0x10161a,
    suit: 0x1a1d26,
    suitLight: 0x3a3f50,
    mouth: 0x3a1a22,
    tongue: 0xd86a7a,
    teeth: 0xf4f4ea,
    scan: 0x9fe870,
    rim: 0x14161c,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 260, stride: 44, armSwing: 50, runLean: 10, bounce: 0.5, idleMs: 1300, idleSway: 4, weight: 0, armRest: 10 },
  clips: {
    idle: 'a know-it-all stance, head tilting', run: 'a scurry of tiny steps', jump: 'a little hop', fall: 'arms flailing', land: 'a tiny landing',
    biteA: 'a nip', biteB: 'a lunging chomp', scan: 'ANALYZE: a finger to his temple, eyes blazing', hurt: 'knocked back', cheer: 'arms up, delighted with himself', defeat: 'down',
    swim: 'a tiny breaststroke', tread: 'treading water', drown: 'out of air', talk: 'lecturing', point: 'pointing out the obvious', shrug: 'a smug shrug', think: 'pondering', surprise: 'eyes huge',
  },
};
