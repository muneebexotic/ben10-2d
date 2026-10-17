import { one, sheet } from '../assetTypes';
import type { ChapterArt } from '../../../chapters/types';
import * as gear from './gear';
import { CH5_TEX as T } from './keys';

/**
 * The Diamond Deep's gear that older chapters' secrets reuse (security lasers, receivers,
 * crystal gates, phase walls, dynamite, falling rocks): a shared art group, generated the
 * first time a level that uses it loads (`levels/bountyGear.ts`).
 */
export const GEAR_ART: ChapterArt = {
  assets: [
    sheet(T.dynamite, 16, 14, 2, gear.drawDynamite),
    sheet(T.fallingRock, 16, 14, 3, gear.drawFallingRock),
    sheet(T.phaseWall, 16, 16, 3, gear.drawPhaseWall),
    one(T.laserEmitter, 14, 14, gear.drawLaserEmitter),
    sheet(T.receiver, 14, 14, 2, gear.drawReceiver),
    sheet(T.crystalGate, 16, 16, 2, gear.drawCrystalGate),
  ],
  anims: [],
};
