import Phaser from 'phaser';
import { DEPTH, TILE } from '../../config/constants';
import { PALETTE } from '../../config/palette';
import { cellAt } from '../../levels/buildLevel';
import { CELL } from '../../levels/tiles';
import type { DecorKind, LevelData } from '../../levels/types';
import type { Lighting } from '../../systems/Lighting';
import { TEX } from '../preload/assetKeys';
import { CH5_TEX as T5 } from '../preload/bounty/keys';
import { CH6_TEX as T6 } from '../preload/karachi/keys';
import type { LevelWorld } from './LevelWorld';
import { StaticCuller } from './StaticCuller';

interface FireSpot {
  x: number;
  y: number;
  radius: number;
  seed: number;
}

interface Glow {
  x: number;
  y: number;
  radius: number;
  color: number;
  intensity: number;
  /** Flickers like a neon tube. */
  flicker: boolean;
  /** The power's out (Kevin drank it). */
  off?: boolean;
}

/** Lit signs and windows: where the light sits relative to the prop's bottom centre. */
const GLOWS: Partial<Record<DecorKind, Array<{ dx: number; dy: number; radius: number; color: number; intensity: number; flicker?: boolean }>>> = {
  diner: [
    { dx: 0, dy: -64, radius: 70, color: PALETTE.neonPink, intensity: 0.9, flicker: true },
    { dx: -20, dy: -22, radius: 80, color: 0xffd890, intensity: 0.7 },
    { dx: 24, dy: -22, radius: 70, color: 0xffd890, intensity: 0.6 },
  ],
  smoothyStand: [{ dx: 0, dy: -40, radius: 70, color: 0xff8fc8, intensity: 0.8 }],
  poleSign: [{ dx: 0, dy: -178, radius: 110, color: PALETTE.neonBlue, intensity: 0.9, flicker: true }],
  neon: [{ dx: 0, dy: -14, radius: 70, color: PALETTE.neonPink, intensity: 1, flicker: true }],
  gasPump: [{ dx: 0, dy: -18, radius: 26, color: PALETTE.omnitrixGlow, intensity: 0.4 }],
  billboard: [{ dx: 0, dy: -50, radius: 60, color: 0xffe7a0, intensity: 0.5 }],
  lampPost: [{ dx: 0, dy: -48, radius: 90, color: 0xffd890, intensity: 0.9 }],
  museumFacade: [{ dx: 0, dy: -50, radius: 110, color: 0xffc870, intensity: 0.9 }],
  exitSign: [{ dx: 0, dy: -5, radius: 40, color: PALETTE.omnitrix, intensity: 0.7, flicker: true }],
  meteorite: [{ dx: 0, dy: -26, radius: 70, color: PALETTE.omnitrixGlow, intensity: 0.6 }],
  mutagenTank: [{ dx: 0, dy: -28, radius: 70, color: PALETTE.mutagen, intensity: 0.9 }],
  cage: [{ dx: 0, dy: -16, radius: 30, color: PALETTE.mutagen, intensity: 0.4, flicker: true }],
  labConsole: [{ dx: -6, dy: -26, radius: 60, color: PALETTE.mutagen, intensity: 0.7, flicker: true }],
  storefront: [{ dx: 0, dy: -66, radius: 70, color: 0xffd890, intensity: 0.6 }, { dx: -15, dy: -20, radius: 50, color: 0x9fb8ff, intensity: 0.4 }],
  arcadeFront: [{ dx: 0, dy: -86, radius: 110, color: PALETTE.neonPink, intensity: 1, flicker: true }, { dx: 0, dy: -30, radius: 70, color: 0x8a6aff, intensity: 0.7 }],
  streetLamp: [{ dx: 4, dy: -56, radius: 100, color: 0xffd890, intensity: 0.95 }],
  neonSign: [{ dx: 0, dy: -10, radius: 50, color: PALETTE.neonPink, intensity: 0.8, flicker: true }],
  prizeCounter: [{ dx: 0, dy: -18, radius: 80, color: 0xffd890, intensity: 0.6 }],
  ticketMachine: [{ dx: 0, dy: -28, radius: 28, color: PALETTE.neonBlue, intensity: 0.6 }],
  clawMachine: [{ dx: 0, dy: -36, radius: 60, color: PALETTE.neonBlue, intensity: 0.7 }],
  skeeBall: [{ dx: 18, dy: -26, radius: 36, color: PALETTE.neonPink, intensity: 0.6, flicker: true }],
  bandStage: [{ dx: -40, dy: -70, radius: 90, color: 0xffd890, intensity: 0.7 }, { dx: 40, dy: -70, radius: 90, color: 0xff8ac8, intensity: 0.6 }],
  breakerBox: [{ dx: 0, dy: -30, radius: 26, color: PALETTE.enemy, intensity: 0.6, flicker: true }],
  uvLight: [{ dx: 0, dy: 6, radius: 110, color: PALETTE.laserUv, intensity: 0.8 }],
  stationSign: [{ dx: 0, dy: -9, radius: 70, color: 0xffffff, intensity: 0.35 }],
  tunnelLight: [{ dx: 0, dy: -4, radius: 90, color: PALETTE.workLight, intensity: 0.85, flicker: true }],
  transformer: [{ dx: 0, dy: -46, radius: 50, color: PALETTE.railGlow, intensity: 0.6, flicker: true }],
  generator: [{ dx: 7, dy: -26, radius: 30, color: PALETTE.omnitrix, intensity: 0.5 }],
  securityLaser: [{ dx: 7, dy: -34, radius: 24, color: PALETTE.enemy, intensity: 0.9 }, { dx: 7, dy: -22, radius: 24, color: PALETTE.enemy, intensity: 0.9 }, { dx: 7, dy: -10, radius: 24, color: PALETTE.enemy, intensity: 0.9 }],
  // Silver Spur: oil lamps and lit windows, warm against the moonlight; the mine's lanterns; the cavern's crystals.
  saloon: [{ dx: -34, dy: -44, radius: 60, color: 0xffc070, intensity: 0.8, flicker: true }, { dx: 34, dy: -44, radius: 60, color: 0xffc070, intensity: 0.8, flicker: true }],
  shopFront: [{ dx: -20, dy: -34, radius: 46, color: 0xffc070, intensity: 0.5 }],
  lanternPost: [{ dx: 0, dy: -46, radius: 80, color: 0xffb860, intensity: 0.95, flicker: true }],
  hangingLantern: [{ dx: 0, dy: -6, radius: 76, color: 0xffb860, intensity: 0.95, flicker: true }],
  hotelSign: [{ dx: 0, dy: -14, radius: 60, color: 0xff6a5a, intensity: 0.5, flicker: true }],
  townGate: [{ dx: -78, dy: -60, radius: 50, color: 0xffb860, intensity: 0.7, flicker: true }, { dx: 78, dy: -60, radius: 50, color: 0xffb860, intensity: 0.7, flicker: true }],
  headframe: [{ dx: 0, dy: -150, radius: 70, color: PALETTE.enemy, intensity: 0.5, flicker: true }],
  minePortal: [{ dx: 0, dy: -30, radius: 60, color: 0xffb860, intensity: 0.5 }],
  crystalCluster: [{ dx: 0, dy: -16, radius: 60, color: PALETTE.diamondhead, intensity: 0.75 }],
  crystalSpire: [{ dx: 0, dy: -50, radius: 100, color: PALETTE.diamondhead, intensity: 0.85 }],
  netGenerator: [{ dx: 0, dy: -8, radius: 40, color: PALETTE.sixsix, intensity: 0.8, flicker: true }],
  // Karachi: bulbs at the stalls, the fair's lights, the tent's marquee, the palace's lamps and windows, the clock's glow.
  chaiDhaba: [{ dx: 12, dy: -40, radius: 70, color: 0xffd890, intensity: 0.9 }, { dx: -24, dy: -30, radius: 40, color: 0xff9a4a, intensity: 0.6, flicker: true }],
  kebabCart: [{ dx: -8, dy: -28, radius: 44, color: 0xff9a4a, intensity: 0.7, flicker: true }],
  juiceStall: [{ dx: 0, dy: -46, radius: 60, color: 0xffe0a0, intensity: 0.8 }],
  ferrisHub: [{ dx: 0, dy: -96, radius: 130, color: 0xff8ad8, intensity: 0.55 }],
  hexTent: [{ dx: 0, dy: -54, radius: 110, color: 0xb88aff, intensity: 0.9, flicker: true }, { dx: 0, dy: -20, radius: 60, color: 0xffb060, intensity: 0.5 }],
  exhibitTent: [{ dx: 0, dy: -40, radius: 80, color: 0xffe8c0, intensity: 0.6 }],
  fairLights: [{ dx: -30, dy: -12, radius: 50, color: 0xfff2b0, intensity: 0.5 }, { dx: 30, dy: -12, radius: 50, color: 0xff8ad8, intensity: 0.5 }],
  shopSign: [{ dx: 0, dy: -11, radius: 44, color: 0xffe0a0, intensity: 0.45 }],
  palaceGate: [{ dx: -46, dy: -80, radius: 60, color: 0xffb060, intensity: 0.85, flicker: true }, { dx: 46, dy: -80, radius: 60, color: 0xffb060, intensity: 0.85, flicker: true }],
  palaceFront: [{ dx: 0, dy: -70, radius: 140, color: 0xffb070, intensity: 0.55 }],
  chandelier: [{ dx: 0, dy: 20, radius: 100, color: 0xffd890, intensity: 0.95 }],
  readingLamp: [{ dx: 0, dy: -34, radius: 60, color: 0xffd890, intensity: 0.8 }],
  runeCircle: [{ dx: 0, dy: -6, radius: 50, color: 0xff6ac8, intensity: 0.7, flicker: true }],
  tunnelLamp: [{ dx: 0, dy: -7, radius: 80, color: 0xffb060, intensity: 0.9, flicker: true }],
  clockFace: [{ dx: 0, dy: -48, radius: 120, color: 0xf0e0b0, intensity: 0.75 }],
  rickshaw: [{ dx: 21, dy: -14, radius: 30, color: 0xfff2b0, intensity: 0.6 }],
  truckBus: [{ dx: 0, dy: -60, radius: 70, color: 0xffd890, intensity: 0.4 }],
};

