import { RANK_ORDER, type Rank } from '../config/scoring';
import { DEFAULT_DIFFICULTY, isDifficultyId, type DifficultyId } from '../config/difficulty';
import { sanitizeRunStats, type RunStats } from './RunStats';
import { launchParams } from './LaunchParams';
import { autobenchSave, memoryStorage } from './autobench/fixture';

/**
 * Version history:
 * 1. Milestone 1: best time, rank, cards per chapter, mute.
 * 2. Polish pass: settings and best splits.
 * 3. Milestone 3: three save files, each with its own difficulty, unlocked
 *    aliens, cards, per-difficulty bests and splits, and a resume point.
 *    Older progress becomes File 1 on Normal (the only difficulty there was).
 * 4. After Act 1: achievements, lifetime counters and misfire jokes per file,
 *    best segments (sum of best) per difficulty, and the ghost setting.
 *    Everything new starts empty, so older files load unchanged.
 */
export const SAVE_VERSION = 4;
export const SAVE_KEY = 'ben10-omnitrix-summer';
export const SLOT_COUNT = 3;

/** Best results on one difficulty. */
export interface DifficultyRecord {
  bestTimeMs: number | null;
  bestRank: Rank | null;
  bestScore: number | null;
  clears: number;
  /** Fastest run time ever reached at each split (checkpoint id or 'finish'). */
  bestSplits: Record<string, number>;
  /** Fastest time ever from the previous split to this one (their sum is the "sum of best"). */
  bestSegments: Record<string, number>;
}

export interface ChapterRecord {
  completed: boolean;
  /** Clears on any difficulty. */
  clears: number;
  /** Sumo Slammers cards are collected once per file, whatever the difficulty. */
  cards: string[];
  bests: Partial<Record<DifficultyId, DifficultyRecord>>;
}

/** Where Continue drops the player back in: the last checkpoint of an unfinished chapter. */
export interface ResumePoint {
  levelId: string;
  checkpoint: string;
  stats: RunStats;
}

export interface SlotData {
  createdAt: number;
  lastPlayedAt: number;
  /** Time spent in levels. */
  playTimeMs: number;
  difficulty: DifficultyId;
  chapters: Record<string, ChapterRecord>;
  /** Aliens this file has on the dial (story unlocks). */
  unlockedAliens: string[];
  resume: ResumePoint | null;
  /** Achievement id -> when it was unlocked. */
  achievements: Record<string, number>;
  /** Lifetime counters behind the achievements (enemies burned, parries, smoothies...). */
  lifetime: Record<string, number>;
  /** Misfire jokes this file has seen (ids from aliens/jokes.ts). */
  jokes: string[];
}

export type TouchMode = 'auto' | 'on' | 'off';

/** Player options (shared by every file). `null` means "not chosen yet": follow the device (e.g. prefers-reduced-motion). */
export interface SettingsData {
  reduceFlashing: boolean | null;
  /** Screen shake strength, 0..1. */
  shake: number | null;
  touchControls: TouchMode;
  /** Race a ghost of your best run. */
  ghost: boolean;
}

