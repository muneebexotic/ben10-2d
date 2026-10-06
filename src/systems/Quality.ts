import { QUALITY } from '../config/quality';

/**
 * Watches the real frame rate and steps visual density down when a device
 * can't keep up (and back up when it can). Pure logic; Fx reads the result.
 */
export interface QualityConfig {
  particleLevels: readonly number[];
  windowMs: number;
  downgradeFps: number;
  upgradeFps: number;
  upgradeAfterMs: number;
  warmupMs: number;
  maxSampleMs: number;
}

export class QualityGovernor {
  private levelIndex = 0;
  private warmupLeft: number;
  private windowMs = 0;
  private windowFrames = 0;
  private goodMs = 0;

  constructor(private readonly config: QualityConfig) {
    this.warmupLeft = config.warmupMs;
  }

  /** 0 is best. */
  get level(): number {
    return this.levelIndex;
  }

  get particleScale(): number {
    return this.config.particleLevels[this.levelIndex];
  }

  get lowest(): boolean {
    return this.levelIndex === this.config.particleLevels.length - 1;
  }

  /** Jumps to a level (0 is best) and starts over: the autobench starts every run at Q0, and governor=0 pins it there. */
  setLevel(level: number): void {
    this.levelIndex = Math.max(0, Math.min(this.config.particleLevels.length - 1, Math.round(level)));
    this.goodMs = 0;
    this.reset();
  }

  /** Call after a scene change: the next frames are warm-up and don't count. */
  reset(): void {
    this.warmupLeft = this.config.warmupMs;
    this.windowMs = 0;
    this.windowFrames = 0;
  }

  /** Feed one real frame time. Returns true when the quality level changed. */
  sample(frameMs: number): boolean {
    if (frameMs <= 0 || frameMs > this.config.maxSampleMs) return false;
    if (this.warmupLeft > 0) {
      this.warmupLeft -= frameMs;
      return false;
    }
    this.windowMs += frameMs;
    this.windowFrames++;
    if (this.windowMs < this.config.windowMs) return false;

    const fps = (this.windowFrames * 1000) / this.windowMs;
    const windowMs = this.windowMs;
    this.windowMs = 0;
    this.windowFrames = 0;

    if (fps < this.config.downgradeFps) {
      this.goodMs = 0;
      if (this.lowest) return false;
      this.levelIndex++;
      return true;
    }
    if (fps >= this.config.upgradeFps && this.levelIndex > 0) {
      this.goodMs += windowMs;
      if (this.goodMs >= this.config.upgradeAfterMs) {
        this.goodMs = 0;
        this.levelIndex--;
        return true;
      }
    } else {
      this.goodMs = 0;
    }
    return false;
  }

  /** Scales a particle count; fractional results become a random extra particle so tiny bursts don't vanish. */
  scaleCount(count: number, rng: () => number = Math.random): number {
    const scaled = count * this.particleScale;
    const whole = Math.floor(scaled);
    return whole + (rng() < scaled - whole ? 1 : 0);
  }
}

export const quality = new QualityGovernor(QUALITY);
