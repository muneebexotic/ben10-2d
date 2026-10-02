/** Level data is authored in tile units. (0,0) is the top-left tile. */

export type SolidMaterial = 'ground' | 'rock';

export interface SolidRect {
  material: SolidMaterial;
  x: number;
  /** First solid row (the walkable surface). */
  top: number;
  w: number;
  /** Rows of solid material. Defaults to filling to the bottom of the level. */
  h?: number;
}

/** Carves empty space out of solids (tunnels, alcoves). Applied after solids. */
export interface CarveRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatformSpan {
  x: number;
  y: number;
  w: number;
}

export interface WaterSpan {
  x: number;
  w: number;
  surface: number;
  depth: number;
}

export type DroneKind = 'scout' | 'striker' | 'gunner' | 'armored' | 'hornet';
export type Density = 'sparse' | 'normal' | 'frequent';
export type FormFilter = 'any' | 'human' | 'alien';

export type EntitySpawn =
  | { type: 'drone'; kind: DroneKind; x: number; y: number }
  | { type: 'barricade'; id: string; x: number; y: number; w: number; h: number }
  /**
   * `label` names the speedrun split. A `hidden` checkpoint has no post: a set
   * piece reaches it (mid-chase), and a restart there hands back to that set piece.
   */
  | { type: 'checkpoint'; id: string; x: number; y: number; density: Density; label: string; hidden?: boolean }
  | { type: 'smoothy'; x: number; y: number }
  /** `requires` hides the card until that alien is on the dial (a reason to replay chapters). */
  | { type: 'card'; id: string; x: number; y: number; requires?: string }
  /** One tile wide, `h` tall, starting at row `y`. Only a smash hit (Four Arms) breaks it. `rebuildMs` (Training) makes it reform. */
  | { type: 'crackedWall'; id: string; x: number; y: number; h: number; requires: string; rebuildMs?: number }
  /** A boulder strong aliens can lift and throw. `y` is the surface it rests on. */
  | { type: 'boulder'; x: number; y: number }
  /** Training dummy: takes any hit, shows damage numbers, never breaks. */
  | { type: 'dummy'; x: number; y: number }
  | { type: 'jammer'; x: number; y: number; fieldFrom: number; gateX: number; gateTop: number }
  | { type: 'pod'; x: number; y: number }
  /** `floor`: the arena's floor row (default 24). `kind` picks the boss. */
  | { type: 'boss'; x: number; y: number; arenaFrom: number; arenaTo: number; triggerX: number; kind?: BossKind; floor?: number }
  /** Drones that fly in from off-screen once Ben passes `triggerX` (each spawn's x is where it heads). */
  | { type: 'wave'; id: string; triggerX: number; from: 'left' | 'right' | 'above'; spawns: Array<{ kind: DroneKind; x: number; y: number }> }
  /**
   * A secret only a later alien can reach (a card out of every current alien's
   * reach). Standing in the zone shows that alien's locked silhouette and the
   * chapter it unlocks in.
   */
  | { type: 'alienHint'; id: string; alien: string; x: number; y: number; w: number; h: number; line: string }
  | { type: 'decor'; kind: DecorKind; x: number; y: number; flip?: boolean; frame?: number };

export type DecorKind =
  | 'rv'
  | 'tent'
  | 'campfire'
  | 'sign'
  | 'log'
  | 'rock'
  | 'bush'
  | 'stump'
  | 'wreck'
  | 'crater'
  | 'debris'
  | 'fire'
  // Road Trip (desert highway).
  | 'cactus'
  | 'cactusSmall'
  | 'diner'
  | 'gasPump'
  | 'smoothyStand'
  | 'billboard'
  | 'roadSign'
  | 'mileMarker'
  | 'bridgeEnd'
  | 'girder'
  | 'guardrail'
  | 'tumbleweed'
  | 'skull'
  | 'barrel'
  | 'carWreck'
  | 'poleSign'
  | 'garage'
  | 'neon'
  | 'haulerWreck'
  | 'fence';

export interface PromptZone {
  id: string;
  x: number;
  w: number;
  text: string;
  /** Shown instead of `text` while transformed. */
  alienText?: string;
  /** Shown instead of `text` while human. */
  humanText?: string;
  /** Shown while human with the Omnitrix ready to use. */
  readyText?: string;
  /** Shown instead while Ben is a particular alien (by id). */
  formText?: Partial<Record<string, string>>;
}

export type AmbientKind = 'camp' | 'forest' | 'ravine' | 'crash' | 'sim' | 'sunset' | 'dusk' | 'night' | 'neon';

export interface AmbientZone {
  x: number;
  ambient: AmbientKind;
}

/** Visual set: the night forest, the Omnitrix's training simulation, or the desert highway at sundown. */
export type LevelTheme = 'forest' | 'sim' | 'highway';

export type BossKind = 'hunter' | 'roadbreaker';

/** A strip of asphalt drawn over the ground (row `y` is the road surface). */
export interface RoadSpan {
  x: number;
  w: number;
  y: number;
}

/** Highway sky: time of day (0 golden hour, 0.5 dusk, 1 night) by position. */
export interface SkyKey {
  x: number;
  t: number;
}

/**
 * Where a chapter's story moments happen. Each one is optional; the level
 * builds the set pieces it has. Positions are in tiles.
 */
export interface StoryPlan {
  /** Opening cinematic: the Rustbucket on the highway, then it pulls in at `parkX`. */
  roadIntro?: { parkX: number; parkY: number };
  /**
   * The new-DNA moment for an alien, when Ben passes `x` (skipped once the file
   * has it). A `scripted` one is started by another set piece (the chase);
   * its `x` still decides whether a restart is past it.
   */
  unlocks?: Array<{ alien: string; x: number; line: string; scripted?: boolean }>;
  /**
   * The Rustbucket chase: Ben boards the RV at `boardX` (its roof), the chase
   * runs on the road at `arenaX` (centre), and afterwards play picks up at `endX` (the next checkpoint; the RV parks just behind it).
   */
  chase?: { boardX: number; boardY: number; arenaX: number; roadY: number; endX: number; endY: number; checkpoint: string };
  /** Lines after the boss falls. */
  outro?: Array<{ who: string; text: string; ms: number }>;
}

export interface LevelData {
  id: string;
  /** Story chapter number, or 0 for levels outside the story (Training). */
  chapter: number;
  name: string;
  theme?: LevelTheme;
  /** Par time for the score (default: SCORING.parTimeMs). */
  parTimeMs?: number;
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  solids: SolidRect[];
  carves: CarveRect[];
  platforms: PlatformSpan[];
  water: WaterSpan[];
  entities: EntitySpawn[];
  prompts: PromptZone[];
  ambience: AmbientZone[];
  /** Story intro: where the pod cutscene starts and the drones that crash it. Unused without a pod. */
  podTriggerX: number;
  introSpawns: Array<{ kind: DroneKind; x: number; y: number }>;
  roads?: RoadSpan[];
  sky?: SkyKey[];
  story?: StoryPlan;
}
