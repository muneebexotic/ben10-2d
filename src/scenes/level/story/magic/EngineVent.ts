import { FX, TILE } from '../../../../config/constants';
import { CH6_BEATS } from '../../../../config/chapter6';
import type { MagicPlan } from '../../../../levels/types';
import { EventBus } from '../../../../systems/EventBus';
import type { Controls } from '../../../../systems/InputMap';
import { playSfx } from '../../../../systems/audio/Sfx';
import { MAGIC_SFX } from '../../../../entities/enemies/magic/sfx';
import { SCENES } from '../../../SceneKeys';
import type { SpellEngineData } from '../../../engine/SpellEngineScene';
import type { SetPiece, StoryKit } from '../StoryKit';
import { MagicActor } from './actors';
import { ENGINE_GO_LINES, ENGINE_LINES, JAM_LINES } from './lines';

type Phase = 'wait' | 'near' | 'crawl' | 'puzzle' | 'jam' | 'done';

const PROMPT_ID = 'engine-vent';
/** On Easy the puzzle's halfway point is a checkpoint of its own (`cp-engine-2` in the level). */
const HALFWAY = 'cp-engine-2';

/**
 * The Spell Engine. In the clock room the Engine pulls at the Charm that
 * chose Gwen (she sinks to her knees). Its works are behind a grille only
 * something tiny fits through: Grey Matter crawls in, and Gwen holds the
 * transformation open ("I WILL KEEP YOU SMALL!": the alien timer stops).
 * Inside, the puzzle (SpellEngineScene). Then the Engine jams, and Hex
 * flees up the outside of the tower.
 */
export class EngineVent implements SetPiece {
  private phase: Phase = 'wait';
  private t = 0;
  private readonly hex: MagicActor;
  private readonly ventX: number;
  private readonly floorY: number;
  private asking = false;

  constructor(
    private readonly kit: StoryKit,
    spec: MagicPlan['engine'],
    resumeX: number,
  ) {
    this.ventX = spec.ventX * TILE + TILE / 2;
    this.floorY = spec.floor * TILE;
    this.hex = new MagicActor(kit, 'hex');
    if (resumeX > this.ventX + 2 * TILE && kit.startCheckpoint !== HALFWAY) this.phase = 'done';
  }

  get cinematic(): boolean {
    return this.phase === 'crawl' || this.phase === 'jam';
  }

  /** The Engine is jammed (or was, before this restart). */
  get done(): boolean {
    return this.phase === 'done';
  }

  get storyLock(): boolean {
    return this.phase !== 'wait' && this.phase !== 'done';
  }

  update(_dtMs: number, realDtMs: number, _controls: Controls): void {
    this.hex.update(realDtMs);
    if (this.phase === 'done' || this.phase === 'puzzle') return;
    const kit = this.kit;
    const p = kit.player;
    this.t += realDtMs;
    switch (this.phase) {
      case 'wait':
        // A restart from the halfway checkpoint goes straight back in.
        if (kit.startCheckpoint === HALFWAY && !p.dead) {
          this.enter(2);
          return;
        }
        if (!p.dead && p.x >= this.ventX - 8 * TILE) {
          this.phase = 'near';
          kit.gwen?.actor.hold('hurt', 2400);
          kit.dialogue.play(ENGINE_LINES);
          kit.playMusic('engine');
        }
        return;
      case 'near': {
        const atVent = Math.abs(p.x - this.ventX) < TILE && p.grounded && !p.dead;
        const small = p.form.id === 'greymatter';
        const ask = atVent && !small;
        if (ask !== this.asking) {
          this.asking = ask;
          if (ask) EventBus.emit('hud:prompt', { id: PROMPT_ID, text: 'ONLY SOMETHING TINY FITS THROUGH THE GRILLE: {T} GREY MATTER!', priority: 3 });
          else EventBus.emit('hud:promptClear', { id: PROMPT_ID });
        }
        if (atVent && small && p.inputEnabled) this.enter(0);
        return;
      }
      case 'crawl':
        if (this.t >= CH6_BEATS.engine.crawlMs) this.launch();
        return;
      default:
        return;
    }
  }

  /** Into the vent: Ben vanishes into the grille, the timer stops, the works open up. */
  private enter(stage: number): void {
    const kit = this.kit;
    this.phase = 'crawl';
    this.t = 0;
    this.startStage = stage;
    EventBus.emit('hud:promptClear', { id: PROMPT_ID });
    kit.player.controlsEnabled = false;
    kit.player.setVelocityX(0);
    kit.omni.omnitrix.setTimerFrozen(true);
    kit.player.visual.setHidden(true);
    kit.fx.burst('dust', this.ventX, this.floorY - 4, 8);
    playSfx(MAGIC_SFX.clunk, 0.6, 1.4);
    kit.dialogue.play(ENGINE_GO_LINES);
    kit.playMusic('engine');
  }

  private startStage = 0;

  private launch(): void {
    const kit = this.kit;
    this.phase = 'puzzle';
    kit.setHud(false);
    EventBus.emit('hud:promptMute', { muted: true });
    const data: SpellEngineData = {
      startStage: this.startStage,
      onStage: (next) => {
        if (next === 2) kit.reachCheckpoint(HALFWAY);
      },
      onDone: (hinted) => this.jam(hinted),
    };
    kit.scene.scene.launch(SCENES.spellEngine, data);
  }

  /** The Engine grinds to a stop; Hex, furious, runs for the roof. */
  private jam(hinted: boolean): void {
    const kit = this.kit;
    this.phase = 'jam';
    this.t = 0;
    if (!hinted) kit.achievement('engine-room');
    kit.setHud(true);
    EventBus.emit('hud:promptMute', { muted: false });
    kit.player.visual.setHidden(false);
    kit.omni.omnitrix.setTimerFrozen(false);
    kit.fx.shake(FX.shakeMedium, 500);
    kit.fx.burst('spark', this.ventX, this.floorY - 60, 30);
    kit.fx.burst('mana', this.ventX + 80, this.floorY - 80, 24);
    playSfx(MAGIC_SFX.slam, 1, 0.8);
    this.hex.appear(this.ventX + 9 * TILE, this.floorY - 40, -1);
    this.hex.floating = true;
    this.hex.pose(4);
    kit.dialogue.play(JAM_LINES, {
      skippable: true,
      onDone: () => {
        this.hex.vanish();
        kit.player.controlsEnabled = true;
        kit.playMusic('manor');
        this.phase = 'done';
      },
    });
  }

  destroy(): void {
    this.hex.destroy();
    EventBus.emit('hud:promptClear', { id: PROMPT_ID });
    if (this.phase === 'puzzle') EventBus.emit('hud:promptMute', { muted: false });
    const s = this.kit.scene.scene;
    if (s.isActive(SCENES.spellEngine) || s.isPaused(SCENES.spellEngine)) s.stop(SCENES.spellEngine);
  }
}
