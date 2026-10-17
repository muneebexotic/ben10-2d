import Phaser from 'phaser';
import type { Cliffhanger } from '../../chapters/types';
import { HARBOUR_END as H } from '../../config/actEnd';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { playSfx } from '../../systems/audio/Sfx';
import { pixelText } from '../../ui/text';
import { COVER_W, COVER_X } from '../../ui/view';
import { TEX } from '../preload/assetKeys';
import { CH6_TEX } from '../preload/karachi/keys';

type Part = 'harbour' | 'black' | 'base' | 'done';

const QUAY_Y = 300;
/** The quay ends here; past it, the water. */
const EDGE_X = 470;
/** Each speaker's caption colour (light enough to read on the night). */
const WHO: Record<string, number> = { GWEN: PALETTE.gwen, BEN: PALETTE.omnitrix, MAX: 0xff9a8a };
const PLUMBER_GREEN = 0x6aff9a;
const FIREWORK_TINTS = [PALETTE.gold, PALETTE.mana, PLUMBER_GREEN, 0x7ac8ff, 0xffffff] as const;

/**
 * Act 2's last scene (Chapter 6). Keamari harbour at night: the Charms are
 * safe and Gwen keeps the one that chose her. A device in Max's jacket beeps;
 * he walks to the water's edge to answer it ("THIS IS TENNYSON. ...MAGISTER,
 * I'M RETIRED.") and Ben sees a badge he doesn't know. MEANWHILE, deep under
 * the Arabian Sea off Karachi, a sealed base powers up light by light, a
 * signal with Max's name on it, and PLUMBERS on its screen. The ACT COMPLETE
 * screen after it has fireworks over the harbour.
 */
export class HarbourCliffhanger implements Cliffhanger {
  readonly title = { text: 'THE PLUMBERS', color: PLUMBER_GREEN };
  readonly stage: Phaser.GameObjects.Container;
  private part: Part = 'harbour';
  private t = 0;
  private said = -1;
  private readonly caption: Phaser.GameObjects.BitmapText;
  private readonly sea: Phaser.GameObjects.TileSprite;
  private readonly max: Phaser.GameObjects.Sprite;
  private readonly ben: Phaser.GameObjects.Sprite;
  private readonly beeper: Phaser.GameObjects.Arc;
  private readonly badge: Phaser.GameObjects.Container;
  private base: Phaser.GameObjects.Container | null = null;
  private lamps: Phaser.GameObjects.Arc[] = [];
  private screen: Phaser.GameObjects.BitmapText | null = null;
  private lit = 0;
  private typed = 0;
  private flashed = false;
  private beeped = false;
  private walked = false;
  private badged = false;

