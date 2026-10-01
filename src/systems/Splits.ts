/** Speedrun splits: run time at each checkpoint compared with the fastest time ever reached there. */
export interface SplitResult {
  id: string;
  label: string;
  timeMs: number;
  /** Previous best at this split, or null on the first run past it. */
  bestMs: number | null;
  /** timeMs - bestMs (negative = ahead), or null when there is nothing to compare. */
  deltaMs: number | null;
  ahead: boolean;
  newBest: boolean;
}

export const FINISH_SPLIT = 'finish';

export function compareSplit(id: string, label: string, timeMs: number, bestMs: number | null): SplitResult {
  const deltaMs = bestMs === null ? null : timeMs - bestMs;
  return {
    id,
    label,
    timeMs,
    bestMs,
    deltaMs,
    ahead: deltaMs !== null && deltaMs < 0,
    newBest: bestMs === null || timeMs < bestMs,
  };
}

/** "-3.21", "+12.05", "+1:04.50". Ties read as "+0.00": you have to beat it to go gold. */
export function formatDelta(deltaMs: number): string {
  const sign = deltaMs < 0 ? '-' : '+';
  const abs = Math.floor(Math.abs(deltaMs) / 10) * 10;
  const minutes = Math.floor(abs / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  const centis = Math.floor((abs % 1000) / 10);
  const cc = String(centis).padStart(2, '0');
  return minutes > 0 ? `${sign}${minutes}:${String(seconds).padStart(2, '0')}.${cc}` : `${sign}${seconds}.${cc}`;
}
