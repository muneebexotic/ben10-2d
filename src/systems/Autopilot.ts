import type { Controls } from './InputMap';
import type { Driver } from './autobench/plan';

interface Held {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
  dialPrev: boolean;
  dialNext: boolean;
  transform: boolean;
  confirm: boolean;
}

const NONE: Held = { left: false, right: false, jump: false, attack: false, special: false, dialPrev: false, dialNext: false, transform: false, confirm: false };

/** Brawl cycle (ms), the same moves as `npm run bench`'s brawler: attack, jump, attack, special, attack, dial, transform. */
const BRAWL_MS = 2250;
const ADVANCE_MS = 1070;

/** What the scripted player holds `t` ms into its script (pure, for tests). */
export function scriptAt(driver: Driver, t: number, skipUntilMs: number): Held {
  const h: Held = { ...NONE };
  // Skip cinematics and dialogue early on: a confirm tap every 400 ms.
  if (t < skipUntilMs && t % 400 < 60) h.confirm = true;
  if (driver === 'brawl' || driver === 'brawlNoSwap') {
    const cycle = Math.floor(t / BRAWL_MS);
    const c = t % BRAWL_MS;
    const right = cycle % 2 === 0;
    if (c < 1380) {
      h.right = right;
      h.left = !right;
    }
    if (c < 700) h.attack = true;
    else if (c < 880) h.jump = true;
    else if (c < 1380) h.attack = true;
    else if (c < 1730) h.special = true;
    else if (c < 2130) h.attack = true;
    else if (driver === 'brawl' && c < 2190) {
      if (cycle % 3 === 0) h.dialPrev = true;
      else h.dialNext = true;
    } else if (driver === 'brawl') h.transform = true;
  } else if (driver === 'advance') {
    h.right = true;
    const c = t % ADVANCE_MS;
    if (c < 500) h.attack = true;
    else if (c < 760) h.jump = true;
    else if (c >= 1010) h.transform = true;
  }
  return h;
}

/**
 * The autobench's scripted player: merged into the Controls the game reads
 * every frame (after keyboard and touch), so gameplay can't tell it apart.
 */
class Autopilot {
  private driver: Driver = 'none';
  private startedAt = 0;
  private skipUntilMs = 0;
  private prev: Held = { ...NONE };

  get active(): boolean {
    return this.driver !== 'none';
  }

  start(driver: Driver, skipUntilMs: number, now = performance.now()): void {
    this.driver = driver;
    this.startedAt = now;
    this.skipUntilMs = skipUntilMs;
    this.prev = { ...NONE };
  }

  stop(): void {
    this.driver = 'none';
    this.prev = { ...NONE };
  }

  merge(s: Controls, now = performance.now()): void {
    if (this.driver === 'none') return;
    const h = scriptAt(this.driver, now - this.startedAt, this.skipUntilMs);
    const p = this.prev;
    s.left ||= h.left;
    s.right ||= h.right;
    s.jumpPressed ||= h.jump && !p.jump;
    s.jumpHeld ||= h.jump;
    s.attackPressed ||= h.attack && !p.attack;
    s.attackHeld ||= h.attack;
    const specialPressed = h.special && !p.special;
    s.specialPressed ||= specialPressed;
    s.specialHeld ||= h.special;
    s.specialReleased ||= p.special && !h.special;
    s.dialPrev ||= h.dialPrev && !p.dialPrev;
    s.dialNext ||= h.dialNext && !p.dialNext;
    s.transform ||= h.transform && !p.transform;
    const confirm = h.confirm && !p.confirm;
    s.confirm ||= confirm;
    s.anyPressed ||= confirm || s.jumpPressed || s.attackPressed || specialPressed || s.transform;
    this.prev = h;
  }
}

export const autopilot = new Autopilot();
