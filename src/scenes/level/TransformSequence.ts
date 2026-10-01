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
import { PERFECT_TRANSFORM } from '../../config/omnitrix';

export interface SequenceDeps {
  scene: Phaser.Scene;
  player: Player;
  fx: Fx;
  combat: Combat;
  time: TimeController;
  speech: SpeechBubble;
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

  constructor(private readonly d: SequenceDeps) {}

  get busy(): boolean {
    return this.d.scene.time.now < this.busyUntil;
  }

  transform(alien: FormDefinition, opts: { first: boolean; wrong: boolean; perfect: boolean }): void {
    const { scene, player, fx, time } = this.d;
    const windupMs = opts.first ? 520 : 240;
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
      fx.ring(px, py, alien.color, 60, 520);
      fx.flash(px, py, PALETTE.omnitrix, 70, 380);
      fx.burst('green', px, py, 40);
      fx.burst(alien.id === 'heatblast' ? 'fire' : 'white', px, py, 30);
      fx.burst('ember', px, py, 14);
      fx.light(px, py, 260, PALETTE.omnitrix, 700);
      fx.shake(opts.first ? FX.shakeHeavy : FX.shakeMedium, 280);
      fx.hitStop(60);
      playSfx('transformBoom');

      // The transformation shockwave shoves nearby drones away: transforming is also a panic button.
      const reflected = opts.perfect ? this.perfectBurst(px, py) : 0;
      if (!opts.perfect) this.d.combat.blast(px, py, 72, { damage: 1, kind: 'transform', x: px, y: py, knockback: 340 }, true);

      this.zoomTo(1, CAMERA.transformZoomMs, 'Back.easeOut');
      music.setIntensity(1);
      EventBus.emit('alien:transformed', { alienId: alien.id, name: alien.name, wrong: opts.wrong, first: opts.first });
      const line = opts.wrong
        ? 'AW MAN, NOT THIS GUY!'
        : opts.first
          ? "WHOA! I'M ON FIRE! ...LITERALLY!"
          : opts.perfect
            ? reflected > 0 ? 'RETURN TO SENDER!' : pick(PERFECT_QUIPS)
            : pick(alien.quips.transform);
      if (line && (opts.first || opts.wrong || opts.perfect || Math.random() < 0.45)) this.d.speech.show(line, opts.first ? 2200 : 1500);
    });
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
