import Phaser from 'phaser';
import { DEPTH, FX } from '../../config/constants';
import { MISFIRE } from '../../config/omnitrix';
import { PALETTE } from '../../config/palette';
import type { Player } from '../../entities/Player';
import type { Fx } from '../../systems/Fx';
import type { TimeController } from '../../systems/TimeController';
import { a11y } from '../../systems/Accessibility';
import { music } from '../../systems/audio/Music';
import { playSfx } from '../../systems/audio/Sfx';
import type { SpeechBubble } from '../../ui/SpeechBubble';
import { pixelText } from '../../ui/text';
import type { CameraRig } from './CameraRig';

export interface MisfireBeatDeps {
  scene: Phaser.Scene;
  player: Player;
  fx: Fx;
  time: TimeController;
  speech: SpeechBubble;
  camera: CameraRig;
}

const easeOutBack = (t: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * The misfire gag, in real time: record scratch, the music cuts out, the
 * world all but stops, the camera punches in on Ben's face with a little
 * dutch tilt, he does a double take and says his line. Then everything snaps
 * back and the fight goes on with the wrong alien.
 */
export class MisfireBeat {
  private t = -1;
  private holdMs = 0;
  private zoomTo = 1;
  private zoomFrom = 1;
  private facing: 1 | -1 = 1;
  private flips = 0;
  private mark: Phaser.GameObjects.BitmapText | null = null;
  private sepia: Phaser.Filters.ColorMatrix | null = null;

  constructor(private readonly d: MisfireBeatDeps) {}

  get active(): boolean {
    return this.t >= 0;
  }

  /** Starts the gag. `swap` plays the snappier mid-fight version. */
  start(line: string, swap: boolean): void {
    const { player, time, fx, speech, scene } = this.d;
    this.cancel();
    this.t = 0;
    this.holdMs = swap ? MISFIRE.swapFreezeMs : MISFIRE.freezeMs;
    this.zoomTo = swap ? MISFIRE.swapZoom : MISFIRE.zoom;
    this.zoomFrom = scene.cameras.main.zoom;
    this.facing = player.facing;
    this.flips = 0;

    playSfx('recordScratch');
    music.scratch(MISFIRE.musicGapMs + this.holdMs * 0.4);
    time.slowMo(MISFIRE.freezeScale, this.holdMs, MISFIRE.releaseMs);
    fx.hitStop(40);
    fx.shake(FX.shakeLight, 120);
    player.controlsEnabled = false;
    player.setVelocityX(0);
    player.setInvulnerable(this.holdMs + MISFIRE.releaseMs + MISFIRE.invulnAfterMs);
    speech.show(line, MISFIRE.lineMs);

    // The freeze-frame goes sepia, like every "yep, that's me" record-scratch moment.
    this.sepia = scene.cameras.main.filters?.internal.addColorMatrix() ?? null;
    if (this.sepia) {
      this.sepia.colorMatrix.sepia();
      this.sepia.colorMatrix.alpha = 0;
    }

    this.mark = pixelText(scene, player.x, player.y - player.headHeight - 30, '?!', { scale: 2, originX: 0.5, originY: 1, color: PALETTE.gold, depth: DEPTH.worldUi });
    this.mark.setScale(0);
  }

  /** Real (unscaled) frame time: the gag runs at full speed while the world crawls. */
  update(realDtMs: number): void {
    if (this.t < 0) return;
    const { scene, player, camera } = this.d;
    this.t += realDtMs;
    const cam = scene.cameras.main;
    const hold = this.holdMs;
    const end = hold + MISFIRE.releaseMs;
    const headY = player.y - player.headHeight * 0.75;

    let w: number;
    let zoom: number;
    if (this.t < MISFIRE.zoomInMs) {
      const k = easeOutBack(Math.min(1, this.t / MISFIRE.zoomInMs));
      w = Math.min(1, k);
      zoom = this.zoomFrom + (this.zoomTo - this.zoomFrom) * k;
    } else if (this.t < hold) {
      // A slow push-in while he stares.
      w = 1;
      zoom = this.zoomTo + ((this.t - MISFIRE.zoomInMs) / hold) * 0.06;
    } else {
      const k = easeInOut(Math.min(1, (this.t - hold) / MISFIRE.releaseMs));
      w = 1 - k;
      zoom = this.zoomTo + 0.06 + (1 - this.zoomTo - 0.06) * k;
      if (!player.controlsEnabled && !player.dead) player.controlsEnabled = true;
    }
    camera.setFocus(player.x, headY, w);
    if (this.sepia) this.sepia.colorMatrix.alpha = MISFIRE.sepia * Math.min(1, this.t / MISFIRE.zoomInMs) * (this.t < hold ? 1 : w);
    cam.setZoom(zoom);
    // The tilt is camera motion, so it follows the Screen Shake setting.
    cam.setRotation(Phaser.Math.DegToRad(MISFIRE.tiltDeg * a11y.shake) * w);

    // Double take: looks one way, then the other, then back at the mess he's in.
    const flipAt = [0.28, 0.56];
    if (this.flips < flipAt.length && this.t >= hold * flipAt[this.flips]) {
      this.flips++;
      player.setFacing(this.flips === 1 ? (-this.facing as 1 | -1) : this.facing);
      player.squash(1.12, 0.9);
    }

    if (this.mark) {
      const pop = Math.min(1, this.t / 140);
      const fade = this.t > hold ? Math.max(0, 1 - (this.t - hold) / MISFIRE.releaseMs) : 1;
      // Beside his head (the speech bubble sits above it).
      const side = player.form.frame.w * 0.32 + 6;
      this.mark.setPosition(Math.round(player.x + player.facing * side), Math.round(player.y - player.headHeight * 0.55));
      this.mark.setScale(easeOutBack(pop));
      this.mark.setAngle(Math.sin(this.t * 0.03) * 8);
      this.mark.setAlpha(fade);
    }

    if (this.t >= end) this.finish();
  }

  /** Ends the gag immediately and gives the camera back (death, level exit). */
  cancel(): void {
    if (this.t < 0) return;
    this.finish();
  }

  private finish(): void {
    const { scene, camera, player } = this.d;
    this.t = -1;
    camera.setFocus(0, 0, 0);
    scene.cameras.main.setZoom(1).setRotation(0);
    if (this.sepia) scene.cameras.main.filters?.internal.remove(this.sepia);
    this.sepia = null;
    if (!player.dead) player.controlsEnabled = true;
    this.mark?.destroy();
    this.mark = null;
  }
}
