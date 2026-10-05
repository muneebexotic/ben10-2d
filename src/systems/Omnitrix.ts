import type { Rng } from './Rng';

/**
 * Pure Omnitrix state machine: dial, transform timer, cooldown, unlocks and
 * wrong-transform rolls. No Phaser, no rendering; callers translate the
 * returned events into effects.
 */

export type OmnitrixState = 'ready' | 'active' | 'cooldown';
export type RevertReason = 'timeout' | 'damage' | 'jammed' | 'forced';

export interface OmnitrixConfig {
  transformDurationMs: number;
  cooldownMs: number;
  warningMs: number;
  wrongTransformChance: number;
  /** Alien time a mid-transformation swap costs (0 or missing: free). */
  swapCostMs?: number;
  /** Minimum time after a transform or swap before the next swap. */
  swapLockoutMs?: number;
  /** Swapping is off unless this is true. */
  swapEnabled?: boolean;
  /** Swaps misfire at this fraction of `wrongTransformChance` (missing: the full chance). */
  swapMisfireScale?: number;
  /** After a misfire, the next swap costs this fraction of `swapCostMs` and can't misfire (missing: full cost). */
  misfireFixCostScale?: number;
  /** Alien time refunded by the first KO as a misfired alien (missing: none). */
  improviseBonusMs?: number;
}

/** Options for one transform or swap. */
export interface RollOptions {
  /** False during boss intros and story beats: the watch behaves. Default true. */
  allowMisfire?: boolean;
}

/** The alien the Omnitrix gave by mistake, while it is still the active one. */
export interface MisfireState {
  wantedId: string;
  gotId: string;
  /** The improvise bonus was already paid for this misfire. */
  improvised: boolean;
}

export type SwapDenial = 'off' | 'notActive' | 'sameAlien' | 'lockout' | 'lowTime' | 'stolen';

export type OmnitrixEvent =
  | { type: 'transformed'; alienId: string; requestedId: string; wrong: boolean }
  /** `fix`: the half-price, misfire-proof swap the Omnitrix owed after a misfire. */
  | { type: 'swapped'; fromId: string; alienId: string; requestedId: string; wrong: boolean; costMs: number; fix: boolean }
  | { type: 'warning'; secondsLeft: number }
  | { type: 'reverted'; alienId: string; reason: RevertReason }
  | { type: 'ready' }
  | { type: 'dial'; selectedId: string; index: number; count: number }
  | { type: 'unlocked'; alienId: string };

export type { Rng };

export class Omnitrix {
  private _state: OmnitrixState = 'ready';
  private readonly unlocked: string[] = [];
  private selectedIndex = 0;
  private activeAlien: string | null = null;
  private remainingMs = 0;
  private cooldownLeftMs = 0;
  private lastWarningSecond = -1;
  private sinceChangeMs = 0;
  private frozen = false;
  private fixOwed = false;
  private misfire: MisfireState | null = null;
  /** Aliens on the dial that can't be used right now (Kevin stole their DNA). */
  private readonly blocked = new Set<string>();

  constructor(
    private config: OmnitrixConfig,
    unlocked: readonly string[] = [],
    private readonly rng: Rng = Math.random,
  ) {
    for (const id of unlocked) this.unlock(id);
  }

  get state(): OmnitrixState {
    return this._state;
  }

  get unlockedAliens(): readonly string[] {
    return this.unlocked;
  }

  get selectedAlien(): string | null {
    return this.unlocked[this.selectedIndex] ?? null;
  }

  get activeAlienId(): string | null {
    return this.activeAlien;
  }

  get timeRemainingMs(): number {
    return this._state === 'active' ? this.remainingMs : 0;
  }

  get cooldownRemainingMs(): number {
    return this._state === 'cooldown' ? this.cooldownLeftMs : 0;
  }

  /** 1 at the moment of transforming, 0 at timeout. */
  get timeRatio(): number {
    if (this._state !== 'active') return 0;
    return clamp01(this.remainingMs / this.config.transformDurationMs);
  }

