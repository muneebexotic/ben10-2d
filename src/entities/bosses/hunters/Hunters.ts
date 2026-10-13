import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../config/constants';
import { HUNTERS_BOSS, KRAAB, SIXSIX } from '../../../config/hunters';
import { PALETTE } from '../../../config/palette';
import type { BountyPlan } from '../../../levels/types';
import { TEX } from '../../../scenes/preload/assetKeys';
import { CH5_TEX } from '../../../scenes/preload/bounty';
import { pace } from '../../../systems/Difficulty';
import { EventBus } from '../../../systems/EventBus';
import { chance } from '../../../systems/Pacing';
import { playSfx } from '../../../systems/audio/Sfx';
import { erupt, jetpack, missileBoom, sixsixLaugh } from '../../../systems/audio/bountySfx';
import { HunterLook } from '../../hunters/HunterLook';
import type { HunterWorld } from '../../hunters/HunterWorld';
import { KraabFighter } from '../../hunters/KraabFighter';
import { SixsixFighter } from '../../hunters/SixsixFighter';
import { TetraxFighter } from '../../hunters/TetraxFighter';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../../types';
import type { ArenaBoss } from '../ArenaBoss';
import type { BossWorld, HuntWorld } from '../HunterDrone';
import { CrackedPillar } from './CrackedPillar';
import { HUNTERS_KRAAB_BURIED, HUNTERS_KRAAB_START, HUNTERS_SIXSIX_DOWN, HUNTERS_TETRAX_START, HUNTERS_TETRAX_YIELD } from './lines';

type Stage = 'kraabIntro' | 'kraab' | 'kraabDown' | 'shaft' | 'sixsixDown' | 'climbOut' | 'tetraxIntro' | 'tetrax' | 'yield' | 'done';

const rand = (r: readonly [number, number]) => r[0] + Math.random() * (r[1] - r[0]);

/**
 * THE HUNTERS (Chapter 5's boss): three bounty hunters, three places, and
 * each one falls differently.
 *
 * 1. KRAAB on the chamber floor beside the lift shaft: burrowing ambushes,
 *    the claw cannon (Diamondhead sends it back), his shell (smash it, or hit
 *    his back). Sixsix strafes in now and then with a salvo. A cracked
 *    crystal pillar holds up the roof: three heavy hits and it comes down
 *    (on Kraab, if he's near). Beaten, the ceiling buries him to the
 *    eyestalks, and Ben won't hit a guy who can't move.
 * 2. SIXSIX up the lift shaft: ledges swing out and Ben climbs while Sixsix
 *    hovers above, painting his ledge for salvos; reflected missiles wreck
 *    his jetpack. Beaten, he spirals out of the shaft into the water tower.
 * 3. TETRAX in the yard on top: an honourable duel. Crystal on crystal.
 *    At the end he yields, refuses the bounty, and leaves Ben a question.
 *
 * Every hunter is its own fighter (entities/hunters); this runs the stages,
 * the health bar, the arena moving with the fight and the camera.
 */
