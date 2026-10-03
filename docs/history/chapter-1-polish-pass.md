# Chapter 1 polish pass (between Milestones 1 and 2)

_Archived from `docs/PROGRESS.md` on 2026-10-03. The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`._

## Playtest notes

The playtest-notes section of the request was left as the template, so I played through the chapter myself in headless Chromium (desktop and emulated phones) and fixed what I found:

- **Canvas centred twice.** `#game` was flex-centred and Phaser also centres the canvas, so on any screen that isn't exactly 16:9 the game sat off-centre (and taps landed in the wrong place). Fixed in `index.html`.
- **Practice runs saved best times.** `?start=cp-arena` then beating the boss recorded a 30-second "best time". Runs that start mid-level are now practice runs: they still record cards and clears but never best time, rank, score or splits (Chapter Complete shows PRACTICE).
- **Phaser flash alpha quirk.** A forced camera flash that restarted mid-flash could leave every later flash permanently dimmer. All flashes now go through `flashCamera`, which resets the peak alpha each time.
- **A missing favicon** caused a 404 on every load; there is now a favicon and a web manifest.

## Accessibility (Settings screen)

- **SETTINGS** on the title screen and in the pause menu. Every change is saved immediately (save version 2, migrated from version 1 with progress kept).
- **REDUCE FLASHING:** full-screen flashes become a soft 20% tint, the transform emblem is dimmed, the phase 2 alarm lights become a slow pulse, and every blink in the game (Omnitrix warning, boss eye, telegraphs, bomb markers, boss bar, invulnerability blink, hologram glitches) is slowed to at most 2.5 flashes per second.
- **SCREEN SHAKE 0–100%** in 10% steps, with a live preview shake. It also scales the transform screen-warp.
- **TOUCH CONTROLS:** AUTO / ON / OFF. **FULLSCREEN** where the browser supports it.
- Until the player chooses, both options follow the device's prefers-reduced-motion setting (reduced flashing on, shake 0%).
- Implementation: `systems/Accessibility.ts` (`flashCamera`, `shakeCamera`, `blinkOn`), numbers in `config/accessibility.ts`.

## Perfect transform

- Press transform within **140 ms before to 220 ms after** a drone or boss attack lands, with the attacker within range (boss attacks count from anywhere). Telegraphed attacks register their fire time in advance and cancel if the drone is stunned, so early presses work.
- Reward: a bigger shockwave (radius 132, 3 damage, big knockback) that **turns nearby enemy shots around** and fires them back, a slow-motion beat, a gold PERFECT! stamp, a chime, **+3 s of alien time**, a Chapter Complete row and a small score bonus (25 each, capped at 100).
- Never required: the first transform is excluded, and a normal transform keeps its shockwave and invulnerability.
- A contextual tip appears after two transforms if a drone is aiming at Ben and the watch is ready.
- Touch taps transform on release, so the time the finger was down (up to 160 ms) is credited back to the timing check.
- Timing logic: `systems/PerfectTransform.ts` (unit tested). Tuning: `config/omnitrix.ts`.

## Speedrun splits

- Each checkpoint (CLIFF, NEST, CRASH SITE; RAVINE on Easy) and the boss kill (BOSS DOWN) shows the run time and the delta to the **fastest time you have ever reached that point**: gold with BEST! when ahead, red when behind, FIRST RUN! the first time. The run timer turns gold while you are ahead.
- Chapter Complete shows the delta to your best chapter time.
- Saved per chapter in `bestSplits`. Logic in `systems/Splits.ts` (unit tested).

## Vilgax hologram

- When the crash-site arena locks, a projector pops out of the crater and Vilgax appears as a red, scan-lined, glitching hologram: "I AM VILGAX, CONQUEROR OF TEN WORLDS. THE OMNITRIX IS MINE, CHILD." Ben answers "FINDERS KEEPERS, SQUID FACE!" and the hologram switches off like an old TV before the Hunter-Killer drops in.
- Typewriter dialogue with synthesized voice blips. Any key or tap skips. Plays once per run (retries skip it). The world, alien timer and run timer hold still while it plays.
- Files: `scenes/level/VilgaxHologram.ts`, `ui/DialogBox.ts`, lines in `config/story.ts`, art in `scenes/preload/story.ts`.

## Hidden Four Arms vault

- A cracked rock wall in the cliff face right next to the cliff checkpoint seals a small vault with a fourth Sumo Slammers card glinting inside. Touching or hitting it shows a locked four-armed silhouette ("LOCKED ALIEN / TOO TOUGH... FOR NOW") and Ben says "I'D NEED, LIKE, FOUR ARMS TO BUST THAT...".
- **Milestone 2 hook (now live, see Milestone 2 above):** only hits of kind `'smash'` break it (3 hits, `config/secrets.ts`). Give Four Arms' heavy punch / ground slam `kind: 'smash'` and set `canSmash: true` in his reachability caps. The vault card has `requires: 'fourarms'`, so it only spawns and counts toward the card total once Four Arms is on the dial (cards stay 3/3 until then). Tests already prove the vault is unreachable now and reachable with a smashing alien.

