import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../types';

const HP = 6;

/** Mutant vines grown across a passage. Claws, fists and goo just bounce off them; fire withers them. */
export class Vines implements Damageable {
  readonly countsAsEnemy = false;
  readonly body: Phaser.Physics.Arcade.Image;
  private readonly face: Phaser.GameObjects.TileSprite;
  private readonly rect: Rect;
  alive = true;
  private hp = HP;
  private burning = 0;
  onDestroyed: (() => void) | null = null;

  constructor(scene: Phaser.Scene, readonly id: string, tx: number, ty: number, tw: number, th: number, private readonly fx: Fx) {
    this.rect = { x: tx * TILE, y: ty * TILE, w: tw * TILE, h: th * TILE };
    this.face = scene.add.tileSprite(this.rect.x, this.rect.y, this.rect.w, this.rect.h, TEX.vines).setOrigin(0, 0).setDepth(DEPTH.props);
    this.body = scene.physics.add.staticImage(this.rect.x + this.rect.w / 2, this.rect.y + this.rect.h / 2, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(this.rect.w, this.rect.h).refreshBody();
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
      playSfx('splat', 0.5, 0.7);
      this.fx.burst('leaf', hit.x, hit.y, 4);
      return 'blocked';
    }
    this.hp -= hit.kind === 'burst' ? HP : 2;
    this.fx.burst('fire', hit.x, hit.y, 8);
    this.face.setTint(Phaser.Display.Color.GetColor(255, Math.round(140 + 115 * (this.hp / HP)), Math.round(100 + 155 * (this.hp / HP))));
    if (this.hp > 0) return 'hit';
    this.burning = 1;
    playSfx('burn');
    return 'killed';
  }

  update(dtMs: number): void {
    if (!this.alive || this.burning <= 0) return;
    this.burning += dtMs;
    const r = this.rect;
    for (let i = 0; i < 3; i++) this.fx.trail('fire', r.x + Math.random() * r.w, r.y + Math.random() * r.h);
    if (Math.random() < 0.3) this.fx.trail('smoke', r.x + Math.random() * r.w, r.y + Math.random() * r.h * 0.5);
    this.fx.light(r.x + r.w / 2, r.y + r.h / 2, 110, PALETTE.fire2, 60);
    const t = Math.min(1, this.burning / 650);
    this.face.setAlpha(1 - t).setScale(1, 1 - t * 0.6);
    if (t >= 1) {
      this.alive = false;
      this.body.disableBody(true, true);
      this.face.setVisible(false);
      this.fx.burst('ember', r.x + r.w / 2, r.y + r.h, 16);
      this.onDestroyed?.();
    }
  }
}
