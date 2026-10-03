/**
 * Sumo Slammers trading cards: the album's names and flavour text, one entry
 * per card id placed in a level. `color` is the card's mawashi (belt) and
 * frame colour on the album page; `holo` cards are the ones behind an alien.
 */
export interface CardInfo {
  id: string;
  number: number;
  name: string;
  flavour: string;
  color: number;
  holo?: boolean;
}

export const CARDS: readonly CardInfo[] = [
  { id: 'ch1-card-ridge', number: 1, name: 'KAMIKAZE KOJI', flavour: 'HIS SIGNATURE MOVE: FALLING ON YOU FROM VERY HIGH UP.', color: 0xd8323e },
  { id: 'ch1-card-vault', number: 2, name: 'IRON TETSUO', flavour: 'PUNCHED THROUGH A VAULT DOOR TO GET HIS LUNCH BACK.', color: 0x8a8fa8, holo: true },
  { id: 'ch1-card-den', number: 3, name: 'BURROWING BUNTA', flavour: 'TRAINS UNDERGROUND SO NOBODY SEES HIM LOSE.', color: 0x8a5a2a, holo: true },
  { id: 'ch1-card-creek', number: 4, name: 'SPLASHING SATO', flavour: 'SLIPPED IN A CREEK ONCE. NOW HE OWNS THE CREEK.', color: 0x3a8fd8 },
  { id: 'ch1-card-alcove', number: 5, name: 'SHADOW SHIGERU', flavour: 'HIDES IN ALCOVES. WINS EVERY MATCH BY FORFEIT.', color: 0x5a4a8a },
  { id: 'ch2-card-diner', number: 6, name: 'GREASY GORO', flavour: 'FUELED BY DINER PANCAKES. 400 POUNDS OF SYRUP.', color: 0xe8a23a },
  { id: 'ch2-card-hoodoo', number: 7, name: 'ROCKSLIDE RYU', flavour: 'STOOD ON A HOODOO FOR THREE DAYS TO PROVE A POINT. NOBODY KNOWS WHICH.', color: 0xc8643a },
  { id: 'ch2-card-river', number: 8, name: 'RIVER KING RIKI', flavour: 'RUNS ACROSS WATER. SAYS IT IS ALL IN THE KNEES.', color: 0x3ac8d8, holo: true },
  { id: 'ch2-card-sign', number: 9, name: 'NEON NOBU', flavour: 'HIS AUTOGRAPH IS ON EVERY TRUCK STOP SIGN IN THE STATE. HE CLIMBED TO ALL OF THEM.', color: 0xff5ac8, holo: true },
  { id: 'ch2-card-vault', number: 10, name: 'TEN-WHEEL TAKA', flavour: 'BENCH PRESSES TRUCKS. THE TRUCKS DO NOT ENJOY IT.', color: 0x5a6a4a, holo: true },
  { id: 'ch3-card-roof', number: 11, name: 'ROOFTOP RENJI', flavour: 'ONLY WRESTLES ON ROOFS. HIS OPPONENTS FALL FURTHER.', color: 0x9fb8ff },
  { id: 'ch3-card-egg', number: 12, name: 'JURASSIC JIRO', flavour: 'CLAIMS HE HATCHED FROM AN EGG. THE MUSEUM WANTS IT BACK.', color: 0x6ac85a, holo: true },
  { id: 'ch3-card-bear', number: 13, name: 'GRIZZLY GENTA', flavour: 'OUT-STARED A STUFFED BEAR. THE BEAR BLINKED FIRST. ALLEGEDLY.', color: 0x7a4a2a },
  { id: 'ch3-card-dark', number: 14, name: 'NIGHT-LIGHT NAO', flavour: 'AFRAID OF THE DARK. TERRIFYING IN IT.', color: 0xffb070, holo: true },
  { id: 'ch3-card-whale', number: 15, name: 'BIG BLUE BUNZO', flavour: 'HAS THE BELLY OF A WHALE. AND THE APPETITE.', color: 0x2a5ab8, holo: true },
  { id: 'ch3-card-vent', number: 16, name: 'VENT VIPER', flavour: 'SLIPS THROUGH GAPS NOBODY ELSE FITS IN. NOBODY ASKS HOW.', color: 0x9a7ad8, holo: true },
  { id: 'ch3-card-vat', number: 17, name: 'TOXIC TORA', flavour: 'TRAINED IN A VAT OF MUTAGEN. NOW HE GLOWS. IN A GOOD WAY. MOSTLY.', color: 0x46ffb4, holo: true },
];

export function cardInfo(id: string): CardInfo | undefined {
  return CARDS.find((c) => c.id === id);
}
