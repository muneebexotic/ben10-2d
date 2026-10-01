import { RANK_ORDER, type Rank } from '../config/scoring';

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'ben10-omnitrix-summer';

export interface ChapterRecord {
  completed: boolean;
  bestTimeMs: number | null;
  bestRank: Rank | null;
  bestScore: number | null;
  cards: string[];
  clears: number;
  /** Fastest run time ever reached at each split (checkpoint id or 'finish'). */
  bestSplits: Record<string, number>;
}

export type TouchMode = 'auto' | 'on' | 'off';

/** Player options. `null` means "not chosen yet": follow the device (e.g. prefers-reduced-motion). */
export interface SettingsData {
  reduceFlashing: boolean | null;
  /** Screen shake strength, 0..1. */
  shake: number | null;
  touchControls: TouchMode;
}

export interface SaveData {
  version: number;
  muted: boolean;
  settings: SettingsData;
  chapters: Record<string, ChapterRecord>;
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
  /** False for practice runs (started mid-level with ?start=): only cards and clears are recorded. */
  timed?: boolean;
}

export interface RecordOutcome {
  newBestTime: boolean;
  newBestRank: boolean;
  newCards: string[];
  record: ChapterRecord;
}

export function createDefaultSettings(): SettingsData {
  return { reduceFlashing: null, shake: null, touchControls: 'auto' };
}

export function createDefaultSave(): SaveData {
  return { version: SAVE_VERSION, muted: false, settings: createDefaultSettings(), chapters: {} };
}

export function createChapterRecord(): ChapterRecord {
  return { completed: false, bestTimeMs: null, bestRank: null, bestScore: null, cards: [], clears: 0, bestSplits: {} };
}

/** Upgrades any older or partial save into the current shape. Unknown junk becomes a fresh save. */
export function migrateSave(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return createDefaultSave();
  const data = raw as Partial<SaveData> & Record<string, unknown>;
  const save = createDefaultSave();
  save.muted = typeof data.muted === 'boolean' ? data.muted : false;
  save.settings = migrateSettings(data.settings);

  if (data.chapters && typeof data.chapters === 'object') {
    for (const [id, value] of Object.entries(data.chapters)) {
      if (!value || typeof value !== 'object') continue;
      const rec = value as Partial<ChapterRecord>;
      save.chapters[id] = {
        completed: rec.completed === true,
        bestTimeMs: typeof rec.bestTimeMs === 'number' ? rec.bestTimeMs : null,
        bestRank: isRank(rec.bestRank) ? rec.bestRank : null,
        bestScore: typeof rec.bestScore === 'number' ? rec.bestScore : null,
        cards: Array.isArray(rec.cards) ? rec.cards.filter((c): c is string => typeof c === 'string') : [],
        clears: typeof rec.clears === 'number' ? rec.clears : rec.completed ? 1 : 0,
        bestSplits: migrateSplits(rec.bestSplits),
      };
    }
  }
  return save;
}

function migrateSettings(raw: unknown): SettingsData {
  const settings = createDefaultSettings();
  if (!raw || typeof raw !== 'object') return settings;
  const s = raw as Partial<Record<keyof SettingsData, unknown>>;
  if (typeof s.reduceFlashing === 'boolean') settings.reduceFlashing = s.reduceFlashing;
  if (typeof s.shake === 'number' && Number.isFinite(s.shake)) settings.shake = Math.min(1, Math.max(0, s.shake));
  if (s.touchControls === 'on' || s.touchControls === 'off' || s.touchControls === 'auto') settings.touchControls = s.touchControls;
  return settings;
}

function migrateSplits(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, value] of Object.entries(raw)) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[id] = value;
  }
  return out;
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

export class SaveSystem {
  private cache: SaveData | null = null;

  constructor(
    private readonly storage: StorageLike | null = getBrowserStorage(),
    private readonly key: string = SAVE_KEY,
  ) {}

  load(): SaveData {
    if (this.cache) return this.cache;
    let data = createDefaultSave();
    try {
      const raw = this.storage?.getItem(this.key);
      if (raw) data = migrateSave(JSON.parse(raw));
    } catch {
      data = createDefaultSave();
    }
    this.cache = data;
    return data;
  }

  save(data: SaveData): boolean {
    this.cache = data;
    try {
      this.storage?.setItem(this.key, JSON.stringify(data));
      return this.storage !== null;
    } catch {
      return false;
    }
  }

  getChapter(chapterId: string): ChapterRecord {
    return this.load().chapters[chapterId] ?? createChapterRecord();
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

  /** Stores a split if it beats the best one. Returns the previous best (null if none). */
  recordSplit(chapterId: string, splitId: string, timeMs: number): number | null {
    const data = this.load();
    const record = data.chapters[chapterId] ?? createChapterRecord();
    const previous = record.bestSplits[splitId] ?? null;
    if (previous === null || timeMs < previous) {
      record.bestSplits = { ...record.bestSplits, [splitId]: timeMs };
      data.chapters[chapterId] = record;
      this.save(data);
    }
    return previous;
  }

  recordChapter(chapterId: string, result: ChapterResult): RecordOutcome {
    const data = this.load();
    const previous = data.chapters[chapterId] ?? createChapterRecord();
    const timed = result.timed !== false;

    const newBestTime = timed && (previous.bestTimeMs === null || result.timeMs < previous.bestTimeMs);
    const newBestRank =
      timed && (previous.bestRank === null || RANK_ORDER.indexOf(result.rank) > RANK_ORDER.indexOf(previous.bestRank));
    const newCards = result.cards.filter((c) => !previous.cards.includes(c));

    const record: ChapterRecord = {
      completed: true,
      bestTimeMs: newBestTime ? result.timeMs : previous.bestTimeMs,
      bestRank: newBestRank ? result.rank : previous.bestRank,
      bestScore: timed ? Math.max(previous.bestScore ?? -Infinity, result.score) : previous.bestScore,
      cards: [...previous.cards, ...newCards],
      clears: previous.clears + 1,
      bestSplits: previous.bestSplits,
    };
    data.chapters[chapterId] = record;
    this.save(data);
    return { newBestTime, newBestRank, newCards, record };
  }
}

export const saveSystem = new SaveSystem();
