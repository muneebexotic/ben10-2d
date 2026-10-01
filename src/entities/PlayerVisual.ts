import Phaser from 'phaser';
import { DEPTH, FX } from '../config/constants';
import { PALETTE } from '../config/palette';
import type { FormDefinition } from '../aliens/types';
import { blinkOn } from '../systems/Accessibility';

/**
 * The player's sprite: animation, squash & stretch, damage flashes and glows.
 * Kept separate from the physics body so visual scaling never affects collisions.
 */
export class PlayerVisual {
  readonly sprite: Phaser.GameObjects.Sprite;
  private sx = 1;
  private sy = 1;
  private flashLeft = 0;
  private flashColor = 0xffffff;
  private glowColor = 0;
  private glowAmount = 0;
  private warning = false;
  private blink = false;
  private currentAnim = '';
  private spin = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, form: FormDefinition, private prefix: string) {
    this.sprite = scene.add.sprite(x, y, form.texture, 0).setDepth(DEPTH.player);
    this.applyForm(form, prefix);
  }

  applyForm(form: FormDefinition, prefix: string): void {
    this.prefix = prefix;
    this.sprite.setTexture(form.texture, 0);
    // Aliens made of fire (or anything glowing) render above the night lightmap.
    this.sprite.setDepth(form.kind === 'alien' ? DEPTH.emissive - 2 : DEPTH.player);
    this.sprite.setOrigin(0.5, form.frame.feetY / form.frame.h);
    this.currentAnim = '';
  }

  setPrefix(prefix: string): void {
    if (prefix === this.prefix) return;
    this.prefix = prefix;
    this.currentAnim = '';
  }

  play(suffix: string): void {
    const key = `${this.prefix}-${suffix}`;
    if (key === this.currentAnim) return;
    this.currentAnim = key;
    this.sprite.play(key, true);
  }

  squash(x: number, y: number): void {
    this.sx = x;
    this.sy = y;
  }

  flash(color: number, ms: number): void {
    this.flashColor = color;
    this.flashLeft = ms;
  }

  glow(color: number, amount: number): void {
    this.glowColor = color;
    this.glowAmount = amount;
  }

  setWarning(on: boolean): void {
    this.warning = on;
  }

  setBlink(on: boolean): void {
    this.blink = on;
  }

  setSpin(radiansPerSecond: number): void {
    this.spin = radiansPerSecond;
    if (radiansPerSecond === 0) this.sprite.setRotation(0);
  }

  update(x: number, feetY: number, facing: 1 | -1, dtMs: number, now: number): void {
    const k = 1 - Math.exp(-FX.squashRecover * (dtMs / 1000));
    this.sx += (1 - this.sx) * k;
    this.sy += (1 - this.sy) * k;
    const s = this.sprite;
    s.setPosition(x, feetY);
    s.setScale(this.sx, this.sy);
    s.setFlipX(facing < 0);
    if (this.spin !== 0) s.rotation += this.spin * (dtMs / 1000);

    this.flashLeft = Math.max(0, this.flashLeft - dtMs);
    if (this.flashLeft > 0) {
      s.setTint(this.flashColor).setTintMode(Phaser.TintModes.FILL);
    } else if (this.warning && blinkOn(now, 160)) {
      s.setTint(PALETTE.enemy).setTintMode(Phaser.TintModes.ADD);
    } else if (this.glowAmount > 0.01) {
      const c = Phaser.Display.Color.IntegerToColor(this.glowColor);
      const a = this.glowAmount * (0.8 + Math.sin(now * 0.04) * 0.2);
      s.setTint(Phaser.Display.Color.GetColor(c.red * a, c.green * a, c.blue * a)).setTintMode(Phaser.TintModes.ADD);
    } else {
      s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }
    s.setAlpha(this.blink && blinkOn(now, 70) ? 0.35 : 1);
  }
}
