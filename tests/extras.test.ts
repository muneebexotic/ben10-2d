import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/config/achievements';
import { jokeCatalog, jokeId } from '../src/aliens/jokes';
import { misfireLines } from '../src/aliens/misfire';
import { allAliens } from '../src/aliens/registry';
import { CARDS, cardInfo } from '../src/levels/cards';
import { storyLevels } from '../src/levels/registry';
import { AchievementTracker, achievementProgress, counterUnlocks, type AchievementStore } from '../src/systems/Achievements';
import { isOmnitrixMaster } from '../src/systems/Mastery';
import { createChapterRecord, createDifficultyRecord, migrateSave, SaveSystem, type StorageLike } from '../src/systems/SaveSystem';
import { reviewSplits, sumOfBest } from '../src/systems/Splits';
import { decodeGhost, encodeGhost, ghostAt, GhostRecorder, GhostStore } from '../src/systems/Ghost';
import { createRunStats, sanitizeRunStats } from '../src/systems/RunStats';

function memoryStore(): AchievementStore & { unlocked: Set<string>; counters: Record<string, number> } {
  const unlocked = new Set<string>();
  const counters: Record<string, number> = {};
  return {
    unlocked,
    counters,
    isUnlocked: (id) => unlocked.has(id),
    unlock: (id) => (unlocked.has(id) ? false : (unlocked.add(id), true)),
    lifetime: (c) => counters[c] ?? 0,
    addLifetime: (counts) => {
      for (const [k, n] of Object.entries(counts)) counters[k] = (counters[k] ?? 0) + (n ?? 0);
    },
  };
}

function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('achievements', () => {
  it('have unique ids, and counter ones have goals', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) if (a.counter) expect(a.goal).toBeGreaterThan(0);
  });

  it('a counter unlocks its achievement exactly once, when it reaches the goal', () => {
    const store = memoryStore();
    const got: string[] = [];
    const t = new AchievementTracker(store, (d) => got.push(d.id));
    for (let i = 0; i < 99; i++) t.count('fireKOs');
    expect(got).toEqual([]);
    t.count('fireKOs');
    expect(got).toEqual(['pyromaniac']);
    t.count('fireKOs', 50);
    expect(got).toEqual(['pyromaniac']);
  });

  it('counts pile up in memory until flushed, and carry over from the file', () => {
    const store = memoryStore();
    store.counters.parries = 20;
    const got: string[] = [];
    const t = new AchievementTracker(store, (d) => got.push(d.id));
    t.count('parries', 4);
    expect(store.counters.parries).toBe(20);
    t.count('parries');
    expect(got).toEqual(['deflector']);
    t.flush();
    expect(store.counters.parries).toBe(25);
  });

  it('one-off achievements unlock once; without a file nothing happens', () => {
    const store = memoryStore();
    const got: string[] = [];
    const t = new AchievementTracker(store, (d) => got.push(d.id));
    t.unlock('untouchable');
    t.unlock('untouchable');
    t.unlock('not-a-real-one');
    expect(got).toEqual(['untouchable']);
    const none = new AchievementTracker(null, () => got.push('x'));
    none.count('transforms', 5);
    none.unlock('strike');
    expect(got).toEqual(['untouchable']);
  });

  it('totals known elsewhere (cards, jokes) unlock with reach()', () => {
    expect(counterUnlocks('cards', 12, () => false).map((a) => a.id)).toEqual(['card-shark']);
    expect(counterUnlocks('cards', 11, () => false)).toEqual([]);
    const pyro = ACHIEVEMENTS.find((a) => a.id === 'pyromaniac')!;
    expect(achievementProgress(pyro, false, () => 37)).toBeCloseTo(0.37);
    expect(achievementProgress(pyro, true, () => 0)).toBe(1);
  });
});

