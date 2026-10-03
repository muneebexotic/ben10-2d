import { ACHIEVEMENTS, type AchievementDef, type LifetimeCounter } from '../config/achievements';
import { saveSystem, type SlotData } from './SaveSystem';

/** What the tracker needs from a save file. */
export interface AchievementStore {
  isUnlocked(id: string): boolean;
  /** True if it was newly unlocked. */
  unlock(id: string): boolean;
  lifetime(counter: LifetimeCounter): number;
  addLifetime(counts: Partial<Record<LifetimeCounter, number>>): void;
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Counter achievements that `value` reaches and that aren't unlocked yet. */
export function counterUnlocks(counter: LifetimeCounter, value: number, isUnlocked: (id: string) => boolean): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.counter === counter && a.goal !== undefined && value >= a.goal && !isUnlocked(a.id));
}

/** Progress toward a counter achievement, 0..1 (1 once unlocked). Event achievements are 0 or 1. */
export function achievementProgress(def: AchievementDef, unlocked: boolean, lifetime: (c: LifetimeCounter) => number): number {
  if (unlocked) return 1;
  if (!def.counter || !def.goal) return 0;
  return Math.min(1, lifetime(def.counter) / def.goal);
}

/**
 * Counts what the player does and unlocks achievements as goals are reached.
 * Counters are kept in memory and written to the file in batches (`flush`),
 * so a burst of kills doesn't hit localStorage every frame; unlocks are saved
 * at once. Without a file (a no-file practice run) it does nothing.
 */
export class AchievementTracker {
  private pending: Partial<Record<LifetimeCounter, number>> = {};

  constructor(
    private readonly store: AchievementStore | null,
    private readonly onUnlock: (def: AchievementDef) => void,
  ) {}

  /** Adds to a lifetime counter. */
  count(counter: LifetimeCounter, n = 1): void {
    if (!this.store || !(n > 0)) return;
    const pending = (this.pending[counter] ?? 0) + n;
    this.pending[counter] = pending;
    this.reach(counter, this.store.lifetime(counter) + pending);
  }

  /** A counter whose total is known elsewhere (cards in the file, jokes found) reached `total`. */
  reach(counter: LifetimeCounter, total: number): void {
    const store = this.store;
    if (!store) return;
    for (const def of counterUnlocks(counter, total, (id) => store.isUnlocked(id))) this.unlock(def.id);
  }

  /** A one-off moment (a no-hit boss, a par time). */
  unlock(id: string): void {
    const def = achievementById(id);
    if (!def || !this.store || !this.store.unlock(id)) return;
    this.onUnlock(def);
  }

  /** Writes the counted-up totals to the file. */
  flush(): void {
    if (!this.store) return;
    const counts = this.pending;
    this.pending = {};
    if (Object.keys(counts).length > 0) this.store.addLifetime(counts);
  }
}

/** The achievement store for a save file. */
export function fileAchievements(slot: number | null): AchievementStore | null {
  if (slot === null) return null;
  return {
    isUnlocked: (id) => saveSystem.getSlot(slot)?.achievements[id] !== undefined,
    unlock: (id) => saveSystem.unlockAchievement(slot, id),
    lifetime: (c) => saveSystem.getSlot(slot)?.lifetime[c] ?? 0,
    addLifetime: (counts) => saveSystem.addLifetime(slot, counts as Record<string, number>),
  };
}

/** A file's total for a counter. Cards and jokes are counted from the file itself, the rest are stored. */
export function fileCounter(file: SlotData | null, counter: LifetimeCounter): number {
  if (!file) return 0;
  if (counter === 'cards') return new Set(Object.values(file.chapters).flatMap((c) => c.cards)).size;
  if (counter === 'jokes') return file.jokes.length;
  return file.lifetime[counter] ?? 0;
}
