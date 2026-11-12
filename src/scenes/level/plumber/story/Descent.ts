import Phaser from 'phaser';
import { CH7_OPENING } from '../../../../config/chapter7';
import { PALETTE } from '../../../../config/palette';
import type { StoryIntro } from '../../../../chapters/types';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { music } from '../../../../systems/audio/Music';
import { TEX } from '../../../preload/assetKeys';
import { BEN_FRAME } from '../../../preload/characters';
import { GWEN_FRAME, MAX_FRAME } from '../../../preload/family';
import { KEVIN_ACTOR_FRAME } from '../../../preload/kevin';
import { PLUMBER_ART } from '../../../preload/cartoon/plumber/baseArt';
import { CAR, DESCENT_TEX, descentLayout, makeDescentPixels, type DescentLayout } from '../../../preload/cartoon/plumber/descentArt';
import type { StoryKit } from '../../story/StoryKit';
import { consoleBoot, lightsThud } from '../water/sfx';
import { pixelText } from '../../../../ui/text';
import { JETTY_LINES, NAVY_LINES, RESOLVE_LINES, SCAN_TEXT } from './lines';

/** Above everything in the level (the HUD and letterbox are their own scene, on top). */
const DEPTH_BACK = 1000;
const DEPTH_CAST = 1001;
const DEPTH_FRONT = 1002;
/** The HD capsule (baseArt.ts, 72x120): its floor above the image's foot, its roof above the floor, a spot on the roof beside the tube. */
const HD_CAR = { floor: 16, roof: 66, roofX: 24 } as const;

interface Walker {
  sprite: Phaser.GameObjects.Sprite;
  /** Where it stands in the opening's screen (game px from its top-left). */
  x: number;
  y: number;
}

/**
 * Chapter 7's opening (GAME_DESIGN.md, beats 1 to 3), pinned to the screen
 * over the docking bay. Midnight at Keamari, still in pixels: Max walks the
 * kids down an old navy jetty, scans his badge on a bollard, and a glass
 * elevator rises out of the sea. The ride down: the base's beacon pings, and
 * each ping turns the world from pixels to HD (squares scatter); on the second
 * the family turns HD too, and for a beat Kevin crouches on the roof. The base
 * lights up lamp by lamp, ACT 3: SECRETS, and the car docks where play
 * begins. Skippable; never replays on a retry, a continue or a checkpoint.
 */
export class Descent implements StoryIntro {
  private phase: 'play' | 'out' | 'done' = 'play';
  private t = 0;
  private readonly L: DescentLayout;
  private readonly root: Phaser.GameObjects.Container;
  private readonly pixels: Phaser.GameObjects.Image;
  private readonly hd: Phaser.GameObjects.Container;
  private readonly car: Phaser.GameObjects.Image;
  private readonly carHd: Phaser.GameObjects.Image;
  private readonly lamps: Phaser.GameObjects.Arc[] = [];
  private readonly lampY: number[] = [];
  private readonly cast: Walker[] = [];
  private kevin: Walker | null = null;
  /** The car on screen: its centre and the floor the family stands on. */
  private carX = 0;
  private carFloor = 0;
  private scroll = 0;
  private readonly done_ = new Set<string>();

