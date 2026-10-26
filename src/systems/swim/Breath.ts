import { BREATH } from '../../config/swim';

export type BreathEvent = 'low' | 'empty' | 'choke' | 'refilled' | null;

/**
 * Air under water (pure): it runs down while the head is under, refills fast
 * at the surface or in an air pocket, and once it's out the swimmer takes a
 * hit every couple of seconds until it breathes. Forms that don't need air
 * (Infinity) never run out.
 */
export class Breath {
  private airMs: number;
  private chokeMs = 0;
  private warned = false;

  constructor(private maxMs: number) {
    this.airMs = maxMs;
  }

  get ratio(): number {
    return Number.isFinite(this.maxMs) ? Math.max(0, this.airMs / this.maxMs) : 1;
  }

  get needsAir(): boolean {
    return Number.isFinite(this.maxMs);
  }

  get empty(): boolean {
    return this.needsAir && this.airMs <= 0;
  }

  /** A new form (another lung size): keeps the same fraction of air. */
  setMax(maxMs: number): void {
    const r = this.ratio;
    this.maxMs = maxMs;
    if (Number.isFinite(maxMs)) this.airMs = maxMs * r;
  }

  fill(): void {
    this.airMs = this.maxMs;
    this.chokeMs = 0;
    this.warned = false;
  }

  update(dtMs: number, underwater: boolean): BreathEvent {
    if (!this.needsAir) return null;
    if (!underwater) {
      if (this.airMs >= this.maxMs) return null;
      this.airMs = Math.min(this.maxMs, this.airMs + (this.maxMs / BREATH.refillMs) * dtMs);
      this.chokeMs = 0;
      if (this.airMs >= this.maxMs) {
        this.warned = false;
        return 'refilled';
      }
      return null;
    }
    if (this.airMs > 0) {
      this.airMs = Math.max(0, this.airMs - dtMs);
      if (this.airMs <= 0) {
        this.chokeMs = BREATH.damageEveryMs;
        return 'empty';
      }
      if (!this.warned && this.ratio < BREATH.lowAt) {
        this.warned = true;
        return 'low';
      }
      return null;
    }
    this.chokeMs -= dtMs;
    if (this.chokeMs <= 0) {
      this.chokeMs += BREATH.damageEveryMs;
      return 'choke';
    }
    return null;
  }
}
