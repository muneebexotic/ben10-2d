/** A string literal in the source (template literals keep their text parts; `${...}` becomes `\u0000`). */
export interface SourceString {
  file: string;
  line: number;
  text: string;
}

export const HOLE = '\u0000';

/**
 * A small TypeScript lexer: string and template literals, skipping comments and
 * regular expressions. Enough for this codebase's own sources.
 */
export function extractStrings(source: string, file = ''): SourceString[] {
  const out: SourceString[] = [];
  let i = 0;
  let line = 1;
  let lastSignificant = '';
  const n = source.length;
  const readQuoted = (quote: string): string => {
    let s = '';
    i++;
    while (i < n && source[i] !== quote) {
      if (source[i] === '\\') {
        const next = source[i + 1];
        s += next === 'n' ? '\n' : next === 't' ? '\t' : next;
        i += 2;
        continue;
      }
      if (source[i] === '\n') line++;
      s += source[i++];
    }
    i++;
    return s;
  };
  const readTemplate = (): string => {
    let s = '';
    i++;
    while (i < n && source[i] !== '`') {
      if (source[i] === '\\') {
        s += source[i + 1] === 'n' ? '\n' : source[i + 1];
        i += 2;
        continue;
      }
      if (source[i] === '$' && source[i + 1] === '{') {
        // Skip the expression, nested braces and strings included.
        i += 2;
        let depth = 1;
        while (i < n && depth > 0) {
          const c = source[i];
          if (c === '{') depth++;
          else if (c === '}') depth--;
          else if (c === "'" || c === '"') {
            const at = line;
            out.push({ file, line: at, text: readQuoted(c) });
            continue;
          } else if (c === '`') {
            const at = line;
            out.push({ file, line: at, text: readTemplate() });
            continue;
          } else if (c === '\n') line++;
          i++;
        }
        s += HOLE;
        continue;
      }
      if (source[i] === '\n') line++;
      s += source[i++];
    }
    i++;
    return s;
  };
  while (i < n) {
    const c = source[i];
    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (c === '/' && source[i + 1] === '/') {
      while (i < n && source[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }
    if (c === '/' && (lastSignificant === '' || '(,=:[!&|?{};+-*%<>~^'.includes(lastSignificant))) {
      // A regular expression literal.
      i++;
      let inClass = false;
      while (i < n && (source[i] !== '/' || inClass)) {
        if (source[i] === '\\') i++;
        else if (source[i] === '[') inClass = true;
        else if (source[i] === ']') inClass = false;
        i++;
      }
      i++;
      while (i < n && /[a-z]/.test(source[i])) i++;
      lastSignificant = ')';
      continue;
    }
    if (c === "'" || c === '"') {
      const at = line;
      out.push({ file, line: at, text: readQuoted(c) });
      lastSignificant = ')';
      continue;
    }
    if (c === '`') {
      const at = line;
      out.push({ file, line: at, text: readTemplate() });
      lastSignificant = ')';
      continue;
    }
    if (!/\s/.test(c)) lastSignificant = c;
    i++;
  }
  return out;
}

/** Code identifiers written in capitals that are not player-facing text. */
const NOT_TEXT = new Set(['ADD', 'MULTIPLY', 'SCREEN', 'NORMAL', 'ERASE', 'ARRAY_BUFFER', 'UNSIGNED_BYTE', 'FLOAT', 'RGBA']);

/**
 * Player-facing text in this codebase is written in capitals (the pixel font
 * has only capitals): strings with three or more capital letters and no
 * lowercase letters, apart from `x` multipliers and `{TOKEN}`s.
 */
export function isPlayerText(text: string): boolean {
  if (NOT_TEXT.has(text)) return false;
  const stripped = text.replace(/\{[A-Z]+\}/g, '').replace(/\bx(?=\d|\u0000)/g, '');
  if (/[a-z]/.test(stripped)) return false;
  return (stripped.match(/[A-Z]/g) ?? []).length >= 3 && !/^[A-Z0-9_]+$/.test(stripped);
}

/** Every player-facing string in a set of sources (path -> file text, e.g. from `import.meta.glob`). */
export function playerStrings(sources: Record<string, string>): SourceString[] {
  const out: SourceString[] = [];
  for (const [file, text] of Object.entries(sources)) {
    if (file.endsWith('.d.ts')) continue;
    const rel = file.replace(/^(\.\.\/)+/, '');
    for (const s of extractStrings(text, rel)) if (isPlayerText(s.text)) out.push(s);
  }
  return out;
}
