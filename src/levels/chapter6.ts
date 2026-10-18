import type { LevelData } from './types';

/**
 * Chapter 6: Magic, in Karachi (GAME_DESIGN.md).
 *
 * One night, west to east: the seafront fair at Sea View, where THE GREAT
 * HEXO plays his show (0-128) > Rafiq's rickshaw and the pink palace's gate,
 * which the Rustbucket rams (118-156) > the palace's great hall, enchanted
 * armor and Gwen's SHIELD (156-222) > the library wing, gargoyles and Gwen's
 * STUN (222-298) > down the stairs into the cellars: Gwen's REVEAL, a hidden
 * door, a bridge nobody can see over the flooded cistern, a trapdoor
 * (298-360) > Charmcaster's cage, where Grey Matter arrives (360-369) > the
 * old tunnel toward Kharadar, Max and his fire extinguisher (369-430) > up
 * into the clock tower: the Spell Engine (430-474) > THE TOWER WRAP (its own
 * scene) > the tower top: HEX AND CHARMCASTER (488-518).
 *
 * The fair and the palace stand on row 30, the cellars and the tunnel on row
 * 40, the tower top on row 12. Landmarks only appear far off on the skyline
 * (DECISIONS.md, Milestone 4 part 5).
 */
export const CHAPTER_6: LevelData = {
  id: 'ch6',
  chapter: 6,
  name: 'MAGIC',
  theme: 'karachi',
  parTimeMs: 720_000,
  width: 524,
  height: 64,
  playerStart: { x: 10, y: 30 },
  podTriggerX: -1,

  solids: [
    { material: 'rock', x: 0, top: 0, w: 2 },
    // The seafront promenade, the street and the palace forecourt.
    { material: 'ground', x: 2, top: 30, w: 154 },
    // The palace gate's iron doors (the Rustbucket knocks them in).
    { material: 'rock', x: 140, top: 18, w: 2, h: 12 },
    // The palace: front wall over the door, the great hall's ceiling, its marble floor.
    { material: 'rock', x: 156, top: 12, w: 2, h: 15 },
    { material: 'rock', x: 156, top: 12, w: 66, h: 2 },
    { material: 'rock', x: 156, top: 30, w: 134 },
    // The library: its high ceiling, the arch from the hall, the wall over the stairwell.
    { material: 'rock', x: 222, top: 6, w: 76, h: 2 },
    { material: 'rock', x: 222, top: 8, w: 1, h: 16 },
    { material: 'rock', x: 298, top: 8, w: 2, h: 26 },
    // The stairs down to the cellars.
    { material: 'rock', x: 290, top: 32, w: 2 },
    { material: 'rock', x: 292, top: 34, w: 2 },
    { material: 'rock', x: 294, top: 36, w: 2 },
    { material: 'rock', x: 296, top: 38, w: 2 },
    // The cellars: thick ground overhead, the floor (the cistern breaks it), the cistern's bottom.
    { material: 'rock', x: 300, top: 8, w: 69, h: 26 },
    { material: 'rock', x: 298, top: 40, w: 36 },
    { material: 'rock', x: 340, top: 40, w: 29 },
    { material: 'rock', x: 334, top: 50, w: 6 },
    // Charmcaster's cage: the far bars stand from the ceiling to a tile above the floor.
    { material: 'rock', x: 368, top: 34, w: 1, h: 5 },
    // The old tunnel: its low roof and floor, then the steps up into the clock tower.
    { material: 'rock', x: 369, top: 8, w: 61, h: 28 },
    { material: 'rock', x: 369, top: 40, w: 61 },
    // Rubble under the vent in the roof: a leg up for Grey Matter.
    { material: 'rock', x: 381, top: 39, w: 2, h: 1 },
    { material: 'rock', x: 430, top: 38, w: 2 },
    { material: 'rock', x: 432, top: 36, w: 2 },
    { material: 'rock', x: 434, top: 34, w: 2 },
    { material: 'rock', x: 436, top: 32, w: 2 },
    // The clock room: its ceiling, floor and the far wall (the door out to the tower's face is a recess).
    { material: 'rock', x: 430, top: 0, w: 44, h: 12 },
    { material: 'rock', x: 438, top: 30, w: 36 },
    { material: 'rock', x: 472, top: 12, w: 2, h: 15 },
    // The tower top: its parapet floor, the clock tower under it (narrower: the city shows past its edges).
    { material: 'rock', x: 488, top: 12, w: 30, h: 2 },
    { material: 'rock', x: 492, top: 14, w: 22 },
    { material: 'rock', x: 522, top: 0, w: 2 },
  ],

  carves: [
    // The trapdoor room under the cellar floor (an illusion of floor covers its top).
    { x: 346, y: 40, w: 4, h: 3 },
    // A vent up through the tunnel's roof, and the crawlspace it leads along (Grey Matter: five tiles up from the floor).
    { x: 382, y: 35, w: 1, h: 1 },
    { x: 382, y: 34, w: 6, h: 1 },
  ],

  platforms: [
    // The fair: the chai dhaba's roof, the juice stall's, the chingchi's canopy, the bus roof.
    { x: 13, y: 26, w: 6 },
    { x: 33, y: 27, w: 4 },
    { x: 96, y: 28, w: 3 },
    { x: 104, y: 25, w: 8 },
    // The great hall: jharokha balconies, then a way up to the high one.
    { x: 180, y: 25, w: 4 },
    { x: 198, y: 22, w: 4 },
    { x: 206, y: 26, w: 3 },
    { x: 210, y: 22, w: 3 },
    { x: 214, y: 18, w: 4 },
    // The library's shelves, up to the top one.
    { x: 232, y: 25, w: 4 },
    { x: 246, y: 21, w: 5 },
    { x: 256, y: 17, w: 5 },
    { x: 266, y: 13, w: 5 },
    { x: 276, y: 17, w: 4 },
    { x: 284, y: 21, w: 4 },
    // The bridge over the cistern nobody can see (Hex's illusion hides it).
    { x: 334, y: 40, w: 6 },
  ],

  water: [{ x: 334, w: 6, surface: 44, depth: 6 }],

  interiors: [
    { x: 156, w: 66, wall: 'palace', floor: 30, top: 12 },
    { x: 222, w: 76, wall: 'library', floor: 30, top: 6 },
    { x: 298, w: 71, wall: 'cellar', floor: 40, top: 8 },
    { x: 369, w: 61, wall: 'oldTunnel', floor: 40, top: 8 },
    { x: 430, w: 44, wall: 'clockwork', floor: 30, top: 10 },
  ],

  ambience: [
    { x: 0, ambient: 'seafront' },
    { x: 156, ambient: 'palace' },
    { x: 222, ambient: 'library' },
    { x: 290, ambient: 'cellar' },
    { x: 369, ambient: 'oldTunnel' },
    { x: 430, ambient: 'clockwork' },
    { x: 474, ambient: 'towerTop' },
  ],

  introSpawns: [],

  prompts: [
    {
      id: 'golem-tip',
      x: 408,
      w: 16,
      text: 'LIGHT HITS BOUNCE OFF STONE. MAKE IT SLAM, THEN HIT THE RUNE!',
      formText: { greymatter: '{K} ANALYZE THE GOLEM, THEN {T} SWAP TO SOMETHING HEAVY!' },
    },
    {
      id: 'armor-tip',
      x: 168,
      w: 12,
      text: 'THE SHIELD BLOCKS FRONT HITS. GET BEHIND IT, OR SMASH IT!',
    },
  ],

  story: {
    magic: {
      coldOpen: { rvX: 6, tentX: 46, floor: 30 },
      gate: { triggerX: 128, gateX: 140, top: 18, floor: 30 },
      lessons: [
        { spell: 'shield', x: 166, floor: 30 },
        { spell: 'stun', x: 240, floor: 30 },
        { spell: 'reveal', x: 304, floor: 40 },
      ],
      cage: { triggerX: 362, fromX: 360, toX: 368, floor: 40, charmX: 355, alien: 'greymatter' },
      max: { x: 376, floor: 40 },
      engine: { ventX: 448, floor: 30, checkpoint: 'cp-engine' },
      tower: { x: 470, floor: 30, endX: 492, endY: 12, checkpoint: 'cp-towertop' },
    },
    unlocks: [{ alien: 'greymatter', x: 362, line: 'THESE BARS ARE TOO CLOSE! NOTHING I HAVE FITS THROUGH!', scripted: true }],
    outro: [
      { who: 'gwen', text: 'THE CHARMS ARE SAFE. AND THIS ONE... STILL WANTS TO STAY WITH ME.', ms: 2600 },
      { who: 'ben', text: 'MAGIC GWEN. THAT IS GOING TO GET OLD SO FAST.', ms: 2000 },
      { who: 'max', text: 'SHABASH, BACHAY! (WELL DONE, KIDS!) CHAI ON ME. RAUF IS STILL OPEN.', ms: 2800 },
    ],
    actEnd: 2,
  },

  entities: [
    // ---- The seafront fair
    { type: 'decor', kind: 'promenadeRail', x: 4, y: 30 },
    { type: 'decor', kind: 'chaiDhaba', x: 16, y: 30 },
    { type: 'local', who: 'rauf', x: 20, y: 30 },
    { type: 'decor', kind: 'fairLights', x: 24, y: 24 },
    { type: 'decor', kind: 'kebabCart', x: 27, y: 30 },
    { type: 'decor', kind: 'balloonSeller', x: 31, y: 30 },
    { type: 'decor', kind: 'juiceStall', x: 35, y: 30 },
    { type: 'decor', kind: 'hexTent', x: 46, y: 30 },
    { type: 'decor', kind: 'exhibitTent', x: 58, y: 30 },
    { type: 'decor', kind: 'fairLights', x: 64, y: 23, flip: true },
    { type: 'decor', kind: 'ferrisHub', x: 70, y: 30 },
    { type: 'decor', kind: 'ferrisWheel', x: 70, y: 24 },
    { type: 'decor', kind: 'promenadeRail', x: 62, y: 30 },
    { type: 'decor', kind: 'camel', x: 78, y: 30 },
    { type: 'decor', kind: 'horse', x: 84, y: 30 },
    { type: 'decor', kind: 'kiteSeller', x: 90, y: 30 },
    { type: 'local', who: 'zain', x: 93, y: 30 },
    { type: 'decor', kind: 'chingchi', x: 97, y: 30 },
    { type: 'decor', kind: 'crowWire', x: 102, y: 18 },
    { type: 'decor', kind: 'truckBus', x: 108, y: 30 },
    { type: 'decor', kind: 'shopSign', x: 116, y: 25, frame: 3 },
    { type: 'decor', kind: 'rickshaw', x: 119, y: 30 },
    { type: 'local', who: 'rafiq', x: 122, y: 30 },
    { type: 'decor', kind: 'shopSign', x: 126, y: 25, frame: 0 },
    { type: 'decor', kind: 'shopSign', x: 132, y: 25, frame: 1 },
    { type: 'smoothy', x: 22, y: 30, look: 'chai' },
    { type: 'smoothy', x: 37, y: 30, look: 'juice' },
    { type: 'smoothy', x: 125, y: 30, look: 'chai' },
    { type: 'card', id: 'ch6-card-camel', x: 78, y: 27 },
    { type: 'card', id: 'ch6-card-bus', x: 110, y: 25 },
    { type: 'magic', kind: 'kite', x: 58, y: 20 },
    { type: 'magic', kind: 'kite', x: 74, y: 18 },
    { type: 'magic', kind: 'kite', x: 88, y: 19 },
    { type: 'magic', kind: 'kite', x: 101, y: 17 },
    { type: 'magic', kind: 'kite', x: 114, y: 20 },
    { type: 'magic', kind: 'rockling', x: 66, y: 30 },
    { type: 'magic', kind: 'rockling', x: 82, y: 30 },
    { type: 'magic', kind: 'rockling', x: 92, y: 30 },
    { type: 'checkpoint', id: 'cp-fair', x: 64, y: 30, density: 'normal', label: 'SEA VIEW FAIR' },
    { type: 'wave', id: 'fair-kites', triggerX: 96, from: 'above', spawns: [{ kind: 'kite', x: 104, y: 18 }, { kind: 'kite', x: 110, y: 16 }] },

    // ---- The pink palace's gate and forecourt
    { type: 'decor', kind: 'palaceGate', x: 140, y: 30 },
    { type: 'decor', kind: 'palaceFront', x: 148, y: 30 },
    { type: 'checkpoint', id: 'cp-palace', x: 146, y: 30, density: 'frequent', label: 'PALACE GATE' },

    // ---- The great hall
    { type: 'decor', kind: 'armorStand', x: 161, y: 30 },
    { type: 'decor', kind: 'archway', x: 170, y: 30 },
    { type: 'decor', kind: 'chandelier', x: 176, y: 16 },
    { type: 'decor', kind: 'jharokha', x: 182, y: 25 },
    { type: 'decor', kind: 'carpet', x: 190, y: 30 },
    { type: 'decor', kind: 'chandelier', x: 194, y: 16 },
    { type: 'decor', kind: 'jharokha', x: 200, y: 22 },
    { type: 'decor', kind: 'armorStand', x: 207, y: 30 },
    { type: 'decor', kind: 'chandelier', x: 212, y: 16 },
    { type: 'decor', kind: 'archway', x: 218, y: 30 },
    { type: 'checkpoint', id: 'cp-hall', x: 159, y: 30, density: 'normal', label: 'GREAT HALL' },
    { type: 'magic', kind: 'armor', x: 174, y: 30 },
    { type: 'magic', kind: 'rockling', x: 186, y: 30 },
    { type: 'magic', kind: 'armor', x: 192, y: 30 },
    { type: 'magic', kind: 'armor', x: 210, y: 30 },
    { type: 'smoothy', x: 196, y: 30, look: 'chai' },
    { type: 'card', id: 'ch6-card-chandelier', x: 216, y: 18 },

    // ---- The library
    { type: 'decor', kind: 'paintedCeiling', x: 232, y: 10 },
    { type: 'decor', kind: 'paintedCeiling', x: 264, y: 10 },
    { type: 'decor', kind: 'bookshelf', x: 228, y: 30 },
    { type: 'decor', kind: 'bookshelf', x: 236, y: 30 },
    { type: 'decor', kind: 'readingLamp', x: 243, y: 30 },
    { type: 'decor', kind: 'bookshelf', x: 252, y: 30 },
    { type: 'decor', kind: 'globe', x: 258, y: 30 },
    { type: 'decor', kind: 'bookshelf', x: 262, y: 30 },
    { type: 'decor', kind: 'bookshelf', x: 276, y: 30 },
    { type: 'decor', kind: 'readingLamp', x: 281, y: 30 },
    { type: 'decor', kind: 'bookshelf', x: 286, y: 30 },
    { type: 'checkpoint', id: 'cp-library', x: 226, y: 30, density: 'normal', label: 'THE LIBRARY' },
    { type: 'magic', kind: 'gargoyle', x: 248, y: 21 },
    { type: 'magic', kind: 'gargoyle', x: 258, y: 17 },
    { type: 'magic', kind: 'gargoyle', x: 270, y: 30 },
    { type: 'magic', kind: 'gargoyle', x: 285, y: 21 },
    { type: 'magic', kind: 'armor', x: 266, y: 30 },
    { type: 'smoothy', x: 272, y: 30, look: 'juice' },
    { type: 'card', id: 'ch6-card-shelf', x: 268, y: 13 },

    // ---- The cellars
    { type: 'decor', kind: 'cellarArch', x: 306, y: 40 },
    { type: 'decor', kind: 'tunnelLamp', x: 316, y: 36 },
    { type: 'decor', kind: 'cellarArch', x: 326, y: 40 },
    { type: 'decor', kind: 'tunnelLamp', x: 343, y: 36 },
    { type: 'decor', kind: 'runeCircle', x: 364, y: 40 },
    { type: 'checkpoint', id: 'cp-cellar', x: 300, y: 40, density: 'normal', label: 'THE CELLARS' },
    { type: 'hiddenDoor', id: 'cellar-door', x: 312, y: 34, w: 2, h: 6 },
    { type: 'magic', kind: 'illusion', x: 322, y: 40 },
    { type: 'magic', kind: 'illusion', x: 330, y: 40 },
    { type: 'smoothy', x: 318, y: 40, look: 'chai' },
    { type: 'illusion', id: 'cistern-bridge', x: 334, y: 40, w: 6, h: 1, look: 'floor' },
    { type: 'illusion', id: 'trapdoor', x: 346, y: 40, w: 4, h: 3, look: 'wall' },
    { type: 'card', id: 'ch6-card-trapdoor', x: 348, y: 43 },
    { type: 'card', id: 'ch6-card-cistern', x: 336, y: 50, requires: 'ripjaws' },
    { type: 'alienHint', id: 'ch6-cistern-hint', alien: 'ripjaws', x: 332, y: 37, w: 10, h: 3, line: 'SOMETHING GLINTS DOWN IN THE CISTERN. I\'D NEED GILLS FOR THAT.' },
    { type: 'checkpoint', id: 'cp-cage', x: 354, y: 40, density: 'sparse', label: 'THE CAGE' },

    // ---- The old tunnel
    { type: 'decor', kind: 'tunnelLamp', x: 374, y: 37 },
    { type: 'decor', kind: 'pipesOld', x: 386, y: 40 },
    { type: 'decor', kind: 'tunnelLamp', x: 394, y: 37 },
    { type: 'decor', kind: 'tunnelLamp', x: 412, y: 37 },
    { type: 'decor', kind: 'pipesOld', x: 420, y: 40 },
    { type: 'checkpoint', id: 'cp-tunnel', x: 390, y: 40, density: 'normal', label: 'KHARADAR TUNNEL' },
    { type: 'card', id: 'ch6-card-vent', x: 387, y: 35, requires: 'greymatter' },
    { type: 'magic', kind: 'rockling', x: 398, y: 40 },
    { type: 'magic', kind: 'rockling', x: 404, y: 40 },
    { type: 'magic', kind: 'golem', x: 418, y: 40 },
    { type: 'smoothy', x: 427, y: 40, look: 'chai' },

    // ---- The clock room
    { type: 'decor', kind: 'gears', x: 444, y: 26 },
    { type: 'decor', kind: 'clockFace', x: 456, y: 26 },
    { type: 'decor', kind: 'pendulum', x: 463, y: 22 },
    { type: 'decor', kind: 'gears', x: 468, y: 18, flip: true },
    { type: 'checkpoint', id: 'cp-engine', x: 440, y: 30, density: 'sparse', label: 'SPELL ENGINE' },
    // The puzzle's halfway point (Easy only): a restart there goes back in at its last stage.
    { type: 'checkpoint', id: 'cp-engine-2', x: 449, y: 30, density: 'frequent', label: 'ENGINE: PENDULUM', hidden: true },
    { type: 'checkpoint', id: 'cp-wrap', x: 468, y: 30, density: 'sparse', label: 'TOWER WRAP', hidden: true },

    // ---- The tower top
    { type: 'checkpoint', id: 'cp-towertop', x: 492, y: 12, density: 'sparse', label: 'TOWER TOP', hidden: true },
    { type: 'boss', x: 503, y: 12, arenaFrom: 489, arenaTo: 517, triggerX: 494, kind: 'hex', floor: 12 },
  ],
};
