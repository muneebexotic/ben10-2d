import Phaser from 'phaser';
import { TILE } from '../../../../config/constants';
import { CH5_BEATS } from '../../../../config/hunters';
import { PALETTE } from '../../../../config/palette';
import { Rustbucket } from '../../../../entities/vehicles/Rustbucket';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { jetpack } from '../../../../systems/audio/bountySfx';
import { TEX } from '../../../preload/assetKeys';
import { CH5_TEX } from '../../../preload/bounty';
import type { BountyPlan } from '../../../../levels/types';
import type { SetPiece, StoryKit } from '../StoryKit';
import { ARRIVAL_LINES, BRIDGE_LINES, FIRST_STRIKE_LINES } from './lines';

type Phase = 'bridge' | 'fade' | 'arrival' | 'play' | 'strike' | 'done';

/** Above everything in the level (the HUD and letterbox are their own scene, on top). */
const OVERLAY_DEPTH = 1000;

/**
 * Chapter 5's opening. On Vilgax's ship, the three hunters line up in front
 * of him and a hologram of Ben turns over the war table: the bounty. Cut to
 * Silver Spur at night, the Rustbucket at the gate, the family arriving. A
 * few steps into town, Sixsix strikes first: a jetpack roar overhead and a
 * salvo landing around Ben. Skippable; never replays on a retry or a continue.
 */
