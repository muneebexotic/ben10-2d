import type { CharmElement } from '../../../scenes/preload/karachi/colors';

const ELEMENTS: readonly CharmElement[] = ['fire', 'lightning', 'stone', 'wind'];

/** A fresh shuffle of the four Charms (Hex uses each once before any repeats). */
export function shuffledCharms(random: () => number = Math.random): CharmElement[] {
  const out = ELEMENTS.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Takes the next Charm off the bag (refilling it when empty). Pure apart from the bag, so it's tested. */
export function nextCharm(bag: CharmElement[], random: () => number = Math.random): CharmElement {
  if (bag.length === 0) bag.push(...shuffledCharms(random));
  return bag.shift()!;
}