  constructor(private readonly kit: StoryKit) {
    const scene = kit.scene;
    // Decoded now, so the title's sting lands with the card.
    music.preload('act3');
    const cam = scene.cameras.main;
    this.L = descentLayout(Math.ceil(cam.width / cam.zoom), Math.ceil(cam.height / cam.zoom));
    const L = this.L;
    makeDescentPixels(scene, L);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH_BACK);
    // Behind both pictures, so the level never shows through while one fades into the other.
    const under = scene.add.rectangle(0, 0, L.w, L.h, 0x02050d).setOrigin(0, 0);
    this.pixels = scene.add.image(0, 0, DESCENT_TEX.pixel).setOrigin(0, 0);
    // The same column in HD: the sea's gradient, light shafts, fish, a whale, the base far below.
    this.hd = scene.add.container(0, 0).setAlpha(0);
    const sea = scene.add.image(0, L.waterline, PLUMBER_ART.sea).setOrigin(0, 0).setDisplaySize(L.w, L.H - L.waterline);
    const rays = [0.18, 0.5, 0.8].map((k, i) => scene.add.image(L.w * k, L.waterline, PLUMBER_ART.ray).setOrigin(0.5, 0).setDisplaySize(60, 360).setAlpha(0.22 - i * 0.04).setBlendMode(Phaser.BlendModes.ADD));
    const whale = scene.add.image(L.w * 0.3, L.waterline + L.h * 1.05, PLUMBER_ART.whale).setAlpha(0.45);
    const fish = Array.from({ length: 10 }, (_, i) => scene.add.image(((i * 97) % 100) / 100 * L.w, L.waterline + 60 + ((i * 53) % 100) / 100 * (L.H - L.waterline - 200), PLUMBER_ART.fish, i % 2).setAlpha(0.8));
    const base = scene.add.image(L.w / 2, L.H, PLUMBER_ART.baseFar).setOrigin(0.5, 1);
    this.hd.add([sea, ...rays, whale, ...fish, base]);
    // Lamps on the base, dark until it wakes.
    for (let i = 0; i < 7; i++) {
      const y = L.H - 22 - ((i * 37) % 3) * 9;
      const lamp = scene.add.circle(L.w * (0.22 + i * 0.09), y, 3, 0xffd27a, 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      this.lamps.push(lamp);
      this.lampY.push(y);
    }
    // The car rises out of the sea at the jetty's end.
    this.carX = L.jettyEnd + CAR.w / 2 + 4;
    this.carFloor = L.deck;
    // It starts below the screen and rises up through the water.
    this.car = scene.add.image(this.carX, L.h + CAR.h + 8, DESCENT_TEX.car).setOrigin(0.5, 1);
    // The HD car's floor is 16 px above its image's foot (its steel cap).
    this.carHd = scene.add.image(this.carX, L.deck + HD_CAR.floor, PLUMBER_ART.capsule).setOrigin(0.5, 1).setAlpha(0);
    this.root.add([under, this.pixels, this.hd, ...this.lamps, this.car, this.carHd]);
    this.root.setAlpha(0);
    scene.tweens.add({ targets: this.root, alpha: 1, duration: CH7_OPENING.fadeInMs });
    // The family on the jetty, in pixels (the HD mirror leaves them alone until they resolve).
    const start = L.jettyEnd - 24 - CH7_OPENING.walkPx;
    this.cast.push(
      this.walker(TEX.gwen, GWEN_FRAME.h, GWEN_FRAME.feetY, start - 30, 'gwen-idle'),
      this.walker(TEX.ben, BEN_FRAME.h, BEN_FRAME.h - 1, start - 14, 'ben-idle'),
      this.walker(TEX.max, MAX_FRAME.h, MAX_FRAME.feetY, start + 4, 'max-idle'),
    );
    const p = kit.player;
    p.controlsEnabled = false;
    kit.setHud(false);
    kit.setLetterbox(true);
    this.sync();
  }

  get cinematic(): boolean {
    return this.phase !== 'done';
  }

