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

/**
 * Water, Dr. Animo's glowing mutagen (both runnable by XLR8), a tar pit (too
 * sticky to run on), or a subway track bed with a live third rail (a pit of
 * sparks nobody runs across).
 */
export type LiquidKind = 'water' | 'mutagen' | 'tar' | 'rail';

export interface WaterSpan {
  x: number;
  w: number;
  surface: number;
  depth: number;
  kind?: LiquidKind;
}

/** Flying enemies (Vilgax's drones, Dr. Animo's mutant bats, Kevin's sparks): they use the Drone body. */
export type DroneKind = 'scout' | 'striker' | 'gunner' | 'armored' | 'hornet' | 'bat' | 'spark';
/** Dr. Animo's ground mutants: they walk, climb and leap. */
export type MutantKind = 'rat' | 'roach' | 'lurker' | 'brute';
/** Machines that walk or roll (Chapter 4): the arcade's animatronic mascots and the subway's track-bots (Kevin overcharges some: voltbots). */
export type RobotKind = 'mascot' | 'trackbot' | 'voltbot';
export type EnemyKind = DroneKind | MutantKind | RobotKind;
export type Density = 'sparse' | 'normal' | 'frequent';
export type FormFilter = 'any' | 'human' | 'alien';

export type EntitySpawn =
  | { type: 'drone'; kind: DroneKind; x: number; y: number }
  /** A ground mutant standing on row `y` (`ceiling`: a roach clinging to the ceiling above it). */
  | { type: 'mutant'; kind: MutantKind; x: number; y: number; ceiling?: boolean }
  /** A walking or rolling machine standing on row `y`. */
  | { type: 'robot'; kind: RobotKind; x: number; y: number }
  | { type: 'barricade'; id: string; x: number; y: number; w: number; h: number }
  /**
   * `label` names the speedrun split. A `hidden` checkpoint has no post: a set
   * piece reaches it (mid-chase), and a restart there hands back to that set piece.
   */
  | { type: 'checkpoint'; id: string; x: number; y: number; density: Density; label: string; hidden?: boolean }
  | { type: 'smoothy'; x: number; y: number }
  /**
   * `requires` hides the card until that alien is on the dial (a reason to replay chapters).
   * `reward`: it only appears when a set piece pays it out (the SUMO SLAMMERS high score).
   */
  | { type: 'card'; id: string; x: number; y: number; requires?: string; reward?: string }
  /** One tile wide, `h` tall, starting at row `y`. Only a smash hit (Four Arms) breaks it. `rebuildMs` (Training) makes it reform. */
  /** `opened`: what breaking it announces, when it isn't a secret vault (a lock on the way, say). */
  | { type: 'crackedWall'; id: string; x: number; y: number; h: number; requires: string; rebuildMs?: number; opened?: { title: string; subtitle: string; line: string } }
  /** A boulder strong aliens can lift and throw. `y` is the surface it rests on. */
  | { type: 'boulder'; x: number; y: number }
  /** Training dummy: takes any hit, shows damage numbers, never breaks. */
  | { type: 'dummy'; x: number; y: number }
  | { type: 'jammer'; x: number; y: number; fieldFrom: number; gateX: number; gateTop: number }
  | { type: 'pod'; x: number; y: number }
  /** `floor`: the arena's floor row (default 24). `kind` picks the boss. */
  | { type: 'boss'; x: number; y: number; arenaFrom: number; arenaTo: number; triggerX: number; kind?: BossKind; floor?: number }
  /** Drones that fly in from off-screen once Ben passes `triggerX` (each spawn's x is where it heads). */
  | { type: 'wave'; id: string; triggerX: number; from: 'left' | 'right' | 'above'; spawns: Array<{ kind: EnemyKind; x: number; y: number }> }
  /**
   * A secret passage that looks like the wall around it: solid until a form
   * that senses (Wildmutt) comes close, then it shows its outline and opens.
   */
  | { type: 'hiddenDoor'; id: string; x: number; y: number; w: number; h: number }
  /** A skylight pane: only a heavy enough smash (a high meteor drop) breaks it. */
  | { type: 'glassFloor'; id: string; x: number; y: number; w: number }
  /** Mutant vines: like a barricade, only fire gets through. */
  | { type: 'vines'; id: string; x: number; y: number; w: number; h: number }
  /**
   * A secret only a later alien can reach (a card out of every current alien's
   * reach). Standing in the zone shows that alien's locked silhouette and the
   * chapter it unlocks in.
   */
  | { type: 'alienHint'; id: string; alien: string; x: number; y: number; w: number; h: number; line: string }
  /**
   * Machines Upgrade merges into (Chapter 4 on). A security shutter only he
   * opens, filling `w` x `h` tiles from (x, y).
   */
  | { type: 'techDoor'; id: string; x: number; y: number; w: number; h: number }
  /** A laser turret standing on row `y` (or hanging under it: `ceiling`). Hostile ones shoot Ben; dormant ones wait for Upgrade. */
  | { type: 'turret'; id: string; x: number; y: number; hostile: boolean; ceiling?: boolean; facing?: 1 | -1 }
  /** A dead lift pad `w` tiles wide sitting on row `y`'s floor (its top is row y - 1); merged, it rises until its top is row `toY`. */
  | { type: 'lift'; id: string; x: number; y: number; w: number; toY: number }
  /**
   * A maintenance cart (3 tiles) on a rail along surface row `y`, starting at
   * tile `x`; merged, Upgrade drives it as far as `toX`. A `barrier` at the
   * far end only a speeding cart breaks; `exit` is where Ben ends up (reachability).
   */
  | { type: 'cart'; id: string; x: number; y: number; toX: number; barrier?: { x: number; y: number; h: number }; exit: { x: number; y: number } }
  /** An arcade cabinet standing on row `y`: merged, its screen blasts GAME OVER at whatever's in front. */
  | { type: 'cabinet'; id: string; x: number; y: number; frame?: number; flip?: boolean }
  /** The SUMO SLAMMERS cabinet: merged, it plays the high-score mini-game (pays out `reward`). */
  | { type: 'sumo'; id: string; x: number; y: number; reward: string }
  /** Subway trains roar along the track bed between `fromX` and `toX` (tiles) at row `y` (their wheels), every `everyMs`. */
  | { type: 'trains'; id: string; fromX: number; toX: number; y: number; everyMs: number; firstMs: number }
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
  | 'shed'
  | 'neon'
  | 'haulerWreck'
  | 'fence'
  // Dr. Animo (the museum at night and his lab).
  | 'lampPost'
  | 'museumFacade'
  | 'trex'
  | 'mammoth'
  | 'whale'
  | 'pterosaur'
  | 'displayCase'
  | 'stuffedBear'
  | 'banner'
  | 'painting'
  | 'velvetRope'
  | 'bench'
  | 'exitSign'
  | 'tarSign'
  | 'meteorite'
  | 'mutagenTank'
  | 'cage'
  | 'labConsole'
  | 'pipes'
  | 'staffDoor'
  | 'columns'
  // Kevin 11 (downtown, the GAME ZONE arcade, subway Line 11, the substation).
  | 'storefront'
  | 'arcadeFront'
  | 'streetLamp'
  | 'powerPole'
  | 'newsstand'
  | 'hydrant'
  | 'trashCan'
  | 'neonSign'
  | 'prizeCounter'
  | 'ticketMachine'
  | 'clawMachine'
  | 'skeeBall'
  | 'bandStage'
  | 'breakerBox'
  | 'poster'
  | 'laserBarrier'
  | 'uvLight'
  | 'stationSign'
  | 'subwayMap'
  | 'pillar'
  | 'turnstile'
  | 'tunnelLight'
  | 'cables'
  | 'transformer'
  | 'generator'
  | 'warningSign'
  | 'securityLaser'
  | 'sealedDoor'
  | 'catwalkRail';

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

