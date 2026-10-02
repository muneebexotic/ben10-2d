import Phaser from 'phaser';
import { DEPTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { STORY, type StoryLine } from '../../config/story';
import { a11y } from '../../systems/Accessibility';
import { EventBus } from '../../systems/EventBus';
import type { Fx } from '../../systems/Fx';
import type { Controls } from '../../systems/InputMap';
import type { Lighting } from '../../systems/Lighting';
import { playSfx } from '../../systems/audio/Sfx';
import { TEX } from '../preload/assetKeys';
import { VILGAX_SIZE } from '../preload/story';

export interface HologramDeps {
  scene: Phaser.Scene;
  fx: Fx;
  lighting: Lighting;
  /** Ben's reply goes in his world speech bubble. */
  say(text: string, ms: number): void;
  /** What he says (Chapter 1's speech when left out). */
  lines?: readonly StoryLine[];
  /** His portrait in the dialogue box (the chapters with portraits). */
  portrait?: string;
}

type Phase = 'rise' | 'talk' | 'collapse' | 'done';

/**
 * Before the boss drops in, a projector pops out of the crater and Vilgax
 * appears as a flickering red hologram to demand the Omnitrix. Skippable with
 * any button; plays once per run.
 */
export class VilgaxHologram {
  private phase: Phase = 'rise';
  private t = 0;
  private line = -1;
  private lineLeft = 0;
  private glitchIn = 900;
  private glitchLeft = 0;
  private readonly projector: Phaser.GameObjects.Image;
  private readonly bust: Phaser.GameObjects.Image;
  private readonly scanBar: Phaser.GameObjects.Rectangle;
  private readonly beam: Phaser.GameObjects.Graphics;
  private readonly bottomY: number;

  constructor(
    private readonly d: HologramDeps,
    private readonly x: number,
    private readonly floorY: number,
  ) {
    const { scene } = d;
    this.bottomY = floorY - STORY.hologram.hoverAboveFloor;
    this.projector = scene.add.image(x, floorY + 8, TEX.holoProjector).setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.beam = scene.add.graphics().setDepth(DEPTH.emissive).setBlendMode(Phaser.BlendModes.ADD);
    this.bust = scene.add
      .image(x, this.bottomY, TEX.vilgax)
      .setOrigin(0.5, 1)
      .setScale(STORY.hologram.scale, 0)
      .setTint(PALETTE.enemy)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.emissive)
      .setAlpha(0.9);
    this.scanBar = scene.add
      .rectangle(x, this.bottomY, VILGAX_SIZE.w * STORY.hologram.scale + 8, 2, PALETTE.enemyGlow, 0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.emissive + 1)
      .setVisible(false);
    scene.tweens.add({ targets: this.projector, y: floorY - 1, duration: 320, ease: 'Back.easeOut' });
    d.fx.burst('dust', x, floorY - 2, 12);
    d.fx.burst('red', x, floorY - 6, 10);
    playSfx('holoOn');
  }

  get done(): boolean {
    return this.phase === 'done';
  }

  private get top(): number {
    return this.bottomY - VILGAX_SIZE.h * STORY.hologram.scale;
  }

  update(realDt: number, controls: Controls): void {
    if (this.phase === 'done') return;
    this.t += realDt;
    const skip = controls.anyPressed || controls.pause;
    if (skip && this.t > STORY.hologram.skipGraceMs && this.phase !== 'collapse') this.collapse();

    if (this.phase === 'rise') this.updateRise();
    else if (this.phase === 'talk') this.updateTalk(realDt);
    else if (this.phase === 'collapse') this.updateCollapse();
    this.drawBeam();
  }

  private updateRise(): void {
    const k = Math.min(1, Math.max(0, (this.t - 300) / STORY.hologram.riseMs));
    this.bust.setScale(STORY.hologram.scale * (1 + (1 - k) * 0.3), STORY.hologram.scale * k);
    if (!a11y.reduceFlashing) this.bust.setAlpha(0.5 + Math.random() * 0.4);
    if (k >= 1) {
      this.phase = 'talk';
      this.t = 0;
      this.bust.setAlpha(0.9);
      this.scanBar.setVisible(true);
      this.nextLine();
    }
  }

  private updateTalk(realDt: number): void {
    const s = STORY.hologram.scale;
    // A slow hover, a sweeping scan line and the occasional signal glitch.
    const bob = Math.sin(this.t * 0.003) * 2;
    this.bust.y = this.bottomY + bob;
    const sweep = (this.t % 1300) / 1300;
    this.scanBar.setY(this.top + bob + sweep * VILGAX_SIZE.h * s);
    this.glitchIn -= realDt;
    if (this.glitchIn <= 0) {
      this.glitchIn = 700 + Math.random() * 1100;
      this.glitchLeft = 70;
      playSfx('holoGlitch', 0.6);
    }
    if (this.glitchLeft > 0) {
      this.glitchLeft -= realDt;
      this.bust.x = this.x + (Math.random() < 0.5 ? -3 : 3);
      if (!a11y.reduceFlashing) this.bust.setAlpha(0.55);
    } else {
      this.bust.x = this.x;
      this.bust.setAlpha(0.9);
    }
    this.d.lighting.add(this.x, this.top + 40, 170, PALETTE.enemy, 0.95);
    this.d.lighting.add(this.x - 10, this.top + 33, 26, 0xffffff, 0.6);
    this.d.lighting.add(this.x + 10, this.top + 33, 26, 0xffffff, 0.6);

    this.lineLeft -= realDt;
    if (this.lineLeft <= 0) this.nextLine();
  }

  private nextLine(): void {
    this.line++;
    const line = (this.d.lines ?? STORY.vilgaxLines)[this.line];
    if (!line) {
      this.collapse();
      return;
    }
    this.lineLeft = line.ms;
    if (line.who === 'ben') {
      EventBus.emit('hud:dialogClear');
      this.d.say(line.text, line.ms);
    } else {
      EventBus.emit('hud:dialog', { speaker: 'VILGAX', text: line.text, color: PALETTE.enemy, voicePitch: 1, skip: true, portrait: this.d.portrait });
    }
  }

  private collapse(): void {
    this.phase = 'collapse';
    this.t = 0;
    EventBus.emit('hud:dialogClear');
    this.scanBar.setVisible(false);
    playSfx('holoOff');
    // Old-TV switch-off: squash to a line, stretch, vanish.
    const s = STORY.hologram.scale;
    this.d.scene.tweens.add({
      targets: this.bust,
      scaleY: 0.04,
      scaleX: s * 1.6,
      y: this.bottomY - (VILGAX_SIZE.h * s) / 2,
      duration: 160,
      ease: 'Quad.easeIn',
      onComplete: () =>
        this.d.scene.tweens.add({ targets: this.bust, scaleX: 0, alpha: 0, duration: 140, ease: 'Quad.easeIn' }),
    });
  }

  private updateCollapse(): void {
    if (this.t > 180 && this.projector.visible) {
      this.projector.setVisible(false);
      this.d.fx.explosion(this.x, this.floorY - 4, 'small');
      this.d.fx.burst('spark', this.x, this.floorY - 4, 10);
    }
    if (this.t >= STORY.hologram.collapseMs) this.finish();
  }

  private finish(): void {
    this.phase = 'done';
    this.bust.destroy();
    this.scanBar.destroy();
    this.beam.destroy();
    this.projector.destroy();
  }

  private drawBeam(): void {
    const g = this.beam;
    g.clear();
    if (this.phase === 'done') return;
    const fade = this.phase === 'collapse' ? Math.max(0, 1 - this.t / 200) : this.phase === 'rise' ? Math.min(1, this.t / 300) : 1;
    if (fade <= 0) return;
    const flicker = a11y.reduceFlashing ? 1 : 0.85 + Math.random() * 0.15;
    const half = (VILGAX_SIZE.w * STORY.hologram.scale) / 2 - 6;
    const py = this.floorY - 6;
    g.fillStyle(PALETTE.enemy, 0.13 * fade * flicker);
    g.fillTriangle(this.x - 3, py, this.x + 3, py, this.x + half, this.bottomY);
    g.fillTriangle(this.x - 3, py, this.x - half, this.bottomY, this.x + half, this.bottomY);
    g.lineStyle(1, PALETTE.enemyGlow, 0.35 * fade * flicker);
    g.lineBetween(this.x - 2, py, this.x - half, this.bottomY);
    g.lineBetween(this.x + 2, py, this.x + half, this.bottomY);
    this.d.lighting.add(this.x, py, 50, PALETTE.enemy, fade);
  }
}
