import Phaser from 'phaser';
import { FX, TILE } from '../../../../config/constants';
import { CH6_BEATS } from '../../../../config/chapter6';
import { PALETTE } from '../../../../config/palette';
import { Rustbucket } from '../../../../entities/vehicles/Rustbucket';
import type { MagicPlan } from '../../../../levels/types';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';
import { CH6_TEX } from '../../../preload/karachi/keys';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../StoryKit';
import { MagicActor } from './actors';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import { CHAOS_LINES, FAIR_LINES, PORT_LINES, SHOW_LINES, SNATCH_LINES } from './lines';

type Phase = 'port' | 'fade' | 'fair' | 'show' | 'snatch' | 'chaos' | 'done';

/** Above everything in the level (the HUD and letterbox are their own scene, on top). */
const OVERLAY_DEPTH = 1000;
const EXHIBIT_X = 58;

/**
 * Chapter 6's opening. Karachi Port at dusk: a crane swings the Rustbucket
 * off a cargo ship onto the dock (Max's "old navy friend"). Cut to the
 * seafront fair at night: chai at Rauf's, Gwen's guidebook, THE GREAT HEXO's
 * finale. The Charms of Bezel float out of the ANCIENT WONDERS exhibition
 * into Hex's hands; his niece Charmcaster snatches them for real. Rocklings
 * tumble out of the tent, balloons float off, and one Charm rolls to Gwen's
 * feet and glows for her. Then she walks with Ben. Skippable; never replays
 * on a retry or a continue.
 */
