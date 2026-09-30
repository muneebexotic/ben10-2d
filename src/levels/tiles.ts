/** Tile grid values (what the cell is) and tileset frames (how it looks). */
export const CELL = {
  EMPTY: 0,
  GROUND: 1,
  ROCK: 2,
  PLATFORM: 3,
} as const;
export type CellValue = (typeof CELL)[keyof typeof CELL];

export const FRAME = {
  EMPTY: -1,
  GRASS_TOP: 0,
  GRASS_TOP_L: 1,
  GRASS_TOP_R: 2,
  GRASS_TOP_S: 3,
  DIRT: 4,
  DIRT_L: 5,
  DIRT_R: 6,
  DIRT_BOTTOM: 7,
  ROCK_TOP: 8,
  ROCK_TOP_L: 9,
  ROCK_TOP_R: 10,
  ROCK_TOP_S: 11,
  ROCK: 12,
  ROCK_L: 13,
  ROCK_R: 14,
  ROCK_BOTTOM: 15,
  PLATFORM_L: 16,
  PLATFORM_M: 17,
  PLATFORM_R: 18,
  PLATFORM_S: 19,
  DIRT_VAR: 20,
  ROCK_VAR: 21,
  DIRT_DEEP: 22,
  GRASS_TOP_VAR: 23,
} as const;

export const TILESET_FRAME_COUNT = 24;
export const ONE_WAY_FRAMES: readonly number[] = [
  FRAME.PLATFORM_L,
  FRAME.PLATFORM_M,
  FRAME.PLATFORM_R,
  FRAME.PLATFORM_S,
];
export const SOLID_FRAMES: readonly number[] = Array.from({ length: TILESET_FRAME_COUNT }, (_, i) => i).filter(
  (i) => !ONE_WAY_FRAMES.includes(i),
);

export function isSolidCell(value: number): boolean {
  return value === CELL.GROUND || value === CELL.ROCK;
}
