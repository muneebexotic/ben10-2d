import { allAliens } from '../../aliens/registry';
import type { FormDefinition } from '../../aliens/types';
import type { ChapterArt } from '../../chapters/types';
import { ANIMS, ASSETS, TEX } from './assetKeys';
import type { AnimDef, AssetDef } from './assetTypes';
import { GEAR_ART } from './bounty/gearArt';

/** Shared textures plus every registered alien's own art. */
export function buildAssetCatalog(aliens: readonly FormDefinition[]): { assets: AssetDef[]; anims: AnimDef[] } {
  return {
    assets: [...ASSETS, ...aliens.flatMap((a) => a.art.assets)],
    anims: [...ANIMS, ...aliens.flatMap((a) => a.art.anims)],
  };
}

const CATALOG = buildAssetCatalog(allAliens());

/** Every form seen from behind: only THE DEEP DIVE draws them, so they're made with Chapter 5's art. */
const RIDE_BACKS: ReadonlySet<string> = new Set([TEX.benBack, ...allAliens().flatMap((a) => (a.ride?.back ? [a.ride.back] : []))]);

/** THE single list of shared art: every texture and animation used across chapters, made at boot. */
export const ALL_ASSETS: readonly AssetDef[] = CATALOG.assets.filter((a) => !RIDE_BACKS.has(a.key));
export const ALL_ANIMS: readonly AnimDef[] = CATALOG.anims;

/**
 * Shared art made on demand rather than at boot (docs/PERFORMANCE.md, "Loading"):
 * the mine's gear (older chapters' secrets use it too) and every form's back view
 * (THE DEEP DIVE). Each chapter's own art comes with its chunk (`ChapterModule.art`).
 */
export const LAZY_ART: Readonly<Record<string, ChapterArt>> = {
  gear: GEAR_ART,
  rideBacks: { assets: CATALOG.assets.filter((a) => RIDE_BACKS.has(a.key)), anims: [] },
};

/** The art Preload generates at boot. */
export const BOOT_ASSETS: readonly AssetDef[] = ALL_ASSETS;
export const BOOT_ANIMS: readonly AnimDef[] = ALL_ANIMS;
