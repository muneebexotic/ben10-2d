import type { Rect } from '../types';

/** A beam's new direction (a unit vector), written in place. */
export interface BeamDir {
  dx: number;
  dy: number;
}

/**
 * A beam just bounced off Diamondhead's shield at (x, y), heading `dir`: if a
 * target lies within `coneCos` (the cosine of the assist angle) of that
 * heading and within `range`, the beam turns to it. It aims along the
 * target's middle line (the centre of a small receiver, the long axis of a
 * crystal seam) at the point nearest its own line, so a beam already on
 * target barely moves and a seam is met where the beam is closest. The
 * closest match in angle wins; `dir` is left alone when nothing qualifies.
 * Returns whether it turned.
 */
export function aimBeam(x: number, y: number, dir: BeamDir, targets: readonly Rect[], coneCos: number, range: number): boolean {
  let best = coneCos;
  let bx = 0;
  let by = 0;
  for (const r of targets) {
    // Where the beam's line passes the target's middle, pulled onto its middle line (inside it, never on an edge a
    // stepped beam could slip past).
    const inset = Math.min(r.w, r.h) / 2;
    const t = Math.max(0, (r.x + r.w / 2 - x) * dir.dx + (r.y + r.h / 2 - y) * dir.dy);
    const px = Math.min(r.x + r.w - inset, Math.max(r.x + inset, x + dir.dx * t)) - x;
    const py = Math.min(r.y + r.h - inset, Math.max(r.y + inset, y + dir.dy * t)) - y;
    const d = Math.hypot(px, py);
    if (d === 0 || d > range) continue;
    const cos = (px * dir.dx + py * dir.dy) / d;
    if (cos > best) {
      best = cos;
      bx = px / d;
      by = py / d;
    }
  }
  if (best === coneCos) return false;
  dir.dx = bx;
  dir.dy = by;
  return true;
}
