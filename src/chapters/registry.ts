import { TRAINING_ARENA } from '../levels/training';
import { registerTracks } from '../systems/audio/Music';
import { registerBrains } from '../entities/enemies/brains';
import type { ChapterModule } from './types';

/**
 * Each story chapter's code is its own chunk (docs/PERFORMANCE.md, "Loading"):
 * it's fetched when the chapter is about to start, behind the level's fade,
 * so boot only downloads and parses what every chapter shares.
 */
const LOADERS: Readonly<Record<string, () => Promise<ChapterModule>>> = {
  ch1: () => import('./ch1').then((m) => m.CHAPTER),
  ch2: () => import('./ch2').then((m) => m.CHAPTER),
  ch3: () => import('./ch3').then((m) => m.CHAPTER),
  ch4: () => import('./ch4').then((m) => m.CHAPTER),
  ch5: () => import('./ch5').then((m) => m.CHAPTER),
  ch6: () => import('./ch6').then((m) => m.CHAPTER),
  ch7: () => import('./ch7').then((m) => m.CHAPTER),
};

/** Omnitrix Training is part of the shared code (the title screen's sandbox). */
const loaded = new Map<string, ChapterModule>([['training', { level: TRAINING_ARENA }]]);
const pending = new Map<string, Promise<ChapterModule>>();

/** Every level id the game can load. */
export function knownLevelIds(): string[] {
  return [...Object.keys(LOADERS), 'training'];
}

/**
 * Fetches a chapter's chunk (once; later calls share the same promise) and
 * installs what it brings (its music). A failed fetch can be retried.
 */
export function loadChapter(id: string): Promise<ChapterModule> {
  const have = loaded.get(id);
  if (have) return Promise.resolve(have);
  const loader = LOADERS[id];
  if (!loader) return Promise.reject(new Error(`Unknown level: ${id}`));
  let p = pending.get(id);
  if (!p) {
    p = loader().then(
      (m) => {
        if (m.tracks) registerTracks(m.tracks);
        if (m.brains) registerBrains(m.brains);
        loaded.set(id, m);
        pending.delete(id);
        return m;
      },
      (e: unknown) => {
        pending.delete(id);
        throw e;
      },
    );
    pending.set(id, p);
  }
  return p;
}

/** A chapter that has loaded (the level asks for its own; it was loaded before the level started). */
export function chapterModule(id: string): ChapterModule {
  const m = loaded.get(id);
  if (!m) throw new Error(`Chapter not loaded: ${id} (load it with loadChapter before starting the level)`);
  return m;
}

export function chapterLoaded(id: string): boolean {
  return loaded.has(id);
}

/** Chapters loaded so far (the gallery shows their art). */
export function loadedChapterIds(): string[] {
  return [...loaded.keys()];
}
