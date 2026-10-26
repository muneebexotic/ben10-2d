import { DIAMONDHEAD, DIAMONDHEAD_FEEL, DIAMONDHEAD_MOTOR } from '../../config/aliens/diamondhead';
import { SWIM } from '../../config/swim';
import { PALETTE } from '../../config/palette';
import type { FormDefinition } from '../types';
import { DiamondheadAbilities } from './abilities';
import { DIAMONDHEAD_ANIMS, DIAMONDHEAD_ASSETS, DIAMONDHEAD_FRAME, DIAMONDHEAD_TEX } from './art';
import { DIAMONDHEAD_MUSIC, diamondheadTransform } from './audio';

/**
 * Diamondhead: a Petrosapien, living crystal. Shards on J, a reflecting
 * shield on K (lasers bounce off it), crystal platforms on Up+K. Shrugs off
 * shots, cracks under a heavy hit.
 */
export const DIAMONDHEAD_FORM: FormDefinition = {
  id: 'diamondhead',
  name: 'DIAMONDHEAD',
  kind: 'alien',
  unlockChapter: 5,
  texture: DIAMONDHEAD_TEX.sheet,
  animPrefix: 'diamondhead',
  frame: DIAMONDHEAD_FRAME,
  motor: DIAMONDHEAD_MOTOR,
  feel: DIAMONDHEAD_FEEL,
  maxFormHealth: DIAMONDHEAD.maxFormHealth,
  theme: {
    color: PALETTE.diamondhead,
    light: PALETTE.diamondheadGlow,
    dark: PALETTE.diamondheadDark,
    burst: 'crystal',
    shieldLabel: 'CRYSTAL',
    slam: 'shatter',
  },
  hudIcon: DIAMONDHEAD_TEX.icon,
  touchIcons: { attack: DIAMONDHEAD_TEX.touchAttack, special: DIAMONDHEAD_TEX.touchSpecial },
  quips: {
    transform: ['DIAMONDHEAD!', 'ROCK SOLID!', 'CRYSTAL CLEAR!', "LET'S GET SHARP!"],
    first: "DIAMONDHEAD! ...WAIT, I'M A ROCK?!",
    revert: [],
    swap: ['CUT IN!', 'SHINE ON!', 'HARD SWAP!'],
    misfire: {
      wanted: {
        heatblast: ['I WANTED HOT. I GOT ROCKS.', "FIRE'S OUT. BEDAZZLED'S IN."],
        fourarms: ['FOUR ARMS? TWO ARMS. MADE OF GLASS.', 'I WANTED MUSCLE, NOT JEWELRY!'],
        xlr8: ["ROCKS DON'T RUN. LIKE, EVER.", 'XLR8? MORE LIKE XL-WEIGHT.'],
        wildmutt: ['NO NOSE. JUST A VERY SHINY HEAD.', 'I WANTED FUR, NOT FACETS!'],
        stinkfly: ["WINGS? NOPE. CRYSTALS DON'T FLY.", 'DIAMONDS ARE HEAVY. WHO KNEW.'],
        upgrade: ["I CAN'T MERGE WITH A ROCK. I AM A ROCK.", 'WANTED TECH. GOT GEOLOGY.'],
        ghostfreak: ["CAN'T PHASE THROUGH WALLS. I AM ONE.", 'TOO SOLID FOR GHOST STUFF.'],
        greymatter: ['TOO BIG FOR THE VENT. WAY TOO BIG.', 'WANTED A BRAIN. GOT A ROCK.'],
        ripjaws: ['I WANTED TO SWIM. I SINK LIKE A ROCK.', 'NO GILLS. VERY SHINY, THOUGH.'],
      },
      any: ["WELL, AT LEAST I'M PRETTY."],
    },
  },
  tips: {
    intro: { id: 'diamondhead', text: '{J} SHARDS   HOLD {K}: CRYSTAL SHIELD', ms: 8000, priority: 5, doneAfter: { action: 'shield', count: 1 } },
    advanced: { id: 'diamondhead-platform', text: '{UP}+{K}: GROW A CRYSTAL PLATFORM. TWO AT ONCE!', ms: 6500, priority: 4, afterKills: 2, doneAfter: { action: 'platform', count: 2 } },
  },
  unlock: { tagline: 'ROCK SOLID. LITERALLY.', traits: ['REFLECTS SHOTS AND LASERS', 'GROWS CRYSTAL PLATFORMS'] },
  moves: [
    'HOLD {J}: CRYSTAL SHARDS  ({UP}: AIM UP)',
    'HOLD {K}: CRYSTAL SHIELD, REFLECTS SHOTS',
    'SHIELD UP + {UP} OR DOWN: TILT THE BOUNCE',
    '{UP}+{K}: CRYSTAL PLATFORM (TWO AT ONCE)',
    'SHRUGS OFF LASERS. CRACKS UNDER A SMASH',
  ],
  audio: { transform: diamondheadTransform, music: DIAMONDHEAD_MUSIC },
  art: { assets: DIAMONDHEAD_ASSETS, anims: DIAMONDHEAD_ANIMS },
  // His two crystal platforms: one under his feet at the top of each jump (three ~4-tile jumps up), or two bridges over a gap.
  reach: { jumpUp: 9, jumpAcross: 11, canBurn: false, canSmash: false, canRunWater: false, canReflect: true },
  copy: { style: 'fire', tell: 'shoot', attack: 'shoot', cheer: "YOU'RE MADE OF DIAMONDS?! DO YOU KNOW WHAT THOSE SELL FOR?!" },
  damageScale: DIAMONDHEAD.damageScale,
  ride: { attack: 'shot', special: 'shield', back: DIAMONDHEAD_TEX.back, color: PALETTE.diamondhead },
  swim: SWIM.diamondhead,
  createAbilities: () => new DiamondheadAbilities(),
};
