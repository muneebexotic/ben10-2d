/**
 * The Spell Engine's three stages as plain rules (unit tested), so the scene
 * only draws and takes taps. Grey Matter sabotages the clockwork: reroute the
 * mana pipes into the drain, jam the gear train, and lock the pendulum.
 */

// ---------------------------------------------------------------- Stage 1: mana pipes

/** 0 north, 1 east, 2 south, 3 west. */
export type Dir = 0 | 1 | 2 | 3;
export type PipeKind = 'straight' | 'elbow' | 'tee';

export interface Pipe {
  kind: PipeKind;
  /** Quarter turns clockwise. */
  rot: number;
}

const BASE: Record<PipeKind, readonly Dir[]> = { straight: [1, 3], elbow: [0, 1], tee: [0, 1, 2] };
const STEP: Record<Dir, [number, number]> = { 0: [0, -1], 1: [1, 0], 2: [0, 1], 3: [-1, 0] };

export function openings(p: Pipe): Dir[] {
  return BASE[p.kind].map((d) => ((d + p.rot) % 4) as Dir);
}

export interface PipeBoard {
  cols: number;
  rows: number;
  /** Row-major: tiles[y * cols + x]. */
  tiles: Pipe[];
  /** The Charm's mana comes in from the left edge at this row... */
  inletRow: number;
  /** ...and must leave through the drain on the right edge at this row. */
  outletRow: number;
}

/** Every tile the mana reaches from the inlet (indices). */
export function flooded(b: PipeBoard): Set<number> {
  const out = new Set<number>();
  const start = b.inletRow * b.cols;
  if (!openings(b.tiles[start]).includes(3)) return out;
  const queue = [start];
  out.add(start);
  while (queue.length > 0) {
    const i = queue.shift()!;
    const x = i % b.cols;
    const y = Math.floor(i / b.cols);
    for (const d of openings(b.tiles[i])) {
      const [dx, dy] = STEP[d];
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= b.cols || ny >= b.rows) continue;
      const j = ny * b.cols + nx;
      if (out.has(j) || !openings(b.tiles[j]).includes(((d + 2) % 4) as Dir)) continue;
      out.add(j);
      queue.push(j);
    }
  }
  return out;
}

/** The mana reaches the drain. */
export function pipesSolved(b: PipeBoard): boolean {
  const last = b.outletRow * b.cols + (b.cols - 1);
  return flooded(b).has(last) && openings(b.tiles[last]).includes(1);
}

export function turnPipe(b: PipeBoard, index: number): void {
  b.tiles[index].rot = (b.tiles[index].rot + 1) % 4;
}

/**
 * The puzzle as built: the path the mana should take (the solved rotation of
 * each tile on it), plus decoys. Every tile starts turned wrong.
 */
export const PIPE_LAYOUT = {
  cols: 5,
  rows: 4,
  inletRow: 1,
  outletRow: 2,
  /** kind and solved rotation per tile, row by row. Path: (0,1) (1,1) (1,2) (2,2) (3,2) (3,1) (4,1) (4,2). */
  tiles: [
    ['elbow', 1], ['straight', 0], ['tee', 0], ['straight', 1], ['elbow', 2],
    ['straight', 0], ['elbow', 2], ['tee', 1], ['elbow', 1], ['elbow', 2],
    ['straight', 1], ['elbow', 0], ['straight', 0], ['elbow', 3], ['elbow', 0],
    ['elbow', 0], ['straight', 0], ['elbow', 3], ['tee', 2], ['straight', 1],
  ] as ReadonlyArray<readonly [PipeKind, number]>,
  /** The path in order (for the hint: the first tile on it that's turned wrong). */
  path: [5, 6, 11, 12, 13, 8, 9, 14],
  /** Starting turns added to the solved rotation (never 0 on the path, so nothing starts solved). */
  scramble: [1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 3, 2, 1, 3, 2, 1],
} as const;

export function newPipeBoard(): PipeBoard {
  const L = PIPE_LAYOUT;
  const tiles = L.tiles.map(([kind, rot], i) => ({ kind, rot: (rot + L.scramble[i]) % 4 }));
  return { cols: L.cols, rows: L.rows, tiles, inletRow: L.inletRow, outletRow: L.outletRow };
}

/** The hint: the first tile on the mana's path that isn't connected yet (or null when solved). */
export function pipeHint(b: PipeBoard): number | null {
  const wet = flooded(b);
  for (const i of PIPE_LAYOUT.path) if (!wet.has(i) || !pathTileRight(b, i)) return i;
  return null;
}

