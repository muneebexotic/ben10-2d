import Phaser from 'phaser';
import { COMBO, DEPTH, FX, LIGHTING, PHYSICS, TILE } from '../config/constants';
import { lerpColor, PALETTE } from '../config/palette';
import { ACCESSIBILITY } from '../config/accessibility';
import { PLAYER } from '../config/player';
import { COMBAT } from '../config/combat';
import { getAlien, hasAlien } from '../aliens/registry';
import type { AbilityAction } from '../aliens/types';
import { completedChapters, levelMeta } from '../levels/registry';
import type { AmbientKind, EnemyKind, EntitySpawn, LevelData } from '../levels/types';
import { Player, type DamageOutcome } from '../entities/Player';
import { Projectiles } from '../entities/Projectiles';
import { Drone, type DroneWorld } from '../entities/enemies/Drone';
import { createBrain } from '../entities/enemies/brains';
import { Telegraphs } from '../entities/enemies/Telegraphs';
import type { Barricade } from '../entities/props/Barricade';
import type { Boulder } from '../entities/props/Boulder';
import type { Checkpoint } from '../entities/props/Checkpoint';
import type { Dummy } from '../entities/props/Dummy';
import type { Jammer } from '../entities/props/Jammer';
import { Pickup } from '../entities/props/Pickup';
import type { Damageable, Hit, HitResult, Rect } from '../entities/types';
import { ComboCounter } from '../systems/Combo';
import { EventBus } from '../systems/EventBus';
import { Fx } from '../systems/Fx';
import { InputMap, type Controls } from '../systems/InputMap';
import { DEV_TOOLS, launchParams } from '../systems/LaunchParams';
import { setFrameLength } from '../systems/Pacing';
import { physicsSteps } from '../systems/PhysicsSteps';
import { frameStats } from '../systems/FrameStats';
import { installReferenceIntegration } from '../systems/ReferenceIntegration';
import { Lighting } from '../systems/Lighting';
import { cloneRunStats, createRunStats, type RunStats } from '../systems/RunStats';
import { TimeController } from '../systems/TimeController';
import { music } from '../systems/audio/Music';
import { audio } from '../systems/audio/AudioEngine';
import { playSfx } from '../systems/audio/Sfx';
import { bindAudioUnlock, bindMuteKey } from '../systems/Settings';
import { learnedSpells, spellSeenId } from '../systems/GwenSpells';
import { GwenCompanion } from './level/family/GwenCompanion';
import { SpeechBubble } from '../ui/SpeechBubble';
import { pixelText } from '../ui/text';
import { BossArena } from './level/BossArena';
import { CameraRig } from './level/CameraRig';
import { Combat, isFlame } from './level/Combat';
import { Decor } from './level/Decor';
import type { IntroDirector } from './level/IntroDirector';
import { LevelWorld } from './level/LevelWorld';
import { OmnitrixController } from './level/OmnitrixController';
import { Parallax } from './level/Parallax';
import { SimBackdrop } from './level/SimBackdrop';
import { SpecialTerrain } from './level/SpecialTerrain';
import { TechSystem } from './level/TechSystem';
import { checkpointsFor, spawnEntities } from './level/Spawner';
import { checkpointSpawn } from '../levels/checkpoints';
import { TransformSequence } from './level/TransformSequence';
import { MisfireBeat } from './level/MisfireBeat';
import { misfireAllowed } from '../systems/MisfireRules';
import { ensureArt } from './preload/generate';
import { usePresentation } from '../systems/hd/Presentation';
import { cameraZoom } from '../systems/CameraZoom';
import { chapterModule } from '../chapters/registry';
import type { Backdrop, ChapterModule } from '../chapters/types';
import { usesBountyGear } from '../levels/bountyGear';
import { Tutorial } from './level/Tutorial';
import { TrainingDirector } from './level/TrainingDirector';
import type { HighwayBackdrop } from './level/HighwayBackdrop';
import { Dialogue } from './level/story/Dialogue';
import { lockedSilhouette } from './level/lockedSilhouette';
import { StoryDirector } from './level/story/StoryDirector';
import type { StoryKit } from './level/story/StoryKit';
import { pendingUnlocks } from '../systems/Unlocks';
import { aliensUnlockedBy, allAliens } from '../aliens/registry';
import type { TrackName } from '../systems/audio/Music';
import { createDroneWorld, createFxApi } from './level/levelApis';
import { SCENES } from './SceneKeys';
import { a11y, blinkOn, flashCamera } from '../systems/Accessibility';
import { MISFIRE, PERFECT_TRANSFORM } from '../config/omnitrix';
import { PerfectWindow } from '../systems/PerfectTransform';
import { compareSplit, FINISH_SPLIT } from '../systems/Splits';
import { STORY_BEATS } from '../config/story';
import { saveSystem } from '../systems/SaveSystem';
import { CARDS } from '../levels/cards';
import { ALIEN_DEMOS, type MoveDemo } from '../config/alienFiles';
import { AlienDemoPilot } from './level/AlienDemo';
import { session } from '../systems/Session';
import { activeDifficulty, activeDifficultyId } from '../systems/Difficulty';
import type { CrackedWall, WallBreaker } from '../entities/props/CrackedWall';
import { CrystalPlatforms } from '../entities/crystal/CrystalPlatforms';
import { Haunting } from './level/Haunting';
import { WeakPoints } from './level/WeakPoints';
import { weakHit } from '../aliens/greymatter/audio';
import { Swimming } from './level/Swimming';
import { HazardSystem } from './level/Hazards';
import { DIAMONDHEAD } from '../config/aliens/diamondhead';
import type { ForcedMisfire } from '../systems/MisfireRules';
import { availableCards, countedCards, waitingSecrets } from '../levels/secrets';
import { CHAPTERS } from '../levels/chapters';
import { TRAINING } from '../config/training';
import { quality } from '../systems/Quality';
import { perf, switchLabel } from '../systems/PerfSwitches';
import { knownAliens, storyAliens, trainingAliens } from '../systems/Unlocks';
import { AchievementTracker, fileAchievements } from '../systems/Achievements';
import { FULL_OMNITRIX_FORMS, STRIKE_ACHIEVEMENT_HITS } from '../config/achievements';
import { jokeId } from '../aliens/jokes';
import { diaryEntryFor } from '../aliens/diary';
import { GHOST_HIDDEN_FRAME, GhostRecorder, ghostForms, ghostRecording, ghostStore } from '../systems/Ghost';
import { GhostRunner } from '../entities/GhostRunner';
import { getSettings } from '../systems/Settings';
import { inputMode } from '../systems/InputMode';
import type { PauseData } from './PauseScene';

export interface LevelStartData {
  /** Which level to play (default: Chapter 1). */
  levelId?: string;
  checkpoint?: string | null;
  stats?: RunStats;
  /** ALIEN FILES: a bot plays one of this alien's moves on a loop in the Training arena, drawn in `viewport` (screen px) with no HUD. */
  demo?: { alienId: string; move: number; viewport: { x: number; y: number; w: number; h: number } };
  /** ALIEN FILES' TRY IT: Training starts as this alien. */
  tryAlien?: string;
}

const AMBIENT: Record<AmbientKind, number> = {
  camp: LIGHTING.ambientCamp,
  forest: LIGHTING.ambientForest,
  ravine: LIGHTING.ambientRavine,
  crash: LIGHTING.ambientCrash,
  sim: LIGHTING.ambientSim,
  sunset: LIGHTING.ambientSunset,
  dusk: LIGHTING.ambientDusk,
  night: LIGHTING.ambientNight,
  neon: LIGHTING.ambientNeon,
  street: LIGHTING.ambientStreet,
  museum: LIGHTING.ambientMuseum,
  gallery: LIGHTING.ambientGallery,
  blackout: LIGHTING.ambientBlackout,
  atrium: LIGHTING.ambientAtrium,
  lab: LIGHTING.ambientLab,
  downtown: LIGHTING.ambientDowntown,
  arcade: LIGHTING.ambientArcade,
  lair: LIGHTING.ambientLair,
  subway: LIGHTING.ambientSubway,
  tunnel: LIGHTING.ambientTunnel,
  substation: LIGHTING.ambientSubstation,
  ghosttown: LIGHTING.ambientGhostTown,
  saloon: LIGHTING.ambientSaloon,
  jail: LIGHTING.ambientJail,
  hotel: LIGHTING.ambientHotel,
  minehead: LIGHTING.ambientMineHead,
  mine: LIGHTING.ambientMine,
  cavern: LIGHTING.ambientCavern,
  shaft: LIGHTING.ambientShaft,
  seafront: LIGHTING.ambientSeafront,
  palace: LIGHTING.ambientPalace,
  library: LIGHTING.ambientLibrary,
  cellar: LIGHTING.ambientCellar,
  oldTunnel: LIGHTING.ambientOldTunnel,
  clockwork: LIGHTING.ambientClockwork,
  towerTop: LIGHTING.ambientTowerTop,
  jetty: LIGHTING.ambientJetty,
  descent: LIGHTING.ambientDescent,
  docking: LIGHTING.ambientDocking,
  flooded: LIGHTING.ambientFlooded,
  reactor: LIGHTING.ambientReactor,
  blackout7: LIGHTING.ambientBlackout7,
  opensea: LIGHTING.ambientOpenSea,
  pumphall: LIGHTING.ambientPumpHall,
  containment: LIGHTING.ambientContainment,
  moonpool: LIGHTING.ambientMoonPool,
};


type BossSpawn = Extract<EntitySpawn, { type: 'boss' }>;

/**
 * Gameplay for any level: story chapters and Omnitrix Training. Orchestrates
 * systems; the interesting logic lives in scenes/level and entities. Story-only
 * set pieces (the intro, the boss arena) exist when the level has them, and
 * Training adds its director, so a later Free Play mode is just another mix.
 */
