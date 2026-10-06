/**
 * Bisect switches for finding what costs frames on a real device. Set from the
 * URL (usable alone or together, e.g. `?debug=1&fx=0&bg=0`) or by the
 * on-device autobench between its runs.
 *
 *   fx=0          filters (vignette, transform barrel, sepia, desaturate), night lighting,
 *                 additive glow flashes and camera flashes
 *   particles=0   every particle emitter
 *   bg=0          parallax skies and backdrops
 *   scale=0.5     the canvas renders at half resolution (the browser scales it up)
 *   bodies=0/1    draw physics bodies (?debug=1 draws them unless bodies=0)
 *   governor=0    quality governor off: stays at Q0
 *   orphan=0      Phaser's own vertex uploads (overwriting one buffer in place) instead of the
 *                 game's, which re-specify it each time (RenderSwitches.ts): the phone fix, kept
 *                 switchable so the autobench can show what it is worth
 *
 * Diagnostics beyond those, for the autobench:
 *
 *   css=smooth    the canvas is scaled up with smoothing instead of `pixelated`
 *   audio=0       sound off
 *   ctx=desync    WebGL context variants, read once at page load: `desync` asks for a
 *   ctx=lean      desynchronized (low-latency) canvas, `lean` drops the depth and stencil buffers
 */
export type ContextVariant = 'default' | 'desync' | 'lean';

export interface PerfSwitches {
  fx: boolean;
  particles: boolean;
  bg: boolean;
  /** Canvas resolution factor (1 = game resolution). */
  scale: number;
  /** Draw physics bodies: null follows ?debug=1. */
  bodies: boolean | null;
  governor: boolean;
  /** Vertex uploads re-specify the buffer (bufferData) rather than overwrite it (bufferSubData). */
  orphan: boolean;
  smoothCss: boolean;
  audio: boolean;
}

export function defaultSwitches(): PerfSwitches {
  return { fx: true, particles: true, bg: true, scale: 1, bodies: null, governor: true, orphan: true, smoothCss: false, audio: true };
}

const off = (v: string | null) => v === '0' || v === 'off' || v === 'false';

/** Reads the switches from a query string (pure, for tests). */
export function parseSwitches(search: string): PerfSwitches {
  const q = new URLSearchParams(search);
  const s = defaultSwitches();
  s.fx = !off(q.get('fx'));
  s.particles = !off(q.get('particles'));
  s.bg = !off(q.get('bg'));
  const scale = Number(q.get('scale'));
  if (Number.isFinite(scale) && scale >= 0.25 && scale <= 1) s.scale = scale;
  if (q.has('bodies')) s.bodies = !off(q.get('bodies'));
  s.governor = !off(q.get('governor'));
  s.orphan = !off(q.get('orphan'));
  s.smoothCss = q.get('css') === 'smooth';
  s.audio = !off(q.get('audio'));
  return s;
}

export function parseContextVariant(search: string): ContextVariant {
  const v = new URLSearchParams(search).get('ctx');
  return v === 'desync' || v === 'lean' ? v : 'default';
}

/** Short label of what differs from normal play, e.g. "fx=0 bg=0" (empty for normal play). */
export function switchLabel(s: PerfSwitches): string {
  const parts: string[] = [];
  if (!s.fx) parts.push('fx=0');
  if (!s.particles) parts.push('particles=0');
  if (!s.bg) parts.push('bg=0');
  if (s.scale !== 1) parts.push(`scale=${s.scale}`);
  if (s.bodies !== null) parts.push(`bodies=${s.bodies ? 1 : 0}`);
  if (!s.governor) parts.push('governor=0');
  if (!s.orphan) parts.push('orphan=0');
  if (s.smoothCss) parts.push('css=smooth');
  if (!s.audio) parts.push('audio=0');
  return parts.join(' ');
}

function currentSearch(): string {
  try {
    return window.location.search;
  } catch {
    return '';
  }
}

/** The live switches: read from the URL at boot; the autobench rewrites them between runs. */
export const perf: PerfSwitches = parseSwitches(currentSearch());

/** The WebGL context variant for this page load. */
export const contextVariant: ContextVariant = parseContextVariant(currentSearch());

/** Replaces every switch at once (missing fields go back to normal play). */
export function setSwitches(patch: Partial<PerfSwitches>): void {
  Object.assign(perf, defaultSwitches(), patch);
}
