import type { Line } from '../../story/Dialogue';

/**
 * Chapter 7's words: the docking ring and the split (GAME_DESIGN.md, Chapter 7,
 * beats 4 and 5).
 */

/** The bay: Max comes clean. */
export const REVEAL_LINES: readonly Line[] = [
  { who: 'max', text: 'WELCOME TO PLUMBER BASE ARABIAN DEEP. MOTHBALLED TWENTY YEARS AGO.', ms: 2800, mood: 'happy' },
  { who: 'ben', text: 'PLUMBERS? LIKE... TOILETS?', ms: 1800, mood: 'shocked' },
  { who: 'max', text: 'THE PLUMBERS. INTERSTELLAR LAW ENFORCEMENT. I WAS ONE OF THEM FOR THIRTY YEARS.', ms: 3200 },
  { who: 'ben', text: 'MY GRANDPA\'S A SPACE COP?!', ms: 1800, mood: 'shocked' },
  { who: 'gwen', text: 'THE NAVY. RIGHT.', ms: 1600, mood: 'neutral' },
];

/** The bay's hatch reads his badge. */
export const SCAN_TEXT = 'TENNYSON, MAX / MAGISTER, RETIRED';

/** The ring's console wakes the lights. */
export const RING_LINES: readonly Line[] = [
  { who: 'max', text: 'TWENTY YEARS, AND THE OLD GIRL STILL WAKES UP.', ms: 2200, mood: 'happy' },
  { who: 'gwen', text: 'IT SMELLS LIKE A SUBMARINE\'S SOCK.', ms: 2000, mood: 'hurt' },
];

/** Max's old locker (the card sits on its shelf). */
export const LOCKER_LINES: readonly Line[] = [
  { who: 'max', text: 'MY OLD LOCKER. AND MY BLASTER! STILL CHARGED, TOO.', ms: 2400, mood: 'happy' },
  { who: 'max', text: '...AND MY ARMOR. IT SHRANK.', ms: 2000, mood: 'neutral' },
  { who: 'ben', text: 'IT DIDN\'T SHRINK, GRANDPA.', ms: 1600, mood: 'happy' },
  { who: 'max', text: 'GO ON AHEAD. I\'LL BE RIGHT BEHIND YOU.', ms: 2000 },
];

/** The sentries' lockdown: their words float over them, Max's go in the box. */
export const LOCKDOWN = {
  intruder: 'INTRUDER.',
  expired: 'CODE EXPIRED.',
  code: [{ who: 'max', text: 'TENNYSON, MAX. CODE SEVEN-SEVEN-ALPHA!', ms: 2200 }] as readonly Line[],
  after: [{ who: 'max', text: '...WELL. IT HAS BEEN TWENTY YEARS. SORRY, KIDS!', ms: 2400, mood: 'hurt' }] as readonly Line[],
};

/** The control hub: Max and Gwen stay to bring the base back. */
export const SPLIT_LINES: readonly Line[] = [
  { who: 'max', text: 'THIS IS THE CONTROL HUB. GWEN, WITH ME. WE\'LL BRING THE BASE BACK ONLINE.', ms: 3000 },
  { who: 'max', text: 'BEN, FIND THE REACTOR. AND DON\'T TOUCH ANYTHING.', ms: 2400, mood: 'neutral' },
  { who: 'ben', text: 'WHEN HAVE I EVER TOUCHED ANYTHING?', ms: 1800, mood: 'happy' },
  { who: 'gwen', text: 'DO YOU WANT THE LIST IN ORDER, OR BY HOW MUCH IT COST?', ms: 2600, mood: 'happy' },
];

export const HUB_UP: readonly Line[] = [{ who: 'max', text: 'HUB\'S UP. WE\'LL TALK YOU THROUGH ON THE INTERCOM. GO!', ms: 2400 }];

/** Gwen's idle banter while she walks with Ben through the ring. */
export const CH7_GWEN_CHATTER: readonly string[] = [
  'GRANDPA. A SPACE COP. I STILL CAN\'T BELIEVE IT.',
  'DON\'T TOUCH ANYTHING. THAT MEANS YOU, BEN.',
  'THESE LOCKERS ARE OLDER THAN OUR PARENTS.',
];

/** Kevin dashes past the window of the dry room before the reactor. */
export const GLIMPSE_LINE = 'WAS THAT... KEVIN?';

/** The reactor: Kevin drinking it in. */
export const REACTOR_LINES: readonly Line[] = [
  { who: 'kevin', text: 'ALL THIS ALIEN TECH... AND NOBODY USING IT.', ms: 2400, mood: 'neutral' },
  { who: 'ben', text: 'KEVIN?! HOW DID YOU EVEN GET DOWN HERE?', ms: 2000, mood: 'shocked' },
  { who: 'kevin', text: 'ON THE ROOF OF YOUR ELEVATOR. THANKS FOR THE RIDE, TENNYSON!', ms: 2600, mood: 'happy' },
];

export const CONTAINMENT_FAILURE = 'CONTAINMENT FAILURE';

