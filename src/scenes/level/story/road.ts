import type { ChapterStory } from '../../../chapters/types';
import { RoadChase } from './RoadChase';
import { RoadIntro } from './RoadIntro';
import type { SetPiece, StoryKit } from './StoryKit';
import type { UnlockBeat } from './UnlockBeat';

/** Chapter 2's story: the opening drive, then the Rustbucket chase (which starts Four Arms' scripted unlock). */
export function buildRoadStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  const plan = kit.level.story;
  const intro = plan?.roadIntro ? new RoadIntro(kit, plan.roadIntro, () => kit.spawnIntroDrones()) : null;
  const after: SetPiece[] = [];
  if (plan?.chase) {
    const scripted = (plan.unlocks ?? []).find((u) => u.scripted);
    after.push(new RoadChase(kit, plan.chase, resumeX, scripted ? (unlockBeats.get(scripted.alien) ?? null) : null));
  }
  return { intro, pieces: intro ? [intro] : [], after };
}
