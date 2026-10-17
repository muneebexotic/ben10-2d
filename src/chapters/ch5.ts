import { Hunters } from '../entities/bosses/hunters/Hunters';
import { CrabbotBrain } from '../entities/enemies/bounty/crabbot';
import { SentryBrain } from '../entities/enemies/bounty/sentry';
import { TrackerBrain } from '../entities/enemies/bounty/tracker';
import { CHAPTER_5 } from '../levels/chapter5';
import type { AmbientKind } from '../levels/types';
import { DiveScene } from '../scenes/DiveScene';
import { WesternBackdrop } from '../scenes/level/WesternBackdrop';
import { buildBountyStory } from '../scenes/level/story/bounty';
import { huntWorld } from '../scenes/level/story/bounty/huntWorld';
import { CH5_ANIMS, CH5_ASSETS, SIXSIX_ANIMS, SIXSIX_ASSETS } from '../scenes/preload/bounty';
import { LAZY_ART } from '../scenes/preload/catalog';
import { SCENES } from '../scenes/SceneKeys';
import { DIVE, GHOSTTOWN, HUNTERS, MINE } from '../systems/audio/tracks/bounty';
import type { ChapterArt, ChapterModule } from './types';

/** Sixsix: Chapter Select's window for Chapter 5 shows him. */
const SIXSIX_ART: ChapterArt = { assets: SIXSIX_ASSETS, anims: SIXSIX_ANIMS };

/** Ambient zones under the open sky (the tumbleweeds blow only there). */
const OUTDOORS: readonly AmbientKind[] = ['ghosttown', 'minehead'];

/** Chapter 5, Bounty Hunters: Silver Spur, the Diamond Deep, THE DEEP DIVE, THE HUNTERS. */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_5,
  // Every form's back view comes along: only THE DEEP DIVE draws them.
  art: [{ assets: CH5_ASSETS, anims: CH5_ANIMS }, SIXSIX_ART, LAZY_ART.rideBacks],
  windowArt: SIXSIX_ART,
  backdrop: (scene, level, world) =>
    new WesternBackdrop(scene, level, (x) => OUTDOORS.includes(world.ambientAt(x)), (x, y) => world.groundBelow(x, y)),
  story: buildBountyStory,
  brains: { tracker: () => new TrackerBrain(), crabbot: () => new CrabbotBrain(), sentry: () => new SentryBrain() },
  bosses: { hunters: { music: 'hunters', hologram: [], create: (scene, world, x) => new Hunters(scene, world, x) } },
  arena: (kit) => ({ hunt: huntWorld(kit) }),
  tracks: { ghosttown: GHOSTTOWN, mine: MINE, hunters: HUNTERS, dive: DIVE },
  track: (x) => ((x ?? 0) >= (CHAPTER_5.story?.bounty?.kraabHunt.fromX ?? Infinity) ? 'mine' : 'ghosttown'),
  // The ride draws over the level and under the HUD.
  scenes: [{ key: SCENES.dive, scene: DiveScene, below: SCENES.ui }],
};
