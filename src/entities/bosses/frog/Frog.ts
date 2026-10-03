import Phaser from 'phaser';
import { DEPTH } from '../../../config/constants';
import { FROG } from '../../../config/frog';
import { PALETTE } from '../../../config/palette';
import { TEX } from '../../../scenes/preload/assetKeys';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { playSfx } from '../../../systems/audio/Sfx';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld } from '../HunterDrone';
import { FrogTongue, type TongueOwner } from './FrogTongue';
import { frogMultiplier, gumFeet, popsThroat, yanksTongue } from './rules';

type State = 'intro' | 'idle' | 'leap' | 'tongue' | 'spit' | 'flop' | 'zap' | 'stunned' | 'transition' | 'dying' | 'dead';
type Attack = 'leap' | 'tongue' | 'spit' | 'flop' | 'zap';

const BAGS: Attack[][] = [
  ['leap', 'tongue', 'spit', 'leap', 'tongue'],
  ['leap', 'flop', 'tongue', 'spit', 'zap', 'leap', 'tongue'],
  ['flop', 'leap', 'tongue', 'spit', 'leap', 'zap'],
];

/** Animo's speech before the fight (first meeting in a run). */
export const FROG_INTRO_LINES = [
  { who: 'animo', text: "PERSISTENT, AREN'T YOU? LIKE A COCKROACH. ...I SHOULD KNOW. I MADE SEVERAL.", ms: 3000 },
  { who: 'ben', text: 'GIVE IT UP, ANIMO. YOUR MUTANT ZOO IS CLOSED.', ms: 2100 },
  { who: 'animo', text: 'THOSE WERE FIRST DRAFTS, BOY. ALLOW ME TO INTRODUCE... MY MASTERPIECE!', ms: 2900 },
] as const;

/**
 * KING CROAK: Animo's giant mutant frog, Animo riding on its head. Leaps
 * (a target marks where it lands), lashes its tongue along a locked line,
 * swells its throat and spits mutagen, and from phase 2 belly-flops from
 * off-screen while Animo zaps up mutant help.
 */
