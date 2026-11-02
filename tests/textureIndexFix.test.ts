import { describe, expect, it } from 'vitest';
import { fixTextureIndexShader } from '../src/systems/TextureIndexFix';

// Phaser's own GLSL for picking a batched sprite's texture, as text.
const SHADERS = import.meta.glob('../node_modules/phaser/src/renderer/webgl/shaders/src/{GetTexture,GetTexRes}.glsl', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const GetTexture = Object.entries(SHADERS).find(([k]) => k.endsWith('GetTexture.glsl'))?.[1] ?? '';
const GetTexRes = Object.entries(SHADERS).find(([k]) => k.endsWith('GetTexRes.glsl'))?.[1] ?? '';

describe('texture index fix (BUGS.md U11)', () => {
  it("rewrites every exact texture-index comparison in Phaser's own shader sources", () => {
    // If a Phaser upgrade changes these sources, this fails: check whether the fix is still needed.
    expect(GetTexture.length).toBeGreaterThan(0);
    expect(GetTexRes.length).toBeGreaterThan(0);
    for (const src of [GetTexture, GetTexRes]) {
      const fixed = fixTextureIndexShader(src);
      expect(fixed).not.toBe(src);
      expect(fixed).not.toMatch(/outTexDatum ==|texId == float/);
    }
    expect(fixTextureIndexShader(GetTexture)).toContain('abs(outTexDatum - float(INDEX)) < 0.5');
    expect(fixTextureIndexShader(GetTexture)).toContain('abs(outTexDatum - 0.0) < 0.5');
    expect(fixTextureIndexShader(GetTexRes)).toContain('abs(texId - float(i)) < 0.5');
  });

  it('leaves other shaders alone', () => {
    const src = 'void main() { float a = 1.0; if (a == 1.0) gl_FragColor = vec4(1.0); }';
    expect(fixTextureIndexShader(src)).toBe(src);
  });
});
