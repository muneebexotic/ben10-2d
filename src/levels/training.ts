import type { LevelData } from './types';

/**
 * Omnitrix Training: a holographic sandbox arena.
 *
 * Water pool (2-21) for XLR8's water run > plaza with the dummy (22-61) >
 * a shallow trench to dash over (62-67) > the smash zone with a self-repairing
 * cracked wall and boulders (68-95) > a raised ledge (96-107).
 */
export const TRAINING_ARENA: LevelData = {
  id: 'training',
  chapter: 0,
  name: 'OMNITRIX TRAINING',
  theme: 'sim',
  width: 110,
  height: 30,
  playerStart: { x: 31, y: 24 },
  podTriggerX: -1,
  introSpawns: [],

  solids: [
    { material: 'rock', x: 0, top: 4, w: 2 },
    { material: 'ground', x: 2, top: 24, w: 2 },
    { material: 'rock', x: 4, top: 29, w: 14 },
    { material: 'ground', x: 18, top: 24, w: 44 },
    { material: 'ground', x: 62, top: 27, w: 6 },
    { material: 'ground', x: 68, top: 24, w: 28 },
    { material: 'ground', x: 96, top: 20, w: 12 },
    { material: 'rock', x: 108, top: 4, w: 2 },
  ],

  carves: [],

  platforms: [
    { x: 25, y: 20, w: 4 },
    { x: 33, y: 17, w: 5 },
    { x: 45, y: 17, w: 5 },
    { x: 53, y: 20, w: 4 },
    { x: 8, y: 20, w: 4 },
    { x: 92, y: 21, w: 3 },
  ],

  water: [{ x: 4, w: 14, surface: 24, depth: 5 }],

  entities: [
    { type: 'dummy', x: 41, y: 24 },
    { type: 'crackedWall', id: 'training-wall', x: 80, y: 21, h: 3, requires: 'fourarms', rebuildMs: 4000 },
    { type: 'boulder', x: 73, y: 24 },
    { type: 'boulder', x: 87, y: 24 },
    { type: 'boulder', x: 100, y: 20 },
  ],

  prompts: [
    { id: 'tr-water', x: 2, w: 19, text: 'XLR8: KEEP RUNNING TO CROSS THE WATER' },
    { id: 'tr-trench', x: 60, w: 9, text: 'XLR8: {K} TO DASH ACROSS' },
    { id: 'tr-wall', x: 74, w: 6, text: 'FOUR ARMS: SMASH THE CRACKED WALL' },
  ],

  ambience: [{ x: 0, ambient: 'sim' }],
};
