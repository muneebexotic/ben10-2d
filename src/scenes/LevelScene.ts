import Phaser from 'phaser';
import { BOSS } from '../config/boss';
import { COMBO, DEPTH, FX, LIGHTING, PHYSICS, TILE } from '../config/constants';
import { getDifficulty } from '../config/difficulty';
import { lerpColor, PALETTE } from '../config/palette';
import { ACCESSIBILITY } from '../config/accessibility';
import { PLAYER } from '../config/player';
import { getAlien, hasAlien } from '../aliens/registry';
import type { AbilityAction } from '../aliens/types';
import { CHAPTER_1 } from '../levels/chapter1';
import { completedChapters, getLevel } from '../levels/registry';
import type { AmbientKind, DroneKind, EntitySpawn, LevelData } from '../levels/types';
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
import type { Damageable, Hit, HitResult } from '../entities/types';
import { ComboCounter } from '../systems/Combo';
import { EventBus } from '../systems/EventBus';
import { Fx } from '../systems/Fx';
import { InputMap } from '../systems/InputMap';
import { launchParams } from '../systems/LaunchParams';
import { Lighting } from '../systems/Lighting';
import { cloneRunStats, createRunStats, type RunStats } from '../systems/RunStats';
import { TimeController } from '../systems/TimeController';
import { music } from '../systems/audio/Music';
import { audio } from '../systems/audio/AudioEngine';
import { playSfx } from '../systems/audio/Sfx';
import { bindAudioUnlock, bindMuteKey } from '../systems/Settings';
import { SpeechBubble } from '../ui/SpeechBubble';
import { pixelText } from '../ui/text';
import { BossArena } from './level/BossArena';
import { CameraRig } from './level/CameraRig';
import { Combat } from './level/Combat';
import { Decor } from './level/Decor';
import { IntroDirector } from './level/IntroDirector';
import { LevelWorld } from './level/LevelWorld';
import { OmnitrixController } from './level/OmnitrixController';
import { Parallax } from './level/Parallax';
import { SimBackdrop } from './level/SimBackdrop';
import { checkpointsFor, spawnEntities } from './level/Spawner';
import { TransformSequence } from './level/TransformSequence';
import { Tutorial } from './level/Tutorial';
import { TrainingDirector } from './level/TrainingDirector';
import { createDroneWorld, createFxApi } from './level/levelApis';
import { SCENES } from './SceneKeys';
import { a11y, blinkOn, flashCamera } from '../systems/Accessibility';
import { PERFECT_TRANSFORM } from '../config/omnitrix';
import { PerfectWindow } from '../systems/PerfectTransform';
import { compareSplit, FINISH_SPLIT } from '../systems/Splits';
import { saveSystem } from '../systems/SaveSystem';
import type { CrackedWall, WallBreaker } from '../entities/props/CrackedWall';
import { availableCards, countedCards } from '../levels/secrets';
import { TRAINING } from '../config/training';
import { quality } from '../systems/Quality';
import { knownAliens, storyAliens, trainingAliens } from '../systems/Unlocks';
import type { PauseData } from './PauseScene';

export interface LevelStartData {
  /** Which level to play (default: Chapter 1). */
  levelId?: string;
  checkpoint?: string | null;
  stats?: RunStats;
}

const AMBIENT: Record<AmbientKind, number> = {
  camp: LIGHTING.ambientCamp,
  forest: LIGHTING.ambientForest,
  ravine: LIGHTING.ambientRavine,
  crash: LIGHTING.ambientCrash,
  sim: LIGHTING.ambientSim,
};

type BossSpawn = Extract<EntitySpawn, { type: 'boss' }>;

/**
 * Gameplay for any level: story chapters and Omnitrix Training. Orchestrates
 * systems; the interesting logic lives in scenes/level and entities. Story-only
 * set pieces (the intro, the boss arena) exist when the level has them, and
 * Training adds its director, so a later Free Play mode is just another mix.
 */
