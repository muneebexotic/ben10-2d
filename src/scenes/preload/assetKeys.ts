import { PALETTE as P } from '../../config/palette';
import { TILESET_FRAME_COUNT } from '../../levels/tiles';
import type { PixelCanvas } from './PixelCanvas';
import {
  BEN_FRAME,
  BEN_FRAME_COUNT,
  BEN_FRAMES,
  HEATBLAST_FRAME,
  HEATBLAST_FRAME_COUNT,
  HEATBLAST_FRAMES,
  drawBen,
  drawHeatblast,
} from './characters';
import {
  BOSS_HULL,
  drawBossArm,
  drawBossEye,
  drawBossHull,
  drawBossPlate,
  drawBossTopPlate,
  drawGunner,
  drawScout,
  drawStriker,
} from './enemies';
import * as fx from './effects';
import * as props from './props';
import * as ui from './uiArt';
import * as world from './world';

/**
 * THE single asset key map. Every texture the game uses is listed here.
 * Today each one is generated in code (`draw`). To swap in real art, add a `url`
 * (relative to public/) with the same frame size and frame order; nothing else changes.
 */
export const TEX = {
  ben: 'ben',
  benNoWatch: 'ben-nowatch',
  heatblast: 'heatblast',
  scout: 'drone-scout',
  striker: 'drone-striker',
  gunner: 'drone-gunner',
  bossHull: 'boss-hull',
  bossPlate: 'boss-plate',
  bossTopPlate: 'boss-top-plate',
  bossEye: 'boss-eye',
  bossArm: 'boss-arm',
  tiles: 'tiles',
  sky: 'bg-sky',
  stars: 'bg-stars',
  moon: 'bg-moon',
  mountains: 'bg-mountains',
  pinesFar: 'bg-pines-far',
  pinesMid: 'bg-pines-mid',
  fog: 'bg-fog',
  trunks: 'bg-trunks',
  crashGlow: 'bg-crash-glow',
  rv: 'prop-rv',
  tent: 'prop-tent',
  campfire: 'prop-campfire',
  log: 'prop-log',
  sign: 'prop-sign',
  bush: 'prop-bush',
  rock: 'prop-rock',
  stump: 'prop-stump',
  grass: 'prop-grass',
  mushroom: 'prop-mushroom',
  crater: 'prop-crater',
  wreck: 'prop-wreck',
  debris: 'prop-debris',
  burningLogs: 'prop-burning-logs',
  pod: 'prop-pod',
  omnitrixItem: 'prop-omnitrix',
  checkpoint: 'prop-checkpoint',
  smoothy: 'pickup-smoothy',
  card: 'pickup-card',
  jammer: 'prop-jammer',
  gate: 'prop-gate',
  arenaWall: 'prop-arena-wall',
  soft: 'fx-soft',
  light: 'fx-light',
  px: 'fx-px',
  spark: 'fx-spark',
  ember: 'fx-ember',
  smoke: 'fx-smoke',
  ring: 'fx-ring',
  rays: 'fx-rays',
  hourglass: 'fx-hourglass',
  fireball: 'fx-fireball',
  laser: 'fx-laser',
  bossBolt: 'fx-boss-bolt',
  shockwave: 'fx-shockwave',
  bomb: 'fx-bomb',
  reticle: 'fx-reticle',
  beam: 'fx-beam',
  debrisBits: 'fx-debris',
  leaf: 'fx-leaf',
  shadow: 'fx-shadow',
  water: 'fx-water',
  whitePx: 'fx-white',
  heart: 'ui-heart',
  dialFrame: 'ui-dial',
  iconHeatblast: 'ui-icon-heatblast',
  iconBen: 'ui-icon-ben',
  cardIcon: 'ui-card',
  droneIcon: 'ui-drone',
  bossIcon: 'ui-boss',
  vignette: 'ui-vignette',
} as const;

export type TextureKey = (typeof TEX)[keyof typeof TEX];

export interface AssetDef {
  key: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  /** Optional real art under public/. When present the file is loaded instead of generating. */
  url?: string;
  draw: (pc: PixelCanvas, frame: number) => void;
}

/** Barricade sizes (tiles) used by level data; each gets its own texture. */
export const BARRICADE_SIZES: ReadonlyArray<readonly [number, number]> = [
  [2, 4],
  [2, 3],
];
export const barricadeKey = (w: number, h: number) => `prop-barricade-${w}x${h}`;

const one = (key: string, w: number, h: number, draw: (pc: PixelCanvas) => void): AssetDef => ({
  key,
  frameWidth: w,
  frameHeight: h,
  frames: 1,
  draw: (pc) => draw(pc),
});

const sheet = (key: string, w: number, h: number, frames: number, draw: (pc: PixelCanvas, f: number) => void): AssetDef => ({
  key,
  frameWidth: w,
  frameHeight: h,
  frames,
  draw,
});

