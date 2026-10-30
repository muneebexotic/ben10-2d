import Phaser from 'phaser';
import { CH7_HD } from '../../../config/chapter7';
import { DEPTH, FX, TILE } from '../../../config/constants';
import { DEEPMAW as D } from '../../../config/deepmaw';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { plumberArtRes } from '../../../scenes/level/plumber/presentation';
import { castRig } from '../../../scenes/preload/cartoon/cast';
import { PLUMBER_ART } from '../../../scenes/preload/cartoon/plumber/baseArt';
import { makeRigPortrait } from '../../../scenes/preload/cartoon/portrait';
import { HD_PORTRAITS } from '../../../scenes/preload/cartoon/portraitKeys';
import { rigTextureKey } from '../../../scenes/preload/cartoon/rig';
import { flashCamera } from '../../../systems/Accessibility';
import { cameraZoom } from '../../../systems/CameraZoom';
import { pace } from '../../../systems/Difficulty';
import { EventBus } from '../../../systems/EventBus';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import { RigActor } from '../../../systems/hd/RigActor';
import { deepEnv, type DeepBase } from '../../enemies/deep/kit';
import type { Damageable, Hazard, Hit, HitResult, Liftable } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import { BossHazards } from '../BossHazards';
import type { BossWorld } from '../HunterDrone';
import { Booth } from './booth';
import { DEEPMAW_AGAIN, DEEPMAW_CAUGHT, DEEPMAW_DRAIN, DEEPMAW_INTRO, DEEPMAW_MAELSTROM } from './lines';
import { Burst, DeepPart } from './parts';
import { BAIT_FORMS, bodyMultiplier, dryAttack, maelstromLevel, stageFor, stageStartHp, wetAttack, type DeepStage } from './rules';
import { DEEPMAW_SFX } from './sfx';

type State = 'intro' | 'idle' | 'attack' | 'stunned' | 'transition' | 'dying' | 'dead';
type Attack = 'bait' | 'flash' | 'swallow' | 'slam' | 'roll' | 'leap' | 'flood';

const TANK = 't-moonpool';
const STAGE_NAMES = ['LIGHTS OUT', 'HIGH AND DRY', 'THE MAELSTROM'] as const;
/** The rig's origin sits this far below the middle of its body (rig px). */
const BODY_DROP = 24;
/** His mouth and the lure's bulb relative to the middle of his body (rig px, facing right). */
const MOUTH = { x: 30, y: 10 };
const HALF_W = D.body.width / 2;
const HALF_H = D.body.height / 2;
/** Where he holds in the water between attacks (stages 1 and 3). */
const HOLD_Y = 39 * TILE;

/**
 * DEEPMAW in the moon pool (Chapter 7's boss): a giant anglerfish of a pirate,
 * out of Cell 7. One bar, three stages, each a hidden checkpoint.
 *
 * 1. LIGHTS OUT: the pool flooded and dark, only his lure lighting it. He
 *    dangles the lure as bait, then it flares and freezes (the tell) and he
 *    lunges along a red line; or he rears back and the lure flashes. Hitting
 *    the lure stuns him with his jaw hanging open: the moment to hit him.
 * 2. HIGH AND DRY: Max drains the pool. He flops on its floor: tail slams
 *    (shockwaves along the floor), a rolling chomp, belly flops that reach
 *    the decks; every third attack he dives for the drain and the water
 *    surges back up for one lunge (FLOOD WARNING).
 * 3. THE MAELSTROM: he rips the outer hatch open. The sea pours in as a
 *    whirlpool pulling toward his mouth while the water rises and falls,
 *    debris circles him, he swallows what the current brings and spits it back.
 *
 * Max works the pumps from the booth; Gwen shields Ben once a stage when he's low.
 */
