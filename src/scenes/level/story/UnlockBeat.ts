import { TILE } from '../../../config/constants';
import { PALETTE } from '../../../config/palette';
import { STORY_BEATS } from '../../../config/story';
import { getAlien } from '../../../aliens/registry';
import { EventBus } from '../../../systems/EventBus';
import type { Controls } from '../../../systems/InputMap';
import { playSfx } from '../../../systems/audio/Sfx';
import { music } from '../../../systems/audio/Music';
import type { SetPiece, StoryKit } from './StoryKit';

export interface UnlockSpec {
  alien: string;
  /** Tile x Ben walks past to trigger it (ignored when a director starts it). */
  x: number;
  /** What Ben says when he hits the obstacle. */
  line: string;
}

type Stage = 'wait' | 'beat' | 'done';

/**
 * A new alien's discovery: Ben hits something he can't handle, the Omnitrix
 * goes haywire ("NEW DNA DETECTED"), the dial spins and lands on a stranger,
 * and the watch throws him straight into it. Never a misfire. Skipped (with
 * just the prompt) when the file already has the alien.
 */
export class UnlockBeat implements SetPiece {
  private stage: Stage = 'wait';
  private t = 0;
  private readonly steps = new Set<string>();
  private onDone: (() => void) | null = null;

  constructor(
    private readonly kit: StoryKit,
    readonly spec: UnlockSpec,
    /** Started by another set piece (the chase) instead of by position. */
    private readonly scripted: boolean,
  ) {
    if (kit.hasAlien(spec.alien)) this.stage = 'done';
  }

  get cinematic(): boolean {
    return this.stage === 'beat';
  }

  get storyLock(): boolean {
    return this.stage === 'beat';
  }

  get done(): boolean {
    return this.stage === 'done';
  }

  /** Runs the beat now (or finishes at once if the alien is already on the dial). */
  start(onDone?: () => void): void {
    if (this.stage === 'done') {
      onDone?.();
      return;
    }
    this.onDone = onDone ?? null;
    this.begin();
  }

  update(_dtMs: number, realDtMs: number, controls: Controls): void {
    if (this.stage === 'wait') {
      // Mid-jump counts too: a run-up and a leap off the broken bridge must not reach the water first.
      if (!this.scripted && this.kit.player.x >= this.spec.x * TILE && !this.kit.player.dead) this.begin();
      return;
    }
    if (this.stage !== 'beat') return;
    this.t += realDtMs;
    const B = STORY_BEATS.unlock;
    if (this.t > B.skipGraceMs && (controls.anyPressed || controls.pause)) {
      // Skipping jumps to the next big moment: the reveal, then the transformation.
      if (this.t < B.revealAt) this.t = B.revealAt;
      else if (this.t < B.transformAt) this.t = B.transformAt;
    }
    this.run();
  }

  private once(id: string, at: number): boolean {
    if (this.t < at || this.steps.has(id)) return false;
    this.steps.add(id);
    return true;
  }

  private begin(): void {
    const { player, time } = this.kit;
    this.stage = 'beat';
    this.t = 0;
    player.controlsEnabled = false;
    player.scriptedMove = null;
    // Stop dead (a leap drops straight down onto the ledge it started from).
    player.setVelocityX(0);
    player.setInvulnerable(STORY_BEATS.unlock.doneAt + 1500);
    time.slowMo(0.18, STORY_BEATS.unlock.transformAt, 400);
    music.setIntensity(0);
    this.kit.setLetterbox(true);
    this.kit.speech.show(this.spec.line, 1700);
  }

  private run(): void {
    const B = STORY_BEATS.unlock;
    const { player, fx } = this.kit;
    const alien = getAlien(this.spec.alien);
    if (this.once('beep', B.beepAt)) {
      // The watch acts up: beeps, glows, sparks.
      playSfx('beepFinal', 1, 1.2);
      player.visual.play('watch');
      player.glow(PALETTE.omnitrix, 1);
      fx.ring(player.x, player.centerY, PALETTE.omnitrix, 30, 400);
      fx.burst('green', player.x, player.centerY, 14);
      this.kit.speech.show('HUH? THE WATCH IS DOING SOMETHING...', 1300);
    }
    if (this.once('scan', B.scanAt)) {
      playSfx('dnaScan');
      EventBus.emit('hud:unlock', { alienId: alien.id, stage: 'scan' });
      fx.light(player.x, player.centerY, 200, PALETTE.omnitrix, 1400);
    }
    if (this.once('reveal', B.revealAt)) {
      this.kit.unlockAlien(alien.id);
      player.glow(PALETTE.omnitrix, 0);
      playSfx('unlock');
      EventBus.emit('hud:unlock', { alienId: alien.id, stage: 'reveal' });
      fx.burst(alien.theme.burst, player.x, player.centerY, 30);
      fx.ring(player.x, player.centerY, alien.theme.color, 70, 600);
      fx.shake(0.01, 300);
    }
    if (this.once('transform', B.transformAt)) {
      EventBus.emit('hud:unlock', { alienId: alien.id, stage: 'hide' });
      this.kit.setLetterbox(false);
      this.kit.time.clearSlowMo();
      player.controlsEnabled = true;
      this.kit.omni.forceInto(alien.id);
    }
    if (this.once('done', B.doneAt)) {
      this.stage = 'done';
      const cb = this.onDone;
      this.onDone = null;
      cb?.();
    }
  }

  destroy(): void {
    if (this.stage === 'beat') EventBus.emit('hud:unlock', { alienId: this.spec.alien, stage: 'hide' });
  }
}
