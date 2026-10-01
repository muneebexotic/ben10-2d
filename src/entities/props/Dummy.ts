import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { DUMMY } from '../../config/training';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import { DpsMeter, formatDamage } from '../../systems/DpsMeter';
import { pixelText } from '../../ui/text';
import type { Damageable, Hit, HitResult, Liftable, Rect } from '../types';

const W = 16;
const H = 30;

/**
 * Training dummy: a battered robot on a spring. Takes any hit, never breaks,
 * and keeps a running DPS / total / hits readout. Stunning hits knock it flat
 * so Four Arms can practise throwing it; it pops back up on its spring.
 */
export class Dummy implements Damageable, Liftable {
  readonly countsAsEnemy = true;
  readonly height = H;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly meter = new DpsMeter(DUMMY.idleResetMs);
  lastDamage = 0;
  private readonly readout: Phaser.GameObjects.BitmapText;
  private readonly homeX: number;
  private readonly baseY: number;
  private wobble = 0;
  private wobbleV = 0;
  private flashLeft = 0;
  private downLeft = 0;
  private state: 'standing' | 'held' | 'thrown' | 'gone' = 'standing';
  private goneLeft = 0;
  private now = 0;

  constructor(scene: Phaser.Scene, tx: number, surfaceY: number, private readonly fx: Fx) {
    this.homeX = tx * TILE + TILE / 2;
    this.baseY = surfaceY * TILE;
    this.sprite = scene.add.sprite(this.homeX, this.baseY, TEX.dummy, 0).setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.readout = pixelText(scene, this.homeX, this.baseY - H - 10, '', { originX: 0.5, originY: 1, depth: DEPTH.worldUi, align: 'center' }).setVisible(false);
  }

  get alive(): boolean {
    return true;
  }

  get x(): number {
    return this.sprite.x;
  }

  hurtbox(out: Rect): boolean {
    if (this.state !== 'standing') return false;
    const lying = this.downLeft > 0;
    out.x = this.homeX - (lying ? H / 2 : W / 2);
    out.y = this.baseY - (lying ? 12 : H);
    out.w = lying ? H : W;
    out.h = lying ? 12 : H;
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (this.state !== 'standing') return 'none';
    this.lastDamage = hit.damage;
    this.meter.add(this.now, hit.damage);
    this.flashLeft = 70;
    const dir = Math.sign(this.homeX - hit.x) || 1;
    this.wobbleV += dir * Math.min(900, 120 + hit.knockback * 1.4);
    playSfx('dummyHit', 0.8, 0.9 + Math.random() * 0.2);
    if (hit.stunMs && this.downLeft <= 0) {
      this.downLeft = hit.stunMs;
      this.fx.burst('dust', this.homeX, this.baseY, 8);
    }
    this.refreshReadout();
    return 'hit';
  }

  private refreshReadout(): void {
    const m = this.meter;
    this.readout.setText(`DPS ${m.dps().toFixed(1)}\nTOTAL ${formatDamage(m.total)}  HITS ${m.hits}`).setTint(PALETTE.omnitrixGlow).setVisible(true).setAlpha(1);
  }

  // ------------------------------------------------------------ Liftable

  get liftable(): boolean {
    return this.state === 'standing' && this.downLeft > 0;
  }

  liftBox(out: Rect): boolean {
    return this.hurtbox(out);
  }

  lift(): void {
    this.state = 'held';
    // Held sideways over the head: pivot around the middle while it is off its spring.
    this.sprite.setDepth(DEPTH.player + 1).setOrigin(0.5, 0.5).setAngle(90);
    playSfx('grab', 1, 1.1);
  }

  carry(x: number, bottomY: number, facing: 1 | -1): void {
    this.sprite.setPosition(x, bottomY - W / 2 + 2).setFlipX(facing < 0);
  }

  fly(x: number, y: number, angle: number): void {
    this.state = 'thrown';
    this.sprite.setPosition(x, y).setRotation(angle);
  }

  shatter(x: number, y: number): void {
    this.state = 'gone';
    this.goneLeft = DUMMY.respawnMs;
    this.sprite.setVisible(false);
    this.fx.burst('debris', x, y, 16);
    this.fx.burst('spark', x, y, 10);
    this.fx.shake(0.01, 200);
    playSfx('explode', 0.6, 1.3);
  }

  /** Returns true the frame it is back on its spring (re-register as liftable). */
  update(dtMs: number, now: number): boolean {
    this.now = now;
    const dt = dtMs / 1000;
    let back = false;
    if (this.state === 'gone') {
      this.goneLeft -= dtMs;
      if (this.goneLeft <= 0) {
        this.state = 'standing';
        this.downLeft = 0;
        this.sprite.setVisible(true).setOrigin(0.5, 1).setPosition(this.homeX, this.baseY).setRotation(0).setFlipX(false).setDepth(DEPTH.props).setScale(1, 0.2);
        this.sprite.scene.tweens.add({ targets: this.sprite, scaleY: 1, duration: 320, ease: 'Back.easeOut' });
        this.fx.ring(this.homeX, this.baseY - H / 2, PALETTE.omnitrix, 24, 320);
        this.fx.burst('green', this.homeX, this.baseY - H / 2, 12);
        back = true;
      }
    }
    if (this.state === 'standing') {
      // Damped spring: hits rock it back and forth on its base.
      this.wobbleV += -this.wobble * 160 * dt;
      this.wobbleV *= Math.exp(-DUMMY.wobbleDecay * dt);
      this.wobble += this.wobbleV * dt;
      this.wobble = Math.max(-40, Math.min(40, this.wobble));
      if (this.downLeft > 0) {
        this.downLeft -= dtMs;
        this.sprite.setAngle(this.wobble >= 0 ? 85 : -85);
        if (this.downLeft <= 0) this.sprite.setAngle(0);
      } else {
        this.sprite.setAngle(this.wobble);
      }
    }
    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.flashLeft > 0) this.sprite.setTint(PALETTE.white).setTintMode(Phaser.TintModes.FILL);
    else this.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    if (this.readout.visible) {
      if (!this.meter.active(now)) this.readout.setAlpha(Math.max(0, this.readout.alpha - dtMs / 600));
      if (this.readout.alpha <= 0) this.readout.setVisible(false);
      this.readout.setPosition(this.homeX, this.baseY - DUMMY.readoutRise);
    }
    return back;
  }
}
