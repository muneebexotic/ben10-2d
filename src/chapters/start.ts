import type Phaser from 'phaser';
import { loadChapter } from './registry';

/**
 * Gets a level ready to start: its chapter's chunk (fetched once, behind the
 * fade) and any scenes only that chapter uses. Every way into a level waits on it.
 */
export function prepareLevel(game: Phaser.Game, levelId: string): Promise<void> {
  return loadChapter(levelId).then((chapter) => {
    for (const s of chapter.scenes ?? []) {
      if (game.scene.getScene(s.key)) continue;
      game.scene.add(s.key, s.scene, false);
      if (s.below) game.scene.moveBelow(s.below, s.key);
    }
  });
}

/** Starts fetching a chapter the player is likely to start next (the focused card, the Continue file). Failures wait for the real start. */
export function prefetchLevel(levelId: string | null | undefined): void {
  if (levelId) loadChapter(levelId).catch(() => undefined);
}
