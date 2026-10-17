import type { SpellId } from '../../../config/gwen';

/** Gwen's banter when nothing is happening (replays of older chapters; Chapter 6 brings its own). */
export const GWEN_CHATTER: readonly string[] = [
  'FOR THE RECORD, I COULD DO THIS WITHOUT A WATCH.',
  'IF YOU GET HURT, GRANDPA BLAMES ME. SO DON\'T.',
  'I READ THREE SPELL BOOKS THIS WEEK. YOU READ A COMIC.',
  'TRY NOT TO PICK THE WRONG ALIEN THIS TIME, DOOFUS.',
  'SHIELD\'S UP WHEN YOU NEED IT. JUST ASK NICELY.',
  'THAT WATCH HAS MORE THAN ONE ALIEN, YOU KNOW.',
];

/** What she says when a spell isn't ready. */
export const GWEN_NOT_READY: readonly string[] = ['GIVE ME A SECOND!', 'STILL CHARGING!', 'I\'M NOT A VENDING MACHINE!'];

/** Asked for a spell she hasn't learned yet. */
export const GWEN_UNKNOWN = 'I DON\'T KNOW THAT ONE YET.';

/** One line the first time she casts each spell in a run. */
export const GWEN_CAST_LINES: Record<SpellId, readonly string[]> = {
  shield: ['SHIELD!', 'I GOT YOU.', 'BUBBLE UP!'],
  stun: ['FREEZE!', 'STAY PUT!', 'NOT SO FAST!'],
  reveal: ['SHOW YOURSELF!', 'NOTHING HIDES FROM ME.', 'LOOK CLOSER.'],
};

/** On the HUD when a spell is learned: its name and how to cast it. */
export const SPELL_INFO: Record<SpellId, { name: string; how: string; does: string }> = {
  shield: { name: 'SHIELD', how: '{G}', does: 'A BUBBLE AROUND BEN: POPS SHOTS, EATS ONE HIT' },
  stun: { name: 'STUN', how: '{UP} + {G}', does: 'A BURST THAT FREEZES EVERY ENEMY NEAR BEN' },
  reveal: { name: 'REVEAL', how: '{DOWN} + {G}', does: 'SHOWS WHAT\'S HIDDEN: DOORS, GHOSTS, FAKES' },
};
