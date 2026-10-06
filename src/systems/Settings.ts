import Phaser from 'phaser';
import { audio } from './audio/AudioEngine';
import { saveSystem, type SettingsData } from './SaveSystem';
import { launchParams } from './LaunchParams';
import { perf } from './PerfSwitches';
import { EventBus } from './EventBus';
import { inputMode } from './InputMode';
import { a11y, prefersReducedMotion, resolveA11y, setA11y } from './Accessibility';

/** Applies the saved settings (or ?mute=1) once at boot, and follows OS reduced-motion changes. */
export function applySavedSettings(): void {
  audio.setMuted(launchParams().mute || !perf.audio || saveSystem.load().muted);
  refreshA11y();
  try {
    window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change', () => refreshA11y());
  } catch {
    // Older browsers: the boot-time value is fine.
  }
}

function refreshA11y(): void {
  setA11y(resolveA11y(saveSystem.load().settings, prefersReducedMotion()));
  EventBus.emit('settings:changed', { reduceFlashing: a11y.reduceFlashing, shake: a11y.shake, touchControls: saveSystem.load().settings.touchControls });
}

export function getSettings(): SettingsData {
  return saveSystem.load().settings;
}

/** Whether the on-screen controls are showing: ON, or AUTO while the player is using touch. */
export function touchControlsOn(): boolean {
  const mode = getSettings().touchControls;
  return mode === 'on' || (mode === 'auto' && inputMode.current === 'touch');
}

/** Saves a settings change and pushes it to every live system. */
export function updateSettings(patch: Partial<SettingsData>): void {
  saveSystem.setSettings(patch);
  refreshA11y();
}

export function toggleMute(): boolean {
  const muted = !audio.muted;
  audio.setMuted(muted);
  saveSystem.setMuted(muted);
  EventBus.emit('audio:muted', { muted });
  return muted;
}

/** M toggles sound in any scene that calls this. */
export function bindMuteKey(scene: Phaser.Scene): void {
  scene.input.keyboard?.on('keydown-M', () => toggleMute());
}

/**
 * Browsers only let audio start inside a gesture, and for touch that's the
 * *end* of a tap (touchend / pointerup), not its start: a pointerdown handler
 * alone left the first tap silent (and iOS can need it again after a call).
 * These page-level listeners catch every gesture end until the sound runs.
 * Sound also pauses while the page is hidden.
 */
export function installPageAudio(): void {
  const events = ['touchend', 'pointerup', 'click', 'keydown'] as const;
  const unlock = () => {
    if (!audio.ready) audio.unlock();
  };
  try {
    for (const type of events) window.addEventListener(type, unlock, { capture: true, passive: true });
    // Silent in the background, back on return.
    document.addEventListener('visibilitychange', () => audio.setPageHidden(document.hidden));
  } catch {
    // No window (tests).
  }
}

/** Browsers only allow audio after a gesture; any key or click unlocks it. */
export function bindAudioUnlock(scene: Phaser.Scene, onUnlock?: () => void): void {
  const unlock = () => {
    const was = audio.ready;
    audio.unlock();
    if (!was) onUnlock?.();
  };
  scene.input.keyboard?.on('keydown', unlock);
  scene.input.on('pointerdown', unlock);
}