export interface SaveData {
  version: number;
  muted: boolean;
  settings: SettingsData;
  /** The file Continue loads (the last one played), or null. */
  lastSlot: number | null;
  slots: Array<SlotData | null>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ChapterResult {
  timeMs: number;
  rank: Rank;
  score: number;
  cards: string[];
  difficulty: DifficultyId;
  /** False for practice runs and runs that changed difficulty: only cards and clears are recorded. */
  timed?: boolean;
}

export interface RecordOutcome {
  newBestTime: boolean;
  newBestRank: boolean;
  newCards: string[];
  firstClear: boolean;
  record: ChapterRecord;
  /** The bests on the run's difficulty after recording. */
  best: DifficultyRecord;
}

export function createDefaultSettings(): SettingsData {
  return { reduceFlashing: null, shake: null, touchControls: 'auto', ghost: true };
}

export function createDefaultSave(): SaveData {
  return { version: SAVE_VERSION, muted: false, settings: createDefaultSettings(), lastSlot: null, slots: emptySlots() };
}

export function createChapterRecord(): ChapterRecord {
  return { completed: false, clears: 0, cards: [], bests: {} };
}

export function createDifficultyRecord(): DifficultyRecord {
  return { bestTimeMs: null, bestRank: null, bestScore: null, clears: 0, bestSplits: {}, bestSegments: {} };
}

export function createSlot(difficulty: DifficultyId, now: number = Date.now()): SlotData {
  return { createdAt: now, lastPlayedAt: now, playTimeMs: 0, difficulty, chapters: {}, unlockedAliens: [], resume: null, achievements: {}, lifetime: {}, jokes: [] };
}

/** The bests on one difficulty (an empty record if it was never cleared there). */
export function bestOn(record: ChapterRecord, difficulty: DifficultyId): DifficultyRecord {
  return record.bests[difficulty] ?? createDifficultyRecord();
}

function emptySlots(): Array<SlotData | null> {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

// ------------------------------------------------------------------ Migration

/** Upgrades any older or partial save into the current shape. Unknown junk becomes a fresh save. */
export function migrateSave(raw: unknown, now: number = Date.now()): SaveData {
  if (!raw || typeof raw !== 'object') return createDefaultSave();
  const data = raw as Record<string, unknown>;
  const save = createDefaultSave();
  save.muted = typeof data.muted === 'boolean' ? data.muted : false;
  save.settings = migrateSettings(data.settings);

  if (Array.isArray(data.slots)) {
    data.slots.slice(0, SLOT_COUNT).forEach((slot, i) => (save.slots[i] = migrateSlot(slot, now)));
    const last = data.lastSlot;
    save.lastSlot = typeof last === 'number' && Number.isInteger(last) && save.slots[last] ? last : null;
  } else if (data.chapters && typeof data.chapters === 'object') {
    // Version 1 or 2: one set of progress, always played on Normal. It becomes File 1.
    const chapters = migrateLegacyChapters(data.chapters as Record<string, unknown>);
    if (Object.keys(chapters).length > 0) {
      save.slots[0] = { ...createSlot('normal', now), chapters };
      save.lastSlot = 0;
    }
  }
  if (save.lastSlot === null) save.lastSlot = mostRecentSlot(save.slots);
  return save;
}

function mostRecentSlot(slots: Array<SlotData | null>): number | null {
  let best: number | null = null;
  slots.forEach((s, i) => {
    if (s && (best === null || s.lastPlayedAt > (slots[best]?.lastPlayedAt ?? 0))) best = i;
  });
  return best;
}

function migrateLegacyChapters(raw: Record<string, unknown>): Record<string, ChapterRecord> {
  const out: Record<string, ChapterRecord> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue;
    const rec = value as Record<string, unknown>;
    const completed = rec.completed === true;
    const clears = num(rec.clears) ?? (completed ? 1 : 0);
    const normal: DifficultyRecord = {
      bestTimeMs: num(rec.bestTimeMs),
      bestRank: isRank(rec.bestRank) ? rec.bestRank : null,
      bestScore: num(rec.bestScore),
      clears,
      bestSplits: migrateSplits(rec.bestSplits),
      bestSegments: {},
    };
    const touched = normal.bestTimeMs !== null || normal.bestRank !== null || clears > 0 || Object.keys(normal.bestSplits).length > 0;
    out[id] = { completed, clears, cards: strings(rec.cards), bests: touched ? { normal } : {} };
  }
  return out;
}

function migrateSlot(raw: unknown, now: number): SlotData | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const slot = createSlot(isDifficultyId(s.difficulty) ? s.difficulty : DEFAULT_DIFFICULTY, num(s.createdAt) ?? now);
  slot.lastPlayedAt = num(s.lastPlayedAt) ?? slot.createdAt;
  slot.playTimeMs = Math.max(0, num(s.playTimeMs) ?? 0);
  slot.unlockedAliens = strings(s.unlockedAliens);
  if (s.chapters && typeof s.chapters === 'object') {
    for (const [id, value] of Object.entries(s.chapters as Record<string, unknown>)) {
      const rec = migrateChapter(value);
      if (rec) slot.chapters[id] = rec;
    }
  }
  slot.resume = migrateResume(s.resume);
  slot.achievements = migrateSplits(s.achievements);
  slot.lifetime = migrateSplits(s.lifetime);
  slot.jokes = strings(s.jokes);
  return slot;
}

function migrateChapter(raw: unknown): ChapterRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const rec = createChapterRecord();
  rec.completed = r.completed === true;
  rec.clears = num(r.clears) ?? (rec.completed ? 1 : 0);
  rec.cards = strings(r.cards);
  if (r.bests && typeof r.bests === 'object') {
    for (const [id, value] of Object.entries(r.bests as Record<string, unknown>)) {
      if (!isDifficultyId(id) || !value || typeof value !== 'object') continue;
      const b = value as Record<string, unknown>;
      rec.bests[id] = {
        bestTimeMs: num(b.bestTimeMs),
        bestRank: isRank(b.bestRank) ? b.bestRank : null,
        bestScore: num(b.bestScore),
        clears: num(b.clears) ?? 0,
        bestSplits: migrateSplits(b.bestSplits),
        bestSegments: migrateSplits(b.bestSegments),
      };
    }
  }
  return rec;
}

