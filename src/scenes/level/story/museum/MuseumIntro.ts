import Phaser from 'phaser';
import { MUSEUM_INTRO } from '../../../../config/chapter3';
import { DEPTH, TILE } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import { Rustbucket } from '../../../../entities/vehicles/Rustbucket';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { TEX } from '../../../preload/assetKeys';
import type { SetPiece, StoryKit } from '../StoryKit';
import { MUSEUM_ARRIVAL_LINES } from './lines';

type Phase = 'talk' | 'guard' | 'done';

/**
 * Chapter 3's opening: the Rustbucket parked outside the museum at night,
 * the family talking it over (why they're here, the fired scientist), then a
 * night guard bursts out of the glowing staff door with mutant rats on his
 * heels. Skippable; never replays on a retry or a continue.
 */
export class MuseumIntro implements SetPiece {
  private phase: Phase = 'talk';
  private t = 0;
  private readonly steps = new Set<string>();
  private readonly rv: Rustbucket;
  private guard: Phaser.GameObjects.Sprite | null = null;
  private readonly doorX: number;
  private readonly floorY: number;

  constructor(
    private readonly kit: StoryKit,
    spec: { x: number; y: number },
  ) {
    this.floorY = spec.y * TILE;
    this.doorX = 37 * TILE;
    this.rv = new Rustbucket(kit.scene, spec.x * TILE, this.floorY);
    if (kit.continuing || kit.startCheckpoint !== null) {
      this.phase = 'done';
      return;
    }
    kit.player.controlsEnabled = false;
    kit.setHud(false);
    kit.setLetterbox(true);
    kit.camera.lockTo(kit.player.x + 90, this.floorY - 70);
    kit.camera.snap(kit.player.x + 90, this.floorY);
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

  private once(id: string, at: number): boolean {
    if (this.t < at || this.steps.has(id)) return false;
    this.steps.add(id);
    return true;
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    this.rv.update(realDtMs, this.kit.fx, this.kit.lighting, 1);
    // The staff door's eerie green glow.
    this.kit.lighting.add(this.doorX, this.floorY - 30, 60, PALETTE.mutagen, 0.8);
    if (this.phase === 'done') return;
    this.t += realDtMs;
    if (this.phase === 'talk') {
      if (this.once('banner', MUSEUM_INTRO.bannerAt)) {
        EventBus.emit('hud:banner', { title: 'CHAPTER 3', subtitle: this.kit.level.name, color: PALETTE.animo, durationMs: 2200, style: 'soft' });
        this.kit.playMusic('museum');
      }
      if (this.once('lines', MUSEUM_INTRO.linesAt)) this.kit.dialogue.play(MUSEUM_ARRIVAL_LINES, { skippable: true, onDone: () => this.startGuard() });
      if (this.t > 500 && this.t < MUSEUM_INTRO.linesAt && (controls.anyPressed || controls.pause)) this.startGuard();
      return;
    }
    if (this.phase === 'guard') this.updateGuard(controls);
  }

  /** The guard bursts out of the staff door screaming, rats right behind him. */
  private startGuard(): void {
    if (this.phase !== 'talk') return;
    this.kit.dialogue.stop(false);
    this.phase = 'guard';
    this.t = 0;
    this.steps.clear();
    const kit = this.kit;
    const g = kit.scene.add.sprite(this.doorX, this.floorY, TEX.guard, 0).setOrigin(0.5, 1).setDepth(DEPTH.enemies).setFlipX(true).play('guard-run');
    this.guard = g;
    playSfx('alarm', 0.4);
    kit.fx.popText(this.doorX, this.floorY - 50, 'THE EXHIBITS ARE ALIVE!', PALETTE.white);
    kit.scene.tweens.add({ targets: g, x: -40, duration: MUSEUM_INTRO.guardRunMs * 1.6, ease: 'Linear' });
    // Run past Ben (he hops aside).
    kit.scene.time.delayedCall(300, () => kit.speech.show('WHOA! HEY, MISTER-', 1300));
  }

  private updateGuard(controls: Controls): void {
    const kit = this.kit;
    if (this.once('rats', MUSEUM_INTRO.ratDelayMs)) {
      playSfx('squeak', 0.9);
      for (let i = 0; i < 2; i++) kit.spawnDrone('rat', this.doorX - 4 + i * 12, this.floorY - 8, { delayMs: 1500 + i * 400 });
      kit.fx.burst('goo', this.doorX, this.floorY - 10, 10);
    }
    const skip = this.t > 600 && (controls.anyPressed || controls.pause);
    if (this.once('control', skip ? this.t : MUSEUM_INTRO.guardRunMs)) {
      this.phase = 'done';
      kit.camera.unlock();
      kit.player.controlsEnabled = true;
      kit.setLetterbox(false);
      kit.setHud(true);
      kit.speech.show('MUTANT RATS? IT\'S HERO TIME!', 1900);
    }
  }

  destroy(): void {
    this.guard?.destroy();
    this.rv.destroy();
  }
}
