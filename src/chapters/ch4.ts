import { Kevin } from '../entities/bosses/kevin/Kevin';
import { CHAPTER_4 } from '../levels/chapter4';
import { ArcadeScene } from '../scenes/ArcadeScene';
import { CityBackdrop } from '../scenes/level/CityBackdrop';
import { buildKevinStory } from '../scenes/level/story/kevin';
import { CH4_ART } from '../scenes/preload/art/ch4';
import { SCENES } from '../scenes/SceneKeys';
import { ARCADE, KEVIN, SUBWAY } from '../systems/audio/tracks/city';
import type { ChapterModule } from './types';

/** Chapter 4, Kevin 11: downtown, the GAME ZONE, Line 11, the turn, KEVIN 11. */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_4,
  art: [CH4_ART],
  backdrop: (scene, level) => new CityBackdrop(scene, level),
  story: buildKevinStory,
  bosses: { kevin: { music: 'kevin', hologram: [], create: (scene, world, x) => new Kevin(scene, world, x) } },
  tracks: { arcade: ARCADE, subway: SUBWAY, kevin: KEVIN },
  // Past the drain the station is dead: the subway track.
  track: (x) => ((x ?? 0) >= (CHAPTER_4.story?.drain?.fromX ?? Infinity) ? 'subway' : 'arcade'),
  scenes: [{ key: SCENES.arcade, scene: ArcadeScene }],
};
