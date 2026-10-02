import type { Controls } from '../../../systems/InputMap';
import { AlienHints } from './AlienHints';
import { RoadIntro } from './RoadIntro';
import type { SetPiece, StoryKit } from './StoryKit';
import { UnlockBeat } from './UnlockBeat';
import { WaveTriggers } from './WaveTriggers';

/**
 * Builds a chapter's scripted moments from its level data and runs them:
 * the opening, alien unlocks, ambush waves, later-alien secrets, the chase.
 */
export class StoryDirector {
  private readonly pieces: SetPiece[] = [];
  private readonly unlockBeats = new Map<string, UnlockBeat>();
  readonly intro: RoadIntro | null;

  constructor(private readonly kit: StoryKit, resumeX: number, hooks: { onIntroControl(): void }) {
    const plan = kit.level.story;
    this.intro = plan?.roadIntro ? new RoadIntro(kit, plan.roadIntro, () => hooks.onIntroControl()) : null;
    if (this.intro) this.pieces.push(this.intro);
    for (const u of plan?.unlocks ?? []) {
      const beat = new UnlockBeat(kit, u, u.scripted === true);
      this.unlockBeats.set(u.alien, beat);
      this.pieces.push(beat);
    }
    this.pieces.push(new WaveTriggers(kit, resumeX));
    this.pieces.push(new AlienHints(kit));
  }

  /** Adds a set piece built elsewhere (the chase needs the director's unlock beats). */
  add(piece: SetPiece): void {
    this.pieces.push(piece);
  }

  /** The scripted unlock for this alien (the chase starts Four Arms'). */
  unlockBeat(alienId: string): UnlockBeat | null {
    return this.unlockBeats.get(alienId) ?? null;
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
