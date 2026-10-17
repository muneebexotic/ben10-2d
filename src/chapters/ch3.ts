import { Frog } from '../entities/bosses/frog/Frog';
import { CHAPTER_3 } from '../levels/chapter3';
import { MuseumBackdrop } from '../scenes/level/MuseumBackdrop';
import { buildMuseumStory } from '../scenes/level/story/museum';
import { CH3_ART } from '../scenes/preload/art/ch3';
import { ANIMO, MUSEUM } from '../systems/audio/tracks/museum';
import type { ChapterModule } from './types';

/** Chapter 3, Dr. Animo: the museum at night, the blackout, the atrium, KING CROAK. */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_3,
  art: [CH3_ART],
  backdrop: (scene, level) => new MuseumBackdrop(scene, level),
  story: buildMuseumStory,
  bosses: { frog: { music: 'animo', hologram: [], create: (scene, world, x) => new Frog(scene, world, x) } },
  tracks: { museum: MUSEUM, animo: ANIMO },
  track: () => 'museum',
};
