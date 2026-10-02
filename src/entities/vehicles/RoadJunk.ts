import Phaser from 'phaser';
import { JUNK as J } from '../../config/chapter2';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import { blinkOn } from '../../systems/Accessibility';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hazard, Hit, HitResult, Liftable, Rect } from '../types';
import { boing, clang } from './audio';
import type { ChaseWorld } from './chaseWorld';

export type JunkKind = 'tire' | 'barrel';
type JunkState = 'warn' | 'flying' | 'rolling' | 'falling' | 'held' | 'thrown' | 'gone';

/**
 * A tire or a fuel barrel coming at the Rustbucket's roof. A marker shows
 * where it lands and an arrow at the screen edge where it comes from; then it
 * bounces (tires) or rolls (barrels) toward the back and drops off. Any hit
 * knocks it away; Four Arms can catch a barrel and throw it back.
 */
export class RoadJunk implements Damageable, Hazard, Liftable {
  readonly countsAsEnemy = false;
  readonly damage = J.damage;
  readonly sprite: Phaser.GameObjects.Image;
  readonly height = 16;
  x: number;
  y: number;
  private vx = 0;
  private vy = 0;
  private state: JunkState = 'warn';
  private warnLeft: number = J.warnMs;
  private harmless = false;
  private age = 0;
  private readonly r: number = J.radius;

  constructor(
    scene: Phaser.Scene,
    private readonly w: ChaseWorld,
    readonly kind: JunkKind,
    private readonly from: { x: number; y: number },
    private readonly landX: number,
  ) {
    this.x = from.x;
    this.y = from.y;
    this.sprite = scene.add.image(from.x, from.y, kind === 'tire' ? TEX.tire : TEX.barrel).setDepth(DEPTH.props + 2).setVisible(false);
  }

  get gone(): boolean {
    return this.state === 'gone';
  }

  /** On the roof or about to land on it: the part of its life that matters to Ben. */
  get onRoof(): boolean {
    return this.state === 'flying' || this.state === 'rolling';
  }

  // ------------------------------------------------------------ Frame

