import type Phaser from 'phaser';
import type { StoryLine } from '../../config/story';
import type { TrackName } from '../../systems/audio/Music';
import type { ArenaBoss } from './ArenaBoss';
import type { BossWorld } from './HunterDrone';

/**
 * Everything an arena needs to stage a boss: its music, Vilgax's speech before
 * it, and the boss itself. Each chapter's chunk brings its own (`ChapterModule.bosses`).
 */
export interface BossKindDef {
  music: TrackName;
  /** Vilgax's speech before the fight (empty: the boss brings its own speaker, Dr. Animo). */
  hologram: readonly StoryLine[];
  /** Vilgax's portrait in the dialogue box (chapters that use portraits). */
  portrait?: string;
  create(scene: Phaser.Scene, world: BossWorld, x: number): ArenaBoss;
}
