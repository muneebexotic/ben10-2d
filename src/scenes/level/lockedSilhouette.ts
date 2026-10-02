import { getAlien, hasAlien } from '../../aliens/registry';
import { ROSTER } from '../../config/roster';
import type { CrackedWallOptions } from '../../entities/props/CrackedWall';
import { TEX } from '../preload/assetKeys';
import { SILHOUETTE_KEYS, type SilhouetteId } from '../preload/silhouettes';

/** How a secret shows an alien the player doesn't have yet: its shadow, and the chapter it arrives in. */
export function lockedSilhouette(alienId: string): CrackedWallOptions['locked'] {
  const chapter = ROSTER[alienId]?.chapter ?? null;
  if (hasAlien(alienId)) {
    const a = getAlien(alienId);
    return { texture: a.texture, frame: 0, scale: Math.min(1.4, 40 / a.frame.h), chapter };
  }
  if (alienId in SILHOUETTE_KEYS) return { texture: SILHOUETTE_KEYS[alienId as SilhouetteId], frame: 0, scale: 1.4, chapter };
  return { texture: TEX.lockedAlien, frame: 0, scale: 1, chapter };
}
