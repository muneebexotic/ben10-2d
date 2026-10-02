import type { MotorStats } from '../systems/PlatformerMotor';
import type { Controls } from '../systems/InputMap';
import type { BurstKind } from '../systems/Fx';
import type { SfxName, SoundRecipe } from '../systems/audio/Sfx';
import type { MusicLayerSpec } from '../systems/audio/Music';
import type { Hit, HitKind, Rect } from '../entities/types';
import type { ProjectileKind } from '../entities/Projectiles';
import type { AnimDef, AssetDef } from '../scenes/preload/assetTypes';
import type { Capabilities } from '../levels/reachability';

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
  /** Standing on a water surface (only possible while the form can run on water). */
  readonly onWater: boolean;
  setVelocity(vx: number, vy: number): void;
  setVelocityX(vx: number): void;
  setVelocityY(vy: number): void;
  setFacing(dir: 1 | -1): void;
  /** Upward launch that is not a ground jump (rocket jump). */
  launch(vy: number, cuttable: boolean): void;
  squash(scaleX: number, scaleY: number): void;
  setInvulnerable(ms: number): void;
  /** Visual tint pulse on the sprite (e.g. glowing while charging). */
  glow(color: number, amount: number): void;
  /** Leaves a fading, tinted copy of the current sprite frame behind (speed afterimages). */
  afterimage(color: number, alpha: number, lifeMs: number): void;
}

/** A projectile an ability fires. `kind` picks the look; `hitKind` decides what it can damage. */
export interface ShotSpec {
  kind: ProjectileKind;
  speed: number;
  damage: number;
  lifetimeMs: number;
  radius: number;
  knockback: number;
  hitKind: HitKind;
  /** Pulls the shot down (lobbed goo). */
  gravity?: number;
  /** Gums up whatever it hits for this long. */
  slowMs?: number;
}

/** A shockwave that runs along the ground, hitting each target once. */
export interface WaveSpec {
  speed: number;
  lifeMs: number;
  damage: number;
  knockback: number;
  stunMs?: number;
  color: number;
}

/** Something an alien is holding over its head (a stunned drone, a boulder). */
export interface HeldObject {
  readonly height: number;
  /** Moves the object with its carrier every frame. */
  carry(x: number, bottomY: number, facing: 1 | -1): void;
}

export interface CombatApi {
  /** Instant melee hitbox. Returns how many targets were hit. */
  melee(area: Rect, hit: Hit): number;
  /**
   * Melee that hits each target at most once under `key` (a pounce raking
   * through a pack). Returns how many new targets were hit; `forget` resets it.
   */
  meleeOnce(area: Rect, hit: Hit, key: object): number;
  forget(key: object): void;
  /** Knocks enemy projectiles inside `area` back the way they came. Returns how many. */
  parry(area: Rect, facing: 1 | -1, speedMultiplier: number, damage: number): number;
  shoot(spec: ShotSpec, x: number, y: number, angleRad: number): void;
  /** Nudges an aim angle toward the best enemy inside a cone, so fire feels powerful without pixel-perfect aim. */
  aimAssist(x: number, y: number, angleRad: number, coneRad: number, range: number): number;
  /** Radial blast. Also destroys enemy projectiles when `clearsProjectiles`. */
  blast(x: number, y: number, radius: number, hit: Hit, clearsProjectiles: boolean): number;
  /** Tags every target inside `area` under `key` without hurting it yet. Returns how many were newly tagged. */
  mark(area: Rect, key: object): number;
  /** Centres of the live targets tagged under `key` (for effects before the strike). */
  markedPoints(key: object): Array<{ x: number; y: number }>;
  /** Hits every target tagged under `key` at once, then forgets them. `onEach` gets each target's centre. */
  strikeMarked(key: object, hit: Hit, onEach?: (x: number, y: number) => void): number;
  /** Sends a shockwave along the ground from (x, feetY) in direction `dir`. */
  groundWave(x: number, feetY: number, dir: 1 | -1, spec: WaveSpec, hitKind: HitKind): void;
  /** Picks up the nearest liftable thing inside `area` (stunned drones, boulders), or returns null. */
  lift(area: Rect): HeldObject | null;
  /** Throws a held object. It flies until it hits terrain or a target, then hits everything within `splash`. */
  hurl(obj: HeldObject, x: number, y: number, vx: number, vy: number, hit: Hit, splash: number): void;
  /**
   * A lingering stink cloud: every tick it hits whatever is inside with `hit`
   * (and keeps enemies too queasy to attack). Fire touching it sets it off.
   */
  gas(x: number, y: number, radius: number, lifeMs: number, hit: Hit): void;
}

