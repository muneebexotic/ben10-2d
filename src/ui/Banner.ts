import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { PALETTE } from '../config/palette';
import { TEX } from '../scenes/preload/assetKeys';
import type { BannerPayload } from '../systems/events';
import { pixelText } from './text';
import { COVER_W } from './view';
import { a11y, shakeCamera } from '../systems/Accessibility';
import { NAME_SLAM } from '../config/ui';
import { MISFIRE } from '../config/omnitrix';
import type { SlamStyle } from '../aliens/types';

/** Big centre-screen moments: chapter titles, checkpoints, the alien name slam, the Omnitrix emblem flash. */
export class Banner {
  private current: Phaser.GameObjects.Container | null = null;
  private readonly symbol: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene) {
    this.symbol = scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.hourglass)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false)
      .setDepth(500);
  }

  show(p: BannerPayload): void {
    this.current?.destroy();
    const color = p.color ?? PALETTE.white;
    const style = p.style ?? 'soft';
    const y = style === 'boss' ? 110 : 96;
    const title = pixelText(this.scene, 0, 0, p.title, { scale: style === 'soft' ? 2 : 3, originX: 0.5, originY: 0.5, color });
    const items: Phaser.GameObjects.GameObject[] = [];
    const stripe = this.scene.add.rectangle(0, 0, COVER_W + 40, style === 'soft' ? 26 : 40, 0x000000, 0.55);
    items.push(stripe, title);
    if (p.subtitle) {
      const sub = pixelText(this.scene, 0, style === 'soft' ? 16 : 22, p.subtitle, { originX: 0.5, originY: 0.5, color: PALETTE.cream });
      items.push(sub);
      stripe.setSize(COVER_W + 40, style === 'soft' ? 44 : 56).setY(style === 'soft' ? 7 : 9);
    }
    const c = this.scene.add.container(GAME_WIDTH / 2, y, items).setDepth(400);
    this.current = c;
    const duration = p.durationMs ?? 1500;
    if (style === 'soft') {
      c.setAlpha(0);
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 300 });
    } else {
      c.setScale(2.4).setAlpha(0);
      this.scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
      shakeCamera(this.scene.cameras.main, 180, 0.006, false);
    }
    this.scene.tweens.add({
      targets: c,
      alpha: 0,
      delay: duration,
      duration: 350,
      onComplete: () => {
        if (this.current === c) this.current = null;
        c.destroy();
      },
    });
  }

  /**
   * The alien's name slams onto the screen in its own style: Heatblast's
   * blazes in, XLR8's streaks across, Four Arms' drops and cracks the HUD.
   * Swaps use a smaller, quicker version so fights keep flowing.
   */
  alienName(name: string, color: number, opts: { first: boolean; swap: boolean; style: SlamStyle }): void {
    this.current?.destroy();
    const scale = opts.swap ? NAME_SLAM.swapScale : NAME_SLAM.scale;
    const hold = opts.first ? NAME_SLAM.firstHoldMs : opts.swap ? NAME_SLAM.swapHoldMs : NAME_SLAM.holdMs;
    const y = opts.first ? 110 : opts.swap ? 78 : 90;
    const text = `${name}!`;
    if (opts.style === 'blur') this.blurSlam(text, color, scale, hold, y);
    else if (opts.style === 'quake') this.quakeSlam(text, color, scale, hold, y);
    else if (opts.style === 'howl') this.howlSlam(text, color, scale, hold, y);
    else if (opts.style === 'buzz') this.buzzSlam(text, color, scale, hold, y);
    else this.blazeSlam(text, color, scale, hold, y, opts.first);
  }

  private finish(c: Phaser.GameObjects.Container): void {
    if (this.current === c) this.current = null;
    c.destroy();
  }

  /** Speed streaks behind a tilted slam that peels away (Heatblast). */
  private blazeSlam(text: string, color: number, scale: number, hold: number, y: number, first: boolean): void {
    const streaks = this.scene.add.graphics();
    for (let i = 0; i < 12; i++) {
      streaks.fillStyle(i % 2 ? color : PALETTE.white, 0.5);
      const yy = -22 + Math.random() * 44;
      streaks.fillRect(-GAME_WIDTH / 2 + Math.random() * 60, yy, 120 + Math.random() * 300, 1);
    }
    const shadow = pixelText(this.scene, 3, 3, text, { scale, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(this.scene, 0, 0, text, { scale, originX: 0.5, originY: 0.5, color });
    const c = this.scene.add.container(GAME_WIDTH / 2, y, [streaks, shadow, title]).setDepth(450);
    this.current = c;
    c.setScale(3.2).setAngle(-8).setAlpha(0);
    this.scene.tweens.add({ targets: c, scale: 1, angle: -3, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: streaks, x: 80, duration: first ? 1400 : 900 });
    this.scene.tweens.add({
      targets: c,
      x: GAME_WIDTH / 2 + 30,
      alpha: 0,
      scaleY: 0.2,
      delay: hold,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => this.finish(c),
    });
  }

  /** Rockets in from the left with afterimages, brakes hard, then shoots off to the right (XLR8). */
  private blurSlam(text: string, color: number, scale: number, hold: number, y: number): void {
    const lines = this.scene.add.graphics();
    for (let i = 0; i < 18; i++) {
      lines.fillStyle(i % 3 === 0 ? PALETTE.white : color, 0.35 + Math.random() * 0.4);
      lines.fillRect(-GAME_WIDTH / 2 - 100 + Math.random() * GAME_WIDTH, -26 + Math.random() * 52, 40 + Math.random() * 180, 1);
    }
    const ghosts = [0.45, 0.25, 0.12].map((alpha) => pixelText(this.scene, 0, 0, text, { scale, originX: 0.5, originY: 0.5, color }).setAlpha(alpha));
    const shadow = pixelText(this.scene, 3, 3, text, { scale, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(this.scene, 0, 0, text, { scale, originX: 0.5, originY: 0.5, color: PALETTE.white });
    title.setTint(PALETTE.white, PALETTE.white, color, color);
    const c = this.scene.add.container(-GAME_WIDTH / 2, y, [lines, ...ghosts, shadow, title]).setDepth(450);
    this.current = c;
    title.setScale(title.scaleX * 1.8, title.scaleY);
    this.scene.tweens.add({ targets: c, x: GAME_WIDTH / 2, duration: 150, ease: 'Expo.easeOut' });
    this.scene.tweens.add({ targets: title, scaleX: title.scaleX / 1.8, duration: 260, ease: 'Back.easeOut' });
    ghosts.forEach((g, i) => {
      g.setX(-26 * (i + 1));
      this.scene.tweens.add({ targets: g, x: 0, alpha: 0, duration: 260 + i * 80, ease: 'Quad.easeOut' });
    });
    this.scene.tweens.add({ targets: lines, x: -260, duration: hold + 300 });
    this.scene.tweens.add({
      targets: c,
      x: GAME_WIDTH * 1.6,
      delay: hold,
      duration: 170,
      ease: 'Expo.easeIn',
      onComplete: () => this.finish(c),
    });
  }

  /** Drops from above and lands like a boulder: the HUD shakes and cracks spread under the letters (Four Arms). */
  private quakeSlam(text: string, color: number, scale: number, hold: number, y: number): void {
    const cracks = this.scene.add.graphics().setAlpha(0);
    const shadow = pixelText(this.scene, 3, 4, text, { scale, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(this.scene, 0, 0, text, { scale, originX: 0.5, originY: 0.5, color });
    const half = title.width / 2;
    cracks.lineStyle(2, PALETTE.ink, 0.9);
    for (let i = 0; i < 7; i++) {
      let cx = -half + (i / 6) * half * 2;
      let cy = title.height / 2 - 2;
      cracks.beginPath();
      cracks.moveTo(cx, cy);
      for (let k = 0; k < 4; k++) {
        cx += (Math.random() - 0.5) * 16;
        cy += 4 + Math.random() * 5;
        cracks.lineTo(cx, cy);
      }
      cracks.strokePath();
    }
    cracks.fillStyle(color, 0.25).fillRect(-half - 8, title.height / 2 - 3, half * 2 + 16, 3);
    const c = this.scene.add.container(GAME_WIDTH / 2, y - 120, [cracks, shadow, title]).setDepth(450);
    this.current = c;
    this.scene.tweens.add({
      targets: c,
      y,
      duration: 190,
      ease: 'Quad.easeIn',
      onComplete: () => {
        shakeCamera(this.scene.cameras.main, 260, 0.016, false);
        cracks.setAlpha(1);
        title.setScale(title.scaleX * 1.25, title.scaleY * 0.6);
        shadow.setScale(shadow.scaleX * 1.25, shadow.scaleY * 0.6);
        this.scene.tweens.add({ targets: [title, shadow], scaleX: title.scaleX / 1.25, scaleY: title.scaleY / 0.6, duration: 260, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: cracks, alpha: 0, delay: 200, duration: 500 });
      },
    });
    this.scene.tweens.add({
      targets: c,
      alpha: 0,
      y: y + 12,
      delay: hold + 190,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => this.finish(c),
    });
  }

  /**
   * Three claw slashes rip across the screen, the name tears in behind them
   * and shudders with the roar (Wildmutt).
   */
  private howlSlam(text: string, color: number, scale: number, hold: number, y: number): void {
    const scene = this.scene;
    const shadow = pixelText(scene, 3, 3, text, { scale, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(scene, 0, 0, text, { scale, originX: 0.5, originY: 0.5, color });
    title.setTint(PALETTE.white, PALETTE.white, color, color);
    const half = title.width / 2 + 20;
    const slashes = scene.add.graphics();
    const c = scene.add.container(GAME_WIDTH / 2, y, [slashes, shadow, title]).setDepth(450);
    this.current = c;
    const rake = { t: 0 };
    scene.tweens.add({
      targets: rake,
      t: 1,
      duration: 170,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        slashes.clear();
        for (let i = 0; i < 3; i++) {
          const x0 = -half + i * 14;
          const len = (half * 2 - 20) * rake.t;
          slashes.lineStyle(i === 1 ? 3 : 2, i === 1 ? PALETTE.white : color, 0.9);
          slashes.lineBetween(x0, -20 + i * 7, x0 + len, 6 + i * 7);
        }
      },
    });
    scene.tweens.add({ targets: slashes, alpha: 0, delay: 260, duration: 380 });
    for (const t of [title, shadow]) {
      t.setScale(t.scaleX * 0.3, t.scaleY * 1.6).setAlpha(0);
      scene.tweens.add({ targets: t, scaleX: t.scaleX / 0.3, scaleY: t.scaleY / 1.6, alpha: 1, delay: 90, duration: 210, ease: 'Back.easeOut' });
    }
    // The roar: the letters shudder for a beat after they land.
    scene.tweens.add({ targets: c, x: GAME_WIDTH / 2 + 3, delay: 300, duration: 40, yoyo: true, repeat: 5, onStart: () => shakeCamera(scene.cameras.main, 240, 0.01, false) });
    scene.tweens.add({
      targets: c,
      alpha: 0,
      scaleY: 1.3,
      delay: hold + 100,
      duration: 240,
      ease: 'Quad.easeIn',
      onComplete: () => this.finish(c),
    });
  }

  /** The name zig-zags in like a fly, wobbles in place, and buzzes off upward (Stinkfly). */
  private buzzSlam(text: string, color: number, scale: number, hold: number, y: number): void {
    const scene = this.scene;
    const trail = scene.add.graphics();
    const shadow = pixelText(scene, 3, 3, text, { scale, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(scene, 0, 0, text, { scale, originX: 0.5, originY: 0.5, color });
    title.setTint(PALETTE.white, PALETTE.white, color, color);
    const c = scene.add.container(GAME_WIDTH + 120, y - 40, [shadow, title]).setDepth(450);
    trail.setDepth(449);
    this.current = c;
    const flight = { t: 0 };
    let lastX = c.x;
    let lastY = c.y;
    scene.tweens.add({
      targets: flight,
      t: 1,
      duration: 420,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const k = flight.t;
        c.x = GAME_WIDTH + 120 - (GAME_WIDTH / 2 + 120) * k;
        c.y = y - 40 * (1 - k) + Math.sin(k * Math.PI * 5) * 16 * (1 - k);
        trail.lineStyle(2, color, 0.5).lineBetween(lastX - title.width / 2, lastY, c.x - title.width / 2, c.y);
        lastX = c.x;
        lastY = c.y;
      },
      onComplete: () => {
        scene.tweens.add({ targets: trail, alpha: 0, duration: 300, onComplete: () => trail.destroy() });
        scene.tweens.add({ targets: c, angle: { from: -3, to: 3 }, duration: 70, yoyo: true, repeat: Math.max(1, Math.floor(hold / 140) - 1) });
      },
    });
    scene.tweens.add({
      targets: c,
      y: y - 70,
      x: GAME_WIDTH / 2 - 60,
      alpha: 0,
      delay: hold + 420,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => this.finish(c),
    });
  }

  /**
   * The misfire card, in place of the name slam: "WANTED: XLR8" gets struck
   * out in red, "FOUR ARMS?!" stamps in under it, and a MISFIRE! rubber stamp
   * thunks onto the corner. Timed to land with the record scratch.
   */
  misfire(wanted: { name: string; icon: string; color: number }, got: { name: string; icon: string; color: number }, swap: boolean): void {
    this.current?.destroy();
    const scene = this.scene;
    const y = swap ? 70 : 84;
    const bigScale = swap ? NAME_SLAM.swapScale : NAME_SLAM.scale - 1;

    const stripe = scene.add.rectangle(0, -2, COVER_W + 40, 66, 0x000000, 0.6);
    // Row 1: what Ben asked for.
    const label = pixelText(scene, 0, -18, 'WANTED', { originX: 0, originY: 0.5, color: PALETTE.uiDim });
    const wantedIcon = scene.add.image(0, -18, wanted.icon).setTint(wanted.color).setScale(1.25);
    const wantedName = pixelText(scene, 0, -18, wanted.name, { scale: 2, originX: 0, originY: 0.5, color: wanted.color });
    const rowW = label.width + 6 + 16 + 4 + wantedName.width;
    let x = -rowW / 2;
    label.setX(x);
    x += label.width + 6;
    wantedIcon.setX(x + 8);
    x += 16 + 4;
    wantedName.setX(x);
    const strike = scene.add.graphics();
    strike.fillStyle(PALETTE.enemy, 1).fillRect(0, -1, wantedName.width + 26, 3);
    strike.setPosition(wantedIcon.x - 11, -18).setScale(0, 1);

    // Row 2: what the Omnitrix actually gave him.
    const text = `${got.name}?!`;
    const gotShadow = pixelText(scene, 3, 13, text, { scale: bigScale, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const gotName = pixelText(scene, 0, 10, text, { scale: bigScale, originX: 0.5, originY: 0.5, color: got.color });
    const gotIcon = scene.add.image(-gotName.width / 2 - 16, 10, got.icon).setTint(got.color).setScale(2);
    const row2 = scene.add.container(0, 0, [gotIcon, gotShadow, gotName]).setAlpha(0);

    // The rubber stamp.
    const stampText = pixelText(scene, 0, 0, 'MISFIRE!', { scale: 2, originX: 0.5, originY: 0.5, color: PALETTE.enemy });
    const box = scene.add.graphics();
    box.lineStyle(2, PALETTE.enemy, 1).strokeRect(-stampText.width / 2 - 5, -stampText.height / 2 - 4, stampText.width + 10, stampText.height + 8);
    const stamp = scene.add.container(Math.max(rowW / 2, gotName.width / 2) + 54, -16, [box, stampText]).setAngle(-12).setAlpha(0);

    const c = scene.add.container(GAME_WIDTH / 2, y, [stripe, label, wantedIcon, wantedName, strike, row2, stamp]).setDepth(450);
    this.current = c;
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 90 });
    scene.tweens.add({ targets: strike, scaleX: 1, delay: 90, duration: 110, ease: 'Quad.easeOut' });
    scene.tweens.add({ targets: [wantedName, wantedIcon], alpha: 0.45, delay: 200, duration: 160 });
    row2.setScale(2.6);
    scene.tweens.add({
      targets: row2,
      scale: 1,
      alpha: 1,
      delay: 170,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => shakeCamera(scene.cameras.main, 160, 0.008, false),
    });
    stamp.setScale(2.4);
    scene.tweens.add({ targets: stamp, scale: 1, alpha: 1, delay: 330, duration: 160, ease: 'Quad.easeIn' });
    scene.tweens.add({
      targets: c,
      y: y - 14,
      alpha: 0,
      delay: MISFIRE.cardMs,
      duration: 280,
      ease: 'Quad.easeIn',
      onComplete: () => this.finish(c),
    });
  }

  /** "PERFECT!" stamps in above the alien name slam. Separate from the main banner so neither cancels the other. */
  perfect(bonusMs: number): void {
    const glow = this.scene.add.image(0, 0, TEX.light).setTint(PALETTE.gold).setBlendMode(Phaser.BlendModes.ADD).setScale(4, 1.1).setAlpha(0.55);
    const shadow = pixelText(this.scene, 2, 2, 'PERFECT!', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(this.scene, 0, 0, 'PERFECT!', { scale: 3, originX: 0.5, originY: 0.5, color: PALETTE.gold });
    const sub = pixelText(this.scene, 0, 19, `+${Math.round(bonusMs / 1000)}S ALIEN TIME`, { originX: 0.5, originY: 0.5, color: PALETTE.cream });
    const c = this.scene.add.container(GAME_WIDTH / 2, 40, [glow, shadow, title, sub]).setDepth(460);
    c.setScale(0.3).setAlpha(0).setAngle(8);
    this.scene.tweens.add({ targets: c, scale: 1, alpha: 1, angle: -2, duration: 240, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: glow, scaleX: 6, alpha: 0, duration: 900, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({
      targets: c,
      y: 26,
      alpha: 0,
      delay: 1300,
      duration: 300,
      onComplete: () => c.destroy(),
    });
  }

  /**
   * STRIKE!: a thrown enemy bowled over two or more others. Pins scatter
   * across the screen and the word stamps in, bowling-alley style.
   */
  strike(hits: number): void {
    const scene = this.scene;
    const glow = scene.add.image(0, 0, TEX.light).setTint(PALETTE.gold).setBlendMode(Phaser.BlendModes.ADD).setScale(4.5, 1.2).setAlpha(0.5);
    const shadow = pixelText(scene, 3, 3, 'STRIKE!', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.ink });
    const title = pixelText(scene, 0, 0, 'STRIKE!', { scale: 4, originX: 0.5, originY: 0.5, color: PALETTE.gold });
    title.setTint(PALETTE.white, PALETTE.white, PALETTE.gold, PALETTE.gold);
    const sub = pixelText(scene, 0, 22, `${hits} DOWN IN ONE THROW`, { originX: 0.5, originY: 0.5, color: PALETTE.cream });
    const pins = scene.add.graphics();
    const c = scene.add.container(GAME_WIDTH / 2, 64, [glow, pins, shadow, title, sub]).setDepth(460);
    // Ten little pins fly out from behind the word.
    const flying = Array.from({ length: 10 }, (_, i) => ({ x: (i - 4.5) * 9, y: 4, vx: (i - 4.5) * 36 + (Math.random() - 0.5) * 40, vy: -120 - Math.random() * 90, spin: (Math.random() - 0.5) * 12, a: 0 }));
    const state = { t: 0 };
    scene.tweens.add({
      targets: state,
      t: 1,
      duration: 900,
      onUpdate: () => {
        const dt = 0.9 * state.t;
        pins.clear();
        for (const p of flying) {
          const x = p.x + p.vx * dt;
          const y = p.y + p.vy * dt + 260 * dt * dt;
          const a = p.spin * dt;
          const cos = Math.cos(a);
          const sin = Math.sin(a);
          const pt = (dx: number, dy: number) => [x + dx * cos - dy * sin, y + dx * sin + dy * cos] as const;
          pins.fillStyle(PALETTE.white, 1 - state.t * 0.6);
          const [ax, ay] = pt(0, -5);
          const [bx, by] = pt(0, 4);
          pins.fillCircle(ax, ay, 2);
          pins.fillCircle(bx, by, 3);
          pins.fillStyle(PALETTE.enemy, 1 - state.t * 0.6);
          const [sx, sy] = pt(0, -1.5);
          pins.fillRect(sx - 2, sy, 4, 1);
        }
      },
    });
    c.setScale(2.6).setAlpha(0).setAngle(-6);
    scene.tweens.add({ targets: c, scale: 1, alpha: 1, angle: -2, duration: 220, ease: 'Back.easeOut', onComplete: () => shakeCamera(scene.cameras.main, 220, 0.01, false) });
    scene.tweens.add({ targets: glow, scaleX: 7, alpha: 0, duration: 900, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: c, y: 48, alpha: 0, delay: 1500, duration: 300, onComplete: () => c.destroy() });
  }

  omnitrixSymbol(color: number, big: boolean): void {
    const s = this.symbol;
    const soft = a11y.reduceFlashing;
    s.setVisible(true).setTint(color).setAlpha(soft ? 0.2 : big ? 0.75 : 0.45).setScale(big ? 1.5 : 1).setAngle(0);
    this.scene.tweens.add({
      targets: s,
      scale: soft ? 3 : big ? 7 : 4.5,
      alpha: 0,
      angle: 25,
      duration: big ? 700 : 420,
      ease: 'Cubic.easeIn',
      onComplete: () => s.setVisible(false),
    });
  }
}
