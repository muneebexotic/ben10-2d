/**
 * The base frame every screen is laid out on. The scale mode (EXPAND) keeps
 * the height and widens the view on wide phones (up to GAME_MAX_WIDTH, about
 * 2.4:1) so they show more level instead of side bars.
 */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
export const GAME_MAX_WIDTH = 864;
export const TILE = 16;

/** World physics. */
export const PHYSICS = {
  gravity: 1150,
  maxFrameMs: 34,
  worldBottomPadding: 240,
} as const;

/** Draw order. Anything above `lightmap` is emissive (ignores darkness). */
export const DEPTH = {
  sky: -100,
  stars: -95,
  moon: -94,
  mountains: -90,
  pinesFar: -85,
  fog: -82,
  pinesMid: -80,
  decorBack: -10,
  water: -5,
  terrain: 0,
  decor: 5,
  props: 10,
  pickups: 15,
  enemies: 20,
  boss: 22,
  player: 30,
  foreground: 35,
  lightmap: 50,
  emissive: 60,
  projectiles: 62,
  fx: 64,
  fxTop: 70,
  worldUi: 80,
} as const;

export const CAMERA = {
  lerpX: 0.14,
  lerpY: 0.1,
  deadzoneWidth: 48,
  deadzoneHeight: 56,
  lookAhead: 42,
  lookAheadLerp: 0.04,
  verticalOffset: 62,
  /** Boss arena framing: camera centre this far above the floor. Touch frames higher to keep the floor clear of thumbs. */
  arenaLockAbove: 112,
  arenaLockAboveTouch: 84,
  transformZoom: 1.32,
  transformZoomMs: 520,
} as const;

export const LIGHTING = {
  /** Lightmap is rendered at 1/scale resolution and stretched; lights are soft so this is invisible. */
  scale: 2,
  margin: 96,
  ambientForest: 0x707ab4,
  ambientCamp: 0x7c86bc,
  ambientRavine: 0x6882b6,
  ambientCrash: 0x86668e,
  ambientAlarm: 0x8a3444,
  /** Omnitrix Training: a bright, cool simulation. */
  ambientSim: 0xa8bcb8,
  /** Road Trip: golden hour, dusk over the river, night on the highway, the truck stop's neon. */
  ambientSunset: 0xffdcc0,
  ambientDusk: 0xc49ab4,
  ambientNight: 0x7078b0,
  ambientNeon: 0x8a6c9e,
  /** Dr. Animo: the street at night, the museum's moonlit halls, the dark galleries, the blackout, the glass atrium, the lab. */
  ambientStreet: 0x6c76ac,
  ambientMuseum: 0x8c88ac,
  ambientGallery: 0x76708e,
  ambientBlackout: 0x1a1828,
  ambientAtrium: 0x8a9cc4,
  ambientLab: 0x5e8076,
  // Kevin 11: dusk downtown, the arcade's neon, the laser tag dark, the subway and its tunnels, the substation.
  ambientDowntown: 0xb48aa8,
  ambientArcade: 0x8a78b4,
  ambientLair: 0x4a3c7a,
  ambientSubway: 0x8a92a0,
  ambientTunnel: 0x3e4658,
  ambientSubstation: 0x5a6078,
  ambientBlendMs: 900,
} as const;

export const FX = {
  hitStopLightMs: 45,
  hitStopHeavyMs: 90,
  hitStopKillMs: 70,
  shakeLight: 0.004,
  shakeMedium: 0.008,
  shakeHeavy: 0.016,
  squashLand: { x: 1.3, y: 0.72 },
  stretchJump: { x: 0.74, y: 1.28 },
  squashRecover: 14,
  /** Ground cracks (Four Arms): how many can exist and how long they stay. */
  maxCracks: 10,
  crackLingerMs: 2200,
} as const;

export const COMBO = {
  windowMs: 2200,
  showAt: 3,
  /**
   * Tag team: each new form that joins a live combo refunds this much alien
   * time (half a swap's cost), so swapping mid-combo is rewarded, not taxed.
   */
  tagRefundMs: 1500,
} as const;
