import { PLUMBER_ART, type PropFrame } from '../scenes/preload/cartoon/plumber/baseArt';

/**
 * Chapter 7's set dressing (HD), in tiles: what stands on the base's decks
 * (feet on row `y`), hangs from its ceilings (`hang`: top at row `y`), and
 * grows on the sea floor. Drawn behind the action unless `front`.
 */
export interface PlumberDecor {
  key: string;
  frame?: string | number;
  x: number;
  y: number;
  /** Nudge (px). */
  dx?: number;
  hang?: boolean;
  front?: boolean;
  flip?: boolean;
  scale?: number;
}

/** The open sea outside the hull (tiles): no back walls, and the far side of the sea shows. */
export const PLUMBER_SEA = { from: 183, to: 263 } as const;

const P = PLUMBER_ART;
const prop = (frame: PropFrame, x: number, y: number, extra: Partial<PlumberDecor> = {}): PlumberDecor => ({ key: P.props, frame, x, y, ...extra });
const lamps = (from: number, to: number, ceiling: number, every = 7): PlumberDecor[] => {
  const out: PlumberDecor[] = [];
  for (let x = from; x <= to; x += every) out.push(prop('lamp', x, ceiling, { hang: true }));
  return out;
};

export const PLUMBER_DECOR: readonly PlumberDecor[] = [
  // ---- The docking bay: the capsule, a viewing window, consoles, crates.
  { key: P.capsule, x: 9, y: 40 },
  { key: P.window, x: 17, y: 32, dx: 0 },
  prop('console', 20, 40),
  prop('crate', 4, 40),
  prop('crate', 5, 40, { dx: 6 }),
  prop('warning', 23, 30),
  ...lamps(4, 22, 22, 6),
  // ---- The docking ring: Max's locker room, benches, pipes, lamps.
  prop('locker', 30, 40),
  prop('locker', 31, 40),
  prop('locker', 32, 40),
  prop('lockerOpen', 33, 40, { dx: 3 }),
  prop('locker', 35, 40),
  prop('bench', 31, 40, { dx: 8, front: true }),
  prop('sign', 27, 33),
  prop('pipeV', 38, 33),
  prop('crate', 46, 40),
  prop('console', 50, 40),
  prop('pipeV', 56, 33),
  ...lamps(26, 56, 30),
  // ---- The control hub.
  prop('console', 59, 40),
  prop('console', 64, 40),
  prop('sign', 62, 29),
  ...lamps(59, 65, 26, 3),
  // ---- The flooded ring.
  prop('warning', 69, 34),
  prop('pipeV', 74, 30, { hang: true }),
  prop('tankGlass', 86, 46),
  prop('crate', 80, 37),
  prop('cableReel', 125, 38),
  prop('vent', 113, 46),
  prop('pipeV', 120, 30, { hang: true }),
  prop('sign', 144, 33),
  ...lamps(68, 88, 30, 5),
  ...lamps(114, 148, 30, 6),
  // ---- The reactor.
  { key: P.reactor, frame: 0, x: 166, y: 40 },
  prop('console', 156, 40),
  prop('console', 176, 40),
  prop('warning', 152, 34),
  prop('pipeV', 160, 20, { hang: true }),
  prop('pipeV', 172, 20, { hang: true }),
  { key: P.window, x: 178, y: 30 },
  ...lamps(152, 180, 20, 7),
  // ---- The open sea: coral on the sea floor.
  { key: P.coral, frame: 0, x: 192, y: 42 },
  { key: P.coral, frame: 2, x: 204, y: 44 },
  { key: P.coral, frame: 1, x: 212, y: 44 },
  { key: P.coral, frame: 0, x: 219, y: 40, scale: 0.8 },
  { key: P.coral, frame: 2, x: 228, y: 43 },
  { key: P.coral, frame: 1, x: 247, y: 43 },
  { key: P.coral, frame: 0, x: 256, y: 43, flip: true },
  { key: P.kelp, frame: 1, x: 198, y: 44 },
  { key: P.kelp, frame: 3, x: 230, y: 43 },
  { key: P.kelp, frame: 2, x: 250, y: 43 },
  // ---- The pump hall.
  prop('pipeV', 268, 30, { hang: true }),
  prop('pipeV', 290, 22, { hang: true }),
  prop('pipeV', 310, 22, { hang: true }),
  prop('warning', 298, 32),
  prop('tankGlass', 326, 46),
  prop('crate', 331, 46),
  ...lamps(266, 280, 30, 7),
  ...lamps(286, 318, 22, 8),
  ...lamps(322, 340, 30, 6),
  // ---- Containment: the cells along the back wall (Cell 7 at the end, empty).
  { key: P.cell, frame: 0, x: 348, y: 40 },
  { key: P.cell, frame: 1, x: 356, y: 40 },
  { key: P.cell, frame: 2, x: 364, y: 40 },
  { key: P.cell, frame: 3, x: 380, y: 40 },
  { key: P.cell, frame: 0, x: 388, y: 40, flip: true },
  { key: P.cell, frame: 2, x: 394, y: 40, flip: true },
  { key: P.cell, frame: 4, x: 400, y: 40 },
  prop('console', 370, 40),
  prop('sign', 400, 29),
  ...lamps(344, 408, 30, 8),
  // ---- The moon pool: Max's booth over the arena.
  { key: P.booth, x: 440, y: 19 },
  prop('warning', 414, 32),
  prop('warning', 466, 32),
  ...lamps(412, 468, 14, 8),
];
