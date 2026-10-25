import Phaser from 'phaser';
import { FONT_KEY } from '../../ui/PixelFont';
import { wantedHdScale } from '../HdRender';
import { applyHdScale } from '../RenderSwitches';

/**
 * The look a screen is drawn in: the pixel art of Chapters 1-6 and every
 * shared screen, or the HD cartoon look of Act 3. Switching to HD raises the
 * render scale and swaps the shared textures an HD chapter redrew (icons,
 * pickups, particles, the font...) for their HD versions under the same keys;
 * switching back undoes both exactly, so nothing pixel ever sees HD art.
 *
 * Every scene says which look it wants when it starts (`usePresentation`):
 * an HD chapter's level and the screens that belong to its run (pause, game
 * over, results) ask for HD, everything else for pixel.
 */

/** What an HD chapter redraws among the shared textures, and its font. */
export interface HdSkin {
  /** Shared texture keys with an HD twin made under `hdKey(key)` (same frame names and game-pixel frame sizes). */
  textures: readonly string[];
  /** The HD font: its glyph data (game-pixel metrics, UVs on its own texture) and texture. */
  font?: { texture: string; data: unknown };
}

export function hdKey(key: string): string {
  return `${key}~hd`;
}

function pxKey(key: string): string {
  return `${key}~px`;
}

let skin: HdSkin | null = null;
let hdOn = false;
let swapped: string[] = [];
let savedFont: unknown = null;

/** The skin an HD chapter brings (its art made the HD twins). */
export function registerHdSkin(s: HdSkin): void {
  skin = s;
}

export function presentationIsHd(): boolean {
  return hdOn;
}

/** Switches the whole game to the look a scene wants (a no-op when it's already that look). */
export function usePresentation(scene: Phaser.Scene, hd: boolean): void {
  const want = hd && skin !== null;
  if (want === hdOn) return;
  hdOn = want;
  const game = scene.game;
  applyHdScale(game, want ? wantedHdScale(game, 3) : 1);
  if (want) swapIn(scene);
  else swapOut(scene);
}

function swapIn(scene: Phaser.Scene): void {
  if (!skin) return;
  const textures = scene.textures;
  swapped = [];
  for (const key of skin.textures) {
    if (!textures.exists(hdKey(key)) || !textures.exists(key)) continue;
    textures.renameTexture(key, pxKey(key));
    textures.renameTexture(hdKey(key), key);
    swapped.push(key);
  }
  relinkAnimations(scene, new Set(swapped));
  const fonts = scene.cache.bitmapFont;
  if (skin.font && fonts.exists(FONT_KEY)) {
    savedFont = fonts.get(FONT_KEY);
    fonts.remove(FONT_KEY);
    fonts.add(FONT_KEY, { data: skin.font.data, texture: skin.font.texture, frame: null });
  }
}

function swapOut(scene: Phaser.Scene): void {
  const textures = scene.textures;
  for (const key of swapped) {
    textures.renameTexture(key, hdKey(key));
    textures.renameTexture(pxKey(key), key);
  }
  relinkAnimations(scene, new Set(swapped));
  swapped = [];
  const fonts = scene.cache.bitmapFont;
  if (savedFont) {
    fonts.remove(FONT_KEY);
    fonts.add(FONT_KEY, savedFont);
    savedFont = null;
  }
}

/** Points every animation frame on a swapped texture at the texture now under that key (same frame names). */
function relinkAnimations(scene: Phaser.Scene, keys: ReadonlySet<string>): void {
  if (keys.size === 0) return;
  const textures = scene.textures;
  const anims = scene.anims as unknown as { anims: { each(cb: (key: string, anim: Phaser.Animations.Animation) => void): void } };
  anims.anims.each((_key, anim) => {
    for (const f of anim.frames) {
      if (!keys.has(f.textureKey)) continue;
      const frame = textures.getFrame(f.textureKey, f.textureFrame);
      if (frame) f.frame = frame;
    }
  });
}