const DECOR_TEXTURE: Record<DecorKind, { key: string; frame?: number }> = {
  rv: { key: TEX.rv },
  tent: { key: TEX.tent },
  campfire: { key: TEX.campfire },
  sign: { key: TEX.sign },
  log: { key: TEX.log },
  rock: { key: TEX.rock },
  bush: { key: TEX.bush },
  stump: { key: TEX.stump },
  wreck: { key: TEX.wreck },
  crater: { key: TEX.crater },
  debris: { key: TEX.debris },
  fire: { key: TEX.burningLogs },
  cactus: { key: TEX.cactus },
  cactusSmall: { key: TEX.cactusSmall },
  diner: { key: TEX.diner },
  gasPump: { key: TEX.gasPump },
  smoothyStand: { key: TEX.smoothyStand },
  billboard: { key: TEX.billboard },
  roadSign: { key: TEX.roadSign },
  mileMarker: { key: TEX.mileMarker },
  bridgeEnd: { key: TEX.bridgeEnd },
  girder: { key: TEX.girder },
  guardrail: { key: TEX.guardrail },
  tumbleweed: { key: TEX.tumbleweed },
  skull: { key: TEX.skull },
  barrel: { key: TEX.barrel },
  carWreck: { key: TEX.carWreck },
  poleSign: { key: TEX.poleSign },
  garage: { key: TEX.garage },
  shed: { key: TEX.shed },
  neon: { key: TEX.neon },
  haulerWreck: { key: TEX.haulerWreck },
  fence: { key: TEX.fence },
  lampPost: { key: TEX.lampPost },
  museumFacade: { key: TEX.museumFacade },
  trex: { key: TEX.trex },
  mammoth: { key: TEX.mammoth },
  whale: { key: TEX.whale },
  pterosaur: { key: TEX.pterosaur },
  displayCase: { key: TEX.displayCase },
  stuffedBear: { key: TEX.stuffedBear },
  banner: { key: TEX.banner },
  painting: { key: TEX.painting },
  velvetRope: { key: TEX.velvetRope },
  bench: { key: TEX.bench },
  exitSign: { key: TEX.exitSign },
  tarSign: { key: TEX.tarSign },
  meteorite: { key: TEX.meteorite },
  mutagenTank: { key: TEX.mutagenTank },
  cage: { key: TEX.cage },
  labConsole: { key: TEX.labConsole },
  pipes: { key: TEX.pipes },
  staffDoor: { key: TEX.staffDoor },
  columns: { key: TEX.column },
  storefront: { key: TEX.storefront },
  arcadeFront: { key: TEX.arcadeFront },
  streetLamp: { key: TEX.streetLamp },
  powerPole: { key: TEX.powerPole },
  newsstand: { key: TEX.newsstand },
  hydrant: { key: TEX.hydrant },
  trashCan: { key: TEX.trashCan },
  neonSign: { key: TEX.neonSign },
  prizeCounter: { key: TEX.prizeCounter },
  ticketMachine: { key: TEX.ticketMachine },
  clawMachine: { key: TEX.clawMachine },
  skeeBall: { key: TEX.skeeBall },
  bandStage: { key: TEX.bandStage },
  breakerBox: { key: TEX.breakerBox },
  poster: { key: TEX.poster },
  laserBarrier: { key: TEX.laserBarrier },
  uvLight: { key: TEX.uvLight },
  stationSign: { key: TEX.stationSign },
  subwayMap: { key: TEX.subwayMap },
  pillar: { key: TEX.pillar },
  turnstile: { key: TEX.turnstile },
  tunnelLight: { key: TEX.tunnelLight },
  cables: { key: TEX.cables },
  transformer: { key: TEX.transformer },
  generator: { key: TEX.generator },
  warningSign: { key: TEX.warningSign },
  securityLaser: { key: TEX.securityLaser },
  sealedDoor: { key: TEX.sealedDoor },
  catwalkRail: { key: TEX.catwalkRail },
  townGate: { key: T5.townGate },
  saloon: { key: T5.saloon },
  shopFront: { key: T5.shopFront },
  wanted: { key: T5.wanted },
  hitchingPost: { key: T5.hitchingPost },
  wagonWheel: { key: T5.wagonWheel },
  crates: { key: T5.crates },
  lanternPost: { key: T5.lanternPost },
  coffin: { key: T5.coffin },
  waterTower: { key: T5.waterTower },
  hotelSign: { key: T5.hotelSign },
  barCounter: { key: T5.barCounter },
  piano: { key: T5.piano },
  mouseHole: { key: T5.mouseHole },
  jailFurniture: { key: T5.jailFurniture },
  headframe: { key: T5.headframe },
  minePortal: { key: T5.minePortal },
  mineRails: { key: T5.mineRails },
  timbers: { key: T5.timbers },
  hangingLantern: { key: T5.hangingLantern },
  crystalCluster: { key: T5.crystalCluster },
  crystalSpire: { key: T5.crystalSpire },
  dynamiteSign: { key: T5.dynamiteSign },
  prospector: { key: T5.prospector },
  oreCart: { key: T5.oreCart },
  netGenerator: { key: T5.netGenerator },
  chaiDhaba: { key: T6.chaiDhaba },
  kebabCart: { key: T6.kebabCart },
  juiceStall: { key: T6.juiceStall },
  balloonSeller: { key: T6.balloonSeller },
  camel: { key: T6.camel },
  horse: { key: T6.horse },
  ferrisWheel: { key: T6.ferrisWheel },
  ferrisHub: { key: T6.ferrisHub },
  hexTent: { key: T6.hexTent },
  exhibitTent: { key: T6.exhibitTent },
  truckBus: { key: T6.truckBus },
  rickshaw: { key: T6.rickshaw },
  chingchi: { key: T6.chingchi },
  shopSign: { key: T6.shopSign },
  fairLights: { key: T6.fairLights },
  promenadeRail: { key: T6.promenadeRail },
  kiteSeller: { key: T6.kiteSeller },
  palaceGate: { key: T6.palaceGate },
  palaceFront: { key: T6.palaceFront },
  jharokha: { key: T6.jharokha },
  archway: { key: T6.archway },
  chandelier: { key: T6.chandelier },
  armorStand: { key: T6.armorStand },
  carpet: { key: T6.carpet },
  bookshelf: { key: T6.bookshelf },
  readingLamp: { key: T6.readingLamp },
  globe: { key: T6.globe },
  paintedCeiling: { key: T6.paintedCeiling },
  cellarArch: { key: T6.cellarArch },
  runeCircle: { key: T6.runeCircle },
  wardCage: { key: T6.wardCage },
  tunnelLamp: { key: T6.tunnelLamp },
  pipesOld: { key: T6.pipesOld },
  gears: { key: T6.gears },
  clockFace: { key: T6.clockFace },
  pendulum: { key: T6.pendulum },
  crowWire: { key: T6.crowWire },
};

