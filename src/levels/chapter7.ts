import type { LevelData } from './types';

/**
 * Chapter 7: The Plumbers (GAME_DESIGN.md, Act 3). Drawn in the HD cartoon
 * look from the descent on.
 */
export const CHAPTER_7: LevelData = {
  id: 'ch7',
  chapter: 7,
  name: 'THE PLUMBERS',
  theme: 'plumber',
  look: 'hd',
  parTimeMs: 720_000,
  width: 200,
  height: 40,
  playerStart: { x: 10, y: 30 },
  podTriggerX: -1,
  solids: [
    { material: 'rock', x: 0, top: 0, w: 2 },
    { material: 'ground', x: 2, top: 30, w: 196 },
    { material: 'rock', x: 198, top: 0, w: 2 },
  ],
  carves: [],
  platforms: [
    { x: 20, y: 26, w: 6 },
    { x: 30, y: 23, w: 6 },
  ],
  water: [],
  entities: [{ type: 'checkpoint', id: 'cp-docking', x: 40, y: 30, density: 'sparse', label: 'DOCKING RING' }],
  prompts: [],
  ambience: [{ x: 0, ambient: 'docking' }],
  introSpawns: [],
};
