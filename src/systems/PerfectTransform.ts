/**
 * Timing for perfect transforms. Plain TypeScript so it can be unit tested.
 *
 * Attackers register the moment their shot or attack lands. Telegraphed
 * attacks register ahead of time (the fire time is known when the aim locks)
 * and cancel if interrupted, so a press slightly *before* the shot counts too.
 */
export interface PerfectConfig {
  earlyMs: number;
  lateMs: number;
  range: number;
}

export interface Threat {
  key: object;
  at: number;
  x: number;
  y: number;
  /** Max distance from Ben, or Infinity for arena-wide attacks. */
  radius: number;
}

export class PerfectWindow {
  private readonly threats: Threat[] = [];

  constructor(private readonly config: PerfectConfig) {}

  get count(): number {
    return this.threats.length;
  }

  /** An attack from `key` lands at game time `at`. Re-registering the same key replaces it. */
  register(key: object, at: number, x: number, y: number, radius: number = this.config.range): void {
    this.cancel(key);
    this.threats.push({ key, at, x, y, radius });
  }

  /** The attacker was interrupted (stunned, killed) before its attack landed. */
  cancel(key: object): void {
    const i = this.threats.findIndex((t) => t.key === key);
    if (i >= 0) this.threats.splice(i, 1);
  }

  /**
   * Is a transform pressed at `now` with Ben at (px, py) perfect? Returns the
   * matching threat (closest in time) and consumes it, so one shot can only
   * ever earn one perfect.
   */
  check(now: number, px: number, py: number): Threat | null {
    this.prune(now);
    let best: Threat | null = null;
    let bestGap = Infinity;
    for (const t of this.threats) {
      const gap = t.at - now;
      if (gap > this.config.earlyMs || gap < -this.config.lateMs) continue;
      if (Number.isFinite(t.radius) && (t.x - px) ** 2 + (t.y - py) ** 2 > t.radius ** 2) continue;
      if (Math.abs(gap) < bestGap) {
        bestGap = Math.abs(gap);
        best = t;
      }
    }
    if (best) this.cancel(best.key);
    return best;
  }

  /** Forgets attacks too old to matter. */
  prune(now: number): void {
    for (let i = this.threats.length - 1; i >= 0; i--) {
      if (this.threats[i].at < now - this.config.lateMs) this.threats.splice(i, 1);
    }
  }

  clear(): void {
    this.threats.length = 0;
  }
}
