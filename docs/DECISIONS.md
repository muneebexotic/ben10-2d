# Decisions and deviations

Every decision that departs from `docs/GAME_DESIGN.md`, or fills a gap it leaves, with the reason. Read this file every session: these still apply unless a later entry replaces them. Add new entries under the milestone or session that made them.

**Milestone 1 and the Chapter 1 polish pass**

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

**Milestone 4, part 2 (Chapter 3)**

- **How the Tennysons end up at the museum:** Max wants its famous night tour, finds it closed, and the paper's story about a fired scientist plus a glowing side door does the rest. A night guard running out with mutant rats behind him starts the chapter, so nobody has to break in.
- **The boss is the giant mutant frog** (KING CROAK), with Animo riding its head so the villain is in the fight, not just introducing it. "Hits from above land on Animo too" makes Wildmutt's pounce and Stinkfly's height part of the switching.
- **Wildmutt's senses are passive:** hidden doors open after a moment within his sense range and lurkers show inside it. No extra button to learn, and the pulse rings show the range. A banner (HIDDEN PATH!) makes sure a door opening is never missed.
- **Wildmutt can't talk** (as in the show): his speech bubbles and dialogue lines are growls with a subtitle.
- **Stinkfly unlocks mid-fall** over the tar pits, the watch catching Ben in the air, and holds him there until the player flaps: the first flight is the lesson.
- **Stinkfly's slime does more than slow:** three quick globs gum an enemy in place (two for a bat), and fire sets off his stink clouds. Both give him a reason to be on the dial in a fight, not only for flying.
- **Mutants reuse the drone framework** (walker brains with ground physics, notices and patrols) instead of a second enemy system, so Training, telegraphs, slow and stun states, Four Arms' lift and the bowling throws all work on them.
- **LOCKDOWN's order is fixed** (Heatblast, XLR8, Four Arms, Wildmutt, Stinkfly) so each lock teaches its alien in turn and the swap timing is the skill; the reachability test proves each lock needs its alien.
- **Two Chapter 3 cards need Act 2 aliens** (Grey Matter, Ripjaws). They count toward the chapter's 7 like earlier "come back later" cards, and their silhouettes and lines say who to bring.
- **The Act 1 ending plays after the results,** on CONTINUE, so the chapter's own payoff (rank, time, cards) isn't cut off, and only on the first clear.
- **The radial dial fans out up and to the left** of the Omnitrix button (115° to 255°) so every slot stays on screen and clear of the right thumb's other buttons; a 300 ms hold opens it, so a quick swipe still turns the dial.
- **Number keys select, T transforms** (the same as Q/E), so a number never transforms by accident mid-fight.
- **Chapter 3's par time is 9:00**: it's the longest chapter.
- **Chapter 2 on Hard keeps CONVOY and ROADBREAKER checkpoints** (playtest feedback).
- **Achievements count only in the story** (Training spawns endless enemies and freezes timers); misfire jokes count anywhere, so Training's CHAOS setting is the way to fill JOKES FOUND.
- **Only a run from the chapter's start can become a ghost** (a checkpoint restart carries the recording on; a run picked up with Continue after closing the game can't, since its start wasn't recorded). A ghost is saved only on a new best time, and it races only timed runs.
- **Ghosts live outside the save** (their own localStorage key, at most 9) so a full ghost store can never stop the game from saving progress.
- **Cards and jokes count from the file itself** for CARD SHARK and WRONG ALIEN, RIGHT TIME, so files from before achievements existed get credit for what they already found (the first new card or joke unlocks them).

**Performance pass (after Milestone 4)**

Measurements and before/after numbers are in `PERFORMANCE.md`.

