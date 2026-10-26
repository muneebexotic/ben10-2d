import { RIPJAWS, RIPJAWS_FEEL, RIPJAWS_MOTOR } from '../../config/aliens/ripjaws';
import { PALETTE } from '../../config/palette';
import { SWIM } from '../../config/swim';
import type { FormDefinition } from '../types';
import { RipjawsAbilities } from './abilities';
import { RIPJAWS_ANIMS, RIPJAWS_ASSETS, RIPJAWS_FRAME, RIPJAWS_TEX } from './art';
import { RIPJAWS_MUSIC, ripjawsTransform } from './audio';

/**
 * Ripjaws: a Piscciss Volann. King of the deep, a fish out of water. In water
 * he's the fastest thing in the game; J bites (every third a lunging CHOMP),
 * K is RIP DASH, a torpedo that bites through a line. On land he hops on his
 * tail, K is a tail whip, and the Omnitrix runs down two and a half times as
 * fast. He swims the older chapters' water and mutagen too.
 */
export const RIPJAWS_FORM: FormDefinition = {
  id: 'ripjaws',
  name: 'RIPJAWS',
  kind: 'alien',
  unlockChapter: 7,
  texture: RIPJAWS_TEX.sheet,
  animPrefix: 'ripjaws',
  frame: RIPJAWS_FRAME,
  motor: RIPJAWS_MOTOR,
  feel: RIPJAWS_FEEL,
  maxFormHealth: RIPJAWS.maxFormHealth,
  theme: {
    color: PALETTE.ripjaws,
    light: PALETTE.ripjawsGlow,
    dark: PALETTE.ripjawsDark,
    burst: 'bubble',
    shieldLabel: 'SCALES',
    slam: 'splash',
  },
  hudIcon: RIPJAWS_TEX.icon,
  touchIcons: { attack: RIPJAWS_TEX.touchAttack, special: RIPJAWS_TEX.touchSpecial },
  quips: {
    transform: ['RIPJAWS!', 'SOMETHING SMELLS FISHY!', 'DINNER TIME!', 'SURF IS UP!'],
    first: 'RIPJAWS! ...OKAY, THESE TEETH ARE AWESOME.',
    revert: [],
    swap: ['FIN-TASTIC!', 'CHOMP TIME!', 'MAKING A SPLASH!'],
    misfire: {
      wanted: {
        heatblast: ['FIRE? I GOT GILLS. OPPOSITE DAY!', 'WANTED STEAM. GOT SUSHI.'],
        fourarms: ['FOUR ARMS? I HAVE TWO, AND A TAIL.', 'NO MUSCLES. JUST A LOT OF TEETH.'],
        xlr8: ['FAST? ONLY IF THERE IS WATER!', 'WANTED SPEED. GOT A FLOPPY TAIL.'],
        wildmutt: ['WRONG TEETH. WAY MORE TEETH.', 'I WANTED A NOSE, NOT A LURE.'],
        stinkfly: ['NO WINGS. FINS DO NOT COUNT!', 'WANTED TO FLY. GOT TO FLOP.'],
        upgrade: ['I WANTED TECH. I GOT A TAIL.', 'NOT WATERPROOF... OH WAIT, I AM.'],
        diamondhead: ['NO CRYSTALS. JUST CHOMPERS.', 'WANTED A SHIELD. GOT A SNORKEL FACE.'],
        ghostfreak: ['NOT A GHOST. A VERY DRY FISH.', 'SPOOKY? NO. SLIMY? YES.'],
        greymatter: ['BIG BRAIN? BIG MOUTH INSTEAD.', 'I WANTED SMART. I GOT HUNGRY.'],
      },
      any: ['A FISH?! WHERE IS THE WATER?!'],
    },
  },
  tips: {
    intro: { id: 'ripjaws', text: '{J} BITE   {K} TAIL WHIP (IN WATER: RIP DASH)', ms: 8000, priority: 5, doneAfter: { action: 'ripDash', count: 1 } },
    advanced: { id: 'ripjaws-land', text: 'OUT OF WATER THE WATCH DRAINS FAST: FIND WATER!', ms: 6500, priority: 4, afterKills: 1, doneAfter: { action: 'ripDash', count: 3 } },
  },
  unlock: { tagline: 'KING OF THE DEEP. A FISH OUT OF WATER.', traits: ['FASTEST SWIMMER, NO AIR NEEDED', 'ON LAND THE WATCH DRAINS FAST'] },
  moves: [
    'HOLD {J}: BITE (EVERY THIRD: A LUNGING CHOMP)',
    '{K}: TAIL WHIP. SPIN, SLAP, KNOCK SHOTS BACK',
    'IN WATER {K}: RIP DASH. {MOVE} AIMS IT',
    'IN WATER: THE FASTEST SWIMMER. NO AIR NEEDED',
    'ON LAND: HE HOPS, AND THE WATCH DRAINS x2.5',
    'SWAP IN: A BURST OF WATER KNOCKS THEM BACK',
  ],
  audio: { transform: ripjawsTransform, music: RIPJAWS_MUSIC },
  art: { assets: RIPJAWS_ASSETS, anims: RIPJAWS_ANIMS },
  reach: { jumpUp: 3, jumpAcross: 4, canBurn: false, canSmash: false, canRunWater: false, canSwim: true },
  copy: { style: 'pounce', tell: 'gasp', attack: 'biteB', cheer: "DUDE, YOU'RE A SHARK! A SHARK WITH A FLASHLIGHT!" },
  damageScale: { shot: 1, contact: 1 },
  ride: { attack: 'strike', special: null, back: RIPJAWS_TEX.back, color: PALETTE.ripjaws },
  swim: SWIM.ripjaws,
  landDrain: RIPJAWS.landDrain,
  createAbilities: () => new RipjawsAbilities(),
};