export const ASSETS: AssetDef[] = [
  sheet(TEX.ben, BEN_FRAME.w, BEN_FRAME.h, BEN_FRAME_COUNT, (pc, f) => drawBen(pc, f, true)),
  sheet(TEX.benNoWatch, BEN_FRAME.w, BEN_FRAME.h, BEN_FRAME_COUNT, (pc, f) => drawBen(pc, f, false)),
  sheet(TEX.heatblast, HEATBLAST_FRAME.w, HEATBLAST_FRAME.h, HEATBLAST_FRAME_COUNT, drawHeatblast),
  sheet(TEX.scout, 20, 16, 3, drawScout),
  sheet(TEX.striker, 22, 18, 3, drawStriker),
  sheet(TEX.gunner, 28, 20, 3, drawGunner),
  one(TEX.bossHull, BOSS_HULL.w, BOSS_HULL.h, drawBossHull),
  one(TEX.bossPlate, 32, 24, drawBossPlate),
  one(TEX.bossTopPlate, 46, 12, drawBossTopPlate),
  sheet(TEX.bossEye, 27, 27, 4, drawBossEye),
  sheet(TEX.bossArm, 15, 34, 2, drawBossArm),

  sheet(TEX.tiles, 16, 16, TILESET_FRAME_COUNT, world.drawTile),
  one(TEX.sky, 8, 360, world.drawSky),
  one(TEX.stars, 320, 200, world.drawStars),
  one(TEX.moon, 40, 40, world.drawMoon),
  one(TEX.mountains, 512, 140, world.drawMountains),
  one(TEX.pinesFar, 384, 150, (pc) => world.drawPines(pc, 0)),
  one(TEX.pinesMid, 384, 200, (pc) => world.drawPines(pc, 1)),
  one(TEX.fog, 320, 80, world.drawFog),
  one(TEX.trunks, 320, 40, world.drawTrunks),
  one(TEX.crashGlow, 256, 128, world.drawCrashGlow),

  one(TEX.rv, 96, 48, props.drawRv),
  sheet(TEX.tent, 41, 29, 2, props.drawTent),
  one(TEX.campfire, 21, 12, props.drawCampfire),
  one(TEX.log, 27, 10, props.drawLog),
  one(TEX.sign, 16, 19, props.drawSign),
  sheet(TEX.bush, 20, 13, 2, props.drawBush),
  sheet(TEX.rock, 14, 10, 2, props.drawRock),
  one(TEX.stump, 13, 12, props.drawStump),
  sheet(TEX.grass, 8, 6, 2, props.drawGrass),
  one(TEX.mushroom, 9, 6, props.drawMushroom),
  one(TEX.crater, 48, 8, props.drawCrater),
  one(TEX.wreck, 48, 33, props.drawWreck),
  one(TEX.debris, 22, 13, props.drawDebris),
  one(TEX.burningLogs, 17, 10, props.drawBurningLogs),
  sheet(TEX.pod, 25, 17, 2, props.drawPod),
  one(TEX.omnitrixItem, 10, 10, props.drawOmnitrixItem),
  sheet(TEX.checkpoint, 13, 29, 2, props.drawCheckpoint),
  one(TEX.smoothy, 14, 19, props.drawSmoothy),
  sheet(TEX.card, 12, 16, 2, props.drawCard),
  sheet(TEX.jammer, 25, 63, 4, props.drawJammer),
  sheet(TEX.gate, 8, 16, 4, (pc, f) => props.drawEnergyWall(pc, f, P.jammer, P.jammerDark)),
  sheet(TEX.arenaWall, 8, 16, 4, (pc, f) => props.drawEnergyWall(pc, f, P.enemy, P.enemyDark)),
  ...BARRICADE_SIZES.map(([w, h]) => one(barricadeKey(w, h), w * 16, h * 16, (pc) => props.drawBarricade(pc, w * 16, h * 16))),

  one(TEX.soft, 16, 16, fx.drawSoft),
  one(TEX.light, 64, 64, fx.drawLight),
  one(TEX.px, 2, 2, fx.drawPixel),
  one(TEX.spark, 3, 3, fx.drawSpark),
  one(TEX.ember, 3, 3, fx.drawEmber),
  one(TEX.smoke, 12, 12, fx.drawSmoke),
  one(TEX.ring, 64, 64, fx.drawRing),
  one(TEX.rays, 128, 128, fx.drawRays),
  one(TEX.hourglass, 64, 64, fx.drawHourglass),
  sheet(TEX.fireball, 14, 12, 3, fx.drawFireball),
  one(TEX.laser, 12, 5, fx.drawLaser),
  one(TEX.bossBolt, 10, 10, fx.drawBossBolt),
  sheet(TEX.shockwave, 22, 14, 3, fx.drawShockwave),
  sheet(TEX.bomb, 9, 11, 2, fx.drawBomb),
  one(TEX.reticle, 16, 16, fx.drawReticle),
  one(TEX.beam, 4, 20, fx.drawBeam),
  sheet(TEX.debrisBits, 3, 3, 4, fx.drawDebrisBits),
  one(TEX.leaf, 2, 2, fx.drawLeaf),
  one(TEX.shadow, 48, 10, fx.drawShadow),
  sheet(TEX.water, 32, 64, 4, fx.drawWater),
  one(TEX.whitePx, 4, 4, fx.drawAfterimage),

  sheet(TEX.heart, 9, 8, 3, ui.drawHeart),
  one(TEX.dialFrame, 44, 44, ui.drawDialFrame),
  one(TEX.iconHeatblast, 16, 16, ui.drawHeatblastIcon),
  one(TEX.iconBen, 12, 12, ui.drawBenIcon),
  sheet(TEX.cardIcon, 9, 11, 2, ui.drawCardIcon),
  one(TEX.droneIcon, 11, 8, ui.drawDroneIcon),
  one(TEX.bossIcon, 14, 10, ui.drawBossIcon),
  one(TEX.vignette, 320, 180, ui.drawVignette),
];

