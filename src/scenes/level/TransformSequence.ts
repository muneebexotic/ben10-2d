import Phaser from 'phaser';
import { CAMERA, FX } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { PLAYER } from '../../config/player';
import type { FormDefinition } from '../../aliens/types';
import { HUMAN_FORM } from '../../aliens/registry';
import type { Player } from '../../entities/Player';
import type { Combat } from './Combat';
import type { Fx } from '../../systems/Fx';
import type { TimeController } from '../../systems/TimeController';
import { EventBus } from '../../systems/EventBus';
import { playSfx } from '../../systems/audio/Sfx';
import { music } from '../../systems/audio/Music';
import type { SpeechBubble } from '../../ui/SpeechBubble';
import { a11y, flashCamera } from '../../systems/Accessibility';
import { MISFIRE, PERFECT_TRANSFORM, SWAP } from '../../config/omnitrix';
import type { MisfireBeat } from './MisfireBeat';

export interface SequenceDeps {
  scene: Phaser.Scene;
  player: Player;
  fx: Fx;
  combat: Combat;
  time: TimeController;
  speech: SpeechBubble;
  misfire: MisfireBeat;
}

/** The Omnitrix gave the wrong alien: who was wanted and what Ben says about it. */
export interface MisfireInfo {
  wantedId: string;
  line: string;
}

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const PERFECT_QUIPS = ['NAILED IT!', 'TOO SLOW, TIN CAN!', 'PERFECT TIMING!', 'DID YOU SEE THAT?!'];

/**
 * The signature moment: slow-mo wind-up, Omnitrix slam, green supernova,
 * shockwave that knocks drones away, camera punch and a name slam on the HUD.
 */
export class TransformSequence {
  private busyUntil = 0;
  private zoomTween: Phaser.Tweens.Tween | null = null;
  private concealUntilGag = false;

  constructor(private readonly d: SequenceDeps) {}

  /** A misfire is winding up: the HUD keeps showing the alien Ben picked until the reveal. */
  get concealing(): boolean {
    return this.concealUntilGag;
  }

  get busy(): boolean {
    return this.d.scene.time.now < this.busyUntil;
  }

  transform(alien: FormDefinition, opts: { first: boolean; perfect: boolean; misfire?: MisfireInfo }): void {
    const { scene, player, fx, time } = this.d;
    const misfire = opts.misfire ?? null;
    this.concealUntilGag = misfire !== null;
    // A misfire's tell: the watch sputters a beat longer before it goes off.
    const windupMs = (opts.first ? 520 : 240) + (misfire ? MISFIRE.glitchWindupMs : 0);
    const cam = scene.cameras.main;

    player.controlsEnabled = false;
    player.visual.play('watch');
    player.setInvulnerable(windupMs + PLAYER.transformInvulnMs);
    time.slowMo(0.12, windupMs, 180);
    playSfx('transformCharge');
    EventBus.emit('hud:omnitrixSymbol', { color: opts.perfect ? PALETTE.gold : PALETTE.omnitrix, big: opts.first || opts.perfect });

    const x = player.x;
    const y = player.centerY;
    if (opts.perfect) {
      // Instant confirmation on the press itself; the payoff lands with the burst.
      playSfx('perfect');
      fx.burst('gold', x, y, 24);
      fx.ring(x, y, PALETTE.gold, 34, windupMs);
    }
    if (misfire) this.sputter(x, y, windupMs);
    fx.burst('green', x, y, opts.first ? 30 : 16);
    fx.ring(x, y, PALETTE.omnitrix, 18, windupMs);
    fx.light(x, y, 160, PALETTE.omnitrix, windupMs + 300, 1);
    this.zoomTo(CAMERA.transformZoom, windupMs * 0.6, 'Quad.easeOut');
    this.busyUntil = scene.time.now + windupMs + 200;

    scene.time.delayedCall(windupMs, () => {
      const px = player.x;
      const py = player.centerY;
      player.setForm(alien);
      player.controlsEnabled = true;
      player.setInvulnerable(PLAYER.transformInvulnMs);
      player.squash(1.55, 0.6);

      flashCamera(cam, opts.first ? 320 : 200, 120, 255, 110);
      this.shockwaveDistortion(opts.first ? 1.32 : 1.2);
      fx.rays(px, py, PALETTE.omnitrix, opts.first ? 240 : 170, opts.first ? 900 : 600);
      fx.ring(px, py, PALETTE.omnitrixGlow, 90, 420);
      fx.ring(px, py, alien.theme.color, 60, 520);
      fx.flash(px, py, PALETTE.omnitrix, 70, 380);
      fx.burst('green', px, py, 40);
      fx.burst(alien.theme.burst, px, py, 30);
      fx.burst('ember', px, py, 14);
      fx.light(px, py, 260, PALETTE.omnitrix, 700);
      fx.shake(opts.first ? FX.shakeHeavy : FX.shakeMedium, 280);
      fx.hitStop(60);
      playSfx('transformBoom');
      if (alien.audio.transform) playSfx(alien.audio.transform);

      // The transformation shockwave shoves nearby drones away: transforming is also a panic button.
      const reflected = opts.perfect ? this.perfectBurst(px, py) : 0;
      if (!opts.perfect) this.d.combat.blast(px, py, 72, { damage: 1, kind: 'transform', x: px, y: py, knockback: 340 }, true);

      music.setLayer(alien.audio.music);
      music.setIntensity(1);
      EventBus.emit('alien:transformed', { alienId: alien.id, name: alien.name, wrong: misfire !== null, first: opts.first, swap: false });
      if (misfire) {
        // The misfire beat owns the camera from here.
        this.zoomTween?.stop();
        this.zoomTween = null;
        this.startMisfire(alien, misfire, false);
        return;
      }
      this.zoomTo(1, CAMERA.transformZoomMs, 'Back.easeOut');
      const line = opts.first
          ? alien.quips.first ?? pick(alien.quips.transform)
          : opts.perfect
            ? reflected > 0 ? 'RETURN TO SENDER!' : pick(PERFECT_QUIPS)
            : pick(alien.quips.transform);
      if (line && (opts.first || opts.perfect || Math.random() < 0.45)) this.d.speech.show(line, opts.first ? 2200 : 1500);
    });
  }

