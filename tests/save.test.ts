import { describe, expect, it } from 'vitest';
import { SaveSystem, SAVE_VERSION, SLOT_COUNT, bestOn, migrateSave, type StorageLike, CORRUPT_SUFFIX } from '../src/systems/SaveSystem';
import { createRunStats } from '../src/systems/RunStats';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class BrokenStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

const NOW = 1_700_000_000_000;
const clock = () => NOW;
const result = (overrides: Partial<Parameters<SaveSystem['recordChapter']>[2]> = {}) => ({
  timeMs: 200_000,
  rank: 'B' as const,
  score: 800,
  cards: [] as string[],
  difficulty: 'normal' as const,
  ...overrides,
});

/** A real Milestone 1 save (version 1). */
const MILESTONE_1 = {
  version: 1,
  muted: true,
  chapters: { ch1: { completed: true, bestTimeMs: 312_450, bestRank: 'A', bestScore: 1010, cards: ['ch1-card-ridge', 'ch1-card-creek'], clears: 3 } },
};

/** A real Milestone 2 / polish-pass save (version 2: settings and splits). */
const MILESTONE_2 = {
  version: 2,
  muted: false,
  settings: { reduceFlashing: true, shake: 0.4, touchControls: 'on' },
  chapters: {
    ch1: {
      completed: true,
      bestTimeMs: 250_000,
      bestRank: 'S',
      bestScore: 1200,
      cards: ['ch1-card-ridge', 'ch1-card-vault'],
      clears: 5,
      bestSplits: { 'cp-cliff': 61_000, 'cp-nest': 150_000, finish: 249_000 },
    },
  },
};

describe('SaveSystem basics', () => {
  it('returns a versioned default save with three empty files', () => {
    const save = new SaveSystem(new MemoryStorage(), 'k').load();
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.slots).toEqual([null, null, null]);
    expect(SLOT_COUNT).toBe(3);
    expect(save.lastSlot).toBeNull();
  });

  it('survives storage that throws on every call', () => {
    const system = new SaveSystem(new BrokenStorage(), 'k', clock);
    expect(system.load().version).toBe(SAVE_VERSION);
    expect(system.save(system.load())).toBe(false);
    system.createSlot(0, 'hard');
    expect(() => system.recordChapter(0, 'ch1', result())).not.toThrow();
    expect(system.getSlot(0)?.difficulty).toBe('hard');
  });

  it('works with no storage at all', () => {
    const system = new SaveSystem(null, 'k');
    expect(system.load().muted).toBe(false);
    system.setMuted(true);
    expect(system.load().muted).toBe(true);
  });

  it('recovers from corrupted JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{not json');
    expect(new SaveSystem(storage, 'k').load().slots).toEqual([null, null, null]);
  });

  it('saves settings changes for every file', () => {
    const storage = new MemoryStorage();
    new SaveSystem(storage, 'k').setSettings({ reduceFlashing: true, shake: 0.3 });
    expect(new SaveSystem(storage, 'k').load().settings).toEqual({ reduceFlashing: true, shake: 0.3, touchControls: 'auto', ghost: true });
  });
});

