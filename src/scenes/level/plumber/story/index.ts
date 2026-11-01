import type { ChapterStory } from '../../../../chapters/types';
import type { StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { BaseSystems } from '../water/BaseSystems';
import { DockingRing } from './DockingRing';
import { LateBase } from './LateBase';
import { Reactor } from './Reactor';

/** Chapter 7's story: the base's systems (water, pumps, doors) and its set pieces, in play order. */
export function buildPlumberStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  const base = new BaseSystems(kit, resumeX);
  const plan = kit.level.story?.plumber;
  if (!plan) return { intro: null, pieces: [base] };
  return {
    intro: null,
    pieces: [base, new DockingRing(kit, base, plan, resumeX), new Reactor(kit, base, plan, unlockBeats.get(plan.reactor.alien) ?? null, resumeX),
      new LateBase(kit, base, plan, resumeX),
    ],
  };
}