export class ColdOpen implements SetPiece {
  private phase: Phase = 'port';
  private t = 0;
  private talked = false;
  private bannered = false;
  private readonly rv: Rustbucket;
  private readonly floorY: number;
  private overlay: Phaser.GameObjects.Container | null = null;
  private hanging: Phaser.GameObjects.Image | null = null;
  private cable: Phaser.GameObjects.Rectangle | null = null;
  private boomY = 0;
  private readonly hex: MagicActor;
  private readonly charm: MagicActor;
  private readonly charms: Phaser.GameObjects.Image[] = [];
  private readonly balloons: Array<{ img: Phaser.GameObjects.Image; vx: number; vy: number }> = [];
  private joinPending = false;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: MagicPlan['coldOpen'],
    private readonly max: FamilyActor,
  ) {
    this.floorY = spec.floor * TILE;
    this.rv = new Rustbucket(kit.scene, spec.rvX * TILE, this.floorY);
    this.hex = new MagicActor(kit, 'hex');
    this.charm = new MagicActor(kit, 'charmcaster');
    if (kit.continuing || kit.startCheckpoint !== null) {
      this.phase = 'done';
      this.joinPending = true;
      return;
    }
    kit.player.controlsEnabled = false;
    kit.setHud(false);
    kit.setLetterbox(true);
    kit.camera.lockTo(kit.player.x + 80, this.floorY - 70);
    kit.camera.snap(kit.player.x + 80, this.floorY);
    this.buildPort();
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

  /** Karachi Port at dusk, pinned to the screen: the ship, the crane, the Rustbucket on its cables. */
  private buildPort(): void {
    const scene = this.kit.scene;
    const cam = scene.cameras.main;
    const w = cam.width / cam.zoom;
    const h = cam.height / cam.zoom;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(OVERLAY_DEPTH);
    const sky = scene.add.image(0, 0, CH6_TEX.sky).setOrigin(0, 0).setDisplaySize(w, h).setTint(0xffc8a8);
    const sun = scene.add.circle(w * 0.25, h * 0.52, 30, 0xffa060, 0.9);
    const far = scene.add.tileSprite(0, h * 0.42, w, 150, CH6_TEX.skylineFar).setOrigin(0, 0).setTint(0x8a6a8a);
    const port = scene.add.tileSprite(0, h * 0.5, w, 120, CH6_TEX.port).setOrigin(0, 0);
    const sea = scene.add.tileSprite(0, h * 0.78, w, 80, CH6_TEX.sea).setOrigin(0, 0);
    const dock = scene.add.rectangle(0, h * 0.86, w, h * 0.14, 0x2a2a34).setOrigin(0, 0);
    const ship = scene.add.image(w * 0.1, h * 0.86, CH6_TEX.ship).setOrigin(0, 1);
    const crane = scene.add.image(w * 0.62, h * 0.88, CH6_TEX.crane).setOrigin(0.5, 1);
    // The cable runs from the crane's boom down to the RV's roof.
    this.boomY = h * 0.88 - 200 + 40;
    this.cable = scene.add.rectangle(w * 0.62, this.boomY, 2, 10, 0x1a1a22).setOrigin(0.5, 0);
    this.hanging = scene.add.image(w * 0.62, this.boomY + 120, TEX.rustbucket, 0).setOrigin(0.5, 1);
    c.add([sky, sun, far, port, sea, dock, ship, crane, this.cable, this.hanging]);
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: CH6_BEATS.coldOpen.portFadeMs });
    this.overlay = c;
    playSfx(MAGIC_SFX.horn, 0.7);
  }

  update(dtMs: number, realDtMs: number, controls: Controls): void {
    this.rv.update(realDtMs, this.kit.fx, this.kit.lighting, 1);
    this.hex.update(realDtMs);
    this.charm.update(realDtMs);
    this.updateBalloons(realDtMs);
    if (this.joinPending && !this.kit.player.dead) {
      this.joinPending = false;
      this.kit.gwen?.join(false);
    }
    if (this.phase === 'done') return;
    this.t += realDtMs;
    const B = CH6_BEATS.coldOpen;
    const skip = this.t > 500 && (controls.anyPressed || controls.pause) && !this.kit.dialogue.playing;
    switch (this.phase) {
      case 'port': {
        // The crane lowers the RV onto the dock.
        const cam = this.kit.scene.cameras.main;
        const h = cam.height / cam.zoom;
        const k = Phaser.Math.Easing.Sine.InOut(Math.min(1, this.t / B.craneMs));
        const y = Phaser.Math.Linear(this.boomY + 120, h * 0.86, k);
        this.hanging?.setY(y).setAngle(Math.sin(this.t * 0.003) * 3 * (1 - k));
        this.cable?.setSize(2, Math.max(1, y - 64 - this.boomY));
        if (!this.talked && this.t >= B.portLinesAt) {
          this.talked = true;
          this.kit.dialogue.play(PORT_LINES, { skippable: true, onDone: () => this.cutToFair() });
        }
        if (skip && this.t < B.portLinesAt) this.cutToFair();
        return;
      }
      case 'fair':
        if (!this.bannered && this.t >= B.bannerAt) {
          this.bannered = true;
          EventBus.emit('hud:banner', { title: 'CHAPTER 6', subtitle: this.kit.level.name, color: PALETTE.hex, durationMs: B.bannerMs, style: 'soft' });
          this.kit.playMusic('fair');
        }
        if (this.talked || this.t < B.linesAt) {
          if (skip && !this.talked) this.toShow();
          return;
        }
        this.talked = true;
        this.kit.dialogue.play(FAIR_LINES, { skippable: true, onDone: () => this.toShow() });
        return;
      case 'show':
        this.updateCharmsToHex(dtMs);
        if (skip) this.finish();
        return;
      case 'snatch':
        if (skip) this.finish();
        return;
      case 'chaos':
        return;
      default:
        return;
    }
  }

  private cutToFair(): void {
    if (this.phase !== 'port') return;
    this.phase = 'fade';
    this.kit.dialogue.stop(false);
    this.kit.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: CH6_BEATS.coldOpen.fadeMs,
      onComplete: () => {
        this.overlay?.destroy();
        this.overlay = null;
        this.hanging = null;
        this.cable = null;
        this.phase = 'fair';
        this.t = 0;
        this.talked = false;
        // The family by the RV.
        const p = this.kit.player;
        this.max.place(p.x - 34, this.floorY);
        this.max.face(1);
        this.max.pose('idle');
        this.kit.gwen?.actor.place(p.x + 22, this.floorY);
        this.kit.gwen?.actor.face(-1);
        this.kit.gwen?.actor.pose('idle');
      },
    });
  }

  /** The camera finds the tent: THE GREAT HEXO's finale. */
  private toShow(): void {
    if (this.phase !== 'fair') return;
    const kit = this.kit;
    kit.dialogue.stop(false);
    this.phase = 'show';
    this.t = 0;
    const tentX = this.spec.tentX * TILE;
    kit.camera.lockTo(tentX + 40, this.floorY - 70);
    this.hex.appear(tentX, this.floorY - 26, -1);
    this.hex.floating = true;
    this.hex.pose(5);
    // The four Charms rise out of the exhibition and float over to Hex.
    for (let i = 0; i < 4; i++) {
      const img = kit.scene.add.image(EXHIBIT_X * TILE + (i - 1.5) * 10, this.floorY - 30, CH6_TEX.charm, i).setDepth(70).setScale(1.5);
      this.charms.push(img);
    }
    kit.dialogue.play(SHOW_LINES, { skippable: false });
    for (const [dx, line] of [[-60, 'WAH!'], [-20, 'WAH! WAH!'], [30, 'SHABASH!']] as const) {
      kit.scene.time.delayedCall(900 + Math.abs(dx) * 4, () => kit.fx.popText(tentX + dx + 120, this.floorY - 30, line, PALETTE.cream));
    }
  }

  private updateCharmsToHex(dtMs: number): void {
    const B = CH6_BEATS.coldOpen;
    const k = Math.min(1, this.t / B.charmFlyMs);
    const hx = this.hex.x;
    const hy = this.hex.y - 46;
    this.charms.forEach((c, i) => {
      const fromX = EXHIBIT_X * TILE + (i - 1.5) * 10;
      const ang = this.t * 0.004 + (i * Math.PI) / 2;
      const tx = hx + Math.cos(ang) * 14;
      const ty = hy + Math.sin(ang) * 6;
      c.setPosition(Phaser.Math.Linear(fromX, tx, k), Phaser.Math.Linear(this.floorY - 30, ty, k) - Math.sin(k * Math.PI) * 40);
      if (Math.random() < dtMs / 120) this.kit.fx.trail('mana', c.x, c.y);
    });
    if (k >= 1 && !this.kit.dialogue.playing) this.snatch();
  }

  /** Charmcaster takes the Charms "for real". */
  private snatch(): void {
    const kit = this.kit;
    this.phase = 'snatch';
    this.t = 0;
    const tentX = this.spec.tentX * TILE;
    this.charm.appear(tentX + 40, this.floorY, -1);
    this.charm.pose(3);
    // The Charms fly to her.
    kit.scene.tweens.add({
      targets: this.charms,
      x: tentX + 40,
      y: this.floorY - 34,
      duration: CH6_BEATS.coldOpen.snatchMs,
      ease: 'Cubic.In',
      onComplete: () => {
        for (const c of this.charms.slice(1)) c.setVisible(false);
      },
    });
    kit.dialogue.play(SNATCH_LINES, { skippable: true, onDone: () => this.chaos() });
  }

  /** Rocklings out of the tent, the kites come alive, balloons float off, and a Charm rolls to Gwen. */
  private chaos(): void {
    if (this.phase !== 'snatch') return;
    const kit = this.kit;
    this.phase = 'chaos';
    this.t = 0;
    const tentX = this.spec.tentX * TILE;
    this.charm.pose(2);
    kit.fx.burst('mana', tentX + 30, this.floorY - 20, 24);
    kit.fx.shake(FX.shakeLight, 200);
    this.spawnRocklings();
    // The balloon seller's balloons get loose.
    for (let i = 0; i < 6; i++) {
      const img = kit.scene.add.image(31 * TILE + 8 + (Math.random() - 0.5) * 16, this.floorY - 52, CH6_TEX.balloon, i % 4).setDepth(20);
      this.balloons.push({ img, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 30 });
    }
    // One Charm skids away from Charmcaster and rolls to Gwen's feet.
    const keep = this.charms[0];
    const gwen = kit.gwen?.actor;
    const gx = gwen?.visible ? gwen.x : kit.player.x + 20;
    kit.scene.tweens.add({
      targets: keep,
      x: gx,
      duration: 1100,
      ease: 'Quad.Out',
      onUpdate: (tw) => keep.setY(this.floorY - 6 - Math.abs(Math.sin(tw.progress * Math.PI * 3)) * 24 * (1 - tw.progress)),
      onComplete: () => {
        kit.fx.flash(keep.x, keep.y, PALETTE.mana, 30, 400);
        kit.fx.burst('mana', keep.x, keep.y, 14);
        keep.setVisible(false);
        gwen?.hold('point', 1200);
        this.hex.vanish();
        this.charm.vanish();
        kit.camera.lockTo(kit.player.x + 60, this.floorY - 70);
        kit.dialogue.play(CHAOS_LINES, { skippable: true, onDone: () => this.finish() });
      },
    });
  }

  private spawnRocklings(): void {
    const tentX = this.spec.tentX * TILE;
    for (const dx of [-30, 0, 30]) this.kit.spawnDrone('rockling', tentX + dx, this.floorY - 6, { roam: true, delayMs: 300 });
  }

  /** Play starts: Gwen walks with Ben; Max stays with the Rustbucket. */
  private finish(): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    const skipped = this.phase === 'show' || this.phase === 'snatch';
    this.phase = 'done';
    kit.dialogue.stop(false);
    if (skipped) this.spawnRocklings();
    this.hex.vanish();
    this.charm.vanish();
    for (const c of this.charms) c.destroy();
    this.charms.length = 0;
    this.max.hide();
    kit.camera.unlock();
    kit.player.controlsEnabled = true;
    kit.setLetterbox(false);
    kit.setHud(true);
    kit.gwen?.join(true);
    if (!this.bannered) kit.playMusic('fair');
  }

  private updateBalloons(dtMs: number): void {
    const dt = dtMs / 1000;
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.img.x += (b.vx + Math.sin(b.img.y * 0.05) * 8) * dt;
      b.img.y += b.vy * dt;
      if (b.img.y < this.floorY - 600) {
        b.img.destroy();
        this.balloons.splice(i, 1);
      }
    }
  }

  destroy(): void {
    this.overlay?.destroy();
    this.rv.destroy();
    this.hex.destroy();
    this.charm.destroy();
    for (const c of this.charms) c.destroy();
    for (const b of this.balloons) b.img.destroy();
  }
}