describe('save files', () => {
  it('creates, remembers and erases files', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k', clock);
    const file = system.createSlot(1, 'hard');
    expect(file).toMatchObject({ difficulty: 'hard', playTimeMs: 0, unlockedAliens: [], resume: null, createdAt: NOW });
    expect(system.lastSlot).toBe(1);
    expect(system.hasAnySlot()).toBe(true);

    const reloaded = new SaveSystem(storage, 'k', clock);
    expect(reloaded.getSlot(1)?.difficulty).toBe('hard');
    expect(reloaded.getSlot(0)).toBeNull();

    reloaded.deleteSlot(1);
    expect(reloaded.getSlot(1)).toBeNull();
    expect(reloaded.lastSlot).toBeNull();
    expect(new SaveSystem(storage, 'k').hasAnySlot()).toBe(false);
  });

  it('keeps files apart', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k', clock);
    system.createSlot(0, 'easy');
    system.createSlot(2, 'hard');
    system.recordChapter(0, 'ch1', result({ difficulty: 'easy', cards: ['a'] }));
    expect(system.getChapter(0, 'ch1').completed).toBe(true);
    expect(system.getChapter(2, 'ch1').completed).toBe(false);
    expect(system.getChapter(2, 'ch1').cards).toEqual([]);
  });

  it('Continue loads the file played last; erasing it falls back to the newest other file', () => {
    let t = NOW;
    const system = new SaveSystem(new MemoryStorage(), 'k', () => t);
    system.createSlot(0, 'normal');
    t += 1000;
    system.createSlot(2, 'easy');
    t += 1000;
    system.touchSlot(0);
    expect(system.lastSlot).toBe(0);
    system.deleteSlot(0);
    expect(system.lastSlot).toBe(2);
  });

  it('tracks difficulty, play time and unlocked aliens per file', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k', clock);
    system.createSlot(0, 'normal');
    system.setDifficulty(0, 'hard');
    system.addPlayTime(0, 65_000);
    system.addPlayTime(0, 5_000);
    expect(system.unlockAliens(0, ['heatblast'])).toEqual(['heatblast']);
    expect(system.unlockAliens(0, ['heatblast', 'xlr8'])).toEqual(['xlr8']);
    expect(system.getSlot(0)).toMatchObject({ difficulty: 'hard', playTimeMs: 70_000, unlockedAliens: ['heatblast', 'xlr8'] });
  });

  it('stores a resume point and clears it when the chapter is completed', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k', clock);
    system.createSlot(0, 'normal');
    const stats = { ...createRunStats(4, true, 'normal'), timeMs: 95_000, deaths: 2, cardsFound: ['ch1-card-ridge'] };
    system.setResume(0, { levelId: 'ch1', checkpoint: 'cp-nest', stats });
    const back = new SaveSystem(storage, 'k').getSlot(0)?.resume;
    expect(back).toMatchObject({ levelId: 'ch1', checkpoint: 'cp-nest' });
    expect(back?.stats).toEqual(stats);
    system.recordChapter(0, 'ch1', result());
    expect(system.getSlot(0)?.resume).toBeNull();
  });

  it('throws away a resume point it cannot trust', () => {
    const save = migrateSave({ slots: [{ difficulty: 'normal', resume: { levelId: 'ch1', checkpoint: 'cp-nest', stats: { nope: true } } }] });
    expect(save.slots[0]?.resume).toBeNull();
  });
});