export interface FxApi {
  burst(kind: BurstKind, x: number, y: number, count: number): void;
  trail(kind: BurstKind, x: number, y: number, count?: number): void;
  ring(x: number, y: number, color: number, radius: number, durationMs: number): void;
  flash(x: number, y: number, color: number, radius: number, durationMs: number): void;
  rays(x: number, y: number, color: number, radius: number, durationMs: number): void;
  light(x: number, y: number, radius: number, color: number, durationMs: number): void;
  frameLight(x: number, y: number, radius: number, color: number, intensity?: number): void;
  shake(intensity: number, durationMs?: number): void;
  hitStop(ms: number): void;
  slowMo(scale: number, durationMs: number, recoverMs?: number): void;
  /** Floating world-space text (e.g. "TOO SLOW!"). */
  popText(x: number, y: number, text: string, color: number): void;
  /** A thin streak that shoots away from (x, y) in direction `dir`: speed lines. */
  speedLine(x: number, y: number, dir: 1 | -1, color: number): void;
  /** A crack decal on the ground that fades out. `size` 0..1. */
  crack(x: number, feetY: number, size: number): void;
  /**
   * Freezes the world into a comic panel for `ms` (XLR8's multi-cut): speed
   * lines at (x, y), a slash across every target and an "X5 CUT!" caption.
   */
  comicFreeze(count: number, x: number, y: number, dir: 1 | -1, color: number, targets: ReadonlyArray<{ x: number; y: number }>, ms: number): void;
}

/** Read-only level queries for abilities that react to terrain. */
export interface WorldApi {
  isSolid(x: number, y: number): boolean;
  /** World y of the first surface at or below (x, y). */
  groundBelow(x: number, y: number): number;
}

export interface AbilityContext {
  readonly controls: Controls;
  readonly player: PlayerHandle;
  readonly combat: CombatApi;
  readonly fx: FxApi;
  readonly world: WorldApi;
  /** Plays a shared effect by name, or one of the alien's own sound recipes. */
  readonly sfx: (sound: SfxName | SoundRecipe, volume?: number, pitch?: number) => void;
  /** Gameplay time in ms (pauses with hit-stop). */
  readonly now: number;
  /** Controls are ignored during cutscenes or stun. */
  readonly inputEnabled: boolean;
  /** Tells the level an ability was used (tutorial prompts, stats). Any string; tips complete on them. */
  notify(action: AbilityAction): void;
}

/** Ability names reported to the level ('punch', 'fireball', 'dash'...). Open-ended so new aliens add their own. */
export type AbilityAction = string;

/** Per-form runtime state (cooldowns, charge). One instance per transformation. */
export interface FormAbilities {
  update(ctx: AbilityContext, dtMs: number): void;
  /** Jump pressed in mid-air. Return true if consumed. */
  tryAirJump?(ctx: AbilityContext): boolean;
  onEnter?(ctx: AbilityContext): void;
  onExit?(ctx: AbilityContext): void;
  /** `impact` is 0..1: landing speed as a fraction of the max fall speed. */
  onLand?(ctx: AbilityContext, impact: number): void;
  /** Each footstep while running on the ground. */
  onStep?(ctx: AbilityContext): void;
  /** A hit was avoided because the form was invulnerable (dodge, dash). */
  onDodge?(ctx: AbilityContext, source: 'shot' | 'contact'): void;
  /**
   * The Omnitrix swapped into this form mid-transformation: its entrance move.
   * Swapping is meant to be an attack, so every alien arrives with one.
   */
  onSwapIn?(ctx: AbilityContext): void;
  speedMultiplier?(): number;
  locksMovement?(): boolean;
  isInvulnerable?(): boolean;
  /** Animation suffix to play instead of the movement animation, or null. */
  animOverride?(): string | null;
  /** Max fall speed right now (glides, hovers, plunges), or null for the default. */
  maxFallSpeed?(ctx: AbilityContext): number | null;
  /** True while the form is fast enough to run across water. */
  canRunOnWater?(ctx: AbilityContext): boolean;
  /**
   * Gravity for this frame as a multiple of normal, replacing the jump curve
   * (0 while flying under power or clinging to a wall), or null for the default.
   */
  gravityScale?(ctx: AbilityContext): number | null;
  /** How far the form can sense hidden things right now (px), 0 for none. */
  senseRadius?(): number;
  /** A gauge shown by the form (flight stamina): 0..1 and its colour, or null when there's nothing to show. */
  meter?(): { value: number; color: number } | null;
}

