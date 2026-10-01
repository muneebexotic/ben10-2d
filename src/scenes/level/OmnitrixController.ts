import { OMNITRIX_WARNING_MS, getDifficulty } from '../../config/difficulty';
import { PALETTE } from '../../config/palette';
import { getAlien } from '../../aliens/registry';
import type { Player } from '../../entities/Player';
import { Omnitrix, type OmnitrixEvent, type RevertReason } from '../../systems/Omnitrix';
import { EventBus } from '../../systems/EventBus';
import type { Controls } from '../../systems/InputMap';
import type { Fx } from '../../systems/Fx';
import { playSfx } from '../../systems/audio/Sfx';
import type { TransformSequence } from './TransformSequence';

/**
 * Glue between the pure Omnitrix and the game: reads dial/transform input,
 * runs the transform/revert sequences and keeps the HUD informed.
 */
export class OmnitrixController {
  readonly omnitrix: Omnitrix;
  acquired = false;
  jammed = false;
  transformations = 0;
  private deniedFlashUntil = 0;
  onTransformed: ((alienId: string, first: boolean) => void) | null = null;
  onReverted: ((reason: RevertReason) => void) | null = null;
  onDenied: ((reason: 'cooldown' | 'jammed') => void) | null = null;

  constructor(
    unlocked: string[],
    private readonly player: Player,
    private readonly sequence: TransformSequence,
    private readonly fx: Fx,
  ) {
    const d = getDifficulty();
    this.omnitrix = new Omnitrix(
      {
        transformDurationMs: d.transformDurationMs,
        cooldownMs: d.cooldownMs,
        warningMs: OMNITRIX_WARNING_MS,
        wrongTransformChance: d.wrongTransformChance,
      },
      unlocked,
    );
  }

  handleInput(c: Controls, now: number): void {
    if (!this.acquired || this.player.dead || !this.player.controlsEnabled) return;
    if (c.dialPrev || c.dialNext) {
      const dir = c.dialNext ? 1 : -1;
      for (const e of this.omnitrix.cycle(dir)) {
        if (e.type === 'dial') EventBus.emit('omnitrix:dial', { selectedId: e.selectedId, index: e.index, count: e.count, direction: dir });
      }
      playSfx('uiMove', 1, dir > 0 ? 1.1 : 0.9);
    }
    if (!c.transform) return;
    if (this.sequence.busy) return;
    if (this.jammed) {
      this.deny('jammed', now);
      return;
    }
    const state = this.omnitrix.state;
    if (state === 'cooldown') this.deny('cooldown', now);
    else if (state === 'ready') this.handle(this.omnitrix.transform());
  }

  update(dtMs: number): void {
    this.handle(this.omnitrix.update(dtMs));
    this.player.visual.setWarning(this.omnitrix.isWarning);
    const o = this.omnitrix;
    EventBus.emit('omnitrix:tick', {
      state: o.state,
      acquired: this.acquired,
      selectedId: o.selectedAlien,
      activeId: o.activeAlienId,
      timeRatio: o.timeRatio,
      timeRemainingMs: o.timeRemainingMs,
      cooldownProgress: o.cooldownProgress,
      warning: o.isWarning,
      jammed: this.jammed,
    });
  }

  /** Forces an early revert (alien shield broken, jammer field). */
  forceRevert(reason: RevertReason): void {
    this.handle(this.omnitrix.revert(reason));
  }

  /** Checkpoint respawn: fresh watch, human Ben. */
  reset(): void {
    this.omnitrix.reset();
  }

  private handle(events: OmnitrixEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'transformed': {
          this.transformations++;
          const alien = getAlien(e.alienId);
          this.sequence.transform(alien, { first: this.transformations === 1, wrong: e.wrong });
          this.onTransformed?.(e.alienId, this.transformations === 1);
          break;
        }
        case 'warning':
          playSfx(e.secondsLeft <= 2 ? 'beepFinal' : 'beep', 1, e.secondsLeft <= 2 ? 1.1 : 1);
          EventBus.emit('omnitrix:warning', { secondsLeft: e.secondsLeft });
          break;
        case 'reverted':
          this.sequence.revert(e.reason);
          EventBus.emit('alien:reverted', { alienId: e.alienId, reason: e.reason });
          this.onReverted?.(e.reason);
          break;
        case 'ready':
          playSfx('ready');
          this.fx.burst('green', this.player.x, this.player.centerY, 12);
          this.fx.ring(this.player.x, this.player.centerY, PALETTE.omnitrix, 26, 300);
          EventBus.emit('omnitrix:ready');
          break;
        default:
          break;
      }
    }
  }

  private deny(reason: 'cooldown' | 'jammed', now: number): void {
    if (now < this.deniedFlashUntil) return;
    this.deniedFlashUntil = now + 250;
    playSfx(reason === 'jammed' ? 'jammed' : 'denied');
    if (reason === 'jammed') this.fx.burst('blue', this.player.x, this.player.centerY, 6);
    EventBus.emit('omnitrix:denied', { reason });
    this.onDenied?.(reason);
  }
}
