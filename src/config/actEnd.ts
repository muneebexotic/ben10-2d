/** Act 1's last scene and the ACT COMPLETE screen (real milliseconds). */
export const ACT_END = {
  /** "MEANWHILE..." on black. */
  meanwhileMs: 1600,
  /** Kevin at the arcade: each beat starts this long after the previous one. */
  beats: [
    { line: 'A KID WITH A WATCH THAT TURNS HIM INTO MONSTERS...', ms: 2600 },
    { line: '...AND HE GETS TO BE THE HERO?', ms: 2200 },
  ],
  /** The cabinets die one by one as the power crawls into his arm. */
  drainMs: 2200,
  lastLine: { line: 'I GOTTA MEET THIS GUY.', ms: 2200 },
  turnMs: 900,
  /** The title smash and how long it holds. */
  titleHoldMs: 2600,
  /** ACT COMPLETE: the stamp, then the five aliens fly in one by one. */
  stampAt: 300,
  aliensAt: 1200,
  alienEveryMs: 260,
  statsAt: 2900,
  promptAt: 3600,
  /** Presses this soon after a beat starts never skip it (a held button). */
  skipGraceMs: 500,
} as const;
