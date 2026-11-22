import { CHAPTER_8 } from '../levels/chapter8';
import { CacklejackBoss } from '../entities/bosses/cacklejack/CacklejackBoss';
import { GrinnerBrain, HoundBrain, JackboxBrain, ReflectionBrain, StiltsBrain } from '../entities/enemies/circus/goons';
import { CircusBackdrop } from '../scenes/level/circus/CircusBackdrop';
import { circusArtRes, enterCircus } from '../scenes/level/circus/presentation';
import { buildCircusStory } from '../scenes/level/circus/story';
import { makeCircusArt } from '../scenes/preload/cartoon/circus/circusArt';
import { CIRCUS_ANIMS, CIRCUS_ASSETS } from '../scenes/preload/cartoon/circus/circusSheets';
import { CIRCUS_INDOOR_OFFSET, CIRCUS_TILE_PAD, CIRCUS_TILES_KEY, makeCircusTiles } from '../scenes/preload/cartoon/circus/tiles';
import { CIRCUS_OUTDOORS } from '../levels/chapter8';
import { loadCutouts } from '../scenes/preload/cartoon/cutout/cutout';
import { BEN_FRAMES } from '../scenes/preload/cartoon/cutout/benFrames';
import { GWEN_FRAMES } from '../scenes/preload/cartoon/cutout/gwenFrames';
import { MAX_FRAMES } from '../scenes/preload/cartoon/cutout/maxFrames';
import { HEATBLAST_FRAMES } from '../scenes/preload/cartoon/cutout/heatblastFrames';
import { FOURARMS_FRAMES } from '../scenes/preload/cartoon/cutout/fourarmsFrames';
import { XLR8_FRAMES } from '../scenes/preload/cartoon/cutout/xlr8Frames';
import { WILDMUTT_FRAMES } from '../scenes/preload/cartoon/cutout/wildmuttFrames';
import { STINKFLY_FRAMES } from '../scenes/preload/cartoon/cutout/stinkflyFrames';
import { UPGRADE_FRAMES } from '../scenes/preload/cartoon/cutout/upgradeFrames';
import { DIAMONDHEAD_FRAMES } from '../scenes/preload/cartoon/cutout/diamondheadFrames';
import { GHOSTFREAK_FRAMES } from '../scenes/preload/cartoon/cutout/ghostfreakFrames';
import { GREYMATTER_FRAMES } from '../scenes/preload/cartoon/cutout/greymatterFrames';
import { RIPJAWS_FRAMES } from '../scenes/preload/cartoon/cutout/ripjawsFrames';
import { HUD_ICONS } from '../scenes/preload/cartoon/cutout/hudIcons';
import { HUD_PROPS } from '../scenes/preload/cartoon/cutout/hudProps';
import { FAMILY_PORTRAITS } from '../scenes/preload/cartoon/cutout/familyPortraits';
import { CH8_BEATS } from '../config/chapter8';
import { CH8_GWEN_CHATTER } from '../scenes/level/circus/story/lines';
import { ENGINE, FAIR } from '../systems/audio/tracks/karachi';
import type { ChapterModule } from './types';

const indoors = (x: number): boolean => !CIRCUS_OUTDOORS.some((o) => x >= o.from && x < o.to);

/** Chapter 8, Cacklejack: the circus on Driftwood Bay's pier (HD). */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_8,
  // The family and the older aliens frame by frame from the owner's drawings; Chapter 8's own cast is painted in code.
  prepare: () => loadCutouts([BEN_FRAMES, GWEN_FRAMES, MAX_FRAMES, HEATBLAST_FRAMES, FOURARMS_FRAMES, XLR8_FRAMES, WILDMUTT_FRAMES, STINKFLY_FRAMES, UPGRADE_FRAMES, DIAMONDHEAD_FRAMES, GHOSTFREAK_FRAMES, GREYMATTER_FRAMES, RIPJAWS_FRAMES, HUD_ICONS, HUD_PROPS, FAMILY_PORTRAITS]),
  // The HD look, with the ringmaster's, his acts' and the watch's whisper's portraits painted from their rigs.
  enter: (scene) => {
    enterCircus(scene);
  },
  backdrop: (scene, level, world) => {
    const res = circusArtRes(scene.game);
    makeCircusArt(scene, res);
    makeCircusTiles(scene, res);
    // Indoors (the funhouse, the maze, the big top) the terrain is checks and harlequin walls; outside, the boardwalk's planks.
    world.useHdTiles(scene, CIRCUS_TILES_KEY, res, CIRCUS_TILE_PAD, (f, x) => (indoors(x) ? f + CIRCUS_INDOOR_OFFSET : f));
    return new CircusBackdrop(scene, level, world);
  },
  story: buildCircusStory,
  // Gwen walks with Ben through the midway and, once she's out of the mirror, to the end.
  gwen: { chatter: CH8_GWEN_CHATTER, runSpeed: CH8_BEATS.gwenFollow },
  art: [{ assets: CIRCUS_ASSETS, anims: CIRCUS_ANIMS }],
  // Until the owner's recordings arrive (midway, bigtop, cacklejack: config/music.ts), the fair's calliope outside and the clockwork inside.
  tracks: { fair: FAIR, engine: ENGINE },
  track: (tileX) => (tileX !== null && tileX >= CH8_BEATS.indoorMusicFrom ? 'engine' : 'fair'),
  bosses: { cacklejack: { music: 'boss', hologram: [], create: (scene, world, x) => new CacklejackBoss(scene, world, x) } },
  brains: {
    grinner: () => new GrinnerBrain(),
    jackbox: () => new JackboxBrain(),
    hound: () => new HoundBrain(),
    stilts: () => new StiltsBrain(),
    reflection: () => new ReflectionBrain(),
  },
};
