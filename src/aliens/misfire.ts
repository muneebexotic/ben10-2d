import { hasAlien, getAlien } from './registry';
import { pickFrom, type Rng } from '../systems/Rng';

/** Ben's fallback when neither alien has a line for this pair. */
export const GENERIC_MISFIRE_LINES: readonly string[] = ['AW MAN, NOT THIS GUY!', 'STUPID WATCH! WRONG ALIEN!', 'THIS THING HATES ME.'];

/** Every line Ben might say when he wanted `wantedId` and the Omnitrix gave him `gotId`. */
export function misfireLines(wantedId: string, gotId: string): readonly string[] {
  const got = hasAlien(gotId) ? getAlien(gotId) : null;
  const pair = got?.quips.misfire?.wanted[wantedId];
  if (pair && pair.length > 0) return pair;
  const any = got?.quips.misfire?.any;
  return any && any.length > 0 ? any : GENERIC_MISFIRE_LINES;
}

/** Picks reaction lines, never the same one twice in a row for a pair (a second misfire gets the other joke). */
export class MisfireQuips {
  private readonly last = new Map<string, string>();

  constructor(private readonly rng: Rng = Math.random) {}

  line(wantedId: string, gotId: string): string {
    const key = `${wantedId}>${gotId}`;
    const lines = misfireLines(wantedId, gotId);
    const previous = this.last.get(key);
    const fresh = lines.length > 1 ? lines.filter((l) => l !== previous) : lines;
    const line = pickFrom(fresh, this.rng) ?? GENERIC_MISFIRE_LINES[0];
    this.last.set(key, line);
    return line;
  }
}
