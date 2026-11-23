import Phaser from 'phaser';
import { CH7_HD } from '../../../config/chapter7';
import { CACKLEJACK as C } from '../../../config/cacklejack';
import { DEPTH, FX, TILE } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { TELL } from '../../../config/tells';
import { castRig } from '../../../scenes/preload/cartoon/cast';
import { rigTextureKey } from '../../../scenes/preload/cartoon/rig';
import { CIRCUS_ART } from '../../../scenes/preload/cartoon/circus/keys';
import { TEX } from '../../../scenes/preload/assetKeys';
import { MAX_FRAME, MAX_FRAMES } from '../../../scenes/preload/family';
import { FamilyActor } from '../../../scenes/level/family/FamilyActor';
import { cameraZoom } from '../../../systems/CameraZoom';
import { pace } from '../../../systems/Difficulty';
import { EventBus } from '../../../systems/EventBus';
import { RigActor } from '../../../systems/hd/RigActor';
import { playSfx } from '../../../systems/audio/Sfx';
import { circusEnv } from '../../enemies/circus/kit';
import { CIRCUS_SFX } from '../../enemies/circus/sfx';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld } from '../HunterDrone';
import { CACKLE_AGAIN, CACKLE_BIGHEAD, CACKLE_FALL_TAUNTS, CACKLE_HIGHWIRE, CACKLE_INTRO } from './lines';
import { bodyMultiplier, headScale, mouthAt, stageFor, stageStartHp, trickAt, type CackleStage, type FearGasTrick } from './rules';

type State = 'intro' | 'idle' | 'tell' | 'act' | 'bow' | 'transition' | 'fall' | 'dying' | 'dead';
const STAGE_NAMES = ['FEAR GAS', 'THE HIGH WIRE', 'THE BIG HEAD'] as const;

/** A box the fight moves every frame: something to hit, something that hurts to touch, or both. */
class Part implements Damageable, Hazard {
  readonly countsAsEnemy = true;
  readonly stopsThrows = true;
  lastDamage = 0;
  on = false;
  harmful = false;
  x = 0;
  y = 0;
  constructor(
    public w: number,
    public h: number,
    public damage: number,
    private readonly onHit: ((hit: Hit) => HitResult) | null,
  ) {}
  get alive(): boolean {
    return this.on;
  }
  get active(): boolean {
    return this.harmful;
  }
  hurtbox(out: Rect): boolean {
    if (!this.on || !this.onHit) return false;
    out.x = this.x - this.w / 2 - 2;
    out.y = this.y - this.h / 2 - 2;
    out.w = this.w + 4;
    out.h = this.h + 4;
    return true;
  }
  hitbox(out: Rect): boolean {
    if (!this.harmful) return false;
    out.x = this.x - this.w / 2 + 3;
    out.y = this.y - this.h / 2 + 3;
    out.w = this.w - 6;
    out.h = this.h - 6;
    return true;
  }
  takeHit(hit: Hit): HitResult {
    if (!this.on || !this.onHit) return 'none';
    return this.onHit(hit);
  }
}

/** One of his acts in the ring (stage 2): IRONJAW or THE TANGLE. */
interface Act {
  actor: RigActor;
  part: Part;
  x: number;
  y: number;
  facing: 1 | -1;
  hp: number;
  state: 'off' | 'idle' | 'tell' | 'act' | 'dazed';
  stateT: number;
  readyAt: number;
  /** The move it's winding up, and where it aims. */
  move: string;
  tx: number;
  ty: number;
}

/**
 * CACKLEJACK in the big top (Chapter 8's boss, an original villain): a
 * ringmaster who feeds on fear. One bar, three stages, each a hidden
 * checkpoint. Max hangs in a cage over the ring the whole time.
 *
 * 1. FEAR GAS: he works the ring: three pies on red arcs, a pogo hop onto a
 *    red ring (a shockwave where he lands), a puff of fear gas on Ben's spot,
 *    a jack-in-the-box dropped in. After every trick he bows to the empty
 *    stands: the moment to hit him (double damage); otherwise he's slippery.
 * 2. THE HIGH WIRE: he swings across overhead dropping pies; IRONJAW stomps
 *    and throws kettlebells below, THE TANGLE reaches down from her trapeze.
 *    Put either act down and he loses his footing and falls into the ring.
 * 3. THE BIG HEAD: he blows himself up into a balloon of his own face that
 *    grows to fill the ring. Its grin opens on a beat (it quivers first): the
 *    valve in its throat takes real damage; a ball rolled into it bounces
 *    about inside like a pinball.
 */
