import type { LevelData } from './types';
import { cellAt, type TileGrid } from './buildLevel';
import { CELL, isSolidCell } from './tiles';

/** Coarse movement envelope in tiles, used to sanity-check level design. */
export interface Capabilities {
  jumpUp: number;
  jumpAcross: number;
  canBurn: boolean;
  /** Can break cracked walls (smash hits). */
  canSmash: boolean;
  /** Can run across water surfaces. */
  canRunWater: boolean;
  /** Can climb walls (and jump off them). */
  canClimb?: boolean;
  /** Senses hidden passages (they open for this form). */
  canSense?: boolean;
}

/** Each alien declares its own envelope in its definition (`reach`). */
export const HUMAN_CAPS: Capabilities = { jumpUp: 3, jumpAcross: 4, canBurn: false, canSmash: false, canRunWater: false };

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
    if (e.type === 'hiddenDoor' && !caps.canSense) {
      for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) blocked.add(`${x},${y}`);
    }
    if (e.type === 'vines' && !caps.canBurn) {
      for (let y = e.y; y < e.y + e.h; y++) for (let x = e.x; x < e.x + e.w; x++) blocked.add(`${x},${y}`);
    }
    // Skylight glass is a floor for everyone but a smasher (a meteor drop goes straight through).
    if (e.type === 'glassFloor' && !caps.canSmash) {
      for (let x = e.x; x < e.x + e.w; x++) blocked.add(`${x},${e.y}`);
    }
  }
  return blocked;
}

function isWater(level: LevelData, x: number, y: number): boolean {
  return level.water.some((w) => x >= w.x && x < w.x + w.w && y >= w.surface);
}

/** The top row of a water span counts as a floor for forms that can run on water (tar is too sticky). */
function isWaterSurface(level: LevelData, x: number, y: number): boolean {
  return level.water.some((w) => x >= w.x && x < w.x + w.w && y === w.surface && w.kind !== 'tar');
}

function isOpen(grid: TileGrid, blocked: Set<string>, x: number, y: number): boolean {
  if (x < 0 || x >= grid.width || y < 0) return false;
  const c = cellAt(grid, x, y);
  return (c === CELL.EMPTY || c === CELL.PLATFORM) && !blocked.has(`${x},${y}`);
}

export function isStandable(level: LevelData, grid: TileGrid, blocked: Set<string>, x: number, y: number, caps?: Capabilities): boolean {
  if (!isOpen(grid, blocked, x, y) || !isOpen(grid, blocked, x, y - 1)) return false;
  if (cellAt(grid, x, y) === CELL.PLATFORM) return false;
  if (isWater(level, x, y)) return false;
  if (caps?.canRunWater && isWaterSurface(level, x, y + 1)) return true;
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
  if (isStandable(level, grid, blocked, start.x, start.y, caps)) {
    seen.add(`${start.x},${start.y}`);
    queue.push(start);
  }

  const solidAt = (x: number, y: number) => isSolidCell(cellAt(grid, x, y)) || blocked.has(`${x},${y}`);
  const visit = (p: Pos) => {
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push(p);
  };

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    // Climbers go up any wall beside them, can jump off it at any height, and pull up onto the top.
    if (caps.canClimb) {
      for (const d of [-1, 1]) {
        let cy = y;
        while (cy > 0 && (solidAt(x + d, cy) || solidAt(x + d, cy - 1)) && isOpen(grid, blocked, x, cy - 1) && isOpen(grid, blocked, x, cy - 2) && !isWater(level, x, cy - 1)) {
          cy--;
          visit({ x, y: cy });
          if (!solidAt(x + d, cy - 1) && isStandable(level, grid, blocked, x + d, cy - 1, caps)) visit({ x: x + d, y: cy - 1 });
        }
      }
    }
    for (let dy = -caps.jumpUp; dy <= MAX_FALL; dy++) {
      const across = dy <= 0 ? caps.jumpAcross + 1 : caps.jumpAcross + 1 + Math.ceil(dy / 2);
      if (dy < 0 && !headroom(grid, blocked, x, y, -dy)) continue;
      for (let dx = -across; dx <= across; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (seen.has(key)) continue;
        if (!isStandable(level, grid, blocked, nx, ny, caps)) continue;
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
