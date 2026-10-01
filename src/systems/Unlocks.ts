import { allAliens, hasAlien } from '../aliens/registry';
import { TRAINING } from '../config/training';

/**
 * Which aliens are on the dial. Pure, so it can be unit tested.
 *
 * Story: everything unlocked by the chapter being played or by any chapter
 * already completed (replaying Chapter 1 after Chapter 2 brings Four Arms
 * along), plus playtest extras. Training: everything unlocked so far plus the
 * aliens Training lends out for testing.
 */
export function storyAliens(chapter: number, completed: readonly number[], extra: readonly string[] = []): string[] {
  const reached = Math.max(chapter, ...completed, 0);
  return dialOrder((a) => (a.unlockChapter > 0 && a.unlockChapter <= reached) || extra.includes(a.id));
}

export function trainingAliens(completed: readonly number[], lent: readonly string[] = TRAINING.lentAliens): string[] {
  // The next chapter's aliens stay locked until it is played; chapter 1 is always open.
  const reached = Math.max(1, ...completed);
  return dialOrder((a) => (a.unlockChapter > 0 && a.unlockChapter <= reached) || lent.includes(a.id));
}

/** Unknown ids (typos in ?aliens=) are ignored. */
export function knownAliens(ids: readonly string[]): string[] {
  return ids.filter((id) => hasAlien(id));
}

function dialOrder(include: (a: ReturnType<typeof allAliens>[number]) => boolean): string[] {
  return allAliens()
    .filter(include)
    .map((a) => a.id);
}