export class LevelScene extends Phaser.Scene {
  private level!: LevelData;
  /** This level's chapter: its chunk's level, story, bosses, backdrop and art. */
  private chapter!: ChapterModule;
  private mode: 'story' | 'training' = 'story';
  private dialAliens: string[] = [];
  private reachableCards = 0;
  private world!: LevelWorld;
  private backdrop!: Backdrop;
  private decor!: Decor;
  private lighting!: Lighting;
  private fx!: Fx;
  private time2!: TimeController;
  private projectiles!: Projectiles;
  private combat!: Combat;
  private telegraph!: Telegraphs;
  private inputMap!: InputMap;
  private player!: Player;
  private omni!: OmnitrixController;
  private sequence!: TransformSequence;
  private misfireBeat!: MisfireBeat;
  private speech!: SpeechBubble;
  private camRig!: CameraRig;
  private intro: IntroDirector | null = null;
  private tutorial!: Tutorial;
  private swimming!: Swimming;
  private arena: BossArena | null = null;
  private training: TrainingDirector | null = null;
  /** Paused under a card reveal (CardReveal in the HUD). */
  private revealing = false;
  /** ALIEN FILES' bot, when this level is a move's demo. */
  private demo: AlienDemoPilot | null = null;
  private demoAlien = '';
  private readonly demoEnemies: Drone[] = [];
  private story: StoryDirector | null = null;
  private dialogue!: Dialogue;
  private highway: HighwayBackdrop | null = null;
  /** Letterbox and HUD as set pieces left them (re-sent when the HUD scene asks). */
  private storyLetterbox = false;
  private storyHudHidden = false;
  private droneWorld!: DroneWorld;
  private drones: Drone[] = [];
  private barricades: Barricade[] = [];
  private checkpoints: Checkpoint[] = [];
  private pickups: Pickup[] = [];
  private jammer: Jammer | null = null;
  private walls: CrackedWall[] = [];
  private boulders: Boulder[] = [];
  private dummies: Dummy[] = [];
  private terrain: SpecialTerrain | null = null;
  /** Machines Upgrade merges into, and the subway's trains (Chapter 4 on). */
  private tech: TechSystem | null = null;
  /** Diamondhead's crystal platforms. */
  private crystals!: CrystalPlatforms;
  /** Missiles, dynamite, falling rocks, phase walls and security lasers (Chapter 5 on, and the older secrets). */
  private hazards: HazardSystem | null = null;
  /** Ghostfreak's whispers and the glitch when he arrives. */
  private haunting!: Haunting;
  /** Reticles on the weak points Grey Matter analysed. */
  private weakPoints!: WeakPoints;
  private gwen: GwenCompanion | null = null;
  /** A replay with Gwen: she joins on the first free frame. */
  private gwenJoinsAtStart = false;
  /**
   * Every misfire this attempt, and whether a story moment was running: only
   * a named exception (FORCED_MISFIRES) may ever misfire during one (QA checks).
   */
  readonly misfireLog: Array<{ gotId: string; forced: ForcedMisfire | null; storyLock: boolean; x: number }> = [];
  /** A stretch of the level with the lights out (Chapter 3's blackout). */
  private darkZone: { fromX: number; toX: number } | null = null;
  private stats!: RunStats;
  private achievements!: AchievementTracker;
  /** This run being recorded (a timed run from the start), and the best run's ghost racing it. */
  private recorder: GhostRecorder | null = null;
  private ghostRunner: GhostRunner | null = null;
  /** Damage taken when the boss fight began (UNTOUCHABLE), or null outside one. */
  private bossDamageAtStart: number | null = null;
  private combo = new ComboCounter(COMBO.windowMs);
  private gameNow = 0;
  private checkpointId: string | null = null;
  private state: 'play' | 'dead' | 'complete' = 'play';
  private statsTimer = 0;
  /** Play time not yet added to the save file. */
  private playMsUnsaved = 0;
  private alarm = false;
  /** Kills per alien this run (advanced tips appear after a few). */
  private readonly alienKills = new Map<string, number>();
  private debugText: Phaser.GameObjects.BitmapText | null = null;
  private debugRefreshIn = 0;
  private readonly perfect = new PerfectWindow(PERFECT_TRANSFORM);
  private vignette: Phaser.Filters.Vignette | null = null;
  private backdropOn = true;
  /** THE DEEP DIVE draws the world in its own scene: the level's camera, lightmap and scenery rest. */
  private worldHidden = false;
  private desaturate: Phaser.Filters.ColorMatrix | null = null;
  private readonly onResume = () => audio.setLoopsMuted(false);
  private readonly weakBox: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor() {
    super(SCENES.level);
  }

