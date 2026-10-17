import { STORY } from '../config/story';
import { HunterDrone } from '../entities/bosses/HunterDrone';
import { CHAPTER_1 } from '../levels/chapter1';
import { IntroDirector } from '../scenes/level/IntroDirector';
import type { ChapterModule } from './types';

/** Chapter 1, Camp Crash: the pod, the first transformation, the Hunter-Killer drone. Its forest art is shared (the title uses it). */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_1,
  podIntro: (d) => new IntroDirector(d.scene, d.level, d.player, d.fx, d.time, d.speech, d.hooks, d.skip, d.skipOpening),
  bosses: { hunter: { music: 'boss', hologram: STORY.vilgaxLines, create: (scene, world, x) => new HunterDrone(scene, world, x) } },
  track: () => 'forest',
};
