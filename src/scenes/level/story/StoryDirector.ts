import type { ChapterModule, StoryIntro } from '../../../chapters/types';
import type { Controls } from '../../../systems/InputMap';
import { AlienHints } from './AlienHints';
import type { SetPiece, StoryKit } from './StoryKit';
import { UnlockBeat } from './UnlockBeat';
import { WaveTriggers } from './WaveTriggers';

/**
 * Builds a chapter's scripted moments from its level data and runs them: the
 * chapter's own set pieces (its chunk builds them), alien unlocks, ambush
 * waves and later-alien secrets.
 */
export class StoryDirector {
  private readonly pieces: SetPiece[] = [];
  private readonly unlockBeats = new Map<string, UnlockBeat>();
  readonly intro: StoryIntro | null;

  constructor(private readonly kit: StoryKit, resumeX: number, build: ChapterModule['story']) {
    const plan = kit.level.story;
    for (const u of plan?.unlocks ?? []) {
      const beat = new UnlockBeat(kit, u, u.scripted === true);
      this.unlockBeats.set(u.alien, beat);
    }
    const story = build?.(kit, resumeX, this.unlockBeats) ?? null;
    this.intro = story?.intro ?? null;
    if (story) this.pieces.push(...story.pieces);
    this.pieces.push(...this.unlockBeats.values());
    this.pieces.push(new WaveTriggers(kit, resumeX));
    this.pieces.push(new AlienHints(kit));
    if (story?.after) this.pieces.push(...story.after);
  }

  /** The opening is still running (the watch never misfires then). */
  get introPlaying(): boolean {
    return this.intro !== null && !this.intro.done;
  }

  get cinematic(): boolean {
    return this.pieces.some((p) => p.cinematic);
  }

  get storyLock(): boolean {
    return this.pieces.some((p) => p.storyLock);
  }

  update(dtMs: number, realDtMs: number, controls: Controls): void {
    for (const p of this.pieces) p.update(dtMs, realDtMs, controls);
  }

  destroy(): void {
    for (const p of this.pieces) p.destroy();
    this.pieces.length = 0;
    void this.kit;
  }
}
