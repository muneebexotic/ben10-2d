import type { EntitySpawn, LevelData, LevelTheme } from './types';

type CardSpawn = Extract<EntitySpawn, { type: 'card' }>;

/**
 * What the menus need to know about a story level without loading it (each
 * chapter's level, story, bosses and art are their own chunk, loaded when the
 * chapter starts): its name, theme, par time, cards and checkpoints.
 * `tests/manifest.test.ts` checks every entry against its level data.
 */
export interface LevelMeta {
  id: string;
  chapter: number;
  name: string;
  theme: LevelTheme;
  parTimeMs?: number;
  /** The chapter closes this act (the act ending plays after its first clear). */
  actEnd?: number;
  cards: ReadonlyArray<Pick<CardSpawn, 'id' | 'requires' | 'reward'>>;
  checkpoints: ReadonlyArray<{ id: string; label: string }>;
}

export const LEVEL_META: readonly LevelMeta[] = [
  {
    id: 'ch1',
    chapter: 1,
    name: 'CAMP CRASH',
    theme: 'forest',
    cards: [
      { id: 'ch1-card-ridge' },
      { id: 'ch1-card-vault', requires: 'fourarms' },
      { id: 'ch1-card-den', requires: 'wildmutt' },
      { id: 'ch1-card-beam', requires: 'diamondhead' },
      { id: 'ch1-card-creek' },
      { id: 'ch1-card-alcove' },
      { id: 'ch1-card-hatch', requires: 'upgrade' },
    ],
    checkpoints: [
      { id: 'cp-cliff', label: 'CLIFF' },
      { id: 'cp-ravine', label: 'RAVINE' },
      { id: 'cp-nest', label: 'NEST' },
      { id: 'cp-arena', label: 'CRASH SITE' },
    ],
  },
  {
    id: 'ch2',
    chapter: 2,
    name: 'ROAD TRIP',
    theme: 'highway',
    parTimeMs: 420_000,
    cards: [
      { id: 'ch2-card-diner' },
      { id: 'ch2-card-hoodoo' },
      { id: 'ch2-card-river' },
      { id: 'ch2-card-garage', requires: 'upgrade' },
      { id: 'ch2-card-sign', requires: 'stinkfly' },
      { id: 'ch2-card-vault', requires: 'fourarms' },
    ],
    checkpoints: [
      { id: 'cp-canyon', label: 'CANYON' },
      { id: 'cp-river', label: 'RIVER' },
      { id: 'cp-island', label: 'ISLAND' },
      { id: 'cp-farbank', label: 'FAR BANK' },
      { id: 'cp-convoy', label: 'CONVOY' },
      { id: 'cp-truckstop', label: 'TRUCK STOP' },
      { id: 'cp-arena', label: 'ROADBREAKER' },
    ],
  },
  {
    id: 'ch3',
    chapter: 3,
    name: 'DR. ANIMO',
    theme: 'museum',
    parTimeMs: 540_000,
    actEnd: 1,
    cards: [
      { id: 'ch3-card-roof' },
      { id: 'ch3-card-egg', requires: 'fourarms' },
      { id: 'ch3-card-bear' },
      { id: 'ch3-card-dark', requires: 'wildmutt' },
      { id: 'ch3-card-vault', requires: 'ghostfreak' },
      { id: 'ch3-card-whale' },
      { id: 'ch3-card-security', requires: 'upgrade' },
      { id: 'ch3-card-vent', requires: 'greymatter' },
      { id: 'ch3-card-vat', requires: 'ripjaws' },
    ],
    checkpoints: [
      { id: 'cp-hall', label: 'GREAT HALL' },
      { id: 'cp-mammals', label: 'HALL OF MAMMALS' },
      { id: 'cp-dark', label: 'NIGHT GALLERY' },
      { id: 'cp-shaft', label: 'THE CLIMB' },
      { id: 'cp-upper', label: 'UPPER GALLERY' },
      { id: 'cp-atrium', label: 'ATRIUM' },
      { id: 'cp-lockdown', label: 'LOCKDOWN' },
      { id: 'cp-lab', label: 'ANIMO\'S LAB' },
      { id: 'cp-frog', label: 'KING CROAK' },
    ],
  },
  {
    id: 'ch4',
    chapter: 4,
    name: 'KEVIN 11',
    theme: 'city',
    parTimeMs: 540_000,
    cards: [
      { id: 'ch4-card-sign' },
      { id: 'ch4-card-claw', requires: 'greymatter' },
      { id: 'ch4-card-stage', requires: 'wildmutt' },
      { id: 'ch4-card-lair' },
      { id: 'ch4-card-sumo', reward: 'sumo' },
      { id: 'ch4-card-laser', requires: 'diamondhead' },
      { id: 'ch4-card-depot', requires: 'fourarms' },
      { id: 'ch4-card-sealed', requires: 'ghostfreak' },
    ],
    checkpoints: [
      { id: 'cp-arcade', label: 'GAME ZONE' },
      { id: 'cp-lair', label: 'LASER LAIR' },
      { id: 'cp-highscore', label: 'HIGH SCORE' },
      { id: 'cp-station', label: 'ROSEWOOD STATION' },
      { id: 'cp-line', label: 'MAINTENANCE LINE' },
      { id: 'cp-turn', label: 'THE TURN' },
      { id: 'cp-depot', label: 'POWER DEPOT' },
      { id: 'cp-kevin', label: 'KEVIN 11' },
    ],
  },
  {
    id: 'ch5',
    chapter: 5,
    name: 'BOUNTY HUNTERS',
    theme: 'western',
    parTimeMs: 660_000,
    cards: [
      { id: 'ch5-card-mouse', requires: 'greymatter' },
      { id: 'ch5-card-tower' },
      { id: 'ch5-card-hotel' },
      { id: 'ch5-card-alcove' },
      { id: 'ch5-card-loop', requires: 'cannonbolt' },
      { id: 'ch5-card-dive', reward: 'dive' },
      { id: 'ch5-card-ledge' },
      { id: 'ch5-card-flooded', requires: 'ripjaws' },
    ],
    checkpoints: [
      { id: 'cp-street', label: 'MAIN STREET' },
      { id: 'cp-jail', label: 'JAIL' },
      { id: 'cp-hotel', label: 'HOTEL' },
      { id: 'cp-minehead', label: 'MINE HEAD' },
      { id: 'cp-tunnels', label: 'RAIL TUNNELS' },
      { id: 'cp-dive', label: 'DEEP DIVE' },
      { id: 'cp-cavern', label: 'CRYSTAL CAVERN' },
      { id: 'cp-crystals', label: 'CRYSTAL FIELD' },
      { id: 'cp-lift', label: 'THE LIFT' },
      { id: 'cp-hunters', label: 'THE HUNTERS' },
      { id: 'cp-hunters-shaft', label: 'SIXSIX' },
      { id: 'cp-hunters-yard', label: 'TETRAX' },
    ],
  },
  {
    id: 'ch6',
    chapter: 6,
    name: 'MAGIC',
    theme: 'karachi',
    parTimeMs: 720_000,
    actEnd: 2,
    cards: [
      { id: 'ch6-card-camel' },
      { id: 'ch6-card-bus' },
      { id: 'ch6-card-chandelier' },
      { id: 'ch6-card-shelf' },
      { id: 'ch6-card-trapdoor' },
      { id: 'ch6-card-cistern', requires: 'ripjaws' },
      { id: 'ch6-card-vent', requires: 'greymatter' },
    ],
    checkpoints: [
      { id: 'cp-fair', label: 'SEA VIEW FAIR' },
      { id: 'cp-palace', label: 'PALACE GATE' },
      { id: 'cp-hall', label: 'GREAT HALL' },
      { id: 'cp-library', label: 'THE LIBRARY' },
      { id: 'cp-cellar', label: 'THE CELLARS' },
      { id: 'cp-cage', label: 'THE CAGE' },
      { id: 'cp-tunnel', label: 'KHARADAR TUNNEL' },
      { id: 'cp-engine', label: 'SPELL ENGINE' },
      { id: 'cp-engine-2', label: 'ENGINE: PENDULUM' },
      { id: 'cp-wrap', label: 'TOWER WRAP' },
      { id: 'cp-towertop', label: 'TOWER TOP' },
    ],
  },
];

/** The manifest entry a level's data should produce (the test compares them). */
export function metaOf(level: LevelData): LevelMeta {
  return {
    id: level.id,
    chapter: level.chapter,
    name: level.name,
    theme: level.theme ?? 'forest',
    ...(level.parTimeMs !== undefined ? { parTimeMs: level.parTimeMs } : {}),
    ...(level.story?.actEnd !== undefined ? { actEnd: level.story.actEnd } : {}),
    cards: level.entities
      .filter((e): e is CardSpawn => e.type === 'card')
      .map((c) => ({ id: c.id, ...(c.requires ? { requires: c.requires } : {}), ...(c.reward ? { reward: c.reward } : {}) })),
    checkpoints: level.entities.flatMap((e) => (e.type === 'checkpoint' ? [{ id: e.id, label: e.label }] : [])),
  };
}
