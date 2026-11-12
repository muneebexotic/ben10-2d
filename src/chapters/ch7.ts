import { DeepmawBoss } from '../entities/bosses/deepmaw/DeepmawBoss';
import { EelBrain } from '../entities/enemies/deep/eel';
import { GnasherBrain } from '../entities/enemies/deep/gnasher';
import { GruntBrain } from '../entities/enemies/deep/grunt';
import { JellyBrain } from '../entities/enemies/deep/jelly';
import { WardenBrain } from '../entities/enemies/deep/warden';
import { CHAPTER_7 } from '../levels/chapter7';
import { PLUMBER_SEA } from '../levels/chapter7Decor';
import { enterPlumberBase, plumberArtRes } from '../scenes/level/plumber/presentation';
import { makeKorrPortrait } from '../scenes/preload/cartoon/plumber/korr';
import { PlumberBackdrop } from '../scenes/level/plumber/PlumberBackdrop';
import { startRigViewer } from '../scenes/level/plumber/RigViewer';
import { buildPlumberStory } from '../scenes/level/plumber/story';
import { makePlumberArt } from '../scenes/preload/cartoon/plumber/baseArt';
import { DEEP_ANIMS, DEEP_ASSETS } from '../scenes/preload/cartoon/plumber/deepSheets';
import { HD_SEA_OFFSET, HD_TILE_PAD, HD_TILES_KEY, makePlumberTiles } from '../scenes/preload/cartoon/plumber/tiles';
import { DEV_TOOLS } from '../systems/LaunchParams';
import { loadCutouts } from '../scenes/preload/cartoon/cutout/cutout';
import { BEN_FRAMES } from '../scenes/preload/cartoon/cutout/benFrames';
import { GWEN_FRAMES } from '../scenes/preload/cartoon/cutout/gwenFrames';
import { MAX_FRAMES } from '../scenes/preload/cartoon/cutout/maxFrames';
import { KEVIN_FRAMES } from '../scenes/preload/cartoon/cutout/kevinFrames';
import { RIPJAWS_FRAMES } from '../scenes/preload/cartoon/cutout/ripjawsFrames';
import { DEEPMAW_FRAMES } from '../scenes/preload/cartoon/cutout/deepmawFrames';
import { WARDEN_FRAMES } from '../scenes/preload/cartoon/cutout/wardenFrames';
import { GRUNT_FRAMES } from '../scenes/preload/cartoon/cutout/gruntFrames';
import { EEL_FRAMES } from '../scenes/preload/cartoon/cutout/eelFrames';
import { JELLY_FRAMES } from '../scenes/preload/cartoon/cutout/jellyFrames';
import { GNASHER_FRAMES } from '../scenes/preload/cartoon/cutout/gnasherFrames';
import { HEATBLAST_FRAMES } from '../scenes/preload/cartoon/cutout/heatblastFrames';
import { FOURARMS_FRAMES } from '../scenes/preload/cartoon/cutout/fourarmsFrames';
import { XLR8_FRAMES } from '../scenes/preload/cartoon/cutout/xlr8Frames';
import { WILDMUTT_FRAMES } from '../scenes/preload/cartoon/cutout/wildmuttFrames';
import { STINKFLY_FRAMES } from '../scenes/preload/cartoon/cutout/stinkflyFrames';
import { UPGRADE_FRAMES } from '../scenes/preload/cartoon/cutout/upgradeFrames';
import { DIAMONDHEAD_FRAMES } from '../scenes/preload/cartoon/cutout/diamondheadFrames';
import { GHOSTFREAK_FRAMES } from '../scenes/preload/cartoon/cutout/ghostfreakFrames';
import { GREYMATTER_FRAMES } from '../scenes/preload/cartoon/cutout/greymatterFrames';
import { KORR_FRAMES } from '../scenes/preload/cartoon/cutout/korrFrames';
import { KEVIN_POD_STILL, makeCameraFeed } from '../scenes/preload/cartoon/plumber/cameraFeed';
import { HUD_ICONS } from '../scenes/preload/cartoon/cutout/hudIcons';
import { HUD_PROPS } from '../scenes/preload/cartoon/cutout/hudProps';
import { FAMILY_PORTRAITS } from '../scenes/preload/cartoon/cutout/familyPortraits';
import { CH7_BEATS } from '../config/chapter7';
import { CH7_GWEN_CHATTER } from '../scenes/level/plumber/story/lines';
import type { ChapterModule } from './types';

/** Chapter 7, The Plumbers: the descent under Keamari harbour and the Plumber base on the floor of the Arabian Sea (HD). */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_7,
  // The cast frame by frame from their generated drawings (scripts/cutout/frames.py).
  prepare: () => loadCutouts([BEN_FRAMES, GWEN_FRAMES, MAX_FRAMES, KEVIN_FRAMES, RIPJAWS_FRAMES, DEEPMAW_FRAMES, WARDEN_FRAMES, GRUNT_FRAMES, EEL_FRAMES, JELLY_FRAMES, GNASHER_FRAMES, HEATBLAST_FRAMES, FOURARMS_FRAMES, XLR8_FRAMES, WILDMUTT_FRAMES, STINKFLY_FRAMES, UPGRADE_FRAMES, DIAMONDHEAD_FRAMES, GHOSTFREAK_FRAMES, GREYMATTER_FRAMES, KORR_FRAMES, KEVIN_POD_STILL, HUD_ICONS, HUD_PROPS, FAMILY_PORTRAITS]),
  enter: (scene) => {
    enterPlumberBase(scene);
    // The ending's hologram speaker.
    makeKorrPortrait(scene, plumberArtRes(scene.game));
    // And the surface camera's picture of Kevin's getaway.
    makeCameraFeed(scene, plumberArtRes(scene.game));
    const query = new URLSearchParams(window.location.search);
    if (DEV_TOOLS && query.has('rigview')) scene.time.delayedCall(50, () => startRigViewer(scene, query));
  },
  backdrop: (scene, level, world) => {
    const res = plumberArtRes(scene.game);
    makePlumberArt(scene, res);
    makePlumberTiles(scene, res);
    // Outside the hull the terrain is the sea floor's (sand over rock, coral ledges).
    world.useHdTiles(scene, HD_TILES_KEY, res, HD_TILE_PAD, (f, x) => (x >= PLUMBER_SEA.from && x < PLUMBER_SEA.to ? f + HD_SEA_OFFSET : f));
    return new PlumberBackdrop(scene, level, world);
  },
  story: buildPlumberStory,
  // Gwen walks with Ben through the docking ring (the story joins her, and takes her at the hub).
  gwen: { chatter: CH7_GWEN_CHATTER, runSpeed: CH7_BEATS.ring.gwenFollow },
  art: [{ assets: DEEP_ASSETS, anims: DEEP_ANIMS }],
  // The base's recording plays everywhere (the open sea and DEEPMAW's get their own when their recordings land).
  track: () => 'deep',
  // The music is the shared boss theme until Chapter 7's own tracks land.
  bosses: { deepmaw: { music: 'boss', hologram: [], create: (scene, world, x) => new DeepmawBoss(scene, world, x) } },
  brains: {
    warden: () => new WardenBrain(),
    grunt: () => new GruntBrain(),
    eel: () => new EelBrain(),
    jelly: () => new JellyBrain(),
    gnasher: () => new GnasherBrain(),
  },
};
