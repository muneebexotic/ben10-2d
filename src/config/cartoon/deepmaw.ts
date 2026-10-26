import type { CartoonManifest } from './types';

/**
 * DEEPMAW (Chapter 7's boss, an original villain): a giant alien anglerfish
 * of a pirate. A huge round olive-black body with a pale warty belly, a
 * cavern of an underbite crammed with needle fangs, one bulging yellow eye,
 * a glowing lure on a jointed stalk, ragged fins and tail, a crimson captain's
 * coat in tatters with gold buttons, a battered tricorn with the lure poking
 * through it, and the broken stasis collar of Cell 7 round his front.
 */
export const DEEPMAW_CARTOON: CartoonManifest = {
  id: 'deepmaw',
  name: 'DEEPMAW',
  sheets: [],
  colors: {
    skin: 0x34504c,
    skinLight: 0x6a8a7a,
    skinDark: 0x16262a,
    belly: 0xb8c49a,
    bellyDark: 0x6a7a58,
    fin: 0x4a6a5a,
    finLight: 0x8aaa90,
    coat: 0xa8283a,
    coatDark: 0x5a1020,
    coatLight: 0xe0485a,
    gold: 0xe8c040,
    hat: 0x22202a,
    collar: 0x8a9ab0,
    collarDark: 0x3a4658,
    eye: 0xf8e84a,
    eyeDark: 0xa88a10,
    mouth: 0x2a0812,
    gum: 0x7a2a3a,
    teeth: 0xfffbea,
    lure: 0xd8ff4a,
    lureCore: 0xffffe0,
  },
  clips: {
    idle: 'hanging in the water: fins sculling, tail swaying, the lure bobbing',
    swim: 'cruising: tail sweeping, fins back',
    lure: 'baiting: the lure drifts out in front, swaying, jaws a little open',
    flare: 'the tell: the lure flares white and freezes, the body goes still',
    lunge: 'the lunge: jaws as wide as they go, everything thrown forward',
    spit: 'the lure flash: rearing back, the bulb blazing',
    stunned: 'lure hit: dazed, jaw hanging open (hit him now), eye spinning',
    flop: 'on dry deck: propped on his fins, flopping and gasping',
    slam: 'a tail slam: rearing up on his fins and crashing the tail down',
    roll: 'curled for the rolling chomp: fins tucked, jaws open',
    leap: 'a belly flop: launched up, fins spread',
    swallow: 'the maelstrom: jaws wide, sucking everything in',
    hurt: 'flinching back',
    defeat: 'beaten: belly up, eye shut, lure out',
    talk: 'gloating, jaw flapping', roar: 'a roar, jaws wide, lure blazing',
  },
};
