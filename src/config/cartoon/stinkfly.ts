import type { CartoonManifest } from './types';

/** Stinkfly: a Lepidopterran. A lime-green insect with a round thorax, a long striped abdomen ending in a stinger, two yellow eyes on stalks, mandibles, four see-through wings and six thin legs, the Omnitrix on his thorax. */
export const STINKFLY_CARTOON: CartoonManifest = {
  id: 'stinkfly',
  name: 'STINKFLY',
  sheets: [{ texture: 'stinkfly', frame: { w: 48, h: 40, feetY: 37 } }],
  colors: {
    body: 0x9cc43c,
    light: 0xd4e83a,
    dark: 0x4e6a1c,
    belly: 0xe8e0a0,
    stripe: 0x2e3e14,
    eye: 0xffe44a,
    pupil: 0x1a1408,
    wing: 0xcff4ff,
    vein: 0x7fb0c8,
    stink: 0xa8c43a,
    omnitrix: 0x5dff5a,
  },
  clips: {
    idle: 'standing on six legs, eyestalks swaying, wings twitching', run: 'scuttling on six legs, wings buzzing', jump: 'a buzzing hop', fall: 'wings half open', land: 'touching down',
    fly: 'flying: wings a blur, legs tucked', glide: 'gliding on spread wings', spit: 'spitting slime from the eyestalks', vent: 'venting stink from the tail', hurt: 'knocked back, stalks recoiling', defeat: 'on his back, legs in the air',
    swim: 'soaked wings, paddling with his legs', tread: 'floating, legs paddling', drown: 'thrashing', talk: 'stalks bobbing', cheer: 'a happy buzz',
  },
};
