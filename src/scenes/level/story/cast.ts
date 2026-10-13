import { PALETTE } from '../../../config/palette';
import { TEX } from '../../preload/assetKeys';
import { WILDMUTT_TEX } from '../../../aliens/wildmutt/art';
import { GHOSTFREAK_TEX } from '../../../aliens/ghostfreak/art';
import { CH5_TEX } from '../../preload/bounty';

export type CastId = 'max' | 'gwen' | 'ben' | 'vilgax' | 'animo' | 'wildmutt' | 'kevin' | 'stranger' | 'sixsix' | 'kraab' | 'tetrax' | 'ghostfreak';

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
  animo: { name: 'DR. ANIMO', color: PALETTE.animo, portrait: TEX.portraitAnimo, voicePitch: 0.8 },
  /** Ben as Wildmutt: he can only growl, so the box subtitles him. */
  wildmutt: { name: 'WILDMUTT', color: 0xff9a3c, portrait: WILDMUTT_TEX.portrait, voicePitch: 0.5 },
  kevin: { name: 'KEVIN', color: PALETTE.kevin, portrait: TEX.portraitKevinGrin, voicePitch: 1.05 },
  /** Kevin before he gives his name (the Act 1 ending's shadowy portrait). */
  stranger: { name: '???', color: PALETTE.kevin, portrait: TEX.portraitKevin, voicePitch: 1.05 },
  /** Sixsix only speaks in clicks: the box subtitles him. */
  sixsix: { name: 'SIXSIX', color: PALETTE.sixsix, portrait: CH5_TEX.portraitSixsix, voicePitch: 1.6 },
  kraab: { name: 'KRAAB', color: PALETTE.kraab, portrait: CH5_TEX.portraitKraab, voicePitch: 0.75 },
  tetrax: { name: 'TETRAX', color: PALETTE.tetrax, portrait: CH5_TEX.portraitTetrax, voicePitch: 0.65 },
  /** The thing in the watch (whispers at the very end). */
  ghostfreak: { name: '...', color: PALETTE.ghostfreakEye, portrait: GHOSTFREAK_TEX.portrait, voicePitch: 0.45 },
};

export function isCastId(id: string): id is CastId {
  return id in CAST;
}