  constructor(private readonly scene: Phaser.Scene) {
    const items: Phaser.GameObjects.GameObject[] = [];
    this.harbourBackdrop(items);
    this.sea = items[items.length - 1] as Phaser.GameObjects.TileSprite;
    // The quay, with the Rustbucket parked on it and the family by the water.
    const quay = scene.add.graphics();
    quay.fillStyle(0x24222c, 1).fillRect(COVER_X, QUAY_Y, EDGE_X - COVER_X, GAME_HEIGHT - QUAY_Y);
    quay.fillStyle(0x3a3644, 1).fillRect(COVER_X, QUAY_Y, EDGE_X - COVER_X, 3);
    for (let x = 60; x < EDGE_X; x += 110) quay.fillStyle(0x14121a, 1).fillRect(x, QUAY_Y - 8, 8, 8).fillRect(x - 1, QUAY_Y - 9, 10, 2);
    items.push(quay);
    items.push(scene.add.image(150, QUAY_Y + 1, TEX.rustbucket, 0).setOrigin(0.5, 1).setScale(2));
    const gwen = scene.add.sprite(260, QUAY_Y + 1, TEX.gwen, 0).setOrigin(0.5, 1).setScale(2).setFlipX(true);
    gwen.play('gwen-idle');
    // The Charm in her hand, glowing for her.
    const glow = scene.add.image(gwen.x - 12, QUAY_Y - 26, TEX.light).setTint(PALETTE.mana).setScale(0.35).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: glow, scale: 0.5, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
    this.ben = scene.add.sprite(300, QUAY_Y + 1, TEX.ben, 0).setOrigin(0.5, 1).setScale(2);
    this.ben.play('ben-idle');
    this.max = scene.add.sprite(350, QUAY_Y + 1, TEX.max, 0).setOrigin(0.5, 1).setScale(2).setFlipX(true);
    this.max.play('max-idle');
    this.beeper = scene.add.circle(this.max.x - 6, QUAY_Y - 40, 2, PLUMBER_GREEN).setVisible(false);
    this.badge = this.buildBadge();
    items.push(gwen, glow, this.ben, this.max, this.beeper, this.badge);
    this.caption = pixelText(scene, GAME_WIDTH / 2, 334, '', { originX: 0.5, originY: 0.5, color: PALETTE.cream, maxWidth: 560, align: 'center' });
    items.push(this.caption);
    this.stage = scene.add.container(0, 0, items).setAlpha(0);
    scene.tweens.add({ targets: this.stage, alpha: 1, duration: H.fadeMs });
    playSfx('splash', 0.3, 0.6);
  }

