# Progress

## Status

**Milestone 4, part 1 (Chapter 2: Road Trip) is built.** A full second chapter: a skippable Rustbucket opening with Grandpa Max and Gwen in portrait dialogue, a rest stop and canyon road, **XLR8's discovery at a washed-out bridge** and a Hornet-swarmed river only he can run across, **the Rustbucket chase** (a roof ride on a treadmill highway, Vilgax's armoured convoy where **the watch finds Four Arms** and he throws trucks off the road, and a runaway hauler dumping barrels he can throw back), a truck stop with a crashed rig, and **ROADBREAKER**, a two-phase war-rig boss built so each of the three aliens has its moment. Misfires are live in the story (three aliens on the dial) and blocked during every scripted moment. Six approved ideas are in too: STRIKE! bowling throws, XLR8's comic-panel multi-cut, swap stats on Chapter Complete, wide phones filled edge to edge, shape-coded telegraphs and one-tap MAKE IT EASIER. `npm run typecheck`, `npm run build` and `npm test` (246 tests) all pass. Details in [Milestone 4, part 1](#milestone-4-part-1-chapter-2-road-trip) below.

Milestones 1 to 3 are described further down.

Next: Milestone 4, part 2 (Chapter 3: Dr. Animo), when asked.

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
| `?start=cp-cliff` | Start at a checkpoint (`cp-cliff`, `cp-nest`, `cp-arena`; `cp-ravine`). A practice run on the last-played file (cards and clears count, best times and splits don't); without a file nothing is saved |
| `?level=ch2` | Play Chapter 2 directly (a practice run). Combine with `&start=`: `cp-canyon`, `cp-river`, `cp-island` (Easy only), `cp-farbank`, `cp-convoy` (straight onto the RV roof, Easy and Normal), `cp-truckstop`, `cp-arena` (ROADBREAKER, Easy and Normal) |
| `?training=1` | Straight into Omnitrix Training (with the last file's aliens and difficulty) |
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
| Menus | Arrows / WASD, Enter, Esc (back); S opens Settings on Chapter Select | Tap a card to pick it, tap again to confirm; swipe or tap the arrows on Chapter Select; BACK in the top-left |
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

## Milestone 4, part 1: Chapter 2, Road Trip

### The chapter, start to finish

Sunset to night across the desert. `levels/chapter2.ts` (408 x 34 tiles), set pieces in `scenes/level/story/`, tuning in `config/chapter2.ts`, `config/story.ts` and `config/roadbreaker.ts`.

1. **The opening (skippable, never replayed on a retry):** the Rustbucket rolling down the highway at golden hour, road, props and sky rushing past, while Max ("NEXT STOP: THE WORLD'S LARGEST BALL OF YARN!"), Gwen ("A WHOLE SUMMER IN AN RV WITH MY DWEEB COUSIN") and Ben talk in a dialogue box with **pixel portraits**. Two drones swoop in behind; cut to the RV skidding into a rest stop and Ben hopping out ("FLYING TOASTERS? THAT'S MY CUE!").
2. **Rest stop:** a diner (card on the roof), gas pumps, a Mr. Smoothy stand, a drone barricade Heatblast has to burn.
3. **Canyon road:** a mesa shelf overhead (scaffold up, a hoodoo with a card only the rocket jump reaches), a tunnel, a dry wash.
4. **The washed-out bridge: XLR8's discovery.** Ben skids to a stop ("THE BRIDGE IS OUT!"), the watch acts up, the HUD's dial blows up to fill the screen and spins through silhouettes while NEW DNA DETECTED decodes, lands on XLR8 (name, tagline, two traits), and the watch throws him straight into it (never a misfire).
5. **Hornet river:** 72 tiles of water with two rock islands; only XLR8 at full speed stays up. Three Hornet ambushes fly in from the sides and above; a card hangs over open water between the islands.
6. **Far bank: Max picks Ben up** ("BEN! NEED A LIFT?" / "GRANDPA FORDED THE RIVER. DON'T ASK."). Walk to the RV: Ben climbs onto the roof.
7. **The Rustbucket chase** (below).
8. **Truck stop at night:** the runaway rig's smoking wreck, a neon motel, a garage, a cracked vault only Four Arms can open, a pole sign with a card only Stinkfly will reach ("I'D NEED WINGS TO GET UP THERE..." with a locked silhouette: UNLOCKS IN CHAPTER 3), and a mixed drone squad. Gwen, Ben and Max set up the boss ("THE CAB'S EMPTY. WHATEVER WAS DRIVING THAT THING WALKED AWAY.").
9. **ROADBREAKER** (below), then Max: "WHO WANTS MARINATED MEALWORMS?" / Gwen: "GROSS!" / Ben: "DOUBLE GROSS!" and Chapter Complete.

Checkpoints: CANYON, RIVER, ISLAND (Easy), FAR BANK, CONVOY (hidden, lit mid-chase; Easy and Normal), TRUCK STOP, ROADBREAKER (Easy and Normal). Hard keeps only RIVER, FAR BANK and TRUCK STOP.

### Alien unlocks

- **Data-driven beats:** `story.unlocks` in the level lists each alien, where its beat happens and Ben's line. `UnlockBeat` runs it; a `scripted` beat is started by another set piece (the chase starts Four Arms' on the first truck that hooks onto the RV).
- The alien stays off the dial until its beat, even on a file that later restarts before it; a restart past the beat (or a file that already has the alien) skips it. The file saves the alien the moment it's revealed.
- **The reveal is the HUD scene's unlock card** (`ui/UnlockCard.ts`): the dial scaled up, segments spinning, silhouettes cycling, then the alien in colour with its tagline and two traits from its definition (`unlock` in each alien's index).
- **Forced transforms never misfire** (`Omnitrix.forceInto`): a free swap or transform with full time, recharging the watch if needed. Misfires are also blocked through the opening, both beats, boarding the RV and the chase's finale (`SetPiece.storyLock`).