export class Hunters implements ArenaBoss {
  readonly name = 'THE HUNTERS';
  readonly subtitle = 'KRAAB';
  readonly phase2Title = 'SIXSIX!';
  readonly defeatTitle = 'BOUNTY VOID!';
  readonly countsAsEnemy = true;
  readonly damage = 0;
  readonly active = false;
  readonly alive = true;
  readonly extraTargets: readonly Damageable[];
  readonly extraHazards: readonly Hazard[];
  readonly liftables: readonly Liftable[] = [];
  lastDamage = 0;
  private stage: Stage = 'kraabIntro';
  private t = 0;
  private readonly kraab: KraabFighter;
  private readonly sixsix: SixsixFighter;
  private readonly tetrax: TetraxFighter;
  private readonly pillar: CrackedPillar;
  private readonly strafer: HunterLook;
  private readonly tower: Phaser.GameObjects.Image;
  private readonly g: BountyPlan['hunters'];
  private readonly hunt: HuntWorld;
  private strafeAt = 0;
  private strafeX = 0;
  private lid = -1;
  private readonly ledges: number[] = [];
  private hologram: Phaser.GameObjects.Image | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly w: BossWorld,
    x: number,
  ) {
    if (!w.hunt) throw new Error('THE HUNTERS needs the level (BossWorld.hunt)');
    this.hunt = w.hunt;
    this.g = w.hunt.level.story!.bounty!.hunters;
    const hw = this.hunterWorld();
    this.kraab = new KraabFighter(scene, hw);
    this.sixsix = new SixsixFighter(scene, hw);
    this.tetrax = new TetraxFighter(scene, hw);
    const floor = this.g.chamber.floor * TILE;
    this.pillar = new CrackedPillar(scene, this.g.pillarX * TILE + 8, floor, w.fx, () => this.pillarFalls());
    this.strafer = new HunterLook(scene, 'sixsix', DEPTH.boss);
    this.strafer.setVisible(false);
    this.tower = scene.add.image(this.g.towerX * TILE + 8, this.g.yard.floor * TILE, CH5_TEX.waterTower, 0).setOrigin(0.5, 1).setDepth(DEPTH.decorBack);
    this.extraTargets = [this.kraab, this.sixsix, this.tetrax, this.pillar];
    this.extraHazards = [this.kraab, this.sixsix, this.tetrax];
    this.kraab.onHealth = () => this.reportHealth();
    this.sixsix.onHealth = () => this.reportHealth();
    this.tetrax.onHealth = () => this.reportHealth();
    // Kraab erupts out of the chamber floor.
    this.kraab.stand(x, floor, 'erupt', -1);
    w.fx.burst('debris', x, floor, 26);
    w.fx.shake(0.014, 320);
    playSfx(erupt, 1);
    w.dialogue?.(HUNTERS_KRAAB_START, () => this.startKraab());
  }

  /** The hunters' view of the fight. */
  private hunterWorld(): HunterWorld {
    const w = this.w;
    const h = this.hunt;
    return {
      get now() {
        return w.now;
      },
      fx: w.fx,
      lighting: w.lighting,
      telegraph: w.telegraph,
      projectiles: w.projectiles,
      player: {
        get x() {
          return w.player.x;
        },
        get y() {
          return w.player.y;
        },
        get centerY() {
          return w.player.centerY;
        },
        get dead() {
          return w.player.dead;
        },
        get cloaked() {
          return h.player.cloaked;
        },
        get formId() {
          return h.player.formId;
        },
      },
      isSolid: (x, y) => h.isSolid(x, y),
      groundBelow: (x, y) => h.groundBelow(x, y),
      salvo: (x, floorY, count, spread, warnMs) => h.salvo(x, floorY, count, spread, warnMs),
      blastPlayer: (x, y, r, d) => h.blastPlayer(x, y, r, d),
      rockfall: (x, cy) => h.rockfall(x, cy),
      threat: (_key, at) => w.threat(at),
      cancelThreat: () => w.cancelThreat(),
      say: (who, text, ms) => h.say(who, text, ms),
    };
  }

  // ------------------------------------------------------------ ArenaBoss

  get hp(): number {
    return this.current?.hp ?? 0;
  }

  get maxHp(): number {
    return this.current?.maxHp ?? 1;
  }

  get phase(): number {
    return this.stage === 'kraabIntro' || this.stage === 'kraab' || this.stage === 'kraabDown' ? 0 : this.stage === 'shaft' || this.stage === 'sixsixDown' || this.stage === 'climbOut' ? 1 : 2;
  }

  get defeated(): boolean {
    return this.stage === 'done';
  }

  get introducing(): boolean {
    return this.stage === 'kraabIntro' || this.stage === 'tetraxIntro';
  }

  private get current(): { hp: number; maxHp: number } | null {
    const p = this.phase;
    return p === 0 ? this.kraab : p === 1 ? this.sixsix : this.tetrax;
  }

  hurtbox(_out: Rect): boolean {
    return false;
  }

  hitbox(_out: Rect): boolean {
    return false;
  }

  takeHit(_hit: Hit): HitResult {
    return 'none';
  }

  private reportHealth(): void {
    const c = this.current;
    if (c) this.w.onHealth(Math.max(0, c.hp / c.maxHp), this.phase);
  }

  private show(name: string): void {
    EventBus.emit('boss:show', { name, subtitle: 'THE HUNTERS' });
    this.reportHealth();
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    this.t += dtMs;
    this.kraab.update(dtMs);
    this.sixsix.update(dtMs);
    this.tetrax.update(dtMs);
    this.strafer.render(dtMs);
    switch (this.stage) {
      case 'kraab':
        this.updateStrafe(dtMs);
        return;
      case 'climbOut':
        if (this.w.player.y < (this.g.shaft.top + 0.5) * TILE && !this.w.player.dead) this.startTetrax();
        return;
      default:
        return;
    }
  }

  // ------------------------------------------------------------ 1. Kraab

  private startKraab(): void {
    const c = this.g.chamber;
    this.stage = 'kraab';
    this.kraab.startBoss(this.kraab.x, c.floor * TILE, c.from * TILE, c.to * TILE);
    this.kraab.onDone = () => this.kraabDown();
    this.strafeAt = this.w.now + rand(SIXSIX.strafeEveryMs) * 0.6;
    this.show('KRAAB');
    this.w.tip('hunters-kraab', 'HIS SHELL ONLY GIVES TO A SMASH. HIT HIS BACK, OR SEND HIS BLAST BACK!', 5000);
  }

  /** Sixsix screams across the top of the chamber and drops a salvo on Ben. */
  private updateStrafe(dtMs: number): void {
    const w = this.w;
    if (this.strafer.visible) {
      this.strafer.x += this.strafeX * dtMs;
      if (chance(0.8)) w.fx.trail('fire', this.strafer.x - Math.sign(this.strafeX) * 10, this.strafer.feetY - 10);
      if (this.strafer.x < this.g.chamber.from * TILE - 60 || this.strafer.x > this.g.chamber.to * TILE + 60) this.strafer.setVisible(false);
    }
    if (w.now < this.strafeAt || w.player.dead) return;
    this.strafeAt = w.now + pace.rest(rand(SIXSIX.strafeEveryMs));
    const left = Math.random() < 0.5;
    this.strafeX = (left ? 1 : -1) * 0.45;
    this.strafer.place(left ? this.g.chamber.from * TILE - 40 : this.g.chamber.to * TILE + 40, (this.g.wall.y + 2) * TILE);
    this.strafer.face(left ? 1 : -1);
    this.strafer.play('fly');
    this.strafer.setVisible(true);
    playSfx(jetpack, 0.9);
    this.hunt.salvo(w.player.x, this.g.chamber.floor * TILE, 3, 30, 1000);
  }

  private pillarFalls(): void {
    const w = this.w;
    const x = this.pillar.x;
    const ceiling = this.g.wall.y * TILE;
    for (let i = -2; i <= 2; i++) this.hunt.rockfall(x + i * 26, ceiling);
    w.fx.shake(0.02, 600);
    EventBus.emit('hud:banner', { title: 'CAVE-IN!', color: PALETTE.diamondhead, durationMs: 1200, style: 'slam' });
    if (this.stage === 'kraab' && Math.abs(this.kraab.x - x) < 100) {
      this.kraab.takeHit({ damage: KRAAB.boss.pillarDamage, kind: 'smash', x, y: this.kraab.y - 40, knockback: 0, heavy: true });
    }
  }

  private kraabDown(): void {
    if (this.stage !== 'kraab') return;
    const w = this.w;
    this.stage = 'kraabDown';
    this.strafer.setVisible(false);
    w.cancelThreat();
    // The roof comes down on him.
    const ceiling = this.g.wall.y * TILE;
    for (let i = -2; i <= 2; i++) this.hunt.rockfall(this.kraab.x + i * 20, ceiling);
    w.fx.shake(0.022, 700);
    w.time.slowMo(0.3, 900, 300);
    playSfx(missileBoom, 1, 0.6);
    this.scene.time.delayedCall(800, () => {
      this.kraab.bury();
      w.fx.burst('debris', this.kraab.x, this.kraab.y, 30);
      w.fx.burst('dust', this.kraab.x, this.kraab.y, 24);
      w.fx.popText(this.kraab.x, this.kraab.y - 40, 'BURIED!', PALETTE.kraab, 2);
    });
    w.dropPickup(this.g.shaft.x * TILE + 64, this.g.chamber.floor * TILE - 80);
    w.dialogue?.(HUNTERS_KRAAB_BURIED, () => this.startShaft());
  }

  // ------------------------------------------------------------ 2. Sixsix

  private startShaft(): void {
    const w = this.w;
    const s = this.g.shaft;
    this.stage = 'shaft';
    const left = s.x * TILE;
    const right = (s.x + s.w) * TILE;
    const top = s.top * TILE;
    const bottom = s.bottom * TILE;
    // The arena takes in the chamber too (Ben starts down there); the camera follows the climb.
    this.hunt.relocate({ left, right: this.g.chamber.to * TILE, top: top - TILE, bottom }, 'follow');
    for (const l of HUNTERS_BOSS.ledges) this.ledges.push(this.hunt.addLedge(left + l.x * TILE, (s.bottom - l.up) * TILE, l.w * TILE, false));
    // The grate at the top stays shut until he's down.
    this.lid = this.hunt.addLedge(left, top - 2, s.w * TILE, true);
    this.sixsix.startBoss((left + right) / 2, bottom - 150, { left, right, top, bottom });
    this.sixsix.onDone = () => this.sixsixDown();
    playSfx(sixsixLaugh, 1);
    playSfx(jetpack, 1);
    this.show('SIXSIX');
    w.onPhase2();
    w.tip('hunters-sixsix', 'CLIMB! SHOOT HIM, FLY AT HIM, OR SEND HIS MISSILES BACK!', 5000);
  }

  private sixsixDown(): void {
    const w = this.w;
    this.stage = 'sixsixDown';
    w.cancelThreat();
    const look = this.sixsix.look;
    look.play('hurt');
    playSfx('droneDown', 1, 0.8);
    // Sputtering, he corkscrews up out of the shaft and into the water tower.
    this.scene.tweens.add({
      targets: look,
      feetY: (this.g.shaft.top - 12) * TILE,
      x: look.x + 40,
      duration: 1400,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        if (chance(0.6)) w.fx.trail('smoke', look.x, look.feetY - 10);
      },
      onComplete: () => {
        this.sixsix.hide();
        this.towerCrash();
      },
    });
    w.dialogue?.(HUNTERS_SIXSIX_DOWN, () => undefined);
  }

  private towerCrash(): void {
    const w = this.w;
    this.tower.setFrame(1);
    const tx = this.tower.x;
    const ty = this.tower.y - 90;
    w.fx.explosion(tx, ty, 'big');
    w.fx.burst('splash', tx, ty + 40, 40);
    w.fx.shake(0.012, 400);
    playSfx('splash', 1, 0.8);
    // He's lying in the wreck when Ben climbs out.
    this.sixsix.look.place(tx - 10, this.g.yard.floor * TILE);
    this.sixsix.look.setVisible(true);
    this.sixsix.look.play('crash');
    if (this.lid >= 0) this.hunt.removeLedge(this.lid);
    this.lid = -1;
    w.dropPickup(this.g.shaft.x * TILE + 64, (this.g.shaft.top + 3) * TILE);
    this.stage = 'climbOut';
    w.tip('hunters-climb', 'THE GRATE IS OPEN: CLIMB OUT!', 4000);
  }

  // ------------------------------------------------------------ 3. Tetrax

  private startTetrax(): void {
    const w = this.w;
    const y = this.g.yard;
    this.stage = 'tetraxIntro';
    for (const id of this.ledges) this.hunt.removeLedge(id);
    this.ledges.length = 0;
    const left = (this.g.shaft.x - 2) * TILE;
    const right = (this.g.towerX - 2) * TILE;
    this.hunt.relocate({ left, right, top: (y.floor - 14) * TILE, bottom: y.floor * TILE }, 'follow');
    const tx = right - 80;
    this.tetrax.stand(tx, y.floor * TILE, 'idle', -1);
    w.fx.burst('crystal', tx, y.floor * TILE - 26, 26);
    w.holdPlayer?.(true);
    this.show('TETRAX SHARD');
    w.dialogue?.(HUNTERS_TETRAX_START, () => {
      w.holdPlayer?.(false);
      this.stage = 'tetrax';
      this.tetrax.start(tx, y.floor * TILE, left, right);
      this.tetrax.onYield = () => this.tetraxYields();
      w.tip('hunters-tetrax', 'CRYSTAL ON CRYSTAL: SMASH CRACKS HIM, FIRE HEATS HIM FOR A SHATTER!', 5000);
    });
  }

  private tetraxYields(): void {
    const w = this.w;
    if (this.stage !== 'tetrax') return;
    this.stage = 'yield';
    w.holdPlayer?.(true);
    w.fx.popText(this.tetrax.x, this.tetrax.y - 64, 'I YIELD', PALETTE.tetrax, 2);
    // Vilgax's hologram flickers up between them to rage.
    this.hologram = this.scene.add
      .image((this.tetrax.x + w.player.x) / 2, this.g.yard.floor * TILE - 30, TEX.vilgax)
      .setOrigin(0.5, 1)
      .setTint(PALETTE.enemy)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
      .setDepth(DEPTH.emissive);
    this.scene.tweens.add({ targets: this.hologram, alpha: 0.75, duration: 300, delay: 4800 });
    w.dialogue?.(HUNTERS_TETRAX_YIELD, () => this.ending());
  }

  private ending(): void {
    const w = this.w;
    this.hologram?.destroy();
    this.hologram = null;
    // Tetrax leaves in a burst of crystal.
    const x = this.tetrax.x;
    const y = this.tetrax.y;
    w.fx.burst('crystal', x, y - 26, 40);
    w.fx.ring(x, y - 26, PALETTE.tetrax, 60, 500);
    this.tetrax.hide();
    w.holdPlayer?.(false);
    w.achievement?.('bounty-void');
    this.stage = 'done';
    w.onDefeated(x, y - 20);
  }

  destroy(): void {
    this.kraab.destroy();
    this.sixsix.destroy();
    this.tetrax.destroy();
    this.pillar.destroy();
    this.strafer.destroy();
    this.tower.destroy();
    this.hologram?.destroy();
  }
}