/** Big set dressing that sits behind the action. */
const BACK_DECOR: readonly DecorKind[] = [
  'rv', 'tent', 'wreck', 'diner', 'smoothyStand', 'billboard', 'poleSign', 'garage', 'haulerWreck', 'neon', 'girder', 'carWreck', 'bridgeEnd',
  'museumFacade', 'trex', 'mammoth', 'whale', 'pterosaur', 'columns', 'painting', 'banner', 'staffDoor', 'mutagenTank', 'cage', 'labConsole', 'pipes', 'exitSign', 'lampPost',
  'storefront', 'arcadeFront', 'streetLamp', 'powerPole', 'neonSign', 'prizeCounter', 'bandStage', 'breakerBox', 'poster', 'uvLight', 'stationSign', 'subwayMap', 'pillar', 'tunnelLight', 'cables', 'transformer', 'generator', 'warningSign', 'sealedDoor', 'ticketMachine', 'skeeBall',
  'townGate', 'saloon', 'shopFront', 'wanted', 'waterTower', 'hotelSign', 'headframe', 'minePortal', 'timbers', 'crystalSpire', 'dynamiteSign', 'mouseHole', 'hangingLantern', 'lanternPost', 'barCounter', 'piano', 'jailFurniture',
  'chaiDhaba', 'juiceStall', 'ferrisWheel', 'ferrisHub', 'hexTent', 'exhibitTent', 'truckBus', 'shopSign', 'fairLights', 'kiteSeller', 'crowWire', 'palaceGate', 'palaceFront', 'jharokha', 'archway', 'chandelier',
  'armorStand', 'bookshelf', 'paintedCeiling', 'cellarArch', 'wardCage', 'tunnelLamp', 'pipesOld', 'gears', 'clockFace', 'pendulum', 'readingLamp', 'globe',
];