describe('records per difficulty', () => {
  it('records bests and only improves them', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k', clock);
    system.createSlot(0, 'normal');
    const first = system.recordChapter(0, 'ch1', result({ cards: ['c1'] }));
    expect(first).toMatchObject({ newBestTime: true, newBestRank: true, newCards: ['c1'], firstClear: true });

    const worse = system.recordChapter(0, 'ch1', result({ timeMs: 250_000, rank: 'C', score: 600, cards: ['c1', 'c2'] }));
    expect(worse).toMatchObject({ newBestTime: false, newBestRank: false, newCards: ['c2'], firstClear: false });
    expect(worse.best.bestTimeMs).toBe(200_000);
    expect(worse.best.bestRank).toBe('B');
    expect(worse.record.cards).toEqual(['c1', 'c2']);
    expect(worse.record.clears).toBe(2);

    const reloaded = new SaveSystem(storage, 'k').getChapter(0, 'ch1');
    expect(bestOn(reloaded, 'normal').bestScore).toBe(800);
    expect(reloaded.completed).toBe(true);
  });

  it('keeps best times, ranks and splits separately per difficulty', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k', clock);
    system.createSlot(0, 'normal');
    system.recordChapter(0, 'ch1', result({ timeMs: 180_000, rank: 'A', difficulty: 'easy' }));
    const hard = system.recordChapter(0, 'ch1', result({ timeMs: 400_000, rank: 'C', difficulty: 'hard' }));
    // A slow Hard clear is still the first (and best) Hard clear.
    expect(hard).toMatchObject({ newBestTime: true, newBestRank: true });
    const record = system.getChapter(0, 'ch1');
    expect(bestOn(record, 'easy')).toMatchObject({ bestTimeMs: 180_000, bestRank: 'A', clears: 1 });
    expect(bestOn(record, 'hard')).toMatchObject({ bestTimeMs: 400_000, bestRank: 'C', clears: 1 });
    expect(bestOn(record, 'normal')).toMatchObject({ bestTimeMs: null, bestRank: null, clears: 0 });
    expect(record.clears).toBe(2);

    expect(system.recordSplit(0, 'ch1', 'easy', 'cp-cliff', 50_000)).toBeNull();
    expect(system.recordSplit(0, 'ch1', 'hard', 'cp-cliff', 90_000)).toBeNull();
    expect(system.recordSplit(0, 'ch1', 'hard', 'cp-cliff', 80_000)).toBe(90_000);
    expect(system.recordSplit(0, 'ch1', 'easy', 'cp-cliff', 60_000)).toBe(50_000);
    const after = system.getChapter(0, 'ch1');
    expect(bestOn(after, 'easy').bestSplits['cp-cliff']).toBe(50_000);
    expect(bestOn(after, 'hard').bestSplits['cp-cliff']).toBe(80_000);
  });

  it('keeps only the fastest split and reports the previous best', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k', clock);
    system.createSlot(0, 'normal');
    expect(system.recordSplit(0, 'ch1', 'normal', 'cp-cliff', 70_000)).toBeNull();
    expect(system.recordSplit(0, 'ch1', 'normal', 'cp-cliff', 80_000)).toBe(70_000);
    expect(system.recordSplit(0, 'ch1', 'normal', 'cp-cliff', 65_000)).toBe(70_000);
    expect(bestOn(new SaveSystem(storage, 'k').getChapter(0, 'ch1'), 'normal').bestSplits['cp-cliff']).toBe(65_000);
    // Splits alone do not mark the chapter complete, and a clear keeps them.
    expect(system.getChapter(0, 'ch1').completed).toBe(false);
    system.recordChapter(0, 'ch1', result());
    expect(bestOn(system.getChapter(0, 'ch1'), 'normal').bestSplits['cp-cliff']).toBe(65_000);
  });

  it('untimed runs (practice, or a difficulty change mid-run) count as clears but never set records', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k', clock);
    system.createSlot(0, 'normal');
    const outcome = system.recordChapter(0, 'ch1', result({ timeMs: 30_000, rank: 'S', score: 1500, cards: ['c1'], timed: false }));
    expect(outcome.newBestTime).toBe(false);
    expect(outcome.best.bestTimeMs).toBeNull();
    expect(outcome.best.bestRank).toBeNull();
    expect(outcome.record.cards).toEqual(['c1']);
    expect(outcome.record.completed).toBe(true);
  });

  it('records nothing without a file', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k', clock);
    expect(system.recordSplit(1, 'ch1', 'normal', 'cp-cliff', 1000)).toBeNull();
    const outcome = system.recordChapter(1, 'ch1', result());
    expect(outcome.newBestTime).toBe(true);
    expect(system.getSlot(1)).toBeNull();
  });
});

