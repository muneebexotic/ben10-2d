import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { artCoverage, clipCoverage, COVERAGE_IDS } from './support/artCoverage';

const PATH = 'docs/ART_COVERAGE.md';

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
    const cast = readFileSync('src/scenes/preload/cartoon/cast.ts', 'utf8');
    const ids = [...cast.matchAll(/\{ manifest: (\w+)_CARTOON/g)].map((m) => m[1].toLowerCase());
    expect(COVERAGE_IDS).toEqual(ids);
  });

  it('docs/ART_COVERAGE.md is up to date (UPDATE_ART_COVERAGE=1 rewrites it)', () => {
    const want = artCoverage();
    if (process.env.UPDATE_ART_COVERAGE) writeFileSync(PATH, want);
    expect(readFileSync(PATH, 'utf8')).toBe(want);
  });
});
