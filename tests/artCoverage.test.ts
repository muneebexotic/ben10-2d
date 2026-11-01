import { describe, expect, it } from 'vitest';
import { artCoverage, clipCoverage, COVERAGE_IDS } from './support/artCoverage';

const DOC = import.meta.glob('../docs/ART_COVERAGE.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const CAST = import.meta.glob('../src/scenes/preload/cartoon/cast.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** Node's own, without its types (the project has none): set UPDATE_ART_COVERAGE=1 to rewrite the doc. */
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};

describe('art coverage', () => {
  it('tells drawn poses from stand-ins', () => {
    const clips = { idle: { frames: ['stand'], loop: true }, run: { frames: ['run0', 'run1'], loop: true }, jump: { frames: ['run1'], loop: false } };
    expect(clipCoverage('idle', clips).status).toBe('drawn');
    expect(clipCoverage('run', clips).status).toBe('drawn');
    expect(clipCoverage('jump', clips).status).toBe('stand-in');
    expect(clipCoverage('cast', clips).status).toBe('waiting');
    expect(clipCoverage('cast', undefined).status).toBe('painted');
  });

  it("lists the cast's characters in the cast's order", () => {
    const cast = Object.values(CAST)[0];
    const ids = [...cast.matchAll(/\{ manifest: (\w+)_CARTOON/g)].map((m) => m[1].toLowerCase());
    expect(COVERAGE_IDS).toEqual(ids);
  });

  it('docs/ART_COVERAGE.md is up to date (UPDATE_ART_COVERAGE=1 rewrites it)', async () => {
    const want = artCoverage();
    if (env.UPDATE_ART_COVERAGE) {
      const fs = (await import(/* @vite-ignore */ ['node', 'fs'].join(':'))) as { writeFileSync(path: string, text: string): void };
      fs.writeFileSync('docs/ART_COVERAGE.md', want);
      return;
    }
    expect(Object.values(DOC)[0]).toBe(want);
  });
});
