/**
 * Chapter 6's romanised Urdu: the only words the game uses, each with one
 * house spelling and its meaning. The string lint (tests/strings.test.ts)
 * flags other spellings, and asks every line that uses a word marked
 * `gloss` to carry its English in brackets. The rest read clearly from
 * context (a name tag, a greeting, a cheer).
 */
export interface UrduWord {
  /** The English it means. */
  meaning: string;
  /** Not obvious from context: a line that uses it must carry the English "(...)". */
  gloss: boolean;
  /** Spellings players might expect that the game never uses (the lint flags them). */
  not?: readonly string[];
}

export const URDU: Readonly<Record<string, UrduWord>> = {
  BHAI: { meaning: 'brother (a friendly way to address a man or a boy)', gloss: false, not: ['BHAAI', 'BHAEE'] },
  YAAR: { meaning: 'buddy, friend', gloss: false, not: ['YAR'] },
  SHABASH: { meaning: 'well done, bravo', gloss: false, not: ['SHABAASH', 'SHAABASH'] },
  CHALO: { meaning: "let's go", gloss: false, not: ['CHALLO', 'CHALOO'] },
  CHAI: { meaning: 'tea (with milk and spices)', gloss: false },
  'PEE LO': { meaning: 'drink up', gloss: true },
  ACHA: { meaning: 'okay, I see', gloss: false, not: ['ACHHA', 'ACCHA'] },
  JALDI: { meaning: 'hurry, quickly', gloss: true, not: ['JALDEE'] },
  WAH: { meaning: 'wow (admiring)', gloss: false, not: ['WAAH'] },
  SAHIB: { meaning: 'sir (respectful)', gloss: false, not: ['SAAB', 'SAHEB'] },
  TAAZA: { meaning: 'fresh', gloss: false, not: ['TAZA'] },
  KHANA: { meaning: 'house (CHAI KHANA: a tea house)', gloss: false },
  PATANG: { meaning: 'kite', gloss: false },
  BACHAY: { meaning: 'kids', gloss: true, not: ['BACHE', 'BACHCHE'] },
  SHUKRIYA: { meaning: 'thank you', gloss: true, not: ['SHUKRIA'] },
};
