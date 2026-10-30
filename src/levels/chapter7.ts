import type { EntitySpawn, LevelData, PlatformSpan, SolidRect } from './types';

/**
 * Chapter 7: The Plumbers (GAME_DESIGN.md, Act 3). PLUMBER BASE ARABIAN DEEP,
 * on the sea floor off Karachi, in the HD cartoon look. The jetty and the
 * descent play as a cinematic; play starts where the capsule docks.
 *
 * The base is carved out of solid hull: decks (ground) under rooms, bulkhead
 * (rock) everywhere else. Water is the base's tanks (`tank` entities), which
 * every form swims; pumps, a valve and the story move their levels.
 *
 *   0-24    the docking bay (the capsule docks at 9)
 *   24-66   the docking ring: Max's reveal and locker, the lockdown, the hub
 *   66-150  the flooded ring: a submerged tunnel with air pockets, currents, the valve and its door
 *   150-182 the reactor (Kevin; the flood; Ripjaws)
 *   183-262 the open sea outside the hull
 *   263-341 the pump hall: three tanks, three consoles, two pressure doors
 *   342-411 the containment block
 *   411-452 the moon pool (DEEPMAW): decks either side of a pool, Max's booth over it
 */

const W = 454;
const H = 50;

/**
 * The terrain is built as a grid, in order (carving a room, then putting a
 * wall back inside it), then written out as one solid run per row.
 */
type Mat = 0 | 1 | 2;
const EMPTY: Mat = 0;
const GROUND: Mat = 1;
const ROCK: Mat = 2;
const grid: Mat[][] = Array.from({ length: H }, () => new Array<Mat>(W).fill(ROCK));
const platforms: PlatformSpan[] = [];

function fill(x: number, y: number, w: number, h: number, m: Mat): void {
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) grid[yy][xx] = m;
}

/** A room: open from row `ceil` down to its deck on row `floor` (the deck itself is plating, two rows thick). */
function room(x: number, w: number, ceil: number, floor: number): void {
  fill(x, ceil, w, floor - ceil, EMPTY);
  fill(x, floor, w, 2, GROUND);
}

function carve(x: number, y: number, w: number, h: number): void {
  fill(x, y, w, h, EMPTY);
}

/** A block of bulkhead put back inside a room (a wall, a pillar, a sill). */
function wall(x: number, top: number, w: number, h: number): void {
  fill(x, top, w, h, ROCK);
}

/** A deck step or ledge inside a room (plating on top). */
function ledge(x: number, top: number, w: number, h: number): void {
  fill(x, top, w, h, GROUND);
}

/** The grid as solid runs, one per row and material. */
function runs(): SolidRect[] {
  const out: SolidRect[] = [];
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const m = grid[y][x];
      if (m === EMPTY) {
        x++;
        continue;
      }
      let end = x;
      while (end < W && grid[y][end] === m) end++;
      out.push({ material: m === GROUND ? 'ground' : 'rock', x, top: y, w: end - x, h: 1 });
      x = end;
    }
  }
  return out;
}

// ---- The docking bay and the docking ring
room(2, 22, 22, 40);
room(24, 34, 30, 40);
// The locker room: a shelf over Max's locker.
platforms.push({ x: 31, y: 36, w: 4 });
// Catwalks along the ring.
platforms.push({ x: 41, y: 35, w: 6 }, { x: 51, y: 34, w: 5 });
// The control hub: a taller room with its consoles.
room(58, 9, 26, 40);
ledge(60, 37, 4, 3);

// ---- The flooded ring
room(67, 3, 30, 40);
// Tank F: open water, then a long tunnel with its ceiling under the surface, then open water again.
room(70, 58, 30, 46);
// The tunnel's ceiling, with two air pockets notched up into it.
wall(89, 30, 23, 13);
carve(96, 39, 3, 4);
carve(105, 40, 3, 3);
// An island in the first pool, a ledge for the valve at the far end.
ledge(78, 37, 4, 9);
ledge(124, 38, 4, 8);
// The pressure door's frame (the door fills 128, rows 31-45), then tank G and the steps out of it.
room(129, 13, 30, 46);
ledge(139, 44, 3, 2);
ledge(141, 42, 1, 4);
room(142, 8, 30, 40);
ledge(140, 40, 2, 6);

// ---- The reactor
room(150, 32, 20, 40);
platforms.push({ x: 154, y: 32, w: 6 }, { x: 172, y: 32, w: 7 }, { x: 162, y: 28, w: 6 });