export class ColdOpen implements SetPiece {
  private phase: Phase = 'bridge';
  private t = 0;
  private bannered = false;
  private talked = false;
  private readonly rv: Rustbucket;
  private readonly floorY: number;
  private overlay: Phaser.GameObjects.Container | null = null;
  private holo: Phaser.GameObjects.Sprite | null = null;
  private flyer: Phaser.GameObjects.Sprite | null = null;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BountyPlan['coldOpen'],
  ) {
    this.floorY = spec.floor * TILE;
    this.rv = new Rustbucket(kit.scene, spec.rvX * TILE, this.floorY);
    if (kit.continuing || kit.startCheckpoint !== null) {
      this.phase = 'done';
      return;
    }
    kit.player.controlsEnabled = false;
    kit.setHud(false);
    kit.setLetterbox(true);
    kit.camera.lockTo(kit.player.x + 90, this.floorY - 70);
    kit.camera.snap(kit.player.x + 90, this.floorY);
    this.buildBridge();
  }

  get cinematic(): boolean {
    return this.phase === 'bridge' || this.phase === 'fade' || this.phase === 'arrival';
  }

  get storyLock(): boolean {
    return this.phase !== 'done' && this.phase !== 'play';
  }

  get done(): boolean {
    return this.phase === 'done' || this.phase === 'play' || this.phase === 'strike';
  }

  /** The ship's bridge, Vilgax, the hunters and the bounty's hologram, pinned to the screen. */
  private buildBridge(): void {
    const scene = this.kit.scene;
    const cam = scene.cameras.main;
    const w = cam.width / cam.zoom;
    const h = cam.height / cam.zoom;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(OVERLAY_DEPTH);
    const bg = scene.add.image(w / 2, h / 2, CH5_TEX.vilgaxBridge).setOrigin(0.5);
    bg.setScale(Math.max(w / bg.width, h / bg.height));
    const floor = h * 0.92;
    const vilgax = scene.add.image(w * 0.2, floor, TEX.vilgax).setOrigin(0.5, 1).setScale(1.2).setTint(0x9ccf94);
    const hunters = [
      scene.add.sprite(w * 0.66, floor, CH5_TEX.kraab).setOrigin(0.5, 1).play('kraab-idle').setFlipX(true),
      scene.add.sprite(w * 0.78, floor - 18, CH5_TEX.sixsix).setOrigin(0.5, 1).play('sixsix-fly').setFlipX(true),
      scene.add.sprite(w * 0.88, floor, CH5_TEX.tetrax).setOrigin(0.5, 1).play('tetrax-idle').setFlipX(true),
    ];
    // The bounty: Ben, turning over the war table in red light.
    // The projector's cone, from the table up through the figure.
    const beam = scene.add.triangle(w * 0.45, floor - 40, 0, 0, 52, 0, 26, 84, PALETTE.enemy, 0.16).setOrigin(0.5, 1).setBlendMode(Phaser.BlendModes.ADD);
    this.holo = scene.add.sprite(w * 0.45, floor - 46, TEX.ben, 0).setOrigin(0.5, 1).setScale(2.2).setTint(PALETTE.enemy).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
    c.add([bg, vilgax, ...hunters, beam, this.holo]);
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: CH5_BEATS.coldOpen.bridgeMs });
    this.overlay = c;
    playSfx('holoOn', 0.7, 0.8);
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    this.rv.update(realDtMs, this.kit.fx, this.kit.lighting, 1);
    if (this.flyer) this.updateFlyer(realDtMs);
    if (this.phase === 'done') return;
    this.t += realDtMs;
    const B = CH5_BEATS.coldOpen;
    switch (this.phase) {
      case 'bridge': {
        // The hologram turns and flickers.
        if (this.holo) {
          // It turns on the spot, never thinner than a quarter, so the bounty always reads as Ben.
          const turn = Math.cos(this.t * 0.0015);
          this.holo.setScale(2.2 * Math.sign(turn || 1) * Math.max(0.25, Math.abs(turn)), 2.2);
          this.holo.setAlpha(0.65 + Math.sin(this.t * 0.05) * 0.15);
        }
        if (!this.talked && this.t >= B.linesAt) {
          this.talked = true;
          this.kit.dialogue.play(BRIDGE_LINES, { skippable: true, onDone: () => this.cutToTown() });
        }
        if (this.t > 500 && this.t < B.linesAt && (controls.anyPressed || controls.pause)) this.cutToTown();
        return;
      }
      case 'arrival':
        if (!this.bannered && this.t >= B.bannerAt) {
          this.bannered = true;
          EventBus.emit('hud:banner', { title: 'CHAPTER 5', subtitle: this.kit.level.name, color: PALETTE.sixsix, durationMs: B.bannerMs, style: 'soft' });
          this.kit.playMusic('ghosttown');
        }
        // Max talks once the title card has gone, so the two never overlap.
        if (!this.talked && this.t >= B.arrivalLinesAt) {
          this.talked = true;
          this.kit.dialogue.play(ARRIVAL_LINES, { skippable: true, onDone: () => this.finish() });
        }
        if (this.t > 500 && this.t < B.arrivalLinesAt && (controls.anyPressed || controls.pause)) this.finish();
        return;
      case 'play':
        // A few steps into town: Sixsix strikes first.
        if (this.kit.player.x > (this.spec.rvX + CH5_BEATS.firstStrike.triggerTilesPast) * TILE) this.firstStrike();
        return;
      default:
        return;
    }
  }

  private cutToTown(): void {
    if (this.phase !== 'bridge') return;
    this.phase = 'fade';
    this.kit.dialogue.stop(false);
    const scene = this.kit.scene;
    const ms = CH5_BEATS.coldOpen.fadeMs;
    scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: ms,
      onComplete: () => {
        this.overlay?.destroy();
        this.overlay = null;
        this.holo = null;
        this.phase = 'arrival';
        this.t = 0;
        this.talked = false;
      },
    });
  }

  private finish(): void {
    if (this.phase !== 'arrival') return;
    this.phase = 'play';
    const kit = this.kit;
    kit.dialogue.stop(false);
    kit.camera.unlock();
    kit.player.controlsEnabled = true;
    kit.setLetterbox(false);
    kit.setHud(true);
  }

  /** A jetpack roar across the sky, and a salvo around Ben. */
  private firstStrike(): void {
    this.phase = 'strike';
    const kit = this.kit;
    const view = kit.scene.cameras.main.worldView;
    this.flyer = kit.scene.add.sprite(view.right + 40, view.y + 50, CH5_TEX.sixsix).setOrigin(0.5, 1).play('sixsix-fly').setFlipX(true).setDepth(30);
    playSfx(jetpack, 1, 0.9);
    kit.hazards?.salvo(kit.player.x + 20, this.floorY, 3, 34, CH5_BEATS.firstStrike.warnMs);
    kit.dialogue.play(FIRST_STRIKE_LINES);
    this.phase = 'done';
  }

  private updateFlyer(dtMs: number): void {
    const f = this.flyer!;
    f.x -= 0.32 * dtMs;
    f.y -= 0.02 * dtMs;
    this.kit.fx.trail('fire', f.x + 10, f.y - 8);
    if (f.x < this.kit.scene.cameras.main.worldView.x - 60) {
      f.destroy();
      this.flyer = null;
    }
  }

  destroy(): void {
    this.overlay?.destroy();
    this.flyer?.destroy();
    this.rv.destroy();
  }
}
