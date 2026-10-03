import Phaser from 'phaser';

export interface SheenOptions {
  /** A fixed colour, or 'rainbow' to cycle hues as it sweeps (holo cards). */
  color: number | 'rainbow';
  alpha: number;
  durationMs: number;
  repeatDelayMs: number;
  /** Band width as a fraction of the box width. */
  band?: number;
}

/**
 * A slanted band of light sweeping across a box, drawn clipped to the box so
 * it never spills over its edges. Stops with the object it belongs to.
 */
export function clippedSheen(scene: Phaser.Scene, x0: number, y0: number, w: number, h: number, opts: SheenOptions): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  const band = w * (opts.band ?? 0.28);
  const slant = h * 0.35;
  const state = { t: 0 };
  const tween = scene.tweens.add({
    targets: state,
    t: 1,
    duration: opts.durationMs,
    repeat: -1,
    repeatDelay: opts.repeatDelayMs,
    onUpdate: () => {
      g.clear();
      let color: number;
      if (opts.color === 'rainbow') {
        const rgb = Phaser.Display.Color.HSVToRGB(state.t, 0.55, 1) as Phaser.Types.Display.ColorObject;
        color = Phaser.Display.Color.GetColor(rgb.r, rgb.g, rgb.b);
      } else color = opts.color;
      g.fillStyle(color, opts.alpha);
      for (let yy = 0; yy < h; yy += 2) {
        const start = x0 - band - slant + state.t * (w + band + slant) + (yy / h) * slant;
        const a = Math.max(x0, start);
        const b = Math.min(x0 + w, start + band);
        if (b > a) g.fillRect(a, y0 + yy, b - a, Math.min(2, h - yy));
      }
    },
  });
  g.once(Phaser.GameObjects.Events.DESTROY, () => tween.remove());
  return g;
}
