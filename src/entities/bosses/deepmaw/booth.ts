import Phaser from 'phaser';
import { DEPTH } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { GWEN_FRAME, GWEN_FRAMES, MAX_FRAME, MAX_FRAMES } from '../../../scenes/preload/family';
import { TEX } from '../../../scenes/preload/assetKeys';
import { FamilyActor } from '../../../scenes/level/family/FamilyActor';
import { makeHdImage } from '../../../scenes/preload/cartoon/hdTexture';
import { INK } from '../../../scenes/preload/cartoon/paint';
import { playSfx } from '../../../systems/audio/Sfx';
import { DEEPMAW_SFX } from './sfx';
import type { Fx } from '../../../systems/Fx';

const SHIELD_KEY = 'hd-gwen-shield';
const SHIELD_SIZE = 46;

/**
 * Max and Gwen in the booth over the moon pool: Max on the pump console
 * (draining and flooding the pool between stages), Gwen beside him, who can
 * still throw a shield down to Ben when he's in trouble.
 */
export class Booth {
  readonly max: FamilyActor;
  readonly gwen: FamilyActor;
  private readonly bubble: Phaser.GameObjects.Image;
  private shieldLeft = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly fx: Fx,
    private readonly x: number,
    private readonly feetY: number,
    res: number,
  ) {
    const depth = DEPTH.decorBack + 1;
    this.max = new FamilyActor(scene, { texture: TEX.max, prefix: 'max', frameWidth: MAX_FRAME.w, frameHeight: MAX_FRAME.h, feetY: MAX_FRAME.feetY, frames: MAX_FRAMES, handHeight: 18 }, depth);
    this.gwen = new FamilyActor(scene, { texture: TEX.gwen, prefix: 'gwen', frameWidth: GWEN_FRAME.w, frameHeight: GWEN_FRAME.h, feetY: GWEN_FRAME.feetY, frames: GWEN_FRAMES, handHeight: 15 }, depth);
    makeHdImage(scene, SHIELD_KEY, SHIELD_SIZE, SHIELD_SIZE, res, (p) => {
      const r = SHIELD_SIZE / 2 - 1;
      const ball = p.circle(SHIELD_SIZE / 2, SHIELD_SIZE / 2, r);
      p.fill(ball, PALETTE.mana, 0.18);
      p.stroke(ball, PALETTE.mana, 1.4, 0.9);
      p.stroke(p.circle(SHIELD_SIZE / 2, SHIELD_SIZE / 2, r - 2), 0xffffff, 0.5, 0.4);
      p.fill(p.ellipse(SHIELD_SIZE / 2 - r * 0.4, SHIELD_SIZE / 2 - r * 0.45, r * 0.3, r * 0.16, -0.6), 0xffffff, 0.55);
      p.stroke(ball, INK, 0.3, 0.3);
    });
    this.bubble = scene.add.image(0, 0, SHIELD_KEY).setDepth(DEPTH.player + 1).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
  }

  /** Both of them in the window. */
  show(): void {
    this.max.place(this.x - 32, this.feetY);
    this.gwen.place(this.x + 24, this.feetY);
    this.max.face(1);
    this.gwen.face(-1);
    this.max.pose('idle');
    this.gwen.pose('idle');
    this.atConsole(true);
  }

  /** Max working the console (or turned to the glass when he speaks). */
  atConsole(on: boolean): void {
    this.max.sprite.setData('hdClip', on ? 'console' : null);
  }

  /** Gwen casts: a bubble round Ben for `ms`. */
  shield(benX: number, benY: number, ms: number): void {
    this.gwen.hold('cast', 700);
    this.shieldLeft = ms;
    this.fx.ring(this.gwen.handX, this.gwen.handY, PALETTE.mana, 24, 260);
    this.fx.ring(benX, benY, PALETTE.mana, 40, 320);
    this.fx.popText(this.gwen.x, this.feetY - 34, 'SHIELD!', PALETTE.mana);
    playSfx(DEEPMAW_SFX.shield, 0.8);
  }

  update(dtMs: number, benX: number, benY: number): void {
    if (this.max.visible) this.max.update(dtMs);
    if (this.gwen.visible) this.gwen.update(dtMs);
    if (this.shieldLeft > 0) {
      this.shieldLeft = Math.max(0, this.shieldLeft - dtMs);
      const fade = Math.min(1, this.shieldLeft / 400);
      this.bubble.setVisible(true).setPosition(benX, benY).setAlpha(0.8 * fade).setScale(1 + Math.sin(this.scene.time.now * 0.012) * 0.03);
    } else if (this.bubble.visible) this.bubble.setVisible(false);
  }

  destroy(): void {
    this.max.destroy();
    this.gwen.destroy();
    this.bubble.destroy();
  }
}
