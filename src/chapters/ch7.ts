import { DeepmawBoss } from '../entities/bosses/deepmaw/DeepmawBoss';
import { EelBrain } from '../entities/enemies/deep/eel';
import { GnasherBrain } from '../entities/enemies/deep/gnasher';
import { GruntBrain } from '../entities/enemies/deep/grunt';
import { JellyBrain } from '../entities/enemies/deep/jelly';
import { WardenBrain } from '../entities/enemies/deep/warden';
import { CHAPTER_7 } from '../levels/chapter7';
import { PLUMBER_SEA } from '../levels/chapter7Decor';
import { enterPlumberBase, plumberArtRes } from '../scenes/level/plumber/presentation';
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
import { CH7_BEATS } from '../config/chapter7';
import { CH7_GWEN_CHATTER } from '../scenes/level/plumber/story/lines';
import type { ChapterModule } from './types';

/** Chapter 7, The Plumbers: the descent under Keamari harbour and the Plumber base on the floor of the Arabian Sea (HD). */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_7,
  // The cast frame by frame from their generated drawings (scripts/cutout/frames.py).
  prepare: () => loadCutouts([BEN_FRAMES, GWEN_FRAMES, MAX_FRAMES, KEVIN_FRAMES]),
  enter: (scene) => {
    enterPlumberBase(scene);
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
