import type Phaser from 'phaser';
import type { FormDefinition } from '../../aliens/types';

/** Kevin's purple, darkest to lightest. Copies are the alien's own art remapped onto it by brightness. */
const RAMP = [0x140a24, 0x3a1a6a, 0x6a3aa8, 0x9a6ad8, 0xc89cff, 0xf0e0ff] as const;
const STEPS = [26, 70, 118, 168, 214] as const;

export function copyTextureKey(form: FormDefinition): string {
  return `${form.texture}-copy`;
}

export function copyAnimKey(animKey: string): string {
  return `${animKey}-copy`;
}

/**
 * A twisted purple copy of an alien's sheet (and its animations), made the
 * first time Kevin copies it: every pixel keeps its shape and shading but
 * moves onto Kevin's purple ramp.
 */
export function ensureCopyArt(scene: Phaser.Scene, form: FormDefinition): string {
  const key = copyTextureKey(form);
  if (scene.textures.exists(key)) return key;
  const src = scene.textures.get(form.texture);
  const img = src.getSourceImage() as HTMLCanvasElement | HTMLImageElement;
  const w = img.width;
  const h = img.height;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return form.texture;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const lum = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11;
    let step = 0;
    while (step < STEPS.length && lum >= STEPS[step]) step++;
    const c = RAMP[step];
    px[i] = (c >> 16) & 0xff;
    px[i + 1] = (c >> 8) & 0xff;
    px[i + 2] = c & 0xff;
  }
  ctx.putImageData(data, 0, 0);
  tex.refresh();
  // Same frames as the original sheet.
  for (const name of src.getFrameNames()) {
    const f = src.get(name);
    tex.add(name, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
  }
  for (const a of form.art.anims) {
    if (a.texture !== form.texture || scene.anims.exists(copyAnimKey(a.key))) continue;
    scene.anims.create({ key: copyAnimKey(a.key), frames: a.frames.map((frame) => ({ key, frame })), frameRate: a.frameRate, repeat: a.repeat });
  }
  return key;
}
