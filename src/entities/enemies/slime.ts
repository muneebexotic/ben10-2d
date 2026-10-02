import { COMBAT } from '../../config/combat';
import type { Hit } from '../types';

const S = COMBAT.slime;

/**
 * Stinkfly's goo on an enemy. Every glob slows it for a while; enough globs
 * close together stick it in place. Pure, so the rules are unit tested.
 */
export class SlimeStatus {
  private slowLeft = 0;
  private stuckLeft = 0;
  private readonly globs: number[] = [];

  /**
   * A hit landed at game time `now`. Returns 'stuck' when this glob glued the
   * target in place, 'slowed' when it only slowed it, or null for no goo.
   * `stickAt` overrides how many globs it takes (fragile wings give way sooner).
   */
  apply(hit: Hit, now: number, stickAt: number = S.stickAt): 'slowed' | 'stuck' | null {
    const ms = hit.slowMs ?? 0;
    if (ms <= 0) return null;
    this.slowLeft = Math.max(this.slowLeft, ms);
    // Whiffs of gas slow but never stack; real globs do.
    if (ms < S.stackMinMs || this.stuckLeft > 0) return this.stuckLeft > 0 ? 'stuck' : 'slowed';
    this.globs.push(now);
    while (this.globs.length > 0 && now - this.globs[0] > S.stackWindowMs) this.globs.shift();
    if (this.globs.length < stickAt) return 'slowed';
    this.globs.length = 0;
    this.stuckLeft = S.stuckMs;
    this.slowLeft = Math.max(this.slowLeft, S.stuckMs);
    return 'stuck';
  }

  update(dtMs: number): void {
    this.slowLeft = Math.max(0, this.slowLeft - dtMs);
    this.stuckLeft = Math.max(0, this.stuckLeft - dtMs);
  }

  get stuck(): boolean {
    return this.stuckLeft > 0;
  }

  get slowed(): boolean {
    return this.slowLeft > 0;
  }

  /** Globs on it right now (toward sticking). */
  get stacks(): number {
    return this.globs.length;
  }

  /** Speed multiplier for movement and attack timers. */
  get factor(): number {
    if (this.stuckLeft > 0) return S.stuckFactor;
    return this.slowLeft > 0 ? S.slowFactor : 1;
  }

  clear(): void {
    this.slowLeft = 0;
    this.stuckLeft = 0;
    this.globs.length = 0;
  }
}