/** The hatches seal and the sea comes in: Max and Gwen on the intercom. */
export const FLOOD_LINES: readonly Line[] = [
  { who: 'max', text: 'BEN! THE REACTOR\'S DOWN AND THE HULL\'S BREACHED! THE HATCHES SEALED THEMSELVES!', ms: 2800, mood: 'shocked' },
  { who: 'gwen', text: 'GET UP HIGH, BEN! FIND AIR!', ms: 2000, mood: 'shocked' },
];

/** Ripjaws is out of the glass and into the open sea. */
export const SEA_LINES: readonly Line[] = [
  { who: 'gwen', text: 'BEN? BEN! ARE YOU... IS THAT A FISH?', ms: 2200, mood: 'shocked' },
  { who: 'max', text: 'A PISCCISS VOLANN. THE BASE\'S XENOBIOLOGY ARCHIVE IS NEXT DOOR. THE WATCH MUST HAVE READ IT.', ms: 3200 },
  { who: 'max', text: 'COME BACK IN THROUGH THE INTAKE UNDER THE PUMP HALL. WATCH THE GRATE!', ms: 2600 },
];

/** Back inside through the intake: the pump hall, Max and Gwen on the intercom. */
export const PUMP_HALL_LINES: readonly Line[] = [
  { who: 'max', text: 'YOU\'RE IN THE PUMP HALL. EVERY CONSOLE DRAINS ONE ROOM AND FLOODS ANOTHER.', ms: 3000 },
  { who: 'gwen', text: 'A SLIDING PUZZLE MADE OF WATER. TRY NOT TO DROWN IN IT.', ms: 2400, mood: 'happy' },
];

/** One quip per pump as it runs. */
export const PUMP_LINES: Readonly<Record<string, readonly Line[]>> = {
  'p-1': [{ who: 'gwen', text: 'THE FIRST ROOM\'S DRAINING, AND THE NEXT ONE\'S FILLING UP.', ms: 2400 }],
  'p-2': [{ who: 'max', text: 'GOOD. THAT TALL TANK SHOULD FLOOD UP TO THE CONSOLE NOW.', ms: 2400, mood: 'happy' }],
  'p-3': [{ who: 'max', text: 'THAT\'S THE LAST PUMP. CONTAINMENT IS PAST TANK FOUR.', ms: 2400 }],
};

/** Every console, pump and valve running. */
export const ALL_SYSTEMS_LINES: readonly Line[] = [{ who: 'gwen', text: 'EVERY LIGHT IN THE BASE IS ON. NICE WORK, BEN.', ms: 2200, mood: 'happy' }];

/** Containment: Max catches up, blaster in hand. */
export const MAX_CATCHES_UP: readonly Line[] = [
  { who: 'max', text: 'BEN! WAIT UP. GWEN\'S GOT THE HUB. I\'VE GOT THIS.', ms: 2200, mood: 'happy' },
  { who: 'ben', text: 'IS THAT A LASER?! GRANDPA, YOU HAD A LASER THIS WHOLE TIME?', ms: 2400, mood: 'shocked' },
  { who: 'max', text: 'A PLUMBER NEVER LEAVES HOME WITHOUT ONE.', ms: 2000, mood: 'happy' },
];

/** Cell 7: empty. */
export const CELL7_LINES: readonly Line[] = [
  { who: 'max', text: 'CELL 7. EMPTY.', ms: 1600, mood: 'neutral' },
  { who: 'ben', text: 'WHO WAS IN IT?', ms: 1400, mood: 'neutral' },
  { who: 'max', text: 'DEEPMAW.', ms: 1400, mood: 'angry' },
  { who: 'ben', text: 'WHO\'S DEEPMAW?', ms: 1400 },
  { who: 'max', text: 'A PIRATE. HE SANK FOURTEEN STARSHIPS IN THE ANDROMEDA SPRAWL.', ms: 2600, mood: 'angry' },
  { who: 'max', text: 'IT TOOK SIX PLUMBERS AND A VERY BIG NET TO PUT HIM IN THERE. I WAS ONE OF THE SIX.', ms: 3200 },
  { who: 'gwen', text: 'GUYS? SOMETHING BIG JUST MOVED IN THE MOON POOL.', ms: 2400, mood: 'shocked' },
  { who: 'max', text: 'I\'LL TAKE THE BOOTH AND WORK THE PUMPS. GO, BEN!', ms: 2200 },
];

/** The jetty: Max walks them to the water. */
export const JETTY_LINES: readonly Line[] = [{ who: 'max', text: 'STAY CLOSE. AND DON\'T TOUCH ANYTHING.', ms: 2200, mood: 'neutral' }];
export const NAVY_LINES: readonly Line[] = [{ who: 'gwen', text: 'THAT IS NOT NAVY STUFF.', ms: 1800, mood: 'shocked' }];

/** The descent: the base's scanner sweeps them, and everything turns sharp. */
export const RESOLVE_LINES: readonly Line[] = [
  { who: 'ben', text: 'WHOA. DO YOU GUYS FEEL... SHARPER?', ms: 2000, mood: 'shocked' },
  { who: 'gwen', text: 'EVERYTHING LOOKS... DIFFERENT.', ms: 1800, mood: 'shocked' },
  { who: 'max', text: 'THAT\'S THE BASE\'S SCANNER. FIRST TIME\'S ALWAYS A LITTLE WEIRD.', ms: 2600, mood: 'happy' },
];
