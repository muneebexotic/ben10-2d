import { VILLAIN_INTRO } from '../../../../config/chapter3';
import { TILE } from '../../../../config/constants';
import { PALETTE } from '../../../../config/palette';
import type { EnemyKind } from '../../../../levels/types';
import type { Controls } from '../../../../systems/InputMap';
import { music } from '../../../../systems/audio/Music';
import { playSfx } from '../../../../systems/audio/Sfx';
import type { SetPiece, StoryKit } from '../StoryKit';
import { AnimoActor } from './AnimoActor';
import { ANIMO_INTRO_LINES, ANIMO_SEES_ALIEN } from './lines';

export interface VillainSpec {
  triggerX: number;
  x: number;
  y: number;
  exitX: number;
  spawns: Array<{ kind: EnemyKind; x: number; y: number }>;
}

type Phase = 'wait' | 'speech' | 'zap' | 'exit' | 'done';

/**
 * Dr. Animo's entrance in the Great Hall: the lights dip, he rises over the
 * T-rex on the balcony, makes his speech (portrait and voice in the box),
 * zaps the exhibits into mutants and leaves hanging from a giant bat. On a
 * retry or a continue the speech is skipped but the mutants still arrive.
 */
export class VillainIntro implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private spoke = false;
  private readonly actor: AnimoActor;
  private readonly quick: boolean;

  constructor(
    private readonly kit: StoryKit,
    private readonly spec: VillainSpec,
    resumeX: number,
  ) {
    this.actor = new AnimoActor(kit.scene, kit.fx, kit.lighting, spec.x * TILE + TILE / 2, spec.y * TILE);
    this.quick = kit.continuing;
    if (resumeX > spec.triggerX * TILE) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'speech' || this.phase === 'zap' || this.phase === 'exit';
  }

  get storyLock(): boolean {
    return this.cinematic;
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.actor.update(realDtMs);
    if (this.phase === 'done') return;
    const kit = this.kit;
    if (this.phase === 'wait') {
      if (kit.player.x < this.spec.triggerX * TILE || kit.player.dead) return;
      if (this.quick) {
        this.spawn(800);
        this.phase = 'done';
        return;
      }
      this.begin();
      return;
    }
    this.t += realDtMs;
    if (this.phase === 'speech' && this.t >= VILLAIN_INTRO.appearMs && !this.spoke) {
      this.spoke = true;
      const lines = kit.player.isAlien ? [ANIMO_INTRO_LINES[0], ANIMO_SEES_ALIEN, ...ANIMO_INTRO_LINES.slice(2)] : ANIMO_INTRO_LINES;
      this.actor.gesture(true);
      kit.dialogue.play(lines, { skippable: true, onDone: () => this.zap() });
    }
  }

  private begin(): void {
    const kit = this.kit;
    this.phase = 'speech';
    this.t = 0;
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.player.setInvulnerable(9000);
    kit.setLetterbox(true);
    kit.camera.lockTo(this.actor.x - 40, this.spec.y * TILE + 20);
    music.setIntensity(0);
    playSfx('powerDown', 0.4);
    this.actor.appear();
    this.actor.face(kit.player.x < this.actor.x ? -1 : 1);
  }

  private zap(): void {
    if (this.phase !== 'speech') return;
    this.phase = 'zap';
    this.actor.gesture(false);
    const targets = this.spec.spawns.map((s) => ({ x: s.x * TILE + TILE / 2, y: s.y * TILE }));
    this.actor.zap(targets, () => undefined);
    this.spawn(VILLAIN_INTRO.spawnGraceMs);
    this.kit.fx.shake(0.008, 300);
    this.kit.scene.time.delayedCall(VILLAIN_INTRO.zapMs, () => this.exit());
  }

  private spawn(graceMs: number): void {
    for (const [i, s] of this.spec.spawns.entries()) {
      const x = s.x * TILE + TILE / 2;
      const y = s.y * TILE;
      this.kit.spawnDrone(s.kind, x, y, { delayMs: graceMs + i * 200 });
      this.kit.fx.burst('mutagen', x, y, 12);
    }
  }

  private exit(): void {
    this.phase = 'exit';
    const kit = this.kit;
    this.actor.exitByBat(this.spec.exitX * TILE, VILLAIN_INTRO.exitMs, () => undefined);
    kit.scene.time.delayedCall(VILLAIN_INTRO.exitMs * 0.5, () => {
      this.phase = 'done';
      kit.camera.unlock();
      kit.setLetterbox(false);
      kit.player.controlsEnabled = true;
      kit.player.setInvulnerable(600);
      kit.speech.show(kit.player.isAlien ? 'GET BACK HERE, BAT-MAN!' : 'OKAY. THAT WAS WEIRD. HERO TIME!', 1800);
      kit.fx.popText(this.actor.x, this.spec.y * TILE - 50, 'MWAHAHAHA!', PALETTE.animo);
    });
  }

  destroy(): void {
    this.actor.destroy();
  }
}
