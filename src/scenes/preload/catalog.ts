import { allAliens } from '../../aliens/registry';
import type { FormDefinition } from '../../aliens/types';
import { ANIMS, ASSETS } from './assetKeys';
import type { AnimDef, AssetDef } from './assetTypes';

/** Shared textures plus every registered alien's own art. */
export function buildAssetCatalog(aliens: readonly FormDefinition[]): { assets: AssetDef[]; anims: AnimDef[] } {
  return {
    assets: [...ASSETS, ...aliens.flatMap((a) => a.art.assets)],
    anims: [...ANIMS, ...aliens.flatMap((a) => a.art.anims)],
  };
}

const CATALOG = buildAssetCatalog(allAliens());

/** THE single list Preload loads: every texture and animation in the game. */
export const ALL_ASSETS: readonly AssetDef[] = CATALOG.assets;
export const ALL_ANIMS: readonly AnimDef[] = CATALOG.anims;
