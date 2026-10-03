// Injected into the page before any game code runs (see scripts/bench.mjs).
// Seeds Math.random so runs are comparable, then times every game step:
// update (scenes, physics, tweens) and render (draw-list building and WebGL
// submission) separately, in main-thread milliseconds. Optional WebGL call
// counting gives draw calls, texture binds and shader switches per frame.
(() => {
  const cfg = window.__benchConfig || {};

  let seed = (cfg.seed ?? 12345) >>> 0;
  Math.random = function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const CAP = 60000;
  const B = {
    recording: false,
    n: 0,
    update: new Float32Array(CAP),
    render: new Float32Array(CAP),
    interval: new Float32Array(CAP),
    delta: new Float32Array(CAP),
    draws: new Uint16Array(CAP),
    binds: new Uint16Array(CAP),
    programs: new Uint16Array(CAP),
    targets: new Uint16Array(CAP),
    longTasks: [],
    heapStart: 0,
    heapEnd: 0,
    attached: false,
  };
  window.__bench = B;

  try {
    new PerformanceObserver((list) => {
      if (!B.recording) return;
      for (const e of list.getEntries()) B.longTasks.push(e.duration);
    }).observe({ type: 'longtask' });
  } catch {
    // No long task API: the report shows none.
  }

  const gl = { draws: 0, binds: 0, programs: 0, targets: 0 };
  // Render-target allocations are rare in a healthy frame, so they are always counted.
  const allocs = { framebuffers: 0, textures: 0 };
  for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    if (!proto) continue;
    for (const [name, key] of [['createFramebuffer', 'framebuffers'], ['createTexture', 'textures']]) {
      const orig = proto[name];
      proto[name] = function (...args) {
        if (B.recording) allocs[key]++;
        return orig.apply(this, args);
      };
    }
  }
  if (cfg.countGl) {
    const wrap = (proto, name, key) => {
      const orig = proto[name];
      if (typeof orig !== 'function') return;
      proto[name] = function (...args) {
        gl[key]++;
        return orig.apply(this, args);
      };
    };
    for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
      if (!proto) continue;
      for (const n of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) wrap(proto, n, 'draws');
      wrap(proto, 'bindTexture', 'binds');
      wrap(proto, 'useProgram', 'programs');
      wrap(proto, 'bindFramebuffer', 'targets');
    }
  }

  // Web Audio sources playing right now (oscillators and buffer sources). The leak check expects
  // this to settle back to the music's own voices between scenes. "Held" sources are the ones nobody
  // has scheduled a stop() for (loops such as XLR8's wind, Heatblast's charge hum): they never end on
  // their own, so one left over from a finished level is a leak.
  const live = new Set();
  Object.defineProperty(B, 'audioSources', { get: () => live.size });
  Object.defineProperty(B, 'audioHeld', { get: () => [...live].filter((n) => !n.__benchStopped).length });
  // AudioBufferSourceNode declares its own start() and stop(), so both prototypes are wrapped.
  for (const proto of [window.AudioScheduledSourceNode?.prototype, window.AudioBufferSourceNode?.prototype]) {
    if (!proto || !Object.prototype.hasOwnProperty.call(proto, 'start')) continue;
    const start = proto.start;
    proto.start = function (...args) {
      if (!live.has(this)) {
        live.add(this);
        this.addEventListener('ended', () => live.delete(this));
      }
      return start.apply(this, args);
    };
    const stop = proto.stop;
    if (stop) {
      proto.stop = function (...args) {
        this.__benchStopped = true;
        return stop.apply(this, args);
      };
    }
  }

  B.start = () => {
    B.n = 0;
    B.longTasks = [];
    allocs.framebuffers = allocs.textures = 0;
    B.heapStart = performance.memory?.usedJSHeapSize ?? 0;
    B.recording = true;
  };
  B.stop = () => {
    B.recording = false;
    B.heapEnd = performance.memory?.usedJSHeapSize ?? 0;
    const n = B.n;
    return {
      n,
      update: Array.from(B.update.subarray(0, n)),
      render: Array.from(B.render.subarray(0, n)),
      interval: Array.from(B.interval.subarray(0, n)),
      delta: Array.from(B.delta.subarray(0, n)),
      draws: Array.from(B.draws.subarray(0, n)),
      binds: Array.from(B.binds.subarray(0, n)),
      programs: Array.from(B.programs.subarray(0, n)),
      targets: Array.from(B.targets.subarray(0, n)),
      longTasks: B.longTasks.slice(),
      heapStart: B.heapStart,
      heapEnd: B.heapEnd,
      fbAllocs: allocs.framebuffers,
      texAllocs: allocs.textures,
      renderPool: window.__game?.renderer?.drawingContextPool?.agePool?.length ?? null,
    };
  };

  const attach = () => {
    const game = window.__game;
    const loop = game && game.loop;
    // Wait for game.start(): before it the loop's callback is a placeholder that start() replaces.
    if (!loop || !game.isRunning || typeof loop.callback !== 'function' || !game.events) {
      setTimeout(attach, 20);
      return;
    }
    let tStep = 0;
    let tPost = 0;
    let lastTime = 0;
    game.events.on('poststep', () => {
      tPost = performance.now();
    });
    const original = loop.callback;
    loop.callback = function (time, delta) {
      tStep = performance.now();
      tPost = 0;
      gl.draws = gl.binds = gl.programs = gl.targets = 0;
      original(time, delta);
      const end = performance.now();
      if (B.recording && B.n < CAP && tPost > 0) {
        const i = B.n++;
        B.update[i] = tPost - tStep;
        B.render[i] = end - tPost;
        B.interval[i] = lastTime ? time - lastTime : 0;
        B.delta[i] = delta;
        B.draws[i] = gl.draws;
        B.binds[i] = gl.binds;
        B.programs[i] = gl.programs;
        B.targets[i] = gl.targets;
      }
      lastTime = time;
    };
    B.attached = true;
  };
  attach();
})();
