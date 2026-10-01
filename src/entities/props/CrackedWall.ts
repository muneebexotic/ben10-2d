import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { SECRETS } from '../../config/secrets';
import { TEX } from '../../scenes/preload/assetKeys';
import type { Fx } from '../../systems/Fx';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import { pixelText } from '../../ui/text';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../types';
import { breaksCrackedWall } from '../../levels/secrets';

/** The silhouette floats this far above the wall top, clear of Ben's speech bubble. */
const HINT_RISE = 72;

/** The alien that can break the wall, once it is on the dial. */
export interface WallBreaker {
  name: string;
  icon: string;
  color: number;
}

export interface CrackedWallOptions {
  /** Reforms this long after breaking (Training). */
  rebuildMs?: number;
  /** Set when the alien that can break it is on the dial: the hint names it instead of a locked silhouette. */
  breaker?: WallBreaker | null;
}

/**
 * A cracked rock slab with something golden behind it. Touching it shows the
 * silhouette of the alien who could break it: a promise for later chapters.
 */
export class CrackedWall implements Damageable {
  readonly countsAsEnemy = false;
  readonly body: Phaser.Physics.Arcade.Image;
  private readonly hint: Phaser.GameObjects.Container;
  private readonly rect: Rect;
  alive = true;
  private hp: number = SECRETS.crackedWallHp;
  private hintLeft = 0;
  private hintCooldown = 0;
  private shownOnce = false;
  private rebuildLeft = 0;
  onBroken: (() => void) | null = null;
  /** Called the first time the silhouette appears this run. */
  onFirstTease: (() => void) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly id: string,
    tx: number,
    ty: number,
    th: number,
    private readonly fx: Fx,
    private readonly opts: CrackedWallOptions = {},
  ) {
    const h = th * TILE;
    this.rect = { x: tx * TILE, y: ty * TILE, w: TILE, h };
    this.body = scene.physics.add.staticImage(tx * TILE + TILE / 2, ty * TILE + h / 2, TEX.crackedWall).setDepth(DEPTH.props);
    this.body.setDisplaySize(TILE, h).refreshBody();

    const breaker = opts.breaker ?? null;
    const color = breaker ? breaker.color : PALETTE.omnitrix;
    const glow = scene.add.image(0, 0, TEX.light).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setScale(1.4);
    const silhouette = breaker ? scene.add.image(0, 4, breaker.icon).setTint(color).setScale(2) : scene.add.image(0, 0, TEX.lockedAlien).setTint(PALETTE.omnitrix);
    const label = pixelText(scene, 0, 30, breaker ? `${breaker.name} CAN SMASH THIS!` : 'LOCKED ALIEN', { originX: 0.5, originY: 0.5, color });
    const sub = pixelText(scene, 0, 41, breaker ? 'ONLY SMASH HITS CRACK IT' : 'TOO TOUGH... FOR NOW', { originX: 0.5, originY: 0.5, color: PALETTE.uiDim });
    this.hint = scene.add
      .container(this.rect.x - 6, this.rect.y - HINT_RISE, [glow, silhouette, label, sub])
      .setDepth(DEPTH.worldUi)
      .setVisible(false);
  }

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.rect.x - 2;
    out.y = this.rect.y;
    out.w = this.rect.w + 4;
    out.h = this.rect.h;
    return true;
  }

  accepts(kind: HitKind): boolean {
    return breaksCrackedWall(kind);
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    if (!this.accepts(hit.kind)) {
      playSfx('punchHit', 0.5, 0.5);
      this.fx.burst('dust', hit.x, hit.y, 4);
      this.tease();
      return 'blocked';
    }
    this.hp--;
    this.fx.burst('debris', hit.x, hit.y, 10);
    this.fx.shake(0.008, 160);
    playSfx('slam', 0.6);
    if (this.hp <= 0) {
      this.alive = false;
      this.body.disableBody(true, true);
      this.rebuildLeft = this.opts.rebuildMs ?? 0;
      this.hintLeft = 0;
      this.hint.setVisible(false);
      playSfx('rockBreak');
      this.fx.burst('debris', this.rect.x + 8, this.rect.y + this.rect.h / 2, 30);
      this.fx.burst('gold', this.rect.x + 24, this.rect.y + this.rect.h - 8, 20);
      this.onBroken?.();
      return 'killed';
    }
    return 'hit';
  }

  /** Training walls reform: the hologram re-renders the slab. */
  private rebuild(): void {
    this.alive = true;
    this.hp = SECRETS.crackedWallHp;
    const r = this.rect;
    this.body.enableBody(true, r.x + TILE / 2, r.y + r.h / 2, true, true);
    this.body.setDisplaySize(TILE, r.h).refreshBody();
    this.body.setAlpha(0);
    this.scene.tweens.add({ targets: this.body, alpha: 1, duration: 300 });
    this.fx.burst('green', r.x + 8, r.y + r.h / 2, 16);
    this.fx.ring(r.x + 8, r.y + r.h / 2, PALETTE.omnitrix, 24, 300);
  }

  /** Ben is pressed against the wall (or hit it). */
  touching(px: number, py: number): boolean {
    return this.alive && px > this.rect.x - 14 && px < this.rect.x + this.rect.w + 14 && py > this.rect.y && py <= this.rect.y + this.rect.h + 2;
  }

  tease(): void {
    if (!this.alive || this.hintCooldown > 0) return;
    this.hintLeft = this.shownOnce ? SECRETS.hintMs : SECRETS.firstHintMs;
    this.hintCooldown = this.hintLeft + SECRETS.hintCooldownMs;
    playSfx('denied', 0.7, 0.7);
    playSfx('pod', 0.5);
    this.hint.setVisible(true).setAlpha(0).setScale(0.6);
    this.scene.tweens.add({ targets: this.hint, alpha: 1, scale: 1, duration: 260, ease: 'Back.easeOut' });
    if (!this.shownOnce) {
      this.shownOnce = true;
      this.onFirstTease?.();
    }
  }

  update(dtMs: number, lighting: Lighting, now: number): void {
    if (!this.alive) {
      if (this.rebuildLeft > 0) {
        this.rebuildLeft -= dtMs;
        if (this.rebuildLeft <= 0) this.rebuild();
      }
      return;
    }
    this.hintCooldown = Math.max(0, this.hintCooldown - dtMs);
    // Gold glints through the cracks.
    lighting.add(this.rect.x + 8, this.rect.y + this.rect.h / 2, 26 + Math.sin(now * 0.004) * 4, PALETTE.gold, 0.45);
    if (Math.random() < 0.02) this.fx.trail('gold', this.rect.x + 4 + Math.random() * 8, this.rect.y + Math.random() * this.rect.h);
    if (this.hintLeft > 0) {
      this.hintLeft -= dtMs;
      this.hint.setY(this.rect.y - HINT_RISE + Math.sin(now * 0.004) * 2);
      lighting.add(this.hint.x, this.hint.y, 60, PALETTE.omnitrix, 0.7);
      if (this.hintLeft <= 0) {
        this.scene.tweens.add({ targets: this.hint, alpha: 0, duration: 300, onComplete: () => this.hint.setVisible(false) });
      }
    }
  }
}
