/** HEX AND CHARMCASTER's words (the boss brings its own speakers). */
export const HEX_INTRO_LINES = [
  { who: 'hex', text: 'MY ENGINE IS BROKEN, BOY. BUT THE CHARMS ARE STILL MINE.', ms: 2400 },
  { who: 'charmcaster', text: 'TOGETHER, UNCLE. LET US SHOW THEM SOME REAL MAGIC.', ms: 2400 },
  { who: 'gwen', text: 'BEN, I CAN FEEL THE CHARMS. THEY DO NOT WANT TO BE HIS.', ms: 2400 },
  { who: 'max', text: 'MORE ROCK THINGS ON THE STAIRS! I WILL HOLD THEM. GO!', ms: 2200 },
] as const;

/** Said as each later phase starts (index: the phase). */
export const HEX_PHASE_LINES: Readonly<Record<number, ReadonlyArray<{ who: string; text: string; ms: number }>>> = {
  1: [{ who: 'hex', text: 'ENOUGH. STAND ASIDE, NIECE. FIRE, LIGHTNING, STONE AND WIND: ANSWER ME!', ms: 2600 }],
  2: [
    { who: 'charmcaster', text: 'I HAVE YOU, UNCLE. NOTHING WILL TOUCH YOU.', ms: 2000 },
    { who: 'hex', text: 'AND WHICH OF ME WILL THE BOY STRIKE? HA!', ms: 2000 },
  ],
};
