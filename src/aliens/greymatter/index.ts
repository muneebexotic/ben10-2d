import { GREYMATTER, GREYMATTER_FEEL, GREYMATTER_MOTOR } from '../../config/aliens/greymatter';
import { SWIM } from '../../config/swim';
import { PALETTE } from '../../config/palette';
import type { FormDefinition } from '../types';
import { GreyMatterAbilities } from './abilities';
import { GREYMATTER_ANIMS, GREYMATTER_ASSETS, GREYMATTER_FRAME, GREYMATTER_TEX } from './art';
import { GREYMATTER_MUSIC, greymatterTransform } from './audio';

/**
 * Grey Matter: a Galvan. Weak bites on J, ANALYZE on K (a weak point every
 * alien hits for triple damage: analyse, then swap to the muscle). Tiny
 * enough for vents and gaps a tile high, and he jumps very high for his size.
 */
export const GREYMATTER_FORM: FormDefinition = {
  id: 'greymatter',
  name: 'GREY MATTER',
  kind: 'alien',
  unlockChapter: 6,
  texture: GREYMATTER_TEX.sheet,
  animPrefix: 'greymatter',
  frame: GREYMATTER_FRAME,
  body: GREYMATTER.body,
  motor: GREYMATTER_MOTOR,
  feel: GREYMATTER_FEEL,
  maxFormHealth: GREYMATTER.maxFormHealth,
  theme: {
    color: PALETTE.greymatter,
    light: PALETTE.greymatterGlow,
    dark: PALETTE.greymatterDark,
    burst: 'scan',
    shieldLabel: 'BRAIN',
    slam: 'equation',
  },
  hudIcon: GREYMATTER_TEX.icon,
  touchIcons: { attack: GREYMATTER_TEX.touchAttack, special: GREYMATTER_TEX.touchSpecial },
  quips: {
    transform: ['GREY MATTER!', 'BRAIN POWER!', 'SMALL BUT SMART!', 'THINK FAST!'],
    first: 'GREY MATTER! ...WHY IS EVERYTHING SO BIG?',
    revert: [],
    swap: ['BIG BRAIN!', 'CALCULATED!', 'SMART SWAP!'],
    misfire: {
      wanted: {
        heatblast: ['I WANTED FIRE. I GOT FRACTIONS.', 'HOT? NO. CLEVER? VERY.'],
        fourarms: ['FOUR ARMS? I HAVE TWO. THEY ARE TINY.', 'I WANTED MUSCLE. I GOT HOMEWORK.'],
        xlr8: ["FAST? I'M FAST... FOR A HAMSTER.", 'XLR8, NOT X-SMALL!'],
        wildmutt: ['WRONG NOSE. NO NOSE. JUST A HUGE BRAIN.', 'I WANTED FANGS, NOT FACTS.'],
        stinkfly: ['NO WINGS. JUST VERY STRONG OPINIONS.', 'I CAN CALCULATE FLIGHT. I CANNOT FLY.'],
        upgrade: ['I WANTED TO BE THE COMPUTER, NOT THE NERD.', 'TECHNICALLY STILL SMART.'],
        diamondhead: ['ROCK SOLID? MORE LIKE POCKET SIZED.', 'I WANTED A SHIELD. I GOT A THEORY.'],
        ghostfreak: ['NOT SPOOKY. JUST SMALL.', 'I CAN EXPLAIN GHOSTS. I CANNOT BE ONE.'],
        ripjaws: ['I WANTED JAWS. I GOT A GOLDFISH.', 'TINY, WET AND VERY SMART.'],
      },
      any: ['WELL, AT LEAST I KNOW WHY THIS HAPPENED.'],
    },
  },
  tips: {
    intro: { id: 'greymatter', text: '{J} BITE   {K} ANALYZE: A WEAK POINT, x3 DAMAGE', ms: 8000, priority: 5, doneAfter: { action: 'analyze', count: 2 } },
    advanced: { id: 'greymatter-swap', text: 'ANALYZE, THEN {T} SWAP: ANY ALIEN HITS IT x3!', ms: 6500, priority: 4, afterKills: 1, doneAfter: { action: 'weakHit', count: 3 } },
  },
  unlock: { tagline: 'SMALL BODY. BIGGEST BRAIN IN THE GALAXY.', traits: ['FITS THROUGH VENTS', 'ANALYZE: WEAK POINTS x3'] },
  moves: [
    'HOLD {J}: BITE (EVERY THIRD HOPS AND CHOMPS)',
    '{K}: ANALYZE. A WEAK POINT FOR A FEW SECONDS',
    'WEAK POINTS TAKE x3 FROM ANY ALIEN: SWAP!',
    'TINY: VENTS AND GAPS A TILE HIGH',
    'SWAP IN: ONE LOOK AND EVERYTHING NEARBY IS WEAK',
  ],
  audio: { transform: greymatterTransform, music: GREYMATTER_MUSIC },
  art: { assets: GREYMATTER_ASSETS, anims: GREYMATTER_ANIMS },
  // Springy for his size (five tiles up), and only one tile tall: vents and low gaps are doorways.
  reach: { jumpUp: 5, jumpAcross: 5, canBurn: false, canSmash: false, canRunWater: false, tiny: true },
  copy: { style: 'pounce', tell: 'scan', attack: 'biteB', cheer: "YOUR BRAIN'S BIGGER THAN YOUR WHOLE BODY. THAT'S SO WEIRD. TEACH ME." },
  damageScale: GREYMATTER.damageScale,
  ride: { attack: 'strike', special: 'senses', back: GREYMATTER_TEX.back, color: PALETTE.greymatter },
  swim: SWIM.greymatter,
  createAbilities: () => new GreyMatterAbilities(),
};