export class DeepmawBoss implements ArenaBoss {
  readonly name = D.name;
  readonly subtitle = D.subtitle;
  readonly maxHp = D.maxHp;
  readonly phase2Title = STAGE_NAMES[1];
  readonly defeatTitle = 'RECAPTURED!';
  readonly countsAsEnemy = true;
  readonly extraTargets: readonly Damageable[];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[] = [];
  hp: number = D.maxHp;
  lastDamage = 0;
  private stage: DeepStage = 0;
  private state: State = 'intro';
  private stateT = 0;
  private restMs = 0;
  private attack: Attack | null = null;
  private step = '';
  private stepT = 0;
  /** Attacks so far this stage (the order and FLOOD WARNING count from it). */
  private count = 0;
  private stageT = 0;
  private readonly actor: RigActor;
  private readonly body: DeepPart;
  private readonly lure: DeepPart;
  private readonly bite: Burst;
  private readonly flashZone: Burst;
  private readonly landing: Burst;
  private readonly debris: DeepPart[] = [];
  private readonly debrisArt: Phaser.GameObjects.Image[] = [];
  private readonly floorHazards: BossHazards;
  private readonly booth: Booth;
  private readonly base: DeepBase | null;
  private readonly bulbBone: number;
  private readonly bulb = { x: 0, y: 0 };
  private readonly stasis: Phaser.GameObjects.Ellipse;
  // Where he is (the middle of his body), where he's going, which way he faces.
  private x: number;
  private y: number;
  private dir: 1 | -1 = -1;
  private rot = 0;
  private aimX = 1;
  private aimY = 0;
  private fromX = 0;
  private fromY = 0;
  private toX = 0;
  private toY = 0;
  private clip = 'idle';
  private flash = 0;
  private stunLeft = 0;
  private openLeft = 0;
  private bounced = false;
  private shots = 0;
  private pingIn = 0;
  private debrisSpin = 0;
  /** The flood surge's lunge: after it, the water drains away again. */
  private floodLunge = false;
  private readonly shieldUsed = [false, false, false];
  private readonly baitForms = new Set<string>();
  private baitAwarded = false;
  private introStarted = false;
  // The moon pool (px).
  private readonly poolX0 = 416 * TILE;
  private readonly poolX1 = 446 * TILE;
  private readonly poolFloor = 46 * TILE;
  private readonly deckY = 40 * TILE;
  private readonly midX: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly w: BossWorld,
    x: number,
  ) {
    const res = plumberArtRes(scene.game);
    const rig = castRig('deepmaw');
    this.actor = new RigActor(scene, rig, rigTextureKey('deepmaw'));
    this.actor.container.setDepth(DEPTH.boss);
    this.bulbBone = this.actor.info.bone('bulb');
    makeRigPortrait(scene, HD_PORTRAITS.deepmaw, rig, { clip: 'talk', t: 0.25, cx: 15, cy: -24, scale: 1.2, bg: 0x0c2632, glow: PALETTE.deepmaw }, res);
    this.base = deepEnv.base;
    this.midX = x;
    this.x = x;
    this.y = this.poolFloor - HALF_H;
    this.body = new DeepPart(D.body.width, D.body.height, D.contactDamage, (hit) => this.hitBody(hit));
    this.lure = new DeepPart(D.lureRadius * 2, D.lureRadius * 2, 0, (hit) => this.hitLure(hit));
    this.bite = new Burst(D.maelstrom.biteReach * 2, D.maelstrom.biteReach * 2, D.maelstrom.biteDamage);
    this.flashZone = new Burst(D.lightsOut.flashRadius * 1.7, D.lightsOut.flashRadius * 1.7, D.lightsOut.flashDamage);
    this.landing = new Burst(D.highAndDry.leapZone, 44, D.highAndDry.leapDamage);
    for (let i = 0; i < D.maelstrom.debris; i++) {
      this.debris.push(new DeepPart(22, 22, D.maelstrom.debrisDamage, null));
      this.debrisArt.push(scene.add.image(0, 0, PLUMBER_ART.props, i % 2 === 0 ? 'crate' : 'cableReel').setDepth(DEPTH.boss + 1).setVisible(false));
    }
    // Shockwaves along the pool's floor, not the arena's.
    this.floorHazards = new BossHazards(scene, this.poolFloor, w.fx, w.lighting, w.telegraph);
    this.booth = new Booth(scene, w.fx, (this.base?.kit.level.story?.plumber?.moonPool.boothX ?? 431) * TILE, (D.boothRow - 1) * TILE + 2, res);
    this.stasis = scene.add.ellipse(0, 0, 10, 10, PALETTE.plumber, 0.18).setStrokeStyle(2, PALETTE.plumber, 0.9).setDepth(DEPTH.boss + 2).setVisible(false);
    this.extraTargets = [this.body, this.lure];
    this.extraHazards = [this.body, this.bite, this.flashZone, this.landing, ...this.debris, ...this.floorHazards.all()];
    // The arena is one screen wide: the camera pulls back for the fight.
    cameraZoom.base = CH7_HD.arenaZoom;
    scene.tweens.add({ targets: scene.cameras.main, zoom: CH7_HD.arenaZoom, duration: 700, ease: 'Sine.InOut' });
    if (w.resumeStage) this.resume(w.resumeStage as DeepStage);
  }

  // ------------------------------------------------------------ ArenaBoss

  get phase(): number {
    return this.stage;
  }

  get alive(): boolean {
    return this.state !== 'dying' && this.state !== 'dead';
  }

  get defeated(): boolean {
    return !this.alive;
  }

  get introducing(): boolean {
    return this.state === 'intro';
  }

  /** The boss as a whole is never hit or touched: its body and lure are (`extraTargets`). */
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

  // ------------------------------------------------------------ The moon pool

  private get level(): number {
    return this.base?.tanks.get(TANK)?.level ?? this.poolFloor;
  }

  private floorAt(x: number): number {
    return x >= this.poolX0 && x < this.poolX1 ? this.poolFloor : this.deckY;
  }

  /** Under water right now (the middle of his body below the surface). */
  private get wet(): boolean {
    return this.y > this.level + 6;
  }

  private setStageWorld(stage: DeepStage, snap: boolean): void {
    const base = this.base;
    if (!base) return;
    const kit = base.kit;
    const a = this.w.arena;
    if (stage === 0) {
      base.setLamps('moonpool', 'off', false);
      kit.setDarkness({ fromX: a.left - TILE, toX: a.right + TILE });
      base.tanks.snapLevel(TANK, D.lightsOut.level);
    } else if (stage === 1) {
      kit.setDarkness(null);
      base.setLamps('moonpool', 'on');
      if (snap) base.tanks.snapLevel(TANK, D.highAndDry.level);
      else base.tanks.setLevel(TANK, D.highAndDry.level, D.highAndDry.drainSpeed);
    } else {
      kit.setDarkness(null);
      base.setLamps('moonpool', 'emergency', false);
      if (snap) base.tanks.snapLevel(TANK, D.maelstrom.level);
      else base.tanks.setLevel(TANK, D.maelstrom.level, D.maelstrom.floodSpeed);
    }
  }

  /** A retry from a stage's checkpoint: straight into that stage. */
  private resume(stage: DeepStage): void {
    this.stage = stage;
    this.hp = stageStartHp(stage);
    this.setStageWorld(stage, true);
    this.introStarted = true;
    this.y = stage === 1 ? this.poolFloor - HALF_H : HOLD_Y;
    this.booth.show();
    this.banner();
    this.w.onHealth(this.hp / this.maxHp, this.stage);
    this.scene.time.delayedCall(700, () => this.toIdle(400));
  }

  private banner(): void {
    EventBus.emit('hud:banner', { title: STAGE_NAMES[this.stage], color: PALETTE.deepmaw, durationMs: 1400, style: 'boss' });
  }

  // ------------------------------------------------------------ Hits

  private canBeHit(): boolean {
    return this.state === 'idle' || this.state === 'attack' || this.state === 'stunned';
  }

  private hitBody(hit: Hit): HitResult {
    if (!this.canBeHit()) return 'none';
    const dry = this.stage === 1 && !this.wet;
    const mult = bodyMultiplier(this.stunLeft > 0, dry || this.openLeft > 0);
    if (mult < 1) this.w.tip('deepmaw-lure', 'HE SHRUGS IT OFF! HIT HIS GLOWING LURE TO STUN HIM, THEN GO FOR THE JAW!', 4500);
    return this.hurt(hit, hit.damage * mult);
  }

  private hitLure(hit: Hit): HitResult {
    if (!this.canBeHit()) return 'none';
    if (this.stunLeft > 0) return this.hurt(hit, hit.damage * D.stunnedMultiplier);
    this.stun();
    return this.hurt(hit, hit.damage * D.guardMultiplier);
  }

  private stun(): void {
    this.stunLeft = pace.punish(D.stunnedMs);
    this.attack = null;
    this.floodLunge = false;
    this.w.cancelThreat();
    this.set('stunned');
    this.w.fx.popText(this.bulb.x, this.bulb.y - 18, 'LURE HIT!', PALETTE.deepmaw);
    this.w.fx.burst('spark', this.bulb.x, this.bulb.y, 14);
    this.w.fx.ring(this.bulb.x, this.bulb.y, PALETTE.deepmaw, 46, 300);
    playSfx('clang', 0.8, 1.3);
    // BAIT AND SWITCH: three different forms stun the lure in one fight.
    this.baitForms.add(this.w.playerForm?.() ?? 'ben');
    if (!this.baitAwarded && this.baitForms.size >= BAIT_FORMS) {
      this.baitAwarded = true;
      this.w.achievement?.('bait-and-switch');
    }
  }

  private hurt(hit: Hit, dmg: number): HitResult {
    this.lastDamage = dmg;
    this.body.lastDamage = dmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.flash = 80;
    this.w.fx.burst('bubble', hit.x, hit.y, dmg >= 3 ? 10 : 5);
    this.w.fx.burst('spark', hit.x, hit.y, 3);
    playSfx('droneHit', 0.7, 0.6);
    this.w.onHealth(this.hp / this.maxHp, this.stage);
    if (this.hp <= 0) {
      this.die();
      return 'killed';
    }
    const want = stageFor(this.hp / this.maxHp);
    if (want > this.stage) this.beginStage(want);
    return 'hit';
  }

  // ------------------------------------------------------------ Flow

  private set(state: State): void {
    this.state = state;
    this.stateT = 0;
  }

  private toIdle(extra = 0): void {
    this.attack = null;
    this.step = '';
    this.body.damage = D.contactDamage;
    this.rot = 0;
    this.set('idle');
    this.restMs = pace.bossRest(D.idleMs[this.stage]) + extra;
  }

  private begin(attack: Attack, step: string): void {
    this.attack = attack;
    this.step = step;
    this.stepT = 0;
    this.set('attack');
  }

  private to(step: string): void {
    this.step = step;
    this.stepT = 0;
  }

  private beginStage(stage: DeepStage): void {
    this.stage = stage;
    this.count = 0;
    this.stageT = 0;
    this.attack = null;
    this.floodLunge = false;
    this.stunLeft = 0;
    this.openLeft = 0;
    this.rot = 0;
    this.w.cancelThreat();
    this.set('transition');
    this.banner();
    this.w.reachStage?.(stage);
    this.booth.atConsole(true);
    if (stage === 1) {
      this.setStageWorld(1, false);
      this.w.dialogue?.(DEEPMAW_DRAIN, () => undefined);
    } else {
      this.w.dialogue?.(DEEPMAW_MAELSTROM, () => undefined);
    }
  }

  private die(): void {
    this.set('dying');
    this.attack = null;
    this.w.cancelThreat();
    this.body.on = this.body.harmful = this.lure.on = false;
    this.bite.live = this.flashZone.live = this.landing.live = 0;
    for (const d of this.debris) d.harmful = false;
    this.floorHazards.clear();
    this.base?.tanks.setVortex(null);
    this.w.time.slowMo(0.3, 900, 500);
    this.w.fx.shake(FX.shakeMedium, 400);
    playSfx('roar', 1, 0.7);
    this.w.dialogue?.(DEEPMAW_CAUGHT, () => undefined);
  }

  update(dtMs: number): void {
    this.stateT += dtMs;
    this.stepT += dtMs;
    this.stageT += dtMs;
    this.flash = Math.max(0, this.flash - dtMs);
    this.openLeft = Math.max(0, this.openLeft - dtMs);
    this.bite.live = Math.max(0, this.bite.live - dtMs);
    this.flashZone.live = Math.max(0, this.flashZone.live - dtMs);
    this.landing.live = Math.max(0, this.landing.live - dtMs);
    switch (this.state) {
      case 'intro':
        this.updateIntro();
        break;
      case 'idle':
        this.updateIdle(dtMs);
        break;
      case 'attack':
        this.updateAttack(dtMs);
        break;
      case 'stunned':
        this.updateStunned(dtMs);
        break;
      case 'transition':
        this.updateTransition(dtMs);
        break;
      case 'dying':
        this.updateDying(dtMs);
        break;
      case 'dead':
        this.bob(dtMs, 0.4);
        break;
    }
    this.floorHazards.update(dtMs, this.w.now);
    this.updateMaelstrom(dtMs);
    this.updateShield();
    this.booth.update(dtMs, this.w.player.x, this.w.player.centerY);
    this.render(dtMs);
  }

  private updateIntro(): void {
    if (this.introStarted) return;
    this.introStarted = true;
    this.setStageWorld(0, true);
    // Up out of the dark at the bottom of the pool.
    this.y = this.poolFloor - HALF_H;
    this.clip = 'idle';
    this.scene.tweens.add({ targets: this, y: 38 * TILE, duration: 1600, ease: 'Sine.Out', onComplete: () => (this.clip = 'roar') });
    playSfx('roar', 0.8, 0.6);
    const go = () => {
      this.w.holdPlayer?.(false);
      this.clip = 'idle';
      this.banner();
      this.scene.time.delayedCall(900, () => this.booth.show());
      this.toIdle(600);
    };
    if (this.w.dialogue && this.w.introSeen === false) {
      this.w.holdPlayer?.(true);
      this.w.dialogue(DEEPMAW_INTRO, go);
    } else {
      this.w.dialogue?.(DEEPMAW_AGAIN, () => undefined);
      this.booth.show();
      this.scene.time.delayedCall(1700, go);
    }
  }

  private updateTransition(dtMs: number): void {
    if (this.stage === 1) {
      // Thrashing as the water drains away, then down on the pool's floor.
      this.clip = this.wet ? 'swallow' : 'flop';
      this.sinkToFloor(dtMs, 140);
      if (this.stateT >= D.transitionMs && this.level >= this.poolFloor - 2) this.toIdle(500);
      return;
    }
    // He rips the outer hatch open: the sea pours in.
    this.clip = 'roar';
    this.moveToward(dtMs, this.midX, HOLD_Y, 80);
    if (this.stateT >= 600 && this.stateT - dtMs < 600) {
      this.setStageWorld(2, false);
      playSfx(DEEPMAW_SFX.hatch, 1);
      this.w.fx.shake(FX.shakeMedium, 600);
      for (let i = 0; i < 4; i++) this.w.fx.burst('bubble', this.midX + (i - 1.5) * 40, this.poolFloor - 4, 14);
      this.w.tip('deepmaw-maelstrom', 'THE CURRENT PULLS YOU TO HIS MOUTH: SWIM AGAINST IT, WALK THE BOTTOM, OR HIT HIM FROM RANGE!', 5000);
    }
    if (this.stateT >= D.transitionMs + 600 && Math.abs(this.level - D.maelstrom.level * TILE) < TILE * 1.5) this.toIdle(400);
  }

  private updateDying(dtMs: number): void {
    this.clip = this.stateT < 900 ? 'stunned' : 'defeat';
    this.bob(dtMs, 0.5);
    // Max drops the containment field round him.
    if (this.stateT >= 700) {
      const k = Math.min(1, (this.stateT - 700) / 900);
      if (!this.stasis.visible) {
        this.stasis.setVisible(true);
        playSfx(DEEPMAW_SFX.stasis, 1);
        this.booth.atConsole(true);
      }
      this.stasis.setPosition(this.x, this.y).setSize(150 * k, 130 * k).setDisplaySize(150 * k, 130 * k);
      this.w.lighting.add(this.x, this.y, 110 * k, PALETTE.plumber, 0.8);
    }
    if (this.stateT >= D.dyingMs) {
      this.set('dead');
      this.base?.setLamps('moonpool', 'on');
      cameraZoom.base = CH7_HD.zoom;
      this.scene.tweens.add({ targets: this.scene.cameras.main, zoom: CH7_HD.zoom, duration: 900, ease: 'Sine.InOut' });
      this.w.onDefeated(this.x, this.y);
    }
  }

  private updateStunned(dtMs: number): void {
    this.stunLeft = Math.max(0, this.stunLeft - dtMs);
    this.clip = this.stage === 1 && !this.wet ? 'flop' : 'stunned';
    if (this.wet) this.moveToward(dtMs, this.x, this.maxY(this.x), 18);
    if (this.stunLeft <= 0) this.toIdle(200);
  }

  // ------------------------------------------------------------ Idle: where he waits

  private updateIdle(dtMs: number): void {
    const p = this.w.player;
    if (this.stage === 0) {
      // Circling Ben in the dark, keeping his distance.
      const side = Math.sign(this.x - p.x) || 1;
      this.moveToward(dtMs, p.x + side * D.lightsOut.keepAway, p.centerY, D.lightsOut.driftSpeed);
      this.clip = 'idle';
    } else if (this.stage === 1) {
      if (this.wet) this.sinkToFloor(dtMs, 120);
      else {
        // Flopping along the pool's floor after Ben.
        this.clip = 'flop';
        this.x += Math.sign(Phaser.Math.Clamp(p.x, this.poolX0 + HALF_W, this.poolX1 - HALF_W) - this.x) * 26 * (dtMs / 1000);
        this.y = this.poolFloor - HALF_H;
      }
    } else {
      // Holding the middle of the whirlpool.
      this.moveToward(dtMs, this.midX, HOLD_Y + Math.sin(this.stageT * 0.0015) * 10, 70);
      this.clip = 'idle';
    }
    this.face(p.x);
    if (this.stateT < this.restMs || p.dead) return;
    this.chooseAttack();
  }

  private chooseAttack(): void {
    const n = this.count++;
    if (this.stage === 1) {
      const a = dryAttack(n);
      if (a === 'flood') return this.beginFlood();
      if (a === 'slam') return this.beginSlam();
      if (a === 'roll') return this.beginRoll();
      return this.beginLeap();
    }
    const a = wetAttack(this.stage, n);
    if (a === 'flash') return this.beginFlash();
    if (a === 'swallow') return this.beginSwallow();
    this.begin('bait', 'bait');
    this.pingIn = 0;
  }

  private updateAttack(dtMs: number): void {
    switch (this.attack) {
      case 'bait':
        this.updateBait(dtMs);
        break;
      case 'flash':
        this.updateFlash(dtMs);
        break;
      case 'swallow':
        this.updateSwallow(dtMs);
        break;
      case 'slam':
        this.updateSlam();
        break;
      case 'roll':
        this.updateRoll(dtMs);
        break;
      case 'leap':
        this.updateLeap(dtMs);
        break;
      case 'flood':
        this.updateFlood(dtMs);
        break;
      default:
        this.toIdle();
    }
  }

  // ------------------------------------------------------------ The bait, the flare and the lunge (stages 1 and 3, and the flood)

  private updateBait(dtMs: number): void {
    const L = D.lightsOut;
    const p = this.w.player;
    const mouthX = this.x + this.dir * MOUTH.x * D.scale;
    const mouthY = this.y + MOUTH.y * D.scale;
    if (this.step === 'bait') {
      // The lure dangled out toward Ben, swaying: hittable all along.
      this.clip = 'lure';
      this.face(p.x);
      this.moveToward(dtMs, p.x - this.dir * 90, p.centerY - 10, L.baitSpeed);
      this.pingIn -= dtMs;
      if (this.pingIn <= 0) {
        this.pingIn = 650;
        playSfx(DEEPMAW_SFX.ping, 0.7);
      }
      if (this.stepT >= L.baitMs) this.beginFlare();
      return;
    }
    if (this.step === 'flare') {
      this.clip = 'flare';
      if (this.stepT < L.aimTrackMs) this.aimAt(mouthX, mouthY, p.x, p.centerY);
      const t = Math.min(1, this.stepT / L.flareMs);
      const reach = 460;
      this.w.telegraph.dashed(mouthX, mouthY, mouthX + this.aimX * reach, mouthY + this.aimY * reach, TELL.deepmaw, 0.3 + t * 0.6, this.stepT * 0.08, t > 0.7 ? 3 : 2);
      if (this.stepT >= L.flareMs) {
        this.to('lunge');
        this.actor.play('lunge', true);
        this.clip = 'lunge';
        this.body.damage = L.lungeDamage;
        playSfx(DEEPMAW_SFX.chomp, 1);
        this.w.fx.burst('bubble', this.x, this.y, 12);
      }
      return;
    }
    if (this.step === 'lunge') {
      const v = L.lungeSpeed * (dtMs / 1000);
      const nx = this.x + this.aimX * v;
      const ny = this.y + this.aimY * v;
      // A wall stops him; the surface or the floor only turns him along it.
      const blocked = nx < this.minX() || nx > this.maxX();
      this.x = Phaser.Math.Clamp(nx, this.minX(), this.maxX());
      this.y = Phaser.Math.Clamp(ny, this.minY(), this.maxY(this.x));
      if (chance(0.6)) this.w.fx.trail('bubble', this.x - this.dir * HALF_W, this.y);
      if (blocked || this.stepT >= L.lungeMaxMs) {
        if (blocked) {
          this.w.fx.shake(FX.shakeLight, 200);
          playSfx(DEEPMAW_SFX.smack, 0.5);
        }
        this.to('recover');
        this.body.damage = D.contactDamage;
        this.openLeft = D.recoverMs;
      }
      return;
    }
    // Recovering: open for a moment, drifting.
    this.clip = 'idle';
    if (this.stepT >= D.recoverMs) {
      if (this.floodLunge) {
        this.floodLunge = false;
        this.attack = 'flood';
        this.to('drain');
        this.base?.tanks.setLevel(TANK, D.highAndDry.level, D.highAndDry.drainSpeed);
        this.set('attack');
      } else this.toIdle();
    }
  }

  private beginFlare(): void {
    const mouthX = this.x + this.dir * MOUTH.x * D.scale;
    const mouthY = this.y + MOUTH.y * D.scale;
    const p = this.w.player;
    this.to('flare');
    this.face(p.x);
    this.aimAt(mouthX, mouthY, p.x, p.centerY);
    this.w.threat(this.w.now + D.lightsOut.flareMs);
    playSfx(DEEPMAW_SFX.flare, 0.9);
  }

  private aimAt(fx: number, fy: number, tx: number, ty: number): void {
    const dx = tx - fx;
    const dy = ty - fy;
    const d = Math.hypot(dx, dy) || 1;
    this.aimX = dx / d;
    this.aimY = dy / d;
  }

  private beginFlash(): void {
    this.begin('flash', 'windup');
    this.actor.play('spit', true);
    this.clip = 'spit';
    this.w.threat(this.w.now + D.lightsOut.flashWindupMs);
    playSfx(DEEPMAW_SFX.flare, 0.6);
  }

  private updateFlash(_dtMs: number): void {
    const L = D.lightsOut;
    this.face(this.w.player.x);
    if (this.step === 'windup') {
      const t = Math.min(1, this.stepT / L.flashWindupMs);
      this.w.telegraph.circle(this.bulb.x, this.bulb.y, 20 + t * (L.flashRadius - 20), TELL.deepmaw, 0.3 + t * 0.6);
      if (this.stepT >= L.flashWindupMs) {
        this.to('flash');
        this.flashZone.x = this.bulb.x;
        this.flashZone.y = this.bulb.y;
        this.flashZone.live = 140;
        flashCamera(this.scene.cameras.main, 220, 230, 255, 170);
        this.w.lighting.flash(this.bulb.x, this.bulb.y, L.flashRadius * 2.4, PALETTE.deepmaw, 500);
        this.w.fx.ring(this.bulb.x, this.bulb.y, PALETTE.deepmaw, L.flashRadius, 260);
        this.w.fx.ring(this.bulb.x, this.bulb.y, PALETTE.white, L.flashRadius * 0.7, 200, 0.7);
        playSfx(DEEPMAW_SFX.flash, 1);
      }
      return;
    }
    if (this.stepT >= 420) this.toIdle();
  }

  // ------------------------------------------------------------ Stage 2: on the pool's floor

  private beginSlam(): void {
    this.begin('slam', 'windup');
    this.actor.play('slam', true);
    this.clip = 'slam';
    this.w.threat(this.w.now + D.highAndDry.slamWindupMs);
  }

  private updateSlam(): void {
    const H = D.highAndDry;
    if (this.step === 'windup') {
      const t = Math.min(1, this.stepT / H.slamWindupMs);
      this.w.telegraph.zone(this.poolX0, this.poolFloor - H.waveHeight, this.poolX1 - this.poolX0, H.waveHeight, TELL.deepmaw, 0.25 + t * 0.55, this.stepT * 0.06, 0);
      if (this.stepT >= H.slamWindupMs) {
        this.to('after');
        this.floorHazards.spawnShockwave(this.x - HALF_W * 0.5, -1, PALETTE.deepmaw);
        this.floorHazards.spawnShockwave(this.x + HALF_W * 0.5, 1, PALETTE.deepmaw);
        this.w.fx.shake(FX.shakeMedium, 280);
        this.w.fx.burst('splash', this.x, this.poolFloor - 4, 18);
        this.w.fx.burst('dust', this.x, this.poolFloor - 2, 10);
        playSfx(DEEPMAW_SFX.smack, 1);
      }
      return;
    }
    if (this.stepT >= 450) this.toIdle();
  }

  private beginRoll(): void {
    this.begin('roll', 'curl');
    this.clip = 'roll';
    this.dir = this.w.player.x >= this.x ? 1 : -1;
    this.bounced = false;
    this.w.threat(this.w.now + D.highAndDry.rollWindupMs);
  }

  private updateRoll(dtMs: number): void {
    const H = D.highAndDry;
    this.clip = 'roll';
    this.y = this.poolFloor - HALF_H;
    if (this.step === 'curl') {
      const t = Math.min(1, this.stepT / H.rollWindupMs);
      const x1 = this.dir > 0 ? this.poolX1 : this.poolX0;
      this.w.telegraph.dashed(this.x, this.poolFloor - 10, x1, this.poolFloor - 10, TELL.deepmaw, 0.3 + t * 0.6, this.stepT * 0.08, 2);
      this.rot += this.dir * (dtMs / 1000) * 4 * t;
      if (chance(0.4)) this.w.fx.trail('dust', this.x - this.dir * HALF_W, this.poolFloor - 2);
      if (this.stepT >= H.rollWindupMs) {
        this.to('roll');
        this.body.damage = H.rollDamage;
        playSfx(DEEPMAW_SFX.chomp, 0.8);
      }
      return;
    }
    if (this.step === 'roll') {
      const v = H.rollSpeed * (dtMs / 1000);
      this.x += this.dir * v;
      this.rot += (this.dir * v) / HALF_H;
      if (chance(0.5)) this.w.fx.trail('dust', this.x, this.poolFloor - 2);
      const lo = this.poolX0 + HALF_W;
      const hi = this.poolX1 - HALF_W;
      if (this.x <= lo || this.x >= hi) {
        this.x = Phaser.Math.Clamp(this.x, lo, hi);
        this.w.fx.shake(FX.shakeLight, 200);
        playSfx(DEEPMAW_SFX.smack, 0.7);
        if (this.bounced) {
          this.to('unroll');
          this.body.damage = D.contactDamage;
        } else {
          this.bounced = true;
          this.dir = this.dir > 0 ? -1 : 1;
        }
      }
      return;
    }
    // Unrolling, dizzy for a moment.
    this.rot *= 0.85;
    if (this.stepT >= 380) this.toIdle();
  }

  private beginLeap(): void {
    const H = D.highAndDry;
    const p = this.w.player;
    const a = this.w.arena;
    this.begin('leap', 'crouch');
    this.clip = 'flop';
    this.fromX = this.x;
    this.fromY = this.y;
    this.toX = Phaser.Math.Clamp(p.x, a.left + HALF_W, a.right - HALF_W);
    this.toY = this.floorAt(this.toX) - HALF_H;
    this.face(this.toX);
    this.w.threat(this.w.now + H.leapCrouchMs + H.leapFlightMs);
  }

  private updateLeap(dtMs: number): void {
    const H = D.highAndDry;
    const zoneY = this.floorAt(this.toX);
    if (this.step === 'crouch' || this.step === 'flight') {
      const t = this.step === 'crouch' ? this.stepT / (H.leapCrouchMs + H.leapFlightMs) : (H.leapCrouchMs + this.stepT) / (H.leapCrouchMs + H.leapFlightMs);
      this.w.telegraph.zone(this.toX - H.leapZone / 2, zoneY - 18, H.leapZone, 18, TELL.deepmaw, 0.3 + Math.min(1, t) * 0.55, this.stateT * 0.06, 0);
    }
    if (this.step === 'crouch') {
      this.clip = 'flop';
      if (this.stepT >= H.leapCrouchMs) {
        this.to('flight');
        this.clip = 'leap';
        playSfx('whoosh', 0.8, 0.7);
        this.w.fx.burst('dust', this.x, this.poolFloor - 2, 12);
      }
      return;
    }
    if (this.step === 'flight') {
      const k = Math.min(1, this.stepT / H.leapFlightMs);
      this.x = Phaser.Math.Linear(this.fromX, this.toX, k);
      this.y = Phaser.Math.Linear(this.fromY, this.toY, k) - H.leapHeight * 4 * k * (1 - k);
      this.clip = 'leap';
      if (k >= 1) {
        this.landing.x = this.toX;
        this.landing.y = zoneY - this.landing.h / 2;
        this.landing.live = 140;
        this.w.fx.shake(FX.shakeMedium, 320);
        this.w.fx.burst('dust', this.x, zoneY - 2, 18);
        playSfx(DEEPMAW_SFX.smack, 1);
        this.to(zoneY === this.deckY ? 'deck' : 'after');
      }
      return;
    }
    if (this.step === 'deck') {
      // Beached on a deck: wide open until he gets himself back into the pool.
      this.clip = 'flop';
      this.openLeft = 100;
      if (this.stepT >= pace.punish(H.deckFlopMs)) {
        this.to('slide');
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = Phaser.Math.Clamp(this.x, this.poolX0 + HALF_W, this.poolX1 - HALF_W);
        this.toY = this.poolFloor - HALF_H;
      }
      return;
    }
    if (this.step === 'slide') {
      const k = Math.min(1, this.stepT / 520);
      this.x = Phaser.Math.Linear(this.fromX, this.toX, k);
      this.y = Phaser.Math.Linear(this.fromY, this.toY, k) - 40 * 4 * k * (1 - k);
      if (k >= 1) this.toIdle();
      return;
    }
    if (this.stepT >= 350) this.toIdle();
    void dtMs;
  }

  private beginFlood(): void {
    this.begin('flood', 'rise');
    this.clip = 'roar';
    this.base?.tanks.setLevel(TANK, D.highAndDry.floodLevel, D.highAndDry.floodSpeed);
    EventBus.emit('hud:banner', { title: 'FLOOD WARNING!', color: 0x4ab8ff, durationMs: 1300, style: 'slam' });
    playSfx(DEEPMAW_SFX.klaxon, 1);
    this.w.tip('deepmaw-flood', 'THE WATER IS COMING BACK UP! WATCH FOR HIS LUNGE!', 3500);
  }

  private updateFlood(dtMs: number): void {
    const H = D.highAndDry;
    if (this.step === 'rise') {
      this.clip = 'roar';
      // He rises with the water, then lunges once.
      const target = Math.min(this.poolFloor - HALF_H, this.level + 70);
      this.moveToward(dtMs, this.x, target, 120);
      const up = Math.abs(this.level - H.floodLevel * TILE) < TILE;
      if ((up && this.stepT >= 900) || this.stepT >= 3200) {
        this.attack = 'bait';
        this.floodLunge = true;
        this.beginFlare();
      }
      return;
    }
    // Draining: back down to the floor.
    this.sinkToFloor(dtMs, 140);
    if (this.level >= this.poolFloor - 2 && !this.wet) this.toIdle();
  }

  // ------------------------------------------------------------ Stage 3: the whirlpool

  private beginSwallow(): void {
    this.begin('swallow', 'windup');
    this.clip = 'swallow';
    this.shots = 0;
    this.w.threat(this.w.now + D.maelstrom.swallowWindupMs);
    playSfx(DEEPMAW_SFX.suck, 0.8);
  }

  private updateSwallow(dtMs: number): void {
    const M = D.maelstrom;
    const p = this.w.player;
    const mouthX = this.x + this.dir * MOUTH.x * D.scale;
    const mouthY = this.y + MOUTH.y * D.scale;
    this.face(p.x);
    this.moveToward(dtMs, this.midX, HOLD_Y, 60);
    if (this.step === 'windup') {
      this.clip = 'swallow';
      const t = Math.min(1, this.stepT / M.swallowWindupMs);
      this.w.telegraph.circle(mouthX, mouthY, 220 - t * 180, TELL.deepmaw, 0.3 + t * 0.6);
      if (this.stepT >= M.swallowWindupMs) this.to('suck');
      return;
    }
    if (this.step === 'suck') {
      this.clip = 'swallow';
      // The bite waits at his mouth for anything the current brings.
      this.bite.x = mouthX;
      this.bite.y = mouthY;
      this.bite.live = 60;
      if (chance(0.7)) {
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 120;
        this.w.fx.trail('bubble', mouthX + Math.cos(a) * r, mouthY + Math.sin(a) * r);
      }
      if (this.stepT >= M.swallowMs) {
        this.to('spit');
        this.bite.live = 0;
        playSfx(DEEPMAW_SFX.chomp, 1);
      }
      return;
    }
    // Spitting what he caught back out at Ben.
    this.clip = 'lunge';
    const due = this.shots * M.spitGapMs;
    if (this.shots < M.spitShots && this.stepT >= due) {
      const a = Math.atan2(p.centerY - mouthY, p.x - mouthX) + (this.shots - 1) * 0.16;
      this.w.projectiles.spawn('shard', 'enemy', mouthX, mouthY, Math.cos(a) * M.spitSpeed, Math.sin(a) * M.spitSpeed, M.spitDamage, 2400, 5, { tint: 0xb8c49a });
      this.w.fx.burst('bubble', mouthX, mouthY, 6);
      this.shots++;
    }
    if (this.shots >= M.spitShots && this.stepT >= due + 300) this.toIdle();
  }

  /** The whirlpool: the water swings, the pull toward his mouth (harder while he swallows), debris circling. */
  private updateMaelstrom(dtMs: number): void {
    const on = this.stage === 2 && this.alive && this.state !== 'intro';
    const tanks = this.base?.tanks;
    const settled = on && !(this.state === 'transition' && this.stateT < D.transitionMs + 600);
    if (tanks) {
      if (settled) tanks.snapLevel(TANK, maelstromLevel(this.stageT));
      if (on) {
        const pull = D.maelstrom.pull * (this.attack === 'swallow' && this.step !== 'spit' ? D.maelstrom.swallowPull : 1) * Math.min(1, this.stageT / 1500);
        tanks.setVortex(TANK, this.x + this.dir * MOUTH.x * D.scale, this.y + MOUTH.y * D.scale, pull);
      } else if (this.stage === 2) tanks.setVortex(null);
    }
    this.debrisSpin += D.maelstrom.debrisSpin * (dtMs / 1000);
    const show = on && this.stageT > 1200;
    for (let i = 0; i < this.debris.length; i++) {
      const d = this.debris[i];
      const art = this.debrisArt[i];
      d.harmful = show;
      if (art.visible !== show) art.setVisible(show);
      if (!show) continue;
      const a = this.debrisSpin + (i / this.debris.length) * Math.PI * 2;
      d.x = this.x + Math.cos(a) * D.maelstrom.debrisRadius;
      d.y = this.y + Math.sin(a) * D.maelstrom.debrisRadius * 0.7;
      art.setPosition(d.x, d.y + 8).setRotation(a * 1.7);
    }
  }

  /** Gwen throws a shield down to Ben, once a stage, when he's low. */
  private updateShield(): void {
    const kit = this.base?.kit;
    if (!kit || this.shieldUsed[this.stage] || !this.canBeHit()) return;
    const p = kit.player;
    if (p.dead || p.hp > D.shield.atHp || !this.booth.gwen.visible) return;
    this.shieldUsed[this.stage] = true;
    p.setInvulnerable(D.shield.ms);
    this.booth.shield(p.x, p.centerY, D.shield.ms);
  }

  // ------------------------------------------------------------ Moving

  private minX(): number {
    return this.w.arena.left + HALF_W;
  }

  private maxX(): number {
    return this.w.arena.right - HALF_W;
  }

  private minY(): number {
    return this.level + HALF_H + 4;
  }

  /** As low as he can go at `x` (on the pool's floor, or over a deck). */
  private maxY(x: number): number {
    const left = x - HALF_W;
    const right = x + HALF_W;
    const overDeck = left < this.poolX0 || right > this.poolX1;
    return (overDeck ? this.deckY : this.poolFloor) - HALF_H - 2;
  }

  private moveToward(dtMs: number, tx: number, ty: number, speed: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.5) {
      const step = Math.min(d, speed * (dtMs / 1000));
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
    }
    this.x = Phaser.Math.Clamp(this.x, this.minX(), this.maxX());
    const lo = Math.min(this.minY(), this.maxY(this.x));
    this.y = Phaser.Math.Clamp(this.y, lo, this.maxY(this.x));
  }

  private sinkToFloor(dtMs: number, speed: number): void {
    this.x = Phaser.Math.Clamp(this.x, this.poolX0 + HALF_W, this.poolX1 - HALF_W);
    this.y = Math.min(this.poolFloor - HALF_H, this.y + speed * (dtMs / 1000));
  }

  private bob(dtMs: number, k: number): void {
    if (this.wet) this.y += Math.sin(this.stateT * 0.002) * 6 * k * (dtMs / 1000);
  }

  private face(x: number): void {
    if (Math.abs(x - this.x) > 8) this.dir = x >= this.x ? 1 : -1;
  }

  // ------------------------------------------------------------ Drawing

  private render(dtMs: number): void {
    const S = D.scale;
    const a = this.actor;
    a.play(this.clip);
    a.update(dtMs);
    // The rig's origin is under his body: turn him round the middle of it.
    const c = a.container;
    c.setScale(S * this.dir, S);
    c.rotation = this.rot;
    c.x = this.x + Math.sin(this.rot) * BODY_DROP * S;
    c.y = this.y + Math.cos(this.rot) * BODY_DROP * S;
    c.setVisible(true);
    a.setTint(this.flash > 0 ? 0xffffff : this.state === 'stunned' ? 0xb8c8d8 : -1, this.flash > 0 ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY);
    // The lure's bulb in the world.
    a.boneInto(this.bulbBone, this.bulb);
    this.bulb.x = c.x + this.bulb.x * S * this.dir;
    this.bulb.y = c.y + this.bulb.y * S;
    const fighting = this.state === 'idle' || this.state === 'attack' || this.state === 'stunned';
    this.body.x = this.x;
    this.body.y = this.y;
    this.body.on = fighting;
    this.body.harmful = fighting && this.state !== 'stunned';
    this.lure.x = this.bulb.x;
    this.lure.y = this.bulb.y;
    this.lure.on = fighting && this.state !== 'stunned' && this.attack !== 'roll';
    // His lure is the only light in LIGHTS OUT; it glows in every stage.
    const L = D.lightsOut.lureLight;
    const flare = this.clip === 'flare' || (this.attack === 'flash' && this.step === 'windup');
    const dim = this.state === 'stunned' || this.state === 'dying' || this.state === 'dead';
    if (!dim) this.w.lighting.add(this.bulb.x, this.bulb.y, flare ? L.radius * 1.3 : this.stage === 0 ? L.radius : L.radius * 0.6, PALETTE.deepmaw, flare ? 1.2 : L.intensity);
    if (this.stage === 0 && this.state !== 'intro') this.w.lighting.add(this.x + this.dir * 20 * S, this.y - 12 * S, 26, 0xf8e84a, 0.35);
  }

  destroy(): void {
    this.base?.tanks.setVortex(null);
    this.actor.destroy();
    this.booth.destroy();
    this.stasis.destroy();
    for (const d of this.debrisArt) d.destroy();
    this.floorHazards.clear();
  }
}
