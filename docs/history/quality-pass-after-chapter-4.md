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

**What was found:** 26 bugs (9 technical, 2 logical, 7 textual, 8 visual), all fixed; two design questions for the owner. The full table is in `docs/BUGS.md`. The highlights:

- **Critical:** quitting or restarting during the misfire freeze-frame stopped Phaser's game loop (an unguarded camera reset during shutdown).
- **Major:** an unreadable save was overwritten without a copy; a second, silent AudioContext ran all session; the music kept playing in the background and blurted out every note it had missed after any stall; a dropped touch end could leave the stick dead for the rest of the level; Game Over tips talked about enemies the chapter doesn't have; the combo's `x13 DONE` slid off the screen edge; floating words like WRECKED! were unreadable at fractional sizes; the JOKES FOUND hint was printed over Upgrade's row; Training's ALIEN MOVES ran off the bottom of the screen; long prompts ran under the ATTACK button on 16:9 phones; PRESS {T} TO TRANSFORM! was garbled the whole time it showed.
- **Found by the fuzz runs:** the MAINTENANCE LINE checkpoint spawned Ben inside the parked cart on every retry (and a pit respawn or the cart rolling home could put him there too).
- **Checked and fine:** every smoothie and card reachable, achievements awarded once and in the right place, difficulty reaching every enemy and boss, slow motion and hit-stop not stacking, touch releases, misfire guards on every scripted moment, save migration, the HUD never warped by full-screen effects, red meaning danger, colour-blind cues on every hazard, safe-area padding on notched phones.

**Sweeps:** the last sweeps at all three sizes ended with no page errors and no text issues, and the fuzz pass covered every checkpoint of Chapters 1 to 4 and Training (33 checkpoints; its one finding, the maintenance line, is fixed and re-fuzzed clean).

## Phase 3: the phone fix

Waiting on the autobench report from the owner's phone.
