import type { LevelData } from './types';

/**
 * Chapter 3: Dr. Animo.
 *
 * The plaza outside the natural history museum at night (2-35) > the Great
 * Hall, where Animo makes his entrance over the T-rex (38-99) > the Hall of
 * Mammals and its brute (100-149) > the Night Gallery, where the lights die
 * and Wildmutt arrives, up to the wall only he can climb (150-191) > the upper
 * gallery behind a hidden door (192-223) > the atrium over the tar pits, where
 * the bridge collapses and Stinkfly arrives (224-271) > the security wing's
 * five locks, one per alien (272-358) > Animo's lab (359-389) > KING CROAK's
 * arena (390-422).
 *
 * Standing entities use the surface row they stand on; flyers use the row
 * they hover in; a ceiling roach uses the solid row it clings under.
 */
export const CHAPTER_3: LevelData = {
  id: 'ch3',
  chapter: 3,
  name: 'DR. ANIMO',
  theme: 'museum',
  parTimeMs: 540_000,
  width: 424,
  height: 40,
  playerStart: { x: 12, y: 30 },
  podTriggerX: -1,

  solids: [
    { material: 'rock', x: 0, top: 0, w: 2 },
    // One long marble floor from the plaza to the climb.
    { material: 'ground', x: 2, top: 30, w: 186 },
    // The museum's side wall above the open staff door (rows 26-29).
    { material: 'rock', x: 36, top: 0, w: 2, h: 26 },
    // Ceilings: the Great Hall, the Hall of Mammals, the Night Gallery.
    { material: 'rock', x: 38, top: 0, w: 62, h: 8 },
    { material: 'rock', x: 100, top: 0, w: 50, h: 10 },
    { material: 'rock', x: 150, top: 0, w: 42, h: 10 },
    // A low display wall in the Hall of Mammals (a brute stuns itself on it).
    { material: 'rock', x: 136, top: 27, w: 2, h: 3 },
    // A plinth in the Night Gallery with a sealed alcove.
    { material: 'rock', x: 158, top: 27, w: 6, h: 3 },
    // The wall only a climber gets up, and the upper gallery on top of it.
    { material: 'rock', x: 188, top: 14, w: 4 },
    { material: 'ground', x: 192, top: 14, w: 32 },
    { material: 'rock', x: 192, top: 0, w: 32, h: 10 },
    // The atrium: glass dome, tar pit bed, two dig-site islands, the bridge, the far balcony.
    { material: 'rock', x: 224, top: 0, w: 48, h: 4 },
    { material: 'rock', x: 224, top: 36, w: 42 },
    { material: 'rock', x: 238, top: 31, w: 3, h: 5 },
    { material: 'rock', x: 250, top: 30, w: 3, h: 6 },
    { material: 'ground', x: 224, top: 14, w: 12, h: 2 },
    { material: 'ground', x: 262, top: 14, w: 4, h: 2 },
    { material: 'rock', x: 266, top: 14, w: 10 },
    // Security wing: ceiling, floor, the wall the vines grow over, the moat and its low ceiling.
    { material: 'rock', x: 272, top: 0, w: 74, h: 12 },
    { material: 'ground', x: 276, top: 24, w: 12 },
    { material: 'rock', x: 280, top: 12, w: 2, h: 6 },
    { material: 'rock', x: 288, top: 28, w: 24 },
    { material: 'rock', x: 288, top: 12, w: 24, h: 9 },
    { material: 'ground', x: 312, top: 24, w: 3 },
    { material: 'rock', x: 315, top: 12, w: 1, h: 9 },
    // The locked room, its shaft wall, and the block under the vent.
    { material: 'ground', x: 315, top: 24, w: 31 },
    { material: 'rock', x: 325, top: 12, w: 21, h: 12 },
    // The vat pit: a low duct ceiling over it, the vat's floor, the far ledge.
    { material: 'rock', x: 346, top: 0, w: 25, h: 6 },
    { material: 'rock', x: 346, top: 38, w: 13 },
    { material: 'ground', x: 359, top: 9, w: 10 },
    // Animo's lab and the frog's arena: the far ledge drops through a hole (369-370) into it.
    { material: 'rock', x: 371, top: 0, w: 53, h: 3 },
    { material: 'rock', x: 371, top: 3, w: 1, h: 6 },
    { material: 'ground', x: 369, top: 30, w: 55 },
    { material: 'rock', x: 422, top: 0, w: 2 },
  ],

  carves: [
    // A cellar under the skylight glass in the Great Hall.
    { x: 88, y: 30, w: 4, h: 4 },
    // The plinth's alcove behind a hidden door.
    { x: 158, y: 28, w: 5, h: 2 },
    // The shaft up out of the locked room, and the vent behind the hidden door.
    { x: 321, y: 6, w: 4, h: 6 },
    { x: 325, y: 6, w: 21, h: 3 },
    // A nook in the vent's ceiling far too small for anyone yet.
    { x: 330, y: 4, w: 1, h: 1 },
  ],

  platforms: [
    // The facade's cornice.
    { x: 16, y: 24, w: 13 },
    // Great Hall balconies, Animo's perch over the T-rex, the gallery over the glass.
    { x: 44, y: 25, w: 6 },
    { x: 50, y: 21, w: 6 },
    { x: 56, y: 17, w: 10 },
    { x: 70, y: 22, w: 8 },
    { x: 82, y: 26, w: 3 },
    { x: 85, y: 22, w: 12 },
    // Hall of Mammals: steps up to the high balcony.
    { x: 104, y: 26, w: 4 },
    { x: 109, y: 22, w: 6 },
    { x: 116, y: 19, w: 6 },
    // Night Gallery: a ledge and a rest stop halfway up the climb.
    { x: 174, y: 26, w: 6 },
    { x: 185, y: 22, w: 3 },
    // Atrium perches.
    { x: 244, y: 19, w: 4 },
    { x: 253, y: 16, w: 3 },
    // The arena's scaffolds.
    { x: 396, y: 24, w: 5 },
    { x: 412, y: 24, w: 5 },
    { x: 403, y: 19, w: 6 },
  ],

  water: [
    { x: 224, w: 42, surface: 32, depth: 4, kind: 'tar' },
    { x: 288, w: 24, surface: 24, depth: 4, kind: 'mutagen' },
    { x: 346, w: 13, surface: 33, depth: 5, kind: 'mutagen' },
  ],

  interiors: [
    { x: 36, w: 310, wall: 'hall' },
    { x: 346, w: 78, wall: 'lab' },
  ],

  introSpawns: [],

  story: {
    museumIntro: { x: 8, y: 30 },
    villainIntro: {
      triggerX: 50,
      x: 60,
      y: 17,
      exitX: 100,
      spawns: [
        { kind: 'rat', x: 66, y: 29 },
        { kind: 'rat', x: 70, y: 29 },
        { kind: 'rat', x: 74, y: 29 },
        { kind: 'bat', x: 64, y: 12 },
      ],
    },
    blackout: { triggerX: 155, fromX: 150, toX: 192, alien: 'wildmutt' },
    atrium: { triggerX: 229, collapse: { x: 227, y: 14, w: 9, h: 2 }, toX: 263, toY: 14, alien: 'stinkfly' },
    unlocks: [
      { alien: 'wildmutt', x: 157, line: "I CAN'T SEE A THING!", scripted: true },
      { alien: 'stinkfly', x: 229, line: 'WHOA WHOA WHOA!', scripted: true },
    ],
    outro: [
      { who: 'gwen', text: "SO WHO'S TELLING THE MUSEUM THEIR T-REX IS IN THE GIFT SHOP?", ms: 2700 },
      { who: 'ben', text: 'NOT IT!', ms: 900 },
      { who: 'max', text: "THE POLICE CAN TAKE IT FROM HERE. ANIMO WON'T BE MUTATING ANYTHING FOR A WHILE.", ms: 3000 },
      { who: 'animo', text: 'THIS... ISN\'T OVER... EVOLUTION... ALWAYS... WINS...', ms: 2600 },
    ],
    actEnd: 1,
  },

  entities: [
    // ---- The plaza
    { type: 'decor', kind: 'lampPost', x: 4, y: 30 },
    { type: 'decor', kind: 'museumFacade', x: 22, y: 30 },
    { type: 'decor', kind: 'lampPost', x: 33, y: 30 },
    { type: 'decor', kind: 'bench', x: 13, y: 30 },
    { type: 'smoothy', x: 11, y: 30 },
    { type: 'card', id: 'ch3-card-roof', x: 22, y: 17 },

    // ---- The Great Hall
    { type: 'checkpoint', id: 'cp-hall', x: 40, y: 30, density: 'normal', label: 'GREAT HALL' },
    { type: 'decor', kind: 'columns', x: 42, y: 30 },
    { type: 'decor', kind: 'banner', x: 47, y: 15 },
    { type: 'decor', kind: 'trex', x: 61, y: 30 },
    { type: 'decor', kind: 'banner', x: 76, y: 15 },
    { type: 'decor', kind: 'velvetRope', x: 53, y: 30 },
    { type: 'decor', kind: 'velvetRope', x: 69, y: 30 },
    { type: 'decor', kind: 'bench', x: 80, y: 30 },
    { type: 'decor', kind: 'displayCase', x: 94, y: 30 },
    { type: 'decor', kind: 'columns', x: 98, y: 30 },
    { type: 'smoothy', x: 64, y: 17 },
    { type: 'mutant', kind: 'roach', x: 81, y: 7, ceiling: true },
    { type: 'glassFloor', id: 'ch3-egg-glass', x: 88, y: 30, w: 4 },
    { type: 'card', id: 'ch3-card-egg', x: 89, y: 34, requires: 'fourarms' },

    // ---- The Hall of Mammals
    { type: 'checkpoint', id: 'cp-mammals', x: 102, y: 30, density: 'sparse', label: 'HALL OF MAMMALS' },
    { type: 'decor', kind: 'columns', x: 104, y: 30 },
    { type: 'decor', kind: 'mammoth', x: 111, y: 30 },
    { type: 'decor', kind: 'stuffedBear', x: 122, y: 30 },
    { type: 'decor', kind: 'painting', x: 128, y: 22 },
    { type: 'decor', kind: 'displayCase', x: 132, y: 30 },
    { type: 'decor', kind: 'columns', x: 146, y: 30 },
    { type: 'card', id: 'ch3-card-bear', x: 118, y: 15 },
    { type: 'mutant', kind: 'brute', x: 127, y: 30 },
    { type: 'drone', kind: 'bat', x: 130, y: 11 },
    { type: 'drone', kind: 'bat', x: 142, y: 11 },
    { type: 'mutant', kind: 'rat', x: 140, y: 30 },
    { type: 'mutant', kind: 'rat', x: 143, y: 30 },
    { type: 'mutant', kind: 'roach', x: 147, y: 30 },
    { type: 'smoothy', x: 134, y: 30 },

    // ---- The Night Gallery (the blackout, Wildmutt)
    { type: 'checkpoint', id: 'cp-dark', x: 152, y: 30, density: 'sparse', label: 'NIGHT GALLERY' },
    { type: 'decor', kind: 'columns', x: 154, y: 30 },
    { type: 'hiddenDoor', id: 'ch3-plinth', x: 158, y: 28, w: 5, h: 2 },
    { type: 'card', id: 'ch3-card-dark', x: 161, y: 30, requires: 'wildmutt' },
    { type: 'decor', kind: 'displayCase', x: 167, y: 30 },
    { type: 'decor', kind: 'painting', x: 171, y: 24 },
    { type: 'decor', kind: 'exitSign', x: 182, y: 12 },
    { type: 'mutant', kind: 'lurker', x: 168, y: 30 },
    { type: 'mutant', kind: 'lurker', x: 177, y: 26 },
    { type: 'mutant', kind: 'lurker', x: 184, y: 30 },
    { type: 'mutant', kind: 'rat', x: 172, y: 30 },
    { type: 'mutant', kind: 'rat', x: 180, y: 30 },
    { type: 'checkpoint', id: 'cp-shaft', x: 182, y: 30, density: 'frequent', label: 'THE CLIMB' },

    // ---- The upper gallery
    { type: 'hiddenDoor', id: 'ch3-gallery-door', x: 196, y: 10, w: 3, h: 4 },
    { type: 'checkpoint', id: 'cp-upper', x: 200, y: 14, density: 'normal', label: 'UPPER GALLERY' },
    { type: 'decor', kind: 'displayCase', x: 205, y: 14 },
    { type: 'decor', kind: 'painting', x: 211, y: 12 },
    { type: 'mutant', kind: 'lurker', x: 209, y: 14 },
    { type: 'mutant', kind: 'roach', x: 215, y: 9, ceiling: true },
    { type: 'smoothy', x: 218, y: 14 },
    { type: 'checkpoint', id: 'cp-atrium', x: 221, y: 14, density: 'sparse', label: 'ATRIUM' },

    // ---- The atrium (Stinkfly)
    { type: 'decor', kind: 'pterosaur', x: 236, y: 9 },
    { type: 'decor', kind: 'whale', x: 246, y: 13 },
    { type: 'decor', kind: 'pterosaur', x: 258, y: 8 },
    { type: 'decor', kind: 'tarSign', x: 239, y: 31 },
    { type: 'card', id: 'ch3-card-whale', x: 247, y: 9 },
    { type: 'wave', id: 'atrium-bats', triggerX: 234, from: 'right', spawns: [{ kind: 'bat', x: 248, y: 16 }, { kind: 'bat', x: 256, y: 21 }, { kind: 'bat', x: 242, y: 25 }] },

    // ---- The security wing: five locks, one per alien
    { type: 'checkpoint', id: 'cp-lockdown', x: 269, y: 14, density: 'sparse', label: 'LOCKDOWN' },
    { type: 'vines', id: 'ch3-lock-vines', x: 280, y: 18, w: 2, h: 6 },
    { type: 'crackedWall', id: 'ch3-lock-wall', x: 315, y: 21, h: 3, requires: 'fourarms' },
    // The whole vent hides behind it: it looks like more wall until Wildmutt sniffs it out.
    { type: 'hiddenDoor', id: 'ch3-lock-door', x: 325, y: 6, w: 21, h: 3 },
    { type: 'mutant', kind: 'roach', x: 320, y: 24 },
    { type: 'mutant', kind: 'lurker', x: 337, y: 9 },
    { type: 'smoothy', x: 318, y: 24 },
    { type: 'card', id: 'ch3-card-vent', x: 330, y: 5, requires: 'greymatter' },
    { type: 'alienHint', id: 'ch3-vent-hint', alien: 'greymatter', x: 328, y: 6, w: 5, h: 3, line: "SOMETHING'S UP THERE... I'D HAVE TO BE TINY." },
    { type: 'card', id: 'ch3-card-vat', x: 352, y: 38, requires: 'ripjaws' },
    { type: 'alienHint', id: 'ch3-vat-hint', alien: 'ripjaws', x: 341, y: 6, w: 5, h: 3, line: "SOMETHING'S GLINTING AT THE BOTTOM OF THAT VAT..." },

    // ---- Animo's lab
    { type: 'checkpoint', id: 'cp-lab', x: 373, y: 30, density: 'normal', label: "ANIMO'S LAB" },
    { type: 'decor', kind: 'mutagenTank', x: 374, y: 30 },
    { type: 'decor', kind: 'labConsole', x: 379, y: 30 },
    { type: 'decor', kind: 'cage', x: 383, y: 30 },
    { type: 'decor', kind: 'pipes', x: 381, y: 12 },
    { type: 'mutant', kind: 'lurker', x: 378, y: 30 },
    { type: 'mutant', kind: 'rat', x: 382, y: 30 },
    { type: 'mutant', kind: 'rat', x: 384, y: 30 },
    { type: 'drone', kind: 'bat', x: 380, y: 8 },
    { type: 'smoothy', x: 386, y: 30 },
    { type: 'checkpoint', id: 'cp-frog', x: 388, y: 30, density: 'sparse', label: 'KING CROAK' },

    // ---- KING CROAK's arena
    { type: 'decor', kind: 'mutagenTank', x: 393, y: 30 },
    { type: 'decor', kind: 'labConsole', x: 407, y: 30 },
    { type: 'decor', kind: 'mutagenTank', x: 419, y: 30 },
    { type: 'boss', kind: 'frog', x: 406, y: 30, arenaFrom: 390, arenaTo: 422, triggerX: 394, floor: 30 },
  ],

  prompts: [
    { id: 'roof', x: 14, w: 16, text: "A CARD UP ON THE ROOF? I'D NEED A BOOST...", alienText: 'A CARD UP ON THE ROOF!', formText: { heatblast: '{JUMP} IN THE AIR: ROCKET JUMP TO THE ROOF!' } },
    {
      id: 'glass',
      x: 85,
      w: 9,
      text: 'SOMETHING UNDER THAT GLASS... A BIG DROP COULD CRACK IT',
      formText: { fourarms: 'JUMP OFF THE GALLERY, {K} IN THE AIR: METEOR!' },
    },
    {
      id: 'brute',
      x: 116,
      w: 10,
      text: 'TUSKS BLOCK THE FRONT! LET IT CHARGE INTO A WALL',
      formText: { fourarms: 'SMASH RIGHT THROUGH ITS TUSKS!', wildmutt: 'POUNCE ON ITS HEAD!' },
    },
    { id: 'climb', x: 180, w: 8, text: 'WAY TOO HIGH... I NEED SOMETHING THAT CLIMBS', formText: { wildmutt: 'PUSH INTO THE WALL TO CLIMB!' } },
    { id: 'lockdown', x: 270, w: 6, text: 'LOCKDOWN! FIVE LOCKS, FIVE ALIENS: {DIAL} PICK, {T} SWAP' },
    { id: 'vines', x: 276, w: 4, text: "MUTANT VINES. CLAWS WON'T CUT IT... FIRE WILL", formText: { heatblast: '{J} BURN THEM DOWN!' } },
    { id: 'moat', x: 282, w: 6, text: 'TOO WIDE, CEILING TOO LOW... RUN ACROSS IT?', formText: { xlr8: "RUN! DON'T STOP OR YOU'LL SINK!" } },
    { id: 'shaft', x: 317, w: 7, text: 'A DEAD END? SOMETHING SMELLS FUNNY UP THERE...', formText: { wildmutt: 'CLIMB UP AND SNIFF IT OUT!' } },
    { id: 'pit', x: 338, w: 8, text: 'A PIT! I NEED WINGS FOR THIS ONE', formText: { stinkfly: 'FLY ACROSS! HOVER TO SAVE YOUR WINGS' } },
  ],

  ambience: [
    { x: 0, ambient: 'street' },
    { x: 36, ambient: 'museum' },
    { x: 100, ambient: 'gallery' },
    { x: 224, ambient: 'atrium' },
    { x: 272, ambient: 'museum' },
    { x: 346, ambient: 'lab' },
  ],
};
