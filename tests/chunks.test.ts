import { describe, expect, it } from 'vitest';
import { LEVEL_META, metaOf } from '../src/levels/manifest';
import { STORY_LEVELS } from './support/levels';
import { knownLevelIds } from '../src/chapters/registry';

const RAW = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** Sources by path under src/ ("scenes/LevelScene.ts"). */
const SOURCES = new Map(Object.entries(RAW).map(([k, v]) => [k.replace('../src/', ''), v]));

/** Resolves a relative import from a file under src/ (both without a leading ./). */
function resolve(from: string, spec: string): string | null {
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  return [`${base}.ts`, `${base}/index.ts`].find((c) => SOURCES.has(c)) ?? null;
}

/** Files main.ts reaches through static imports (type-only imports and dynamic `import()` don't count). */
function coreFiles(): Set<string> {
  const re = /^\s*(?:import|export)\s+(?!type\b)(?:[^'"]*?\sfrom\s+)?['"](\.[^'"]+)['"]/gm;
  const seen = new Set(['main.ts']);
  const queue = ['main.ts'];
  while (queue.length > 0) {
    const file = queue.shift()!;
    for (const m of SOURCES.get(file)!.matchAll(re)) {
      const dep = resolve(file, m[1]);
      if (dep && !seen.has(dep)) {
        seen.add(dep);
        queue.push(dep);
      }
    }
  }
  return seen;
}

describe('chapter chunks (docs/PERFORMANCE.md, "Loading")', () => {
  it('the manifest matches every level it describes', () => {
    expect(LEVEL_META.map((m) => m.id)).toEqual(STORY_LEVELS.map((l) => l.id));
    for (const level of STORY_LEVELS) expect(LEVEL_META.find((m) => m.id === level.id), level.id).toEqual(metaOf(level));
  });

  it('every story level has a chunk to load', () => {
    for (const meta of LEVEL_META) expect(knownLevelIds(), meta.id).toContain(meta.id);
  });

  it("boot never imports a chapter's own code", () => {
    const core = coreFiles();
    expect(core.has('scenes/LevelScene.ts')).toBe(true);
    const chapterOnly = [
      ...[1, 2, 3, 4, 5].flatMap((n) => [`chapters/ch${n}.ts`, `levels/chapter${n}.ts`]),
      'entities/bosses/HunterDrone.ts',
      'entities/bosses/roadbreaker/Roadbreaker.ts',
      'entities/bosses/frog/Frog.ts',
      'entities/bosses/kevin/Kevin.ts',
      'entities/bosses/hunters/Hunters.ts',
      'scenes/level/IntroDirector.ts',
      'scenes/level/story/road.ts',
      'scenes/level/story/museum/index.ts',
      'scenes/level/story/kevin/index.ts',
      'scenes/level/story/bounty/index.ts',
      'scenes/level/HighwayBackdrop.ts',
      'scenes/level/MuseumBackdrop.ts',
      'scenes/level/CityBackdrop.ts',
      'scenes/level/WesternBackdrop.ts',
      'scenes/preload/art/ch2.ts',
      'scenes/preload/art/ch3.ts',
      'scenes/preload/art/ch4.ts',
      'scenes/preload/highway.ts',
      'scenes/preload/museum.ts',
      'scenes/preload/city.ts',
      'scenes/preload/roadbreaker.ts',
      'scenes/preload/bounty/index.ts',
      'scenes/preload/bounty/hunters.ts',
      'scenes/preload/bounty/world.ts',
      'systems/audio/tracks/road.ts',
      'systems/audio/tracks/museum.ts',
      'systems/audio/tracks/city.ts',
      'systems/audio/tracks/bounty.ts',
      'scenes/ArcadeScene.ts',
      'scenes/DiveScene.ts',
      'scenes/AutobenchScene.ts',
    ];
    for (const f of chapterOnly) {
      expect(SOURCES.has(f), f).toBe(true);
      expect(core.has(f), `${f} is reachable from main.ts`).toBe(false);
    }
  });
});
