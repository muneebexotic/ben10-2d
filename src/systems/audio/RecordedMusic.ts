import { RECORDED_MIX, RECORDINGS, type Recording } from '../../config/music';
import { audio } from './AudioEngine';

/**
 * Plays a recorded track (config/music.ts) through the music bus: decoded once
 * and cached, started on the audio clock, looped between its loop points. One
 * mixed file stands in for the sequencer's two layers: as human Ben the mix is
 * a little darker and quieter, and transforming opens it up.
 */
export class RecordedMusic {
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly loading = new Map<string, Promise<AudioBuffer | null>>();
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private wanted: string | null = null;
  private intensity = 0;

  has(name: string): boolean {
    return name in RECORDINGS;
  }

  /** Starts the recording (once it's decoded: until then, nothing plays). */
  play(name: string): void {
    this.stop(RECORDED_MIX.fadeS * 1000);
    this.wanted = name;
    const rec = RECORDINGS[name];
    void this.load(rec).then((buffer) => {
      if (buffer && this.wanted === name && !this.source) this.start(rec, buffer);
    });
  }

  /** Loads a recording ahead of time (a chapter loading its music). */
  preload(name: string): void {
    if (this.has(name)) void this.load(RECORDINGS[name]);
  }

  stop(fadeMs: number): void {
    this.wanted = null;
    const ctx = audio.ctx;
    const src = this.source;
    const gain = this.gain;
    this.source = null;
    this.filter = null;
    this.gain = null;
    if (!ctx || !src || !gain) return;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, fadeMs / 4000);
    src.stop(ctx.currentTime + fadeMs / 1000 + 0.2);
    setTimeout(() => gain.disconnect(), fadeMs + 400);
  }

  setIntensity(value: number): void {
    this.intensity = value;
    this.applyMix(RECORDED_MIX.glideS);
  }

  /** The record scratch: cut dead, back after `gapMs`. */
  scratch(gapMs: number): void {
    const ctx = audio.ctx;
    if (!ctx || !this.gain) return;
    const t = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setTargetAtTime(0.0001, t, 0.012);
    this.gain.gain.setTargetAtTime(this.level(), t + gapMs / 1000, 0.12);
  }

  private level(): number {
    const M = RECORDED_MIX;
    return M.humanGain + (M.alienGain - M.humanGain) * this.intensity;
  }

  private applyMix(glideS: number): void {
    const ctx = audio.ctx;
    if (!ctx || !this.filter || !this.gain) return;
    const M = RECORDED_MIX;
    // The cutoff moves on a log scale, so half intensity sounds half open.
    const hz = M.humanCutoffHz * Math.pow(M.alienCutoffHz / M.humanCutoffHz, this.intensity);
    this.filter.frequency.setTargetAtTime(hz, ctx.currentTime, glideS);
    this.gain.gain.setTargetAtTime(this.level(), ctx.currentTime, glideS);
  }

  private load(rec: Recording): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(rec.url);
    if (cached) return Promise.resolve(cached);
    const pending = this.loading.get(rec.url);
    if (pending) return pending;
    const ctx = audio.ctx;
    if (!ctx) return Promise.resolve(null);
    const p = fetch(rec.url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} ${rec.url}`))))
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(rec.url, buffer);
        return buffer;
      })
      .catch(() => null)
      .finally(() => this.loading.delete(rec.url));
    this.loading.set(rec.url, p);
    return p;
  }

  private start(rec: Recording, buffer: AudioBuffer): void {
    const ctx = audio.ctx;
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    if (!rec.once) {
      src.loop = true;
      src.loopStart = rec.loopStart;
      src.loopEnd = Math.min(rec.loopEnd, buffer.duration);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    const trim = Math.pow(10, (rec.gainDb ?? 0) / 20);
    const out = ctx.createGain();
    out.gain.value = trim;
    gain.gain.value = 0.0001;
    src.connect(filter).connect(gain).connect(out).connect(audio.musicBus);
    this.source = src;
    this.filter = filter;
    this.gain = gain;
    this.applyMix(0.01);
    // Fade in from the start of the file.
    gain.gain.setTargetAtTime(this.level(), ctx.currentTime, RECORDED_MIX.fadeS / 4);
    src.start(ctx.currentTime + 0.05);
    src.onended = () => {
      if (this.source === src) this.source = null;
    };
  }
}