describe('save version 4', () => {
  it('older files load with empty extras and the ghost on', () => {
    const v3 = { version: 3, slots: [{ difficulty: 'hard', chapters: { ch1: { completed: true, bests: { hard: { bestTimeMs: 1000, bestSplits: { a: 5 } } } } } }] };
    const save = migrateSave(v3);
    const slot = save.slots[0]!;
    expect(slot.achievements).toEqual({});
    expect(slot.lifetime).toEqual({});
    expect(slot.jokes).toEqual([]);
    expect(slot.chapters.ch1.bests.hard?.bestSegments).toEqual({});
    expect(save.settings.ghost).toBe(true);
  });

  it('keeps achievements, counters, jokes and segments, and drops junk', () => {
    const raw = {
      version: 4,
      settings: { ghost: false },
      slots: [{ difficulty: 'easy', achievements: { 'hero-time': 123, bad: 'x' }, lifetime: { fireKOs: 7, nope: -2 }, jokes: ['a|b', 5], chapters: { ch1: { bests: { easy: { bestSegments: { 'cp-cliff': 61000 } } } } } }],
    };
    const save = migrateSave(raw);
    const slot = save.slots[0]!;
    expect(slot.achievements).toEqual({ 'hero-time': 123 });
    expect(slot.lifetime).toEqual({ fireKOs: 7 });
    expect(slot.jokes).toEqual(['a|b']);
    expect(slot.chapters.ch1.bests.easy?.bestSegments).toEqual({ 'cp-cliff': 61000 });
    expect(save.settings.ghost).toBe(false);
  });

  it('records achievements, counters, jokes and best segments per file', () => {
    const system = new SaveSystem(memoryStorage(), 'k', () => 42);
    system.createSlot(0, 'normal');
    expect(system.unlockAchievement(0, 'strike')).toBe(true);
    expect(system.unlockAchievement(0, 'strike')).toBe(false);
    system.addLifetime(0, { parries: 3 });
    system.addLifetime(0, { parries: 2, smoothies: 1 });
    expect(system.addJoke(0, 'heatblast|HI')).toBe(true);
    expect(system.addJoke(0, 'heatblast|HI')).toBe(false);
    expect(system.recordSegment(0, 'ch1', 'normal', 'cp-cliff', 60000)).toBeNull();
    expect(system.recordSegment(0, 'ch1', 'normal', 'cp-cliff', 65000)).toBe(60000);
    expect(system.recordSegment(0, 'ch1', 'normal', 'cp-cliff', 50000)).toBe(60000);
    const reloaded = new SaveSystem(system['storage'], 'k').getSlot(0)!;
    expect(reloaded.achievements).toEqual({ strike: 42 });
    expect(reloaded.lifetime).toEqual({ parries: 5, smoothies: 1 });
    expect(reloaded.jokes).toEqual(['heatblast|HI']);
    expect(reloaded.chapters.ch1.bests.normal?.bestSegments).toEqual({ 'cp-cliff': 50000 });
  });
});

describe('misfire jokes', () => {
  it('the catalog holds every line the roster can say, once each', () => {
    const catalog = jokeCatalog();
    expect(new Set(catalog.map((j) => j.id)).size).toBe(catalog.length);
    for (const got of allAliens()) {
      for (const wanted of allAliens()) {
        if (wanted.id === got.id) continue;
        for (const line of misfireLines(wanted.id, got.id)) expect(catalog.some((j) => j.id === jokeId(got.id, line) && j.wanted.includes(wanted.id))).toBe(true);
      }
    }
  });

  it('every alien has jokes to find', () => {
    const catalog = jokeCatalog();
    for (const a of allAliens()) expect(catalog.filter((j) => j.gotId === a.id).length).toBeGreaterThan(0);
  });
});

describe('card album', () => {
  it('has an entry for every card in every level, numbered 1 to N with no gaps', () => {
    const placed = storyLevels().flatMap((l) => l.entities.filter((e) => e.type === 'card').map((e) => (e as { id: string }).id));
    for (const id of placed) expect(cardInfo(id), id).toBeDefined();
    expect(CARDS.map((c) => c.number)).toEqual(CARDS.map((_, i) => i + 1));
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });
});

describe('splits review', () => {
  const splits = [
    { id: 'cp-a', label: 'A', timeMs: 60000, bestMs: 62000, segmentMs: 60000, bestSegmentMs: 61000 },
    { id: 'cp-b', label: 'B', timeMs: 130000, bestMs: 125000, segmentMs: 70000, bestSegmentMs: 64000 },
    { id: 'finish', label: 'BOSS DOWN', timeMs: 200000, bestMs: null, segmentMs: 70000, bestSegmentMs: null },
  ];

  it('deltas against the previous best and gold segments', () => {
    const rows = reviewSplits(splits);
    expect(rows.map((r) => r.deltaMs)).toEqual([-2000, 5000, null]);
    expect(rows.map((r) => r.goldSegment)).toEqual([true, false, false]);
  });

  it('sum of best adds the best of every segment once all have one', () => {
    expect(sumOfBest(['cp-a', 'cp-b', 'finish'], { 'cp-a': 60000, 'cp-b': 64000, finish: 69000 })).toBe(193000);
    expect(sumOfBest(['cp-a', 'cp-b', 'finish'], { 'cp-a': 60000 })).toBeNull();
  });

  it('a run keeps its splits through a save (Continue)', () => {
    const stats = { ...createRunStats(3), splits };
    expect(sanitizeRunStats(JSON.parse(JSON.stringify(stats)))?.splits).toEqual(splits);
    expect(sanitizeRunStats({ timeMs: 5, splits: [{ id: 3 }, 'x'] })?.splits).toEqual([]);
  });
});

