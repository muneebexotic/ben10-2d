import Phaser from 'phaser';
import { DEPTH, FX, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import type { LevelData } from '../../levels/types';
import type { Player } from '../../entities/Player';
import type { Fx } from '../../systems/Fx';
import type { TimeController } from '../../systems/TimeController';
import { EventBus } from '../../systems/EventBus';
import type { Controls } from '../../systems/InputMap';
import { playSfx } from '../../systems/audio/Sfx';
import type { SpeechBubble } from '../../ui/SpeechBubble';
import { TEX } from '../preload/assetKeys';

type Phase = 'opening' | 'explore' | 'pod' | 'firstTransform' | 'done';

export interface IntroHooks {
  giveOmnitrix(): void;
  spawnIntroDrones(): void;
  /** True once Ben has transformed for the first time. */
  hasTransformed(): boolean;
  onControlStart(): void;
}

/**
 * The first ten seconds: a short, skippable cinematic (meteors over camp),
 * then Ben finds the pod, the Omnitrix clamps on, drones arrive and the
 * game slows down until the player presses T.
 */
export class IntroDirector {
  private phase: Phase = 'opening';
  private t = 0;
  private readonly pod: Phaser.GameObjects.Sprite;
  private podLight = 0;
  private meteors: Phaser.GameObjects.Image[] = [];
  private watchItem: Phaser.GameObjects.Image | null = null;
  private slowMoLeft = 0;
  private skipped = false;
  private steps = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelData,
    private readonly player: Player,
    private readonly fx: Fx,
    private readonly time: TimeController,
    private readonly speech: SpeechBubble,
    private readonly hooks: IntroHooks,
    skip: boolean,
    skipOpening = false,
  ) {
    const podSpawn = level.entities.find((e) => e.type === 'pod')!;
    this.pod = scene.add.sprite(podSpawn.x * TILE + TILE / 2, podSpawn.y * TILE + 2, TEX.pod, 0).setOrigin(0.5, 1).setDepth(DEPTH.props);
    if (skip) {
      this.pod.setFrame(1);
      this.phase = 'done';
    } else if (skipOpening) {
      // Retrying after a death: no need to sit through the meteors again.
      this.phase = 'explore';
      EventBus.emit('hud:visible', { visible: true, omnitrix: false });
    } else {
      this.startOpening();
    }
  }

  get cinematic(): boolean {
    return this.phase === 'opening' || this.phase === 'pod';
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  private once(step: string): boolean {
    if (this.steps.has(step)) return false;
    this.steps.add(step);
    return true;
  }

  private startOpening(): void {
    this.player.controlsEnabled = false;
    EventBus.emit('hud:letterbox', { visible: true });
    EventBus.emit('hud:visible', { visible: false });
    EventBus.emit('hud:banner', { title: 'CHAPTER 1', subtitle: this.level.name, color: PALETTE.omnitrix, durationMs: 2400, style: 'soft' });
  }

  update(realDt: number, controls: Controls): void {
    this.t += realDt;
    switch (this.phase) {
      case 'opening':
        this.updateOpening(controls);
        break;
      case 'explore':
        if (this.player.x >= this.level.podTriggerX * TILE) this.startPod();
        break;
      case 'pod':
        this.updatePod();
        break;
      case 'firstTransform':
        this.updateFirstTransform(realDt);
        break;
      case 'done':
        break;
    }
    this.updatePodGlow(realDt);
  }

  private updateOpening(controls: Controls): void {
    const cam = this.scene.cameras.main;
    if ((controls.anyPressed || controls.jumpPressed) && this.t > 300 && !this.skipped) {
      this.skipped = true;
      for (const m of this.meteors) m.destroy();
      this.meteors = [];
      this.endOpening();
      return;
    }
    if (this.t > 700 && this.once('meteor1')) this.launchMeteor(cam, PALETTE.omnitrix, 1, 900);
    if (this.t > 1150 && this.once('meteor2')) this.launchMeteor(cam, PALETTE.enemy, 1.8, 1000);
    if (this.t > 2150 && this.once('impact')) {
      cam.flash(250, 255, 190, 150, true);
      this.fx.shake(FX.shakeHeavy, 450);
      playSfx('bigExplode', 0.6);
      this.fx.light(cam.worldView.right - 40, cam.worldView.y + 200, 260, PALETTE.fire2, 1400);
      this.fx.burst('leaf', this.player.x + 60, this.player.y - 120, 18);
    }
    if (this.t > 2450 && this.once('whoa')) this.speech.show('WHOA! DID YOU SEE THAT?!', 1600);
    if (this.t > 3300) this.endOpening();
  }

  private launchMeteor(cam: Phaser.Cameras.Scene2D.Camera, color: number, size: number, duration: number): void {
    const v = cam.worldView;
    const m = this.scene.add.image(v.x + 60, v.y + 10, TEX.soft).setTint(color).setScale(size * 1.2).setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD);
    this.meteors.push(m);
    playSfx('meteor', size > 1 ? 1 : 0.7);
    this.scene.tweens.add({
      targets: m,
      x: v.right + 40,
      y: v.y + 150,
      duration,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        this.fx.trail(color === PALETTE.omnitrix ? 'green' : 'fire', m.x, m.y, 2);
        this.fx.trail('smoke', m.x, m.y);
      },
      onComplete: () => m.destroy(),
    });
  }

  private endOpening(): void {
    if (this.phase !== 'opening') return;
    this.phase = 'explore';
    this.t = 0;
    this.player.controlsEnabled = true;
    EventBus.emit('hud:letterbox', { visible: false });
    EventBus.emit('hud:visible', { visible: true, omnitrix: false });
    this.hooks.onControlStart();
  }

  private startPod(): void {
    this.phase = 'pod';
    this.t = 0;
    this.steps.clear();
    this.player.controlsEnabled = false;
    this.player.scriptedMove = null;
    this.player.setVelocityX(0);
    this.player.facing = this.pod.x >= this.player.x ? 1 : -1;
    EventBus.emit('hud:letterbox', { visible: true });
  }

  private updatePod(): void {
    const p = this.player;
    if (this.t > 150 && this.once('open')) {
      this.pod.setFrame(1);
      playSfx('pod');
      this.fx.burst('green', this.pod.x, this.pod.y - 8, 30);
      this.fx.flash(this.pod.x, this.pod.y - 8, PALETTE.omnitrix, 40, 500);
      this.fx.ring(this.pod.x, this.pod.y - 8, PALETTE.omnitrix, 50, 600);
      this.podLight = 1;
    }
    if (this.t > 550 && this.once('leap')) {
      const item = this.scene.add.image(this.pod.x, this.pod.y - 10, TEX.omnitrixItem).setDepth(DEPTH.emissive);
      this.watchItem = item;
      const tx = p.x + p.facing * 4;
      const ty = p.centerY + 2;
      this.scene.tweens.add({
        targets: item,
        x: tx,
        duration: 420,
        ease: 'Linear',
      });
      this.scene.tweens.add({
        targets: item,
        y: { from: item.y, to: ty },
        duration: 420,
        ease: (k: number) => k * k * 1.6 - 0.6 * k,
        onUpdate: () => this.fx.trail('green', item.x, item.y, 2),
        onComplete: () => {
          item.destroy();
          this.watchItem = null;
          this.hooks.giveOmnitrix();
          this.scene.cameras.main.flash(200, 120, 255, 110, true);
          this.fx.burst('green', p.x, p.centerY, 24);
          this.fx.shake(FX.shakeMedium, 200);
          playSfx('clamp');
          p.squash(1.3, 0.8);
          this.speech.show("HEY! IT WON'T COME OFF!", 1500);
          EventBus.emit('omnitrix:acquired');
        },
      });
    }
    if (this.t > 1900 && this.once('drones')) {
      playSfx('alarm', 0.8);
      this.hooks.spawnIntroDrones();
      this.speech.show('UH OH...', 1100);
    }
    if (this.t > 2400) {
      this.phase = 'firstTransform';
      this.t = 0;
      this.player.controlsEnabled = true;
      EventBus.emit('hud:letterbox', { visible: false });
      EventBus.emit('hud:prompt', { id: 'transform', text: 'PRESS [T] TO TRANSFORM!', priority: 10 });
      this.slowMoLeft = 3500;
    }
  }

  private updateFirstTransform(realDt: number): void {
    if (this.hooks.hasTransformed()) {
      this.phase = 'done';
      this.time.clearSlowMo();
      EventBus.emit('hud:promptClear', { id: 'transform' });
      return;
    }
    // Hold the world in slow motion so the very first transform is a choice, not a panic.
    if (this.slowMoLeft > 0) {
      this.slowMoLeft -= realDt;
      this.time.slowMo(0.3, 120, 300);
    }
  }

  private updatePodGlow(realDt: number): void {
    if (this.podLight <= 0 && this.phase !== 'explore' && this.phase !== 'opening') return;
    const base = this.podLight > 0 ? this.podLight : 0.6;
    if (Math.random() < 0.25) this.fx.trail('green', this.pod.x + (Math.random() - 0.5) * 16, this.pod.y - 6 - Math.random() * 6);
    if (this.podLight > 0) this.podLight = Math.max(0.25, this.podLight - realDt / 3000);
    this.lightHook?.(this.pod.x, this.pod.y - 10, 90 * base + 30, PALETTE.omnitrix, 1);
  }

  /** Set by the Level so the pod can light its surroundings. */
  lightHook: ((x: number, y: number, r: number, color: number, intensity: number) => void) | null = null;

  destroy(): void {
    this.watchItem?.destroy();
  }
}
