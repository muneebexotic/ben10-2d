import type { ChapterStory } from '../../../../chapters/types';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { AtriumCollapse } from './AtriumCollapse';
import { Blackout } from './Blackout';
import { MuseumIntro } from './MuseumIntro';
import { VillainIntro } from './VillainIntro';

/** Chapter 3's story: the night at the museum, Dr. Animo's entrance, and its two discoveries (Wildmutt in the blackout, Stinkfly when the atrium bridge falls). */
export function buildMuseumStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  const plan = kit.level.story;
  const intro = plan?.museumIntro ? new MuseumIntro(kit, plan.museumIntro) : null;
  const after: SetPiece[] = [];
  if (plan?.villainIntro) after.push(new VillainIntro(kit, plan.villainIntro, resumeX));
  if (plan?.blackout) after.push(new Blackout(kit, plan.blackout, unlockBeats.get(plan.blackout.alien) ?? null, resumeX));
  if (plan?.atrium) after.push(new AtriumCollapse(kit, plan.atrium, unlockBeats.get(plan.atrium.alien) ?? null, resumeX));
  return { intro, pieces: intro ? [intro] : [], after };
}
