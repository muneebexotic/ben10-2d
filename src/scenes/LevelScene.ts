import Phaser from 'phaser';
import { BOSS } from '../config/boss';
import { COMBO, DEPTH, FX, LIGHTING, PHYSICS, TILE } from '../config/constants';
import { getDifficulty } from '../config/difficulty';
import { lerpColor, PALETTE } from '../config/palette';
import { ACCESSIBILITY } from '../config/accessibility';
import { PLAYER } from '../config/player';
import { aliensUnlockedBy } from '../aliens/registry';
import type { AbilityAction, FxApi } from '../aliens/types';
import { CHAPTER_1 } from '../levels/chapter1';
import type { DroneKind, LevelData } from '../levels/types';
import { Player, type DamageOutcome } from '../entities/Player';
import { Projectiles } from '../entities/Projectiles';
import { Drone, type DroneWorld } from '../entities/enemies/Drone';
import { createBrain } from '../entities/enemies/brains';
import { Telegraphs } from '../entities/enemies/Telegraphs';
import type { Barricade } from '../entities/props/Barricade';
import type { Checkpoint } from '../entities/props/Checkpoint';
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
import { checkpointsFor, spawnEntities } from './level/Spawner';
import { TransformSequence } from './level/TransformSequence';
import { Tutorial } from './level/Tutorial';
import { SCENES } from './SceneKeys';
import { a11y, blinkOn, flashCamera } from '../systems/Accessibility';
import { PERFECT_TRANSFORM } from '../config/omnitrix';
import { PerfectWindow } from '../systems/PerfectTransform';

export interface LevelStartData {
  checkpoint?: string | null;
  stats?: RunStats;
}

const AMBIENT = {
  camp: LIGHTING.ambientCamp,
  forest: LIGHTING.ambientForest,
  ravine: LIGHTING.ambientRavine,
  crash: LIGHTING.ambientCrash,
} as const;

/** Chapter gameplay. Orchestrates systems; the interesting logic lives in scenes/level and entities. */
export class LevelScene extends Phaser.Scene {
  private level: LevelData = CHAPTER_1;
  private world!: LevelWorld;
  private parallax!: Parallax;
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
  private intro!: IntroDirector;
  private tutorial!: Tutorial;
  private arena!: BossArena;
  private droneWorld!: DroneWorld;
  private drones: Drone[] = [];
  private barricades: Barricade[] = [];
  private checkpoints: Checkpoint[] = [];
  private pickups: Pickup[] = [];
  private jammer: Jammer | null = null;
  private stats!: RunStats;
  private combo = new ComboCounter(COMBO.windowMs);
  private gameNow = 0;
  private checkpointId: string | null = null;
  private state: 'play' | 'dead' | 'complete' = 'play';
  private statsTimer = 0;
  private alarm = false;
  private killsAsAlien = 0;
  private debugText: Phaser.GameObjects.BitmapText | null = null;
  private readonly perfect = new PerfectWindow(PERFECT_TRANSFORM);

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
    this.combo = new ComboCounter(COMBO.windowMs);
    this.gameNow = 0;
    this.state = 'play';
    this.alarm = false;
    this.killsAsAlien = 0;
    this.level = CHAPTER_1;
    // Starting mid-level without a run to continue (?start=) is practice: no best times or splits.
    this.stats = data.stats ? cloneRunStats(data.stats) : createRunStats(this.countCards(), !data.checkpoint);
    this.perfect.clear();
    this.checkpointId = data.checkpoint ?? null;

    if (!this.scene.isActive(SCENES.ui)) this.scene.launch(SCENES.ui);

    this.world = new LevelWorld(this, this.level);
    this.physics.world.setBounds(0, 0, this.world.widthPx, this.world.heightPx + PHYSICS.worldBottomPadding);
    this.physics.world.checkCollision.down = false;
    this.cameras.main.setBounds(0, 0, this.world.widthPx, this.world.heightPx);
    this.cameras.main.setBackgroundColor(PALETTE.sky0);
    this.cameras.main.filters?.external.addVignette(0.5, 0.5, 0.8, 0.3, 0x05070f);

