import { UPGRADE, UPGRADE_FEEL, UPGRADE_MOTOR } from '../../config/aliens/upgrade';
import { PALETTE } from '../../config/palette';
import type { FormDefinition } from '../types';
import { UpgradeAbilities } from './abilities';
import { UPGRADE_ANIMS, UPGRADE_ASSETS, UPGRADE_FRAME, UPGRADE_TEX } from './art';
import { UPGRADE_MUSIC, upgradeTransform } from './audio';

/**
 * Upgrade: living nanotech with one great eye. An eye laser, and a puddle
 * merge that pours him into any machine: turrets, arcade cabinets, security
 * shutters, lifts, carts. Into a robot, it's a takeover.
 */
export const UPGRADE_FORM: FormDefinition = {
  id: 'upgrade',
  name: 'UPGRADE',
  kind: 'alien',
  unlockChapter: 4,
  texture: UPGRADE_TEX.sheet,
  animPrefix: 'upgrade',
  frame: UPGRADE_FRAME,
  motor: UPGRADE_MOTOR,
  feel: UPGRADE_FEEL,
  maxFormHealth: UPGRADE.maxFormHealth,
  theme: {
    color: PALETTE.upgrade,
    light: PALETTE.upgradeGlow,
    dark: PALETTE.upgradeDark,
    burst: 'circuit',
    shieldLabel: 'NANITES',
    slam: 'glitch',
  },
  hudIcon: UPGRADE_TEX.icon,
  touchIcons: { attack: UPGRADE_TEX.touchAttack, special: UPGRADE_TEX.touchSpecial },
  quips: {
    transform: ['TIME TO UPGRADE!', 'UPGRADE ONLINE!', 'SYSTEMS: AWESOME.', 'INSTALLING HERO.EXE...'],
    first: "UPGRADE! ...I'M A LIQUID ROBOT. COOL.",
    revert: [],
    swap: ['PATCHED IN!', 'REBOOTED!', 'UPGRADED!'],
    misfire: {
      wanted: {
        heatblast: ['I WANTED FIRE, NOT A SCREENSAVER!', "UPGRADE? I DIDN'T ASK FOR AN UPDATE!"],
        fourarms: ['FOUR ARMS... ZERO ARMS... ONE EYE. GREAT.', 'I CAN MERGE WITH A TOASTER. YAY?'],
        xlr8: ["I'M NOT FAST. I'M... DOWNLOADING.", 'BUFFERING... BUFFERING... NOT XLR8.'],
        wildmutt: ['I WANTED A NOSE. I GOT A WEBCAM.', 'WRONG ALIEN. AND I CAN SEE. WEIRD.'],
        stinkfly: ['NO WINGS. JUST A LOT OF GOO. TECH GOO.', 'THIS IS NOT FLYING. THIS IS DRIPPING.'],
      },
      any: ['ERROR 404: RIGHT ALIEN NOT FOUND.'],
    },
  },
  tips: {
    intro: { id: 'upgrade', text: '{J} EYE LASER  {K} MERGE INTO MACHINES', ms: 7500, priority: 5, doneAfter: { action: 'mergeMachine', count: 1 } },
    advanced: { id: 'upgrade-takeover', text: '{K} INTO A ROBOT: TAKE IT OVER!', ms: 6500, priority: 4, afterKills: 2, doneAfter: { action: 'takeover', count: 1 } },
  },
  unlock: { tagline: 'LIVING TECH. ONE EYE, NO LIMITS.', traits: ['MERGES WITH ANY MACHINE', 'TAKES OVER ROBOTS'] },
  moves: ['HOLD {J}: EYE LASER  ({UP}: AIM UP)', '{K}: MERGE (FLOW INTO MACHINES)', 'MERGE INTO A ROBOT: TAKEOVER!', 'IN A MACHINE: {J} USE IT  {K} EJECT', 'MERGE WITH SHUTTERS AND LIFTS TO POWER THEM'],
  audio: { transform: upgradeTransform, music: UPGRADE_MUSIC },
  art: { assets: UPGRADE_ASSETS, anims: UPGRADE_ANIMS },
  // An ordinary jumper: his reach is the machines he can ride.
  reach: { jumpUp: 4, jumpAcross: 5, canBurn: false, canSmash: false, canRunWater: false, canMerge: true },
  copy: { style: 'beam', tell: 'laser', attack: 'laser', cheer: 'YOU WENT INSIDE THE MACHINE. HOW?!' },
  createAbilities: () => new UpgradeAbilities(),
};
