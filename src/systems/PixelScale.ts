import Phaser from 'phaser';

/**
 * EXPAND scaling gives a wide screen a fractional game width (799.51 px on a
 * 915x412 phone). Phaser files the camera's filter render targets under their
 * rounded size and looks them up by the exact size, so a fractional camera
 * never finds its old target: it reallocated one every frame (a GPU stall) and
 * kept a second's worth alive (one 800x360 colour + stencil target per frame,
 * 60-120 of them on a 60-120 Hz phone). Snapping the width down to whole game
 * pixels fixes both, and the canvas then scales by exactly the same factor
 * both ways, so pixel art stays crisp. The view is at most one game pixel
 * narrower; #game's background shows through a sub-pixel sliver.
 *
 * Installed from the game config's preBoot callback, before the first layout.
 */
export function snapGameWidth(game: Phaser.Game): void {
  const scale = game.scale;
  const update = scale.updateScale.bind(scale);
  scale.updateScale = () => {
    update();
    if (scale.scaleMode !== Phaser.Scale.EXPAND) return;
    const { width, height } = scale.gameSize;
    const whole = wholeWidth(width);
    if (whole === width) return;
    scale.baseSize.setSize(whole, height);
    scale.gameSize.setSize(whole, height);
    scale.canvas.width = whole;
    const cssPerPixel = scale.displaySize.height / height;
    scale.displaySize.setSize(whole * cssPerPixel, scale.displaySize.height);
    scale.canvas.style.width = `${whole * cssPerPixel}px`;
    scale.getParentBounds();
    scale.updateCenter();
  };
}

/** Whole game pixels, ignoring float noise just under an integer (e.g. 799.99999). */
export function wholeWidth(width: number): number {
  return Math.max(1, Math.floor(width + 1e-6));
}