  /** 0 when cooldown starts, 1 when the watch is ready again. */
  get cooldownProgress(): number {
    if (this._state === 'ready') return 1;
    if (this._state !== 'cooldown') return 0;
    if (this.config.cooldownMs <= 0) return 1;
    return clamp01(1 - this.cooldownLeftMs / this.config.cooldownMs);
  }

  get isWarning(): boolean {
    return this._state === 'active' && this.remainingMs <= this.config.warningMs;
  }

  /** The active alien is a misfire (and which one was wanted), or null. */
  get misfireState(): Readonly<MisfireState> | null {
    return this.misfire;
  }

  /** The next swap is the half-price, misfire-proof fix. */
  get fixSwapOwed(): boolean {
    return this.fixOwed && this._state === 'active';
  }

  /** Chance that a transform (or a swap) right now lands on the wrong alien. */
  misfireChance(kind: 'transform' | 'swap'): number {
    const base = Math.max(0, this.config.wrongTransformChance);
    if (kind === 'transform') return base;
    if (this.fixOwed) return 0;
    return base * (this.config.swapMisfireScale ?? 1);
  }

  /** Alien time the next swap would cost. */
  get swapCostMs(): number {
    if (this.frozen) return 0;
    const cost = this.config.swapCostMs ?? 0;
    return this.fixOwed ? Math.round(cost * (this.config.misfireFixCostScale ?? 1)) : cost;
  }

  get settings(): Readonly<OmnitrixConfig> {
    return this.config;
  }

  setConfig(config: OmnitrixConfig): void {
    this.config = config;
  }

  /** Training: the alien timer stops draining (and swaps are free). */
  setTimerFrozen(frozen: boolean): void {
    this.frozen = frozen;
  }

  get timerFrozen(): boolean {
    return this.frozen;
  }

  /** Aliens whose DNA is gone for now: still on the dial, but the watch won't turn into them. */
  get blockedAliens(): readonly string[] {
    return [...this.blocked];
  }

  isBlocked(alienId: string): boolean {
    return this.blocked.has(alienId);
  }

  /**
   * Takes an alien off the menu (or gives it back). The dial steps off a
   * blocked alien, and misfires never land on one.
   */
  setBlocked(alienId: string, blocked: boolean): OmnitrixEvent[] {
    if (!this.unlocked.includes(alienId) || this.blocked.has(alienId) === blocked) return [];
    if (blocked) this.blocked.add(alienId);
    else this.blocked.delete(alienId);
    if (blocked && this.selectedAlien === alienId) return this.cycle(1);
    return [];
  }

  isUnlocked(alienId: string): boolean {
    return this.unlocked.includes(alienId);
  }

  /**
   * Adds an alien to the dial. With `order` (every alien in dial order) it
   * slots in where it belongs instead of at the end; the selection stays on
   * the same alien.
   */
  unlock(alienId: string, order?: readonly string[]): OmnitrixEvent[] {
    if (this.unlocked.includes(alienId)) return [];
    const selected = this.selectedAlien;
    this.unlocked.push(alienId);
    if (order) {
      const rank = (id: string) => {
        const i = order.indexOf(id);
        return i < 0 ? order.length : i;
      };
      this.unlocked.sort((a, b) => rank(a) - rank(b));
      if (selected !== null) this.selectedIndex = this.unlocked.indexOf(selected);
    }
    return [{ type: 'unlocked', alienId }];
  }

  /** The watch charges up at once (a story moment: new DNA floods it). */
  recharge(): OmnitrixEvent[] {
    if (this._state !== 'cooldown') return [];
    return this.finishCooldown();
  }

  /**
   * A story moment turns Ben into a specific alien: never a misfire, never
   * refused. From the ready state it is a normal transformation; while already
   * transformed it swaps for free.
   */
  forceInto(alienId: string): OmnitrixEvent[] {
    if (!this.unlocked.includes(alienId) || this.blocked.has(alienId)) return [];
    const events: OmnitrixEvent[] = [];
    if (this._state === 'cooldown') events.push(...this.finishCooldown());
    events.push(...this.select(alienId));
    if (this._state === 'ready') {
      events.push(...this.transform({ allowMisfire: false }));
      return events;
    }
    const fromId = this.activeAlien;
    if (fromId === null || fromId === alienId) return events;
    this.activeAlien = alienId;
    this.sinceChangeMs = 0;
    this.lastWarningSecond = -1;
    this.remainingMs = Math.max(this.remainingMs, this.config.transformDurationMs);
    this.setMisfire(null, alienId);
    events.push({ type: 'swapped', fromId, alienId, requestedId: alienId, wrong: false, costMs: 0, fix: false });
    return events;
  }

