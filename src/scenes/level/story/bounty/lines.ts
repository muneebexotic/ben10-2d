import type { Line } from '../Dialogue';

/** Chapter 5's dialogue. Sixsix only clicks: the box subtitles him. */

/** The cold open on Vilgax's ship: he hires professionals. */
export const BRIDGE_LINES: readonly Line[] = [
  { who: 'vilgax', text: 'TWO OF MY MACHINES. DESTROYED BY A CHILD.', ms: 2400 },
  { who: 'vilgax', text: 'SO I HAVE HIRED... PROFESSIONALS.', ms: 2000 },
  { who: 'kraab', text: "THE BOY'S AS GOOD AS CAUGHT, MY LORD!", ms: 2000 },
  { who: 'sixsix', text: '(SIXSIX SAYS SOMETHING RUDE)', ms: 1800 },
  { who: 'tetrax', text: "I DON'T DO THIS FOR FREE, VILGAX.", ms: 2000 },
  { who: 'vilgax', text: 'THE BOY. ALIVE. WITH THE WATCH. THE REWARD IS... GENEROUS.', ms: 2800 },
  { who: 'tetrax', text: 'THEN WE HAVE A DEAL.', ms: 1600 },
];

/** Silver Spur at night: the Rustbucket pulls up at the gate. */
export const ARRIVAL_LINES: readonly Line[] = [
  { who: 'max', text: 'SILVER SPUR! A REAL 1880S GOLD RUSH TOWN. THEY STILL DO GOLD-PANNING TOURS!', ms: 3000 },
  { who: 'gwen', text: "GRANDPA, IT'S A GHOST TOWN. THERE'S NOBODY HERE.", ms: 2200 },
  { who: 'ben', text: 'SWEET. NO LINES.', ms: 1400, bubble: true },
];

/** Sixsix strikes first. */
export const FIRST_STRIKE_LINES: readonly Line[] = [
  { who: 'ben', text: "WHOA! WHO'S SHOOTING AT ME?!", ms: 1500, bubble: true },
  { who: 'max', text: "THAT'S NO TOURIST, BEN. TAKE COVER UNDER THE PORCHES!", ms: 2600 },
];

/** A duel ends: he bails back into the sky. */
export const DUEL_TAUNTS: readonly string[] = ['(SIXSIX CLICKS. IT SOUNDS LIKE "LATER")', '(SIXSIX SAYS SOMETHING EVEN RUDER)', '(SIXSIX LAUGHS. IN CLICKS.)'];

/** The jail: Sixsix's net drags Ben into the cell. */
export const NET_LINES: readonly Line[] = [
  { who: 'sixsix', text: '(SIXSIX LAUGHS. IN CLICKS.)', ms: 1600 },
  { who: 'ben', text: 'HEY! YOU CAN\'T JUST LOCK ME UP!', ms: 1400, bubble: true },
];

/** Already have Ghostfreak: no new DNA, just the way out. */
export const NET_GHOST_LINE = "GUESS I'LL LET MYSELF OUT...";

/** Kraab's ambushes in the rail tunnels. */
export const KRAAB_INTRO = "KRAAB'S THE NAME, BOY! REMEMBER IT... IT'S THE LAST THING YOU'LL HEAR!";
export const KRAAB_GONE = "I'LL BE WAITING FOR YOU AT THE BOTTOM, BOY!";

/** The crystal cavern: cornered between Kraab's cannon and Tetrax. */
export const CAVERN_ARRIVAL: readonly Line[] = [
  { who: 'kraab', text: 'END OF THE LINE, BOY! SAY CHEESE!', ms: 1800 },
  { who: 'ben', text: 'UH... CRAB ON ONE SIDE, ROCK GUY ON THE OTHER.', ms: 1700, bubble: true },
];
export const CAVERN_HINT = 'HOLD {K} FACING KRAAB: CRYSTAL SHIELD!';
export const CAVERN_REFLECTED: readonly Line[] = [
  { who: 'kraab', text: 'MY OWN BLAST?! THAT\'S CHEATING!', ms: 1800 },
  { who: 'tetrax', text: 'A PETROSAPIEN? ...INTERESTING.', ms: 2200 },
];
export const CAVERN_MISSED: readonly string[] = ['MISSED! THE SHIELD... HOLD IT UP!', 'FACE HIM. HOLD {K}!'];

/** The lift: all three hunters corner Ben; the watch picks the worst moment to misfire. */
export const LIFT_CORNERED: readonly Line[] = [
  { who: 'kraab', text: 'NOWHERE LEFT TO RUN, BOY!', ms: 1600 },
  { who: 'tetrax', text: 'SURRENDER THE WATCH. NO ONE NEEDS TO GET HURT.', ms: 2200 },
];
export const LIFT_PROMPT = 'THE VOLLEY! {T}: TRANSFORM!';
export const LIFT_DUD: readonly Line[] = [
  { who: 'kraab', text: "HA! IT'S A DUD!", ms: 1400 },
  { who: 'sixsix', text: '(SIXSIX LAUGHS SO HARD HIS JETPACK HICCUPS)', ms: 1800 },
];
export const LIFT_SURVIVED = 'FIFTEEN SECONDS OF THAT. NEVER AGAIN.';
