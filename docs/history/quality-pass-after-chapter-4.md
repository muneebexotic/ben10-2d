# Quality pass after Chapter 4: real-phone performance and a bug hunt

_The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`. Every bug found is in `docs/BUGS.md`; the performance budget and how to measure it are in `docs/PERFORMANCE.md`._

No new content and no design changes: this pass measured the game on a real phone and hunted bugs across Chapters 1 to 4.

## Why

On the owner's Android phone (`?debug=1`) the CPU side was well inside budget (3.5 to 4.9 ms a frame, P99 5.2 to 9.7 ms, heap 32 to 38 MB) but FPS sat at 35 to 49 with 1% lows of 15 to 27 and the quality governor at Q2 the whole time. The CPU wasn't the limit, so the time was going to the GPU, the compositor or the browser, which headless Chromium can't measure.

## Phase 1: the phone benchmarks itself (`?autobench=1`)

- **What it plays:** every heavy scene, with the scripted player and god mode on a throwaway save held in memory: a blank scene and a calm one (baselines), all four bosses, the Chapter 2 convoy, the Chapter 3 blackout, the Chapter 4 arcade and the misfire gag in Training. About 20 s each (warm-up, then a recorded stretch), and a longer warm-up on each scene's first visit so the first run isn't biased by shader compiles and texture uploads.
- **Bisect switches** (`systems/PerfSwitches.ts`), usable alone or combined from the URL: `fx=0` (lighting, vignette, camera filters), `particles=0`, `bg=0` (backdrops), `scale=0.5` (half-resolution backing store), `bodies=1` (physics debug draw), `governor=0` (quality pinned at Q0). Each scene runs normally and then once per switch, so the report shows what each one is worth on that phone. Extras on the calm scene and the arcade: `orphan=1` (a different vertex upload path), `css=smooth`, `audio=0`, everything off at once, and reloads with different WebGL context settings (`ctx=desync`, `ctx=lean`: no depth or stencil buffer).
- **Recorded per run:** FPS, 1% low, CPU per frame and its P99, the gap between frame interval and CPU (time spent outside the game's own code), GPU time (`EXT_disjoint_timer_query` where the phone has it, a timed sync otherwise), draw calls, framebuffer binds, upload volume, the governor's level, and once per report the device pixel ratio, the canvas backing size against its CSS size, the WebGL renderer and the context attributes.
- **Around it:** the screen stays awake (Wake Lock), it warns about battery saver, a throttled refresh rate and in-app browsers, interrupted runs retry, and it ends on a compact report with a big COPY button (kept on the phone until the next run: `?autobench=report`).
- How to run it is in `docs/PERFORMANCE.md`, "Checking on a real phone".

## Phase 2: the bug hunt

**How:** reading code alone wasn't enough, so most of it is automated and stays in the repo.

- `npm run qa` (`scripts/qa.mjs`): headless Chromium at three sizes (a 16:9 desktop window, a 20:9 phone, a small 16:9 phone) screenshots the title, every menu and Extras page, every checkpoint of Chapters 1 to 4 (on arrival, in play and paused), Game Over and Chapter Complete per chapter, the Act 1 ending, SUMO SLAMMERS, and a HUD gauntlet (a 99 combo and its drop, long banners, achievement toasts, every boss bar, long prompts, dialogue, speech). On every screen `scripts/qa/textcheck.js` checks each visible text for: cut off by the screen edge, spilling out of its declared box (`boxed()` in `ui/text.ts`), overlapping other screen text, drawn at a fractional size, raw `{TOKENS}`, glyphs the font lacks, and key names shown to a touch player. `--fuzz` plays every checkpoint with random keys, dial picks, swaps, alien timeouts, pauses and restarts from the pause menu, checking for page errors, a stopped game loop, Ben out of the world or inside solid ground, and enemies lost out of the world.
- `tests/strings.test.ts`: every player-facing string (about 1,100) for missing glyphs, unknown control tokens, house spellings, doubled words and raw key names.
- `tests/textfit.test.ts`, `tests/gameOverTips.test.ts`, `tests/pickups.test.ts` (every smoothie reachable), `tests/music.test.ts` (no note bursts after a stall), `tests/spawns.test.ts` (no checkpoint spawns Ben inside a machine) and the "save safety" block of `tests/save.test.ts`.
- The autobench itself (it stops levels mid-action dozens of times) found the worst bug: quitting from the pause menu during the misfire gag froze the game.

**What was found:** 35 bugs (13 technical, 5 logical, 8 textual, 9 visual): 34 fixed, one minor deferred; two design questions for the owner. Nine were logged after the second phone report (below). The full table is in `docs/BUGS.md`. The highlights:

- **Critical:** quitting or restarting during the misfire freeze-frame stopped Phaser's game loop (an unguarded camera reset during shutdown); and the first arcade cabinet Upgrade used in the GAME ZONE froze the world for good (below).
- **Major:** an unreadable save was overwritten without a copy; a second, silent AudioContext ran all session; the music kept playing in the background and blurted out every note it had missed after any stall; a dropped touch end could leave the stick dead for the rest of the level; Game Over tips talked about enemies the chapter doesn't have; the combo's `x13 DONE` slid off the screen edge; floating words like WRECKED! were unreadable at fractional sizes; the JOKES FOUND hint was printed over Upgrade's row; Training's ALIEN MOVES ran off the bottom of the screen; long prompts ran under the ATTACK button on 16:9 phones; PRESS {T} TO TRANSFORM! was garbled the whole time it showed.
- **Found by the fuzz runs:** the MAINTENANCE LINE checkpoint spawned Ben inside the parked cart on every retry (and a pit respawn or the cart rolling home could put him there too).
- **Checked and fine:** every smoothie and card reachable, achievements awarded once and in the right place, difficulty reaching every enemy and boss, slow motion and hit-stop not stacking, touch releases, misfire guards on every scripted moment, save migration, the HUD never warped by full-screen effects, red meaning danger, colour-blind cues on every hazard, safe-area padding on notched phones.

**Sweeps:** the last sweeps at all three sizes ended with no page errors and no text issues, and the fuzz pass covered every checkpoint of Chapters 1 to 4 and Training (33 checkpoints; its one finding, the maintenance line, is fixed and re-fuzzed clean).

## Phase 3: the phone fix

**The first report** (Mali-G78, Chrome 154, 60 Hz): the game's CPU stayed at 3 to 11 ms a frame while fights ran at 27 to 42 FPS with 1% lows of 14 to 28 and the governor stuck at Q2. Half the resolution changed nothing; the `orphan=1` switch doubled the frame rate. The cost was Phaser 4's vertex uploads: `bufferSubData` into the front of one 1.8 MB buffer the frame's earlier draws still read, about 100 times a frame, which Mali's driver handles by copying or waiting. The governor couldn't help because its levers (particles, lights, filters) don't touch it.

**The fix:** every upload re-specifies the buffer (`bufferData`, `systems/RenderSwitches.ts`), now the default; `orphan=0` brings Phaser's path back. Headless it costs nothing.

**The second report** (build 564135d): every scene at the refresh rate (60.0 to 60.1 FPS), 1% lows of 52 to 58 (the goal: 51), Q0 the whole time, no heat drift. In the same run `orphan=0` put the calm scene's GPU wait back from 5.5 to 34.3 ms. The before/after table is in `docs/PERFORMANCE.md`.

**What the second report found:** the GAME ZONE uploaded ten times the vertex data of any other scene, and `particles=0` halved its CPU. A headless probe showed one emitter's pixels never dying: the first arcade cabinet the scripted player merged into fired GAME OVER on every frame, and its 50 ms hit-stop, refreshed every frozen frame, held the world still for good (BUGS.md L3, critical). Real play hits it the same way (reproduced with keyboard input): the first cabinet Upgrade uses freezes the game until Pause > Restart. So every GAME ZONE measurement since Chapter 4, headless and on the phone, was of a frozen room. An audit of all 30 hit-stop call sites and every one-off effect fired from an update found no other freeze, but the Hunter-Killer dropping a smoothie every frame of its armour's flight (L4), ROADBREAKER's stacked roars (T11), and, from the same "frame names are numbers" mistake as L3, the Act 1 ending's clunk playing every frame (T10) and every heart popping on a heal (V9). New checks: `tests/cabinet.test.ts`, `tests/sourceRules.test.ts`, the QA fuzz's frozen-world check, a QA boss pass that knocks every boss through its phases, and a `frozen` flag on any autobench row whose gameplay sat in hit-stop, so a phone report can't measure a still scene unnoticed again. Checking that flag headless turned up one more: a run that ended in fullscreen showed a black screen instead of its report (T13).

**After the fix,** headless, the real GAME ZONE costs 32 to 35 ms at 4x (in line with Chapter 4's station); on the phone it needs one more run, `?autobench=1&only=ch4-arcade`.