export class LevelScene extends Phaser.Scene {
  private level: LevelData = CHAPTER_1;
  private mode: 'story' | 'training' = 'story';
  private dialAliens: string[] = [];
  private reachableCards = 0;
  private world!: LevelWorld;
  private backdrop!: { update(camera: Phaser.Cameras.Scene2D.Camera, dtMs: number): void };
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
  private speech!: SpeechBubble;
  private camRig!: CameraRig;
  private intro: IntroDirector | null = null;
  private tutorial!: Tutorial;
  private arena: BossArena | null = null;
  private training: TrainingDirector | null = null;
  private droneWorld!: DroneWorld;
  private drones: Drone[] = [];
  private barricades: Barricade[] = [];
  private checkpoints: Checkpoint[] = [];
  private pickups: Pickup[] = [];
  private jammer: Jammer | null = null;
  private walls: CrackedWall[] = [];
  private boulders: Boulder[] = [];
  private dummies: Dummy[] = [];
  private stats!: RunStats;
  private combo = new ComboCounter(COMBO.windowMs);
  private gameNow = 0;
  private checkpointId: string | null = null;
  private state: 'play' | 'dead' | 'complete' = 'play';
  private statsTimer = 0;
  private alarm = false;
  /** Kills per alien this run (advanced tips appear after a few). */
  private readonly alienKills = new Map<string, number>();
  private debugText: Phaser.GameObjects.BitmapText | null = null;
  private readonly perfect = new PerfectWindow(PERFECT_TRANSFORM);
  private vignette: Phaser.Filters.Controller | null = null;
  private desaturate: Phaser.Filters.ColorMatrix | null = null;
  private readonly onResume = () => audio.setLoopsMuted(false);

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
    this.alienKills.clear();
    this.level = getLevel(data.levelId ?? CHAPTER_1.id);
    this.mode = this.level.chapter === 0 ? 'training' : 'story';
    const extra = this.mode === 'story' ? knownAliens(launchParams().aliens) : [];
    this.dialAliens = this.resolveAliens(extra);
    this.reachableCards = availableCards(this.level, this.dialAliens).length;
    // Starting mid-level (?start=) or with playtest aliens (?aliens=) is practice: no best times or splits.
    const fullRun = this.mode === 'story' && !data.checkpoint && extra.length === 0;
    this.stats = data.stats ? cloneRunStats(data.stats) : createRunStats(countedCards(this.level).length, fullRun);
    this.perfect.clear();
    this.checkpointId = data.checkpoint ?? null;

    if (!this.scene.isActive(SCENES.ui)) this.scene.launch(SCENES.ui);
    if (!this.scene.isActive(SCENES.touch)) this.scene.launch(SCENES.touch);
    quality.reset();

    this.world = new LevelWorld(this, this.level);
    this.physics.world.setBounds(0, 0, this.world.widthPx, this.world.heightPx + PHYSICS.worldBottomPadding);
    this.physics.world.checkCollision.down = false;
    this.cameras.main.setBounds(0, 0, this.world.widthPx, this.world.heightPx);
    this.cameras.main.setBackgroundColor(PALETTE.sky0);
    this.vignette = this.cameras.main.filters?.external.addVignette(0.5, 0.5, 0.8, 0.3, 0x05070f) ?? null;
    if (quality.lowest) this.onQualityChanged();

    const bossSpawn = this.level.entities.find((e): e is BossSpawn => e.type === 'boss') ?? null;
    this.backdrop = this.level.theme === 'sim' ? new SimBackdrop(this) : new Parallax(this, bossSpawn ? bossSpawn.x * TILE : this.world.widthPx);
    this.decor = new Decor(this, this.level, this.world);
    this.lighting = new Lighting(this);
    this.time2 = new TimeController();
    this.fx = new Fx(this, this.lighting, this.time2);
    this.telegraph = new Telegraphs(this);
    this.projectiles = new Projectiles(this, this.fx, this.lighting);
    this.combat = new Combat(
      this.projectiles,
      {
        onTargetHit: (t, r, h) => this.onTargetHit(t, r, h),
        onPlayerHurt: (o) => this.onPlayerHurt(o),
        onParry: (n) => {
          this.stats.parries += n;
          this.bumpCombo(n);
        },
      },
      { isSolid: (x, y) => this.world.isSolid(x, y) },
    );
    this.inputMap = new InputMap(this);
    this.speech = new SpeechBubble(this);

