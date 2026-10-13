import type { LevelData } from './types';

/**
 * Chapter 5: Bounty Hunters.
 *
 * Silver Spur, a ghost town under a full moon: the gate where the Rustbucket
 * parks (0-26) > Main Street, Sixsix's hunt from the sky (26-118) > the jail,
 * where his net traps Ben and Ghostfreak arrives (118-148) > the haunted
 * Grand Hotel, boarded doors only Ghostfreak walks through (152-212) > the
 * Diamond Deep's mine head (214-250) > the rail tunnels, Kraab burrowing
 * after Ben (250-333) > THE DEEP DIVE, a runaway ore cart (in 3D) from the
 * station at the end of the tunnels down into > the crystal cavern, where
 * Diamondhead arrives (334-430) > the lift, where the hunters corner Ben
 * (430-452) > THE HUNTERS: Kraab in the chamber beside the shaft (452-500),
 * Sixsix up the lift shaft, Tetrax in the yard on top (440-522).
 *
 * The street is row 30; the tunnels step down to rows 36 and 40; the cavern
 * floor is row 58. Standing entities use the surface row they stand on;
 * flyers use the row they hover in.
 */
export const CHAPTER_5: LevelData = {
  id: 'ch5',
  chapter: 5,
  name: 'BOUNTY HUNTERS',
  theme: 'western',
  parTimeMs: 660_000,
  width: 524,
  height: 64,
  playerStart: { x: 10, y: 30 },
  podTriggerX: -1,

  solids: [
    { material: 'rock', x: 0, top: 0, w: 2 },
    // The street, from the gate to the mine portal.
    { material: 'ground', x: 2, top: 30, w: 248 },
    // The jail: roof, the wall over its door, the wall over Ghostfreak's way out (a phase wall under it).
    { material: 'rock', x: 118, top: 20, w: 30, h: 2 },
    { material: 'rock', x: 118, top: 22, w: 2, h: 4 },
    { material: 'rock', x: 146, top: 22, w: 2, h: 2 },
    // The Grand Hotel: roof, front wall over the door (a two-storey lobby inside), the walls between rooms.
    { material: 'rock', x: 152, top: 8, w: 60, h: 4 },
    { material: 'rock', x: 152, top: 12, w: 2, h: 14 },
    { material: 'rock', x: 170, top: 12, w: 1, h: 14 },
    { material: 'rock', x: 196, top: 12, w: 1, h: 6 },
    { material: 'rock', x: 196, top: 22, w: 1, h: 4 },
    // The upper hall's floor (the secret back room is under it) and the outer wall (a window to climb out of).
    { material: 'rock', x: 197, top: 22, w: 14, h: 1 },
    { material: 'rock', x: 211, top: 12, w: 1, h: 6 },
    { material: 'rock', x: 211, top: 22, w: 1, h: 8 },
    // The mountain over the mine: nothing gets over it.
    { material: 'rock', x: 250, top: 0, w: 190, h: 25 },
    // Rail tunnel 1, the steps down, tunnel 2 (its cave-in), the drop, tunnel 3 and the cart station.
    { material: 'ground', x: 250, top: 30, w: 22 },
    { material: 'ground', x: 272, top: 32, w: 2 },
    { material: 'ground', x: 274, top: 34, w: 2 },
    { material: 'rock', x: 272, top: 25, w: 4, h: 2 },
    { material: 'ground', x: 276, top: 36, w: 26 },
    { material: 'rock', x: 276, top: 25, w: 26, h: 6 },
    { material: 'rock', x: 297, top: 31, w: 2, h: 5 },
    { material: 'ground', x: 302, top: 38, w: 2 },
    { material: 'ground', x: 304, top: 40, w: 30 },
    { material: 'rock', x: 302, top: 25, w: 32, h: 9 },
    // The crystal cavern: its ceiling, the floor, the flooded lower shaft (its bottom), the far floor.
    { material: 'rock', x: 334, top: 25, w: 106, h: 15 },
    { material: 'ground', x: 334, top: 58, w: 46 },
    { material: 'ground', x: 380, top: 63, w: 10 },
    { material: 'ground', x: 390, top: 58, w: 41 },
    // The laser's post and the receiver's shelf.
    { material: 'rock', x: 405, top: 56, w: 1, h: 2 },
    { material: 'rock', x: 412, top: 48, w: 1, h: 1 },
    // The corridor to the lift (its ceiling), the shaft's walls, the chamber, the yard on top.
    { material: 'rock', x: 430, top: 40, w: 14, h: 14 },
    { material: 'ground', x: 431, top: 58, w: 13 },
    { material: 'rock', x: 440, top: 30, w: 4, h: 10 },
    { material: 'ground', x: 452, top: 30, w: 70, h: 10 },
    { material: 'rock', x: 452, top: 40, w: 2, h: 18 },
    { material: 'ground', x: 444, top: 58, w: 78 },
    { material: 'rock', x: 500, top: 40, w: 24, h: 18 },
    { material: 'rock', x: 522, top: 0, w: 2 },
  ],

  carves: [
    // Under tunnel 3's floor: an alcove the dynamite opens.
    { x: 306, y: 41, w: 4, h: 2 },
    // A loop of track up in tunnel 3's ceiling, sealed (only something round could ride it).
    { x: 316, y: 30, w: 5, h: 3 },
  ],

  platforms: [
    // Porch roofs along Main Street: cover from the trackers, and a way up.
    { x: 29, y: 25, w: 7 },
    { x: 40, y: 24, w: 8 },
    { x: 53, y: 25, w: 7 },
    { x: 85, y: 25, w: 7 },
    // The water tower's tank.
    { x: 74, y: 22, w: 4 },
    // The hotel atrium: steps up to the balconies.
    { x: 171, y: 22, w: 4 },
    { x: 176, y: 27, w: 3 },
    { x: 181, y: 24, w: 3 },
    { x: 186, y: 23, w: 2 },
    { x: 190, y: 22, w: 6 },
    // The balcony outside the upper hall's window.
    { x: 212, y: 22, w: 3 },
    // The cavern: the broken trestle's deck, a high crystal ledge.
    { x: 334, y: 48, w: 8 },
    { x: 396, y: 48, w: 4 },
    // The mine head's grating over the lift shaft.
    { x: 444, y: 30, w: 8 },
  ],

  water: [{ x: 380, w: 10, surface: 59, depth: 4 }],

  interiors: [
    { x: 118, w: 30, wall: 'jail', top: 20 },
    { x: 152, w: 60, wall: 'hotel', top: 8 },
    { x: 250, w: 84, wall: 'mine' },
    { x: 334, w: 96, wall: 'cavern', floor: 58 },
    { x: 430, w: 10, wall: 'mine', floor: 58, top: 40 },
    { x: 440, w: 12, wall: 'shaft', floor: 58, top: 31 },
    { x: 452, w: 70, wall: 'cavern', floor: 58, top: 31 },
  ],

  introSpawns: [],

  story: {
    bounty: {
      coldOpen: { rvX: 7, floor: 30 },
      duels: [
        { id: 'duel-1', triggerX: 64, x: 70, floor: 30 },
        { id: 'duel-2', triggerX: 100, x: 106, floor: 30 },
      ],
      netTrap: { triggerX: 129, cellX: 141, barsX: 136, floor: 30, sixsixX: 121, generatorX: 131, alien: 'ghostfreak' },
      kraabHunt: { fromX: 252, toX: 333, ambushes: [{ x: 262, floor: 30 }, { x: 287, floor: 36 }, { x: 313, floor: 40 }] },
      dive: { triggerX: 327, cartX: 329, floor: 40, landX: 350, landY: 58, checkpoint: 'cp-dive' },
      crystal: { floor: 58, kraabX: 341, kraabY: 58, tetraxX: 365, alien: 'diamondhead' },
      lift: { triggerX: 446, x: 444, w: 8, bottom: 58, stop: 46, checkpoint: 'cp-hunters' },
      hunters: {
        chamber: { from: 454, to: 499, floor: 58 },
        wall: { x: 452, y: 40, w: 2, h: 18 },
        shaft: { x: 444, w: 8, bottom: 58, top: 30 },
        yard: { from: 440, to: 521, floor: 30 },
        pillarX: 476,
        towerX: 512,
      },
    },
    unlocks: [
      { alien: 'ghostfreak', x: 129, line: 'LET ME OUT OF HERE!', scripted: true },
      { alien: 'diamondhead', x: 350, line: 'THE WATCH... IT\'S READING THE CRYSTALS!', scripted: true },
    ],
    outro: [
      { who: 'gwen', text: 'THREE BOUNTY HUNTERS. AND YOU BEAT ALL OF THEM?', ms: 2200 },
      { who: 'ben', text: 'TECHNICALLY TWO. THE CRYSTAL GUY GAVE UP.', ms: 1900 },
      { who: 'max', text: 'HE DIDN\'T GIVE UP, BEN. HE CHOSE NOT TO FIGHT YOU. THAT\'S DIFFERENT.', ms: 2800 },
      { who: 'ben', text: '...HE SAID TO ASK YOU WHERE YOU LEARNED TO FIGHT.', ms: 2200 },
      { who: 'max', text: 'WHO WANTS GOLD-PANNING? MY TREAT!', ms: 2000 },
    ],
  },

  entities: [
    // ---- The gate
    { type: 'decor', kind: 'townGate', x: 19, y: 30 },
    { type: 'decor', kind: 'hitchingPost', x: 25, y: 30 },

    // ---- Main Street
    { type: 'decor', kind: 'shopFront', x: 32, y: 30, frame: 0 },
    { type: 'decor', kind: 'saloon', x: 44, y: 30 },
    { type: 'decor', kind: 'mouseHole', x: 46.5, y: 30 },
    { type: 'decor', kind: 'shopFront', x: 56, y: 30, frame: 1 },
    { type: 'decor', kind: 'hitchingPost', x: 37, y: 30 },
    { type: 'decor', kind: 'hitchingPost', x: 50, y: 30 },
    { type: 'decor', kind: 'wanted', x: 29.5, y: 28, frame: 0 },
    { type: 'decor', kind: 'wanted', x: 59.5, y: 28, frame: 1 },
    { type: 'decor', kind: 'lanternPost', x: 38, y: 30 },
    { type: 'decor', kind: 'lanternPost', x: 61, y: 30 },
    { type: 'decor', kind: 'wagonWheel', x: 66, y: 30 },
    { type: 'decor', kind: 'crates', x: 68, y: 30 },
    { type: 'decor', kind: 'waterTower', x: 76, y: 30, frame: 0 },
    { type: 'decor', kind: 'lanternPost', x: 81, y: 30 },
    { type: 'decor', kind: 'shopFront', x: 88, y: 30, frame: 3 },
    { type: 'decor', kind: 'coffin', x: 84, y: 30 },
    { type: 'decor', kind: 'coffin', x: 92.5, y: 30 },
    { type: 'decor', kind: 'wanted', x: 91.5, y: 28, frame: 2 },
    { type: 'decor', kind: 'lanternPost', x: 99, y: 30 },
    { type: 'decor', kind: 'crates', x: 103, y: 30 },
    { type: 'decor', kind: 'hitchingPost', x: 110, y: 30 },
    { type: 'decor', kind: 'shopFront', x: 114, y: 30, frame: 2 },
    { type: 'card', id: 'ch5-card-mouse', x: 46, y: 30, requires: 'greymatter' },
    { type: 'alienHint', id: 'ch5-mouse-hint', alien: 'greymatter', x: 44, y: 27, w: 5, h: 3, line: "A MOUSE HOLE... SOMETHING'S SHINING IN THERE. I'D HAVE TO BE TINY." },
    { type: 'card', id: 'ch5-card-tower', x: 75, y: 22 },
    { type: 'smoothy', x: 35, y: 30 },
    { type: 'smoothy', x: 90, y: 30 },
    { type: 'drone', kind: 'tracker', x: 48, y: 19 },
    { type: 'drone', kind: 'tracker', x: 80, y: 18 },
    { type: 'drone', kind: 'tracker', x: 113, y: 19 },
    { type: 'wave', id: 'street-trackers', triggerX: 84, from: 'above', spawns: [{ kind: 'tracker', x: 94, y: 18 }, { kind: 'tracker', x: 99, y: 17 }] },
    { type: 'checkpoint', id: 'cp-street', x: 62, y: 30, density: 'normal', label: 'MAIN STREET' },

    // ---- The jail
    { type: 'checkpoint', id: 'cp-jail', x: 115, y: 30, density: 'sparse', label: 'JAIL' },
    { type: 'decor', kind: 'jailFurniture', x: 125, y: 30, frame: 0 },
    { type: 'decor', kind: 'jailFurniture', x: 142, y: 30, frame: 1 },
    { type: 'decor', kind: 'wanted', x: 123, y: 27, frame: 2 },
    { type: 'decor', kind: 'hangingLantern', x: 127, y: 23 },
    { type: 'decor', kind: 'hangingLantern', x: 141, y: 23 },
    { type: 'phaseWall', id: 'jail-bars', x: 136, y: 22, w: 1, h: 8, look: 'bars' },
    { type: 'phaseWall', id: 'jail-wall', x: 146, y: 24, w: 2, h: 6, look: 'stone' },
    { type: 'smoothy', x: 144, y: 30 },

    // ---- The Grand Hotel
    { type: 'checkpoint', id: 'cp-hotel', x: 149, y: 30, density: 'normal', label: 'HOTEL' },
    { type: 'decor', kind: 'hotelSign', x: 168, y: 8 },
    { type: 'decor', kind: 'barCounter', x: 160, y: 30 },
    { type: 'decor', kind: 'piano', x: 166, y: 30 },
    { type: 'decor', kind: 'hangingLantern', x: 157, y: 14 },
    { type: 'decor', kind: 'hangingLantern', x: 165, y: 14 },
    { type: 'decor', kind: 'hangingLantern', x: 183, y: 13 },
    { type: 'decor', kind: 'jailFurniture', x: 204, y: 22, frame: 1 },
    { type: 'decor', kind: 'crates', x: 208, y: 30 },
    { type: 'phaseWall', id: 'hotel-door-a', x: 170, y: 26, w: 1, h: 4, look: 'boards' },
    { type: 'phaseWall', id: 'hotel-door-b', x: 196, y: 18, w: 1, h: 4, look: 'boards' },
    { type: 'phaseWall', id: 'hotel-door-c', x: 196, y: 26, w: 1, h: 4, look: 'boards' },
    { type: 'drone', kind: 'tracker', x: 179, y: 16 },
    { type: 'drone', kind: 'tracker', x: 189, y: 15 },
    { type: 'smoothy', x: 162, y: 30 },
    { type: 'card', id: 'ch5-card-hotel', x: 205, y: 30 },
    { type: 'smoothy', x: 201, y: 30 },

    // ---- The mine head
    { type: 'checkpoint', id: 'cp-minehead', x: 216, y: 30, density: 'normal', label: 'MINE HEAD' },
    { type: 'decor', kind: 'prospector', x: 221, y: 30 },
    { type: 'decor', kind: 'wagonWheel', x: 225, y: 30 },
    { type: 'decor', kind: 'oreCart', x: 229, y: 30 },
    { type: 'decor', kind: 'headframe', x: 236, y: 30 },
    { type: 'decor', kind: 'lanternPost', x: 243, y: 30 },
    { type: 'decor', kind: 'dynamiteSign', x: 247, y: 27 },
    { type: 'decor', kind: 'minePortal', x: 252, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 241, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 243, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 245, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 247, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 249, y: 30 },
    { type: 'drone', kind: 'tracker', x: 228, y: 19 },
    { type: 'drone', kind: 'tracker', x: 241, y: 18 },
    { type: 'gear', kind: 'crabbot', x: 238, y: 30 },
    { type: 'smoothy', x: 232, y: 30 },

    // ---- The rail tunnels
    { type: 'checkpoint', id: 'cp-tunnels', x: 277, y: 36, density: 'normal', label: 'RAIL TUNNELS' },
    { type: 'decor', kind: 'timbers', x: 256, y: 30 },
    { type: 'decor', kind: 'timbers', x: 266, y: 30 },
    { type: 'decor', kind: 'hangingLantern', x: 261, y: 26 },
    { type: 'decor', kind: 'mineRails', x: 251, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 253, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 255, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 257, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 259, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 261, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 263, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 265, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 267, y: 30 },
    { type: 'decor', kind: 'mineRails', x: 269, y: 30 },
    { type: 'decor', kind: 'timbers', x: 281, y: 36 },
    { type: 'decor', kind: 'timbers', x: 292, y: 36 },
    { type: 'decor', kind: 'hangingLantern', x: 285, y: 32 },
    { type: 'decor', kind: 'dynamiteSign', x: 290, y: 33 },
    { type: 'decor', kind: 'crates', x: 300, y: 36 },
    { type: 'decor', kind: 'timbers', x: 311, y: 40 },
    { type: 'decor', kind: 'timbers', x: 322, y: 40 },
    { type: 'decor', kind: 'hangingLantern', x: 315, y: 35 },
    { type: 'decor', kind: 'hangingLantern', x: 327, y: 35 },
    { type: 'decor', kind: 'mineRails', x: 319, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 321, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 323, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 325, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 327, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 329, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 331, y: 40 },
    { type: 'decor', kind: 'mineRails', x: 333, y: 40 },
    { type: 'gear', kind: 'crabbot', x: 258, y: 30 },
    { type: 'gear', kind: 'crabbot', x: 268, y: 30 },
    { type: 'gear', kind: 'crabbot', x: 287, y: 36 },
    { type: 'gear', kind: 'crabbot', x: 292, y: 36 },
    { type: 'gear', kind: 'crabbot', x: 312, y: 40 },
    { type: 'gear', kind: 'crabbot', x: 320, y: 40 },
    { type: 'dynamite', id: 'cave-in', x: 294, y: 36, breaks: { x: 297, y: 31, w: 2, h: 5 } },
    { type: 'dynamite', id: 'alcove', x: 305, y: 40, breaks: { x: 306, y: 40, w: 4, h: 1 } },
    { type: 'card', id: 'ch5-card-alcove', x: 307, y: 43 },
    { type: 'rockfall', id: 't1-rocks', x: 262, w: 6, ceiling: 25 },
    { type: 'rockfall', id: 't3-rocks', x: 306, w: 13, ceiling: 34 },
    { type: 'card', id: 'ch5-card-loop', x: 318, y: 33, requires: 'cannonbolt' },
    { type: 'alienHint', id: 'ch5-loop-hint', alien: 'cannonbolt', x: 314, y: 34, w: 8, h: 6, line: 'THE RAILS LOOP UP INTO THE ROCK... ONLY SOMETHING ROUND COULD RIDE THAT.' },
    { type: 'smoothy', x: 275, y: 34 },
    { type: 'smoothy', x: 300, y: 36 },

    // ---- THE DEEP DIVE
    { type: 'checkpoint', id: 'cp-dive', x: 323, y: 40, density: 'sparse', label: 'DEEP DIVE' },
    { type: 'smoothy', x: 325, y: 40 },
    { type: 'card', id: 'ch5-card-dive', x: 352, y: 58, reward: 'dive' },

    // ---- The crystal cavern
    { type: 'decor', kind: 'timbers', x: 336, y: 58 },
    { type: 'decor', kind: 'timbers', x: 339.5, y: 58 },
    { type: 'decor', kind: 'timbers', x: 336, y: 53 },
    { type: 'decor', kind: 'timbers', x: 339.5, y: 53 },
    { type: 'decor', kind: 'crystalCluster', x: 347, y: 58, frame: 0 },
    { type: 'decor', kind: 'crystalCluster', x: 358, y: 58, frame: 1 },
    { type: 'decor', kind: 'crystalSpire', x: 368, y: 58 },
    { type: 'decor', kind: 'crystalCluster', x: 377, y: 58, frame: 0 },
    { type: 'decor', kind: 'crystalCluster', x: 393, y: 58, frame: 1 },
    { type: 'decor', kind: 'crystalSpire', x: 409, y: 58 },
    { type: 'decor', kind: 'crystalCluster', x: 424, y: 58, frame: 0 },
    { type: 'checkpoint', id: 'cp-cavern', x: 368, y: 58, density: 'sparse', label: 'CRYSTAL CAVERN' },
    { type: 'gear', kind: 'sentry', x: 374, y: 58 },
    { type: 'gear', kind: 'crabbot', x: 395, y: 58 },
    { type: 'gear', kind: 'sentry', x: 401, y: 58 },
    { type: 'gear', kind: 'crabbot', x: 416, y: 58 },
    { type: 'gear', kind: 'sentry', x: 427, y: 58 },
    { type: 'card', id: 'ch5-card-ledge', x: 397, y: 48 },
    { type: 'card', id: 'ch5-card-flooded', x: 385, y: 63, requires: 'ripjaws' },
    { type: 'alienHint', id: 'ch5-flooded-hint', alien: 'ripjaws', x: 378, y: 54, w: 13, h: 5, line: "THE LOWER SHAFT'S FLOODED... SOMETHING DOWN THERE IS GLINTING." },
    { type: 'laser', id: 'cavern-laser', x: 405, y: 55, dir: 'right' },
    { type: 'receiver', id: 'cavern-receiver', x: 412, y: 47, gate: 'cavern-gate', kills: 'cavern-laser' },
    { type: 'crystalGate', id: 'cavern-gate', x: 430, y: 54, w: 1, h: 4 },
    { type: 'smoothy', x: 371, y: 58 },
    { type: 'smoothy', x: 391, y: 58 },

    // ---- The lift
    { type: 'checkpoint', id: 'cp-lift', x: 436, y: 58, density: 'sparse', label: 'THE LIFT' },
    { type: 'decor', kind: 'hangingLantern', x: 434, y: 55 },
    { type: 'smoothy', x: 439, y: 58 },
    { type: 'checkpoint', id: 'cp-hunters', x: 445, y: 58, density: 'sparse', label: 'THE HUNTERS', hidden: true },

    // ---- THE HUNTERS: the chamber, the shaft, the yard
    { type: 'decor', kind: 'crystalCluster', x: 459, y: 58, frame: 1 },
    { type: 'decor', kind: 'crystalCluster', x: 494, y: 58, frame: 0 },
    { type: 'decor', kind: 'headframe', x: 448, y: 30 },
    { type: 'decor', kind: 'lanternPost', x: 458, y: 30 },
    { type: 'decor', kind: 'oreCart', x: 468, y: 30 },
    { type: 'decor', kind: 'crates', x: 482, y: 30 },
    { type: 'decor', kind: 'lanternPost', x: 492, y: 30 },
    { type: 'boss', kind: 'hunters', x: 476, y: 58, arenaFrom: 454, arenaTo: 499, triggerX: 455, floor: 58 },
  ],

  prompts: [
    { id: 'gate', x: 14, w: 8, text: 'SILVER SPUR. POPULATION: ZERO.' },
    { id: 'cover', x: 39, w: 10, text: 'DRONES PAINT ME, MISSILES FOLLOW. GET UNDER A PORCH!' },
    { id: 'tower', x: 72, w: 7, text: 'A CARD ON TOP OF THE WATER TOWER...', formText: { stinkfly: 'FLY UP TO THE TANK!', heatblast: '{JUMP} IN THE AIR: ROCKET JUMP!', diamondhead: '{UP}+{K} IN THE AIR: A CRYSTAL STEP!' } },
    { id: 'cell', x: 137, w: 9, text: "LOCKED IN. THE BARS WON'T BUDGE...", formText: { ghostfreak: 'HOLD {K}: PHASE THROUGH THE WALL!' } },
    { id: 'door-a', x: 166, w: 4, text: 'BOARDED UP TIGHT.', formText: { ghostfreak: 'HOLD {K} AND WALK RIGHT THROUGH!' } },
    { id: 'door-b', x: 190, w: 6, text: 'MORE BOARDED DOORS...', formText: { ghostfreak: 'HOLD {K}: UPSTAIRS OR DOWN, THROUGH THE BOARDS!' } },
    { id: 'dynamite', x: 288, w: 8, text: 'A CAVE-IN. AND DYNAMITE. ALL I NEED IS A SPARK...', formText: { heatblast: '{J} THE DYNAMITE FROM A SAFE DISTANCE!' } },
    { id: 'station', x: 324, w: 4, text: 'AN ORE CART ON A TRACK. ...DOWNHILL ALL THE WAY.' },
    { id: 'pit', x: 375, w: 5, text: 'THE SHAFT IS FLOODED. TOO FAR TO JUMP...', formText: { diamondhead: '{UP}+{K}: GROW A CRYSTAL PLATFORM!', xlr8: 'FAST ENOUGH TO RUN ON WATER!', stinkfly: 'FLY OVER IT!' } },
    { id: 'laser', x: 403, w: 13, text: 'A SECURITY LASER... AND A CRYSTAL GATE.', formText: { diamondhead: 'FACE THE BEAM, HOLD {K} AND {UP}: HIT THE RECEIVER!' } },
    { id: 'lift', x: 440, w: 4, text: 'THE MINE LIFT. NEXT STOP: THE SURFACE.' },
  ],

  ambience: [
    { x: 0, ambient: 'ghosttown' },
    { x: 118, ambient: 'jail' },
    { x: 148, ambient: 'ghosttown' },
    { x: 152, ambient: 'hotel' },
    { x: 212, ambient: 'ghosttown' },
    { x: 214, ambient: 'minehead' },
    { x: 250, ambient: 'mine' },
    { x: 334, ambient: 'cavern' },
    { x: 430, ambient: 'mine' },
    { x: 440, ambient: 'minehead' },
    { x: 440, ambient: 'shaft', fromRow: 31 },
    { x: 452, ambient: 'cavern', fromRow: 31 },
  ],
};