  update(dtMs: number): void {
    if (this.state === 'gone' || this.state === 'held' || this.state === 'thrown') return;
    const dt = dtMs / 1000;
    this.age += dtMs;
    if (this.state === 'warn') {
      this.warnLeft -= dtMs;
      this.drawWarning();
      if (this.warnLeft <= 0) this.launch();
      return;
    }
    if (this.state === 'flying' || this.state === 'falling') {
      this.drawLanding();
      this.vy += J.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.state === 'falling') this.fall();
      else this.checkLanding();
    } else if (this.state === 'rolling') {
      this.roll(dt);
    }
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y));
    this.sprite.rotation += (this.vx / this.r) * dt * (this.state === 'falling' ? 0.5 : 1);
  }

  private launch(): void {
    const roofY = this.w.rv.roofY;
    const T = J.flightMs / 1000;
    const ty = roofY - this.r;
    this.vx = (this.landX - this.from.x) / T;
    this.vy = (ty - this.from.y - 0.5 * J.gravity * T * T) / T;
    this.state = 'flying';
    this.sprite.setVisible(true);
    playSfx('whoosh', 0.5, 1.3);
  }

  private checkLanding(): void {
    const rv = this.w.rv;
    if (this.vy <= 0 || this.y + this.r < rv.roofY) return;
    if (this.x < rv.roofLeft - 4 || this.x > rv.roofRight + 4) {
      this.state = 'falling';
      return;
    }
    this.y = rv.roofY - this.r;
    this.state = 'rolling';
    this.vx = -J.rollSpeed;
    this.vy = this.kind === 'tire' ? -J.bounce : -70;
    this.w.fx.burst('dust', this.x, rv.roofY, 6);
    this.w.fx.shake(0.003, 90);
    playSfx(this.kind === 'tire' ? boing : clang, 0.8);
  }

  private roll(dt: number): void {
    const rv = this.w.rv;
    this.vy += J.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const floor = rv.roofY - this.r;
    if (this.y >= floor) {
      this.y = floor;
      if (this.kind === 'tire') {
        this.vy = -J.bounce * 0.92;
        playSfx(boing, 0.6, 1.1);
        this.w.fx.burst('dust', this.x, rv.roofY, 3);
      } else {
        this.vy = 0;
        if (Math.random() < 0.2) this.w.fx.trail('spark', this.x, rv.roofY);
      }
    }
    // Off the back: it drops onto the road and is left behind.
    if (this.x < rv.roofLeft - this.r) this.state = 'falling';
  }

  private fall(): void {
    const road = this.w.rv.roadY - this.r;
    if (this.y >= road) {
      this.y = road;
      this.vy = this.kind === 'tire' ? -Math.abs(this.vy) * 0.45 : 0;
      this.vx = -this.w.roadSpeed;
    }
    const view = this.sprite.scene.cameras.main.worldView;
    if (this.x < view.x - 40 || this.y > view.bottom + 40) this.remove();
  }

  private drawWarning(): void {
    const { telegraph, rv } = this.w;
    const view = this.sprite.scene.cameras.main.worldView;
    const side = this.from.x > view.centerX ? 1 : -1;
    const ax = side > 0 ? view.right - 12 : view.x + 12;
    const ay = Phaser.Math.Clamp(this.from.y, view.y + 20, view.bottom - 20);
    const k = 1 - this.warnLeft / J.warnMs;
    // Thrown from somewhere on screen (the hauler's hatch): no need for an edge arrow.
    const offScreen = this.from.x > view.right - 8 || this.from.x < view.x + 8;
    if (offScreen && (blinkOn(this.w.now(), 180) || k > 0.7)) {
      // An arrow at the screen edge pointing the way it will fly.
      for (const o of [0, 7]) {
        telegraph.line(ax + side * o, ay - 6, ax - side * (6 - o), ay, PALETTE.fire2, 1, 2);
        telegraph.line(ax - side * (6 - o), ay, ax + side * o, ay + 6, PALETTE.fire2, 1, 2);
      }
    }
    telegraph.target(this.landX, rv.roofY - 5, 10 - 3 * k, PALETTE.fire2, 0.4 + 0.5 * k);
  }

  private drawLanding(): void {
    if (this.state !== 'flying') return;
    this.w.telegraph.target(this.landX, this.w.rv.roofY - 5, 7, PALETTE.fire2, 0.9);
  }

  // ------------------------------------------------------------ Hazard

  get active(): boolean {
    return !this.harmless && (this.state === 'rolling' || (this.state === 'flying' && this.vy > 0));
  }

  hitbox(out: Rect): boolean {
    if (!this.active) return false;
    return this.box(out, 1);
  }

  onHitPlayer(): void {
    if (this.kind === 'barrel') {
      this.burst();
      return;
    }
    this.knockAway(this.w.player.x);
  }

  // ------------------------------------------------------------ Damageable

  get alive(): boolean {
    return this.state === 'flying' || this.state === 'rolling';
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    return this.box(out, -3);
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (this.kind === 'barrel') this.burst();
    else this.knockAway(hit.x);
    return 'killed';
  }

  private box(out: Rect, shrink: number): boolean {
    out.x = this.x - this.r + shrink;
    out.y = this.y - this.r + shrink;
    out.w = (this.r - shrink) * 2;
    out.h = (this.r - shrink) * 2;
    return true;
  }

  private knockAway(fromX: number): void {
    this.harmless = true;
    this.state = 'falling';
    this.vx = (Math.sign(this.x - fromX) || 1) * 260;
    this.vy = -240;
    this.w.fx.burst('dust', this.x, this.y, 6);
    playSfx(boing, 0.9, 0.8);
  }

  private burst(): void {
    this.w.fx.explosion(this.x, this.y, 'small');
    playSfx('explode', 0.7, 1.2);
    this.remove();
  }

  // ------------------------------------------------------------ Liftable (barrels)

  get liftable(): boolean {
    return this.kind === 'barrel' && this.state === 'rolling';
  }

  liftBox(out: Rect): boolean {
    if (!this.liftable) return false;
    return this.box(out, -5);
  }

  lift(): void {
    this.state = 'held';
    this.harmless = true;
    this.sprite.setDepth(DEPTH.player + 1).setRotation(0);
    playSfx('grab', 0.8, 1.1);
  }

  carry(x: number, bottomY: number): void {
    this.x = x;
    this.y = bottomY - 8;
    this.sprite.setPosition(Math.round(x), Math.round(this.y));
  }

  fly(x: number, y: number, angle: number): void {
    this.state = 'thrown';
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y).setRotation(angle);
    this.w.fx.trail('smoke', x, y);
  }

  shatter(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.w.fx.explosion(x, y, 'medium');
    playSfx('explode', 0.9, 0.9);
    this.remove();
  }

  private remove(): void {
    this.state = 'gone';
    this.sprite.setVisible(false);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
