import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { SCENES } from './SceneKeys';
import { pixelText } from '../ui/text';
import { viewHeight, viewWidth } from '../ui/view';
import { autopilot } from '../systems/Autopilot';
import { audio } from '../systems/audio/AudioEngine';
import { quality } from '../systems/Quality';
import { trainingOptions } from '../systems/TrainingState';
import { contextVariant, perf, setSwitches } from '../systems/PerfSwitches';
import { applyRenderSwitches } from '../systems/RenderSwitches';
import { launchParams } from '../systems/LaunchParams';
import { GlProbe } from '../systems/autobench/GlProbe';
import { buildPlan, estimateMinutes, firstVisit, scenarioById, timing, variantById, type BenchRun, type Timing } from '../systems/autobench/plan';
import { median, refreshRate, summarize, type FrameSample } from '../systems/autobench/stats';
import { formatReport, type PageInfo, type RunResult } from '../systems/autobench/report';
import { batteryState, canvasInfo, collectDevice, deviceWarnings, describeBattery, inAppBrowser, type DeviceInfo } from '../systems/autobench/device';
import { showContinueOverlay, showReportOverlay, showStartOverlay, type StartOverlay } from '../ui/autobenchOverlay';
import type { LevelScene } from './LevelScene';

const STATE_KEY = 'ben10-autobench-state';
const REPORT_KEY = 'ben10-autobench-report';
const VERSION = `v1 build ${__BUILD__}`;
/** Without a GPU timer, this long at the end of a run measures the GPU with readPixels waits (every 3rd frame). */
const SYNC_PROBE_MS = 1500;
const MAX_RETRIES = 2;

interface SavedState {
  v: 1;
  plan: BenchRun[];
  index: number;
  results: RunResult[];
  device: DeviceInfo;
  warnings: string[];
  pages: PageInfo[];
  quick: boolean;
}

type Phase = 'menu' | 'between' | 'loading' | 'warmup' | 'record' | 'gpuprobe' | 'done';

const GAME_SCENES = [SCENES.level, SCENES.ui, SCENES.touch, SCENES.pause, SCENES.gameOver, SCENES.chapterComplete, SCENES.arcade, SCENES.actEnd, SCENES.settings];

/**
 * ?autobench=1: the phone tests itself. Plays every heavy scene with the
 * scripted player and god mode, normally and then with each bisect switch,
 * measures each run on the device, and ends on a report with a COPY button.
 * See docs/PERFORMANCE.md ("Checking on a real phone").
 */
export class AutobenchScene extends Phaser.Scene {
  private probe!: GlProbe;
  private plan: BenchRun[] = [];
  private index = 0;
  private results: RunResult[] = [];
  private device: DeviceInfo | null = null;
  private warnings: string[] = [];
  private pages: PageInfo[] = [];
  private quick = false;
  private t: Timing = timing(false);
  private phase: Phase = 'menu';
  private phaseAt = 0;
  private samples: FrameSample[] = [];
  private gpu: number[] = [];
  private syncWaits: number[] = [];
  private idleIntervals: number[] = [];
  private stepAt = 0;
  private renderAt = 0;
  private lastStep = 0;
  private interval = 0;
  private frameNo = 0;
  private longTasks = 0;
  private observer: PerformanceObserver | null = null;
  private interrupted = false;
  private retries = 0;
  /** Warm-up for the current run (longer on a scene's or a page's first visit). */
  private warmupMs = 0;
  /** The first run after a page load (a fresh page compiles everything again). */
  private pageStart = true;
  private status!: Phaser.GameObjects.BitmapText;
  private statusIn = 0;
  private startOverlay: StartOverlay | null = null;
  private wakeLock: { release(): Promise<void> } | null = null;
  private fullscreen = false;

  constructor() {
    super(SCENES.autobench);
  }

