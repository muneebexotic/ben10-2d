import type Phaser from 'phaser';
import { STORY, type StoryLine } from '../../config/story';
import type { BossKind } from '../../levels/types';
import { TEX } from '../../scenes/preload/assetKeys';
import type { TrackName } from '../../systems/audio/Music';
import type { ArenaBoss } from './ArenaBoss';
import { HunterDrone, type BossWorld } from './HunterDrone';
import { Roadbreaker } from './roadbreaker/Roadbreaker';

/** Everything an arena needs to stage a boss: its music, Vilgax's speech before it, and the boss itself. */
export interface BossKindDef {
  music: TrackName;
  hologram: readonly StoryLine[];
  /** Vilgax's portrait in the dialogue box (chapters that use portraits). */
  portrait?: string;
  create(scene: Phaser.Scene, world: BossWorld, x: number): ArenaBoss;
}

export const BOSS_KINDS: Record<BossKind, BossKindDef> = {
  hunter: { music: 'boss', hologram: STORY.vilgaxLines, create: (scene, world, x) => new HunterDrone(scene, world, x) },
  roadbreaker: {
    music: 'roadbreaker',
    hologram: STORY.vilgaxLinesRoadTrip,
    portrait: TEX.portraitVilgax,
    create: (scene, world, x) => new Roadbreaker(scene, world, x),
  },
};
