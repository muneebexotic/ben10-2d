import type Phaser from 'phaser';
import type { BossKindDef } from '../entities/bosses/bossKinds';
import type { BossKind, EnemyKind, LevelData } from '../levels/types';
import type { DroneBrain } from '../entities/enemies/Drone';
import type { AnimDef, AssetDef } from '../scenes/preload/assetTypes';
import type { Track } from '../systems/audio/musicKit';
import type { TrackName } from '../systems/audio/Music';
import type { SetPiece, StoryKit } from '../scenes/level/story/StoryKit';
import type { UnlockBeat } from '../scenes/level/story/UnlockBeat';
import type { LevelWorld } from '../scenes/level/LevelWorld';
import type { IntroDirector, IntroHooks } from '../scenes/level/IntroDirector';
import type { Player } from '../entities/Player';
import type { Fx } from '../systems/Fx';
import type { TimeController } from '../systems/TimeController';
import type { SpeechBubble } from '../ui/SpeechBubble';
import type { ArenaDeps } from '../scenes/level/BossArena';

/** What draws behind a level (the sky and its parallax layers). */
export interface Backdrop {
  update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void;
}

/** A chapter's opening set piece (it holds misfires off until it's done). */
export interface StoryIntro extends SetPiece {
  readonly done: boolean;
}

/** A chapter's set pieces: `pieces` update before the shared ones (unlock beats, waves, hints), `after` after them. */
export interface ChapterStory {
  intro: StoryIntro | null;
  pieces: SetPiece[];
  after?: SetPiece[];
}

/**
 * The scene that closes an act, before ACT COMPLETE: ActEndScene plays it in
 * its own scene (Act 1's, Kevin at the arcade, is built in).
 */
export interface Cliffhanger {
  /** Advances it (real ms); true once it has finished. */
  update(dtMs: number): boolean;
  /** A key or a tap: on to its next part. True when there's nothing left to skip to. */
  skip(): boolean;
  /** Everything it drew (dimmed behind the title smash). */
  readonly stage: Phaser.GameObjects.Container;
  /** The title smash after it. */
  readonly title: { text: string; color: number };
  /** Draws the ACT COMPLETE screen's backdrop (behind the stamp) and returns its per-frame update. */
  finale(): (dtMs: number) => void;
}

/** Art a chapter makes when it loads (not at boot). */
export interface ChapterArt {
  assets: readonly AssetDef[];
  anims: readonly AnimDef[];
}

/**
 * One chapter's own code, in its own chunk (docs/PERFORMANCE.md, "Loading"):
 * its level, story, bosses, backdrop, art, music and any scenes only it uses.
 * `chapters/registry.ts` loads it (behind the level fade) before the level starts.
 */
export interface ChapterModule {
  level: LevelData;
  /**
   * An HD chapter's look (Act 3): called first thing in the level's create, before anything is
   * made (render scale, HD textures, rigs). Chapters without it are pixel art.
   */
  enter?(scene: Phaser.Scene): void;
  /** Generated the first time the chapter loads (its own art, plus any shared art only it draws). */
  art?: readonly ChapterArt[];
  /** The part of its art Chapter Select's window shows (made when the window opens, not the whole chapter). */
  windowArt?: ChapterArt;
  backdrop?(scene: Phaser.Scene, level: LevelData, world: LevelWorld): Backdrop;
  story?(kit: StoryKit, resumeX: number, unlockBeats: ReadonlyMap<string, UnlockBeat>): ChapterStory;
  bosses?: Partial<Record<BossKind, BossKindDef>>;
  /** Enemies only this chapter has (their brains join `createBrain` when it loads). */
  brains?: Partial<Record<EnemyKind, (opts: { ceiling?: boolean }) => DroneBrain>>;
  tracks?: Partial<Record<TrackName, Track>>;
  /** The level's music when play starts at tile `resumeTileX` (null: from the start). */
  track?(resumeTileX: number | null): TrackName;
  /** Chapter 1's opening: the pod in the woods and the first transformation. */
  podIntro?(deps: PodIntroDeps): IntroDirector;
  /** Level hooks this chapter's boss needs beyond the arena (THE HUNTERS move through the level). */
  arena?(kit: StoryKit): Pick<ArenaDeps, 'hunt'>;
  /** Gwen walks with Ben in this chapter (the story says when she joins): her own banter. */
  gwen?: { chatter?: readonly string[] };
  /** The act's closing scene, when this chapter ends an act (after its results, on the first clear). */
  cliffhanger?(scene: Phaser.Scene): Cliffhanger;
  /** Scenes only this chapter uses (the SUMO SLAMMERS cabinet, THE DEEP DIVE). */
  scenes?: ReadonlyArray<{ key: string; scene: new () => Phaser.Scene; /** Drawn just under this scene (default: on top of everything). */ below?: string }>;
}

/** What Chapter 1's pod opening is built from. */
export interface PodIntroDeps {
  scene: Phaser.Scene;
  level: LevelData;
  player: Player;
  fx: Fx;
  time: TimeController;
  speech: SpeechBubble;
  hooks: IntroHooks;
  /** A restart (the opening already played). */
  skip: boolean;
  /** A continue: skip the cutscene too. */
  skipOpening: boolean;
}
