# Bugs

The quality pass after Chapter 4 (real-phone performance plus a bug hunt across Chapters 1 to 4). Every finding, with its category, severity, where, cause and status. Severity: **critical** (crash, softlock, lost progress), **major** (wrong behaviour players will hit, unreadable text), **minor** (cosmetic, rare, or debug-only).

Status: **fixed**, **needs your decision** (a design or difficulty call, not a bug), **deferred** (with the reason).

How they were found: the on-device autobench run headless (it stops levels mid-action dozens of times), a string lint over all 1,100 player-facing strings plus a dictionary pass, a text-overflow checker and screenshot sweep at three screen sizes, fuzz runs at every checkpoint, and reading the code paths each category names. The permanent checks are listed at the end.

## Technical

| # | Severity | Where | Bug | Cause | Status |
|---|---|---|---|---|---|
| T1 | critical | Pause menu during a misfire gag | Quitting (or restarting) from the pause menu while the misfire freeze-frame was playing froze the whole game: an error during the level's shutdown stopped Phaser's game loop (reproduced on the build before the fix: 0 frames after Quit) | Phaser shuts the cameras down before the level's own shutdown handler, and `MisfireBeat.finish()` reset the camera zoom unguarded | fixed |
| T2 | major | Saves | A save that couldn't be read (a write cut short, a hand edit) was replaced by an empty one on the next save, with no copy kept | `SaveSystem.load()` fell back to defaults and the next write overwrote the original | fixed: the unreadable text is kept under `ben10-omnitrix-summer:unreadable` first |
| T3 | minor | Saves, game open in two tabs | Progress made in one tab could be overwritten by the other tab's next save (its in-memory copy was stale) | The save is cached in memory and never re-read | fixed: a `storage` event from the other tab drops the cache, so the next write starts from what the other tab saved |
| T4 | major | Phones: sound | Phaser's own sound manager, unused (the game has its own Web Audio engine), still opened a second AudioContext that ran silently the whole session: an extra real-time audio thread on the phone | Phaser's default `audio` config | fixed: `audio: { noAudio: true }`; one AudioContext now (checked headless) |
| T5 | minor | Phones: the first tap's sound | Sound was unlocked from `pointerdown` handlers only. Browsers grant audio on the *end* of a tap (`touchend` / `pointerup`), so on stricter browsers (iOS Safari, some Android builds) the first tap could stay silent, and iOS can suspend audio again after a call | Unlock bound to the start of a tap | fixed: page-level listeners on every gesture end unlock (and re-unlock) sound. Headless Chromium already unlocked on the first tap before the fix, so this one is hardening, not reproduced |
| T6 | major | Sound, phones switching apps (and any long stall) | The music kept playing in the background as bursts of notes, and after any stall of the page (a slow level load, a phone throttling the tab) it played every note it had missed at once: a test reproduced 42 notes landing together, up to 1.3 s late | The music runs on a 25 ms timer that catches up on missed steps; background tabs throttle timers to about once a second; the game's audio never paused when the page was hidden | fixed: sound pauses while the page is hidden and resumes on return, and the music skips the steps it missed (`tests/music.test.ts`) |
| T7 | major | Phones: the stick | If the page lost focus while a thumb held the stick (the notification shade, an app switch) and the browser never sent that touch's end, the stick stayed dead for the rest of the level: the next thumb on it counted as a tap (reproduced headless on the build before the fix) | The pad was reset, but the touch layer kept the old finger's stick track, and only one finger may hold the stick | fixed: every hold is dropped when the window loses focus or the page is hidden |
| T8 | major | Chapter 4, the maintenance line | Ben appeared inside the parked cart's solid body on every respawn at the MAINTENANCE LINE checkpoint (every difficulty); a fall onto the live rail could also respawn him inside it once it had parked back on his last safe spot, and the empty cart rolling home could slide over him. He stayed inside until he walked out (found by the fuzz runs, all three reproduced headless) | The checkpoint spawns Ben 18 px past its flag, which was inside the cart; safe spots and the cart's roll home ignored solids that move | fixed: the checkpoint flag moved two tiles left, a respawn lands on top of whatever now fills the safe spot, and an unmanned cart stops 10 px short of Ben. `tests/spawns.test.ts` checks every checkpoint of Chapters 1-4 against carts, lifts, shutters, hidden doors and vines |
| T9 | minor | Chapter Select, a new chapter's reveal | On slow frames (a struggling phone) the title's decode finished twice: a second NEW CHAPTER REVEALED on top of the first and a double pop of the title (reproduced headless at about 8 FPS) | After a long frame Phaser's clock replays missed repeats of a timer in one go, and `remove()` called inside that catch-up doesn't stop the next call | fixed: the decode ignores calls after it finishes |