  /** Sparks and stutter from the watch while it winds up the wrong alien. */
  private sputter(x: number, y: number, windupMs: number): void {
    const { fx, scene } = this.d;
    playSfx('omnitrixGlitch');
    fx.burst('spark', x, y, 10);
    fx.ring(x, y, PALETTE.enemy, 22, windupMs * 0.6);
    scene.time.delayedCall(windupMs * 0.45, () => {
      fx.burst('spark', this.d.player.x, this.d.player.centerY, 8);
      EventBus.emit('hud:omnitrixSymbol', { color: PALETTE.enemy, big: false });
    });
  }

  /**
   * Wrong alien: the record-scratch gag, with the WANTED / GOT card on the
   * HUD. It waits for the transformation flash to clear so the freeze-frame
   * lands on the new alien's face, not on the explosion.
   */
  private startMisfire(alien: FormDefinition, misfire: MisfireInfo, swap: boolean): void {
    this.concealUntilGag = true;
    this.d.scene.time.delayedCall(swap ? MISFIRE.swapRevealDelayMs : MISFIRE.revealDelayMs, () => {
      this.concealUntilGag = false;
      if (this.d.player.dead || this.d.player.form.id !== alien.id) {
        // No gag after all (Ben went down, or was already swapped out): just give the camera back.
        this.zoomTo(1, CAMERA.transformZoomMs, 'Quad.easeOut');
        return;
      }
      this.d.misfire.start(misfire.line, swap);
      EventBus.emit('alien:misfire', { wantedId: misfire.wantedId, gotId: alien.id, swap, line: misfire.line });
    });
  }

