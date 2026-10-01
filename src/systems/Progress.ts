import { aliensUnlockedBy, allAliens, hasAlien } from '../aliens/registry';
import { STORY } from '../config/story';
import { CHAPTERS, chapterForLevel } from '../levels/chapters';
import { getLevel, storyLevels } from '../levels/registry';
import { countedCards } from '../levels/secrets';
import { saveSystem, type SlotData } from './SaveSystem';

/** What a save file's card and the title's Continue line show. */
export interface FileSummary {
  slot: number;
  file: SlotData;
  chaptersDone: number;
  chaptersTotal: number;
  cards: number;
  cardsTotal: number;
  /** Aliens on this file's dial, in dial order. */
  aliens: string[];
  aliensTotal: number;
  /** "CAMP CRASH, NEST" when Continue drops back into a chapter. */
  resumeLabel: string | null;
}

export function completedLevelIds(file: SlotData | null): string[] {
  if (!file) return [];
  return Object.entries(file.chapters)
    .filter(([, record]) => record.completed)
    .map(([id]) => id);
}

/** The file's aliens: everything its finished chapters unlocked plus any stored unlocks, in dial order. */
export function fileAliens(file: SlotData | null): string[] {
  if (!file) return [];
  const done = completedLevelIds(file)
    .map((id) => chapterForLevel(id)?.number ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);
  const ids = new Set([...aliensUnlockedBy(done), ...file.unlockedAliens.filter((id) => hasAlien(id))]);
  return allAliens()
    .map((a) => a.id)
    .filter((id) => ids.has(id));
}

/** A checkpoint's split label ("NEST"), for resume lines. */
export function checkpointLabel(levelId: string, checkpointId: string): string {
  try {
    const cp = getLevel(levelId).entities.find((e) => e.type === 'checkpoint' && e.id === checkpointId);
    return cp && cp.type === 'checkpoint' ? cp.label : checkpointId.toUpperCase();
  } catch {
    return checkpointId.toUpperCase();
  }
}

export function summarize(slot: number): FileSummary | null {
  const file = saveSystem.getSlot(slot);
  if (!file) return null;
  const done = completedLevelIds(file);
  let cards = 0;
  let cardsTotal = 0;
  for (const level of storyLevels()) {
    const counted = countedCards(level).map((c) => c.id);
    cardsTotal += counted.length;
    cards += (file.chapters[level.id]?.cards ?? []).filter((id) => counted.includes(id)).length;
  }
  const resume = file.resume;
  const chapter = resume ? chapterForLevel(resume.levelId) : null;
  return {
    slot,
    file,
    chaptersDone: done.length,
    chaptersTotal: CHAPTERS.length,
    cards,
    cardsTotal,
    aliens: fileAliens(file),
    aliensTotal: STORY.rosterSize,
    resumeLabel: resume && chapter ? `${chapter.title}, ${checkpointLabel(resume.levelId, resume.checkpoint)}` : null,
  };
}
