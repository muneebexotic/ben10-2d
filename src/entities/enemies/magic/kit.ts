import type { Drone } from '../Drone';

/** Shows a held frame (stopping any animation) or plays a looping animation, only when it changes. */
export function show(d: Drone, what: number | string): void {
  const s = d.sprite;
  if (typeof what === 'number') {
    if (s.anims.isPlaying) s.stop();
    if (String(s.frame.name) !== String(what)) s.setFrame(what);
    return;
  }
  if (s.anims.currentAnim?.key !== what || !s.anims.isPlaying) s.play(what, true);
}
