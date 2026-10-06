import type { DeviceInfo } from './device';
import { median, type RunSummary } from './stats';

export interface RunResult {
  scenario: string;
  variant: string;
  ctx: string;
  page: number;
  drift?: boolean;
  summary: RunSummary;
  /** GPU ms per frame: timer query mean, or the median sync wait. Null if unmeasured. */
  gpu: number | null;
  gpuMethod: 'timer' | 'sync' | 'none';
  longTasks: number;
  heapMb: number | null;
  fullscreen: boolean;
  /** Something unusual: the level ended, Ben died, the tab was hidden. */
  flags: string[];
}

export interface PageInfo {
  page: number;
  ctx: string;
  contextAttributes: string;
  fullscreen: boolean;
}

export interface ReportInput {
  version: string;
  date: string;
  device: DeviceInfo;
  warnings: string[];
  pages: PageInfo[];
  results: RunResult[];
  timing: { warmupMs: number; recordMs: number; firstVisitMs?: number };
}

const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const lpad = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s);
const f1 = (v: number) => v.toFixed(1);
const f0 = (v: number) => String(Math.round(v));

/** One run as a fixed-width row. */
export function formatRow(r: RunResult): string {
  const s = r.summary;
  const name = r.drift ? `${r.scenario}*` : r.ctx !== 'default' || r.page > 0 ? `${r.scenario}@${r.ctx}` : r.scenario;
  const gpu = r.gpu === null ? '-' : `${f1(r.gpu)}${r.gpuMethod === 'sync' ? '~' : ''}`;
  return [
    pad(name, 18),
    pad(r.variant, 11),
    lpad(f1(s.fps), 5),
    lpad(f0(s.low1), 4),
    lpad(f1(s.cpu), 5),
    lpad(f1(s.cpuP99), 5),
    lpad(f1(s.render), 4),
    lpad(f1(s.idle), 5),
    lpad(gpu, 6),
    lpad(f0(s.draws), 4),
    lpad(f1(s.fbBinds), 4),
    lpad(f0(s.uploadKb), 5),
    lpad(f1(s.texUploads), 4),
    lpad(f0(s.jankPct), 4),
    ` ${s.quality.join('/')}`,
    r.flags.length ? ` ${r.flags.join(',')}` : '',
  ].join(' ');
}

const HEADER = [
  pad('RUN', 18),
  pad('SWITCH', 11),
  lpad('FPS', 5),
  lpad('1%LO', 4),
  lpad('CPU', 5),
  lpad('P99', 5),
  lpad('REN', 4),
  lpad('IDLE', 5),
  lpad('GPU', 6),
  lpad('DRAW', 4),
  lpad('FB', 4),
  lpad('UPKB', 5),
  lpad('TEX', 4),
  lpad('JNK%', 4),
  ' Q0/1/2%',
].join(' ');

export interface SwitchEffect {
  variant: string;
  scenes: number;
  /** Median FPS change against the same scene's base run. */
  fpsDelta: number;
  fpsPct: number;
  idleDelta: number;
  gpuDelta: number | null;
}

/** For every switch: the median change against the same scene's base run on the same page. */
export function switchEffects(results: readonly RunResult[]): SwitchEffect[] {
  const bases = new Map<string, RunResult>();
  for (const r of results) if (r.variant === 'base' && !r.drift && r.page === 0) bases.set(r.scenario, r);
  const byVariant = new Map<string, RunResult[]>();
  for (const r of results) {
    if (r.variant === 'base' || r.page !== 0 || r.drift) continue;
    const list = byVariant.get(r.variant) ?? [];
    list.push(r);
    byVariant.set(r.variant, list);
  }
  const out: SwitchEffect[] = [];
  for (const [variant, runs] of byVariant) {
    const fps: number[] = [];
    const pct: number[] = [];
    const idle: number[] = [];
    const gpu: number[] = [];
    for (const r of runs) {
      const b = bases.get(r.scenario);
      if (!b || b.summary.fps <= 0) continue;
      fps.push(r.summary.fps - b.summary.fps);
      pct.push(((r.summary.fps - b.summary.fps) / b.summary.fps) * 100);
      idle.push(r.summary.idle - b.summary.idle);
      if (r.gpu !== null && b.gpu !== null) gpu.push(r.gpu - b.gpu);
    }
    if (fps.length === 0) continue;
    out.push({ variant, scenes: fps.length, fpsDelta: median(fps), fpsPct: median(pct), idleDelta: median(idle), gpuDelta: gpu.length ? median(gpu) : null });
  }
  return out;
}

