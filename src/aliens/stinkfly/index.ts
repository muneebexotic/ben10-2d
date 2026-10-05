import { STINKFLY, STINKFLY_FEEL, STINKFLY_MOTOR } from '../../config/aliens/stinkfly';
import type { FormDefinition } from '../types';
import { StinkflyAbilities } from './abilities';
import { STINKFLY_ANIMS, STINKFLY_ASSETS, STINKFLY_COLORS, STINKFLY_FRAME, STINKFLY_TEX } from './art';
import { STINKFLY_MUSIC, stinkflyTransform } from './audio';

/** Stinkfly: limited flight, slime that slows and gums enemies, and stink clouds that fire sets off. */
export const STINKFLY_FORM: FormDefinition = {
  id: 'stinkfly',
  name: 'STINKFLY',
  kind: 'alien',
  unlockChapter: 3,
  texture: STINKFLY_TEX.sheet,
  animPrefix: 'stinkfly',
  frame: STINKFLY_FRAME,
  motor: STINKFLY_MOTOR,
  feel: STINKFLY_FEEL,
  maxFormHealth: STINKFLY.maxFormHealth,
  theme: {
    color: STINKFLY_COLORS.light,
    light: 0xf2ff9a,
    dark: 0x2e3e14,
    burst: 'slime',
    shieldLabel: 'SHELL',
    slam: 'buzz',
  },
  hudIcon: STINKFLY_TEX.icon,
  touchIcons: { attack: STINKFLY_TEX.touchAttack, special: STINKFLY_TEX.touchSpecial },
  quips: {
    transform: ['STINKFLY! SMELL YA LATER!', 'TIME TO RAISE A STINK!', 'GROSS? NO. AWESOME.', 'BUZZ OFF, BAD GUYS!'],
    revert: [],
    swap: ['SLIME TIME!', 'INCOMING GOO!', 'FLY BY!'],
    misfire: {
      wanted: {
        heatblast: ['I WANTED FIRE AND GOT... GAS. CLOSE?', 'FLAMMABLE GAS. NOT FLAMES. THANKS, WATCH.'],
        xlr8: ['I CAN FLY, BUT NOT FAST!', 'BUZZ... THAT\'S NOT THE SOUND OF SPEED.'],
        fourarms: ['FOUR ARMS? I GOT SIX LEGS. FAIR TRADE?', 'TINY ARMS! WHY ALWAYS TINY ARMS?!'],
        wildmutt: ['I WANTED A NOSE, NOT A... SMELL.', 'WRONG ANIMAL! THESE EYES ARE ON STICKS!'],
        upgrade: ['A BUG. IN THE SYSTEM. GET IT?', 'I WANTED IN THE MACHINE, NOT TO GUM IT!'],
      },
      any: ['A BUG?! I WANTED A HERO, NOT A PEST!'],
    },
  },
  tips: {
    intro: { id: 'stinkfly', text: '{JUMP} IN THE AIR: FLY   {J} SLIME   {K} STINK', ms: 7500, priority: 5, doneAfter: { action: 'fly', count: 2 } },
    advanced: { id: 'stinkfly-gum', text: 'THREE QUICK GLOBS GUM A MUTANT IN PLACE', ms: 6500, priority: 4, afterKills: 2, doneAfter: { action: 'gummed', count: 1 } },
  },
  unlock: { tagline: 'GROSS. GLORIOUS. AIRBORNE.', traits: ['FLIES UNTIL HIS WINGS TIRE', 'SLIME SLOWS, STINK CHOKES'] },
  moves: ['{JUMP} IN THE AIR: FLY  (HOLD TO CLIMB)', '{DOWN} WHILE FLYING: DIVE', '{J}: SLIME  (3 QUICK GLOBS GUM A FOE)', '{K}: STINK CLOUD  (FIRE SETS IT OFF!)'],
  audio: { transform: stinkflyTransform, music: STINKFLY_MUSIC },
  art: { assets: STINKFLY_ASSETS, anims: STINKFLY_ANIMS },
  // A normal jump, then up to ~2 s of flapping: tall shafts and long gaps are his.
  reach: { jumpUp: 11, jumpAcross: 13, canBurn: false, canSmash: false, canRunWater: false },
  copy: { style: 'flyer', tell: 'spit', attack: 'spit', air: 'fly', cheer: 'A GIANT BUG! ...IT SMELLS LIKE MY GYM BAG.' },
  createAbilities: () => new StinkflyAbilities(),
};