/** How a form moves and reacts, beyond its motor stats. */
export interface FormFeel {
  stepMs: number;
  stepVolume: number;
  jumpPitch: number;
  /** Scales hurt knockback and stun: heavy aliens barely flinch. */
  knockbackScale: number;
  stunScale: number;
  /** Scales gravity for this form (heavier aliens fall harder). */
  gravityScale: number;
  /** Glowing forms (made of fire) render above the night lightmap. */
  emissive: boolean;
  /**
   * The form doesn't see like Ben does (Wildmutt has no eyes): the world's
   * light is scaled by `ambientScale` while it is out, and it carries a
   * soft light of its own, so whatever it senses stands out.
   */
  vision?: { ambientScale: number; light: { radius: number; color: number; intensity: number } };
}

/** How the alien's name slams onto the screen when it transforms. */
export type SlamStyle = 'blaze' | 'blur' | 'quake' | 'howl' | 'buzz' | 'plain';

export interface FormTheme {
  /** Main colour: name slam, transform ring, shield bar, dial while active. */
  color: number;
  light: number;
  dark: number;
  /** Signature particles (transform burst, swap-in). */
  burst: BurstKind;
  /** HUD label for the alien shield bar. */
  shieldLabel: string;
  slam: SlamStyle;
}

export interface FormTip {
  id: string;
  /** Uses control tokens ({J}, {K}, {UP}...). */
  text: string;
  ms: number;
  priority: number;
  /** The tip clears for good once this ability was used `count` times. */
  doneAfter?: { action: AbilityAction; count: number };
}

export interface FormTips {
  /** Shown the first time Ben becomes this alien in a run. */
  intro?: FormTip;
  /** Shown after a few kills in this form. */
  advanced?: FormTip & { afterKills: number };
}

export interface FormDefinition {
  id: string;
  name: string;
  kind: 'human' | 'alien';
  /** Chapter in which the Omnitrix unlocks this alien (0 for human Ben). */
  unlockChapter: number;
  texture: string;
  animPrefix: string;
  /** Frame size and the frame row the feet rest on, to align the sprite with the physics body. */
  frame: { w: number; h: number; feetY: number };
  motor: MotorStats;
  feel: FormFeel;
  /** Alien shield health; depleting it forces an early revert. 0 for human. */
  maxFormHealth: number;
  theme: FormTheme;
  hudIcon: string;
  /** Touch button icons for ATTACK and SPECIAL in this form. */
  touchIcons: { attack: string; special: string };
  quips: {
    transform: string[];
    /** The very first transformation of the game. */
    first?: string;
    revert: string[];
    /** Swapping into this alien mid-transformation. */
    swap?: string[];
    /**
     * Ben's reaction when the Omnitrix misfires and gives him THIS alien.
     * `wanted` is keyed by the alien he picked (one or more lines per pair);
     * `any` covers aliens added later that don't have a line yet.
     */
    misfire?: { wanted: Partial<Record<string, string[]>>; any: string[] };
  };
  tips: FormTips;
  /** The new-DNA card when the Omnitrix unlocks this alien in the story. */
  unlock?: { tagline: string; traits: readonly [string, string] };
  /** Move list for the pause screen, with control tokens ("{J} FIREBALL"). */
  moves: string[];
  audio: {
    /** Signature sound layered on the transformation boom. */
    transform?: SoundRecipe;
    /** Hero music layer while this form is active (null: the track's default layer). */
    music: MusicLayerSpec | null;
  };
  /** Textures and animations this form brings. Preload loads them with everything else. */
  art: { assets: AssetDef[]; anims: AnimDef[] };
  /** Coarse movement envelope for level reachability tests. */
  reach: Capabilities;
  createAbilities(): FormAbilities;
}