function migrateResume(raw: unknown): ResumePoint | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.levelId !== 'string' || typeof r.checkpoint !== 'string') return null;
  const stats = sanitizeRunStats(r.stats);
  return stats ? { levelId: r.levelId, checkpoint: r.checkpoint, stats } : null;
}

function migrateSettings(raw: unknown): SettingsData {
  const settings = createDefaultSettings();
  if (!raw || typeof raw !== 'object') return settings;
  const s = raw as Partial<Record<keyof SettingsData, unknown>>;
  if (typeof s.reduceFlashing === 'boolean') settings.reduceFlashing = s.reduceFlashing;
  if (typeof s.shake === 'number' && Number.isFinite(s.shake)) settings.shake = Math.min(1, Math.max(0, s.shake));
  if (s.touchControls === 'on' || s.touchControls === 'off' || s.touchControls === 'auto') settings.touchControls = s.touchControls;
  if (typeof s.ghost === 'boolean') settings.ghost = s.ghost;
  return settings;
}

/** A map of positive numbers (splits, segments, unlock times, counters); anything else is dropped. */
function migrateSplits(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, value] of Object.entries(raw)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[id] = value;
  }
  return out;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((c): c is string => typeof c === 'string') : [];
}

function isRank(value: unknown): value is Rank {
  return typeof value === 'string' && (RANK_ORDER as string[]).includes(value);
}

export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ Save system

/** localStorage-backed save with three files. Every call is safe when storage is missing or throws. */
export class SaveSystem {
  private cache: SaveData | null = null;

  constructor(
    private readonly storage: StorageLike | null = getBrowserStorage(),
    private readonly key: string = SAVE_KEY,
    private readonly clock: () => number = Date.now,
  ) {}

  load(): SaveData {
    if (this.cache) return this.cache;
    let data = createDefaultSave();
    try {
      const raw = this.storage?.getItem(this.key);
      if (raw) data = migrateSave(JSON.parse(raw), this.clock());
    } catch {
      data = createDefaultSave();
    }
    this.cache = data;
    return data;
  }

