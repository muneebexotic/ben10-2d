import type Phaser from 'phaser';
import type { DamageOutcome, Player } from '../../../entities/Player';
import type { Projectiles } from '../../../entities/Projectiles';
import type { Drone, DroneWorld } from '../../../entities/enemies/Drone';
import type { Machine } from '../../../entities/tech/Machine';
import type { Telegraphs } from '../../../entities/enemies/Telegraphs';
import type { EnemyKind, LevelData } from '../../../levels/types';
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
  spawnDrone(kind: EnemyKind, x: number, y: number, opts?: { roam?: boolean; delayMs?: number }): Drone;
  /** Lights a (hidden) checkpoint: split, save point, banner. */
  reachCheckpoint(id: string): void;
  playMusic(track: TrackName): void;
  /** The HUD (and touch controls) show or hide; the Omnitrix dial with it. */
  setHud(visible: boolean): void;
  setLetterbox(visible: boolean): void;
  /** Ben fell somewhere he can't be (off the Rustbucket): hurt and put back at `x`, `feetY`. */
  rescue(x: number, feetY: number): void;
  /** Report damage a set piece dealt Ben directly (combo break, HUD, death). */
  onPlayerHurt(outcome: DamageOutcome): void;
  /** An enemy that isn't a drone went down (a convoy truck): stats, improvise bonus, tips. */
  onEnemyKilled(): void;
  /** An attack lands at game time `at` (a perfect transform window); cancel when it won't. */
  threat(key: object, at: number): void;
  cancelThreat(key: object): void;
  /** The lights are out between these world x positions (null: back on). */
  setDarkness(zone: { fromX: number; toX: number } | null): void;
  /** Solid tiles in this rect (tiles) crumble away for good (a collapsing floor). */
  collapse(rect: { x: number; y: number; w: number; h: number }): void;
  /** A machine from the level data by id (a door, a turret), if the level has machines. */
  machine(id: string): Machine | undefined;
  /** Lamps, signs and screens between these x positions (px) go dark for good. */
  powerOff(fromX: number, toX: number): void;
  /** The subway's trains run (or stop: the third rail is dead). */
  setTrains(running: boolean): void;
  /** The closest live enemy within `range` of (x, y), or null. */
  nearestEnemy(x: number, y: number, range: number): { x: number; y: number } | null;
}
