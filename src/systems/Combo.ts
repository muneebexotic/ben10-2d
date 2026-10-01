/**
 * Consecutive-hit counter. Taking damage or waiting too long resets it.
 * It also remembers which forms landed hits: switching aliens mid-combo
 * makes a tag team.
 */
export class ComboCounter {
  private _count = 0;
  private _best = 0;
  private timerMs = 0;
  private readonly forms: string[] = [];
  private joined = false;

  constructor(private readonly windowMs: number) {}

  get count(): number {
    return this._count;
  }

  get best(): number {
    return this._best;
  }

  /** 1 right after a hit, 0 when the combo is about to drop. */
  get timeLeftRatio(): number {
    return this._count === 0 ? 0 : Math.max(0, this.timerMs / this.windowMs);
  }

  /** Forms (aliens, or human Ben) that landed hits in the current combo, in order. */
  get contributors(): readonly string[] {
    return this.forms;
  }

  /** True when the last hit brought a new form into the combo. */
  get newContributor(): boolean {
    return this.joined;
  }

  hit(formId?: string): number {
    this._count += 1;
    this.timerMs = this.windowMs;
    if (this._count > this._best) this._best = this._count;
    this.joined = formId !== undefined && !this.forms.includes(formId);
    if (this.joined && formId !== undefined) this.forms.push(formId);
    return this._count;
  }

  /** Returns the count that was lost (0 if there was no combo). */
  break(): number {
    const lost = this._count;
    this._count = 0;
    this.timerMs = 0;
    this.forms.length = 0;
    this.joined = false;
    return lost;
  }

  /** Returns the dropped count when the window expires this frame, otherwise 0. */
  update(dtMs: number): number {
    if (this._count === 0) return 0;
    this.timerMs -= dtMs;
    if (this.timerMs <= 0) return this.break();
    return 0;
  }
}
