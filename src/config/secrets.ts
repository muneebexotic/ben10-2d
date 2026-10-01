/** Secrets that later aliens unlock. */
export const SECRETS = {
  /** Smash hits (Four Arms) needed to break a cracked wall. */
  crackedWallHp: 3,
  /** How long the locked-alien silhouette shows the first time, and after that. */
  firstHintMs: 3200,
  hintMs: 1800,
  /** Quiet time before touching the wall shows it again. */
  hintCooldownMs: 4000,
} as const;