  canTransform(): boolean {
    const selected = this.selectedAlien;
    return this._state === 'ready' && selected !== null && !this.blocked.has(selected);
  }

  /** Turns the dial (skipping blocked aliens). Allowed in any state so the player can line up the next alien during cooldown. */
  cycle(direction: 1 | -1): OmnitrixEvent[] {
    const count = this.unlocked.length;
    if (count === 0) return [];
    for (let step = 0; step < count; step++) {
      this.selectedIndex = (this.selectedIndex + direction + count) % count;
      if (!this.blocked.has(this.unlocked[this.selectedIndex])) break;
    }
    return [this.dialEvent()];
  }

  select(alienId: string): OmnitrixEvent[] {
    const index = this.unlocked.indexOf(alienId);
    if (index < 0 || this.blocked.has(alienId)) return [];
    this.selectedIndex = index;
    return [this.dialEvent()];
  }

  transform(opts: RollOptions = {}): OmnitrixEvent[] {
    const requestedId = this.selectedAlien;
    if (!this.canTransform() || requestedId === null) return [];

    const chance = opts.allowMisfire === false ? 0 : this.misfireChance('transform');
    const alienId = this.rollAlien(requestedId, null, chance);
    const wrong = alienId !== requestedId;
    this._state = 'active';
    this.activeAlien = alienId;
    this.remainingMs = this.config.transformDurationMs;
    this.lastWarningSecond = -1;
    this.sinceChangeMs = 0;
    this.setMisfire(wrong ? requestedId : null, alienId);
    return [{ type: 'transformed', alienId, requestedId, wrong }];
  }

  /** Why a swap would be refused right now, or null if it is allowed. */
  swapDenial(): SwapDenial | null {
    if (!this.config.swapEnabled) return 'off';
    if (this._state !== 'active' || this.activeAlien === null) return 'notActive';
    const selected = this.selectedAlien;
    if (selected === null || selected === this.activeAlien) return 'sameAlien';
    if (this.blocked.has(selected)) return 'stolen';
    if (this.sinceChangeMs < (this.config.swapLockoutMs ?? 0)) return 'lockout';
    if (!this.frozen && this.remainingMs <= this.swapCostMs) return 'lowTime';
    return null;
  }

  canSwap(): boolean {
    return this.swapDenial() === null;
  }

  /**
   * Swaps the active alien for the one on the dial without reverting. Costs
   * alien time; the cooldown is untouched. Misfires (at a reduced chance)
   * never land on the alien you are swapping away from, and the swap right
   * after a misfire is a cheaper, guaranteed fix.
   */
  swap(opts: RollOptions = {}): OmnitrixEvent[] {
    const requestedId = this.selectedAlien;
    const fromId = this.activeAlien;
    if (!this.canSwap() || requestedId === null || fromId === null) return [];
    const fix = this.fixOwed;
    const costMs = this.swapCostMs;
    const chance = opts.allowMisfire === false ? 0 : this.misfireChance('swap');
    const alienId = this.rollAlien(requestedId, fromId, chance);
    const wrong = alienId !== requestedId;
    this.remainingMs -= costMs;
    this.activeAlien = alienId;
    this.sinceChangeMs = 0;
    this.lastWarningSecond = -1;
    this.setMisfire(wrong ? requestedId : null, alienId);
    return [{ type: 'swapped', fromId, alienId, requestedId, wrong, costMs, fix }];
  }

  /**
   * The misfired alien landed a KO: rolling with it pays out once per misfire.
   * Returns the alien time added (0 if there was nothing to pay).
   */
  improvise(): number {
    const m = this.misfire;
    const bonus = this.config.improviseBonusMs ?? 0;
    if (!m || m.improvised || this._state !== 'active' || this.activeAlien !== m.gotId || bonus <= 0) return 0;
    m.improvised = true;
    this.extend(bonus);
    return bonus;
  }

