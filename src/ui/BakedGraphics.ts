import Phaser from 'phaser';

let serial = 0;

/** Steps that move the end of a ring of `radius` by about one pixel: a timer arc never needs finer. */
export function arcSteps(radius: number): number {
  return Math.max(1, Math.ceil(2 * Math.PI * radius));
}

/**
 * Vector drawing rendered once into a texture and shown as a single Image.
 *
 * Phaser rebuilds a Graphics object's geometry every frame it is drawn
 * (circles and arcs become triangle fans, strokes become quads), so a HUD
 * ring or panel left as Graphics pays that cost 60 times a second even when
 * nothing changed. Baked, it is one textured quad until `draw` runs again.
 * The drawing goes through the same WebGL renderer, so pixels match.
 *
 * Draw in local coordinates: (0, 0) is where the Image sits (its position in
 * a Container), and everything drawn must fit in the box given to the
 * constructor (`left`/`top` are usually negative: the box around the origin).
 */
export class BakedGraphics {
  readonly image: Phaser.GameObjects.Image;
  private readonly pen: Phaser.GameObjects.Graphics;
  private readonly texture: Phaser.Textures.DynamicTexture;
  private readonly key: string;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly left: number,
    private readonly top: number,
    width: number,
    height: number,
  ) {
    this.key = `__baked-${serial++}`;
    // Exact size (Phaser rounds odd sizes up to even by default, which would shift the drawing).
    const texture = scene.textures.addDynamicTexture(this.key, Math.ceil(width), Math.ceil(height), false);
    if (!texture) throw new Error(`BakedGraphics: could not create ${this.key}`);
    this.texture = texture;
    this.pen = scene.make.graphics({}, false);
    this.image = scene.add.image(0, 0, this.key).setOrigin(-left / Math.ceil(width), -top / Math.ceil(height));
    // Textures are global; this one belongs to the scene that made it.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Square box of `radius` (plus `pad`) around the origin: for rings and round buttons. */
  static round(scene: Phaser.Scene, radius: number, pad = 3): BakedGraphics {
    const half = Math.ceil(radius + pad);
    return new BakedGraphics(scene, -half, -half, half * 2, half * 2);
  }

  /** Redraws: `paint` gets an empty Graphics to draw on, in local coordinates. */
  draw(paint: (g: Phaser.GameObjects.Graphics) => void): this {
    const pen = this.pen;
    pen.clear();
    paint(pen);
    this.texture.clear();
    this.texture.draw(pen, -this.left, -this.top);
    this.texture.render();
    return this;
  }

  destroy(): void {
    if (!this.scene.textures.exists(this.key)) return;
    this.image.destroy();
    this.pen.destroy();
    this.scene.textures.remove(this.key);
  }
}
