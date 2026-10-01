import { describe, expect, it } from 'vitest';
import { SaveSystem, SAVE_VERSION, migrateSave, type StorageLike } from '../src/systems/SaveSystem';

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

describe('SaveSystem', () => {
  it('returns a versioned default save when storage is empty', () => {
    const save = new SaveSystem(new MemoryStorage(), 'k').load();
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.chapters).toEqual({});
  });

  it('survives storage that throws on every call', () => {
    const system = new SaveSystem(new BrokenStorage(), 'k');
    expect(system.load().version).toBe(SAVE_VERSION);
    expect(system.save(system.load())).toBe(false);
    expect(() => system.recordChapter('ch1', { timeMs: 1000, rank: 'B', score: 800, cards: [] })).not.toThrow();
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
    expect(new SaveSystem(storage, 'k').load().chapters).toEqual({});
  });

  it('records chapter bests and only improves them', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k');
    const first = system.recordChapter('ch1', { timeMs: 200_000, rank: 'B', score: 800, cards: ['c1'] });
    expect(first.newBestTime).toBe(true);
    expect(first.newBestRank).toBe(true);
    expect(first.newCards).toEqual(['c1']);

    const worse = system.recordChapter('ch1', { timeMs: 250_000, rank: 'C', score: 600, cards: ['c1', 'c2'] });
    expect(worse.newBestTime).toBe(false);
    expect(worse.newBestRank).toBe(false);
    expect(worse.newCards).toEqual(['c2']);
    expect(worse.record.bestTimeMs).toBe(200_000);
    expect(worse.record.bestRank).toBe('B');
    expect(worse.record.cards).toEqual(['c1', 'c2']);
    expect(worse.record.clears).toBe(2);

    const reloaded = new SaveSystem(storage, 'k').getChapter('ch1');
    expect(reloaded.bestScore).toBe(800);
    expect(reloaded.completed).toBe(true);
  });

  it('migrates an unversioned save and drops junk fields', () => {
    const migrated = migrateSave({
      muted: true,
      chapters: { ch1: { completed: true, bestTimeMs: 1234, bestRank: 'Z', cards: ['a', 5] }, bad: 7 },
    });
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.muted).toBe(true);
    expect(migrated.chapters.ch1.bestRank).toBeNull();
    expect(migrated.chapters.ch1.cards).toEqual(['a']);
    expect(migrated.chapters.ch1.clears).toBe(1);
    expect(migrated.chapters.bad).toBeUndefined();
    expect(migrateSave('nope').chapters).toEqual({});
  });

  it('upgrades a version 1 save: keeps progress, adds default settings and empty splits', () => {
    const migrated = migrateSave({ version: 1, muted: false, chapters: { ch1: { completed: true, bestTimeMs: 200_000, bestRank: 'A', bestScore: 900, cards: ['c1'], clears: 3 } } });
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.settings).toEqual({ reduceFlashing: null, shake: null, touchControls: 'auto' });
    expect(migrated.chapters.ch1.bestSplits).toEqual({});
    expect(migrated.chapters.ch1.clears).toBe(3);
  });

  it('sanitises settings and splits', () => {
    const migrated = migrateSave({
      settings: { reduceFlashing: 'yes', shake: 7, touchControls: 'sometimes' },
      chapters: { ch1: { bestSplits: { 'cp-cliff': 61_000, junk: 'x', neg: -5 } } },
    });
    expect(migrated.settings).toEqual({ reduceFlashing: null, shake: 1, touchControls: 'auto' });
    expect(migrated.chapters.ch1.bestSplits).toEqual({ 'cp-cliff': 61_000 });
  });

  it('saves settings changes', () => {
    const storage = new MemoryStorage();
    new SaveSystem(storage, 'k').setSettings({ reduceFlashing: true, shake: 0.3 });
    const settings = new SaveSystem(storage, 'k').load().settings;
    expect(settings).toEqual({ reduceFlashing: true, shake: 0.3, touchControls: 'auto' });
  });

  it('keeps only the fastest split and reports the previous best', () => {
    const storage = new MemoryStorage();
    const system = new SaveSystem(storage, 'k');
    expect(system.recordSplit('ch1', 'cp-cliff', 70_000)).toBeNull();
    expect(system.recordSplit('ch1', 'cp-cliff', 80_000)).toBe(70_000);
    expect(system.recordSplit('ch1', 'cp-cliff', 65_000)).toBe(70_000);
    expect(new SaveSystem(storage, 'k').getChapter('ch1').bestSplits['cp-cliff']).toBe(65_000);
    // Splits alone do not mark the chapter complete, and a clear keeps them.
    expect(system.getChapter('ch1').completed).toBe(false);
    system.recordChapter('ch1', { timeMs: 200_000, rank: 'B', score: 800, cards: [] });
    expect(system.getChapter('ch1').bestSplits['cp-cliff']).toBe(65_000);
  });

  it('practice runs never set best time, rank or score', () => {
    const system = new SaveSystem(new MemoryStorage(), 'k');
    const outcome = system.recordChapter('ch1', { timeMs: 30_000, rank: 'S', score: 1500, cards: ['c1'], timed: false });
    expect(outcome.newBestTime).toBe(false);
    expect(outcome.record.bestTimeMs).toBeNull();
    expect(outcome.record.bestRank).toBeNull();
    expect(outcome.record.cards).toEqual(['c1']);
  });
});
