/**
 * How fast the ground passes under each drawn cycle's planted foot at the
 * cycle's own frame rate (game px/s), measured from the drawings
 * (docs/DECISIONS.md, "Feet that stay planted"). In an HD chapter an actor
 * moving at another speed plays the cycle that much faster or slower, so its
 * feet don't slide. Keyed by the family sheet's prefix, then the pose.
 */
export const GAIT: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  // About 3.95 px a drawing: 16 and 10 drawings a second.
  gwen: { run: 63, walk: 39.5 },
  // About 3.6 px a drawing: 10 and 15 a second.
  max: { walk: 36, run: 54 },
  // About 4.55 px a drawing: 16 and 10 a second.
  kevin: { run: 73, walk: 46 },
};

/** The fastest and slowest a cycle plays to keep up (beyond this its feet slide rather than blur). */
export const GAIT_RATE = { min: 0.5, max: 2, perFrame: 0.25 } as const;