export interface AnimDef {
  key: string;
  texture: string;
  frames: readonly number[];
  frameRate: number;
  repeat: number;
}

const benAnims = (prefix: string, texture: string): AnimDef[] => [
  { key: `${prefix}-idle`, texture, frames: BEN_FRAMES.idle, frameRate: 3, repeat: -1 },
  { key: `${prefix}-run`, texture, frames: BEN_FRAMES.run, frameRate: 14, repeat: -1 },
  { key: `${prefix}-jump`, texture, frames: BEN_FRAMES.jump, frameRate: 1, repeat: 0 },
  { key: `${prefix}-fall`, texture, frames: BEN_FRAMES.fall, frameRate: 1, repeat: 0 },
  { key: `${prefix}-punch`, texture, frames: BEN_FRAMES.punch, frameRate: 22, repeat: 0 },
  { key: `${prefix}-roll`, texture, frames: BEN_FRAMES.roll, frameRate: 16, repeat: -1 },
  { key: `${prefix}-hurt`, texture, frames: BEN_FRAMES.hurt, frameRate: 1, repeat: 0 },
  { key: `${prefix}-watch`, texture, frames: BEN_FRAMES.watch, frameRate: 1, repeat: 0 },
];

export const ANIMS: AnimDef[] = [
  ...benAnims('ben', TEX.ben),
  ...benAnims('bennw', TEX.benNoWatch),
  { key: 'heatblast-idle', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.idle, frameRate: 8, repeat: -1 },
  { key: 'heatblast-run', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.run, frameRate: 14, repeat: -1 },
  { key: 'heatblast-jump', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.jump, frameRate: 1, repeat: 0 },
  { key: 'heatblast-fall', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.fall, frameRate: 1, repeat: 0 },
  { key: 'heatblast-shoot', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.shoot, frameRate: 18, repeat: 0 },
  { key: 'heatblast-charge', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.charge, frameRate: 12, repeat: -1 },
  { key: 'heatblast-rocket', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.rocket, frameRate: 1, repeat: 0 },
  { key: 'heatblast-hurt', texture: TEX.heatblast, frames: HEATBLAST_FRAMES.hurt, frameRate: 1, repeat: 0 },
  { key: 'scout-idle', texture: TEX.scout, frames: [0, 1], frameRate: 10, repeat: -1 },
  { key: 'striker-idle', texture: TEX.striker, frames: [0, 1], frameRate: 8, repeat: -1 },
  { key: 'gunner-idle', texture: TEX.gunner, frames: [0, 1], frameRate: 4, repeat: -1 },
  { key: 'fireball-spin', texture: TEX.fireball, frames: [0, 1, 2], frameRate: 18, repeat: -1 },
  { key: 'shockwave-roll', texture: TEX.shockwave, frames: [0, 1, 2], frameRate: 14, repeat: -1 },
  { key: 'bomb-blink', texture: TEX.bomb, frames: [0, 1], frameRate: 10, repeat: -1 },
  { key: 'water-flow', texture: TEX.water, frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 },
  { key: 'gate-hum', texture: TEX.gate, frames: [0, 1, 2, 3], frameRate: 12, repeat: -1 },
  { key: 'arena-hum', texture: TEX.arenaWall, frames: [0, 1, 2, 3], frameRate: 12, repeat: -1 },
  { key: 'jammer-pulse', texture: TEX.jammer, frames: [0, 0, 1], frameRate: 4, repeat: -1 },
  { key: 'boss-arm-snap', texture: TEX.bossArm, frames: [0, 1, 0], frameRate: 10, repeat: 0 },
];
