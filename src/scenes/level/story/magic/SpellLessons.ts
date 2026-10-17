import { TILE } from '../../../../config/constants';
import { CH6_BEATS } from '../../../../config/chapter6';
import { ILLUSION } from '../../../../config/magic';
import type { SpellId } from '../../../../config/gwen';
import type { MagicPlan } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import { LESSON_LINES } from './lines';

type Lesson = MagicPlan['lessons'][number];
type Phase = 'wait' | 'before' | 'cast' | 'after' | 'done';

/**
 * Gwen becomes a fighter: the first time each spell comes out of her, in the
 * middle of trouble. In the great hall, two of Hex's illusions fire at Ben at
 * once and a bubble snaps up around him (SHIELD). In the library, gargoyles
 * swoop from every side and she blasts them back (STUN). In the cellars, at
 * a dead end, she sees through the wall (REVEAL). Each one slows time for a
 * moment, then the card says how to call it. A file that already knows the
 * spell walks straight past.
 */
export class SpellLessons implements SetPiece {
  private index = 0;
  private phase: Phase = 'wait';
  private t = 0;
  private readonly casters: Array<{ x: number; y: number }> = [];

  constructor(
    private readonly kit: StoryKit,
    private readonly lessons: readonly Lesson[],
    resumeX: number,
  ) {
    // Lessons behind a restart point are over (the file has saved the spell).
    while (this.index < this.lessons.length && resumeX > this.lessons[this.index].x * TILE) {
      kit.gwen?.learn(this.lessons[this.index].spell, false);
      this.index++;
    }
  }

  get cinematic(): boolean {
    return this.phase === 'before' || this.phase === 'cast';
  }

  get storyLock(): boolean {
    return this.phase !== 'wait' && this.phase !== 'done';
  }

  private get lesson(): Lesson | undefined {
    return this.lessons[this.index];
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    const lesson = this.lesson;
    const gwen = this.kit.gwen;
    if (!lesson || !gwen) return;
    const p = this.kit.player;
    this.t += realDtMs;
    switch (this.phase) {
      case 'wait':
      case 'done':
        if (p.dead || p.x < lesson.x * TILE || !gwen.present) return;
        if (gwen.spells.knows(lesson.spell)) {
          gwen.learn(lesson.spell, false);
          this.next();
          return;
        }
        this.begin(lesson);
        return;
      case 'before':
        if (!this.kit.dialogue.playing && this.t >= 300) this.cast(lesson.spell);
        return;
      case 'cast':
        if (this.t >= CH6_BEATS.lesson.linesAt) this.after(lesson.spell);
        return;
      case 'after':
        if (!this.kit.dialogue.playing) {
          gwen.learn(lesson.spell, true);
          this.kit.player.controlsEnabled = true;
          this.next();
        }
        return;
    }
  }

  private begin(lesson: Lesson): void {
    const kit = this.kit;
    this.phase = 'before';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.gwen!.quiet = true;
    const lines = LESSON_LINES[lesson.spell].before;
    if (lines.length > 0) kit.dialogue.play(lines);
    if (lesson.spell === 'shield') this.illusionsAppear();
    else if (lesson.spell === 'stun') this.gargoylesSwoop();
  }

  /** Two of Hex's illusions appear either side of Ben. */
  private illusionsAppear(): void {
    const kit = this.kit;
    const p = kit.player;
    this.casters.length = 0;
    for (const side of [-1, 1] as const) {
      const x = p.x + side * 110;
      const y = p.y - 30;
      kit.spawnDrone('illusion', x, y, { roam: true });
      kit.fx.burst('mana', x, y, 12);
      this.casters.push({ x, y });
    }
  }

  /** ...and fire at once. */
  private illusionsFire(): void {
    const kit = this.kit;
    const p = kit.player;
    for (const c of this.casters) {
      const a = Math.atan2(p.centerY - c.y, p.x - c.x);
      const v = ILLUSION.boltSpeed * 1.6;
      kit.projectiles.spawn('spell', 'enemy', c.x, c.y, Math.cos(a) * v, Math.sin(a) * v, ILLUSION.boltDamage, 2400, 4, { hitKind: 'burst' });
    }
    playSfx(MAGIC_SFX.zap, 0.9);
  }

  /** Gargoyles drop on Ben from every side, already awake and diving. */
  private gargoylesSwoop(): void {
    const kit = this.kit;
    const p = kit.player;
    for (const [dx, dy] of [[-90, -70], [0, -100], [90, -70]] as const) {
      const d = kit.spawnDrone('gargoyle', p.x + dx, p.y + dy, { roam: true });
      d.awake = true;
      d.memo.awake = 1;
      d.setState('fly');
      d.nextActionAt = 0;
    }
    playSfx(MAGIC_SFX.screech, 1);
  }

  /** Time slows; the spell comes out of her for the first time. */
  private cast(spell: SpellId): void {
    const kit = this.kit;
    this.phase = 'cast';
    this.t = 0;
    const L = CH6_BEATS.lesson;
    if (spell === 'shield') this.illusionsFire();
    kit.fx.slowMo(L.slowScale, L.slowMs);
    kit.scene.time.delayedCall(spell === 'shield' ? 450 : 200, () => kit.gwen?.forceCast(spell));
  }

  private after(spell: SpellId): void {
    this.phase = 'after';
    this.t = 0;
    this.kit.dialogue.play(LESSON_LINES[spell].after);
  }

  private next(): void {
    this.phase = 'done';
    this.index++;
    this.t = 0;
    if (this.kit.gwen) this.kit.gwen.quiet = false;
  }

  destroy(): void {
    if (this.kit.gwen) this.kit.gwen.quiet = false;
  }
}
