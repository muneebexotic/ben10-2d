/** URL switches for playtesting: ?start=<checkpoint id>, ?gallery=1, ?debug=1, ?mute=1. */
export interface LaunchParams {
  start: string | null;
  gallery: boolean;
  debug: boolean;
  mute: boolean;
}

export function launchParams(): LaunchParams {
  let search = '';
  try {
    search = window.location.search;
  } catch {
    search = '';
  }
  const q = new URLSearchParams(search);
  return {
    start: q.get('start'),
    gallery: q.has('gallery'),
    debug: q.has('debug'),
    mute: q.has('mute'),
  };
}
