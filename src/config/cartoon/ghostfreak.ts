import type { CartoonManifest } from './types';

/** Ghostfreak: an Ectonurite. A pale grey ghost with black stripes, a hooded skull of a head with one huge violet eye and a stitched jaw, long thin arms with hooked claws, a misty tail for legs, pink tentacles from his chest, the Omnitrix on his chest. */
export const GHOSTFREAK_CARTOON: CartoonManifest = {
  id: 'ghostfreak',
  name: 'GHOSTFREAK',
  sheets: [{ texture: 'ghostfreak', frame: { w: 36, h: 40, feetY: 39 } }],
  colors: {
    body: 0xe6eaf2,
    face: 0xf6f8ff,
    shade: 0xaab0c4,
    deep: 0x6e7290,
    stripe: 0x15141f,
    eye: 0xb070ff,
    eyeGlow: 0xd8a8ff,
    tentacle: 0xe070c8,
    tentacleDark: 0x8a2a78,
    glow: 0xc8b8ff,
    claw: 0x2a2836,
    rim: 0x1a1428,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 700, stride: 0, armSwing: 14, runLean: 14, bounce: 0.6, idleMs: 2000, idleSway: 4, weight: 0, armRest: 14 },
  clips: {
    idle: 'floating, tail curling, claws twitching', run: 'drifting fast, tail streaming back', jump: 'rising', fall: 'drifting down, arms up', land: 'settling',
    lash: 'tentacles whipping out of his chest', lashLong: 'a long lash', phase: 'arms wrapped round himself, phasing', scream: 'the scream: arms flung wide, jaw gaping',
    hurt: 'recoiling, eye shut', defeat: 'fading, slumped', swim: 'drifting as if the water were not there', tread: 'hanging in the water', drown: 'thrashing (he does not need air)',
    talk: 'a whisper', point: 'a long claw pointing', cheer: 'arms up', surprise: 'eye wide', think: 'claw at his jaw',
  },
};
