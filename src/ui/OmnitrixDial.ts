import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { OmnitrixTick } from '../systems/events';
import { pixelText } from './text';

const R = 20;

/** The watch face: timer ring (green draining / red in the last 5s / red refilling on cooldown) around a hologram of the selected alien. */
export class OmnitrixDial {
  private readonly root: Phaser.GameObjects.Container;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Image;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly status: Phaser.GameObjects.BitmapText;
  private readonly keys: Phaser.GameObjects.BitmapText;
  private tick: OmnitrixTick | null = null;
  private shakeLeft = 0;
  private popScale = 1;
  private visible = false;

  constructor(private readonly scene: Phaser.Scene, private readonly x: number, private readonly y: number) {
    this.glow = scene.add.image(0, 0, TEX.soft).setScale(4.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setTint(PALETTE.omnitrix);
    const frame = scene.add.image(0, 0, TEX.dialFrame);
    this.ring = scene.add.graphics();
    this.icon = scene.add.image(0, 0, TEX.iconHeatblast).setTint(PALETTE.omnitrix);
    this.status = pixelText(scene, 0, R + 6, '', { originX: 0.5, originY: 0, color: PALETTE.omnitrix });
    this.keys = pixelText(scene, R + 4, R - 4, 'T', { color: PALETTE.uiDim }).setAlpha(0.8);
    this.root = scene.add.container(x, y, [this.glow, frame, this.ring, this.icon, this.status, this.keys]).setVisible(false);
  }

  setVisible(visible: boolean, animate: boolean): void {
    if (visible === this.visible) return;
    this.visible = visible;
    this.root.setVisible(visible);
    if (visible && animate) {
      this.root.setScale(3).setAlpha(0);
      this.scene.tweens.add({ targets: this.root, scale: 1, alpha: 1, duration: 450, ease: 'Back.easeOut' });
    }
  }

  setTick(t: OmnitrixTick): void {
    this.tick = t;
  }

  deny(): void {
    this.shakeLeft = 260;
  }

  pop(): void {
    this.popScale = 1.35;
  }

  update(dtMs: number, now: number): void {
    const t = this.tick;
    if (!t || !this.visible) return;
    this.shakeLeft = Math.max(0, this.shakeLeft - dtMs);
    this.popScale += (1 - this.popScale) * Math.min(1, dtMs / 90);
    const sx = this.shakeLeft > 0 ? (Math.random() - 0.5) * 4 : 0;
    this.root.setPosition(this.x + sx, this.y).setScale(this.popScale);

    const g = this.ring;
    g.clear();
    g.lineStyle(4, 0x0a0d18, 1);
    g.beginPath();
    g.arc(0, 0, R, 0, Math.PI * 2);
    g.strokePath();

    const start = -Math.PI / 2;
    let color: number = PALETTE.omnitrix;
    let fraction = 1;
    let status = 'READY [T]';
    let iconColor: number = PALETTE.omnitrix;
    let glowAlpha = 0.3 + Math.sin(now * 0.005) * 0.1;

    if (t.jammed) {
      color = PALETTE.jammer;
      fraction = 1;
      status = 'JAMMED';
      iconColor = Math.floor(now / 120) % 2 ? PALETTE.jammer : PALETTE.jammerDark;
      glowAlpha = 0.2;
    } else if (t.state === 'active') {
      fraction = t.timeRatio;
      const secs = Math.ceil(t.timeRemainingMs / 1000);
      status = `${secs}S`;
      iconColor = PALETTE.fire2;
      if (t.warning) {
        const blink = Math.floor(now / 125) % 2 === 0;
        color = blink ? PALETTE.enemy : PALETTE.white;
        iconColor = blink ? PALETTE.enemy : PALETTE.fire1;
        glowAlpha = blink ? 0.6 : 0.2;
      } else {
        color = PALETTE.omnitrix;
      }
    } else if (t.state === 'cooldown') {
      fraction = t.cooldownProgress;
      color = PALETTE.enemy;
      status = 'RECHARGING';
      iconColor = PALETTE.enemyDark;
      glowAlpha = 0.12;
    }

    g.lineStyle(3, color, 1);
    g.beginPath();
    g.arc(0, 0, R, start, start + Math.PI * 2 * fraction, false);
    g.strokePath();
    if (t.state === 'active' || t.state === 'cooldown') {
      const a = start + Math.PI * 2 * fraction;
      g.fillStyle(PALETTE.white, 1);
      g.fillCircle(Math.cos(a) * R, Math.sin(a) * R, 1.5);
    }

    this.glow.setTint(t.jammed ? PALETTE.jammer : t.state === 'cooldown' ? PALETTE.enemy : t.warning ? PALETTE.enemy : PALETTE.omnitrix).setAlpha(glowAlpha);
    this.icon.setTint(iconColor);
    this.status.setText(status).setTint(t.jammed ? PALETTE.jammer : t.state === 'cooldown' || t.warning ? PALETTE.enemy : t.state === 'active' ? PALETTE.fire1 : PALETTE.omnitrix);
    if (t.state === 'ready' && !t.jammed) this.status.setAlpha(0.7 + Math.sin(now * 0.008) * 0.3);
    else this.status.setAlpha(1);
    this.keys.setVisible(t.state === 'ready' && !t.jammed);
  }
}
