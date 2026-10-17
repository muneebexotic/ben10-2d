import { GWEN, SPELL_ORDER, type SpellId } from '../config/gwen';

/**
 * Gwen's spells as plain rules (unit tested): which she knows, their
 * cooldowns, and which one a press asks for (G alone: shield; Up+G: stun;
 * Down+G: reveal; the touch radial picks directly).
 */
export class GwenSpells {
  private readonly known = new Set<SpellId>();
  private readonly readyAt: Record<SpellId, number> = { shield: 0, stun: 0, reveal: 0 };

  constructor(known: readonly SpellId[] = []) {
    for (const id of known) this.learn(id);
  }

  learn(id: SpellId): boolean {
    if (this.known.has(id)) return false;
    this.known.add(id);
    return true;
  }

  knows(id: SpellId): boolean {
    return this.known.has(id);
  }

  get knownSpells(): SpellId[] {
    return SPELL_ORDER.filter((id) => this.known.has(id));
  }

  /** Which spell a press asks for: the radial's pick, or G with Up / Down / alone. */
  pick(input: { up: boolean; down: boolean; pick: number | null }): SpellId {
    if (input.pick !== null) return SPELL_ORDER[Math.max(0, Math.min(SPELL_ORDER.length - 1, input.pick))];
    if (input.up && !input.down) return 'stun';
    if (input.down && !input.up) return 'reveal';
    return 'shield';
  }

  ready(id: SpellId, now: number): boolean {
    return this.known.has(id) && now >= this.readyAt[id];
  }

  /** 0 right after casting, 1 when ready again. */
  charge(id: SpellId, now: number): number {
    const cd = GWEN.spells[id].cooldownMs;
    return Math.max(0, Math.min(1, 1 - (this.readyAt[id] - now) / cd));
  }

  /** Casts if it can: true when the spell goes off (its cooldown starts). */
  cast(id: SpellId, now: number): boolean {
    if (!this.ready(id, now)) return false;
    this.readyAt[id] = now + GWEN.spells[id].cooldownMs;
    return true;
  }

  /** Everything ready again (a checkpoint restart). */
  refresh(): void {
    for (const id of SPELL_ORDER) this.readyAt[id] = 0;
  }
}

/** A file remembers each spell Gwen learned as a "seen" moment. */
export const spellSeenId = (id: SpellId): string => `spell:${id}`;

/** The spells a save file's Gwen knows. */
export function learnedSpells(file: { seen: readonly string[] } | null | undefined): SpellId[] {
  return SPELL_ORDER.filter((id) => file?.seen.includes(spellSeenId(id)) ?? false);
}