### The Rustbucket chase (the chapter's big set piece)

The RV stays put mid-arena while a **treadmill** scrolls the road, roadside props, speed lines and the whole sky backdrop (`RoadScroller`, `HighwayBackdrop.travel`). Its roof is a one-way platform and a moving solid (drones land on it, Strikers stick in it, Four Arms' shockwaves ride it) with rails at both ends so nobody falls off by accident; jump over one on purpose and Ben is hurt and put back on the roof.

1. **Ride** (19-32 s): four drone waves (Scouts, Strikers, Hornets, a Gunner; one extra per wave on Hard), **tires bouncing over the roof** (an arrow at the screen edge where they come from, a target where they land; jump them or knock them away) and **potholes** that buck the RV and toss everyone on the roof into the air ("POTHOLE! HOLD ON TO YOUR SNEAKERS!").
2. **Convoy** (2 trucks on Easy, 3 on Normal, 4 on Hard; one at a time on Easy, two on Normal and Hard). The lead rig **revs** (engine, horn, chevrons on the back of the roof), **rams** (the back of the roof jolts: whoever stands there is hurt and flung forward) and **hooks on** with a harpoon arm, dragging the RV until it yanks (same telegraph) and drops back. A second rig in the far lane **shells marked spots** on the roof. Armour takes only 30% from anything but smash. **The first hook is where the watch finds Four Arms** ("IT'S DRAGGING US OFF THE ROAD!"), and the tip says to rip the truck off: lift (J at the clamp), and the whole truck goes upside down over his head, wheels spinning; J again throws it, spinning, **OFF THE ROAD!** A thrown truck hits like a truck (20 damage): throw it into the next one. Max: "THAT'S MY GRANDSON!"
3. **The runaway hauler** roars past in the far lane, cuts in ahead and **dumps fuel barrels** onto the roof through a glowing hatch (with Hornets). Barrels roll toward the back; Four Arms can catch one and throw it forward: **BULLSEYE!** Two bullseyes and the driver loses it early; otherwise it runs out of barrels and loses it anyway. It fishtails off the road ahead; cut to the truck stop where it crashed.

A restart at the hidden CONVOY checkpoint drops Ben straight back on the roof with the convoy coming. All numbers in `config/chapter2.ts` (`CHASE`, `CONVOY`, `JUNK`); telegraph lengths are the same on every difficulty.

### ROADBREAKER (boss)

Vilgax's war rig, rebuilt from the crashed hauler. Vilgax's hologram (now with his portrait) introduces it: "MY WAR RIG HAS FLATTENED ARMIES. YOUR LITTLE TIN HOUSE ON WHEELS IS NEXT." / "NOBODY CALLS THE RUSTBUCKET A TIN HOUSE, SQUID FACE!"

- **Phase 1, truck mode:** leaps into the lot off the mesa. **Ram:** drives to the far side, revs (chevrons along the floor the whole way, headlights blazing), charges, smashes into the arena wall and sits dazed. **Barrel lob:** every landing spot marked first. **Drone dispatch.** Its armour takes only 20% from anything but smash; **its tires shred to melee** (x2) and shrug off fire (x0.25). XLR8 can dash straight through a ram (the dash is invulnerable), slashing both tires. **Both tires gone: it spins out and STALLS**; Four Arms lifts the whole truck overhead and throws it: **FLIPPED!** (30 damage). Fresh tires bolt on afterwards.
- **Phase 2, robot mode** (at 55%): it skids to the middle, rears up and stands as a robot (ROBOT MODE!). **Hammer slam:** walks up, raises both fists (a striped landing zone), slams with shockwaves both ways, fists stuck in the ground (chest in reach, touching it is safe). **Wheel saw:** rips a wheel off its shoulder and bowls it across the floor (chevrons first); jump it, or **punch it back into the robot** (RETURN!, big damage). **Beam:** kneels and fires along the floor at knee height (the Chapter 1 beam tell). **Hazard-striped chest plates only break to smash** (Four Arms); until they're gone the core takes 30-75%. **After every slam its vents open:** fire does x2.5 and builds heat; enough and it **OVERHEATS** into a kneel (x1.5 from everything).
- So: XLR8 for the tires, Four Arms for the flip and the plates, Heatblast for the vents (and the drones). Any alien, or Ben, can still win, just slower. Damage rules are pure functions with tests (`entities/bosses/roadbreaker/rules.ts`).
- Arenas now stage any boss kind (`entities/bosses/bossKinds.ts`: music, Vilgax's lines, banners, extra parts like tires and plates); the Hunter-Killer is unchanged.

### Collectibles and secrets

- **Five Sumo Slammers cards:** the diner roof, the hoodoo (rocket jump), over the river (XLR8), the vault (Four Arms) and the pole sign (Stinkfly, Chapter 3). Mr. Smoothy cups in the rest stop, on the mesa shelf, on the far bank and on the motel balcony.
- **The way back to Chapter 1:** a cracked wall whose alien isn't on the dial now shows that alien's rim-lit silhouette and **UNLOCKS IN CHAPTER N**, so Camp Crash's vault points at Road Trip. When an alien joins mid-chapter, walls update to name it. Smashing a vault in Chapter 2 makes Ben remember the one at camp ("WAIT... THERE WAS ONE OF THESE BACK IN CAMP CRASH!"), and **Chapter Select flags chapters with a secret the file can now open** (a pulsing SECRET WAITING! chip and a glinting card slot).
- Chapter Select gets a Road Trip diorama (the Rustbucket at sunset, Ben on the roof, a convoy rig on its tail); bests, ranks, per-difficulty medals and splits work for Chapter 2 exactly like Chapter 1.

### Scripted playtests and what they caught

Chapter 2 was played start to finish by a script in headless Chromium (title > Chapter Select > the whole chapter > Chapter Complete) on **Normal (desktop 1280x720)**, **Hard (phone 844x390)** and **Easy (desktop)**, plus **Normal (phone)**, and Chapter 1 was rechecked on a 20:9 phone (915x412). The script plays the intended route (Heatblast for the barricade, XLR8 across the river, Four Arms ripping trucks off the RV) and drives the boss through its counters (tires, stall, flip, transformation, plates, vents). Along the way it caught, and these are fixed:

- **Falling through the RV roof** on a slow frame (the roof body was 8 px; a 30 fps phone could drop Ben through it on landing). Now 24 px deep.
- **Leaping off the broken bridge into the river** before XLR8's discovery started (the beat waited for Ben to land). Beats now start mid-jump and stop him dead over the ledge.
- **The canyon's dry wash** had a 3-tile lip only a perfect full jump cleared. Now 2 tiles.
- **Truck stop:** only Heatblast and Four Arms could climb over the outcrop to the boss (caught by the reachability test), and missing the jump from the balcony dropped Ben into a slot beside the vault. A crate step and a balcony that reaches the rock fix both.
- **ROADBREAKER:** a flipped truck could be lifted again the moment it landed, so Four Arms could chain flips and skip robot mode. One flip per stall now.
- A pit respawn could shorten a longer invulnerability (a story beat's); it now only extends it.

### Approved ideas built this milestone

- **STRIKE!:** a thrown enemy (or truck, or boss) bowls through ordinary enemies; two or more down pops STRIKE! with a slow-motion beat (`COMBAT.bowlingSlowdown`, `strikeHits`).
- **Multi-cut freeze-frame:** XLR8's dash cutting 4+ enemies freezes into a comic panel (the HUD draws it) with a slash across each, then they all burst.
- **Swap stats:** SWAPS and BEST TAG TEAM rows on Chapter Complete with a small, capped score bonus (`config/scoring.ts`).
- **Wide phones filled:** EXPAND scaling up to 21.6:9; HUD, touch controls and every menu anchor to the real screen edges (`ui/view.ts`); checked on emulated phones for every screen, Chapter 1 included.
- **Shape-coded telegraphs:** every red danger zone also carries stripes (stay out) or chevrons (the way it travels); impact spots get a target with a cross (`Telegraphs.zone/target`).
- **MAKE IT EASIER:** after 4 deaths (not on Easy) the game over menu offers a one-tap step down, explained, keeping everything.

## Milestone 3: core systems

### Playtest notes

The owner's notes were "nothing to fix, all good so far", so no fixes were needed before starting.

### Wrong transformations (misfires)

**Rules** (`systems/Omnitrix.ts`, `systems/MisfireRules.ts`, numbers in `config/omnitrix.ts` `MISFIRE`):

- A transform misfires at the difficulty's chance: **Easy 0%, Normal 10%, Hard 25%** (`config/difficulty.ts`).
- **Swaps misfire too, at half the chance** (5% / 12.5%). A swap is a deliberate combat move, so it should mostly obey, but the chaos is still there.
- A misfire **never lands on the alien Ben already is** (or the one he asked for); it picks one of the others at random. So a transform needs 2 aliens on the dial to misfire, a swap needs 3.
- **Never** on the first transformation of a story run (the tutorial moment), during the story intro, or while a boss makes its entrance (the arena lock, the Vilgax hologram and the boss's drop-in). Training ignores these and uses its own switch.
- **Two ways out**, so a misfire is a decision, not just a penalty: the Omnitrix "owes you one", so **the next swap costs half (1.5 s) and can't misfire** (the dial badge and touch button say FIX); or **roll with it**: the first KO as the misfired alien refunds **+2 s** ("IMPROVISED!").
- Unit tested with a seeded generator (`systems/Rng.ts`, mulberry32): exact rates per difficulty over 20,000 rolls, swaps at half, never into the current alien, never when blocked, the fix swap, the improvise bonus once, determinism per seed (`tests/misfire.test.ts`).

**The gag** (`scenes/level/MisfireBeat.ts`, `TransformSequence.ts`, `ui/Banner.ts`):

1. **The tell:** the wind-up runs a quarter-second longer while the watch sputters (sparks, a glitchy stutter, a red emblem). The HUD dial keeps showing the alien Ben picked, so the surprise isn't spoiled.
2. **The reveal:** the transformation bursts as usual. Once the flash clears, a **DJ record scratch**, the **music cuts out dead**, the world drops to 5% speed and **goes sepia**, and the camera punches in **2x on Ben's face** with a small dutch tilt. He does a **double take** (looks one way, then the other), a "?!" pops beside his head and he says his line.
3. **The card:** "WANTED: XLR8" appears and gets **struck out in red**, "FOUR ARMS?!" stamps in under it in the alien's colour, and a **MISFIRE! rubber stamp** thunks onto the corner. The dial glitches.
4. Under a second later everything snaps back, the music returns with the new alien's layer, and Ben is invulnerable through the whole beat. Swaps get a snappier version (1.5x zoom, shorter freeze).
5. **A line for every pair:** each alien's folder has Ben's reaction for every alien he might have wanted instead, two per pair, never the same one twice in a row ("I WANTED MUSCLES, NOT MATCHES!", "WHERE ARE MY OTHER TWO ARMS?!", "I ORDERED THE SPICY ONE!"). New aliens fall back to their own generic line, then Ben's ("AW MAN, NOT THIS GUY!"). Tests check every pair has its own lines and that they fit on a phone.
6. **MISFIRES** row on Chapter Complete ("2 IMPROVISED!"), and the share text brags about them.
7. **Training:** pause > MISFIRES: OFF / 10% / 25% / CHAOS (100%).

Accessibility: no flashes in the gag; the tilt follows Screen Shake (0% = no tilt); the zoom and sepia are gentle colour and framing changes.

### Difficulty

- Chosen when a save file is created, stored in the file, changeable any time in **Settings** (in a level, on Chapter Select via SETTINGS [S], or from the title for the Continue file). The Settings row spells out every number it changes. It applies straight away; checkpoints follow on the next restart.
- Every value comes from `config/difficulty.ts`. On top of the design table (alien time, recharge, misfires, damage, checkpoints), Hard is a different fight, not just bigger numbers:
  - **Enemies rest less between attacks** (x0.68), **start sooner after waking** (x0.5) and **stay open to punishes for less time** (x0.75: a Striker stuck after a dive, an Armored Drone's exposed core, the boss after a slam).
  - **The boss rests less between attacks** (x0.7) and **gets angry earlier** (phase 2 at 60% health instead of 50%).
  - **Telegraphs are identical on every difficulty**, so attacks stay readable: hard but fair.
  - **Checkpoints:** Chapter 1 has 4 on Easy, 3 on Normal, 2 on Hard (the cliff checkpoint goes, so the forest and ridge are one long section).
  - Easy goes the other way (x1.3-1.4 everything) and a Mr. Smoothy heals 3 instead of 2.
- **Best times, ranks, scores and splits are kept separately per difficulty.** Chapter Select shows the best on the file's difficulty plus a medal (best rank) for each difficulty. A run that changes difficulty midway still counts as a clear and keeps its cards, but isn't timed (Chapter Complete says DIFFICULTY CHANGED).
- After 4 deaths in a run (not on Easy) the game over tip says Settings can lower the difficulty and the file keeps everything.
- The active difficulty lives in `systems/Difficulty.ts` (Phaser-free so enemy logic stays testable) and is read live by enemies, the Omnitrix and damage.

### Save files

- **Three files** (save version 3, `systems/SaveSystem.ts`). Each keeps: difficulty, chapter progress (completed, clears), unlocked aliens, Sumo Slammers cards (once per file, any difficulty), play time, and per-difficulty best time / rank / score / splits.
- **Resume point:** reaching a checkpoint, dying, or SAVE & QUIT stores the run so far at the last checkpoint. **Continue** on the title drops straight back in there; Chapter Select offers CONTINUE: NEST or RESTART.
- **Migration:** a version 1 (Milestone 1) or version 2 (Milestone 2 / polish pass) save becomes **File 1 on Normal** (the only difficulty there was) with every best, card, split and setting kept. Settings stay shared by all files. Corrupt or junk data is repaired field by field. Tests feed it real Milestone 1 and 2 save shapes.
- Storage stays wrapped in try/catch; with no storage the game still runs (nothing persists).

### Menus and the loop

**Title > Save files > Difficulty > Chapter select > Play > Chapter complete > Chapter select.**

- **Title:** CONTINUE (straight back in) and SAVE FILES once a file exists, NEW GAME before; a gold detail line explains the highlighted option ("FILE 1 - HARD - CAMP CRASH, NEST"). Ben now stands to the side, transforming through the aliens.
- **Save files:** three cards with the difficulty badge, the file's aliens, chapters, cards, aliens found, play time and where it's saved. PLAY, NEW GAME, or ERASE with a confirm dialog (KEEP IT is the default).
- **Difficulty:** three cards (EASY "SUMMER VACATION", NORMAL "IT'S HERO TIME", HARD "VILGAX IS WATCHING") listing alien time, recharge, misfires, damage taken, checkpoints and enemies, with a line on what each feels like. Hard's red eye breathes.
- **Chapter select:** all 12 chapters in a carousel, grouped by act (the act title changes colour per act). Chapter 1 shows a little animated diorama (camp, RV, campfire, Ben, the green meteor streaking over), COMPLETE/NEW, the best time and rank on this difficulty, E/N/H medals and its four card slots (faded for the one behind a later alien). Locked chapters are **mystery silhouettes** of who's coming (Four Arms and XLR8, Wildmutt and Stinkfly, Kevin and Upgrade, Diamondhead and Ghostfreak, a tiny Grey Matter, Ripjaws, Cannonbolt, Ghostfreak, Wildvine, a red Omnitrix counting down, Vilgax and Way Big too big for the card) with a cryptic line ("SOMETHING IN THE WATCH WANTS OUT."). Only the next chapter's title is revealed.
- **First clear:** back on Chapter Select a CLEARED! stamp lands on the chapter, the carousel slides to the next one and its title **decodes letter by letter** ("NEW CHAPTER REVEALED"). A new file opens with "A NEW SUMMER BEGINS!".
- **Chapter complete:** CONTINUE (to Chapter Select), PLAY AGAIN, SHARE SCORE; the header shows the difficulty; the next chapter's tease underneath.
- **Pause:** shows the file and difficulty; SAVE & QUIT goes back to Chapter Select. **Game over:** RETRY, SETTINGS, QUIT TO CHAPTERS.
- **One look and sound:** the same night backdrop (pines drift on a shared clock, so cutting between menus never jumps), framed panels and buttons, an Omnitrix-emblem iris transition, and new confirm / back / whoosh / reveal / erase sounds.
- **Touch:** every menu works with taps (first tap picks a card, second confirms), swipes and on-screen arrows on Chapter Select, a BACK button top-left. Checked on an emulated Pixel 7 in landscape.

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

**Menus:** title screen (Ben and Heatblast swap with a green flash), pause with a controls list, a game over screen with tips, and retry from checkpoint. (Milestone 3 rebuilt these into the full loop.)

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
- **Landscape:** portrait shows a "turn your phone sideways" screen and freezes the game behind the pause menu. The first title-menu choice requests fullscreen + landscape lock where the browser allows it (Android Chrome; iOS Safari doesn't support it).
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
- **Minimal pause, game over and title menus** were built in Milestone 1 because Esc is in the controls table and a vertical slice needs a way to restart. Milestone 3 turned them into the full loop.
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

**Milestone 3**

- **Swaps misfire at half the chance** (the owner's preference), and never into the current alien. Swaps were added in Milestone 2; the design table only covers transforms.
- **A misfire comes with two outs:** a half-price, misfire-proof fix swap, or +2 s for the first KO as the wrong alien. Without them, 25% on Hard is pure punishment; with them every misfire is a split-second decision, and "got the wrong alien and still clutched it" is the clip.
- **Misfires stay quiet in the opening moments:** never on a run's first transform, in the intro, or during a boss entrance. These are the "forced story moments"; Chapter 5's scripted misfire will bypass the rule on purpose.
- **The HUD hides a misfire until the reveal** (it shows the alien Ben picked during the wind-up), because the joke is the surprise.
- **Hard keeps telegraph lengths the same** and changes pacing instead (rest between attacks, wake-up grace, punish windows, boss rage threshold). Shorter telegraphs would make Hard unfair rather than hard.
- **Difficulty belongs to the save file,** and Settings changes the file being played (or, from the title, the Continue file). A run that changes difficulty is a clear but not a timed run, so every best time was earned on one difficulty.
- **Old saves become File 1 on Normal,** since Normal was the only difficulty before.
- **Continue resumes mid-chapter** at the last checkpoint with the run so far (time included), the same as a checkpoint restart. Not asked for, but a browser game gets closed mid-level all the time.
- **Chapter Select tease:** chapter names stay "? ? ?" until the chapter before is done (only Road Trip shows after Chapter 1), so the story isn't spoiled; the silhouettes and one-liners do the teasing.
- **Way Big is cropped** by his card on purpose.
- **Play time** counts time spent in levels (menus don't count).

**Milestone 4, part 1 (Chapter 2)**

- **The "Rustbucket driving segment" is a ride on the roof**, not Ben driving: Max drives (he's ten), Ben fights on the roof. The owner asked for "a driving/riding section that changes pace"; riding keeps every alien's moveset in play and lets the convoy and Four Arms' unlock happen on it. The opening is a short driving cinematic.
- **The runaway truck is the rig the convoy escorts.** The chase ends with it crashing at the truck stop, and its drone core becomes ROADBREAKER, so the set piece leads into the boss.
- **ROADBREAKER isn't in GAME_DESIGN.md** (Chapter 2 had no boss). It's a Vilgax machine like Chapter 1's, keeping the Vilgax thread (his hologram returns, with his portrait). It transforms at a fixed 55% on every difficulty (the transformation is a story beat), while rests and punish windows follow the difficulty.
- **Max and Gwen appear as portrait dialogue only.** Gwen's spells and support are Milestone 5; the owner asked for light dialogue with portraits here.
- **XLR8 unlocks before Four Arms** (the river comes first); both unlock in this chapter as the design says.
- **Treadmill instead of a moving camera** for every vehicle scene: the RV and trucks stay put and the world scrolls. It keeps physics, hitboxes and the roof platform simple and stable at 60 fps.
- **A thrown truck (or boss) does at least 20 damage** to whatever it lands on (`Liftable.impactDamage`), and a thrown object no longer hits itself with its own landing blast.
- **The convoy's armour takes 30% from non-smash** and ROADBREAKER's truck 20%: Heatblast can still chip them (never stuck), Four Arms is the fast answer.
- **Cards behind an alien a chapter unlocks spawn from the start** (the Chapter 2 vault card is there before Four Arms is), and they count toward the chapter's total like Chapter 1's vault.
- **Chapter 2's par time is 7:00** (Chapter 1's is shorter): it's a longer chapter.

## Known issues and limitations

- **Not tuned by hand.** Difficulty was tuned by reasoning, scripted playtests and a reachability test, not by human players. Boss HP (120), drone counts and the jammer ravine may need tuning after real playtests. All numbers are in `src/config/`.
- **Touch controls are untested on real hardware.** They were tested with emulated phones and multi-touch in headless Chromium. Button sizes and positions live in `config/touch.ts`.
- **Headless frame rate.** Headless Chromium (software WebGL) runs at about 40–49 FPS, so the frame-rate governor drops to its lowest level there. Not yet verified on a real mid-range Android GPU.
- **iOS Safari can't go fullscreen** or lock orientation from a web page; the game still fits the screen with the browser bars visible. Adding it to the home screen (web manifest) gives a fullscreen landscape launch.
- **Phones wider than 21.6:9 still get thin side bars** (the view stops growing at 864 px wide so level design stays readable).
- **Practice runs still show a rank** on Chapter Complete (it isn't saved).
- **Settings' difficulty details line** is long; on the smallest phones it reads small.
- **Zoom shimmer.** The camera zoom punch on transform briefly shows pixel shimmer, because `pixelArt` rendering doesn't zoom by integer steps.
- **No gamepad support yet** (deferred).
- **XLR8, Four Arms, the Armored Drone and the Hornet are tuned by scripted playtests,** not by people. Headless Chromium runs the game at about a third of real speed, so feel (XLR8's speed, Four Arms' weight, hit-stop lengths) needs a human pass. All numbers are in `config/aliens/` and `config/enemies.ts`.
- **Chapter 1 wasn't designed around XLR8 or Four Arms.** With `?aliens=`, XLR8 makes some sections easier than intended. Chapter 2 is where they are designed in.
- **Misfires can't happen in the Chapter 1 story** (only Heatblast is on the dial); from Chapter 2 on they do.
- **Chapter 2 is tuned by scripted playtests, not people.** The chase's pacing (ride length, convoy size, barrel timing) and ROADBREAKER's health (170) and armour are the first things to check with real players. Every number is in `config/chapter2.ts` and `config/roadbreaker.ts`.
- **Vehicles don't block Ben.** Trucks and the boss truck are hazards and targets, not physics bodies, so Ben can walk through a parked truck (a dazed or stalled one doesn't hurt). Kept simple on purpose.
- **Headless runs at about a third of real speed,** so the chase's feel (pothole bounce, the ram's fling, the truck lift slow-motion) needs a human pass.
- **Headless Chromium runs the misfire gag at about a third of real speed,** so its timing (the 300 ms before the scratch, the 0.76 s freeze) still needs a human pass on real hardware. All timings are in `config/omnitrix.ts` `MISFIRE`.
- **Difficulty pacing is tuned by reasoning, not playtests.** Hard Chapter 1 in particular (two checkpoints, relentless drones) may need a pass. All numbers are in `config/difficulty.ts`.
- **Saves live in one browser:** no cloud sync or export yet (see IDEAS.md).
- **Training options reset** when the game is reloaded (they aren't saved).

## How to test

**Milestone 4, part 1: Chapter 2, desktop** (`npm run dev`)

1. **Get there:** a file that has cleared Chapter 1 (or clear it), Chapter Select > ROAD TRIP > PLAY. Shortcut for single sections: `?level=ch2&start=<checkpoint>` (see the URL switches; practice runs, nothing saved as a best).
2. **Opening:** the RV drives at sunset while Max, Gwen and Ben talk with portraits; drones swoop in; cut to the rest stop. Any key skips. Die later and retry: it doesn't replay.
3. **Rest stop and canyon:** Heatblast burns the barricade. The diner roof card (awning, then roof), the hoodoo card above the mesa shelf (rocket jump from the shelf).
4. **XLR8:** walk onto the broken bridge: the watch acts up, NEW DNA DETECTED, the XLR8 card, and Ben becomes XLR8 (never a misfire, even on Hard). Run across the river; slow down and you sink. Three Hornet waves. Grab the card over the water between the islands.
5. **Pick-up:** on the far bank the RV rolls in; walk into it.
6. **Chase, ride:** drone waves, tires bouncing over the roof (arrow at the right edge, target where it lands: jump it or punch it away), potholes tossing you up. Jump over a rail at the end of the roof: you're hurt and put back.
7. **Chase, convoy:** a rig revs (chevrons on the back of the roof): step forward or jump as it rams. It hooks on: NEW DNA again, and Four Arms. Walk to the back, J at the clamp to lift the truck, J to throw it; try throwing it into the next one. The far-lane rig marks spots on the roof before each shell. Die here and retry: you're back on the roof with the convoy (Easy and Normal).
8. **Chase, hauler:** it overtakes and drops barrels and Hornets. As Four Arms, J on a rolling barrel to catch it, face right, J to throw: BULLSEYE! Two and it crashes early.
9. **Truck stop:** the crashed rig smoulders. The cracked vault: punch it as Four Arms (Ben remembers the one at camp if you haven't opened it). Stand under the tall pole sign: Stinkfly's locked silhouette, UNLOCKS IN CHAPTER 3. Climb the crate and the balcony to get over the outcrop.
10. **ROADBREAKER:** Vilgax's hologram (with his portrait), then the truck leaps in. Watch for: the ram's floor chevrons (jump it, stand on a scaffold, or dash through as XLR8, slashing tires), barrels' targets, POP! tires, STALLED!, Four Arms lifting the whole truck (FLIPPED!). At about half health: ROBOT MODE. The striped slam zone, fists stuck (walk up and smash the striped plates), the vents glowing after a slam (fire overheats it: OVERHEATED!), the wheel saw (jump it or punch it back: RETURN!), the knee-height beam. Then the mealworms line and Chapter Complete (SWAPS and BEST TAG TEAM rows; STRIKES and MULTI-CUTS called out next to the drone and combo counts).
11. **Difficulty:** on Easy the convoy is 2 trucks one at a time; on Hard 4 trucks, one extra drone per ride wave, three Hornets per hatch release, fewer checkpoints (RIVER, FAR BANK, TRUCK STOP). Misfires happen in the story now (not during any of the scripted moments).
12. **Back to Chapter 1:** Chapter Select shows SECRET WAITING! on Camp Crash (its vault card slot glints). Play Camp Crash: the vault wall now names FOUR ARMS; smash it. Before Chapter 2, that wall shows Four Arms' shadow and UNLOCKS IN CHAPTER 2.

**Milestone 4, part 1, phone and wide screens**

1. Any phone in landscape, including 20:9 ones: no side bars; the HUD hugs the corners and the touch buttons the screen edges. Check the title, files, difficulty, Chapter Select (the Road Trip diorama), Settings, pause, game over (MAKE IT EASIER after 4 deaths), Chapter Complete.
2. The chase on touch: the stick moves along the roof, JUMP clears tires, ATTACK lifts and throws trucks and barrels. The dialogue box sits at the top, clear of thumbs.
3. ROADBREAKER: the floor and the boss bar stay above the thumbs; the ram's floor chevrons are readable.

**Approved ideas, quick checks**

- **STRIKE!:** Training or the chase: knock drones down, lift one as Four Arms and throw it through two others.
- **Comic panel:** XLR8 dash through four or more enemies (the river or the ride waves are good spots).
- **Telegraph shapes:** every red zone has stripes or chevrons; boss bombs and shells show a target with a cross. Reduce Flashing still applies.
- **MAKE IT EASIER:** die 4 times on Normal or Hard: the game over menu offers it, explains what changes, and retries one step easier.

**Milestone 3, desktop** (`npm run dev`)

1. **Fresh start:** clear site data (or use a private window). The title says NEW GAME. Enter > three empty files > Enter > the difficulty cards (Normal selected; arrows to compare, the numbers and the blurb change) > START ON HARD.
2. **Chapter Select:** "A NEW SUMMER BEGINS!", Chapter 1's diorama with the meteor, NEW!, BEST ON HARD empty, E/N/H medals, four card slots (one faded). Right arrow through all 12: silhouettes, act colours, "? ? ?" titles, cryptic lines, COMING SOON. Chapter 12's Way Big is cut off by the card.
3. **Play and save:** PLAY. Reach the first checkpoint (CLIFF on Easy and Normal; on Hard it's NEST, past the jammer ravine), then Esc > SAVE & QUIT. Chapter Select now offers CONTINUE: CLIFF (or NEST) and RESTART. Esc twice to the title: CONTINUE reads "FILE 1 - HARD - CAMP CRASH, ...". Press it: you're back at that checkpoint with your run time.
4. **Hard feels different:** the cliff checkpoint is gone, drones attack noticeably more often and start sooner, stuck Strikers rise faster, the boss rages at 60%. Compare with Easy (more checkpoints, lazier drones).
5. **Finish Chapter 1:** Chapter Complete shows HARD in the header and a MISFIRES row; CONTINUE goes to Chapter Select: CLEARED! stamps on Camp Crash, the carousel slides to Chapter 2 and ROAD TRIP decodes. The Hard medal now has your rank.
6. **Per-difficulty bests:** on Chapter Select press S (Settings), change the difficulty: the card switches to that difficulty's best (empty on a new one). Play it: splits say FIRST RUN! again (they're per difficulty). Change difficulty mid-level: Chapter Complete says DIFFICULTY CHANGED and the best time isn't touched.
7. **Misfires:** title > OMNITRIX TRAINING > pause > MISFIRES: CHAOS (100%). Resume, press T: the watch sputters, Ben turns into the wrong alien, record scratch, music cuts, sepia freeze-frame, close-up, double take, his line, the WANTED/GOT card. The dial badge says FIX: press T to swap back for 1.5 s (FIXED IT!), or first spawn a Scout from the pause menu and KO it as the wrong alien for IMPROVISED! +2S. Try every pair for every line. Set MISFIRES to 25% and swap a lot: swaps misfire about half as often. Screen Shake 0% removes the tilt.
8. **Story guards:** `?aliens=fourarms,xlr8` with a Hard file: the first transform of the run never misfires; later ones do about 1 in 4. In the boss arena, no misfire happens while the Hunter-Killer drops in.
9. **Old save:** in the console run `localStorage.setItem('ben10-omnitrix-summer', JSON.stringify({version:2,muted:false,settings:{shake:0.6},chapters:{ch1:{completed:true,bestTimeMs:250000,bestRank:'A',bestScore:1000,cards:['ch1-card-ridge'],clears:2,bestSplits:{'cp-cliff':61000}}}}))` and reload: CONTINUE loads File 1 on Normal with rank A, 4:10.00, one card, Road Trip revealed.
10. **Files:** SAVE FILES > a second file on Easy; X (or ERASE) asks before erasing, KEEP IT is the default.
11. **Game over:** die 4 times in a run on Normal or Hard: the tip suggests lowering the difficulty; SETTINGS is right there.

**Milestone 3, phone**

1. Title: tap NEW GAME. On the files screen tap a card once to pick it, again to start. Tap a difficulty card, tap again (or START).
2. Chapter Select: swipe left/right or tap the green arrows; tap a side card to bring it in, tap the middle one to play. BACK is top-left, SETTINGS top-right.
3. In a level: II > SAVE & QUIT; the title's CONTINUE brings you back.
4. Training with MISFIRES on: the Omnitrix button reads FIX! (gold) after a misfire; tap it to swap back.

**Milestone 2, desktop** (`npm run dev`)

1. Title → **OMNITRIX TRAINING**. Press T: Heatblast. Q/E turns the dial; a row of all three aliens shows under it.
2. **Swap:** while Heatblast, select XLR8 (Q) and press T. XLR8 dashes in cutting whatever is ahead; 3 s come off the dial. Swapping again within about a second is refused, and with under 3 s left it says NOT ENOUGH TIME TO SWAP!
3. **XLR8:** hold J at the dummy (damage numbers, every 6th hit kicks). K dashes through it ("X2 CUT!" with two targets). Run across the water pool on the far left at full speed; slow down on it and you sink. Dash across the trench. Pause → SPAWN SCOUT, then dash through its laser: TOO SLOW!
4. **Four Arms:** J, J, J at the dummy (the haymaker knocks it over), then J to lift it and J to throw it. K slams (cracks, shockwaves both ways); jump and K for a meteor drop from high up. Lift the boulder and throw it. Punch the cracked wall until it breaks (it reforms).
5. **Armored Drone** (pause → spawn): fireballs and XLR8 strikes barely scratch it (ARMOR!). Four Arms' punches or slam break the plating; it drops and takes big damage while exposed.
6. **Hornet:** as Heatblast it dodges fireballs (DODGED!) and stays out of reach. As XLR8 you can run it down.
7. **Tag team:** punch the dummy as Ben, transform, keep hitting, swap, hit, swap, hit: the combo counter shows each form's icon, TAG TEAM! → TRIPLE THREAT! → FULL OMNITRIX!, and +1.5S pops by the dial each time.
8. Pause menu: ALIEN TIMER OFF (infinite time), ENEMIES PASSIVE, DAMAGE NUMBERS OFF; the move list on the right matches the current alien.
9. **Chapter 1 regression:** play Chapter 1 from a save file. Only Heatblast is on the dial, the vault wall still won't break, and the card slots show 3 plus one faded slot.
10. **Vault card:** `?aliens=fourarms`, then from the cliff checkpoint punch the cracked wall with Four Arms and grab the card (4 of 4; practice run, nothing saved as a best).

**Milestone 2, phone**

1. From the title, OMNITRIX TRAINING. Swipe sideways on the Omnitrix button to pick an alien, tap it to transform.
2. While transformed, swipe to another alien: the button reads SWAP! in that alien's colour. Tap it to swap.
3. ATTACK and SPECIAL change icons per alien. XLR8: hold ATTACK for strikes, SPECIAL to dash (stick up: upward dash). Four Arms: stick up + ATTACK claps; ATTACK next to the knocked-over dummy lifts it, ATTACK again throws.
4. Tap II for the training menu (spawn enemies, options). The combo counter and its icons sit above the Omnitrix button, clear of thumbs.

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
