import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { barricadeKey } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../types';
import { chance } from '../../systems/Pacing';

const BURN_HP = 6;

/** Drone-built log wall. Punches bounce off; fire burns it down. */
export class Barricade implements Damageable {
  readonly countsAsEnemy = false;
  readonly image: Phaser.Physics.Arcade.Image;
  alive = true;
  private hp = BURN_HP;
  private burning = 0;
  private readonly rect: Rect;
  onDestroyed: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    tx: number,
    ty: number,
    tw: number,
    th: number,
    private readonly fx: Fx,
  ) {
    const w = tw * TILE;
    const h = th * TILE;
    const x = tx * TILE + w / 2;
    const y = ty * TILE + h / 2;
    this.image = scene.physics.add.staticImage(x, y, barricadeKey(tw, th)).setDepth(DEPTH.props);
    this.rect = { x: tx * TILE, y: ty * TILE, w, h };
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive || this.burning > 0) return false;
    out.x = this.rect.x - 2;
    out.y = this.rect.y;
    out.w = this.rect.w + 4;
    out.h = this.rect.h;
    return true;
  }

  accepts(kind: HitKind): boolean {
    return kind === 'fire' || kind === 'burst' || kind === 'rocket';
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.burning > 0) return 'none';
    if (!this.accepts(hit.kind)) {
      playSfx('punchHit', 0.6, 0.6);
      this.fx.burst('dust', hit.x, hit.y, 4);
      return 'blocked';
    }
    this.hp -= hit.kind === 'burst' ? BURN_HP : 2;
    const char = Math.max(0, this.hp / BURN_HP);
    const shade = Math.round(90 + 165 * char);
    this.image.setTint((shade << 16) | (Math.round(shade * 0.75) << 8) | Math.round(shade * 0.6));
    this.fx.burst('fire', hit.x, hit.y, 8);
    this.fx.burst('ember', hit.x, hit.y, 4);
    if (this.hp <= 0) {
      this.burning = 1;
      playSfx('burn');
      return 'killed';
    }
    return 'hit';
  }

  update(dtMs: number): void {
    if (!this.alive) return;
    if (this.burning <= 0) return;
    this.burning += dtMs;
    const r = this.rect;
    for (let i = 0; i < 3; i++) {
      if (chance(1)) this.fx.trail('fire', r.x + Math.random() * r.w, r.y + Math.random() * r.h);
    }
    if (chance(0.3)) this.fx.trail('smoke', r.x + Math.random() * r.w, r.y + Math.random() * r.h * 0.5);
    if (chance(1)) this.fx.light(r.x + r.w / 2, r.y + r.h / 2, 110, PALETTE.fire2, 60);
    const t = Math.min(1, this.burning / 700);
    this.image.setScale(1, 1 - t * 0.9).setAlpha(1 - t * 0.6);
    this.image.y = r.y + r.h / 2 + (r.h * t * 0.9) / 2;
    if (t >= 1) {
      this.alive = false;
      this.image.disableBody(true, true);
      this.fx.burst('ember', r.x + r.w / 2, r.y + r.h, 20);
      this.fx.burst('smoke', r.x + r.w / 2, r.y + r.h - 8, 10);
      this.onDestroyed?.();
    }
  }
}
