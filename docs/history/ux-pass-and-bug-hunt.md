# UX pass and bug hunt (during Chapter 7)

The owner asked for a hunt for anything wrong in the game, fixes for what turned up, and a look at the UI and UX against how top games do it. This pass ran on Chapters 1-6 (shipped) and the shared menus and HUD; Chapter 7 work carried on separately. Bugs found are in `BUGS.md` (U1-U11), decisions in `DECISIONS.md` ("UX pass and bug hunt"), proposals that need approval in `IDEAS.md` ("From the UX pass").

## How the game was checked

- `npm run qa` at desktop, 20:9 phone and 16:9 small-phone sizes, and every screenshot read: menus, every checkpoint of Chapters 1-6, pause, Game Over, Chapter Complete, the act endings and the HUD gauntlet.
- The menu, input, audio, save and scene-lifecycle code read for logic errors: how keys reach menus, what each scene leaves behind when it stops, what each chapter's results call its enemies.
- The changed screens driven in headless Chromium on the dev server (keyboard and emulated touch), with screenshots before and after.

## What top games do, and where this game stood

Sources: write-ups of Celeste, Hollow Knight and Dead Cells' HUDs (Unity's game UX basics, uxdesign.cc, Medium), the Game Accessibility Guidelines, touch-control guidance (Develop conference coverage, Godot and Construct guides, a Carleton University study), and coverage of Celeste's Assist Mode (Vice, the Tampere University PlayLab). Some sites couldn't be fetched from this environment, so a few points rest on search summaries and general knowledge of these games.

| Area | Top games | This game before | Now |
|---|---|---|---|
| HUD | Minimal, in the corners, matched to the art (Celeste top-left, Hollow Knight's mask row); big moments get big type | Omnitrix dial and hearts top-left, timer and cards top-right, prompts between the thumbs: already in line | Unchanged |
| Sound options | Master, music and effects volumes as sliders (and the accessibility guidelines ask for separate volume controls) | Mute only | MUSIC and EFFECTS sliders |
| Dialogue | A press reads on a line (finishing the typing first); skipping a whole scene is a separate, deliberate action (hold, a menu item or a button) | Any press skipped the whole conversation | A press reads on; Enter, Esc or SKIP >> skips |
| Menus after gameplay | Ignore input carried over from play for a moment (no accidental picks) | Held keys repeated into Game Over and picked RETRY unseen | Fresh presses only, 350 ms grace on Game Over |
| Results | Count-ups that a press speeds up or completes | A five-second tally deaf to input | A press plays it six times faster |
| Pause | Says where you are and what you've found (Celeste: chapter and strawberries); quick resume and retry | File and difficulty, controls | Plus chapter, checkpoint and cards this run |
| Death and retry | Very fast (Celeste respawns in under a second); a non-judgemental way to make it easier | A menu every death, with a no-shame MAKE IT EASIER after four | Unchanged; QUICK RETRY and ASSIST options proposed |
| Accessibility | Remapping, game speed (Celeste's Assist Mode, 50-100%), reduce flashing, shake, colour-blind safe cues | Reduce flashing, shake slider, colour-blind safe telegraphs, reduced-motion default | Volume sliders added; remapping and ASSIST proposed |
| Touch | Floating or fixed stick, big forgiving buttons, play area clear of thumbs, slides between buttons | Floating stick, slide between buttons, prompts kept between the thumbs: already in line | SKIP >> button in cinematics |

## Fixed and changed

- **U1 held keys picked menu rows** (Game Over's RETRY before the screen was seen; Enter held through two menus).
- **U8-U10, the same held-key repeats elsewhere:** a card reveal closed itself unread while a hold-to-fire attack was held; the Spell Engine spun pipes and pulled its pendulum's lever on a held key; a held Enter could skip an act's cliffhanger, and a held Esc backed out through Settings and the pause menu. A source rule now fails on any pick, skip or back key that doesn't check for repeats.
- **U11 the Ferris wheel lost slices** (Chapter 6's fair): an engine bug in how Phaser 4.2 picks a batched sprite's texture (exact float comparisons on an interpolated index), patched at boot. Found by bisecting: copies of the wheel, lighting off, tiles off, then probes at every depth.
- **U2 scene listeners piled up** on every visit to Settings, pause and the title; Settings redrew its bar once per past visit every frame. A source rule now guards it.
- **U3 results said DRONES and LASERS** in Chapters 5-7.
- **U4 the save file's alien strip** overflowed its panel from the sixth alien.
- **MUSIC and EFFECTS sliders**, the **read-on dialogue** with Enter / Esc / SKIP >> to skip, the **hurried tally**, and the **pause menu's where-you-are line**.

## How to test

1. **Held keys:** in any chapter hold J (or Space) and let an enemy finish Ben: Game Over stays up until a fresh press. Hold Enter on the title's SAVE FILES: it stops at Save Files. As Heatblast, hold J and run into a card: the card stays up. In the Spell Engine, hold J on a pipe: it turns once. In Settings from the pause menu, hold Esc: only Settings closes.
2. **Settings:** Settings > MUSIC and EFFECTS (left/right in 10% steps, the bar follows); press M: both rows say MUTED; change either: sound comes back. Pause during play: the music dips and returns at the slider's level.
3. **Dialogue:** start Chapter 3 (`?level=ch3`): Space shows the typing line in full, Space again moves on, Enter skips the conversation. On a phone (or an emulated one): tap to read on, SKIP >> in the bottom-right corner skips.
4. **Results:** clear a chapter (or `?level=ch1&start=cp-arena` and beat the boss) and press Enter during the tally: it races to the rank stamp, then Enter continues as before.
5. **Pause:** Esc mid-chapter: CHAPTER n: NAME - CHECKPOINT - CARDS x/y under the file line.
6. **The Ferris wheel:** `?level=ch6&start=cp-fair`: the wheel turns whole, frame after frame.
7. **Save Files:** a file with six or more aliens shows them in two rows inside the panel.

## Checks at the end

- `npm run typecheck`, `npm run build`: clean. `npm test`: 567 tests pass (new: `dialogue.test.ts`, `textureIndexFix.test.ts`, two source rules).
- `npm run bench` against main: no regression and no leaks. The first full run flagged three scenarios while tests and a build ran on the same machine; re-run alone (three rounds) they were within +1 to +4%. The texture-index fix's own run (the fair, stress, Chapter 1, Chapter 7) passed the same way.
- `npm run qa -- --fuzz` at all three sizes: 0 page errors, every checkpoint and boss pass of Chapters 1-7 clean. Two flags, both checked: Chapter 7's docking ring "frozen for 1.6 s" on the phone run only, while two sweeps shared the machine (the freeze watch counts real time; re-run alone it passes), and a "?" under CLEARED! behind the Act 2 ending on the phone size (the sweep opens the ending on a save where Chapter 6 isn't cleared, so the stamp lands on a locked card; a real first clear saves first and shows the chapter's own art).
