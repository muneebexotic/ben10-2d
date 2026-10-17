import Phaser from 'phaser';
import { DEPTH, FX, TILE } from '../../../../config/constants';
import { CH6_BEATS } from '../../../../config/chapter6';
import { Rustbucket } from '../../../../entities/vehicles/Rustbucket';
import type { MagicPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import { CH6_TEX } from '../../../preload/karachi/keys';
import { RUSTBUCKET } from '../../../preload/vehicles';
import type { FamilyActor } from '../../family/FamilyActor';
import type { SetPiece, StoryKit } from '../StoryKit';
import { GATE_LINES } from './lines';

type Phase = 'wait' | 'drive' | 'talk' | 'done';

/**
 * The pink palace's gate is locked. Max doesn't knock: the Rustbucket comes
 * roaring up the street, horn blaring, and rams it. The iron doors fly off
 * their hinges, the RV stops in the forecourt with a jolt, and Max climbs
 * out, very calm. After that the gate is just a hole (and the RV parks there
 * on every restart past it).
 */
export class GateRam implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private rv: Rustbucket | null = null;
  private readonly doors: Phaser.GameObjects.Image[] = [];
  private readonly rect: { x: number; y: number; w: number; h: number };
  private fromX = 0;
  private readonly stopX: number;
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: MagicPlan['gate'],
    private readonly max: FamilyActor,
    resumeX: number,
  ) {
    this.floorY = spec.floor * TILE;
    this.rect = { x: spec.gateX, y: spec.top, w: 2, h: spec.floor - spec.top };
    this.stopX = spec.gateX * TILE + RUSTBUCKET.w / 2 + 20;
    if (resumeX > spec.gateX * TILE) {
      kit.collapse(this.rect);
      this.parkRv();
      this.phase = 'done';
      return;
    }
    // The gate's cells are only its collision: the doors are drawn instead.
    for (let y = this.rect.y; y < this.rect.y + this.rect.h; y++) {
      for (let x = this.rect.x; x < this.rect.x + this.rect.w; x++) kit.world.layer.getTileAt(x, y)?.setAlpha(0);
    }
    const cx = spec.gateX * TILE + TILE;
    for (const side of [-1, 1] as const) {
      this.doors.push(kit.scene.add.image(cx + side * 18, this.floorY, CH6_TEX.gateDoor).setOrigin(0.5, 1).setDepth(DEPTH.props).setFlipX(side > 0));
    }
  }

  get cinematic(): boolean {
    return this.phase === 'drive' || this.phase === 'talk';
  }

  get storyLock(): boolean {
    return this.cinematic;
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    this.rv?.update(realDtMs, this.kit.fx, this.kit.lighting, 1);
    if (this.phase === 'done') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    switch (this.phase) {
      case 'wait':
        if (!p.dead && p.x >= this.spec.triggerX * TILE && p.grounded) this.start();
        return;
      case 'drive': {
        const rv = this.rv!;
        const k = Phaser.Math.Easing.Quadratic.In(Math.min(1, this.t / CH6_BEATS.gate.driveMs));
        rv.moveTo(Phaser.Math.Linear(this.fromX, this.stopX, k));
        if (k >= 1) this.crash();
        return;
      }
      case 'talk':
        if (this.t > 600 && controls.pause) this.finish();
        return;
      default:
        return;
    }
  }

  private start(): void {
    const kit = this.kit;
    this.phase = 'drive';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.setLetterbox(true);
    kit.camera.lockTo(this.spec.gateX * TILE - 60, this.floorY - 70);
    this.fromX = kit.scene.cameras.main.worldView.x - RUSTBUCKET.w;
    this.rv = new Rustbucket(kit.scene, this.fromX, this.floorY);
    this.rv.setDriving(true);
    playSfx(MAGIC_SFX.horn, 1, 1.4);
  }

  private crash(): void {
    const kit = this.kit;
    this.phase = 'talk';
    this.t = 0;
    const rv = this.rv!;
    rv.setDriving(false);
    rv.setBraking(true);
    rv.bump();
    kit.collapse(this.rect);
    const gx = this.spec.gateX * TILE + TILE;
    kit.fx.explosion(gx, this.floorY - 40, 'medium');
    kit.fx.burst('debris', gx, this.floorY - 30, 24);
    kit.fx.shake(FX.shakeMedium, 320);
    kit.fx.hitStop(90);
    playSfx('burst', 0.8, 1.2);
    // The doors fly off their hinges.
    this.doors.forEach((door, i) => {
      kit.scene.tweens.add({
        targets: door,
        x: door.x + 120 + i * 50,
        y: this.floorY - 10,
        angle: 360 + i * 200,
        duration: CH6_BEATS.gate.doorFlyMs,
        ease: 'Quad.Out',
        onUpdate: (tw) => door.setY(this.floorY - Math.sin(tw.progress * Math.PI) * 70),
        onComplete: () => {
          kit.fx.burst('dust', door.x, this.floorY, 10);
          kit.scene.tweens.add({ targets: door, alpha: 0, delay: 1500, duration: 600 });
        },
      });
    });
    kit.scene.time.delayedCall(CH6_BEATS.gate.settleMs, () => {
      this.max.place(rv.x - RUSTBUCKET.w / 2 - 8, this.floorY);
      this.max.face(1);
      this.max.pose('idle');
      kit.fx.burst('dust', this.max.x, this.floorY, 6);
      kit.dialogue.play(GATE_LINES, { skippable: true, onDone: () => this.finish() });
    });
  }

  private finish(): void {
    if (this.phase === 'done') return;
    const kit = this.kit;
    this.phase = 'done';
    kit.dialogue.stop(false);
    for (const d of this.doors) d.setVisible(false);
    this.max.hide();
    this.rv?.setBraking(false);
    kit.camera.unlock();
    kit.player.controlsEnabled = true;
    kit.setLetterbox(false);
  }

  /** On a restart past the gate the RV is already parked in the forecourt. */
  private parkRv(): void {
    this.rv = new Rustbucket(this.kit.scene, this.stopX, this.floorY);
  }

  destroy(): void {
    this.rv?.destroy();
    for (const d of this.doors) d.destroy();
  }
}
