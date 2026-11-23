import Phaser from 'phaser';
import { DEPTH, FX, TILE } from '../../../../config/constants';
import { CH8_BEATS } from '../../../../config/chapter8';
import { CIRCUS_SFX } from '../../../../entities/enemies/circus/sfx';
import type { Damageable, Hit, HitKind, HitResult, Rect } from '../../../../entities/types';
import type { CircusPlan } from '../../../../levels/types';
import { playSfx } from '../../../../systems/audio/Sfx';
import { CIRCUS_ART } from '../../../preload/cartoon/circus/circusArt';
import { TEX } from '../../../preload/assetKeys';
import { GWEN_FRAME, GWEN_FRAMES } from '../../../preload/family';
import { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import { CH8_HEART } from './lines';

/** The heart's glass: any hit cracks it; enough and it shatters. */
class HeartGlass implements Damageable {
  readonly countsAsEnemy = false;
  alive = true;
  hits = 0;

  constructor(
    private readonly rect: Rect,
    private readonly onHit: (hit: Hit) => void,
  ) {}

  hurtbox(out: Rect): boolean {
    if (!this.alive) return false;
    out.x = this.rect.x;
    out.y = this.rect.y;
    out.w = this.rect.w;
    out.h = this.rect.h;
    return true;
  }

  accepts(_kind: HitKind): boolean {
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    this.onHit(hit);
    return this.alive ? 'hit' : 'killed';
  }
}

/**
 * The heart of the mirror maze (GAME_DESIGN.md, Chapter 8, beat 6): Gwen
 * stuck inside a great oval mirror, banging on the glass. Crack it (a few
 * hits of anything) and it shatters: she's out, walks with Ben again, and
 * the wall at the heart's far side opens. Past it already: she's with him.
 */
export class Heart implements SetPiece {
  private phase: 'wait' | 'talk' | 'done' = 'wait';
  private readonly mirror: Phaser.GameObjects.Image;
  private readonly glass: HeartGlass;
  /** Gwen inside the glass: her own actor (the companion keeps hers hidden while she isn't walking with Ben). */
  private readonly trapped: FamilyActor;
  private readonly x: number;
  private readonly floor: number;
  private t = 0;

  constructor(
    private readonly kit: StoryKit,
    private readonly plan: CircusPlan,
    /** Where play resumes (tiles; 0 on a fresh start). */
    resumeX: number,
  ) {
    const h = plan.heart;
    this.x = h.mirrorX * TILE;
    this.floor = h.floor * TILE;
    this.mirror = kit.scene.add.image(this.x, this.floor, CIRCUS_ART.heart).setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.glass = new HeartGlass({ x: this.x - 16, y: this.floor - 90, w: 32, h: 86 }, (hit) => this.crack(hit));
    const look = { texture: TEX.gwen, prefix: 'gwen', frameWidth: GWEN_FRAME.w, frameHeight: GWEN_FRAME.h, feetY: GWEN_FRAME.feetY, frames: GWEN_FRAMES, handHeight: 15 };
    this.trapped = new FamilyActor(kit.scene, look, DEPTH.props + 1);
    if (resumeX > h.exit.x) {
      this.phase = 'done';
      this.glass.alive = false;
      this.mirror.setVisible(false);
      this.trapped.hide();
      kit.collapse(h.exit);
      kit.gwen?.join(false, resumeX * TILE - 24);
      return;
    }
    kit.addTarget(this.glass);
  }

  get cinematic(): boolean {
    return this.phase === 'talk';
  }

  get storyLock(): boolean {
    return this.phase === 'talk';
  }

  update(dtMs: number): void {
    if (this.phase !== 'wait') return;
    this.t += dtMs;
    // Gwen in the glass: pale pink, banging on it.
    const a = this.trapped;
    a.place(this.x + Math.sin(this.t * 0.003) * 3, this.floor - 8);
    a.face(-1);
    a.pose(Math.floor(this.t / 600) % 2 ? 'surprise' : 'idle');
    a.sprite.setTint(0xffb8f0).setAlpha(0.7);
    a.update(dtMs);
  }

  private crack(hit: Hit): void {
    const kit = this.kit;
    this.glass.hits++;
    kit.fx.burst('crystal', hit.x, hit.y, 10);
    playSfx(CIRCUS_SFX.glass, 0.8, 0.8 + this.glass.hits * 0.15);
    kit.fx.popText(this.x, this.floor - 100, this.glass.hits >= CH8_BEATS.heart.hits ? 'SHATTER!' : 'CRACK!', 0xff8ad8);
    if (this.glass.hits < CH8_BEATS.heart.hits) {
      this.mirror.setTint(0xffd0f0);
      kit.scene.time.delayedCall(90, () => this.mirror.clearTint());
      return;
    }
    this.shatter();
  }

  private shatter(): void {
    const kit = this.kit;
    this.glass.alive = false;
    this.phase = 'talk';
    kit.fx.burst('crystal', this.x, this.floor - 40, 30);
    kit.fx.burst('mana', this.x, this.floor - 40, 16);
    kit.fx.flash(this.x, this.floor - 40, 0xff7ad8, 80, 300);
    kit.fx.shake(FX.shakeMedium, 200);
    playSfx(CIRCUS_SFX.glass, 1, 0.6);
    this.mirror.setVisible(false);
    const p = kit.player;
    p.controlsEnabled = false;
    p.setVelocityX(0);
    this.trapped.hide();
    kit.gwen?.join(true, this.x);
    kit.dialogue.play(CH8_HEART, { onDone: () => this.finish() });
  }

  private finish(): void {
    const kit = this.kit;
    this.phase = 'done';
    kit.player.controlsEnabled = true;
    kit.collapse(this.plan.heart.exit);
    kit.fx.burst('debris', this.plan.heart.exit.x * TILE, (this.plan.heart.exit.y + 3) * TILE, 14);
  }

  destroy(): void {
    this.mirror.destroy();
    this.trapped.destroy();
  }
}