  /** Adds alien time (the perfect transform reward). The ring can sit above full until it drains back. */
  extend(ms: number): void {
    if (this._state !== 'active' || ms <= 0) return;
    this.remainingMs += ms;
    if (this.remainingMs > this.config.warningMs) this.lastWarningSecond = -1;
  }

  /** Takes alien time away (Kevin drinking it). Never below one frame: running out still goes through the timeout. */
  drain(ms: number): void {
    if (this._state !== 'active' || ms <= 0 || this.frozen) return;
    this.remainingMs = Math.max(1, this.remainingMs - ms);
  }

  /** Ends the transformation early (heavy damage, jammer field) and starts the full cooldown. */
  revert(reason: RevertReason): OmnitrixEvent[] {
    if (this._state !== 'active' || this.activeAlien === null) return [];
    return this.enterCooldown(reason, 0);
  }

  update(dtMs: number): OmnitrixEvent[] {
    if (dtMs <= 0) return [];
    const events: OmnitrixEvent[] = [];

    if (this._state === 'active') {
      this.sinceChangeMs += dtMs;
      if (this.frozen) return events;
      this.remainingMs -= dtMs;
      if (this.remainingMs <= 0) {
        const overflow = -this.remainingMs;
        events.push(...this.enterCooldown('timeout', overflow));
      } else if (this.remainingMs <= this.config.warningMs) {
        const secondsLeft = Math.ceil(this.remainingMs / 1000);
        if (secondsLeft !== this.lastWarningSecond) {
          this.lastWarningSecond = secondsLeft;
          events.push({ type: 'warning', secondsLeft });
        }
      }
    } else if (this._state === 'cooldown') {
      this.cooldownLeftMs -= dtMs;
      if (this.cooldownLeftMs <= 0) events.push(...this.finishCooldown());
    }

    return events;
  }

  /** Back to a fresh, ready watch (checkpoint respawn). Keeps unlocks and dial position. */
  reset(): void {
    this._state = 'ready';
    this.activeAlien = null;
    this.remainingMs = 0;
    this.cooldownLeftMs = 0;
    this.lastWarningSecond = -1;
    this.setMisfire(null, null);
  }

  /** Remembers a misfire (the fix swap is owed) or clears it. */
  private setMisfire(wantedId: string | null, gotId: string | null): void {
    this.misfire = wantedId !== null && gotId !== null ? { wantedId, gotId, improvised: false } : null;
    this.fixOwed = this.misfire !== null;
  }

  private enterCooldown(reason: RevertReason, overflowMs: number): OmnitrixEvent[] {
    const alienId = this.activeAlien ?? '';
    this.setMisfire(null, null);
    this.activeAlien = null;
    this.remainingMs = 0;
    this._state = 'cooldown';
    this.cooldownLeftMs = this.config.cooldownMs - overflowMs;
    const events: OmnitrixEvent[] = [{ type: 'reverted', alienId, reason }];
    if (this.cooldownLeftMs <= 0) events.push(...this.finishCooldown());
    return events;
  }

  private finishCooldown(): OmnitrixEvent[] {
    this._state = 'ready';
    this.cooldownLeftMs = 0;
    return [{ type: 'ready' }];
  }

  /** The requested alien, or (with probability `chance`) a random other one that isn't `exclude`. */
  private rollAlien(requestedId: string, exclude: string | null, chance: number): string {
    const others = this.unlocked.filter((id) => id !== requestedId && id !== exclude && !this.blocked.has(id));
    if (others.length === 0 || chance <= 0) return requestedId;
    if (this.rng() >= chance) return requestedId;
    const pick = Math.min(others.length - 1, Math.floor(this.rng() * others.length));
    return others[pick];
  }

  private dialEvent(): OmnitrixEvent {
    return {
      type: 'dial',
      selectedId: this.unlocked[this.selectedIndex],
      index: this.selectedIndex,
      count: this.unlocked.length,
    };
  }
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