// ---- The open sea: everything outside the hull, up to the surface far above, over a rolling sea floor
carve(183, 0, 80, 46);
ledge(183, 42, 17, 8);
ledge(200, 44, 15, 6);
ledge(215, 40, 6, 10);
ledge(221, 43, 11, 7);
ledge(232, 45, 13, 5);
ledge(245, 43, 18, 7);
// A rock outcrop with the coral cave in it.
wall(232, 30, 11, 15);
carve(234, 38, 7, 5);
carve(233, 40, 1, 2);
// Coral ledges.
platforms.push({ x: 190, y: 34, w: 5 }, { x: 206, y: 30, w: 4 }, { x: 224, y: 33, w: 5 }, { x: 248, y: 35, w: 5 });
// The intake into the pump hall, low in the hull.
carve(262, 40, 2, 5);

// ---- The pump hall
// P1: the flooded intake room.
room(264, 18, 30, 46);
// P2: the shaft, with the console ledge; its exit high on the right.
room(283, 18, 22, 46);
ledge(295, 36, 6, 2);
carve(301, 23, 1, 3);
// P3: the tall tank with the card at its bottom; a platform for its console.
room(302, 18, 22, 46);
platforms.push({ x: 303, y: 27, w: 5 });
// P4: the corridor to containment, and the steps up.
room(321, 21, 30, 46);
ledge(334, 44, 3, 2);
ledge(337, 42, 3, 4);
// A sealed chute in P4's ceiling (only a rolling ball gets through it).
carve(325, 26, 8, 2);
// A ledge high up P2's shaft (only a vine reaches it).
carve(286, 17, 3, 5);

// ---- Containment
room(340, 71, 30, 40);
platforms.push({ x: 352, y: 35, w: 6 }, { x: 372, y: 34, w: 6 }, { x: 392, y: 35, w: 5 });

// ---- The moon pool: one screen wide (40 tiles), decks on row 40 either side of the
// pool, six rows deep. Max's booth over it is background art.
room(411, 41, 26, 40);
carve(416, 40, 30, 6);
ledge(416, 46, 30, 4);

