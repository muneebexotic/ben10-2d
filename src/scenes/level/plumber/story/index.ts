import type { ChapterStory } from '../../../../chapters/types';
import type { StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { BaseSystems } from '../water/BaseSystems';
import { Descent } from './Descent';
import { DockingRing } from './DockingRing';
import { LateBase } from './LateBase';
import { Reactor } from './Reactor';
import { talker, Talkers } from './talkers';

/** Chapter 7's story: the base's systems (water, pumps, doors) and its set pieces, in play order. */
export function buildPlumberStory(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  // First, so the people the pieces make are on its list.
  const talkers = new Talkers(kit);
  if (kit.gwen) talker(kit.scene, 'gwen', kit.gwen.actor);
  const base = new BaseSystems(kit, resumeX);
  const plan = kit.level.story?.plumber;
  if (!plan) return { intro: null, pieces: [talkers, base] };
  // The opening plays on a fresh start only (never on a retry, a continue or a checkpoint).
  const intro = !kit.continuing && kit.startCheckpoint === null ? new Descent(kit) : null;
  return {
    intro,
    pieces: [talkers, ...(intro ? [intro] : []), base, new DockingRing(kit, base, plan, resumeX), new Reactor(kit, base, plan, unlockBeats.get(plan.reactor.alien) ?? null, resumeX),
      new LateBase(kit, base, plan, resumeX),
    ],
  };
}
