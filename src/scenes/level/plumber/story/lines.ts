import type { Line } from '../../story/Dialogue';

/**
 * Chapter 7's words: the docking ring and the split (GAME_DESIGN.md, Chapter 7,
 * beats 4 and 5).
 */

/** The bay: Max comes clean. */
export const REVEAL_LINES: readonly Line[] = [
  { who: 'max', text: 'WELCOME TO PLUMBER BASE ARABIAN DEEP. MOTHBALLED TWENTY YEARS AGO.', ms: 2800 },
  { who: 'ben', text: 'PLUMBERS? LIKE... TOILETS?', ms: 1800 },
  { who: 'max', text: 'THE PLUMBERS. INTERSTELLAR LAW ENFORCEMENT. I WAS ONE OF THEM FOR THIRTY YEARS.', ms: 3200 },
  { who: 'ben', text: 'MY GRANDPA\'S A SPACE COP?!', ms: 1800 },
  { who: 'gwen', text: 'THE NAVY. RIGHT.', ms: 1600 },
];

/** The bay's hatch reads his badge. */
export const SCAN_TEXT = 'TENNYSON, MAX / MAGISTER, RETIRED';

/** The ring's console wakes the lights. */
export const RING_LINES: readonly Line[] = [
  { who: 'max', text: 'TWENTY YEARS, AND THE OLD GIRL STILL WAKES UP.', ms: 2200 },
  { who: 'gwen', text: 'IT SMELLS LIKE A SUBMARINE\'S SOCK.', ms: 2000 },
];

/** Max's old locker (the card sits on its shelf). */
export const LOCKER_LINES: readonly Line[] = [
  { who: 'max', text: 'MY OLD LOCKER. AND MY BLASTER! STILL CHARGED, TOO.', ms: 2400 },
  { who: 'max', text: '...AND MY ARMOR. IT SHRANK.', ms: 2000 },
  { who: 'ben', text: 'IT DIDN\'T SHRINK, GRANDPA.', ms: 1600 },
  { who: 'max', text: 'GO ON AHEAD. I\'LL BE RIGHT BEHIND YOU.', ms: 2000 },
];

/** The sentries' lockdown: their words float over them, Max's go in the box. */
export const LOCKDOWN = {
  intruder: 'INTRUDER.',
  expired: 'CODE EXPIRED.',
  code: [{ who: 'max', text: 'TENNYSON, MAX. CODE SEVEN-SEVEN-ALPHA!', ms: 2200 }] as readonly Line[],
  after: [{ who: 'max', text: '...WELL. IT HAS BEEN TWENTY YEARS. SORRY, KIDS!', ms: 2400 }] as readonly Line[],
};

/** The control hub: Max and Gwen stay to bring the base back. */
export const SPLIT_LINES: readonly Line[] = [
  { who: 'max', text: 'THIS IS THE CONTROL HUB. GWEN, WITH ME. WE\'LL BRING THE BASE BACK ONLINE.', ms: 3000 },
  { who: 'max', text: 'BEN, FIND THE REACTOR. AND DON\'T TOUCH ANYTHING.', ms: 2400 },
  { who: 'ben', text: 'WHEN HAVE I EVER TOUCHED ANYTHING?', ms: 1800 },
  { who: 'gwen', text: 'DO YOU WANT THE LIST IN ORDER, OR BY HOW MUCH IT COST?', ms: 2600 },
];

export const HUB_UP: readonly Line[] = [{ who: 'max', text: 'HUB\'S UP. WE\'LL TALK YOU THROUGH ON THE INTERCOM. GO!', ms: 2400 }];

/** Gwen's idle banter while she walks with Ben through the ring. */
export const CH7_GWEN_CHATTER: readonly string[] = [
  'GRANDPA. A SPACE COP. I STILL CAN\'T BELIEVE IT.',
  'DON\'T TOUCH ANYTHING. THAT MEANS YOU, BEN.',
  'THESE LOCKERS ARE OLDER THAN OUR PARENTS.',
];
