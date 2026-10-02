import { describe, expect, it } from 'vitest';
import { ACTS, CHAPTERS, chapterForLevel, chapterState, defaultChapterIndex, titleRevealed } from '../src/levels/chapters';
import { getLevel } from '../src/levels/registry';
import { hasAlien } from '../src/aliens/registry';
import { SILHOUETTE_KEYS } from '../src/scenes/preload/silhouettes';

describe('chapter catalogue', () => {
  it('covers the twelve chapters of GAME_DESIGN.md in four acts', () => {
    expect(CHAPTERS.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(CHAPTERS.map((c) => c.act))).toEqual(new Set([1, 2, 3, 4]));
    for (const c of CHAPTERS) expect(ACTS[c.act]).toBeTruthy();
  });

  it('every built chapter points at a real level', () => {
    for (const c of CHAPTERS.filter((c) => c.levelId)) expect(getLevel(c.levelId!).chapter).toBe(c.number);
    expect(chapterForLevel('ch1')?.title).toBe('CAMP CRASH');
  });

  it('every silhouette on a locked card can be drawn', () => {
    for (const c of CHAPTERS) {
      for (const id of c.cast) expect(hasAlien(id) || id in SILHOUETTE_KEYS || id === 'vilgax' || id === 'omnitrix', `${c.number}: ${id}`).toBe(true);
    }
  });

  it('teases fit on a card', () => {
    for (const c of CHAPTERS) expect(c.tease.length, c.tease).toBeLessThanOrEqual(48);
  });
});

describe('chapter unlocks', () => {
  it('Chapter 1 is always open; Road Trip opens after it; unbuilt chapters are coming soon', () => {
    expect(chapterState(CHAPTERS[0], [])).toBe('open');
    expect(chapterState(CHAPTERS[1], [])).toBe('locked');
    expect(chapterState(CHAPTERS[1], ['ch1'])).toBe('open');
    expect(chapterState(CHAPTERS[2], ['ch1', 'ch2'])).toBe('soon');
  });

  it('a built chapter opens once the one before it is done', () => {
    const fakeCh2 = { ...CHAPTERS[1], levelId: 'ch2' };
    expect(chapterState(fakeCh2, [])).toBe('locked');
    expect(chapterState(fakeCh2, ['ch1'])).toBe('open');
  });

  it('only reveals the next chapter title once the one before it is done', () => {
    expect(titleRevealed(CHAPTERS[0], [])).toBe(true);
    expect(titleRevealed(CHAPTERS[1], [])).toBe(false);
    expect(titleRevealed(CHAPTERS[1], ['ch1'])).toBe(true);
    expect(titleRevealed(CHAPTERS[2], ['ch1'])).toBe(false);
  });

  it('opens on the first unfinished chapter, or the last one cleared', () => {
    expect(defaultChapterIndex([])).toBe(0);
    expect(defaultChapterIndex(['ch1'])).toBe(1);
    expect(defaultChapterIndex(['ch1', 'ch2'])).toBe(1);
  });
});
