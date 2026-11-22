import { RICOCHET, RICOCHET_FEEL, RICOCHET_MOTOR } from '../../config/aliens/ricochet';
import { PALETTE } from '../../config/palette';
import { SWIM } from '../../config/swim';
import type { FormDefinition } from '../types';
import { RicochetAbilities } from './abilities';
import { RICOCHET_ANIMS, RICOCHET_ASSETS, RICOCHET_FRAME, RICOCHET_TEX } from './art';
import { RICOCHET_MUSIC, ricochetTransform } from './audio';

/**
 * Ricochet (Chapter 8): an original alien, a stocky creature under a round
 * back of copper shell plates who curls into a perfect ball. On his feet J
 * is a chain of shell bashes; K curls him up to roll: speed builds and
 * keeps, fast rolls smash, walls send him back (BONK), Jump bounces and a
 * well-timed one bounces higher. Heavy: he sinks and rolls along the bottom.
 */
export const RICOCHET_FORM: FormDefinition = {
  id: 'ricochet',
  name: 'RICOCHET',
  kind: 'alien',
  unlockChapter: 8,
  texture: RICOCHET_TEX.sheet,
  animPrefix: 'ricochet',
  frame: RICOCHET_FRAME,
  body: { width: 14, height: 22 },
  motor: RICOCHET_MOTOR,
  feel: RICOCHET_FEEL,
  maxFormHealth: RICOCHET.maxFormHealth,
  theme: {
    color: PALETTE.ricochet,
    light: PALETTE.ricochetGlow,
    dark: PALETTE.ricochetDark,
    burst: 'spark',
    shieldLabel: 'SHELL',
    slam: 'bounce',
  },
  hudIcon: RICOCHET_TEX.icon,
  touchIcons: { attack: RICOCHET_TEX.touchAttack, special: RICOCHET_TEX.touchSpecial },
  quips: {
    transform: ['RICOCHET!', 'TIME TO ROLL!', 'BOUNCE HOUSE!', 'HEADS UP!'],
    first: 'RICOCHET! ...I AM A BALL. I AM A BALL WITH ARMS!',
    revert: [],
    swap: ['STRIKE!', 'ROLLING IN!', 'COMING THROUGH!'],
    misfire: {
      wanted: {
        heatblast: ['WANTED FIRE. GOT A BOWLING BALL.', 'NO FLAMES. JUST VERY HARD PLATES.'],
        fourarms: ['FOUR ARMS? I HAVE TWO AND A SHELL.', 'WANTED MUSCLE. GOT ARMOR. CLOSE!'],
        xlr8: ['FAST? ONLY DOWNHILL.', 'WANTED SPEED. GOT MOMENTUM. CLOSE?'],
        wildmutt: ['NO NOSE. JUST A SHELL.', 'WANTED TO SNIFF. GOT TO SPIN.'],
        stinkfly: ['NO WINGS. I BOUNCE, THOUGH!', 'WANTED TO FLY. GOT TO ROLL. DOWN.'],
        upgrade: ['WANTED TECH. GOT TIN.', 'CAN I MERGE WITH A PINBALL MACHINE?'],
        diamondhead: ['WANTED CRYSTAL. GOT COPPER.', 'SHINY, BUT THE WRONG KIND.'],
        ghostfreak: ['NOT SPOOKY. JUST ROUND.', 'WANTED TO PHASE. GOT TO BONK.'],
        greymatter: ['BIG BRAIN? BIG SHELL INSTEAD.', 'I WANTED SMALL. THIS IS ROUND.'],
        ripjaws: ['WANTED FINS. GOT A SHELL. I SINK.', 'NO GILLS. I ROLL ALONG THE BOTTOM.'],
      },
      any: ['A BALL?! WHERE AM I SUPPOSED TO ROLL?!'],
    },
  },
  tips: {
    intro: { id: 'ricochet', text: '{K}: ROLL   {JUMP}: BOUNCE   {J}: SPIN BOOST', ms: 8000, priority: 5, doneAfter: { action: 'ricochet', count: 2 } },
    advanced: { id: 'ricochet-perfect', text: '{JUMP} JUST AS YOU LAND: A PERFECT BOUNCE', ms: 7000, priority: 4, afterKills: 2, doneAfter: { action: 'perfectBounce', count: 2 } },
  },
  unlock: { tagline: 'CURL UP. BOUNCE BACK.', traits: ['ROLLS, SMASHES, RICOCHETS OFF WALLS', 'BOUNCE: TIME IT FOR A PERFECT ONE'] },
  moves: [
    'HOLD {J}: SHELL BASH (EVERY THIRD: SLAM)',
    '{K}: CURL UP AND ROLL. SPEED BUILDS, KEEPS',
    'FAST ROLLS SMASH WALLS. WALLS: BONK!',
    'ROLLING {JUMP}: BOUNCE. TIME IT: PERFECT',
    'ROLLING {J}: SPIN BOOST. AIR {DOWN}: DROP',
    'SWAP IN: HE ROLLS IN, BOWLING THEM OVER',
  ],
  audio: { transform: ricochetTransform, music: RICOCHET_MUSIC },
  art: { assets: RICOCHET_ASSETS, anims: RICOCHET_ANIMS },
  reach: { jumpUp: 4, jumpAcross: 6, canBurn: false, canSmash: true, canRunWater: false, canRoll: true },
  copy: { style: 'dash', tell: 'slam', attack: 'roll', cheer: 'DUDE, YOU TURNED INTO A BOWLING BALL!' },
  damageScale: { shot: 0.85, contact: 0.85 },
  ride: { attack: 'smash', special: 'brace', back: RICOCHET_TEX.back, color: PALETTE.ricochet },
  swim: SWIM.ricochet,
  createAbilities: () => new RicochetAbilities(),
};
