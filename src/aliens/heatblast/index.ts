import { HEATBLAST, HEATBLAST_FEEL, HEATBLAST_MOTOR } from '../../config/aliens/heatblast';
import { PALETTE } from '../../config/palette';
import type { FormDefinition } from '../types';
import { HeatblastAbilities } from './abilities';
import { HEATBLAST_ANIMS, HEATBLAST_ASSETS, HEATBLAST_FRAME, HEATBLAST_TEX } from './art';
import { HEATBLAST_MUSIC, heatblastTransform } from './audio';

/** Heatblast: a living fireball. Ranged zoning, a charged burst that erases lasers, and a rocket jump. */
export const HEATBLAST_FORM: FormDefinition = {
  id: 'heatblast',
  name: 'HEATBLAST',
  kind: 'alien',
  unlockChapter: 1,
  texture: HEATBLAST_TEX.sheet,
  animPrefix: 'heatblast',
  frame: HEATBLAST_FRAME,
  motor: HEATBLAST_MOTOR,
  feel: HEATBLAST_FEEL,
  maxFormHealth: HEATBLAST.maxFormHealth,
  theme: {
    color: PALETTE.fire2,
    light: PALETTE.fire0,
    dark: 0x3a1a14,
    burst: 'fire',
    shieldLabel: 'HEAT',
    slam: 'blaze',
  },
  hudIcon: HEATBLAST_TEX.icon,
  touchIcons: { attack: HEATBLAST_TEX.touchAttack, special: HEATBLAST_TEX.touchSpecial },
  quips: {
    transform: ["LET'S TURN UP THE HEAT!", "I'M ON FIRE! ...LITERALLY!", 'HOT HOT HOT!', 'TIME TO GET TOASTY!'],
    first: "WHOA! I'M ON FIRE! ...LITERALLY!",
    revert: [],
    swap: ['FIRE IN THE HOLE!', 'HEATBLAST, TAG IN!', 'TURNING UP THE HEAT!'],
  },
  tips: {
    intro: { id: 'fireball', text: '{J} FIREBALL  (HOLD {UP} TO AIM HIGH)', ms: 7000, priority: 5, doneAfter: { action: 'fireball', count: 4 } },
    advanced: { id: 'burst', text: 'HOLD {K}, THEN RELEASE: FIRE BURST!', ms: 6000, priority: 4, afterKills: 3, doneAfter: { action: 'burst', count: 1 } },
  },
  moves: ['{J} FIREBALLS  (HOLD {UP}: AIM HIGH)', 'HOLD {K}, RELEASE: FIRE BURST', '{JUMP} IN THE AIR: ROCKET JUMP, HOLD TO GLIDE'],
  audio: { transform: heatblastTransform, music: HEATBLAST_MUSIC },
  art: { assets: HEATBLAST_ASSETS, anims: HEATBLAST_ANIMS },
  reach: { jumpUp: 9, jumpAcross: 9, canBurn: true, canSmash: false, canRunWater: false },
  createAbilities: () => new HeatblastAbilities(),
};
