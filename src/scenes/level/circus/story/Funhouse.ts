import Phaser from 'phaser';
import { DEPTH, FX, TILE } from '../../../../config/constants';
import { CH8_BEATS } from '../../../../config/chapter8';
import { CIRCUS_SFX } from '../../../../entities/enemies/circus/sfx';
import type { CircusPlan } from '../../../../levels/types';
import { playSfx } from '../../../../systems/audio/Sfx';
import { CIRCUS_ART } from '../../../preload/cartoon/circus/circusArt';
import type { SetPiece, StoryKit } from '../../story/StoryKit';
import type { UnlockBeat } from '../../story/UnlockBeat';
import { CH8_BARREL, CH8_GWEN_TAKEN } from './lines';
import { StarActor } from './stars';

/**
 * In the funhouse, THE TANGLE's arm stretches out of a mirror on the wall and
 * pulls Gwen in with her (GAME_DESIGN.md, Chapter 8, beat 3).
 */
export class GwenTaken implements SetPiece {
  private phase: 'wait' | 'grab' | 'done' = 'wait';
  private readonly tangle: StarActor;
  private readonly mirror: Phaser.GameObjects.Image;

  constructor(
    private readonly kit: StoryKit,
    private readonly plan: CircusPlan,
    /** Where play resumes (tiles; 0 on a fresh start). */
    resumeX: number,
  ) {
    const g = plan.gwenTaken;
    this.tangle = new StarActor(kit.scene, 'tangle', DEPTH.decorBack + 1);
    // The mirror on the funhouse's wall she comes out of.
    this.mirror = kit.scene.add.image(g.mirrorX * TILE, g.floor * TILE - 2, CIRCUS_ART.heart).setOrigin(0.5, 1).setScale(0.62).setDepth(DEPTH.decorBack);
    if (resumeX >= g.triggerX) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'grab';
  }

  get storyLock(): boolean {
    return this.phase === 'grab';
  }

  update(dtMs: number): void {
    this.tangle.update(dtMs);
    if (this.phase !== 'wait') return;
    const kit = this.kit;
    if (kit.player.x < this.plan.gwenTaken.triggerX * TILE || kit.player.dead) return;
    this.phase = 'grab';
    const g = this.plan.gwenTaken;
    const p = kit.player;
    p.controlsEnabled = false;
    p.setVelocityX(0);
    kit.setLetterbox(true);
    // She leans out of the glass, her arm stretching for Gwen.
    this.tangle.show(g.mirrorX * TILE, g.floor * TILE - 4, -1, 'reach');
    kit.fx.flash(g.mirrorX * TILE, g.floor * TILE - 30, 0x3ac8c0, 40, 200);
    playSfx(CIRCUS_SFX.glass, 0.7, 0.7);
    const gwen = kit.gwen;
    kit.dialogue.play(CH8_GWEN_TAKEN, { onDone: () => this.finish() });
    kit.scene.time.delayedCall(CH8_BEATS.gwenTaken.reachMs, () => {
      this.tangle.play('grab', true);
      if (gwen) {
        const a = gwen.actor;
        a.pose('surprise');
        kit.scene.tweens.add({
          targets: a.sprite,
          x: g.mirrorX * TILE,
          y: g.floor * TILE - 10,
          scale: 0.6,
          duration: CH8_BEATS.gwenTaken.pullMs,
          ease: 'Quad.easeIn',
          onComplete: () => {
            gwen.leave();
            a.sprite.setScale(1);
            kit.fx.burst('mana', g.mirrorX * TILE, g.floor * TILE - 30, 14);
            this.tangle.hide();
          },
        });
      }
    });
  }

  private finish(): void {
    this.phase = 'done';
    const kit = this.kit;
    kit.player.controlsEnabled = true;
    kit.setLetterbox(false);
    this.tangle.hide();
    if (kit.gwen) kit.gwen.leave();
  }

  destroy(): void {
    this.tangle.destroy();
    this.mirror.destroy();
  }
}

type BarrelPhase = 'wait' | 'spin' | 'beat' | 'done';

/**
 * The spinning barrel (GAME_DESIGN.md, Chapter 8, beat 4): its doors slam,
 * the drum spins and throws Ben about, the spiked walls close in, and the
 * Omnitrix answers with new DNA: RICOCHET curls up and smashes out through
 * the far door. On a replay (Ricochet already on the dial) it spins a moment
 * and the far door gives on its own.
 */
export class Barrel implements SetPiece {
  private phase: BarrelPhase = 'wait';
  private t = 0;
  private readonly drum: Phaser.GameObjects.Image;
  private readonly spikes: Phaser.GameObjects.Image[] = [];
  private spinFrame = 0;

