/**
 * Recorded music (docs/DECISIONS.md, "Recorded music"): a track listed here
 * plays its recording instead of the code-written sequencer track of the same
 * name. Files go in public/assets/audio/music/. Empty until the recordings
 * arrive, so every chapter keeps its current music meanwhile.
 */
export interface Recording {
  /** Under public/ (an .m4a: every browser the game supports plays AAC). */
  url: string;
  /** The loop (seconds into the file): it plays from the start once, then loops between these. */
  loopStart: number;
  loopEnd: number;
  /** Loudness trim (dB), so recordings from different sessions sit at one level. */
  gainDb?: number;
  /** A one-shot (victory, a sting): no loop. */
  once?: boolean;
}

export const RECORDINGS: Readonly<Record<string, Recording>> = {};

/** How a recording reacts to Ben's form (the sequencer's hero layer, for a single mixed file). */
export const RECORDED_MIX = {
  /** Human Ben: the mix a little darker and quieter, so transforming opens it up. */
  humanCutoffHz: 2400,
  alienCutoffHz: 18000,
  humanGain: 0.82,
  alienGain: 1,
  /** How fast the mix opens or closes (s, time constant). */
  glideS: 0.25,
  /** Crossfades between tracks (s). */
  fadeS: 0.6,
} as const;
