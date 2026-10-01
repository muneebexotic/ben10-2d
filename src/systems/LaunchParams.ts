/**
 * URL switches for playtesting: ?start=<checkpoint id>, ?gallery=1, ?debug=1, ?mute=1.
 * Dev builds only: ?at=<tile x> spawns Ben anywhere, ?god=1 makes him invulnerable.
 */
export interface LaunchParams {
  start: string | null;
  gallery: boolean;
  debug: boolean;
  mute: boolean;
  at: number | null;
  god: boolean;
}

export function launchParams(): LaunchParams {
  let search = '';
  try {
    search = window.location.search;
  } catch {
    search = '';
  }
  const q = new URLSearchParams(search);
  const dev = import.meta.env.DEV;
  const at = dev && q.has('at') ? Number(q.get('at')) : null;
  return {
    start: q.get('start') ?? (at !== null && Number.isFinite(at) ? `@${at}` : null),
    gallery: q.has('gallery'),
    debug: q.has('debug'),
    mute: q.has('mute'),
    at: at !== null && Number.isFinite(at) ? at : null,
    god: dev && q.has('god'),
  };
}
