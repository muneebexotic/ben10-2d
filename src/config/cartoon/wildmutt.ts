import type { CartoonManifest } from './types';

/** Wildmutt: a Vulpimancer. A heavy orange beast on all fours, no eyes at all, a huge jaw full of teeth, gills on his neck he smells through, dark spiky fur down his spine, the Omnitrix on his shoulder. */
export const WILDMUTT_CARTOON: CartoonManifest = {
  id: 'wildmutt',
  name: 'WILDMUTT',
  sheets: [{ texture: 'wildmutt', frame: { w: 60, h: 48, feetY: 39 } }],
  colors: {
    fur: 0xe8842c,
    light: 0xffb45a,
    dark: 0xa4501c,
    deep: 0x6a2e12,
    mouth: 0x3a0a14,
    tongue: 0xd8466a,
    teeth: 0xfff4e0,
    gill: 0xffd8a0,
    claw: 0xf4ecd8,
    omnitrix: 0x5dff5a,
  },
  clips: {
    idle: 'breathing hard, gills flaring, sniffing the air', run: 'a rotary gallop: gather, stretch, land', jump: 'springing up', fall: 'paws out', land: 'a crouching landing',
    clawA: 'a rake with the near paw', clawB: 'a rake with the far paw', clawC: 'rearing up for a double rake', pounce: 'the pounce: stretched flat out, claws first',
    hurt: 'knocked back, jaw wide', defeat: 'down on his side', climb: 'crawling up a wall', cling: 'clinging to a wall, sniffing',
    swim: 'dog-paddling', tread: 'paddling in place, head up', drown: 'thrashing',
    talk: 'growling', sniff: 'nose to the floor, sniffing', howl: 'head back, howling', cheer: 'bouncing, tail going',
  },
};
