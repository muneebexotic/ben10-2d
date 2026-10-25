import type { MoveStyle } from '../../scenes/preload/cartoon/humanoid';

/**
 * One character's HD cartoon manifest (Act 3): who it is, which game sheets
 * its rig draws in an HD chapter, its colours and timing, and every clip it
 * has (docs/ART_COVERAGE.md is generated from these lines). A replacement
 * sprite sheet dropped in `public/assets/licensed/<id>/` (see `licensed`)
 * is used instead of the rig, with no code changes.
 */
export interface CartoonManifest {
  id: string;
  name: string;
  /** Game sheets (texture keys) this character's rig draws, and the game frame each uses. */
  sheets: ReadonlyArray<{ texture: string; frame: { w: number; h: number; feetY: number } }>;
  colors: Readonly<Record<string, number>>;
  style?: MoveStyle;
  /** Every clip, and what it's for. */
  clips: Readonly<Record<string, string>>;
  /** Known gaps (empty when complete). */
  gaps?: readonly string[];
}

/**
 * A licensed replacement sheet: `public/assets/licensed/<id>/sheet.png` plus
 * `sheet.json` in this shape. Frames are in rows of `columns`; `scale` is
 * texels per game pixel (3 for art drawn at three times the game's size).
 * Any clip the sheet doesn't have falls back to the rig.
 */
export interface LicensedSheet {
  frameWidth: number;
  frameHeight: number;
  /** Texel row the feet stand on, within a frame. */
  feetY: number;
  scale: number;
  clips: Readonly<Record<string, { frames: readonly number[]; fps: number; loop?: boolean }>>;
}
