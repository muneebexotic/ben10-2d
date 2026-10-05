import type { LevelData } from './types';

/**
 * Chapter 4: Kevin 11.
 *
 * Main Street at dusk (2-35) > the GAME ZONE arcade, where Ben meets Kevin and
 * the animatronics wake (38-111) > the LASER LAIR, where the turrets go live
 * and Upgrade arrives (112-161) > HIGH SCORE ALLEY and the SUMO SLAMMERS
 * cabinet (162-197) > Rosewood Station on the abandoned Line 11, decks over
 * the track bed and trains underneath (198-261) > the maintenance line, a cart
 * on the live rail (262-299) > the turn: Kevin absorbs Ben's alien (300-335) >
 * the power depot, Kevin hunting from ahead (336-387) > KEVIN 11's arena in
 * the substation hall (388-423).
 *
 * Standing entities use the surface row they stand on; flyers use the row
 * they hover in. The street and arcade floor is row 30; underground it's 33.
 */
export const CHAPTER_4: LevelData = {
  id: 'ch4',
  chapter: 4,
  name: 'KEVIN 11',
  theme: 'city',
  parTimeMs: 540_000,
  width: 424,
  height: 40,
  playerStart: { x: 4, y: 30 },
  podTriggerX: -1,

  solids: [
    { material: 'rock', x: 0, top: 0, w: 2 },
    // Main Street, the arcade, the laser tag arena and the alley share one floor.
    { material: 'ground', x: 2, top: 30, w: 192 },
    // The arcade's front wall, up above its facade (the doors under it are open).
    { material: 'rock', x: 36, top: 0, w: 2, h: 24 },
    // Ceilings: the GAME ZONE, the LASER LAIR, HIGH SCORE ALLEY.
    { material: 'rock', x: 38, top: 0, w: 74, h: 10 },
    { material: 'rock', x: 112, top: 0, w: 50, h: 12 },
    { material: 'rock', x: 162, top: 0, w: 38, h: 10 },
    // The claw machine's pedestal (a card sealed inside) and the band stage.
    { material: 'rock', x: 88, top: 27, w: 4, h: 3 },
    { material: 'ground', x: 96, top: 27, w: 11, h: 3 },
    // Laser tag cover, and the wall over the exit shutter.
    { material: 'rock', x: 121, top: 28, w: 2, h: 2 },
    { material: 'rock', x: 133, top: 28, w: 2, h: 2 },
    { material: 'rock', x: 147, top: 28, w: 2, h: 2 },
    { material: 'rock', x: 160, top: 12, w: 2, h: 14 },
    // Stairs down to the subway.
    { material: 'ground', x: 194, top: 31, w: 2 },
    { material: 'ground', x: 196, top: 32, w: 2 },
    // Rosewood Station: deck A, the track bed under it, deck B and the maintenance bay.
    { material: 'ground', x: 198, top: 0, w: 64, h: 15 },
    { material: 'ground', x: 198, top: 33, w: 30, h: 2 },
    { material: 'ground', x: 198, top: 38, w: 70 },
    { material: 'ground', x: 236, top: 33, w: 32, h: 2 },
    // Deck B's end wall drops to the tracks: under the deck is a dead end, never a walk into the live rail.
    { material: 'ground', x: 266, top: 35, w: 2, h: 3 },
    // The maintenance line: a low tunnel over the live rail.
    { material: 'ground', x: 262, top: 0, w: 42, h: 29 },
    { material: 'rock', x: 268, top: 39, w: 28 },
    // The far bay, the turn's room, the power depot and the arena share the deep floor.
    { material: 'ground', x: 296, top: 33, w: 126 },
    { material: 'ground', x: 304, top: 0, w: 30, h: 21 },
    // The turn room's exit wall (the door Kevin rips open is a shutter in rows 29-32).
    { material: 'ground', x: 334, top: 0, w: 2, h: 29 },
    { material: 'ground', x: 336, top: 0, w: 52, h: 15 },
    // The depot: the wall under the mezzanine (a shutter below it), the laser vault and the cracked-wall
    // closet (low blocks anyone hops over), and the sealed room hanging off the mezzanine's end.
    { material: 'rock', x: 356, top: 26, w: 2, h: 3 },
    { material: 'rock', x: 345, top: 30, w: 5, h: 3 },
    { material: 'rock', x: 376, top: 30, w: 5, h: 3 },
    { material: 'rock', x: 373, top: 17, w: 5, h: 8 },
    // KEVIN 11's arena.
    { material: 'ground', x: 388, top: 0, w: 36, h: 17 },
    { material: 'ground', x: 422, top: 0, w: 2 },
  ],

  carves: [
    // The claw machine's sealed prize slot.
    { x: 89, y: 28, w: 2, h: 1 },
    // The crawlspace under the band stage, behind a hidden door.
    { x: 96, y: 28, w: 8, h: 2 },
    // The laser vault's slot, the cracked-wall closet and the sealed room.
    { x: 346, y: 31, w: 3, h: 1 },
    { x: 376, y: 31, w: 4, h: 2 },
    { x: 374, y: 21, w: 3, h: 3 },
  ],

  platforms: [
    // Storefront awnings and a rooftop.
    { x: 8, y: 27, w: 5 },
    { x: 19, y: 27, w: 5 },
    { x: 19, y: 25, w: 7 },
    // The prize counter and the shelf over it.
    { x: 79, y: 28, w: 6 },
    { x: 80, y: 24, w: 4 },
    // The LASER LAIR's catwalk (the lift rises to it).
    { x: 140, y: 17, w: 7 },
    // A maintenance step up out of the station's track bed.
    { x: 234, y: 35, w: 2 },
    // The power depot's grating mezzanine (drop through it anywhere).
    // The grating stops short of the sealed room, so walking off its end drops to the floor.
    { x: 341, y: 25, w: 29 },
    // KEVIN 11's arena: a low ledge in each corner, scaffolds, a catwalk.
    { x: 391, y: 30, w: 3 },
    { x: 417, y: 30, w: 3 },
    { x: 396, y: 27, w: 5 },
    { x: 410, y: 27, w: 5 },
    { x: 403, y: 23, w: 5 },
  ],

  water: [{ x: 268, w: 28, surface: 33, depth: 6, kind: 'rail' }],

  interiors: [
    { x: 36, w: 76, wall: 'arcade' },
    { x: 112, w: 50, wall: 'lair' },
    { x: 162, w: 36, wall: 'arcade' },
    { x: 198, w: 64, wall: 'subway', floor: 33 },
    { x: 262, w: 42, wall: 'tunnel', floor: 33 },
    { x: 304, w: 32, wall: 'substation', floor: 33 },
    { x: 336, w: 52, wall: 'tunnel', floor: 33 },
    { x: 388, w: 36, wall: 'substation', floor: 33 },
  ],

  introSpawns: [],

  story: {
    cityIntro: { x: 8, y: 30, arcadeX: 34 },
    kevin: {
      meetX: 44,
      kevinX: 50,
      breakerX: 55,
      spawns: [
        { kind: 'mascot', x: 98, y: 27 },
        { kind: 'mascot', x: 102, y: 27 },
        { kind: 'mascot', x: 105, y: 27 },
      ],
      untilX: 262,
    },
    lair: { triggerX: 117, fromX: 114, toX: 160, floor: 30, kevinX: 111, alien: 'upgrade' },
    drain: { triggerX: 244, fromX: 198, toX: 304 },
    absorb: { triggerX: 308, fromX: 304, toX: 333, floor: 33, kevinX: 322, exitX: 336 },
    hunt: { fromX: 336, toX: 386, floor: 33 },
    unlocks: [{ alien: 'upgrade', x: 118, line: "THESE AREN'T TOY LASERS ANYMORE!", scripted: true }],
    outro: [
      { who: 'gwen', text: 'SO. MAKE A NEW FRIEND?', ms: 1800 },
      { who: 'ben', text: 'WORST. PLAYDATE. EVER.', ms: 1500 },
      { who: 'max', text: 'SOME PEOPLE SEE POWER AND ONLY WANT MORE OF IT. REMEMBER THAT, BEN.', ms: 3000 },
      { who: 'ben', text: "HE'LL BE BACK. ...HE'S GOT MY HIGH SCORES TO BEAT.", ms: 2400 },
    ],
  },

  entities: [
    // ---- Main Street at dusk
    { type: 'decor', kind: 'streetLamp', x: 3, y: 30 },
    { type: 'decor', kind: 'storefront', x: 10, y: 30, frame: 0 },
    { type: 'decor', kind: 'powerPole', x: 15, y: 30 },
    { type: 'decor', kind: 'storefront', x: 22, y: 30, frame: 1 },
    { type: 'decor', kind: 'neonSign', x: 22, y: 19, frame: 1 },
    { type: 'decor', kind: 'hydrant', x: 17, y: 30 },
    { type: 'decor', kind: 'newsstand', x: 28, y: 30 },
    { type: 'decor', kind: 'streetLamp', x: 31, y: 30 },
    { type: 'decor', kind: 'trashCan', x: 33, y: 30 },
    { type: 'decor', kind: 'arcadeFront', x: 36.5, y: 30 },
    { type: 'card', id: 'ch4-card-sign', x: 22, y: 16 },
    { type: 'smoothy', x: 26, y: 30 },

    // ---- The GAME ZONE
    { type: 'checkpoint', id: 'cp-arcade', x: 40, y: 30, density: 'normal', label: 'GAME ZONE' },
    { type: 'cabinet', id: 'cab-1', x: 46, y: 30, frame: 0 },
    { type: 'cabinet', id: 'cab-2', x: 48, y: 30, frame: 1 },
    { type: 'decor', kind: 'ticketMachine', x: 52, y: 30 },
    { type: 'decor', kind: 'breakerBox', x: 55, y: 27 },
    { type: 'cabinet', id: 'cab-3', x: 58, y: 30, frame: 2 },
    { type: 'cabinet', id: 'cab-4', x: 60, y: 30, frame: 3 },
    { type: 'cabinet', id: 'cab-5', x: 62, y: 30, frame: 0 },
    { type: 'decor', kind: 'skeeBall', x: 67, y: 30 },
    { type: 'cabinet', id: 'cab-6', x: 71, y: 30, frame: 1 },
    { type: 'cabinet', id: 'cab-7', x: 73, y: 30, frame: 2 },
    { type: 'decor', kind: 'ticketMachine', x: 76, y: 30 },
    { type: 'decor', kind: 'prizeCounter', x: 82, y: 30 },
    { type: 'decor', kind: 'neonSign', x: 82, y: 22, frame: 2 },
    { type: 'smoothy', x: 81, y: 24 },
    { type: 'smoothy', x: 51, y: 30 },
    { type: 'decor', kind: 'clawMachine', x: 89.5, y: 30 },
    { type: 'card', id: 'ch4-card-claw', x: 89, y: 29, requires: 'greymatter' },
    { type: 'alienHint', id: 'ch4-claw-hint', alien: 'greymatter', x: 86, y: 26, w: 6, h: 4, line: "A CARD IN THE CLAW MACHINE... I'D HAVE TO BE TINY TO GET IN THERE." },
    { type: 'decor', kind: 'bandStage', x: 101.5, y: 27 },
    { type: 'hiddenDoor', id: 'ch4-stage-door', x: 96, y: 28, w: 8, h: 2 },
    { type: 'card', id: 'ch4-card-stage', x: 101, y: 30, requires: 'wildmutt' },
    { type: 'decor', kind: 'neonSign', x: 109, y: 24, frame: 0 },

    // ---- The LASER LAIR
    { type: 'checkpoint', id: 'cp-lair', x: 113, y: 30, density: 'sparse', label: 'LASER LAIR' },
    { type: 'decor', kind: 'uvLight', x: 118, y: 12.5 },
    { type: 'decor', kind: 'uvLight', x: 130, y: 12.5 },
    { type: 'decor', kind: 'uvLight', x: 142, y: 12.5 },
    { type: 'decor', kind: 'uvLight', x: 154, y: 12.5 },
    { type: 'decor', kind: 'laserBarrier', x: 121.5, y: 30, frame: 0 },
    { type: 'decor', kind: 'laserBarrier', x: 133.5, y: 30, frame: 1 },
    { type: 'decor', kind: 'laserBarrier', x: 147.5, y: 30, frame: 0 },
    { type: 'turret', id: 'lair-t1', x: 128, y: 30, hostile: true, facing: -1 },
    { type: 'turret', id: 'lair-t2', x: 141, y: 11, hostile: true, ceiling: true, facing: -1 },
    { type: 'turret', id: 'lair-t3', x: 153, y: 30, hostile: true, facing: -1 },
    { type: 'lift', id: 'lair-lift', x: 137, y: 30, w: 3, toY: 17 },
    { type: 'decor', kind: 'catwalkRail', x: 142, y: 17 },
    { type: 'decor', kind: 'catwalkRail', x: 144, y: 17 },
    { type: 'card', id: 'ch4-card-lair', x: 145, y: 17 },
    { type: 'techDoor', id: 'lair-door', x: 160, y: 26, w: 2, h: 4 },

    // ---- HIGH SCORE ALLEY
    { type: 'checkpoint', id: 'cp-highscore', x: 164, y: 30, density: 'normal', label: 'HIGH SCORE' },
    { type: 'decor', kind: 'poster', x: 168, y: 23, frame: 0 },
    { type: 'sumo', id: 'sumo', x: 172, y: 30, reward: 'sumo' },
    { type: 'card', id: 'ch4-card-sumo', x: 172, y: 30, reward: 'sumo' },
    { type: 'cabinet', id: 'cab-8', x: 178, y: 30, frame: 3 },
    { type: 'cabinet', id: 'cab-9', x: 180, y: 30, frame: 0 },
    { type: 'cabinet', id: 'cab-10', x: 182, y: 30, frame: 1, flip: true },
    { type: 'cabinet', id: 'cab-11', x: 184, y: 30, frame: 2, flip: true },
    { type: 'decor', kind: 'neonSign', x: 188, y: 24, frame: 2 },
    { type: 'smoothy', x: 175, y: 30 },
    { type: 'wave', id: 'alley-toons', triggerX: 176, from: 'right', spawns: [{ kind: 'mascot', x: 187, y: 29 }, { kind: 'mascot', x: 190, y: 29 }, { kind: 'mascot', x: 193, y: 29 }] },
    { type: 'decor', kind: 'warningSign', x: 195, y: 27 },

    // ---- Rosewood Station
    { type: 'checkpoint', id: 'cp-station', x: 200, y: 33, density: 'normal', label: 'ROSEWOOD STATION' },
    { type: 'decor', kind: 'turnstile', x: 202, y: 33 },
    { type: 'decor', kind: 'pillar', x: 206, y: 33 },
    { type: 'decor', kind: 'stationSign', x: 212, y: 28 },
    { type: 'decor', kind: 'bench', x: 215, y: 33 },
    { type: 'decor', kind: 'pillar', x: 219, y: 33 },
    { type: 'decor', kind: 'subwayMap', x: 223, y: 29 },
    { type: 'decor', kind: 'trashCan', x: 226, y: 33 },
    { type: 'decor', kind: 'pillar', x: 210, y: 38 },
    { type: 'decor', kind: 'pillar', x: 222, y: 38 },
    { type: 'decor', kind: 'pillar', x: 246, y: 38 },
    { type: 'decor', kind: 'pillar', x: 258, y: 38 },
    { type: 'decor', kind: 'warningSign', x: 229, y: 31 },
    { type: 'decor', kind: 'pillar', x: 240, y: 33 },
    { type: 'decor', kind: 'stationSign', x: 249, y: 28 },
    { type: 'decor', kind: 'bench', x: 252, y: 33 },
    { type: 'decor', kind: 'pillar', x: 256, y: 33 },
    { type: 'robot', kind: 'trackbot', x: 208, y: 33 },
    { type: 'robot', kind: 'trackbot', x: 220, y: 33 },
    { type: 'robot', kind: 'trackbot', x: 246, y: 33 },
    { type: 'turret', id: 'station-t1', x: 259, y: 33, hostile: true, facing: -1 },
    { type: 'smoothy', x: 226, y: 33 },
    { type: 'smoothy', x: 238, y: 33 },
    { type: 'trains', id: 'line11', fromX: 198, toX: 268, y: 38, everyMs: 9000, firstMs: 3500 },

    // ---- The maintenance line
    { type: 'checkpoint', id: 'cp-line', x: 263, y: 33, density: 'sparse', label: 'MAINTENANCE LINE' },
    { type: 'cart', id: 'line-cart', x: 264, y: 33, toX: 293, barrier: { x: 296, y: 29, h: 4 }, exit: { x: 297, y: 32 } },
    { type: 'decor', kind: 'tunnelLight', x: 272, y: 29.6 },
    { type: 'decor', kind: 'tunnelLight', x: 282, y: 29.6 },
    { type: 'decor', kind: 'tunnelLight', x: 292, y: 29.6 },
    { type: 'decor', kind: 'cables', x: 277, y: 30 },
    { type: 'decor', kind: 'cables', x: 289, y: 30 },
    { type: 'robot', kind: 'trackbot', x: 298, y: 33 },
    { type: 'robot', kind: 'trackbot', x: 300, y: 33 },

    // ---- The turn
    { type: 'checkpoint', id: 'cp-turn', x: 302, y: 33, density: 'sparse', label: 'THE TURN' },
    { type: 'decor', kind: 'transformer', x: 310, y: 33 },
    { type: 'decor', kind: 'cables', x: 314, y: 23 },
    { type: 'decor', kind: 'generator', x: 318, y: 33 },
    { type: 'decor', kind: 'warningSign', x: 324, y: 29 },
    { type: 'decor', kind: 'transformer', x: 329, y: 33 },
    { type: 'techDoor', id: 'turn-door', x: 334, y: 29, w: 2, h: 4 },

    // ---- The power depot
    { type: 'checkpoint', id: 'cp-depot', x: 336, y: 33, density: 'normal', label: 'POWER DEPOT' },
    { type: 'lift', id: 'depot-lift', x: 338, y: 33, w: 3, toY: 25 },
    { type: 'decor', kind: 'securityLaser', x: 344, y: 33 },
    { type: 'card', id: 'ch4-card-laser', x: 347, y: 32, requires: 'diamondhead' },
    { type: 'alienHint', id: 'ch4-laser-hint', alien: 'diamondhead', x: 341, y: 29, w: 4, h: 4, line: 'A VAULT BEHIND A SECURITY LASER... IF ONLY I COULD BOUNCE IT BACK.' },
    { type: 'techDoor', id: 'depot-door', x: 356, y: 29, w: 2, h: 4 },
    { type: 'decor', kind: 'generator', x: 352, y: 33 },
    { type: 'decor', kind: 'tunnelLight', x: 348, y: 15.6 },
    { type: 'decor', kind: 'tunnelLight', x: 364, y: 15.6 },
    { type: 'decor', kind: 'catwalkRail', x: 346, y: 25 },
    { type: 'decor', kind: 'catwalkRail', x: 352, y: 25 },
    { type: 'decor', kind: 'catwalkRail', x: 362, y: 25 },
    { type: 'decor', kind: 'transformer', x: 368, y: 33 },
    { type: 'crackedWall', id: 'ch4-depot-wall', x: 376, y: 31, h: 2, requires: 'fourarms' },
    { type: 'card', id: 'ch4-card-depot', x: 378, y: 33, requires: 'fourarms' },
    { type: 'decor', kind: 'sealedDoor', x: 373, y: 24 },
    { type: 'card', id: 'ch4-card-sealed', x: 375, y: 24, requires: 'ghostfreak' },
    { type: 'alienHint', id: 'ch4-sealed-hint', alien: 'ghostfreak', x: 368, y: 21, w: 5, h: 4, line: 'NO DOOR. NO WAY IN... UNLESS I COULD WALK THROUGH WALLS.' },
    { type: 'robot', kind: 'voltbot', x: 350, y: 33 },
    { type: 'robot', kind: 'voltbot', x: 366, y: 33 },
    { type: 'robot', kind: 'trackbot', x: 360, y: 25 },
    { type: 'turret', id: 'depot-t1', x: 367, y: 25, hostile: true, facing: -1 },
    { type: 'smoothy', x: 362, y: 33 },
    { type: 'smoothy', x: 368, y: 25 },
    { type: 'checkpoint', id: 'cp-kevin', x: 386, y: 33, density: 'sparse', label: 'KEVIN 11' },

    // ---- KEVIN 11's arena
    { type: 'decor', kind: 'transformer', x: 392, y: 30 },
    { type: 'decor', kind: 'generator', x: 406, y: 33 },
    { type: 'decor', kind: 'transformer', x: 418, y: 30 },
    { type: 'decor', kind: 'cables', x: 400, y: 18 },
    { type: 'decor', kind: 'cables', x: 412, y: 18 },
    { type: 'boss', kind: 'kevin', x: 410, y: 33, arenaFrom: 390, arenaTo: 422, triggerX: 394, floor: 33 },
  ],

  prompts: [
    { id: 'sign', x: 16, w: 11, text: "A CARD UP ON THAT SIGN... I'D NEED A BOOST", alienText: 'A CARD ON THE SIGN!', formText: { heatblast: 'FROM THE ROOF: {JUMP} IN THE AIR, ROCKET JUMP!', stinkfly: 'FLY UP TO THE SIGN!' } },
    { id: 'lair', x: 114, w: 4, text: 'LASER TAG! ...WAIT, ARE THOSE REAL LASERS?' },
    { id: 'lift', x: 134, w: 6, text: 'A DEAD LIFT. NO POWER...', formText: { upgrade: '{K} INTO THE LIFT TO POWER IT UP!' } },
    { id: 'shutter', x: 155, w: 5, text: 'A SECURITY SHUTTER. NOTHING BREAKS THAT...', formText: { upgrade: '{K} INTO THE KEYPAD!' } },
    { id: 'sumo', x: 168, w: 7, text: "KEV'S HIGH SCORE. ON EVERY SINGLE TABLE.", formText: { upgrade: "{K} INTO THE CABINET: BEAT KEV'S SCORE!" } },
    { id: 'gap', x: 225, w: 4, text: 'PLATFORM CLOSED. DOWN ON THE TRACKS... WATCH FOR TRAINS!' },
    { id: 'cart', x: 262, w: 5, text: 'A DEAD CART ON A LIVE RAIL...', formText: { upgrade: '{K} INTO THE CART! FULL SPEED AT THE BOARDS!' } },
    { id: 'depot', x: 338, w: 5, text: 'DEAD LIFTS AND LOCKED SHUTTERS...', formText: { upgrade: '{K} INTO THE LIFT OR THE SHUTTER!' } },
  ],

  ambience: [
    { x: 0, ambient: 'downtown' },
    { x: 36, ambient: 'arcade' },
    { x: 112, ambient: 'lair' },
    { x: 162, ambient: 'arcade' },
    { x: 198, ambient: 'subway' },
    { x: 262, ambient: 'tunnel' },
    { x: 304, ambient: 'substation' },
    { x: 336, ambient: 'tunnel' },
    { x: 388, ambient: 'substation' },
  ],
};
