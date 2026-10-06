interface TimerExt {
  TIME_ELAPSED_EXT: number;
  QUERY_RESULT_EXT: number;
  QUERY_RESULT_AVAILABLE_EXT: number;
  GPU_DISJOINT_EXT: number;
  createQueryEXT(): WebGLQuery | null;
  deleteQueryEXT(q: WebGLQuery): void;
  beginQueryEXT(target: number, q: WebGLQuery): void;
  endQueryEXT(target: number): void;
  getQueryObjectEXT(q: WebGLQuery, pname: number): number | boolean;
}

/** At most this many timer queries waiting for the GPU (results come back a few frames late). */
const MAX_PENDING = 12;

/**
 * Watches the game's WebGL context for the autobench: counts draw calls,
 * render-target switches and uploads per frame, and measures GPU time per frame
 * with EXT_disjoint_timer_query when the browser offers it. Without it, a
 * one-pixel readPixels after a frame measures how long the GPU (and the
 * browser's GPU process) still needed to finish it.
 */
export class GlProbe {
  draws = 0;
  fbBinds = 0;
  uploadBytes = 0;
  texUploads = 0;
  readonly timer: TimerExt | null;
  /** GPU ms per frame from finished timer queries (cleared by `takeGpu`). */
  private gpu: number[] = [];
  private readonly pending: WebGLQuery[] = [];
  private active: WebGLQuery | null = null;
  private readonly pixel = new Uint8Array(4);

  constructor(private readonly gl: WebGLRenderingContext) {
    this.timer = (gl.getExtension('EXT_disjoint_timer_query') as TimerExt | null) ?? null;
    this.wrap();
  }

  get method(): 'timer' | 'sync' {
    return this.timer ? 'timer' : 'sync';
  }

  /** Call when a frame starts (before any of its GL work). */
  frameStart(measureGpu: boolean): void {
    this.draws = this.fbBinds = this.uploadBytes = this.texUploads = 0;
    const t = this.timer;
    if (!t || !measureGpu || this.active || this.pending.length >= MAX_PENDING) return;
    const q = t.createQueryEXT();
    if (!q) return;
    t.beginQueryEXT(t.TIME_ELAPSED_EXT, q);
    this.active = q;
  }

  /** Call when the frame's rendering is submitted. */
  frameEnd(): void {
    const t = this.timer;
    if (!t) return;
    if (this.active) {
      t.endQueryEXT(t.TIME_ELAPSED_EXT);
      this.pending.push(this.active);
      this.active = null;
    }
    this.collect();
  }

  /** Results of finished timer queries since the last call. */
  takeGpu(): number[] {
    const out = this.gpu;
    this.gpu = [];
    return out;
  }

  /** Forget queries in flight (between runs). */
  reset(): void {
    const t = this.timer;
    if (t) {
      if (this.active) {
        t.endQueryEXT(t.TIME_ELAPSED_EXT);
        t.deleteQueryEXT(this.active);
        this.active = null;
      }
      for (const q of this.pending) t.deleteQueryEXT(q);
    }
    this.pending.length = 0;
    this.gpu = [];
  }

  /** Blocks until the GPU has finished everything submitted so far; returns how long that took (ms). */
  syncWait(): number {
    const start = performance.now();
    this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.pixel);
    return performance.now() - start;
  }

  private collect(): void {
    const t = this.timer!;
    while (this.pending.length > 0) {
      const q = this.pending[0];
      if (!t.getQueryObjectEXT(q, t.QUERY_RESULT_AVAILABLE_EXT)) break;
      this.pending.shift();
      const disjoint = this.gl.getParameter(t.GPU_DISJOINT_EXT) as boolean;
      const ns = Number(t.getQueryObjectEXT(q, t.QUERY_RESULT_EXT));
      t.deleteQueryEXT(q);
      if (!disjoint && ns > 0) this.gpu.push(ns / 1e6);
    }
  }

  /** Counts calls on the context itself (Phaser calls them as methods, so instance wrappers see every one). */
  private wrap(): void {
    const gl = this.gl as unknown as Record<string, (...args: unknown[]) => unknown>;
    const count = (name: string, fn: (args: unknown[]) => void) => {
      const original = gl[name];
      if (typeof original !== 'function') return;
      gl[name] = (...args: unknown[]) => {
        fn(args);
        return original.apply(this.gl, args);
      };
    };
    const bytes = (v: unknown) => (typeof v === 'number' ? v : ((v as ArrayBufferView | null)?.byteLength ?? 0));
    count('drawElements', () => this.draws++);
    count('drawArrays', () => this.draws++);
    count('bindFramebuffer', () => this.fbBinds++);
    count('bufferSubData', (a) => (this.uploadBytes += bytes(a[2])));
    count('bufferData', (a) => (this.uploadBytes += bytes(a[1])));
    count('texImage2D', () => this.texUploads++);
    count('texSubImage2D', () => this.texUploads++);
  }
}
