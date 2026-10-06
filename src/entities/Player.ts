import Phaser from 'phaser';
import { PHYSICS, FX } from '../config/constants';
import { PALETTE } from '../config/palette';
import { PLAYER } from '../config/player';
import type {
  AbilityAction,
  AbilityContext,
  CombatApi,
  FormAbilities,
  FormDefinition,
  FxApi,
  PlayerHandle,
  WorldApi,
} from '../aliens/types';
import { HUMAN_FORM } from '../aliens/registry';
import { emptyControls, type Controls } from '../systems/InputMap';
import {
  consumeJumpBuffer,
  createMotorState,
  gravityScale,
  markLaunched,
  stepMotor,
  type MotorState,
} from '../systems/PlatformerMotor';
import { playSfx, type SfxName, type SoundRecipe } from '../systems/audio/Sfx';
import { PlayerVisual } from './PlayerVisual';
import type { Rect } from './types';

export interface PlayerServices {
  combat: CombatApi;
  fx: FxApi;
  world: WorldApi;
  notify(action: AbilityAction): void;
  damageMultiplier: number;
}

export interface DamageOutcome {
  applied: boolean;
  amount: number;
  formBroken: boolean;
  died: boolean;
}

const NO_DAMAGE: DamageOutcome = { applied: false, amount: 0, formBroken: false, died: false };
const GRAVITY_TUNING = {
  fallMultiplier: PLAYER.fallGravityMultiplier,
  apexMultiplier: PLAYER.apexGravityMultiplier,
  apexThreshold: PLAYER.apexThreshold,
};

/**
 * Ben. Owns an Arcade physics body (a Zone) and a separate visual sprite.
 * Behaviour per form comes from the FormDefinition's abilities.
 */
export class Player implements PlayerHandle {
  readonly zone: Phaser.GameObjects.Zone;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly visual: PlayerVisual;
  form: FormDefinition = HUMAN_FORM;
  private abilities: FormAbilities;
  hp: number = PLAYER.maxHealth;
  readonly maxHp: number = PLAYER.maxHealth;
  formHp = 0;
  facing: 1 | -1 = 1;
  hasWatch = false;
  controlsEnabled = true;
  dead = false;
  now = 0;
  /** Cutscene auto-walk direction; overrides input when set. */
  scriptedMove: -1 | 0 | 1 | null = null;
  dropThroughUntil = 0;
  readonly lastSafe = { x: 0, y: 0 };

  private readonly motor: MotorState = createMotorState();
  private invulnUntil = 0;
  private stunUntil = 0;
  private wasGrounded = false;
  private fallSpeed = 0;
  private deathY = 0;
  private deathVy = 0;
  private safeTimer = 0;
  private stepTimer = 0;
  private onWaterLast = false;
  private controls: Controls = emptyControls();
  private readonly idleControls = emptyControls();
  private readonly ctx: AbilityContext;

  constructor(
    scene: Phaser.Scene,
    x: number,
    feetY: number,
    private readonly services: PlayerServices,
  ) {
    const { width, height } = PLAYER.body;
    this.zone = scene.add.zone(x, feetY - height / 2, width, height);
    scene.physics.add.existing(this.zone);
    this.body = this.zone.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(PLAYER.maxFallSpeed + 200);
    this.visual = new PlayerVisual(scene, x, feetY, this.form, 'bennw');
    this.abilities = this.form.createAbilities();
    this.lastSafe.x = x;
    this.lastSafe.y = feetY;

    const self = this;
    this.ctx = {
      get controls() {
        return self.controls;
      },
      player: this,
      combat: services.combat,
      fx: services.fx,
      world: services.world,
      sfx: (sound: SfxName | SoundRecipe, v?: number, p?: number) => playSfx(sound, v, p),
      get now() {
        return self.now;
      },
      get inputEnabled() {
        return self.inputEnabled;
      },
      notify: (a) => services.notify(a),
    };
  }

  // ------------------------------------------------------------ PlayerHandle

  get x(): number {
    return this.body.center.x;
  }

  get y(): number {
    return this.body.bottom;
  }

  get centerY(): number {
    return this.body.center.y;
  }

  get vx(): number {
    return this.body.velocity.x;
  }

  get vy(): number {
    return this.body.velocity.y;
  }

