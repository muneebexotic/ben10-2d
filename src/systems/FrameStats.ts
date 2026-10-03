import Phaser from 'phaser';

const FRAMES = 300;

/**
 * ?debug=1 frame meter: the same numbers `npm run bench` budgets, measured on
 * the device itself. CPU is the game's own work per frame (update + render
 * submission, main thread); frame time is the gap between frames. Only
 * created in debug mode.
 */
export class FrameStats {
  private readonly cpu = new Float32Array(FRAMES);
  private readonly gap = new Float32Array(FRAMES);
  private readonly sorted = new Float32Array(FRAMES);
  private n = 0;
  private i = 0;
  private stepAt = 0;
  private lastStep = 0;

  constructor(private readonly game: Phaser.Game) {
    game.events.on(Phaser.Core.Events.PRE_STEP, this.onPreStep, this);
    game.events.on(Phaser.Core.Events.POST_RENDER, this.onPostRender, this);
  }

  destroy(): void {
    this.game.events.off(Phaser.Core.Events.PRE_STEP, this.onPreStep, this);
    this.game.events.off(Phaser.Core.Events.POST_RENDER, this.onPostRender, this);
  }

  private onPreStep(): void {
    const now = performance.now();
    if (this.lastStep > 0) this.gap[this.i] = now - this.lastStep;
    this.lastStep = now;
    this.stepAt = now;
  }

  private onPostRender(): void {
    this.cpu[this.i] = performance.now() - this.stepAt;
    this.i = (this.i + 1) % FRAMES;
    this.n = Math.min(FRAMES, this.n + 1);
  }

  /** One line for the debug readout (last 5 seconds at 60 fps). */
  summary(): string {
    const n = this.n;
    if (n < 2) return '';
    let cpuSum = 0;
    let gapSum = 0;
    for (let k = 0; k < n; k++) {
      cpuSum += this.cpu[k];
      gapSum += this.gap[k];
    }
    const cpuP99 = this.percentile(this.cpu, 0.99);
    const gapP99 = this.percentile(this.gap, 0.99);
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const heap = memory ? ` HEAP ${Math.round(memory.usedJSHeapSize / 1048576)}MB` : '';
    const pool = (this.game.renderer as unknown as { drawingContextPool?: { agePool: unknown[] } }).drawingContextPool?.agePool.length;
    return `CPU ${(cpuSum / n).toFixed(1)}MS P99 ${cpuP99.toFixed(1)} | ${Math.round(1000 / (gapSum / n))}FPS 1%LOW ${Math.round(1000 / gapP99)}${heap}${pool !== undefined ? ` RT${pool}` : ''}`;
  }

  private percentile(values: Float32Array, p: number): number {
    const n = this.n;
    const s = this.sorted.subarray(0, n);
    s.set(values.subarray(0, n));
    s.sort();
    return s[Math.min(n - 1, Math.floor(p * n))];
  }
}

let shared: FrameStats | null = null;

/** The game's one frame meter (created on first use; it outlives Level restarts). */
export function frameStats(game: Phaser.Game): FrameStats {
  shared ??= new FrameStats(game);
  return shared;
}
