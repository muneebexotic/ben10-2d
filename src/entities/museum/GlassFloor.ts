import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../types';

/** Smash damage it takes to shatter: a meteor from high up or something heavy thrown onto it. A plain slam only cracks it. */
export const GLASS_BREAK_DAMAGE = 5.5;

/** True when a hit shatters skylight glass. Pure, so it is unit tested. */
export function shattersGlass(hit: Pick<Hit, 'kind' | 'damage'>): boolean {
  return hit.kind === 'smash' && hit.damage >= GLASS_BREAK_DAMAGE;
}

/**
 * A thick skylight pane laid in the floor. Everyone can stand on it; only a
 * heavy enough smash breaks through to what's underneath.
 */
export class GlassFloor implements Damageable {
  readonly countsAsEnemy = false;
  readonly stopsThrows = true;
  readonly body: Phaser.Physics.Arcade.Image;
  readonly rect: Rect;
  private readonly face: Phaser.GameObjects.TileSprite;
  alive = true;
  private cracked = false;
  onBroken: (() => void) | null = null;

  constructor(scene: Phaser.Scene, readonly id: string, tx: number, ty: number, tw: number, private readonly fx: Fx) {
    this.rect = { x: tx * TILE, y: ty * TILE, w: tw * TILE, h: 8 };
    this.face = scene.add.tileSprite(this.rect.x, this.rect.y, this.rect.w, 8, TEX.glass).setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
    this.body = scene.physics.add.staticImage(this.rect.x + this.rect.w / 2, this.rect.y + 4, TEX.whitePx).setVisible(false);
    this.body.setDisplaySize(this.rect.w, 8).refreshBody();
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.rect.x;
    out.y = this.rect.y - 6;
    out.w = this.rect.w;
    out.h = 14;
    return true;
  }

  accepts(kind: HitKind): boolean {
    return kind === 'smash';
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (!shattersGlass(hit)) {
      if (hit.kind === 'smash') {
        this.cracked = true;
        this.face.setTint(0xd8e8ff);
        this.fx.burst('white', hit.x, this.rect.y, 6);
        this.fx.popText(hit.x, this.rect.y - 20, 'NEEDS MORE HEIGHT!', PALETTE.uiDim);
        playSfx('armorTink', 0.7, 1.6);
      }
      return 'blocked';
    }
    this.alive = false;
    this.body.disableBody(true, true);
    this.face.setVisible(false);
    for (let x = this.rect.x; x < this.rect.x + this.rect.w; x += 8) this.fx.burst('white', x, this.rect.y + 2, 3);
    this.fx.burst('spark', hit.x, this.rect.y, 14);
    this.fx.popText(hit.x, this.rect.y - 20, 'SHATTER!', PALETTE.gold);
    this.fx.shake(0.01, 260);
    playSfx('glass');
    this.onBroken?.();
    return 'killed';
  }

  get crackedOnce(): boolean {
    return this.cracked;
  }
}
