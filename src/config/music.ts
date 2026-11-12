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

/** Every recording is levelled to about this loudness (integrated LUFS) with `gainDb`, so tracks sit at one level. */
export const MUSIC_TARGET_LUFS = -16;

export const RECORDINGS: Readonly<Record<string, Recording>> = {
  // Chapter 7, the Plumber base (the owner's recording). 112 BPM, 28 bars made to loop as a whole: from just before
  // the first kick (0.024 s) to the same point 28 bars (60 s) on, where the next downbeat lands. -11.5 LUFS.
  deep: { url: 'assets/audio/music/deep.m4a', loopStart: 0.022, loopEnd: 60.022, gainDb: -4.5 },
  // Chapter 7, the open sea (the owner's recording). 90 BPM; the file fades out from 53.5 s, so the loop is the 16 bars
  // before it (10.285 to 52.952 s, the smoothest join in it) and the first 10 s play once. -11.5 LUFS.
  opensea: { url: 'assets/audio/music/opensea.m4a', loopStart: 10.285, loopEnd: 52.952, gainDb: -4.5 },
};

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