const entities: EntitySpawn[] = [
  // ---- Docking bay
  { type: 'hatch', id: 'h-bay', x: 24, y: 30, h: 10 },
  { type: 'checkpoint', id: 'cp-docking', x: 26, y: 40, density: 'sparse', label: 'DOCKING RING' },
  { type: 'baseConsole', id: 'c-ring', x: 28, y: 40, wakes: 'ring' },
  { type: 'card', id: 'ch7-card-locker', x: 33, y: 36 },
  { type: 'deep', kind: 'warden', x: 44, y: 34 },
  { type: 'deep', kind: 'warden', x: 54, y: 33 },
  { type: 'deep', kind: 'warden', x: 49, y: 37 },
  { type: 'smoothy', x: 47, y: 40 },
  { type: 'baseConsole', id: 'c-hub', x: 62, y: 37, wakes: 'hub' },
  { type: 'hatch', id: 'h-hub', x: 66, y: 30, h: 10 },

  // ---- Flooded ring
  { type: 'checkpoint', id: 'cp-flooded', x: 68, y: 40, density: 'normal', label: 'FLOODED RING' },
  { type: 'tank', id: 't-flood', x: 70, w: 58, top: 30, bottom: 46, level: 41 },
  { type: 'deep', kind: 'grunt', x: 80, y: 37 },
  { type: 'deep', kind: 'jelly', x: 85, y: 43 },
  { type: 'deep', kind: 'jelly', x: 100, y: 44 },
  { type: 'deep', kind: 'eel', x: 108, y: 45 },
  { type: 'deep', kind: 'jelly', x: 117, y: 42 },
  { type: 'airPocket', x: 96, y: 39, w: 3, h: 3 },
  { type: 'airPocket', x: 105, y: 40, w: 3, h: 2 },
  // A burst pipe pushing back against the swimmer in the last stretch; another guards the card's nook, on and off.
  { type: 'current', id: 'cur-pipe', x: 113, y: 42, w: 6, h: 4, vx: -70, vy: -10 },
  { type: 'current', id: 'cur-nook', x: 118, y: 43, w: 4, h: 3, vx: -150, vy: 0, pulse: { onMs: 2200, offMs: 1600 } },
  { type: 'card', id: 'ch7-card-pipe', x: 121, y: 45 },
  { type: 'valve', id: 'v-flood', x: 126, y: 38, a: 't-flood', b: 't-g' },
  { type: 'pressureDoor', id: 'd-flood', x: 128, y: 31, h: 15, left: 't-flood', right: 't-g' },
  { type: 'tank', id: 't-g', x: 129, w: 13, top: 30, bottom: 46, level: 46 },
  { type: 'deep', kind: 'grunt', x: 145, y: 40 },
  { type: 'smoothy', x: 143, y: 40 },

  // ---- Reactor
  { type: 'hatch', id: 'h-reactor-in', x: 150, y: 30, h: 10, open: true },
  { type: 'checkpoint', id: 'cp-reactor', x: 152, y: 40, density: 'sparse', label: 'THE REACTOR' },
  { type: 'tank', id: 't-reactor', x: 151, w: 31, top: 20, bottom: 40, level: 40 },
  { type: 'card', id: 'ch7-card-catwalk', x: 165, y: 28 },
  { type: 'deep', kind: 'warden', x: 158, y: 30 },

  // ---- Open sea
  { type: 'checkpoint', id: 'cp-sea', x: 186, y: 42, density: 'normal', label: 'THE OPEN SEA' },
  { type: 'tank', id: 't-sea', x: 183, w: 81, top: 0, bottom: 46, level: 6, sea: true },
  { type: 'bubbleVent', x: 188, y: 42 },
  { type: 'bubbleVent', x: 226, y: 43 },
  { type: 'bubbleVent', x: 252, y: 43 },
  { type: 'deep', kind: 'gnasher', x: 198, y: 36 },
  { type: 'deep', kind: 'eel', x: 210, y: 43 },
  { type: 'current', id: 'cur-intake', x: 214, y: 30, w: 8, h: 10, vx: 0, vy: 90, intake: true },
  { type: 'deep', kind: 'jelly', x: 222, y: 28 },
  { type: 'deep', kind: 'gnasher', x: 228, y: 34 },
  { type: 'card', id: 'ch7-card-cave', x: 238, y: 42 },
  { type: 'deep', kind: 'eel', x: 244, y: 44 },
  { type: 'deep', kind: 'gnasher', x: 254, y: 32 },
  { type: 'deep', kind: 'jelly', x: 258, y: 38 },

  // ---- Pump hall
  { type: 'tank', id: 't-p1', x: 264, w: 18, top: 30, bottom: 46, level: 31 },
  { type: 'pump', id: 'p-1', x: 279, y: 46, label: 'PUMP 1', sets: [[{ tank: 't-p1', level: 38 }, { tank: 't-p2', level: 38 }]] },
  { type: 'pressureDoor', id: 'd-p12', x: 282, y: 31, h: 15, left: 't-p1', right: 't-p2' },
  { type: 'tank', id: 't-p2', x: 283, w: 18, top: 22, bottom: 46, level: 46 },
  { type: 'checkpoint', id: 'cp-pump', x: 297, y: 36, density: 'sparse', label: 'PUMP HALL' },
  { type: 'pump', id: 'p-2', x: 299, y: 36, label: 'PUMP 2', sets: [[{ tank: 't-p2', level: 23 }, { tank: 't-p1', level: 46 }]] },
  { type: 'card', id: 'ch7-card-vine', x: 287, y: 21, requires: 'wildvine' },
  { type: 'alienHint', id: 'ch7-vine-hint', alien: 'wildvine', x: 285, y: 22, w: 5, h: 4, line: 'WAY UP THERE... I WOULD NEED A VINE.' },
  { type: 'deep', kind: 'eel', x: 290, y: 45 },
  { type: 'tank', id: 't-p3', x: 302, w: 18, top: 22, bottom: 46, level: 23 },
  { type: 'checkpoint', id: 'cp-tank3', x: 305, y: 27, density: 'frequent', label: 'PUMP HALL: TANK 3' },
  { type: 'pump', id: 'p-3', x: 306, y: 27, label: 'PUMP 3', sets: [[{ tank: 't-p3', level: 46 }]] },
  { type: 'deep', kind: 'eel', x: 312, y: 45 },
  { type: 'deep', kind: 'jelly', x: 315, y: 34 },
  { type: 'card', id: 'ch7-card-tank', x: 316, y: 46 },
  { type: 'pressureDoor', id: 'd-p34', x: 320, y: 36, h: 10, left: 't-p3', right: 't-p4' },
  { type: 'tank', id: 't-p4', x: 321, w: 13, top: 30, bottom: 46, level: 46 },
  { type: 'deep', kind: 'grunt', x: 328, y: 46 },
  { type: 'card', id: 'ch7-card-chute', x: 330, y: 28, requires: 'cannonbolt' },
  { type: 'alienHint', id: 'ch7-chute-hint', alien: 'cannonbolt', x: 324, y: 40, w: 8, h: 6, line: 'A CHUTE... IF ONLY I COULD ROLL THROUGH THERE.' },
  { type: 'smoothy', x: 338, y: 42 },

  // ---- Containment
  { type: 'checkpoint', id: 'cp-containment', x: 343, y: 40, density: 'normal', label: 'CONTAINMENT' },
  { type: 'deep', kind: 'grunt', x: 356, y: 40 },
  { type: 'deep', kind: 'warden', x: 362, y: 33 },
  { type: 'deep', kind: 'grunt', x: 370, y: 40 },
  { type: 'deep', kind: 'grunt', x: 386, y: 40 },
  { type: 'deep', kind: 'warden', x: 394, y: 32 },
  { type: 'smoothy', x: 375, y: 34 },
  { type: 'deep', kind: 'grunt', x: 402, y: 40 },

  // ---- The moon pool
  { type: 'checkpoint', id: 'cp-moonpool', x: 406, y: 40, density: 'sparse', label: 'THE MOON POOL' },
  { type: 'tank', id: 't-moonpool', x: 411, w: 41, top: 26, bottom: 46, level: 32 },
  { type: 'boss', kind: 'deepmaw', x: 431, y: 36, arenaFrom: 411, arenaTo: 451, triggerX: 413, floor: 45, stages: ['cp-drydock', 'cp-maelstrom'] },
  { type: 'checkpoint', id: 'cp-drydock', x: 412, y: 40, density: 'sparse', label: 'DRY DOCK', hidden: true },
  { type: 'checkpoint', id: 'cp-maelstrom', x: 413, y: 40, density: 'sparse', label: 'THE MAELSTROM', hidden: true },
];

