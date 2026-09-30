import { RANK_ORDER, type Rank } from '../config/scoring';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'ben10-omnitrix-summer';

export interface ChapterRecord {
  completed: boolean;
  bestTimeMs: number | null;
  bestRank: Rank | null;
  bestScore: number | null;
  cards: string[];
  clears: number;
}

export interface SaveData {
  version: number;
  muted: boolean;
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
}

export interface RecordOutcome {
  newBestTime: boolean;
  newBestRank: boolean;
  newCards: string[];
  record: ChapterRecord;
}

export function createDefaultSave(): SaveData {
  return { version: SAVE_VERSION, muted: false, chapters: {} };
}

export function createChapterRecord(): ChapterRecord {
  return { completed: false, bestTimeMs: null, bestRank: null, bestScore: null, cards: [], clears: 0 };
}

/** Upgrades any older or partial save into the current shape. Unknown junk becomes a fresh save. */
export function migrateSave(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return createDefaultSave();
  const data = raw as Partial<SaveData> & Record<string, unknown>;
  const save = createDefaultSave();
  save.muted = typeof data.muted === 'boolean' ? data.muted : false;

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
      };
    }
  }
  return save;
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

  recordChapter(chapterId: string, result: ChapterResult): RecordOutcome {
    const data = this.load();
    const previous = data.chapters[chapterId] ?? createChapterRecord();

    const newBestTime = previous.bestTimeMs === null || result.timeMs < previous.bestTimeMs;
    const newBestRank =
      previous.bestRank === null || RANK_ORDER.indexOf(result.rank) > RANK_ORDER.indexOf(previous.bestRank);
    const newCards = result.cards.filter((c) => !previous.cards.includes(c));

    const record: ChapterRecord = {
      completed: true,
      bestTimeMs: newBestTime ? result.timeMs : previous.bestTimeMs,
      bestRank: newBestRank ? result.rank : previous.bestRank,
      bestScore: Math.max(previous.bestScore ?? -Infinity, result.score),
      cards: [...previous.cards, ...newCards],
      clears: previous.clears + 1,
    };
    data.chapters[chapterId] = record;
    this.save(data);
    return { newBestTime, newBestRank, newCards, record };
  }
}

export const saveSystem = new SaveSystem();
