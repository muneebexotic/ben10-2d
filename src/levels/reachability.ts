import type { LevelData } from './types';
import { cellAt, type TileGrid } from './buildLevel';
import { CELL, isSolidCell } from './tiles';

/** Coarse movement envelope in tiles, used to sanity-check level design. */
export interface Capabilities {
  jumpUp: number;
  jumpAcross: number;
  canBurn: boolean;
  /** Can break cracked walls (Four Arms, Milestone 2). */
  canSmash: boolean;
}

export const HUMAN_CAPS: Capabilities = { jumpUp: 3, jumpAcross: 4, canBurn: false, canSmash: false };
/** Normal jump plus rocket jump. */
export const HEATBLAST_CAPS: Capabilities = { jumpUp: 9, jumpAcross: 9, canBurn: true, canSmash: false };

export interface Pos {
  x: number;
  /** Row the feet occupy (one above the surface). */
  y: number;
}

const MAX_FALL = 24;

export function blockedCells(level: LevelData, caps: Capabilities): Set<string> {
  const blocked = new Set<string>();
  for (const e of level.entities) {
    if (e.type === 'barricade' && !caps.canBurn) {
      for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) blocked.add(`${x},${y}`);
    }
    if (e.type === 'crackedWall' && !caps.canSmash) {
      for (let y = e.y; y < e.y + e.h; y++) blocked.add(`${e.x},${y}`);
    }
  }
  return blocked;
}

function isWater(level: LevelData, x: number, y: number): boolean {
  return level.water.some((w) => x >= w.x && x < w.x + w.w && y >= w.surface);
}

function isOpen(grid: TileGrid, blocked: Set<string>, x: number, y: number): boolean {
  if (x < 0 || x >= grid.width || y < 0) return false;
  const c = cellAt(grid, x, y);
  return (c === CELL.EMPTY || c === CELL.PLATFORM) && !blocked.has(`${x},${y}`);
}

export function isStandable(level: LevelData, grid: TileGrid, blocked: Set<string>, x: number, y: number): boolean {
  if (!isOpen(grid, blocked, x, y) || !isOpen(grid, blocked, x, y - 1)) return false;
  if (cellAt(grid, x, y) === CELL.PLATFORM) return false;
  if (isWater(level, x, y)) return false;
  const below = cellAt(grid, x, y + 1);
  return isSolidCell(below) || below === CELL.PLATFORM || blocked.has(`${x},${y + 1}`);
}

function headroom(grid: TileGrid, blocked: Set<string>, x: number, y: number, rise: number): boolean {
  for (let k = 1; k <= rise + 1; k++) {
    const c = cellAt(grid, x, y - k);
    if (isSolidCell(c) || blocked.has(`${x},${y - k}`)) return false;
  }
  return true;
}

/** Breadth-first search over standable cells. Returns every reachable position key. */
export function reachableFrom(level: LevelData, grid: TileGrid, start: Pos, caps: Capabilities): Set<string> {
  const blocked = blockedCells(level, caps);
  const seen = new Set<string>();
  const queue: Pos[] = [];
  if (isStandable(level, grid, blocked, start.x, start.y)) {
    seen.add(`${start.x},${start.y}`);
    queue.push(start);
  }

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    for (let dy = -caps.jumpUp; dy <= MAX_FALL; dy++) {
      const across = dy <= 0 ? caps.jumpAcross + 1 : caps.jumpAcross + 1 + Math.ceil(dy / 2);
      if (dy < 0 && !headroom(grid, blocked, x, y, -dy)) continue;
      for (let dx = -across; dx <= across; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (seen.has(key)) continue;
        if (!isStandable(level, grid, blocked, nx, ny)) continue;
        if (!pathClear(grid, blocked, x, y, nx, ny, dy)) continue;
        seen.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return seen;
}

/** Rejects moves that would pass through solid walls at the traversal height. */
function pathClear(grid: TileGrid, blocked: Set<string>, x0: number, y0: number, x1: number, y1: number, dy: number): boolean {
  const solidAt = (x: number, y: number) => isSolidCell(cellAt(grid, x, y)) || blocked.has(`${x},${y}`);
  const topRow = Math.min(y0, y1) - 1;
  const step = x1 > x0 ? 1 : -1;
  for (let x = x0; x !== x1; x += step) {
    if (solidAt(x + step, topRow)) return false;
  }
  // The landing column must be open between the traversal height and the landing spot (no falling through roofs).
  if (dy !== 0) {
    for (let y = topRow; y <= y1; y++) if (solidAt(x1, y)) return false;
  }
  return true;
}

export function canReach(level: LevelData, grid: TileGrid, start: Pos, goal: (p: Pos) => boolean, caps: Capabilities): boolean {
  for (const key of reachableFrom(level, grid, start, caps)) {
    const [x, y] = key.split(',').map(Number);
    if (goal({ x, y })) return true;
  }
  return false;
}