export class Frog implements ArenaBoss, TongueOwner {
  readonly name = FROG.name;
  readonly subtitle = FROG.subtitle;
  readonly maxHp = FROG.maxHp;
  readonly phase2Title = 'MAXIMUM MUTATION!';
  readonly defeatTitle = FROG.defeatTitle;
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  readonly extraTargets: readonly Damageable[];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[] = [];
  hp: number = FROG.maxHp;
  phase = 0;
  lastDamage = 0;
  x: number;
  /** Feet height above the floor (leaps and flops). */
  private lift = 0;
  private facing: 1 | -1 = -1;
  private scale = 0.2;
  private state: State = 'intro';
  private stateT = 0;
  private bag: Attack[] = [];
  private attacksSinceZap = 0;
  private flashLeft = 0;
  private gumGlobs: number[] = [];
  private gummed = false;
  private inflated = false;
  private recovering = false;
  private leapFrom = 0;
  private leapTo = 0;
  private hopsLeft = 0;
  private aim = 0;
  private zapX = 0;
  private stunMs = 0;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly rider: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly tongue: FrogTongue;
  private readonly floorY: number;
  private introStarted = false;
  private introDone = false;
  private riderFell = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly w: BossWorld,
    x: number,
  ) {
    this.x = x;
    this.floorY = w.arena.floorY;
    this.shadow = scene.add.image(x, this.floorY, TEX.shadow).setDepth(DEPTH.boss - 1).setAlpha(0.5);
    this.sprite = scene.add.sprite(x, this.floorY, TEX.frog, 0).setOrigin(0.5, 1).setDepth(DEPTH.boss).setScale(this.scale);
    this.rider = scene.add.sprite(x - 70, this.floorY, TEX.animo, 0).setOrigin(0.5, 1).setDepth(DEPTH.boss + 1);
    this.tongue = new FrogTongue(scene, this);
    this.extraTargets = [this.tongue];
    this.extraHazards = [this.tongue];
  }

  get alive(): boolean {
    return this.state !== 'dead' && this.state !== 'dying';
  }

  get defeated(): boolean {
    return this.state === 'dying' || this.state === 'dead';
  }

  get introducing(): boolean {
    return this.state === 'intro';
  }

  /** Contact damage: landing on Ben hurts more than bumping into him. */
  get damage(): number {
    if (this.state === 'flop') return FROG.flop.damage;
    if (this.state === 'leap' && this.lift > 0) return FROG.leap.damage;
    return FROG.contactDamage;
  }

  get active(): boolean {
    return this.alive && this.state !== 'intro' && this.state !== 'transition' && !(this.state === 'flop' && this.lift > 200);
  }

  private get w2(): number {
    return (FROG.body.width / 2) * this.scale;
  }

  private get h(): number {
    return FROG.body.height * this.scale;
  }

  private get feetY(): number {
    return this.floorY - this.lift;
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.x - this.w2 + 6;
    out.y = this.feetY - this.h + 8;
    out.w = this.w2 * 2 - 12;
    out.h = this.h - 8;
    return true;
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.state === 'intro' || this.lift > 220) return false;
    out.x = this.x - this.w2;
    out.y = this.feetY - this.h - 10;
    out.w = this.w2 * 2;
    out.h = this.h + 10;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.state === 'intro' || this.state === 'transition') return 'none';
    // Slime on its feet: enough globs glue it to the floor.
    if (hit.kind === 'slime' && (hit.slowMs ?? 0) >= 1000 && this.lift < 4 && !this.gummed) {
      const g = gumFeet(this.gumGlobs, this.w.now);
      this.gumGlobs = g.globs;
      if (g.stuck) this.gum();
    }
    if (popsThroat(hit, this.inflated)) this.pop();
    const mult = frogMultiplier(hit, { inflated: this.inflated, recovering: this.recovering || this.state === 'stunned', gummed: this.gummed, headTopY: this.feetY - this.h });
    if (hit.y < this.feetY - this.h + FROG.fromAbove.margin && mult > 1) this.w.fx.popText(this.x, this.feetY - this.h - 20, 'ANIMO HIT!', PALETTE.animo);
    return this.damageBy(hit.damage * mult, hit);
  }

  /** The tongue was hit: a smash yanks the frog off its feet. */
  onTongueHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (yanksTongue(hit) && this.state === 'tongue') {
      this.tongue.retract();
      this.w.fx.popText(this.tongue.tipX, this.tongue.tipY - 16, 'YANK!', PALETTE.gold);
      this.w.fx.shake(0.012, 300);
      playSfx('armorBreak', 0.8, 0.6);
      // Pulled face-first toward the yank.
      const dir = Math.sign(hit.x - this.x) || this.facing;
      this.x = this.clampX(this.x + dir * 50);
      this.stun(FROG.tongue.yankStunMs, 'YANKED!');
      return this.damageBy(FROG.tongue.yankDamage, hit);
    }
    return this.damageBy(hit.damage * FROG.tongue.hitMultiplier, hit);
  }

  private damageBy(dmg: number, hit: Hit): HitResult {
    this.lastDamage = dmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.flashLeft = 80;
    this.w.fx.burst('goo', hit.x, hit.y, dmg >= 5 ? 10 : 4);
    playSfx('droneHit', 0.7, 0.55);
    this.w.onHealth(this.hp / this.maxHp, this.phase);
    if (this.hp <= 0) {
      this.die();
      return 'killed';
    }
    this.checkPhase();
    return 'hit';
  }

  private checkPhase(): void {
    const ratio = this.hp / this.maxHp;
    const want = ratio <= FROG.phase3At ? 2 : ratio <= FROG.phase2At ? 1 : 0;
    if (want <= this.phase || this.state === 'transition') return;
    this.phase = want;
    this.tongue.retract();
    this.inflated = false;
    this.lift = 0;
    this.set('transition');
    this.bag = [];
    this.rider.setFrame(3);
    playSfx('mutateRay');
    if (this.phase === 1) this.w.onPhase2();
    else this.w.fx.popText(this.x, this.feetY - this.h - 30, 'FROG FRENZY!', PALETTE.enemy);
  }

  private gum(): void {
    this.gummed = true;
    this.w.fx.popText(this.x, this.feetY - this.h - 10, 'GUMMED DOWN!', PALETTE.slime);
    this.w.fx.burst('slime', this.x, this.floorY - 6, 20);
    playSfx('splat', 0.9, 0.7);
    this.tongue.retract();
    this.inflated = false;
    this.stun(FROG.gum.stuckMs, null);
    this.w.tip('frog-gum', 'GUMMED! IT CAN\'T JUMP: HIT IT WHILE IT STRUGGLES', 3500);
  }

  private pop(): void {
    this.inflated = false;
    this.w.fx.popText(this.x + this.facing * 30, this.feetY - this.h * 0.4, 'POP!', PALETTE.fire1);
    this.w.fx.burst('fire', this.x + this.facing * 30, this.feetY - this.h * 0.4, 20);
    this.w.fx.burst('stink', this.x + this.facing * 30, this.feetY - this.h * 0.5, 10);
    this.w.fx.shake(0.01, 260);
    playSfx('burp', 1, 0.9);
    this.stun(FROG.spit.popStunMs, null);
    this.w.cancelThreat();
    this.hp = Math.max(1, this.hp - FROG.spit.popDamage);
    this.w.tip('frog-pop', 'FIRE POPS THE SWOLLEN THROAT!', 3000);
  }

  private stun(ms: number, label: string | null): void {
    this.stunMs = pace.punish(ms);
    this.lift = 0;
    this.set('stunned');
    if (label) this.w.fx.popText(this.x, this.feetY - this.h - 10, label, PALETTE.gold);
  }

  private die(): void {
    this.set('dying');
    this.tongue.hide();
    this.w.cancelThreat();
    this.inflated = false;
    playSfx('croak', 1, 0.5);
    this.w.fx.splat(this.x, this.floorY - this.h / 2, 'big');
    this.w.time.slowMo(0.25, 900, 500);
  }

  private set(state: State): void {
    this.state = state;
    this.stateT = 0;
  }

  /** Its body never reaches the walls: a Ben-sized gap is left in each corner, so it can't pin him there. */
  private clampX(x: number): number {
    const a = this.w.arena;
    const margin = this.w2 + FROG.wallGap;
    return Phaser.Math.Clamp(x, a.left + margin, a.right - margin);
  }

  private get mouthX(): number {
    return this.x + this.facing * 44 * this.scale;
  }

  private get mouthY(): number {
    return this.feetY - 34 * this.scale;
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    this.stateT += dtMs;
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.tongue.extended && this.tongue.update(dtMs, this.mouthX, this.mouthY) && this.state === 'tongue') this.toIdle();
    switch (this.state) {
      case 'intro':
        this.updateIntro();
        break;
      case 'idle':
        this.updateIdle(dtMs);
        break;
      case 'leap':
        this.updateLeap();
        break;
      case 'tongue':
        this.updateTongue();
        break;
      case 'spit':
        this.updateSpit();
        break;
      case 'flop':
        this.updateFlop();
        break;
      case 'zap':
        this.updateZap();
        break;
      case 'stunned':
        if (this.stateT >= this.stunMs) {
          this.gummed = false;
          this.toIdle();
        }
        if (this.gummed && Math.random() < 0.2) this.w.fx.burst('slime', this.x + (Math.random() - 0.5) * this.w2 * 2, this.floorY - 2, 1);
        break;
      case 'transition':
        this.updateTransition();
        break;
      case 'dying':
        this.updateDying();
        break;
      case 'dead':
        break;
    }
    this.render();
  }

  private updateIntro(): void {
    if (!this.introStarted) {
      this.introStarted = true;
      this.rider.setPosition(this.x - 70, this.floorY).setFrame(0).setFlipX(false);
      const grow = () => this.growIn();
      if (this.w.dialogue && this.w.introSeen === false) {
        this.w.holdPlayer?.(true);
        this.w.dialogue(FROG_INTRO_LINES, grow);
      } else {
        this.scene.time.delayedCall(400, grow);
      }
    }
    if (this.introDone && this.stateT > 0) {
      this.w.holdPlayer?.(false);
      this.toIdle(600);
    }
  }

  /** Animo zaps the little frog and it swells to the size of a car; he hops on its head. */
  private growIn(): void {
    const fx = this.w.fx;
    this.rider.setFrame(3).setFlipX(false);
    playSfx('mutateRay');
    fx.flash(this.x, this.floorY - 20, PALETTE.animo, 60, 400);
    this.scene.tweens.add({
      targets: this,
      scale: FROG.scale,
      duration: FROG.introMs * 0.6,
      ease: 'Back.easeOut',
      onUpdate: () => {
        if (Math.random() < 0.4) fx.burst('mutagen', this.x + (Math.random() - 0.5) * 60 * this.scale, this.floorY - Math.random() * 50 * this.scale, 2);
      },
      onComplete: () => {
        fx.shake(0.014, 400);
        fx.burst('goo', this.x, this.floorY - 30, 30);
        playSfx('croak', 1, 0.6);
        fx.popText(this.x, this.floorY - 90, 'RIBBIT.', PALETTE.mutagen);
        // Animo leaps onto its head.
        this.scene.tweens.add({ targets: this.rider, x: this.x, y: this.floorY - 56 * FROG.scale, duration: 450, ease: 'Quad.easeOut', onComplete: () => this.rider.setFrame(6) });
        this.scene.time.delayedCall(700, () => {
          this.introDone = true;
          this.stateT = 1;
        });
      },
    });
  }

  private toIdle(extraMs = 0): void {
    this.recovering = false;
    this.inflated = false;
    this.set('idle');
    this.stunMs = pace.bossRest(FROG.idleMs[this.phase]) + extraMs;
  }

  private updateIdle(dtMs: number): void {
    const p = this.w.player;
    const dx = p.x - this.x;
    this.facing = dx < 0 ? -1 : 1;
    // Little hops to keep its distance (not too close, not too far).
    if (Math.abs(dx) > 170) this.x = this.clampX(this.x + Math.sign(dx) * FROG.hopSpeed * (dtMs / 1000));
    if (this.stateT < this.stunMs || p.dead) return;
    if (this.bag.length === 0) this.bag = [...BAGS[this.phase]];
    let next = this.bag.shift()!;
    if (next === 'zap' && this.w.aliveAdds() >= FROG.zap.maxAdds) next = 'tongue';
    this.begin(next);
  }

  private begin(a: Attack): void {
    const p = this.w.player;
    this.attacksSinceZap++;
    switch (a) {
      case 'leap':
        this.hopsLeft = this.phase >= 2 ? 3 : 1;
        this.startLeap(p.x);
        break;
      case 'tongue':
        this.set('tongue');
        this.aim = Math.atan2(p.centerY - this.mouthY, p.x - this.mouthX);
        playSfx('croak', 0.6, 1.4);
        break;
      case 'spit':
        this.set('spit');
        this.inflated = true;
        playSfx('gulp', 0.8);
        this.w.threat(this.w.now + FROG.spit.inflateMs + FROG.spit.flightMs);
        break;
      case 'flop':
        this.set('flop');
        playSfx('croak', 0.9, 0.8);
        break;
      case 'zap':
        this.set('zap');
        this.zapX = Phaser.Math.Clamp(p.x + (Math.random() < 0.5 ? -90 : 90), this.w.arena.left + 30, this.w.arena.right - 30);
        this.rider.setFrame(3);
        playSfx('mutateRay', 0.7);
        this.attacksSinceZap = 0;
        break;
    }
  }

  // ------------------------------------------------------------ Leap

  private startLeap(targetX: number): void {
    this.set('leap');
    this.leapFrom = this.x;
    this.leapTo = this.clampX(targetX);
    this.facing = this.leapTo < this.x ? -1 : 1;
    const crouch = this.hopsLeft < 3 && this.phase >= 2 ? FROG.leap.crouchMs * 0.6 : FROG.leap.crouchMs;
    this.w.threat(this.w.now + crouch + FROG.leap.airMs);
    playSfx('croak', 0.7, 1.1);
  }

  private updateLeap(): void {
    const L = FROG.leap;
    const crouch = this.hopsLeft < 3 && this.phase >= 2 ? L.crouchMs * 0.6 : L.crouchMs;
    const air = this.phase >= 2 ? L.airMs * 0.75 : L.airMs;
    if (this.stateT < crouch) {
      // The tell: it crouches, and a target marks where it will land.
      const k = this.stateT / crouch;
      this.w.telegraph.target(this.leapTo, this.floorY - 4, 30 + 10 * k, PALETTE.enemy, blinkOn(this.stateT, 90) ? 0.9 : 0.5);
      return;
    }
    const t = Math.min(1, (this.stateT - crouch) / air);
    this.x = this.leapFrom + (this.leapTo - this.leapFrom) * t;
    this.lift = Math.sin(t * Math.PI) * L.height;
    this.w.telegraph.target(this.leapTo, this.floorY - 4, 40, PALETTE.enemy, 0.9);
    if (t < 1) return;
    this.lift = 0;
    this.land(false);
    this.hopsLeft--;
    if (this.hopsLeft > 0) {
      this.startLeap(this.w.player.x);
      return;
    }
    this.recovering = true;
    this.set('stunned');
    this.stunMs = pace.punish(L.recoverMs);
  }

  private land(big: boolean): void {
    const fx = this.w.fx;
    fx.shake(big ? 0.016 : 0.01, big ? 420 : 260);
    fx.burst('dust', this.x, this.floorY - 2, big ? 24 : 14);
    fx.crack(this.x, this.floorY, big ? 1 : 0.7);
    playSfx('land', 1, 0.5);
    playSfx('splat', 0.6, 0.6);
    for (const dir of [-1, 1] as const) this.w.hazards.spawnShockwave(this.x + dir * this.w2, dir);
    if (big) for (const dir of [-1, 1] as const) this.scene.time.delayedCall(260, () => this.alive && this.w.hazards.spawnShockwave(this.x + dir * this.w2, dir));
    this.w.cancelThreat();
  }

  // ------------------------------------------------------------ Tongue

  private updateTongue(): void {
    const T = FROG.tongue;
    if (this.tongue.extended) return;
    const p = this.w.player;
    if (this.stateT < T.tellMs - T.aimLockMs) {
      this.facing = p.x < this.x ? -1 : 1;
      const raw = Math.atan2(p.centerY - this.mouthY, p.x - this.mouthX);
      const max = (T.maxAngleDeg * Math.PI) / 180;
      // Keep the lash in front of it, within its reach angle.
      const base = this.facing > 0 ? 0 : Math.PI;
      const rel = Phaser.Math.Angle.Wrap(raw - base);
      this.aim = base + Phaser.Math.Clamp(rel, -max, max);
    }
    const locked = this.stateT >= T.tellMs - T.aimLockMs;
    const len = T.reach;
    this.w.telegraph.dashed(this.mouthX, this.mouthY, this.mouthX + Math.cos(this.aim) * len, this.mouthY + Math.sin(this.aim) * len, 0xe85a7a, locked ? 0.95 : blinkOn(this.stateT, 70) ? 0.55 : 0.25, this.stateT * 0.06, locked ? 2 : 1);
    if (this.stateT >= T.tellMs) {
      this.tongue.lash(this.aim);
      this.w.threat(this.w.now + 120);
      playSfx('tongue');
      this.w.tip('frog-tongue', 'TONGUE OUT! HIT IT. FOUR ARMS CAN YANK IT!', 3200);
    }
  }

  // ------------------------------------------------------------ Spit

  private updateSpit(): void {
    const S = FROG.spit;
    // The tell: the throat swells and glows.
    this.w.lighting.add(this.mouthX, this.mouthY + 10, 50 + 30 * Math.min(1, this.stateT / S.inflateMs), PALETTE.mutagen, 1);
    if (this.stateT < S.inflateMs) return;
    this.inflated = false;
    const p = this.w.player;
    for (let i = 0; i < S.globs; i++) {
      const tx = p.x + (i - (S.globs - 1) / 2) * S.spreadPx;
      const t = S.flightMs / 1000;
      const vx = (tx - this.mouthX) / t;
      const vy = (this.floorY - 8 - this.mouthY) / t - 0.5 * S.gravity * t;
      this.w.projectiles.spawn('spit', 'enemy', this.mouthX, this.mouthY, vx, vy, S.damage, 2400, 6, { gravity: S.gravity });
    }
    this.w.fx.burst('goo', this.mouthX, this.mouthY, 12);
    playSfx('burp', 0.8, 1.2);
    this.toIdle();
  }

  // ------------------------------------------------------------ Belly flop

  private updateFlop(): void {
    const F = FROG.flop;
    const p = this.w.player;
    const t = this.stateT;
    if (t < F.crouchMs) return;
    if (t < F.crouchMs + F.riseMs) {
      // Launches off the top of the screen.
      this.lift = ((t - F.crouchMs) / F.riseMs) * 420;
      return;
    }
    const trackEnd = F.crouchMs + F.riseMs + F.trackMs;
    const lockEnd = trackEnd + F.lockMs;
    if (t < trackEnd) {
      this.lift = 420;
      this.x = this.clampX(this.x + (p.x - this.x) * 0.08);
      this.w.telegraph.target(this.x, this.floorY - 4, 46, PALETTE.enemy, 0.5);
      if (t - (F.crouchMs + F.riseMs) < 30) this.w.threat(this.w.now + F.trackMs + F.lockMs + F.fallMs);
      return;
    }
    if (t < lockEnd) {
      this.w.telegraph.target(this.x, this.floorY - 4, 46, PALETTE.enemyGlow, blinkOn(t, 70) ? 1 : 0.6);
      return;
    }
    const k = Math.min(1, (t - lockEnd) / F.fallMs);
    this.lift = 420 * (1 - k * k);
    if (k < 1) return;
    this.lift = 0;
    this.land(true);
    this.recovering = true;
    this.set('stunned');
    this.stunMs = pace.punish(F.dazedMs);
  }

  // ------------------------------------------------------------ Animo's zap

  private updateZap(): void {
    const Z = FROG.zap;
    const rx = this.rider.x;
    const ry = this.rider.y - 30;
    this.w.telegraph.dashed(rx, ry, this.zapX, this.floorY - 10, PALETTE.animo, blinkOn(this.stateT, 80) ? 0.9 : 0.4, this.stateT * 0.08, 2);
    if (this.stateT < Z.tellMs) return;
    this.w.fx.flash(this.zapX, this.floorY - 12, PALETTE.animo, 30, 300);
    this.w.fx.burst('mutagen', this.zapX, this.floorY - 10, 16);
    const kind = this.phase >= 2 || Math.random() < 0.5 ? 'bat' : 'rat';
    if (kind === 'rat') {
      this.w.spawnAdd('rat', this.zapX - 10, this.floorY - 8);
      this.w.spawnAdd('rat', this.zapX + 10, this.floorY - 8);
    } else {
      this.w.spawnAdd('bat', this.zapX, this.floorY - 70);
    }
    this.rider.setFrame(6);
    this.toIdle();
  }

  // ------------------------------------------------------------ Phase change and death

  private updateTransition(): void {
    const fx = this.w.fx;
    if (this.stateT < 900) {
      if (Math.random() < 0.5) fx.burst('mutagen', this.x + (Math.random() - 0.5) * 70, this.floorY - Math.random() * 60, 2);
      this.w.lighting.add(this.x, this.floorY - 40, 120, PALETTE.animo, 0.8);
      return;
    }
    if (this.phase === 1 && this.scale < FROG.growScale) {
      this.scale = FROG.growScale;
      this.sprite.setTint(0xb8ff9a);
      fx.shake(0.014, 400);
      playSfx('croak', 1, 0.45);
    }
    this.rider.setFrame(6);
    this.toIdle(400);
  }

  private updateDying(): void {
    const fx = this.w.fx;
    if (this.stateT < 1600) {
      if (Math.random() < 0.4) fx.burst('goo', this.x + (Math.random() - 0.5) * 80 * this.scale, this.floorY - Math.random() * 60 * this.scale, 4);
      // Shrinks back to an ordinary frog.
      this.scale = Math.max(0.16, FROG.scale * (1 - this.stateT / 1600));
      if (this.stateT > 300 && !this.riderFell) {
        this.riderFell = true;
        this.rider.setFrame(7);
        this.scene.tweens.add({ targets: this.rider, x: this.x - 60, y: this.floorY, duration: 500, ease: 'Bounce.easeOut' });
      }
      return;
    }
    this.set('dead');
    fx.popText(this.x, this.floorY - 30, 'RIBBIT?', PALETTE.mutagen);
    playSfx('croak', 0.6, 1.8);
    this.w.onDefeated(this.x, this.floorY - 20);
  }

  // ------------------------------------------------------------ Look

  private render(): void {
    const s = this.sprite;
    let frame = 0;
    switch (this.state) {
      case 'idle':
        frame = Math.floor(this.stateT / 330) % 2;
        break;
      case 'leap':
        frame = this.lift > 2 ? 3 : 2;
        break;
      case 'tongue':
        frame = this.tongue.extended ? 4 : 0;
        break;
      case 'spit':
        frame = 5;
        break;
      case 'flop':
        frame = this.lift > 2 ? 3 : 2;
        break;
      case 'stunned':
        frame = this.recovering && !this.gummed ? 0 : 6;
        break;
      case 'transition':
        frame = 7;
        break;
      case 'dying':
      case 'dead':
        frame = 6;
        break;
    }
    if (this.state !== 'intro') s.setFrame(frame);
    const shake = this.state === 'transition' || (this.state === 'stunned' && this.gummed) ? (Math.random() - 0.5) * 3 : 0;
    s.setPosition(Math.round(this.x + shake), Math.round(this.feetY)).setScale(this.scale).setFlipX(this.facing < 0);
    if (this.flashLeft > 0) s.setTintMode(Phaser.TintModes.FILL).setTint(PALETTE.white);
    else if (this.gummed) s.setTintMode(Phaser.TintModes.MULTIPLY).setTint(0xd8f070);
    else s.setTintMode(Phaser.TintModes.MULTIPLY).setTint(this.phase >= 1 ? 0xb8ff9a : 0xffffff);
    const shadowK = Math.max(0.3, 1 - this.lift / 300);
    this.shadow.setPosition(this.x, this.floorY).setScale(1.6 * this.scale * shadowK + 0.4, 1).setAlpha(0.45 * shadowK);
    // Animo rides on its head (until it goes down).
    if (this.state !== 'intro' && this.state !== 'dying' && this.state !== 'dead') {
      this.rider.setPosition(Math.round(this.x - this.facing * 6 * this.scale), Math.round(this.feetY - 56 * this.scale)).setFlipX(this.facing < 0);
    }
    this.w.lighting.add(this.x, this.feetY - this.h / 2, 90 * this.scale, PALETTE.mutagen, 0.6);
    if (this.state === 'stunned' && !this.gummed) {
      // Dazed: stars over its head.
      const a = this.stateT * 0.008;
      for (let i = 0; i < 3; i++) this.w.lighting.add(this.x + Math.cos(a + i * 2.1) * 20, this.feetY - this.h - 8 + Math.sin(a + i * 2.1) * 5, 10, PALETTE.gold, 1);
    }
  }
}
