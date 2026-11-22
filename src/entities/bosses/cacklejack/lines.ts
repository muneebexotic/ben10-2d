/** CACKLEJACK's patter in the big top (the game's own lines). */

export const CACKLE_INTRO = [
  { who: 'cacklejack', text: 'AND NOW, THE MOMENT YOU\'VE ALL BEEN DREADING!', ms: 2400 },
  { who: 'max', text: 'BEN! DON\'T LET HIM GET INTO YOUR HEAD!', ms: 2200 },
  { who: 'cacklejack', text: 'TOO LATE, GRANDPA. I LIVE THERE NOW. RENT FREE!', ms: 2400 },
] as const;

export const CACKLE_AGAIN = [{ who: 'cacklejack', text: 'BACK FOR AN ENCORE? WONDERFUL. THE STANDS ARE HUNGRY.', ms: 2200 }] as const;

export const CACKLE_HIGHWIRE = [
  { who: 'cacklejack', text: 'IRONJAW! TANGLE! THE HIGH WIRE ACT, IF YOU PLEASE!', ms: 2200 },
] as const;

export const CACKLE_BIGHEAD = [
  { who: 'cacklejack', text: 'ENOUGH! FOR MY FINAL TRICK... A BIGGER ME!', ms: 2200 },
] as const;

/** When one of his acts goes down he loses his footing on the wire. */
export const CACKLE_FALL_TAUNTS = ['HOW DARE YOU HIT MY STARS!', 'NOBODY TOUCHES THE TALENT!'] as const;
