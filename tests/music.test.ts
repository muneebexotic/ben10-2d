import { describe, expect, it } from 'vitest';
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
