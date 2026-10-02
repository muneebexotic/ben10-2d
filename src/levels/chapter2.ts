import type { LevelData } from './types';

/**
 * Chapter 2: Road Trip.
 *
 * Rest stop at golden hour (0-58, a drone barricade on the way out) > canyon
 * road with an overhanging mesa shelf (59-126) > the washed-out bridge and the
 * Hornet river, XLR8's showcase (127-199) > the far bank where the Rustbucket
 * picks Ben up (200-243) > the chase arena (248-307, the road runs on a
 * treadmill while the RV stays put) > the truck stop where the runaway rig
 * crashed (308-361) > ROADBREAKER's arena (362-404).
 *
 * Standing entities use the surface row they stand on; drones use the row they hover in.
 */
export const CHAPTER_2: LevelData = {
  id: 'ch2',
  chapter: 2,
  name: 'ROAD TRIP',
  theme: 'highway',
  parTimeMs: 420_000,
  width: 408,
  height: 34,
  playerStart: { x: 15, y: 24 },
  podTriggerX: -1,

  solids: [
    { material: 'rock', x: 0, top: 10, w: 2 },
    // Rest stop and the canyon road.
    { material: 'ground', x: 2, top: 24, w: 70 },
    // A dry wash dips under the road.
    { material: 'ground', x: 72, top: 27, w: 9 },
    { material: 'ground', x: 81, top: 24, w: 47 },
    // The mesa shelf over the road, and the mesa it grows out of (tunnelled through).
    { material: 'rock', x: 88, top: 17, w: 20, h: 3 },
    { material: 'rock', x: 108, top: 14, w: 5 },
    // A hoodoo on the shelf with a card on top.
    { material: 'rock', x: 100, top: 11, w: 2, h: 6 },
    // River: riverbed and two flat rock islands at water level.
    { material: 'rock', x: 128, top: 30, w: 72 },
    { material: 'rock', x: 151, top: 24, w: 3 },
    { material: 'rock', x: 176, top: 24, w: 3 },
    // Far bank, then the mesa wall that hides the road beyond.
    { material: 'ground', x: 200, top: 24, w: 44 },
    { material: 'rock', x: 244, top: 4, w: 4 },
    // Chase arena: a flat stretch of highway between two mesas.
    { material: 'ground', x: 248, top: 26, w: 60 },
    { material: 'rock', x: 306, top: 4, w: 2 },
    // Truck stop.
    { material: 'ground', x: 308, top: 24, w: 100 },
    { material: 'rock', x: 308, top: 4, w: 2 },
    // A rock outcrop behind the garage, with a vault sealed by a cracked wall.
    { material: 'rock', x: 350, top: 18, w: 8 },
    { material: 'rock', x: 404, top: 6, w: 4 },
  ],

  carves: [
    // Tunnel through the mesa under the shelf's end.
    { x: 108, y: 20, w: 5, h: 4 },
    // The vault in the outcrop.
    { x: 350, y: 21, w: 6, h: 3 },
  ],

  platforms: [
    // Diner awning and roof.
    { x: 28, y: 22, w: 3 },
    { x: 23, y: 20, w: 8 },
    // Scaffold up to the mesa shelf.
    { x: 81, y: 21, w: 3 },
    { x: 84, y: 19, w: 3 },
    // Canyon road ledges.
    { x: 116, y: 21, w: 3 },
    // Far bank lookout.
    { x: 214, y: 21, w: 4 },
    // Truck stop: an old loading dock and the motel balcony.
    { x: 318, y: 21, w: 4 },
    { x: 341, y: 20, w: 4 },
    // Boss arena: billboard scaffolds on both sides and a high one in the middle.
    { x: 367, y: 21, w: 5 },
    { x: 395, y: 21, w: 5 },
    { x: 380, y: 17, w: 6 },
  ],

  water: [{ x: 128, w: 72, surface: 24, depth: 6 }],

  roads: [
    { x: 2, w: 55, y: 24 },
    { x: 59, w: 13, y: 24 },
    { x: 81, w: 47, y: 24 },
    { x: 200, w: 44, y: 24 },
    { x: 310, w: 30, y: 24 },
  ],

  sky: [
    { x: 0, t: 0 },
    { x: 100, t: 0.15 },
    { x: 135, t: 0.42 },
    { x: 205, t: 0.6 },
    { x: 250, t: 0.85 },
    { x: 310, t: 1 },
  ],

  introSpawns: [
    { kind: 'scout', x: 38, y: 17 },
    { kind: 'scout', x: 45, y: 19 },
  ],

  story: {
    roadIntro: { parkX: 9, parkY: 24 },
    unlocks: [
      { alien: 'xlr8', x: 123, line: 'THE BRIDGE IS OUT! HOW AM I SUPPOSED TO...' },
      { alien: 'fourarms', x: 279, line: "IT'S DRAGGING US OFF THE ROAD!", scripted: true },
    ],
    chase: { boardX: 226, boardY: 24, arenaX: 278, roadY: 26, endX: 318, endY: 24, checkpoint: 'cp-convoy' },
    outro: [
      { who: 'max', text: 'THAT CALLS FOR A CELEBRATION. WHO WANTS MARINATED MEALWORMS?', ms: 2800 },
      { who: 'gwen', text: 'GROSS!', ms: 900 },
      { who: 'ben', text: 'DOUBLE GROSS!', ms: 1100 },
    ],
  },

  entities: [
    // ---- Rest stop
    { type: 'decor', kind: 'diner', x: 26, y: 24 },
    { type: 'decor', kind: 'gasPump', x: 34, y: 24 },
    { type: 'decor', kind: 'gasPump', x: 37, y: 24 },
    { type: 'decor', kind: 'smoothyStand', x: 43, y: 24 },
    { type: 'smoothy', x: 45, y: 24 },
    { type: 'decor', kind: 'billboard', x: 52, y: 24, frame: 0 },
    { type: 'decor', kind: 'cactus', x: 20, y: 24 },
    { type: 'card', id: 'ch2-card-diner', x: 27, y: 20 },
    { type: 'drone', kind: 'striker', x: 52, y: 15 },
    { type: 'barricade', id: 'highway', x: 57, y: 20, w: 2, h: 4 },

    // ---- Canyon road
    { type: 'checkpoint', id: 'cp-canyon', x: 61, y: 24, density: 'normal', label: 'CANYON' },
    { type: 'decor', kind: 'roadSign', x: 64, y: 24 },
    { type: 'drone', kind: 'scout', x: 70, y: 18 },
    { type: 'drone', kind: 'striker', x: 76, y: 17 },
    { type: 'decor', kind: 'mileMarker', x: 79, y: 27 },
    { type: 'decor', kind: 'skull', x: 74, y: 27 },
    { type: 'drone', kind: 'scout', x: 86, y: 17 },
    { type: 'drone', kind: 'gunner', x: 96, y: 14 },
    { type: 'smoothy', x: 94, y: 17 },
    { type: 'card', id: 'ch2-card-hoodoo', x: 100, y: 11 },
    { type: 'drone', kind: 'striker', x: 98, y: 21 },
    { type: 'drone', kind: 'scout', x: 104, y: 21 },
    { type: 'decor', kind: 'cactus', x: 115, y: 24 },
    { type: 'drone', kind: 'striker', x: 117, y: 15 },
    { type: 'decor', kind: 'roadSign', x: 121, y: 24 },
    { type: 'checkpoint', id: 'cp-river', x: 118, y: 24, density: 'sparse', label: 'RIVER' },

    // ---- The river (XLR8)
    { type: 'decor', kind: 'bridgeEnd', x: 126, y: 24 },
    { type: 'decor', kind: 'girder', x: 139, y: 30 },
    { type: 'decor', kind: 'girder', x: 190, y: 30, flip: true },
    { type: 'decor', kind: 'bridgeEnd', x: 201, y: 24, flip: true },
    { type: 'checkpoint', id: 'cp-island', x: 152, y: 24, density: 'frequent', label: 'ISLAND' },
    { type: 'card', id: 'ch2-card-river', x: 165, y: 21 },
    { type: 'wave', id: 'river-1', triggerX: 129, from: 'right', spawns: [{ kind: 'hornet', x: 140, y: 19 }, { kind: 'hornet', x: 145, y: 21 }, { kind: 'hornet', x: 137, y: 17 }] },
    { type: 'wave', id: 'river-2', triggerX: 154, from: 'above', spawns: [{ kind: 'hornet', x: 162, y: 19 }, { kind: 'hornet', x: 168, y: 17 }, { kind: 'scout', x: 171, y: 15 }] },
    { type: 'wave', id: 'river-3', triggerX: 179, from: 'right', spawns: [{ kind: 'hornet', x: 186, y: 18 }, { kind: 'hornet', x: 191, y: 20 }, { kind: 'hornet', x: 188, y: 16 }, { kind: 'hornet', x: 195, y: 19 }] },

    // ---- Far bank
    { type: 'checkpoint', id: 'cp-farbank', x: 208, y: 24, density: 'sparse', label: 'FAR BANK' },
    { type: 'smoothy', x: 215, y: 21 },
    { type: 'decor', kind: 'cactus', x: 204, y: 24 },
    { type: 'decor', kind: 'guardrail', x: 233, y: 24 },
    { type: 'decor', kind: 'guardrail', x: 235, y: 24 },
    { type: 'decor', kind: 'tumbleweed', x: 238, y: 24 },

    // ---- Chase (the chase director runs everything here)
    { type: 'checkpoint', id: 'cp-convoy', x: 278, y: 26, density: 'normal', label: 'CONVOY', hidden: true },

    // ---- Truck stop
    { type: 'checkpoint', id: 'cp-truckstop', x: 318, y: 24, density: 'sparse', label: 'TRUCK STOP' },
    { type: 'decor', kind: 'neon', x: 324, y: 24 },
    { type: 'decor', kind: 'haulerWreck', x: 331, y: 24 },
    { type: 'decor', kind: 'fence', x: 312, y: 24 },
    { type: 'decor', kind: 'poleSign', x: 336, y: 24 },
    { type: 'card', id: 'ch2-card-sign', x: 336, y: 12, requires: 'stinkfly' },
    { type: 'alienHint', id: 'ch2-sign-hint', alien: 'stinkfly', x: 333, y: 18, w: 7, h: 7, line: "I'D NEED WINGS TO GET UP THERE..." },
    { type: 'decor', kind: 'garage', x: 346, y: 24 },
    { type: 'decor', kind: 'barrel', x: 340, y: 24 },
    { type: 'decor', kind: 'barrel', x: 359, y: 24 },
    { type: 'smoothy', x: 343, y: 20 },
    { type: 'crackedWall', id: 'ch2-vault-wall', x: 350, y: 21, h: 3, requires: 'fourarms' },
    { type: 'card', id: 'ch2-card-vault', x: 354, y: 24 },
    { type: 'drone', kind: 'gunner', x: 327, y: 16 },
    { type: 'drone', kind: 'armored', x: 333, y: 20 },
    { type: 'drone', kind: 'hornet', x: 340, y: 18 },
    { type: 'drone', kind: 'hornet', x: 345, y: 20 },
    { type: 'drone', kind: 'armored', x: 352, y: 15 },
    { type: 'checkpoint', id: 'cp-arena', x: 359, y: 24, density: 'normal', label: 'ROADBREAKER' },

    // ---- ROADBREAKER's arena
    { type: 'decor', kind: 'neon', x: 371, y: 21, flip: true },
    { type: 'decor', kind: 'billboard', x: 397, y: 24, frame: 1 },
    { type: 'decor', kind: 'carWreck', x: 388, y: 24 },
    { type: 'decor', kind: 'barrel', x: 376, y: 24 },
    { type: 'boss', kind: 'roadbreaker', x: 384, y: 20, arenaFrom: 362, arenaTo: 404, triggerX: 366 },
  ],

  prompts: [
    {
      id: 'barricade',
      x: 49,
      w: 9,
      text: 'BURN THE BARRICADE!',
      alienText: '{J} TORCH THE BARRICADE!',
      humanText: 'DRONE JUNK... NEED FIRE!',
      readyText: '{T} HEATBLAST CAN BURN THROUGH THAT!',
    },
    {
      id: 'river',
      x: 124,
      w: 5,
      text: 'ONLY XLR8 CAN CROSS: {DIAL} PICK HIM, {T} TRANSFORM',
      humanText: 'WAIT FOR THE OMNITRIX... XLR8 CAN RUN ON WATER',
      formText: { xlr8: "RUN! DON'T STOP OR YOU'LL SINK!" },
    },
    { id: 'board', x: 218, w: 10, text: 'HOP ON THE RUSTBUCKET!' },
    { id: 'swap', x: 318, w: 7, text: 'TIP: {DIAL} PICK ANOTHER ALIEN, THEN {T} TO SWAP MID-FIGHT', alienText: 'TIP: {DIAL} PICK ANOTHER ALIEN, THEN {T} TO SWAP MID-FIGHT' },
  ],

  ambience: [
    { x: 0, ambient: 'sunset' },
    { x: 118, ambient: 'dusk' },
    { x: 248, ambient: 'night' },
    { x: 308, ambient: 'neon' },
  ],
};