    const bossSpawn = this.level.entities.find((e) => e.type === 'boss');
    this.parallax = new Parallax(this, bossSpawn ? bossSpawn.x * TILE : this.world.widthPx);
    this.decor = new Decor(this, this.level, this.world);
    this.lighting = new Lighting(this);
    this.time2 = new TimeController();
    this.fx = new Fx(this, this.lighting, this.time2);
    this.telegraph = new Telegraphs(this);
    this.projectiles = new Projectiles(this, this.fx, this.lighting);
    this.combat = new Combat(this.projectiles, {
      onTargetHit: (t, r, h) => this.onTargetHit(t, r, h),
      onPlayerHurt: (o) => this.onPlayerHurt(o),
      onParry: (n) => {
        this.stats.parries += n;
        this.bumpCombo(n);
      },
    });
    this.inputMap = new InputMap(this);
    this.speech = new SpeechBubble(this);

    const start = this.resolveStart();
    this.player = new Player(this, start.x, start.y, {
      combat: this.combat,
      fx: this.fxApi(),
      notify: (a) => this.onAbility(a),
      damageMultiplier: getDifficulty().damageTakenMultiplier,
    });
    if (launchParams().god) this.player.setInvulnerable(1e9);
    this.player.isSafeSpot = (x, y) => !this.world.inWater(x, y + 12) && !this.world.inWater(x - 12, y + 12) && !this.world.inWater(x + 12, y + 12);
    this.player.onPlatform = (p) => this.world.isOneWay(p.x - 4, p.y + 2) || this.world.isOneWay(p.x + 4, p.y + 2);
    this.combat.setPlayer(this.player);
    this.physics.add.collider(this.player.zone, this.world.layer, undefined, (_a, tile) => this.processTile(tile as Phaser.Tilemaps.Tile));

    this.sequence = new TransformSequence({ scene: this, player: this.player, fx: this.fx, combat: this.combat, time: this.time2, speech: this.speech });
    this.omni = new OmnitrixController(aliensUnlockedBy(this.level.chapter), this.player, this.sequence, this.fx, this.perfect);
    this.omni.transformations = this.stats.transformations;
    this.omni.perfects = this.stats.perfectTransforms;
    this.omni.onTransformed = () => this.tutorial.tip('fireball', '{J} FIREBALL  (HOLD {UP} TO AIM HIGH)', 7000, 5);
    this.omni.onReverted = (reason) => {
      if (reason !== 'jammed') this.tutorial.tip('human', 'HUMAN AGAIN! {J} PUNCH   {K} DODGE ROLL', 6000, 6);
    };
    this.omni.onDenied = (reason) => {
      if (reason === 'cooldown') this.tutorial.tip('cooldown', 'OMNITRIX RECHARGING... HANG IN THERE!', 3000, 7);
    };
    this.tutorial = new Tutorial(this.level);

    this.droneWorld = this.createDroneWorld();
    const resumeX = this.checkpointId ? start.x : 0;
    const spawned = spawnEntities(this, this.level, this.droneWorld, this.fx, resumeX, this.stats.cardsFound);
    this.drones = spawned.drones;
    this.barricades = spawned.barricades;
    this.checkpoints = spawned.checkpoints;
    this.pickups = spawned.pickups;
    this.jammer = spawned.jammer;
    for (const d of this.drones) this.registerDrone(d);
    for (const b of this.barricades) {
      this.combat.addTarget(b);
      this.physics.add.collider(this.player.zone, b.image);
      b.onDestroyed = () => this.tutorial.complete('barricade');
    }
    if (this.jammer) {
      const jammer = this.jammer;
      this.combat.addTarget(jammer);
      this.physics.add.collider(this.player.zone, jammer.gate);
      jammer.onDestroyed = () => this.onJammerDestroyed();
    }

    this.camRig = new CameraRig(this.cameras.main);
    this.camRig.snap(start.x, start.y);

    const resuming = this.checkpointId !== null;
    this.intro = new IntroDirector(this, this.level, this.player, this.fx, this.time2, this.speech, {
      giveOmnitrix: () => this.giveOmnitrix(),
      spawnIntroDrones: () => this.spawnIntroDrones(),
      hasTransformed: () => this.omni.transformations > 0,
      onControlStart: () => undefined,
    }, resuming, data.stats !== undefined);
    this.intro.lightHook = (x, y, r, c, i) => this.lighting.add(x, y, r, c, i);

    this.arena = new BossArena(bossSpawn as Extract<LevelData['entities'][number], { type: 'boss' }>, {
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
    });

