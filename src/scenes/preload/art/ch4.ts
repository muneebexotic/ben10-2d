import { one, sheet } from '../assetTypes';
import { TEX } from '../assetKeys';
import type { ChapterArt } from '../../../chapters/types';
import { TILESET_FRAME_COUNT } from '../../../levels/tiles';
import * as city from '../city';
import * as sumo from '../sumo';

/** Chapter 4's own art (downtown, the GAME ZONE, Line 11, the SUMO SLAMMERS cabinet): made when the chapter loads, not at boot (docs/PERFORMANCE.md, "Loading"). */
export const CH4_ART: ChapterArt = {
  assets: [
    sheet(TEX.tilesCity, 16, 16, TILESET_FRAME_COUNT, city.drawCityTile),
    one(TEX.citySkyDusk, 8, 360, city.drawDuskSky),
    one(TEX.skylineFar, 384, 140, city.drawSkylineFar),
    one(TEX.skylineNear, 384, 170, city.drawSkylineNear),
    one(TEX.arcadeWall, 128, 192, city.drawArcadeWall),
    one(TEX.lairWall, 128, 192, city.drawLairWall),
    one(TEX.subwayWall, 128, 192, city.drawSubwayWall),
    one(TEX.tunnelWall, 128, 192, city.drawTunnelWall),
    one(TEX.substationWall, 128, 192, city.drawSubstationWall),
    sheet(TEX.storefront, 96, 72, 3, city.drawStorefront),
    one(TEX.streetLamp, 14, 64, city.drawStreetLamp),
    one(TEX.powerPole, 20, 120, city.drawPowerPole),
    one(TEX.newsstand, 32, 30, city.drawNewsstand),
    one(TEX.hydrant, 10, 13, city.drawHydrant),
    one(TEX.trashCan, 12, 16, city.drawTrashCan),
    sheet(TEX.neonSign, 48, 20, 3, city.drawNeonSign),
    one(TEX.prizeCounter, 96, 34, city.drawPrizeCounter),
    one(TEX.ticketMachine, 16, 34, city.drawTicketMachine),
    one(TEX.clawMachine, 64, 56, city.drawClawMachine),
    one(TEX.skeeBall, 48, 34, city.drawSkeeBall),
    one(TEX.bandStage, 144, 80, city.drawBandStage),
    sheet(TEX.breakerBox, 24, 32, 2, city.drawBreakerBox),
    sheet(TEX.poster, 22, 30, 3, city.drawPoster),
    sheet(TEX.laserBarrier, 32, 32, 2, city.drawLaserBarrier),
    one(TEX.uvLight, 16, 8, city.drawUvLight),
    one(TEX.stationSign, 96, 18, city.drawStationSign),
    one(TEX.subwayMap, 48, 32, city.drawSubwayMap),
    one(TEX.pillar, 16, 96, city.drawPillar),
    one(TEX.turnstile, 24, 26, city.drawTurnstile),
    one(TEX.tunnelLight, 10, 10, city.drawTunnelLight),
    one(TEX.cables, 64, 20, city.drawCables),
    one(TEX.transformer, 40, 48, city.drawTransformer),
    one(TEX.generator, 56, 44, city.drawGenerator),
    one(TEX.warningSign, 18, 18, city.drawWarningSign),
    one(TEX.securityLaser, 20, 48, city.drawSecurityLaser),
    one(TEX.catwalkRail, 32, 10, city.drawCatwalkRail),
    sheet(TEX.teslaCoil, 28, 80, 2, city.drawTeslaCoil),
    sheet(TEX.sumoBen, sumo.SUMO_FRAME.w, sumo.SUMO_FRAME.h, sumo.SUMO_FRAME_COUNT, sumo.drawSumo(0)),
    sheet(TEX.sumoKev, sumo.SUMO_FRAME.w, sumo.SUMO_FRAME.h, sumo.SUMO_FRAME_COUNT, sumo.drawSumo(1)),
    one(TEX.sumoRing, 240, 28, sumo.drawSumoRing),
  ],
  anims: [],
};
