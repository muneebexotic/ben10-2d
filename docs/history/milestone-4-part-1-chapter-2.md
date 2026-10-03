# Milestone 4, part 1: Chapter 2, Road Trip

_Archived from `docs/PROGRESS.md` on 2026-10-03. The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`._

## The chapter, start to finish

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

Checkpoints: CANYON, RIVER, ISLAND (Easy), FAR BANK, CONVOY (hidden, lit mid-chase), TRUCK STOP, ROADBREAKER. Hard drops CANYON and ISLAND but, since Chapter 3, keeps one at every set piece: FAR BANK before the ride, CONVOY and ROADBREAKER (playtesting asked for tougher fights on Hard, not replaying long sections).

## Alien unlocks

- **Data-driven beats:** `story.unlocks` in the level lists each alien, where its beat happens and Ben's line. `UnlockBeat` runs it; a `scripted` beat is started by another set piece (the chase starts Four Arms' on the first truck that hooks onto the RV).
- The alien stays off the dial until its beat, even on a file that later restarts before it; a restart past the beat (or a file that already has the alien) skips it. The file saves the alien the moment it's revealed.
- **The reveal is the HUD scene's unlock card** (`ui/UnlockCard.ts`): the dial scaled up, segments spinning, silhouettes cycling, then the alien in colour with its tagline and two traits from its definition (`unlock` in each alien's index).
- **Forced transforms never misfire** (`Omnitrix.forceInto`): a free swap or transform with full time, recharging the watch if needed. Misfires are also blocked through the opening, both beats, boarding the RV and the chase's finale (`SetPiece.storyLock`).

## The Rustbucket chase (the chapter's big set piece)

The RV stays put mid-arena while a **treadmill** scrolls the road, roadside props, speed lines and the whole sky backdrop (`RoadScroller`, `HighwayBackdrop.travel`). Its roof is a one-way platform and a moving solid (drones land on it, Strikers stick in it, Four Arms' shockwaves ride it) with rails at both ends so nobody falls off by accident; jump over one on purpose and Ben is hurt and put back on the roof.

1. **Ride** (19-32 s): four drone waves (Scouts, Strikers, Hornets, a Gunner; one extra per wave on Hard), **tires bouncing over the roof** (an arrow at the screen edge where they come from, a target where they land; jump them or knock them away) and **potholes** that buck the RV and toss everyone on the roof into the air ("POTHOLE! HOLD ON TO YOUR SNEAKERS!").
2. **Convoy** (2 trucks on Easy, 3 on Normal, 4 on Hard; one at a time on Easy, two on Normal and Hard). The lead rig **revs** (engine, horn, chevrons on the back of the roof), **rams** (the back of the roof jolts: whoever stands there is hurt and flung forward) and **hooks on** with a harpoon arm, dragging the RV until it yanks (same telegraph) and drops back. A second rig in the far lane **shells marked spots** on the roof. Armour takes only 30% from anything but smash. **The first hook is where the watch finds Four Arms** ("IT'S DRAGGING US OFF THE ROAD!"), and the tip says to rip the truck off: lift (J at the clamp), and the whole truck goes upside down over his head, wheels spinning; J again throws it, spinning, **OFF THE ROAD!** A thrown truck hits like a truck (20 damage): throw it into the next one. Max: "THAT'S MY GRANDSON!"
3. **The runaway hauler** roars past in the far lane, cuts in ahead and **dumps fuel barrels** onto the roof through a glowing hatch (with Hornets). Barrels roll toward the back; Four Arms can catch one and throw it forward: **BULLSEYE!** Two bullseyes and the driver loses it early; otherwise it runs out of barrels and loses it anyway. It fishtails off the road ahead; cut to the truck stop where it crashed.

A restart at the hidden CONVOY checkpoint drops Ben straight back on the roof with the convoy coming. All numbers in `config/chapter2.ts` (`CHASE`, `CONVOY`, `JUNK`); telegraph lengths are the same on every difficulty.

## ROADBREAKER (boss)

Vilgax's war rig, rebuilt from the crashed hauler. Vilgax's hologram (now with his portrait) introduces it: "MY WAR RIG HAS FLATTENED ARMIES. YOUR LITTLE TIN HOUSE ON WHEELS IS NEXT." / "NOBODY CALLS THE RUSTBUCKET A TIN HOUSE, SQUID FACE!"

- **Phase 1, truck mode:** leaps into the lot off the mesa. **Ram:** drives to the far side, revs (chevrons along the floor the whole way, headlights blazing), charges, smashes into the arena wall and sits dazed. **Barrel lob:** every landing spot marked first. **Drone dispatch.** Its armour takes only 20% from anything but smash; **its tires shred to melee** (x2) and shrug off fire (x0.25). XLR8 can dash straight through a ram (the dash is invulnerable), slashing both tires. **Both tires gone: it spins out and STALLS**; Four Arms lifts the whole truck overhead and throws it: **FLIPPED!** (30 damage). Fresh tires bolt on afterwards.
- **Phase 2, robot mode** (at 55%): it skids to the middle, rears up and stands as a robot (ROBOT MODE!). **Hammer slam:** walks up, raises both fists (a striped landing zone), slams with shockwaves both ways, fists stuck in the ground (chest in reach, touching it is safe). **Wheel saw:** rips a wheel off its shoulder and bowls it across the floor (chevrons first); jump it, or **punch it back into the robot** (RETURN!, big damage). **Beam:** kneels and fires along the floor at knee height (the Chapter 1 beam tell). **Hazard-striped chest plates only break to smash** (Four Arms); until they're gone the core takes 30-75%. **After every slam its vents open:** fire does x2.5 and builds heat; enough and it **OVERHEATS** into a kneel (x1.5 from everything).
- So: XLR8 for the tires, Four Arms for the flip and the plates, Heatblast for the vents (and the drones). Any alien, or Ben, can still win, just slower. Damage rules are pure functions with tests (`entities/bosses/roadbreaker/rules.ts`).
- Arenas now stage any boss kind (`entities/bosses/bossKinds.ts`: music, Vilgax's lines, banners, extra parts like tires and plates); the Hunter-Killer is unchanged.

## Collectibles and secrets

- **Five Sumo Slammers cards:** the diner roof, the hoodoo (rocket jump), over the river (XLR8), the vault (Four Arms) and the pole sign (Stinkfly, Chapter 3). Mr. Smoothy cups in the rest stop, on the mesa shelf, on the far bank and on the motel balcony.
- **The way back to Chapter 1:** a cracked wall whose alien isn't on the dial now shows that alien's rim-lit silhouette and **UNLOCKS IN CHAPTER N**, so Camp Crash's vault points at Road Trip. When an alien joins mid-chapter, walls update to name it. Smashing a vault in Chapter 2 makes Ben remember the one at camp ("WAIT... THERE WAS ONE OF THESE BACK IN CAMP CRASH!"), and **Chapter Select flags chapters with a secret the file can now open** (a pulsing SECRET WAITING! chip and a glinting card slot).
- Chapter Select gets a Road Trip diorama (the Rustbucket at sunset, Ben on the roof, a convoy rig on its tail); bests, ranks, per-difficulty medals and splits work for Chapter 2 exactly like Chapter 1.

## Scripted playtests and what they caught

Chapter 2 was played start to finish by a script in headless Chromium (title > Chapter Select > the whole chapter > Chapter Complete) on **all three difficulties, each on desktop (1280x720) and an emulated phone (844x390)**: all six runs reach Chapter Complete with no deaths and no errors. Chapter 1 was rechecked (its boss, the vault, the title and play on a 20:9 phone at 915x412). The script plays the intended route (Heatblast for the barricade, XLR8 across the river, Four Arms ripping trucks off the RV) and drives the boss through its counters (tires, stall, flip, transformation, plates, vents). Along the way it caught, and these are fixed:

- **Falling through the RV roof** on a slow frame (the roof body was 8 px; a 30 fps phone could drop Ben through it on landing). Now 24 px deep.
- **Leaping off the broken bridge into the river** before XLR8's discovery started (the beat waited for Ben to land). Beats now start mid-jump and stop him dead over the ledge.
- **The canyon's dry wash** had a 3-tile lip only a perfect full jump cleared. Now 2 tiles.
- **Truck stop:** only Heatblast and Four Arms could climb over the outcrop to the boss (caught by the reachability test), and missing the jump from the balcony dropped Ben into a slot beside the vault. A crate step and a balcony that reaches the rock fix both.
- **ROADBREAKER:** a flipped truck could be lifted again the moment it landed, so Four Arms could chain flips and skip robot mode. One flip per stall now.
- A pit respawn could shorten a longer invulnerability (a story beat's); it now only extends it.

## Approved ideas built this milestone

- **STRIKE!:** a thrown enemy (or truck, or boss) bowls through ordinary enemies; two or more down pops STRIKE! with a slow-motion beat (`COMBAT.bowlingSlowdown`, `strikeHits`).
- **Multi-cut freeze-frame:** XLR8's dash cutting 4+ enemies freezes into a comic panel (the HUD draws it) with a slash across each, then they all burst.
- **Swap stats:** SWAPS and BEST TAG TEAM rows on Chapter Complete with a small, capped score bonus (`config/scoring.ts`).
- **Wide phones filled:** EXPAND scaling up to 21.6:9; HUD, touch controls and every menu anchor to the real screen edges (`ui/view.ts`); checked on emulated phones for every screen, Chapter 1 included.
- **Shape-coded telegraphs:** every red danger zone also carries stripes (stay out) or chevrons (the way it travels); impact spots get a target with a cross (`Telegraphs.zone/target`).
- **MAKE IT EASIER:** after 4 deaths (not on Easy) the game over menu offers a one-tap step down, explained, keeping everything.

## How to test (at the time)

**Milestone 4, part 1: Chapter 2, desktop** (`npm run dev`)

1. **Get there:** a file that has cleared Chapter 1 (or clear it), Chapter Select > ROAD TRIP > PLAY. Shortcut for single sections: `?level=ch2&start=<checkpoint>` (see the URL switches; practice runs, nothing saved as a best).
2. **Opening:** the RV drives at sunset while Max, Gwen and Ben talk with portraits; drones swoop in; cut to the rest stop. Any key skips. Die later and retry: it doesn't replay.
3. **Rest stop and canyon:** Heatblast burns the barricade. The diner roof card (awning, then roof), the hoodoo card above the mesa shelf (rocket jump from the shelf).
4. **XLR8:** walk onto the broken bridge: the watch acts up, NEW DNA DETECTED, the XLR8 card, and Ben becomes XLR8 (never a misfire, even on Hard). Run across the river; slow down and you sink. Three Hornet waves. Grab the card over the water between the islands.
5. **Pick-up:** on the far bank the RV rolls in; walk into it.
6. **Chase, ride:** drone waves, tires bouncing over the roof (arrow at the right edge, target where it lands: jump it or punch it away), potholes tossing you up. Jump over a rail at the end of the roof: you're hurt and put back.
7. **Chase, convoy:** a rig revs (chevrons on the back of the roof): step forward or jump as it rams. It hooks on: NEW DNA again, and Four Arms. Walk to the back, J at the clamp to lift the truck, J to throw it; try throwing it into the next one. The far-lane rig marks spots on the roof before each shell. Die here and retry: you're back on the roof with the convoy (every difficulty).
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
