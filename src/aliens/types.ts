import type { MotorStats } from '../systems/PlatformerMotor';
import type { Controls } from '../systems/InputMap';
import type { BurstKind } from '../systems/Fx';
import type { SfxName } from '../systems/audio/Sfx';
import type { Hit, Rect } from '../entities/types';

/**
 * What an ability can see and do. Abilities never touch Phaser directly, so a
 * new alien is just a config object plus these functions.
 */
export interface PlayerHandle {
  readonly x: number;
  /** Feet position. */
  readonly y: number;
  readonly centerY: number;
  readonly facing: 1 | -1;
  readonly vx: number;
  readonly vy: number;
  readonly grounded: boolean;
  setVelocity(vx: number, vy: number): void;
  setVelocityX(vx: number): void;
  setVelocityY(vy: number): void;
  /** Upward launch that is not a ground jump (rocket jump). */
  launch(vy: number, cuttable: boolean): void;
  squash(scaleX: number, scaleY: number): void;
  setInvulnerable(ms: number): void;
  /** Visual tint pulse on the sprite (e.g. glowing while charging). */
  glow(color: number, amount: number): void;
}

export interface CombatApi {
  /** Instant melee hitbox. Returns how many targets were hit. */
  melee(area: Rect, hit: Hit): number;
  /** Knocks enemy projectiles inside `area` back the way they came. Returns how many. */
  parry(area: Rect, facing: 1 | -1): number;
  fireball(x: number, y: number, angleRad: number): void;
  /** Nudges an aim angle toward the best enemy inside a cone, so fire feels powerful without pixel-perfect aim. */
  aimAssist(x: number, y: number, angleRad: number, coneRad: number, range: number): number;
  /** Radial blast. Also destroys enemy projectiles when `clearsProjectiles`. */
  blast(x: number, y: number, radius: number, hit: Hit, clearsProjectiles: boolean): number;
}

export interface FxApi {
  burst(kind: BurstKind, x: number, y: number, count: number): void;
  trail(kind: BurstKind, x: number, y: number, count?: number): void;
  ring(x: number, y: number, color: number, radius: number, durationMs: number): void;
  flash(x: number, y: number, color: number, radius: number, durationMs: number): void;
  light(x: number, y: number, radius: number, color: number, durationMs: number): void;
  frameLight(x: number, y: number, radius: number, color: number, intensity?: number): void;
  shake(intensity: number, durationMs?: number): void;
  hitStop(ms: number): void;
}

export interface AbilityContext {
  readonly controls: Controls;
  readonly player: PlayerHandle;
  readonly combat: CombatApi;
  readonly fx: FxApi;
  readonly sfx: (name: SfxName, volume?: number, pitch?: number) => void;
  /** Gameplay time in ms (pauses with hit-stop). */
  readonly now: number;
  /** Controls are ignored during cutscenes or stun. */
  readonly inputEnabled: boolean;
  /** Tells the level an ability was used (tutorial prompts, stats). */
  notify(action: AbilityAction): void;
}

export type AbilityAction = 'punch' | 'roll' | 'parry' | 'fireball' | 'burst' | 'rocket';

/** Per-form runtime state (cooldowns, charge). One instance per transformation. */
export interface FormAbilities {
  update(ctx: AbilityContext, dtMs: number): void;
  /** Jump pressed in mid-air. Return true if consumed. */
  tryAirJump?(ctx: AbilityContext): boolean;
  onEnter?(ctx: AbilityContext): void;
  onExit?(ctx: AbilityContext): void;
  onLand?(ctx: AbilityContext): void;
  speedMultiplier?(): number;
  locksMovement?(): boolean;
  isInvulnerable?(): boolean;
  /** Animation suffix to play instead of the movement animation, or null. */
  animOverride?(): string | null;
  /** Max fall speed while gliding, or null for none. */
  glideMaxFall?(ctx: AbilityContext): number | null;
}

export interface FormDefinition {
  id: string;
  name: string;
  kind: 'human' | 'alien';
  /** Chapter in which the Omnitrix unlocks this alien (0 for human Ben). */
  unlockChapter: number;
  texture: string;
  animPrefix: string;
  /** Frame height and the frame row the feet rest on, to align the sprite with the physics body. */
  frame: { w: number; h: number; feetY: number };
  motor: MotorStats;
  /** Alien shield health; depleting it forces an early revert. 0 for human. */
  maxFormHealth: number;
  light: { radius: number; color: number };
  /** Colour used for HUD accents, transform flashes and name banners. */
  color: number;
  hudIcon: string;
  quips: { transform: string[]; revert: string[] };
  createAbilities(): FormAbilities;
}
