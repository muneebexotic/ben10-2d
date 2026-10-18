import type { SpellId } from '../../../../config/gwen';
import type { LocalId } from '../../../../levels/types';
import type { Line } from '../Dialogue';

/**
 * Chapter 6's words. Light romanised Urdu from the locals, always clear from
 * context or glossed in brackets (config/urdu.ts; the string lint checks it).
 */

/** The port at dusk: the crane swings the Rustbucket ashore. */
export const PORT_LINES: readonly Line[] = [
  { who: 'max', text: 'AN OLD NAVY FRIEND OWED ME A FAVOR. A BERTH ON A CARGO SHIP, NO QUESTIONS ASKED.', ms: 3000 },
  { who: 'ben', text: 'WE SHIPPED AN RV ACROSS AN OCEAN AND NOBODY THINKS THAT IS WEIRD?', ms: 2400 },
  { who: 'gwen', text: 'KARACHI! THE GUIDEBOOK SAYS THE SEAFRONT FAIR IS OPEN ALL NIGHT.', ms: 2400 },
  { who: 'ben', text: 'ALL NIGHT? I LOVE THIS CITY ALREADY.', ms: 1800 },
];

/** Sea View at night: chai with an old friend, and the poster for a magic show. */
export const FAIR_LINES: readonly Line[] = [
  { who: 'max', text: 'RAUF! TWO CHAIS, AND WHATEVER THE KIDS WANT.', ms: 2000 },
  { who: 'rauf', text: 'MAX SAHIB! TWENTY YEARS! CHAI PEE LO, BHAI! (HAVE SOME TEA!)', ms: 2600 },
  { who: 'gwen', text: 'THERE IS A MAGIC SHOW. THE GREAT HEXO. NEXT TO AN EXHIBITION: ANCIENT WONDERS.', ms: 2800 },
  { who: 'ben', text: 'MAGIC SHOWS ARE FAKE, GWEN.', ms: 1600 },
  { who: 'gwen', text: 'SAYS THE KID WITH THE ALIEN WATCH.', ms: 1800 },
];

/** THE GREAT HEXO's finale. */
export const SHOW_LINES: readonly Line[] = [
  { who: 'hex', text: 'LADIES AND GENTLEMEN OF KARACHI! FOR MY FINALE... THE CHARMS OF BEZEL!', ms: 2800 },
];

export const SNATCH_LINES: readonly Line[] = [
  { who: 'charmcaster', text: 'AND NOW, UNCLE... THEY DISAPPEAR.', ms: 2000 },
  { who: 'hex', text: 'TO THE PALACE, CHILD. THE ENGINE IS WAITING.', ms: 2200 },
];

/** The chaos, and the Charm that rolls to Gwen's feet. */
export const CHAOS_LINES: readonly Line[] = [
  { who: 'gwen', text: 'ONE OF THEM DROPPED. IT IS... WARM. AND GLOWING. AT ME.', ms: 2400 },
  { who: 'ben', text: 'GREAT. NOW EVEN THE JEWELRY LIKES YOU BETTER.', ms: 2000 },
  { who: 'max', text: 'THEY ARE HEADING EAST, TO THE OLD PINK PALACE. BEN, CLEAR A PATH! GWEN, STAY CLOSE TO HIM.', ms: 3000 },
];

/** The locals: one line when Ben comes close, another when he's back (or something special for a form). */
export const LOCAL_LINES: Record<LocalId, { first: string; again: string; form?: Partial<Record<string, string>> }> = {
  rauf: {
    first: 'CAREFUL, BHAI! THE KITES HAVE GONE CRAZY! TAKE A CHAI FOR THE ROAD.',
    again: 'MAX SAHIB TAUGHT ME TO MAKE CHAI THIS STRONG. DO NOT TELL HIM I SAID SO.',
    form: { heatblast: 'WAH! A FIRE MAN! CAN YOU KEEP MY KETTLE HOT?', xlr8: 'ACHA, ACHA, YOU ARE IN A HURRY. TAKE IT TO GO!' },
  },
  zain: {
    first: 'BEN BHAI! IS IT REALLY YOU? DO THE FIRE GUY! DO THE FIRE GUY!',
    again: 'SHUKRIYA, BEN BHAI! (THANK YOU!) MY FRIENDS WILL NEVER BELIEVE THIS.',
    form: {
      heatblast: 'SHABASH! THE FIRE GUY! YOU ARE EVEN COOLER IN REAL LIFE!',
      fourarms: 'FOUR ARMS! CAN YOU HOLD MY KITE AND MY ICE CREAM AT THE SAME TIME?',
      greymatter: 'WHERE DID BEN BHAI GO? WHO IS THIS LITTLE GUY?',
    },
  },
  rafiq: {
    first: 'THE PINK PALACE? EVERYONE SAYS IT IS HAUNTED, YAAR.',
    again: '...YOU ARE GOING IN ANYWAY? SHABASH! CHALO, THE GATE IS THAT WAY!',
  },
};

/** The Rustbucket rams the palace gate. */
export const GATE_LINES: readonly Line[] = [
  { who: 'ben', text: 'GRANDPA! YOU JUST DROVE THROUGH A PALACE GATE!', ms: 2000 },
  { who: 'max', text: 'I WILL PAY FOR IT LATER. YOU TWO GO IN. I WILL BE RIGHT BEHIND YOU... ONCE I FIND MY HUBCAP.', ms: 3000 },
];