export const CHAPTER_7: LevelData = {
  id: 'ch7',
  chapter: 7,
  name: 'THE PLUMBERS',
  theme: 'plumber',
  look: 'hd',
  parTimeMs: 780_000,
  width: W,
  height: H,
  playerStart: { x: 9, y: 40 },
  podTriggerX: -1,
  solids: runs(),
  carves: [],
  platforms,
  water: [],
  entities,
  prompts: [
    { id: 'ch7-swim', x: 69, w: 6, text: 'SWIM: {MOVE}   {JUMP}: STROKE UP / JUMP OUT' },
    { id: 'ch7-valve', x: 122, w: 6, text: 'HIT THE VALVE: LEVEL THE WATER, OPEN THE DOOR' },
    { id: 'ch7-pump', x: 272, w: 8, text: 'HIT A PUMP: IT DRAINS ONE ROOM AND FLOODS ANOTHER' },
  ],
  ambience: [
    { x: 0, ambient: 'docking' },
    { x: 67, ambient: 'flooded' },
    { x: 150, ambient: 'reactor' },
    { x: 183, ambient: 'opensea' },
    { x: 263, ambient: 'pumphall' },
    { x: 340, ambient: 'containment' },
    { x: 411, ambient: 'moonpool' },
  ],
  introSpawns: [],
  story: {
    unlocks: [{ alien: 'ripjaws', x: 166, line: 'NEW DNA DETECTED!', scripted: true }],
    plumber: {
      dock: { capsuleX: 9, floor: 40, hatch: 'h-bay' },
      ring: { revealX: 14, lockerX: 33, lockdownX: 40, hubX: 60, hubHatch: 'h-hub', floor: 40 },
      glimpse: { triggerX: 133, windowX: 146, floor: 40 },
      reactor: { triggerX: 160, kevinX: 168, floor: 40, hatches: ['h-reactor-in'], tank: 't-reactor', floodTo: 21, glass: { x: 182, y: 30, w: 1, h: 10 }, alien: 'ripjaws' },
      pumps: ['p-1', 'p-2', 'p-3'],
      containment: { maxX: 378, cellX: 400, floor: 40 },
      moonPool: { tank: 't-moonpool', levels: [32, 46, 34], boothX: 431 },
    },
    outro: [],
  },
};
