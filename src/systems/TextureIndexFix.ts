/**
 * Batched sprites lose pieces in Phaser 4.2 (BUGS.md U11).
 *
 * Phaser draws sprites with different textures in one batch and picks each
 * one's texture in the fragment shader with exact comparisons on a value
 * interpolated across the triangle (`outTexDatum == float(INDEX)`), drawing
 * transparent black when none matches. Interpolating a constant isn't always
 * exact: across a big triangle it can land a hair off (2.9999998 for 3), and
 * whole bands and wedges of the sprite then match no texture and vanish.
 * Chapter 6's Ferris wheel (a 144 px image turning in a busy batch) lost a
 * different slice nearly every frame. Index 0 is always exact, so it only
 * shows on sprites whose texture lands in a later slot of a batch.
 *
 * The fix rewrites those comparisons, as Phaser hands its shader sources to
 * WebGL, into "nearest index" tests (`abs(id - INDEX) < 0.5`), which pick the
 * same texture whenever the old test matched. Phaser's pinned version stays as
 * it is (upgrades happen in their own session).
 */

const TEXTURE_PICK = /outTexDatum == (float\(INDEX\)|0\.0)/g;
const RESOLUTION_PICK = /texId == float\(i\)/g;

/** The shader source with its texture-index comparisons made tolerant (unchanged if it has none). */
export function fixTextureIndexShader(source: string): string {
  return source.replace(TEXTURE_PICK, 'abs(outTexDatum - $1) < 0.5').replace(RESOLUTION_PICK, 'abs(texId - float(i)) < 0.5');
}

let installed = false;

/** Call once before the game is created: every shader Phaser compiles afterwards goes through the fix. */
export function installTextureIndexFix(): void {
  if (installed) return;
  installed = true;
  try {
    const contexts = [window.WebGLRenderingContext, window.WebGL2RenderingContext];
    for (const Ctx of contexts) {
      const proto = Ctx?.prototype;
      if (!proto) continue;
      const shaderSource = proto.shaderSource;
      proto.shaderSource = function (this: WebGLRenderingContext, shader: WebGLShader, source: string) {
        shaderSource.call(this, shader, fixTextureIndexShader(source));
      };
    }
  } catch {
    // No WebGL here (tests, a canvas fallback): nothing to fix.
  }
}