/** The moment each spell first comes out of Gwen, and what she says after. */
export const LESSON_LINES: Record<SpellId, { before: readonly Line[]; after: readonly Line[] }> = {
  shield: {
    before: [{ who: 'hex', text: 'GO HOME, CHILDREN. OR BE SENT HOME.', ms: 1800 }],
    after: [
      { who: 'gwen', text: 'WHOA. DID I... DO THAT?', ms: 1600 },
      { who: 'ben', text: 'YOU CAN DO MAGIC NOW? THAT IS SO UNFAIR.', ms: 1800 },
    ],
  },
  stun: {
    before: [],
    after: [
      { who: 'gwen', text: 'GET... AWAY... FROM HIM! ...OKAY. I AM STARTING TO LIKE THIS.', ms: 2400 },
      { who: 'ben', text: 'REMIND ME NEVER TO MAKE YOU MAD.', ms: 1700 },
    ],
  },
  reveal: {
    before: [{ who: 'gwen', text: 'WAIT. THIS WALL IS NOT... REAL. HOLD ON.', ms: 1800 }],
    after: [
      { who: 'gwen', text: 'HEX HIDES THINGS. AND I CAN SEE RIGHT THROUGH THEM.', ms: 2200 },
      { who: 'ben', text: 'X-RAY GWEN. GREAT. THERE GOES MY PRIVACY.', ms: 1800 },
    ],
  },
};

/** Charmcaster's cage. */
export const CAGE_LINES: readonly Line[] = [
  { who: 'charmcaster', text: 'MY CAGE HELD A WEREWOLF ONCE, LITTLE BOY. IT WILL HOLD YOU.', ms: 2400 },
  { who: 'charmcaster', text: 'AND THE GIRL\'S CHARM WILL COME TO US SOON ENOUGH.', ms: 2200 },
  { who: 'gwen', text: 'THE BARS ARE WARDED, BEN. NOTHING BIG GETS THROUGH THEM.', ms: 2200 },
];

/** A replay: Ben knows the way out. */
export const CAGE_AGAIN_LINES: readonly Line[] = [{ who: 'ben', text: 'THESE BARS AGAIN? I KNOW JUST THE LITTLE GUY.', ms: 2000 }];

/** Out of the cage, small. */
export const CAGE_OUT_LINES: readonly Line[] = [
  { who: 'gwen', text: '...BEN? YOU ARE TINY.', ms: 1600 },
  { who: 'ben', text: 'TINY AND A GENIUS. THE GENIUS PART IS NEW FOR ME TOO.', ms: 2200 },
];

/** Max catches up in the tunnel with a fire extinguisher. */
export const MAX_LINES: readonly Line[] = [
  { who: 'max', text: 'STAND BACK, KIDS!', ms: 1300 },
  { who: 'ben', text: 'GRANDPA, WHERE DID YOU LEARN THAT?', ms: 1700 },
  { who: 'max', text: '...THE NAVY.', ms: 1500 },
  { who: 'gwen', text: 'THE NAVY TRAINS YOU TO FIGHT MAGIC ROCKS WITH A FIRE EXTINGUISHER?', ms: 2400 },
  { who: 'max', text: 'YOU WOULD BE SURPRISED. GO ON, I WILL HOLD THEM HERE. JALDI! (HURRY!)', ms: 2600 },
];

/** At the clock: the Engine pulls on Gwen's Charm. */
export const ENGINE_LINES: readonly Line[] = [
  { who: 'gwen', text: 'THE CLOCK... IT IS PULLING AT THE CHARM. AT ME.', ms: 2000 },
  { who: 'gwen', text: 'THE ENGINE IS INSIDE THE CLOCK, BEN. ONLY SOMETHING TINY CAN GET IN THERE.', ms: 2600 },
];

export const ENGINE_GO_LINES: readonly Line[] = [{ who: 'gwen', text: 'I WILL KEEP YOU SMALL. HURRY!', ms: 1600 }];

/** The Engine jams; Hex runs for the roof. */
export const JAM_LINES: readonly Line[] = [
  { who: 'hex', text: 'NO! MY ENGINE! ...THIS IS NOT OVER, BOY.', ms: 2000 },
  { who: 'ben', text: 'HE IS CLIMBING THE OUTSIDE OF THE CLOCK TOWER. OF COURSE HE IS.', ms: 2200 },
];

/** Gwen's banter in this chapter (the companion's idle lines). */
export const GWEN_KARACHI_CHATTER: readonly string[] = [
  'THE GUIDEBOOK SAYS THIS PALACE IS A HUNDRED YEARS OLD. TRY NOT TO BREAK IT.',
  'THIS CHARM HUMS WHEN WE GET CLOSE TO HEX. IT IS KIND OF CREEPY.',
  'WHEN THIS IS OVER, I AM GETTING A BUN KEBAB. MAYBE TWO.',
  'GRANDPA HAS BEEN HERE BEFORE. HOW DOES HE KNOW EVERYONE?',
  'I STILL CAN\'T BELIEVE MAGIC IS REAL. OKAY, I CAN. BUT STILL.',
];
