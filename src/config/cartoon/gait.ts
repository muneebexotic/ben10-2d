/**
 * How fast the ground passes under each drawn cycle's planted foot at the
 * cycle's own frame rate (game px/s), measured from the drawings
 * (docs/DECISIONS.md, "Feet that stay planted"). In an HD chapter an actor
 * moving at another speed plays the cycle that much faster or slower, so its
 * feet don't slide. Keyed by the family sheet's prefix, then the pose.
 */
export const GAIT: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  // About 3.1 px a drawing (her second run sheet's shorter stride): 20 and 10 drawings a second.
  gwen: { run: 62, walk: 31 },
  // About 4 px a drawing (drawn 10% bigger than at first): 10 and 15 a second.
  max: { walk: 40, run: 60 },
  // About 5 px a drawing (his second run sheet): 16 and 10 a second.
  kevin: { run: 80, walk: 50 },
};

/** The fastest and slowest a cycle plays to keep up (beyond this its feet slide rather than blur). */
export const GAIT_RATE = { min: 0.5, max: 2, perFrame: 0.25 } as const;
