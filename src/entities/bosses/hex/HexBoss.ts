import Phaser from 'phaser';
import { DEPTH, FX } from '../../../config/constants';
import { HEX_BOSS as H } from '../../../config/hexBoss';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { TEX } from '../../../scenes/preload/assetKeys';
import { MAX_FRAME, MAX_FRAMES } from '../../../scenes/preload/family';
import { CHARMCASTER_FRAME, HEX_FRAME } from '../../../scenes/preload/karachi/cast';
import { CHARM_COLORS, type CharmElement } from '../../../scenes/preload/karachi/colors';
import { CH6_TEX } from '../../../scenes/preload/karachi/keys';
import { FamilyActor } from '../../../scenes/level/family/FamilyActor';
import { blinkOn } from '../../../systems/Accessibility';
import { pace } from '../../../systems/Difficulty';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../enemies/magic/sfx';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld } from '../HunterDrone';
import { HEX_INTRO_LINES, HEX_PHASE_LINES } from './lines';
import { nextCharm, shuffledCharms } from './rules';

type State = 'intro' | 'idle' | 'attack' | 'transition' | 'dying' | 'dead';
type CharmAttack = 'bags' | 'summon' | 'blink';
type HexAttack = CharmElement | 'cataclysm';

/** One body on the tower top (Charmcaster, Hex, one of his copies): what Combat hits and what hurts Ben on contact. */
class Part implements Damageable, Hazard {
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  lastDamage = 0;
  /** Hittable and solid right now. */
  on = false;
  constructor(
    readonly sprite: Phaser.GameObjects.Sprite,
    private readonly body: { width: number; height: number },
    private readonly onHit: (part: Part, hit: Hit) => HitResult,
    private readonly analyzed?: () => void,
  ) {}

  get alive(): boolean {
    return this.on;
  }

  get active(): boolean {
    return this.on;
  }

  readonly damage = H.contactDamage;

  private box(out: Rect, shrink: number): boolean {
    if (!this.on) return false;
    out.x = this.sprite.x - this.body.width / 2 + shrink;
    out.y = this.sprite.y - this.body.height + shrink;
    out.w = this.body.width - shrink * 2;
    out.h = this.body.height - shrink * 2;
    return true;
  }

  hurtbox(out: Rect): boolean {
    return this.box(out, -2);
  }

  hitbox(out: Rect): boolean {
    return this.box(out, 3);
  }

  takeHit(hit: Hit): HitResult {
    if (!this.on) return 'none';
    return this.onHit(this, hit);
  }

  onAnalyzed(): void {
    this.analyzed?.();
  }
}

/** A column of fire bursting out of the floor (a Charm of Bezel's fire). Warns first, then burns. */
class Pillar implements Hazard {
  readonly damage = H.hex.fire.damage;
  x = 0;
  warn = 0;
  burn = 0;
  get active(): boolean {
    return this.warn <= 0 && this.burn > 0;
  }
  constructor(private readonly floorY: number) {}
  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.x - 9;
    out.y = this.floorY - 64;
    out.w = 18;
    out.h = 64;
    return true;
  }
}

/** Hex's big spell: one ring of power across the whole tower top, for a moment. */
class Cataclysm implements Hazard {
  readonly damage = H.both.cataclysm.damage;
  live = 0;
  get active(): boolean {
    return this.live > 0;
  }
  constructor(private readonly area: { left: number; right: number; floorY: number }) {}
  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    out.x = this.area.left;
    out.y = this.area.floorY - 200;
    out.w = this.area.right - this.area.left;
    out.h = 200;
    return true;
  }
}

const CHARM_FRAME: Record<CharmElement, number> = { fire: 0, lightning: 1, stone: 2, wind: 3 };
const CHARM_NAME: Record<CharmElement, string> = { fire: 'FIRE', lightning: 'LIGHTNING', stone: 'STONE', wind: 'WIND' };

/**
 * HEX AND CHARMCASTER, on top of the clock tower at night: the skyline, the
 * port's cranes, the lighthouse beam sweeping over. One bar, three phases.
 *
 * 1. Charmcaster: spell bags lobbed at where Ben stands (rings mark them),
 *    rocklings summoned out of runes (Gwen's STUN, or any stunning hit,
 *    breaks the summon and leaves her reeling), a blink and a fan of bolts.
 * 2. Hex and the Charms of Bezel on his staff, each its own attack and tell:
 *    FIRE (pillars racing along the floor), LIGHTNING (aimed bolts that
 *    Diamondhead can send back), STONE (shockwaves both ways: jump or fly
 *    over), WIND (a storm of debris at head and foot height). Grey Matter's
 *    ANALYZE shows which Charm comes next.
 * 3. Both: Hex splits into copies that shuffle around; Charmcaster wards
 *    him (hit or stun her to break it), the copies pop at a touch, Gwen's
 *    REVEAL shows the real one, and every few spells Hex charges a ring of
 *    power over the whole tower top that Gwen's SHIELD blocks. Max holds the
 *    stairs against the rocklings coming up.
 */
