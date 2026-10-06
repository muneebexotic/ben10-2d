import { AUDIO } from '../../config/audio';

export interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  freqEnd?: number;
  duration: number;
  volume?: number;
  attack?: number;
  when?: number;
  detune?: number;
  bus?: GainNode;
  filter?: { type: BiquadFilterType; freq: number; q?: number };
}

export interface NoiseOptions {
  duration: number;
  volume?: number;
  filter?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  q?: number;
  attack?: number;
  when?: number;
  bus?: GainNode;
}

/**
 * Tiny Web Audio synth. Everything the game hears is generated here; there are no audio files yet.
 * The context is created lazily and resumed on the first user gesture (browser autoplay rules).
 */
export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfxBus!: GainNode;
  musicBus!: GainNode;
  /** Held sounds (charge hum, XLR8's wind) go through here so pausing can silence them. */
  loopBus!: GainNode;
  private noiseBuffer: AudioBuffer | null = null;
  private _muted = false;
  private loopsMuted = false;
  private pageHidden = false;

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  get muted(): boolean {
    return this._muted;
  }

  get now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** Safe to call often; only the first call does work. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this._muted ? 0 : AUDIO.masterVolume;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        this.master.connect(comp).connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = AUDIO.sfxVolume;
        this.sfxBus.connect(this.master);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = AUDIO.musicVolume;
        this.musicBus.connect(this.master);
        this.loopBus = this.ctx.createGain();
        this.loopBus.gain.value = this.loopsMuted ? 0 : 1;
        this.loopBus.connect(this.sfxBus);
        this.noiseBuffer = this.makeNoise();
      }
      if (this.ctx.state === 'suspended' && !this.pageHidden) void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  /**
   * The page went to the background (another app, another tab): stop the audio clock, and start it again on
   * return. Background tabs throttle timers to about once a second, and the music scheduler running on them
   * would blurt out bursts of notes behind the player's back.
   */
  setPageHidden(hidden: boolean): void {
    this.pageHidden = hidden;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      void (hidden ? ctx.suspend() : ctx.resume()).catch(() => undefined);
    } catch {
      // A closed context: nothing to pause.
    }
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.now);
    this.master.gain.setTargetAtTime(muted ? 0 : AUDIO.masterVolume, this.now, 0.03);
  }

  /** Silences held sounds while the game is paused (they keep their own state and resume with it). */
  setLoopsMuted(muted: boolean): void {
    this.loopsMuted = muted;
    if (!this.ctx) return;
    this.loopBus.gain.cancelScheduledValues(this.now);
    this.loopBus.gain.setTargetAtTime(muted ? 0 : 1, this.now, 0.02);
  }

  tone(o: ToneOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.ready) return;
    const t = o.when ?? ctx.currentTime;
    const vol = o.volume ?? 0.3;
    const attack = o.attack ?? 0.004;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), t + o.duration);
    if (o.detune) osc.detune.value = o.detune;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.duration);
    let node: AudioNode = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filter.type;
      f.frequency.value = o.filter.freq;
      f.Q.value = o.filter.q ?? 1;
      node = node.connect(f);
    }
    node.connect(gain).connect(o.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + o.duration + 0.02);
  }

  noise(o: NoiseOptions): void {
    const ctx = this.ctx;
    if (!ctx || !this.ready || !this.noiseBuffer) return;
    const t = o.when ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filter ?? 'lowpass';
    filter.frequency.setValueAtTime(o.freq ?? 2000, t);
    if (o.freqEnd !== undefined) filter.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), t + o.duration);
    filter.Q.value = o.q ?? 0.8;
    const gain = ctx.createGain();
    const vol = o.volume ?? 0.3;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + (o.attack ?? 0.003));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.duration);
    src.connect(filter).connect(gain).connect(o.bus ?? this.sfxBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + o.duration + 0.02);
  }

  /** A looping white-noise source (unstarted, unconnected) for held sounds like wind. */
  createNoiseSource(): AudioBufferSourceNode | null {
    if (!this.ctx || !this.noiseBuffer) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}

export const audio = new AudioEngine();

export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
