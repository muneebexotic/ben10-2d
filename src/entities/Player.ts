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
import { BREATH, SWIM_BEN, SWIM_FEEL, type SwimStats } from '../config/swim';
import { createSwimState, enterWater, stepSwim, type SwimWater } from '../systems/swim/SwimMotor';
import { Breath, type BreathEvent } from '../systems/swim/Breath';
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
const BREATH_DAMAGE = BREATH.damage;
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
  /** A ward (Gwen's shield) eats the next hit until this game time. */
  private wardUntil = 0;
  private onWardHit: (() => void) | null = null;
  /** Someone else's senses (Gwen's reveal) reaching this far around him. */
  extraSense = 0;
  private stunUntil = 0;
  private wasGrounded = false;
  private fallSpeed = 0;
  private deathY = 0;
  private deathVy = 0;
  private safeTimer = 0;
  private stepTimer = 0;
  private onWaterLast = false;
  /** In the water at all, and swimming in it (a heavy form walks the bottom instead). */
  private inWater = false;
  private swimmingNow = false;
  private headUnder = false;
  private readonly swimState = createSwimState();
  private bubbleTimer = 0;
  /** Air under water (only forms with lungs run out). */
  readonly breath = new Breath(SWIM_BEN.breathMs);
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

  get swimming(): boolean {
    return this.swimmingNow && !this.dead;
  }

  get submerged(): boolean {
    return this.inWater && !this.dead;
  }

  /** Head under the surface (breath runs down). */
  get underwater(): boolean {
    return this.inWater && this.headUnder && !this.dead;
  }

  /** How this form swims. */
  get swimStats(): SwimStats {
    return this.form.swim ?? SWIM_BEN;
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

  /** The next hit within `ms` is absorbed instead (and `onHit` hears about it); 0 drops the ward. */
  setWard(ms: number, onHit: (() => void) | null): void {
    this.wardUntil = ms > 0 ? this.now + ms : 0;
    this.onWardHit = ms > 0 ? onHit : null;
  }

  get warded(): boolean {
    return !this.dead && this.now < this.wardUntil;
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
    return this.dead ? 0 : Math.max(this.extraSense, this.abilities.senseRadius?.() ?? 0);
  }

  /** Intangible right now (Ghostfreak phasing): phase walls let him through. */
  get phased(): boolean {
    return !this.dead && (this.abilities.phased?.() ?? false);
  }

  /** Enemies can't see him right now (Ghostfreak, phased and still). */
  get cloaked(): boolean {
    return !this.dead && (this.abilities.cloaked?.() ?? false);
  }

  /** A reflecting face (Diamondhead's shield) laser beams bounce off, or null. */
  get mirror(): { x: number; y: number; angle: number; halfLength: number } | null {
    return this.dead ? null : (this.abilities.mirror?.() ?? null);
  }

  /** An enemy shot touched the form: true if the form swallowed it (no damage). */
  absorbShot(kind: string): boolean {
    if (this.dead || !this.controlsEnabled || this.invulnerable) return false;
    return this.abilities.absorbShot?.(this.ctx, kind) ?? false;
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
    this.resizeBody(form.body ?? PLAYER.body);
    this.abilities = form.createAbilities();
    this.formHp = Math.max(form.maxFormHealth > 0 ? 0.5 : 0, Math.round(form.maxFormHealth * shieldRatio * 2) / 2);
    this.breath.setMax(this.swimStats.breathMs * this.breathScale);
    // A form that walks the bottom (or one that swims) takes over mid-dive with the body's speed.
    if (this.inWater) enterWater(this.swimState, this.body.velocity.x, this.body.velocity.y, 1);
    this.visual.applyForm(form, this.animPrefix());
    this.abilities.onEnter?.(this.ctx);
  }

  /** A form with its own body size (Grey Matter): the body grows or shrinks around the same feet. */
  private resizeBody(size: { width: number; height: number }): void {
    if (this.body.width === size.width && this.body.height === size.height) return;
    const x = this.x;
    const feet = this.y;
    // The zone carries the body's origin: resize both so the body stays centred on x.
    this.zone.setSize(size.width, size.height);
    this.body.setSize(size.width, size.height, true);
    this.body.reset(x, feet - size.height / 2);
  }

  /**
   * Whether the shared, full-size body would fit where Ben stands (a small form
   * in a vent can't change back there: the watch waits until he's out).
   */
  get fitsFullSize(): boolean {
    const { width, height } = PLAYER.body;
    const isSolid = this.services.world.isSolid;
    const l = this.x - width / 2 + 1;
    const r = this.x + width / 2 - 1;
    for (const y of [this.y - 2, this.y - height / 2, this.y - height + 2]) {
      if (isSolid(l, y) || isSolid(r, y) || isSolid(this.x, y)) return false;
    }
    return true;
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

    const swim = this.swimStats;
    const water = this.updateWater(dtMs, swim);
    const heavy = this.inWater ? swim.heavy : undefined;
    const locked = this.abilities.locksMovement?.() ?? false;

    if (this.swimmingNow && water) {
      if (!locked) {
        const moveY: -1 | 0 | 1 = c.up === c.down ? 0 : c.up ? -1 : 1;
        const res = stepSwim(
          this.swimState,
          { moveX, moveY, jumpPressed: c.jumpPressed },
          swim,
          { top: this.body.top, height: this.body.height },
          water,
          dtMs,
          SWIM_FEEL.floatAbove,
          this.abilities.speedMultiplier?.() ?? 1,
        );
        this.body.setVelocity(res.vx, res.vy);
        if (res.jumpedOut) {
          markLaunched(this.motor, true);
          this.onJump();
        } else if (res.stroked) {
          this.services.fx.burst('bubble', this.x, this.centerY, 3);
          playSfx('swimStroke', 0.5, 0.9 + Math.random() * 0.2);
        }
        if (moveX !== 0) this.facing = moveX;
      } else {
        // An ability is steering (a dash): its speed carries on as momentum after.
        this.swimState.vx = this.body.velocity.x;
        this.swimState.vy = this.body.velocity.y;
      }
      this.body.setGravityY(0);
    } else {
      if (!locked) {
        const res = stepMotor(
          this.motor,
          { moveX, jumpPressed: c.jumpPressed && !dropping, jumpHeld: c.jumpHeld },
          this.form.motor,
          { vx: this.body.velocity.x, vy: this.body.velocity.y, grounded },
          dtMs,
          (this.abilities.speedMultiplier?.() ?? 1) * (heavy?.runScale ?? 1),
        );
        this.body.setVelocity(res.vx, res.vy);
        if (res.jumped) this.onJump();
        if (res.airJumpRequested && this.abilities.tryAirJump?.(this.ctx)) consumeJumpBuffer(this.motor);
        if (moveX !== 0) this.facing = moveX;
      }

      const custom = this.abilities.gravityScale?.(this.ctx) ?? null;
      const scale = (custom ?? gravityScale(this.body.velocity.y, c.jumpHeld, GRAVITY_TUNING) * this.form.feel.gravityScale) * (heavy?.gravityScale ?? 1);
      this.body.setGravityY(PHYSICS.gravity * (scale - 1));
      const maxFall = heavy?.maxFall ?? this.abilities.maxFallSpeed?.(this.ctx) ?? PLAYER.maxFallSpeed;
      if (this.body.velocity.y > maxFall) this.body.setVelocityY(maxFall);
    }

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

  /**
   * Set by the Level: the water this form can swim in at (x, y), or null. `anyWater`: the form
   * swims the older chapters' water too (everyone swims Act 3's tanks).
   */
  waterAt: ((x: number, y: number, anyWater: boolean) => SwimWater | null) | null = null;

  /** Set by the Level: an air pocket or a bubble vent at (x, y) (breath refills there under water). */
  airAt: ((x: number, y: number) => boolean) | null = null;

  /** Set by the Level: breath news (running low, out of air, a choking hit). */
  onBreath: ((event: Exclude<BreathEvent, null | 'refilled'>) => void) | null = null;

  /** Easy's bigger lungs (set by the Level). */
  breathScale = 1;

  /** In or out of the water this frame, breath, bubbles. Returns the water swum in, or null. */
  private updateWater(dtMs: number, swim: SwimStats): SwimWater | null {
    const water = this.dead ? null : (this.waterAt?.(this.x, this.centerY, swim.anyWater === true) ?? null);
    const was = this.inWater;
    const inside = water !== null && (was ? this.centerY > water.surface - SWIM_FEEL.exitAbove : this.centerY > water.surface + SWIM_FEEL.enterDepth);
    if (inside !== was) {
      this.inWater = inside;
      if (inside) {
        enterWater(this.swimState, this.body.velocity.x, this.body.velocity.y, SWIM_FEEL.entryKeep);
        if (water) this.services.fx.burst('splash', this.x, water.surface, 10);
        playSfx('splash', 0.6);
      } else if (water || was) {
        this.services.fx.burst('splash', this.x, this.y, 6);
      }
    }
    const swimming = this.inWater && !swim.heavy;
    // Only on the change: set pieces pin the body in the air the same way (and must keep it).
    if (swimming !== this.swimmingNow) this.body.setAllowGravity(!swimming);
    this.swimmingNow = swimming;
    this.headUnder = this.inWater && water !== null && this.body.top > water.surface + 1;
    const breathing = !this.headUnder || (this.airAt?.(this.x, this.body.top + 2) ?? false);
    const ev = this.breath.update(dtMs, !breathing);
    if (ev && ev !== 'refilled') this.onBreath?.(ev);
    if (this.headUnder) {
      this.bubbleTimer -= dtMs;
      if (this.bubbleTimer <= 0) {
        this.bubbleTimer = SWIM_FEEL.bubbleEveryMs * (0.7 + Math.random() * 0.6);
        this.services.fx.burst('bubble', this.x + this.facing * 3, this.body.top + 3, 1);
      }
    }
    return this.inWater ? water : null;
  }

  /** Out of air: a hit with no knockback (the Level hears about it like any other). */
  choke(): DamageOutcome {
    if (this.dead || !this.controlsEnabled) return NO_DAMAGE;
    const dmg = Math.max(0.5, BREATH_DAMAGE * this.services.damageMultiplier);
    this.visual.flash(PALETTE.enemy, 140);
    playSfx('hurt', 0.7, 0.8);
    if (this.isAlien) {
      this.formHp = Math.max(0, this.formHp - dmg);
      return { applied: true, amount: dmg, formBroken: this.formHp <= 0, died: false };
    }
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp <= 0) {
      this.die();
      return { applied: true, amount: dmg, formBroken: false, died: true };
    }
    return { applied: true, amount: dmg, formBroken: false, died: false };
  }

  /** After physics: move the sprite to the body and pick an animation. */
  syncVisual(dtMs: number, visualNow: number): void {
    if (!this.dead) this.pickAnimation();
    else {
      this.deathVy += 900 * (dtMs / 1000);
      this.deathY += this.deathVy * (dtMs / 1000);
    }
    this.visual.setBlink(this.now < this.invulnUntil && !this.dead);
    this.visual.setFade(this.dead ? 1 : (this.abilities.fade?.() ?? 1));
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
    if (this.swimmingNow) {
      const moving = Math.abs(this.body.velocity.x) + Math.abs(this.body.velocity.y) > 30;
      this.visual.playClip(this.breath.empty ? 'drown' : moving ? 'swim' : 'tread', 'fall');
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
    // Never a spot only a small form fits (a vent): a respawn there would put Ben inside the walls.
    if (!this.fitsFullSize) return;
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
    if (this.warded) {
      const onHit = this.onWardHit;
      this.setWard(0, null);
      this.invulnUntil = this.now + PLAYER.wardGraceMs;
      onHit?.();
      return NO_DAMAGE;
    }
    // Some forms shrug off shots and crack under blows (Diamondhead), or the reverse.
    const scale = this.form.damageScale ? this.form.damageScale[source] : 1;
    const dmg = Math.max(0.5, Math.round(amount * scale * this.services.damageMultiplier * 2) / 2);
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
    this.inWater = false;
    this.swimmingNow = false;
    this.headUnder = false;
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
    this.breath.fill();
    this.invulnUntil = this.now + 1200;
  }
}