/** Props that sit behind even the back decor (a Ferris wheel behind the stalls). */
const FAR_DECOR: readonly DecorKind[] = ['ferrisWheel', 'ferrisHub', 'palaceFront', 'hexTent', 'exhibitTent'];
/** Props that turn slowly (degrees per second). */
const SPIN: Partial<Record<DecorKind, number>> = { ferrisWheel: 7, gears: 12 };

function hash(x: number, salt: number): number {
  let h = (x * 374761393 + salt * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Static set dressing: authored props plus deterministic grass, bushes, rocks and glowing mushrooms. */
export class Decor {
  /** Every lamp, sign and screen between these x positions (px) goes dark (a power cut). */
  powerOff(fromX: number, toX: number): void {
    for (const g of this.glows) if (g.x >= fromX && g.x < toX) g.off = true;
  }

  private readonly fires: FireSpot[] = [];
  private readonly mushrooms: Array<{ x: number; y: number }> = [];
  private readonly fireflies: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private readonly windowLight: { x: number; y: number } | null = null;
  private readonly glows: Glow[] = [];
  private readonly spinners: Array<{ img: Phaser.GameObjects.Image; degPerMs: number }> = [];
  private lastNow = -1;
  /** Props and sprinkled scenery never move: only what is near the camera is drawn. */
  private readonly culler = new StaticCuller();

  constructor(scene: Phaser.Scene, level: LevelData, world: LevelWorld) {
    let tentCount = 0;
    for (const e of level.entities) {
      if (e.type !== 'decor') continue;
      const tex = DECOR_TEXTURE[e.kind];
      const x = e.x * TILE + TILE / 2;
      const y = e.y * TILE;
      const frame = e.frame ?? (e.kind === 'tent' ? tentCount++ % 2 : 0);
      const img = scene.add.image(x, y + (e.kind === 'crater' ? 3 : 0), tex.key, frame).setOrigin(0.5, 1);
      img.setDepth(e.kind === 'crater' ? DEPTH.terrain + 1 : FAR_DECOR.includes(e.kind) ? DEPTH.decorBack - 2 : BACK_DECOR.includes(e.kind) ? DEPTH.decorBack : DEPTH.decor);
      img.setFlipX(e.flip === true);
      // A Ferris wheel turns about its axle (placed at its stand's top); gears turn about their middle.
      const spin = SPIN[e.kind];
      if (spin) {
        img.setOrigin(0.5, 0.5);
        if (e.kind === 'gears') img.setY(y - img.height / 2);
        this.spinners.push({ img, degPerMs: (spin / 1000) * (e.flip ? -1 : 1) });
      }
      this.culler.add(img);
      if (e.kind === 'neon') this.culler.add(scene.add.sprite(x, y, tex.key, 0).setOrigin(0.5, 1).setDepth(DEPTH.emissive).play({ key: 'neon-flicker', startFrame: Math.floor(e.x % 5) }));
      for (const g of GLOWS[e.kind] ?? []) this.glows.push({ x: x + g.dx * (e.flip ? -1 : 1), y: y + g.dy, radius: g.radius, color: g.color, intensity: g.intensity, flicker: g.flicker ?? false });
      if (e.kind === 'campfire' || e.kind === 'fire') {
        this.fires.push({ x, y: y - 6, radius: e.kind === 'campfire' ? 120 : 90, seed: e.x });
        const emitter = scene.add.particles(x, y - 4, TEX.soft, {
          lifespan: { min: 300, max: 650 },
          speedY: { min: -60, max: -20 },
          speedX: { min: -12, max: 12 },
          scale: { start: e.kind === 'campfire' ? 0.8 : 0.9, end: 0 },
          color: [PALETTE.fire0, PALETTE.fire1, PALETTE.fire2, PALETTE.fire3],
          frequency: 45,
          blendMode: 'ADD',
          x: { min: -5, max: 5 },
        });
        emitter.setDepth(DEPTH.emissive);
        scene.add
          .particles(x, y - 8, TEX.ember, {
            lifespan: { min: 800, max: 1600 },
            speedY: { min: -50, max: -20 },
            speedX: { min: -15, max: 15 },
            scale: { start: 1, end: 0 },
            color: [PALETTE.fire1, PALETTE.fire2],
            frequency: 260,
            blendMode: 'ADD',
          })
          .setDepth(DEPTH.emissive);
      }
      if (e.kind === 'rv') this.windowLight = { x: x - 12, y: y - 30 };
    }

    // Grass, mushrooms and fireflies belong to the forest, not the training simulation.
    if (level.theme === 'sim') return;
    if (level.theme === 'highway') {
      this.sprinkleDesert(scene, level, world);
      return;
    }
    // The museum, downtown, Silver Spur and Karachi are dressed by hand.
    if (level.theme === 'museum' || level.theme === 'city' || level.theme === 'western' || level.theme === 'karachi') return;
    this.sprinkle(scene, level, world);

    this.fireflies = scene.add.particles(0, 0, TEX.soft, {
      lifespan: { min: 2200, max: 4000 },
      speedX: { min: -12, max: 12 },
      speedY: { min: -10, max: 6 },
      scale: { start: 0.22, end: 0.1 },
      alpha: { start: 1, end: 0 },
      tint: [0xd8ff7a, 0xb8ffb0, 0xfff3a0],
      frequency: 320,
      blendMode: 'ADD',
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 0, 640, 200), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
    });
    this.fireflies.setDepth(DEPTH.emissive);
  }

  private sprinkle(scene: Phaser.Scene, level: LevelData, world: LevelWorld): void {
    const grid = world.grid;
    const avoid = level.entities.filter((e): e is Extract<typeof e, { x: number }> => e.type !== 'drone' && 'x' in e).map((e) => e.x);
    for (let x = 2; x < level.width - 2; x++) {
      for (let y = 1; y < level.height; y++) {
        const c = cellAt(grid, x, y);
        if (c !== CELL.GROUND && c !== CELL.ROCK) continue;
        if (cellAt(grid, x, y - 1) !== CELL.EMPTY) continue;
        if (level.water.some((w) => x >= w.x && x < w.x + w.w && y >= w.surface)) break;
        const wx = x * TILE + TILE / 2;
        const wy = y * TILE;
        const r = hash(x, y);
        const nearEntity = avoid.some((ax) => Math.abs(ax - x) <= 1);
        if (c === CELL.GROUND && r < 0.45) {
          this.culler.add(scene.add.image(wx + (hash(x, 7) - 0.5) * 8, wy, TEX.grass, r < 0.2 ? 0 : 1).setOrigin(0.5, 1).setDepth(DEPTH.decor));
        }
        if (!nearEntity) {
          const r2 = hash(x, y + 91);
          if (c === CELL.GROUND && r2 < 0.07) this.culler.add(scene.add.image(wx, wy + 1, TEX.bush, r2 < 0.03 ? 1 : 0).setOrigin(0.5, 1).setDepth(DEPTH.decorBack));
          else if (r2 > 0.93) this.culler.add(scene.add.image(wx, wy + 1, TEX.rock, r2 > 0.97 ? 0 : 1).setOrigin(0.5, 1).setDepth(DEPTH.decor));
          else if (c === CELL.GROUND && r2 > 0.9 && r2 <= 0.93) this.culler.add(scene.add.image(wx, wy + 1, TEX.stump).setOrigin(0.5, 1).setDepth(DEPTH.decor));
          else if (r2 > 0.2 && r2 < 0.25 && x > 40) {
            this.culler.add(scene.add.image(wx, wy, TEX.mushroom).setOrigin(0.5, 1).setDepth(DEPTH.emissive));
            this.mushrooms.push({ x: wx, y: wy - 3 });
          }
        }
        break;
      }
    }
  }

  /** Desert floor: pebbles, scrub, the odd cactus, cow skull or tumbleweed. Never on the road. */
  private sprinkleDesert(scene: Phaser.Scene, level: LevelData, world: LevelWorld): void {
    const grid = world.grid;
    const avoid = level.entities.filter((e): e is Extract<typeof e, { x: number }> => e.type !== 'drone' && 'x' in e).map((e) => e.x);
    const onRoad = (x: number, y: number) => (level.roads ?? []).some((r) => x >= r.x && x < r.x + r.w && y === r.y);
    for (let x = 2; x < level.width - 2; x++) {
      for (let y = 1; y < level.height; y++) {
        const c = cellAt(grid, x, y);
        if (c !== CELL.GROUND && c !== CELL.ROCK) continue;
        if (cellAt(grid, x, y - 1) !== CELL.EMPTY) continue;
        if (level.water.some((w) => x >= w.x && x < w.x + w.w && y >= w.surface)) break;
        if (onRoad(x, y) || avoid.some((ax) => Math.abs(ax - x) <= 1)) break;
        const wx = x * TILE + TILE / 2;
        const wy = y * TILE;
        const r = hash(x, y + 13);
        if (r < 0.06) this.culler.add(scene.add.image(wx, wy + 1, TEX.cactusSmall).setOrigin(0.5, 1).setDepth(DEPTH.decor));
        else if (r < 0.075 && c === CELL.GROUND) this.culler.add(scene.add.image(wx, wy + 1, TEX.skull).setOrigin(0.5, 1).setDepth(DEPTH.decor));
        else if (r > 0.97 && c === CELL.GROUND) this.culler.add(scene.add.image(wx, wy + 1, TEX.cactus).setOrigin(0.5, 1).setDepth(DEPTH.decorBack));
        break;
      }
    }
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, lighting: Lighting, now: number): void {
    const view = camera.worldView;
    this.culler.update(view);
    const dt = this.lastNow < 0 ? 0 : Math.min(100, now - this.lastNow);
    this.lastNow = now;
    for (const s of this.spinners) if (s.img.visible) s.img.angle += s.degPerMs * dt;
    const zone = this.fireflies?.emitZones[0] as unknown as { source: Phaser.Geom.Rectangle } | undefined;
    if (zone?.source) zone.source.setTo(view.x, view.y + 40, view.width, view.height - 60);

    for (const f of this.fires) {
      if (f.x < view.x - 200 || f.x > view.right + 200) continue;
      const flicker = 0.85 + Math.sin(now * 0.013 + f.seed) * 0.08 + Math.sin(now * 0.031 + f.seed * 3) * 0.07;
      lighting.add(f.x, f.y, f.radius * flicker, PALETTE.fire2, 1);
    }
    for (const m of this.mushrooms) {
      if (m.x < view.x - 60 || m.x > view.right + 60) continue;
      lighting.add(m.x, m.y, 26, 0x5ee6ff, 0.7);
    }
    if (this.windowLight) lighting.add(this.windowLight.x, this.windowLight.y, 70, 0xffd890, 0.8);
    for (const g of this.glows) {
      if (g.off || g.x < view.x - 200 || g.x > view.right + 200) continue;
      const k = g.flicker ? 0.85 + Math.sin(now * 0.021 + g.x) * 0.1 + (Math.sin(now * 0.13 + g.y) > 0.97 ? -0.4 : 0) : 1;
      lighting.add(g.x, g.y, g.radius, g.color, g.intensity * k);
    }
  }
}
