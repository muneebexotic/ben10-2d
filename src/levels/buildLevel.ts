import type { LevelData } from './types';
import { CELL, FRAME, isSolidCell, type CellValue } from './tiles';

export interface TileGrid {
  width: number;
  height: number;
  cells: CellValue[][];
}

export function buildCells(level: LevelData): TileGrid {
  const { width, height } = level;
  const cells: CellValue[][] = Array.from({ length: height }, () => new Array<CellValue>(width).fill(CELL.EMPTY));

  for (const s of level.solids) {
    const value = s.material === 'rock' ? CELL.ROCK : CELL.GROUND;
    const bottom = s.h === undefined ? height : Math.min(height, s.top + s.h);
    for (let y = Math.max(0, s.top); y < bottom; y++) {
      for (let x = Math.max(0, s.x); x < Math.min(width, s.x + s.w); x++) cells[y][x] = value;
    }
  }

  for (const c of level.carves) {
    for (let y = Math.max(0, c.y); y < Math.min(height, c.y + c.h); y++) {
      for (let x = Math.max(0, c.x); x < Math.min(width, c.x + c.w); x++) cells[y][x] = CELL.EMPTY;
    }
  }

  for (const p of level.platforms) {
    if (p.y < 0 || p.y >= height) continue;
    for (let x = Math.max(0, p.x); x < Math.min(width, p.x + p.w); x++) {
      if (cells[p.y][x] === CELL.EMPTY) cells[p.y][x] = CELL.PLATFORM;
    }
  }

  return { width, height, cells };
}

export function cellAt(grid: TileGrid, x: number, y: number): CellValue {
  if (x < 0 || x >= grid.width) return CELL.ROCK;
  if (y < 0) return CELL.EMPTY;
  if (y >= grid.height) return CELL.ROCK;
  return grid.cells[y][x];
}

/** Deterministic per-cell noise for texture variation. */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Picks a tileset frame for every cell from its neighbours. */
export function autotile(grid: TileGrid): number[][] {
  const frames: number[][] = [];
  for (let y = 0; y < grid.height; y++) {
    const row: number[] = [];
    for (let x = 0; x < grid.width; x++) row.push(frameFor(grid, x, y));
    frames.push(row);
  }
  return frames;
}

function frameFor(grid: TileGrid, x: number, y: number): number {
  const cell = cellAt(grid, x, y);
  if (cell === CELL.EMPTY) return FRAME.EMPTY;

  if (cell === CELL.PLATFORM) {
    const left = cellAt(grid, x - 1, y) === CELL.PLATFORM;
    const right = cellAt(grid, x + 1, y) === CELL.PLATFORM;
    if (left && right) return FRAME.PLATFORM_M;
    if (left) return FRAME.PLATFORM_R;
    if (right) return FRAME.PLATFORM_L;
    return FRAME.PLATFORM_S;
  }

  const rock = cell === CELL.ROCK;
  const topOpen = !isSolidCell(cellAt(grid, x, y - 1));
  const leftOpen = !isSolidCell(cellAt(grid, x - 1, y));
  const rightOpen = !isSolidCell(cellAt(grid, x + 1, y));
  const bottomOpen = !isSolidCell(cellAt(grid, x, y + 1));

  if (topOpen) {
    if (leftOpen && rightOpen) return rock ? FRAME.ROCK_TOP_S : FRAME.GRASS_TOP_S;
    if (leftOpen) return rock ? FRAME.ROCK_TOP_L : FRAME.GRASS_TOP_L;
    if (rightOpen) return rock ? FRAME.ROCK_TOP_R : FRAME.GRASS_TOP_R;
    if (!rock && hash(x, y) > 0.7) return FRAME.GRASS_TOP_VAR;
    return rock ? FRAME.ROCK_TOP : FRAME.GRASS_TOP;
  }
  if (bottomOpen) return rock ? FRAME.ROCK_BOTTOM : FRAME.DIRT_BOTTOM;
  if (leftOpen) return rock ? FRAME.ROCK_L : FRAME.DIRT_L;
  if (rightOpen) return rock ? FRAME.ROCK_R : FRAME.DIRT_R;

  const n = hash(x, y);
  if (rock) return n > 0.75 ? FRAME.ROCK_VAR : FRAME.ROCK;
  let depth = 0;
  while (depth < 4 && isSolidCell(cellAt(grid, x, y - depth - 1))) depth++;
  if (depth >= 4) return FRAME.DIRT_DEEP;
  return n > 0.72 ? FRAME.DIRT_VAR : FRAME.DIRT;
}

/** Surface row under a column: the first solid or platform cell at or below `fromY`. */
export function surfaceBelow(grid: TileGrid, x: number, fromY: number): number | null {
  for (let y = Math.max(0, fromY); y < grid.height; y++) {
    const c = cellAt(grid, x, y);
    if (c !== CELL.EMPTY) return y;
  }
  return null;
}
