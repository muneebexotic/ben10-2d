import type { Line } from '../Dialogue';

/** Main Street at dusk: the Rustbucket broke down where the Act 1 cliffhanger left it. */
export const CITY_ARRIVAL_LINES: readonly Line[] = [
  { who: 'max', text: "ROADBREAKER FRIED THE ALTERNATOR. I'LL HAVE HER PURRING BY MORNING. ...PROBABLY.", ms: 3000 },
  { who: 'gwen', text: "SO WE'RE STUCK IN THE MOST BORING TOWN IN AMERICA. ALL NIGHT.", ms: 2400 },
  { who: 'ben', text: 'BORING? THERE\'S A GAME ZONE RIGHT THERE! WITH, LIKE, A HUNDRED GAMES!', ms: 2600 },
  { who: 'gwen', text: "THE NEWS SAID ITS MACHINES KEEP DYING FOR NO REASON. BEN. DON'T GO LOOKING FOR TROUBLE.", ms: 3200 },
  { who: 'ben', text: "IT'S AN ARCADE, GWEN. WHAT'S THE WORST THAT COULD HAPPEN?", ms: 2200 },
];

/** Inside the GAME ZONE: a kid with every high score in the place. */
export const KEVIN_MEET_LINES: readonly Line[] = [
  { who: 'stranger', text: "YOU'RE STANDING IN MY LIGHT.", ms: 1700 },
  { who: 'ben', text: 'WHOA. "KEV" HAS THE HIGH SCORE ON EVERY GAME IN HERE. IS THAT YOU?', ms: 2600 },
  { who: 'kevin', text: "KEVIN. AND YOU'RE THE KID WITH THE WATCH. YOU WERE ON THE NEWS.", ms: 2600 },
  { who: 'ben', text: 'UH... MAYBE?', ms: 1200 },
  { who: 'kevin', text: "RELAX. I'M A FREAK TOO. WATCH THIS.", ms: 1800 },
];

/** After his trick: he drinks a cabinet dry and throws it. */
export const KEVIN_TRICK_LINES: readonly Line[] = [
  { who: 'ben', text: 'NO WAY! YOU CAN ABSORB ENERGY? THAT IS SO COOL!', ms: 2100 },
  { who: 'kevin', text: "NOBODY'S EVER SAID THAT BEFORE. ...WANNA SEE SOMETHING REALLY COOL?", ms: 2700 },
];

/** He dumps it all into the breaker: free games for everyone... and the mascot band wakes up wrong. */
export const KEVIN_BREAKER_LINES: readonly Line[] = [
  { who: 'kevin', text: 'FREE GAMES FOR EVERYBODY!', ms: 1500 },
  { who: 'kevin', text: "...OKAY. THE BAND ISN'T SUPPOSED TO DO THAT.", ms: 1900 },
];

/** Kevin's banter while he tags along (one at a time, every so often). */
export const KEVIN_CHATTER: readonly string[] = [
  "THIS IS THE BEST NIGHT I'VE HAD IN, LIKE, EVER.",
  'MOST KIDS RUN WHEN THEY SEE WHAT I CAN DO.',
  'I LIVE HERE. WELL. I SLEEP HERE. SAME THING.',
  'BET THAT WATCH COULD DO ANYTHING, HUH?',
  'YOU AND ME, TENNYSON. WE COULD DO WHATEVER WE WANT.',
];

/** Through the LASER LAIR glass, as Upgrade pours into a turret. */
export const LAIR_LINES = {
  sealed: { who: 'kevin', text: "UH-OH. I THINK I OVERCHARGED THE LASER TAG. THOSE AREN'T TOY LASERS ANYMORE!", ms: 2800 },
  watching: { who: 'kevin', text: 'YOU CAN BECOME... A MACHINE?', ms: 2200 },
  out: { who: 'kevin', text: 'YOU WENT INSIDE THE TURRET. HOW DOES IT FEEL? WHAT DOES IT TASTE LIKE?', ms: 2800 },
} as const;

/** HIGH SCORE ALLEY and the SUMO SLAMMERS dare. */
export const SUMO_LINES = {
  dare: { who: 'kevin', text: 'SUMO SLAMMERS. MY HIGH SCORE. NOBODY HAS EVER BEATEN IT. NOBODY.', ms: 2700 },
  won: [
    { who: 'kevin', text: '...', ms: 900 },
    { who: 'kevin', text: 'YOU CHEATED. WITH THE WATCH.', ms: 1800 },
  ],
  lost: [{ who: 'kevin', text: 'HA! STILL THE KING.', ms: 1500 }],
  onward: { who: 'kevin', text: 'WHATEVER. FORGET GAMES. I KNOW A PLACE WITH WAY MORE JUICE.', ms: 2600 },
} as const;

/** Rosewood station: he drinks the third rail and gets greedier with every gulp. */
export const DRAIN_LINES: readonly Line[] = [
  { who: 'kevin', text: "THEY CLOSED LINE 11 BEFORE I WAS BORN. THE THIRD RAIL'S STILL LIVE, THOUGH.", ms: 2900 },
  { who: 'kevin', text: 'AAAH. NOW THAT IS A MEAL.', ms: 1700 },
  { who: 'kevin', text: 'WITH YOUR WATCH, WE COULD RUN THIS WHOLE TOWN.', ms: 2300 },
  { who: 'ben', text: "THAT'S NOT WHAT IT'S FOR.", ms: 1500 },
  { who: 'kevin', text: '...SAYS WHO?', ms: 1400 },
];

export const DRAIN_AFTER = { who: 'kevin', text: "COME ON. THE GOOD STUFF'S DOWN AT THE SUBSTATION.", ms: 2200 } as const;

/** The substation: he finally asks for the watch. */
export const TURN_LINES: readonly Line[] = [
  { who: 'kevin', text: 'LOOK AT ALL THIS POWER, TENNYSON. AND NOBODY USING IT.', ms: 2400 },
  { who: 'ben', text: 'KEVIN, THE WHOLE STATION WENT DARK. PEOPLE NEED THAT.', ms: 2300 },
  { who: 'kevin', text: 'PEOPLE NEVER DID ANYTHING FOR ME.', ms: 1800 },
  { who: 'kevin', text: 'BUT YOU AND ME? WE COULD HAVE IT ALL. GIVE ME THE WATCH.', ms: 2400 },
  { who: 'ben', text: "NO WAY. IT DOESN'T COME OFF. AND EVEN IF IT DID-", ms: 2200 },
  { who: 'kevin', text: "THEN I'LL TAKE WHAT I CAN GET.", ms: 1700 },
];

/** Beaten, he flees down the tunnel, crackling. */
export const TURN_AFTER: readonly Line[] = [{ who: 'kevin', text: "I'VE GOT A TASTE NOW, TENNYSON. AND I WANT MORE.", ms: 2400 }];

/** Kevin, hostile, staying a step ahead in the power depot. */
export const HUNT_TAUNTS: readonly string[] = [
  'CATCH ME IF YOU CAN, HERO!',
  'THESE ROBOTS WORK FOR ME NOW!',
  "IN HERE, TENNYSON. LET'S FINISH THIS.",
];
