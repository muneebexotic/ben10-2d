import { COPY_RULES, RELIANCE } from '../../../config/kevin';

/** Human Ben: Kevin learns nothing from punches. */
export const HUMAN = 'ben';

export type CopyLevel = 0 | 1 | 2 | 3;

export interface RelianceTuning {
  perDamage: number;
  perSecond: number;
  decayPerSecond: number;
  levels: readonly [number, number, number];
  max: number;
}

/**
 * How much Ben leans on each alien in the Kevin fight: damage dealt as it and
 * time spent as it, decaying while he uses anything else. Reliance sets the
 * level of Kevin's copy of that alien (I, II, III). Pure, so it can be tested.
 */
export class Reliance {
  private readonly points = new Map<string, number>();
  private peak: CopyLevel = 0;

  constructor(private readonly t: RelianceTuning = RELIANCE) {}

  /** Ben dealt `damage` to Kevin as `form`. */
  hit(form: string, damage: number): void {
    if (form === HUMAN || damage <= 0) return;
    this.add(form, damage * this.t.perDamage);
  }

  /** Time passes with Ben as `form`: it gains, every other alien fades. */
  tick(dtMs: number, form: string): void {
    const s = dtMs / 1000;
    for (const [id, p] of this.points) {
      if (id !== form) this.points.set(id, Math.max(0, p - this.t.decayPerSecond * s));
    }
    if (form !== HUMAN) this.add(form, this.t.perSecond * s);
  }

  /** Kevin's absorb lunge caught Ben as `form`: his copy jumps a level. */
  bump(form: string): void {
    if (form === HUMAN) return;
    const lvl = this.level(form);
    const next = this.t.levels[Math.min(2, lvl)];
    this.points.set(form, Math.min(this.t.max, Math.max(this.value(form), next)));
    this.notePeak(form);
  }

  value(form: string): number {
    return this.points.get(form) ?? 0;
  }

  level(form: string): CopyLevel {
    return levelFor(this.value(form), this.t.levels);
  }

  /** The level his copy would have now: never below I once he copies it. */
  copyLevel(form: string): 1 | 2 | 3 {
    return Math.max(1, this.level(form)) as 1 | 2 | 3;
  }

  /** The highest copy level any alien reached this fight. */
  get peakLevel(): CopyLevel {
    return this.peak;
  }

  /** Aliens Ben has used, most relied on first. */
  ranked(): string[] {
    return [...this.points.entries()].filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }

  private add(form: string, amount: number): void {
    this.points.set(form, Math.min(this.t.max, this.value(form) + amount));
    this.notePeak(form);
  }

  private notePeak(form: string): void {
    const l = this.level(form);
    if (l > this.peak) this.peak = l;
  }
}

export function levelFor(points: number, levels: readonly [number, number, number]): CopyLevel {
  if (points >= levels[2]) return 3;
  if (points >= levels[1]) return 2;
  if (points >= levels[0]) return 1;
  return 0;
}

export type HitVerdict = 'normal' | 'resisted' | 'perfectCopy' | 'outOfSync';

export interface CopyHitState {
  /** Ben's form when the hit landed. */
  attacker: string;
  /** The alien Kevin is a copy of right now (null: plain Kevin). */
  copied: string | null;
  copyLevel: CopyLevel;
  /** Ms since Kevin became this copy. */
  sinceCopyMs: number;
  /** A different alien already caught this copy out of sync. */
  syncSpent: boolean;
  /** KEVIN 11: each alien hurts by how well he copied it. */
  chimera?: { levelOf(form: string): CopyLevel };
  /** KEVIN 11 is overloading. */
  unstable?: boolean;
}

/** How much one of Ben's hits counts against Kevin, and why. */
export function copyMultiplier(s: CopyHitState): { mult: number; verdict: HitVerdict } {
  const R = COPY_RULES;
  if (s.chimera) {
    const base = s.attacker === HUMAN ? 1 : R.chimeraMultiplier[s.chimera.levelOf(s.attacker)];
    const mult = base * (s.unstable ? R.unstableMultiplier : 1);
    return { mult, verdict: base < 1 ? 'resisted' : 'normal' };
  }
  if (s.copied === null || s.attacker === HUMAN) return { mult: 1, verdict: 'normal' };
  if (s.attacker === s.copied) {
    const lvl = Math.max(1, s.copyLevel) as 1 | 2 | 3;
    return { mult: R.sameResist[lvl - 1], verdict: lvl === 3 ? 'perfectCopy' : 'resisted' };
  }
  if (!s.syncSpent && s.sinceCopyMs <= R.outOfSyncMs) return { mult: R.outOfSyncMultiplier, verdict: 'outOfSync' };
  return { mult: 1, verdict: 'normal' };
}

/** The two aliens Ben relies on most (phase 2 switches between their copies). Falls back to `current`. */
export function topCopies(r: Reliance, current: string): string[] {
  const ranked = r.ranked();
  if (ranked.length === 0) return current === HUMAN ? [] : [current];
  return ranked.slice(0, 2);
}
