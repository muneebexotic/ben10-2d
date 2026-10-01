import Phaser from 'phaser';
import { audio } from './audio/AudioEngine';
import { saveSystem, type SettingsData } from './SaveSystem';
import { launchParams } from './LaunchParams';
import { EventBus } from './EventBus';
import { a11y, prefersReducedMotion, resolveA11y, setA11y } from './Accessibility';

/** Applies the saved settings (or ?mute=1) once at boot, and follows OS reduced-motion changes. */
export function applySavedSettings(): void {
  audio.setMuted(launchParams().mute || saveSystem.load().muted);
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
