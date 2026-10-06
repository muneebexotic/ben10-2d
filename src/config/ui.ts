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

/** Menus: shared timing so every screen moves and sounds the same. */
export const MENU = {
  /** Pine parallax speed (px per ms) on every menu backdrop. */
  pineDrift: 0.01,
  fadeOutMs: 220,
  fadeInMs: 260,
  /** The Omnitrix iris that wipes between menu screens. */
  irisMs: 320,
  /** Card focus tween. */
  focusMs: 160,
  /** A focused menu card rises this many pixels (cards don't scale: a fractional scale blurs the pixel font). */
  focusLift: 4,
  /** Chapter Select: card spacing and the size of neighbours. */
  chapterSpacing: 238,
  chapterSideScale: 0.8,
  /** Side cards are darkened by this much. */
  chapterSideShade: 0.5,
  /** Chapter Select: the chapter title decodes letter by letter after a first clear. */
  revealStepMs: 45,
} as const;

export const GAMEOVER = {
  /** From this many deaths in one run, the tip suggests lowering the difficulty. */
  suggestEasierAfterDeaths: 4,
} as const;

/** The control hint bar at the bottom of the HUD. */
export const PROMPT = {
  /** Its row's bottom edge, up from the bottom of the screen. */
  bottom: 43,
  /** Clear space kept between the bar and the touch stick or buttons beside it. */
  thumbGap: 6,
  /** The first PRESS {T} TO TRANSFORM! draws at 2x and its box breathes by this much. */
  bigPulse: 0.08,
} as const;
