import { GHOSTFREAK, GHOSTFREAK_FEEL, GHOSTFREAK_MOTOR } from '../../config/aliens/ghostfreak';
import { SWIM } from '../../config/swim';
import { PALETTE } from '../../config/palette';
import type { FormDefinition } from '../types';
import { GhostfreakAbilities } from './abilities';
import { GHOSTFREAK_ANIMS, GHOSTFREAK_ASSETS, GHOSTFREAK_FRAME, GHOSTFREAK_TEX } from './art';
import { GHOSTFREAK_MUSIC, ghostfreakTransform } from './audio';

/**
 * Ghostfreak: an Ectonurite. Tentacle lashes on J, phasing on K (through
 * walls, enemies and shots; held still he vanishes), a slow ghostly fall.
 * Something about him is wrong: he whispers, the picture glitches when he
 * arrives, and at timeout he sometimes doesn't want to let go.
 */
export const GHOSTFREAK_FORM: FormDefinition = {
  id: 'ghostfreak',
  name: 'GHOSTFREAK',
  kind: 'alien',
  unlockChapter: 5,
  texture: GHOSTFREAK_TEX.sheet,
  animPrefix: 'ghostfreak',
  frame: GHOSTFREAK_FRAME,
  motor: GHOSTFREAK_MOTOR,
  feel: GHOSTFREAK_FEEL,
  maxFormHealth: GHOSTFREAK.maxFormHealth,
  theme: {
    color: PALETTE.ghostfreak,
    light: PALETTE.ghostfreakGlow,
    dark: PALETTE.ghostfreakDark,
    burst: 'ghost',
    shieldLabel: 'ECTO',
    slam: 'haunt',
  },
  hudIcon: GHOSTFREAK_TEX.icon,
  touchIcons: { attack: GHOSTFREAK_TEX.touchAttack, special: GHOSTFREAK_TEX.touchSpecial },
  quips: {
    transform: ['GHOSTFREAK!', 'BOO.', 'SPOOKY TIME!', '...THAT FELT WEIRD.'],
    first: 'GHOSTFREAK! ...WHY IS IT SO COLD IN HERE?',
    revert: [],
    swap: ['BOO!', 'HAUNTED!', 'SPOOKED IN!'],
    misfire: {
      wanted: {
        heatblast: ['I WANTED FIRE. GOT... COLD SHIVERS.', "THIS ONE'S DEAD INSIDE. LITERALLY."],
        fourarms: ['FOUR ARMS? TWO ARMS. ZERO PULSE.', 'WANTED MUSCLE. GOT A BEDSHEET.'],
        xlr8: ["GHOSTS DON'T RUN. THEY DRIFT. SLOWLY.", 'I WANTED FAST, NOT FLOATY!'],
        wildmutt: ['WRONG MONSTER. CREEPIER, EVEN.', "NO NOSE. JUST ONE EYE. IT'S WATCHING."],
        stinkfly: ['I CAN FLOAT... DOWN. ONLY DOWN.', 'WANTED BUG WINGS. GOT SPOOKY TAIL.'],
        upgrade: ["I WANTED IN THE MACHINE, NOT IN THE WALL!", 'HAUNTING IS NOT HACKING.'],
        diamondhead: ['I WANTED SOLID. THIS IS THE OPPOSITE.', 'TOO SEE-THROUGH TO BLOCK ANYTHING!'],
        greymatter: ['WANTED BRAINS. GOT CREEPY.', 'SMALL? NO. SPOOKY? YES.'],
        ripjaws: ['WANTED A FISH. GOT A GHOST.', 'NO GILLS... NO LUNGS EITHER?'],
      },
      any: ['DID THE WATCH... PICK THIS ONE ON PURPOSE?'],
    },
  },
  tips: {
    intro: { id: 'ghostfreak', text: '{J} LASH   HOLD {K}: PHASE THROUGH WALLS', ms: 8000, priority: 5, doneAfter: { action: 'phase', count: 2 } },
    advanced: { id: 'ghostfreak-vanish', text: 'PHASED AND STILL, HE VANISHES: ENEMIES LOSE TRACK!', ms: 6500, priority: 4, afterKills: 2, doneAfter: { action: 'vanish', count: 1 } },
  },
  unlock: { tagline: 'SOMETHING IN THE WATCH IS WATCHING YOU.', traits: ['PHASES THROUGH WALLS', 'VANISHES WHEN STILL'] },
  moves: [
    'HOLD {J}: TENTACLE LASH (EVERY THIRD DRAGS)',
    'HOLD {K}: PHASE THROUGH WALLS, FOES, SHOTS',
    'PHASED AND STILL: INVISIBLE. ENEMIES LOSE YOU',
    'HE SINKS SLOWLY INSTEAD OF FALLING',
    'SWAP IN: A SCREAM THAT SCARES THEM OFF',
  ],
  audio: { transform: ghostfreakTransform, music: GHOSTFREAK_MUSIC },
  art: { assets: GHOSTFREAK_ASSETS, anims: GHOSTFREAK_ANIMS },
  // A floaty jumper who sinks slowly (long glides across gaps), and walls are no wall to him.
  reach: { jumpUp: 3, jumpAcross: 7, canBurn: false, canSmash: false, canRunWater: false, canPhase: true },
  copy: { style: 'dash', tell: 'phase', attack: 'lashLong', cheer: "OKAY, THAT ONE'S CREEPY. ...I LOVE IT." },
  hesitate: { chance: GHOSTFREAK.hesitate.chance, minMs: GHOSTFREAK.hesitate.minMs, maxMs: GHOSTFREAK.hesitate.maxMs, lines: ['NOT YET...', 'STAY...', 'A LITTLE LONGER...', 'WHY GO BACK?'] },
  whispers: {
    idle: ['LET ME OUT...', 'LET ME STAY...', 'SO DARK IN THERE...', 'YOU NEED ME, BEN...', 'WE COULD BE MORE...', 'I SEE EVERYTHING...'],
    arrive: ['FINALLY...', 'AIR...', 'HELLO, BEN...'],
    leave: ['SOON...', 'I WILL REMEMBER THIS...', 'NEXT TIME...'],
    everyMs: GHOSTFREAK.whisperEveryMs,
  },
  ride: { attack: 'strike', special: 'phase', back: GHOSTFREAK_TEX.back, color: PALETTE.ghostfreak },
  swim: SWIM.ghostfreak,
  createAbilities: () => new GhostfreakAbilities(),
};
