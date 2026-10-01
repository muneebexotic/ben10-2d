# Progress

## Status

**Milestone 1 (vertical slice) is built, plus a Chapter 1 polish and approved-ideas pass.** Chapter 1, "Camp Crash", is playable from the title screen to the Chapter Complete screen on desktop (keyboard) and on phones and tablets (touch, landscape). `npm run typecheck`, `npm run build` and `npm test` (116 tests) all pass. The build output (`dist/`) is Vercel-ready (`vercel.json` included).

The polish pass added: accessibility settings (Reduce Flashing, screen shake slider, Settings screen), perfect transforms, speedrun splits, the Vilgax hologram, a sealed Four Arms vault, and full mobile support (touch controls, landscape handling, auto-pause, frame-rate governor). Details are in [Chapter 1 polish pass](#chapter-1-polish-pass) below.

Next: Milestone 2 (alien framework: add XLR8 and Four Arms). Milestone 1's mobile work means Milestone 6 is now polish only.

## How to run

```
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run typecheck
npm test
```

URL switches for playtesting:

| Switch | Effect |
|---|---|
| `?start=cp-cliff` | Start at a checkpoint (`cp-cliff`, `cp-nest`, `cp-arena`; `cp-ravine` exists on Easy only). A practice run: best times and splits aren't saved |
| `?mute=1` | Start muted |
| `?debug=1` | Physics bodies plus a position/FPS/quality-level readout |
| `?gallery=1&per=12&page=0` | Every generated texture, for reviewing or replacing art |
| `?at=<tile x>` | Dev builds only: spawn Ben anywhere with the watch |
| `?god=1` | Dev builds only: Ben can't take damage from hits |

## Controls

| Action | Keys | Touch |
|---|---|---|
| Move | A/D or arrows | Left thumb stick (appears wherever your thumb lands on the left side) |
| Jump (hold for higher) | Space / W / Up | JUMP |
| Drop through a platform | Down + Jump | Stick down + JUMP |
| Attack (punch / fireball) | J (or X) | ATTACK |
| Special (dodge roll / hold to charge Fire Burst) | K (or C) | SPECIAL (hold to charge) |
| Aim fireballs up | Hold Up while attacking | Stick up while attacking |
| Rocket jump (Heatblast) | Jump again in mid-air, hold to glide | JUMP again in mid-air |
| Omnitrix dial | Q / E | Swipe sideways on the Omnitrix button |
| Transform | T | Tap the Omnitrix button |
| Pause | Esc / P | II button (top centre) |
| Skip a cinematic | Any key | Tap anywhere |
| Mute | M | Settings |

On-screen controls show only on touch devices (Settings → TOUCH CONTROLS: AUTO / ON / OFF). In AUTO, pressing a key hides them and touching the screen brings them back.

## What was built

**Project:** Phaser 4 (latest, WebGL) + TypeScript strict + Vite + Vitest. The folder structure follows CLAUDE.md. Helper modules live in `scenes/level/` (Level orchestration) and `scenes/preload/` (placeholder art + asset key map).

**Opening (first 10 seconds):**
- A skippable 3-second cinematic: the camp at night, a green and a red streak cross the sky, and an impact in the woods.
- Ben walks right to a glowing pod. It opens and the Omnitrix leaps onto his wrist ("Hey! It won't come off!").
- Drones arrive and the world drops into slow motion with a pulsing "PRESS [T] TO TRANSFORM!" until the player transforms. A first-time player transforms about 6–8 seconds after gaining control.

**Human Ben:**
- Movement: acceleration and deceleration, coyote time, jump buffering, variable jump height, apex hang, faster falling, drop-through platforms.
- Weak punch with lunge and hit-stop.
- Dodge roll with invincibility frames.
- Laser parry: punching an enemy laser knocks it back, green and stronger.

**Omnitrix (`systems/Omnitrix.ts`, pure and fully tested):**
- Dial with Q/E, transform on T.
- 20s timer and 10s cooldown from `config/difficulty.ts` (Normal).
- Warning beeps and red flashing in the last 5 seconds, then a forced revert.
- Early revert from damage or the jammer field.
- Wrong-transform rolls are implemented and tested. They can't trigger yet because only one alien is unlocked.

**Transformation sequence:**
- Wind-up: slow-mo, Ben slaps the watch, a big Omnitrix hourglass flashes on screen.
- Burst: green flash, rays, rings, particles, and a barrel-distortion pulse that bulges the whole screen.
- Camera punch, shake, and a "HEATBLAST!" name slam with speed streaks, plus a quip.
- The transformation shockwave knocks nearby drones away, so transforming doubles as a panic button.

**Heatblast:**
- Fireballs with auto-fire, slight aim assist, and hold-Up aiming.
- Charged Fire Burst: hold K, release for a radius and damage that scale with charge. It also erases enemy lasers.
- Rocket jump with a damaging blast underfoot, plus a glide while holding jump.
- Flame-crown particles, embers, a warm light that pushes back the night, and a heat shield bar.

**Level (forest to crash site, about 280 tiles):**
1. Camp with the Rustbucket, tents and campfire.
2. Pod site.
3. Forest path with a tunnel sealed by a drone barricade that only fire can burn.
4. A 7-tile cliff that needs the rocket jump.
5. The ridge.
6. A jammer ravine: its field reverts any alien and blocks transforming, so it is crossed as human Ben over stepping stones in a creek, ending at a jammer core you punch to drop the energy gate. This is the cooldown-survival section.
7. A drone nest.
8. The crash-site boss arena.

There are four checkpoints by difficulty density, two Mr. Smoothy heals, and water that costs health and respawns you on safe ground.

**Enemies (three variants, all telegraphed):**
- **Scout:** hovers and flickers a dashed aim line that locks just before a single laser.
- **Striker:** locks a reticle on Ben, dive-bombs the spot, then sits stuck and harmless, a punish window for human Ben. It takes 1.5× damage while stuck.
- **Gunner:** a heavier ship with a long charge and a three-way spread.

**Boss, the Hunter-Killer Drone:**
- Descends with a roar, arena walls rise and the boss bar slides in.
- Phase 1: aimed volleys with reticles; a slam that tracks Ben with a growing red danger zone, sends ground shockwaves, then leaves the boss stunned and exposed (1.5× damage; human punches work); and escort summons.
- At 50% the armour blows off, the arena alarm lights go red, and the boss drops a Mr. Smoothy.
- Phase 2: faster patterns, triple slams, a knee-high floor beam with a countdown blink, and a bomb rain where every impact is marked first.
- A slam is guaranteed at least every third attack, so the human cooldown always gets a damage window.
- Death: slow-motion chain explosions, then a big flash.

**Chapter Complete:**
- Time, damage taken, drones destroyed, best combo, lasers parried, deaths, Sumo Slammers cards and score, each tallied one by one.
- An S–D rank stamps in, with a "new best" check against the save.
- A teaser for Chapter 2.
- [C] copies a shareable score line.

**HUD:**
- Omnitrix dial with a timer ring that drains green, flashes red, and refills red on cooldown, with an alien hologram icon.
- Hearts and the heat shield bar.
- Run timer, drone count and card slots.
- Combo counter, boss bar, banners, prompts, letterbox and a low-health vignette.

**Menus:** title screen (Ben and Heatblast swap with a green flash), pause with a controls list, a game over screen with tips, and retry from checkpoint.

**Audio:** everything is synthesized with Web Audio (about 50 effects) plus an original chiptune soundtrack. Its "hero layer" swells while Ben is an alien.

**Visual tech:**
- Night lightmap (multiply render texture with additive lights), emissive layer, and parallax sky.
- Hit-stop and slow motion via `TimeController`.
- Pooled projectiles and particle emitters.
- Camera vignette and death desaturation (Phaser 4 filters).

## Chapter 1 polish pass

### Playtest notes

The playtest-notes section of the request was left as the template, so I played through the chapter myself in headless Chromium (desktop and emulated phones) and fixed what I found:

- **Canvas centred twice.** `#game` was flex-centred and Phaser also centres the canvas, so on any screen that isn't exactly 16:9 the game sat off-centre (and taps landed in the wrong place). Fixed in `index.html`.
- **Practice runs saved best times.** `?start=cp-arena` then beating the boss recorded a 30-second "best time". Runs that start mid-level are now practice runs: they still record cards and clears but never best time, rank, score or splits (Chapter Complete shows PRACTICE).
- **Phaser flash alpha quirk.** A forced camera flash that restarted mid-flash could leave every later flash permanently dimmer. All flashes now go through `flashCamera`, which resets the peak alpha each time.
- **A missing favicon** caused a 404 on every load; there is now a favicon and a web manifest.

### Accessibility (Settings screen)

- **SETTINGS** on the title screen and in the pause menu. Every change is saved immediately (save version 2, migrated from version 1 with progress kept).
- **REDUCE FLASHING:** full-screen flashes become a soft 20% tint, the transform emblem is dimmed, the phase 2 alarm lights become a slow pulse, and every blink in the game (Omnitrix warning, boss eye, telegraphs, bomb markers, boss bar, invulnerability blink, hologram glitches) is slowed to at most 2.5 flashes per second.
- **SCREEN SHAKE 0–100%** in 10% steps, with a live preview shake. It also scales the transform screen-warp.
- **TOUCH CONTROLS:** AUTO / ON / OFF. **FULLSCREEN** where the browser supports it.
- Until the player chooses, both options follow the device's prefers-reduced-motion setting (reduced flashing on, shake 0%).
- Implementation: `systems/Accessibility.ts` (`flashCamera`, `shakeCamera`, `blinkOn`), numbers in `config/accessibility.ts`.

### Perfect transform

- Press transform within **140 ms before to 220 ms after** a drone or boss attack lands, with the attacker within range (boss attacks count from anywhere). Telegraphed attacks register their fire time in advance and cancel if the drone is stunned, so early presses work.
- Reward: a bigger shockwave (radius 132, 3 damage, big knockback) that **turns nearby enemy shots around** and fires them back, a slow-motion beat, a gold PERFECT! stamp, a chime, **+3 s of alien time**, a Chapter Complete row and a small score bonus (25 each, capped at 100).
- Never required: the first transform is excluded, and a normal transform keeps its shockwave and invulnerability.
- A contextual tip appears after two transforms if a drone is aiming at Ben and the watch is ready.
- Touch taps transform on release, so the time the finger was down (up to 160 ms) is credited back to the timing check.
- Timing logic: `systems/PerfectTransform.ts` (unit tested). Tuning: `config/omnitrix.ts`.

### Speedrun splits

- Each checkpoint (CLIFF, NEST, CRASH SITE; RAVINE on Easy) and the boss kill (BOSS DOWN) shows the run time and the delta to the **fastest time you have ever reached that point**: gold with BEST! when ahead, red when behind, FIRST RUN! the first time. The run timer turns gold while you are ahead.
- Chapter Complete shows the delta to your best chapter time.
- Saved per chapter in `bestSplits`. Logic in `systems/Splits.ts` (unit tested).

### Vilgax hologram

- When the crash-site arena locks, a projector pops out of the crater and Vilgax appears as a red, scan-lined, glitching hologram: "I AM VILGAX, CONQUEROR OF TEN WORLDS. THE OMNITRIX IS MINE, CHILD." Ben answers "FINDERS KEEPERS, SQUID FACE!" and the hologram switches off like an old TV before the Hunter-Killer drops in.
- Typewriter dialogue with synthesized voice blips. Any key or tap skips. Plays once per run (retries skip it). The world, alien timer and run timer hold still while it plays.
- Files: `scenes/level/VilgaxHologram.ts`, `ui/DialogBox.ts`, lines in `config/story.ts`, art in `scenes/preload/story.ts`.

### Hidden Four Arms vault

- A cracked rock wall in the cliff face right next to the cliff checkpoint seals a small vault with a fourth Sumo Slammers card glinting inside. Touching or hitting it shows a locked four-armed silhouette ("LOCKED ALIEN / TOO TOUGH... FOR NOW") and Ben says "I'D NEED, LIKE, FOUR ARMS TO BUST THAT...".
- **Milestone 2 hook:** only hits of kind `'smash'` break it (3 hits, `config/secrets.ts`). Give Four Arms' heavy punch / ground slam `kind: 'smash'` and set `canSmash: true` in his reachability caps. The vault card has `requires: 'fourarms'`, so it only spawns and counts toward the card total once Four Arms is on the dial (cards stay 3/3 until then). Tests already prove the vault is unreachable now and reachable with a smashing alien.

### Mobile

- **Touch controls** (`scenes/TouchScene.ts`, `ui/TouchControls.ts`): a floating stick on the left, JUMP / ATTACK / SPECIAL on the right and a transform button styled like the Omnitrix whose ring mirrors the watch (ready, draining, recharging, jammed). Large, semi-transparent, multi-touch, slide between buttons, icons switch to fireball / burst as Heatblast. They hide in cinematics and when paused.
- Prompts, tips, the pause screen and the title hint name touch buttons instead of keys. Chapter Complete has tappable PLAY AGAIN / SHARE SCORE / TITLE buttons; SHARE uses the phone's share sheet and falls back to copying.
- **Landscape:** portrait shows a "turn your phone sideways" screen and freezes the game behind the pause menu. START requests fullscreen + landscape lock where the browser allows it (Android Chrome; iOS Safari doesn't support it).
- **Small and notched screens:** safe-area padding, no pinch or double-tap zoom, no page scroll, pull-to-refresh or long-press callouts. The boss arena frames the floor higher on touch so thumbs never cover it. Hiding the tab or locking the phone auto-pauses.
- **Frame rate:** `systems/Quality.ts` watches the real FPS. Below 50 FPS over 2 s it steps particle density down (100% → 60% → 35%) and at the lowest level drops the full-screen vignette pass; it steps back up after 10 s above 58 FPS. Tuning in `config/quality.ts`. `?debug=1` shows the level as Q0–Q2.
- Tested in headless Chromium with emulated Pixel 7, Galaxy S9+, iPhone 13, iPhone SE (landscape and portrait) and iPad, with multi-touch input.

## Creative additions beyond the spec

- **Alien shield (heat bar):** damage as an alien drains a separate shield; breaking it forces an early revert. This is how "heavy damage forces revert" is implemented, and it makes the human cooldown the real danger.
- **Jammer field set piece:** a deterministic "survive as human" section instead of hoping the timer runs out at the right moment.
- **Laser parry, dodge roll, and Strikers you can punish** so human Ben has real moves, not just waiting out the cooldown.
- **Transformation shockwave** that knocks drones away.
- **Combo counter** ("HERO TIME!" at 12, "UNSTOPPABLE!" at 25), **rank and score**, **best-time save**, and a **copy score** share line.
- **Three hidden Sumo Slammers cards:**
  - A high branch that needs the rocket jump.
  - A risky creek platform in the jammer ravine.
  - A secret alcove behind a second barricade.
- **Adaptive music** that reacts to transforming.
- **Slow-motion first transform** and contextual tutorial prompts. There are no tutorial walls.
- **Night lighting:** campfire, glowing mushrooms, fireflies, the pod glow, and the RV window light (a Rustbucket nod).
- **Aim assist** on fireballs.
- **Buffered punches.**
- **Spawn grace** after checkpoints, and a wake delay before drones attack.

## Decisions and deviations from GAME_DESIGN.md

- **Phaser 4 instead of Phaser 3**, at the owner's request (CLAUDE.md updated).
- **Minimal pause, game over and title menus** were built now (Milestone 3 lists menus) because Esc is in the controls table and a vertical slice needs a way to restart. A Settings screen (accessibility, touch controls, sound, fullscreen) now exists too. Difficulty selection and ChapterSelect are not built. The game runs on the Normal preset.
- **SaveSystem** stores best time, rank, cards, best splits, the mute setting and the Settings options (save version 2). Full save progress remains Milestone 3.
- **Mobile controls were pulled forward** from Milestone 6 at the owner's request: shared links get opened on phones.
- **A floating stick instead of a D-pad:** it supports aiming up and dropping through platforms without extra buttons and never "misses" a thumb. Sideways wins near the horizon so running never accidentally aims or drops.
- **Perfect transforms also add +3 s of alien time** and a small score bonus, so mastering them pays off over a whole run. The first (tutorial) transform can't be perfect.
- **The Vilgax hologram plays once per run** so boss retries go straight to the fight.
- **Practice runs** (started mid-level with `?start=`) never save best times or splits.
- **The Four Arms vault is next to the cliff checkpoint,** where every player pauses (often waiting for the Omnitrix to recharge), so nearly everyone sees the tease.
- **Pod crater:** the pod's crater is a flat scorch decal, not a pit, so nothing blocks the walk to the first transform.
- **Placeholder art is procedural pixel art,** not flat shapes. It is still swappable from the single map in `scenes/preload/assetKeys.ts`: add a `url` with the same frame size and order.
- **The dial is a single alien for now.** Q/E cycling works (and is tested) and will matter in Milestone 2.

## Known issues and limitations

- **Not tuned by hand.** Difficulty was tuned by reasoning, scripted playtests and a reachability test, not by human players. Boss HP (120), drone counts and the jammer ravine may need tuning after real playtests. All numbers are in `src/config/`.
- **Touch controls are untested on real hardware.** They were tested with emulated phones and multi-touch in headless Chromium. Button sizes and positions live in `config/touch.ts`.
- **Headless frame rate.** Headless Chromium (software WebGL) runs at about 40–49 FPS, so the frame-rate governor drops to its lowest level there. Not yet verified on a real mid-range Android GPU.
- **iOS Safari can't go fullscreen** or lock orientation from a web page; the game still fits the screen with the browser bars visible. Adding it to the home screen (web manifest) gives a fullscreen landscape launch.
- **Wide phones are pillarboxed:** the game keeps its 16:9 frame, so 19.5:9 phones show side bars (see IDEAS.md for an EXPAND-mode proposal).
- **Practice runs still show a rank** on Chapter Complete (it isn't saved).
- **Zoom shimmer.** The camera zoom punch on transform briefly shows pixel shimmer, because `pixelArt` rendering doesn't zoom by integer steps.
- **No gamepad support yet** (deferred).

## How to test

**Desktop**

1. `npm run dev`, open the page, press Enter.
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

**Phone** (open the deployed URL, or `npm run dev -- --host` and open the LAN address)

1. Hold the phone in portrait: the "turn your phone sideways" screen shows. Rotate to landscape.
2. Tap START: on Android the game goes fullscreen. The title hint talks about thumbs, not keys.
3. Tap anywhere to skip the intro. Move with your left thumb anywhere on the left side; JUMP / ATTACK / SPECIAL on the right.
4. At the pod, tap the round Omnitrix button. Hold JUMP and ATTACK together; slide your thumb between them. Hold SPECIAL as Heatblast to charge a Fire Burst. Push the stick up while attacking to aim high.
5. Swipe sideways on the Omnitrix button: the dial nudges (it will cycle aliens once Milestone 2 adds them).
6. Tap II (top centre) to pause; the pause screen lists touch controls. Rotate to portrait mid-game: the game pauses behind the rotate screen. Lock the phone and unlock: the pause menu is up.
7. At the boss, the floor should sit above your thumbs. Finish the chapter and tap SHARE SCORE: the share sheet opens.
8. Watch for stutter during big explosions; if it stutters, `?debug=1` shows the quality level (Q0–Q2) next to the FPS.
