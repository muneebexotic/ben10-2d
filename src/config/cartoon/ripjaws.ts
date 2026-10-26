import type { CartoonManifest } from './types';

/**
 * Ripjaws: a Piscciss Volann. A pale grey fish-man: a huge head that is mostly
 * jaw and fangs (an underbite), small fierce yellow-green eyes, a lure on a
 * stalk over his brow, gill slits and a gill fin, a dorsal fin, finned
 * forearms and webbed claws, a black wetsuit with a white chest panel and the
 * Omnitrix on it, and a powerful tail with a forked fin where legs would be.
 */
export const RIPJAWS_CARTOON: CartoonManifest = {
  id: 'ripjaws',
  name: 'RIPJAWS',
  sheets: [{ texture: 'ripjaws', frame: { w: 44, h: 40, feetY: 38 } }],
  colors: {
    skin: 0xb4c2cc,
    skinLight: 0xe2ecf2,
    skinDark: 0x5c6e80,
    skinDeep: 0x3a4858,
    belly: 0xf2f0e6,
    suit: 0x1a1c26,
    suitLight: 0x40465a,
    white: 0xf2f4f8,
    fin: 0x8ea4b8,
    finLight: 0xcfe0ec,
    eye: 0xd0f048,
    eyeDark: 0x5a7a10,
    mouth: 0x3a0c18,
    tongue: 0xc84860,
    teeth: 0xfffef4,
    lure: 0x7ff0e0,
    lureCore: 0xeafffa,
    omnitrix: 0x5dff5a,
  },
  style: { runMs: 380, stride: 0, armSwing: 20, runLean: 8, bounce: 2.4, idleMs: 1200, idleSway: 3, weight: 0.4, armRest: 16 },
  clips: {
    idle: 'on dry land: balanced on his tail, gills flaring, jaw working', run: 'hopping along on his tail, big springy bounds', jump: 'a tail-spring push off', fall: 'tail curling, arms out', land: 'squashing down on his tail',
    swim: 'swimming flat out: body level, tail beating, arms swept back', tread: 'hanging in the water, tail waving, hands sculling', dash: 'RIP DASH: a torpedo, jaws first, tail a blur',
    biteA: 'a snapping chomp', biteB: 'the lunging CHOMP, jaws as wide as they go', swimBite: 'a bite on the move in the water', whip: 'the tail whip: a full spin, tail out', gasp: 'out of water: gasping, a hand at his gills',
    hurt: 'knocked back, jaw open', defeat: 'down, flopping', drown: 'thrashing',
    roar: 'the discovery: arms flung wide, jaws wide open, lure blazing', talk: 'talking through a mouthful of fangs', cheer: 'fists up, grinning fangs', point: 'pointing', surprise: 'eyes wide',
  },
};
