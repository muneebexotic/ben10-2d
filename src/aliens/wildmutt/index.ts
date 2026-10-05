import { WILDMUTT, WILDMUTT_FEEL, WILDMUTT_MOTOR } from '../../config/aliens/wildmutt';
import type { FormDefinition } from '../types';
import { WildmuttAbilities } from './abilities';
import { WILDMUTT_ANIMS, WILDMUTT_ASSETS, WILDMUTT_COLORS, WILDMUTT_FRAME, WILDMUTT_TEX } from './art';
import { WILDMUTT_MUSIC, wildmuttTransform } from './audio';

/**
 * Wildmutt: no eyes, all senses. Claws, a pounce that lands on enemies'
 * backs, wall climbing, and senses that reveal hidden paths and enemies.
 * He can't talk, so Ben's lines come out as growls with subtitles.
 */
export const WILDMUTT_FORM: FormDefinition = {
  id: 'wildmutt',
  name: 'WILDMUTT',
  kind: 'alien',
  unlockChapter: 3,
  texture: WILDMUTT_TEX.sheet,
  animPrefix: 'wildmutt',
  frame: WILDMUTT_FRAME,
  motor: WILDMUTT_MOTOR,
  feel: WILDMUTT_FEEL,
  maxFormHealth: WILDMUTT.maxFormHealth,
  theme: {
    color: 0xff9a3c,
    light: WILDMUTT_COLORS.light,
    dark: 0x4a2208,
    burst: 'sense',
    shieldLabel: 'HIDE',
    slam: 'howl',
  },
  hudIcon: WILDMUTT_TEX.icon,
  touchIcons: { attack: WILDMUTT_TEX.touchAttack, special: WILDMUTT_TEX.touchSpecial },
  quips: {
    transform: ['RRRAWR! (TRANSLATION: LET\'S GO!)', '*SNIFF SNIFF* GRRR!', 'WOOF. (THAT MEANS "DUCK".)', 'GRRRUFF! (WHO NEEDS EYES?)'],
    revert: [],
    swap: ['RRAWR!', 'GRRRAAH!', '*SNARL*'],
    misfire: {
      wanted: {
        heatblast: ['GRRR... (I WANTED FIRE!)', 'ARF?! (WHERE ARE MY FLAMES?!)'],
        xlr8: ['WOOF?! (FAST! I SAID FAST!)', 'GRR. (FOUR LEGS. STILL NOT XLR8.)'],
        fourarms: ['RRR... (I COUNT FOUR LEGS. ZERO ARMS.)', 'ARF. (WRONG KIND OF BIG.)'],
        stinkfly: ["GRR?! (I CAN'T FLY! I CAN'T EVEN SEE!)", 'WOOF. (THIS IS NOT A FLY.)'],
        upgrade: ['GRR... (CAN I SNIFF A COMPUTER?)', 'ARF?! (I WANTED THE ROBOT ONE!)'],
      },
      any: ["GRRR... (WRONG ALIEN, I THINK.)"],
    },
  },
  tips: {
    intro: { id: 'wildmutt', text: '{J} CLAWS  {K} POUNCE  PUSH INTO A WALL: CLIMB', ms: 7500, priority: 5, doneAfter: { action: 'pounce', count: 2 } },
    advanced: { id: 'wildmutt-pounce', text: '{K} THEN LAND ON A FOE FROM ABOVE: POUNCE!', ms: 6500, priority: 4, afterKills: 2, doneAfter: { action: 'pounceHit', count: 1 } },
  },
  unlock: { tagline: 'NO EYES. ALL NOSE.', traits: ['SENSES WHAT NOBODY CAN SEE', 'CLIMBS WALLS, POUNCES PREY'] },
  moves: ['HOLD {J}: CLAW RAKES', '{K}: POUNCE  ({UP}: HIGH)', 'LAND ON A FOE FROM ABOVE: POUNCE!', 'PUSH INTO A WALL: CLIMB  {JUMP}: LEAP', 'SENSES REVEAL HIDDEN PATHS AND FOES'],
  audio: { transform: wildmuttTransform, music: WILDMUTT_MUSIC },
  art: { assets: WILDMUTT_ASSETS, anims: WILDMUTT_ANIMS },
  // A strong jump, the high pounce for height, and any wall is a ladder.
  reach: { jumpUp: 5, jumpAcross: 6, canBurn: false, canSmash: false, canRunWater: false, canClimb: true, canSense: true },
  copy: { style: 'pounce', tell: 'clawA', attack: 'pounce', cheer: 'GROSS! AWESOME! WHERE ARE ITS EYES?!' },
  createAbilities: () => new WildmuttAbilities(),
};
