import { describe, expect, it } from 'vitest';
import { GLYPHS } from '../src/ui/glyphs';
import { formatControls } from '../src/systems/controlLabels';
import { extractStrings, HOLE, isPlayerText, playerStrings } from './support/strings';

/**
 * String lint over every player-facing string in src/: glyphs the pixel font
 * can draw, control tokens it knows, house spelling, and the canonical
 * spelling of every name. Player text is written in capitals (the font only
 * has capitals), which is how the lint finds it.
 */
const SOURCES = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ALL = playerStrings(SOURCES);
const where = (s: { file: string; line: number }) => `${s.file}:${s.line}`;
const TOKENS = ['T', 'J', 'K', 'JUMP', 'UP', 'DOWN', 'MOVE', 'DIAL', 'PAUSE', 'CONFIRM', 'SKIP'];

/** Spellings that must not appear in player text, with the house form. */
const WRONG: Array<[RegExp, string]> = [
  [/\bHEAT[ -]BLAST\b/, 'HEATBLAST'],
  [/\bFOUR-ARMS\b|\bFOURARMS\b/, 'FOUR ARMS'],
  [/\bXLR-8\b/, 'XLR8'],
  [/\bWILD[ -]MUTT\b/, 'WILDMUTT'],
  [/\bSTINK[ -]FLY\b/, 'STINKFLY'],
  [/\bGRAY MATTER\b|\bGREYMATTER\b/, 'GREY MATTER'],
  [/\bDIAMOND[ -]HEAD\b/, 'DIAMONDHEAD'],
  [/\bGHOST[ -]FREAK\b/, 'GHOSTFREAK'],
  [/\bRUST[ -]BUCKET\b/, 'RUSTBUCKET'],
  [/\bOMNI[ -]TRIX\b/, 'OMNITRIX'],
  [/\bDR ANIMO\b|\bDOCTOR ANIMO\b/, 'DR. ANIMO'],
  [/\bMR\.? SMOOTHIE\b|\bMR SMOOTHY\b|\bMISTER SMOOTHY\b/, 'MR. SMOOTHY'],
  [/(?<!MR\. )\bSMOOTHYS?\b/, 'SMOOTHIE (the drink; MR. SMOOTHY is the shop)'],
  [/\bTRACK ?BOTS?\b/, 'TRACK-BOT'],
  [/\bHUNTER KILLER\b/, 'HUNTER-KILLER'],
  [/\bROAD[ -]BREAKER\b/, 'ROADBREAKER'],
  [/\bKINGCROAK\b/, 'KING CROAK'],
  [/\bKEVIN ELEVEN\b|\bKEVIN11\b/, 'KEVIN 11'],
  [/\bSUMO SLAMMER\b(?!S)|\bSUMOSLAMMERS\b/, 'SUMO SLAMMERS'],
  [/\bGAMEZONE\b/, 'GAME ZONE'],
  // American spelling throughout the game's own text.
  [/\bARMOUR/, 'ARMOR'],
  [/\bCOLOUR/, 'COLOR'],
  [/\bPRACTISE/, 'PRACTICE'],
  [/\bFAVOURITE/, 'FAVORITE'],
  [/\bCENTRE\b/, 'CENTER'],
  [/\bHONOUR/, 'HONOR'],
  [/\bDEFENCE\b/, 'DEFENSE'],
  [/\bUH OH\b/, 'UH-OH'],
  [/\b\d+ YEAR OLD\b/, 'N-YEAR-OLD'],
];

