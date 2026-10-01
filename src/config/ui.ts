/** HUD layout and timing that isn't touch-specific. */
export const DIAL_UI = {
  /** Row of alien icons that flashes under the dial when it turns. */
  carouselY: 46,
  carouselSpacing: 20,
  carouselNameY: 10,
  carouselMs: 1400,
  carouselFadeMs: 300,
} as const;

/** Alien name slam timings: full transformations and quicker mid-fight swaps. */
export const NAME_SLAM = {
  holdMs: 800,
  firstHoldMs: 1300,
  swapHoldMs: 520,
  scale: 4,
  swapScale: 3,
} as const;
