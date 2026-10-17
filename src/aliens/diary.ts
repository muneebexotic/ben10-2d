import { allAliens } from './registry';

/** When a haunted form says a line (the diary groups them so the missing ones say where to listen). */
export type DiaryMoment = 'arrive' | 'idle' | 'leave' | 'hesitate';

export const DIARY_MOMENTS: Record<DiaryMoment, string> = {
  arrive: 'AS HE ARRIVES',
  idle: 'WHILE HE IS OUT',
  leave: 'AS HE LETS GO',
  hesitate: 'WHEN HE HOLDS ON',
};

/** One whisper in Ghostfreak's diary. */
export interface DiaryEntry {
  id: string;
  formId: string;
  moment: DiaryMoment;
  text: string;
}

/** The last page stays stuck shut until he breaks free of the watch (Chapter 9). */
export const DIARY_LAST_PAGE = { chapter: 9, levelId: 'ch9', text: 'I AM NOT A PART OF YOU, BEN. I NEVER WAS.' } as const;

export function diaryId(formId: string, text: string): string {
  return `${formId}|${text}`;
}

/**
 * Every whisper a haunted form can say, once each (a line in two moments is
 * filed under the first): Ghostfreak's diary in EXTRAS. Built from the forms'
 * own `whispers` and `hesitate` lines, so it grows with them.
 */
export function diaryCatalog(): DiaryEntry[] {
  const out = new Map<string, DiaryEntry>();
  for (const form of allAliens()) {
    const w = form.whispers;
    if (!w) continue;
    const groups: Array<[DiaryMoment, readonly string[]]> = [
      ['arrive', w.arrive],
      ['idle', w.idle],
      ['leave', w.leave],
      ['hesitate', form.hesitate?.lines ?? []],
    ];
    for (const [moment, lines] of groups) {
      for (const text of lines) {
        const id = diaryId(form.id, text);
        if (!out.has(id)) out.set(id, { id, formId: form.id, moment, text });
      }
    }
  }
  return [...out.values()];
}

/** The diary entry a whisper on screen belongs to, if it's one (story whispers like "SOON..." count too). */
export function diaryEntryFor(text: string): DiaryEntry | null {
  return diaryCatalog().find((e) => e.text === text) ?? null;
}
