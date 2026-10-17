import { STORY } from '../config/story';
import { Roadbreaker } from '../entities/bosses/roadbreaker/Roadbreaker';
import { CHAPTER_2 } from '../levels/chapter2';
import { HighwayBackdrop } from '../scenes/level/HighwayBackdrop';
import { buildRoadStory } from '../scenes/level/story/road';
import { TEX } from '../scenes/preload/assetKeys';
import { CH2_ART } from '../scenes/preload/art/ch2';
import { CHASE, HIGHWAY, ROADBREAKER } from '../systems/audio/tracks/road';
import type { ChapterModule } from './types';

/** Chapter 2, Road Trip: the desert highway, the Rustbucket chase, ROADBREAKER. */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_2,
  art: [CH2_ART],
  backdrop: (scene, level) => new HighwayBackdrop(scene, level.sky ?? []),
  story: buildRoadStory,
  bosses: {
    roadbreaker: { music: 'roadbreaker', hologram: STORY.vilgaxLinesRoadTrip, portrait: TEX.portraitVilgax, create: (scene, world, x) => new Roadbreaker(scene, world, x) },
  },
  tracks: { highway: HIGHWAY, chase: CHASE, roadbreaker: ROADBREAKER },
  track: () => 'highway',
};
