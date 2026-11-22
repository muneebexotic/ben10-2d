import type { ChapterStory } from '../../../../chapters/types';
import type { StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { CircusSystems } from '../CircusSystems';

/** Chapter 8's story: the circus's toys and traps, and its set pieces in play order. */
export function buildCircusStory(kit: StoryKit, _resumeX: number, _unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory {
  const systems = new CircusSystems(kit);
  return { intro: null, pieces: [systems] };
}
