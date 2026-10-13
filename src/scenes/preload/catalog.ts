import { allAliens } from '../../aliens/registry';
import type { FormDefinition } from '../../aliens/types';
import { ANIMS, ASSETS } from './assetKeys';
import type { AnimDef, AssetDef } from './assetTypes';
import { CH5_ANIMS, CH5_ASSETS } from './bounty';

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

/**
 * A chapter's own art (its set, its villains), by level id. A chapter listed
 * with `atBoot: false` is generated the first time something needs it (the
 * level, its Chapter Select card, the gallery) instead of at boot, so boot
 * doesn't grow with every chapter (docs/PERFORMANCE.md, "Loading").
 */
export const CHAPTER_ART: Readonly<Record<string, { assets: readonly AssetDef[]; anims: readonly AnimDef[]; atBoot: boolean }>> = {
  ch5: { assets: CH5_ASSETS, anims: CH5_ANIMS, atBoot: true },
};

/** The art Preload generates at boot: the shared catalog plus every chapter that isn't lazy. */
export const BOOT_ASSETS: readonly AssetDef[] = [...ALL_ASSETS, ...Object.values(CHAPTER_ART).filter((c) => c.atBoot).flatMap((c) => c.assets)];
export const BOOT_ANIMS: readonly AnimDef[] = [...ALL_ANIMS, ...Object.values(CHAPTER_ART).filter((c) => c.atBoot).flatMap((c) => c.anims)];

/** Every texture there is, chapter art included (the gallery). */
export const EVERY_ASSET: readonly AssetDef[] = [...ALL_ASSETS, ...Object.values(CHAPTER_ART).flatMap((c) => c.assets)];
