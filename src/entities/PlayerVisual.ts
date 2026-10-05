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
  private readonly ghosts: Phaser.GameObjects.Image[] = [];
  /** A form's gauge (flight stamina): a small wheel beside the head that fades out once it has been full a while. */
  private readonly meterGfx: Phaser.GameObjects.Graphics;
  private meter: { value: number; color: number } | null = null;
  private meterAlpha = 0;
  private meterFullMs = 0;
  /** Cutscenes show and hide Ben; a form can hide itself too (`hidden`). He shows only when both allow it. */
  private shown = true;
  private hidden = false;

  constructor(private readonly scene: Phaser.Scene, x: number, y: number, form: FormDefinition, private prefix: string) {
    this.sprite = scene.add.sprite(x, y, form.texture, 0).setDepth(DEPTH.player);
    this.meterGfx = scene.add.graphics().setDepth(DEPTH.worldUi - 1);
    this.applyForm(form, prefix);
  }

  setMeter(m: { value: number; color: number } | null): void {
    this.meter = m;
  }

  applyForm(form: FormDefinition, prefix: string): void {
    this.prefix = prefix;
    this.sprite.setTexture(form.texture, 0);
    // Aliens made of fire (or anything glowing) render above the night lightmap.
    this.sprite.setDepth(form.feel.emissive ? DEPTH.emissive - 2 : DEPTH.player);
    this.sprite.setOrigin(0.5, form.frame.feetY / form.frame.h);
    this.currentAnim = '';
  }

  /** A tinted copy of the current frame that fades where it was left (pooled). */
  afterimage(color: number, alpha: number, lifeMs: number): void {
    const s = this.sprite;
    let ghost = this.ghosts.find((g) => !g.visible);
    if (!ghost) {
      ghost = this.scene.add.image(0, 0, s.texture.key);
      this.ghosts.push(ghost);
    }
    ghost
      .setTexture(s.texture.key, s.frame.name)
      .setOrigin(s.originX, s.originY)
      .setPosition(s.x, s.y)
      .setScale(s.scaleX, s.scaleY)
      .setFlipX(s.flipX)
      .setRotation(s.rotation)
      .setDepth(s.depth - 1)
      .setTint(color)
      .setTintMode(Phaser.TintModes.FILL)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(alpha)
      .setVisible(true);
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: lifeMs, ease: 'Quad.easeIn', onComplete: () => ghost.setVisible(false) });
  }

  /** Hidden while Ben is somewhere else in a cutscene (inside the RV). */
  setVisible(on: boolean): void {
    this.shown = on;
    this.sprite.setVisible(this.shown && !this.hidden);
  }

  /** Hidden by the form itself (Upgrade poured inside a machine), independent of cutscenes. */
  setHidden(on: boolean): void {
    this.hidden = on;
    this.sprite.setVisible(this.shown && !this.hidden);
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
    this.drawMeter(x, feetY, facing, dtMs);
  }

  private drawMeter(x: number, feetY: number, facing: 1 | -1, dtMs: number): void {
    const g = this.meterGfx;
    g.clear();
    const m = this.meter;
    if (m && m.value < 0.999) this.meterFullMs = 0;
    else this.meterFullMs += dtMs;
    const target = m && this.meterFullMs < 600 ? 1 : 0;
    this.meterAlpha += (target - this.meterAlpha) * Math.min(1, dtMs / 120);
    if (!m || this.meterAlpha < 0.02) return;
    const cx = x - facing * 15;
    const cy = feetY - 30;
    const low = m.value < 0.25;
    g.fillStyle(PALETTE.ink, 0.6 * this.meterAlpha).fillCircle(cx, cy, 6);
    g.lineStyle(3, PALETTE.inkSoft, 0.9 * this.meterAlpha).beginPath();
    g.arc(cx, cy, 4.5, 0, Math.PI * 2);
    g.strokePath();
    g.lineStyle(3, low ? PALETTE.enemy : m.color, this.meterAlpha).beginPath();
    g.arc(cx, cy, 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, m.value), false);
    g.strokePath();
  }
}
