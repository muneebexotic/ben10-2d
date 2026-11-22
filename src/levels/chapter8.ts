import type { EntitySpawn, LevelData, PlatformSpan, SolidRect } from './types';

/**
 * Chapter 8: Cacklejack (GAME_DESIGN.md, Act 3), in the HD cartoon look.
 * Driftwood Bay's boardwalk at night and CACKLEJACK'S CIRCUS OF FRIGHTS on
 * its pier: the midway, the funhouse and its spinning barrel, the rolling
 * course, the mirror maze, backstage and the rigging, and the big top.
 *
 *   0-34    the boardwalk (the cold open)
 *   34-102  the midway: booths, the carousel, the high striker, Cacklejack's stage
 *   102-140 the funhouse: the clown-mouth door, Gwen taken, the spinning barrel (Ricochet)
 *   140-206 the rolling course: a kicker, bumpers, a bounce pad, a break-away wall, the loop
 *   206-290 the mirror maze: lying mirrors, doors that light up, the shaft of angled mirrors, the heart
 *   290-366 backstage: wagons, the shooting gallery, the rigging up to the big top's high door
 *   366-424 the big top (CACKLEJACK): the ring, trapezes, bounce pads, Max's cage over it
 */

const W = 424;
const H = 46;

type Mat = 0 | 1 | 2;
const EMPTY: Mat = 0;
const GROUND: Mat = 1;
const ROCK: Mat = 2;
const grid: Mat[][] = Array.from({ length: H }, () => new Array<Mat>(W).fill(ROCK));
const platforms: PlatformSpan[] = [];

function fill(x: number, y: number, w: number, h: number, m: Mat): void {
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) grid[yy][xx] = m;
}

function carve(x: number, y: number, w: number, h: number): void {
  fill(x, y, w, h, EMPTY);
}

/** A block of wall put back inside a room. */
function wall(x: number, top: number, w: number, h: number): void {
  fill(x, top, w, h, ROCK);
}

/** A floor, a step or a stage (planks or checks on top). */
function floor(x: number, top: number, w: number, h: number): void {
  fill(x, top, w, h, GROUND);
}

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

/** Where the boardwalk's and the backstage's open night sky are (the rest is indoors). */
export const CIRCUS_OUTDOORS: ReadonlyArray<{ from: number; to: number }> = [
  { from: 0, to: 102 },
  { from: 290, to: 366 },
];

// ---- The boardwalk and the midway (outdoors, floor row 34)
carve(0, 0, 102, 34);
floor(0, 34, 102, 12);
// Booth roofs along the midway.
platforms.push({ x: 41, y: 31, w: 5 }, { x: 48, y: 31, w: 4 });
// The carousel: its round deck, and its canopy's roof high above.
floor(58, 32, 11, 2);
platforms.push({ x: 59, y: 25, w: 9 });
// Cacklejack's stage.
floor(91, 31, 10, 3);
// The funhouse's front: a block the clown's face (backdrop art) is painted over, its mouth the door through it.
wall(102, 0, 7, 30);
carve(102, 30, 7, 4);

// ---- The funhouse (indoors, floor row 34)
carve(109, 24, 31, 10);
floor(102, 34, 38, 12);
// The spinning barrel's drum: a low ceiling over it.
wall(117, 24, 15, 2);

// ---- The rolling course (floor row 38)
carve(140, 22, 66, 16);
floor(140, 38, 66, 8);
// The high ledge the kicker throws a ball up onto.
floor(151, 30, 8, 1);
platforms.push({ x: 176, y: 29, w: 5 });
// Over the break-away wall the course is solid to the ceiling: the way on is through it.
wall(186, 22, 1, 12);

// ---- The mirror maze (floor row 40)
carve(206, 17, 84, 23);
floor(206, 40, 84, 6);
// The lower hall's ceiling; the shaft (251-253) climbs past it to the heart.
wall(206, 17, 45, 13);
// The heart chamber over the hall's far end, its floor on row 24, sealed at 271 until Gwen is free.
floor(254, 24, 36, 6);
wall(261, 30, 29, 10);
wall(271, 17, 1, 7);
// A step onto the platform that reaches the second mirror's lying upper half.
platforms.push({ x: 217, y: 37, w: 3 });

