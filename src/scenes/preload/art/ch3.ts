import { one, sheet } from '../assetTypes';
import { TEX } from '../assetKeys';
import type { ChapterArt } from '../../../chapters/types';
import { TILESET_FRAME_COUNT } from '../../../levels/tiles';
import * as mus from '../museum';

/** Chapter 3's own art (the museum at night, Dr. Animo's lab): made when the chapter loads, not at boot (docs/PERFORMANCE.md, "Loading"). */
export const CH3_ART: ChapterArt = {
  assets: [
    sheet(TEX.tilesMuseum, 16, 16, TILESET_FRAME_COUNT, mus.drawMuseumTile),
    one(TEX.citySky, 8, 360, mus.drawCitySky),
    one(TEX.city, 384, 120, mus.drawCity),
    one(TEX.hallWall, 128, 192, mus.drawHallWall),
    one(TEX.labWall, 128, 192, mus.drawLabWall),
    one(TEX.lampPost, 12, 56, mus.drawLampPost),
    one(TEX.trex, 150, 110, mus.drawTrex),
    one(TEX.mammoth, 110, 80, mus.drawMammoth),
    one(TEX.whale, 220, 60, mus.drawWhale),
    one(TEX.pterosaur, 70, 30, mus.drawPterosaur),
    one(TEX.displayCase, 32, 30, mus.drawDisplayCase),
    one(TEX.stuffedBear, 30, 44, mus.drawStuffedBear),
    one(TEX.banner, 24, 56, mus.drawBanner),
    one(TEX.painting, 40, 30, mus.drawPainting),
    one(TEX.velvetRope, 32, 16, mus.drawVelvetRope),
    one(TEX.exitSign, 20, 10, mus.drawExitSign),
    one(TEX.tarSign, 40, 30, mus.drawTarSign),
    one(TEX.meteorite, 40, 44, mus.drawMeteorite),
    one(TEX.mutagenTank, 28, 56, mus.drawMutagenTank),
    one(TEX.cage, 36, 32, mus.drawCage),
    one(TEX.labConsole, 48, 34, mus.drawLabConsole),
    one(TEX.pipes, 64, 24, mus.drawPipes),
    one(TEX.staffDoor, 24, 40, mus.drawStaffDoor),
    one(TEX.column, 24, 112, mus.drawColumn),
    one(TEX.vines, 16, 16, mus.drawVines),
    one(TEX.glass, 16, 8, mus.drawGlass),
  ],
  anims: [],
};
