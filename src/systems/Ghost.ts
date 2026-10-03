import { GHOST } from '../config/ghost';
import { allAliens } from '../aliens/registry';
import { getBrowserStorage, type StorageLike } from './SaveSystem';

/** Ben at one moment of a run. `form` is an index into the run's form list. */
export interface GhostSample {
  x: number;
  y: number;
  form: number;
  frame: number;
  flip: boolean;
}

/** Records one sample per interval of run time. Survives checkpoint restarts (see `ghostRecording`). */
export class GhostRecorder {
  readonly samples: GhostSample[] = [];

  constructor(
    readonly levelId: string,
    readonly difficulty: string,
    readonly intervalMs: number = GHOST.intervalMs,
  ) {}

  /** Called every frame with the run time. */
  sample(timeMs: number, s: GhostSample): void {
    while (this.samples.length * this.intervalMs <= timeMs) this.samples.push({ ...s });
  }

  /** A restart rewound the run clock: forget anything recorded after it. */
  truncate(timeMs: number): void {
    const keep = Math.floor(timeMs / this.intervalMs) + 1;
    if (this.samples.length > keep) this.samples.length = keep;
  }
}

/** Where the ghost is at `timeMs`, between samples; null before the first or after the last. */
export function ghostAt(samples: readonly GhostSample[], intervalMs: number, timeMs: number): GhostSample | null {
  if (samples.length === 0 || timeMs < 0) return null;
  const f = timeMs / intervalMs;
  const i = Math.floor(f);
  if (i >= samples.length) return null;
  const a = samples[i];
  const b = samples[i + 1];
  if (!b) return a;
  const t = f - i;
  // Big jumps (a respawn) snap instead of sliding across the level.
  if (Math.abs(b.x - a.x) > 160 || Math.abs(b.y - a.y) > 160) return a;
  return { ...a, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Packs samples into a short string: small moves as one signed byte per axis,
 * anything bigger (or the first sample) as an absolute position after a 0
 * marker, then form+facing and frame. About 4 bytes a sample before base64.
 */
export function encodeGhost(samples: readonly GhostSample[]): string {
  const bytes: number[] = [];
  let px = 0;
  let py = 0;
  samples.forEach((s, i) => {
    const x = Math.max(0, Math.min(65535, Math.round(s.x)));
    const y = Math.max(0, Math.min(65535, Math.round(s.y)));
    const dx = x - px;
    const dy = y - py;
    if (i === 0 || dx < -127 || dx > 127 || dy < -127 || dy > 127) bytes.push(0, x >> 8, x & 0xff, y >> 8, y & 0xff);
    else bytes.push(dx + 128, dy + 128);
    bytes.push((s.form & 0x7f) | (s.flip ? 0x80 : 0), s.frame & 0xff);
    px = x;
    py = y;
  });
  let bin = '';
  for (let i = 0; i < bytes.length; i += 4096) bin += String.fromCharCode(...bytes.slice(i, i + 4096));
  return btoa(bin);
}

export function decodeGhost(data: string): GhostSample[] | null {
  try {
    const bin = atob(data);
    const out: GhostSample[] = [];
    let i = 0;
    let x = 0;
    let y = 0;
    const at = (k: number) => {
      if (k >= bin.length) throw new Error('truncated ghost');
      return bin.charCodeAt(k);
    };
    while (i < bin.length) {
      const first = at(i);
      if (first === 0) {
        x = (at(i + 1) << 8) | at(i + 2);
        y = (at(i + 3) << 8) | at(i + 4);
        i += 5;
      } else {
        x += first - 128;
        y += at(i + 1) - 128;
        i += 2;
      }
      const state = at(i);
      out.push({ x, y, form: state & 0x7f, flip: (state & 0x80) !== 0, frame: at(i + 1) });
      i += 2;
    }
    return out;
  } catch {
    return null;
  }
}

interface StoredGhost {
  slot: number;
  levelId: string;
  difficulty: string;
  timeMs: number;
  savedAt: number;
  intervalMs: number;
  /** Form ids the samples' `form` indexes point into. */
  forms: string[];
  data: string;
}

export interface LoadedGhost {
  timeMs: number;
  intervalMs: number;
  forms: string[];
  samples: GhostSample[];
}

/** Best-run ghosts in their own localStorage key. Every call is safe when storage is missing, full or throws. */
export class GhostStore {
  constructor(
    private readonly storage: StorageLike | null = getBrowserStorage(),
    private readonly key: string = GHOST.storageKey,
    private readonly clock: () => number = Date.now,
  ) {}

  private all(): StoredGhost[] {
    try {
      const raw = this.storage?.getItem(this.key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((g): g is StoredGhost => !!g && typeof g === 'object' && typeof (g as StoredGhost).data === 'string') : [];
    } catch {
      return [];
    }
  }

  private write(list: StoredGhost[]): boolean {
    try {
      this.storage?.setItem(this.key, JSON.stringify(list));
      return this.storage !== null;
    } catch {
      return false;
    }
  }

  load(slot: number, levelId: string, difficulty: string): LoadedGhost | null {
    const g = this.all().find((e) => e.slot === slot && e.levelId === levelId && e.difficulty === difficulty);
    if (!g) return null;
    const samples = decodeGhost(g.data);
    if (!samples || samples.length === 0 || !Array.isArray(g.forms)) return null;
    return { timeMs: g.timeMs, intervalMs: g.intervalMs || GHOST.intervalMs, forms: g.forms, samples };
  }

  save(slot: number, levelId: string, difficulty: string, timeMs: number, rec: { intervalMs: number; samples: readonly GhostSample[] }, forms: readonly string[]): boolean {
    const list = this.all().filter((e) => !(e.slot === slot && e.levelId === levelId && e.difficulty === difficulty));
    list.push({ slot, levelId, difficulty, timeMs, savedAt: this.clock(), intervalMs: rec.intervalMs, forms: [...forms], data: encodeGhost(rec.samples) });
    list.sort((a, b) => b.savedAt - a.savedAt);
    // Drop the oldest until it fits (the limit, then whatever localStorage will take).
    let keep = Math.min(list.length, GHOST.maxStored);
    while (keep > 0 && !this.write(list.slice(0, keep))) keep--;
    return keep > 0;
  }

  /** A file was erased: its ghosts go too. */
  clearSlot(slot: number): void {
    const list = this.all();
    const rest = list.filter((e) => e.slot !== slot);
    if (rest.length !== list.length) this.write(rest);
  }
}

export const ghostStore = new GhostStore();

let recording: GhostRecorder | null = null;
let finished: GhostRecorder | null = null;

/** The run being recorded now (kept across checkpoint restarts of the same run). */
export const ghostRecording = {
  get current(): GhostRecorder | null {
    return recording;
  },
  start(rec: GhostRecorder | null): void {
    recording = rec;
  },
  /** The run reached the end: Chapter Complete decides whether it becomes the new ghost. */
  finish(): void {
    finished = recording;
    recording = null;
  },
  takeFinished(levelId: string, difficulty: string): GhostRecorder | null {
    const f = finished;
    finished = null;
    return f && f.levelId === levelId && f.difficulty === difficulty ? f : null;
  },
};

/** The forms a ghost's `form` index points into: Ben, then the roster in dial order. */
export function ghostForms(): string[] {
  return ['ben', ...allAliens().map((a) => a.id)];
}
