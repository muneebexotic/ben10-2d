import Phaser from 'phaser';
import { DEPTH, TILE } from '../../../../config/constants';
import { ENERGY_NET } from '../../../../config/bounty';
import { CH5_BEATS } from '../../../../config/hunters';
import { PALETTE } from '../../../../config/palette';
import { HunterLook } from '../../../../entities/hunters/HunterLook';
import type { Damageable, Hit, HitResult, Rect } from '../../../../entities/types';
import type { BountyPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { jetpack, netSnap, sixsixLaugh } from '../../../../systems/audio/bountySfx';
import { CH5_TEX } from '../../../preload/bounty';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { NET_GHOST_LINE, NET_LINES } from './lines';

type Phase = 'wait' | 'swoop' | 'fly' | 'drag' | 'seal' | 'unlock' | 'free' | 'done';

/** The net's generator, humming outside the cell: wreck it and the net over the bars goes dark. */
class NetGenerator implements Damageable {
  readonly countsAsEnemy = false;
  alive = true;
  lastDamage = 0;
  private hp: number = ENERGY_NET.generatorHp;
  readonly sprite: Phaser.GameObjects.Sprite;

  constructor(
    scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly onBroken: () => void,
  ) {
    this.sprite = scene.add.sprite(x, y, CH5_TEX.netGenerator, 0).setOrigin(0.5, 1).setDepth(DEPTH.props).play('net-hum');
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.x - 10;
    out.y = this.y - 16;
    out.w = 20;
    out.h = 16;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    this.hp -= hit.damage;
    this.lastDamage = hit.damage;
    this.sprite.setTint(PALETTE.white);
    this.sprite.scene.time.delayedCall(60, () => this.sprite.clearTint());
    if (this.hp > 0) return 'hit';
    this.alive = false;
    this.sprite.setVisible(false);
    this.onBroken();
    return 'killed';
  }
}

/**
 * The jail. Ben walks into the sheriff's office; Sixsix swoops in at the
 * door and fires his energy net, which wraps Ben and drags him into the cell.
 * The net seals the bars, its generator hums outside where nobody inside can
 * reach it, and Sixsix leaves laughing. No alien can break out... and the
 * watch finds new DNA: Ghostfreak phases through the wall. (With Ghostfreak
 * already on the dial, Ben just lets himself out.)
 */
export class NetTrap implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly sixsix: HunterLook;
  private net: Phaser.GameObjects.Sprite | null = null;
  private seal: Phaser.GameObjects.TileSprite | null = null;
  private generator: NetGenerator | null = null;
  private from = { x: 0, y: 0 };
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BountyPlan['netTrap'],
    private readonly beat: UnlockBeat | null,
    resumeX: number,
  ) {
    this.floorY = spec.floor * TILE;
    this.sixsix = new HunterLook(kit.scene, 'sixsix', DEPTH.boss);
    this.sixsix.setVisible(false);
    if (resumeX > spec.barsX * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'swoop' || this.phase === 'fly' || this.phase === 'drag' || this.phase === 'seal';
  }

  get storyLock(): boolean {
    return this.phase !== 'wait' && this.phase !== 'free' && this.phase !== 'done';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.sixsix.render(realDtMs);
    if (this.seal) this.seal.tilePositionY -= realDtMs * 0.03;
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    const B = CH5_BEATS.netTrap;
    switch (this.phase) {
      case 'wait':
        if (!p.dead && p.x >= this.spec.triggerX * TILE) this.swoop();
        return;
      case 'swoop': {
        // In through the door, low and fast.
        const k = Math.min(1, this.t / 420);
        this.sixsix.x = Phaser.Math.Linear(this.spec.sixsixX * TILE - 120, this.spec.sixsixX * TILE, k);
        this.sixsix.feetY = this.floorY - 24 * (1 - k);
        kit.fx.trail('fire', this.sixsix.x - 10, this.sixsix.feetY - 10);
        if (k >= 1) {
          this.sixsix.play('cannon');
          kit.fx.burst('dust', this.sixsix.x, this.floorY, 10);
          this.fire();
        }
        return;
      }
      case 'fly': {
        const net = this.net!;
        const k = Math.min(1, this.t / B.flyMs);
        net.setPosition(Phaser.Math.Linear(this.from.x, p.x, k), Phaser.Math.Linear(this.from.y, p.centerY, k));
        net.setAngle(net.angle + realDtMs * 0.6);
        if (k >= 1) this.wrap();
        return;
      }
      case 'drag': {
        const k = Phaser.Math.Easing.Quadratic.InOut(Math.min(1, this.t / B.dragMs));
        const x = Phaser.Math.Linear(this.from.x, this.spec.cellX * TILE + TILE / 2, k);
        const y = Phaser.Math.Linear(this.from.y, this.floorY, k) - Math.sin(k * Math.PI) * 24;
        p.teleport(x, y);
        this.net!.setPosition(x, y - 14);
        if (k >= 1) this.sealCell();
        return;
      }
      case 'seal':
        if (this.t >= B.sealMs) this.release();
        return;
      case 'free':
        // Out of the cell either way (through the wall, or back through the bars): the trap's over.
        if (p.x > (this.spec.cellX + 6) * TILE || p.x < this.spec.barsX * TILE) this.phase = 'done';
        return;
      default:
        return;
    }
  }

  private swoop(): void {
    const kit = this.kit;
    this.phase = 'swoop';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.player.setInvulnerable(6000);
    this.sixsix.setVisible(true);
    this.sixsix.face(1);
    this.sixsix.play('fly');
    kit.setLetterbox(true);
    playSfx(jetpack, 1);
  }

  private fire(): void {
    const kit = this.kit;
    this.phase = 'fly';
    this.t = 0;
    this.from = { x: this.sixsix.x + 14, y: this.floorY - 30 };
    this.net = kit.scene.add.sprite(this.from.x, this.from.y, CH5_TEX.energyNet).setDepth(DEPTH.fx).setScale(0.5).setBlendMode(Phaser.BlendModes.ADD).play('net-crackle');
    kit.fx.flash(this.from.x, this.from.y, PALETTE.sixsix, 18, 140);
    playSfx(netSnap, 0.8, 0.8);
  }

  private wrap(): void {
    const kit = this.kit;
    this.phase = 'drag';
    this.t = 0;
    this.from = { x: kit.player.x, y: kit.player.y };
    this.net!.setScale(0.9).setAngle(0);
    kit.fx.burst('spark', kit.player.x, kit.player.centerY, 14);
    kit.fx.shake(0.008, 200);
    playSfx(netSnap, 1);
    kit.speech.show('HEY!', 900);
  }

  private sealCell(): void {
    const kit = this.kit;
    this.phase = 'seal';
    this.t = 0;
    this.net?.destroy();
    this.net = null;
    // The net stretches over the bars; its generator hums out in the office.
    const top = (this.spec.floor - 8) * TILE;
    this.seal = kit.scene.add.tileSprite(this.spec.barsX * TILE, top, TILE, 8 * TILE, CH5_TEX.energyNet).setOrigin(0, 0).setDepth(DEPTH.fx).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.85);
    this.generator = new NetGenerator(kit.scene, this.spec.generatorX * TILE + TILE / 2, this.floorY, () => this.netDown());
    kit.addTarget(this.generator);
    kit.fx.burst('spark', this.spec.barsX * TILE + 8, this.floorY - 60, 20);
    playSfx(netSnap, 1, 1.3);
    // Sixsix leaves the way he came, laughing.
    this.sixsix.play('fly');
    this.sixsix.face(-1);
    kit.scene.tweens.add({ targets: this.sixsix, x: this.sixsix.x - 160, feetY: this.floorY - 40, duration: 700, ease: 'Quad.easeIn', onComplete: () => this.sixsix.setVisible(false) });
    playSfx(sixsixLaugh, 0.9);
  }

  private release(): void {
    const kit = this.kit;
    this.phase = 'unlock';
    kit.setLetterbox(false);
    kit.dialogue.play(NET_LINES);
    const free = () => {
      this.phase = 'free';
      kit.player.controlsEnabled = true;
      kit.tutorial.tip('phase', 'GHOSTFREAK: HOLD {K} TO PHASE THROUGH WALLS!', 5000, 8);
    };
    if (this.beat && !this.beat.done) {
      this.beat.start(free);
    } else {
      kit.player.controlsEnabled = true;
      kit.speech.show(NET_GHOST_LINE, 2000);
      free();
    }
  }

  private netDown(): void {
    const kit = this.kit;
    kit.fx.explosion(this.spec.generatorX * TILE + 8, this.floorY - 8, 'small');
    if (this.seal) {
      const seal = this.seal;
      this.seal = null;
      kit.scene.tweens.add({ targets: seal, alpha: 0, duration: 300, onComplete: () => seal.destroy() });
    }
    kit.fx.popText(this.spec.barsX * TILE + 8, this.floorY - 70, 'NET DOWN!', PALETTE.sixsix);
  }

  destroy(): void {
    this.sixsix.destroy();
    this.net?.destroy();
    this.seal?.destroy();
    this.generator?.sprite.destroy();
  }
}
