/** THE HUNTERS' lines (portrait box; Ben's `bubble` lines go in his speech bubble). */
export interface HuntLine {
  who: string;
  text: string;
  ms: number;
  bubble?: boolean;
}

export const HUNTERS_KRAAB_START: readonly HuntLine[] = [
  { who: 'kraab', text: 'NO MORE GAMES! THIS CAVE IS MY HOUSE, BOY!', ms: 2000 },
];
export const HUNTERS_KRAAB_BURIED: readonly HuntLine[] = [
  { who: 'kraab', text: "MMPH! GET ME OUT! I CAN'T FEEL MY CLAWS!", ms: 1900 },
  { who: 'ben', text: "RELAX, CRAB-FACE. I DON'T HIT GUYS WHO CAN'T MOVE.", ms: 2200, bubble: true },
  { who: 'sixsix', text: '(SIXSIX CLICKS IMPATIENTLY AND FLIES UP THE SHAFT)', ms: 1900 },
];
export const HUNTERS_SIXSIX_DOWN: readonly HuntLine[] = [
  { who: 'sixsix', text: '(SIXSIX SAYS SOMETHING VERY, VERY RUDE)', ms: 1700 },
];
export const HUNTERS_TETRAX_START: readonly HuntLine[] = [
  { who: 'tetrax', text: 'YOU FIGHT WELL. AND YOU SPARED THE CRAB.', ms: 2200 },
  { who: 'tetrax', text: 'NOW FACE ME. NO TRICKS. NO HIDING.', ms: 2000 },
];
export const HUNTERS_TETRAX_YIELD: readonly HuntLine[] = [
  { who: 'tetrax', text: 'ENOUGH. I YIELD.', ms: 1600 },
  { who: 'tetrax', text: 'A WARRIOR WITH HONOR. VILGAX DID NOT TELL ME THAT.', ms: 2600 },
  { who: 'tetrax', text: 'I REFUSE THE BOUNTY.', ms: 1600 },
  { who: 'vilgax', text: 'TETRAX! YOU TREACHEROUS PEBBLE! FINISH HIM!', ms: 2200 },
  { who: 'tetrax', text: 'FIND ANOTHER PEBBLE, VILGAX.', ms: 1800 },
  { who: 'tetrax', text: 'ONE MORE THING, BOY. ASK YOUR GRANDFATHER WHERE HE LEARNED TO FIGHT LIKE THAT.', ms: 3200 },
];
