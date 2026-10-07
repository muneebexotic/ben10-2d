import { describe, expect, it } from 'vitest';

const SOURCES = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('source rules', () => {
  it('reads the sources', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
  });

  it('frame names are compared as strings on both sides', () => {
    // Generated sheets name their frames with numbers, so `frame.name !== '8'`
    // is always true. That broke an arcade cabinet's fire-once check and made
    // the Act 1 ending's clunk play every frame. Compare `String(x.frame.name)`.
    const bad: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      text.split('\n').forEach((line, i) => {
        if (/\.frame\.name\s*[!=]==?/.test(line)) bad.push(`${file}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
