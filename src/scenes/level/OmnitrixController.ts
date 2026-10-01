import { OMNITRIX_WARNING_MS, getDifficulty } from '../../config/difficulty';
import { MISFIRE, PERFECT_TRANSFORM, SWAP } from '../../config/omnitrix';
import { MisfireQuips } from '../../aliens/misfire';
import { PALETTE } from '../../config/palette';
import { getAlien } from '../../aliens/registry';
import type { Player } from '../../entities/Player';
import { Omnitrix, type OmnitrixEvent, type RevertReason } from '../../systems/Omnitrix';
import { EventBus } from '../../systems/EventBus';
import type { Controls } from '../../systems/InputMap';
import type { Fx } from '../../systems/Fx';
import type { PerfectWindow } from '../../systems/PerfectTransform';
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
  swaps = 0;
  perfects = 0;
  misfires = 0;
  improvised = 0;
  private deniedFlashUntil = 0;
  private pendingPerfect = false;
  private readonly quips = new MisfireQuips();
  /** False while the story needs the watch to behave (first transform, boss intro). */
  misfireAllowed: () => boolean = () => true;
  onTransformed: ((alienId: string, first: boolean) => void) | null = null;
  onSwapped: ((alienId: string) => void) | null = null;
  onReverted: ((reason: RevertReason) => void) | null = null;
  onDenied: ((reason: 'cooldown' | 'jammed' | 'lowTime') => void) | null = null;

  constructor(
    unlocked: string[],
    private readonly player: Player,
    private readonly sequence: TransformSequence,
    private readonly fx: Fx,
    private readonly perfect: PerfectWindow,
    opts: { wrongTransformChance?: number } = {},
  ) {
    const d = getDifficulty();
    this.omnitrix = new Omnitrix(
      {
        transformDurationMs: d.transformDurationMs,
        cooldownMs: d.cooldownMs,
        warningMs: OMNITRIX_WARNING_MS,
        wrongTransformChance: opts.wrongTransformChance ?? d.wrongTransformChance,
        swapEnabled: SWAP.enabled,
        swapCostMs: SWAP.costMs,
        swapLockoutMs: SWAP.lockoutMs,
        swapMisfireScale: MISFIRE.swapChanceScale,
        misfireFixCostScale: MISFIRE.fixCostScale,
        improviseBonusMs: MISFIRE.improviseBonusMs,
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
    const lead = Math.min(c.transformLeadMs, PERFECT_TRANSFORM.touchLeadCapMs);
    if (state === 'cooldown') this.deny('cooldown', now);
    else if (state === 'ready') {
      // The very first transform is the tutorial moment; perfects start after it.
      this.pendingPerfect = this.transformations > 0 && this.perfect.check(now - lead, this.player.x, this.player.centerY) !== null;
      this.handle(this.omnitrix.transform({ allowMisfire: this.misfireAllowed() }));
      this.pendingPerfect = false;
    } else if (state === 'active') {
      const denial = this.omnitrix.swapDenial();
      if (denial === null) {
        this.pendingPerfect = this.perfect.check(now - lead, this.player.x, this.player.centerY) !== null;
        this.handle(this.omnitrix.swap({ allowMisfire: this.misfireAllowed() }));
        this.pendingPerfect = false;
      } else if (denial === 'lowTime') {
        this.deny('lowTime', now);
      }
    }
  }

  update(dtMs: number): void {
    this.handle(this.omnitrix.update(dtMs));
    this.player.visual.setWarning(this.omnitrix.isWarning);
    const o = this.omnitrix;
    // Until the misfire gag, the HUD shows the alien Ben asked for: the surprise is the joke.
    const hide = this.sequence.concealing;
    EventBus.emit('omnitrix:tick', {
      state: o.state,
      acquired: this.acquired,
      selectedId: o.selectedAlien,
      activeId: hide ? (o.misfireState?.wantedId ?? o.activeAlienId) : o.activeAlienId,
      timeRatio: o.timeRatio,
      timeRemainingMs: o.timeRemainingMs,
      cooldownProgress: o.cooldownProgress,
      warning: o.isWarning,
      jammed: this.jammed,
      unlocked: o.unlockedAliens,
      canSwap: !hide && o.canSwap(),
      frozen: o.timerFrozen,
      fixOwed: !hide && o.fixSwapOwed,
    });
  }

  /** Forces an early revert (alien shield broken, jammer field). */
  forceRevert(reason: RevertReason): void {
    this.handle(this.omnitrix.revert(reason));
  }

  /** A KO landed: if it was the misfired alien's first, rolling with it pays out. */
  improvise(): void {
    const alienId = this.omnitrix.activeAlienId;
    const bonusMs = this.omnitrix.improvise();
    if (bonusMs <= 0 || alienId === null) return;
    this.improvised++;
    playSfx('improvise');
    EventBus.emit('omnitrix:improvised', { bonusMs, alienId });
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
          const perfect = this.pendingPerfect;
          const misfire = e.wrong ? this.misfire(e.requestedId, e.alienId) : undefined;
          this.sequence.transform(alien, { first: this.transformations === 1, perfect, misfire });
          if (perfect) this.rewardPerfect();
          this.onTransformed?.(e.alienId, this.transformations === 1);
          break;
        }
        case 'swapped': {
          this.swaps++;
          const perfect = this.pendingPerfect;
          const misfire = e.wrong ? this.misfire(e.requestedId, e.alienId) : undefined;
          this.sequence.swap(getAlien(e.alienId), { perfect, fix: e.fix, misfire });
          if (perfect) this.rewardPerfect();
          this.onSwapped?.(e.alienId);
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

  private misfire(wantedId: string, gotId: string): { wantedId: string; line: string } {
    this.misfires++;
    return { wantedId, line: this.quips.line(wantedId, gotId) };
  }

  private rewardPerfect(): void {
    this.perfects++;
    this.omnitrix.extend(PERFECT_TRANSFORM.bonusMs);
    EventBus.emit('omnitrix:perfect', { bonusMs: PERFECT_TRANSFORM.bonusMs, count: this.perfects });
  }

  private deny(reason: 'cooldown' | 'jammed' | 'lowTime', now: number): void {
    if (now < this.deniedFlashUntil) return;
    this.deniedFlashUntil = now + 250;
    playSfx(reason === 'jammed' ? 'jammed' : 'denied');
    if (reason === 'jammed') this.fx.burst('blue', this.player.x, this.player.centerY, 6);
    EventBus.emit('omnitrix:denied', { reason });
    this.onDenied?.(reason);
  }
}