    const start = this.resolveStart();
    this.createPlayer(start);
    this.createOmnitrix();
    this.tutorial = new Tutorial(this.level);

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
      threat: (d, at) => this.perfect.register(d, at, d.x, d.y),
      cancelThreat: (d) => this.perfect.cancel(d),
    });
    this.spawnLevelEntities(this.checkpointId ? start.x : 0);

    this.camRig = new CameraRig(this.cameras.main);
    this.camRig.snap(start.x, start.y);

    const resuming = this.checkpointId !== null;
    const hasPod = this.level.entities.some((e) => e.type === 'pod');
    this.intro = hasPod && this.mode === 'story'
      ? new IntroDirector(this, this.level, this.player, this.fx, this.time2, this.speech, {
          giveOmnitrix: () => this.giveOmnitrix(),
          spawnIntroDrones: () => this.spawnIntroDrones(),
          hasTransformed: () => this.omni.transformations > 0,
          onControlStart: () => undefined,
        }, resuming, data.stats !== undefined)
      : null;
    if (this.intro) this.intro.lightHook = (x, y, r, c, i) => this.lighting.add(x, y, r, c, i);
    this.arena = bossSpawn ? this.createArena(bossSpawn) : null;
    this.training = this.mode === 'training' ? this.createTraining() : null;

    if (resuming || !this.intro) {
      if (resuming) this.player.setInvulnerable(PLAYER.respawnInvulnMs);
      this.giveOmnitrix(true);
    }
    this.syncHud();
    // The HUD scene may be created after this scene (first launch); it asks for state when ready.
    EventBus.on('hud:ready', () => this.syncHud(), this);
    EventBus.on('system:pause', () => {
      if (this.state === 'play' && this.scene.isActive() && !this.cinematic) this.openPause();
    }, this);
    music.setLayer(null);
    music.setIntensity(0);
    music.play(this.mode === 'training' ? 'simulation' : 'forest');
    bindAudioUnlock(this);
    bindMuteKey(this);
    if (this.training) this.showTrainingPrompt();

    this.events.on(Phaser.Scenes.Events.RESUME, this.onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume);
      EventBus.offContext(this);
      this.shutdown();
    });
    if (launchParams().debug) {
      this.physics.world.createDebugGraphic();
      this.debugText = pixelText(this, 4, 40, '', { color: PALETTE.omnitrix, scrollFactor: 0, depth: 999 });
    }
    if (import.meta.env.DEV) (window as unknown as { __level: LevelScene }).__level = this;
  }

  // ------------------------------------------------------------ Setup helpers

  /** Aliens on the dial: story progress (plus ?aliens= playtest extras), or Training's line-up. */
  private resolveAliens(extra: readonly string[]): string[] {
    const completedIds = Object.entries(saveSystem.load().chapters)
      .filter(([, record]) => record.completed)
      .map(([id]) => id);
    const completed = completedChapters(completedIds);
    return this.mode === 'training' ? trainingAliens(completed) : storyAliens(this.level.chapter, completed, extra);
  }

  private resolveStart(): { x: number; y: number } {
    if (this.checkpointId?.startsWith('@')) {
      const tx = Number(this.checkpointId.slice(1));
      const x = tx * TILE + TILE / 2;
      return { x, y: this.world.groundBelow(x, 0) };
    }
    if (this.checkpointId) {
      const cp = checkpointsFor(this.level).find((c) => c.id === this.checkpointId) ?? this.level.entities.find((e) => e.type === 'checkpoint' && e.id === this.checkpointId);
      if (cp && cp.type === 'checkpoint') return { x: cp.x * TILE + TILE / 2 + 18, y: cp.y * TILE };
      this.checkpointId = null;
    }
    return { x: this.level.playerStart.x * TILE + TILE / 2, y: this.level.playerStart.y * TILE };
  }

  private createPlayer(start: { x: number; y: number }): void {
    this.player = new Player(this, start.x, start.y, {
      combat: this.combat,
      fx: createFxApi(this.fx, this.lighting),
      world: { isSolid: (x, y) => this.world.isSolid(x, y), groundBelow: (x, y) => this.world.groundBelow(x, y) },
      notify: (a) => this.onAbility(a),
      damageMultiplier: getDifficulty().damageTakenMultiplier,
    });
    if (launchParams().god) this.player.setInvulnerable(1e9);
    this.player.isSafeSpot = (x, y) => !this.world.inWater(x, y + 12) && !this.world.inWater(x - 12, y + 12) && !this.world.inWater(x + 12, y + 12);
    this.player.onPlatform = (p) => this.world.isOneWay(p.x - 4, p.y + 2) || this.world.isOneWay(p.x + 4, p.y + 2);
    this.player.isWaterSurface = (x, y) => this.world.onWaterSurface(x, y);
    this.combat.setPlayer(this.player);
    this.physics.add.collider(this.player.zone, this.world.layer, undefined, (_a, tile) => this.processTile(tile as Phaser.Tilemaps.Tile));
    // Water is a floor only for forms fast enough to run across it.
    this.physics.add.collider(this.player.zone, this.world.waterSurfaces, undefined, () => this.player.canRunOnWater());
  }

  private createOmnitrix(): void {
    this.sequence = new TransformSequence({ scene: this, player: this.player, fx: this.fx, combat: this.combat, time: this.time2, speech: this.speech });
    // Training is a sandbox: no misfires while learning an alien.
    this.omni = new OmnitrixController(this.dialAliens, this.player, this.sequence, this.fx, this.perfect, this.mode === 'training' ? { wrongTransformChance: 0 } : {});
    this.omni.transformations = this.stats.transformations;
    this.omni.perfects = this.stats.perfectTransforms;
    this.omni.onTransformed = (id) => this.onBecameAlien(id);
    this.omni.onSwapped = (id) => this.onBecameAlien(id);
    this.omni.onReverted = (reason) => {
      this.tutorial.clearFormTip();
      if (reason !== 'jammed') this.tutorial.tip('human', 'HUMAN AGAIN! {J} PUNCH   {K} DODGE ROLL', 6000, 6);
    };
    this.omni.onDenied = (reason) => {
      if (reason === 'cooldown') this.tutorial.tip('cooldown', 'OMNITRIX RECHARGING... HANG IN THERE!', 3000, 7);
    };
  }

  private spawnLevelEntities(resumeX: number): void {
    const spawned = spawnEntities(this, this.level, this.droneWorld, this.fx, {
      resumeX,
      collectedCards: this.stats.cardsFound,
      aliens: this.dialAliens,
      breakerFor: (id) => this.breakerFor(id),
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
      if (this.mode === 'story') w.onBroken = () => this.onVaultOpened();
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
    if (this.jammer) {
      const jammer = this.jammer;
      this.combat.addTarget(jammer);
      this.physics.add.collider(this.player.zone, jammer.gate);
      jammer.onDestroyed = () => this.onJammerDestroyed();
    }
  }

  private breakerFor(alienId: string): WallBreaker | null {
    if (!hasAlien(alienId)) return null;
    const alien = getAlien(alienId);
    return { name: alien.name, icon: alien.hudIcon, color: alien.theme.color };
  }

  private createArena(bossSpawn: BossSpawn): BossArena {
    return new BossArena(bossSpawn, {
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

  private spawnAdd(kind: DroneKind, x: number, y: number): void {
    const d = new Drone(this, this.droneWorld, x, y, createBrain(kind));
    d.awake = true;
    d.homeX = -1;
    d.nextActionAt = this.gameNow + 1200;
    d.ky = 120;
    this.drones.push(d);
    this.registerDrone(d);
  }

  private spawnTrainingDrone(kind: DroneKind, x: number, y: number): Drone {
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

  /** The intro cutscene or the Vilgax hologram is playing. */
  private get cinematic(): boolean {
    return (this.intro?.cinematic ?? false) || (this.arena?.cinematic ?? false);
  }

  // ------------------------------------------------------------ Frame

  override update(time: number, delta: number): void {
    if (quality.sample(delta)) this.onQualityChanged();
    const realDt = Math.min(delta, PHYSICS.maxFrameMs);
    const controls = this.inputMap.read();

    // During cinematics the pause button skips instead.
    if (controls.pause && this.state === 'play' && !this.cinematic) {
      this.openPause();
      return;
    }

    const dt = this.time2.step(realDt);
    const visual = this.time2.frozen ? 0 : this.time2.visualScale;
    this.fx.setTimeScale(visual);
    this.tweens.timeScale = Math.max(0.05, this.time2.visualScale);
    this.anims.globalTimeScale = Math.max(0.001, visual);
    this.gameNow += dt;
    this.player.now = this.gameNow;
    this.telegraph.begin();

    this.intro?.update(realDt, controls);
    if (this.state === 'play') {
      this.omni.handleInput(controls, this.gameNow);
      this.player.update(dt, controls);
    }
    if (dt > 0) this.physics.world.update(time, dt);
    this.player.syncVisual(realDt * visual, this.gameNow);

    // The Vilgax hologram holds the world (and the alien timer) still while he talks.
    const worldDt = this.arena?.cinematic ? 0 : dt;
    this.omni.jammed = this.jammer?.inField(this.player.x) ?? false;
    if (this.omni.jammed && this.player.isAlien && !this.player.dead) this.omni.forceRevert('jammed');
    if (worldDt > 0) this.omni.update(worldDt);

    for (const d of this.drones) d.update(worldDt);
    this.arena?.update(dt, realDt, controls);
    this.projectiles.update(worldDt, (x, y) => this.world.isSolid(x, y), this.cameras.main.worldView, (x, y) => this.world.groundBelow(x, y));
    if (this.state === 'play') this.combat.update(worldDt);

    this.updateProps(dt);
    if (this.state === 'play') this.updateZones();

    const dropped = this.combo.update(dt);
    if (dropped >= COMBO.showAt) EventBus.emit('combo:drop', { count: dropped });

    if (this.state === 'play' && !this.cinematic) this.stats.timeMs += realDt;
    this.stats.transformations = this.omni.transformations;
    this.stats.perfectTransforms = this.omni.perfects;
    this.perfect.prune(this.gameNow);
    this.statsTimer -= realDt;
    if (this.statsTimer <= 0) {
      this.statsTimer = 100;
      EventBus.emit('stats:update', this.statsPayload());
      this.emitFormHealth(0);
    }

    this.camRig.update(this.player.x, this.player.y, this.player.facing, this.player.grounded, realDt * Math.max(0.3, visual));
    this.backdrop.update(this.cameras.main, realDt);
    this.decor.update(this.cameras.main, this.lighting, this.gameNow);
    this.world.update(realDt);
    this.speech.update(this.player.x, this.player.y - this.player.headHeight, realDt);
    if (!this.intro?.cinematic) {
      const ready = this.omni.acquired && this.omni.omnitrix.state === 'ready' && !this.omni.jammed;
      this.tutorial.update(realDt, this.player.x, this.player.isAlien, ready);
    }
    this.updateLighting(realDt);
    this.debug();
  }

  private updateLighting(realDt: number): void {
    const p = this.player;
    if (!p.dead) {
      const light = p.isAlien ? 0 : p.hasWatch ? PLAYER.lightRadiusWithWatch : PLAYER.lightRadiusNoWatch;
      if (light > 0) p.hasWatch ? this.lighting.add(p.x, p.centerY, light, 0xb8ffc8, 0.85) : this.lighting.add(p.x, p.centerY, light, 0xc8d0ff, 0.6);
    }
    const zone = this.world.ambientAt(p.x);
    const ambient = this.alarm ? this.alarmAmbient() : AMBIENT[zone];
    this.lighting.setAmbient(ambient, this.alarm ? 250 : LIGHTING.ambientBlendMs);
    this.lighting.update(realDt);
    this.lighting.render(this.cameras.main);
  }

  /** Boss phase 2 alarm lights: a hard red strobe, or a slow gentle pulse with Reduce Flashing on. */
  private alarmAmbient(): number {
    if (!a11y.reduceFlashing) return blinkOn(this.gameNow, 500) ? LIGHTING.ambientCrash : LIGHTING.ambientAlarm;
    const wave = (Math.sin((this.gameNow / ACCESSIBILITY.reducedAlarmPeriodMs) * Math.PI * 2) + 1) / 2;
    return lerpColor(LIGHTING.ambientCrash, LIGHTING.ambientAlarm, wave * ACCESSIBILITY.reducedAlarmMix);
  }

  private updateProps(dt: number): void {
    for (const b of this.barricades) b.update(dt);
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
      if (!c.lit && c.contains(p.x, p.y)) {
        c.light();
        this.checkpointId = c.id;
        playSfx('checkpoint');
        this.fx.burst('green', c.x, c.y - 24, 16);
        this.fx.ring(c.x, c.y - 24, PALETTE.omnitrix, 30, 400);
        EventBus.emit('hud:banner', { title: 'CHECKPOINT', color: PALETTE.omnitrix, durationMs: 1100, style: 'soft' });
        this.split(c.id, c.label);
      }
    }

    for (const pk of this.pickups) {
      if (!pk.touches(p.x, p.y)) continue;
      pk.collect(this.fx);
      if (pk.kind === 'smoothy') {
        const healed = p.heal(2);
        playSfx('heal');
        this.floatText(pk.x, pk.baseY - 10, healed > 0 ? `+${healed} HP` : 'BRAIN FREEZE!', 0xff8fc8);
        if (p.isAlien) p.formHp = Math.min(p.form.maxFormHealth, p.formHp + 2);
        this.emitHealth(healed);
      } else {
        this.stats.cardsFound.push(pk.id);
        playSfx('card');
        this.time2.slowMo(0.4, 350, 250);
        EventBus.emit('card:collected', { id: pk.id, found: this.stats.cardsFound.length, total: this.stats.totalCards });
        EventBus.emit('hud:banner', {
          title: 'SUMO SLAMMERS CARD!',
          subtitle: `${this.stats.cardsFound.length} / ${this.stats.totalCards} FOUND`,
          color: PALETTE.gold,
          durationMs: 1800,
          style: 'slam',
        });
      }
    }

    // No need to hint at who can break it when Ben already is that alien.
    if (!p.form.reach.canSmash) for (const w of this.walls) if (w.touching(p.x, p.y)) w.tease();

    if (this.world.inWater(p.x, p.y) || p.y > this.world.heightPx + 40) {
      this.fx.burst('splash', p.x, Math.min(p.y, this.world.heightPx), 18);
      playSfx('splash');
      const outcome = p.pitRespawn();
      this.onPlayerHurt(outcome);
      if (!outcome.died) this.camRig.snap(p.x, p.y);
    }

    if (this.level.id !== CHAPTER_1.id) return;
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

  // ------------------------------------------------------------ Events

  private onAbility(action: AbilityAction): void {
    this.tutorial.onAction(action);
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

  private bumpCombo(n: number): void {
    let count = 0;
    for (let i = 0; i < n; i++) count = this.combo.hit();
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo.best);
    if (count >= COMBO.showAt) {
      EventBus.emit('combo:update', { count, best: this.combo.best });
      if (count % 5 === 0) playSfx('combo', 1, 1 + Math.min(1, count / 40));
    }
  }

  private onDroneKilled(d: Drone): void {
    this.perfect.cancel(d);
    if (this.arena?.started && d.homeX >= 0 && !this.arena.fighting) return;
    this.stats.enemiesDefeated++;
    if (!this.player.isAlien) return;
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

  /** The Four Arms vault cracks open: a beat of slow motion so the card reveal lands. */
  private onVaultOpened(): void {
    this.time2.slowMo(0.3, 600, 300);
    this.fx.shake(FX.shakeHeavy, 360);
    EventBus.emit('hud:banner', { title: 'SECRET VAULT!', subtitle: 'SMASHED OPEN', color: PALETTE.gold, durationMs: 1600, style: 'slam' });
    this.speech.show("NOW THAT'S WHAT I CALL A SECRET!", 2200);
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
    this.time2.slowMo(0.3, 900, 300);
    this.desaturate = this.cameras.main.filters?.internal.addColorMatrix() ?? null;
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
      this.scene.launch(SCENES.gameOver, { levelId: this.level.id, checkpoint: this.checkpointId, stats: cloneRunStats(this.stats) });
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

  /** Speedrun split vs the fastest time ever reached here. Practice runs show nothing. */
  private split(id: string, label: string): void {
    if (!this.stats.fullRun) return;
    const previous = saveSystem.recordSplit(this.level.id, id, this.stats.timeMs);
    EventBus.emit('hud:split', compareSplit(id, label, this.stats.timeMs, previous));
  }

  private onBossDefeated(x: number, y: number): void {
    this.split(FINISH_SPLIT, 'BOSS DOWN');
    this.state = 'complete';
    this.player.controlsEnabled = false;
    this.player.setInvulnerable(99999);
    this.projectiles.clear('enemy', true);
    for (const d of this.drones) if (d.alive) d.kill();
    flashCamera(this.cameras.main, 600, 255, 255, 255);
    this.fx.shake(FX.shakeHeavy * 1.5, 900);
    this.fx.ring(x, y, PALETTE.white, 300, 1000);
    music.stop(400);
    this.time.delayedCall(900, () => {
      music.play('victory');
      this.speech.show('AND THAT IS HOW IT\'S DONE!', 2400);
      EventBus.emit('hud:banner', { title: 'DRONE DESTROYED!', subtitle: `${this.level.name} COMPLETE`, color: PALETTE.gold, durationMs: 2600, style: 'slam' });
    });
    this.time.delayedCall(3800, () => {
      EventBus.emit('level:complete', { stats: cloneRunStats(this.stats) });
      this.scene.stop(SCENES.ui);
      this.scene.stop(SCENES.touch);
      this.scene.start(SCENES.chapterComplete, { stats: cloneRunStats(this.stats) });
    });
  }

  /** The frame-rate governor stepped down: at the lowest level drop the full-screen vignette pass too. */
  private onQualityChanged(): void {
    if (quality.lowest && this.vignette) {
      this.cameras.main.filters?.external.remove(this.vignette);
      this.vignette = null;
    }
  }

  private openPause(): void {
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

  // ------------------------------------------------------------ HUD helpers

  /** Pushes the full current state to the HUD (it only learns things through events). */
  private syncHud(): void {
    const arena = this.arena;
    EventBus.emit('hud:letterbox', { visible: (this.intro?.cinematic ?? false) || (arena !== null && arena.started && !arena.fighting && !arena.boss?.defeated) });
    if (!this.intro?.inOpening) EventBus.emit('hud:visible', { visible: true, omnitrix: this.omni.acquired });
    else EventBus.emit('hud:visible', { visible: false });
    this.emitHealth(0);
    this.emitFormHealth(0);
    EventBus.emit('stats:update', this.statsPayload());
    if (arena?.fighting && arena.boss) {
      EventBus.emit('boss:show', { name: BOSS.name, subtitle: BOSS.subtitle });
      EventBus.emit('boss:health', { ratio: arena.boss.hp / BOSS.maxHp, phase: arena.boss.phase });
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

  private debug(): void {
    if (!this.debugText) return;
    const p = this.player;
    this.debugText.setText(
      `X ${Math.round(p.x / TILE)} Y ${Math.round(p.y / TILE)} VX ${Math.round(p.vx)} VY ${Math.round(p.vy)} G ${p.grounded} FPS ${Math.round(this.game.loop.actualFps)} Q${quality.level}\nOMNI ${this.omni.omnitrix.state} ${Math.round(this.omni.omnitrix.timeRemainingMs / 100) / 10} DRONES ${this.drones.filter((d) => d.alive).length}`,
    );
  }

  private shutdown(): void {
    this.intro?.destroy();
    this.arena?.destroy();
    this.training?.destroy();
    this.time2?.clearSlowMo();
    this.tweens.timeScale = 1;
    this.anims.globalTimeScale = 1;
  }
}
