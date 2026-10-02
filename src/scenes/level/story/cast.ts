import { PALETTE } from '../../../config/palette';
import { TEX } from '../../preload/assetKeys';

export type CastId = 'max' | 'gwen' | 'ben' | 'vilgax';

export interface CastMember {
  name: string;
  color: number;
  portrait: string;
  /** Pitch of the typewriter voice blips. */
  voicePitch: number;
}

/** Who can speak in dialogue: name tag colour, portrait and voice. */
export const CAST: Record<CastId, CastMember> = {
  max: { name: 'GRANDPA MAX', color: PALETTE.max, portrait: TEX.portraitMax, voicePitch: 0.72 },
  gwen: { name: 'GWEN', color: PALETTE.gwen, portrait: TEX.portraitGwen, voicePitch: 1.4 },
  ben: { name: 'BEN', color: PALETTE.omnitrix, portrait: TEX.portraitBen, voicePitch: 1.15 },
  vilgax: { name: 'VILGAX', color: PALETTE.enemy, portrait: TEX.portraitVilgax, voicePitch: 0.55 },
};

export function isCastId(id: string): id is CastId {
  return id in CAST;
}
