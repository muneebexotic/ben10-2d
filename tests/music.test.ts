import { describe, expect, it, vi } from 'vitest';

// The sea's edge lives with Chapter 7's decor, whose art module imports Phaser (it needs a browser): not used here.
vi.mock('phaser', () => ({ default: {} }));
import { RECORDINGS } from '../src/config/music';

interface Fs {
  existsSync(path: string): boolean;
  statSync(path: string): { size: number };
}

describe('recorded music (config/music.ts)', () => {
  it('every recording has its file, a loop inside it and a level near the others', async () => {
    const fs = (await import(/* @vite-ignore */ ['node', 'fs'].join(':'))) as Fs;
    for (const [name, r] of Object.entries(RECORDINGS)) {
      const path = `public/${r.url}`;
      expect(fs.existsSync(path), name).toBe(true);
      // Small enough for phones: a couple of MB a minute at most.
      expect(fs.statSync(path).size, name).toBeLessThan(4_000_000);
      expect(r.url.endsWith('.m4a'), name).toBe(true);
      expect(r.loopStart, name).toBeGreaterThanOrEqual(0);
      if (!r.once) expect(r.loopEnd - r.loopStart, name).toBeGreaterThan(10);
      expect(Math.abs(r.gainDb ?? 0), name).toBeLessThan(12);
    }
  });
});

describe("Chapter 7's music follows Ben out of the hull and back", () => {
  it('turns past the hull by a margin each way, and starts on the sea track only at a checkpoint out at sea', async () => {
    const { inOpenSea, plumberTrack } = await import('../src/scenes/level/plumber/story/seaMusicRules');
    const { PLUMBER_SEA } = await import('../src/levels/chapter7Decor');
    const { CH7_MUSIC } = await import('../src/config/chapter7');
    const m = CH7_MUSIC.seaMargin;
    // Coming out: not yet at the hull, out past the margin.
    expect(inOpenSea(PLUMBER_SEA.from, false)).toBe(false);
    expect(inOpenSea(PLUMBER_SEA.from + m, false)).toBe(true);
    // Going back in: still the sea at the hull, the base past the margin.
    expect(inOpenSea(PLUMBER_SEA.from, true)).toBe(true);
    expect(inOpenSea(PLUMBER_SEA.from - m - 0.1, true)).toBe(false);
    expect(plumberTrack(null)).toBe('deep');
    expect(plumberTrack((PLUMBER_SEA.from + PLUMBER_SEA.to) / 2)).toBe('opensea');
  });
});
