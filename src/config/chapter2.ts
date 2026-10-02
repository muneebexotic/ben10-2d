/** Road Trip tuning: the Rustbucket, the road, the chase and its convoy. All set-piece numbers live here. */
export const RUSTBUCKET_CFG = {
  /** The flat part of the roof Ben stands on, relative to the RV's centre (px). */
  roofFrom: -80,
  roofTo: 58,
  /** Roof height above the road (px). */
  roofHeight: 56,
  bobAmplitude: 1,
  /** A pothole: the RV jolts and anyone on the roof gets bounced. */
  potholeKick: -170,
  headlightRadius: 140,
} as const;

export const ROAD = {
  /** Cruising speed of the treadmill (px/s): road, props and backdrop scroll at this. */
  cruiseSpeed: 520,
  /** Roadside props: one every this many pixels of travel, on average. */
  propEvery: 170,
  speedLineEveryMs: 70,
} as const;

/** The opening drive (real milliseconds). */
export const ROAD_INTRO = {
  bannerAt: 200,
  linesAt: 900,
  /** The cut to the rest stop, and the RV pulling in. */
  fadeMs: 260,
  pullInMs: 1000,
  hopOutAt: 1350,
  controlAt: 1650,
} as const;
