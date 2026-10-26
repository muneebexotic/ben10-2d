import type { ChapterStory } from '../../../../chapters/types';
import type { StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { BaseSystems } from '../water/BaseSystems';

/** Chapter 7's story: the base's systems (water, pumps, doors) and its set pieces, in play order. */
export function buildPlumberStory(kit: StoryKit, resumeX: number, _unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  const base = new BaseSystems(kit, resumeX);
  return { intro: null, pieces: [base] };
}
