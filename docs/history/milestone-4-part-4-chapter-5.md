# Milestone 4, part 4: Chapter 5, Bounty Hunters

_The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`. The Act 2 plan (Chapters 4 to 6, with the owner's rules for the act) is in `docs/GAME_DESIGN.md`._

The session started with the owner's housekeeping (below), then built Chapter 5 as planned in GAME_DESIGN.md, plus one thing the plan didn't have: the owner asked for "something unique and different... maybe something in 3D, maybe the game evolved". That became **THE DEEP DIVE**, a ray-traced 3D mine-cart ride in the middle of the chapter.

## Housekeeping first

- **Red means danger, for every villain (BUGS.md D1).** Kevin's and Dr. Animo's tells became danger red with their colour as a thin edge (`config/tells.ts`); the hunters were built that way. `tests/tells.test.ts` fails if a telegraph call passes a raw villain colour.
- **PRACTICE RANK** on Chapter Complete for practice runs (BUGS.md D2).
- **The Hunter-Killer keeps one smoothie in phase 2 (BUGS.md L4)**; the damage-on Normal check of that fight is in the playtest table below.
- **`npm run bench` is a relative gate:** this build against a build of current main, same machine, alternating rounds, best of each; leaks and render targets stay absolute; a new chapter's scenarios are held to main's heaviest. `docs/PERFORMANCE.md` has the A/A noise numbers that set the margins.
- **CLAUDE.md** lists `npm run qa` and `npm run qa -- --fuzz` in Commands and in the before-finishing rules.

## The chapter, start to finish

Silver Spur, an 1880s gold-rush ghost town turned roadside attraction, under a full moon, and the Diamond Deep mine under it. `levels/chapter5.ts` (524 x 64 tiles: the town on row 30, the tunnels stepping down to rows 36 and 40, the cavern floor on row 58), set pieces in `scenes/level/story/bounty/`, the hunters in `entities/hunters/` and `entities/bosses/hunters/`, enemies in `entities/enemies/bounty/`, hazards in `entities/hazards/`, the ride in `levels/diveTrack.ts`, `scenes/DiveScene.ts` and `scenes/dive/`. Tuning: `config/bounty.ts`, `config/hunters.ts`, `config/dive.ts`, `config/aliens/diamondhead.ts`, `config/aliens/ghostfreak.ts`.

1. **Cold open on Vilgax's ship** (skippable, never replayed on a retry or a continue). A green Vilgax in front of the war table, a red hologram of Ben turning in its projector cone, and the three hunters lined up: "TWO OF MY MACHINES. DESTROYED BY A CHILD." / "SO I HAVE HIRED... PROFESSIONALS." Kraab ("THE BOY'S AS GOOD AS CAUGHT, MY LORD!"), Sixsix ("(SIXSIX SAYS SOMETHING RUDE)"), Tetrax ("I DON'T DO THIS FOR FREE, VILGAX."). The bounty: the boy, alive, with the watch.
2. **Silver Spur.** The Rustbucket at the town gate (POP 0, GHOSTS 12), the CHAPTER 5 card, then Max ("A REAL 1880S GOLD RUSH TOWN. THEY STILL DO GOLD-PANNING TOURS!"), Gwen ("IT'S A GHOST TOWN"), Ben ("SWEET. NO LINES."). A few steps in, Sixsix strikes first: a jetpack roar across the sky and a salvo landing around Ben ("THAT'S NO TOURIST, BEN. TAKE COVER UNDER THE PORCHES!").
3. **Sixsix's hunt on Main Street.** Tracker drones paint Ben with a red laser; a salvo follows unless he breaks line of sight (porch roofs, buildings) or shoots the drone down. Twice Sixsix drops out of the sky for a short blade duel (fast slashes, a shoulder cannon, a hop), then blasts off again with a rude click. WANTED posters with Ben's face on them; a card on the water tower.
4. **The jail: Ghostfreak.** Walking into the sheriff's office, Sixsix swoops in at the door and fires his energy net: it wraps Ben, drags him into the cell and seals the bars; its generator hums out in the office where nobody inside can reach it, and Sixsix leaves laughing. The watch finds new DNA: Ghostfreak, who phases out through the wall (or back through the bars to smash the generator: NET DOWN!).
5. **The haunted Grand Hotel.** Ghostfreak's showcase: boarded doors only he walks through, a two-storey lobby, an upper hall, a secret back room, a window to climb out of, and tracker drones that lose him while he's phased and still. A card in the back room.
6. **The mine head and the rail tunnels: Kraab's hunt.** A crack races along the floor toward Ben (the tell), stops under him and pulses, and Kraab erupts claw-first ("KRAAB'S THE NAME, BOY! REMEMBER IT... IT'S THE LAST THING YOU'LL HEAR!"), three times, then goes deeper ("I'LL BE WAITING FOR YOU AT THE BOTTOM, BOY!"). Crab-bots, falling rocks with dust tells, a cave-in only dynamite clears (fire sets it off), and an alcove card under the tunnel floor behind a second crate.
7. **THE DEEP DIVE** (below): from the cart station at the end of the tunnels, a runaway ore cart down the main haulage way, in 3D, off a broken trestle into the crystal cavern.
8. **The crystal cavern: Diamondhead.** Kraab charges his claw cannon on the wreck of the trestle; Tetrax blocks the way out ("END OF THE LINE, BOY! SAY CHEESE!" / "UH... CRAB ON ONE SIDE, ROCK GUY ON THE OTHER."). The watch reads the crystals: Diamondhead. Holding the shield up facing Kraab sends the blast straight back: REFLECTED!, Kraab blown off the trestle ("MY OWN BLAST?! THAT'S CHEATING!"), and Tetrax notices: "A PETROSAPIEN? ...INTERESTING." (Three misses and Kraab gives up anyway: the story never stalls on a missed shield.) Then crystal sentries, crab-bots, a ledge card for crystal platforms or flight, and the mine's security laser: bounced into a receiver, it overloads and the crystal gate out drops.
9. **The lift: the forced misfire** (below).
10. **THE HUNTERS** (below), then the ending: Kraab buried to his eyestalks, Sixsix in the water tower, Tetrax yielding ("A WARRIOR WITH HONOR. VILGAX DID NOT TELL ME THAT." / "I REFUSE THE BOUNTY."), Vilgax raging over the hologram ("TETRAX! YOU TREACHEROUS PEBBLE!" / "FIND ANOTHER PEBBLE, VILGAX."), and Tetrax's parting line: "ASK YOUR GRANDFATHER WHERE HE LEARNED TO FIGHT LIKE THAT." Gwen, Ben and Max close the chapter ("HE DIDN'T GIVE UP, BEN. HE CHOSE NOT TO FIGHT YOU. THAT'S DIFFERENT." / "...HE SAID TO ASK YOU WHERE YOU LEARNED TO FIGHT." / "WHO WANTS GOLD-PANNING? MY TREAT!"). Last beat: the dial clicks to Ghostfreak on its own for a moment, and a whisper in the corner: "SOON..."

Checkpoints: MAIN STREET, HOTEL, MINE HEAD, RAIL TUNNELS and CRYSTAL FIELD (past the cavern standoff) on Easy and Normal; JAIL, DEEP DIVE, CRYSTAL CAVERN (reached by landing from the ride), THE LIFT and THE HUNTERS (reached when the lift crashes into the chamber) on every difficulty. Par time 11:00.

The town gets its own look: a moonlit sky with mesas and a far skyline of false fronts, wooden storefronts (saloon, general store, bank, sheriff, undertaker, Grand Hotel), porch roofs that are platforms, interiors lined up with their floors (saloon, jail, hotel, mine head, tunnels, cavern, shaft), ambient light per room (`LIGHTING.ambient*`), timbered tunnels with lanterns, a cavern of glowing crystal. Four music tracks built with a small composition kit (`systems/audio/musicKit.ts`): `ghosttown` (a spaghetti-western chiptune), `mine` (percussive, echoing), `hunters` (the boss, 152 BPM) and `dive` (170 BPM).

## Ghostfreak

Data-driven like every alien (`src/aliens/ghostfreak/`, `config/aliens/ghostfreak.ts`, one registry line). Pale and grey with a single violet eye, chest tentacles, a ragged cloak that floats.

- **J: tentacle lash** (hold to keep lashing; every third reaches further and drags what it catches toward him).
- **Hold K: phase.** Intangible to walls marked as phase walls, enemies and shots; can't attack. Held still while phased (0.4 s), he vanishes: enemies lose track of him.
- **He floats down slowly** (a ghost settles, it doesn't fall).
- **Swap-in: a scream** that frightens enemies nearby for a moment (BOO! counts them).
- **He feels slightly wrong:** whispers in the corner of the screen every so often while he's out ("LET ME OUT...", "LET ME STAY...", "WE COULD BE MORE..."), a glitch when he arrives, and at timeout a 40% chance he holds on for one to two seconds with a whisper ("NOT YET...") before he lets go. The Omnitrix logic for that hesitation is plain TypeScript and tested.
- Discovery in the jail cell (forced, never a misfire), a title that fades in backwards and twitches, his own sounds and music layer, ECTO shield bar.

## Diamondhead

`src/aliens/diamondhead/`, `config/aliens/diamondhead.ts`. Living green-blue crystal.

- **J: crystal shards** (hold to keep firing; every third volley is a fan of three; Up aims high).
- **Hold K: crystal shield.** Shots that hit its face come back faster and harder; laser beams bounce off it. Up or Down while holding tilts the face 40 degrees, which is how beams are aimed at receivers. It cracks after about four seconds of holding.
- **Up + K: a crystal platform** where he aims (ahead and level with his feet on the ground, a bridge; under his feet in the air, a step). Two at a time; each flickers and shatters after a while. Up shafts and over gaps.
- **Swap-in: crystal spikes** burst out of the ground around him.
- Lasers, bolts and missiles glance off crystal (his shield takes half from shots) but heavy blows crack it (x1.4 from contact). Crystal sentries' shards feed him instead of hurting him.
- Discovery in the crystal cavern, a title that shatters in like glass, his own sounds and music layer, CRYSTAL shield bar.
- Misfire reaction lines for every pair, both ways, for both new aliens.

## Enemies and hazards

| Thing | Behaviour | Best answer |
|---|---|---|
| **Tracker drone** (Sixsix's) | Hovers, paints Ben with a red laser for 1.5 s (LOCKED!), then calls a salvo of three missiles; breaking line of sight for a moment loses the lock (LOCK LOST) | Cover, or shoot it down (4 HP) |
| **Missile salvo** | Ground markers where they'll land, then missiles from the sky; they explode on anything solid, hurt enemies too and set off dynamite | Get out from under the markers, or under a roof; Diamondhead's shield sends them back |
| **Crab-bot** (Kraab's) | Up close it raises its claws (the tell) and pinches; at range it burrows, a crack races to Ben and it erupts. A shelled front shrugs off light hits; a heavy hit flips it onto its back, legs kicking, wide open | Hit its back, or smash it over |
| **Crystal sentry** (Tetrax's) | A crystal spike that glints (the tell) and fires a fan of shards | Anything; Diamondhead eats the shards; smashes do x1.5 |
| **Dynamite** | A crate that only fire (or an explosion) sets off; a short fuse, then a blast that clears the cracked rock it's stacked against | Heatblast, or lure a missile |
| **Falling rocks** | Dust trickles from the ceiling (the tell), then a rock | Keep moving |
| **Security laser** | A beam that's always on (the tell) and burns; it runs three rows above the floor so walkers pass under it | Diamondhead bounces it into a receiver: the receiver overloads the emitter and its crystal gate drops |
| **Phase walls** | Jail bars, a stone wall with a sigil, boarded doors: solid for everything but a phased Ghostfreak (if his phase ends inside one, he's pushed out to the nearer side) | Ghostfreak |

## THE DEEP DIVE (the 3D ride)

At the cart station at the end of the tunnels Ben drops into a runaway ore cart, and the camera swings around behind him (from the 2D side view into the 3D view in 1.3 s). Eight hundred metres down the Diamond Deep's main haulage way, ray-traced in a fragment shader, then off the end of a broken trestle into the crystal cavern and back into 2D.

- **The tunnel** (`scenes/dive/tunnelShader.ts`) is traced per pixel: a timber-framed tunnel 3.2 m wide with three tracks, posts every 4 m, a lantern every 8 m, gravel, sleepers and rails, crystal veins growing in the walls the deeper it goes, the tunnel bending with the track, gaps cut into the floor, and at the end the cavern opening up. Colours are posterised and dithered into the game's pixel palette, and the tunnel is traced at half resolution into a texture and drawn at 2x (chunky like every other pixel in the game, and a quarter of the work).
- **Everything on the track** (rocks, crates, crab-bots, Kraab, the drone, smoothies, the card, missiles) is a pooled sprite projected with exactly the shader's camera (`scenes/dive/DiveView.ts`), so it sits on the rails. Warnings are drawn on the floor of the track they cover.
- **Controls:** left/right switch tracks, Jump hops (over gaps, rocks, crates), Down ducks (under beams), J attacks what's ahead, K uses the alien's ride special, T transforms and swaps as usual. Each form declares its ride (`FormDefinition.ride`): Heatblast shoots fireballs and rocket-jumps; Four Arms smashes and braces (splinters beams and rocks); XLR8 strikes and slows the world; Wildmutt strikes and sniffs out what's ahead (every obstacle's track glows orange from far off, the hunters' tells come twice as early); Stinkfly shoots and flies over everything for a moment; Upgrade lasers and merges with the cart (it hops gaps on its own); Ghostfreak lashes and phases through anything but a gap; Diamondhead shoots and shields (stops Kraab, missiles and the cannon); Ben strikes. Ben and every alien have a sprite from behind.
- **The track** (`levels/diveTrack.ts`, pure and tested): each hazard is introduced alone with a tip, then mixed in. Rocks, crates, crab-bots, beams, three gaps, Kraab erupting from a crack racing back along a track, Sixsix's drone painting a track for a missile, Kraab's cannon glowing on two tracks. Every obstacle leaves a free track or can be jumped or ducked; a plain jump clears every gap at the speed the cart is doing there; two all-track hazards are never closer than 1.2 s. The cart starts at 11 m/s and reaches 24.
- **Hits cost hearts** (1 or 2, with a grace period); a smoothie on the track heals. The card floats high: only a jump catches it, and it's paid when the cart lands (MINECART MASA). DEEP DIVER for a ride without a scratch.
- **Under the hood:** the ride's logic is a set piece in the level (`MineDive`), Ben waits it out on the cavern floor out of sight, and a separate scene (`DiveScene`, above the level and below the HUD) only draws. The level's camera and lighting are switched off meanwhile. The DEEP DIVE checkpoint is before it on every difficulty; landing reaches the CRYSTAL CAVERN checkpoint.

## The lift: the forced misfire

All three hunters corner Ben on the mine lift: it jams halfway up the shaft, Kraab lands on the deck, Tetrax steps out of the crystal, Sixsix hovers overhead ("NOWHERE LEFT TO RUN, BOY!" / "SURRENDER THE WATCH. NO ONE NEEDS TO GET HURT."). THE VOLLEY! {T}: TRANSFORM! Ben picks the obvious alien and the watch misfires anyway: the one deliberate break of "story moments never misfire", by name (`FORCED_MISFIRES = ['ch5-lift']` in `systems/MisfireRules.ts`; the controller refuses any other name). If he doesn't pick within 3.5 s the watch goes off on its own.

- The misfire is picked to be survivable with skill, never the alien he asked for: Ghostfreak first (phasing through the volley), then XLR8, Four Arms, Stinkfly, and so on (`pickForcedMisfire`, tested).
- The misfire card, then the comedy beat ("HA! IT'S A DUD!" / "(SIXSIX LAUGHS SO HARD HIS JETPACK HICCUPS)"), then 15 seconds to survive it: the fix swap is held back (the HUD's FIX shows a lock and a countdown, and a countdown pops over Ben), the hunters take turns (Tetrax's glinting shard volley, a salvo, Kraab's claw cannon), and two crab-bots drop in for an IMPROVISED! KO. The usual misfire tip ("SWAPS BACK FOR HALF PRICE") is replaced by STUCK WITH IT! while the fix is held.
- Then Kraab snaps the chain: the deck drops, crashes at the bottom, and he bursts through the shaft wall into the chamber where THE HUNTERS starts (the THE HUNTERS checkpoint). CLUTCH MISFIRE for surviving it without losing health.
- `tests/misfire.test.ts` checks that the only caller of `forceMisfire` in the source is the lift with `'ch5-lift'`; the QA fuzz fails on any misfire during a story moment that isn't that one.

## THE HUNTERS (boss)

One boss in three stages, each hunter falling a different way (`entities/bosses/hunters/Hunters.ts`, `config/hunters.ts`).

- **Kraab (90 HP), in the crystal chamber beside the shaft.** A shelled front (only a smash, his open claw while he charges, or a hit from behind gets through), burrowing ambushes with crack-line tells, the claw pinch, and the claw cannon (a long glow and an aim line; Diamondhead's shield sends it back for a huge hit). Sixsix strafes the chamber now and then with a salvo. A cracked crystal pillar holds up the roof: three heavy hits (a smash, a thrown enemy, or Kraab's own blast sent back) bring the ceiling down, on Kraab if he's near (CAVE-IN!). **Falls:** buried by the ceiling, eyestalks out ("MMPH! GET ME OUT!" / "RELAX, CRAB-FACE. I DON'T HIT GUYS WHO CAN'T MOVE.").
- **Sixsix (70 HP), up the lift shaft.** Maintenance ledges swing out of the shaft walls; he hovers over the far side of the shaft from Ben, swooping across when Ben does, and alternates salvos onto Ben's ledge with cannon bursts. He's on a diagonal (never straight above), so up-shots, up-shards and a tilted shield all reach him; Stinkfly's flight and Diamondhead's platforms take Ben up to him; a reflected missile hits his jetpack hard (x2.2). His jetpack sputters as he takes damage. **Falls:** it gives out and he corkscrews up out of the shaft into the water tower. The grate at the top opens.
- **Tetrax (110 HP), in the mine-head yard.** An honourable duel ("YOU FIGHT WELL. AND YOU SPARED THE CRAB." / "NOW FACE ME. NO TRICKS. NO HIDING."). Every strike is telegraphed with a crystal glint; a shard volley, crystal spikes from the ground, and a guard that stops anything from the front but a smash. Crystal on crystal: Diamondhead's shards barely scratch him (x0.25), a smash cracks him (x1.5 and a stagger), fire heats him (three fire hits) and the next hit that isn't fire shatters for x2.2. **Falls:** at 8% he yields, and the ending plays.
- Switching is rewarded, never required: each hunter has an alien that's best against him, and any alien wins slowly. Tells are the same length on every difficulty. A smoothie drops after Kraab.

## Achievements

REFLECTED (send 25 shots back as Diamondhead), BOO! (frighten 20 enemies as Ghostfreak), CLUTCH MISFIRE (survive the lift without losing health), DEEP DIVER (ride THE DEEP DIVE without a scratch), BOUNTY VOID (beat THE HUNTERS).

## Cards

Eight in Chapter 5 (29-36 in the album), five reachable now: the water tower, the hotel's back room, the tunnel alcove (dynamite), the ride (a jump in THE DEEP DIVE), the cavern ledge (platforms or flight). Three wait for later aliens with hints: a mouse hole in the saloon wall (Grey Matter), the flooded lower shaft (Ripjaws), a mine-cart loop only something round survives (Cannonbolt).

## The new aliens open older secrets

| Chapter | Secret | How |
|---|---|---|
| 4 | **The depot's laser vault** (MIRROR MATCH MIKI) | The vault is now a real room behind a crystal seal. Its security laser runs three rows over the depot floor; Diamondhead stands under it facing the emitter and tilts his shield up: the beam bounces into the receiver over the shutter, which overloads the emitter, and the seal drops |
| 4 | **The sealed room** (PHANTOM FUMIO) | The welded door at the mezzanine's end is a phase wall. Ghostfreak can't reach the mezzanine alone: Upgrade's lift or a flyer, then swap |
| 3 | **The sealed exhibit vault** (EXHIBIT A AKIRA, new) | A vault in the foot of the climbing wall in the Night Gallery, its door a phase wall |
| 1 | **The jammer's beam** (BEAM BREAKER BEN-JI, new) | The jammer beams straight up at Vilgax's ship, even wrecked. From crystal platforms over it, Diamondhead tilts his shield down: the beam lands on a crystal seam in the ground and the seam in the cliff past the jammer shatters open on a pocket with the card |

Chapter 1 now counts seven cards and Chapter 3 nine (both show SECRET WAITING! once the alien is on the file). Lasers in older chapters use Chapter 5's gear art, made when the level loads.

## Chapter Select

Chapter 5's window once it's open: Silver Spur under the moon, false fronts with a lit window, the water tower, and Sixsix hovering over the street with his laser blinking on Ben.

## Performance

- **Boot:** generating Chapter 5's art at boot made the cold boot to the title 27% slower (3140 to 4002 ms median at 4x CPU throttle, longest task 2041 to 2623 ms). Chapter 5's art (and every form's back view, which only the ride uses) is now made when the chapter loads, or an older chapter that uses its gear; Chapter Select makes only the one sprite its window needs. With that, boot is 8% over main (3093 to 3334 ms; longest task 1884 to 2217 ms): the two new aliens' own art, which every chapter's dial needs.
- **The ride** traces its tunnel at half resolution into a texture (a quarter of the fragment work at the same look) and redraws nothing else per frame that doesn't move.
- **Laser beams** are only redrawn when a beam's path changes (a mirror moved, an emitter switched off); their glow is added to the lighting every frame.
- `npm run bench` has three Chapter 5 scenarios (`ch5-street`, `ch5-dive`, `ch5-hunters`), the leak check visits the dive (leaving mid-ride) and the boss, and `?autobench=1` plays `ch5-dive`, the chapter's heaviest scene for a phone's GPU. Results below.

## Scripted playtests and what they caught

A scripted player (Playwright on a static build; headless Chromium runs the game at about a third of real speed, so the times below are about three times what a person would take) walks the chapter's route: it uses the intended alien for each obstacle, fights what's near, rides the dive, solves the cavern puzzle by trying spots, and in the boss fights from a distance. It doesn't read tells beyond stepping off missile markers.

| Run | Result |
|---|---|
| **Hard, god mode, start to finish** | Chapter Complete, 0 deaths, 14:19 headless. THE HUNTERS: Kraab 1:46, Sixsix 2:03, the climb out 0:32, Tetrax 1:15 |
| **Normal, god mode, THE HUNTERS** | Chapter Complete: Kraab 0:48, Sixsix 0:48, the climb out 0:18, Tetrax 1:52 |
| **Easy, god mode** | Start to CRYSTAL CAVERN 4:10, 0 deaths. The first run went on through Sixsix (7:38) and stopped at the climb out (the bot's flight, since fixed); two later runs stalled at the laser puzzle (C21). After the fix, CRYSTAL CAVERN to Chapter Complete 7:42, 0 deaths |
| **Normal, damage on** | Start to CRYSTAL CAVERN: 1 death (human Ben in the tunnels). The cavern: 2 deaths replaying the standoff as human Ben (C19). From the cavern: 1 death at the laser section; at the lift the bot never phased with Ghostfreak and took contact hits for 15 seconds (1 death), and reached the boss with one heart (C22). THE HUNTERS: see below |
| **Normal, damage on, THE HUNTERS** | Not beaten in 45 minutes of headless time (12 attempts, each from Kraab). Kraab fell in 9 of the 12 (the 3 losses: pinned against the arena wall, since the bot backs off but never jumps over him); 7 deaths came up the shaft and 2 at Tetrax (reached with 1-3 hearts; once down to 48 of 110). Damage taken: 94 in Kraab's stage, 96 up the shaft (61 hits; missiles and their blasts, then cannon bolts), 17 from Tetrax. Like KEVIN 11 in Chapter 4, play it by hand first |
| **The Hunter-Killer (Chapter 1), damage on, Normal** (BUGS.md L4) | Three runs, 0 deaths each; lowest health in phase 2: 1, 2 and 2; one smoothie taken each. The rule was a bigger heal only if more than two deaths: phase 2 keeps its one smoothie |

What the runs caught (all fixed; BUGS.md C16-C23):

- **Sixsix was nearly untouchable** up the shaft (C17): he hovered straight above Ben, steeper than any up-aim. A run didn't finish him in 24 minutes of headless time, another dealt no damage in two and a half. He now hovers across the shaft (tested geometry); the stage takes 0:48 to 2:03.
- **A respawn loop inside the ground** (C18): once, Ben ended up inside the shaft's floor and his last safe spot was recorded there; five respawns and Game Over in four seconds, in god mode. The push in wasn't reproduced (four targeted repros); a safe spot is now never in the ground and feet in a ground tile lift him out.
- **The cavern on a retry** (C19, C20): the standoff replayed with human Ben, and every death at the laser replayed the standoff. The watch now turns him into Diamondhead on a replay, and CRYSTAL FIELD (Easy and Normal) sits past it.
- **The laser receiver's window was 13 px** (C21): measured by sweeping Diamondhead across the floor (423.4-424.2); two tiles wide, it's 423.4-425.3.
- **No breather after the lift** (C22): the lift's crash now drops a smoothie (verified: in with 1 heart, Kraab with 3).
- **QA's Game Over check** never saw the Game Over screen (C16).
- **The dial's transform pop** hid the dial's entrance slam and showed up in QA as fractional text (C23).

**`npm run qa -- --fuzz`** (three sizes; the regression for Chapters 1-4 too): 0 page errors; 49 checkpoints and boss fights fuzzed (random play, pause-menu restarts, the misfire guard) with 0 failures; every boss knocked through its phases (the Hunter-Killer, ROADBREAKER, KING CROAK and KEVIN 11 defeated; THE HUNTERS through all three stages). The only text flag was the dial pop above.

**`npm run bench`** after the fixes: the two-round run flagged five older scenarios with main's own numbers far from the first run's; rerun over four rounds, no regression against main and no leaks (`docs/PERFORMANCE.md`, "Final run"). Chapter 5's scenarios stay under main's heaviest.
- **The boss with damage on:** the hit log (every hit with its source and Kraab's state) showed the first damage-on attempts died to Kraab only because the bot stood inside his shell (every hit was contact or a pinch, never a missile). Spaced like a player (punch from 2-3 tiles, back off on the claw's windup), it beats Kraab every attempt, taking one or two hits.

## How to test it

The short version is in `docs/PROGRESS.md` ("How to test the latest chapter").
