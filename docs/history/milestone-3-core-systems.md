# Milestone 3: core systems

_Archived from `docs/PROGRESS.md` on 2026-10-03. The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`._

## Playtest notes

The owner's notes were "nothing to fix, all good so far", so no fixes were needed before starting.

## Wrong transformations (misfires)

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

## Difficulty

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

## Save files

- **Three files** (save version 3, `systems/SaveSystem.ts`). Each keeps: difficulty, chapter progress (completed, clears), unlocked aliens, Sumo Slammers cards (once per file, any difficulty), play time, and per-difficulty best time / rank / score / splits.
- **Resume point:** reaching a checkpoint, dying, or SAVE & QUIT stores the run so far at the last checkpoint. **Continue** on the title drops straight back in there; Chapter Select offers CONTINUE: NEST or RESTART.
- **Migration:** a version 1 (Milestone 1) or version 2 (Milestone 2 / polish pass) save becomes **File 1 on Normal** (the only difficulty there was) with every best, card, split and setting kept. Settings stay shared by all files. Corrupt or junk data is repaired field by field. Tests feed it real Milestone 1 and 2 save shapes.
- Storage stays wrapped in try/catch; with no storage the game still runs (nothing persists).

## Menus and the loop

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

## How to test (at the time)

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