export type AmbientKind =
  | 'camp' | 'forest' | 'ravine' | 'crash' | 'sim' | 'sunset' | 'dusk' | 'night' | 'neon' | 'street' | 'museum' | 'gallery' | 'blackout' | 'atrium' | 'lab'
  | 'downtown' | 'arcade' | 'lair' | 'subway' | 'tunnel' | 'substation';

export interface AmbientZone {
  x: number;
  ambient: AmbientKind;
}

/** Visual set: the night forest, the Omnitrix's training simulation, the desert highway at sundown, the museum at night, or downtown and under it. */
export type LevelTheme = 'forest' | 'sim' | 'highway' | 'museum' | 'city';

export type BossKind = 'hunter' | 'roadbreaker' | 'frog' | 'kevin';

/** Interior back walls (museum halls and lab; the arcade, the laser tag arena, the subway, its tunnels and the substation). */
export type InteriorWall = 'hall' | 'lab' | 'arcade' | 'lair' | 'subway' | 'tunnel' | 'substation';

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
  /** Chapter 3's opening: the Rustbucket parked outside the museum at night (`x`, `y`: where it stands). */
  museumIntro?: { x: number; y: number };
  /**
   * The villain's entrance: Ben walking past `triggerX` stops the action, and
   * Dr. Animo makes his speech from (x, y), unleashes his mutants and leaves
   * toward `exitX`.
   */
  villainIntro?: { triggerX: number; x: number; y: number; exitX: number; spawns: Array<{ kind: EnemyKind; x: number; y: number }> };
  /**
   * The lights go out across `fromX`-`toX` once Ben passes `triggerX`; the
   * chapter's scripted unlock for `alien` happens in the dark.
   */
  blackout?: { triggerX: number; fromX: number; toX: number; alien: string };
  /**
   * The floor at the atrium's edge gives way (`collapse`, solid tiles that
   * crumble) as Ben passes `triggerX`; the villain escapes across to (toX, toY);
   * the chapter's scripted unlock for `alien` follows.
   */
  atrium?: { triggerX: number; collapse: { x: number; y: number; w: number; h: number }; toX: number; toY: number; alien: string };
  /** The chapter closes act `actEnd`: after its results, on the first clear, the cliffhanger and ACT COMPLETE (ActEndScene). */
  actEnd?: number;
  /** Chapter 4's opening: the Rustbucket parked on Main Street at dusk (`x`, `y`: where it stands), the arcade at `arcadeX`. */
  cityIntro?: { x: number; y: number; arcadeX: number };
  /**
   * Kevin: Ben meets him at `meetX` (he stands at `kevinX`), he juices the
   * arcade's breaker at `breakerX` (waking `spawns`), then follows Ben as a
   * buddy until `untilX`.
   */
  kevin?: { meetX: number; kevinX: number; breakerX: number; spawns: Array<{ kind: EnemyKind; x: number; y: number }>; untilX: number };
  /**
   * The laser tag arena locks down when Ben passes `triggerX`: glass walls at
   * `fromX` and `toX` (tiles), the hostile turrets inside go live, and the
   * chapter's scripted unlock for `alien` happens. Kevin watches from `kevinX`.
   */
  lair?: { triggerX: number; fromX: number; toX: number; floor: number; kevinX: number; alien: string };
  /** Kevin drains the third rail when Ben passes `triggerX`: the station's lights die bank by bank between `fromX` and `toX`. */
  drain?: { triggerX: number; fromX: number; toX: number };
  /**
   * The turn: past `triggerX` the room between `fromX` and `toX` seals, Kevin
   * absorbs Ben's alien and fights with it; beaten, he runs for `exitX`.
   */
  absorb?: { triggerX: number; fromX: number; toX: number; floor: number; kevinX: number; exitX: number };
  /** After the turn: Kevin runs ahead between these tiles, throwing sparks back at Ben. */
  hunt?: { fromX: number; toX: number; floor: number };
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
  /** Interiors: the back wall behind each stretch (tiles), outdoors elsewhere. `floor`: the row its panelling sits on (default 30). */
  interiors?: Array<{ x: number; w: number; wall: InteriorWall; floor?: number }>;
  story?: StoryPlan;
}