describe('string lint', () => {
  it('finds the player-facing text', () => {
    expect(ALL.length).toBeGreaterThan(800);
    expect(isPlayerText('HERO TIME!')).toBe(true);
    expect(isPlayerText('x\u0000 DONE')).toBe(true);
    expect(isPlayerText('ADD')).toBe(false);
    expect(isPlayerText('heatblast')).toBe(false);
  });

  it('extracts strings and template literals, skipping comments and regexes', () => {
    const src = "// 'NOT THIS'\nconst a = 'ONE'; /* \"NOR THIS\" */ const r = /'[A-Z]'/g; const t = `TWO ${'INNER'} THREE`;";
    expect(extractStrings(src).map((s) => s.text).sort()).toEqual(['INNER', 'ONE', `TWO ${HOLE} THREE`]);
  });

  it('uses only characters the pixel font can draw', () => {
    const glyphs = new Set([...Object.keys(GLYPHS), ...Object.keys(GLYPHS).map((c) => c.toLowerCase()), '\n', HOLE]);
    const missing: string[] = [];
    for (const s of ALL) {
      // Tokens are replaced before drawing, and their labels are checked below.
      const drawn = s.text.replace(/\{[A-Z]+\}/g, '');
      for (const ch of drawn) if (!glyphs.has(ch)) missing.push(`${where(s)} ${JSON.stringify(ch)} in "${s.text}"`);
    }
    expect(missing).toEqual([]);
  });

  it('only uses control tokens that render on keyboard and touch', () => {
    const unknown = ALL.flatMap((s) => [...s.text.matchAll(/\{([A-Za-z]+)\}/g)].filter((m) => !TOKENS.includes(m[1])).map((m) => `${where(s)} ${m[0]}`));
    expect(unknown).toEqual([]);
    for (const token of TOKENS) {
      for (const kind of ['keyboard', 'touch'] as const) {
        const label = formatControls(`{${token}}`, kind);
        expect(label).not.toContain('{');
        for (const ch of label) expect(Object.keys(GLYPHS)).toContain(ch);
      }
    }
  });

  it('spells every name and word the house way', () => {
    const bad: string[] = [];
    for (const s of ALL) for (const [re, want] of WRONG) if (re.test(s.text)) bad.push(`${where(s)} "${s.text}" -> ${want}`);
    expect(bad).toEqual([]);
  });

  it('has no doubled words, doubled spaces inside sentences or stray spaces before punctuation', () => {
    const bad: string[] = [];
    for (const s of ALL) {
      const t = s.text;
      const doubled = /\b([A-Z]{2,})\s+\1\b/.exec(t);
      // "SO. MAKE" style beats and "HOT HOT HOT!" are deliberate.
      if (doubled && !['HOT', 'WHOA', 'BUFFERING', 'MORE', 'COME', 'SNIFF', 'BEN', 'ZOOM'].includes(doubled[1])) bad.push(`${where(s)} doubled "${doubled[1]}": ${t}`);
      if (/[A-Z] [!?.,:;](?!\.)/.test(t) && !/ \.\.\./.test(t)) bad.push(`${where(s)} space before punctuation: ${t}`);
    }
    expect(bad).toEqual([]);
  });

  it('never names a key in a string that skips the token system', () => {
    // Keys belong in {TOKENS} so touch players see their own buttons. Bracketed key hints
    // ("[ESC] BACK") are allowed only in files that choose them by input mode (listed here).
    const keyboardOnly = new Set([
      'src/scenes/ChapterSelectScene.ts',
      'src/scenes/ChapterCompleteScene.ts',
      'src/scenes/DifficultyScene.ts',
      'src/scenes/FileSelectScene.ts',
      'src/scenes/ExtrasScene.ts',
      'src/scenes/SettingsScene.ts',
      'src/scenes/ActEndScene.ts',
      'src/scenes/MenuScene.ts',
      'src/scenes/PauseScene.ts',
      'src/ui/menu/widgets.ts',
      'src/ui/OmnitrixDial.ts',
      'src/systems/controlLabels.ts',
    ]);
    const bad = ALL.filter((s) => /\[(?:[A-Z]|ESC|ENTER|SPACE|UP|DOWN|LEFT|RIGHT|ARROWS)\]|\bPRESS [A-Z]\b/.test(s.text) && !keyboardOnly.has(s.file)).map((s) => `${where(s)} ${s.text}`);
    expect(bad).toEqual([]);
  });
});