## Mobile

- **Touch controls** (`scenes/TouchScene.ts`, `ui/TouchControls.ts`): a floating stick on the left, JUMP / ATTACK / SPECIAL on the right and a transform button styled like the Omnitrix whose ring mirrors the watch (ready, draining, recharging, jammed). Large, semi-transparent, multi-touch, slide between buttons, icons switch to fireball / burst as Heatblast. They hide in cinematics and when paused.
- Prompts, tips, the pause screen and the title hint name touch buttons instead of keys. Chapter Complete has tappable PLAY AGAIN / SHARE SCORE / TITLE buttons; SHARE uses the phone's share sheet and falls back to copying.
- **Landscape:** portrait shows a "turn your phone sideways" screen and freezes the game behind the pause menu. The first title-menu choice requests fullscreen + landscape lock where the browser allows it (Android Chrome; iOS Safari doesn't support it).
- **Small and notched screens:** safe-area padding, no pinch or double-tap zoom, no page scroll, pull-to-refresh or long-press callouts. The boss arena frames the floor higher on touch so thumbs never cover it. Hiding the tab or locking the phone auto-pauses.
- **Frame rate:** `systems/Quality.ts` watches the real FPS. Below 50 FPS over 2 s it steps particle density down (100% → 60% → 35%) and at the lowest level drops the full-screen vignette pass; it steps back up after 10 s above 58 FPS. Tuning in `config/quality.ts`. `?debug=1` shows the level as Q0–Q2.
- Tested in headless Chromium with emulated Pixel 7, Galaxy S9+, iPhone 13, iPhone SE (landscape and portrait) and iPad, with multi-touch input.

## How to test (at the time)

**Chapter 1, desktop**

1. `npm run dev`, open the page, press Enter (NEW GAME > a file > a difficulty > PLAY).
2. Skip or watch the intro, walk right to the pod, press T when prompted.
3. Shoot drones (J, hold Up to aim high), try a Fire Burst (hold and release K), burn the tunnel barricade, and rocket jump up the cliff past the checkpoint.
4. **Perfect transform:** after your first transform times out, wait for a drone's aim line to lock and press T right as it fires. You should get the PERFECT! stamp, a gold blast that sends lasers back, slow motion and +3 s on the dial. Quick test: `?start=cp-cliff`, stand at the cliff base and transform as the ridge scouts fire (the first transform of a run never counts).
5. **Four Arms vault:** walk into the cracked wall right of the cliff checkpoint. The locked silhouette appears and Ben comments. Punches, fireballs and bursts bounce off.
6. Walk into the blue jammer field: Heatblast reverts. Cross the creek as human Ben, then punch the jammer core three times.
7. **Splits:** on a full run (started from the title) each checkpoint shows a split. Your second run shows gold/red deltas and the timer goes gold while ahead.
8. **Vilgax hologram:** enter the crash site. Watch it, or press any key to skip. Die in the fight and retry: it doesn't replay.
9. Beat the Hunter-Killer Drone, then check the Chapter Complete tally (PERFECT TRANSFORMS row, time delta), the rank, and the PLAY AGAIN / SHARE SCORE / TITLE buttons.
10. **Settings:** title or pause → SETTINGS. Toggle REDUCE FLASHING (the preview flash softens), slide SCREEN SHAKE (live preview shake). With reduced flashing on, the phase 2 alarm becomes a slow pulse and the last-5-seconds watch blink slows down. Set your OS to "reduce motion" with a fresh save (clear site data) to see both default on.
11. Shortcuts: `?start=cp-arena` for the boss, `?start=cp-nest`, `?start=cp-cliff` (practice runs: no best times saved).

**Chapter 1, phone** (open the deployed URL, or `npm run dev -- --host` and open the LAN address)

1. Hold the phone in portrait: the "turn your phone sideways" screen shows. Rotate to landscape.
2. Tap NEW GAME (or CONTINUE): on Android the game goes fullscreen. The title hint talks about thumbs, not keys.
3. Tap anywhere to skip the intro. Move with your left thumb anywhere on the left side; JUMP / ATTACK / SPECIAL on the right.
4. At the pod, tap the round Omnitrix button. Hold JUMP and ATTACK together; slide your thumb between them. Hold SPECIAL as Heatblast to charge a Fire Burst. Push the stick up while attacking to aim high.
5. Swipe sideways on the Omnitrix button: with only Heatblast unlocked, the dial nudges and stays on him.
6. Tap II (top centre) to pause; the pause screen lists touch controls. Rotate to portrait mid-game: the game pauses behind the rotate screen. Lock the phone and unlock: the pause menu is up.
7. At the boss, the floor should sit above your thumbs. Finish the chapter and tap SHARE SCORE: the share sheet opens.
8. Watch for stutter during big explosions; if it stutters, `?debug=1` shows the quality level (Q0–Q2) next to the FPS.
