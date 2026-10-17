import { PALETTE } from './palette';

/** Gwen's three spells, in the order she learns them (and the touch radial shows them). */
export type SpellId = 'shield' | 'stun' | 'reveal';
export const SPELL_ORDER: readonly SpellId[] = ['shield', 'stun', 'reveal'];

/**
 * Gwen as Ben's companion (Chapter 6, and older chapters when Settings turns
 * her spells on there): she follows, throws a small bolt now and then, and the
 * player calls her spells. Support, never a second protagonist: her bolts are
 * weak and every spell has a long cooldown.
 */
export const GWEN = {
  follow: {
    runSpeed: 150,
    /** Close enough: she stops this far from Ben. */
    stopPx: 26,
    /** Further than this (a respawn, a long flight) and she pops back in beside him. */
    catchUpPx: 300,
    crumbGap: 6,
    trailMax: 240,
    /** How high she hops to follow Ben up a ledge. */
    hopMs: 380,
  },
  /** Her own little attack: a mana bolt at an enemy near her. */
  bolt: { everyMs: [2800, 4400] as const, range: 190, damage: 0.6, speed: 300, knockback: 50, lifeMs: 1200 },
  spells: {
    /** G: a bubble around Ben that pops every shot that touches it. */
    shield: { cooldownMs: 9000, durationMs: 3000, radius: 22, color: PALETTE.mana },
    /** Up+G: a burst of mana that stuns everything around Ben (and interrupts a summon). */
    stun: { cooldownMs: 11000, radius: 110, stunMs: 1600, damage: 1, knockback: 140, color: PALETTE.manaGlow },
    /** Down+G: a circle of true sight around Ben: hidden doors, invisible enemies, illusions. */
    reveal: { cooldownMs: 12000, durationMs: 5000, radius: 96, color: 0x9ad8ff },
  },
  /** Under the thumbs (touch): she fades so she never hides a button or the stick's area. */
  thumbAlpha: 0.35,
  /** Standing in front of Ben: she goes see-through so he's always readable. */
  overlapAlpha: 0.55,
  chatterMs: [18000, 28000] as const,
} as const;