function pathTileRight(b: PipeBoard, i: number): boolean {
  const [kind, rot] = PIPE_LAYOUT.tiles[i];
  const want = openings({ kind, rot }).sort().join();
  return openings(b.tiles[i]).sort().join() === want;
}

// ---------------------------------------------------------------- Stage 2: the gear train

export interface GearSlot {
  id: string;
  x: number;
  y: number;
  /** Teeth radius: big or small gear. */
  r: number;
}

/**
 * Gears that touch turn opposite ways. A chain turns happily; but three
 * gears in a ring can't turn at all: the train jams. One spare gear, three
 * empty slots: only one of them closes a ring of three.
 */
export const GEAR_LAYOUT = {
  slots: [
    { id: 'drive', x: 70, y: 110, r: 22 },
    { id: 'a', x: 128, y: 92, r: 18 },
    { id: 'b', x: 176, y: 128, r: 20 },
    { id: 'c', x: 232, y: 104, r: 18 },
    { id: 'd', x: 280, y: 140, r: 16 },
    // Empty slots.
    { id: 'x', x: 150, y: 46, r: 14 },
    { id: 'y', x: 214, y: 158, r: 14 },
    { id: 'z', x: 316, y: 98, r: 16 },
  ] as readonly GearSlot[],
  /** Which slots mesh (their teeth touch when both hold a gear). */
  mesh: [
    ['drive', 'a'],
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'd'],
    // x touches only a: a dead end.
    ['x', 'a'],
    // y touches b and c, which touch each other: a ring of three. The jam.
    ['y', 'b'],
    ['y', 'c'],
    // z touches only d: another dead end.
    ['z', 'd'],
  ] as ReadonlyArray<readonly [string, string]>,
  filled: ['drive', 'a', 'b', 'c', 'd'] as readonly string[],
  empty: ['x', 'y', 'z'] as readonly string[],
  answer: 'y',
} as const;

export interface GearSpin {
  /** +1 clockwise, -1 counter-clockwise, 0 not turning (not connected to the drive, or jammed). */
  spin: Map<string, 1 | -1 | 0>;
  jammed: boolean;
}

/** How every placed gear turns, starting from the drive (clockwise), and whether the train jams. */
export function gearSpin(filled: ReadonlySet<string>, mesh: ReadonlyArray<readonly [string, string]> = GEAR_LAYOUT.mesh): GearSpin {
  const spin = new Map<string, 1 | -1 | 0>();
  for (const id of filled) spin.set(id, 0);
  if (!filled.has('drive')) return { spin, jammed: false };
  const color = new Map<string, 1 | -1>([['drive', 1]]);
  const queue = ['drive'];
  let jammed = false;
  while (queue.length > 0) {
    const g = queue.shift()!;
    const c = color.get(g)!;
    for (const [a, b] of mesh) {
      const other = a === g ? b : b === g ? a : null;
      if (!other || !filled.has(other)) continue;
      const want = (c === 1 ? -1 : 1) as 1 | -1;
      const has = color.get(other);
      if (has === undefined) {
        color.set(other, want);
        queue.push(other);
      } else if (has !== want) jammed = true;
    }
  }
  for (const [id, c] of color) spin.set(id, jammed ? 0 : c);
  return { spin, jammed };
}

// ---------------------------------------------------------------- Stage 3: the pendulum

export const PENDULUM = {
  /** Swing amplitude (radians) and period (ms). */
  amplitude: 0.7,
  periodMs: 1700,
  /** A pin drops if the bob is within this angle of the middle when Grey Matter pulls the lever. */
  windowRad: 0.22,
  /** Each pin locked makes the next window a little tighter and the swing a little quicker (the last still over 0.1 s a pass, for a tap). */
  tighten: 0.88,
  quicken: 0.94,
  pins: 3,
  /** The hint: a wider window and a slower swing. */
  hintWindow: 1.6,
  hintSlow: 1.35,
} as const;

/** The bob's angle at time `t` (ms) for a swing of `periodMs`. */
export function pendulumAngle(t: number, periodMs: number, amplitude: number = PENDULUM.amplitude): number {
  return amplitude * Math.sin((t / periodMs) * Math.PI * 2);
}

/** A pull at angle `a` drops a pin when it's within the window. */
export function pinDrops(a: number, windowRad: number): boolean {
  return Math.abs(a) <= windowRad;
}
