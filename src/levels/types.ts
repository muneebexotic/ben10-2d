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

export type DroneKind = 'scout' | 'striker' | 'gunner';
export type Density = 'sparse' | 'normal' | 'frequent';
export type FormFilter = 'any' | 'human' | 'alien';

export type EntitySpawn =
  | { type: 'drone'; kind: DroneKind; x: number; y: number }
  | { type: 'barricade'; id: string; x: number; y: number; w: number; h: number }
  | { type: 'checkpoint'; id: string; x: number; y: number; density: Density }
  | { type: 'smoothy'; x: number; y: number }
  | { type: 'card'; id: string; x: number; y: number }
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
}

export interface AmbientZone {
  x: number;
  ambient: 'camp' | 'forest' | 'ravine' | 'crash';
}

export interface LevelData {
  id: string;
  chapter: number;
  name: string;
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
  podTriggerX: number;
  introSpawns: Array<{ kind: DroneKind; x: number; y: number }>;
}
