import Phaser from 'phaser';

/**
 * HD rendering for the cartoon chapters (Act 3). Chapters 1-6 draw at game
 * resolution (640x360 and wider) and the browser scales the canvas up; an HD
 * chapter draws at `scale` times that, with the projection still at game size,
 * so every position, layout and physics number stays in game pixels while
 * textures made at that scale (`ui/hd/`) land on the screen pixel for pixel.
 *
 * Render targets (camera filters, baked HUD shapes, masks) made while the scale
 * is up are made at the same scale; each remembers the scale it was made at, so
 * one made at 1x keeps working (at 1x) after the scale changes. At scale 1
 * nothing here changes what Phaser does.
 */

interface ScaledContext {
  /** The scale this context's render target was made at (1 when unset). */
  __rs?: number;
  width: number;
  height: number;
  useCanvas: boolean;
  state: { scissor: { box: number[] }; viewport: number[] };
}

interface ContextProto {
  resize(this: ScaledContext, width: number, height: number): void;
  setScissorBox(this: ScaledContext, x: number, y: number, width: number, height: number): void;
  copy(this: ScaledContext, source: ScaledContext): void;
}

let installed = false;
let scale = 1;

/** The HD scale render targets are made at right now (1 outside the cartoon chapters). */
export function hdScale(): number {
  return scale;
}

/** Installs the render-target half of HD rendering (once, at boot). Does nothing until the scale goes above 1. */
export function installHdRendering(): void {
  if (installed) return;
  installed = true;
  const proto = (Phaser.Renderer.WebGL as unknown as { DrawingContext: { prototype: ContextProto } }).DrawingContext.prototype;
  const resize = proto.resize;
  const setScissorBox = proto.setScissorBox;
  const copy = proto.copy;

  proto.resize = function (this: ScaledContext, width: number, height: number) {
    const s = this.useCanvas ? 1 : scale;
    if (s === 1) {
      resize.call(this, width, height);
      this.__rs = 1;
      return;
    }
    // The render target (and its viewport and scissor) at the HD size; the size Phaser projects with stays in game pixels.
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    resize.call(this, Math.round(w * s), Math.round(h * s));
    this.width = w;
    this.height = h;
    this.__rs = s;
  };

  proto.setScissorBox = function (this: ScaledContext, x: number, y: number, width: number, height: number) {
    const s = this.__rs ?? 1;
    if (s === 1) {
      setScissorBox.call(this, x, y, width, height);
      return;
    }
    const flippedY = this.height - y - height;
    this.state.scissor.box = [Math.round(x * s), Math.round(flippedY * s), Math.round(width * s), Math.round(height * s)];
  };

  proto.copy = function (this: ScaledContext, source: ScaledContext) {
    copy.call(this, source);
    this.__rs = source.__rs;
  };
}

/**
 * Sets the HD scale: new render targets are made at it, pooled ones made at
 * another scale are dropped, and the canvas follows (RenderSwitches applies
 * it with the other canvas switches).
 */
export function setHdScale(game: Phaser.Game, value: number, applyCanvas: (game: Phaser.Game) => void): void {
  const next = Math.max(1, value);
  if (next === scale) return;
  scale = next;
  const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer | null;
  if (renderer && 'drawingContextPool' in renderer) (renderer as unknown as { drawingContextPool: { clear(): void } }).drawingContextPool.clear();
  applyCanvas(game);
}

/**
 * The scale an HD chapter asks for on this screen: enough to put a texel on
 * every device pixel (the canvas's CSS size times the device pixel ratio, over
 * the game size), rounded up to a whole step and capped (fill rate on phones).
 */
export function wantedHdScale(game: Phaser.Game, cap: number): number {
  const canvas = game.canvas;
  const gameH = game.scale.gameSize.height || 360;
  let cssH = gameH;
  try {
    cssH = canvas.getBoundingClientRect().height || gameH;
  } catch {
    cssH = gameH;
  }
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const ratio = (cssH * dpr) / gameH;
  return Math.max(1, Math.min(cap, Math.ceil(ratio - 0.15)));
}

/** Marks a canvas-backed texture as drawn at `res` times its game size: images, sprites and particles show it at game size. */
export function setTextureResolution(texture: Phaser.Textures.Texture, res: number): void {
  for (const source of texture.source) source.resolution = res;
  for (const name of texture.getFrameNames(true)) normalizeFrame(texture.get(name), res);
}

/** A frame cut from a texture drawn at `res`: its game-size width, height and centre (the cut stays in texels for the UVs). */
export function normalizeFrame(frame: Phaser.Textures.Frame, res: number): void {
  if (res === 1) return;
  const w = frame.cutWidth / res;
  const h = frame.cutHeight / res;
  const f = frame as unknown as {
    width: number;
    height: number;
    halfWidth: number;
    halfHeight: number;
    centerX: number;
    centerY: number;
    data: { sourceSize: { w: number; h: number }; spriteSourceSize: { w: number; h: number }; radius: number };
  };
  f.width = w;
  f.height = h;
  f.halfWidth = w / 2;
  f.halfHeight = h / 2;
  f.centerX = Math.floor(w / 2);
  f.centerY = Math.floor(h / 2);
  f.data.sourceSize.w = w;
  f.data.sourceSize.h = h;
  f.data.spriteSourceSize.w = w;
  f.data.spriteSourceSize.h = h;
  f.data.radius = 0.5 * Math.sqrt(w * w + h * h);
}