describe('migration', () => {
  it('turns a Milestone 1 save into File 1 on Normal, keeping everything', () => {
    const save = migrateSave(MILESTONE_1, NOW);
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.muted).toBe(true);
    expect(save.lastSlot).toBe(0);
    expect(save.slots[1]).toBeNull();
    const file = save.slots[0]!;
    expect(file.difficulty).toBe('normal');
    expect(file.resume).toBeNull();
    const ch1 = file.chapters.ch1;
    expect(ch1).toMatchObject({ completed: true, clears: 3, cards: ['ch1-card-ridge', 'ch1-card-creek'] });
    expect(bestOn(ch1, 'normal')).toMatchObject({ bestTimeMs: 312_450, bestRank: 'A', bestScore: 1010, clears: 3, bestSplits: {} });
    expect(save.settings).toEqual({ reduceFlashing: null, shake: null, touchControls: 'auto', ghost: true });
  });

  it('turns a Milestone 2 save into File 1 on Normal, keeping settings and splits', () => {
    const save = migrateSave(MILESTONE_2, NOW);
    expect(save.settings).toEqual({ reduceFlashing: true, shake: 0.4, touchControls: 'on', ghost: true });
    const ch1 = save.slots[0]!.chapters.ch1;
    expect(ch1.cards).toEqual(['ch1-card-ridge', 'ch1-card-vault']);
    expect(bestOn(ch1, 'normal').bestSplits).toEqual({ 'cp-cliff': 61_000, 'cp-nest': 150_000, finish: 249_000 });
    expect(bestOn(ch1, 'normal').bestRank).toBe('S');
  });

  it('loads an old save from storage and writes it back as version 3', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify(MILESTONE_2));
    const system = new SaveSystem(storage, 'k', clock);
    expect(system.getSlot(0)?.chapters.ch1.completed).toBe(true);
    system.setMuted(true);
    const written = JSON.parse(storage.getItem('k')!);
    expect(written.version).toBe(SAVE_VERSION);
    expect(written.chapters).toBeUndefined();
    expect(written.slots[0].chapters.ch1.bests.normal.bestTimeMs).toBe(250_000);
  });

  it('an old save with only settings makes no file', () => {
    const save = migrateSave({ version: 2, muted: false, settings: { shake: 0.2 }, chapters: {} });
    expect(save.slots).toEqual([null, null, null]);
    expect(save.lastSlot).toBeNull();
    expect(save.settings.shake).toBe(0.2);
  });

  it('drops junk fields and sanitises what is left', () => {
    const migrated = migrateSave({
      muted: true,
      settings: { reduceFlashing: 'yes', shake: 7, touchControls: 'sometimes' },
      chapters: { ch1: { completed: true, bestTimeMs: 1234, bestRank: 'Z', cards: ['a', 5], bestSplits: { 'cp-cliff': 61_000, junk: 'x', neg: -5 } }, bad: 7 },
    });
    const ch1 = migrated.slots[0]!.chapters.ch1;
    expect(bestOn(ch1, 'normal').bestRank).toBeNull();
    expect(ch1.cards).toEqual(['a']);
    expect(ch1.clears).toBe(1);
    expect(bestOn(ch1, 'normal').bestSplits).toEqual({ 'cp-cliff': 61_000 });
    expect(migrated.slots[0]!.chapters.bad).toBeUndefined();
    expect(migrated.settings).toEqual({ reduceFlashing: null, shake: 1, touchControls: 'auto', ghost: true });
    expect(migrateSave('nope').slots).toEqual([null, null, null]);
  });

  it('round-trips a version 3 save and repairs bad files', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k', clock);
    system.createSlot(0, 'hard');
    system.recordChapter(0, 'ch1', result({ difficulty: 'hard', rank: 'A', cards: ['x'] }));
    const raw = JSON.parse(storage.getItem('k')!);
    raw.slots[1] = 'garbage';
    raw.slots[2] = { difficulty: 'impossible', chapters: { ch1: { bests: { nightmare: { bestTimeMs: 1 }, hard: { bestTimeMs: 9, bestRank: 'S' } } } } };
    raw.lastSlot = 7;
    const save = migrateSave(raw, NOW);
    expect(save.slots[0]).toEqual(system.getSlot(0));
    expect(save.slots[1]).toBeNull();
    expect(save.slots[2]?.difficulty).toBe('normal');
    expect(Object.keys(save.slots[2]!.chapters.ch1.bests)).toEqual(['hard']);
    expect(save.lastSlot).toBe(0);
  });
});

describe('save safety', () => {
  it('keeps a copy of an unreadable save before anything writes over it', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{"version":4,"slots":[{"chap');
    const system = new SaveSystem(storage, 'k', clock);
    expect(system.getSlot(0)).toBeNull();
    system.setMuted(true);
    expect(storage.getItem(`k${CORRUPT_SUFFIX}`)).toBe('{"version":4,"slots":[{"chap');
    expect(JSON.parse(storage.getItem('k')!).muted).toBe(true);
  });

  it('reads the save again after another tab wrote it, instead of writing over it', () => {
    const storage = new MemoryStorage();
    const tabA = new SaveSystem(storage, 'k', clock);
    const tabB = new SaveSystem(storage, 'k', clock);
    tabA.createSlot(0, 'normal');
    tabB.load();
    tabA.recordChapter(0, 'ch1', result({ cards: ['ch1-card-ridge'] }));
    // The browser's storage event tells tab B the save changed.
    tabB.invalidate();
    tabB.setMuted(true);
    const written = JSON.parse(storage.getItem('k')!);
    expect(written.muted).toBe(true);
    expect(written.slots[0].chapters.ch1.cards).toEqual(['ch1-card-ridge']);
  });

  it('keeps the three files apart', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k', clock);
    system.createSlot(0, 'easy');
    system.createSlot(2, 'hard');
    system.recordChapter(0, 'ch1', result({ difficulty: 'easy', cards: ['a'] }));
    system.unlockAliens(2, ['xlr8']);
    system.setResume(2, null);
    expect(system.getSlot(1)).toBeNull();
    expect(system.getSlot(2)?.chapters.ch1).toBeUndefined();
    expect(system.getSlot(0)?.unlockedAliens).toEqual([]);
    expect(system.getSlot(2)?.unlockedAliens).toEqual(['xlr8']);
    expect(system.getSlot(0)?.difficulty).toBe('easy');
    expect(system.getSlot(2)?.difficulty).toBe('hard');
  });
});