// ---- Backstage (outdoors, floor row 38)
carve(290, 0, 76, 38);
floor(290, 38, 76, 8);
// Circus wagons.
floor(295, 35, 7, 3);
floor(309, 35, 7, 3);
// The shooting gallery: a roof and a back wall round its prize shelf (Upgrade's shutter is its front).
wall(322, 33, 8, 1);
wall(329, 34, 1, 4);
// The rigging: rope-slung planks up to the big top's high door.
platforms.push({ x: 337, y: 35, w: 3 }, { x: 341, y: 32, w: 3 }, { x: 345, y: 29, w: 3 }, { x: 349, y: 26, w: 3 }, { x: 353, y: 23, w: 3 }, { x: 357, y: 20, w: 3 }, { x: 361, y: 17, w: 5 });

// ---- The big top (floor row 38): its canvas wall at 366 with the high door, the ring inside
wall(366, 0, 1, 38);
carve(366, 13, 1, 4);
carve(367, 6, 56, 32);
floor(367, 38, 57, 8);
platforms.push({ x: 367, y: 17, w: 6 });
// The trapeze platforms.
platforms.push({ x: 380, y: 28, w: 4 }, { x: 412, y: 28, w: 4 }, { x: 394, y: 22, w: 5 });

const entities: EntitySpawn[] = [
  // ---- The midway
  { type: 'checkpoint', id: 'cp-midway', x: 36, y: 34, density: 'sparse', label: 'THE MIDWAY' },
  { type: 'circus', kind: 'grinner', x: 45, y: 34 },
  { type: 'circus', kind: 'hound', x: 52, y: 27 },
  { type: 'bouncePad', id: 'pad-carousel', x: 55, y: 34, power: 660 },
  { type: 'card', id: 'ch8-card-carousel', x: 63, y: 25 },
  { type: 'smoothy', x: 66, y: 32 },
  { type: 'circus', kind: 'jackbox', x: 71, y: 34 },
  { type: 'circus', kind: 'grinner', x: 75, y: 34 },
  { type: 'striker', id: 'striker', x: 81, y: 34, reward: 'ch8-striker' },
  { type: 'card', id: 'ch8-card-striker', x: 81, y: 34, reward: 'ch8-striker' },
  { type: 'circus', kind: 'hound', x: 66, y: 22 },

  // ---- The funhouse
  { type: 'checkpoint', id: 'cp-barrel', x: 111, y: 34, density: 'sparse', label: 'THE BARREL' },
  { type: 'circus', kind: 'jackbox', x: 136, y: 34 },

  // ---- The rolling course
  { type: 'checkpoint', id: 'cp-loop', x: 142, y: 38, density: 'normal', label: 'THE LOOP' },
  { type: 'kicker', id: 'kick-1', x: 148, y: 38, dir: 1, to: { x: 155, y: 30 } },
  { type: 'circus', kind: 'grinner', x: 156, y: 30 },
  { type: 'bumper', id: 'bump-1', x: 163, y: 35 },
  { type: 'bumper', id: 'bump-2', x: 167, y: 32 },
  { type: 'bumper', id: 'bump-3', x: 171, y: 35 },
  { type: 'bouncePad', id: 'pad-course', x: 173, y: 38, power: 600 },
  { type: 'smoothy', x: 178, y: 29 },
  { type: 'circus', kind: 'stilts', x: 181, y: 38 },
  { type: 'crackedWall', id: 'ch8-breakaway', x: 186, y: 34, h: 4, requires: 'ricochet', opened: { title: 'BREAK-AWAY!', subtitle: 'THE COURSE GOES ON', line: 'BREAK-AWAY WALLS. CLASSIC.' } },
  { type: 'loop', id: 'loop', x: 196, y: 38, r: 4 },
  { type: 'card', id: 'ch8-card-loop', x: 196, y: 30 },
  { type: 'circus', kind: 'hound', x: 192, y: 26 },
  { type: 'circus', kind: 'grinner', x: 203, y: 38 },

  // ---- The mirror maze
  { type: 'checkpoint', id: 'cp-maze', x: 208, y: 40, density: 'sparse', label: 'THE MIRROR MAZE' },
  { type: 'mirror', id: 'm-door-1', x: 212, y: 30, h: 10, kind: 'door' },
  { type: 'circus', kind: 'reflection', x: 215, y: 40 },
  { type: 'mirror', id: 'm-low-2', x: 220, y: 37, h: 3, kind: 'real' },
  { type: 'mirror', id: 'm-lie-2', x: 220, y: 30, h: 7, kind: 'lie' },
  { type: 'mirror', id: 'm-lie-3', x: 228, y: 33, h: 7, kind: 'lie' },
  { type: 'mirror', id: 'm-top-3', x: 228, y: 30, h: 3, kind: 'real' },
  { type: 'circus', kind: 'reflection', x: 232, y: 40 },
  { type: 'mirror', id: 'm-door-4', x: 236, y: 30, h: 10, kind: 'door' },
  { type: 'circus', kind: 'hound', x: 240, y: 34 },
  { type: 'mirror', id: 'm-top-5', x: 244, y: 30, h: 4, kind: 'real' },
  { type: 'mirror', id: 'm-lie-5', x: 244, y: 34, h: 6, kind: 'lie' },
  { type: 'circus', kind: 'reflection', x: 247, y: 40 },
  { type: 'smoothy', x: 249, y: 40 },
  // The shaft: the angled mirror on the hall floor fires a ball straight up; the one at the top sends it on into the heart.
  { type: 'deflector', id: 'defl-up', x: 252, y: 39, turn: 'up', speed: 960, to: { x: 256, y: 23 } },
  { type: 'deflector', id: 'defl-right', x: 252, y: 17, turn: 'right', speed: 420 },
  // Past the shaft: a lying mirror, and the nook behind it.
  { type: 'mirror', id: 'm-lie-nook', x: 255, y: 30, h: 10, kind: 'lie' },
  { type: 'card', id: 'ch8-card-mirror', x: 258, y: 40 },
  { type: 'mirror', id: 'm-nook-back', x: 260, y: 30, h: 10, kind: 'real' },
  { type: 'checkpoint', id: 'cp-heart', x: 256, y: 24, density: 'frequent', label: 'THE HEART' },
  { type: 'card', id: 'ch8-card-heart', x: 263, y: 24 },

  // ---- Backstage
  { type: 'checkpoint', id: 'cp-backstage', x: 292, y: 38, density: 'normal', label: 'BACKSTAGE' },
  { type: 'circus', kind: 'stilts', x: 303, y: 38 },
  { type: 'smoothy', x: 298, y: 35 },
  { type: 'circus', kind: 'grinner', x: 312, y: 35 },
  { type: 'circus', kind: 'jackbox', x: 318, y: 38 },
  { type: 'techDoor', id: 'gallery-shutter', x: 322, y: 34, w: 1, h: 4 },
  { type: 'card', id: 'ch8-card-gallery', x: 326, y: 38 },
  { type: 'circus', kind: 'stilts', x: 333, y: 38 },
  { type: 'circus', kind: 'hound', x: 346, y: 26 },
  { type: 'circus', kind: 'hound', x: 356, y: 18 },

  // ---- The big top
  { type: 'checkpoint', id: 'cp-bigtop', x: 369, y: 17, density: 'sparse', label: 'THE BIG TOP' },
  { type: 'bouncePad', id: 'pad-ring-l', x: 377, y: 38, power: 640 },
  { type: 'bouncePad', id: 'pad-ring-r', x: 414, y: 38, power: 640 },
  { type: 'card', id: 'ch8-card-tent', x: 396, y: 8, requires: 'wildvine' },
  { type: 'alienHint', id: 'ch8-tent-hint', alien: 'wildvine', x: 391, y: 30, w: 10, h: 8, line: 'THE TOP OF THE TENT... IF I HAD A VINE.' },
  { type: 'boss', kind: 'cacklejack', x: 396, y: 36, arenaFrom: 376, arenaTo: 416, triggerX: 377, floor: 38, stages: ['cp-highwire', 'cp-bighead'] },
  { type: 'checkpoint', id: 'cp-highwire', x: 377, y: 38, density: 'sparse', label: 'THE HIGH WIRE', hidden: true },
  { type: 'checkpoint', id: 'cp-bighead', x: 378, y: 38, density: 'sparse', label: 'THE BIG HEAD', hidden: true },
];

