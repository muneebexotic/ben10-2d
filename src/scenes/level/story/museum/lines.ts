import type { Line } from '../Dialogue';

/** Outside the museum at night: how the Tennysons end up here. */
export const MUSEUM_ARRIVAL_LINES: readonly Line[] = [
  { who: 'max', text: 'THE TRI-COUNTY NATURAL HISTORY MUSEUM! THEIR NIGHT TOUR OF THE MESOZOIC IS LEGENDARY.', ms: 3100 },
  { who: 'gwen', text: "GRANDPA, IT'S CLOSED. EVERY LIGHT IN THE PLACE IS OFF.", ms: 2300 },
  { who: 'ben', text: "NOT EVERY LIGHT. WHY'S THE SIDE DOOR GLOWING... GREEN?", ms: 2400 },
  { who: 'max', text: 'THE PAPER SAID A SCIENTIST GOT FIRED FROM HERE LAST MONTH. SOMETHING ABOUT "ANIMAL EXPERIMENTS".', ms: 3200 },
  { who: 'gwen', text: "BEN. DON'T EVEN THINK ABOUT IT.", ms: 1700 },
];

/** Dr. Animo's entrance over the T-rex. */
export const ANIMO_INTRO_LINES: readonly Line[] = [
  { who: 'animo', text: 'WELCOME, CHILD, TO THE HALL OF EVOLUTION. I AM DR. ANIMO.', ms: 2700 },
  { who: 'animo', text: 'THIS MUSEUM CALLED MY LIFE\'S WORK "AN ABOMINATION". TONIGHT ITS EXHIBITS AGREE WITH ME.', ms: 3300 },
  { who: 'ben', text: 'OKAY, CREEPY CROWN GUY. WHAT IS WITH THE RATS?', ms: 2000 },
  { who: 'animo', text: 'RATS? THESE ARE THE NEXT STEP IN EVOLUTION. AND YOU, BOY, ARE A DEAD END.', ms: 3000 },
  { who: 'animo', text: 'MY CHILDREN... FEAST!', ms: 1500 },
];

/** If Ben is already an alien when Animo sees him, Animo notices the watch. */
export const ANIMO_SEES_ALIEN: Line = { who: 'animo', text: 'FASCINATING! A WALKING GENETIC MIRACLE! I MUST HAVE THAT WATCH!', ms: 2800 };

/** Over the PA in the Night Gallery. */
export const BLACKOUT_LINES: readonly Line[] = [{ who: 'animo', text: "LET'S SEE HOW YOU FARE, BOY... IN THE DARK.", ms: 2300 }];

/** Wildmutt's first breath. He can only growl; the box subtitles him. */
export const WILDMUTT_FIRST: readonly Line[] = [{ who: 'wildmutt', text: '*SNIFF SNIFF* (I CAN\'T SEE A THING... BUT I CAN SMELL EVERYTHING!)', ms: 2800 }];

/** Across the atrium, before the bridge goes. */
export const ATRIUM_TAUNT: readonly Line[] = [
  { who: 'animo', text: 'AH, THE TAR PITS. TEN THOUSAND YEARS OF SPECIMENS, PERFECTLY PRESERVED.', ms: 2600 },
  { who: 'animo', text: 'ALLOW ME TO ADD YOU TO THE COLLECTION!', ms: 1600 },
];

/** Animo watching Ben fly out of the pit. */
export const ATRIUM_AFTER: readonly Line[] = [
  { who: 'animo', text: 'AN INSECT?! ...DISGUSTINGLY MAGNIFICENT. TO THE LAB!', ms: 2400 },
];
