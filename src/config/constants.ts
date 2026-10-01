export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;
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
} as const;

export const COMBO = {
  windowMs: 2200,
  showAt: 3,
} as const;
