/** Omnitrix Training: the sandbox arena on the title screen. */
export const TRAINING = {
  /**
   * Aliens Training lends out before the story unlocks them. Milestone 2:
   * XLR8 and Four Arms are testable here; in the story they unlock in Chapter 2.
   */
  lentAliens: ['xlr8', 'fourarms'] as readonly string[],
  /** Most enemies of one kind alive at once. */
  maxPerKind: 4,
  maxEnemies: 8,
  /** Shown at the bottom while nothing more urgent is. Short enough for the phone prompt gap. */
  prompt: '{PAUSE} TRAINING MENU: SPAWN ENEMIES',
} as const;

export const DUMMY = {
  /** A pause this long starts a new DPS burst. */
  idleResetMs: 3000,
  /** Knocked over by stunning hits; can then be thrown, and pops back after this long. */
  respawnMs: 1400,
  wobbleDecay: 7,
  readoutRise: 46,
} as const;

export const BOULDER = {
  /** Boulders that respawn (Training) reform this long after being thrown. */
  respawnMs: 3500,
} as const;
