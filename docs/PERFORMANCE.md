# Performance

The goal: the game never lags, stutters or jitters, on a mid-range Android phone and on 90/120 Hz screens. This file has the budget every chapter must pass, how it is measured, what to check on a real phone, and the record of the performance pass that set it up (what was measured, what changed, before and after numbers, and what was checked and left alone).

## The budget

`npm run bench` checks it and exits with an error when a number is over. **Every new chapter must pass it** (add the chapter's heaviest moment to `scripts/bench/scenarios.mjs` first), and so must any change to a hot path (effects, rendering, HUD, physics).

Measured on the emulated wide phone at 4x CPU throttle, per scenario:

| Metric | Limit |
|---|---|
| Mean CPU per frame | 26 ms |
| 95th percentile CPU per frame | 45 ms |
| 99th percentile CPU per frame | 95 ms |
| Frames whose game step took over 50 ms | 8 per 12 s scenario |
| Longest GC pause | 30 ms |
| GCs per second | 4 |
| WebGL framebuffers created per second | 0.5 |
| Render-target pool size | 4 |
| Heap kept after a scenario (after a forced GC) | 4.5 MB |
| Leak check: EventBus and game listeners, textures | no growth across chapter cycles |
| Leak check: heap after GC, first cycle to the lowest of the last three | 2 MB |
| Leak check: held sounds after leaving a level | 0 |

The limits sit about 20-30% above the worst run measured after this pass (noise included). When a chapter goes over, profile it (`--profile --unminified`, `--alloc`) before raising a limit, and write down why in `DECISIONS.md` if you do.

```
npm run bench                               # build, all scenarios at 4x and 6x on the phone, check the budget (about 12 min)
npm run bench -- --only=ch3-frog --throttle=4
npm run bench -- --leak --leak-only         # chapter switching only: listeners, textures, heap, held sounds
npm run bench -- --device=desktop           # 1280x720, no touch controls
npm run bench -- --gl                       # also count draw calls, texture binds, shader switches
npm run bench -- --profile --unminified     # CPU profiles in bench-results/, hottest functions listed
npm run bench -- --alloc                    # allocation sampling: which functions make garbage
npm run bench -- --load                     # boot to title on Slow 4G, cold and warm cache
npm run bench -- --dist=<dir> --label=old   # benchmark another build (A/B: build an older commit with `vite build --mode bench --outDir <dir>`)
npm run bench -- --query=debug=1            # add URL switches to every scenario
```

Results go to `bench-results/` (ignored by git). Headless numbers move by about 10% between runs and more between machines, so compare a change against the old build on the same machine (`--dist`), not against the numbers below.

## How it is measured

`npm run bench` builds the game in bench mode (`vite build --mode bench`: the release build plus the playtest hooks `?god=1` and `window.__game`), serves it the way Vercel does (brotli, ETags, the `vercel.json` cache headers) and plays each scenario in headless Chromium on an emulated wide phone (915x412 CSS px, 20:9, touch, on-screen controls shown, sound on), with the CPU throttled 4x (about a mid-range Android) and 6x (a low-end one). A scripted player transforms, swaps, attacks, jumps and uses specials non-stop with `?god=1`, and `Math.random` is seeded so runs are comparable. Each scenario warms up for 4 s, then records 12 s.

| Scenario | What it plays |
|---|---|
| `ch1-forest` | Chapter 1 forest run at night: parallax, night lighting, campfires, drones |
| `ch1-boss` | The Hunter-Killer drone: boss attacks, explosions |
| `ch2-convoy` | The Rustbucket roof ride and convoy: scrolling highway, trucks, junk |
| `ch2-boss` | ROADBREAKER |
| `ch3-blackout` | Chapter 3 blackout: darkness, Wildmutt's senses, lurkers |
| `ch3-frog` | KING CROAK |
| `ch4-arcade` | Chapter 4's GAME ZONE: neon, cabinets, the TOKEN TOONS, Kevin as a buddy |
| `ch4-station` | Rosewood station: trains, track-bots, turrets |
| `ch4-kevin` | KEVIN 11: copies, the coils, the hybrid |
| `misfire` | Training with misfires on CHAOS: the transform gag on every swap |
| `stress` | A synthetic worst case: three explosions every 450 ms on top of the KING CROAK brawl |

What it records:

- **CPU time per frame** (the budget metric): main-thread milliseconds of the game's own step, split into **update** (scenes, physics, tweens, game logic) and **render** (building draw lists and issuing WebGL calls). Mean, p95, p99 and max.
- **Long steps:** frames whose step alone took over 50 ms (a visible hitch on any device).
- **GC:** minor and major collections and their pauses on the main thread, from a Chromium trace.
- **Heap:** JS heap after a forced GC before and after each scenario (retained growth), and the leak check.
- **Render targets:** WebGL framebuffers created per second, and the size of Phaser's render-target pool. Both stay flat in steady play.
- **Draw calls, texture binds, shader switches** per frame (`--gl`, a separate pass because counting adds overhead).
- **FPS and 1% low FPS:** reported, not budgeted.
- **Leak check** (`--leak`): plays Chapter 1's boss, Chapter 2's convoy and boss, Chapter 3's frog, Chapter 4's station and KEVIN 11, and Training in turn, leaving each one mid-action (transformed, running, charging), then goes to Chapter Select; repeated. After every cycle it counts EventBus and game listeners, textures, display objects, tweens, timers, live Web Audio sources and held sounds (sources nobody scheduled a stop for), and the heap after a forced GC. Then it restarts Training eight times as XLR8 at full speed and counts held sounds each time.

**Why not FPS.** Headless Chromium has no GPU. It draws WebGL in software (SwiftShader) and then reads every frame back for its software compositor, which takes 40-60 ms a frame on its own: headless runs at about 40-49 FPS unthrottled and 8-15 FPS throttled, whatever the game does. That measures the container. The game's own CPU time per frame doesn't depend on that and scales with the throttle, so it's what the budget limits. Under throttle the game also runs in slow motion (frames are clamped at 34 ms), which doesn't change the per-frame costs. How to read the numbers: unthrottled on the machine that set the budget, the game's own work takes 2.8-4.9 ms per frame across the scenarios; at 4x, 12-20 ms. A phone at 60 Hz has 16.7 ms per frame for everything (game, browser, GPU), at 120 Hz 8.3 ms. So if 4x on that machine were exactly a mid-range phone, the heaviest moments would fill most of a 60 Hz frame with the game's own work. How close that comparison is (a phone runs WebGL on a real GPU driver, so its render share differs) is what the real-phone check below settles.

## Checking on a real phone

### The autobench (`?autobench=1`): the phone tests itself

Open `https://ben10-2d.vercel.app/?autobench=1` on the phone (in Chrome, not an app's built-in browser), plugged in, and tap START. The game then plays every heavy scene by itself with the scripted player and god mode (the same moves as `npm run bench`), on a throwaway save file held in memory (the real save is never touched), and ends on a report with a COPY button. About 24 minutes for 80 runs (QUICK: about 14); the screen stays on (Wake Lock) and it goes fullscreen like normal play.

What it plays, each for 3 s of warm-up and 12 s of measurement (4 s more warm-up on a scene's first run and after a page reload, which compile shaders and upload textures the later runs reuse):

1. **blank**: an empty canvas (the browser and compositor alone), then the same with `css=smooth`.
2. **calm** (Chapter 1's forest at night, standing still) and the heavy scenes: the four bosses (`ch1-boss`, `ch2-boss`, `ch3-frog`, `ch4-kevin`), `ch2-convoy`, `ch3-blackout`, `ch4-arcade` and `misfire` (Training on CHAOS). Each runs normally (`base`), then once with each bisect switch: `fx=0`, `particles=0`, `bg=0`, `scale=0.5`, `bodies=1` and `governor=0`.
3. **Extras** on `calm` and `ch4-arcade`: `orphan=0`, `css=smooth`, `audio=0`, and `all-off` (`fx`, `particles` and `bg` together).
4. **Drift**: the first base run again, to see whether the phone slowed down over the session (heat, power saving).
5. **Context variants**: the page reloads three times (default, `ctx=desync`, `ctx=lean`) and plays `calm` and `ch4-arcade` on each. Tap once on each reload to go back to fullscreen, or leave it: it carries on after 8 s.

Each run starts at Q0 with a fresh governor. `?autobench=1&quick=1` halves the times, `&only=calm,ch3-frog` limits the scenes, `&contexts=0` skips the reloads, and `?autobench=report` shows the last report again (it is kept on the phone, partial ones too).

The report has the device (user agent, devicePixelRatio, screen, measured refresh rate, cores, memory, battery), the GPU (WebGL renderer string, GPU timer support), the canvas (backing size against CSS size and physical pixels, `image-rendering`), the WebGL context attributes in use on every page, warnings, then one row per run:

| Column | What it is |
|---|---|
| `FPS`, `1%LO` | Frames per second and the 1% low (the same definitions as the `?debug=1` meter) |
| `CPU`, `P99`, `REN` | The game's own step per frame (mean, 99th percentile) and its render-submission part |
| `IDLE` | Mean frame gap minus mean CPU: time each frame waited on something other than the game's JavaScript (the GPU, the browser's GPU process, the compositor, vsync) |
| `GPU` | GPU time per frame from `EXT_disjoint_timer_query` when the browser has it; otherwise (`~`) how long a one-pixel `readPixels` waited after the frame was submitted, measured for 1.5 s at the end of each run (the GPU and driver time the game doesn't see) |
| `DRAW`, `FB`, `UPKB`, `TEX` | Draw calls, render-target binds, kilobytes of vertex data uploaded, texture uploads, per frame |
| `JNK%` | Frames over 1.5x the median gap (visible stutter) |
| `Q0/1/2%` | Time at each quality level |

Then the median effect of each switch against the same scene's base run, the context variants against a freshly loaded default page, and the drift check. Flags on a row: `ended` (the level finished during the run), `died`, `interrupted` (the tab was hidden or paused twice), `nosound`, `frozen` (gameplay sat in one hit-stop for over 1.5 s: the row measured a still scene, like the GAME ZONE's before BUGS.md L3).

It warns about a screen running at 30 Hz (battery saver), a limited refresh rate, low battery off the charger, an in-app browser, Data Saver, not being fullscreen and page zoom.

**The bisect switches** also work by hand, alone or together, with or without `?debug=1` (the readout lists the active ones):

| Switch | Turns off |
|---|---|
| `fx=0` | Camera filters (vignette, the transform's barrel pulse, the misfire sepia, the death desaturate), night lighting (the lightmap pass), additive glow flashes and rays, camera flashes |
| `particles=0` | Every particle emitter (bursts, trails, campfires, fireflies, thrusters) |
| `bg=0` | Skies, parallax layers and backdrop walls |
| `scale=0.5` | Renders the canvas at half resolution (the browser scales it up; pixel text turns to mush, on purpose) |
| `bodies=0` / `bodies=1` | Physics body outlines (`?debug=1` draws them unless `bodies=0`) |
| `governor=0` | The quality governor: stays at Q0 |
| `orphan=0` | Phaser's own vertex uploads: overwrite the front of one buffer the frame's earlier draws still read (`bufferSubData`). The game re-specifies the buffer instead (`bufferData`), the fix from the first phone report below; `orphan=0` brings the old path back for comparison |
| `css=smooth` | `image-rendering: pixelated` on the canvas (blurry, but lets the browser scale it like a video) |
| `audio=0` | Sound |
| `ctx=desync` / `ctx=lean` | Page-load only: a desynchronized (low-latency) WebGL context, or one without the depth and stencil buffers |

### WebGL context and canvas review (Phase 1 of the real-phone pass)

What the game asks for, and what could cost compositing on Android (the autobench measures each one):

- **Context attributes** (Phaser 4 with `pixelArt`): `alpha: false` (good: an opaque canvas needs no blending with the page), `antialias: false` (good), `preserveDrawingBuffer: false` (good: the browser can swap instead of copy), `premultipliedAlpha: true` (no effect with an opaque canvas), `desynchronized: false`, `powerPreference: 'high-performance'` (a hint; it picks the discrete GPU on dual-GPU laptops, phones mostly ignore it). Two buffers the game never uses: Phaser 4 always asks for a **depth** buffer, and `stencil` defaults to on, but the game draws no masks and no depth-tested geometry. On a tiled mobile GPU unused attachments can cost memory bandwidth every frame unless the driver discards them. `ctx=lean` measures it.
- **Canvas scaling.** The canvas's drawing buffer is the game's resolution (799x360 on a 20:9 phone); the browser scales it up to the screen (about 3x in physical pixels) with `image-rendering: pixelated`. A nearest-neighbour quad can't be handed to the phone's display hardware as an overlay (overlays filter smoothly), so Chrome's compositor draws the whole canvas again every frame at the screen's full resolution, a GPU pass the game can't see. `css=smooth` and the `blank` runs measure it.
- **Layering.** One canvas inside two plain boxes (`#frame`, `#game`); nothing else is composited over it during play (the rotate-your-phone screen is `display: none`). Nothing to change.
- **Vertex uploads.** Phaser 4 uploads each batch with `bufferSubData` into the same 1.8 MB buffer from offset 0, many times a frame (about 100 draw calls on the phone). Desktop drivers rename the buffer for free; Mali copies the whole buffer or waits for the GPU. This was the phone's bottleneck: see the next section.

### The first phone report (Mali-G78, Chrome 154, Android 10)

The owner's phone: 60 Hz, 8 cores, 4 GB, canvas 755x360 scaled to 2265x1080 physical pixels, no GPU timer queries (the GPU column is the `readPixels` wait, good for comparisons only), charging during the 25-minute run. Before the run, by hand with `?debug=1`: CPU 3.5 to 4.9 ms a frame, yet 35 to 49 FPS with 1% lows of 15 to 27 and the governor at Q2 the whole time.

| Scene (base) | FPS | 1% low | CPU ms | GPU~ ms | Draws | Quality Q0/1/2 % |
|---|---|---|---|---|---|---|
| calm (first run) | 60.1 | 55 | 3.5 | 34.1 | 116 | 100/0/0 |
| ch1-boss | 40.6 | 28 | 3.5 | 43.2 | 102 | 0/0/100 |
| ch2-convoy | 35.6 | 27 | 4.8 | 57.3 | 97 | 0/0/100 |
| ch2-boss | 41.9 | 27 | 4.4 | 45.2 | 92 | 0/0/100 |
| ch3-blackout | 39.4 | 28 | 4.5 | 55.3 | 87 | 0/0/100 |
| ch3-frog | 38.5 | 28 | 5.0 | 54.0 | 98 | 0/0/100 |
| ch4-arcade | 27.1 | 14 | 11.3 | 64.5 | 105 | 0/0/100 |
| ch4-kevin | 35.5 | 27 | 5.9 | 58.3 | 113 | 0/0/100 |
| misfire | 55.7 | 29 | 3.4 | 41.8 | 65 | 44/56/0 |
| calm (repeated at the end) | 38.1 | 27 | 4.3 | 53.3 | 115 | 0/0/100 |

What it showed:

- **Not the CPU, not fill rate.** The game's CPU time stayed at 3 to 11 ms while frames took 25 to 37 ms; `scale=0.5` (a quarter of the pixels) changed nothing (-1% median).
- **The vertex uploads.** `orphan=1` (re-specifying the buffer for each upload instead of overwriting it in place) took the GAME ZONE from 27 to 53 FPS and the GPU wait from 64 to 20 ms, and held calm at 60 FPS with the GPU wait at 5 ms instead of 34, in the runs between ones that dropped to 36-50. Removing whole layers helped in proportion to the batches they remove, not the pixels: `bg=0` +27%, `particles=0` +11%, `fx=0` +8%, all three together 60 FPS on the arcade. Each batch made the driver copy (or wait on) the shared vertex buffer, about 100 times a frame.
- **The governor can't help:** it sat at Q2 everywhere and `governor=0` changed nothing, because its levers (particles, lights, filters) don't touch the uploads.
- **Heat.** The calm scene ran at 60 FPS first and 38 FPS when repeated at the end (DRIFT -36%): the phone throttled while charging under that load, so later rows are pessimistic. Comparisons above are against neighbouring runs.
- **Not it:** `css=smooth` (0%), the context variants (desync +11 FPS on calm but -5 on the arcade, lean +6 and -1: noise and heat).

**The fix:** vertex uploads re-specify the buffer by default (`systems/RenderSwitches.ts`; `orphan=0` brings Phaser's path back). Headless it costs nothing (A/B at 4x: ch1-forest 28.3 vs 27.2 ms, ch4-arcade 30.1 vs 32.5, ch4-station 28.8 vs 32.8, within noise). The second phone report is next.

### The second phone report (build 564135d)

The same phone, 46% battery and charging, with the fix on by default. Base runs, before (the first report, Phaser's uploads) and after:

| Scene (base) | FPS | 1% low | CPU ms | GPU~ ms | Quality Q0 % |
|---|---|---|---|---|---|
| calm (first run) | 60.1 → **60.1** | 55 → **56** | 3.5 → 5.6 | 34.1 → **5.5** | 100 → **100** |
| ch1-boss | 40.6 → **60.1** | 28 → **55** | 3.5 → 5.1 | 43.2 → **4.6** | 0 → **100** |
| ch2-convoy | 35.6 → **60.1** | 27 → **56** | 4.8 → 5.3 | 57.3 → **6.1** | 0 → **100** |
| ch2-boss | 41.9 → **60.1** | 27 → **55** | 4.4 → 8.1 | 45.2 → **9.6** | 0 → **100** |
| ch3-blackout | 39.4 → **60.0** | 28 → **56** | 4.5 → 5.9 | 55.3 → **5.3** | 0 → **100** |
| ch3-frog | 38.5 → **60.1** | 28 → **52** | 5.0 → 7.9 | 54.0 → **8.3** | 0 → **100** |
| ch4-kevin | 35.5 → **60.0** | 27 → **56** | 5.9 → 7.4 | 58.3 → **5.2** | 0 → **100** |
| misfire | 55.7 → **60.1** | 29 → **56** | 3.4 → 4.2 | 41.8 → **4.7** | 44 → **100** |
| calm (repeated at the end) | 38.1 → **60.0** | 27 → **56** | 4.3 → 5.6 | 53.3 → **5.8** | 0 → **100** |
| ch4-arcade | 27.1 → 60.0 | 14 → 58 | 11.3 → 12.0 | 64.5 → 14.9 | 0 → 100 (frozen: see below) |

- **The goal is met in every scene it measured:** FPS at the refresh rate in every base run (60.0 to 60.1), 1% lows of 52 to 58 against the 51 asked for, and Q0 the whole time. `orphan=0` in the same report puts Phaser's path back: the calm scene's GPU wait goes from 5.5 to 34.3 ms, and the GAME ZONE drops to 57 FPS with a 1% low of 30 and the governor stepping down.
- **No heat drift this time:** the calm scene ran 60.1 FPS first and 60.0 when repeated at the end of the run (it fell from 60 to 38 in the first report).
- **CPU reads higher than before** (5 to 8 ms against 3.5 to 5) because the phone now runs at Q0 instead of Q2 (full particles, lights and filters). It is well under the 16.7 ms a 60 Hz frame allows.
- **The bisect switches no longer move FPS** (every run at the refresh rate), and their GPU-wait medians are within 1 ms of base: there is nothing left on this phone for them to find.
- **The GAME ZONE was frozen** in every one of its runs, in both reports: the first arcade cabinet the scripted player merged into fired GAME OVER on every frame and held the world in hit-stop for good (BUGS.md L3, fixed after this report). Its pixels piled up instead of fading, which is the 1.2 to 2.0 MB of vertex data a frame (every other scene: 0.1 to 0.2 MB) and why `particles=0` halved its CPU. Its rows measure a frozen room full of particles, not the arcade. With the fix, headless, the real GAME ZONE costs 32 to 35 ms at 4x (34.8, 32.0, 34.2; the frozen one measured 30 to 32), in line with Chapter 4's station; a profile shows no hot spot of the game's own. Its real numbers on the phone need one more run: `?autobench=1&only=ch4-arcade` (about 6 minutes).

### `?debug=1` by hand

Open the game on the phone with `?debug=1` added to the URL (for example `https://<your-deploy>/?debug=1`, or `?debug=1&level=ch3&start=cp-frog` to go straight to a fight). The top-left readout updates four times a second:

```
X 120 Y 14 VX 250 VY 0 G true Q0
CPU 4.1MS P99 7.9 | 60FPS 1%LOW 57 HEAP 14MB RT2
OMNI active 21.4 DRONES 3
```

| Readout | What it is | Good | Worth reporting |
|---|---|---|---|
| `Q0` | Quality level from the frame-rate governor: Q0 full effects, Q1 60% particles, Q2 35% particles and no vignette | Q0 the whole time | Q1 or Q2 (it stepped down because FPS stayed under 50 for a second) |
| `CPU 4.1MS` | The game's own CPU per frame (update + render submission), averaged over the last 300 frames (5 s at 60 Hz) | Under 8 ms on a 60 Hz phone, under 5 ms at 120 Hz | Over 12 ms |
| `P99 7.9` | The slowest 1% of frames' CPU | Under 16 ms at 60 Hz | Over 20 ms |
| `60FPS` | Frames per second (the screen's real rate) | The screen's refresh rate: 60, 90 or 120 | More than 10% under it during a fight |
| `1%LOW 57` | FPS of the slowest 1% of frames: stutter shows here first | At least 85% of the refresh rate (51 at 60 Hz, 102 at 120 Hz) | Under 45 at 60 Hz |
| `HEAP 14MB` | JS heap (Chrome on Android only) | Goes up and down; the same range in every chapter | Climbing every time you change chapter |
| `RT2` | Phaser's render-target pool | 1 to 4, steady | Climbing past 8 |

The readout draws every physics body each frame, which costs about 10% CPU (measured below), so CPU with `?debug=1` reads slightly high.

What to do, about 30 seconds each, noting the worst `FPS`, `1%LOW`, `CPU` and `Q` you see:

1. **Chapter 1 forest at night** (`?debug=1&level=ch1&start=cp-cliff`): run right through the campfires and drones.
2. **Hunter-Killer** (`?debug=1&level=ch1&start=cp-arena`): fight it as Heatblast, fireballs and Fire Burst.
3. **Chapter 2 roof ride** (`?debug=1&level=ch2&start=cp-convoy`) and **ROADBREAKER** (`...&start=cp-arena`).
4. **Chapter 3 blackout** (`?debug=1&level=ch3&start=cp-dark`) and **KING CROAK** (`...&start=cp-frog`).
5. **Misfire gag:** `?debug=1&training=1`, pause, MISFIRES: CHAOS, then swap aliens again and again.
6. **Leaks:** play Chapter 1 to Chapter 3 back to back (Chapter Select between them), and note `HEAP` and `RT` at the start of each chapter: they should be about the same.
7. **High refresh (if the phone has 90 or 120 Hz):** with the phone set to its highest rate, `FPS` should read 90 or 120. Jump as Ben next to a ledge you know is just reachable at 60 Hz (desktop): it's just as reachable. Heatblast's embers, XLR8's trail and the fireflies look as dense as at 60 Hz, and nothing eases in faster.
8. **Feel:** stick and buttons respond on the first frame, no hitch when transforming, when the boss explodes or when a cutscene starts.

If anything is off, the most useful report is the scenario, the phone model, its refresh rate, and the readout's second line at the worst moment.

## The performance pass (after Milestone 4)

No new features and no gameplay changes. Everything below was measured first, changed only where the numbers showed a problem or a clear growth risk, and measured again: the "before" build is the commit before this pass (`bef1d60`) with the same bench hooks, run on the same machine, alternating with the "after" build, two runs each, averaged.

### Results

All numbers are CPU milliseconds per frame on the emulated wide phone unless marked, the mean of two runs per build (longest GC, render-target pool and frames over 50 ms: the worst of the two). "Before → **after**".

**Phone, 4x CPU throttle** (the budget's setting):

| Scenario | CPU mean (ms) | CPU p99 (ms) | Render (ms) | GC / s | Longest GC (ms) | Framebuffers created / s | RT pool | Frames over 50 ms | FPS (headless) |
|---|---|---|---|---|---|---|---|---|---|
| ch1-forest | 26.1 → **18.7** (−28%) | 52.5 → 42.5 | 18.0 → 10.6 | 4.8 → 2.6 | 7.5 → 6.1 | 5.8 → 0.0 | 20 → 2 | 2 → 0 | 11.2 → 12.6 |
| ch1-boss | 17.4 → **13.5** (−22%) | 40.6 → 30.1 | 11.2 → 6.9 | 3.9 → 1.5 | 8.9 → 7.5 | 5.4 → 0.0 | 21 → 1 | 0 → 1 | 12.5 → 13.3 |
| ch2-convoy | 25.0 → **20.0** (−20%) | 53.6 → 66.3 | 17.7 → 11.7 | 5.3 → 2.7 | 6.3 → 10.2 | 5.7 → 0.1 | 19 → 2 | 2 → 3 | 10.7 → 11.2 |
| ch2-boss | 20.6 → **16.5** (−20%) | 59.0 → 47.0 | 13.5 → 8.6 | 4.1 → 2.4 | 12.7 → 6.0 | 6.0 → 0.1 | 21 → 2 | 3 → 2 | 11.3 → 12.9 |
| ch3-blackout | 20.8 → **17.3** (−17%) | 52.0 → 38.6 | 14.0 → 9.6 | 3.9 → 3.0 | 5.6 → 7.0 | 5.5 → 0.1 | 24 → 2 | 2 → 2 | 12.5 → 13.8 |
| ch3-frog | 22.8 → **18.9** (−17%) | 63.0 → 53.6 | 15.3 → 10.1 | 5.2 → 2.9 | 6.5 → 6.4 | 5.1 → 0.1 | 25 → 2 | 2 → 3 | 12.4 → 13.4 |
| misfire | 20.8 → **13.6** (−34%) | 68.3 → 42.5 | 14.2 → 7.2 | 5.3 → 1.5 | 10.1 → 11.4 | 3.3 → 0.0 | 26 → 2 | 4 → 1 | 13.4 → 14.9 |
| stress | 23.2 → **18.6** (−20%) | 54.7 → 54.8 | 14.6 → 9.5 | 3.6 → 1.8 | 19.3 → 19.8 | 5.3 → 0.1 | 21 → 2 | 4 → 4 | 11.6 → 12.5 |
| **all** | 22.1 → **17.1** (−22%) | 55.5 → 46.9 | 14.8 → 9.3 | 4.5 → 2.3 | 19.3 → 19.8 | 5.3 → 0.1 | 26 → 2 | 19 → 16 | |

One row reads worse: the Chapter 2 convoy's p99 (53.6 → 66.3 ms) while its mean and render time fell. p99 is the slowest one or two frames of a run; across every convoy run on this machine it was 49-62 ms before and 45-80 ms after, so its worst frames are about as bad as before, not better. Its frames over 50 ms went 2 → 3.

**Phone, 6x CPU throttle** (a low-end phone):

| Scenario | CPU mean (ms) | CPU p99 (ms) | Render (ms) | GC / s | Longest GC (ms) | Framebuffers created / s | RT pool | Frames over 50 ms | FPS (headless) |
|---|---|---|---|---|---|---|---|---|---|
| ch1-forest | 40.9 → **31.2** (−24%) | 83.2 → 65.4 | 28.1 → 18.3 | 4.5 → 2.4 | 11.8 → 8.8 | 6.5 → 0.1 | 22 → 2 | 28 → 7 | 9.3 → 9.9 |
| ch1-boss | 31.8 → **20.7** (−35%) | 54.5 → 41.0 | 23.7 → 11.6 | 5.3 → 1.2 | 12.3 → 11.5 | 5.7 → 0.0 | 20 → 1 | 5 → 1 | 9.6 → 11.2 |
| ch2-convoy | 38.7 → **34.1** (−12%) | 64.5 → 89.6 | 28.4 → 20.7 | 4.8 → 2.4 | 10.0 → 10.1 | 6.4 → 0.1 | 19 → 2 | 17 → 12 | 8.9 → 8.8 |
| ch2-boss | 37.3 → **27.3** (−27%) | 70.3 → 71.9 | 27.7 → 15.4 | 4.6 → 2.1 | 11.5 → 7.7 | 5.8 → 0.1 | 20 → 2 | 19 → 9 | 8.8 → 10.3 |
| ch3-blackout | 32.3 → **29.1** (−10%) | 66.4 → 59.0 | 22.2 → 16.5 | 3.6 → 2.5 | 10.1 → 9.2 | 6.2 → 0.1 | 21 → 2 | 9 → 11 | 10.6 → 11.1 |
| ch3-frog | 39.5 → **29.5** (−25%) | 84.3 → 73.4 | 27.2 → 16.4 | 4.2 → 2.6 | 10.1 → 9.8 | 5.3 → 0.1 | 24 → 2 | 19 → 13 | 9.4 → 10.6 |
| misfire | 31.9 → **21.5** (−33%) | 76.2 → 79.8 | 22.3 → 11.5 | 5.0 → 1.4 | 9.1 → 11.8 | 3.8 → 0.1 | 26 → 2 | 9 → 4 | 11.2 → 12.6 |
| stress | 39.2 → **30.7** (−22%) | 87.3 → 74.1 | 26.4 → 17.0 | 3.0 → 1.5 | 28.1 → 12.3 | 5.4 → 0.1 | 25 → 2 | 21 → 11 | 8.8 → 9.9 |
| **all** | 36.5 → **28.0** (−23%) | 73.3 → 69.3 | 25.8 → 15.9 | 4.4 → 2.0 | 28.1 → 12.3 | 5.6 → 0.1 | 26 → 2 | 127 → 68 | |

**Desktop (1280x720, no touch controls), 4x, one run each** (so differences of a few percent are noise). The desktop's 16:9 view was already a whole number of pixels and has no touch overlay, so it gains less:

| Scenario | CPU mean (ms) | CPU p99 (ms) | Render (ms) | GC / s | Longest GC (ms) | Framebuffers created / s | RT pool | Frames over 50 ms | FPS (headless) |
|---|---|---|---|---|---|---|---|---|---|
| ch1-forest | 16.5 → **16.7** (+1%) | 32.5 → 39.8 | 10.8 → 9.7 | 2.9 → 2.9 | 16.5 → 4.6 | 0.0 → 0.0 | 2 → 2 | 0 → 0 | 15.5 → 15.1 |
| ch1-boss | 10.4 → **9.8** (−6%) | 20.1 → 21.6 | 6.4 → 5.4 | 3.4 → 1.6 | 3.9 → 7.4 | 0.0 → 0.0 | 1 → 1 | 0 → 0 | 18.1 → 18.6 |
| ch2-convoy | 16.0 → **15.9** (−0%) | 43.8 → 44.5 | 10.0 → 8.7 | 3.5 → 2.7 | 5.2 → 5.7 | 0.1 → 0.1 | 2 → 2 | 0 → 0 | 14.7 → 14.5 |
| ch2-boss | 14.0 → **14.8** (+5%) | 34.5 → 38.4 | 8.2 → 7.4 | 3.8 → 2.8 | 6.0 → 5.4 | 0.0 → 0.1 | 2 → 2 | 0 → 0 | 17.0 → 16.9 |
| ch3-blackout | 16.7 → **16.3** (−3%) | 36.8 → 49.5 | 10.5 → 9.6 | 3.6 → 3.0 | 6.9 → 4.9 | 0.0 → 0.1 | 2 → 2 | 0 → 1 | 15.7 → 15.6 |
| ch3-frog | 16.7 → **15.8** (−5%) | 39.3 → 58.7 | 10.5 → 8.2 | 3.8 → 3.0 | 5.0 → 5.7 | 0.0 → 0.0 | 2 → 2 | 0 → 2 | 16.5 → 16.5 |
| misfire | 14.9 → **11.1** (−26%) | 36.7 → 33.7 | 9.4 → 5.7 | 3.5 → 1.7 | 5.7 → 4.5 | 0.0 → 0.0 | 2 → 2 | 1 → 1 | 17.1 → 19.2 |
| stress | 18.6 → **15.3** (−18%) | 55.1 → 37.9 | 10.9 → 8.1 | 2.7 → 1.8 | 6.7 → 20.4 | 0.1 → 0.0 | 2 → 2 | 2 → 0 | 14.7 → 16.1 |
| **all** | 15.5 → **14.4** (−7%) | 37.4 → 40.5 | 9.6 → 7.9 | 3.4 → 2.4 | 16.5 → 20.4 | 0.0 → 0.0 | 2 → 2 | 3 → 4 | |

**WebGL calls per frame** (phone, 4x, `--gl`). Baked shapes are drawn as textured quads that batch with sprites, so draw calls and shader switches drop by about a third; each baked shape is its own small texture, so texture binds go up in some scenes:

| Scenario | Draw calls / frame | Texture binds / frame | Shader switches / frame | Render targets bound / frame |
|---|---|---|---|---|
| ch1-forest | 63 → 45 | 60 → 77 | 47 → 33 | 4 → 4 |
| ch1-boss | 42 → 31 | 42 → 56 | 32 → 24 | 4 → 3 |
| ch2-convoy | 59 → 41 | 80 → 73 | 50 → 34 | 4 → 4 |
| ch2-boss | 50 → 35 | 63 → 57 | 43 → 31 | 4 → 3 |
| ch3-blackout | 46 → 33 | 58 → 53 | 39 → 28 | 4 → 4 |
| ch3-frog | 49 → 34 | 60 → 62 | 40 → 27 | 4 → 4 |
| misfire | 43 → 28 | 34 → 48 | 35 → 22 | 4 → 3 |
| stress | 52 → 36 | 64 → 65 | 42 → 29 | 4 → 4 |

**Why update went up while render went down.** A baked shape renders into its texture the moment it changes, which happens inside the update step, so what it still costs now counts as update instead of render. Profiling KING CROAK (unminified builds, 4x): the redraws take about 0.9 ms per frame in total, mostly the two Omnitrix rings (the touch button and the HUD dial) ticking down a pixel at a time as the alien timer runs, plus the boss bar. Before, all of those shapes were rebuilt in render every frame. Over the whole game step the same profile goes from 3678 to 3212 ms (−13%), and the convoy from 3315 to 2796 ms (−16%). On a real phone with the touch controls (Normal: a 20 s transformation, 10 s cooldown), the two rings together redraw about 13 times a second while transformed and 27 during the cooldown, when the arc moves fastest, against a rebuild every frame (60 or 120 a second) before.

The per-frame effect fixes (change 5) are not what raised update: a build with every effect pinned to one 60 Hz frame per frame (the old rate at any frame rate) measures the same within noise, even though throttled headless runs at 10-15 FPS where the real build spawns about twice the embers and trails per frame:

| Scenario | Update: before | Update: after, effects pinned to 60 Hz frames | Update: after (real build) | CPU mean: before | pinned | real |
|---|---|---|---|---|---|---|
| ch1-forest | 8.1 | 8.1 | 8.5 | 26.1 | 18.9 | 19.9 |
| ch2-convoy | 7.3 | 8.0 | 8.3 | 25.0 | 18.9 | 18.5 |
| ch3-blackout | 6.8 | 7.9 | 7.5 | 20.8 | 17.7 | 17.2 |
| ch3-frog | 7.5 | 8.7 | 8.3 | 22.8 | 18.8 | 18.1 |

(Update and CPU mean, ms per frame, phone 4x. Before: the two A/B runs above. Pinned and real: two more runs each, alternating, on the same machine.)

**Leak check** (phone; five sections per cycle, each left mid-action, then Chapter Select; six cycles):

| | Before | After |
|---|---|---|
| EventBus listeners, first → last cycle | 47 → 47 | 47 → 47 |
| Game event listeners | 20 → 20 | 20 → 20 |
| Textures | 219 → 219 | 233 → 233 (the baked HUD shapes, made once) |
| Display objects in active scenes (at Chapter Select) | 65 → 65 | 65 → 65 |
| Heap after a forced GC, MB | 12.1 → 13.3 | 12.1 → 13 |
| Held sounds still playing, after 3 cycles | 6 | 0 |
| Held sounds while running as XLR8, 8 Training restarts | 7 8 9 10 11 12 13 14 | 1 1 1 1 1 1 1 1 |
| Held sounds in the menu afterwards | 14 | 0 |

The heap after a forced GC creeps up about 1 MB over six cycles in both builds. A 12-cycle run of the current build (12.1, 12.2, 12.4, 12.8, 14.6, 13.1, 13.4, 13.1, 13.4, 13.5, 13.4, 13.5, 15.2 MB) shows it levelling off around 13.1-13.5 MB from the sixth cycle; the two higher single readings (14.6, 15.2) drop back on the next cycle. That is warm-up (compiled code, caches) and GC timing, not a leak. The budget compares the lowest of the last three cycles with the first, so one high reading doesn't fail it. In a 60 s explosion storm (current build, sampled every 10 s) the heap after GC goes 17.0, 17.3, 17.9, 18.2, 18.3, 18.4 MB, levelling off as the fight's own objects (arena walls, phase-two mutants: 228 to 287 display objects) and the particle pools reach their peak; the old build does the same (17.3 to 19.1 MB).

**The `?debug=1` readout itself** (physics bodies drawn every frame plus the meter), phone 4x, one run: ch1-forest 19.4 → 20.7 ms, ch3-frog 18.2 → 20.5 ms (about 10% more; at a phone's 1x speed that is well under a millisecond).

### What changed

**1. A new framebuffer every frame on wide screens (render-target churn).** Phaser's EXPAND scale mode gave the game a fractional width on wide phones (799.51 px on a 915x412 screen). The camera filter (the vignette) asks Phaser's render-target pool for a canvas-sized target every frame. The pool files its targets under their rounded size (800x360) but was asked for 799.51x360, so the lookup never matched: it created a new WebGL framebuffer and texture several times a second, and the pool held 16-28 targets waiting to age out. `systems/PixelScale.ts` floors the game width at boot and on every resize; the canvas is at most one game pixel narrower. After: 5.3 framebuffers created per second before, 0.1 after (a few during level start); the pool holds 1-2 targets instead of 16-28.

**2. HUD and touch controls redrawn from scratch every frame.** Phaser 4 re-tessellates a Graphics object every frame it is drawn. The Omnitrix dial ring and pips, the shield and boss bars, the prompt bar, speech bubbles, the touch buttons, stick and Omnitrix button ring, and the caves' back walls were Graphics. By ablation at 4x (hiding each scene's Graphics): the HUD's render went from 4.5 to 1.1 ms, the touch overlay's from 3.2 to 1.0 ms, the level's from 9.1 to about 7 ms. They are now textures (`ui/BakedGraphics.ts`), redrawn only when what they show changes (the dial ring when its arc moves by a whole pixel, the shield bar when a segment changes). Pixel-diffed against the old build: the HUD is identical. The touch controls are faded as one image instead of shape by shape, so the bright specks where their ring segments overlapped are gone and a rim drawn over a fill is a little darker (at most 30/255 on the stick).

**3. Off-screen scenery drawn every frame.** Phaser builds draw data for every visible object, on screen or not. In Chapter 1, 270 Level objects were visible and 69 on screen. Hiding the off-screen static ones cut Level render from 8.1 to 6.6 ms at 4x. `scenes/level/StaticCuller.ts` does that for decor props, sprinkled grass, rocks and cacti, and the museum's walls and beams (they never move). Visible objects: Chapter 1 265 to 137, Chapter 2 111 to 80, Chapter 3 205 to 114.

**4. Garbage in the night lighting.** `Lighting` made a new object per light per frame and a new options object per stamp. It now reuses both. Together with the baking above, GCs per second roughly halved (4.5 → 2.3 per second across the phone scenarios at 4x).

**5. Effects that ran faster on 90/120 Hz screens.** About 110 places used a per-frame random chance (embers, sparks, smoke, trail ghosts, fireflies), a per-frame damping or easing factor, or spawned a trail particle every frame. At 120 Hz each of those happened twice as often per second: twice the embers and afterimages, easing twice as fast. They now go through `systems/Pacing.ts` (`chance`, `damp`, `approach`, `perFrame`) and `fx.stream`, which scale by the real frame length. At 60 Hz the maths reduces exactly to the old numbers (unit-tested), so the tuned look is unchanged; at 30-144 Hz the per-second rate matches 60 Hz (unit-tested). Timers already used milliseconds.

**6. Jump arcs that depended on the refresh rate.** Arcade Physics integrates velocity then position once per frame (semi-implicit Euler), so a jump peaks a little higher on a fast screen and lower on a slow one. Simulated with the real motor and gravity tuning, Ben's full jump peaked 1.75 px higher at 120 Hz, 2.24 px at 144 Hz and 3.05 px lower at 30 Hz. `systems/ReferenceIntegration.ts` adds the half-step correction that makes every frame rate trace the 60 Hz arc: now within 0.22 px at 120 Hz, 0.45 px at 144 Hz, 0.00 px at 30 Hz (unit-tested for Ben and Heatblast; exactly zero at 60 Hz). Short hops still vary by about a pixel with where the button release lands on a frame, as before.

**7. Quality governor slow to react, and a visible pop.** The governor averaged FPS over 2 s, so a heavy moment (a boss blowing up) was half over before particles stepped down. It now uses 1 s (a unit test pins the reaction time). Dropping to the lowest level removed the vignette in one frame mid-fight; it now fades out over 600 ms (at level start, on a device already at the lowest level, it's simply not added).

**8. Held sounds that never stopped.** Leaving a level as XLR8 at speed left his wind loop playing for the rest of the session (and Heatblast's charge hum, if charging), one more each time: in eight Training restarts as XLR8 the held sounds went 7, 8, 9, 10, 11, 12, 13, 14 (14 still playing in the menu) before, and 1, 1, 1, 1, 1, 1, 1, 1 (0 in the menu) after. Abilities with held sounds now implement `dispose()`, which the level calls on shutdown.

**9. Bundles revalidated on every visit.** Vercel's default `Cache-Control` for static files makes the browser ask again for the 470 KB of JavaScript on every visit. The hashed bundles in `/assets/*.js|css` are now `immutable` for a year (`vercel.json`; a new deploy has new file names). Second visit on Slow 4G at 4x, two runs each: 2622 and 2576 ms to the title with revalidation, 2403 and 2323 ms with the immutable header (the JavaScript comes straight from the cache, no round trips).

**10. Measuring tools.** `npm run bench` (`scripts/bench.mjs`, `scripts/bench/`), the budget, a frame meter in `?debug=1` (`systems/FrameStats.ts`, created only in debug mode), and unit tests for pacing, jump arcs, the governor's reaction time, scene listener cleanup, culling and whole-pixel widths.

### Regression check

- **Feel at 60 Hz is unchanged by construction:** every per-frame chance, damping and easing gives exactly the old numbers at 60 Hz, and the jump correction is exactly zero there (both unit-tested). The 300 existing tests pass unchanged (313 with the new ones), and every commit of the pass typechecks and passes the tests on its own.
- **Every checkpoint of Chapters 1-3 plus Training, on desktop (1280x720) and the wide phone (915x412, touch), old build and new:** 76 scripted runs (skip the cinematics, then run, jump, attack, special, transform and swap for 9 s). No page errors or console errors in either build; every section kept playing; the canvas is 640x360 on desktop and 799x360 on the phone in both builds. Screenshots at the end of each run show the same HUD, touch controls, boss bars, prompts, dialogue and lighting in both builds (the runs don't end on identical frames: timing differs run to run, so positions do too).
- **Pixel diffs** against the build before the bake: HUD identical (the run timer aside); touch controls as described in change 2.

### Checked and left alone

| Item | What was measured | Why nothing changed |
|---|---|---|
| Physics step vs refresh rate | Arcade runs one variable step per frame (the Level steps it, clamped at 34 ms) | Correct at any rate once the per-frame effects and jump arcs above were fixed; a fixed step would add interpolation lag or jitter for no gain |
| Tunnelling on long frames | Fastest bodies (XLR8's dash, Four Arms' meteor drop: 640 px/s) move at most 22 px in a clamped step | Less than a tile plus the body's own size, so nothing passes through a wall in one step. KING CROAK's tongue (900 px/s) is a ray, not a body |
| Camera and sprite jitter | Per-frame screen position of Ben on a 915 px phone during runs: direction reversals of his on-screen position | No oscillation beyond the camera's normal catch-up; snapping the camera and sprite to whole pixels changed nothing measurable, so it was reverted |
| Display-list depth sort | CPU profiles of every scenario | 0.1-0.3% of frame time |
| Text redrawn every frame | All HUD text is BitmapText, and set only when it changes; the stats line updates 10 times a second | Already cheap |
| Device pixel ratio | Phaser renders at game resolution (799x360 on the phone) and the browser scales the canvas up | Nothing to cap |
| Lighting and filter cost | The lightmap is already rendered at reduced resolution and stretched; the only camera filter is the vignette | The governor already removes the vignette at its lowest level |
| Pre-rendering sound effects | Audio thread during a heavy fight with music: about 4% of one core; synthesizing and scheduling sounds on the main thread: 0.6% of frame time | Not a bottleneck; the 28 ms per-sound limiter already caps repeats |
| Phaser's own garbage | Allocation sampling: about 250 KB per frame, most of it inside Phaser's render nodes (SubmitterQuad, SubmitterTile) | Inside the engine; minor GCs are short (see GC max above) |
| GPU tilemap layer (`TilemapGPULayer`) | Pixel-diffed against the normal layer | Drew empty tiles as solid: rejected |
| Pooled projectiles and particles | Read `Projectiles` and `Fx` | Projectiles are pooled, effect images come from a pool and particles from emitters made once per level. Kept as they are |
| Scene shutdown | Listener, texture, tween, timer and display-object counts after every chapter switch, 6 and 12 cycles | Flat in both builds; only the held sounds leaked (fixed above) |

### Loading

Boot to the title screen, Slow 4G (150 ms round trip, 1.6 Mbps) and CPU throttle, served compressed like Vercel (one run each):

| | Before, 4x | After, 4x | Before, 6x | After, 6x |
|---|---|---|---|---|
| First visit (cold cache) | 8293 ms | 8801 ms | 6022 ms | 6143 ms |
| Second visit (warm cache) | 2432 ms | 2264 ms | 3612 ms | 4071 ms |
| JavaScript transferred, first visit | 458 KB | 459 KB | | |

Boot is unchanged by this pass (the differences are run-to-run noise; the very first cold run in a fresh browser is the slowest). The JavaScript is 470 KB compressed (brotli): Phaser 283 KB, the game 187 KB. About 2.4 s of a cold load on Slow 4G is the download; the rest is parsing Phaser and generating the art. Vite's production settings are fine as they are: minified, Phaser in its own chunk (it changes far less often than the game), no source maps shipped.

**Per-chapter code splitting: not done.** All art is generated in code at boot, so there are no asset files to split, and Chapters 2 and 3's own code (bosses, vehicles, story directors, art, level data: 54 files) is 186 KB of the 705 KB game bundle, about 48 KB compressed. Splitting it out would save about 0.25 s of a cold load on Slow 4G (none on a warm load) at the cost of restructuring the level, story and art registries and a loading pause when a chapter starts. Phaser itself is 283 KB of the 470 KB compressed.

**Boot art generation: measured, not changed.** At 4x, generating every texture takes about 1.3 s of the boot, in one long task with the loading bar full: about 0.4 s is creating and uploading 230 canvases, about 0.3 s the characters' frames, the rest props, backdrops and outlines. Chapters 2 and 3's art is about 0.15-0.25 s of it. Options if it grows: spread generation over several frames so the loading bar moves (same total time), generate a chapter's art when it is first played, or pack small textures into shared canvases.

**Revisit when:** the compressed JavaScript passes 600 KB, or warm boot to the title at 4x passes 3.5 s. Each chapter so far added about 90 KB of code (about 23 KB compressed) and about 0.1 s of boot art at 4x.

## Chapter 4 check (Milestone 4, part 3)

Three scenarios were added (`ch4-arcade`, `ch4-station`, `ch4-kevin`) and the leak check now also visits Chapter 4's station and KEVIN 11. Full run on the emulated wide phone, CPU milliseconds per frame:

| Scenario | Mean 4x | p95 4x | p99 4x | Mean 6x | Frames over 50 ms (4x) | Longest GC (4x) |
|---|---|---|---|---|---|---|
| ch4-arcade | 24.1 | 40.6 | 52.1 | 39.8 | 2 | 7.8 ms |
| ch4-station | 21.3 | 38.3 | 51.6 | 33.6 | 2 | 9.0 ms |
| ch4-kevin | 16.8 | 27.2 | 39.3 | 27.7 | 0 | 13.9 ms |
| (ch1-forest, for scale) | 20.0 | 34.7 | 51.8 | 35.4 | 2 | 6.9 ms |

Every scenario is within budget, and the leak check is flat (48 EventBus listeners, 309 textures every cycle, heap +0.8 MB over seven cycles, no held sounds after leaving a level). The GAME ZONE is the heaviest moment in the game now (neon and lit props, the TOKEN TOONS and Kevin's buddy AI on screen at once), about 2 ms under the mean limit at 4x: the next chapter that adds a moment like it should profile first.

**A run on a loaded machine.** The first full run of this check read about 50% higher in every scenario, render time included, and failed the budget. Nothing in the changes touches rendering; on a freshly started machine the same build passed, and an A/B against the build before the last physics change (alternating, two runs each) showed no difference outside noise (ch1-forest 20.1 → 19.5 ms, ch3-frog 19.3 → 19.0, ch4-arcade 20.3 → 21.4). Compare builds on the same machine at the same time (`--dist`), as above.

**Physics steps.** Frames where Ben moves more than 12 px are now split into two physics steps (see `DECISIONS.md`). Only XLR8's dash and Upgrade's flow on slow frames do that; the A/B above includes it.

**Bundle.** 502 KB of JavaScript compressed (brotli): Phaser 276 KB, the game 226 KB. Chapter 4 with Upgrade and the machines added about 32 KB, more than the earlier chapters' 23 KB (Upgrade's machine framework and Kevin's copies are new systems, not just content). Still under the 600 KB revisit line.

## Quality pass check (after Chapter 4)

The full `npm run bench` failed the mean CPU limit in most scenarios on this pass's machine (ch1-forest 29.0, ch4-arcade 31.3, ch4-station 32.6 ms at 4x against 26), but so does the build from before the pass on the same machine, so the machine is slower than the one the budget was set on (the "loaded machine" case above):

| 4x, mean CPU ms | Before the pass (758d542) | After | After, `orphan=0` |
|---|---|---|---|
| ch1-forest | 27.1 | 28.3 | 27.2 |
| ch4-arcade | 32.5 | 30.1 | 32.5 |
| ch4-station | 29.5 | 28.8 | 32.8 |

The ch4-arcade rows above were measured on a frozen GAME ZONE (BUGS.md L3), before and after alike; with L3 fixed it measures 32 to 35 ms, because the room now actually runs. No regression outside noise. What changed on hot paths: vertex uploads re-specify the buffer (`orphan`), floating words rest at 1x or 2x, the combo count's pop moves in whole steps, the music skips steps after a stall, and the speech bubble's depth. None of them adds per-frame allocations or listeners.
