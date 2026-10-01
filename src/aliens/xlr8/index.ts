import { XLR8, XLR8_FEEL, XLR8_MOTOR } from '../../config/aliens/xlr8';
import type { FormDefinition } from '../types';
import { Xlr8Abilities } from './abilities';
import { XLR8_ANIMS, XLR8_ASSETS, XLR8_COLORS, XLR8_FRAME, XLR8_TEX } from './art';
import { XLR8_MUSIC, xlr8Transform } from './audio';

/** XLR8: the fastest thing alive. Close-range flurries, a dash that cuts through enemies, water running. */
export const XLR8_FORM: FormDefinition = {
  id: 'xlr8',
  name: 'XLR8',
  kind: 'alien',
  unlockChapter: 2,
  texture: XLR8_TEX.sheet,
  animPrefix: 'xlr8',
  frame: XLR8_FRAME,
  motor: XLR8_MOTOR,
  feel: XLR8_FEEL,
  maxFormHealth: XLR8.maxFormHealth,
  theme: {
    color: XLR8_COLORS.blue,
    light: XLR8_COLORS.light,
    dark: 0x14234a,
    burst: 'blue',
    shieldLabel: 'BLUR',
    slam: 'blur',
  },
  hudIcon: XLR8_TEX.icon,
  touchIcons: { attack: XLR8_TEX.touchAttack, special: XLR8_TEX.touchSpecial },
  quips: {
    transform: ['NEED FOR SPEED!', 'CATCH ME IF YOU CAN!', 'BLINK AND YOU MISS IT!', 'ZOOM ZOOM!'],
    revert: [],
    swap: ['TOO SLOW!', 'COMING THROUGH!', 'BLUR MODE!'],
  },
  tips: {
    intro: { id: 'xlr8', text: 'HOLD {J}: BLUR STRIKES   {K}: DASH THROUGH ENEMIES', ms: 7000, priority: 5, doneAfter: { action: 'dashStrike', count: 1 } },
    advanced: { id: 'xlr8-water', text: 'KEEP RUNNING AND XLR8 CAN CROSS WATER! DASH THROUGH SHOTS: TOO SLOW!', ms: 6000, priority: 4, afterKills: 3, doneAfter: { action: 'tooSlow', count: 1 } },
  },
  moves: ['HOLD {J}: BLUR STRIKES (6TH HIT KICKS)', '{K}: DASH THROUGH ENEMIES  ({UP}: UPWARD)', 'RUN FULL SPEED TO CROSS WATER'],
  audio: { transform: xlr8Transform, music: XLR8_MUSIC },
  art: { assets: XLR8_ASSETS, anims: XLR8_ANIMS },
  // Ground jump only, but the dash and top speed carry him across wide gaps and water.
  reach: { jumpUp: 3, jumpAcross: 11, canBurn: false, canSmash: false, canRunWater: true },
  createAbilities: () => new Xlr8Abilities(),
};
