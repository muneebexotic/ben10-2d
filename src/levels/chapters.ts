/**
 * The whole story as Chapter Select shows it. A chapter is playable once its
 * level exists and the one before it is done; the rest stay locked
 * silhouettes that tease what's coming.
 */
export interface ChapterInfo {
  number: number;
  act: number;
  title: string;
  /** The level, once the chapter is built (null: a later update). */
  levelId: string | null;
  /** One cryptic line for the card. */
  tease: string;
  /**
   * Who shows up in silhouette: alien ids that exist (their real sprite),
   * silhouette ids for ones that don't yet, or 'vilgax' / 'omnitrix'.
   */
  cast: string[];
}

export const ACTS: Record<number, string> = {
  1: 'THE SUMMER BEGINS',
  2: 'RIVALS AND HUNTERS',
  3: 'SECRETS',
  4: 'THE OMNITRIX',
};

export const CHAPTERS: readonly ChapterInfo[] = [
  { number: 1, act: 1, title: 'CAMP CRASH', levelId: 'ch1', tease: 'A METEOR. A WATCH. A VERY WEIRD SUMMER.', cast: ['heatblast'] },
  { number: 2, act: 1, title: 'ROAD TRIP', levelId: 'ch2', tease: 'THE DIAL IS ABOUT TO GET TWO NEW FACES...', cast: ['fourarms', 'xlr8'] },
  { number: 3, act: 1, title: 'DR. ANIMO', levelId: 'ch3', tease: 'SOMETHING AT THE MUSEUM IS... EVOLVING.', cast: ['wildmutt', 'stinkfly'] },
  { number: 4, act: 2, title: 'KEVIN 11', levelId: null, tease: 'NEW FRIEND AT THE ARCADE. WHAT COULD GO WRONG?', cast: ['kevin', 'upgrade'] },
  { number: 5, act: 2, title: 'BOUNTY HUNTERS', levelId: null, tease: 'THREE HUNTERS. ONE BOUNTY. GUESS WHO.', cast: ['diamondhead', 'ghostfreak'] },
  { number: 6, act: 2, title: 'MAGIC', levelId: null, tease: "MAGIC ISN'T REAL. RIGHT, GWEN?", cast: ['greymatter'] },
  { number: 7, act: 3, title: 'THE PLUMBERS', levelId: null, tease: 'GRANDPA MAX HAS BEEN KEEPING SECRETS.', cast: ['ripjaws'] },
  { number: 8, act: 3, title: 'ZOMBOZO', levelId: null, tease: 'NEVER TRUST A CLOWN WHO LAUGHS LAST.', cast: ['cannonbolt'] },
  { number: 9, act: 3, title: 'GHOSTFREAK OUT', levelId: null, tease: 'SOMETHING IN THE WATCH WANTS OUT.', cast: ['ghostfreak'] },
  { number: 10, act: 4, title: 'FOREVER KNIGHTS', levelId: null, tease: 'KNIGHTS. CASTLES. VERY SHARP THINGS.', cast: ['wildvine'] },
  { number: 11, act: 4, title: 'SELF-DESTRUCT', levelId: null, tease: 'THE OMNITRIX IS COUNTING DOWN.', cast: ['omnitrix'] },
  { number: 12, act: 4, title: 'VILGAX', levelId: null, tease: "HE'S COMING FOR THE WATCH.", cast: ['vilgax', 'waybig'] },
];

export type ChapterState = 'open' | 'locked' | 'soon';

/**
 * open: playable. locked: built, but the chapter before isn't done yet.
 * soon: not built yet (a later update).
 */
export function chapterState(info: ChapterInfo, completedLevelIds: readonly string[]): ChapterState {
  if (info.levelId === null) return 'soon';
  if (info.number === 1) return 'open';
  const previous = CHAPTERS.find((c) => c.number === info.number - 1);
  return previous?.levelId && completedLevelIds.includes(previous.levelId) ? 'open' : 'locked';
}

/** The title shows on open chapters and on the next one up; the rest stay a mystery. */
export function titleRevealed(info: ChapterInfo, completedLevelIds: readonly string[]): boolean {
  if (info.number === 1) return true;
  const previous = CHAPTERS.find((c) => c.number === info.number - 1);
  return previous?.levelId !== null && previous?.levelId !== undefined && completedLevelIds.includes(previous.levelId);
}

/** Where Chapter Select opens: the first unfinished chapter you can play, else the last one played. */
export function defaultChapterIndex(completedLevelIds: readonly string[]): number {
  const firstOpen = CHAPTERS.findIndex((c) => chapterState(c, completedLevelIds) === 'open' && !completedLevelIds.includes(c.levelId ?? ''));
  if (firstOpen >= 0) return firstOpen;
  let last = 0;
  CHAPTERS.forEach((c, i) => {
    if (c.levelId && completedLevelIds.includes(c.levelId)) last = i;
  });
  return last;
}

export function chapterForLevel(levelId: string): ChapterInfo | null {
  return CHAPTERS.find((c) => c.levelId === levelId) ?? null;
}