  /**
   * Mid-transformation swap: no wind-up, the new alien bursts out of the old
   * one and arrives with its entrance move. Fast enough to use in a fight.
   */
  swap(alien: FormDefinition, opts: { perfect: boolean; fix: boolean; misfire?: MisfireInfo }): void {
    const { scene, player, fx, time } = this.d;
    const px = player.x;
    const py = player.centerY;
    player.setForm(alien, player.shieldRatio);
    player.setInvulnerable(SWAP.invulnMs);
    player.squash(1.45, 0.65);
    this.busyUntil = scene.time.now + SWAP.busyMs;

    fx.hitStop(SWAP.hitStopMs);
    time.slowMo(SWAP.slowMoScale, SWAP.slowMoMs, 160);
    fx.flash(px, py, PALETTE.omnitrix, 46, 260);
    fx.ring(px, py, PALETTE.omnitrix, 40, 260);
    fx.ring(px, py, alien.theme.color, 62, 380);
    fx.burst('green', px, py, 18);
    fx.burst(alien.theme.burst, px, py, 26);
    fx.light(px, py, 180, alien.theme.color, 420);
    fx.shake(FX.shakeLight, 140);
    EventBus.emit('hud:omnitrixSymbol', { color: opts.perfect ? PALETTE.gold : alien.theme.color, big: false });
    playSfx('swap');
    if (alien.audio.transform) playSfx(alien.audio.transform, 0.7);
    music.setLayer(alien.audio.music);

    const reflected = opts.perfect ? this.perfectBurst(px, py) : 0;
    if (opts.perfect) playSfx('perfect');
    player.swapIn();
    const misfire = opts.misfire ?? null;
    EventBus.emit('alien:transformed', { alienId: alien.id, name: alien.name, wrong: misfire !== null, first: false, swap: true, fix: opts.fix });
    if (misfire) {
      playSfx('omnitrixGlitch', 0.8);
      fx.burst('spark', px, py, 12);
      this.startMisfire(alien, misfire, true);
      return;
    }
    const line = opts.fix
      ? 'THAT\'S MORE LIKE IT!'
      : opts.perfect
        ? reflected > 0 ? 'RETURN TO SENDER!' : pick(PERFECT_QUIPS)
        : alien.quips.swap?.length ? pick(alien.quips.swap) : '';
    if (line && (opts.fix || opts.perfect || Math.random() < SWAP.quipChance)) this.d.speech.show(line, 1300);
  }

  /** Bigger shockwave, enemy shots turned around, a slow-motion beat and a gold supernova. */
  private perfectBurst(x: number, y: number): number {
    const { fx, time, combat } = this.d;
    const P = PERFECT_TRANSFORM;
    const reflected = combat.reflectAround(x, y, P.shockwaveRadius, P.reflectSpeedMultiplier, P.reflectDamage);
    combat.blast(x, y, P.shockwaveRadius, { damage: P.shockwaveDamage, kind: 'transform', x, y, knockback: P.knockback, heavy: true }, false);
    time.slowMo(P.slowMoScale, P.slowMoMs, 320);
    fx.hitStop(P.hitStopMs);
    fx.ring(x, y, PALETTE.gold, P.shockwaveRadius, 620);
    fx.ring(x, y, PALETTE.white, P.shockwaveRadius * 0.7, 460);
    fx.rays(x, y, PALETTE.gold, 260, 1000);
    fx.flash(x, y, PALETTE.gold, 90, 420);
    fx.burst('gold', x, y, 44);
    fx.light(x, y, 300, PALETTE.gold, 900);
    fx.shake(FX.shakeHeavy, 360);
    return reflected;
  }

  revert(reason: 'timeout' | 'damage' | 'jammed' | 'forced'): void {
    const { scene, player, fx, time } = this.d;
    const x = player.x;
    const y = player.centerY;
    player.setForm(HUMAN_FORM);
    player.setInvulnerable(PLAYER.revertInvulnMs);
    player.squash(0.7, 1.35);
    const color = reason === 'jammed' ? PALETTE.jammer : PALETTE.enemy;
    if (reason === 'jammed') flashCamera(scene.cameras.main, 160, 110, 180, 255);
    else flashCamera(scene.cameras.main, 160, 255, 60, 60);
    fx.burst(reason === 'jammed' ? 'blue' : 'red', x, y, 24);
    fx.burst('green', x, y, 12);
    fx.burst('smoke', x, y, 8);
    fx.ring(x, y, color, 44, 360);
    fx.shake(FX.shakeMedium, 180);
    time.slowMo(0.45, 160, 160);
    playSfx(reason === 'jammed' ? 'jammed' : 'revert');
    music.setLayer(null);
    music.setIntensity(0);
    const line = reason === 'jammed' ? 'HEY! GIVE IT BACK!' : pick(HUMAN_FORM.quips.revert);
    this.d.speech.show(line, 1500);
  }

  /** Brief barrel-distortion pulse: the screen itself bulges with the transformation. */
  private shockwaveDistortion(amount: number): void {
    // A whole-screen warp is motion, so it follows the screen shake setting.
    const strength = (amount - 1) * a11y.shake;
    if (strength <= 0.01) return;
    const cam = this.d.scene.cameras.main;
    const barrel = cam.filters?.internal.addBarrel(1);
    if (!barrel) return;
    this.d.scene.tweens.add({
      targets: barrel,
      amount: 1 + strength,
      duration: 110,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => cam.filters?.internal.remove(barrel),
    });
  }

  private zoomTo(zoom: number, ms: number, ease: string): void {
    const cam = this.d.scene.cameras.main;
    this.zoomTween?.stop();
    this.zoomTween = this.d.scene.tweens.add({ targets: cam, zoom, duration: ms, ease });
  }
}
