import type { SaveData, StorageLike } from '../SaveSystem';

/**
 * The autobench plays on a throwaway file held in memory: Act 1 and Chapter 4
 * cleared, every alien, sound on, touch controls on AUTO. The player's real
 * save in localStorage is never read or written while it runs.
 */
export function autobenchSave(now: number = Date.now()): SaveData {
  const chapter = { completed: true, clears: 1, cards: [], bests: {} };
  return {
    version: 4,
    muted: false,
    settings: { reduceFlashing: false, shake: 1, touchControls: 'auto', ghost: false },
    lastSlot: 0,
    slots: [
      {
        createdAt: now,
        lastPlayedAt: now,
        playTimeMs: 0,
        difficulty: 'normal',
        chapters: { ch1: { ...chapter }, ch2: { ...chapter }, ch3: { ...chapter }, ch4: { ...chapter } },
        unlockedAliens: ['heatblast', 'xlr8', 'fourarms', 'wildmutt', 'stinkfly', 'upgrade'],
        resume: null,
        achievements: {},
        lifetime: {},
        jokes: [],
      },
      null,
      null,
    ],
  };
}

export function memoryStorage(seed: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}
