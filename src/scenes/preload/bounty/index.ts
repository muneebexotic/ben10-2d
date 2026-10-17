import { animsFor, one, sheet, type AnimDef, type AssetDef } from '../assetTypes';
import { CH5_TEX } from './keys';
import { TILESET_FRAME_COUNT } from '../../../levels/tiles';
import * as gear from './gear';
import * as hunters from './hunters';
import * as props from './props';
import * as world from './world';


const T = CH5_TEX;

/** Chapter 5's own art, made when the chapter loads. Sixsix's sheet is apart (`SIXSIX_ART`): Chapter Select's window shows him. */
export const CH5_ASSETS: AssetDef[] = [
  sheet(T.tiles, 16, 16, TILESET_FRAME_COUNT, world.drawWesternTile),
  one(T.sky, 8, 360, world.drawWesternSky),
  one(T.bigMoon, 64, 64, world.drawBigMoon),
  one(T.mesasFar, 384, 140, world.drawMesasFar),
  one(T.mesasNear, 384, 170, world.drawMesasNear),
  one(T.saloonWall, 128, 192, world.drawSaloonWall),
  one(T.jailWall, 128, 192, world.drawJailWall),
  one(T.hotelWall, 128, 192, world.drawHotelWall),
  one(T.mineWall, 128, 192, world.drawMineWall),
  one(T.cavernWall, 128, 192, world.drawCavernWall),
  one(T.shaftWall, 128, 192, world.drawShaftWall),
  one(T.townGate, 176, 112, props.drawTownGate),
  one(T.saloon, 128, 104, props.drawSaloon),
  sheet(T.shopFront, 96, 88, 4, props.drawShopFront),
  sheet(T.wanted, 40, 40, 3, props.drawWanted),
  one(T.hitchingPost, 36, 16, props.drawHitchingPost),
  one(T.wagonWheel, 20, 20, props.drawWagonWheel),
  one(T.crates, 24, 24, props.drawCrates),
  one(T.lanternPost, 14, 52, props.drawLanternPost),
  one(T.coffin, 16, 32, props.drawCoffin),
  sheet(T.waterTower, 72, 128, 2, props.drawWaterTower),
  one(T.hotelSign, 128, 26, props.drawHotelSign),
  one(T.barCounter, 64, 28, props.drawBarCounter),
  one(T.piano, 40, 30, props.drawPiano),
  one(T.mouseHole, 14, 10, props.drawMouseHole),
  sheet(T.jailFurniture, 48, 24, 2, props.drawJailFurniture),
  one(T.headframe, 112, 168, props.drawHeadframe),
  one(T.minePortal, 80, 72, props.drawMinePortal),
  one(T.mineRails, 32, 6, props.drawMineRails),
  one(T.timbers, 48, 80, props.drawTimbers),
  one(T.hangingLantern, 10, 16, props.drawHangingLantern),
  sheet(T.crystalCluster, 40, 36, 2, props.drawCrystalCluster),
  one(T.crystalSpire, 40, 96, props.drawCrystalSpire),
  one(T.dynamiteSign, 24, 16, props.drawDynamiteSign),
  one(T.prospector, 32, 14, props.drawProspector),
  one(T.oreCart, 32, 22, props.drawOreCart),
  one(T.vilgaxBridge, 320, 180, props.drawVilgaxBridge),
  sheet(T.kraab, hunters.KRAAB_FRAME.w, hunters.KRAAB_FRAME.h, hunters.KRAAB_FRAME_COUNT, hunters.drawKraab),
  sheet(T.tetrax, hunters.TETRAX_FRAME.w, hunters.TETRAX_FRAME.h, hunters.TETRAX_FRAME_COUNT, hunters.drawTetrax),
  one(T.portraitSixsix, 48, 48, hunters.drawSixsixPortrait),
  one(T.portraitKraab, 48, 48, hunters.drawKraabPortrait),
  one(T.portraitTetrax, 48, 48, hunters.drawTetraxPortrait),
  sheet(T.tracker, 22, 14, 3, gear.drawTracker),
  sheet(T.crabbot, 28, 18, 5, gear.drawCrabbot),
  sheet(T.sentry, 20, 30, 3, gear.drawSentry),
  sheet(T.netGenerator, 20, 16, 2, gear.drawNetGenerator),
  sheet(T.energyNet, 32, 32, 2, gear.drawEnergyNet),
  sheet(T.clawBlast, 14, 10, 2, gear.drawClawBlast),
  one(T.cable, 24, 6, gear.drawCable),
  one(T.diveCart, 64, 36, gear.drawDiveCart),
  one(T.diveBeam, 64, 10, gear.drawDiveBeam),
];

export const CH5_ANIMS: AnimDef[] = [
  ...animsFor('kraab', T.kraab, hunters.KRAAB_FRAMES, { idle: 3, walk: 8 }, ['idle', 'walk']),
  ...animsFor('tetrax', T.tetrax, hunters.TETRAX_FRAMES, { idle: 2, walk: 7 }, ['idle', 'walk']),
  { key: 'tracker-idle', texture: T.tracker, frames: [0, 1], frameRate: 14, repeat: -1 },
  { key: 'crabbot-idle', texture: T.crabbot, frames: [0, 1], frameRate: 6, repeat: -1 },
  { key: 'crabbot-walk', texture: T.crabbot, frames: [0, 1], frameRate: 14, repeat: -1 },
  { key: 'sentry-idle', texture: T.sentry, frames: [0], frameRate: 1, repeat: -1 },
  { key: 'net-hum', texture: T.netGenerator, frames: [0, 1], frameRate: 8, repeat: -1 },
  { key: 'net-crackle', texture: T.energyNet, frames: [0, 1], frameRate: 10, repeat: -1 },
  { key: 'claw-blast', texture: T.clawBlast, frames: [0, 1], frameRate: 12, repeat: -1 },
];

/** Sixsix alone: the chapter's art, and Chapter Select's window for Chapter 5 once the chunk is in. */
export const SIXSIX_ASSETS: AssetDef[] = [sheet(CH5_TEX.sixsix, hunters.SIXSIX_FRAME.w, hunters.SIXSIX_FRAME.h, hunters.SIXSIX_FRAME_COUNT, hunters.drawSixsix),];
export const SIXSIX_ANIMS: AnimDef[] = animsFor('sixsix', CH5_TEX.sixsix, hunters.SIXSIX_FRAMES, { idle: 4, fly: 14 }, ['idle', 'fly']);
