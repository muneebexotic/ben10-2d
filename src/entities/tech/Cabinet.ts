import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { TECH } from '../../config/tech';
import { TEX } from '../../scenes/preload/assetKeys';
import { CABINET_SPENT_FRAME } from '../../scenes/preload/tech';
import type { Controls } from '../../systems/InputMap';
import { playSfx } from '../../systems/audio/Sfx';
import type { Rect } from '../types';
import type { Machine, TechDeps } from './Machine';

const K = TECH.cabinet;

/**
 * An arcade cabinet in attract mode. Upgrade pours in, the screen boots, and
 * it blasts a cone of pixels at whatever's in front: GAME OVER. Then it's
 * dead (one blast per cabinet), so the arcade is a room full of ammo.
 */
export class Cabinet implements Machine {
  readonly kind = 'cabinet';
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly glow: Phaser.GameObjects.Image;
  private state: 'ready' | 'booting' | 'spent' = 'ready';
  private t = 0;
  private dir: 1 | -1 = 1;
  private readonly variant: number;
  holding = false;
  readonly anchorX: number;
  readonly anchorY: number;

  constructor(
    private readonly d: TechDeps,
    readonly id: string,
    tx: number,
    ty: number,
    variant: number,
    flip: boolean,
  ) {
    this.variant = variant % 4;
    this.anchorX = tx * TILE + TILE / 2;
    this.anchorY = ty * TILE;
    this.sprite = d.scene.add.sprite(this.anchorX, this.anchorY, TEX.cabinet, this.variant * 2).setOrigin(0.5, 1).setDepth(DEPTH.decor).setFlipX(flip);
    this.sprite.play({ key: `cabinet-attract-${this.variant}`, startFrame: Math.floor(tx % 2) });
    this.glow = d.scene.add.image(this.anchorX, this.anchorY - 26, TEX.light).setScale(0.6).setAlpha(0.25).setTint(ATTRACT_GLOW[this.variant]).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.decor + 1);
  }

  mergeBox(out: Rect): boolean {
    if (this.state !== 'ready') return false;
    out.x = this.anchorX - 14;
    out.y = this.anchorY - 46;
    out.w = 28;
    out.h = 46;
    return true;
  }

  enter(facing: 1 | -1): void {
    this.state = 'booting';
    this.holding = true;
    this.t = 0;
    this.dir = facing;
    this.sprite.stop();
    playSfx('arcadeBoot', 0.9);
  }

  control(c: Controls): void {
    // Steer the blast before it fires.
    if (c.left && !c.right) this.dir = -1;
    else if (c.right && !c.left) this.dir = 1;
  }

  release(): void {
    this.holding = false;
  }

  update(dtMs: number): void {
    if (this.state === 'ready') {
      this.d.lighting.add(this.anchorX, this.anchorY - 26, 30, ATTRACT_GLOW[this.variant], 0.55);
      return;
    }
    if (this.state !== 'booting') return;
    this.t += dtMs;
    // Booting: the screen flickers through colours.
    this.sprite.setFrame((Math.floor(this.t / 50) % 4) * 2);
    this.d.lighting.add(this.anchorX, this.anchorY - 26, 30 + this.t * 0.1, PALETTE.upgrade, 0.9);
    if (this.t >= K.bootMs && this.sprite.frame.name !== String(CABINET_SPENT_FRAME)) this.gameOver();
    if (this.t >= K.releaseMs) {
      this.state = 'spent';
      this.holding = false;
    }
  }

  private gameOver(): void {
    const x = this.anchorX + this.dir * K.blastReach;
    const y = this.anchorY - 24;
    this.d.blast(x, y, K.blastRadius, { damage: K.damage, kind: 'tech', x: this.anchorX, y, knockback: K.knockback, stunMs: K.stunMs });
    this.d.fx.burst('pixel', this.anchorX + this.dir * 14, y, 30);
    this.d.fx.flash(x, y, PALETTE.neonBlue, K.blastRadius, 260);
    this.d.fx.ring(x, y, PALETTE.neonPink, K.blastRadius, 320);
    this.d.fx.popText(this.anchorX, this.anchorY - 54, 'GAME OVER!', PALETTE.neonPink);
    this.d.fx.shake(0.01, 220);
    this.d.fx.hitStop(50);
    playSfx('gameOver');
    this.sprite.setFrame(CABINET_SPENT_FRAME);
    this.glow.setVisible(false);
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow.destroy();
  }
}

const ATTRACT_GLOW = [PALETTE.neonBlue, PALETTE.neonPink, PALETTE.gold, PALETTE.omnitrix];

/**
 * The SUMO SLAMMERS cabinet, with KEV at the top of every table. Upgrade
 * merges in and plays: the level freezes for the mini-game, and beating
 * KEV's score pays out a card.
 */
export class SumoCabinet implements Machine {
  readonly kind = 'sumo';
  private readonly sprite: Phaser.GameObjects.Sprite;
  private state: 'ready' | 'playing' | 'won' = 'ready';
  holding = false;
  readonly anchorX: number;
  readonly anchorY: number;
  /** The level runs the mini-game; `done` reports whether KEV's score fell. */
  onPlay: ((done: (won: boolean) => void) => void) | null = null;
  onWon: (() => void) | null = null;

  constructor(
    private readonly d: TechDeps,
    readonly id: string,
    tx: number,
    ty: number,
  ) {
    this.anchorX = tx * TILE + TILE / 2;
    this.anchorY = ty * TILE;
    this.sprite = d.scene.add.sprite(this.anchorX, this.anchorY, TEX.sumoCabinet, 0).setOrigin(0.5, 1).setDepth(DEPTH.decor).play('sumo-attract');
  }

  /** Where the prize pops out (the card). */
  get prizeX(): number {
    return this.anchorX;
  }

  mergeBox(out: Rect): boolean {
    if (this.state !== 'ready') return false;
    out.x = this.anchorX - 17;
    out.y = this.anchorY - 52;
    out.w = 34;
    out.h = 52;
    return true;
  }

  enter(): void {
    this.state = 'playing';
    this.holding = true;
    this.sprite.stop().setFrame(2);
    playSfx('arcadeBoot', 1, 0.8);
    const finish = (won: boolean) => {
      this.holding = false;
      this.state = won ? 'won' : 'ready';
      if (won) {
        this.sprite.setFrame(3);
        this.onWon?.();
      } else this.sprite.play('sumo-attract');
    };
    if (this.onPlay) this.onPlay(finish);
    else finish(false);
  }

  control(_c: Controls, _dtMs: number): void {
    // The mini-game reads its own input.
  }

  release(): void {
    this.holding = false;
  }

  update(): void {
    this.d.lighting.add(this.anchorX, this.anchorY - 30, 40, this.state === 'won' ? PALETTE.omnitrix : PALETTE.gold, 0.7);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
