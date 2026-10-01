import type Phaser from 'phaser';
import { EventBus } from './EventBus';
import { inputMode } from './InputMode';

/** True on phones and tablets: the primary pointer is a finger. */
export function isTouchDevice(): boolean {
  try {
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;
    return navigator.maxTouchPoints > 0 && !window.matchMedia?.('(hover: hover)').matches;
  } catch {
    return false;
  }
}

function isPortraitPhone(): boolean {
  try {
    return isTouchDevice() && window.matchMedia('(orientation: portrait)').matches;
  } catch {
    return false;
  }
}

/**
 * Browser-level mobile hygiene: pick the input mode, block page zoom and
 * scroll gestures, and pause when the phone is rotated to portrait or the
 * tab is hidden (a call, a notification, the lock button).
 */
export function installDeviceGuards(game: Phaser.Game): void {
  if (isTouchDevice()) inputMode.set('touch');
  window.addEventListener('keydown', () => inputMode.set('keyboard'));
  window.addEventListener('touchstart', () => inputMode.set('touch'), { passive: true });

  // iOS ignores user-scalable=no for pinches and double taps; stop them here.
  const block = (e: Event) => e.preventDefault();
  document.addEventListener('gesturestart', block);
  document.addEventListener('dblclick', block);
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || e.target instanceof HTMLCanvasElement) e.preventDefault();
  }, { passive: false });

  let frozenForPortrait = false;
  const portraitBlocked = () => {
    const portrait = isPortraitPhone();
    document.body.classList.toggle('portrait', portrait);
    if (portrait && !frozenForPortrait) {
      // Open the pause menu first, then freeze the game behind the "rotate your phone" screen.
      EventBus.emit('system:pause');
      frozenForPortrait = true;
      window.setTimeout(() => {
        if (frozenForPortrait) game.pause();
      }, 50);
    } else if (!portrait && frozenForPortrait) {
      frozenForPortrait = false;
      game.resume();
    }
  };
  try {
    window.matchMedia('(orientation: portrait)').addEventListener('change', portraitBlocked);
  } catch {
    window.addEventListener('resize', portraitBlocked);
  }
  window.addEventListener('resize', portraitBlocked);
  portraitBlocked();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) EventBus.emit('system:pause');
  });
}
