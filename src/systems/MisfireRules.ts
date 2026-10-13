/** What the level knows when the Omnitrix is about to roll. */
export interface MisfireContext {
  /** Training decides through its own menu switch, so the rules never block it. */
  training: boolean;
  /** Transformations so far this run. */
  transformations: number;
  /** The story intro (camp, pod, first transform) is still running. */
  introPlaying: boolean;
  /** A boss is making its entrance (arena lock, hologram, drop-in). */
  bossIntro: boolean;
  /** A scripted story moment is running (a new alien's unlock, boarding the Rustbucket). */
  storyMoment?: boolean;
}

/**
 * The watch only misfires in normal play: never on the first transformation
 * of a story run (the tutorial moment), in the intro, or while a boss makes
 * its entrance, or during scripted story moments (a new alien unlocking).
 * The only way past this is a named entry in `FORCED_MISFIRES`.
 */
export function misfireAllowed(c: MisfireContext): boolean {
  if (c.training) return true;
  return c.transformations > 0 && !c.introPlaying && !c.bossIntro && !c.storyMoment;
}

/**
 * The deliberate breaks of "story moments never misfire", by name. There is
 * exactly one (GAME_DESIGN.md, Chapter 5 beat 8): cornered on the mine's lift
 * by all three hunters, Ben reaches for the obvious alien and the watch gives
 * him the wrong one anyway. Nothing else may force a misfire: the controller
 * refuses any other name, and tests/misfire.test.ts and the QA fuzz check
 * that a misfire during a story moment only ever happens here.
 */
export const FORCED_MISFIRES = ['ch5-lift'] as const;
export type ForcedMisfire = (typeof FORCED_MISFIRES)[number];

export function isForcedMisfire(name: string): name is ForcedMisfire {
  return (FORCED_MISFIRES as readonly string[]).includes(name);
}
