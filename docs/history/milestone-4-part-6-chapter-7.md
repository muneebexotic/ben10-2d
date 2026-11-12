# Milestone 4 part 6: Chapter 7, The Plumbers (Act 3 begins, in HD)

_The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md` (Act 3's HD look, "Characters drawn frame by frame", "One cast, one scale"). The chapter's plan is GAME_DESIGN.md, "Act 3" and "Chapter 7: The Plumbers". The working notes kept while it was built are in `docs/ch7-wip.md`._

The owner's brief: Act 3 starts in an **HD cartoon look**, and every character is the owner's own art: "Every pose must be one of my drawings played as it is. Do not cut, bend or redraw the characters." The owner made each sheet in ChatGPT from prompts written here, uploaded it, and the game plays the drawings frame by frame. The music is the owner's own recordings too. **Chapters 1 to 6 are unchanged** (the owner's rule): everything new is chapter-specific or only switches on in an HD presentation, and the QA sweep compared every older screen before and after.

Built between 2026-10-25 and 2026-11-12, released 2026-11-12.

## The HD presentation

- **The switch** (`systems/HdRender.ts`, `systems/hd/Presentation.ts`, `scenes/level/plumber/presentation.ts`): a chapter can ask for the HD presentation. The game renders at a higher scale (up to 3x, `CH7_HD.maxRenderScale`), the chapter's art is made at its own resolution (up to 4 texels per game pixel), the camera zooms in 1.25x (1x in the boss arena) and the HUD font has an HD twin. The physics, the level grid and every rule stay in game pixels, so nothing plays differently.
- **Every sprite with a drawing plays it** (`systems/hd/HdMirror.ts`): the game sprite still runs its animation names and timing (so abilities, hitboxes and tests are untouched), and an HD mirror on top shows the drawing for that animation. Story poses come in through a sprite's `hdClip` or `HdMirror.override`.
- **HD twins of shared textures** (`registerHdSkin`): the HUD's character icons, the hearts, the dial ring, the card and checkpoint icons, the smoothie, the drone and boss icons and the dialogue faces swap to the owner's art in Chapter 7 only. `ui/iconTint.ts` keeps the warning tints (jammed, enemy) on drawn icons and greys a dimmed one.

## The cast, frame by frame

`scripts/cutout/frames.py` cuts each of the owner's sheets into its figures (each one whole, as drawn), puts every sheet at one scale against the character's model sheet (`SHEET_SCALE`), anchors x on a colour the character always wears (`SHIRT`), stands each drawing on the floor (or hangs it from the body's middle for swimming, `CENTRED`) and packs one atlas per character (`public/assets/cast/<id>-frames.webp`, with its frame list in `scenes/preload/cartoon/cutout/<id>Frames.ts`). The clips (`<ID>_FRAME_CLIPS` in `scenes/preload/cartoon/characters/<id>.ts`) name the drawings for every animation and their timing.

- **Ben** (7 sheets): idle, run, jump, fall, land, punch, the dodge roll, hurt, knocked flat, raising the Omnitrix, the slam, the breaststroke, treading water, out of air, and story poses (angry, sad, listening and more).
- **Gwen** (5 sheets): her run (the owner's second run sheet: the legs swap and the body doesn't twist), her spells, story poses, swimming, staring at her hands.
- **Max** (4 sheets): his walk (the second sheet: the arms swap with each stride), console, blaster, badge, salute and eight story poses.
- **Kevin** (3 sheets): his run, smirk, absorbing, wind-up, throw, lunge, laugh, hurt.
- **All ten aliens:** Heatblast, Four Arms, XLR8, Wildmutt, Stinkfly, Upgrade, Diamondhead, Ghostfreak, Grey Matter (4 or 5 sheets each: model sheet, run or flight cycle, action poses, a last sheet with swimming and story poses) and **Ripjaws**, the new alien (5 sheets: swim, hop on land, bites, CHOMP, tail whip, RIP DASH).
- **The enemies and the boss:** the Plumber sentry, the fishbowl grunt (and his smashed bowl), the zapper eel, the jelly mine, the gnasher swarm and DEEPMAW (4 sheets) play the owner's drawings.
- **One cast, one scale** (DECISIONS.md): after every alien was in, the cast was measured side by side; XLR8, Upgrade, Ghostfreak, Diamondhead and Max were drawn bigger so nobody reads as tiny or pencil-thin next to Ben, inside the heights the shared rules allow (Diamondhead's shards leave 22 px over his feet; Four Arms' carry height is shared, so he stays).
- `docs/ART_COVERAGE.md` (generated, and kept current by `npm test`) lists every animation as drawn, stand-in, waiting or painted.

## Ripjaws and swimming

Ripjaws joins the dial (`aliens/ripjaws/`, `config/aliens/ripjaws.ts`): bite, CHOMP, the tail whip, RIP DASH, a water swap-in, and a land drain (out of water the Omnitrix runs down faster). **Every form swims** in Chapter 7's tanks (`config/swim.ts`, `systems/swim/`, `scenes/level/Swimming.ts`): a breath meter, its own swim drawings for each form, and air pockets and bubble vents to refill. Ripjaws also swims the older chapters' water and mutagen (their waiting cards), without changing anything else in them.

## The level

`levels/chapter7.ts` (472 x 50 tiles; decor in `levels/chapter7Decor.ts`), a Plumber base on the floor of the Arabian Sea. Checkpoints: DOCKING RING, FLOODED RING, THE REACTOR, THE OPEN SEA, PUMP HALL, PUMP HALL: TANK 3, CONTAINMENT, THE MOON POOL (and DEEPMAW's DRY DOCK and THE MAELSTROM, hidden). Seven cards (album 46-52).

- **The base's systems** (`scenes/level/plumber/water/`): tanks whose water level moves, currents, air pockets, bubble vents, the intake's grate; hatches the story opens and pressure doors that open while both sides are level; pump consoles, the valve wheel (3 hits, or one smash or Upgrade), section consoles that wake each section's lamps in a wave out from Ben.
- **Enemies** (`entities/enemies/deep/`, `config/plumber.ts`): the Plumber sentry (a scan light, the red lock, a stun beam), the fishbowl grunt (a harpoon arc; break the bowl and he flops, then fights on), the zapper eel (a shock ring), the jelly mine (chain pops), the gnasher swarm (bunch, turn, dart).

## The story

GAME_DESIGN.md's beats, as set pieces in `scenes/level/plumber/story/`:

1. **The opening** (`Descent.ts`, `CH7_OPENING`): the old pixel jetty at midnight, Max's badge against the bollard, a glass car rising out of the sea. On the ride down the beacon pings and the world, then the family, turn HD; Kevin is glimpsed below; the base wakes lamp by lamp; **ACT 3: SECRETS** with the owner's sting. Any key skips; a retry doesn't replay it.
2. **The docking ring** (`DockingRing.ts`): Max's reveal and the badge scan, his locker, the sentries' lockdown, Gwen at Ben's side, the split at the hub.
3. **Kevin and the reactor** (`Reactor.ts`): Kevin dashes past a porthole as a shadow, then drains the reactor (CONTAINMENT FAILURE), blasts out through the ceiling and the sea pours in. Ben holds on until the Omnitrix answers: **NEW DNA, Ripjaws**, who bursts through the glass into the open sea.
4. **The open sea**: kelp, coral, fish, a whale, the base's hull from outside, the coral cave's card. The music follows Ben out of the hull and back.
5. **The pump hall** on the intercom with Max and Gwen: every pump and the valve (ALL SYSTEMS GO).
6. **Containment** with Max and his blaster at Ben's side, to Cell 7's reveal.
7. **DEEPMAW** in the moon pool (`entities/bosses/deepmaw/`, `config/deepmaw.ts`, 120 HP), in three stages:
   - **LIGHTS OUT:** the dark pool, his lure the only light. Bait, flare, lunge and the lure's flash. Hit the lure to stun him (BAIT AND SWITCH: stun it as three different forms); Diamondhead's shield bounces the flash back.
   - **HIGH AND DRY:** the pool drained. Slam waves on the pool floor, the rolling chomp, the belly flop onto the decks, FLOOD WARNING every third attack. Four Arms lifts and throws him while he's dazed or beached.
   - **THE MAELSTROM:** a whirlpool with orbiting debris; he swings round, swallows, bites and spits. Gwen shields Ben once a stage at 2 hearts; Max's stasis field ends it (RECAPTURED!).
8. **The ending:** Magister Korr on the hologram (the owner's portrait, made a cyan hologram with scanlines), the surface camera's feed of Kevin's getaway on an escape pod (the owner's painting), a smoothie.

**Achievements:** FISH OUT OF WATER (5 KOs as Ripjaws on dry land), ALL SYSTEMS GO, DEEP BREATH (the flooded ring as Ben, never out of air), BAIT AND SWITCH.

## Faces, HUD, Chapter Select

- **Dialogue faces follow the mood** (`plumber/familyPortraits.ts`, `scripts/cutout/portraits.py`): six close-ups for Ben, Gwen, Max and Kevin (neutral, happy, angry, shocked, hurt, talking) cut from the owner's model sheets; every family line carries a `mood` (`Dialogue.ts`), and a face change swaps in place.
- **The HUD** (`scripts/cutout/hud_icons.py`, `hud_props.py`): the owner's 12 round character icons in the Omnitrix dial, its carousel, the swap badge, the touch button and Gwen's corner; hearts, the dial ring, the card icon, the checkpoint post, the smoothie, the drone and boss icons.
- **The camera feed** (`ui/CameraFeed.ts`): a still under the dialogue box with scanlines and a recording light; a line's `still` brings it up.
- **Chapter Select:** the owner's painting of the base on the sea floor (`public/assets/stills/ch7-card.png`, `plumbersDeep` in `ui/menu/chapterArt.ts`).

## Music

The owner's four recordings (`public/assets/audio/music/`, settings in `config/music.ts`, player `systems/audio/RecordedMusic.ts`), each levelled to about -16 LUFS with a gain trim and looped on the beat (loop points found by matching the bars before each join, and checked against Chromium's own decode):

- `deep`, the base's theme (112 BPM, 28 bars looped whole).
- `opensea`, the open sea's theme (the 16 bars before the file's fade loop; its first 10 s play once). It switches with Ben crossing the hull (`SeaMusic.ts`, rules in `seaMusicRules.ts`, 2 tiles of margin either way), and the other track is decoded ahead so the switch is instant.
- `deepmaw`, the boss fight (the intro plays once, then the fight, the breakdown and back).
- `act3`, the ACT 3: SECRETS sting (plays once over the title card, then the base's theme comes back).

## Performance

The chapter's heaviest moments are in the bench (`ch7-sea`, `ch7-maelstrom` in `scripts/bench/scenarios.mjs`) and the on-device autobench (`systems/autobench/plan.ts`). Art loads with the chapter (`loadCutouts` in `ch7.ts` `prepare`, behind the level fade): the cast's atlases are 4.7 MB of WebP, the music 3.1 MB of AAC, fetched only when Chapter 7 starts.

## Scripted playtests and what they caught

- **The reachability test** (`tests/chapter7.test.ts`: every checkpoint and card reachable with every form swimming the tanks) found the coral cave sealed; its entrance is carved now.
- **The QA fuzz sweep** found two bugs, both fixed: skipping the opening during the jetty walk stopped the game loop, and an alien asked for Ben's `watch` animation logged a warning.
- **Frame-perfect recordings** (`scripts/cutout/capture.cjs`) of every new drawing in the game, reviewed by the owner: they caught a run frame whose arms didn't alternate (Diamondhead's first copy; the owner picked the second), aliens that read too small next to Ben, and swimming drawings standing on the floor instead of hanging in the water.

## Release gates (2026-11-12)

GATES_PLACEHOLDER

## Known issues

- **Max and Kevin have stand-ins** for a few animations Chapter 7 doesn't use (Kevin's story poses, Max's jumps and swimming; `docs/ART_COVERAGE.md`). Their next sheets come with the chapters that need them.
- **DEEPMAW with damage on is tuned by scripted playtests, not people.** Levers in `config/deepmaw.ts` (`maxHp`, each stage's attacks and tells).
- **Swimming and Ripjaws' feel need a human pass** (headless Chromium runs at about a third of real speed): `config/swim.ts`, `config/aliens/ripjaws.ts`.
- **The HD look costs more fill rate than the pixel chapters.** Measured within budget on the owner's phone; `CH7_HD.maxRenderScale` and `maxArtRes` are the levers on weaker GPUs.

## How to test it

1. **Get there:** a file that has cleared Chapter 6, Chapter Select: THE PLUMBERS > PLAY. Or `?level=ch7` (a practice run), with `&start=<checkpoint>`: `cp-docking`, `cp-flooded`, `cp-reactor`, `cp-sea`, `cp-pump`, `cp-tank3`, `cp-containment`, `cp-moonpool`, `cp-drydock` (DEEPMAW's second stage), `cp-maelstrom` (his third).
2. **The opening:** the jetty, the glass car, the world turning HD at the pings, ACT 3: SECRETS with its sting, then the base's theme.
3. **The docking ring:** walk in with Max; the badge scan, his locker, the lockdown; Gwen runs at Ben's side; the split at the hub.
4. **The reactor:** Kevin's shadow at the porthole, the drain, the flood; hold on as Ben until NEW DNA; smash the glass as Ripjaws.
5. **The open sea:** swim out and back across the hull: the music turns each way. The coral cave's card.
6. **The pump hall:** every pump and the valve (ALL SYSTEMS GO); the flooded ring as Ben without running out of air (DEEP BREATH).
7. **Containment:** Max's blaster at your side, Cell 7.
8. **DEEPMAW:** stun the lure as three forms (BAIT AND SWITCH), bounce the flash back with Diamondhead's shield, throw him as Four Arms while he's dazed or beached, ride out the maelstrom.
9. **The ending:** Korr's hologram, the surface camera, the smoothie; Chapter Complete says NEXT: CHAPTER 8 (COMING SOON).
10. **Faces:** watch the dialogue faces change with each line (an angry DEEPMAW. from Ben, a happy line from Kevin).
11. **Older chapters:** nothing changed; Ripjaws (once unlocked) swims their water.

**Phone:** the HUD icons on the touch Omnitrix button, swimming with the stick, the dialogue box and the camera feed at phone width. `?autobench=1` plays THE OPEN SEA and THE MAELSTROM too.
