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
 * Forced story misfires (Chapter 5) will bypass this.
 */
export function misfireAllowed(c: MisfireContext): boolean {
  if (c.training) return true;
  return c.transformations > 0 && !c.introPlaying && !c.bossIntro && !c.storyMoment;
}
