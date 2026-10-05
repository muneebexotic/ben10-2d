import type { Controls } from '../../../systems/InputMap';
import { AlienHints } from './AlienHints';
import { RoadChase } from './RoadChase';
import { RoadIntro } from './RoadIntro';
import type { SetPiece, StoryKit } from './StoryKit';
import { UnlockBeat } from './UnlockBeat';
import { WaveTriggers } from './WaveTriggers';
import { AtriumCollapse } from './museum/AtriumCollapse';
import { Blackout } from './museum/Blackout';
import { MuseumIntro } from './museum/MuseumIntro';
import { VillainIntro } from './museum/VillainIntro';
import { buildKevinStory } from './kevin';
import type { CityIntro } from './kevin/CityIntro';

/**
 * Builds a chapter's scripted moments from its level data and runs them:
 * the opening, alien unlocks, ambush waves, later-alien secrets, the chase.
 */
export class StoryDirector {
  private readonly pieces: SetPiece[] = [];
  private readonly unlockBeats = new Map<string, UnlockBeat>();
  readonly intro: RoadIntro | MuseumIntro | CityIntro | null;

  constructor(private readonly kit: StoryKit, resumeX: number, hooks: { onIntroControl(): void }) {
    const plan = kit.level.story;
    for (const u of plan?.unlocks ?? []) {
      const beat = new UnlockBeat(kit, u, u.scripted === true);
      this.unlockBeats.set(u.alien, beat);
    }
    const kevin = plan?.cityIntro || plan?.kevin ? buildKevinStory(kit, resumeX, this.unlockBeats) : null;
    this.intro = plan?.roadIntro ? new RoadIntro(kit, plan.roadIntro, () => hooks.onIntroControl()) : plan?.museumIntro ? new MuseumIntro(kit, plan.museumIntro) : (kevin?.intro ?? null);
    if (this.intro && !kevin) this.pieces.push(this.intro);
    if (kevin) this.pieces.push(...kevin.pieces);
    this.pieces.push(...this.unlockBeats.values());
    this.pieces.push(new WaveTriggers(kit, resumeX));
    this.pieces.push(new AlienHints(kit));
    if (plan?.villainIntro) this.pieces.push(new VillainIntro(kit, plan.villainIntro, resumeX));
    // The museum's two discoveries: Wildmutt in the blackout, Stinkfly when the atrium bridge falls.
    if (plan?.blackout) this.pieces.push(new Blackout(kit, plan.blackout, this.unlockBeats.get(plan.blackout.alien) ?? null, resumeX));
    if (plan?.atrium) this.pieces.push(new AtriumCollapse(kit, plan.atrium, this.unlockBeats.get(plan.atrium.alien) ?? null, resumeX));
    if (plan?.chase) {
      // The chase starts the chapter's scripted unlock (Four Arms, on the first truck that hooks on).
      const scripted = (plan.unlocks ?? []).find((u) => u.scripted);
      this.pieces.push(new RoadChase(kit, plan.chase, resumeX, scripted ? (this.unlockBeats.get(scripted.alien) ?? null) : null));
    }
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