## Logical

| # | Severity | Where | Bug | Cause | Status |
|---|---|---|---|---|---|
| L1 | major | Game Over tips, Chapters 3 and 4 | Tips talked about Strikers, drones and Chapter 1's boss slam in chapters that have none of them; one could name an alien before its chapter unlocks it | One tip list for the whole game, picked at random | fixed: every tip names the chapters it fits and the alien it needs; Chapters 3 and 4 get tips about their own enemies (reworded from the enemies' existing Training hints) |
| L2 | minor | Game Over tips, Chapter 3 | The Lurker tip named Wildmutt while waiting only for Stinkfly, so it could name Chapter 3's new alien before Ben gets it; and Game Over never knew which aliens were on the dial (it read the file's list, empty in a practice run) | The tip named two aliens; the level didn't pass its dial | fixed: one tip per alien, the level passes its dial, and a test checks that a tip naming an alien waits for it |

## Textual

| # | Severity | Where | Bug | Cause | Status |
|---|---|---|---|---|---|
| X1 | major | HUD combo counter (seen during ROADBREAKER) | A dropped combo's `x13 DONE` was cut off at the right edge ("X13 DON...") | The counter is right-aligned at the screen edge and its fade-out slid it 20 px further right | fixed: it sinks as it fades |
| X2 | major | Floating words (seen in the Chapter 2 convoy) | `WRECKED!` read as garbage ("CC@BEC!"); `BULLSEYE!`, `HEAVE!`, `FLIPPED!`, `STALLED!`, `OVERHEATED!`, `KEVIN 11!`, `DNA STOLEN!`, `LOCKDOWN!` and Kevin's callouts too | The 9 px pixel font was drawn at 1.2x to 1.6x: nearest-neighbour scaling by a fraction drops and doubles pixel rows | fixed: floating words rest at 1x or 2x only (the emphasised ones at 2x; their pop is unchanged), and the combo count's pop moves in whole steps |
| X3 | minor | `?debug=1` readout | The `\|` separators were invisible | The pixel font has no `\|` glyph | fixed: glyph added |
| X4 | minor | Comic panel (XLR8's multi-cut), pause tip, Hard's description, Four Arms' tips | "THE DRONES NEVER SAW HIM COMING", "TRANSFORMING KNOCKS NEARBY DRONES AWAY", "RELENTLESS DRONES", "DRONE DOWN? {J} TO LIFT IT" in chapters whose enemies are mutants or robots | Written for Chapter 1 and shown everywhere (the same family as the earlier "drones" vs "robots" on Results) | fixed: "THEY", "ENEMIES", "ENEMY" |
| X5 | minor | Title menu and Settings on phones | "[M] ALSO WORKS ANYWHERE" and Settings' "[ESC] BACK" named keyboard keys to touch players | The hints weren't chosen by input mode | fixed |
| X6 | minor | Spelling | `ARMOUR` and `PRACTISE` (British) next to `ARMOR` and `PRACTICE` elsewhere; `UH OH` next to `UH-OH`; "A 10 YEAR OLD"; "NEVER SKIP A SMOOTHY" (the shop is Mr. Smoothy, the drink a smoothie) | Mixed spellings | fixed, and the string lint now enforces them |
| X7 | major | Omnitrix Training, the pause menu | ALIEN MOVES ran off the bottom of the screen: Upgrade's moves and the PICK / SWAP lines were cut off on every screen size | The list was laid out for five aliens; Chapter 4's sixth made it 100 px too tall | fixed: when the aliens don't fit they come a page at a time (`1/2  [Q]/[E] MORE`, or TAP FOR MORE), turned with the dial keys or a tap on the list |

## Symbolic and visual

| # | Severity | Where | Bug | Cause | Status |
|---|---|---|---|---|---|
| V1 | minor | Training, misfire gag next to the dummy | The dummy's DPS readout and Ben's speech bubble overlapped during the misfire close-up, letters interleaved | Both float above their owners at the same depth, drawn in creation order | fixed: Ben's quips draw in front of every other world label |
| V2 | minor | File Select and Difficulty cards | Every letter on the focused card (scaled to 1.04-1.05x) and the others (0.95-0.96x) was slightly garbled: the pixel font only reads at whole sizes | The focus cue scaled the card | fixed: the focused card rises 4 px instead (`MENU.focusLift`); border and dimming unchanged |
| V3 | minor | Achievements | SPEED DEMON (any alien, beat a par time) showed XLR8's face, which reads as "do it as XLR8" like the other alien-faced badges; NO SWEAT (no deaths) showed a stopwatch | Icons picked loosely | fixed: SPEED DEMON gets the stopwatch, NO SWEAT a health heart. Alien faces now always mean "as this alien" |
| V4 | minor | Results, Chapters 3 and 4 | "LASERS PARRIED" in chapters whose enemies spit and throw bolts | One label for every chapter | fixed: "SHOTS PARRIED" there, like the enemies label already did |
| V5 | minor | Chapter Select, side cards | Every letter on the cards beside the focused one was garbled ("SECRET WAITING" read "SE⊃RET HAITIN3") | The side cards sit at 0.8x, and the pixel font loses rows at fractional sizes | fixed: side cards keep their size and draw their text in a smooth-filtered copy of the font (soft instead of broken); the focused card is unchanged |
| V6 | major | Extras, JOKES FOUND | "HEAR THEM ALL: TURN MISFIRES TO CHAOS IN TRAINING" was printed over Upgrade's row | Placed under the fifth alien's row before Chapter 4 added a sixth | fixed: it sits under the jokes panel |
| V7 | major | HUD prompts on 16:9 phones | Long prompts ran under the ATTACK button (WRONG ALIEN! ... +2S ended on its ring), where the thumb sits | The prompt bar is centred and as wide as its text; on a 640-wide view a long one reaches the right-hand buttons | fixed: with touch controls on, a prompt that would reach the stick or the buttons beside it wraps onto two lines between them |
| V8 | major | Chapter 1, the first transformation | PRESS {T} TO TRANSFORM! (the most important prompt in the game) was garbled the whole time it showed | Its bar breathed between 1.3x and 1.45x every frame, text included | fixed: the text draws at a crisp 2x and only its box breathes; the colour flash is unchanged |

## Checked and fine

- **Every Mr. Smoothy cup** in Chapters 1-4 can be reached from the checkpoint before it by a form the chapter has (new test); every card's reachability with the right alien was already tested per chapter.
- **Achievements**: each one has a place that awards it (ACT 1 through the act ending), unlocking is idempotent, counters add deltas so restarts and Continue don't double-count, and Training never counts (jokes excepted, by design).
- **Difficulty** pacing (rest, wake-up, punish windows, boss rests) reaches every enemy brain, turret and boss of Chapters 1-4; the alien timer, cooldown, misfire chance and damage apply live; checkpoints per difficulty are tested per chapter.

- **Slow motion and hit-stop** can't stack up: overlapping calls keep the slowest scale and the longest duration (`TimeController`), and pausing stops the level's clock, tweens and timers.
- **Touch releases**: a finger lifted outside the canvas (`pointerupoutside`) or cancelled by the system (`touchcancel`) releases its button.
- **Misfire guards**: every scripted moment of Chapters 1 to 4 (intros, unlock beats, the blackout, the atrium fall, the LASER LAIR lockdown, the drain, the turn) holds the story lock, boss entrances block misfires, and story transformations don't roll.
- **Save migration** from versions 1, 2 and 3 into 4, junk fields and bad files: covered by `tests/save.test.ts` and `tests/extras.test.ts`.
- **Hide, lock, rotate, fullscreen**: hiding the page (another app, the lock button) opens the pause menu during play; turning a phone to portrait opens it and freezes the game behind the "rotate your phone" screen until it turns back; leaving fullscreen re-lays out the touch controls and HUD. During a cinematic the page just freezes and carries on where it was. SUMO SLAMMERS clamps its frame time, so a hidden tab can't lose a round.
- **Practice runs** (`?start=`, `?aliens=`) never save best times, splits or ghosts; a ghost is only saved with a new best time of a full run.

- **Full-screen effects and the HUD** (decided): the transform's barrel pulse, camera flashes, shakes, the misfire sepia, the death desaturate and the vignette all apply to the world camera only, so the HUD is never warped, tinted or flashed (it stays readable mid-effect). The HUD shakes only for its own beats (a banner slam, the unlock card, a small jolt when hurt), and every shake goes through the Screen Shake slider. This was already consistent; it's now written down in DECISIONS.md.
- **Red means danger**: everywhere red appears in the HUD and menus it marks danger or loss (the warning and cooldown watch, the misfire stamp, ERASE, BEN'S DOWN!, the hurt vignette, enemy health, copy level III, KEV's tell in SUMO SLAMMERS).
- **Colour-blind cues**: every danger zone carries stripes or chevrons, aimed attacks a dashed line or a target, turret sights are dashed, trains warn with flashing lamps, the horn and headlights.

## Needs your decision

| # | Where | Question |
|---|---|---|
| D1 | Kevin's and Dr. Animo's attacks | Their tells use their own purple (the lunge line, the scan reticle, copy targets, the coils' striped bands, the frog's zap, the bat's swoop) instead of danger red. It keeps who is attacking readable and still carries the shape cues; switch them to red if you want "red = danger" to cover every tell too. |
| D2 | Chapter Complete in practice runs | A run started with `?start=` (or from a checkpoint link) still shows a rank on Chapter Complete although it's never saved (already a known issue). Hide it, or label it PRACTICE RANK? |

## Permanent checks added

- `tests/strings.test.ts`: every player-facing string uses only glyphs the pixel font has, only known control tokens, the house spelling of every name and word, no doubled words, and no raw key names outside screens that pick them by input mode.
- `tests/save.test.ts` ("save safety"): unreadable saves are kept, another tab's save is re-read, the three files stay apart.
- `tests/textfit.test.ts`: every dialogue line fits the dialogue box, every Game Over tip fits two lines on the narrowest screen, control labels fit one-line prompts.
- `tests/gameOverTips.test.ts`: every chapter has tips with nothing on the dial, a tip naming an alien waits for it, tips stay in their chapters.
- `tests/pickups.test.ts`: every Mr. Smoothy cup in Chapters 1-4 is in reach of a form the chapter has.
- `tests/music.test.ts`: after a stalled timer the music skips what it missed instead of playing it all at once.
- `tests/spawns.test.ts`: no checkpoint of Chapters 1-4 spawns Ben inside a cart, lift, shutter, hidden door or vines.
- `npm run qa` (`scripts/qa.mjs`, `scripts/qa/textcheck.js`): the screenshot sweep at three screen sizes with a text check on every screen (cut off, out of its declared box, overlapping, fractional size, raw tokens, missing glyphs, key names on touch), and `-- --fuzz` for random play at every checkpoint. Run it after any UI change.