  get storyLock(): boolean {
    return this.phase !== 'done';
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  private walker(texture: string, h: number, feetY: number, x: number, anim: string): Walker {
    const sprite = this.kit.scene.add.sprite(0, 0, texture, 0).setOrigin(0.5, (feetY + 1) / h).setScrollFactor(0).setDepth(DEPTH_CAST);
    sprite.setData('noHd', true);
    sprite.play(anim);
    return { sprite, x, y: this.L.deck };
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    if (this.phase === 'done') return;
    this.t += realDtMs;
    if (this.phase === 'play' && this.t > 600 && (controls.anyPressed || controls.pause)) this.finish(CH7_OPENING.skipMs);
    if (this.phase === 'play') this.run();
    this.sync();
  }

  private once(id: string, at: number): boolean {
    if (this.t < at || this.done_.has(id)) return false;
    this.done_.add(id);
    return true;
  }

  private run(): void {
    const O = CH7_OPENING;
    const L = this.L;
    const kit = this.kit;
    const scene = kit.scene;
    if (this.once('lines', 400)) kit.dialogue.play(JETTY_LINES);
    if (this.once('walk', O.walkFrom)) {
      for (const [i, c] of this.cast.entries()) {
        c.sprite.play(i === 2 ? 'max-walk' : i === 1 ? 'ben-run' : 'gwen-run');
        scene.tweens.add({ targets: c, x: c.x + O.walkPx, duration: O.walkMs, onComplete: () => c.sprite.play(['gwen-idle', 'ben-idle', 'max-idle'][i]) });
      }
    }
    if (this.once('scan', O.scanAt)) {
      // The badge against the bollard: a green line reads it.
      const line = scene.add.rectangle(L.bollardX, L.deck - 9, 10, 1, PALETTE.plumber).setOrigin(0.5, 0);
      this.root.add(line);
      scene.tweens.add({ targets: line, y: L.deck - 1, duration: O.scanMs / 2, yoyo: true, onComplete: () => line.destroy() });
      const label = pixelText(scene, L.bollardX, L.deck - 24, SCAN_TEXT, { color: PALETTE.plumber, originX: 0.5, originY: 1 });
      this.root.add(label);
      scene.tweens.add({ targets: label, alpha: 0, delay: O.scanMs + 600, duration: 400, onComplete: () => label.destroy() });
      playSfx(consoleBoot, 0.8);
    }
    if (this.once('rise', O.riseAt)) {
      scene.tweens.add({ targets: this.car, y: L.deck + CAR.floor, duration: O.riseMs, ease: 'Sine.Out' });
      playSfx(lightsThud, 0.6, 0.5);
    }
    if (this.once('navy', O.riseAt + O.riseMs - 200)) kit.dialogue.play(NAVY_LINES);
    if (this.once('board', O.boardAt)) {
      const slots = [-18, 0, 18];
      for (const [i, c] of this.cast.entries()) scene.tweens.add({ targets: c, x: this.carX + slots[i], duration: O.boardMs, delay: i * 80 });
    }
    if (this.t >= O.descendAt) {
      const k = Math.min(1, (this.t - O.descendAt) / O.descendMs);
      this.scroll = Phaser.Math.Easing.Sine.InOut(k) * (L.H - L.h);
    }
    O.pings.forEach((at, i) => {
      if (this.once(`ping${i}`, at)) this.ping(i);
    });
    if (this.once('resolve', O.resolveAt)) this.resolve();
    if (this.once('kevin', O.kevinAt)) this.kevinOnTheRoof();
    for (let i = 0; i < this.lamps.length; i++) {
      if (this.once(`lamp${i}`, O.lampsAt + i * O.lampEveryMs)) {
        scene.tweens.add({ targets: this.lamps[i], alpha: 0.9, scale: 2.2, duration: 200 });
        playSfx(lightsThud, 0.35, 1 + i * 0.05);
      }
    }
    if (this.once('title', O.titleAt)) {
      EventBus.emit('hud:banner', { title: 'ACT 3: SECRETS', subtitle: 'CHAPTER 7: THE PLUMBERS', color: PALETTE.plumber, durationMs: O.titleMs, style: 'slam' });
      // The title's sting, then the base's theme again (it rings out over the first moments of play).
      kit.playMusic('act3');
      scene.time.delayedCall(O.stingMs, () => {
        if (music.playing === 'act3') kit.playMusic('deep');
      });
    }
    if (this.t >= O.dockAt) this.finish(O.dockMs);
  }

  /** A ring of green light from the beacon below: where it passes, the world turns HD. */
  private ping(i: number): void {
    const O = CH7_OPENING;
    const L = this.L;
    const scene = this.kit.scene;
    // The ring grows by its radius (scaling it would thicken its line).
    const ring = scene.add.circle(L.w / 2, L.h + 30, 12).setStrokeStyle(1.5, PALETTE.plumber, 1);
    ring.isFilled = false;
    this.root.add(ring);
    const grow = { r: 12 };
    scene.tweens.add({ targets: grow, r: L.w * 1.2, duration: O.pingMs, ease: 'Sine.Out', onUpdate: () => ring.setRadius(grow.r) });
    scene.tweens.add({ targets: ring, alpha: 0, duration: O.pingMs, ease: 'Quad.In', onComplete: () => ring.destroy() });
    playSfx(consoleBoot, 0.6, 1.4 - i * 0.15);
    const target = O.hdSteps[i];
    scene.tweens.add({ targets: this.hd, alpha: target, duration: O.pingMs * 0.8 });
    scene.tweens.add({ targets: this.pixels, alpha: 1 - target, duration: O.pingMs * 0.8 });
    // The old picture breaks into squares that scatter.
    for (let n = 0; n < 18; n++) this.square(Math.random() * L.w, L.h * (0.3 + Math.random() * 0.7), [0x0c2a52, 0x081c3c, 0x14305e, 0x1c3a6a][n % 4], 3);
  }

  /** The family breaks into squares, ink lines draw on and colour floods in: they're HD now. */
  private resolve(): void {
    const kit = this.kit;
    const scene = kit.scene;
    for (const c of this.cast) {
      c.sprite.setData('noHd', false);
      for (let n = 0; n < 8; n++) this.square(c.x + (Math.random() - 0.5) * 18, c.y - Math.random() * 26, [0xffffff, 0x7dffb0, 0xf6d27a][n % 3], 2);
    }
    kit.fx.flash(0, 0, 0xffffff, 1, 1);
    scene.tweens.add({ targets: this.carHd, alpha: 1, duration: 500 });
    scene.tweens.add({ targets: this.car, alpha: 0, duration: 500 });
    playSfx('unlock', 0.5, 1.3);
    kit.dialogue.play(RESOLVE_LINES);
  }

  /** For one beat, a figure on the car's roof: Kevin, stowed away. */
  private kevinOnTheRoof(): void {
    const scene = this.kit.scene;
    const sprite = scene.add.sprite(0, 0, TEX.kevinActor, 0).setOrigin(0.5, (KEVIN_ACTOR_FRAME.feetY + 1) / KEVIN_ACTOR_FRAME.h).setScrollFactor(0).setDepth(DEPTH_FRONT);
    sprite.setTint(0x0a0a14).setTintMode(Phaser.TintModes.FILL);
    sprite.play('kevin-idle');
    this.kevin = { sprite, x: this.carX + HD_CAR.roofX, y: this.carFloor - HD_CAR.roof };
    scene.time.delayedCall(CH7_OPENING.kevinMs, () => {
      if (this.kevin) {
        this.kevin.sprite.destroy();
        this.kevin = null;
      }
    });
  }

  private square(x: number, y: number, color: number, size: number): void {
    const scene = this.kit.scene;
    const sq = scene.add.rectangle(x, y, size, size, color);
    this.root.add(sq);
    const a = Math.random() * Math.PI * 2;
    scene.tweens.add({ targets: sq, x: x + Math.cos(a) * 30, y: y + Math.sin(a) * 30, alpha: 0, angle: 90, duration: 500 + Math.random() * 300, onComplete: () => sq.destroy() });
  }

  /** The column scrolls by; the root sits where the zoomed camera's screen starts. */
  private sync(): void {
    const cam = this.kit.scene.cameras.main;
    const x0 = (cam.width / 2) * (1 - 1 / cam.zoom);
    const y0 = (cam.height / 2) * (1 - 1 / cam.zoom);
    this.root.setPosition(x0, y0);
    this.pixels.y = -this.scroll;
    this.hd.y = -this.scroll;
    for (let i = 0; i < this.lamps.length; i++) this.lamps[i].y = this.lampY[i] - this.scroll;
    // The car rides down with the camera: it stays put on screen once the descent starts.
    for (const c of this.cast) c.sprite.setPosition(x0 + c.x, y0 + c.y).setAlpha(this.root.alpha);
    if (this.kevin) this.kevin.sprite.setPosition(x0 + this.kevin.x, y0 + this.kevin.y).setAlpha(this.root.alpha);
  }

  /** Fades to the docking bay and hands over to play. */
  private finish(ms: number): void {
    if (this.phase !== 'play') return;
    this.phase = 'out';
    const kit = this.kit;
    if (kit.dialogue.playing) kit.dialogue.stop(false);
    kit.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: ms,
      onUpdate: () => this.sync(),
      onComplete: () => this.end(),
    });
  }

  private end(): void {
    const kit = this.kit;
    this.phase = 'done';
    // A skip mid-walk: the walk's tweens would play idles on sprites already gone.
    kit.scene.tweens.killTweensOf(this.cast);
    this.root.destroy();
    for (const c of this.cast) c.sprite.destroy();
    this.cast.length = 0;
    this.kevin?.sprite.destroy();
    this.kevin = null;
    kit.setHud(true);
    kit.setLetterbox(false);
    kit.player.controlsEnabled = true;
  }

  destroy(): void {
    if (this.phase !== 'done') this.end();
  }
}
