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

/** Act 2's last scene (Chapter 6): Keamari harbour, then the base under the Arabian Sea (real milliseconds). */
export const HARBOUR_END = {
  fadeMs: 800,
  /** The harbour: each line starts this long after the scene opens. */
  lines: [
    { at: 700, who: '', text: 'KEAMARI HARBOUR. LATER THAT NIGHT.' },
    { at: 2200, who: 'GWEN', text: 'THE EXHIBITION GETS ITS CHARMS BACK. ALL BUT ONE.' },
    { at: 4800, who: 'BEN', text: 'THE ONE THAT KEEPS GLOWING AT YOU? CREEPY.' },
    { at: 7000, who: 'MAX', text: '...EXCUSE ME, KIDS.' },
    { at: 10200, who: 'MAX', text: 'THIS IS TENNYSON.' },
    { at: 12200, who: 'MAX', text: "...MAGISTER, I'M RETIRED." },
    { at: 14600, who: 'BEN', text: "GRANDPA... WHAT'S THAT BADGE?" },
    { at: 16800, who: 'MAX', text: 'NAVY STUFF. EVERYBODY IN THE RV.' },
  ],
  /** Max's jacket beeps, and he walks to the water's edge to answer. */
  beepAt: 6200,
  walkAt: 8000,
  walkMs: 1800,
  badgeAt: 14300,
  harbourMs: 19200,
  /** Under the sea: the captions, the base's lights one by one, the signal on its screen. */
  meanwhileMs: 2600,
  lightsAt: 3400,
  lightEveryMs: 420,
  lights: 6,
  signalAt: 6400,
  typeMs: 45,
  plumbersAt: 9400,
  baseMs: 12000,
  /** ACT 2 COMPLETE: fireworks over the harbour, the nine aliens slam onto the dial, every chapter's best counts up. */
  fireworkEveryMs: [520, 900] as const,
  slamAt: 900,
  slamEveryMs: 210,
  tallyAt: 3100,
  tallyRowMs: 260,
  countMs: 520,
  promptAt: 5600,
} as const;
