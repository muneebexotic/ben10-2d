import { FOURARMS, FOURARMS_FEEL, FOURARMS_MOTOR } from '../../config/aliens/fourarms';
import type { FormDefinition } from '../types';
import { FourArmsAbilities } from './abilities';
import { FOURARMS_ANIMS, FOURARMS_ASSETS, FOURARMS_COLORS, FOURARMS_FRAME, FOURARMS_TEX } from './art';
import { FOURARMS_MUSIC, fourArmsTransform } from './audio';

/** Four Arms: a walking earthquake. Smash damage, ground shockwaves, and anything stunned becomes a projectile. */
export const FOURARMS_FORM: FormDefinition = {
  id: 'fourarms',
  name: 'FOUR ARMS',
  kind: 'alien',
  unlockChapter: 2,
  texture: FOURARMS_TEX.sheet,
  animPrefix: 'fourarms',
  frame: FOURARMS_FRAME,
  motor: FOURARMS_MOTOR,
  feel: FOURARMS_FEEL,
  maxFormHealth: FOURARMS.maxFormHealth,
  theme: {
    color: 0xff5a44,
    light: FOURARMS_COLORS.light,
    dark: 0x4a1410,
    burst: 'debris',
    shieldLabel: 'BULK',
    slam: 'quake',
  },
  hudIcon: FOURARMS_TEX.icon,
  touchIcons: { attack: FOURARMS_TEX.touchAttack, special: FOURARMS_TEX.touchSpecial },
  quips: {
    transform: ['FOUR ARMS, READY TO RUMBLE!', "IT'S CLOBBERING TIME!", 'WHO WANTS A KNUCKLE SANDWICH?', 'FOUR TIMES THE PUNCH!'],
    revert: [],
    swap: ['TAG! I\'M IT!', 'SMASH TIME!', 'MAKE SOME ROOM!'],
  },
  tips: {
    intro: { id: 'fourarms', text: '{J} PUNCH   {K} SLAM   {UP}+{J} CLAP', ms: 7000, priority: 5, doneAfter: { action: 'slam', count: 1 } },
    advanced: { id: 'fourarms-grab', text: 'DRONE DOWN? {J} TO LIFT IT, {J} TO THROW!', ms: 6500, priority: 4, afterKills: 2, doneAfter: { action: 'throw', count: 1 } },
  },
  moves: ['{J} PUNCH, PUNCH, HAYMAKER  ({UP}: CLAP)', '{K} GROUND SLAM  (IN THE AIR: METEOR)', '{J} BY A DOWNED DRONE: LIFT, THEN THROW'],
  audio: { transform: fourArmsTransform, music: FOURARMS_MUSIC },
  art: { assets: FOURARMS_ASSETS, anims: FOURARMS_ANIMS },
  reach: { jumpUp: 4, jumpAcross: 5, canBurn: false, canSmash: true, canRunWater: false },
  createAbilities: () => new FourArmsAbilities(),
};
