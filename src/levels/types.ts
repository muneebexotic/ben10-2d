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
  /** `label` names the speedrun split. */
  | { type: 'checkpoint'; id: string; x: number; y: number; density: Density; label: string }
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
  | { type: 'boss'; x: number; y: number; arenaFrom: number; arenaTo: number; triggerX: number }
  | { type: 'decor'; kind: DecorKind; x: number; y: number; flip?: boolean };

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
  | 'fire';

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
}

export type AmbientKind = 'camp' | 'forest' | 'ravine' | 'crash' | 'sim';

export interface AmbientZone {
  x: number;
  ambient: AmbientKind;
}

/** Visual set: the night forest, or the Omnitrix's holographic training simulation. */
export type LevelTheme = 'forest' | 'sim';

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
}
