/**
 * Chapter 7, The Plumbers: tuning for the HD look, the base's water, its
 * systems and its story beats. Enemies are in `config/plumber.ts`, the boss
 * in `config/deepmaw.ts`, swimming in `config/swim.ts`.
 */

export const CH7_HD = {
  /** Highest render scale (fill rate on phones). */
  maxRenderScale: 3,
  /** Highest texture resolution for the chapter's art (texels per game pixel). */
  maxArtRes: 4,
  /** The world camera's zoom in the base (characters read bigger in HD); the boss arena frames wider. */
  zoom: 1.25,
  arenaZoom: 1,
} as const;