export class HexBoss implements ArenaBoss {
  readonly name = H.name;
  readonly subtitle = H.subtitle;
  readonly maxHp = H.maxHp;
  readonly phase2Title = 'HEX TAKES THE STAFF!';
  readonly defeatTitle = 'THE CHARMS ARE FREE!';
  readonly countsAsEnemy = true;
  readonly extraTargets: readonly Damageable[];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[] = [];
  hp: number = H.maxHp;
  phase = 0;
  lastDamage = 0;
  private state: State = 'intro';
  private stateT = 0;
  private restMs = 0;
  private readonly floorY: number;
  private readonly charmSprite: Phaser.GameObjects.Sprite;
  private readonly hexSprite: Phaser.GameObjects.Sprite;
  private readonly copySprites: Phaser.GameObjects.Sprite[] = [];
  private readonly charm: Part;
  private readonly hex: Part;
  private readonly copies: Part[] = [];
  private readonly copyBack: number[] = [];
  private readonly copyBoltIn: number[] = [];
  private readonly orbit: Phaser.GameObjects.Image[] = [];
  private readonly pillars: Pillar[] = [];
  private readonly cataclysm: Cataclysm;
  private readonly max: FamilyActor;
  private charmBag: CharmAttack[] = [];
  private charms: CharmElement[] = [];
  private attack: CharmAttack | HexAttack | null = null;
  private attacksSinceBig = 0;
  private stunned = 0;
  private spent = 0;
  private wardDown = 0;
  private flash = 0;
  /** Grey Matter analysed Hex: the next Charm shows over his head. */
  private foreseen = false;
  private shots = 0;
  private aim = 0;
  private stairIn: number = H.both.stairAddsEveryMs;
  private maxSprayIn = 1500;
  private introStarted = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly w: BossWorld,
    x: number,
  ) {
    this.floorY = w.arena.floorY;
    const charmOrigin = (CHARMCASTER_FRAME.feetY + 1) / CHARMCASTER_FRAME.h;
    const hexOrigin = (HEX_FRAME.feetY + 1) / HEX_FRAME.h;
    this.charmSprite = scene.add.sprite(x + 60, this.floorY, CH6_TEX.charmcaster, 0).setOrigin(0.5, charmOrigin).setDepth(DEPTH.boss).setVisible(false);
    this.hexSprite = scene.add.sprite(x, this.floorY - 60, CH6_TEX.hex, 0).setOrigin(0.5, hexOrigin).setDepth(DEPTH.boss).setVisible(false);
    for (let i = 0; i < H.both.copies; i++) {
      this.copySprites.push(scene.add.sprite(x, this.floorY, CH6_TEX.hex, 0).setOrigin(0.5, hexOrigin).setDepth(DEPTH.boss).setVisible(false));
    }
    this.charm = new Part(this.charmSprite, H.charmcaster.body, (p, hit) => this.hitCharmcaster(p, hit));
    this.hex = new Part(this.hexSprite, H.hex.body, (p, hit) => this.hitHex(p, hit), () => this.foresee());
    for (const s of this.copySprites) {
      this.copies.push(new Part(s, H.hex.body, (p, hit) => this.hitCopy(p, hit)));
      this.copyBack.push(0);
      this.copyBoltIn.push(H.both.copyBoltEveryMs[0]);
    }
    for (let i = 0; i < 4; i++) this.orbit.push(scene.add.image(0, 0, CH6_TEX.charm, i).setDepth(DEPTH.boss + 1).setVisible(false));
    for (let i = 0; i < H.hex.fire.pillars; i++) this.pillars.push(new Pillar(this.floorY));
    this.cataclysm = new Cataclysm(w.arena);
    const look = { texture: TEX.max, prefix: 'max', frameWidth: MAX_FRAME.w, frameHeight: MAX_FRAME.h, feetY: MAX_FRAME.feetY, frames: MAX_FRAMES, handHeight: 18 };
    this.max = new FamilyActor(scene, look, DEPTH.player - 2);
    this.extraTargets = [this.charm, this.hex, ...this.copies];
    this.extraHazards = [this.charm, this.hex, ...this.copies, ...this.pillars, this.cataclysm];
  }

  // ------------------------------------------------------------ ArenaBoss

  get alive(): boolean {
    return this.state !== 'dying' && this.state !== 'dead';
  }

  get defeated(): boolean {
    return !this.alive;
  }

  get introducing(): boolean {
    return this.state === 'intro';
  }

  /** The boss as a whole is never hit or touched: its bodies are (`extraTargets`). */
  readonly damage = 0;
  readonly active = false;

  hurtbox(): boolean {
    return false;
  }

  hitbox(): boolean {
    return false;
  }

  takeHit(): HitResult {
    return 'none';
  }

  // ------------------------------------------------------------ Hits

  private hitCharmcaster(part: Part, hit: Hit): HitResult {
    // A stunning hit breaks a summon (and her ward, in the last phase).
    const stunning = (hit.stunMs ?? 0) > 0;
    if (stunning && this.attack === 'summon' && this.phase === 0 && this.state === 'attack') {
      this.w.fx.popText(part.sprite.x, part.sprite.y - 40, 'SUMMON BROKEN!', PALETTE.mana);
      this.w.cancelThreat();
      this.stunCharmcaster();
    }
    if (this.phase === 2 && (stunning || hit.damage >= 1)) this.dropWard();
    const mult = this.stunned > 0 ? H.charmcaster.stunnedMultiplier : 1;
    // In the last phase she's the shield, not the target: her hits count for less.
    return this.hurt(part, hit, hit.damage * mult * (this.phase === 2 ? 0.5 : 1));
  }

  private hitHex(part: Part, hit: Hit): HitResult {
    if (this.phase === 2 && this.wardDown <= 0) {
      this.w.fx.popText(part.sprite.x, part.sprite.y - 48, 'WARDED!', PALETTE.charmcaster);
      this.w.fx.burst('mana', hit.x, hit.y, 6);
      playSfx(MAGIC_SFX.clang, 0.6, 1.4);
      this.w.tip('hex-ward', 'CHARMCASTER WARDS HIM: HIT HER TO BREAK IT, THEN FIND THE REAL HEX!', 4000);
      return 'hit';
    }
    const mult = this.spent > 0 ? H.hex.spentMultiplier : 1;
    return this.hurt(part, hit, hit.damage * mult);
  }

  /** An illusion pops at any touch, and comes back a while later. */
  private hitCopy(part: Part, _hit: Hit): HitResult {
    const i = this.copies.indexOf(part);
    part.on = false;
    part.sprite.setVisible(false);
    this.copyBack[i] = H.both.copyReturnMs;
    this.w.fx.burst('mana', part.sprite.x, part.sprite.y - 20, 18);
    this.w.fx.ring(part.sprite.x, part.sprite.y - 20, PALETTE.hex, 30, 260);
    this.w.fx.popText(part.sprite.x, part.sprite.y - 48, 'FAKE!', PALETTE.hex);
    playSfx(MAGIC_SFX.poof, 0.8);
    return 'killed';
  }

  private hurt(part: Part, hit: Hit, dmg: number): HitResult {
    if (this.state === 'intro' || this.state === 'transition' || this.state === 'dying') return 'none';
    part.lastDamage = dmg;
    this.lastDamage = dmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.flash = 80;
    this.w.fx.burst('mana', hit.x, hit.y, dmg >= 4 ? 10 : 4);
    this.w.fx.burst('spark', hit.x, hit.y, 3);
    playSfx('droneHit', 0.7, 0.7);
    this.w.onHealth(this.hp / this.maxHp, this.phase);
    if (this.hp <= 0) {
      this.die();
      return 'killed';
    }
    this.checkPhase();
    return 'hit';
  }

  private stunCharmcaster(): void {
    this.stunned = pace.punish(H.charmcaster.stunnedMs);
    this.attack = null;
    this.charmSprite.stop().setFrame(4);
    this.toIdle();
  }

  private dropWard(): void {
    if (this.wardDown > 0) return;
    this.wardDown = H.both.wardDownMs;
    this.w.fx.ring(this.hexSprite.x, this.hexSprite.y - 20, PALETTE.charmcaster, 40, 300);
    this.w.fx.popText(this.charmSprite.x, this.charmSprite.y - 42, 'WARD BROKEN!', PALETTE.mana);
    playSfx(MAGIC_SFX.clang, 0.8, 0.8);
  }

  /** Grey Matter analysed Hex: the Charm he'll use next floats over his head until he uses it. */
  private foresee(): void {
    if (this.phase === 0) return;
    this.foreseen = true;
    if (this.charms.length === 0) this.charms = shuffledCharms();
    const next = this.charms[0];
    this.w.fx.popText(this.hexSprite.x, this.hexSprite.y - 60, `NEXT: ${CHARM_NAME[next]}`, CHARM_COLORS[next]);
  }

  private checkPhase(): void {
    const ratio = this.hp / this.maxHp;
    const want = ratio <= H.phase3At ? 2 : ratio <= H.phase2At ? 1 : 0;
    if (want <= this.phase) return;
    this.phase = want;
    this.attack = null;
    this.stunned = 0;
    for (const p of this.pillars) p.burn = p.warn = 0;
    this.w.cancelThreat();
    this.set('transition');
    const lines = HEX_PHASE_LINES[want];
    if (this.phase === 1) this.w.onPhase2();
    else this.w.fx.popText((this.w.arena.left + this.w.arena.right) / 2, this.floorY - 120, 'TOGETHER!', PALETTE.charmcaster, 2);
    if (lines) this.w.dialogue?.(lines, () => undefined);
    playSfx(MAGIC_SFX.screech, 0.8, 0.7);
  }

  private die(): void {
    this.set('dying');
    this.w.cancelThreat();
    for (const p of [this.charm, this.hex, ...this.copies]) p.on = false;
    for (const s of this.copySprites) s.setVisible(false);
    this.hexSprite.stop().setFrame(4);
    this.charmSprite.stop().setFrame(4);
    this.w.time.slowMo(0.25, 900, 500);
    this.w.fx.shake(FX.shakeMedium, 400);
    playSfx(MAGIC_SFX.screech, 1, 0.6);
    // The Charms fly free of the staff.
    this.orbit.forEach((c, i) => {
      c.setVisible(true).setPosition(this.hexSprite.x, this.hexSprite.y - 40);
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      this.scene.tweens.add({ targets: c, x: c.x + Math.cos(a) * 90, y: c.y + Math.sin(a) * 60, scale: 2, duration: 900, ease: 'Cubic.Out' });
    });
  }

  private set(state: State): void {
    this.state = state;
    this.stateT = 0;
  }

  private toIdle(extra = 0): void {
    this.set('idle');
    this.restMs = pace.bossRest(H.idleMs[this.phase]) + extra;
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    this.stateT += dtMs;
    this.flash = Math.max(0, this.flash - dtMs);
    this.stunned = Math.max(0, this.stunned - dtMs);
    this.spent = Math.max(0, this.spent - dtMs);
    if (this.wardDown > 0) this.wardDown = Math.max(0, this.wardDown - dtMs);
    this.cataclysm.live = Math.max(0, this.cataclysm.live - dtMs);
    this.updatePillars(dtMs);
    this.updateMax(dtMs);
    switch (this.state) {
      case 'intro':
        this.updateIntro();
        break;
      case 'idle':
        this.updateIdle();
        break;
      case 'attack':
        this.updateAttack();
        break;
      case 'transition':
        this.updateTransition();
        break;
      case 'dying':
        if (this.stateT >= H.dyingMs) {
          this.set('dead');
          this.hexSprite.setVisible(false);
          this.charmSprite.setVisible(false);
          for (const c of this.orbit) c.setVisible(false);
          this.w.fx.burst('mana', this.hexSprite.x, this.hexSprite.y - 20, 30);
          this.w.fx.burst('mana', this.charmSprite.x, this.charmSprite.y - 16, 24);
          playSfx(MAGIC_SFX.poof, 1, 0.7);
          this.w.onDefeated(this.hexSprite.x, this.hexSprite.y - 20);
        }
        break;
      case 'dead':
        break;
    }
    if (this.phase === 2) this.updateCopies(dtMs);
    this.render();
  }

  private updateIntro(): void {
    if (this.introStarted) return;
    this.introStarted = true;
    const a = this.w.arena;
    this.hexSprite.setPosition((a.left + a.right) / 2 + 40, this.floorY - H.hex.hover).setVisible(true).play('hex-idle');
    this.charmSprite.setPosition((a.left + a.right) / 2 - 40, this.floorY).setVisible(true).play('charmcaster-idle');
    this.w.fx.burst('mana', this.hexSprite.x, this.hexSprite.y - 20, 20);
    this.w.fx.burst('mana', this.charmSprite.x, this.charmSprite.y - 16, 16);
    const go = () => {
      this.w.holdPlayer?.(false);
      // Max comes up the stairs to hold them.
      this.max.place(a.left + 18, this.floorY);
      this.max.face(1);
      this.max.pose('idle');
      this.w.fx.burst('dust', this.max.x, this.floorY, 8);
      this.hexSprite.setPosition(a.right - 40, this.floorY - 120).setAlpha(0.6);
      this.charm.on = true;
      this.toIdle(500);
    };
    if (this.w.dialogue && this.w.introSeen === false) {
      this.w.holdPlayer?.(true);
      this.w.dialogue(HEX_INTRO_LINES, go);
    } else this.scene.time.delayedCall(500, go);
  }

  private updateTransition(): void {
    const a = this.w.arena;
    if (this.stateT < H.transitionMs) {
      if (chance(0.3)) this.w.fx.burst('mana', this.hexSprite.x + (Math.random() - 0.5) * 30, this.hexSprite.y - Math.random() * 40, 2);
      return;
    }
    if (this.phase === 1) {
      // Charmcaster steps back to watch from the parapet; Hex comes down with the staff.
      this.charm.on = false;
      this.charmSprite.setPosition(a.left + 40, this.floorY - 110).setAlpha(0.6).play('charmcaster-idle');
      this.hexSprite.setAlpha(1).setPosition((a.left + a.right) / 2, this.floorY - H.hex.hover).play('hex-idle');
      this.hex.on = true;
      this.charms = shuffledCharms();
      this.w.tip('hex-analyze', "GREY MATTER'S ANALYZE SHOWS WHICH CHARM HEX WILL USE NEXT!", 4000);
    } else {
      // Both: Charmcaster back down to ward him, the copies appear.
      this.charmSprite.setPosition(a.left + 60, this.floorY).setAlpha(1).play('charmcaster-idle');
      this.charm.on = true;
      this.copies.forEach((c, i) => {
        c.on = true;
        c.sprite.setVisible(true).play('hex-idle');
        this.copyBack[i] = 0;
      });
      this.shuffleHexes();
      this.w.tip('hex-reveal', 'COPIES POP AT A TOUCH. GWEN\'S REVEAL ({DOWN} + {G}) SHOWS THE REAL HEX!', 4500);
    }
    this.toIdle(400);
  }

  private updateIdle(): void {
    const p = this.w.player;
    if (this.stunned > 0) return;
    if (this.stateT < this.restMs || p.dead) return;
    if (this.phase === 0) this.beginCharmcaster();
    else this.beginHex();
  }

  // ------------------------------------------------------------ Charmcaster (phase 1, and her ward in phase 3)

  private beginCharmcaster(): void {
    if (this.charmBag.length === 0) this.charmBag = ['bags', 'summon', 'blink', 'bags', 'blink', 'summon'];
    let next = this.charmBag.shift()!;
    if (next === 'summon' && this.w.aliveAdds() >= H.charmcaster.summon.maxAdds) next = 'bags';
    this.attack = next;
    this.shots = 0;
    this.set('attack');
    if (next === 'summon') {
      this.charmSprite.stop().setFrame(3);
      this.w.threat(this.w.now + H.charmcaster.summon.chantMs);
      this.w.tip('hex-stun', "GWEN'S STUN ({UP} + {G}) BREAKS A SUMMON!", 3500);
      playSfx(MAGIC_SFX.grind, 0.7, 1.4);
    } else if (next === 'bags') {
      this.charmSprite.stop().setFrame(2);
      this.w.threat(this.w.now + H.charmcaster.bags.windupMs + H.charmcaster.bags.flightMs);
    } else {
      this.w.fx.burst('mana', this.charmSprite.x, this.charmSprite.y - 16, 12);
      playSfx(MAGIC_SFX.poof, 0.6, 1.3);
    }
  }

  private updateCharmAttack(): void {
    const C = H.charmcaster;
    const s = this.charmSprite;
    const p = this.w.player;
    if (this.attack === 'summon') {
      const t = this.stateT / C.summon.chantMs;
      for (const dx of [-50, 50]) this.w.telegraph.circle(s.x + dx, this.floorY - 2, 14 + t * 6, TELL.charmcaster, 0.4 + t * 0.5);
      if (this.stateT >= C.summon.chantMs) {
        for (const dx of [-50, 50]) {
          this.w.spawnAdd('rockling', s.x + dx, this.floorY - 8);
          this.w.fx.burst('debris', s.x + dx, this.floorY, 10);
        }
        playSfx(MAGIC_SFX.rumble, 0.9);
        this.endAttack();
      }
    } else if (this.attack === 'bags') {
      const B = C.bags;
      // Each bag's landing spot is marked; they're thrown one after another.
      const throwAt = B.windupMs + this.shots * B.gapMs;
      if (this.shots < B.count && this.stateT >= throwAt) {
        const tx = Phaser.Math.Clamp(p.x + (this.shots - 1) * B.spreadPx, this.w.arena.left + 10, this.w.arena.right - 10);
        this.lob(s.x, s.y - 26, tx, B.flightMs, B.damage, B.radius);
        this.shots++;
        playSfx(MAGIC_SFX.zap, 0.5, 0.8);
      }
      if (this.stateT < throwAt + B.flightMs) {
        for (let i = 0; i < B.count; i++) {
          const tx = Phaser.Math.Clamp(p.x + (i - 1) * B.spreadPx, this.w.arena.left + 10, this.w.arena.right - 10);
          if (i >= this.shots) this.w.telegraph.circle(tx, this.floorY - 2, 12, TELL.charmcaster, 0.5);
        }
      }
      if (this.shots >= B.count && this.stateT >= throwAt + 300) this.endAttack();
    } else if (this.attack === 'blink') {
      const K = C.blink;
      if (this.shots === 0 && this.stateT >= K.fadeMs) {
        // Reappear on the far side of Ben.
        const a = this.w.arena;
        const x = p.x < (a.left + a.right) / 2 ? a.right - 40 : a.left + 60;
        s.setPosition(x, this.floorY);
        this.w.fx.burst('mana', x, this.floorY - 16, 12);
        s.stop().setFrame(2);
        this.shots = 1;
        this.aim = Math.atan2(p.centerY - (this.floorY - 22), p.x - x);
        this.w.threat(this.w.now + K.windupMs);
      }
      if (this.shots === 1) {
        const t = (this.stateT - K.fadeMs) / K.windupMs;
        for (let i = 0; i < K.bolts; i++) {
          const a = this.aim + ((i - (K.bolts - 1) / 2) * K.fanDeg * Math.PI) / 180;
          this.w.telegraph.dashed(s.x, s.y - 22, s.x + Math.cos(a) * 240, s.y - 22 + Math.sin(a) * 240, TELL.charmcaster, 0.2 + t * 0.5, this.stateT * 0.06);
        }
        if (this.stateT >= K.fadeMs + K.windupMs) {
          for (let i = 0; i < K.bolts; i++) {
            const a = this.aim + ((i - (K.bolts - 1) / 2) * K.fanDeg * Math.PI) / 180;
            this.w.projectiles.spawn('spell', 'enemy', s.x, s.y - 22, Math.cos(a) * K.speed, Math.sin(a) * K.speed, K.damage, 2200, 4, { hitKind: 'burst', tint: PALETTE.charmcaster });
          }
          playSfx(MAGIC_SFX.zap, 0.9);
          this.shots = 2;
          this.endAttack();
        }
      }
    }
  }

  /** A spell bag in an arc from (x, y) to the floor at `tx`. */
  private lob(x: number, y: number, tx: number, flightMs: number, damage: number, radius: number): void {
    const t = flightMs / 1000;
    const g = 700;
    const vx = (tx - x) / t;
    const vy = (this.floorY - 4 - y - 0.5 * g * t * t) / t;
    this.w.projectiles.spawn('bag', 'enemy', x, y, vx, vy, damage, flightMs + 400, radius, { gravity: g, hitKind: 'burst' });
  }

  // ------------------------------------------------------------ Hex (phase 2, and with his copies in phase 3)

  private beginHex(): void {
    if (this.phase === 2 && this.attacksSinceBig >= H.both.cataclysm.everyAttacks) {
      this.attacksSinceBig = 0;
      this.attack = 'cataclysm';
      this.set('attack');
      this.hexSprite.stop().setFrame(5);
      this.w.threat(this.w.now + H.both.cataclysm.chargeMs);
      this.w.tip('hex-cataclysm', "BIG SPELL! GWEN'S SHIELD ({G}) BLOCKS IT!", 3500);
      playSfx(MAGIC_SFX.grind, 1, 0.6);
      return;
    }
    if (this.charms.length === 0) this.charms = shuffledCharms();
    const element = nextCharm(this.charms);
    this.foreseen = false;
    this.attacksSinceBig++;
    this.attack = element;
    this.shots = 0;
    this.set('attack');
    // Blink to a spot away from Ben first.
    this.blinkHex();
    this.hexSprite.stop().setFrame(2);
    const W: Record<CharmElement, number> = { fire: H.hex.fire.windupMs, lightning: H.hex.lightning.windupMs, stone: H.hex.stone.windupMs, wind: H.hex.wind.windupMs };
    this.w.threat(this.w.now + W[element]);
    playSfx(MAGIC_SFX.zap, 0.7, 0.6);
  }

  /** Hex moves to one of three spots on the tower top (in the last phase his copies take the others). */
  private blinkHex(): void {
    const a = this.w.arena;
    const spots = [a.left + 70, (a.left + a.right) / 2, a.right - 60];
    const p = this.w.player;
    const far = spots.filter((x) => Math.abs(x - p.x) > 60);
    const x = far[Math.floor(Math.random() * far.length)] ?? spots[1];
    this.w.fx.burst('mana', this.hexSprite.x, this.hexSprite.y - 20, 10);
    this.hexSprite.setPosition(x, this.floorY - H.hex.hover);
    this.w.fx.burst('mana', x, this.hexSprite.y - 20, 10);
    if (this.phase === 2) this.shuffleHexes();
  }

  /** The copies take the other spots (with a puff, so the eye loses the real one). */
  private shuffleHexes(): void {
    const a = this.w.arena;
    const spots = [a.left + 70, (a.left + a.right) / 2, a.right - 60].filter((x) => Math.abs(x - this.hexSprite.x) > 20);
    this.copySprites.forEach((s, i) => {
      s.setPosition(spots[i % spots.length], this.floorY - H.hex.hover);
      if (s.visible) this.w.fx.burst('mana', s.x, s.y - 20, 8);
    });
  }

  private updateHexAttack(): void {
    const s = this.hexSprite;
    const p = this.w.player;
    const a = this.w.arena;
    switch (this.attack) {
      case 'fire': {
        const F = H.hex.fire;
        const t = this.stateT / F.windupMs;
        this.w.telegraph.dashed(s.x, this.floorY - 2, p.x, this.floorY - 2, TELL.hex, 0.3 + Math.min(1, t) * 0.5, this.stateT * 0.08, 2);
        if (this.stateT >= F.windupMs && this.shots === 0) {
          // Pillars race from Hex toward where Ben was.
          const dir = Math.sign(p.x - s.x) || 1;
          this.pillars.forEach((pl, i) => {
            pl.x = Phaser.Math.Clamp(s.x + dir * (40 + i * 34), a.left + 8, a.right - 8);
            pl.warn = 280 + i * F.gapMs;
            pl.burn = 420;
          });
          this.shots = 1;
          this.endHexSpell();
        }
        break;
      }
      case 'lightning': {
        const L = H.hex.lightning;
        const fireAt = L.windupMs + this.shots * L.gapMs;
        if (this.shots < L.bolts) {
          if (this.stateT < fireAt - L.aimLockMs) this.aim = Math.atan2(p.centerY - (s.y - 34), p.x - s.x);
          const locked = this.stateT >= fireAt - L.aimLockMs;
          this.w.telegraph.dashed(s.x, s.y - 34, s.x + Math.cos(this.aim) * 400, s.y - 34 + Math.sin(this.aim) * 400, TELL.hex, locked ? 0.95 : 0.35, this.stateT * 0.05, locked ? 2 : 1);
          if (this.stateT >= fireAt) {
            this.w.projectiles.spawn('laser', 'enemy', s.x, s.y - 34, Math.cos(this.aim) * L.speed, Math.sin(this.aim) * L.speed, L.damage, 1600, 4, { tint: CHARM_COLORS.lightning });
            this.w.fx.flash(s.x, s.y - 34, CHARM_COLORS.lightning, 30, 160);
            playSfx('laser', 0.9, 1.4);
            this.shots++;
          }
        } else this.endHexSpell();
        break;
      }
      case 'stone': {
        const S = H.hex.stone;
        const t = this.stateT / S.windupMs;
        this.w.telegraph.zone(a.left, this.floorY - 10, a.right - a.left, 10, TELL.hex, 0.25 + Math.min(1, t) * 0.5 + (blinkOn(this.stateT, 90) ? 0.1 : 0), this.stateT * 0.05, 0);
        if (this.stateT >= S.windupMs) {
          this.w.hazards.spawnShockwave(s.x - 20, -1, CHARM_COLORS.stone);
          this.w.hazards.spawnShockwave(s.x + 20, 1, CHARM_COLORS.stone);
          this.w.fx.shake(FX.shakeMedium, 260);
          this.w.fx.burst('debris', s.x, this.floorY, 16);
          playSfx(MAGIC_SFX.slam, 1);
          this.endHexSpell();
        }
        break;
      }
      case 'wind': {
        const Wd = H.hex.wind;
        if (this.stateT < Wd.windupMs) {
          if (chance(0.5)) this.w.fx.trail('mana', s.x + (Math.random() - 0.5) * 40, s.y - Math.random() * 40);
          this.w.telegraph.zone(a.left, this.floorY - 70, a.right - a.left, 70, TELL.hex, 0.25 + (this.stateT / Wd.windupMs) * 0.4, this.stateT * 0.05, s.x < p.x ? 1 : -1);
          break;
        }
        // A storm of debris across the tower top: low ones to jump, high ones to stay under.
        const gust = this.stateT - Wd.windupMs;
        const every = Wd.gustMs / Wd.debris;
        if (this.shots < Wd.debris && gust >= this.shots * every) {
          const dir = s.x < p.x ? 1 : -1;
          const high = this.shots % 2 === 1;
          const y = this.floorY - (high ? 34 : 8);
          this.w.projectiles.spawn('shard', 'enemy', dir > 0 ? a.left + 6 : a.right - 6, y, dir * Wd.push, 0, Wd.debrisDamage, 3000, 5, { tint: CHARM_COLORS.wind });
          playSfx(MAGIC_SFX.flap, 0.6, 0.7);
          this.shots++;
        }
        if (gust >= Wd.gustMs) this.endHexSpell();
        break;
      }
      case 'cataclysm': {
        const C = H.both.cataclysm;
        const t = this.stateT / C.chargeMs;
        this.w.telegraph.circle(s.x, s.y - 20, 20 + t * 220, TELL.hex, 0.3 + t * 0.6);
        this.w.lighting.add(s.x, s.y - 20, 40 + t * 120, PALETTE.hex, 0.9);
        if (this.stateT >= C.chargeMs) {
          this.cataclysm.live = 140;
          this.w.fx.ring(s.x, s.y - 20, PALETTE.hex, 400, 500);
          this.w.fx.ring(s.x, s.y - 20, PALETTE.white, 300, 400, 0.6);
          this.w.fx.shake(FX.shakeMedium, 400);
          this.w.fx.light(s.x, s.y, 300, PALETTE.hex, 500);
          playSfx('burst', 1, 0.7);
          this.endHexSpell();
        }
        break;
      }
      default:
        break;
    }
  }

  private endHexSpell(): void {
    this.spent = H.hex.spentMs;
    this.hexSprite.stop().setFrame(3);
    this.endAttack();
  }

  private endAttack(): void {
    this.attack = null;
    this.toIdle();
  }

  private updateAttack(): void {
    if (this.attack === 'bags' || this.attack === 'summon' || this.attack === 'blink') this.updateCharmAttack();
    else this.updateHexAttack();
  }

  private updatePillars(dtMs: number): void {
    for (const p of this.pillars) {
      if (p.warn > 0) {
        p.warn -= dtMs;
        this.w.telegraph.zone(p.x - 9, this.floorY - 64, 18, 64, TELL.hex, 0.4, this.stateT * 0.06, 0);
        if (p.warn <= 0) {
          this.w.fx.burst('fire', p.x, this.floorY - 10, 14);
          this.w.fx.light(p.x, this.floorY - 30, 60, CHARM_COLORS.fire, 300);
          playSfx('fireball', 0.5, 0.8);
        }
      } else if (p.burn > 0) {
        p.burn -= dtMs;
        if (chance(0.6)) this.w.fx.trail('fire', p.x + (Math.random() - 0.5) * 12, this.floorY - Math.random() * 60);
        this.w.lighting.add(p.x, this.floorY - 30, 40, CHARM_COLORS.fire, 0.9);
      }
    }
  }

  /** Phase 3: the copies throw slow bolts, and popped ones come back. */
  private updateCopies(dtMs: number): void {
    if (this.state === 'dying' || this.state === 'dead') return;
    const p = this.w.player;
    this.copies.forEach((c, i) => {
      if (!c.on) {
        this.copyBack[i] -= dtMs;
        if (this.copyBack[i] <= 0 && this.state !== 'transition') {
          c.on = true;
          c.sprite.setVisible(true).play('hex-idle');
          this.w.fx.burst('mana', c.sprite.x, c.sprite.y - 20, 12);
        }
        return;
      }
      this.copyBoltIn[i] -= dtMs;
      if (this.copyBoltIn[i] <= 0 && !p.dead) {
        const [lo, hi] = H.both.copyBoltEveryMs;
        this.copyBoltIn[i] = pace.rest(lo + Math.random() * (hi - lo));
        const a = Math.atan2(p.centerY - (c.sprite.y - 30), p.x - c.sprite.x);
        const v = H.both.copyBoltSpeed;
        this.w.projectiles.spawn('spell', 'enemy', c.sprite.x, c.sprite.y - 30, Math.cos(a) * v, Math.sin(a) * v, 1, 2600, 4, { hitKind: 'burst' });
      }
    });
    // Rocklings up the stairs (Max is holding them).
    this.stairIn -= dtMs;
    if (this.stairIn <= 0) {
      this.stairIn = H.both.stairAddsEveryMs;
      if (this.w.aliveAdds() < 3) this.w.spawnAdd('rockling', this.w.arena.left + 24, this.floorY - 8);
    }
  }

  /** Max at the top of the stairs: foam at whatever comes up. */
  private updateMax(dtMs: number): void {
    if (!this.max.visible) return;
    this.max.update(dtMs);
    this.maxSprayIn -= dtMs;
    if (this.maxSprayIn > 0 || this.state === 'intro' || this.defeated) return;
    this.maxSprayIn = 1800;
    if (this.w.aliveAdds() === 0) return;
    this.max.hold('spray', 600);
    this.w.projectiles.spawn('wave', 'player', this.max.x + 16, this.floorY - 7, 160, 0, 0.5, 700, 7, { hugGround: true, stunMs: 1800, hitKind: 'burst', tint: PALETTE.white });
    playSfx(MAGIC_SFX.spray, 0.6);
  }

  // ------------------------------------------------------------ Drawing

  private render(): void {
    const p = this.w.player;
    const sense = (p as { senseRadius?: number }).senseRadius ?? 0;
    const tint = this.flash > 0;
    // Hex floats; his Charms circle the staff (the next one glows when foreseen).
    const hs = this.hexSprite;
    if (hs.visible && this.state !== 'dying') {
      hs.y = this.floorY - (this.phase === 0 ? 120 : H.hex.hover) + Math.sin(this.stateT * 0.003) * 3;
      hs.setFlipX(p.x < hs.x);
      const show = this.phase >= 1;
      this.orbit.forEach((c, i) => {
        c.setVisible(show);
        if (!show) return;
        const a = this.stateT * 0.003 + (i * Math.PI) / 2;
        c.setPosition(hs.x + Math.cos(a) * 14, hs.y - 46 + Math.sin(a) * 5);
        const next = this.foreseen && this.charms[0] !== undefined && i === CHARM_FRAME[this.charms[0]];
        c.setScale(next ? 1.8 : 1).setAlpha(next ? 1 : 0.8);
      });
      this.w.lighting.add(hs.x, hs.y - 30, 50, PALETTE.hex, 0.8);
      if (tint) hs.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
      else hs.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }
    const cs = this.charmSprite;
    if (cs.visible) {
      if (this.phase !== 1) cs.setFlipX(p.x < cs.x);
      if (this.state === 'idle' && this.stunned <= 0 && !cs.anims.isPlaying) cs.play('charmcaster-idle');
      this.w.lighting.add(cs.x, cs.y - 20, 40, PALETTE.charmcaster, 0.7);
      if (tint) cs.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
      else if (this.stunned > 0) cs.setTint(0x9a9ab8).setTintMode(Phaser.TintModes.MULTIPLY);
      else cs.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }
    // The copies: perfect fakes, unless something that senses is close.
    for (const s of this.copySprites) {
      if (!s.visible) continue;
      s.y = hs.y;
      s.setFlipX(p.x < s.x);
      const seen = sense > 0 && Math.hypot(p.x - s.x, p.centerY - (s.y - 20)) < sense + 40;
      s.setAlpha(seen ? 0.3 + Math.sin(this.stateT * 0.03) * 0.12 : 1);
    }
    // Charmcaster's ward in the last phase: a thread of light from her hands to every Hex (the real one and his copies alike).
    const warded = this.phase === 2 && this.wardDown <= 0 && this.alive && this.state !== 'transition';
    if (!warded) return;
    for (const s of [hs, ...this.copySprites]) {
      if (!s.visible) continue;
      this.w.telegraph.line(cs.x, cs.y - 24, s.x, s.y - 20, TELL.charmcaster, 0.35 + Math.sin(this.stateT * 0.012) * 0.1);
      this.w.lighting.add(s.x, s.y - 20, 30, PALETTE.charmcaster, 0.4);
    }
  }
}
