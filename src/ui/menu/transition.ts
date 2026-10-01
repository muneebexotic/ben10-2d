import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { MENU } from '../../config/ui';
import { TEX } from '../../scenes/preload/assetKeys';
import { a11y } from '../../systems/Accessibility';
import { playSfx, type SfxName } from '../../systems/audio/Sfx';

const LEAVING = 'menu-leaving';
const FADE = [4, 6, 15] as const;

/** Every menu screen fades in the same way. Call at the top of create(). */
export function enterMenu(scene: Phaser.Scene): void {
  resetLeaving(scene);
  scene.cameras.main.fadeIn(MENU.fadeInMs, ...FADE);
}

/** Overlays (pause, game over) that leave with `leaveTo` but appear without a fade. */
export function resetLeaving(scene: Phaser.Scene): void {
  scene.data.set(LEAVING, false);
}

/** True once this screen started leaving (input should stop). */
export function isLeaving(scene: Phaser.Scene): boolean {
  return scene.data.get(LEAVING) === true;
}

/**
 * Moves to another screen: a whoosh, the Omnitrix emblem irises open over
 * the screen and it fades through the night. Ignores repeats while leaving.
 */
export function leaveTo(scene: Phaser.Scene, key: string, data?: object, sound: SfxName | null = 'whoosh'): boolean {
  if (isLeaving(scene)) return false;
  scene.data.set(LEAVING, true);
  if (sound) playSfx(sound);
  const iris = scene.add
    .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEX.hourglass)
    .setTint(PALETTE.omnitrix)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(a11y.reduceFlashing ? 0.18 : 0.45)
    .setScale(0.6)
    .setScrollFactor(0)
    .setDepth(10_000);
  scene.tweens.add({ targets: iris, scale: 9, alpha: 0, angle: 25, duration: MENU.irisMs, ease: 'Cubic.easeIn' });
  const cam = scene.cameras.main;
  cam.fadeOut(MENU.fadeOutMs, ...FADE);
  // Always pass data: Phaser keeps a scene's previous start data when given none.
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data ?? {}));
  return true;
}
