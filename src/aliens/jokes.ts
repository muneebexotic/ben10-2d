import { misfireLines } from './misfire';
import { allAliens } from './registry';

/** One misfire reaction line, and every "wanted X" that can lead to it. */
export interface Joke {
  id: string;
  /** The alien Ben got. */
  gotId: string;
  /** The aliens he could have wanted when he heard it. */
  wanted: string[];
  text: string;
}

export function jokeId(gotId: string, text: string): string {
  return `${gotId}|${text}`;
}

/**
 * Every misfire line the roster can produce, once each, in dial order of the
 * alien Ben got: the JOKES FOUND page. It grows as aliens join the roster.
 */
export function jokeCatalog(): Joke[] {
  const out = new Map<string, Joke>();
  const roster = allAliens();
  for (const got of roster) {
    for (const wanted of roster) {
      if (wanted.id === got.id) continue;
      for (const text of misfireLines(wanted.id, got.id)) {
        const id = jokeId(got.id, text);
        const joke = out.get(id) ?? { id, gotId: got.id, wanted: [], text };
        joke.wanted.push(wanted.id);
        out.set(id, joke);
      }
    }
  }
  return [...out.values()];
}
