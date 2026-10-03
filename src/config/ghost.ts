/** Ghost of your best run: how it's recorded, stored and drawn. */
export const GHOST = {
  /** One sample of Ben's position and pose every this many ms of run time. */
  intervalMs: 100,
  /** localStorage key, kept apart from the save so a full ghost store never breaks saving. */
  storageKey: 'ben10-omnitrix-ghosts',
  /** At most this many ghosts are kept (oldest dropped first): one per file, chapter and difficulty. */
  maxStored: 9,
  alpha: 0.42,
  tint: 0x7fd8ff,
  /** Fades out when it reaches the end of its run. */
  fadeMs: 600,
} as const;
