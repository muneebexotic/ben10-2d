# Progress

## Status

**Milestone 2 (alien framework, XLR8 and Four Arms) is built.** Aliens are self-contained, data-driven modules; the Omnitrix dial holds several aliens and can swap between them mid-transformation; XLR8 and Four Arms play nothing like Heatblast or each other; two new drones (Armored, Hornet) each have a counter-alien; and **Omnitrix Training** on the title screen is a sandbox with every enemy type and a damage-number dummy. `npm run typecheck`, `npm run build` and `npm test` (170 tests) all pass.

Story-wise, XLR8 and Four Arms unlock in Chapter 2 (Milestone 4). Until then they are lent out in Training, and `?aliens=` adds them to a Chapter 1 practice run. Chapter 1 plays exactly as before with Heatblast alone. Details in [Milestone 2](#milestone-2-alien-framework-xlr8-and-four-arms) below.

Milestone 1 (Chapter 1 vertical slice, plus its polish pass) is described further down.

Next: Milestone 3 (core systems: wrong transforms, difficulty, save progress, menus).

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
| `?training=1` | Straight into Omnitrix Training |
| `?aliens=fourarms,xlr8` | Adds aliens to the Chapter 1 dial (a practice run). With Four Arms the vault card spawns and counts |
| `?mute=1` | Start muted |
| `?debug=1` | Physics bodies plus a position/FPS/quality-level readout |
| `?gallery=1&per=12&page=0` | Every generated texture, for reviewing or replacing art. `?gallery=1&key=fourarms&scale=6&from=0` shows one sheet's frames large |
| `?at=<tile x>` | Dev builds only: spawn Ben anywhere with the watch |
| `?god=1` | Dev builds only: Ben can't take damage from hits |

## Controls

| Action | Keys | Touch |
|---|---|---|
| Move | A/D or arrows | Left thumb stick (appears wherever your thumb lands on the left side) |
| Jump (hold for higher) | Space / W / Up | JUMP |
| Drop through a platform | Down + Jump | Stick down + JUMP |
| Attack | J (or X) | ATTACK |
| Special | K (or C) | SPECIAL |
| Aim up / upward variants | Hold Up while attacking or using the special | Stick up |
| Omnitrix dial | Q / E | Swipe sideways on the Omnitrix button |
| Transform, or **swap** while transformed (with a different alien selected) | T | Tap the Omnitrix button (it reads SWAP!) |
| Pause (Training: training menu) | Esc / P | II button (top centre) |
| Skip a cinematic | Any key | Tap anywhere |
| Mute | M | Settings |

What ATTACK and SPECIAL do depends on the form (the touch buttons change icon with it):

| Form | ATTACK (J) | SPECIAL (K) | Extra |
|---|---|---|---|
| Ben | Punch (parries lasers) | Dodge roll | |
| Heatblast | Fireballs (hold to auto-fire) | Hold, release: Fire Burst | Jump in mid-air: rocket jump, hold to glide |
| XLR8 | Hold: blur strikes, every 6th is a kick | Dash through enemies (Up: upward dash) | Run full speed to cross water |
| Four Arms | Punch, punch, haymaker. Up: overhead clap. Next to a downed drone, boulder or the dummy: lift, then J again to throw (Up: lob) | Ground slam with shockwaves. In the air: meteor drop | |

On-screen controls show only on touch devices (Settings → TOUCH CONTROLS: AUTO / ON / OFF). In AUTO, pressing a key hides them and touching the screen brings them back.

## Milestone 2: alien framework, XLR8 and Four Arms

### Playtest notes

The owner's notes from real phones were "nothing to fix, all good", so no fixes were needed before starting.

### Alien framework

- **One folder per alien** (`src/aliens/<id>/`): `index.ts` (the `FormDefinition`: name, stats, theme, tips, quips, move list, reachability caps), `abilities.ts` (the moves), `art.ts` (its procedural sprite sheet, HUD icon and anims), `audio.ts` (transform sting, sound recipes, music layer). Its numbers live in `config/aliens/<id>.ts`. Adding an alien is that folder, its config file, and one line in `aliens/registry.ts`. Player, Omnitrix, HUD, touch controls, Preload, Gallery, the pause move list and the reachability tests all read the registry; none of them name an alien.
- **Abilities talk to the game through a narrow contract** (`aliens/types.ts`): `AbilityContext` gives them the player handle, controls, `combat` (melee, shots, blasts, ground waves, marks, lift/hurl), `fx` and `world` (water, solids). They never import scenes.
- **Heatblast was moved into this shape without changing how he plays** (same numbers, same feel; checked side by side against the Milestone 1 build). He gained an entrance move for swaps.
- **Each alien has its own:** colour theme (dial icon and glow, shield bar, name slam, touch buttons), name-slam style (`blaze`, `blur`, `quake`), transform sting, sound set, and a **music layer** that plays over the shared soundtrack's chords while he is out (Heatblast: the original hero layer; XLR8: a high, fast arp with sixteenth-note hi-hats; Four Arms: a low lead with brassy stabs and toms).
- **Unlocks** (`systems/Unlocks.ts`): the story dial holds every alien whose `unlockChapter` you have reached. Training lends XLR8 and Four Arms (`TRAINING.lentAliens`). Unit tested.

### The dial and the swap

- **Multiple aliens on the dial:** Q/E (or a swipe on the touch Omnitrix button) turns it. The selected alien's icon slides in, and for a moment a row of every alien on the dial shows under it with the selected one large, coloured and named. Dial cycling wraps and is unit tested.
- **Omnitrix swap (new mechanic):** while transformed, select a different alien and press transform to **swap straight into it**. A swap costs 3 s of alien time, needs 1.2 s since the last transform or swap, keeps the shield at the same percentage, and every alien **arrives with an entrance attack** (Heatblast: flame nova; XLR8: a dash that cuts through everything in front; Four Arms: a landing slam). Perfect timing works on swaps too. When a swap is possible, the dial's badge pulses in that alien's colour (the touch button reads SWAP!), and a denied swap says why (NOT ENOUGH TIME TO SWAP!, RECHARGING!). Logic in `systems/Omnitrix.ts`, tested in `tests/swap.test.ts`.
- **Tag-team combos:** every form that lands hits joins the live combo. When a new one joins, the combo counter lines up their icons, the label climbs TAG TEAM! / TRIPLE THREAT! / FULL OMNITRIX!, a chime plays and **1.5 s of alien time is refunded** (half a swap). Punch as Ben, transform, swap twice: four icons.

### XLR8 (fast, fragile, precise)

- **Blur strikes:** hold J for a 70 ms flurry; every 6th hit is a kick that knocks back. He keeps 85% of his speed while striking, and strikes in mid-air hang him in place for a moment.
- **Dash through:** K dashes 100 px in 160 ms, invulnerable, straight through enemies. Everything the dash passed gets cut a beat later ("X2 CUT!" for multiples). Up+K dashes diagonally up. Dashing through an enemy shot triggers **TOO SLOW!**: slow motion and the dash comes straight back.
- **Water and gaps:** above 55% of his run speed he runs across water (with a short grace if he slows), and a long coyote time lets him clear small gaps at speed.
- **Feel:** afterimages and speed lines above 75% speed, a wind loop that rises with speed, light-blue palette, small shield (4) so hits matter.

### Four Arms (slow, heavy, unstoppable)

- **Punch chain:** two heavy punches and a four-fisted haymaker that knocks drones out of the sky. Up+J is an overhead clap: anti-air that erases shots.
- **Ground slam:** K pounds the floor: a blast at his feet plus a shockwave each way that knocks drones down. In the air it becomes a **meteor drop** whose power scales with the fall height.
- **Lift and throw:** downed drones, boulders and the Training dummy can be lifted (J) and thrown (J; Up+J lobs). A thrown drone explodes on impact and hits everything nearby.
- **Smash damage** breaks the Chapter 1 vault wall and the Armored Drone's plating.
- **Feel:** slow run and big jump with heavy gravity, footsteps that nudge the camera, long hit-stop, ground cracks that linger, camera rumble on slams, super armour (hits barely move him), biggest shield (9).

### New enemies

- **Armored Drone:** heavy plating; anything but smash damage is chipped down to 15% ("ARMOR!"). Smash hits break the plating (6 armour HP), which knocks it out of the air and leaves it exposed for 3.6 s at 1.4× damage. It lobs arcing shells at a reticle that marks where they land, and telegraphs a ram. Four Arms' counter.
- **Hornet:** tiny and twitchy. It kites at a distance, sidesteps shots ("DODGED!"), and aim assist ignores it; it alternates a darting ram with a needle spread. XLR8's strikes and dash can't be dodged and he is faster, so he is its counter.
- **Downed drones:** knockdown hits (haymaker, clap, slam waves, thrown objects) send drones to the ground for a moment, where they take extra damage and can be lifted.
- Neither new drone appears in Chapter 1. They are in Training now and are ready for Chapter 2.

### Omnitrix Training

- **OMNITRIX TRAINING** on the title screen (or `?training=1`). A holo-grid arena with a water pool (XLR8), the dummy plaza, platforms, a trench (XLR8's dash), a boulder (Four Arms) and a cracked wall that reforms.
- **Every unlocked alien plus the lent ones** on the dial. Wrong transforms are off here.
- **Training dummy:** floating damage numbers per hit, plus a DPS / total / hits readout per burst. Stunning hits knock it over, and Four Arms can throw it.
- **Pause opens the training menu:** spawn any enemy (Scout, Striker, Gunner, Armored, Hornet) with a hint about how to beat it, clear enemies, and toggles for the alien timer (off: infinite time, instant recharge), enemy attacks (off: they move but never shoot) and damage numbers. It also shows the current alien's move list.
- Built as a level like the chapters (`levels/training.ts`, a level registry, `LevelScene` mode `'training'`), so Free Play can reuse it.

### Chapter 1 vault card

The cracked wall now breaks to smash hits (Four Arms). The vault card counts toward Chapter 1's total of **4** cards from now on; the card counter shows it as a faded slot ("a card you can't reach yet") until Four Arms is on your dial. Chapter 1 completions from before this milestone keep their cards and show x/4.

## What was built (Milestone 1)

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
- **Milestone 2 hook (now live, see Milestone 2 above):** only hits of kind `'smash'` break it (3 hits, `config/secrets.ts`). Give Four Arms' heavy punch / ground slam `kind: 'smash'` and set `canSmash: true` in his reachability caps. The vault card has `requires: 'fourarms'`, so it only spawns and counts toward the card total once Four Arms is on the dial (cards stay 3/3 until then). Tests already prove the vault is unreachable now and reachable with a smashing alien.

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

**Milestone 2**

- **"One new file per alien" became one folder per alien plus a config file and a registry line.** A whole alien (moves, sprite sheet, sounds, music) in one file would run to 700+ lines, against "small focused files", and CLAUDE.md wants every tunable in `config/`. Nothing outside those three places changes when an alien is added (Heatblast, XLR8 and Four Arms prove it).
- **The Omnitrix swap is new** (not in GAME_DESIGN.md). The design's loop is transform → timer → cooldown, which on its own means one alien per transformation and makes switching a menu choice. Swapping mid-transformation costs 3 s of alien time, so the timer and cooldown still drive the loop, but switching becomes a skill: each alien arrives with an attack, perfect swaps exist, and tag-team combos refund half the cost. The swap can be turned off in `config/omnitrix.ts` (`SWAP.enabled`).
- **Tag-team combos** (refund 1.5 s per new form in a combo) also count human Ben, so "punch, then transform" is the first tag anyone does. Each form joins a combo once, so it can't be farmed: two swaps cost 6 s and refund at most 4.5 s.
- **Story unlocks are unchanged:** XLR8 and Four Arms unlock in Chapter 2 (`unlockChapter: 2`). Training lends them; `?aliens=` adds them to a practice run.
- **Training never rolls wrong transforms,** whatever the difficulty, because it is for practising a specific alien.
- **XLR8's "small gaps"** are crossed with long coyote time and the dash, not by running on air: it keeps gap design readable (a gap is a gap) while XLR8 still clears ones nobody else can.
- **Four Arms throws "stunned enemies" through a new downed state:** knockdown hits ground a drone for a moment (it takes 1.25× damage there and can be lifted), then it reboots. The same mechanic gives slams and the haymaker a purpose against every drone type.
- **The Armored Drone takes 15% from non-smash hits** rather than 0%, so a player without Four Arms is never fully stuck; it is just slow.
- **The Hornet ignores aim assist** and kites, so fireball spam doesn't beat it; XLR8's strikes and dash can't be dodged.
- **The vault card counts toward Chapter 1's total right away** (4 cards), as requested, and shows as a faded slot until Four Arms is on the dial. The title screen's card count for Chapter 1 now reads x/4 for everyone.
- **The active ring on the dial stays Omnitrix green** for every alien, so the timer reads the same whoever is out; the alien's colour goes on the icon, glow and shield bar.

## Known issues and limitations

- **Not tuned by hand.** Difficulty was tuned by reasoning, scripted playtests and a reachability test, not by human players. Boss HP (120), drone counts and the jammer ravine may need tuning after real playtests. All numbers are in `src/config/`.
- **Touch controls are untested on real hardware.** They were tested with emulated phones and multi-touch in headless Chromium. Button sizes and positions live in `config/touch.ts`.
- **Headless frame rate.** Headless Chromium (software WebGL) runs at about 40–49 FPS, so the frame-rate governor drops to its lowest level there. Not yet verified on a real mid-range Android GPU.
- **iOS Safari can't go fullscreen** or lock orientation from a web page; the game still fits the screen with the browser bars visible. Adding it to the home screen (web manifest) gives a fullscreen landscape launch.
- **Wide phones are pillarboxed:** the game keeps its 16:9 frame, so 19.5:9 phones show side bars (see IDEAS.md for an EXPAND-mode proposal).
- **Practice runs still show a rank** on Chapter Complete (it isn't saved).
- **Zoom shimmer.** The camera zoom punch on transform briefly shows pixel shimmer, because `pixelArt` rendering doesn't zoom by integer steps.
- **No gamepad support yet** (deferred).
- **XLR8, Four Arms, the Armored Drone and the Hornet are tuned by scripted playtests,** not by people. Headless Chromium runs the game at about a third of real speed, so feel (XLR8's speed, Four Arms' weight, hit-stop lengths) needs a human pass. All numbers are in `config/aliens/` and `config/enemies.ts`.
- **Chapter 1 wasn't designed around XLR8 or Four Arms.** With `?aliens=`, XLR8 makes some sections easier than intended. Chapter 2 is where they are designed in.
- **Wrong transforms can fire in story practice runs** with `?aliens=` on Normal (10%), without any comedy feedback yet (that is Milestone 3).
- **Training options reset** when the game is reloaded (they aren't saved).

## How to test

**Milestone 2, desktop** (`npm run dev`)

1. Title → **OMNITRIX TRAINING**. Press T: Heatblast. Q/E turns the dial; a row of all three aliens shows under it.
2. **Swap:** while Heatblast, select XLR8 (Q) and press T. XLR8 dashes in cutting whatever is ahead; 3 s come off the dial. Swapping again within about a second is refused, and with under 3 s left it says NOT ENOUGH TIME TO SWAP!
3. **XLR8:** hold J at the dummy (damage numbers, every 6th hit kicks). K dashes through it ("X2 CUT!" with two targets). Run across the water pool on the far left at full speed; slow down on it and you sink. Dash across the trench. Pause → SPAWN SCOUT, then dash through its laser: TOO SLOW!
4. **Four Arms:** J, J, J at the dummy (the haymaker knocks it over), then J to lift it and J to throw it. K slams (cracks, shockwaves both ways); jump and K for a meteor drop from high up. Lift the boulder and throw it. Punch the cracked wall until it breaks (it reforms).
5. **Armored Drone** (pause → spawn): fireballs and XLR8 strikes barely scratch it (ARMOR!). Four Arms' punches or slam break the plating; it drops and takes big damage while exposed.
6. **Hornet:** as Heatblast it dodges fireballs (DODGED!) and stays out of reach. As XLR8 you can run it down.
7. **Tag team:** punch the dummy as Ben, transform, keep hitting, swap, hit, swap, hit: the combo counter shows each form's icon, TAG TEAM! → TRIPLE THREAT! → FULL OMNITRIX!, and +1.5S pops by the dial each time.
8. Pause menu: ALIEN TIMER OFF (infinite time), ENEMIES PASSIVE, DAMAGE NUMBERS OFF; the move list on the right matches the current alien.
9. **Chapter 1 regression:** START from the title. Only Heatblast is on the dial, the vault wall still won't break, and the card slots show 3 plus one faded slot.
10. **Vault card:** `?aliens=fourarms`, then from the cliff checkpoint punch the cracked wall with Four Arms and grab the card (4 of 4; practice run, nothing saved as a best).

**Milestone 2, phone**

1. From the title, OMNITRIX TRAINING. Swipe sideways on the Omnitrix button to pick an alien, tap it to transform.
2. While transformed, swipe to another alien: the button reads SWAP! in that alien's colour. Tap it to swap.
3. ATTACK and SPECIAL change icons per alien. XLR8: hold ATTACK for strikes, SPECIAL to dash (stick up: upward dash). Four Arms: stick up + ATTACK claps; ATTACK next to the knocked-over dummy lifts it, ATTACK again throws.
4. Tap II for the training menu (spawn enemies, options). The combo counter and its icons sit above the Omnitrix button, clear of thumbs.

**Chapter 1, desktop**

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

**Chapter 1, phone** (open the deployed URL, or `npm run dev -- --host` and open the LAN address)

1. Hold the phone in portrait: the "turn your phone sideways" screen shows. Rotate to landscape.
2. Tap START: on Android the game goes fullscreen. The title hint talks about thumbs, not keys.
3. Tap anywhere to skip the intro. Move with your left thumb anywhere on the left side; JUMP / ATTACK / SPECIAL on the right.
4. At the pod, tap the round Omnitrix button. Hold JUMP and ATTACK together; slide your thumb between them. Hold SPECIAL as Heatblast to charge a Fire Burst. Push the stick up while attacking to aim high.
5. Swipe sideways on the Omnitrix button: with only Heatblast unlocked, the dial nudges and stays on him.
6. Tap II (top centre) to pause; the pause screen lists touch controls. Rotate to portrait mid-game: the game pauses behind the rotate screen. Lock the phone and unlock: the pause menu is up.
7. At the boss, the floor should sit above your thumbs. Finish the chapter and tap SHARE SCORE: the share sheet opens.
8. Watch for stutter during big explosions; if it stutters, `?debug=1` shows the quality level (Q0–Q2) next to the FPS.
