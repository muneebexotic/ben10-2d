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
}

export type SwapDenial = 'off' | 'notActive' | 'sameAlien' | 'lockout' | 'lowTime';

export type OmnitrixEvent =
  | { type: 'transformed'; alienId: string; requestedId: string; wrong: boolean }
  | { type: 'swapped'; fromId: string; alienId: string; requestedId: string; wrong: boolean; costMs: number }
  | { type: 'warning'; secondsLeft: number }
  | { type: 'reverted'; alienId: string; reason: RevertReason }
  | { type: 'ready' }
  | { type: 'dial'; selectedId: string; index: number; count: number }
  | { type: 'unlocked'; alienId: string };

export type Rng = () => number;

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

  isUnlocked(alienId: string): boolean {
    return this.unlocked.includes(alienId);
  }

  unlock(alienId: string): OmnitrixEvent[] {
    if (this.unlocked.includes(alienId)) return [];
    this.unlocked.push(alienId);
    return [{ type: 'unlocked', alienId }];
  }

  canTransform(): boolean {
    return this._state === 'ready' && this.unlocked.length > 0;
  }

  /** Turns the dial. Allowed in any state so the player can line up the next alien during cooldown. */
  cycle(direction: 1 | -1): OmnitrixEvent[] {
    const count = this.unlocked.length;
    if (count === 0) return [];
    this.selectedIndex = (this.selectedIndex + direction + count) % count;
    return [this.dialEvent()];
  }

  select(alienId: string): OmnitrixEvent[] {
    const index = this.unlocked.indexOf(alienId);
    if (index < 0) return [];
    this.selectedIndex = index;
    return [this.dialEvent()];
  }

  transform(): OmnitrixEvent[] {
    const requestedId = this.selectedAlien;
    if (!this.canTransform() || requestedId === null) return [];

    const alienId = this.rollAlien(requestedId, null);
    this._state = 'active';
    this.activeAlien = alienId;
    this.remainingMs = this.config.transformDurationMs;
    this.lastWarningSecond = -1;
    this.sinceChangeMs = 0;
    return [{ type: 'transformed', alienId, requestedId, wrong: alienId !== requestedId }];
  }

  /** Why a swap would be refused right now, or null if it is allowed. */
  swapDenial(): SwapDenial | null {
    if (!this.config.swapEnabled) return 'off';
    if (this._state !== 'active' || this.activeAlien === null) return 'notActive';
    const selected = this.selectedAlien;
    if (selected === null || selected === this.activeAlien) return 'sameAlien';
    if (this.sinceChangeMs < (this.config.swapLockoutMs ?? 0)) return 'lockout';
    if (!this.frozen && this.remainingMs <= (this.config.swapCostMs ?? 0)) return 'lowTime';
    return null;
  }

  canSwap(): boolean {
    return this.swapDenial() === null;
  }

  /**
   * Swaps the active alien for the one on the dial without reverting. Costs
   * alien time; the cooldown is untouched. Misfires never land on the alien
   * you are swapping away from.
   */
  swap(): OmnitrixEvent[] {
    const requestedId = this.selectedAlien;
    const fromId = this.activeAlien;
    if (!this.canSwap() || requestedId === null || fromId === null) return [];
    const alienId = this.rollAlien(requestedId, fromId);
    const costMs = this.frozen ? 0 : (this.config.swapCostMs ?? 0);
    this.remainingMs -= costMs;
    this.activeAlien = alienId;
    this.sinceChangeMs = 0;
    this.lastWarningSecond = -1;
    return [{ type: 'swapped', fromId, alienId, requestedId, wrong: alienId !== requestedId, costMs }];
  }

  /** Adds alien time (the perfect transform reward). The ring can sit above full until it drains back. */
  extend(ms: number): void {
    if (this._state !== 'active' || ms <= 0) return;
    this.remainingMs += ms;
    if (this.remainingMs > this.config.warningMs) this.lastWarningSecond = -1;
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
  }

  private enterCooldown(reason: RevertReason, overflowMs: number): OmnitrixEvent[] {
    const alienId = this.activeAlien ?? '';
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

  private rollAlien(requestedId: string, exclude: string | null): string {
    const others = this.unlocked.filter((id) => id !== requestedId && id !== exclude);
    if (others.length === 0 || this.config.wrongTransformChance <= 0) return requestedId;
    if (this.rng() >= this.config.wrongTransformChance) return requestedId;
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
