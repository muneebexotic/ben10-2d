/**
 * URL switches for playtesting: ?start=<checkpoint id>, ?gallery=1, ?debug=1, ?mute=1,
 * ?aliens=fourarms,xlr8 (adds aliens to the story dial; the run counts as practice),
 * ?training=1 (straight into Omnitrix Training), ?level=ch2 (which chapter ?start= and a direct start play).
 * Dev builds only: ?at=<tile x> spawns Ben anywhere, ?god=1 makes him invulnerable.
 */

/** Dev builds and the benchmark build (`vite build --mode bench`) expose playtest hooks; release builds strip them. */
export const DEV_TOOLS = import.meta.env.DEV || import.meta.env.MODE === 'bench';

export interface LaunchParams {
  start: string | null;
  gallery: boolean;
  debug: boolean;
  mute: boolean;
  at: number | null;
  god: boolean;
  /** Extra aliens for the story dial (playtesting). */
  aliens: string[];
  training: boolean;
  /** Level for ?start= (and a direct start with ?level= alone). */
  level: string | null;
}

export function launchParams(): LaunchParams {
  let search = '';
  try {
    search = window.location.search;
  } catch {
    search = '';
  }
  const q = new URLSearchParams(search);
  const dev = DEV_TOOLS;
  const at = dev && q.has('at') ? Number(q.get('at')) : null;
  return {
    start: q.get('start') ?? (at !== null && Number.isFinite(at) ? `@${at}` : null),
    gallery: q.has('gallery'),
    debug: q.has('debug'),
    mute: q.has('mute'),
    at: at !== null && Number.isFinite(at) ? at : null,
    god: dev && q.has('god'),
    aliens: (q.get('aliens') ?? '')
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0),
    training: q.has('training'),
    level: q.get('level'),
  };
}