  save(data: SaveData = this.load()): boolean {
    this.cache = data;
    try {
      this.storage?.setItem(this.key, JSON.stringify(data));
      return this.storage !== null;
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean): void {
    const data = this.load();
    data.muted = muted;
    this.save(data);
  }

  setSettings(patch: Partial<SettingsData>): SettingsData {
    const data = this.load();
    data.settings = { ...data.settings, ...patch };
    this.save(data);
    return data.settings;
  }

  // ---------------------------------------------------------------- Files

  getSlot(slot: number): SlotData | null {
    return this.load().slots[slot] ?? null;
  }

  hasAnySlot(): boolean {
    return this.load().slots.some((s) => s !== null);
  }

  get lastSlot(): number | null {
    return this.load().lastSlot;
  }

  /** Starts a new file (replacing whatever was there) and makes it the one Continue loads. */
  createSlot(slot: number, difficulty: DifficultyId): SlotData {
    const data = this.load();
    const created = createSlot(difficulty, this.clock());
    data.slots[slot] = created;
    data.lastSlot = slot;
    this.save(data);
    return created;
  }

  deleteSlot(slot: number): void {
    const data = this.load();
    data.slots[slot] = null;
    if (data.lastSlot === slot) data.lastSlot = mostRecentSlot(data.slots);
    this.save(data);
  }

  /** The player picked this file: Continue loads it from now on. */
  touchSlot(slot: number): void {
    const data = this.load();
    const s = data.slots[slot];
    if (!s) return;
    s.lastPlayedAt = this.clock();
    data.lastSlot = slot;
    this.save(data);
  }

  setDifficulty(slot: number, difficulty: DifficultyId): void {
    const s = this.getSlot(slot);
    if (!s || s.difficulty === difficulty) return;
    s.difficulty = difficulty;
    this.save();
  }

  addPlayTime(slot: number, ms: number): void {
    const s = this.getSlot(slot);
    if (!s || !(ms > 0)) return;
    s.playTimeMs += ms;
    s.lastPlayedAt = this.clock();
    this.save();
  }

  /** Adds aliens to the file's dial. Returns the ones that are new. */
  unlockAliens(slot: number, ids: readonly string[]): string[] {
    const s = this.getSlot(slot);
    if (!s) return [];
    const fresh = ids.filter((id) => !s.unlockedAliens.includes(id));
    if (fresh.length === 0) return [];
    s.unlockedAliens.push(...fresh);
    this.save();
    return fresh;
  }

  setResume(slot: number, resume: ResumePoint | null): void {
    const s = this.getSlot(slot);
    if (!s) return;
    s.resume = resume;
    s.lastPlayedAt = this.clock();
    this.save();
  }

  // ---------------------------------------------------------------- Chapters

  getChapter(slot: number, chapterId: string): ChapterRecord {
    return this.getSlot(slot)?.chapters[chapterId] ?? createChapterRecord();
  }

  /** Stores a split if it beats the best one on that difficulty. Returns the previous best (null if none). */
  recordSplit(slot: number, chapterId: string, difficulty: DifficultyId, splitId: string, timeMs: number): number | null {
    const s = this.getSlot(slot);
    if (!s) return null;
    const record = s.chapters[chapterId] ?? createChapterRecord();
    const best = bestOn(record, difficulty);
    const previous = best.bestSplits[splitId] ?? null;
    if (previous === null || timeMs < previous) {
      best.bestSplits = { ...best.bestSplits, [splitId]: timeMs };
      record.bests[difficulty] = best;
      s.chapters[chapterId] = record;
      this.save();
    }
    return previous;
  }

  /** Stores a segment (previous split to this one) if it's the fastest on that difficulty. Returns the previous best. */
  recordSegment(slot: number, chapterId: string, difficulty: DifficultyId, splitId: string, segmentMs: number): number | null {
    const s = this.getSlot(slot);
    if (!s || !(segmentMs > 0)) return null;
    const record = s.chapters[chapterId] ?? createChapterRecord();
    const best = bestOn(record, difficulty);
    const previous = best.bestSegments[splitId] ?? null;
    if (previous === null || segmentMs < previous) {
      best.bestSegments = { ...best.bestSegments, [splitId]: segmentMs };
      record.bests[difficulty] = best;
      s.chapters[chapterId] = record;
      this.save();
    }
    return previous;
  }

  // ---------------------------------------------------------------- Extras

  /** Marks an achievement unlocked. True if it's new. */
  unlockAchievement(slot: number, id: string): boolean {
    const s = this.getSlot(slot);
    if (!s || s.achievements[id] !== undefined) return false;
    s.achievements[id] = this.clock();
    this.save();
    return true;
  }

  /** Adds to the file's lifetime counters (one write for a batch). */
  addLifetime(slot: number, counts: Readonly<Record<string, number>>): void {
    const s = this.getSlot(slot);
    if (!s) return;
    let changed = false;
    for (const [key, n] of Object.entries(counts)) {
      if (!(n > 0)) continue;
      s.lifetime[key] = (s.lifetime[key] ?? 0) + n;
      changed = true;
    }
    if (changed) this.save();
  }

  /** Records a misfire joke as seen. True if it's new. */
  addJoke(slot: number, id: string): boolean {
    const s = this.getSlot(slot);
    if (!s || s.jokes.includes(id)) return false;
    s.jokes.push(id);
    this.save();
    return true;
  }

  recordChapter(slot: number, chapterId: string, result: ChapterResult): RecordOutcome {
    const s = this.getSlot(slot);
    const previous = s?.chapters[chapterId] ?? createChapterRecord();
    const prevBest = bestOn(previous, result.difficulty);
    const timed = result.timed !== false;

    const newBestTime = timed && (prevBest.bestTimeMs === null || result.timeMs < prevBest.bestTimeMs);
    const newBestRank =
      timed && (prevBest.bestRank === null || RANK_ORDER.indexOf(result.rank) > RANK_ORDER.indexOf(prevBest.bestRank));
    const newCards = result.cards.filter((c) => !previous.cards.includes(c));

    const best: DifficultyRecord = {
      bestTimeMs: newBestTime ? result.timeMs : prevBest.bestTimeMs,
      bestRank: newBestRank ? result.rank : prevBest.bestRank,
      bestScore: timed ? Math.max(prevBest.bestScore ?? -Infinity, result.score) : prevBest.bestScore,
      clears: prevBest.clears + 1,
      bestSplits: prevBest.bestSplits,
      bestSegments: prevBest.bestSegments,
    };
    const record: ChapterRecord = {
      completed: true,
      clears: previous.clears + 1,
      cards: [...previous.cards, ...newCards],
      bests: { ...previous.bests, [result.difficulty]: best },
    };
    if (s) {
      s.chapters[chapterId] = record;
      if (s.resume?.levelId === chapterId) s.resume = null;
      s.lastPlayedAt = this.clock();
      this.save();
    }
    return { newBestTime, newBestRank, newCards, firstClear: !previous.completed, record, best };
  }
}

/** The autobench (?autobench) plays on a file in memory so the real save is never touched. */
function saveStorage(): StorageLike | null {
  if (launchParams().autobench) return memoryStorage({ [SAVE_KEY]: JSON.stringify(autobenchSave()) });
  return getBrowserStorage();
}

export const saveSystem = new SaveSystem(saveStorage());
