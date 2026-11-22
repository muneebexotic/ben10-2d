import type { CartoonManifest } from './types';

/**
 * Chapter 8's cast (all original designs, painted in code): Cacklejack's
 * goons and traps, the balloon hounds, the stilt walkers, and the big top's
 * stars (CACKLEJACK himself, IRONJAW the strongman, THE TANGLE).
 */

/** A grinner: a stocky clown goon in a two-tone suit, a painted-on grin and a tiny bowler, a cream pie in hand. */
export const GRINNER_CARTOON: CartoonManifest = {
  id: 'grinner',
  name: 'GRINNER',
  sheets: [{ texture: 'circus-grinner', frame: { w: 30, h: 34, feetY: 33 } }],
  colors: { face: 0xf6f0f8, suitA: 0x8ad83a, suitB: 0x7a3aa8, glove: 0xffffff, shoe: 0xd8324a, hat: 0x2a2238, mouth: 0xd8324a },
  clips: { idle: 'rocking on his big shoes, chuckling', walk: 'a flapping waddle', windup: 'the pie held up and back (the tell)', throw: 'the pie flung', hurt: 'knocked back' },
};

/** A jack-in-the-box: a painted crate with a crank; inside, a little jack on a spring with a boxing glove. */
export const JACKBOX_CARTOON: CartoonManifest = {
  id: 'jackbox',
  name: 'JACK-IN-THE-BOX',
  sheets: [{ texture: 'circus-jackbox', frame: { w: 26, h: 26, feetY: 25 } }],
  colors: { box: 0x3a6ad8, boxLight: 0x8ab0ff, trim: 0xf2c24a, crank: 0xc8c0d0, jack: 0xf6f0f8, nose: 0xd8324a },
  clips: { idle: 'shut, the crank still', wind: 'the crank spinning, the box shaking, the lid bulging (the tell)', pop: 'the lid flung open, the jack out on its spring', jammed: 'the crank snapped off, smoke out of the lid' },
};

/** A balloon hound: a dog twisted from long balloons, squeaking. */
export const HOUND_CARTOON: CartoonManifest = {
  id: 'hound',
  name: 'BALLOON HOUND',
  sheets: [{ texture: 'circus-hound', frame: { w: 30, h: 24, feetY: 16 } }],
  colors: { balloon: 0xd85ad8, balloonLight: 0xffb0ff, balloonDark: 0x8a2a8a, knot: 0x6a1a6a },
  clips: { float: 'bobbing in the air, tail wagging', stretch: 'stretching long, squeaking (the tell)', swoop: 'diving along a line' },
};

/** A stilt walker: a lanky clown in a striped shirt on two long stilts with tiny shoes. */
export const STILTS_CARTOON: CartoonManifest = {
  id: 'stilts',
  name: 'STILT WALKER',
  sheets: [{ texture: 'circus-stilts', frame: { w: 36, h: 64, feetY: 63 } }],
  colors: { face: 0xf6f0f8, shirtA: 0xf4e8d0, shirtB: 0xd8324a, pants: 0x2a6ab8, stilt: 0xc8a070, stiltDark: 0x8a6040, hair: 0xff8a2a },
  clips: { walk: 'long, slow strides on the stilts', windup: 'one stilt drawn back (the tell)', kick: 'the stilt swept along the floor', topple: 'a stilt knocked out: falling over', down: 'down on the floor, crawling' },
};

/**
 * CACKLEJACK: a tall, thin ringmaster with a porcelain-white painted face that never stops grinning,
 * a crooked top hat with a spring inside, a coat of purple and acid-green diamonds, long gloved fingers,
 * and a cane that turns into a pogo stick. He feeds on fear.
 */
export const CACKLEJACK_CARTOON: CartoonManifest = {
  id: 'cacklejack',
  name: 'CACKLEJACK',
  sheets: [],
  colors: { face: 0xf8f4fa, faceShade: 0xc8c0d8, coatA: 0x6a2aa8, coatB: 0x9aff3a, coatDark: 0x3a1460, glove: 0xffffff, hat: 0x2a1a3a, band: 0x9aff3a, cane: 0xf2c24a, mouth: 0x8a0a2a, eye: 0x9aff3a },
  clips: {
    idle: 'swaying, twirling his cane', walk: 'a gliding showman\'s strut', laugh: 'head thrown back, cackling', bow: 'a deep bow, hat off (his punish window)',
    throw: 'a pie flung overarm', pogo: 'bouncing on his cane, a spring at its foot', swing: 'hanging from a trapeze by his knees', hurt: 'reeling, grin slipping',
    inflate: 'swelling up, cheeks puffed', defeat: 'deflated in a heap', talk: 'patter',
  },
};

/** IRONJAW: a huge strongman with an iron plate for a jaw, a striped singlet, a shaved head and a topknot. */
export const IRONJAW_CARTOON: CartoonManifest = {
  id: 'ironjaw',
  name: 'IRONJAW',
  sheets: [],
  colors: { skin: 0xe8a878, skinShade: 0xb8784a, singletA: 0xd8324a, singletB: 0xf4e8d0, iron: 0x8a8aa0, ironLight: 0xd0d0e0, hair: 0x2a1a14, belt: 0x2a2238, buckle: 0xf2c24a },
  clips: { idle: 'flexing', walk: 'a stomping walk', throw: 'a kettlebell hurled', stomp: 'a stomp that shakes the ring', carry: 'carrying someone overhead', dazed: 'flat on his back, stars round his head' },
};

/** THE TANGLE: a contortionist in a teal and pink leotard and a domino mask, limbs that stretch like taffy. */
export const TANGLE_CARTOON: CartoonManifest = {
  id: 'tangle',
  name: 'THE TANGLE',
  sheets: [],
  colors: { skin: 0xd8b8e8, leoA: 0x3ac8c0, leoB: 0xff7ad8, mask: 0x2a1a3a, hair: 0x1a1a2a },
  clips: { idle: 'twisting into a knot and out again', swing: 'swinging on a trapeze', reach: 'an arm stretched out long (the tell: a red line first)', grab: 'the arm snapping back with whatever it caught', dazed: 'tangled up in herself' },
};

/** Cacklejack blown up into a giant balloon of his own face (the boss's third stage): a grin that drops open on his laugh, a valve in its throat. */
export const BIGHEAD_CARTOON: CartoonManifest = {
  id: 'bighead',
  name: 'THE BIG HEAD',
  sheets: [],
  colors: { face: 0xf8f4fa, mouth: 0x8a0a2a, valve: 0xf2c24a },
  clips: { shut: 'swelling, grin shut', quiver: 'lips quivering, a red glow inside (the tell)', open: 'the jaw dropped open, the valve showing', pop: 'popped: spinning away as it deflates' },
};
