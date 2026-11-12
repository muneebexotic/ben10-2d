import { CH7_MUSIC } from '../../../../config/chapter7';
import { PLUMBER_SEA } from '../../../../levels/chapter7Decor';

/**
 * Whether Ben (at tile `x`) counts as out in the open sea: past the hull's edge
 * by `CH7_MUSIC.seaMargin` tiles to turn either way, so swimming along an edge
 * doesn't flip the music back and forth.
 */
export function inOpenSea(x: number, wasInSea: boolean): boolean {
  const m = wasInSea ? -CH7_MUSIC.seaMargin : CH7_MUSIC.seaMargin;
  return x >= PLUMBER_SEA.from + m && x < PLUMBER_SEA.to - m;
}

/** The level's track for where play starts (tile x; null: the start, inside the base). */
export function plumberTrack(resumeTileX: number | null): 'deep' | 'opensea' {
  return resumeTileX !== null && resumeTileX >= PLUMBER_SEA.from && resumeTileX < PLUMBER_SEA.to ? 'opensea' : 'deep';
}