  /** Sky, stars, the city across the water (its domes only as far silhouettes), the port's cranes, the lighthouse, the sea. */
  private harbourBackdrop(items: Phaser.GameObjects.GameObject[]): void {
    const scene = this.scene;
    items.push(scene.add.image(COVER_X, 0, CH6_TEX.sky).setOrigin(0, 0).setDisplaySize(COVER_W, GAME_HEIGHT));
    items.push(scene.add.tileSprite(COVER_X, 0, COVER_W, 200, TEX.stars).setOrigin(0, 0).setAlpha(0.8));
    items.push(scene.add.image(520, 70, CH6_TEX.moon).setScale(1.2));
    items.push(scene.add.tileSprite(COVER_X, 118, COVER_W, 150, CH6_TEX.skylineFar).setOrigin(0, 0).setTilePosition(140, 0));
    items.push(scene.add.tileSprite(COVER_X, 148, COVER_W, 120, CH6_TEX.port).setOrigin(0, 0).setTilePosition(60, 0));
    const lighthouse = scene.add.image(600, 268, CH6_TEX.lighthouse).setOrigin(0.5, 1);
    const beam = scene.add.image(lighthouse.x, lighthouse.y - lighthouse.height + 8, CH6_TEX.beam).setOrigin(0, 0.5).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: beam, angle: { from: 150, to: 230 }, duration: 5200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    items.push(lighthouse, beam);
    // The harbour lights on the water.
    for (let i = 0; i < 14; i++) {
      const x = COVER_X + 30 + i * 62 + (i % 3) * 9;
      const r = scene.add.rectangle(x, 276 + (i % 4) * 7, 10 + (i % 3) * 6, 2, i % 2 ? PALETTE.gold : 0xffe2a8, 0.6).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: r, alpha: 0.15, scaleX: 0.6, duration: 600 + (i % 5) * 170, yoyo: true, repeat: -1 });
      items.push(r);
    }
    items.push(scene.add.tileSprite(COVER_X, 268, COVER_W, GAME_HEIGHT - 268, CH6_TEX.sea).setOrigin(0, 0).setAlpha(0.85));
  }

  /** The badge Ben glimpses: gold, round, with a green light at its heart. */
  private buildBadge(): Phaser.GameObjects.Container {
    const scene = this.scene;
    const g = scene.add.graphics();
    g.fillStyle(0x7a5a1a, 1).fillCircle(0, 0, 15);
    g.fillStyle(PALETTE.gold, 1).fillCircle(0, 0, 13);
    g.fillStyle(0x1a1a22, 1).fillCircle(0, 0, 8);
    g.fillStyle(PALETTE.gold, 1).fillTriangle(-6, -6, 6, -6, 0, 0).fillTriangle(-6, 6, 6, 6, 0, 0);
    g.fillStyle(PLUMBER_GREEN, 1).fillCircle(0, 0, 2);
    const shine = scene.add.image(0, 0, TEX.light).setTint(PLUMBER_GREEN).setScale(0.5).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
    return scene.add.container(EDGE_X - 40, 200, [shine, g]).setScale(0).setAlpha(0);
  }

  update(dtMs: number): boolean {
    this.t += dtMs;
    this.sea.tilePositionX += dtMs * 0.008;
    switch (this.part) {
      case 'harbour':
        this.updateHarbour();
        return false;
      case 'black':
        if (this.t >= H.meanwhileMs) this.toBase();
        return false;
      case 'base':
        this.updateBase();
        return false;
      default:
        return true;
    }
  }

  skip(): boolean {
    if (this.part === 'harbour') {
      this.toBlack();
      return false;
    }
    this.part = 'done';
    return true;
  }

  private updateHarbour(): void {
    const next = H.lines[this.said + 1];
    if (next && this.t >= next.at) {
      this.said++;
      this.caption.setText(next.who ? `${next.who}: ${next.text}` : next.text).setTint(next.who ? WHO[next.who] : PALETTE.cream).setAlpha(0);
      this.scene.tweens.add({ targets: this.caption, alpha: 1, duration: 200 });
      if (next.who) playSfx('voice', 0.3, next.who === 'MAX' ? 0.7 : next.who === 'GWEN' ? 1.3 : 1.1);
    }
    if (!this.beeped && this.t >= H.beepAt) {
      this.beeped = true;
      this.beeper.setVisible(true);
      this.scene.tweens.add({ targets: this.beeper, alpha: 0, duration: 160, yoyo: true, repeat: 5 });
      for (let i = 0; i < 3; i++) this.scene.time.delayedCall(i * 260, () => playSfx('beep', 0.5, 2.2));
      this.ben.setFlipX(false);
    }
    if (!this.walked && this.t >= H.walkAt) {
      this.walked = true;
      this.max.setFlipX(false).play('max-walk');
      this.scene.tweens.add({ targets: [this.max, this.beeper], x: `+=${EDGE_X - 30 - this.max.x}`, duration: H.walkMs, onComplete: () => this.max.play('max-idle') });
    }
    if (!this.badged && this.t >= H.badgeAt) {
      this.badged = true;
      this.badge.setPosition(this.max.x - 2, QUAY_Y - 58);
      this.scene.tweens.add({ targets: this.badge, scale: 1.4, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: this.badge, alpha: 0, scale: 0.6, delay: 1700, duration: 400 });
      playSfx('reveal', 0.6, 1.2);
    }
    if (this.t >= H.harbourMs) this.toBlack();
  }

  /** MEANWHILE... on black. */
  private toBlack(): void {
    if (this.part !== 'harbour') return;
    this.part = 'black';
    this.t = 0;
    const scene = this.scene;
    this.clear();
    this.stage.setAlpha(1);
    const black = scene.add.rectangle(COVER_X, 0, COVER_W, GAME_HEIGHT, 0x000000).setOrigin(0, 0);
    const m = pixelText(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'MEANWHILE...', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.cream }).setAlpha(0);
    const where = pixelText(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 'DEEP UNDER THE ARABIAN SEA, OFF KARACHI', { originX: 0.5, originY: 0.5, color: 0x7ac8ff }).setAlpha(0);
    this.stage.add([black, m, where]);
    scene.tweens.add({ targets: m, alpha: 1, duration: 500 });
    scene.tweens.add({ targets: where, alpha: 1, delay: 900, duration: 500 });
  }

  /** Everything on stage goes (and its looping tweens with it). */
  private clear(): void {
    this.scene.tweens.killTweensOf(this.stage.list);
    this.stage.removeAll(true);
  }

  /** The sealed base on the sea floor, dark. */
  private toBase(): void {
    this.part = 'base';
    this.t = 0;
    const scene = this.scene;
    this.clear();
    const items: Phaser.GameObjects.GameObject[] = [];
    const water = scene.add.graphics();
    water.fillGradientStyle(0x0c3458, 0x0c3458, 0x02060e, 0x02060e, 1).fillRect(COVER_X, 0, COVER_W, GAME_HEIGHT);
    items.push(water);
    // Light from far above, swaying.
    for (let i = 0; i < 5; i++) {
      const ray = scene.add.rectangle(80 + i * 130, -20, 26 + (i % 2) * 18, 300, 0x7ac8ff, 0.06).setOrigin(0.5, 0).setAngle(-12 + i * 5).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: ray, angle: ray.angle + 6, alpha: 0.02, duration: 2600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      items.push(ray);
    }
    const floor = scene.add.graphics();
    floor.fillStyle(0x04080e, 1);
    floor.fillRect(COVER_X, 318, COVER_W, GAME_HEIGHT - 318);
    for (let x = COVER_X; x < COVER_X + COVER_W; x += 46) floor.fillTriangle(x, 320, x + 23, 300 - ((x * 7) % 19), x + 46, 320);
    items.push(floor);
    // The base: a ribbed dome on legs, a tower with a screen, lamps round the rim.
    const cx = GAME_WIDTH / 2;
    const g = scene.add.graphics();
    g.fillStyle(0x1a2430, 1).fillEllipse(cx, 300, 340, 150);
    g.fillStyle(0x24303e, 1).fillEllipse(cx, 296, 300, 120);
    g.lineStyle(2, 0x0e141c, 1);
    for (let i = -3; i <= 3; i++) g.lineBetween(cx + i * 40, 240 + Math.abs(i) * 6, cx + i * 46, 318);
    g.fillStyle(0x1a2430, 1).fillRect(cx - 60, 196, 120, 60).fillRect(cx - 70, 190, 140, 10);
    g.fillStyle(0x0a1018, 1).fillRect(cx - 54, 204, 108, 38);
    g.lineStyle(1, 0x2a5a48, 1).strokeRect(cx - 54, 204, 108, 38);
    for (const lx of [-150, -90, 90, 150]) g.fillStyle(0x10161e, 1).fillRect(cx + lx - 5, 300, 10, 22);
    items.push(g);
    this.lamps = [];
    for (let i = 0; i < H.lights; i++) {
      const a = Math.PI + ((i + 0.5) / H.lights) * Math.PI;
      const lamp = scene.add.circle(cx + Math.cos(a) * 160, 300 + Math.sin(a) * 66, 4, 0x2a3440);
      this.lamps.push(lamp);
      items.push(lamp);
    }
    this.screen = pixelText(scene, cx, 222, '', { originX: 0.5, originY: 0.5, color: PLUMBER_GREEN, align: 'center' });
    items.push(this.screen);
    const bubbles = scene.add.particles(0, 0, TEX.px, {
      x: { min: COVER_X, max: COVER_X + COVER_W },
      y: GAME_HEIGHT + 4,
      lifespan: 5000,
      speedY: { min: -70, max: -30 },
      speedX: { min: -6, max: 6 },
      scale: { min: 1, max: 2.5 },
      alpha: { start: 0.6, end: 0 },
      tint: 0x9adcff,
      frequency: 90,
    });
    items.push(bubbles);
    this.base = scene.add.container(0, 0, items);
    this.stage.add(this.base);
    this.base.setAlpha(0);
    scene.tweens.add({ targets: this.base, alpha: 1, duration: 700 });
    playSfx('splash', 0.4, 0.4);
  }

  private updateBase(): void {
    const scene = this.scene;
    // The lamps come on one by one.
    while (this.lit < this.lamps.length && this.t >= H.lightsAt + this.lit * H.lightEveryMs) {
      const lamp = this.lamps[this.lit++];
      lamp.setFillStyle(PLUMBER_GREEN);
      const glow = scene.add.image(lamp.x, lamp.y, TEX.light).setTint(PLUMBER_GREEN).setScale(0.4).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
      this.base?.add(glow);
      playSfx('lightClunk', 0.5, 0.8 + this.lit * 0.06);
    }
    // The signal types itself out on the screen.
    const signal = 'INCOMING SIGNAL\nTENNYSON, MAX';
    if (this.t >= H.signalAt && this.typed < signal.length && !this.flashed) {
      const n = Math.min(signal.length, Math.floor((this.t - H.signalAt) / H.typeMs));
      if (n > this.typed) {
        this.typed = n;
        this.screen?.setText(signal.slice(0, n));
        if (signal[n - 1] !== ' ' && signal[n - 1] !== '\n') playSfx('tick', 0.25, 1.6);
      }
    }
    if (!this.flashed && this.t >= H.plumbersAt) {
      this.flashed = true;
      this.screen?.setText('PLUMBERS').setScale(2);
      if (this.screen) scene.tweens.add({ targets: this.screen, alpha: 0.2, duration: 180, yoyo: true, repeat: 3 });
      playSfx('holoOn', 0.8, 0.8);
    }
    if (this.t >= H.baseMs) this.part = 'done';
  }

  /** ACT 2 COMPLETE's backdrop: the harbour again, with fireworks going up over the water. */
  finale(): (dtMs: number) => void {
    const scene = this.scene;
    const items: Phaser.GameObjects.GameObject[] = [];
    this.harbourBackdrop(items);
    const sea = items[items.length - 1] as Phaser.GameObjects.TileSprite;
    scene.add.container(0, 0, items);
    const bursts = FIREWORK_TINTS.map((tint) =>
      scene.add
        .particles(0, 0, TEX.px, {
          lifespan: 1500,
          speed: { min: 40, max: 150 },
          gravityY: 50,
          scale: { start: 3, end: 0.5 },
          alpha: { start: 1, end: 0 },
          tint,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false,
        })
        .setDepth(1),
    );
    const rockets = Array.from({ length: 4 }, () => ({
      img: scene.add.image(0, 0, TEX.px).setScale(2).setVisible(false).setDepth(1),
      vy: 0,
      topY: 0,
      kind: 0,
    }));
    let next = 300;
    return (dtMs: number) => {
      sea.tilePositionX += dtMs * 0.008;
      next -= dtMs;
      if (next <= 0) {
        next = H.fireworkEveryMs[0] + Math.random() * (H.fireworkEveryMs[1] - H.fireworkEveryMs[0]);
        const r = rockets.find((x) => !x.img.visible);
        if (r) {
          r.kind = Math.floor(Math.random() * bursts.length);
          r.img.setPosition(40 + Math.random() * (GAME_WIDTH - 80), 280).setTint(FIREWORK_TINTS[r.kind]).setVisible(true);
          r.vy = -220 - Math.random() * 60;
          r.topY = 50 + Math.random() * 90;
        }
      }
      for (const r of rockets) {
        if (!r.img.visible) continue;
        r.img.y += (r.vy * dtMs) / 1000;
        if (r.img.y > r.topY) continue;
        r.img.setVisible(false);
        bursts[r.kind].explode(48, r.img.x, r.img.y);
        const bloom = scene.add.image(r.img.x, r.img.y, TEX.light).setTint(FIREWORK_TINTS[r.kind]).setScale(0.9).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: bloom, alpha: 0, scale: 1.6, duration: 500, onComplete: () => bloom.destroy() });
        playSfx('explode', 0.15, 1.6 + Math.random() * 0.4);
      }
    };
  }
}