    if (resuming) {
      this.player.setInvulnerable(PLAYER.respawnInvulnMs);
      this.giveOmnitrix(true);
    }
    this.syncHud();
    // The HUD scene may be created after this scene (first launch); it asks for state when ready.
    EventBus.on('hud:ready', () => this.syncHud(), this);
    music.setIntensity(0);
    music.play('forest');
    bindAudioUnlock(this);
    bindMuteKey(this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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

  private countCards(): number {
    return this.level.entities.filter((e) => e.type === 'card').length;
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

  private fxApi(): FxApi {
    return {
      burst: (k, x, y, n) => this.fx.burst(k, x, y, n),
      trail: (k, x, y, n) => this.fx.trail(k, x, y, n),
      ring: (x, y, c, r, ms) => this.fx.ring(x, y, c, r, ms),
      flash: (x, y, c, r, ms) => this.fx.flash(x, y, c, r, ms),
      light: (x, y, r, c, ms) => this.fx.light(x, y, r, c, ms),
      frameLight: (x, y, r, c, i) => this.lighting.add(x, y, r, c, i),
      shake: (i, ms) => this.fx.shake(i, ms),
      hitStop: (ms) => this.fx.hitStop(ms),
    };
  }

  private createDroneWorld(): DroneWorld {
    const scene = this;
    return {
      get now() {
        return scene.gameNow;
      },
      player: this.player,
      fx: this.fx,
      lighting: this.lighting,
      projectiles: this.projectiles,
      telegraph: this.telegraph,
      get view() {
        return scene.cameras.main.worldView;
      },
      onScreen: (x, y, m) => {
        const v = this.cameras.main.worldView;
        return x > v.x + m && x < v.right - m && y > v.y + m && y < v.bottom - m;
      },
      groundBelow: (x, y) => this.world.groundBelow(x, y),
      isSolid: (x, y) => this.world.isSolid(x, y) || this.world.isOneWay(x, y),
      isWater: (x, y) => this.world.inWater(x, y),
      onKilled: (d) => this.onDroneKilled(d),
      threat: (d, at) => this.perfect.register(d, at, d.x, d.y),
      cancelThreat: (d) => this.perfect.cancel(d),
    };
  }

  private registerDrone(d: Drone): void {
    this.combat.addTarget(d);
    this.combat.addHazard(d);
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

  // ------------------------------------------------------------ Frame

  override update(time: number, delta: number): void {
    const realDt = Math.min(delta, PHYSICS.maxFrameMs);
    const controls = this.inputMap.read();

    if (controls.pause && this.state === 'play' && !this.intro.cinematic) {
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

    this.intro.update(realDt, controls);
    if (this.state === 'play') {
      this.omni.handleInput(controls, this.gameNow);
      this.player.update(dt, controls);
    }
    if (dt > 0) this.physics.world.update(time, dt);
    this.player.syncVisual(realDt * visual, this.gameNow);

    this.omni.jammed = this.jammer?.inField(this.player.x) ?? false;
    if (this.omni.jammed && this.player.isAlien && !this.player.dead) this.omni.forceRevert('jammed');
    if (dt > 0) this.omni.update(dt);

    for (const d of this.drones) d.update(dt);
    this.arena.update(dt);
    this.projectiles.update(dt, (x, y) => this.world.isSolid(x, y), this.cameras.main.worldView);
    if (this.state === 'play') this.combat.update();

    this.updateProps(dt);
    if (this.state === 'play') this.updateZones();

    const dropped = this.combo.update(dt);
    if (dropped >= COMBO.showAt) EventBus.emit('combo:drop', { count: dropped });

    if (this.state === 'play' && !this.intro.cinematic) this.stats.timeMs += realDt;
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
    this.parallax.update(this.cameras.main, realDt);
    this.decor.update(this.cameras.main, this.lighting, this.gameNow);
    this.world.update(realDt);
    this.speech.update(this.player.x, this.player.y - (this.player.isAlien ? 38 : 30), realDt);
    if (!this.intro.cinematic) {
      const ready = this.omni.acquired && this.omni.omnitrix.state === 'ready' && !this.omni.jammed;
      this.tutorial.update(realDt, this.player.x, this.player.isAlien, ready);
    }
    this.updateLighting(realDt);
    this.debug();
  }

  private updateLighting(realDt: number): void {
    const p = this.player;
    if (!p.dead) {
      const light = p.isAlien ? 0 : p.hasWatch ? 92 : 64;
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

    if (this.world.inWater(p.x, p.y) || p.y > this.world.heightPx + 40) {
      this.fx.burst('splash', p.x, Math.min(p.y, this.world.heightPx), 18);
      playSfx('splash');
      const outcome = p.pitRespawn();
      this.onPlayerHurt(outcome);
      if (!outcome.died) this.camRig.snap(p.x, p.y);
    }

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
  }

  private onTargetHit(target: Damageable, result: HitResult, hit: Hit): void {
    if (!target.countsAsEnemy || (result !== 'hit' && result !== 'killed')) {
      const barricade = (this.barricades as Damageable[]).includes(target);
      if (result === 'blocked' && barricade && hit.kind === 'melee') {
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
    if (this.player.isAlien) this.killsAsAlien++;
    if (this.killsAsAlien >= 3 && this.player.isAlien) this.tutorial.tip('burst', 'HOLD {K}, THEN RELEASE: FIRE BURST!', 6000, 4);
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
    this.cameras.main.filters?.internal.addColorMatrix().colorMatrix.desaturate();
    playSfx('revert');
    music.setIntensity(0);
    EventBus.emit('player:died');
    this.time.delayedCall(1500, () => {
      this.scene.pause();
      this.scene.launch(SCENES.gameOver, { checkpoint: this.checkpointId, stats: cloneRunStats(this.stats) });
    });
  }

  /** The boss's arrival shockwave wipes out stragglers that wandered into the arena. */
  private clearArenaStragglers(left: number, right: number): void {
    for (const d of this.drones) {
      if (d.alive && d.homeX >= 0 && d.x > left - 40 && d.x < right + 40) d.kill();
    }
  }

  private onBossDefeated(x: number, y: number): void {
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
      EventBus.emit('hud:banner', { title: 'DRONE DESTROYED!', subtitle: 'CAMP CRASH COMPLETE', color: PALETTE.gold, durationMs: 2600, style: 'slam' });
    });
    this.time.delayedCall(3800, () => {
      EventBus.emit('level:complete', { stats: cloneRunStats(this.stats) });
      this.scene.stop(SCENES.ui);
      this.scene.start(SCENES.chapterComplete, { stats: cloneRunStats(this.stats) });
    });
  }

  private openPause(): void {
    this.scene.pause();
    this.scene.launch(SCENES.pause, { checkpoint: this.checkpointId, stats: cloneRunStats(this.stats) });
    this.inputMap.reset();
  }

  // ------------------------------------------------------------ HUD helpers

  /** Pushes the full current state to the HUD (it only learns things through events). */
  private syncHud(): void {
    EventBus.emit('hud:letterbox', { visible: this.intro.cinematic || (this.arena.started && !this.arena.fighting && !this.arena.boss?.defeated) });
    if (!this.intro.inOpening) EventBus.emit('hud:visible', { visible: true, omnitrix: this.omni.acquired });
    else EventBus.emit('hud:visible', { visible: false });
    this.emitHealth(0);
    this.emitFormHealth(0);
    EventBus.emit('stats:update', this.statsPayload());
    if (this.arena.fighting && this.arena.boss) {
      EventBus.emit('boss:show', { name: BOSS.name, subtitle: BOSS.subtitle });
      EventBus.emit('boss:health', { ratio: this.arena.boss.hp / BOSS.maxHp, phase: this.arena.boss.phase });
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
    };
  }

  private emitHealth(delta: number): void {
    EventBus.emit('player:health', { hp: this.player.hp, max: this.player.maxHp, delta });
  }

  private emitFormHealth(delta: number): void {
    const p = this.player;
    EventBus.emit('player:formHealth', { hp: p.formHp, max: p.form.maxFormHealth, visible: p.isAlien, delta });
  }

  private floatText(x: number, y: number, text: string, color: number): void {
    const t = pixelText(this, x, y, text, { originX: 0.5, originY: 1, color, depth: DEPTH.worldUi });
    this.tweens.add({ targets: t, y: y - 22, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
  }

  private debug(): void {
    if (!this.debugText) return;
    const p = this.player;
    this.debugText.setText(
      `X ${Math.round(p.x / TILE)} Y ${Math.round(p.y / TILE)} VX ${Math.round(p.vx)} VY ${Math.round(p.vy)} G ${p.grounded} FPS ${Math.round(this.game.loop.actualFps)}\nOMNI ${this.omni.omnitrix.state} ${Math.round(this.omni.omnitrix.timeRemainingMs / 100) / 10} DRONES ${this.drones.filter((d) => d.alive).length}`,
    );
  }

  private shutdown(): void {
    this.intro?.destroy();
    this.time2?.clearSlowMo();
    this.tweens.timeScale = 1;
    this.anims.globalTimeScale = 1;
  }
}