- **The budget is CPU time per frame, not FPS.** Headless Chromium draws WebGL in software and reads every frame back, so its frame rate measures the container. `npm run bench` budgets main-thread CPU per frame (update + render submission), long steps, GC pauses and leaks on a wide phone at 4x CPU throttle; FPS is reported but not budgeted.
- **Per-frame effects follow real time.** Random per-frame chances, damping, easing steps and trail streams scale with the real frame length (`systems/Pacing.ts`, `fx.stream`), so a 120 Hz phone shows the same ember density and the same easing as a 60 Hz one. At 60 Hz the maths reduces to the old numbers exactly, so nothing changes there. Below 60 fps the same holds the other way: a phone stuck at 30 fps now shows the full density instead of half, so it does a little more effect work per frame; the quality governor (which scales every particle count) is what thins effects on slow devices, not a low frame rate.
- **Jump arcs are matched to 60 Hz at any refresh rate.** Arcade's semi-implicit Euler makes a jump a little higher at 120 Hz and lower at 30 Hz; `systems/ReferenceIntegration.ts` adds the half-step correction so the arc is the 60 Hz arc (within half a pixel for a full jump). Moving platforms and direct-control bodies are untouched.
- **The game width is a whole number of pixels.** On wide screens Phaser's EXPAND mode gave widths like 799.51, and the camera filter (vignette) asked Phaser's render-target pool for that fractional size, which never matches the rounded sizes the pool files its targets under, so it kept creating new framebuffers. `systems/PixelScale.ts` floors the width at boot and on every resize (the canvas is at most one game pixel narrower).
- **HUD and touch-control shapes are baked.** The Omnitrix dial ring and pips, the shield and boss bars, the prompt bar, speech bubbles, the touch buttons, stick and dial ring, and the cave back walls were Graphics objects re-tessellated every frame. They are now textures (`ui/BakedGraphics.ts`) redrawn only when what they show changes. Pixel-diffed against the old build: the HUD is identical. The touch controls are faded as one image now instead of shape by shape, so the bright specks where their ring segments overlapped are gone and a ring drawn over a fill reads a little darker (at most 30/255 on the stick's rim).
- **Static scenery is culled off-screen** (`scenes/level/StaticCuller.ts`) for decor props and the museum's walls and beams. Phaser 4 doesn't skip off-screen images on its own before building their draw data.
- **The quality governor reacts in 1 s instead of 2 s, and the vignette fades out over 600 ms** when it drops a level instead of disappearing in one frame.
- **Held sounds stop when a level ends.** Leaving a level as XLR8 at speed (or Heatblast charging) used to leave the wind (or hum) playing for the rest of the session, one more per level. Abilities with held sounds now implement `dispose()`, which the level calls on shutdown.
- **Not done, with numbers in PERFORMANCE.md:** a per-chapter code split (chapter-specific code is a small share of the bundle, and art is generated, not downloaded), the GPU tilemap layer (it rendered empty tiles opaque), pre-rendering sound effects (the audio thread was not busy), camera pixel snapping (no measurable jitter), and a device-pixel-ratio cap (Phaser already renders at game resolution).
- **Bench builds keep the playtest hooks.** `vite build --mode bench` is the release build plus `?god=1` and the `window.__game` handles, so the benchmark measures release code. Release builds don't have them.

**Milestone 4, part 3 (Act 2 opens: Chapter 4, Kevin 11)**

- **Act 2 is planned in `GAME_DESIGN.md`** (Chapters 4 to 6, the owner's brief plus detail), with the owner's "Rules for all of Act 2" copied in verbatim. Chapters 5 and 6 are plans only.
- **Upgrade is built on a machine framework, not special cases.** Every possessable thing is a `Machine` (turrets, cabinets, the SUMO SLAMMERS cabinet, security shutters, lifts, carts, the boss's tesla coils); the alien only sees a `MachineHandle` (anchor, control, release), so the ability code doesn't know what a turret is and new machines need no changes to Upgrade. Machine enemies are taken over through the same hit system (`Hit.hack`), and the takeover and the robot's overload share one clock (`COMBAT.hack.overloadMs`).
- **Security shutters only Upgrade opens** gate the LASER LAIR exit and the power depot (flyers can go over the depot wall; that's allowed). Upgrade is guaranteed to be on the dial from the lair on, and the lair is where he unlocks, so nobody is locked out.
- **Kevin's copies are data-driven:** each alien declares how Kevin fights as it (`FormDefinition.copy`: style, tell and attack animations, Kevin's cheer). An alien without one gets plain energy volleys in its colour, so adding an alien never needs Kevin code. Copies are the alien's own sheet palette-swapped onto Kevin's purple at runtime (`scenes/preload/copyArt.ts`), not a tint, so they read as Kevin at a glance.
- **Copy-Upgrade fires a floor-skimming beam** instead of possessing the coils as the plan said: two of Kevin's moves fighting over the same coil was confusing, and the coils stay Upgrade's (the player's) tool. Kevin still drains the coils in phase 2 and as KEVIN 11.
- **Reliance rules** (unit-tested in `entities/bosses/kevin/rules.ts`): damage dealt as an alien plus time spent as it, decaying 4 points a second while using anything else; levels at 25, 60 and 110 points. One alien for two full transformations reaches level III; switching every ten seconds keeps every copy at I. The copied alien does 60/40/20% to its own copy, a different alien's first hit within 2.6 s of a copy is OUT OF SYNC (x1.75 and a stagger), and KEVIN 11 resists each alien by its copy level (aliens he never copied do x1.3). Nothing is ever immune.
- **The turn is the boss's own code in a "stolen DNA" mode** (one alien at copy level II, 46 HP, no phases), so the set piece and the boss can't drift apart. The stolen alien is blocked on the Omnitrix (`Omnitrix.setBlocked`: the dial skips it, misfires never land on it, transform and swap refuse it with DNA STOLEN!) and the story recharges the watch so there's always something to switch to.
- **Kevin is a story actor, not an enemy, while he's a buddy:** he follows a trail of Ben's grounded positions (hopping where Ben jumped) instead of having physics, can't be hurt and isn't targeted, and his bolts are player-team projectiles. One shared actor is handed between the Chapter 4 set pieces.
- **SUMO SLAMMERS rules are pure and tested** (`systems/SumoMatch.ts`): mashing alone wins round 1 but not round 2, so the telegraphed sidestep is the skill; taps are capped at 14 a second so key repeat or an autoclicker can't win; held keys don't repeat. The level is paused under it.
- **The station's track bed is a dead end under deck B:** a wall where deck B meets the tracks stops a walk into the live maintenance rail (the playtest bot found it). Trains run behind the terrain, so they pull into that wall like a tunnel mouth.
- **The drain kills the station, not the maintenance line:** the trains stop and the station goes dark, but the maintenance rail keeps crackling (it's still deadly and the cart rides it).
- **Chapter 4 checkpoints:** GAME ZONE, HIGH SCORE, ROSEWOOD STATION and POWER DEPOT (Easy and Normal); LASER LAIR, MAINTENANCE LINE, THE TURN and KEVIN 11 on every difficulty (one per set piece). Par time 9:00.
- **Cards behind hidden doors stay visible** through the disguise (as in Chapters 1 and 3): a lure that says "there's a way in".
- **Upgrade's older secrets** add one card each to Chapters 1-3 (6, 6 and 8 cards now). Like every "come back later" card they count toward the totals, so a cleared chapter can show SECRET WAITING! again.
- **The maintenance cart can't strand or kill Ben.** Nothing over a live rail counts as safe ground (a fall there respawns Ben on the deck before the line, never on a spot the cart has left), the cart's brakes lock the moment Upgrade leaves it (so Ben reverts or pops out on top of it), Upgrade pops straight up out of a cart, and an empty cart left out on the line rolls back to the start after 1.5 s. Before this, Upgrade timing out mid-ride could chain pit respawns over the rail until Ben died.
- **Physics never moves Ben more than 12 px in one step** (15 px vertically). Arcade picks which side of a static body a body is on from where the step ends, so a long step that sinks Ben past a wall's middle pushes him out of the far side. XLR8's dash on a 30 fps frame (22 px a step) went through cracked walls, Upgrade-only shutters, laser walls and the jammer gate, in every chapter since 2. The level now splits such frames into two steps (`systems/PhysicsSteps.ts`); at 60 fps nothing changes. Laser walls also get a 32 px body grown away from the room, so rooms keep their size.
- **The dialogue skip hint** sits in the letterbox bar during cinematics and under the dialogue box during play (a boss's defeat speech), so it never covers the touch JUMP button.
- **Results name the enemies by chapter:** DRONES DESTROYED, MUTANTS DEFEATED, ROBOTS WRECKED.
- **TOKEN TOONS have a leash** (8 tiles from where they woke, `MASCOT.leash`): the band guards its stretch of the arcade instead of following Ben down into the subway, where it piled onto the station's own track-bots, turret and trains. Same principle as level drones staying near home.
- **KEVIN 11's punish windows are safe:** while he's staggered (OUT OF SYNC, a coil's OVERLOAD!, UNSTABLE!) his body does no contact damage, so going in for the opening the player earned never costs a heart.
- **A smoothie at each of KEVIN 11's phase changes,** on the far side of the hall from him. His is the longest boss fight so far (170 HP, three phases, copies that resist the alien you lean on); Chapter 1's drone set the precedent.
