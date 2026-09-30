import Phaser from 'phaser';
import { audio } from './audio/AudioEngine';
import { saveSystem } from './SaveSystem';
import { launchParams } from './LaunchParams';
import { EventBus } from './EventBus';

/** Applies the saved mute preference (or ?mute=1) once at boot. */
export function applySavedSettings(): void {
  audio.setMuted(launchParams().mute || saveSystem.load().muted);
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
