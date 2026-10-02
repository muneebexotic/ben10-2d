export interface StoryLine {
  who: 'vilgax' | 'ben';
  text: string;
  /** How long the line stays up before the next one. */
  ms: number;
}

/** Chapter 1 story beats. */
export const STORY = {
  hologram: {
    scale: 1.5,
    hoverAboveFloor: 44,
    riseMs: 700,
    collapseMs: 520,
    /** Presses in the first moments after the arena locks are ignored so a held button can't skip by accident. */
    skipGraceMs: 450,
  },
  vilgaxLines: [
    { who: 'vilgax', text: 'I AM VILGAX, CONQUEROR OF TEN WORLDS. THE OMNITRIX IS MINE, CHILD.', ms: 2900 },
    { who: 'vilgax', text: 'SURRENDER IT... OR MY HUNTER WILL TEAR IT FROM YOUR ARM!', ms: 2600 },
    { who: 'ben', text: 'FINDERS KEEPERS, SQUID FACE!', ms: 1700 },
    { who: 'vilgax', text: 'THEN BE DESTROYED.', ms: 1300 },
  ] as StoryLine[],
  /** Aliens in the whole story (GAME_DESIGN.md roster): the "ALIENS x/13" count on save files. */
  rosterSize: 13,
  dialog: {
    charsPerSecond: 48,
    /** Voice blip every n typed characters. */
    blipEvery: 2,
  },
} as const;

/** Timings of Chapter 2's scripted moments (real milliseconds). */
export const STORY_BEATS = {
  /** A new alien's discovery: obstacle line, the watch acting up, the scan, the reveal, the forced transformation. */
  unlock: {
    skipGraceMs: 900,
    beepAt: 900,
    scanAt: 1500,
    revealAt: 2900,
    transformAt: 4500,
    doneAt: 5000,
  },
} as const;
