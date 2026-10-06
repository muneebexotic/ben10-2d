import { describe, expect, it } from 'vitest';
import { GLYPHS } from '../src/ui/glyphs';
import { formatControls } from '../src/systems/controlLabels';
import { GAME_WIDTH } from '../src/config/constants';
import { GAME_OVER_TIPS } from '../src/ui/gameOverTips';

/**
 * Text that has to fit a fixed box, measured with the pixel font's own glyph
 * widths (each glyph advances its width plus one pixel, like the BitmapText).
 */
const SOURCES = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function width(text: string): number {
  let w = 0;
  for (const ch of text.toUpperCase()) w += (GLYPHS[ch]?.[0].length ?? 3) + 1;
  return Math.max(0, w - 1);
}

/** Greedy word wrap, as Phaser's BitmapText does it. */
function wrap(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && width(next) > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Every `{ who: ..., text: ... }` dialogue line in the story. */
function dialogueLines(): Array<{ file: string; who: string; text: string }> {
  const out: Array<{ file: string; who: string; text: string }> = [];
  const re = /who:\s*'(\w+)',\s*text:\s*(['"])((?:\\.|(?!\2).)*)\2/g;
  for (const [file, src] of Object.entries(SOURCES)) {
    for (const m of src.matchAll(re)) out.push({ file: file.replace(/^(\.\.\/)+/, ''), who: m[1], text: m[3].replace(/\\(.)/g, '$1') });
  }
  return out;
}

describe('text fits its box', () => {
  it('measures like the font', () => {
    expect(width('I')).toBe(3);
    expect(width('II')).toBe(7);
    expect(wrap('AAA BBB', width('AAA'))).toEqual(['AAA', 'BBB']);
  });

  it('every dialogue line fits the dialogue box (3 lines beside a portrait)', () => {
    const lines = dialogueLines();
    expect(lines.length).toBeGreaterThan(60);
    // DialogBox: 520 wide, text inset 12 each side, plus 58 for the portrait; 46 tall holds three 11 px lines.
    const tooLong = lines.filter((l) => wrap(l.text, 520 - 24 - 58).length > 3).map((l) => `${l.file} ${l.who}: ${l.text}`);
    expect(tooLong).toEqual([]);
  });

  it('Game Over tips fit their two lines on the narrowest screen, keyboard and touch', () => {
    for (const tip of GAME_OVER_TIPS) {
      for (const kind of ['keyboard', 'touch'] as const) {
        const text = `TIP: ${formatControls(tip.text, kind)}`;
        expect(wrap(text, 560).length, text).toBeLessThanOrEqual(2);
      }
    }
  });

  it('control labels are short enough for one-line prompts on the narrowest screen', () => {
    const worst = 'WRONG ALIEN! {T} SWAPS BACK FOR HALF PRICE... OR KO SOMETHING: +2S';
    for (const kind of ['keyboard', 'touch'] as const) expect(width(formatControls(worst, kind))).toBeLessThan(GAME_WIDTH - 40);
  });
});
