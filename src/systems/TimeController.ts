/**
 * Game-speed control for juice: hit-stop freezes gameplay for a few frames,
 * slow motion scales it. Pure logic; the Level applies the resulting scale.
 */
export class TimeController {
  private hitStopLeft = 0;
  private slowScale = 1;
  private slowLeft = 0;
  private slowRecoverMs = 0;
  private recoverLeft = 0;

  get frozen(): boolean {
    return this.hitStopLeft > 0;
  }

  /** Current gameplay speed multiplier (0 while frozen). */
  get scale(): number {
    if (this.hitStopLeft > 0) return 0;
    return this.currentSlow();
  }

  /** Speed ignoring hit-stop, for visuals that should keep moving during a freeze. */
  get visualScale(): number {
    return this.currentSlow();
  }

  hitStop(ms: number): void {
    this.hitStopLeft = Math.max(this.hitStopLeft, ms);
  }

  /** Slows the game to `scale` for `ms` (real time), then eases back over `recoverMs`. */
  slowMo(scale: number, ms: number, recoverMs = 250): void {
    this.slowScale = Math.min(this.slowLeft > 0 ? this.slowScale : 1, scale);
    this.slowLeft = Math.max(this.slowLeft, ms);
    this.slowRecoverMs = recoverMs;
    this.recoverLeft = 0;
  }

  clearSlowMo(): void {
    this.slowLeft = 0;
    this.recoverLeft = 0;
    this.slowScale = 1;
  }

  /** Advances by real elapsed time and returns the scaled gameplay delta. */
  step(realDtMs: number): number {
    if (this.hitStopLeft > 0) {
      this.hitStopLeft -= realDtMs;
      return 0;
    }
    const scaled = realDtMs * this.currentSlow();
    if (this.slowLeft > 0) {
      this.slowLeft -= realDtMs;
      if (this.slowLeft <= 0) this.recoverLeft = this.slowRecoverMs;
    } else if (this.recoverLeft > 0) {
      this.recoverLeft -= realDtMs;
      if (this.recoverLeft <= 0) this.slowScale = 1;
    }
    return scaled;
  }

  private currentSlow(): number {
    if (this.slowLeft > 0) return this.slowScale;
    if (this.recoverLeft > 0 && this.slowRecoverMs > 0) {
      const t = 1 - this.recoverLeft / this.slowRecoverMs;
      return this.slowScale + (1 - this.slowScale) * t;
    }
    return 1;
  }
}
