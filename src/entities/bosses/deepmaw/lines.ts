import type { CastId } from '../../../scenes/level/story/cast';

/** A line in the dialogue box (the boss brings its own speakers). */
interface Line {
  who: CastId;
  text: string;
  ms: number;
}

/** The first time Ben reaches the moon pool: Deepmaw comes up out of the dark. */
export const DEEPMAW_INTRO: readonly Line[] = [
  { who: 'max', text: 'CELL 7 WAS EMPTY. THAT MEANS HE IS IN HERE. SOMEWHERE.', ms: 2600 },
  { who: 'deepmaw', text: 'THIRTY YEARS IN A FISHBOWL, TENNYSON! THE FOOD WAS TERRIBLE!', ms: 3000 },
  { who: 'ben', text: 'IS THAT A FISH... IN A HAT?', ms: 2000 },
  { who: 'deepmaw', text: 'CAPTAIN DEEPMAW, YOU BARNACLE! AND YOU LOOK LIKE A SNACK!', ms: 2800 },
  { who: 'max', text: 'KEEP HIM BUSY, BEN! GWEN AND I WILL GET TO THE BOOTH!', ms: 2600 },
];

/** A retry after the first meeting. */
export const DEEPMAW_AGAIN: readonly Line[] = [{ who: 'deepmaw', text: 'BACK FOR SECONDS, BITE-SIZE?', ms: 1800 }];

/** Stage 2: Max drains the moon pool. */
export const DEEPMAW_DRAIN: readonly Line[] = [
  { who: 'max', text: 'DRAINING THE POOL! HANG ON!', ms: 1800 },
  { who: 'deepmaw', text: 'NO! NOT THE WATER! I NEED THAT!', ms: 2000 },
];

/** Stage 3: he rips the outer hatch open. */
export const DEEPMAW_MAELSTROM: readonly Line[] = [
  { who: 'deepmaw', text: 'YOU WANT DRY? HAVE THE WHOLE SEA!', ms: 2000 },
  { who: 'max', text: 'HE OPENED THE OUTER HATCH! SWIM AGAINST IT, BEN!', ms: 2400 },
];

/** Beaten: Max drops the containment field. */
export const DEEPMAW_CAUGHT: readonly Line[] = [
  { who: 'max', text: 'CONTAINMENT FIELD... UP!', ms: 1600 },
  { who: 'deepmaw', text: 'THIS IS NOT OVER, TENNYSON! ...DOES THIS ONE HAVE A SNACK MENU?', ms: 2800 },
];
