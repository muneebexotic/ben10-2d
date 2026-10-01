/**
 * Damage readout for the Training dummy: total, hit count and damage per
 * second over the current burst of hits. A pause ends the burst.
 */
export class DpsMeter {
  private start = 0;
  private last = -Infinity;
  private sum = 0;
  private count = 0;

  constructor(private readonly idleResetMs: number) {}

  add(now: number, damage: number): void {
    if (now - this.last > this.idleResetMs) this.reset(now);
    this.sum += damage;
    this.count++;
    this.last = now;
  }

  /** Damage per second since the burst started (at least one second, so a single hit isn't infinite). */
  dps(): number {
    if (this.count === 0) return 0;
    const seconds = Math.max(1, (this.last - this.start) / 1000);
    return this.sum / seconds;
  }

  get total(): number {
    return this.sum;
  }

  get hits(): number {
    return this.count;
  }

  /** True while the burst is still going (hit recently). */
  active(now: number): boolean {
    return this.count > 0 && now - this.last <= this.idleResetMs;
  }

  reset(now = 0): void {
    this.start = now;
    this.last = now;
    this.sum = 0;
    this.count = 0;
  }
}

/** Damage numbers: whole numbers stay whole, fractions keep up to two decimals ("2.5", "0.15"). */
export function formatDamage(n: number): string {
  if (n >= 10) return String(Math.round(n));
  return String(Math.round(n * 100) / 100);
}
