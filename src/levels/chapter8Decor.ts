import { CIRCUS_ART } from '../scenes/preload/cartoon/circus/circusArt';

/**
 * Chapter 8's furniture (HD art, drawn by the backdrop): where each prop
 * stands, in tiles. `y` is the row its foot sits on (`hang`: the row it
 * hangs from). `front` draws it in front of the terrain; the rest behind.
 */
export interface CircusDecor {
  key: string;
  frame?: number;
  x: number;
  y: number;
  dx?: number;
  front?: boolean;
  hang?: boolean;
  scale?: number;
  flip?: boolean;
}

const A = CIRCUS_ART;

export const CIRCUS_DECOR: readonly CircusDecor[] = [
  // ---- The boardwalk
  { key: A.lamp, x: 8, y: 34 },
  { key: A.bench, x: 13, y: 34 },
  { key: A.folk, frame: 0, x: 12.6, y: 33.6 },
  { key: A.folk, frame: 2, x: 13.8, y: 33.6 },
  { key: A.lamp, x: 22, y: 34 },
  { key: A.folk, frame: 1, x: 18, y: 34, flip: true },
  { key: A.folk, frame: 1, x: 26, y: 34 },
  { key: A.gate, x: 32, y: 34 },

  // ---- The midway
  { key: A.bulbs, frame: 0, x: 36, y: 26, hang: true },
  { key: A.booth, frame: 0, x: 43, y: 34 },
  { key: A.booth, frame: 1, x: 50, y: 34 },
  { key: A.bulbs, frame: 1, x: 52, y: 25, hang: true },
  { key: A.lamp, x: 39, y: 34 },
  { key: A.bench, x: 47, y: 34, dx: 4 },
  { key: A.folk, frame: 0, x: 47.2, y: 33.6 },
  { key: A.carousel, x: 63.5, y: 32 },
  { key: A.bulbs, frame: 0, x: 72, y: 26, hang: true },
  { key: A.bench, x: 76, y: 34 },
  { key: A.folk, frame: 2, x: 75.6, y: 33.6 },
  { key: A.folk, frame: 0, x: 76.6, y: 33.6 },
  { key: A.striker, x: 81, y: 34 },
  { key: A.booth, frame: 2, x: 87, y: 34 },
  { key: A.bulbs, frame: 1, x: 88, y: 25, hang: true },
  { key: A.lamp, x: 101, y: 34 },
  { key: A.stage, x: 96, y: 31 },
  { key: A.folk, frame: 1, x: 90, y: 34, flip: true },

  // ---- The funhouse
  { key: A.facade, x: 105.5, y: 34, front: true, scale: 0.7 },
  { key: A.barrel, x: 117, y: 25, hang: true, dx: 0 },

  // ---- The rolling course (its toys draw themselves)
  { key: A.bulbs, frame: 0, x: 150, y: 23, hang: true },
  { key: A.bulbs, frame: 1, x: 170, y: 23, hang: true },
  { key: A.bulbs, frame: 0, x: 194, y: 23, hang: true },

  // ---- The heart
  { key: A.bulbs, frame: 1, x: 262, y: 17, hang: true },

  // ---- Backstage
  { key: A.wagon, frame: 0, x: 298.5, y: 38, front: true },
  { key: A.wagon, frame: 1, x: 312.5, y: 38, front: true },
  { key: A.gallery, x: 322, y: 38, dx: 0 },
  { key: A.lamp, x: 307, y: 38 },
  { key: A.lamp, x: 334, y: 38 },
  { key: A.folk, frame: 0, x: 318, y: 38 },
  { key: A.bulbs, frame: 0, x: 330, y: 28, hang: true },

  // ---- The big top
  { key: A.pole, x: 389, y: 38 },
  { key: A.pole, x: 403, y: 38 },
  { key: A.trapeze, x: 388, y: 20 },
  { key: A.trapeze, x: 405, y: 20 },
  { key: A.ring, x: 376, y: 38, front: true },
];
