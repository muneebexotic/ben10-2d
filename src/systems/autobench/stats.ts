/**
 * Per-run numbers for the autobench report, from per-frame samples. Same
 * definitions as the ?debug=1 meter (FrameStats): FPS from the gaps between
 * frames, 1% low from the 99th percentile gap, CPU = the game's own step.
 */
export interface FrameSample {
  /** Time since the previous frame started (ms). */
  interval: number;
  /** The game's step: update + render submission (ms, main thread). */
  cpu: number;
  /** The render submission part of `cpu` (ms). */
  render: number;
  draws: number;
  /** Framebuffer binds (render-target switches). */
  fbBinds: number;
  /** Vertex and index bytes uploaded. */
  uploadBytes: number;
  /** Texture uploads (texImage2D / texSubImage2D). */
  texUploads: number;
  /** Quality governor level (0 best). */
  quality: number;
}

export interface RunSummary {
  frames: number;
  fps: number;
  low1: number;
  cpu: number;
  cpuP99: number;
  render: number;
  /** Mean frame interval minus mean CPU: time the frame waited on something other than the game's own JS. */
  idle: number;
  /** Frames longer than 1.5x the median frame (visible stutter), percent. */
  jankPct: number;
  draws: number;
  fbBinds: number;
  uploadKb: number;
  texUploads: number;
  /** Percent of frames at Q0, Q1, Q2. */
  quality: [number, number, number];
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

export function median(values: readonly number[]): number {
  return percentile(values, 0.5);
}

const mean = (values: readonly number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

export function summarize(samples: readonly FrameSample[]): RunSummary {
  const n = samples.length;
  const intervals = samples.map((s) => s.interval).filter((v) => v > 0);
  const cpu = samples.map((s) => s.cpu);
  const meanInterval = mean(intervals);
  const med = median(intervals);
  const q: [number, number, number] = [0, 0, 0];
  for (const s of samples) q[Math.max(0, Math.min(2, s.quality))]++;
  const pct = (v: number) => (n ? Math.round((v / n) * 100) : 0);
  return {
    frames: n,
    fps: meanInterval > 0 ? 1000 / meanInterval : 0,
    low1: intervals.length ? 1000 / percentile(intervals, 0.99) : 0,
    cpu: mean(cpu),
    cpuP99: percentile(cpu, 0.99),
    render: mean(samples.map((s) => s.render)),
    idle: Math.max(0, meanInterval - mean(cpu)),
    jankPct: intervals.length ? (intervals.filter((v) => v > med * 1.5).length / intervals.length) * 100 : 0,
    draws: mean(samples.map((s) => s.draws)),
    fbBinds: mean(samples.map((s) => s.fbBinds)),
    uploadKb: mean(samples.map((s) => s.uploadBytes)) / 1024,
    texUploads: mean(samples.map((s) => s.texUploads)),
    quality: [pct(q[0]), pct(q[1]), pct(q[2])],
  };
}

/** The screen's refresh rate from frame gaps when nothing is busy: the median gap, snapped to a common rate if close. */
export function refreshRate(intervals: readonly number[]): number {
  const valid = intervals.filter((v) => v > 2 && v < 200);
  if (valid.length < 10) return 0;
  const hz = 1000 / median(valid);
  for (const common of [30, 48, 50, 60, 72, 75, 90, 120, 144, 165]) if (Math.abs(hz - common) / common < 0.04) return common;
  return Math.round(hz);
}
