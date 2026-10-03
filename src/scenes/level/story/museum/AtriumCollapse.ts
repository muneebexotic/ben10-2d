import Phaser from 'phaser';
import { ATRIUM } from '../../../../config/chapter3';
import { DEPTH, TILE } from '../../../../config/constants';
import { FRAME } from '../../../../levels/tiles';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { AnimoActor } from './AnimoActor';
import { ATRIUM_AFTER, ATRIUM_TAUNT } from './lines';
import { chance } from '../../../../systems/Pacing';

export interface AtriumSpec {
  triggerX: number;
  collapse: { x: number; y: number; w: number; h: number };
  toX: number;
  toY: number;
  alien: string;
}

type Phase = 'wait' | 'rumble' | 'fall' | 'beat' | 'hover' | 'done';

/**
 * The atrium bridge: Animo taunts from the far balcony, the floor gives way
 * under Ben, and he drops toward the tar pits. Mid-fall the watch catches
 * him: Stinkfly. He hangs there, wings buzzing, until the player flaps
 * (the first flight is the lesson).
 */
export class AtriumCollapse implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly actor: AnimoActor;
  private taunted = false;
  private holding = false;
  private readonly debris: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: AtriumSpec,
    private readonly beat: UnlockBeat | null,
    resumeX: number,
  ) {
    this.actor = new AnimoActor(kit.scene, kit.fx, kit.lighting, spec.toX * TILE + TILE / 2, spec.toY * TILE);
    if (resumeX > spec.triggerX * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'rumble';
  }

  get storyLock(): boolean {
    return this.phase === 'rumble' || this.phase === 'fall' || this.phase === 'beat' || this.phase === 'hover';
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    const kit = this.kit;
    this.actor.update(realDtMs);
    if (this.phase === 'done') return;
    const p = kit.player;
    if (this.phase === 'wait') {
      // Animo waits across the atrium and starts talking as Ben walks onto the bridge.
      if (!this.taunted && p.x >= (this.spec.triggerX - 8) * TILE) {
        this.taunted = true;
        this.actor.appear();
        this.actor.face(-1);
        kit.dialogue.play(ATRIUM_TAUNT);
      }
      if (p.x >= this.spec.triggerX * TILE && !p.dead) this.startRumble();
      return;
    }
    this.t += realDtMs;
    if (this.phase === 'rumble') {
      if (chance(0.3)) kit.fx.burst('debris', (this.spec.collapse.x + Math.random() * this.spec.collapse.w) * TILE, this.spec.collapse.y * TILE + 4, 2);
      if (this.t >= ATRIUM.rumbleMs) this.collapse();
      return;
    }
    if (this.phase === 'fall') {
      if (this.t >= ATRIUM.fallMs) this.catchMidair();
      return;
    }
    if (this.phase === 'hover') {
      // Wings buzz in place until the player flaps.
      p.setVelocity(0, 0);
      if (chance(0.4)) p.afterimage(0xcff4ff, 0.2, 90);
      if (controls.jumpPressed || this.t >= ATRIUM.flapWaitMs) this.release();
    }
  }

  private startRumble(): void {
    const kit = this.kit;
    this.phase = 'rumble';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.fx.shake(0.01, ATRIUM.rumbleMs);
    playSfx('armorCrack', 0.9, 0.6);
    kit.speech.show('UH-OH.', 900);
  }

  private collapse(): void {
    const kit = this.kit;
    const c = this.spec.collapse;
    kit.collapse(c);
    playSfx('explode', 0.8, 0.6);
    kit.fx.shake(0.016, 400);
    for (let x = c.x; x < c.x + c.w; x++) {
      for (let y = c.y; y < c.y + c.h; y++) {
        const img = kit.scene.add.image(x * TILE + 8, y * TILE + 8, kit.world.tilesKey, y === c.y ? FRAME.GRASS_TOP : FRAME.DIRT).setDepth(DEPTH.terrain + 2);
        this.debris.push(img);
        kit.scene.tweens.add({
          targets: img,
          y: img.y + 300 + Math.random() * 120,
          angle: (Math.random() - 0.5) * 300,
          duration: ATRIUM.debrisMs * (0.7 + Math.random() * 0.5),
          ease: 'Quad.easeIn',
          onComplete: () => img.setVisible(false),
        });
      }
      kit.fx.burst('dust', x * TILE + 8, c.y * TILE, 4);
    }
    kit.player.controlsEnabled = true;
    // Falling in the tar puts Ben back on what's left of the bridge.
    kit.player.lastSafe.x = (c.x - 2) * TILE + TILE / 2;
    kit.player.lastSafe.y = c.y * TILE;
    this.phase = 'fall';
    this.t = 0;
  }

  /** The watch catches him in mid-air. */
  private catchMidair(): void {
    const kit = this.kit;
    if (!this.beat || this.beat.done) {
      // A replay: Stinkfly's already on the dial, and the watch still catches him (no fall into the tar for free).
      this.phase = 'hover';
      this.t = 0;
      this.hold(true);
      if (kit.player.form.id !== this.spec.alien) kit.omni.forceInto(this.spec.alien);
      kit.tutorial.tip('atrium-fly', '{JUMP}: FLY ACROSS!', 5000, 7);
      return;
    }
    this.phase = 'beat';
    this.hold(true);
    this.beat.start(() => {
      this.phase = 'hover';
      this.t = 0;
      kit.tutorial.tip('stinkfly-first', 'TAP {JUMP} TO FLY! HOLD IT TO CLIMB', 6000, 9);
      kit.speech.show("I'M A BUG?! ...A FLYING BUG!", 2000);
    });
  }

  private release(): void {
    this.phase = 'done';
    this.hold(false);
    this.kit.dialogue.play(ATRIUM_AFTER);
    this.leave();
  }

  private leave(): void {
    this.kit.scene.time.delayedCall(1800, () => this.actor.walkOff((this.spec.toX + 14) * TILE, 1200));
  }

  /** Pins Ben in the air (no gravity) while the watch does its thing. */
  private hold(on: boolean): void {
    if (this.holding === on) return;
    this.holding = on;
    const body = this.kit.player.body;
    body.setAllowGravity(!on);
    if (on) this.kit.player.setVelocity(0, 0);
  }

  destroy(): void {
    this.hold(false);
    for (const d of this.debris) d.destroy();
    this.actor.destroy();
  }
}