  create(): void {
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    this.probe = new GlProbe(renderer.gl);
    this.status = pixelText(this, viewWidth(this) / 2, viewHeight(this) - 4, '', { originX: 0.5, originY: 1, color: PALETTE.omnitrix, depth: 1000 });
    const ev = this.game.events;
    ev.on(Phaser.Core.Events.PRE_STEP, this.onPreStep, this);
    ev.on(Phaser.Core.Events.POST_STEP, this.onPostStep, this);
    ev.on(Phaser.Core.Events.POST_RENDER, this.onPostRender, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off(Phaser.Core.Events.PRE_STEP, this.onPreStep, this);
      ev.off(Phaser.Core.Events.POST_STEP, this.onPostStep, this);
      ev.off(Phaser.Core.Events.POST_RENDER, this.onPostRender, this);
      this.observer?.disconnect();
    });
    try {
      this.observer = new PerformanceObserver((list) => {
        if (this.phase === 'record') this.longTasks += list.getEntries().length;
      });
      this.observer.observe({ type: 'longtask', buffered: false });
    } catch {
      this.observer = null;
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.interrupted = this.phase === 'warmup' || this.phase === 'record' || this.phase === 'gpuprobe';
      else void this.keepAwake();
    });

    if (launchParams().autobench === 'report') {
      this.showStored();
      return;
    }
    const saved = this.loadState();
    if (saved && new URLSearchParams(window.location.search).has('abcontinue')) this.continueFrom(saved);
    else this.showStart();
  }

  // ------------------------------------------------------------ Frame hooks

  private onPreStep(): void {
    const now = performance.now();
    this.interval = this.lastStep > 0 ? now - this.lastStep : 0;
    this.lastStep = now;
    this.stepAt = now;
    this.renderAt = now;
    if (this.phase === 'menu') this.idleIntervals.push(this.interval);
    this.probe.frameStart(this.phase === 'record');
  }

  private onPostStep(): void {
    this.renderAt = performance.now();
  }

  private onPostRender(): void {
    const now = performance.now();
    this.probe.frameEnd();
    this.frameNo++;
    if (this.phase === 'record') {
      this.samples.push({
        interval: this.interval,
        cpu: now - this.stepAt,
        render: now - this.renderAt,
        draws: this.probe.draws,
        fbBinds: this.probe.fbBinds,
        uploadBytes: this.probe.uploadBytes,
        texUploads: this.probe.texUploads,
        quality: quality.level,
      });
      for (const g of this.probe.takeGpu()) this.gpu.push(g);
    } else if (this.phase === 'gpuprobe' && this.frameNo % 3 === 0) {
      this.syncWaits.push(this.probe.syncWait());
    }
  }

  // ------------------------------------------------------------ Screens

  private showStart(): void {
    const plan = buildPlan(this.planOptions());
    const hasReport = readStored() !== null;
    this.startOverlay = showStartOverlay({
      runs: plan.length,
      minutes: estimateMinutes(plan, timing(false)),
      quickMinutes: estimateMinutes(plan, timing(true)),
      hasReport,
      onStart: (quick) => this.begin(plan, quick),
      onReport: () => {
        this.startOverlay?.close();
        this.showStored();
      },
    });
    // Measure the idle screen's refresh rate and fill in the warnings.
    this.time.delayedCall(1800, () => void this.measureDevice());
  }

  private async measureDevice(): Promise<void> {
    const battery = await batteryState();
    const hz = refreshRate(this.idleIntervals);
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    this.device = collectDevice(renderer.gl, this.game.canvas, hz, battery);
    this.warnings = this.currentWarnings(hz, battery, false);
    this.startOverlay?.setInfo(
      [`BUILD ${__BUILD__}`, `SCREEN ${hz || '?'} HZ`, `GPU ${this.device.renderer}`, `CANVAS ${this.game.canvas.width}x${this.game.canvas.height}`, `BATTERY ${describeBattery(battery) ?? '?'}`],
      this.warnings.filter((w) => !w.startsWith('NOT FULLSCREEN')),
    );
  }

  private currentWarnings(hz: number, battery: { level: number; charging: boolean } | null, fullscreen: boolean): string[] {
    const nav = navigator as unknown as { connection?: { saveData?: boolean } };
    return deviceWarnings({
      refreshHz: hz,
      battery,
      inApp: inAppBrowser(navigator.userAgent),
      saveData: nav.connection?.saveData === true,
      fullscreen,
      touch: navigator.maxTouchPoints > 0,
      zoom: window.visualViewport?.scale ?? 1,
    });
  }

  /** START (a real tap): fullscreen, screen on, sound unlocked, then the first run. */
  private begin(plan: BenchRun[], quick: boolean): void {
    this.goFullscreen();
    void this.keepAwake();
    audio.unlock();
    this.startOverlay?.close();
    this.startOverlay = null;
    this.plan = plan;
    this.quick = quick;
    this.t = timing(quick);
    this.index = 0;
    this.results = [];
    this.time.delayedCall(1500, () => {
      void this.finishDeviceInfo().then(() => this.startRun());
    });
  }

  private async finishDeviceInfo(): Promise<void> {
    if (!this.device) await this.measureDevice();
    const battery = await batteryState();
    const hz = this.device?.refreshHz ?? 0;
    this.fullscreen = isFullscreen();
    this.warnings = this.currentWarnings(hz, battery, this.fullscreen);
    if (this.device) this.device.canvas = canvasInfo(this.game.canvas);
    this.pages = [this.pageInfo(0)];
  }

  private pageInfo(page: number): PageInfo {
    const gl = (this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl;
    const a = gl.getContextAttributes();
    const bit = (v: boolean | undefined) => (v ? 1 : 0);
    const attrs = a ? `depth=${bit(a.depth)} stencil=${bit(a.stencil)} desync=${bit(a.desynchronized)} aa=${bit(a.antialias)} alpha=${bit(a.alpha)}` : 'unknown';
    return { page, ctx: contextVariant, contextAttributes: attrs, fullscreen: isFullscreen() };
  }

  /** A page reload for a context variant: carry on where the plan left off. */
  private continueFrom(saved: SavedState): void {
    this.plan = saved.plan;
    this.index = saved.index;
    this.results = saved.results;
    this.device = saved.device;
    this.warnings = saved.warnings;
    this.pages = saved.pages;
    this.quick = saved.quick;
    this.t = timing(saved.quick);
    const page = this.plan[this.index]?.page ?? 0;
    const pages = Math.max(...this.plan.map((r) => r.page)) + 1;
    showContinueOverlay(`PAGE ${page + 1} OF ${pages}: WEBGL CONTEXT TEST (${contextVariant.toUpperCase()}).`, 8, (tapped) => {
      if (tapped) {
        this.goFullscreen();
        audio.unlock();
      }
      void this.keepAwake();
      this.time.delayedCall(1500, () => {
        this.pages.push(this.pageInfo(page));
        this.startRun();
      });
    });
  }

  private showStored(): void {
    const stored = readStored();
    showReportOverlay(stored ?? 'NO AUTOBENCH REPORT ON THIS DEVICE YET. RUN ?autobench=1 FIRST.', {
      title: 'AUTOBENCH REPORT',
      onRerun: () => (window.location.href = benchUrl({})),
      onClose: () => (window.location.href = gameUrl()),
    });
  }

  // ------------------------------------------------------------ Runs

  private startRun(): void {
    const run = this.plan[this.index];
    const scenario = scenarioById(run.scenario);
    if (!scenario) {
      this.nextRun();
      return;
    }
    this.stopGameScenes();
    autopilot.stop();
    setSwitches(variantById(run.variant).switches);
    applyRenderSwitches(this.game);
    audio.setMuted(!perf.audio);
    quality.setLevel(0);
    const chaos = scenario.setup === 'misfireChaos';
    trainingOptions.misfireStep = chaos ? 3 : 0;
    trainingOptions.alienTimer = !chaos;
    this.interrupted = false;
    this.probe.reset();
    this.warmupMs = this.t.warmupMs + (this.pageStart || firstVisit(this.plan, this.index) ? this.t.firstVisitMs : 0);
    this.pageStart = false;
    this.setPhase('between');
  }

  private launchScenario(): void {
    const run = this.plan[this.index];
    const scenario = scenarioById(run.scenario)!;
    if (scenario.levelId === null) {
      this.setPhase('warmup');
      return;
    }
    this.scene.launch(SCENES.level, { levelId: scenario.levelId, checkpoint: scenario.checkpoint });
    this.setPhase('loading');
  }

  override update(): void {
    const now = performance.now();
    const elapsed = now - this.phaseAt;
    this.updateStatus(now);
    if (document.hidden) return;
    switch (this.phase) {
      case 'between':
        if (elapsed > 400) this.launchScenario();
        break;
      case 'loading':
        if (elapsed > 300 && this.scene.isActive(SCENES.level)) this.onLevelReady();
        else if (elapsed > 20000) this.finishRun(['no-load']);
        break;
      case 'warmup':
        if (this.scene.isActive(SCENES.pause)) this.interrupted = true;
        if (elapsed >= this.warmupMs) {
          this.samples = [];
          this.gpu = [];
          this.syncWaits = [];
          this.longTasks = 0;
          this.probe.takeGpu();
          this.setPhase('record');
        }
        break;
      case 'record':
        if (this.scene.isActive(SCENES.pause)) this.interrupted = true;
        if (elapsed >= this.t.recordMs) this.setPhase(this.probe.timer ? 'done' : 'gpuprobe');
        break;
      case 'gpuprobe':
        if (elapsed >= SYNC_PROBE_MS) this.setPhase('done');
        break;
      case 'done':
        this.finishRun([]);
        break;
      default:
        break;
    }
  }

  private onLevelReady(): void {
    const scenario = scenarioById(this.plan[this.index].scenario)!;
    if (scenario.setup === 'kevinArena') {
      // Straight into the substation hall (the same spot as `npm run bench`).
      (this.scene.get(SCENES.level) as LevelScene).benchTeleport(396 * 16 + 8, 33 * 16);
    }
    autopilot.start(scenario.driver, scenario.setup === 'kevinArena' ? 3200 : 2400);
    this.scene.bringToTop();
    this.setPhase('warmup');
  }

  private finishRun(extraFlags: string[]): void {
    const run = this.plan[this.index];
    const flags = [...extraFlags];
    if (this.interrupted) {
      if (this.retries < MAX_RETRIES) {
        this.retries++;
        this.startRun();
        return;
      }
      flags.push('interrupted');
    }
    this.retries = 0;
    const scenario = scenarioById(run.scenario);
    if (scenario?.levelId && !this.scene.isActive(SCENES.level)) flags.push(this.scene.isActive(SCENES.gameOver) || this.scene.isPaused(SCENES.level) ? 'died' : 'ended');
    if (!perf.audio || audio.muted) {
      // Expected for audio=0.
    } else if (!audio.ready) flags.push('nosound');
    const summary = summarize(this.samples);
    const gpu = this.gpu.length > 0 ? this.gpu.reduce((a, b) => a + b, 0) / this.gpu.length : this.syncWaits.length > 0 ? median(this.syncWaits) : null;
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    this.results.push({
      scenario: run.scenario,
      variant: run.variant,
      ctx: run.ctx,
      page: run.page,
      drift: run.drift,
      summary,
      gpu,
      gpuMethod: this.gpu.length > 0 ? 'timer' : this.syncWaits.length > 0 ? 'sync' : 'none',
      longTasks: this.longTasks,
      heapMb: memory ? Math.round(memory.usedJSHeapSize / 1048576) : null,
      fullscreen: isFullscreen(),
      flags,
    });
    this.storeReport(true);
    this.nextRun();
  }

  private nextRun(): void {
    autopilot.stop();
    this.index++;
    if (this.index >= this.plan.length) {
      this.finish();
      return;
    }
    const next = this.plan[this.index];
    const current = this.plan[this.index - 1];
    if (next.page !== current.page) {
      this.reloadFor(next);
      return;
    }
    this.startRun();
  }

  /** WebGL context attributes are fixed when the page creates the context: the next runs need a fresh page. */
  private reloadFor(next: BenchRun): void {
    this.stopGameScenes();
    this.setPhase('menu');
    const state: SavedState = {
      v: 1,
      plan: this.plan,
      index: this.index,
      results: this.results,
      device: this.device!,
      warnings: this.warnings,
      pages: this.pages,
      quick: this.quick,
    };
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      // No session storage: skip the context variants.
      this.finish();
      return;
    }
    window.location.href = benchUrl({ ctx: next.ctx, abcontinue: '1' });
  }

  private finish(): void {
    this.stopGameScenes();
    autopilot.stop();
    setSwitches({});
    applyRenderSwitches(this.game);
    audio.setMuted(false);
    trainingOptions.misfireStep = 0;
    trainingOptions.alienTimer = true;
    this.setPhase('menu');
    this.status.setText('');
    try {
      sessionStorage.removeItem(STATE_KEY);
    } catch {
      // Nothing to clean up.
    }
    const report = this.storeReport(false);
    void this.wakeLock?.release().catch(() => undefined);
    this.wakeLock = null;
    // Out of fullscreen, so switching apps to paste the report is easy.
    if (isFullscreen()) void document.exitFullscreen?.().catch(() => undefined);
    showReportOverlay(report, {
      title: 'AUTOBENCH DONE',
      onRerun: () => (window.location.href = benchUrl({})),
      onClose: () => (window.location.href = gameUrl()),
    });
  }

  private storeReport(partial: boolean): string {
    if (!this.device) return '';
    const report = formatReport({
      version: partial ? `${VERSION} (PARTIAL: ${this.results.length} OF ${this.plan.length} RUNS)` : VERSION,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      device: this.device,
      warnings: this.warnings,
      pages: this.pages,
      results: this.results,
      timing: this.t,
    });
    try {
      localStorage.setItem(REPORT_KEY, report);
    } catch {
      // The report is still on screen.
    }
    return report;
  }

  // ------------------------------------------------------------ Helpers

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseAt = performance.now();
  }

  private stopGameScenes(): void {
    for (const key of GAME_SCENES) {
      if (this.scene.isActive(key) || this.scene.isPaused(key) || this.scene.isSleeping(key)) this.scene.stop(key);
    }
  }

  private updateStatus(now: number): void {
    if (now < this.statusIn || this.plan.length === 0 || this.phase === 'menu') return;
    this.statusIn = now + 500;
    const run = this.plan[this.index];
    if (!run) return;
    const left = Math.max(0, Math.ceil((this.phase === 'warmup' ? this.warmupMs + this.t.recordMs : this.t.recordMs) / 1000 - (now - this.phaseAt) / 1000));
    this.status.setText(`AUTOBENCH ${this.index + 1}/${this.plan.length}  ${run.scenario.toUpperCase()} ${run.variant.toUpperCase()}  ${this.phase === 'record' || this.phase === 'warmup' ? `${left}S` : '...'}`);
  }

  private goFullscreen(): void {
    try {
      if (!this.scale.isFullscreen && this.scale.fullscreen.available) this.scale.startFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      orientation.lock?.('landscape').catch(() => undefined);
    } catch {
      // Not allowed here: carry on windowed (the report says so).
    }
  }

  private async keepAwake(): Promise<void> {
    try {
      const nav = navigator as unknown as { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
      if (!nav.wakeLock || document.hidden || this.wakeLock) return;
      const lock = await nav.wakeLock.request('screen');
      this.wakeLock = lock;
      (lock as unknown as EventTarget).addEventListener?.('release', () => (this.wakeLock = null));
    } catch {
      this.wakeLock = null;
    }
  }

  private planOptions() {
    const q = new URLSearchParams(window.location.search);
    const only = q.get('only');
    return { only: only ? only.split(',') : null, contexts: q.get('contexts') !== '0' };
  }

  private loadState(): SavedState | null {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      const state = raw ? (JSON.parse(raw) as SavedState) : null;
      return state && state.v === 1 && Array.isArray(state.plan) ? state : null;
    } catch {
      return null;
    }
  }
}

function isFullscreen(): boolean {
  return document.fullscreenElement !== null && document.fullscreenElement !== undefined;
}

function readStored(): string | null {
  try {
    return localStorage.getItem(REPORT_KEY);
  } catch {
    return null;
  }
}

/** This page's address with the autobench switches changed (`only`, `contexts` and `quick` carry over). */
function benchUrl(set: Record<string, string>): string {
  const q = new URLSearchParams(window.location.search);
  for (const key of ['ctx', 'abcontinue']) q.delete(key);
  q.set('autobench', '1');
  for (const [k, v] of Object.entries(set)) if (v !== 'default') q.set(k, v);
  return `${window.location.pathname}?${q.toString()}`;
}

function gameUrl(): string {
  return window.location.pathname;
}
