/** A random source in [0, 1). `Math.random` in the game, a seeded generator in tests. */
export type Rng = () => number;

/**
 * Small, fast seeded generator (mulberry32). The same seed always gives the
 * same sequence, so misfire rolls can be tested exactly.
 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random element, or undefined for an empty list. */
export function pickFrom<T>(list: readonly T[], rng: Rng = Math.random): T | undefined {
  if (list.length === 0) return undefined;
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}