  create(data: LevelStartData): void {
    EventBus.emit('hud:reset');
    this.drones = [];
    this.barricades = [];
    this.checkpoints = [];
    this.pickups = [];
    this.jammer = null;
    this.walls = [];
    this.boulders = [];
    this.dummies = [];
    this.combo = new ComboCounter(COMBO.windowMs);
    this.gameNow = 0;
    this.state = 'play';
    this.alarm = false;
    this.desaturate = null;
    this.darkZone = null;
    this.worldHidden = false;
    this.alienKills.clear();
    // The chapter's chunk was loaded before this scene started (chapters/start.ts).
    this.chapter = chapterModule(data.levelId ?? 'ch1');
    this.level = this.chapter.level;
    // Chapter art is made on demand: this level's own, and the mine's gear wherever an older chapter uses it.
    for (const art of this.chapter.art ?? []) ensureArt(this, art);
    if (usesBountyGear(this.level)) ensureArt(this, 'gear');
    // An HD chapter (Act 3) sets up its look before anything is made; every other level is pixel art.
    cameraZoom.base = 1;
    if (this.chapter.enter) this.chapter.enter(this);
    else usePresentation(this, false);
    this.mode = this.level.chapter === 0 ? 'training' : 'story';
    const extra = this.mode === 'story' ? knownAliens(launchParams().aliens) : [];
    this.checkpointId = data.checkpoint ?? null;
    this.dialAliens = this.resolveAliens(extra);
    const demo = data.demo && this.mode === 'training' ? data.demo : null;
    const demoSpec = demo ? ALIEN_DEMOS[demo.alienId]?.[demo.move] : undefined;
    this.demo = null;
    this.demoAlien = demo?.alienId ?? '';
    this.demoEnemies.length = 0;
    if (demo) {
      // The demo's alien, plus whoever it swaps from or to.
      const wanted = [demo.alienId, demoSpec?.dial, demoSpec?.swapFrom];
      this.dialAliens = allAliens().map((a) => a.id).filter((id) => wanted.includes(id));
    }
    this.reachableCards = availableCards(this.level, this.dialAliens).length;
    // Starting mid-level (?start=) or with playtest aliens (?aliens=) is practice: no best times or splits.
    const fullRun = this.mode === 'story' && !data.checkpoint && extra.length === 0 && !launchParams().level;
    this.stats = data.stats ? cloneRunStats(data.stats) : createRunStats(countedCards(this.level).length, fullRun, activeDifficultyId());
    // Picked up on a different difficulty than it started on: still a clear, but not a timed run.
    if (this.stats.difficulty !== activeDifficultyId()) this.stats.mixedDifficulty = true;
    this.playMsUnsaved = 0;
    // Training is for practice (and spawns endless enemies): only the story counts toward achievements.
    this.achievements = new AchievementTracker(this.mode === 'story' ? fileAchievements(session.slot) : null, (def) =>
      EventBus.emit('achievement:unlocked', { id: def.id }),
    );
    this.bossDamageAtStart = null;
    if (this.mode === 'story' && session.slot !== null) {
      saveSystem.unlockAliens(session.slot, this.resolveAliens([]));
      // A fresh start of a chapter replaces any saved checkpoint for it.
      if (!data.checkpoint && session.file?.resume?.levelId === this.level.id) saveSystem.setResume(session.slot, null);
    }
    this.perfect.clear();
    this.checkpointId = data.checkpoint ?? null;

    if (!demo && !this.scene.isActive(SCENES.ui)) this.scene.launch(SCENES.ui);
    if (!demo && !this.scene.isActive(SCENES.touch)) this.scene.launch(SCENES.touch);
    quality.reset();

    this.world = new LevelWorld(this, this.level);
    this.physics.world.setBounds(0, 0, this.world.widthPx, this.world.heightPx + PHYSICS.worldBottomPadding);
    this.physics.world.checkCollision.down = false;
    installReferenceIntegration(this.physics.world);
    this.cameras.main.setBounds(0, 0, this.world.widthPx, this.world.heightPx);
    this.cameras.main.setBackgroundColor(PALETTE.sky0);
    if (demo) this.cameras.main.setViewport(demo.viewport.x, demo.viewport.y, demo.viewport.w, demo.viewport.h);
    this.vignette = perf.fx ? (this.cameras.main.filters?.external.addVignette(0.5, 0.5, 0.8, 0.3, 0x05070f) ?? null) : null;
    if (!perf.governor) quality.setLevel(0);
    if (quality.lowest) this.onQualityChanged(false);

    const bossSpawn = this.level.entities.find((e): e is BossSpawn => e.type === 'boss') ?? null;
    const beforeBackdrop = this.children.length;
    this.backdrop =
      this.chapter.backdrop?.(this, this.level, this.world) ??
      (this.level.theme === 'sim' ? new SimBackdrop(this) : new Parallax(this, bossSpawn ? bossSpawn.x * TILE : this.world.widthPx));
    // Chapter 2's set pieces drive its highway sky.
    this.highway = this.level.theme === 'highway' ? (this.backdrop as HighwayBackdrop) : null;
    // bg=0 (bisect switch): the sky, parallax and backdrop walls are hidden and never updated.
    this.backdropOn = perf.bg;
    if (!perf.bg) for (const o of this.children.list.slice(beforeBackdrop)) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible?.(false);
    this.decor = new Decor(this, this.level, this.world);
    this.lighting = new Lighting(this);
    this.lighting.enabled = perf.fx;
    this.time2 = new TimeController();
    this.fx = new Fx(this, this.lighting, this.time2);
    this.haunting = new Haunting(this.fx);
    this.misfireLog.length = 0;
    this.telegraph = new Telegraphs(this);
    this.projectiles = new Projectiles(this, this.fx, this.lighting);
    this.combat = new Combat(
      this.projectiles,
      {
        onTargetHit: (t, r, h) => this.onTargetHit(t, r, h),
        onPlayerHurt: (o) => this.onPlayerHurt(o),
        onParry: (n) => {
          this.stats.parries += n;
          // DEFLECTOR is Ben's punch; Diamondhead's shield has its own (REFLECTED).
          this.achievements.count(this.player.form.reach.canReflect ? 'reflected' : 'parries', n);
          this.bumpCombo(n);
        },
        onThrowLanded: (hits, x, y) => this.onThrowLanded(hits, x, y),
        onGasIgnite: (x, y, radius, hits) => this.onGasIgnite(x, y, radius, hits),
        onWeakHit: (t, hit) => this.onWeakHit(t, hit),
      },
      { isSolid: (x, y) => this.world.isSolid(x, y) },
    );
    this.weakPoints = new WeakPoints(this, this.combat);
    this.inputMap = new InputMap(this);
    this.speech = new SpeechBubble(this);
    this.dialogue = new Dialogue(this.speech);
    this.storyLetterbox = false;
    this.storyHudHidden = false;

    const start = this.resolveStart();
    this.camRig = new CameraRig(this.cameras.main);
    this.createPlayer(start);
    this.createOmnitrix();
    this.setupGhost(data);
    this.tutorial = new Tutorial(this.level);
    this.swimming = new Swimming(this.player, this.world, this.tutorial, (o) => this.onPlayerHurt(o), activeDifficultyId() === 'easy');

    this.droneWorld = createDroneWorld({
      scene: this,
      now: () => this.gameNow,
      player: this.player,
      fx: this.fx,
      lighting: this.lighting,
      projectiles: this.projectiles,
      telegraph: this.telegraph,
      world: this.world,
      onKilled: (d) => this.onDroneKilled(d),
      onGummed: () => {
        this.tutorial.onAction('gummed');
        this.achievements.count('gummed');
      },
      onOverload: (d) => this.onOverload(d.x, d.y),
      onFrightened: () => this.achievements.count('frightened'),
      salvo: (x, feetY) => this.hazards?.salvo(x, feetY),
      threat: (d, at) => this.perfect.register(d, at, d.x, d.y),
      cancelThreat: (d) => this.perfect.cancel(d),
    });
    this.spawnLevelEntities(this.checkpointId ? start.x : 0);

    this.camRig.snap(start.x, start.y);

    const resuming = this.checkpointId !== null;
    const hasPod = this.level.entities.some((e) => e.type === 'pod');
    this.intro = hasPod && this.mode === 'story'
      ? (this.chapter.podIntro?.({
          scene: this,
          level: this.level,
          player: this.player,
          fx: this.fx,
          time: this.time2,
          speech: this.speech,
          hooks: {
            giveOmnitrix: () => this.giveOmnitrix(),
            spawnIntroDrones: () => this.spawnIntroDrones(),
            hasTransformed: () => this.omni.transformations > 0,
            onControlStart: () => undefined,
            // The same test as createGwen (Chapter 1 has no Gwen of its own).
            gwenAlong: () => getSettings().gwenInReplays && learnedSpells(session.file).length > 0,
          },
          skip: resuming,
          skipOpening: data.stats !== undefined,
        }) ?? null)
      : null;
    if (this.intro) this.intro.lightHook = (x, y, r, c, i) => this.lighting.add(x, y, r, c, i);
    const kit = this.mode === 'story' ? this.createKit(data) : null;
    this.gwen = kit ? this.createGwen(kit) : null;
    if (kit) kit.gwen = this.gwen;
    this.arena = bossSpawn ? this.createArena(bossSpawn, kit) : null;
    this.training = this.mode === 'training' ? this.createTraining() : null;
    this.story = kit && this.level.story !== undefined ? new StoryDirector(kit, this.checkpointId ? start.x : 0, this.chapter.story) : null;

    if (resuming || !this.intro) {
      if (resuming) this.player.setInvulnerable(PLAYER.respawnInvulnMs);
      this.giveOmnitrix(true);
    }
    this.syncHud();
    // The HUD scene may be created after this scene (first launch); it asks for state when ready.
    EventBus.on('hud:ready', () => this.syncHud(), this);
    EventBus.on('reveal:done', () => this.closeReveal(), this);
    EventBus.on('difficulty:changed', () => this.onDifficultyChanged(), this);
    EventBus.on('level:quit', () => this.onQuit(), this);
    EventBus.on('alien:misfire', (e) => this.onJoke(e.gotId, e.line), this);
    EventBus.on('hud:whisper', (e) => this.onWhisper(e.text), this);
    EventBus.on('alien:reverted', (e) => {
      if (hasAlien(e.alienId)) this.haunting.onLeft(getAlien(e.alienId));
    }, this);
    EventBus.on('alien:misfire', () => {
      const bonus = Math.round(MISFIRE.improviseBonusMs / 1000);
      // The lift's forced misfire holds the fix swap back: don't offer it.
      if (this.omni.fixHeld) this.tutorial.tip('misfire-held', `STUCK WITH IT! THE WATCH WON'T SWAP YET... KO SOMETHING: +${bonus}S`, 7000, 9);
      else this.tutorial.tip('misfire', `WRONG ALIEN! {T} SWAPS BACK FOR HALF PRICE... OR KO SOMETHING: +${bonus}S`, 7000, 6);
    }, this);
    EventBus.on('system:pause', () => {
      if (this.state === 'play' && this.scene.isActive() && !this.cinematic) this.openPause();
    }, this);
    if (demo && demoSpec) this.startDemo(demoSpec);
    else {
      music.setLayer(null);
      music.setIntensity(0);
      music.play(this.levelTrack());
    }
    if (data.tryAlien && this.mode === 'training' && this.dialAliens.includes(data.tryAlien)) this.omni.forceInto(data.tryAlien);
    // The demo's menu owns the mute key (two bindings would toggle twice).
    if (!demo) {
      bindAudioUnlock(this);
      bindMuteKey(this);
    }
    if (this.training && !demo) this.showTrainingPrompt();

    this.events.on(Phaser.Scenes.Events.RESUME, this.onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume);
      EventBus.offContext(this);
      this.shutdown();
    });
    if (perf.bodies ?? launchParams().debug) this.physics.world.createDebugGraphic();
    if (launchParams().debug) {
      this.debugText = pixelText(this, 4, 40, '', { color: PALETTE.omnitrix, scrollFactor: 0, depth: 999 });
      frameStats(this.game);
      this.debugRefreshIn = 0;
    }
    if (DEV_TOOLS) (window as unknown as { __level: LevelScene }).__level = this;
  }

  // ------------------------------------------------------------ Setup helpers

  /** Aliens on the dial: the file's story progress (plus ?aliens= playtest extras), or Training's line-up. */
  private resolveAliens(extra: readonly string[]): string[] {
    const file = session.file;
    const completedIds = Object.entries(file?.chapters ?? {})
      .filter(([, record]) => record.completed)
      .map(([id]) => id);
    const completed = completedChapters(completedIds);
    if (this.mode === 'training') return trainingAliens(completed);
    const story = storyAliens(this.level.chapter, completed, extra);
    // Aliens a file unlocked some other way (a later chapter's story moment) come along too, in dial order.
    const owned = file?.unlockedAliens.filter((id) => hasAlien(id) && !story.includes(id)) ?? [];
    const dial = owned.length > 0 ? storyAliens(this.level.chapter, completed, [...extra, ...owned]) : story;
    // Aliens this chapter unlocks with a story moment stay off the dial until it happens (or a restart is past it).
    const have = [...extra, ...(file?.unlockedAliens ?? []), ...aliensUnlockedBy(Math.max(0, ...completed))];
    const pending = pendingUnlocks(this.level.story?.unlocks ?? [], have, this.resumeTileX());
    return dial.filter((id) => !pending.includes(id));
  }

  /** Tile x the run restarts from (a checkpoint or ?at=), or null for a fresh start. */
  private resumeTileX(): number | null {
    const id = this.checkpointId;
    if (!id) return null;
    if (id.startsWith('@')) return Number(id.slice(1));
    const cp = this.level.entities.find((e) => e.type === 'checkpoint' && e.id === id);
    return cp && cp.type === 'checkpoint' ? cp.x : null;
  }

  private levelTrack(): TrackName {
    if (this.mode === 'training') return 'simulation';
    return this.chapter.track?.(this.resumeTileX()) ?? 'forest';
  }

  /** Everything the chapter's set pieces (and its boss's level hooks) may touch. */
  private createKit(data: LevelStartData): StoryKit {
    const self = this;
    return {
      scene: this,
      level: this.level,
      world: this.world,
      player: this.player,
      fx: this.fx,
      lighting: this.lighting,
      time: this.time2,
      telegraph: this.telegraph,
      projectiles: this.projectiles,
      combat: this.combat,
      camera: this.camRig,
      speech: this.speech,
      dialogue: this.dialogue,
      tutorial: this.tutorial,
      omni: this.omni,
      droneWorld: this.droneWorld,
      backdrop: this.highway,
      now: () => this.gameNow,
      startCheckpoint: this.checkpointId,
      continuing: data.stats !== undefined,
      unlockAlien: (id) => this.unlockAlien(id),
      hasAlien: (id) => this.dialAliens.includes(id),
      spawnDrone: (kind, x, y, opts) => this.spawnStoryDrone(kind, x, y, opts),
      reachCheckpoint: (id) => this.reachCheckpoint(id),
      playMusic: (track) => music.play(track),
      setHud: (visible) => {
        self.storyHudHidden = !visible;
        EventBus.emit('hud:visible', { visible, omnitrix: visible ? this.omni.acquired : false });
      },
      setLetterbox: (visible) => {
        self.storyLetterbox = visible;
        EventBus.emit('hud:letterbox', { visible });
      },
      rescue: (x, feetY) => this.rescue(x, feetY),
      dropSmoothy: (x, y) => this.dropSmoothy(x, y),
      onPlayerHurt: (outcome) => this.onPlayerHurt(outcome),
      onEnemyKilled: () => this.creditKill(),
      threat: (key, at) => this.perfect.register(key, at, 0, 0, Infinity),
      cancelThreat: (key) => this.perfect.cancel(key),
      setDarkness: (zone) => (this.darkZone = zone),
      collapse: (rect) => this.world.clearCells(rect),
      seal: (rect) => this.world.fillCells(rect),
      machine: (id) => this.tech?.get(id),
      setTrains: (running) => this.tech?.setTrains(running),
      powerOff: (fromX, toX) => this.decor.powerOff(fromX, toX),
      nearestEnemy: (x, y, range) => this.nearestEnemy(x, y, range),
      hazards: this.hazards,
      setWater: (provider) => this.swimming.setProvider(provider),
      achievement: (id) => this.achievements.unlock(id),
      addTarget: (t, hazard) => {
        this.combat.addTarget(t);
        if (hazard) this.combat.addHazard(hazard);
      },
      whisper: (text) => EventBus.emit('hud:whisper', { text, color: PALETTE.ghostfreakEye }),
      setWorldHidden: (hidden) => {
        self.worldHidden = hidden;
        // Called from a set piece's destroy too: on shutdown Phaser has already taken the cameras down (BUGS.md T1).
        this.cameras?.main?.setVisible(!hidden);
      },
      payReward: (reward, x, y) => this.onSumoWon(reward, x, y),
      spawnIntroDrones: () => this.spawnIntroDrones(),
      gwen: null,
    };
  }

  /** Gwen comes along in a chapter that has her, or in a replay when Settings asks and she's learned a spell. */
  private createGwen(kit: StoryKit): GwenCompanion | null {
    const own = this.chapter.gwen;
    const known = learnedSpells(session.file);
    if (!own && !(getSettings().gwenInReplays && known.length > 0)) return null;
    this.gwenJoinsAtStart = !own;
    const slot = session.slot;
    return new GwenCompanion(kit, {
      known,
      chatter: own?.chatter,
      runSpeed: own?.runSpeed,
      onCast: () => this.achievements.count('spells'),
      onLearn: (id) => {
        if (slot !== null) saveSystem.markSeen(slot, spellSeenId(id));
      },
    });
  }

  private updateGwen(dt: number, realDt: number, controls: Controls): void {
    const g = this.gwen;
    if (!g) return;
    // In a replay she steps in beside Ben once the opening is over.
    if (this.gwenJoinsAtStart && !g.present && this.state === 'play' && !this.cinematic && this.player.grounded && !this.player.dead) {
      this.gwenJoinsAtStart = false;
      g.join(true);
    }
    g.canCast = this.state === 'play' && !this.cinematic && this.player.inputEnabled;
    g.update(dt, realDt, controls);
  }

  private nearestEnemy(x: number, y: number, range: number): { x: number; y: number } | null {
    let best: Drone | null = null;
    let bestD = range * range;
    for (const d of this.drones) {
      if (!d.alive || !d.awake) continue;
      const dx = d.x - x;
      const dy = d.y - y;
      const dist = dx * dx + dy * dy;
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    return best ? { x: best.x, y: best.y } : null;
  }

  /** A drone a set piece brings in (ambush waves, the convoy's escorts). */
  private spawnStoryDrone(kind: EnemyKind, x: number, y: number, opts: { roam?: boolean; delayMs?: number } = {}): Drone {
    const d = new Drone(this, this.droneWorld, x, y, createBrain(kind));
    d.awake = true;
    d.nextActionAt = this.gameNow + (opts.delayMs ?? 1200);
    if (opts.roam) d.homeX = -1;
    this.drones.push(d);
    this.registerDrone(d);
    return d;
  }

  /** A story unlock: the alien joins the dial for good. */
  private unlockAlien(id: string): void {
    if (!hasAlien(id) || this.dialAliens.includes(id)) return;
    const order = allAliens().map((a) => a.id);
    this.dialAliens = [...this.dialAliens, id].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    this.omni.unlock(id);
    const breaker = this.breakerFor(id);
    if (breaker) for (const w of this.walls) if (w.requires === id) w.setBreaker(breaker);
    if (this.mode === 'story' && session.slot !== null && launchParams().aliens.length === 0) saveSystem.unlockAliens(session.slot, [id]);
    this.reachableCards = availableCards(this.level, this.dialAliens).length;
    EventBus.emit('stats:update', this.statsPayload());
  }

  /** Lights a checkpoint from a set piece (the hidden one mid-chase). */
  private reachCheckpoint(id: string): void {
    const c = this.checkpoints.find((cp) => cp.id === id);
    if (!c || c.lit) return;
    this.lightCheckpoint(c);
  }

  /** Ben fell where he can't be (off the Rustbucket): a hit, and back at a safe spot. */
  private rescue(x: number, feetY: number): void {
    const p = this.player;
    if (p.dead) return;
    p.lastSafe.x = x;
    p.lastSafe.y = feetY;
    this.fx.burst('dust', p.x, p.y, 12);
    playSfx('hurt');
    const outcome = p.pitRespawn();
    this.onPlayerHurt(outcome);
  }

  private resolveStart(): { x: number; y: number } {
    if (this.checkpointId?.startsWith('@')) {
      const tx = Number(this.checkpointId.slice(1));
      const x = tx * TILE + TILE / 2;
      // Under a ceiling (a level carved out of solid), start from the first open row.
      let top = 0;
      while (top < this.world.heightPx && this.world.isSolid(x, top)) top += TILE;
      return { x, y: this.world.groundBelow(x, top) };
    }
    if (this.checkpointId) {
      const cp = checkpointsFor(this.level).find((c) => c.id === this.checkpointId) ?? this.level.entities.find((e) => e.type === 'checkpoint' && e.id === this.checkpointId);
      if (cp && cp.type === 'checkpoint') return checkpointSpawn(cp);
      this.checkpointId = null;
    }
    return { x: this.level.playerStart.x * TILE + TILE / 2, y: this.level.playerStart.y * TILE };
  }

  private createPlayer(start: { x: number; y: number }): void {
    this.player = new Player(this, start.x, start.y, {
      combat: this.combat,
      fx: createFxApi(this.fx, this.lighting, { comicFreeze: (...args) => this.comicFreeze(...args) }),
      world: {
        isSolid: (x, y) => this.world.isSolid(x, y),
        groundBelow: (x, y) => this.world.groundBelow(x, y),
        merge: (area, facing) => this.tech?.merge(area, facing) ?? null,
        growPlatform: (x, topY, width, lifeMs, warnMs) => this.crystals.grow(x, topY, width, lifeMs, warnMs),
        breakPlatform: (id) => this.crystals.shatter(id),
      },
      notify: (a) => this.onAbility(a),
      // Read live: changing difficulty in Settings applies to the very next hit.
      get damageMultiplier() {
        return activeDifficulty().damageTakenMultiplier;
      },
    });
    if (launchParams().god || launchParams().autobench) this.player.setInvulnerable(1e9);
    this.crystals = new CrystalPlatforms(this, this.fx, this.player, (x, y) => this.world.isSolid(x, y));
    // A crystal platform shatters, a live rail kills: neither is ground to respawn on.
    // Never inside solid ground either: a respawn there would fall straight back out of the level.
    this.player.isSafeSpot = (x, y) =>
      !this.world.isSolid(x, y - 4) &&
      !this.world.inWater(x, y + 12) && !this.world.inWater(x - 12, y + 12) && !this.world.inWater(x + 12, y + 12) && !this.world.overRail(x - 12) && !this.world.overRail(x + 12) && !this.crystals.under(x, y);
    this.player.respawnFeetY = (x, y, h) => this.world.standingFeetY(x, y, h);
    this.player.onPlatform = (p) => this.world.isOneWay(p.x - 4, p.y + 2) || this.world.isOneWay(p.x + 4, p.y + 2);
    this.player.isWaterSurface = (x, y) => this.world.onWaterSurface(x, y);
    this.combat.setPlayer(this.player);
    this.physics.add.collider(this.player.zone, this.world.layer, undefined, (_a, tile) => this.processTile(tile as Phaser.Tilemaps.Tile));
    // Water is a floor only for forms fast enough to run across it.
    this.physics.add.collider(this.player.zone, this.world.waterSurfaces, undefined, () => this.player.canRunOnWater());
  }

  private createOmnitrix(): void {
    this.misfireBeat = new MisfireBeat({ scene: this, player: this.player, fx: this.fx, time: this.time2, speech: this.speech, camera: this.camRig });
    this.sequence = new TransformSequence({ scene: this, player: this.player, fx: this.fx, combat: this.combat, time: this.time2, speech: this.speech, misfire: this.misfireBeat });
    // Training is a sandbox: misfires only when its menu turns them on.
    this.omni = new OmnitrixController(this.dialAliens, this.player, this.sequence, this.fx, this.perfect, this.mode === 'training' ? { wrongTransformChance: 0 } : {});
    this.omni.transformations = this.stats.transformations;
    this.omni.perfects = this.stats.perfectTransforms;
    this.omni.misfires = this.stats.misfires;
    this.omni.improvised = this.stats.improvised;
    this.omni.swaps = this.stats.swaps;
    this.omni.misfireAllowed = () => this.misfireAllowed();
    this.omni.onTransformed = (id) => this.onBecameAlien(id);
    this.omni.onSwapped = (id) => this.onBecameAlien(id);
    this.omni.onReverted = (reason) => {
      this.tutorial.clearFormTip();
      if (reason !== 'jammed') this.tutorial.tip('human', 'HUMAN AGAIN! {J} PUNCH   {K} DODGE ROLL', 6000, 6);
    };
    this.omni.onMisfire = (gotId, forced) => this.misfireLog.push({ gotId, forced, storyLock: this.story?.storyLock ?? false, x: Math.round(this.player.x / TILE) });
    this.omni.onDenied = (reason) => {
      if (reason === 'cooldown') this.tutorial.tip('cooldown', 'OMNITRIX RECHARGING... HANG IN THERE!', 3000, 7);
      if (reason === 'cramped') this.speech.show('NO ROOM TO CHANGE BACK IN HERE!', 1600);
    };
  }

  private spawnLevelEntities(resumeX: number): void {
    const spawned = spawnEntities(this, this.level, this.droneWorld, this.fx, {
      resumeX,
      collectedCards: this.stats.cardsFound,
      aliens: this.dialAliens,
      breakerFor: (id) => this.breakerFor(id),
      lockedFor: (id) => lockedSilhouette(id),
      respawningProps: this.mode === 'training',
    });
    this.drones = spawned.drones;
    this.barricades = spawned.barricades;
    this.checkpoints = spawned.checkpoints;
    this.pickups = spawned.pickups;
    this.jammer = spawned.jammer;
    this.walls = spawned.walls;
    this.boulders = spawned.boulders;
    this.dummies = spawned.dummies;
    for (const w of this.walls) {
      this.combat.addTarget(w);
      this.physics.add.collider(this.player.zone, w.body);
      w.onFirstTease = () => this.speech.show(this.dialAliens.includes('fourarms') ? 'FOUR ARMS COULD BUST THAT!' : "I'D NEED, LIKE, FOUR ARMS TO BUST THAT...", 2400);
      const opened = this.level.entities.find((e) => e.type === 'crackedWall' && e.id === w.id);
      if (this.mode === 'story') w.onBroken = () => this.onWallOpened(opened?.type === 'crackedWall' ? opened.opened : undefined);
    }
    for (const d of this.drones) this.registerDrone(d);
    for (const b of this.barricades) {
      this.combat.addTarget(b);
      this.physics.add.collider(this.player.zone, b.image);
      b.onDestroyed = () => this.tutorial.complete('barricade');
    }
    for (const b of this.boulders) {
      this.combat.addLiftable(b);
      this.physics.add.collider(this.player.zone, b.image);
    }
    for (const d of this.dummies) {
      this.combat.addTarget(d);
      this.combat.addLiftable(d);
    }
    this.terrain = new SpecialTerrain({
      scene: this,
      level: this.level,
      world: this.world,
      fx: this.fx,
      lighting: this.lighting,
      combat: this.combat,
      projectiles: this.projectiles,
      player: this.player,
      tilesKey: this.world.tilesKey,
      onSecretFound: (id) => this.onHiddenPath(id),
    });
    this.tech = this.createTech(resumeX);
    this.hazards = new HazardSystem({
      scene: this,
      level: this.level,
      world: this.world,
      fx: this.fx,
      lighting: this.lighting,
      telegraph: this.telegraph,
      projectiles: this.projectiles,
      combat: this.combat,
      player: this.player,
      resumeX,
      onPlayerHurt: (o) => this.onPlayerHurt(o),
      onGateOpened: () => this.onGateOpened(),
      onDud: () => this.tutorial.tip('dynamite', 'DYNAMITE! FIRE WOULD SET THAT OFF...', 3000, 6),
      threat: (key, at) => this.perfect.register(key, at, 0, 0, Infinity),
    });
    if (this.jammer) {
      const jammer = this.jammer;
      this.combat.addTarget(jammer);
      this.physics.add.collider(this.player.zone, jammer.gate);
      jammer.onDestroyed = () => this.onJammerDestroyed();
    }
  }

  private createTech(resumeX: number): TechSystem | null {
    const kinds = ['techDoor', 'turret', 'lift', 'cart', 'cabinet', 'sumo', 'trains'];
    const railed = this.level.water.some((w) => w.kind === 'rail');
    if (!railed && !this.level.entities.some((e) => kinds.includes(e.type))) return null;
    const combat = this.combat;
    return new TechSystem({
      scene: this,
      level: this.level,
      fx: this.fx,
      lighting: this.lighting,
      projectiles: this.projectiles,
      telegraph: this.telegraph,
      combat,
      playerBody: this.player,
      player: this.player,
      resumeX,
      now: () => this.gameNow,
      isSolid: (x, y) => this.world.isSolid(x, y),
      groundBelow: (x, y) => this.world.groundBelow(x, y),
      addSolid: (r) => this.world.addSolid(r),
      removeSolid: (r) => this.world.removeSolid(r),
      blast: (x, y, radius, hit) => combat.blast(x, y, radius, hit, false),
      ram: (area, hit, key) => combat.meleeOnce(area, hit, key),
      threat: (key, at) => this.perfect.register(key, at, 0, 0, Infinity),
      cancelThreat: (key) => this.perfect.cancel(key),
      onKill: () => this.creditKill(),
      playSumo: (done) => this.playSumo(done),
      onSumoWon: (reward, x, y) => this.onSumoWon(reward, x, y),
    });
  }

  /**
   * The SUMO SLAMMERS cabinet: the level freezes and the mini-game plays over
   * it; `done` reports whether KEV's score fell.
   */
  private playSumo(done: (won: boolean) => void): void {
    if (this.state !== 'play') {
      done(false);
      return;
    }
    audio.setLoopsMuted(true);
    this.scene.pause();
    this.scene.launch(SCENES.arcade, {
      onDone: (won: boolean) => {
        this.scene.resume();
        this.inputMap.reset();
        done(won);
        if (won) this.achievements.unlock('high-score');
        EventBus.emit('arcade:result', { won });
      },
    });
  }

  /** KEV's high score fell: the prize card pops out of the cabinet. */
  private onSumoWon(reward: string, x: number, y: number): void {
    const card = this.level.entities.find((e) => e.type === 'card' && e.reward === reward);
    if (!card || card.type !== 'card' || this.stats.cardsFound.includes(card.id)) return;
    const pickup = new Pickup(this, 'card', card.id, card.x, card.y);
    pickup.sprite.setPosition(x, y);
    this.pickups.push(pickup);
    this.tweens.add({ targets: pickup.sprite, y: pickup.baseY, duration: 800, ease: 'Bounce.easeOut' });
    this.fx.burst('pixel', x, y, 24);
    playSfx('tickets');
  }

  /** Upgrade's takeover ran its course: the robot blows up and takes everything near it along. */
  private onOverload(x: number, y: number): void {
    const H = COMBAT.hack;
    this.combat.blast(x, y, H.blastRadius, { damage: H.blastDamage, kind: 'tech', x, y: y + 6, knockback: H.blastKnockback, heavy: true, stunMs: H.blastStunMs }, true);
    this.fx.explosion(x, y, 'medium');
    this.fx.burst('circuit', x, y, 26);
    this.fx.ring(x, y, PALETTE.upgrade, H.blastRadius, 360);
    this.fx.hitStop(70);
    playSfx('hackBlast');
    this.achievements.count('takeovers');
  }

  private breakerFor(alienId: string): WallBreaker | null {
    if (!hasAlien(alienId)) return null;
    const alien = getAlien(alienId);
    return { name: alien.name, icon: alien.hudIcon, color: alien.theme.color };
  }

  private createArena(bossSpawn: BossSpawn, kit: StoryKit | null): BossArena {
    const kind = this.chapter.bosses?.[bossSpawn.kind ?? 'hunter'];
    if (!kind) throw new Error(`${this.level.id} has no boss '${bossSpawn.kind ?? 'hunter'}'`);
    return new BossArena(bossSpawn, kind, {
      scene: this,
      player: this.player,
      fx: this.fx,
      lighting: this.lighting,
      telegraph: this.telegraph,
      projectiles: this.projectiles,
      time: this.time2,
      combat: this.combat,
      camera: this.camRig,
      now: () => this.gameNow,
      spawnAdd: (kind, x, y) => this.spawnAdd(kind, x, y),
      aliveAdds: () => this.drones.filter((d) => d.alive && d.homeX < 0).length,
      dropPickup: (x, y) => this.dropSmoothy(x, y),
      setAlarm: (on) => (this.alarm = on),
      onStart: (left, right) => this.clearArenaStragglers(left, right),
      onDefeated: (x, y) => this.onBossDefeated(x, y),
      threat: (key, at) => this.perfect.register(key, at, 0, 0, Infinity),
      cancelThreat: (key) => this.perfect.cancel(key),
      say: (text, ms) => this.speech.show(text, ms),
      hologramSeen: () => this.stats.sawVilgax,
      onHologramSeen: () => (this.stats.sawVilgax = true),
      tip: (id, text, ms) => this.tutorial.tip(id, text, ms, 8),
      dialogue: (lines, onDone) => this.dialogue.play(lines, { skippable: true, onDone }),
      playerForm: () => this.player.form.id,
      drainAlienTime: (ms) => this.omni.drain(ms),
      addMachine: (m) => this.tech?.add(m),
      copies: (list, current) => EventBus.emit('boss:copies', { list, current }),
      achievement: (id) => this.achievements.unlock(id),
      hunt: kit ? this.chapter.arena?.(kit).hunt : undefined,
      startCheckpoint: this.checkpointId,
      reachCheckpoint: (id) => this.reachCheckpoint(id),
    });
  }


  private createTraining(): TrainingDirector {
    return new TrainingDirector({
      scene: this,
      fx: this.fx,
      omnitrix: this.omni.omnitrix,
      player: this.player,
      setAggressive: (on) => (this.droneWorld.aggressive = on),
      spawnDrone: (kind, x, y) => this.spawnTrainingDrone(kind, x, y),
      groundBelow: (x, y) => this.world.groundBelow(x, y),
      isSolid: (x, y) => this.world.isSolid(x, y),
      worldWidth: this.world.widthPx,
    });
  }

  private registerDrone(d: Drone): void {
    this.combat.addTarget(d);
    this.combat.addHazard(d);
    this.combat.addLiftable(d);
  }

  private spawnIntroDrones(): void {
    for (const s of this.level.introSpawns) {
      const d = new Drone(this, this.droneWorld, s.x * TILE, s.y * TILE, createBrain(s.kind));
      d.awake = true;
      d.nextActionAt = this.gameNow + 2200;
      d.x = this.cameras.main.worldView.right + 30;
      this.drones.push(d);
      this.registerDrone(d);
    }
  }

  private spawnAdd(kind: EnemyKind, x: number, y: number): void {
    const d = new Drone(this, this.droneWorld, x, y, createBrain(kind));
    d.awake = true;
    d.homeX = -1;
    d.nextActionAt = this.gameNow + 1200;
    d.ky = 120;
    this.drones.push(d);
    this.registerDrone(d);
  }

  private spawnTrainingDrone(kind: EnemyKind, x: number, y: number): Drone {
    const d = new Drone(this, this.droneWorld, x, y, createBrain(kind));
    d.awake = true;
    d.nextActionAt = this.gameNow + 1200;
    this.drones.push(d);
    this.registerDrone(d);
    return d;
  }

  private giveOmnitrix(silent = false): void {
    this.player.giveWatch();
    this.omni.acquired = true;
    if (!silent) EventBus.emit('hud:visible', { visible: true, omnitrix: true });
  }

  private processTile(tile: Phaser.Tilemaps.Tile): boolean {
    if (!tile.collideLeft && !tile.collideRight && tile.collideUp) {
      if (this.gameNow < this.player.dropThroughUntil) return false;
      return this.player.body.velocity.y >= 0;
    }
    return true;
  }

  private misfireAllowed(): boolean {
    return misfireAllowed({
      training: this.mode === 'training',
      transformations: this.omni.transformations,
      introPlaying: (this.intro !== null && !this.intro.done) || (this.story?.introPlaying ?? false),
      storyMoment: this.story?.storyLock ?? false,
      bossIntro: this.arena?.introducing ?? false,
    });
  }

  /** The intro cutscene or the Vilgax hologram is playing. */
  private get cinematic(): boolean {
    return (this.intro?.cinematic ?? false) || (this.arena?.cinematic ?? false) || (this.story?.cinematic ?? false);
  }

  // ------------------------------------------------------------ Frame

  override update(time: number, delta: number): void {
    if (perf.governor && quality.sample(delta)) this.onQualityChanged();
    const realDt = Math.min(delta, PHYSICS.maxFrameMs);
    setFrameLength(realDt);
    const controls = this.demo ? this.demo.read(realDt) : this.inputMap.read();

    // During cinematics the pause button skips instead.
    if (controls.pause && this.state === 'play' && !this.cinematic) {
      this.openPause();
      return;
    }

    const dt = this.time2.step(realDt);
    const visual = this.time2.frozen ? 0 : this.time2.visualScale;
    // During the misfire freeze-frame the smoke keeps clearing while the world stands still.
    const fxScale = this.misfireBeat.active ? 1 : visual;
    this.fx.setTimeScale(fxScale);
    this.tweens.timeScale = Math.max(0.05, this.misfireBeat.active ? 1 : this.time2.visualScale);
    this.anims.globalTimeScale = Math.max(0.001, visual);
    this.gameNow += dt;
    this.player.now = this.gameNow;
    this.telegraph.begin();

    this.intro?.update(realDt, controls);
    this.dialogue.update(realDt, controls);
    this.story?.update(dt, realDt, controls);
    if (this.state === 'play') {
      this.omni.handleInput(controls, this.gameNow);
      this.player.update(dt, controls);
    }
    if (dt > 0) this.stepPhysics(time, dt);
    this.player.syncVisual(realDt * visual, this.gameNow);
    this.swimming.update();

    // The Vilgax hologram holds the world (and the alien timer) still while he talks.
    const worldDt = this.arena?.cinematic ? 0 : dt;
    this.omni.jammed = this.jammer?.inField(this.player.x) ?? false;
    if (this.omni.jammed && this.player.isAlien && !this.player.dead) this.omni.forceRevert('jammed');
    if (worldDt > 0) this.omni.update(worldDt);

    for (const d of this.drones) d.update(worldDt);
    this.arena?.update(dt, realDt, controls);
    this.updateGwen(dt, realDt, controls);
    this.projectiles.update(worldDt, (x, y) => this.world.isSolid(x, y), this.cameras.main.worldView, (x, y) => this.world.groundBelow(x, y));
    if (this.state === 'play') this.combat.update(worldDt);

    this.updateProps(dt);
    this.weakPoints.update(realDt);
    if (this.state === 'play') this.updateZones();

    const dropped = this.combo.update(dt);
    if (dropped >= COMBO.showAt) EventBus.emit('combo:drop', { count: dropped });

    if (this.state === 'play' && !this.cinematic) this.stats.timeMs += realDt;
    this.playMsUnsaved += realDt;
    this.achievements.count('transforms', this.omni.transformations - this.stats.transformations);
    this.achievements.count('perfects', this.omni.perfects - this.stats.perfectTransforms);
    this.achievements.count('improvised', this.omni.improvised - this.stats.improvised);
    this.stats.transformations = this.omni.transformations;
    this.stats.perfectTransforms = this.omni.perfects;
    this.stats.misfires = this.omni.misfires;
    this.stats.improvised = this.omni.improvised;
    this.stats.swaps = this.omni.swaps;
    this.perfect.prune(this.gameNow);
    if (this.bossDamageAtStart === null && this.arena?.fighting) this.bossDamageAtStart = this.stats.damageTaken;
    if (this.recorder && this.state === 'play') this.recorder.sample(this.stats.timeMs, this.ghostSample());
    this.ghostRunner?.update(this.stats.timeMs);
    this.statsTimer -= realDt;
    if (this.statsTimer <= 0) {
      this.statsTimer = 100;
      EventBus.emit('stats:update', this.statsPayload());
      this.emitFormHealth(0);
    }

    this.misfireBeat.update(realDt);
    this.haunting.update(this.player.form, this.gameNow, this.state === 'play' && !this.cinematic && !this.player.dead);
    this.camRig.update(this.player.x, this.player.y, this.player.facing, this.player.grounded, realDt * Math.max(0.3, visual));
    if (this.backdropOn && !this.worldHidden) this.backdrop.update(this.cameras.main, realDt);
    if (!this.worldHidden) this.decor.update(this.cameras.main, this.lighting, this.gameNow);
    this.world.update(realDt);
    this.speech.update(this.player.x, this.player.y - this.player.headHeight, realDt);
    if (!this.intro?.cinematic) {
      const ready = this.omni.acquired && this.omni.omnitrix.state === 'ready' && !this.omni.jammed;
      this.tutorial.update(realDt, this.player.x, this.player.isAlien, ready, this.player.form.id);
    }
    this.updateLighting(realDt);
    this.debug(realDt);
  }

  private updateLighting(realDt: number): void {
    const p = this.player;
    if (!p.dead) {
      const light = p.isAlien ? 0 : p.hasWatch ? PLAYER.lightRadiusWithWatch : PLAYER.lightRadiusNoWatch;
      if (light > 0) p.hasWatch ? this.lighting.add(p.x, p.centerY, light, 0xb8ffc8, 0.85) : this.lighting.add(p.x, p.centerY, light, 0xc8d0ff, 0.6);
    }
    const zone = this.world.ambientAt(p.x, p.y - 8);
    let ambient = this.alarm ? this.alarmAmbient() : AMBIENT[zone];
    if (this.darkZone && p.x >= this.darkZone.fromX && p.x < this.darkZone.toX) ambient = LIGHTING.ambientBlackout;
    // A form that doesn't see like Ben (Wildmutt): the world dims and his own senses light it.
    const vision = p.dead ? undefined : p.form.feel.vision;
    if (vision) {
      ambient = lerpColor(0x000000, ambient, vision.ambientScale);
      this.lighting.add(p.x, p.centerY, vision.light.radius, vision.light.color, vision.light.intensity);
    }
    this.lighting.setAmbient(ambient, this.alarm ? 250 : LIGHTING.ambientBlendMs);
    this.lighting.update(realDt);
    if (this.worldHidden) this.lighting.skip();
    else this.lighting.render(this.cameras.main);
  }

  /** Boss phase 2 alarm lights: a hard red strobe, or a slow gentle pulse with Reduce Flashing on. */
  private alarmAmbient(): number {
    if (!a11y.reduceFlashing) return blinkOn(this.gameNow, 500) ? LIGHTING.ambientCrash : LIGHTING.ambientAlarm;
    const wave = (Math.sin((this.gameNow / ACCESSIBILITY.reducedAlarmPeriodMs) * Math.PI * 2) + 1) / 2;
    return lerpColor(LIGHTING.ambientCrash, LIGHTING.ambientAlarm, wave * ACCESSIBILITY.reducedAlarmMix);
  }

  private updateProps(dt: number): void {
    this.crystals.update(this.gameNow);
    this.hazards?.update(dt);
    for (const b of this.barricades) b.update(dt);
    this.terrain?.update(dt);
    this.tech?.update(dt, this.player.form.reach.canMerge === true && !this.player.dead, inputMode.format('{K}'));
    for (const c of this.checkpoints) c.update(this.lighting, this.gameNow);
    for (const p of this.pickups) p.update(this.fx, this.lighting, this.gameNow);
    this.jammer?.update(dt, this.lighting, this.gameNow);
    for (const w of this.walls) w.update(dt, this.lighting, this.gameNow);
    // Thrown boulders and dummies reform in Training; put them back on the liftable list.
    for (const b of this.boulders) if (b.update(dt)) this.combat.addLiftable(b);
    for (const d of this.dummies) if (d.update(dt, this.gameNow)) this.combat.addLiftable(d);
  }

  private updateZones(): void {
    const p = this.player;
    if (p.dead) return;

    for (const c of this.checkpoints) {
      if (!c.lit && !c.hidden && c.contains(p.x, p.y)) this.lightCheckpoint(c);
    }

    for (const pk of this.pickups) {
      if (!pk.touches(p.x, p.y)) continue;
      pk.collect(this.fx);
      if (pk.kind === 'smoothy') {
        this.achievements.count('smoothies');
        const healed = p.heal(activeDifficulty().smoothyHeal);
        playSfx('heal');
        this.floatText(pk.x, pk.baseY - 10, healed > 0 ? `+${healed} HP` : 'BRAIN FREEZE!', 0xff8fc8);
        if (p.isAlien) p.formHp = Math.min(p.form.maxFormHealth, p.formHp + 2);
        this.emitHealth(healed);
        // A file's first drink of each kind: what it is and what it does.
        const slot = session.slot;
        if (this.canReveal() && slot !== null && saveSystem.markSeen(slot, `drink-${pk.look}`)) {
          this.openReveal(() => EventBus.emit('drink:reveal', { look: pk.look, heal: activeDifficulty().smoothyHeal }));
        }
      } else {
        this.stats.cardsFound.push(pk.id);
        const album = this.fileCardCount();
        this.achievements.reach('cards', album);
        playSfx('card');
        EventBus.emit('card:collected', { id: pk.id, found: this.stats.cardsFound.length, total: this.stats.totalCards });
        // The game stops for a new card: it flips over, big, with its stats (a banner instead mid-cinematic).
        if (this.canReveal()) {
          this.openReveal(() => EventBus.emit('card:reveal', { id: pk.id, found: this.stats.cardsFound.length, total: this.stats.totalCards, album, albumTotal: CARDS.length }));
        } else {
          this.time2.slowMo(0.4, 350, 250);
          EventBus.emit('hud:banner', {
            title: 'SUMO SLAMMERS CARD!',
            subtitle: `${this.stats.cardsFound.length} / ${this.stats.totalCards} FOUND`,
            color: PALETTE.gold,
            durationMs: 1800,
            style: 'slam',
          });
        }
      }
    }

    // No need to hint at who can break it when Ben already is that alien.
    if (!p.form.reach.canSmash) for (const w of this.walls) if (w.touching(p.x, p.y)) w.tease();

    // Feet inside the ground (seen once in THE HUNTERS' shaft, cause not pinned down): inside a floor there
    // are no tile faces, so he would fall out of the level. Back up onto the surface instead.
    if (this.world.inGround(p.x, p.y - 4)) this.unbury(p);

    if ((this.world.inWater(p.x, p.y) && !this.swimming.swimsAt(p.x, p.y)) || p.y > this.world.heightPx + 40) {
      this.fx.burst('splash', p.x, Math.min(p.y, this.world.heightPx), 18);
      playSfx('splash');
      const outcome = p.pitRespawn();
      this.onPlayerHurt(outcome);
      if (!outcome.died) this.camRig.snap(p.x, p.y);
    }

    if (this.level.id !== 'ch1') return;
    if (!this.tutorial.isDone('rocket') && p.y <= 17 * TILE + 2 && p.x > 102 * TILE && p.x < 126 * TILE) this.tutorial.complete('rocket');
    if (p.x > 20 * TILE) this.tutorial.complete('move');
    if (!p.isAlien && this.omni.acquired && this.jammer?.inField(p.x)) {
      const laserNear = this.drones.some((d) => d.alive && d.awake && d.state === 'telegraph' && Math.abs(d.x - p.x) < 260);
      if (laserNear) this.tutorial.tip('parry', 'TIP: PUNCH {J} A LASER TO KNOCK IT BACK!', 5000, 6);
    }
    // Teach perfect transforms in the moment: a drone is about to fire, the watch is ready, and Ben has transformed before.
    if (!p.isAlien && this.omni.perfects === 0 && this.omni.transformations >= PERFECT_TRANSFORM.tipAfterTransforms && this.omni.omnitrix.state === 'ready' && !this.omni.jammed) {
      const aiming = this.drones.some((d) => d.alive && d.awake && (d.state === 'telegraph' || d.state === 'lock') && Math.abs(d.x - p.x) < 220);
      if (aiming) this.tutorial.tip('perfect', 'PRO TIP: {T} RIGHT AS IT FIRES = PERFECT TRANSFORM!', 3500, 6);
    }
    if (!p.isAlien && this.drones.some((d) => d.alive && d.state === 'stuck' && Math.abs(d.x - p.x) < 120)) {
      this.tutorial.tip('striker', "IT'S STUCK! PUNCH IT!", 2500, 7);
    }
  }

  private lightCheckpoint(c: Checkpoint): void {
    c.light();
    this.checkpointId = c.id;
    playSfx('checkpoint');
    if (!c.hidden) {
      this.fx.burst('green', c.x, c.y - 24, 16);
      this.fx.ring(c.x, c.y - 24, PALETTE.omnitrix, 30, 400);
    }
    EventBus.emit('hud:banner', { title: 'CHECKPOINT', color: PALETTE.omnitrix, durationMs: 1100, style: 'soft' });
    this.split(c.id, c.label);
    this.saveResume();
  }

  // ------------------------------------------------------------ Events

  private onAbility(action: AbilityAction): void {
    this.tutorial.onAction(action);
    // Diamondhead drinks crystal shards in: alien time and a sliver of shield back.
    if (action === 'absorb' && this.player.isAlien) {
      this.omni.omnitrix.extend(DIAMONDHEAD.absorb.timeMs);
      this.player.formHp = Math.min(this.player.form.maxFormHealth, this.player.formHp + DIAMONDHEAD.absorb.shield);
      this.emitFormHealth(DIAMONDHEAD.absorb.shield);
    }
    if (action === 'pounceHit') this.achievements.count('pounceHits');
    if (action === 'swapStrike' && this.player.isAlien) EventBus.emit('alien:swapStrike', { alienId: this.player.form.id, hits: 1 });
  }

  /** Transformed or swapped into an alien: its controls tip the first time this run. */
  private onBecameAlien(alienId: string): void {
    const tip = getAlien(alienId).tips.intro;
    if (tip) this.tutorial.formTip(tip);
  }

  private onTargetHit(target: Damageable, result: HitResult, hit: Hit): void {
    this.training?.onHit(target, result, hit);
    if (!target.countsAsEnemy || (result !== 'hit' && result !== 'killed')) {
      const barricade = (this.barricades as Damageable[]).includes(target);
      if (result === 'blocked' && barricade && hit.kind !== 'fire') {
        this.tutorial.tip('punchBarricade', 'TOO TOUGH TO PUNCH... NEED FIRE!', 2500, 6);
      }
      return;
    }
    this.bumpCombo(1);
  }

  /**
   * XLR8 cut four or more enemies in one dash: the world freezes into a comic
   * panel (the HUD draws it) with a slash across every target, then they all burst.
   */
  private comicFreeze(count: number, x: number, y: number, dir: 1 | -1, color: number, targets: ReadonlyArray<{ x: number; y: number }>, ms: number): void {
    const cam = this.cameras.main;
    const view = cam.worldView;
    this.fx.hitStop(ms);
    playSfx('comicCut');
    const slashes = this.add.graphics().setDepth(DEPTH.fxTop).setBlendMode(Phaser.BlendModes.ADD);
    for (const t of targets) {
      slashes.lineStyle(3, PALETTE.white, 1).lineBetween(t.x - dir * 14, t.y - 10, t.x + dir * 14, t.y + 10);
      slashes.lineStyle(1, color, 1).lineBetween(t.x - dir * 18, t.y - 12, t.x + dir * 18, t.y + 12);
    }
    this.tweens.add({ targets: slashes, alpha: 0, delay: ms, duration: 200, onComplete: () => slashes.destroy() });
    this.stats.multiCuts++;
    EventBus.emit('hud:comicPanel', { count, x: (x - view.x) * cam.zoom, y: (y - view.y) * cam.zoom, dir, color, ms });
  }

  /** Bowling: a thrown enemy that takes two or more others down with it is a STRIKE! */
  private onThrowLanded(hits: number, x: number, y: number): void {
    if (hits >= STRIKE_ACHIEVEMENT_HITS) this.achievements.unlock('strike');
    if (hits < COMBAT.strikeHits) return;
    this.stats.strikes++;
    this.time2.slowMo(0.22, 560, 320);
    this.fx.hitStop(60);
    this.fx.ring(x, y, PALETTE.gold, 70, 500);
    this.fx.burst('gold', x, y, 30);
    playSfx('strike');
    EventBus.emit('hud:strike', { hits });
  }

  /** A hit on a weak point Grey Matter found: it lands for triple, and says so. */
  private onWeakHit(target: Damageable, _hit: Hit): void {
    const box = this.weakBox;
    if (target.hurtbox(box)) this.fx.popText(box.x + box.w / 2, box.y - 4, `x${COMBAT.weakPoint.multiplier}!`, PALETTE.greymatter, 1);
    playSfx(weakHit, 0.8, 0.9 + Math.random() * 0.2);
    this.fx.hitStop(40);
    this.achievements.count('weakHits');
    this.tutorial.onAction('weakHit');
  }

  /** Fire met one of Stinkfly's stink clouds: it goes up in a fireball. */
  private onGasIgnite(x: number, y: number, radius: number, hits: number): void {
    this.fx.explosion(x, y, hits >= 2 ? 'big' : 'medium');
    this.fx.ring(x, y, PALETTE.fire1, radius, 420, 0.8);
    this.fx.hitStop(hits > 0 ? 70 : 30);
    this.fx.popText(x, y - radius * 0.5, hits >= 2 ? 'KA-BOOM!' : 'FOOMP!', PALETTE.fire2, hits >= 2 ? 1.4 : 1);
    playSfx('explode', 0.9, 0.8);
  }

  private bumpCombo(n: number): void {
    let count = 0;
    let tagged = false;
    for (let i = 0; i < n; i++) {
      count = this.combo.hit(this.player.form.id);
      tagged ||= this.combo.newContributor && this.combo.contributors.length >= 2;
    }
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo.best);
    if (count >= COMBO.showAt || this.combo.contributors.length >= 2) {
      EventBus.emit('combo:update', { count, best: this.combo.best, forms: this.combo.contributors });
      if (count % 5 === 0) playSfx('combo', 1, 1 + Math.min(1, count / 40));
    }
    if (tagged) this.onTagTeam();
  }

  /** A different form joined the live combo: refund some alien time and celebrate. */
  private onTagTeam(): void {
    this.stats.bestTagTeam = Math.max(this.stats.bestTagTeam, this.combo.contributors.length);
    if (this.combo.contributors.length >= FULL_OMNITRIX_FORMS) this.achievements.unlock('full-omnitrix');
    const refund = this.player.isAlien ? COMBO.tagRefundMs : 0;
    if (refund > 0) this.omni.omnitrix.extend(refund);
    playSfx('tag', 1, 1 + this.combo.contributors.length * 0.08);
    EventBus.emit('combo:tag', { forms: this.combo.contributors, refundMs: refund });
  }

  private onDroneKilled(d: Drone): void {
    this.perfect.cancel(d);
    if (this.arena?.started && d.homeX >= 0 && !this.arena.fighting) return;
    if (d.lastHitKind && isFlame(d.lastHitKind)) this.achievements.count('fireKOs');
    // A form that drains out of water (Ripjaws) scoring on dry land: FISH OUT OF WATER.
    if (this.player.isAlien && this.player.form.landDrain !== undefined && !this.player.submerged) this.achievements.count('dryKOs');
    this.creditKill();
  }

  /** A kill counts: stats, the improvise bonus after a misfire, the alien's advanced tip. */
  private creditKill(): void {
    this.stats.enemiesDefeated++;
    if (!this.player.isAlien) return;
    this.omni.improvise();
    const form = this.player.form;
    const kills = (this.alienKills.get(form.id) ?? 0) + 1;
    this.alienKills.set(form.id, kills);
    const tip = form.tips.advanced;
    if (tip && kills >= tip.afterKills) this.tutorial.formTip(tip);
  }

  private onPlayerHurt(outcome: DamageOutcome): void {
    if (!outcome.applied) return;
    this.stats.damageTaken += outcome.amount;
    const lost = this.combo.break();
    if (lost >= COMBO.showAt) EventBus.emit('combo:drop', { count: lost });
    this.emitHealth(-outcome.amount);
    this.emitFormHealth(-outcome.amount);
    if (outcome.formBroken) {
      this.omni.forceRevert('damage');
      this.speech.show('OUCH! MY WATCH!', 1400);
    }
    if (outcome.died) this.onDeath();
  }

  private onJammerDestroyed(): void {
    this.tutorial.complete('jammer');
    this.omni.jammed = false;
    EventBus.emit('hud:banner', { title: 'JAMMER DOWN!', subtitle: 'OMNITRIX ONLINE', color: PALETTE.jammer, durationMs: 1800, style: 'slam' });
    this.time2.slowMo(0.3, 500, 300);
    this.speech.show('WHO NEEDS ALIENS? ...OK, I DO.', 2000);
  }

  /** A cracked wall gives: a beat of slow motion so the reveal lands. A secret vault unless the level says otherwise. */
  private onWallOpened(opened?: { title: string; subtitle: string; line: string }): void {
    this.time2.slowMo(0.3, 600, 300);
    this.fx.shake(FX.shakeHeavy, 360);
    if (opened) {
      EventBus.emit('hud:banner', { title: opened.title, subtitle: opened.subtitle, color: PALETTE.gold, durationMs: 1400, style: 'slam' });
      this.speech.show(opened.line, 2000);
      return;
    }
    EventBus.emit('hud:banner', { title: 'SECRET VAULT!', subtitle: 'SMASHED OPEN', color: PALETTE.gold, durationMs: 1600, style: 'slam' });
    // An earlier chapter has a secret this file can open now: point Ben back to it.
    const back = this.earlierSecret();
    this.speech.show(back ? `WAIT... THERE WAS ONE OF THESE BACK IN ${back}!` : "NOW THAT'S WHAT I CALL A SECRET!", 2600);
  }

  /** A bounced laser lit a receiver and its crystal gate shattered. */
  private onGateOpened(): void {
    this.time2.slowMo(0.35, 500, 250);
    EventBus.emit('hud:banner', { title: 'GATE OPEN!', subtitle: 'LASER REFLECTED', color: PALETTE.diamondhead, durationMs: 1500, style: 'slam' });
    if (this.player.form.id === 'diamondhead') this.speech.show('ROCK SOLID. LITERALLY.', 1800);
  }

  /** Wildmutt's senses opened a hidden passage. */
  private onHiddenPath(_id: string): void {
    this.achievements.count('hiddenPaths');
    this.time2.slowMo(0.35, 500, 250);
    EventBus.emit('hud:banner', { title: 'HIDDEN PATH!', subtitle: 'SNIFFED OUT', color: 0xffb070, durationMs: 1500, style: 'slam' });
    if (this.player.form.id === 'wildmutt') this.speech.show('*SNIFF SNIFF* (SOMETHING BACK HERE...)', 2000);
  }

  /** The title of an earlier chapter with a secret this file's aliens can open and hasn't found yet. */
  private earlierSecret(): string | null {
    const file = session.file;
    if (!file) return null;
    for (const info of CHAPTERS) {
      if (info.number >= this.level.chapter || !info.levelId) continue;
      const found = file.chapters[info.levelId]?.cards ?? [];
      if (waitingSecrets(levelMeta(info.levelId), this.dialAliens, found).length > 0) return info.title;
    }
    return null;
  }

  /** Lifts Ben out of solid ground onto the surface above his feet (a few tiles at most: deeper, it's a wall). */
  private unbury(p: Player): void {
    let feetY = Math.floor((p.y - 4) / TILE) * TILE;
    for (let i = 0; i < 3 && this.world.inGround(p.x, feetY - 1); i++) feetY -= TILE;
    if (!this.world.inGround(p.x, feetY - 1)) p.teleport(p.x, feetY);
  }

  private dropSmoothy(x: number, y: number): void {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(this.world.groundBelow(x, y) / TILE);
    const pickup = new Pickup(this, 'smoothy', `boss-smoothy-${this.gameNow}`, tx, ty);
    pickup.sprite.setY(y);
    this.pickups.push(pickup);
    this.tweens.add({ targets: pickup.sprite, y: pickup.baseY, duration: 700, ease: 'Bounce.easeOut' });
  }

  private onDeath(): void {
    if (this.state !== 'play') return;
    this.state = 'dead';
    this.stats.deaths++;
    this.misfireBeat.cancel();
    if (!this.training) this.saveResume();
    this.time2.slowMo(0.3, 900, 300);
    this.desaturate = perf.fx ? (this.cameras.main.filters?.internal.addColorMatrix() ?? null) : null;
    this.desaturate?.colorMatrix.desaturate();
    playSfx('revert');
    music.setIntensity(0);
    EventBus.emit('player:died');
    if (this.training) {
      // Training never ends: Ben blinks back to the start of the arena.
      this.time.delayedCall(1100, () => this.respawnInTraining());
      return;
    }
    this.time.delayedCall(1500, () => {
      this.scene.pause();
      this.scene.launch(SCENES.gameOver, { levelId: this.level.id, checkpoint: this.checkpointId, stats: cloneRunStats(this.stats), aliens: [...this.dialAliens] });
    });
  }

  private respawnInTraining(): void {
    if (this.desaturate) this.cameras.main.filters?.internal.remove(this.desaturate);
    this.desaturate = null;
    const x = this.level.playerStart.x * TILE + TILE / 2;
    const y = this.level.playerStart.y * TILE;
    this.omni.reset();
    this.player.revive(x, y);
    music.setLayer(null);
    this.camRig.snap(x, y);
    this.state = 'play';
    this.fx.ring(x, y - 12, PALETTE.omnitrix, 30, 400);
    this.fx.burst('green', x, y - 12, 20);
    playSfx('holoOn', 0.6);
    EventBus.emit('hud:reset');
    this.syncHud();
    this.showTrainingPrompt();
  }

  private showTrainingPrompt(): void {
    EventBus.emit('hud:prompt', { id: 'training', text: TRAINING.prompt, priority: 1 });
  }

  /** The boss's arrival shockwave wipes out stragglers that wandered into the arena. */
  private clearArenaStragglers(left: number, right: number): void {
    for (const d of this.drones) {
      if (d.alive && d.homeX >= 0 && d.x > left - 40 && d.x < right + 40) d.kill();
    }
  }

  /** Speedrun split vs the fastest time ever reached here on this difficulty. Practice runs show nothing. */
  private split(id: string, label: string): void {
    if (!this.stats.fullRun || this.stats.mixedDifficulty || session.slot === null) return;
    if (this.stats.splits.some((sp) => sp.id === id)) return;
    const slot = session.slot;
    const timeMs = this.stats.timeMs;
    const previous = saveSystem.recordSplit(slot, this.level.id, this.stats.difficulty, id, timeMs);
    const segmentMs = timeMs - (this.stats.splits[this.stats.splits.length - 1]?.timeMs ?? 0);
    const bestSegmentMs = saveSystem.recordSegment(slot, this.level.id, this.stats.difficulty, id, segmentMs);
    this.stats.splits.push({ id, label, timeMs, bestMs: previous, segmentMs, bestSegmentMs });
    EventBus.emit('hud:split', compareSplit(id, label, timeMs, previous));
  }

  /** Continue picks the chapter back up at the last checkpoint, with the run so far. */
  private saveResume(): void {
    this.flushPlayTime();
    this.achievements.flush();
    if (this.mode !== 'story' || session.slot === null || this.checkpointId === null || this.checkpointId.startsWith('@')) return;
    if (launchParams().aliens.length > 0) return;
    saveSystem.setResume(session.slot, { levelId: this.level.id, checkpoint: this.checkpointId, stats: cloneRunStats(this.stats) });
  }

  /**
   * A timed run from the start records itself (a checkpoint restart carries on
   * the same recording); the file's best run on this difficulty races it.
   */
  private setupGhost(data: LevelStartData): void {
    this.recorder = null;
    this.ghostRunner = null;
    const slot = session.slot;
    if (this.mode !== 'story' || !this.stats.fullRun || this.stats.mixedDifficulty || slot === null) {
      ghostRecording.start(null);
      return;
    }
    const current = ghostRecording.current;
    if (!data.stats) ghostRecording.start(new GhostRecorder(this.level.id, this.stats.difficulty));
    else if (current && current.levelId === this.level.id && current.difficulty === this.stats.difficulty) current.truncate(this.stats.timeMs);
    // Picked up from a save: this run can't become a ghost (its start wasn't recorded).
    else ghostRecording.start(null);
    this.recorder = ghostRecording.current;
    const best = getSettings().ghost ? ghostStore.load(slot, this.level.id, this.stats.difficulty) : null;
    if (best) this.ghostRunner = new GhostRunner(this, best);
  }

  private ghostSample(): { x: number; y: number; form: number; frame: number; flip: boolean } {
    const s = this.player.visual.sprite;
    const frame = Number(s.frame.name);
    // Ben hidden in a cutscene (inside the RV): the ghost hides there too.
    const shown = s.visible && s.alpha > 0;
    return { x: s.x, y: s.y, form: Math.max(0, ghostForms().indexOf(this.player.form.id)), frame: !shown ? GHOST_HIDDEN_FRAME : Number.isFinite(frame) ? frame : 0, flip: s.flipX };
  }

  /** A misfire line this file hasn't heard yet goes in the JOKES FOUND log. */
  private onJoke(gotId: string, line: string): void {
    const slot = session.slot;
    if (slot === null || !saveSystem.addJoke(slot, jokeId(gotId, line))) return;
    // Jokes count anywhere, Training's CHAOS misfires included (the rest of Training doesn't).
    const tracker = this.mode === 'story' ? this.achievements : new AchievementTracker(fileAchievements(slot), (def) => EventBus.emit('achievement:unlocked', { id: def.id }));
    tracker.reach('jokes', session.file?.jokes.length ?? 0);
  }

  /** A whisper from the thing in the watch goes in Ghostfreak's diary (EXTRAS) the first time this file hears it. */
  private onWhisper(text: string): void {
    const slot = session.slot;
    const entry = diaryEntryFor(text);
    if (slot === null || !entry || launchParams().autobench) return;
    saveSystem.addDiary(slot, entry.id);
  }

  /** Cards this file has, counting the ones picked up this run. */
  // ------------------------------------------------------------ ALIEN FILES' demo

  /** The bot takes over: Ben can't be hurt, the watch never runs out, the enemies hold off unless the move needs them. */
  private startDemo(spec: MoveDemo): void {
    this.player.setInvulnerable(1e9);
    const o = this.omni.omnitrix;
    o.setTimerFrozen(true);
    o.setConfig({ ...o.settings, cooldownMs: 0, wrongTransformChance: 0 });
    this.droneWorld.aggressive = spec.enemy !== undefined;
    this.demo = new AlienDemoPilot(spec, (d) => this.restartDemo(d));
    this.restartDemo(spec);
  }

  /** Every loop of a demo starts the same: Ben at the start as the alien (or the one he swaps from), the move's enemy in front. */
  private restartDemo(spec: MoveDemo): void {
    for (const d of this.demoEnemies) if (d.alive) d.vanish();
    this.demoEnemies.length = 0;
    const x = spec.x * TILE + TILE / 2;
    const ground = this.world.groundBelow(x, 0);
    this.benchTeleport(x, ground);
    this.player.setVelocity(0, 0);
    const first = spec.swapFrom ?? this.demoAlien;
    if (this.player.form.id !== first) this.omni.forceInto(first);
    if (spec.swapFrom) this.omni.omnitrix.select(this.demoAlien);
    else if (spec.dial) this.omni.omnitrix.select(spec.dial);
    this.omni.recharge();
    if (this.player.isAlien) this.player.formHp = this.player.form.maxFormHealth;
    if (spec.enemy) {
      const ex = x + spec.enemy.dx * TILE;
      const k = spec.enemy.kind;
      this.demoEnemies.push(this.spawnTrainingDrone(k, ex, this.world.groundBelow(ex, 0) - (k === 'armored' ? 52 : k === 'striker' ? 110 : 76)));
    }
  }

  /** A find can stop the game: in play, not mid-cinematic, not in Training, nothing else already open. */
  private canReveal(): boolean {
    return getSettings().finds && this.state === 'play' && !this.cinematic && this.mode !== 'training' && !this.revealing && !this.player.dead;
  }

  /** Pauses the level under a full-screen card; the HUD sends `reveal:done` when the player closes it. */
  private openReveal(show: () => void): void {
    this.revealing = true;
    EventBus.emit('hud:modal', { open: true });
    show();
    this.scene.pause();
  }

  private closeReveal(): void {
    if (!this.revealing) return;
    this.revealing = false;
    EventBus.emit('hud:modal', { open: false });
    this.scene.resume();
  }

  private fileCardCount(): number {
    const found = new Set(this.stats.cardsFound);
    for (const record of Object.values(session.file?.chapters ?? {})) for (const c of record.cards) found.add(c);
    return found.size;
  }

  /** Quitting keeps the run so far (time included) at the last checkpoint, like a checkpoint restart would. */
  private onQuit(): void {
    if (this.state === 'play') this.saveResume();
    else this.flushPlayTime();
  }

  /** Adds time played since the last save to the file's play time. */
  private flushPlayTime(): void {
    if (session.slot !== null && this.playMsUnsaved > 0) saveSystem.addPlayTime(session.slot, this.playMsUnsaved);
    this.playMsUnsaved = 0;
  }

  /** Settings changed the difficulty mid-level: the watch, damage and enemy pacing follow at once. */
  private onDifficultyChanged(): void {
    this.omni.applyDifficulty();
    this.training?.apply();
    if (this.mode === 'story' && this.stats.difficulty !== activeDifficultyId()) this.stats.mixedDifficulty = true;
  }

  private onBossDefeated(x: number, y: number): void {
    this.split(FINISH_SPLIT, 'BOSS DOWN');
    if (this.recorder) ghostRecording.finish();
    this.recorder = null;
    if (this.bossDamageAtStart !== null && this.stats.damageTaken === this.bossDamageAtStart) this.achievements.unlock('untouchable');
    this.achievements.flush();
    this.state = 'complete';
    this.player.controlsEnabled = false;
    this.player.setInvulnerable(99999);
    this.projectiles.clear('enemy', true);
    for (const d of this.drones) if (d.alive) d.kill();
    flashCamera(this.cameras.main, 600, 255, 255, 255);
    this.fx.shake(FX.shakeHeavy * 1.5, 900);
    this.fx.ring(x, y, PALETTE.white, 300, 1000);
    music.stop(400);
    const outro = this.level.story?.outro ?? [];
    this.time.delayedCall(900, () => {
      music.play('victory');
      this.speech.show('AND THAT IS HOW IT\'S DONE!', 2400);
      EventBus.emit('hud:banner', { title: this.arena?.boss?.defeatTitle ?? 'BOSS DOWN!', subtitle: `${this.level.name} COMPLETE`, color: PALETTE.gold, durationMs: 2600, style: 'slam' });
    });
    // The family's last word (portraits in the box) before the results.
    if (outro.length > 0) this.time.delayedCall(STORY_BEATS.bossOutroAt, () => this.dialogue.play(outro));
    const outroMs = outro.reduce((sum, line) => sum + line.ms, 0);
    // Chapter 5's last beat: the dial clicks to Ghostfreak on its own for a moment, and a whisper.
    const epilogueMs = this.level.story?.bounty ? STORY_BEATS.ghostEpilogueMs : 0;
    if (epilogueMs > 0) {
      this.time.delayedCall(STORY_BEATS.bossOutroAt + outroMs + 200, () => {
        EventBus.emit('omnitrix:hesitating', { alienId: 'ghostfreak', ms: 900 });
        EventBus.emit('hud:whisper', { text: 'SOON...', color: PALETTE.ghostfreakEye });
      });
    }
    this.flushPlayTime();
    this.time.delayedCall(outro.length > 0 ? STORY_BEATS.bossOutroAt + outroMs + 500 + epilogueMs : 3800, () => {
      EventBus.emit('level:complete', { stats: cloneRunStats(this.stats) });
      this.scene.stop(SCENES.ui);
      this.scene.stop(SCENES.touch);
      this.scene.start(SCENES.chapterComplete, { levelId: this.level.id, stats: cloneRunStats(this.stats) });
    });
  }

  /** The frame-rate governor stepped down: at the lowest level drop the full-screen vignette pass too. */
  private onQualityChanged(fade = true): void {
    if (!quality.lowest || !this.vignette) return;
    const vignette = this.vignette;
    this.vignette = null;
    const remove = () => this.cameras.main?.filters?.external.remove(vignette);
    // Mid-fight it fades out rather than popping off.
    if (fade) this.tweens.add({ targets: vignette, strength: 0, duration: 600, onComplete: remove });
    else remove();
  }

  private openPause(): void {
    // ALIEN FILES' demo has no pause menu: the screen around it is the menu.
    if (this.demo) return;
    this.flushPlayTime();
    audio.setLoopsMuted(true);
    this.scene.pause();
    const data: PauseData = {
      levelId: this.level.id,
      checkpoint: this.checkpointId,
      stats: cloneRunStats(this.stats),
      training: this.mode === 'training',
      aliens: this.dialAliens,
    };
    this.scene.launch(SCENES.pause, data);
    this.inputMap.reset();
  }

  /** Steps physics, in shorter steps when Ben moves fast on a long frame (see `physicsSteps`). */
  private stepPhysics(time: number, dt: number): void {
    const steps = physicsSteps(this.player.vx, this.player.vy, dt);
    for (let i = 0; i < steps; i++) this.physics.world.update(time, dt / steps);
  }

  // ------------------------------------------------------------ HUD helpers

  /** Pushes the full current state to the HUD (it only learns things through events). */
  private syncHud(): void {
    const arena = this.arena;
    EventBus.emit('hud:letterbox', { visible: this.storyLetterbox || (this.intro?.cinematic ?? false) || (arena !== null && arena.started && !arena.fighting && !arena.boss?.defeated) });
    if (!this.intro?.inOpening && !this.storyHudHidden) EventBus.emit('hud:visible', { visible: true, omnitrix: this.omni.acquired });
    else EventBus.emit('hud:visible', { visible: false });
    this.emitHealth(0);
    this.emitFormHealth(0);
    EventBus.emit('stats:update', this.statsPayload());
    if (arena?.fighting && arena.boss) {
      EventBus.emit('boss:show', { name: arena.boss.name, subtitle: arena.boss.subtitle });
      EventBus.emit('boss:health', { ratio: arena.boss.hp / arena.boss.maxHp, phase: arena.boss.phase });
    } else {
      EventBus.emit('boss:hide');
    }
  }

  private statsPayload() {
    return {
      timeMs: this.stats.timeMs,
      enemiesDefeated: this.stats.enemiesDefeated,
      cards: this.stats.cardsFound.length,
      totalCards: this.stats.totalCards,
      reachableCards: this.reachableCards,
    };
  }

  private emitHealth(delta: number): void {
    EventBus.emit('player:health', { hp: this.player.hp, max: this.player.maxHp, delta });
  }

  private emitFormHealth(delta: number): void {
    const p = this.player;
    EventBus.emit('player:formHealth', { hp: p.formHp, max: p.form.maxFormHealth, visible: p.isAlien, delta, formId: p.form.id });
  }

  private floatText(x: number, y: number, text: string, color: number): void {
    const t = pixelText(this, x, y, text, { originX: 0.5, originY: 1, color, depth: DEPTH.worldUi });
    this.tweens.add({ targets: t, y: y - 22, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  /** ?debug=1 readout, refreshed four times a second (so it doesn't cost what it measures). */
  private debug(realDt: number): void {
    if (!this.debugText) return;
    this.debugRefreshIn -= realDt;
    if (this.debugRefreshIn > 0) return;
    this.debugRefreshIn = 250;
    const p = this.player;
    this.debugText.setText(
      `X ${Math.round(p.x / TILE)} Y ${Math.round(p.y / TILE)} VX ${Math.round(p.vx)} VY ${Math.round(p.vy)} G ${p.grounded} Q${quality.level} ${switchLabel(perf).toUpperCase()}\n${frameStats(this.game).summary()}\nOMNI ${this.omni.omnitrix.state} ${Math.round(this.omni.omnitrix.timeRemainingMs / 100) / 10} DRONES ${this.drones.filter((d) => d.alive).length}`,
    );
  }

  /** Gameplay is held in hit-stop (the autobench flags a run that stays frozen). */
  get hitStopped(): boolean {
    return this.time2?.frozen ?? false;
  }

  /** The autobench drops Ben straight into an arena instead of walking there. */
  benchTeleport(x: number, feetY: number): void {
    this.player.teleport(x, feetY);
    this.camRig.snap(x, feetY);
  }

  private shutdown(): void {
    this.flushPlayTime();
    this.player?.dispose();
    this.misfireBeat?.cancel();
    this.intro?.destroy();
    this.arena?.destroy();
    this.training?.destroy();
    this.story?.destroy();
    this.tech?.destroy();
    this.hazards?.destroy();
    this.hazards = null;
    this.crystals?.clear();
    this.weakPoints?.destroy();
    this.gwen?.destroy();
    this.gwen = null;
    this.dialogue?.stop(false);
    this.time2?.clearSlowMo();
    this.tweens.timeScale = 1;
    this.anims.globalTimeScale = 1;
  }
}
