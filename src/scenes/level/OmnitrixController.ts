import { OMNITRIX_WARNING_MS } from '../../config/difficulty';
import { activeDifficulty } from '../../systems/Difficulty';
import { MISFIRE, PERFECT_TRANSFORM, SWAP } from '../../config/omnitrix';
import { MisfireQuips } from '../../aliens/misfire';
import { isForcedMisfire, type ForcedMisfire } from '../../systems/MisfireRules';
import { PALETTE } from '../../config/palette';
import { allAliens, getAlien, hasAlien } from '../../aliens/registry';
import type { Player } from '../../entities/Player';
import { Omnitrix, type OmnitrixConfig, type OmnitrixEvent, type RevertReason } from '../../systems/Omnitrix';
import { EventBus } from '../../systems/EventBus';
import type { Controls } from '../../systems/InputMap';
import type { Fx } from '../../systems/Fx';
import type { PerfectWindow } from '../../systems/PerfectTransform';
import { playSfx } from '../../systems/audio/Sfx';
import type { TransformSequence } from './TransformSequence';

type DenyReason = 'cooldown' | 'jammed' | 'lowTime' | 'stolen' | 'cramped';

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
  /** A story moment is driving the watch: its swap doesn't count as the player's. */
  private forcing = false;
  /** False while the story needs the watch to behave (first transform, boss intro). */
  misfireAllowed: () => boolean = () => true;
  private readonly wrongOverride: number | null;
  onTransformed: ((alienId: string, first: boolean) => void) | null = null;
  onSwapped: ((alienId: string) => void) | null = null;
  onReverted: ((reason: RevertReason) => void) | null = null;
  onDenied: ((reason: DenyReason) => void) | null = null;
  /** Every misfire as it happens: the alien, and the named exception when the story forced it (the misfire log, QA). */
  onMisfire: ((gotId: string, forced: ForcedMisfire | null) => void) | null = null;
  /**
   * A story moment takes over the next transform press (Chapter 5's lift):
   * it gets the alien Ben asked for and returns true when it handled the press.
   */
  interceptTransform: ((wantedId: string) => boolean) | null = null;
  /** The watch answers even while Ben's own controls are off (THE DEEP DIVE: he rides, the watch still works). */
  worksWhileLocked = false;
  /** The swap that fixes a misfire is held back until this game time (the forced misfire's survival window). */
  private fixHeldUntil = 0;
  private nowMs = 0;

  constructor(
    unlocked: string[],
    private readonly player: Player,
    private readonly sequence: TransformSequence,
    private readonly fx: Fx,
    private readonly perfect: PerfectWindow,
    opts: { wrongTransformChance?: number } = {},
  ) {
    this.wrongOverride = opts.wrongTransformChance ?? null;
    this.omnitrix = new Omnitrix(this.configFor(), unlocked);
  }

  /** The Omnitrix rules for the active difficulty (Training overrides the misfire chance). */
  private configFor(): OmnitrixConfig {
    const d = activeDifficulty();
    return {
      transformDurationMs: d.transformDurationMs,
      cooldownMs: d.cooldownMs,
      warningMs: OMNITRIX_WARNING_MS,
      wrongTransformChance: this.wrongOverride ?? d.wrongTransformChance,
      swapEnabled: SWAP.enabled,
      swapCostMs: SWAP.costMs,
      swapLockoutMs: SWAP.lockoutMs,
      swapMisfireScale: MISFIRE.swapChanceScale,
      misfireFixCostScale: MISFIRE.fixCostScale,
      improviseBonusMs: MISFIRE.improviseBonusMs,
      // Aliens that don't always let go at timeout (Ghostfreak) say so in their definition.
      hesitation: (id) => (hasAlien(id) ? (getAlien(id).hesitate ?? null) : null),
      // A small form (Grey Matter) in a vent can't change back there.
      cramped: () => this.player.isAlien && !this.player.fitsFullSize,
    };
  }

  /** The difficulty changed mid-level: new timer, recharge and misfire chance (the running timer keeps its time). */
  applyDifficulty(): void {
    this.omnitrix.setConfig(this.configFor());
  }

  handleInput(c: Controls, now: number): void {
    this.nowMs = now;
    if (!this.acquired || this.player.dead || (!this.player.controlsEnabled && !this.worksWhileLocked)) return;
    if (c.dialPick !== null) {
      // Straight to a slot: number keys or the radial picker.
      const from = this.omnitrix.unlockedAliens.indexOf(this.omnitrix.selectedAlien ?? '');
      const id = this.omnitrix.unlockedAliens[c.dialPick];
      if (id !== undefined && this.omnitrix.isBlocked(id)) this.deny('stolen', now);
      else if (id !== undefined && c.dialPick !== from) {
        const dir: 1 | -1 = c.dialPick > from ? 1 : -1;
        for (const e of this.omnitrix.select(id)) {
          if (e.type === 'dial') EventBus.emit('omnitrix:dial', { selectedId: e.selectedId, index: e.index, count: e.count, direction: dir });
        }
        playSfx('uiMove', 1, 1 + c.dialPick * 0.05);
      }
    }
    if (c.dialPrev || c.dialNext) {
      const dir = c.dialNext ? 1 : -1;
      for (const e of this.omnitrix.cycle(dir)) {
        if (e.type === 'dial') EventBus.emit('omnitrix:dial', { selectedId: e.selectedId, index: e.index, count: e.count, direction: dir });
      }
      playSfx('uiMove', 1, dir > 0 ? 1.1 : 0.9);
    }
    if (!c.transform) return;
    if (this.sequence.busy) return;
    const wanted = this.omnitrix.selectedAlien;
    if (this.interceptTransform && wanted && this.interceptTransform(wanted)) return;
    if (this.jammed) {
      this.deny('jammed', now);
      return;
    }
    const state = this.omnitrix.state;
    const lead = Math.min(c.transformLeadMs, PERFECT_TRANSFORM.touchLeadCapMs);
    if (state === 'cooldown') this.deny('cooldown', now);
    else if (state === 'ready' && !this.omnitrix.canTransform()) this.deny('stolen', now);
    else if (state === 'ready') {
      // The very first transform is the tutorial moment; perfects start after it.
      this.pendingPerfect = this.transformations > 0 && this.perfect.check(now - lead, this.player.x, this.player.centerY) !== null;
      this.handle(this.omnitrix.transform({ allowMisfire: this.misfireAllowed() }));
      this.pendingPerfect = false;
    } else if (state === 'active') {
      // The forced misfire's survival window: the watch won't swap until it's over.
      if (now < this.fixHeldUntil) {
        this.deny('jammed', now);
        return;
      }
      const denial = this.omnitrix.swapDenial();
      if (denial === null) {
        this.pendingPerfect = this.perfect.check(now - lead, this.player.x, this.player.centerY) !== null;
        this.handle(this.omnitrix.swap({ allowMisfire: this.misfireAllowed() }));
        this.pendingPerfect = false;
      } else if (denial === 'lowTime' || denial === 'stolen' || denial === 'cramped') {
        this.deny(denial, now);
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
      blocked: o.blockedAliens,
    });
  }

  /** A new alien joins the dial (story unlock), slotted into dial order and selected. */
  unlock(alienId: string): void {
    this.omnitrix.unlock(alienId, allAliens().map((a) => a.id));
    for (const e of this.omnitrix.select(alienId)) {
      if (e.type === 'dial') EventBus.emit('omnitrix:dial', { selectedId: e.selectedId, index: e.index, count: e.count, direction: 1 });
    }
  }

  /** A story moment turns Ben into this alien: never a misfire, recharges the watch if needed. */
  forceInto(alienId: string): void {
    this.forcing = true;
    this.handle(this.omnitrix.forceInto(alienId));
    this.forcing = false;
  }

  /**
   * The story's one scripted misfire (Chapter 5's lift): Ben asked for
   * `wantedId` and the watch gives him `gotId`, with the full misfire gag.
   * `exception` must name an entry in FORCED_MISFIRES; anything else is
   * refused. The fix swap is held back for `holdFixMs`.
   */
  forceMisfire(exception: ForcedMisfire, wantedId: string, gotId: string, holdFixMs: number): boolean {
    if (!isForcedMisfire(exception)) return false;
    const events = this.omnitrix.forceMisfire(wantedId, gotId, exception);
    if (!events.some((e) => e.type === 'forcedMisfire')) return false;
    this.fixHeldUntil = this.nowMs + holdFixMs;
    this.forcing = true;
    this.handle(events, exception);
    this.forcing = false;
    return true;
  }

  /** The forced misfire's fix swap is held back right now. */
  get fixHeld(): boolean {
    return this.nowMs < this.fixHeldUntil;
  }

  /** Time left (ms) before the forced misfire's fix swap comes back, 0 when it's free. */
  fixHeldFor(now: number): number {
    return Math.max(0, this.fixHeldUntil - now);
  }

  /** Kevin stole an alien's DNA (it can't be used until he gives it back), or gave it back. */
  steal(alienId: string, stolen: boolean): void {
    for (const e of this.omnitrix.setBlocked(alienId, stolen)) {
      if (e.type === 'dial') EventBus.emit('omnitrix:dial', { selectedId: e.selectedId, index: e.index, count: e.count, direction: 1 });
    }
    EventBus.emit('omnitrix:stolen', { alienId, stolen });
  }

  /** Something drank Ben's alien time (Kevin's absorb). */
  drain(ms: number): void {
    this.omnitrix.drain(ms);
  }

  /** The story recharges the watch at once (so Ben always has something to switch to). */
  recharge(): void {
    this.handle(this.omnitrix.recharge());
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

  private handle(events: OmnitrixEvent[], forced: ForcedMisfire | null = null): void {
    for (const e of events) {
      switch (e.type) {
        case 'transformed': {
          this.transformations++;
          const alien = getAlien(e.alienId);
          const perfect = this.pendingPerfect;
          const misfire = e.wrong ? this.misfire(e.requestedId, e.alienId, forced) : undefined;
          this.sequence.transform(alien, { first: this.transformations === 1, perfect, misfire });
          if (perfect) this.rewardPerfect();
          this.onTransformed?.(e.alienId, this.transformations === 1);
          break;
        }
        case 'swapped': {
          if (!this.forcing) this.swaps++;
          const perfect = this.pendingPerfect;
          const misfire = e.wrong ? this.misfire(e.requestedId, e.alienId, forced) : undefined;
          this.sequence.swap(getAlien(e.alienId), { perfect, fix: e.fix, misfire });
          if (perfect) this.rewardPerfect();
          this.onSwapped?.(e.alienId);
          break;
        }
        case 'warning':
          playSfx(e.secondsLeft <= 2 ? 'beepFinal' : 'beep', 1, e.secondsLeft <= 2 ? 1.1 : 1);
          EventBus.emit('omnitrix:warning', { secondsLeft: e.secondsLeft });
          break;
        case 'hesitating': {
          // Something in the watch doesn't want to let go.
          const lines = hasAlien(e.alienId) ? (getAlien(e.alienId).hesitate?.lines ?? []) : [];
          const line = lines[Math.floor(Math.random() * lines.length)] ?? '...';
          playSfx('omnitrixGlitch', 0.6, 0.7);
          EventBus.emit('omnitrix:hesitating', { alienId: e.alienId, ms: e.ms });
          EventBus.emit('hud:whisper', { text: line, color: hasAlien(e.alienId) ? getAlien(e.alienId).theme.color : PALETTE.white });
          break;
        }
        case 'cramped':
          playSfx('beepFinal', 0.8, 0.8);
          EventBus.emit('omnitrix:denied', { reason: 'cramped' });
          this.onDenied?.('cramped');
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

  private misfire(wantedId: string, gotId: string, forced: ForcedMisfire | null): { wantedId: string; line: string } {
    this.misfires++;
    this.onMisfire?.(gotId, forced);
    return { wantedId, line: this.quips.line(wantedId, gotId) };
  }

  private rewardPerfect(): void {
    this.perfects++;
    this.omnitrix.extend(PERFECT_TRANSFORM.bonusMs);
    EventBus.emit('omnitrix:perfect', { bonusMs: PERFECT_TRANSFORM.bonusMs, count: this.perfects });
  }

  private deny(reason: DenyReason, now: number): void {
    if (now < this.deniedFlashUntil) return;
    this.deniedFlashUntil = now + 250;
    playSfx(reason === 'jammed' ? 'jammed' : 'denied');
    if (reason === 'jammed') this.fx.burst('blue', this.player.x, this.player.centerY, 6);
    EventBus.emit('omnitrix:denied', { reason });
    this.onDenied?.(reason);
  }
}
