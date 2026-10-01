/**
 * URL switches for playtesting: ?start=<checkpoint id>, ?gallery=1, ?debug=1, ?mute=1,
 * ?aliens=fourarms,xlr8 (adds aliens to the story dial; the run counts as practice),
 * ?training=1 (straight into Omnitrix Training).
 * Dev builds only: ?at=<tile x> spawns Ben anywhere, ?god=1 makes him invulnerable.
 */
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
    aliens: (q.get('aliens') ?? '')
      .split(',')
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id.length > 0),
    training: q.has('training'),
  };
}
