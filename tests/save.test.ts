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
});
