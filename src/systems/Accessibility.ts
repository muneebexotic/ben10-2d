import type Phaser from 'phaser';
import { ACCESSIBILITY } from '../config/accessibility';
import type { SettingsData } from './SaveSystem';
import { perf } from './PerfSwitches';

/** Settings after filling unchosen values from the device (prefers-reduced-motion). */
export interface ResolvedA11y {
  reduceFlashing: boolean;
  /** Screen shake multiplier, 0..1. */
  shake: number;
}

export function resolveA11y(saved: Pick<SettingsData, 'reduceFlashing' | 'shake'>, prefersReducedMotion: boolean): ResolvedA11y {
  return {
    reduceFlashing: saved.reduceFlashing ?? prefersReducedMotion,
    shake: saved.shake ?? (prefersReducedMotion ? ACCESSIBILITY.reducedMotionShake : 1),
  };
}

/** Half-period of a blink, slowed down to a safe rate when flashing is reduced. */
export function safeBlinkHalfPeriod(halfPeriodMs: number, reduceFlashing: boolean): number {
  return reduceFlashing ? Math.max(halfPeriodMs, ACCESSIBILITY.minBlinkHalfPeriodMs) : halfPeriodMs;
}

/** Live settings every effect reads. Updated by Settings when the save or the OS preference changes. */
export const a11y: ResolvedA11y = { reduceFlashing: false, shake: 1 };

export function setA11y(next: ResolvedA11y): void {
  a11y.reduceFlashing = next.reduceFlashing;
  a11y.shake = Math.min(1, Math.max(0, next.shake));
}

/** True on the "on" half of a blink cycle. Every gameplay blink goes through this so Reduce Flashing can slow it. */
export function blinkOn(now: number, halfPeriodMs: number): boolean {
  return Math.floor(now / safeBlinkHalfPeriod(halfPeriodMs, a11y.reduceFlashing)) % 2 === 0;
}

export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

/** Camera shake scaled by the player's shake setting. */
export function shakeCamera(cam: Phaser.Cameras.Scene2D.Camera, durationMs: number, intensity: number, force = true): void {
  if (a11y.shake <= 0) return;
  cam.shake(durationMs, intensity * a11y.shake, force);
}

/** Full-screen colour flash. With Reduce Flashing on it becomes a soft, slower tint. */
export function flashCamera(cam: Phaser.Cameras.Scene2D.Camera, durationMs: number, r: number, g: number, b: number): void {
  if (!perf.fx) return;
  const reduced = a11y.reduceFlashing;
  // Phaser keeps the peak alpha on the effect; set it every time so a forced restart never leaves it dimmed.
  cam.flashEffect.alpha = reduced ? ACCESSIBILITY.reducedFlashAlpha : 1;
  cam.flash(reduced ? Math.max(durationMs, ACCESSIBILITY.reducedFlashMinMs) : durationMs, r, g, b, true);
}
