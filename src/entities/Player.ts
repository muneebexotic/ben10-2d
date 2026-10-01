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
import { playSfx, type SfxName } from '../systems/audio/Sfx';
import { PlayerVisual } from './PlayerVisual';
import type { Rect } from './types';

export interface PlayerServices {
  combat: CombatApi;
  fx: FxApi;
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
      sfx: (name: SfxName, v?: number, p?: number) => playSfx(name, v, p),
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

  setForm(form: FormDefinition): void {
    this.abilities.onExit?.(this.ctx);
    this.form = form;
    this.abilities = form.createAbilities();
    this.formHp = form.maxFormHealth;
    this.visual.applyForm(form, this.animPrefix());
    this.abilities.onEnter?.(this.ctx);
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

    const scale = gravityScale(this.body.velocity.y, c.jumpHeld, GRAVITY_TUNING);
    this.body.setGravityY(PHYSICS.gravity * (scale - 1));
    const glide = this.abilities.glideMaxFall?.(this.ctx) ?? null;
    const maxFall = glide ?? PLAYER.maxFallSpeed;
    if (this.body.velocity.y > maxFall) this.body.setVelocityY(maxFall);

    this.trackSafeGround(dtMs, grounded);
    this.footsteps(dtMs, grounded, moveX);
    if (!grounded) this.fallSpeed = Math.max(0, this.body.velocity.y);
    this.wasGrounded = grounded;
  }

  /** Set by the Level: true when the body is standing on a one-way platform. */
  onPlatform: ((player: Player) => boolean) | null = null;

  /** Set by the Level: false where respawning would be unsafe (e.g. under water). */
  isSafeSpot: ((x: number, feetY: number) => boolean) | null = null;

  /** After physics: move the sprite to the body and pick an animation. */
  syncVisual(dtMs: number, visualNow: number): void {
    if (!this.dead) this.pickAnimation();
    else {
      this.deathVy += 900 * (dtMs / 1000);
      this.deathY += this.deathVy * (dtMs / 1000);
    }
    this.visual.setBlink(this.now < this.invulnUntil && !this.dead);
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
    this.services.fx.burst('dust', this.x, this.y, 4);
    playSfx('jump', 1, this.isAlien ? 0.8 : 1);
  }

  private onLand(): void {
    const impact = Math.min(1, this.fallSpeed / PLAYER.maxFallSpeed);
    const k = 0.4 + impact * 0.6;
    this.visual.squash(1 + (FX.squashLand.x - 1) * k, 1 + (FX.squashLand.y - 1) * k);
    this.services.fx.burst('dust', this.x, this.y, 2 + Math.round(impact * 5));
    if (this.isAlien && impact > 0.8) {
      this.services.fx.burst('ember', this.x, this.y, 6);
      this.services.fx.shake(FX.shakeLight, 90);
    }
    playSfx('land', 0.5 + impact * 0.5);
    this.abilities.onLand?.(this.ctx);
  }

  private footsteps(dtMs: number, grounded: boolean, moveX: number): void {
    if (!grounded || moveX === 0) {
      this.stepTimer = 0;
      return;
    }
    this.stepTimer -= dtMs;
    if (this.stepTimer <= 0) {
      this.stepTimer = this.isAlien ? 230 : 260;
      playSfx('step', this.isAlien ? 1.4 : 1);
      if (this.isAlien) this.services.fx.burst('ember', this.x, this.y, 2);
    }
  }

  private trackSafeGround(dtMs: number, grounded: boolean): void {
    this.safeTimer -= dtMs;
    if (!grounded || this.safeTimer > 0) return;
    this.safeTimer = PLAYER.safeGroundEveryMs;
    if (this.isSafeSpot && !this.isSafeSpot(this.x, this.y)) return;
    this.lastSafe.x = this.x;
    this.lastSafe.y = this.y;
  }

  // ------------------------------------------------------------ Damage

  takeDamage(amount: number, sourceX: number): DamageOutcome {
    if (this.dead || this.invulnerable || !this.controlsEnabled) return NO_DAMAGE;
    const dmg = Math.max(0.5, Math.round(amount * this.services.damageMultiplier * 2) / 2);
    const dir = this.x >= sourceX ? 1 : -1;

    this.body.setVelocity(dir * PLAYER.hurtKnockback.x, PLAYER.hurtKnockback.y);
    markLaunched(this.motor, false);
    this.stunUntil = this.now + PLAYER.hurtStunMs;
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
    this.body.reset(this.lastSafe.x, this.lastSafe.y - this.body.height / 2);
    this.invulnUntil = this.now + PLAYER.pitRespawnInvulnMs;
    this.visual.flash(PALETTE.white, 120);
    return outcome;
  }

  private die(): void {
    this.dead = true;
    this.abilities.onExit?.(this.ctx);
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