export const CHAPTER_8: LevelData = {
  id: 'ch8',
  chapter: 8,
  name: 'CACKLEJACK',
  theme: 'circus',
  look: 'hd',
  parTimeMs: 720_000,
  width: W,
  height: H,
  playerStart: { x: 6, y: 34 },
  podTriggerX: -1,
  solids: runs(),
  carves: [],
  platforms,
  water: [],
  entities,
  prompts: [
    { id: 'ch8-pad', x: 52, w: 5, text: 'BOUNCE PADS THROW YOU HIGH. A BALL GOES HIGHER' },
    { id: 'ch8-striker', x: 78, w: 6, text: 'THE HIGH STRIKER: SMASH THE PAD, RING THE BELL' },
    { id: 'ch8-roll', x: 141, w: 6, text: 'A FAST BALL RIDES THE KICKER AND THE LOOP', formText: { ricochet: 'HOLD {MOVE} TO BUILD SPEED. {JUMP}: BOUNCE' } },
    { id: 'ch8-wall', x: 182, w: 4, text: 'A BREAK-AWAY WALL: A FAST ROLL OR A SMASH' },
    { id: 'ch8-doors', x: 207, w: 5, text: 'A MIRROR THAT LIGHTS UP IS A DOOR' },
    { id: 'ch8-lies', x: 216, w: 4, text: 'A REFLECTION THAT MOVES WRONG IS A HOLE' },
    { id: 'ch8-shaft', x: 246, w: 6, text: 'ROLL INTO THE ANGLED MIRROR: IT FIRES A BALL UP', formText: { ricochet: 'ROLL INTO THE ANGLED MIRROR, FAST' } },
  ],
  ambience: [
    { x: 0, ambient: 'boardwalk' },
    { x: 34, ambient: 'midway' },
    { x: 102, ambient: 'funhouse' },
    { x: 206, ambient: 'mirrors' },
    { x: 290, ambient: 'backstage' },
    { x: 366, ambient: 'bigtop' },
  ],
  introSpawns: [],
  story: {
    unlocks: [{ alien: 'ricochet', x: 124, line: 'NEW DNA DETECTED!', scripted: true }],
    circus: {
      boardwalk: { startX: 4, stopX: 14, floor: 34 },
      show: { triggerX: 84, stageX: 96, stageFloor: 31, floor: 34, maxX: 89, exitX: 105 },
      gwenTaken: { triggerX: 113, mirrorX: 116, floor: 34 },
      barrel: { triggerX: 121, fromX: 117, toX: 131, top: 26, floor: 34, alien: 'ricochet' },
      heart: { mirrorX: 267, floor: 24, exit: { x: 271, y: 17, w: 1, h: 7 } },
      bigTop: { cageX: 403, cageY: 23, floor: 38 },
    },
    // The ending (GAME_DESIGN.md, Chapter 8, beat 9): the colour comes back, Max drops into the net, and the watch answers a laugh.
    outro: [
      { who: 'gwen', text: 'LOOK! THE COLOR\'S COMING BACK. EVERYONE\'S WAKING UP.', ms: 2400, mood: 'happy' },
      { who: 'max', text: 'AND I\'M COMING DOWN. NICE NET, BY THE WAY.', ms: 2000, mood: 'happy' },
      { who: 'ben', text: 'ONE CLOWN DOWN. ZERO FUNNEL CAKES. WORST CIRCUS EVER.', ms: 2400, mood: 'happy' },
      { who: 'cacklejack', text: 'HEE... HEE... HAAA! THE SHOW... NEVER... ENDS...', ms: 2400 },
      { who: 'ben', text: 'WAIT. WHAT IS THE WATCH DOING?! I DIDN\'T PICK ANYTHING!', ms: 2200, mood: 'shocked' },
      { who: 'ghostfreak', text: 'SOON.', ms: 1600 },
      { who: 'gwen', text: 'BEN? DID YOUR WATCH JUST DO THAT BY ITSELF?', ms: 2200, mood: 'shocked' },
      { who: 'ben', text: '...IT DOES THAT SOMETIMES. RIGHT, GRANDPA?', ms: 2000, mood: 'neutral' },
      { who: 'max', text: '...', ms: 1600, mood: 'neutral' },
    ],
  },
};
