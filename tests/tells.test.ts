import { describe, expect, it } from 'vitest';
import { PALETTE } from '../src/config/palette';
import { TELL, tellFor } from '../src/config/tells';

const SOURCES = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Palette keys that name a villain (their colour is a tell's edge, never its core). */
const VILLAIN_COLORS = Object.keys(TELL);

describe('tells: red always means danger (BUGS.md D1)', () => {
  it('every villain tell is danger red at the core, with its own colour at the edge', () => {
    for (const [villain, tell] of Object.entries(TELL)) {
      expect(tell.core, villain).toBe(PALETTE.enemy);
      expect(tell.edge, villain).not.toBe(PALETTE.enemy);
      expect(tell.edge, villain).toBe((PALETTE as Record<string, number>)[villain]);
    }
  });

  it("a villain's effect colour maps to its tell", () => {
    expect(tellFor(PALETTE.kevin)).toBe(TELL.kevin);
    expect(tellFor(PALETTE.animo)).toBe(TELL.animo);
    expect(tellFor(PALETTE.fire2)).toBe(PALETTE.enemy);
  });

  it('no telegraph is drawn in a raw villain colour', () => {
    const bad: string[] = [];
    const raw = new RegExp(`telegraph\\.(line|dashed|rect|zone|target|circle|reticle)\\([^;]*PALETTE\\.(${VILLAIN_COLORS.join('|')})\\b`);
    for (const [file, text] of Object.entries(SOURCES)) {
      text.split('\n').forEach((line, i) => {
        if (raw.test(line)) bad.push(`${file}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