  constructor(
    private readonly kit: StoryKit,
    private readonly plan: CircusPlan,
    private readonly beat: UnlockBeat | null,
    resumeX: number,
  ) {
    const b = plan.barrel;
    this.drum = kit.scene.add.image(b.fromX * TILE, (b.top - 1) * TILE, CIRCUS_ART.barrel, '0').setOrigin(0, 0).setDepth(DEPTH.decorBack + 1);
    for (const dir of [1, -1] as const) {
      const x = dir > 0 ? (b.fromX + 1) * TILE : b.toX * TILE;
      this.spikes.push(kit.scene.add.image(x, b.top * TILE, CIRCUS_ART.spikes).setOrigin(dir > 0 ? 0 : 1, 0).setFlipX(dir < 0).setDepth(DEPTH.props).setVisible(false));
    }
    if (resumeX > b.toX) {
      // Past the barrel already: its far door is in pieces.
      this.phase = 'done';
      kit.collapse({ x: b.toX, y: b.top, w: 1, h: b.floor - b.top });
    }
  }

  get cinematic(): boolean {
    return this.phase === 'beat';
  }

  get storyLock(): boolean {
    return this.phase === 'spin' || this.phase === 'beat';
  }

  update(dtMs: number): void {
    const kit = this.kit;
    const b = this.plan.barrel;
    const B = CH8_BEATS.barrel;
    if (this.phase === 'wait') {
      if (kit.player.x >= b.triggerX * TILE && !kit.player.dead) this.start();
      return;
    }
    if (this.phase === 'done') return;
    this.t += dtMs;
    // The drum's stripes run round; the floor throws Ben about.
    const f = Math.floor(this.t / B.stripeMs) % 4;
    if (f !== this.spinFrame) {
      this.spinFrame = f;
      this.drum.setFrame(String(f));
    }
    if (this.phase === 'spin') {
      const p = kit.player;
      if (p.grounded && !p.rolling) p.setVelocityX(p.vx + B.throwVx * (dtMs / 1000) * 6 * Math.sin(this.t * 0.002));
      const k = Math.min(1, this.t / B.spinMs);
      this.spikes[0].setX((b.fromX + 1) * TILE + k * B.closeTiles * TILE);
      this.spikes[1].setX(b.toX * TILE - k * B.closeTiles * TILE);
      // The spiked walls shove him back toward the middle (they never pin him).
      const left = this.spikes[0].x + 12;
      const right = this.spikes[1].x - 12;
      if (p.x < left) p.setVelocityX(Math.max(p.vx, B.shoveSpeed));
      if (p.x > right) p.setVelocityX(Math.min(p.vx, -B.shoveSpeed));
      if (this.t % 900 < dtMs) kit.fx.shake(FX.shakeLight * 0.5, 120);
      const quick = !this.beat || this.beat.done;
      if (this.t >= (quick ? B.spinMs * B.replayShare : B.spinMs)) this.answer();
    }
  }

  private start(): void {
    const kit = this.kit;
    const b = this.plan.barrel;
    this.phase = 'spin';
    this.t = 0;
    // Both doors slam shut.
    kit.seal({ x: b.fromX, y: b.top, w: 1, h: b.floor - b.top });
    kit.seal({ x: b.toX, y: b.top, w: 1, h: b.floor - b.top });
    kit.fx.shake(FX.shakeMedium, 200);
    playSfx(CIRCUS_SFX.clunk, 1);
    for (const s of this.spikes) s.setVisible(true);
    kit.dialogue.play(CH8_BARREL);
  }

  /** The watch answers: the unlock beat (new DNA), then he smashes out. */
  private answer(): void {
    const kit = this.kit;
    if (this.beat && !this.beat.done) {
      this.phase = 'beat';
      kit.player.setVelocityX(0);
      this.beat.start(() => this.smashOut());
    } else this.smashOut();
  }

  private smashOut(): void {
    const kit = this.kit;
    const b = this.plan.barrel;
    this.phase = 'done';
    kit.collapse({ x: b.toX, y: b.top, w: 1, h: b.floor - b.top });
    const x = b.toX * TILE;
    const y = (b.floor - 2) * TILE;
    kit.fx.burst('debris', x, y, 24);
    kit.fx.burst('spark', x, y, 14);
    kit.fx.shake(FX.shakeHeavy, 260);
    kit.fx.popText(x, y - 30, 'STRIKE!', 0xe8884a);
    playSfx(CIRCUS_SFX.timber, 1, 1.4);
    // The ball goes on through, rolling (a nudge his way).
    const p = kit.player;
    p.setVelocityX(Math.max(p.vx, CH8_BEATS.barrel.exitSpeed));
    for (const s of this.spikes) kit.scene.tweens.add({ targets: s, alpha: 0, duration: 400, onComplete: () => s.setVisible(false) });
  }

  destroy(): void {
    this.drum.destroy();
    for (const s of this.spikes) s.destroy();
  }
}