  get grounded(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  get onWater(): boolean {
    return this.grounded && this.isWaterSurface?.(this.x, this.y) === true;
  }

  setFacing(dir: 1 | -1): void {
    this.facing = dir;
  }

  afterimage(color: number, alpha: number, lifeMs: number): void {
    this.visual.afterimage(color, alpha, lifeMs);
  }

  ride(x: number, feetY: number): void {
    this.body.reset(x, feetY - this.body.height / 2);
  }

  setHidden(hidden: boolean): void {
    this.visual.setHidden(hidden);
  }

  setVelocity(vx: number, vy: number): void {
    this.body.setVelocity(vx, vy);
  }

  setVelocityX(vx: number): void {
    this.body.setVelocityX(vx);
  }

  setVelocityY(vy: number): void {
    this.body.setVelocityY(vy);
  }

  launch(vy: number, cuttable: boolean): void {
    this.body.setVelocityY(vy);
    markLaunched(this.motor, cuttable);
  }

  squash(x: number, y: number): void {
    this.visual.squash(x, y);
  }

  setInvulnerable(ms: number): void {
    this.invulnUntil = Math.max(this.invulnUntil, this.now + ms);
  }

  glow(color: number, amount: number): void {
    this.visual.glow(color, amount);
  }

  // ------------------------------------------------------------ State

  get inputEnabled(): boolean {
    return this.controlsEnabled && !this.dead && this.now >= this.stunUntil;
  }

  get isAlien(): boolean {
    return this.form.kind === 'alien';
  }

  /** Height of the head above the feet, for speech bubbles. */
  get headHeight(): number {
    return this.form.frame.feetY + 3;
  }

  /** How far the current form senses hidden things (Wildmutt), 0 for none. */
  get senseRadius(): number {
    return this.dead ? 0 : (this.abilities.senseRadius?.() ?? 0);
  }

  /** The form can run on water right now (asked by the level's water-surface collider). */
  canRunOnWater(): boolean {
    return !this.dead && this.body.velocity.y >= 0 && (this.abilities.canRunOnWater?.(this.ctx) ?? false);
  }

  get invulnerable(): boolean {
    return this.now < this.invulnUntil || (this.abilities.isInvulnerable?.() ?? false);
  }

  hurtbox(out: Rect): Rect {
    out.x = this.body.x + 1;
    out.y = this.body.y + 2;
    out.w = this.body.width - 2;
    out.h = this.body.height - 2;
    return out;
  }

  /** `shieldRatio` keeps the alien shield proportional when the Omnitrix swaps forms mid-transformation. */
  setForm(form: FormDefinition, shieldRatio = 1): void {
    this.abilities.onExit?.(this.ctx);
    this.visual.setHidden(false);
    this.form = form;
    this.abilities = form.createAbilities();
    this.formHp = Math.max(form.maxFormHealth > 0 ? 0.5 : 0, Math.round(form.maxFormHealth * shieldRatio * 2) / 2);
    this.visual.applyForm(form, this.animPrefix());
    this.abilities.onEnter?.(this.ctx);
  }

  /** Fraction of the alien shield left (1 for human Ben). */
  get shieldRatio(): number {
    return this.form.maxFormHealth > 0 ? this.formHp / this.form.maxFormHealth : 1;
  }

  /** The entrance move after a mid-transformation swap. */
  swapIn(): void {
    this.abilities.onSwapIn?.(this.ctx);
  }

  giveWatch(): void {
    this.hasWatch = true;
    this.visual.setPrefix(this.animPrefix());
  }

  heal(amount: number): number {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  teleport(x: number, feetY: number): void {
    this.body.reset(x, feetY - this.body.height / 2);
    this.lastSafe.x = x;
    this.lastSafe.y = feetY;
    this.visual.update(this.x, this.y, this.facing, 0, this.now);
  }

  // ------------------------------------------------------------ Frame update (before physics)

  update(dtMs: number, controls: Controls): void {
    if (this.dead) return;
    this.controls = this.inputEnabled ? controls : this.idleControls;
    const c = this.controls;
    const grounded = this.grounded;

    if (grounded && !this.wasGrounded) this.onLand();

    let moveX: -1 | 0 | 1 = c.left === c.right ? 0 : c.left ? -1 : 1;
    if (this.scriptedMove !== null) moveX = this.scriptedMove;

    this.abilities.update(this.ctx, dtMs);

    const standingOnPlatform = grounded && this.onPlatform?.(this) === true;
    const dropping = standingOnPlatform && c.down && c.jumpPressed;
    if (dropping) {
      this.dropThroughUntil = this.now + PLAYER.dropThroughMs;
      this.body.setVelocityY(40);
    }

    if (!(this.abilities.locksMovement?.() ?? false)) {
      const res = stepMotor(
        this.motor,
        { moveX, jumpPressed: c.jumpPressed && !dropping, jumpHeld: c.jumpHeld },
        this.form.motor,
        { vx: this.body.velocity.x, vy: this.body.velocity.y, grounded },
        dtMs,
        this.abilities.speedMultiplier?.() ?? 1,
      );
      this.body.setVelocity(res.vx, res.vy);
      if (res.jumped) this.onJump();
      if (res.airJumpRequested && this.abilities.tryAirJump?.(this.ctx)) consumeJumpBuffer(this.motor);
      if (moveX !== 0) this.facing = moveX;
    }

    const custom = this.abilities.gravityScale?.(this.ctx) ?? null;
    const scale = custom ?? gravityScale(this.body.velocity.y, c.jumpHeld, GRAVITY_TUNING) * this.form.feel.gravityScale;
    this.body.setGravityY(PHYSICS.gravity * (scale - 1));
    const maxFall = this.abilities.maxFallSpeed?.(this.ctx) ?? PLAYER.maxFallSpeed;
    if (this.body.velocity.y > maxFall) this.body.setVelocityY(maxFall);

    this.trackSafeGround(dtMs, grounded);
    this.footsteps(dtMs, grounded, moveX);
    this.onWaterLast = this.onWater;
    if (!grounded) this.fallSpeed = Math.max(0, this.body.velocity.y);
    this.wasGrounded = grounded;
  }

  /** Set by the Level: true when the body is standing on a one-way platform. */
  onPlatform: ((player: Player) => boolean) | null = null;

  /** Set by the Level: false where respawning would be unsafe (e.g. under water). */
  isSafeSpot: ((x: number, feetY: number) => boolean) | null = null;

  /** Set by the Level: where feet at (x, feetY) can stand now that moving solids may have moved in (a pit respawn). */
  respawnFeetY: ((x: number, feetY: number, height: number) => number) | null = null;

  /** Set by the Level: true when feet at (x, feetY) rest on a water surface. */
  isWaterSurface: ((x: number, feetY: number) => boolean) | null = null;

  /** After physics: move the sprite to the body and pick an animation. */
  syncVisual(dtMs: number, visualNow: number): void {
    if (!this.dead) this.pickAnimation();
    else {
      this.deathVy += 900 * (dtMs / 1000);
      this.deathY += this.deathVy * (dtMs / 1000);
    }
    this.visual.setBlink(this.now < this.invulnUntil && !this.dead);
    this.visual.setMeter(this.dead ? null : (this.abilities.meter?.() ?? null));
    this.visual.update(this.x, this.y + this.deathY, this.facing, dtMs, visualNow);
  }

  private pickAnimation(): void {
    const override = this.abilities.animOverride?.();
    if (override) {
      this.visual.play(override);
      return;
    }
    if (this.now < this.stunUntil) {
      this.visual.play('hurt');
      return;
    }
    if (!this.grounded) {
      this.visual.play(this.body.velocity.y < 0 ? 'jump' : 'fall');
      return;
    }
    const moving = Math.abs(this.body.velocity.x) > 12;
    this.visual.play(moving ? 'run' : 'idle');
  }

  private animPrefix(): string {
    if (this.form.kind === 'human') return this.hasWatch ? 'ben' : 'bennw';
    return this.form.animPrefix;
  }

  private onJump(): void {
    this.visual.squash(FX.stretchJump.x, FX.stretchJump.y);
    this.services.fx.burst(this.onWaterLast ? 'splash' : 'dust', this.x, this.y, 4);
    playSfx('jump', 1, this.form.feel.jumpPitch);
  }

  private onLand(): void {
    const impact = Math.min(1, this.fallSpeed / PLAYER.maxFallSpeed);
    const k = 0.4 + impact * 0.6;
    this.visual.squash(1 + (FX.squashLand.x - 1) * k, 1 + (FX.squashLand.y - 1) * k);
    this.services.fx.burst('dust', this.x, this.y, 2 + Math.round(impact * 5));
    playSfx('land', 0.5 + impact * 0.5);
    this.abilities.onLand?.(this.ctx, impact);
  }

  private footsteps(dtMs: number, grounded: boolean, moveX: number): void {
    if (!grounded || moveX === 0) {
      this.stepTimer = 0;
      return;
    }
    this.stepTimer -= dtMs;
    if (this.stepTimer <= 0) {
      this.stepTimer = this.form.feel.stepMs;
      playSfx('step', this.form.feel.stepVolume);
      this.abilities.onStep?.(this.ctx);
    }
  }

  private trackSafeGround(dtMs: number, grounded: boolean): void {
    this.safeTimer -= dtMs;
    if (!grounded || this.safeTimer > 0 || this.onWater) return;
    this.safeTimer = PLAYER.safeGroundEveryMs;
    if (this.isSafeSpot && !this.isSafeSpot(this.x, this.y)) return;
    this.lastSafe.x = this.x;
    this.lastSafe.y = this.y;
  }

  // ------------------------------------------------------------ Damage

  takeDamage(amount: number, sourceX: number, source: 'shot' | 'contact' = 'contact'): DamageOutcome {
    if (this.dead || !this.controlsEnabled) return NO_DAMAGE;
    if (this.invulnerable) {
      if (this.abilities.isInvulnerable?.()) this.abilities.onDodge?.(this.ctx, source);
      return NO_DAMAGE;
    }
    const dmg = Math.max(0.5, Math.round(amount * this.services.damageMultiplier * 2) / 2);
    const dir = this.x >= sourceX ? 1 : -1;
    const feel = this.form.feel;

    this.body.setVelocity(dir * PLAYER.hurtKnockback.x * feel.knockbackScale, PLAYER.hurtKnockback.y * feel.knockbackScale);
    markLaunched(this.motor, false);
    this.stunUntil = this.now + PLAYER.hurtStunMs * feel.stunScale;
    this.invulnUntil = this.now + PLAYER.hurtInvulnMs;
    this.visual.flash(PALETTE.white, 90);
    this.services.fx.burst('spark', this.x, this.centerY, 8);
    this.services.fx.hitStop(70);
    playSfx('hurt');

    if (this.isAlien) {
      this.formHp = Math.max(0, this.formHp - dmg);
      this.services.fx.shake(FX.shakeMedium, 160);
      return { applied: true, amount: dmg, formBroken: this.formHp <= 0, died: false };
    }

    this.hp = Math.max(0, this.hp - dmg);
    this.services.fx.shake(FX.shakeMedium, 200);
    if (this.hp <= 0) {
      this.die();
      return { applied: true, amount: dmg, formBroken: false, died: true };
    }
    return { applied: true, amount: dmg, formBroken: false, died: false };
  }

  /** Water or pits: lose some health and pop back to the last safe ground. */
  pitRespawn(): DamageOutcome {
    const dmg = Math.max(0.5, PLAYER.pitDamage * this.services.damageMultiplier);
    let outcome: DamageOutcome;
    if (this.isAlien) {
      this.formHp = Math.max(0, this.formHp - dmg);
      outcome = { applied: true, amount: dmg, formBroken: this.formHp <= 0, died: false };
    } else {
      this.hp = Math.max(0, this.hp - dmg);
      outcome = { applied: true, amount: dmg, formBroken: false, died: this.hp <= 0 };
    }
    if (outcome.died) {
      this.die();
      return outcome;
    }
    // The safe spot may have been filled since (a cart parked back on it): stand on top of what's there now.
    const feetY = this.respawnFeetY?.(this.lastSafe.x, this.lastSafe.y, this.body.height) ?? this.lastSafe.y;
    this.body.reset(this.lastSafe.x, feetY - this.body.height / 2);
    this.invulnUntil = Math.max(this.invulnUntil, this.now + PLAYER.pitRespawnInvulnMs);
    this.visual.flash(PALETTE.white, 120);
    return outcome;
  }

  /** The level is ending: release the current form's held sounds (no gameplay effects). */
  dispose(): void {
    this.abilities.dispose?.();
  }

  private die(): void {
    this.dead = true;
    this.abilities.onExit?.(this.ctx);
    this.visual.setHidden(false);
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.deathY = 0;
    this.deathVy = -280;
    this.visual.play('hurt');
    this.visual.setSpin(-this.facing * 9);
    this.visual.flash(PALETTE.enemy, 200);
  }

  revive(x: number, feetY: number): void {
    this.dead = false;
    this.deathY = 0;
    this.deathVy = 0;
    this.body.setAllowGravity(true);
    this.hp = this.maxHp;
    this.visual.setSpin(0);
    this.setForm(HUMAN_FORM);
    this.teleport(x, feetY);
    this.body.setVelocity(0, 0);
    this.invulnUntil = this.now + 1200;
  }
}
