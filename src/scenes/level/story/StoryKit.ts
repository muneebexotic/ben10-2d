import type Phaser from 'phaser';
import type { Player } from '../../../entities/Player';
import type { Projectiles } from '../../../entities/Projectiles';
import type { Drone, DroneWorld } from '../../../entities/enemies/Drone';
import type { Telegraphs } from '../../../entities/enemies/Telegraphs';
import type { DroneKind, LevelData } from '../../../levels/types';
import type { Fx } from '../../../systems/Fx';
import type { Controls } from '../../../systems/InputMap';
import type { Lighting } from '../../../systems/Lighting';
import type { TimeController } from '../../../systems/TimeController';
import type { TrackName } from '../../../systems/audio/Music';
import type { SpeechBubble } from '../../../ui/SpeechBubble';
import type { CameraRig } from '../CameraRig';
import type { Combat } from '../Combat';
import type { HighwayBackdrop } from '../HighwayBackdrop';
import type { LevelWorld } from '../LevelWorld';
import type { OmnitrixController } from '../OmnitrixController';
import type { Tutorial } from '../Tutorial';
import type { Dialogue } from './Dialogue';

/**
 * A chapter's scripted moment (the opening drive, an alien unlocking, the
 * Rustbucket chase). The level updates it every frame and reads its flags.
 */
export interface SetPiece {
  update(dtMs: number, realDtMs: number, controls: Controls): void;
  /** Holds the run timer (and opens no pause menu: the pause button skips instead). */
  readonly cinematic: boolean;
  /** The watch has to behave: no misfires while this is true. */
  readonly storyLock: boolean;
  destroy(): void;
}

/** Everything a set piece may touch. Built by the level; set pieces never reach into LevelScene. */
export interface StoryKit {
  scene: Phaser.Scene;
  level: LevelData;
  world: LevelWorld;
  player: Player;
  fx: Fx;
  lighting: Lighting;
  time: TimeController;
  telegraph: Telegraphs;
  projectiles: Projectiles;
  combat: Combat;
  camera: CameraRig;
  speech: SpeechBubble;
  dialogue: Dialogue;
  tutorial: Tutorial;
  omni: OmnitrixController;
  droneWorld: DroneWorld;
  backdrop: HighwayBackdrop | null;
  /** Game time (pauses with hit-stop). */
  now(): number;
  /** The checkpoint this attempt started at (null: a fresh start). */
  readonly startCheckpoint: string | null;
  /** This attempt is a retry or a continue (the run's stats came along): skip what was already seen. */
  readonly continuing: boolean;
  /** Puts an alien on the dial for good: the file saves it, the HUD shows it. */
  unlockAlien(id: string): void;
  /** On the dial right now. */
  hasAlien(id: string): boolean;
  /** A drone that joins the fight now. `roam`: free of its spawn leash (it follows the action). */
  spawnDrone(kind: DroneKind, x: number, y: number, opts?: { roam?: boolean; delayMs?: number }): Drone;
  /** Lights a (hidden) checkpoint: split, save point, banner. */
  reachCheckpoint(id: string): void;
  playMusic(track: TrackName): void;
  /** The HUD (and touch controls) show or hide; the Omnitrix dial with it. */
  setHud(visible: boolean): void;
  setLetterbox(visible: boolean): void;
  /** Ben fell somewhere he can't be (off the Rustbucket): hurt and put back at `x`, `feetY`. */
  rescue(x: number, feetY: number): void;
}
