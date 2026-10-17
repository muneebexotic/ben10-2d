import { TILE } from '../config/constants';
import { HexBoss } from '../entities/bosses/hex/HexBoss';
import { ArmorBrain } from '../entities/enemies/magic/armor';
import { GargoyleBrain } from '../entities/enemies/magic/gargoyle';
import { GolemBrain } from '../entities/enemies/magic/golem';
import { IllusionBrain } from '../entities/enemies/magic/illusion';
import { KiteBrain } from '../entities/enemies/magic/kite';
import { RocklingBrain } from '../entities/enemies/magic/rockling';
import { CHAPTER_6 } from '../levels/chapter6';
import { KarachiBackdrop } from '../scenes/level/KarachiBackdrop';
import { buildMagicStory } from '../scenes/level/story/magic';
import { HarbourCliffhanger } from '../scenes/actEnd/HarbourCliffhanger';
import { SpellEngineScene } from '../scenes/engine/SpellEngineScene';
import { TowerScene } from '../scenes/tower/TowerScene';
import { SCENES } from '../scenes/SceneKeys';
import { GWEN_KARACHI_CHATTER } from '../scenes/level/story/magic/lines';
import { CH6_ANIMS, CH6_ASSETS, HEX_ANIMS, HEX_ASSETS } from '../scenes/preload/karachi';
import { ENGINE, FAIR, HEX, MANOR } from '../systems/audio/tracks/karachi';
import type { ChapterArt, ChapterModule } from './types';

/** Hex: Chapter Select's window for Chapter 6 shows him. */
const HEX_ART: ChapterArt = { assets: HEX_ASSETS, anims: HEX_ANIMS };

/** Where the sea is behind the action (the seafront): up to the palace's front wall (tiles). */
const SEAFRONT_TO = 156;

/** Chapter 6, Magic: Karachi. The seafront fair, the pink palace, its cellars, the clock tower. */
export const CHAPTER: ChapterModule = {
  level: CHAPTER_6,
  art: [{ assets: CH6_ASSETS, anims: CH6_ANIMS }, HEX_ART],
  windowArt: HEX_ART,
  backdrop: (scene, level, world) =>
    new KarachiBackdrop(
      scene,
      level,
      (x) => x < SEAFRONT_TO * TILE,
      (x) => ['seafront', 'towerTop'].includes(world.ambientAt(x)),
    ),
  story: buildMagicStory,
  brains: {
    rockling: () => new RocklingBrain(),
    golem: () => new GolemBrain(),
    armor: () => new ArmorBrain(),
    illusion: () => new IllusionBrain(),
    gargoyle: () => new GargoyleBrain(),
    kite: () => new KiteBrain(),
  },
  bosses: { hex: { music: 'hex', hologram: [], create: (scene, world, x) => new HexBoss(scene, world, x) } },
  tracks: { fair: FAIR, manor: MANOR, engine: ENGINE, hex: HEX },
  track: (x) => ((x ?? 0) >= 430 ? 'engine' : (x ?? 0) >= 140 ? 'manor' : 'fair'),
  gwen: { chatter: GWEN_KARACHI_CHATTER },
  // The Spell Engine draws over the level and under the HUD (its dialogue shows over the puzzle).
  cliffhanger: (scene) => new HarbourCliffhanger(scene),
  scenes: [
    { key: SCENES.spellEngine, scene: SpellEngineScene, below: SCENES.ui },
    { key: SCENES.tower, scene: TowerScene, below: SCENES.ui },
  ],
};