/** Context variants against the default context on a page loaded the same way. */
function contextLines(results: readonly RunResult[]): string[] {
  const reload = results.filter((r) => r.page > 0);
  if (reload.length === 0) return [];
  const lines: string[] = [];
  const scenes = [...new Set(reload.map((r) => r.scenario))];
  for (const scene of scenes) {
    const base = reload.find((r) => r.scenario === scene && r.ctx === 'default');
    const parts = reload
      .filter((r) => r.scenario === scene)
      .map((r) => {
        const delta = base && r !== base ? ` (${r.summary.fps - base.summary.fps >= 0 ? '+' : ''}${f1(r.summary.fps - base.summary.fps)})` : '';
        return `${r.ctx} ${f1(r.summary.fps)}${delta}`;
      });
    lines.push(`  ${scene}: ${parts.join(' | ')}`);
  }
  return lines;
}

function driftLine(results: readonly RunResult[]): string | null {
  const drift = results.find((r) => r.drift);
  if (!drift) return null;
  const first = results.find((r) => r.scenario === drift.scenario && r.variant === 'base' && !r.drift && r.page === 0);
  if (!first || first.summary.fps <= 0) return null;
  const pct = ((drift.summary.fps - first.summary.fps) / first.summary.fps) * 100;
  const verdict = Math.abs(pct) <= 8 ? 'steady' : pct < 0 ? 'SLOWER AT THE END (HEAT OR POWER SAVING?)' : 'faster at the end';
  return `DRIFT: ${drift.scenario} base ${f1(first.summary.fps)} fps at the start, ${f1(drift.summary.fps)} at the end (${pct >= 0 ? '+' : ''}${f0(pct)}%): ${verdict}`;
}

export function formatReport(input: ReportInput): string {
  const d = input.device;
  const lines: string[] = [];
  const first = input.timing.firstVisitMs ? `, +${input.timing.firstVisitMs / 1000}s on a scene's first run` : '';
  lines.push(`AUTOBENCH ${input.version} ${input.date} (${input.timing.warmupMs / 1000}s warm-up${first} + ${input.timing.recordMs / 1000}s per run)`);
  lines.push(`UA: ${d.ua}`);
  lines.push(`SCREEN: dpr ${d.dpr} | screen ${d.screen} | viewport ${d.viewport} | refresh ${d.refreshHz || '?'} Hz (measured idle) | cores ${d.cores ?? '?'} | mem ${d.memoryGb ?? '?'} GB | battery ${d.battery ?? '?'}${d.saveData ? ' | data saver' : ''}${d.reducedMotion ? ' | reduced motion' : ''}`);
  lines.push(`GPU: ${d.renderer} (${d.vendor}) | ${d.webgl} | max tex ${d.maxTextureSize} | timer query: ${d.timerQuery}`);
  lines.push(`CANVAS: ${d.canvas}`);
  for (const p of input.pages) lines.push(`PAGE ${p.page} ctx=${p.ctx}: ${p.contextAttributes} | fullscreen ${p.fullscreen ? 'yes' : 'no'}`);
  lines.push(input.warnings.length ? `WARN: ${input.warnings.join(' / ')}` : 'WARN: none');
  lines.push('');
  lines.push(HEADER);
  for (const r of input.results) lines.push(formatRow(r));
  lines.push('');
  const effects = switchEffects(input.results);
  if (effects.length) {
    lines.push('SWITCH EFFECT (median vs the same scene\'s base, FPS / idle ms / GPU ms):');
    for (const e of effects) {
      const sign = (v: number) => (v >= 0 ? '+' : '');
      const gpu = e.gpuDelta === null ? '' : ` gpu ${sign(e.gpuDelta)}${f1(e.gpuDelta)}`;
      lines.push(`  ${pad(e.variant, 11)} ${sign(e.fpsDelta)}${f1(e.fpsDelta)} fps (${sign(e.fpsPct)}${f0(e.fpsPct)}%) idle ${sign(e.idleDelta)}${f1(e.idleDelta)}${gpu}  [${e.scenes} scenes]`);
    }
  }
  const ctx = contextLines(input.results);
  if (ctx.length) {
    lines.push('CONTEXT VARIANTS (fresh page each, FPS):');
    lines.push(...ctx);
  }
  const drift = driftLine(input.results);
  if (drift) lines.push(drift);
  lines.push('');
  lines.push('KEY: ms per frame. CPU = game step (update+render submit), REN = its render part, IDLE = frame gap minus CPU,');
  lines.push('GPU = timer query per frame (~ = readPixels wait after submit), FB = render-target binds, UPKB = vertex KB uploaded,');
  lines.push('TEX = texture uploads, JNK% = frames >1.5x the median gap. * = repeat at the end. base = normal play.');
  return lines.join('\n');
}