describe('Omnitrix Master', () => {
  it('needs an S on every difficulty', () => {
    const record = createChapterRecord();
    expect(isOmnitrixMaster(record)).toBe(false);
    for (const d of ['easy', 'normal'] as const) record.bests[d] = { ...createDifficultyRecord(), bestRank: 'S' };
    expect(isOmnitrixMaster(record)).toBe(false);
    record.bests.hard = { ...createDifficultyRecord(), bestRank: 'A' };
    expect(isOmnitrixMaster(record)).toBe(false);
    record.bests.hard.bestRank = 'S';
    expect(isOmnitrixMaster(record)).toBe(true);
    expect(isOmnitrixMaster(undefined)).toBe(false);
  });
});

describe('ghost of your best run', () => {
  const sample = (x: number, y: number, form = 0, frame = 0, flip = false) => ({ x, y, form, frame, flip });

  it('records one sample per interval of run time and rewinds on a restart', () => {
    const rec = new GhostRecorder('ch1', 'normal', 100);
    rec.sample(0, sample(10, 10));
    rec.sample(50, sample(11, 10));
    rec.sample(250, sample(30, 10));
    expect(rec.samples.map((s) => s.x)).toEqual([10, 30, 30]);
    rec.truncate(120);
    expect(rec.samples.length).toBe(2);
  });

  it('packs and unpacks samples exactly, big jumps included', () => {
    const samples = [sample(100, 400, 0, 3), sample(140, 380, 1, 12, true), sample(6000, 90, 5, 22), sample(5990, 95, 5, 21, true), sample(0, 0)];
    expect(decodeGhost(encodeGhost(samples))).toEqual(samples);
    expect(decodeGhost('not base64 at all!')).toBeNull();
    expect(decodeGhost(encodeGhost(samples).slice(0, 6))).toBeNull();
  });

  it('plays back between samples, snaps across respawns, and ends', () => {
    const samples = [sample(0, 0), sample(100, 0), sample(2000, 0)];
    expect(ghostAt(samples, 100, 50)?.x).toBe(50);
    expect(ghostAt(samples, 100, 150)?.x).toBe(100);
    expect(ghostAt(samples, 100, 200)?.x).toBe(2000);
    expect(ghostAt(samples, 100, 300)).toBeNull();
  });

  it('stores one ghost per file, chapter and difficulty, drops the oldest, and clears with the file', () => {
    let now = 0;
    const store = new GhostStore(memoryStorage(), 'g', () => ++now);
    const rec = { intervalMs: 100, samples: [sample(1, 2), sample(3, 4)] };
    expect(store.save(0, 'ch1', 'normal', 1000, rec, ['ben'])).toBe(true);
    expect(store.load(0, 'ch1', 'normal')).toMatchObject({ timeMs: 1000, forms: ['ben'], samples: rec.samples });
    store.save(0, 'ch1', 'normal', 900, rec, ['ben']);
    expect(store.load(0, 'ch1', 'normal')?.timeMs).toBe(900);
    for (let i = 0; i < 12; i++) store.save(1, `lvl${i}`, 'hard', 5, rec, ['ben']);
    expect(store.load(0, 'ch1', 'normal')).toBeNull();
    expect(store.load(1, 'lvl11', 'hard')).not.toBeNull();
    store.clearSlot(1);
    expect(store.load(1, 'lvl11', 'hard')).toBeNull();
  });

  it('a broken or missing store never throws', () => {
    const broken: StorageLike = { getItem: () => '{oops', setItem: () => { throw new Error('full'); } };
    const store = new GhostStore(broken, 'g');
    expect(store.load(0, 'ch1', 'normal')).toBeNull();
    expect(store.save(0, 'ch1', 'normal', 1, { intervalMs: 100, samples: [sample(1, 1)] }, ['ben'])).toBe(false);
    expect(new GhostStore(null, 'g').load(0, 'a', 'b')).toBeNull();
  });
});
