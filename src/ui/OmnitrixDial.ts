import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { DIAL_UI } from '../config/ui';
import { TEX } from '../scenes/preload/assetKeys';
import { getAlien, hasAlien } from '../aliens/registry';
import type { OmnitrixTick } from '../systems/events';
import { pixelText } from './text';
import { blinkOn } from '../systems/Accessibility';
import { inputMode } from '../systems/InputMode';
import { arcSteps, BakedGraphics } from './BakedGraphics';

const R = 20;

function iconFor(id: string | null): string {
  return id && hasAlien(id) ? getAlien(id).hudIcon : TEX.iconBen;
}

function colorFor(id: string | null): number {
  return id && hasAlien(id) ? getAlien(id).theme.color : PALETTE.omnitrix;
}

/**
 * The watch face: timer ring (green draining / red in the last 5s / red
 * refilling on cooldown) around a hologram of the alien. Turning the dial
 * flashes a row of every alien on it; while transformed, a badge shows the
 * alien a swap would bring in.
 */
export class OmnitrixDial {
  private readonly root: Phaser.GameObjects.Container;
  private readonly ring: BakedGraphics;
  private ringKey = '';
  private readonly glow: Phaser.GameObjects.Image;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly status: Phaser.GameObjects.BitmapText;
  private readonly pips: BakedGraphics;
  private pipsKey = '';
  private readonly badge: Phaser.GameObjects.Container;
  private readonly badgeIcon: Phaser.GameObjects.Image;
  private readonly badgeRing: Phaser.GameObjects.Image;
  private readonly fixLabel: Phaser.GameObjects.BitmapText;
  private glitchLeft = 0;
  private readonly carousel: Phaser.GameObjects.Container;
  private readonly carouselIcons: Phaser.GameObjects.Image[] = [];
  private readonly carouselName: Phaser.GameObjects.BitmapText;
  private carouselLeft = 0;
  private carouselKey = '';
  private tick: OmnitrixTick | null = null;
  private shakeLeft = 0;
  private popScale = 1;
  private visible = false;
  private shownIcon = '';

