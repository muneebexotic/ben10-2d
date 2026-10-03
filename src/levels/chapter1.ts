import type { LevelData } from './types';

/**
 * Chapter 1: Camp Crash.
 *
 * Camp (0-33) > pod crater + first transform (34-43) > forest path and burnable
 * tunnel (44-101) > rocket-jump cliff and ridge (102-125) > jammer ravine, human
 * only (126-179) > drone nest (180-237) > crash-site boss arena (240-279).
 *
 * Standing entities use the surface row they stand on; drones use the row they hover in.
 */
export const CHAPTER_1: LevelData = {
  id: 'ch1',
  chapter: 1,
  name: 'CAMP CRASH',
  width: 284,
  height: 34,
  playerStart: { x: 12, y: 26 },
  podTriggerX: 33,

  solids: [
    { material: 'rock', x: 0, top: 12, w: 2 },
    { material: 'ground', x: 2, top: 26, w: 56 },
    { material: 'ground', x: 58, top: 24, w: 12 },
    // Tunnel hill: grass cap over rock, tunnel carved below.
    { material: 'ground', x: 70, top: 12, w: 10, h: 2 },
    { material: 'rock', x: 70, top: 14, w: 10 },
    { material: 'ground', x: 80, top: 24, w: 22 },
    // Ridge above the rocket-jump cliff.
    { material: 'ground', x: 102, top: 17, w: 24 },
    { material: 'ground', x: 126, top: 24, w: 8 },
    // Ravine: creek bed and stepping-stone pillars.
    { material: 'rock', x: 134, top: 31, w: 38 },
    { material: 'rock', x: 136, top: 25, w: 2, h: 6 },
    { material: 'rock', x: 141, top: 23, w: 2, h: 8 },
    { material: 'rock', x: 152, top: 24, w: 2, h: 7 },
    { material: 'rock', x: 157, top: 22, w: 2, h: 9 },
    { material: 'rock', x: 163, top: 24, w: 2, h: 7 },
    { material: 'rock', x: 168, top: 25, w: 2, h: 6 },
    { material: 'ground', x: 172, top: 24, w: 20 },
    // Nest hill with a secret alcove sealed by a barricade on its right face.
    { material: 'ground', x: 192, top: 20, w: 14 },
    { material: 'ground', x: 206, top: 24, w: 74 },
    { material: 'rock', x: 280, top: 8, w: 4 },
  ],

  carves: [
    { x: 70, y: 20, w: 10, h: 4 },
    { x: 201, y: 21, w: 5, h: 3 },
    // Sealed vault in the cliff face; the cracked wall at x 102 closes it.
    { x: 102, y: 21, w: 4, h: 3 },
    // A den under the ridge top, behind a hatch only senses find.
    { x: 112, y: 17, w: 4, h: 3 },
  ],

  platforms: [
    { x: 84, y: 21, w: 3 },
    { x: 88, y: 18, w: 3 },
    { x: 92, y: 15, w: 3 },
    { x: 96, y: 10, w: 3 },
    { x: 145, y: 22, w: 4 },
    { x: 160, y: 19, w: 2 },
    { x: 189, y: 22, w: 2 },
    { x: 223, y: 21, w: 4 },
    { x: 229, y: 19, w: 3 },
    { x: 247, y: 20, w: 4 },
    { x: 269, y: 20, w: 4 },
  ],

  water: [{ x: 134, w: 38, surface: 27, depth: 4 }],

  introSpawns: [
    { kind: 'scout', x: 52, y: 17 },
    { kind: 'scout', x: 56, y: 20 },
  ],

  entities: [
    { type: 'decor', kind: 'rv', x: 5, y: 26 },
    { type: 'decor', kind: 'tent', x: 10, y: 26 },
    { type: 'decor', kind: 'log', x: 14, y: 26 },
    { type: 'decor', kind: 'campfire', x: 16, y: 26 },
    { type: 'decor', kind: 'tent', x: 21, y: 26, flip: true },
    { type: 'decor', kind: 'sign', x: 29, y: 26 },
    { type: 'pod', x: 37, y: 26 },
    { type: 'decor', kind: 'crater', x: 37, y: 26 },

    { type: 'drone', kind: 'scout', x: 63, y: 18 },
    { type: 'drone', kind: 'striker', x: 67, y: 16 },
    { type: 'barricade', id: 'tunnel', x: 70, y: 20, w: 2, h: 4 },
    { type: 'drone', kind: 'scout', x: 86, y: 16 },
    { type: 'drone', kind: 'striker', x: 92, y: 13 },
    { type: 'drone', kind: 'scout', x: 99, y: 18 },
    { type: 'card', id: 'ch1-card-ridge', x: 97, y: 10 },
    { type: 'checkpoint', id: 'cp-cliff', x: 98, y: 24, density: 'normal', label: 'CLIFF' },
    { type: 'crackedWall', id: 'ch1-vault-wall', x: 102, y: 21, h: 3, requires: 'fourarms' },
    { type: 'card', id: 'ch1-card-vault', x: 104, y: 24, requires: 'fourarms' },
    // Wildmutt's secret (Chapter 3): the ridge top is hollow here; he sniffs the hatch open.
    { type: 'hiddenDoor', id: 'ch1-den-hatch', x: 112, y: 17, w: 4, h: 3 },
    { type: 'card', id: 'ch1-card-den', x: 113, y: 20, requires: 'wildmutt' },
    { type: 'alienHint', id: 'ch1-den-hint', alien: 'wildmutt', x: 110, y: 14, w: 8, h: 3, line: 'SOMETHING SMELLS FUNNY UNDER HERE...' },
    { type: 'decor', kind: 'sign', x: 100, y: 24 },

    { type: 'smoothy', x: 106, y: 17 },
    { type: 'drone', kind: 'scout', x: 113, y: 11 },
    { type: 'drone', kind: 'striker', x: 118, y: 10 },
    { type: 'drone', kind: 'scout', x: 123, y: 12 },

    { type: 'jammer', x: 176, y: 24, fieldFrom: 131, gateX: 179, gateTop: 12 },
    { type: 'drone', kind: 'scout', x: 140, y: 17 },
    { type: 'drone', kind: 'striker', x: 149, y: 16 },
    { type: 'checkpoint', id: 'cp-ravine', x: 152, y: 24, density: 'frequent', label: 'RAVINE' },
    { type: 'drone', kind: 'scout', x: 158, y: 15 },
    { type: 'card', id: 'ch1-card-creek', x: 160, y: 19 },
    { type: 'drone', kind: 'striker', x: 166, y: 16 },
    { type: 'checkpoint', id: 'cp-nest', x: 182, y: 24, density: 'sparse', label: 'NEST' },

    { type: 'drone', kind: 'gunner', x: 190, y: 16 },
    { type: 'drone', kind: 'scout', x: 198, y: 14 },
    { type: 'barricade', id: 'alcove', x: 204, y: 21, w: 2, h: 3 },
    { type: 'card', id: 'ch1-card-alcove', x: 202, y: 24 },
    { type: 'drone', kind: 'striker', x: 209, y: 16 },
    { type: 'drone', kind: 'scout', x: 214, y: 17 },
    { type: 'smoothy', x: 219, y: 24 },
    { type: 'drone', kind: 'gunner', x: 222, y: 15 },
    { type: 'drone', kind: 'striker', x: 227, y: 14 },
    { type: 'drone', kind: 'scout', x: 232, y: 14 },
    { type: 'decor', kind: 'fire', x: 233, y: 24 },
    { type: 'checkpoint', id: 'cp-arena', x: 236, y: 24, density: 'sparse', label: 'CRASH SITE' },

    { type: 'decor', kind: 'crater', x: 260, y: 24 },
    { type: 'decor', kind: 'wreck', x: 253, y: 24 },
    { type: 'decor', kind: 'wreck', x: 274, y: 24, flip: true },
    { type: 'decor', kind: 'debris', x: 245, y: 24 },
    { type: 'decor', kind: 'debris', x: 266, y: 24, flip: true },
    { type: 'decor', kind: 'fire', x: 243, y: 24 },
    { type: 'decor', kind: 'fire', x: 263, y: 24 },
    { type: 'decor', kind: 'fire', x: 277, y: 24 },
    { type: 'boss', x: 260, y: 15, arenaFrom: 240, arenaTo: 279, triggerX: 244 },
  ],

  prompts: [
    { id: 'move', x: 2, w: 28, text: '{MOVE}: MOVE    {JUMP}: JUMP' },
    {
      id: 'barricade',
      x: 60,
      w: 11,
      text: 'BURN THE BARRICADE!',
      alienText: '{J} TORCH THE BARRICADE!',
      humanText: 'TOO TOUGH TO PUNCH... NEED FIRE!',
      readyText: 'TOO TOUGH TO PUNCH... {T} HEATBLAST CAN BURN IT!',
    },
    {
      id: 'rocket',
      x: 94,
      w: 8,
      text: 'TOO HIGH!',
      alienText: 'JUMP, THEN {JUMP} AGAIN IN MID-AIR: ROCKET JUMP!',
      humanText: 'TOO HIGH! WAIT FOR THE OMNITRIX...',
      readyText: 'TOO HIGH FOR BEN... {T} TRANSFORM!',
    },
    { id: 'jammer', x: 126, w: 7, text: 'JAMMER FIELD: NO ALIENS! SMASH THE JAMMER!' },
  ],

  ambience: [
    { x: 0, ambient: 'camp' },
    { x: 44, ambient: 'forest' },
    { x: 128, ambient: 'ravine' },
    { x: 180, ambient: 'forest' },
    { x: 234, ambient: 'crash' },
  ],
};
