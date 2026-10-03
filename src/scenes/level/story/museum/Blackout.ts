import { BLACKOUT } from '../../../../config/chapter3';
import { TILE } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import type { Controls } from '../../../../systems/InputMap';
import { music } from '../../../../systems/audio/Music';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import type { UnlockBeat } from '../UnlockBeat';
import { BLACKOUT_LINES, WILDMUTT_FIRST } from './lines';

export interface BlackoutSpec {
  triggerX: number;
  fromX: number;
  toX: number;
}

type Phase = 'wait' | 'pa' | 'dark' | 'beat' | 'reveal' | 'done';

/**
 * The Night Gallery goes dark: Animo's voice over the PA, the lights clunk
 * off one by one, and in the pitch black the Omnitrix finds Wildmutt. His
 * first breath sends a huge pulse through the dark that paints every hidden
 * lurker and the plinth's secret door.
 */
export class Blackout implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private clunks = 0;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: BlackoutSpec,
    private readonly beat: UnlockBeat | null,
    resumeX: number,
  ) {
    // Restarting inside (or past) the gallery: the lights are already out.
    if (resumeX > spec.triggerX * TILE) {
      kit.setDarkness({ fromX: spec.fromX * TILE, toX: spec.toX * TILE });
      this.phase = 'done';
    }
  }

  get cinematic(): boolean {
    return this.phase === 'pa' || this.phase === 'dark';
  }

  get storyLock(): boolean {
    return this.phase !== 'wait' && this.phase !== 'done';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    const kit = this.kit;
    if (this.phase === 'done') return;
    if (this.phase === 'wait') {
      if (kit.player.x < this.spec.triggerX * TILE || kit.player.dead) return;
      this.phase = 'pa';
      this.t = 0;
      kit.player.controlsEnabled = false;
      kit.player.setVelocityX(0);
      kit.player.setInvulnerable(12000);
      kit.setLetterbox(true);
      music.stop(600);
      playSfx('beep', 0.6, 0.6);
      kit.dialogue.play(BLACKOUT_LINES, { skippable: true, onDone: () => this.lightsOut() });
      return;
    }
    this.t += realDtMs;
    if (this.phase === 'dark') {
      // Lights die one bank at a time.
      const due = Math.floor(this.t / BLACKOUT.clunkEveryMs);
      while (this.clunks < Math.min(due, BLACKOUT.clunks)) {
        this.clunks++;
        playSfx('lightClunk', 1, 1 - this.clunks * 0.08);
        kit.fx.shake(0.003, 120);
        if (this.clunks === BLACKOUT.clunks) kit.setDarkness({ fromX: this.spec.fromX * TILE, toX: this.spec.toX * TILE });
      }
      if (this.t >= BLACKOUT.clunkEveryMs * BLACKOUT.clunks + BLACKOUT.darkHoldMs) this.startBeat();
      return;
    }
    if (this.phase === 'reveal' && this.t >= BLACKOUT.pulseAt) this.reveal();
  }

  private lightsOut(): void {
    if (this.phase !== 'pa') return;
    this.phase = 'dark';
    this.t = 0;
    playSfx('powerDown');
  }

  private startBeat(): void {
    this.phase = 'beat';
    const kit = this.kit;
    kit.setLetterbox(false);
    const finish = () => {
      this.phase = 'reveal';
      this.t = 0;
    };
    if (this.beat && !this.beat.done) {
      kit.player.controlsEnabled = true;
      this.beat.start(finish);
    } else {
      kit.player.controlsEnabled = true;
      kit.speech.show("I CAN'T SEE A THING! ...WILDMUTT CAN.", 2200);
      this.phase = 'done';
      kit.playMusic('museum');
    }
  }

  /** His first breath: one enormous pulse that lights up everything hidden in the dark. */
  private reveal(): void {
    this.phase = 'done';
    const kit = this.kit;
    const p = kit.player;
    for (const [i, r] of [80, 170, 280].entries()) kit.scene.time.delayedCall(i * 160, () => kit.fx.ring(p.x, p.centerY, i === 1 ? PALETTE.white : 0xffc890, r, 700));
    kit.fx.burst('sense', p.x, p.centerY, 30);
    kit.fx.light(p.x, p.centerY, 300, 0xffc890, 900);
    playSfx('secret', 0.5);
    kit.dialogue.play(WILDMUTT_FIRST);
    kit.tutorial.tip('wildmutt-senses', 'NO EYES, ALL NOSE: HIDDEN FOES AND SECRET DOORS SHOW UP NEAR HIM', 6500, 6);
    kit.playMusic('museum');
  }

  destroy(): void {
    // Nothing to clean up: the darkness belongs to the level.
  }
}
