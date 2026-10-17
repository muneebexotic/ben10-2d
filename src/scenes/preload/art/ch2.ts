import { one, sheet } from '../assetTypes';
import { TEX } from '../assetKeys';
import type { ChapterArt } from '../../../chapters/types';
import { TILESET_FRAME_COUNT } from '../../../levels/tiles';
import * as hw from '../highway';
import * as rb from '../roadbreaker';

/** Chapter 2's own art (the desert highway, the truck stop, ROADBREAKER): made when the chapter loads, not at boot (docs/PERFORMANCE.md, "Loading"). */
export const CH2_ART: ChapterArt = {
  assets: [
    sheet(TEX.tilesDesert, 16, 16, TILESET_FRAME_COUNT, hw.drawDesertTile),
    one(TEX.road, 64, 160, hw.drawRoad),
    one(TEX.sunsetSky, 8, 360, hw.drawSunsetSky),
    one(TEX.duskSky, 8, 360, hw.drawDuskSky),
    one(TEX.farMesas, 512, 140, hw.drawFarMesas),
    one(TEX.nearButtes, 384, 170, hw.drawNearButtes),
    one(TEX.poles, 256, 110, hw.drawPoles),
    one(TEX.scrub, 320, 40, hw.drawScrub),
    one(TEX.cactus, 22, 40, hw.drawCactus),
    one(TEX.cactusSmall, 14, 14, hw.drawCactusSmall),
    one(TEX.diner, 120, 88, hw.drawDiner),
    one(TEX.gasPump, 14, 26, hw.drawGasPump),
    one(TEX.smoothyStand, 48, 56, hw.drawSmoothyStand),
    sheet(TEX.billboard, 96, 64, 2, hw.drawBillboard),
    one(TEX.roadSign, 16, 28, hw.drawRoadSign),
    one(TEX.mileMarker, 8, 16, hw.drawMileMarker),
    one(TEX.bridgeEnd, 48, 40, hw.drawBridgeEnd),
    one(TEX.girder, 62, 26, hw.drawGirder),
    one(TEX.guardrail, 32, 12, hw.drawGuardrail),
    one(TEX.skull, 14, 8, hw.drawSkull),
    one(TEX.barrel, 12, 16, hw.drawBarrel),
    one(TEX.carWreck, 56, 26, hw.drawCarWreck),
    one(TEX.poleSign, 40, 192, hw.drawPoleSign),
    one(TEX.garage, 96, 64, hw.drawGarage),
    one(TEX.shed, 80, 64, hw.drawShed),
    sheet(TEX.neon, 52, 24, 2, hw.drawNeon),
    one(TEX.haulerWreck, 160, 56, hw.drawHaulerWreck),
    one(TEX.fence, 32, 14, hw.drawFence),
    sheet(TEX.rbTruck, rb.RB_TRUCK.w, rb.RB_TRUCK.h, 4, rb.drawRbTruck),
    sheet(TEX.rbWheel, rb.RB_WHEEL.w, rb.RB_WHEEL.h, 3, rb.drawRbWheel),
    sheet(TEX.rbLegs, rb.RB_LEGS.w, rb.RB_LEGS.h, 4, rb.drawRbLegs),
    sheet(TEX.rbTorso, rb.RB_TORSO.w, rb.RB_TORSO.h, 3, rb.drawRbTorso),
    one(TEX.rbArm, rb.RB_ARM.w, rb.RB_ARM.h, rb.drawRbArm),
    sheet(TEX.rbPlate, rb.RB_PLATE.w, rb.RB_PLATE.h, 2, rb.drawRbPlate),
  ],
  anims: [
    { key: 'rb-drive', texture: TEX.rbTruck, frames: [0, 1], frameRate: 10, repeat: -1 },
    { key: 'rb-wheel', texture: TEX.rbWheel, frames: [0, 1], frameRate: 16, repeat: -1 },
    { key: 'rb-walk', texture: TEX.rbLegs, frames: [1, 0, 2, 0], frameRate: 6, repeat: -1 },
    { key: 'neon-flicker', texture: TEX.neon, frames: [0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0], frameRate: 8, repeat: -1 },
  ],
};