  constructor(private readonly scene: Phaser.Scene, private x: number, private readonly y: number) {
    this.glow = scene.add.image(0, 0, TEX.soft).setScale(4.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setTint(PALETTE.omnitrix);
    const frame = scene.add.image(0, 0, TEX.dialFrame);
    this.ring = BakedGraphics.round(scene, R);
    this.icon = scene.add.image(0, 0, TEX.iconBen).setTint(PALETTE.omnitrix);
    this.status = pixelText(scene, 0, R + 6, '', { originX: 0.5, originY: 0, color: PALETTE.omnitrix });
    // One pip per alien on the dial, in a row under the ring (room for every alien there will be).
    this.pips = new BakedGraphics(scene, -32, R + 16, 64, 5);

    const badgeBg = BakedGraphics.round(scene, 8).draw((g) => {
      g.fillStyle(PALETTE.ink, 0.9).fillCircle(0, 0, 8);
      g.lineStyle(1, PALETTE.omnitrix, 1).strokeCircle(0, 0, 8);
    }).image;
    this.badgeIcon = scene.add.image(0, 0, TEX.iconBen).setScale(0.6);
    this.badgeRing = BakedGraphics.round(scene, 9).draw((g) => g.lineStyle(1, PALETTE.gold, 1).strokeCircle(0, 0, 9)).image;
    // After a misfire the swap back is half price: the badge says so.
    this.fixLabel = pixelText(scene, 12, 0, 'FIX', { originX: 0, originY: 0.5, color: PALETTE.gold });
    this.badge = scene.add.container(R - 2, R - 4, [badgeBg, this.badgeRing, this.badgeIcon, this.fixLabel]).setVisible(false);

    this.carouselName = pixelText(scene, 0, DIAL_UI.carouselNameY, '', { originX: 0.5, originY: 0, color: PALETTE.white });
    this.carousel = scene.add.container(0, 0, [this.carouselName]).setVisible(false);
    this.root = scene.add.container(x, y, [this.glow, frame, this.ring.image, this.icon, this.status, this.pips.image, this.badge]).setVisible(false);
  }

  setVisible(visible: boolean, animate: boolean): void {
    if (visible === this.visible) return;
    this.visible = visible;
    this.root.setVisible(visible);
    if (!visible) this.carousel.setVisible(false);
    if (visible && animate) {
      this.root.setScale(3).setAlpha(0);
      this.scene.tweens.add({ targets: this.root, scale: 1, alpha: 1, duration: 450, ease: 'Back.easeOut' });
    }
  }

  /** Moves the dial (it stays pinned to the left screen edge on wide screens). */
  setX(x: number): void {
    this.x = x;
    this.root.setX(x);
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

  /** The watch glitches after a misfire: the hologram stutters for a moment. */
  glitch(): void {
    this.glitchLeft = 700;
    this.shakeLeft = 300;
  }

  /** The dial turned: slide the hologram over and flash the row of aliens. */
  turned(selectedId: string, direction: 1 | -1): void {
    this.pop();
    if (this.tick?.state !== 'active') {
      this.icon.setX(direction * 10).setAlpha(0.2);
      this.scene.tweens.add({ targets: this.icon, x: 0, alpha: 1, duration: 160, ease: 'Back.easeOut' });
    } else {
      this.badge.setScale(1.6);
      this.scene.tweens.add({ targets: this.badge, scale: 1, duration: 200, ease: 'Back.easeOut' });
    }
    this.showCarousel(selectedId);
  }

  private showCarousel(selectedId: string): void {
    const list = this.tick?.unlocked ?? [selectedId];
    const key = list.join(',');
    if (key !== this.carouselKey) {
      for (const img of this.carouselIcons) img.destroy();
      this.carouselIcons.length = 0;
      for (const id of list) {
        const img = this.scene.add.image(0, 0, iconFor(id));
        this.carousel.add(img);
        this.carouselIcons.push(img);
      }
      this.carouselKey = key;
    }
    const span = (list.length - 1) * DIAL_UI.carouselSpacing;
    // Never past the left screen edge (the dial sits 30 px in from it).
    const cx = Math.max(this.x, this.x - 20 + span / 2);
    this.carousel.setPosition(cx, this.y + DIAL_UI.carouselY);
    list.forEach((id, i) => {
      const img = this.carouselIcons[i];
      const selected = id === selectedId;
      img.setPosition(i * DIAL_UI.carouselSpacing - span / 2, 0);
      img.setScale(selected ? 1.25 : 0.8).setTint(selected ? colorFor(id) : PALETTE.uiDim).setAlpha(selected ? 1 : 0.55);
    });
    const name = hasAlien(selectedId) ? getAlien(selectedId).name : '';
    this.carouselName.setText(name).setTint(colorFor(selectedId)).setX(0);
    this.carousel.setVisible(this.visible).setAlpha(1);
    this.carouselLeft = DIAL_UI.carouselMs;
  }

  update(dtMs: number, now: number): void {
    const t = this.tick;
    if (!t || !this.visible) return;
    this.shakeLeft = Math.max(0, this.shakeLeft - dtMs);
    this.glitchLeft = Math.max(0, this.glitchLeft - dtMs);
    this.popScale += (1 - this.popScale) * Math.min(1, dtMs / 90);
    const sx = this.shakeLeft > 0 ? (Math.random() - 0.5) * 4 : 0;
    this.root.setPosition(this.x + sx, this.y).setScale(this.popScale);

    if (this.carouselLeft > 0) {
      this.carouselLeft -= dtMs;
      if (this.carouselLeft < DIAL_UI.carouselFadeMs) this.carousel.setAlpha(Math.max(0, this.carouselLeft / DIAL_UI.carouselFadeMs));
      if (this.carouselLeft <= 0) this.carousel.setVisible(false);
    }

    const active = t.state === 'active';
    const shownId = active ? t.activeId : t.selectedId;
    const alienColor = colorFor(shownId);
    let color: number = PALETTE.omnitrix;
    let fraction = 1;
    let status = inputMode.current === 'touch' ? 'READY!' : 'READY [T]';
    let iconColor: number = PALETTE.omnitrix;
    let glowAlpha = 0.3 + Math.sin(now * 0.005) * 0.1;

    if (t.jammed) {
      color = PALETTE.jammer;
      fraction = 1;
      status = 'JAMMED';
      iconColor = blinkOn(now, 120) ? PALETTE.jammerDark : PALETTE.jammer;
      glowAlpha = 0.2;
    } else if (active) {
      fraction = t.frozen ? 1 : t.timeRatio;
      status = t.frozen ? 'NO LIMIT' : `${Math.ceil(t.timeRemainingMs / 1000)}S`;
      iconColor = alienColor;
      color = PALETTE.omnitrix;
      if (t.warning) {
        const blink = blinkOn(now, 125);
        color = blink ? PALETTE.enemy : PALETTE.white;
        iconColor = blink ? PALETTE.enemy : alienColor;
        glowAlpha = blink ? 0.6 : 0.2;
      }
    } else if (t.state === 'cooldown') {
      fraction = t.cooldownProgress;
      color = PALETTE.enemy;
      status = 'RECHARGING';
      iconColor = PALETTE.enemyDark;
      glowAlpha = 0.12;
    }

    const iconKey = iconFor(shownId);
    if (iconKey !== this.shownIcon) {
      this.icon.setTexture(iconKey);
      this.shownIcon = iconKey;
    }

    this.drawRing(color, fraction, (active && !t.frozen) || t.state === 'cooldown');

    if (this.glitchLeft > 0 && blinkOn(now, 70)) {
      iconColor = PALETTE.enemy;
      this.icon.setX((Math.random() - 0.5) * 3);
    } else this.icon.setX(0);

    this.glow.setTint(t.jammed ? PALETTE.jammer : t.state === 'cooldown' || t.warning ? PALETTE.enemy : active ? alienColor : PALETTE.omnitrix).setAlpha(glowAlpha);
    this.icon.setTint(iconColor);
    this.status.setText(status).setTint(t.jammed ? PALETTE.jammer : t.state === 'cooldown' || t.warning ? PALETTE.enemy : active ? alienColor : PALETTE.omnitrix);
    if (t.state === 'ready' && !t.jammed) this.status.setAlpha(0.7 + Math.sin(now * 0.008) * 0.3);
    else this.status.setAlpha(1);

    this.updateBadge(t, now);
    this.drawPips(t);
  }

  /** While transformed with a different alien on the dial: the swap target, pulsing when a swap is possible. */
  private updateBadge(t: OmnitrixTick, now: number): void {
    const show = t.state === 'active' && !t.jammed && t.selectedId !== null && t.selectedId !== t.activeId;
    this.badge.setVisible(show);
    if (!show) return;
    this.badgeIcon.setTexture(iconFor(t.selectedId)).setTint(t.canSwap ? colorFor(t.selectedId) : PALETTE.uiDim);
    this.badge.setAlpha(t.canSwap ? 0.8 + Math.sin(now * 0.012) * 0.2 : 0.5);
    this.badgeRing.setVisible(t.fixOwed);
    this.fixLabel.setVisible(t.fixOwed);
  }

  /**
   * The timer ring. Its end only moves in whole pixels of the circumference, so it is
   * redrawn when the colour, that pixel or the end dot changes, not every frame.
   */
  private drawRing(color: number, fraction: number, dot: boolean): void {
    const steps = arcSteps(R);
    const shown = Math.round(fraction * steps);
    const key = `${color}|${shown}|${dot}`;
    if (key === this.ringKey) return;
    this.ringKey = key;
    const start = -Math.PI / 2;
    const end = start + Math.PI * 2 * (shown / steps);
    this.ring.draw((g) => {
      g.lineStyle(4, 0x0a0d18, 1);
      g.beginPath();
      g.arc(0, 0, R, 0, Math.PI * 2);
      g.strokePath();
      g.lineStyle(3, color, 1);
      g.beginPath();
      g.arc(0, 0, R, start, end, false);
      g.strokePath();
      if (dot) {
        g.fillStyle(PALETTE.white, 1);
        g.fillCircle(Math.cos(end) * R, Math.sin(end) * R, 1.5);
      }
    });
  }

  /** One dot per alien on the dial; the selected one is lit. */
  private drawPips(t: OmnitrixTick): void {
    const n = t.unlocked.length;
    const show = n >= 2 && this.carouselLeft <= 0;
    const index = t.selectedId ? t.unlocked.indexOf(t.selectedId) : -1;
    const key = show ? `${t.unlocked.join(',')}|${index}` : '';
    this.pips.image.setVisible(show);
    if (key === this.pipsKey) return;
    this.pipsKey = key;
    if (!show) return;
    const y = R + 17;
    this.pips.draw((g) => {
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 5;
        g.fillStyle(i === index ? colorFor(t.unlocked[i]) : PALETTE.inkSoft, 1);
        g.fillRect(x - 1, y, 3, 3);
      }
    });
  }
}
