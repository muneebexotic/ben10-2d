import type { Line } from '../../story/Dialogue';

/**
 * Chapter 8's dialogue (the game's own). Moods pick the family's faces
 * (Chapter 7's close-ups); the circus's stars speak with portraits painted
 * from their rigs.
 */

export const CH8_OPENING: readonly Line[] = [
  { who: 'gwen', text: 'LOOK AT THEM. THEY LOOK LIKE SOMEBODY UNPLUGGED THEM.', ms: 2600, mood: 'shocked' },
  { who: 'max', text: 'THE PLUMBERS HAVE A FILE ON THIS CIRCUS. A FAT ONE.', ms: 2400, mood: 'neutral' },
  { who: 'max', text: 'EVERY TOWN IT VISITS WALKS OUT GREY. NOBODY REMEMBERS BEING SCARED.', ms: 3000, mood: 'neutral' },
  { who: 'ben', text: 'SO WE GO IN, FIND THE CREEPY THING, AND I GET A FUNNEL CAKE.', ms: 2600, mood: 'happy' },
  { who: 'gwen', text: 'THAT IS NOT A PLAN.', ms: 1600, mood: 'angry' },
  { who: 'ben', text: 'IT\'S TWO-THIRDS OF A PLAN.', ms: 1800, mood: 'happy' },
];

export const CH8_SHOW: readonly Line[] = [
  { who: 'cacklejack', text: 'LADIES! GENTLEMEN! AND WHATEVER YOU ARE, SMALL BOY WITH THE WATCH!', ms: 2800 },
  { who: 'cacklejack', text: 'WELCOME TO THE ONLY SHOW WHERE THE AUDIENCE IS THE SNACK!', ms: 2600 },
  { who: 'cacklejack', text: 'A SCREAM, FRESH FROM THE FRONT ROW... MMM. FEAR NEVER GOES STALE!', ms: 2800 },
  { who: 'max', text: 'BEN, GWEN, GET BEHIND ME.', ms: 1800, mood: 'angry' },
  { who: 'cacklejack', text: 'A BRAVE ONE! IRONJAW, TAKE GRANDPA TO THE BIG TOP. SAVE HIM FOR THE FINALE.', ms: 3000 },
  { who: 'ironjaw', text: 'HNNF.', ms: 1200 },
  { who: 'ben', text: 'HEY! PUT HIM DOWN, YOU OVERGROWN NUTCRACKER!', ms: 2200, mood: 'angry' },
];

export const CH8_GWEN_TAKEN: readonly Line[] = [
  { who: 'tangle', text: 'OOH, A LITTLE MAGICIAN. THE MIRRORS WILL LOVE YOU.', ms: 2400 },
  { who: 'gwen', text: 'BEN! THE MIRRORS! I CAN STILL... SEE YOU...', ms: 2200, mood: 'shocked' },
];

export const CH8_BARREL: readonly Line[] = [
  { who: 'ben', text: 'OKAY. SPINNING ROOM. SPIKY WALLS. THIS IS FINE.', ms: 2000, mood: 'shocked' },
];

export const CH8_HEART: readonly Line[] = [
  { who: 'gwen', text: 'FINALLY! DO YOU KNOW HOW BORING IT IS INSIDE A MIRROR?', ms: 2400, mood: 'angry' },
  { who: 'ben', text: 'YOU WERE IN THERE FOR LIKE FIVE MINUTES.', ms: 1800, mood: 'happy' },
  { who: 'gwen', text: 'FIVE VERY REFLECTIVE MINUTES. COME ON. GRANDPA\'S IN THE BIG TOP.', ms: 2600, mood: 'happy' },
];

/** Gwen's banter as she walks with Ben. */
export const CH8_GWEN_CHATTER: readonly string[] = [
  'I HATE CLOWNS. FOR THE RECORD.',
  'WHY IS EVERY GAME RIGGED?',
  'THE COLOR IS JUST... GONE FROM THEM.',
  'STAY AWAY FROM THE MIRRORS.',
  'THAT CAROUSEL IS PLAYING BACKWARDS.',
];
