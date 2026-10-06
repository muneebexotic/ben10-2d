import Phaser from 'phaser';
import { perf } from './PerfSwitches';

interface BufferWrapper {
  renderer: Phaser.Renderer.WebGL.WebGLRenderer;
  bufferType: number;
  bufferUsage: number;
  dataBuffer: ArrayBuffer;
  viewU8: Uint8Array;
  bind(): void;
  update(bytes?: number, offset?: number): void;
  /** Set while the GL buffer holds only the last orphaned upload (smaller than dataBuffer). */
  __orphaned?: boolean;
}

interface Renderable {
  renderWebGLStep(...args: unknown[]): void;
}

let installed = false;
let appliedScale = 1;

/**
 * Installs the render-level switches of `perf` (particles, scale, css, orphan)
 * once at boot. They are read live, so the autobench can flip them between runs.
 */
export function installRenderSwitches(game: Phaser.Game): void {
  if (installed) return;
  installed = true;

  // particles=0: emitters still simulate but draw nothing.
  const emitter = Phaser.GameObjects.Particles.ParticleEmitter.prototype as unknown as Renderable;
  const drawEmitter = emitter.renderWebGLStep;
  emitter.renderWebGLStep = function (this: Renderable, ...args: unknown[]) {
    if (perf.particles) drawEmitter.apply(this, args);
  };

  // Vertex uploads (on unless orphan=0): re-specify the buffer for every upload (bufferData) instead of
  // overwriting the front of a buffer the frame's earlier draws still read (bufferSubData), which Mali
  // drivers answer by copying the whole buffer or stalling. On a Mali-G78 this doubled the frame rate of
  // the busiest scenes (the autobench, docs/PERFORMANCE.md).
  const wrappers = (Phaser.Renderer.WebGL as unknown as { Wrappers: { WebGLBufferWrapper: { prototype: BufferWrapper } } }).Wrappers;
  const proto = wrappers.WebGLBufferWrapper.prototype;
  const update = proto.update;
  proto.update = function (this: BufferWrapper, bytes?: number, offset?: number) {
    const gl = this.renderer.gl;
    if (perf.orphan && bytes !== undefined && (offset ?? 0) === 0) {
      this.bind();
      gl.bufferData(this.bufferType, this.viewU8.subarray(0, bytes), this.bufferUsage);
      this.__orphaned = true;
      return;
    }
    if (this.__orphaned) {
      // Back to full size before an in-place update.
      this.bind();
      gl.bufferData(this.bufferType, this.dataBuffer, this.bufferUsage);
      this.__orphaned = false;
    }
    update.call(this, bytes, offset);
  };

  const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  renderer.on?.(Phaser.Renderer.Events.RESIZE, () => applyRenderScale(game));
  applyRenderSwitches(game);
}

/** Applies the switches that change the canvas (scale, css) right now. */
export function applyRenderSwitches(game: Phaser.Game): void {
  applyRenderScale(game);
  const canvas = game.canvas;
  if (canvas) canvas.style.imageRendering = perf.smoothCss ? 'auto' : '';
}

/**
 * scale<1: the canvas's drawing buffer shrinks and the main viewport with it,
 * while the projection stays at game size, so the whole frame is drawn smaller
 * and the browser scales the canvas back up. Render targets (camera filters,
 * the lightmap) keep their own sizes.
 */
function applyRenderScale(game: Phaser.Game): void {
  const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer | null;
  const canvas = game.canvas;
  if (!renderer || !canvas || !('gl' in renderer)) return;
  const factor = perf.scale;
  const w = renderer.width;
  const h = renderer.height;
  const bw = Math.max(1, Math.round(w * factor));
  const bh = Math.max(1, Math.round(h * factor));
  if (factor === 1 && appliedScale === 1) return;
  appliedScale = factor;
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  const base = (renderer as unknown as { baseDrawingContext: { state: { viewport: number[] } } }).baseDrawingContext;
  base.state.viewport = [0, 0, bw, bh];
  (renderer as unknown as { drawingBufferHeight: number }).drawingBufferHeight = renderer.gl.drawingBufferHeight;
}