export class CacklejackBoss implements ArenaBoss {
  readonly name = C.name;
  readonly subtitle = C.subtitle;
  readonly maxHp = C.maxHp;
  readonly phase2Title = STAGE_NAMES[1];
  readonly defeatTitle = "THE SHOW'S OVER!";
  readonly countsAsEnemy = true;
  readonly extraTargets: readonly Damageable[];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[] = [];
  readonly damage = 0;
  readonly active = false;
  hp: number = C.maxHp;
  lastDamage = 0;
  private stage: CackleStage = 0;
  private state: State = 'intro';
  private stateT = 0;
  private restMs = 0;
  private trick: FearGasTrick = 'pies';
  private count = 0;
  private x: number;
  private y: number;
  private facing: 1 | -1 = -1;
  private clip = 'idle';
  private flashLeft = 0;
  private readonly actor: RigActor;
  private readonly body: Part;
  private readonly landing: Part;
  private readonly grab: Part;
  private readonly iron: Act;
  private readonly tangle: Act;
  private readonly head: RigActor;
  private readonly balloon: Part;
  private readonly valve: Part;
  private headT = 0;
  private mouth: 'shut' | 'quiver' | 'open' = 'shut';
  private gasIn = 0;
  private pinballLeft = 0;
  private pinballTick = 0;
  private pinballActive = false;
  private dropIn = 0;
  private readonly cage: Phaser.GameObjects.Image;
  private readonly max: FamilyActor;
  private readonly bars: Phaser.GameObjects.Image[] = [];
  private readonly left: number;
  private readonly right: number;
  private readonly floorY: number;
  private readonly midX: number;
  // A hop's arc and a trick's aim.
  private fromX = 0;
  private toX = 0;
  private aimX = 0;
  private aimY = 0;
  private ghost: Phaser.GameObjects.Sprite | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly w: BossWorld,
    x: number,
  ) {
    this.left = w.arena.left;
    this.right = w.arena.right;
    this.floorY = w.arena.floorY;
    this.midX = (this.left + this.right) / 2;
    this.x = x;
    this.y = this.floorY;
    this.actor = new RigActor(scene, castRig('cacklejack'), rigTextureKey('cacklejack'));
    this.actor.container.setDepth(DEPTH.boss);
    this.head = new RigActor(scene, castRig('bighead'), rigTextureKey('bighead'));
    this.head.container.setDepth(DEPTH.boss - 1).setVisible(false);
    this.body = new Part(C.body.width, C.body.height, C.contactDamage, (h) => this.hitBody(h));
    this.landing = new Part(C.pogo.landRadius * 2, 18, C.pogo.damage, null);
    this.grab = new Part(20, 26, C.tangle.grabDamage, null);
    this.balloon = new Part(10, 10, C.bigHead.contactDamage, (h) => this.hitBalloon(h));
    this.valve = new Part(26, 22, 0, (h) => this.hitValve(h));
    this.iron = this.makeAct('ironjaw', C.ironjaw.hp, C.ironjaw.body, (h) => this.hitAct(this.iron, h));
    this.tangle = this.makeAct('tangle', C.tangle.hp, C.tangle.body, (h) => this.hitAct(this.tangle, h));
    this.extraTargets = [this.body, this.iron.part, this.tangle.part, this.valve, this.balloon];
    this.extraHazards = [this.body, this.landing, this.grab, this.iron.part, this.balloon];
    // Max in his cage over the ring, the trapeze bars either side.
    const plan = C.cage;
    const cx = plan.cageX * TILE;
    const cy = plan.cageY * TILE;
    this.cage = scene.add.image(cx, cy, CIRCUS_ART.cage).setOrigin(0.5, 62 / 64).setDepth(DEPTH.boss - 3);
    this.max = new FamilyActor(scene, { texture: TEX.max, prefix: 'max', frameWidth: MAX_FRAME.w, frameHeight: MAX_FRAME.h, feetY: MAX_FRAME.feetY, frames: MAX_FRAMES, handHeight: 18 }, DEPTH.boss - 4);
    this.max.place(cx, cy - 3);
    this.max.face(-1);
    for (const tx of [382, 410]) this.bars.push(scene.add.image(tx * TILE, C.highWire.row * TILE - 30, CIRCUS_ART.trapeze).setOrigin(0.5, 0).setDepth(DEPTH.decorBack + 3));
    // The ring is wider than a screen at the chapter's zoom: the camera pulls back for the fight.
    cameraZoom.base = CH7_HD.arenaZoom;
    scene.tweens.add({ targets: scene.cameras.main, zoom: CH7_HD.arenaZoom, duration: 700, ease: 'Sine.InOut' });
    if (w.resumeStage) this.resume(w.resumeStage as CackleStage);
    else this.intro();
  }

  private makeAct(id: 'ironjaw' | 'tangle', hp: number, body: { width: number; height: number }, onHit: (h: Hit) => HitResult): Act {
    const actor = new RigActor(this.scene, castRig(id), rigTextureKey(id));
    actor.container.setDepth(DEPTH.boss - 1).setVisible(false);
    const part = new Part(body.width, body.height, C.contactDamage, onHit);
    return { actor, part, x: 0, y: 0, facing: -1, hp, state: 'off', stateT: 0, readyAt: 0, move: '', tx: 0, ty: 0 };
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

  hurtbox(): boolean {
    return false;
  }

  hitbox(): boolean {
    return false;
  }

  takeHit(): HitResult {
    return 'none';
  }

  // ------------------------------------------------------------ Start

  private intro(): void {
    this.state = 'intro';
    // Down from the top of the tent on his cane, a spring at its foot.
    this.x = this.midX;
    this.y = this.floorY - 200;
    this.clip = 'pogo';
    this.scene.tweens.add({ targets: this, y: this.floorY, duration: 900, ease: 'Bounce.Out', onComplete: () => this.landFx() });
    playSfx(CIRCUS_SFX.cackle, 1);
    const go = () => {
      this.w.holdPlayer?.(false);
      this.banner();
      this.toIdle(600);
    };
    if (this.w.dialogue && this.w.introSeen === false) {
      this.w.holdPlayer?.(true);
      this.w.dialogue(CACKLE_INTRO, go);
    } else {
      this.w.dialogue?.(CACKLE_AGAIN, () => undefined);
      this.scene.time.delayedCall(1500, go);
    }
  }

  private resume(stage: CackleStage): void {
    this.stage = stage;
    this.hp = stageStartHp(stage);
    this.banner();
    this.w.onHealth(this.hp / this.maxHp, this.stage);
    this.enterStage(stage);
  }

  private banner(): void {
    EventBus.emit('hud:banner', { title: STAGE_NAMES[this.stage], color: PALETTE.cacklejack, durationMs: 1400, style: 'boss' });
  }

  private set(s: State): void {
    this.state = s;
    this.stateT = 0;
  }

  private toIdle(restMs: number): void {
    this.set('idle');
    this.restMs = pace.rest(restMs);
  }

  // ------------------------------------------------------------ Hits

  private hitBody(hit: Hit): HitResult {
    if (this.state === 'intro' || this.state === 'transition') return 'none';
    const open = this.state === 'bow' || this.state === 'fall';
    let mult = this.stage === 1 && !open ? C.highWire.multiplier : bodyMultiplier(open);
    if (this.stage === 2) mult = C.bigHead.balloonMultiplier;
    if (!open && this.stage === 0) this.w.tip('cackle-bow', 'HE DODGES ABOUT! HIT HIM WHILE HE TAKES A BOW AFTER A TRICK', 4500);
    return this.hurt(hit, hit.damage * mult);
  }

  private hitBalloon(hit: Hit): HitResult {
    if (this.stage !== 2 || this.state !== 'idle') return 'none';
    this.w.tip('cackle-valve', 'THE BALLOON SHRUGS IT OFF! HIT THE VALVE IN ITS THROAT WHEN THE GRIN OPENS', 4500);
    return this.hurt(hit, hit.damage * C.bigHead.balloonMultiplier);
  }

  private hitValve(hit: Hit): HitResult {
    if (this.stage !== 2 || this.mouth !== 'open') return 'none';
    // A ball rolled into the open grin bounces round inside: PINBALL!
    if (hit.roll && !this.pinballActive) {
      this.pinballActive = true;
      this.pinballLeft = C.bigHead.pinball.hits;
      this.pinballTick = 0;
      this.w.fx.popText(this.midX, this.floorY - 140, 'PINBALL!', 0xffe08a);
      playSfx(CIRCUS_SFX.ding, 1, 1.2);
    }
    return this.hurt(hit, hit.damage * C.bigHead.valveMultiplier);
  }

  private hurt(hit: { x: number; y: number }, dmg: number): HitResult {
    this.lastDamage = dmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.flashLeft = 80;
    this.w.fx.burst('spark', hit.x, hit.y, dmg >= 3 ? 10 : 5);
    this.w.fx.burst('gold', hit.x, hit.y, 3);
    playSfx('droneHit', 0.7, 1.2);
    this.w.onHealth(this.hp / this.maxHp, this.stage);
    if (this.hp <= 0) {
      this.die();
      return 'killed';
    }
    // One stage at a time: a huge hit (a pinball run) never skips THE HIGH WIRE.
    const want = Math.min(stageFor(this.hp / this.maxHp), this.stage + 1) as CackleStage;
    if (want > this.stage) this.beginStage(want);
    return 'hit';
  }

  private hitAct(act: Act, hit: Hit): HitResult {
    if (act.state === 'off' || act.state === 'dazed' || this.stage !== 1) return 'none';
    act.hp -= hit.damage;
    this.w.fx.burst('spark', hit.x, hit.y, 5);
    playSfx('punchHit', 0.6, act === this.iron ? 0.7 : 1.3);
    if (act.hp > 0) return 'hit';
    // Down goes the act, and the ringmaster loses his footing on the wire.
    act.state = 'dazed';
    act.stateT = 0;
    act.actor.play('dazed', true);
    if (act === this.tangle) act.y = this.floorY;
    this.w.fx.popText(act.x, act.y - 60, 'KNOCKED OUT!', 0xffe08a);
    this.w.cancelThreat();
    if (this.state !== 'fall' && this.state !== 'transition') this.fall();
    return 'killed';
  }

  // ------------------------------------------------------------ Stages

  private beginStage(stage: CackleStage): void {
    this.stage = stage;
    this.w.reachStage?.(stage);
    if (stage === 1) this.w.onPhase2();
    this.banner();
    this.w.cancelThreat();
    this.set('transition');
    this.w.dialogue?.(stage === 1 ? CACKLE_HIGHWIRE : CACKLE_BIGHEAD, () => undefined);
    this.scene.time.delayedCall(1400, () => this.enterStage(stage));
  }

  private enterStage(stage: CackleStage): void {
    if (stage === 1) {
      // Up to the wire; his acts take the ring and the far trapeze.
      this.set('idle');
      this.restMs = 1200;
      this.iron.state = 'idle';
      this.iron.hp = C.ironjaw.hp;
      this.iron.x = this.left + 3 * TILE;
      this.iron.y = this.floorY;
      this.iron.actor.container.setVisible(true);
      this.tangle.state = 'idle';
      this.tangle.hp = C.tangle.hp;
      this.tangle.x = 413.5 * TILE;
      this.tangle.y = 28 * TILE;
      this.tangle.actor.container.setVisible(true);
      this.dropIn = 1500;
    } else if (stage === 2) {
      // He swells into the big head in the middle of the ring.
      this.iron.state = 'off';
      this.tangle.state = 'off';
      this.iron.actor.container.setVisible(false);
      this.tangle.actor.container.setVisible(false);
      this.x = this.midX;
      this.y = this.floorY;
      this.clip = 'inflate';
      this.scene.time.delayedCall(900, () => {
        this.actor.container.setVisible(false);
        this.head.container.setVisible(true);
        this.headT = 0;
        this.gasIn = C.bigHead.gasEveryMs;
        this.w.fx.burst('smoke', this.midX, this.floorY - 40, 20);
        this.w.fx.shake(FX.shakeMedium, 300);
        playSfx(CIRCUS_SFX.squeak, 1, 0.5);
        this.set('idle');
      });
    } else this.toIdle(500);
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    this.stateT += dtMs;
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.landing.harmful && this.stateT > 160) this.landing.harmful = false;
    if (this.grab.harmful && this.stateT > 140) this.grab.harmful = false;
    switch (this.state) {
      case 'intro':
      case 'transition':
        break;
      case 'dying':
        this.updateDying(dtMs);
        break;
      case 'dead':
        break;
      default:
        if (this.stage === 0) this.updateFearGas(dtMs);
        else if (this.stage === 1) this.updateHighWire(dtMs);
        else this.updateBigHead(dtMs);
    }
    this.syncBody();
    this.render(dtMs);
  }

  // ------------------------------------------------------------ Stage 1: FEAR GAS

  private updateFearGas(dtMs: number): void {
    const p = this.w.player;
    switch (this.state) {
      case 'idle': {
        // A showman's strut, keeping a little way off.
        const want = p.x < this.midX ? Math.min(this.right - 3 * TILE, p.x + 110) : Math.max(this.left + 3 * TILE, p.x - 110);
        this.facing = p.x < this.x ? -1 : 1;
        if (Math.abs(want - this.x) > 6) {
          this.x += Math.sign(want - this.x) * Math.min(Math.abs(want - this.x), (60 * dtMs) / 1000);
          this.clip = 'walk';
        } else this.clip = 'idle';
        if (this.stateT >= this.restMs) this.startTrick();
        break;
      }
      case 'tell':
        this.tellFearGas();
        break;
      case 'act':
        if (this.trick === 'pogo') this.hop();
        else if (this.stateT >= 300) this.bow();
        break;
      case 'bow':
        this.clip = 'bow';
        if (this.stateT >= pace.punish(C.bowMs)) this.toIdle(C.restMs[0] + Math.random() * (C.restMs[1] - C.restMs[0]));
        break;
      default:
        break;
    }
  }

  private startTrick(): void {
    const p = this.w.player;
    this.trick = trickAt(this.count++);
    if (this.trick === 'jackbox' && this.w.aliveAdds() >= C.jackboxes.max) this.trick = 'pies';
    this.set('tell');
    this.aimX = Math.max(this.left + 2 * TILE, Math.min(this.right - 2 * TILE, p.x));
    this.aimY = p.y;
    const tellMs = this.trick === 'pogo' ? C.pogo.tellMs : this.trick === 'jackbox' ? C.jackboxes.tellMs : this.trick === 'pies' ? C.pies.tellMs : C.gasPie.tellMs;
    this.w.threat(this.w.now + tellMs);
    this.clip = this.trick === 'pogo' ? 'pogo' : this.trick === 'jackbox' ? 'laugh' : 'throw';
    if (this.trick !== 'pogo') playSfx(CIRCUS_SFX.honk, 0.7, 0.8);
  }

  private tellFearGas(): void {
    const t = this.stateT;
    const p = this.w.player;
    const tg = this.w.telegraph;
    if (this.trick === 'pies') {
      const k = t / C.pies.tellMs;
      this.facing = p.x < this.x ? -1 : 1;
      // Three red arcs to where the pies will land.
      for (let i = 0; i < C.pies.count; i++) {
        const v = this.lobAt(p.x + (i - 1) * 40, p.y - 6, C.pies.speed, C.pies.gravity);
        this.drawArc(v, C.pies.gravity, k);
      }
      if (t >= C.pies.tellMs) {
        for (let i = 0; i < C.pies.count; i++) {
          const v = this.lobAt(p.x + (i - 1) * 40, p.y - 6, C.pies.speed, C.pies.gravity);
          this.w.projectiles.spawn('pie', 'enemy', this.x + this.facing * 8, this.y - 46, v.vx, v.vy, C.pies.damage, 2000, 5, { gravity: C.pies.gravity });
        }
        playSfx(CIRCUS_SFX.whoosh, 0.9);
        this.set('act');
      }
    } else if (this.trick === 'pogo') {
      const k = t / C.pogo.tellMs;
      tg.reticle(this.aimX, this.floorY - 4, TELL.cacklejack, 1.4 - k * 0.5, t * 0.3);
      if (t >= C.pogo.tellMs) {
        this.fromX = this.x;
        this.toX = this.aimX;
        this.set('act');
        playSfx(CIRCUS_SFX.boing, 0.9, 0.8);
      }
    } else if (this.trick === 'gasPie') {
      // A red ring on Ben's spot: a puff of fear gas comes down on it.
      const k = t / C.gasPie.tellMs;
      tg.reticle(this.aimX, this.aimY - 14, TELL.cacklejack, 1.6 - k * 0.6, t * 0.25);
      if (t >= C.gasPie.tellMs) {
        circusEnv.gas?.(this.aimX, this.aimY - 14);
        this.set('act');
      }
    } else {
      // A jack-in-the-box out of his hat.
      if (t >= C.jackboxes.tellMs) {
        const bx = Math.max(this.left + 3 * TILE, Math.min(this.right - 3 * TILE, p.x + (p.x < this.midX ? 70 : -70)));
        this.w.spawnAdd('jackbox', bx, this.floorY - 9);
        this.w.fx.burst('smoke', bx, this.floorY - 10, 12);
        this.w.fx.burst('gold', bx, this.floorY - 16, 8);
        this.set('act');
      }
    }
  }

  /** The pogo hop: an arc from where he stood to the red ring, a shockwave where he lands. */
  private hop(): void {
    const k = Math.min(1, this.stateT / C.pogo.hopMs);
    this.x = this.fromX + (this.toX - this.fromX) * k;
    this.y = this.floorY - Math.sin(k * Math.PI) * C.pogo.height;
    this.clip = 'pogo';
    if (k >= 1) {
      this.y = this.floorY;
      this.landFx();
      this.landing.x = this.x;
      this.landing.y = this.floorY - 9;
      this.landing.harmful = true;
      this.w.hazards.spawnShockwave(this.x, -1, PALETTE.cacklejack);
      this.w.hazards.spawnShockwave(this.x, 1, PALETTE.cacklejack);
      this.bow();
    }
  }

  private landFx(): void {
    this.w.fx.shake(FX.shakeLight, 140);
    this.w.fx.burst('dust', this.x, this.floorY, 10);
    playSfx(CIRCUS_SFX.boing, 1, 0.6);
  }

  private bow(): void {
    this.set('bow');
    this.clip = 'bow';
    this.w.fx.popText(this.x, this.y - 70, 'TA-DAAA!', PALETTE.cacklejack);
    playSfx(CIRCUS_SFX.cackle, 0.7, 1.1);
  }

  // ------------------------------------------------------------ Stage 2: THE HIGH WIRE

  private updateHighWire(dtMs: number): void {
    const H = C.highWire;
    this.updateAct(this.iron, dtMs);
    this.updateAct(this.tangle, dtMs);
    if (this.state === 'fall') {
      this.clip = this.stateT < 600 ? 'hurt' : 'bow';
      this.y = Math.min(this.floorY, this.y + (500 * dtMs) / 1000);
      if (this.stateT >= pace.punish(H.fallMs)) {
        // Back up onto the wire.
        this.set('idle');
        this.w.fx.burst('smoke', this.x, this.y - 30, 10);
      }
      return;
    }
    // Swinging across overhead by his knees.
    const k = Math.sin((this.stateT / H.swingMs) * Math.PI * 2);
    this.x = this.midX + k * (this.right - this.left - 10 * TILE) * 0.5;
    this.y = H.row * TILE + 40 + Math.abs(k) * 6;
    this.facing = Math.cos((this.stateT / H.swingMs) * Math.PI * 2) > 0 ? 1 : -1;
    this.clip = 'swing';
    this.dropIn -= dtMs;
    if (this.dropIn <= 0 && this.state === 'idle') {
      this.set('tell');
      this.aimX = this.x;
      this.w.threat(this.w.now + H.dropTellMs);
    }
    if (this.state === 'tell') {
      const t = this.stateT;
      this.w.telegraph.line(this.aimX, this.y - 20, this.aimX, this.floorY, TELL.cacklejack, 0.3 + (t / H.dropTellMs) * 0.6, 2);
      if (t >= H.dropTellMs) {
        this.w.projectiles.spawn('pie', 'enemy', this.aimX, this.y - 20, 0, 60, H.dropDamage, 2400, 6, { gravity: 600 });
        playSfx(CIRCUS_SFX.whoosh, 0.7, 1.2);
        this.dropIn = pace.rest(H.dropEveryMs[0] + Math.random() * (H.dropEveryMs[1] - H.dropEveryMs[0]));
        // The swing goes on from where it was (stateT carries the swing's clock).
        this.state = 'idle';
      }
    }
  }

  private fall(): void {
    this.set('fall');
    this.w.dialogue?.([{ who: 'cacklejack', text: CACKLE_FALL_TAUNTS[Math.floor(Math.random() * CACKLE_FALL_TAUNTS.length)], ms: 1600 }], () => undefined);
    this.w.fx.popText(this.x, this.y - 40, 'WHOOPS!', PALETTE.cacklejack);
    playSfx(CIRCUS_SFX.timber, 0.8, 1.3);
  }

  private updateAct(a: Act, dtMs: number): void {
    if (a.state === 'off') return;
    a.stateT += dtMs;
    const p = this.w.player;
    const iron = a === this.iron;
    const A = iron ? C.ironjaw : C.tangle;
    if (a.state === 'dazed') {
      if (a.stateT >= A.dazedMs) {
        a.state = 'idle';
        a.stateT = 0;
        a.hp = Math.ceil(A.hp * 0.6);
        a.readyAt = this.w.now + 900;
        if (!iron) a.y = 28 * TILE;
        a.actor.play('idle', true);
      }
      return;
    }
    if (iron) {
      a.facing = p.x < a.x ? -1 : 1;
      if (a.state === 'idle') {
        const near = Math.abs(p.x - a.x) < 90;
        if (!near) a.x += a.facing * Math.min(Math.abs(p.x - a.x) - 60, (C.ironjaw.walk * dtMs) / 1000);
        a.x = Math.max(this.left + 2 * TILE, Math.min(this.right - 2 * TILE, a.x));
        a.actor.play(near ? 'idle' : 'walk');
        if (this.w.now >= a.readyAt) {
          a.state = 'tell';
          a.stateT = 0;
          a.move = near ? 'stomp' : 'throw';
          a.tx = p.x;
          this.w.threat(this.w.now + (near ? C.ironjaw.stompTellMs : C.ironjaw.throwTellMs));
          a.actor.play(near ? 'stomp' : 'throw', true);
        }
      } else if (a.state === 'tell') {
        const k = a.stateT / (a.move === 'stomp' ? C.ironjaw.stompTellMs : C.ironjaw.throwTellMs);
        if (a.move === 'stomp') {
          // Red along the floor both ways: the shockwaves' road.
          this.w.telegraph.line(a.x - 120, this.floorY - 4, a.x + 120, this.floorY - 4, TELL.cacklejack, 0.3 + k * 0.6, 2);
        } else {
          const v = this.lob(a.x, a.y - 50, a.tx, this.floorY - 10, C.ironjaw.throwSpeed, C.ironjaw.throwGravity);
          this.drawArcFrom(a.x, a.y - 50, v, C.ironjaw.throwGravity, k);
        }
        if (k >= 1) {
          if (a.move === 'stomp') {
            this.w.hazards.spawnShockwave(a.x, -1);
            this.w.hazards.spawnShockwave(a.x, 1);
            this.w.fx.shake(FX.shakeMedium, 200);
            this.w.fx.burst('dust', a.x, this.floorY, 12);
          } else {
            const v = this.lob(a.x, a.y - 50, a.tx, this.floorY - 10, C.ironjaw.throwSpeed, C.ironjaw.throwGravity);
            this.w.projectiles.spawn('kettlebell', 'enemy', a.x + a.facing * 10, a.y - 50, v.vx, v.vy, C.ironjaw.damage, 2400, 7, { gravity: C.ironjaw.throwGravity });
          }
          playSfx(CIRCUS_SFX.thump, 0.9);
          a.state = 'idle';
          a.stateT = 0;
          a.readyAt = this.w.now + pace.rest(C.ironjaw.restMs[0] + Math.random() * (C.ironjaw.restMs[1] - C.ironjaw.restMs[0]));
        }
      }
      return;
    }
    // THE TANGLE: from her perch she reaches down for whoever is under it.
    a.facing = p.x < a.x ? -1 : 1;
    if (a.state === 'idle') {
      a.actor.play('swing');
      if (this.w.now >= a.readyAt && Math.abs(p.x - a.x) < C.tangle.reachRange * 1.6) {
        a.state = 'tell';
        a.stateT = 0;
        a.tx = Math.max(a.x - C.tangle.reachRange, Math.min(a.x + C.tangle.reachRange, p.x));
        a.ty = this.floorY - 10;
        a.actor.play('reach', true);
        this.w.threat(this.w.now + C.tangle.reachTellMs);
      }
    } else if (a.state === 'tell') {
      const k = a.stateT / C.tangle.reachTellMs;
      this.w.telegraph.line(a.x, a.y - 20, a.tx, a.ty, TELL.cacklejack, 0.3 + k * 0.6, 2);
      this.w.telegraph.reticle(a.tx, a.ty, TELL.cacklejack, 1.1 - k * 0.3, a.stateT * 0.3);
      if (k >= 1) {
        this.grab.x = a.tx;
        this.grab.y = a.ty - 4;
        this.grab.harmful = true;
        this.stateT = Math.min(this.stateT, 0);
        a.actor.play('grab', true);
        playSfx(CIRCUS_SFX.whoosh, 0.8, 1.4);
        a.state = 'idle';
        a.stateT = 0;
        a.readyAt = this.w.now + pace.rest(C.tangle.restMs[0] + Math.random() * (C.tangle.restMs[1] - C.tangle.restMs[0]));
      }
    }
  }

  // ------------------------------------------------------------ Stage 3: THE BIG HEAD

  private updateBigHead(dtMs: number): void {
    const B = C.bigHead;
    this.headT += dtMs;
    const prev = this.mouth;
    this.mouth = mouthAt(this.headT, pace.rest(B.shutMs[0]), B.quiverMs, pace.punish(B.openMs));
    if (this.mouth !== prev) {
      this.head.play(this.mouth, true);
      if (this.mouth === 'quiver') {
        this.w.threat(this.w.now + B.quiverMs);
        playSfx(CIRCUS_SFX.cackle, 0.8, 0.7);
      }
      if (this.mouth === 'open') {
        this.w.fx.popText(this.midX, this.floorY - 150, 'HAHAHA!', PALETTE.cacklejack);
        this.w.tip('cackle-open', 'THE GRIN IS OPEN: HIT THE VALVE IN ITS THROAT! (A ROLLING BALL BOUNCES ROUND INSIDE)', 4000);
      }
    }
    // Fear gas puffs out of the shut grin now and then.
    if (this.mouth === 'shut') {
      this.gasIn -= dtMs;
      if (this.gasIn <= 0) {
        this.gasIn = pace.rest(B.gasEveryMs);
        const side = Math.random() < 0.5 ? -1 : 1;
        circusEnv.gas?.(this.midX + side * B.radius * headScale(this.headT) * 1.1, this.floorY - 30);
      }
    }
    // PINBALL: the ball bouncing round inside lands its hits one after another.
    if (this.pinballActive) {
      this.pinballTick -= dtMs;
      if (this.pinballTick <= 0 && this.pinballLeft > 0) {
        this.pinballTick = B.pinball.ms / B.pinball.hits;
        this.pinballLeft--;
        const hx = this.midX + (Math.random() - 0.5) * 60;
        const hy = this.floorY - 70 + (Math.random() - 0.5) * 50;
        this.w.fx.ring(hx, hy, 0xffe08a, 18, 160);
        playSfx(CIRCUS_SFX.ding, 0.9, 1 + Math.random() * 0.4);
        if (this.hurt({ x: hx, y: hy }, B.pinball.damage) === 'killed') this.w.achievement?.('standing-ovation');
      }
      if (this.pinballLeft <= 0) this.pinballActive = false;
    }
  }

  // ------------------------------------------------------------ The end

  private die(): void {
    this.set('dying');
    this.w.cancelThreat();
    this.landing.harmful = false;
    this.grab.harmful = false;
    for (const a of [this.iron, this.tangle]) {
      a.state = 'off';
      a.actor.container.setVisible(false);
    }
    if (this.stage === 2) {
      this.head.play('pop', true);
      playSfx(CIRCUS_SFX.squeak, 1, 0.4);
    }
    this.w.fx.shake(FX.shakeHeavy, 500);
  }

  private updateDying(dtMs: number): void {
    const t = this.stateT;
    if (this.stage === 2 && t < 900) {
      // The balloon zips about the tent as it deflates.
      const c = this.head.container;
      c.x = this.midX + Math.sin(t * 0.012) * 120;
      c.y = this.floorY - 80 - Math.sin(t * 0.008) * 80;
      if (t % 120 < dtMs) this.w.fx.burst('smoke', c.x, c.y, 3);
      return;
    }
    if (this.head.container.visible) {
      this.head.container.setVisible(false);
      this.actor.container.setVisible(true);
      this.x = this.midX;
      this.y = this.floorY;
    }
    this.clip = 'defeat';
    // Max's cage comes down into the safety net.
    if (t >= 1000 && t - dtMs < 1000) {
      this.scene.tweens.add({ targets: this.cage, y: this.floorY - 6, duration: 700, ease: 'Bounce.Out' });
      this.scene.tweens.add({ targets: this.max.sprite, y: this.floorY - 9, duration: 700, ease: 'Bounce.Out' });
    }
    // His last laugh, and the watch answers it: Ghostfreak, for a breath, all on its own.
    if (t >= 1600 && !this.ghost) this.ghostFlicker();
    if (t >= C.dyingMs) {
      this.set('dead');
      this.ghost?.destroy();
      this.ghost = null;
      cameraZoom.base = CH7_HD.zoom;
      this.scene.tweens.add({ targets: this.scene.cameras.main, zoom: CH7_HD.zoom, duration: 900, ease: 'Sine.InOut' });
      this.w.onDefeated(this.x, this.y);
    }
  }

  /** Ghostfreak's shape over Ben for a moment (the owner's drawing of him, through his rig), the picture glitching. */
  private ghostFlicker(): void {
    const p = this.w.player;
    this.w.fx.glitch(700);
    playSfx(CIRCUS_SFX.cackle, 1, 0.5);
    this.ghost = this.scene.add.sprite(p.x, p.y, 'ghostfreak', 0).setOrigin(0.5, 1).setDepth(DEPTH.player + 1).setAlpha(0.85);
    if (this.scene.anims.exists('ghostfreak-idle')) this.ghost.play('ghostfreak-idle');
    this.scene.tweens.add({ targets: this.ghost, alpha: 0, delay: 600, duration: 300 });
    this.w.fx.popText(p.x, p.y - 50, 'SOON.', PALETTE.ghostfreakEye);
  }

  // ------------------------------------------------------------ Drawing

  private syncBody(): void {
    const b = this.body;
    const onRing = this.stage !== 2 || !this.head.container.visible;
    b.on = this.alive && onRing && this.actor.container.visible && this.state !== 'intro' && this.state !== 'transition';
    b.harmful = b.on && this.state !== 'bow' && this.state !== 'fall';
    b.x = this.x;
    b.y = this.y - C.body.height / 2 - 4;
    const big = this.stage === 2 && this.head.container.visible && this.alive;
    const s = headScale(this.headT);
    const R = C.bigHead.radius * s;
    this.balloon.on = big;
    // While the grin is open he's laughing, not pushing: Ben can stand at the mouth and hit the valve.
    this.balloon.harmful = big && this.mouth !== 'open';
    this.balloon.w = R * 1.7;
    this.balloon.h = R * 1.7;
    this.balloon.x = this.midX;
    this.balloon.y = this.floorY - R * 0.85;
    this.valve.on = big && this.mouth === 'open';
    this.valve.x = this.midX;
    this.valve.y = this.floorY - R * 0.85 + R * 0.36;
    for (const a of [this.iron, this.tangle]) {
      a.part.on = a.state !== 'off' && a.state !== 'dazed' && this.stage === 1;
      a.part.harmful = a === this.iron && a.part.on;
      const body = a === this.iron ? C.ironjaw.body : C.tangle.body;
      a.part.x = a.x;
      a.part.y = a.y - body.height / 2;
    }
  }

  private render(dtMs: number): void {
    const c = this.actor.container;
    c.setPosition(this.x, this.y);
    c.scaleX = this.facing;
    this.actor.play(this.clip);
    this.actor.update(dtMs);
    this.actor.setTint(this.flashLeft > 0 ? 0xffffff : -1, this.flashLeft > 0 ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY);
    if (this.head.container.visible && this.state !== 'dying') {
      const s = headScale(this.headT);
      this.head.container.setPosition(this.midX, this.floorY - C.bigHead.radius * s * 0.85).setScale(s);
      this.head.setTint(this.flashLeft > 0 ? 0xffffff : -1, this.flashLeft > 0 ? Phaser.TintModes.FILL : Phaser.TintModes.MULTIPLY);
      if (this.mouth === 'quiver' || this.mouth === 'open') this.w.lighting.add(this.midX, this.valve.y, 50, 0xff5a5a, 0.7);
    }
    if (this.head.container.visible) this.head.update(dtMs);
    for (const a of [this.iron, this.tangle]) {
      if (a.state === 'off') continue;
      a.actor.container.setPosition(a.x, a.y);
      a.actor.container.scaleX = a.facing;
      a.actor.update(dtMs);
    }
    this.max.update(dtMs);
  }

  // ------------------------------------------------------------ Aim

  private lobAt(tx: number, ty: number, speed: number, gravity: number): { vx: number; vy: number } {
    return this.lob(this.x + this.facing * 8, this.y - 46, tx, ty, speed, gravity);
  }

  private lob(x0: number, y0: number, tx: number, ty: number, speed: number, gravity: number): { vx: number; vy: number } {
    const dx = tx - x0;
    const vx = Math.sign(dx || 1) * speed;
    const t = Math.max(0.25, Math.min(1.6, Math.abs(dx) / speed));
    const vy = Math.max(-320, Math.min(160, (ty - y0) / t - 0.5 * gravity * t));
    return { vx, vy };
  }

  private drawArc(v: { vx: number; vy: number }, gravity: number, k: number): void {
    this.drawArcFrom(this.x + this.facing * 8, this.y - 46, v, gravity, k);
  }

  private drawArcFrom(x0: number, y0: number, v: { vx: number; vy: number }, gravity: number, k: number): void {
    let x = x0;
    let y = y0;
    const dt = 0.08;
    for (let i = 0; i < 8; i++) {
      const nx = x + v.vx * dt;
      const ny = y + (v.vy + gravity * dt * (i + 0.5)) * dt;
      if (i % 2 === 0) this.w.telegraph.line(x, y, nx, ny, TELL.cacklejack, 0.25 + k * 0.6, 1);
      x = nx;
      y = ny;
    }
  }
}
