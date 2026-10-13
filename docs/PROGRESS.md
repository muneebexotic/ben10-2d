# Progress

Short on purpose. Decisions that still apply: [DECISIONS.md](DECISIONS.md). Each finished milestone's full record (what was built, playtest notes, how it was tested): [history/](history/). Performance budget and measurements: [PERFORMANCE.md](PERFORMANCE.md).

## Status

**Milestone 4, part 4 built Chapter 5, Bounty Hunters.** Five story chapters (Camp Crash, Road Trip, Dr. Animo, Kevin 11, Bounty Hunters), eight aliens (Heatblast, XLR8, Four Arms, Wildmutt, Stinkfly, Upgrade, Ghostfreak, Diamondhead), five bosses (the Hunter-Killer drone, ROADBREAKER, KING CROAK, KEVIN 11, THE HUNTERS), the Act 1 ending, Omnitrix Training, achievements, the card album, JOKES FOUND, splits, ghosts and Omnitrix Master. The full record of this milestone is [history/milestone-4-part-4-chapter-5.md](history/milestone-4-part-4-chapter-5.md).

**This session:** the owner's housekeeping (red tells for every villain, PRACTICE RANK, the bench as a no-regression gate against main, `npm run qa` in the workflow), then Chapter 5: Silver Spur and the Diamond Deep, Sixsix, Kraab and Tetrax, Ghostfreak (phasing, invisibility, a watch that doesn't quite want to let him go) and Diamondhead (a reflecting shield, crystal platforms), the forced misfire on the lift (the story's one named exception), THE HUNTERS, and **THE DEEP DIVE**, a ray-traced 3D mine-cart ride in the middle of the chapter. The new aliens also open four secrets in Chapters 1, 3 and 4. Chapter 5's art is made when the chapter loads, so boot grew 8% instead of 27%.

Next, when asked: Chapter 6 (Magic), planned in GAME_DESIGN.md. Still deferred: Training trials, more Chapter 1 revisits, Chapter 1 Hard Remix, perfect-transform boss counterplay, the no-transform badge.

## How to run

```
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run typecheck
npm test
npm run bench      # performance gate: this build against a build of current main, plus the leak check (docs/PERFORMANCE.md)
npm run qa         # screenshot sweep and text checks at 3 screen sizes (add -- --fuzz for random play at every checkpoint and every boss fight)
```

URL switches for playtesting:

| Switch | Effect |
|---|---|
| `?start=cp-cliff` | Start at a checkpoint (`cp-cliff`, `cp-nest`, `cp-arena`; `cp-ravine`). A practice run on the last-played file (cards and clears count, best times and splits don't); without a file nothing is saved |
| `?level=ch2` | Play Chapter 2 directly (a practice run). Combine with `&start=`: `cp-canyon`, `cp-river`, `cp-island` (Easy only), `cp-farbank`, `cp-convoy` (straight onto the RV roof), `cp-truckstop`, `cp-arena` (ROADBREAKER) |
| `?level=ch3` | Play Chapter 3 directly (a practice run). Combine with `&start=`: `cp-hall` (Easy and Normal), `cp-mammals`, `cp-dark` (the blackout), `cp-shaft` (Easy only), `cp-upper` (Easy and Normal), `cp-atrium`, `cp-lockdown`, `cp-lab` (Easy and Normal), `cp-frog` (KING CROAK) |
| `?level=ch4` | Play Chapter 4 directly (a practice run). Combine with `&start=`: `cp-arcade` (Easy and Normal), `cp-lair`, `cp-highscore` (Easy and Normal), `cp-station` (Easy and Normal), `cp-line`, `cp-turn`, `cp-depot` (Easy and Normal), `cp-kevin` (KEVIN 11) |
| `?level=ch5` | Play Chapter 5 directly (a practice run). Combine with `&start=`: `cp-street`, `cp-hotel`, `cp-minehead`, `cp-tunnels`, `cp-crystals` (Easy and Normal), `cp-jail`, `cp-dive` (THE DEEP DIVE), `cp-cavern`, `cp-lift`, `cp-hunters` (THE HUNTERS) |
| `?training=1` | Straight into Omnitrix Training (with the last file's aliens and difficulty) |
| `?aliens=fourarms,xlr8` | Adds aliens to the dial (a practice run). With Four Arms the Chapter 1 vault card spawns and counts; `?aliens=diamondhead,ghostfreak` opens the older chapters' new secrets |
| `?mute=1` | Start muted |
| `?debug=1` | Physics bodies plus a readout: position, quality level (`Q0` best to `Q2`), and the frame meter (CPU per frame, FPS, 1% low, heap, render targets). What to look for on a phone is in `docs/PERFORMANCE.md` |
| `?autobench=1` | The on-device benchmark: plays every heavy scene by itself and ends on a report to copy (`docs/PERFORMANCE.md`). `?autobench=report` shows the last report |
| `?gallery=1&per=12&page=0` | Every generated texture, for reviewing or replacing art. `?gallery=1&key=fourarms&scale=6&from=0` shows one sheet's frames large |
| `?at=<tile x>` | Dev builds only: spawn Ben anywhere with the watch |
| `?god=1` | Dev and bench builds only: Ben can't take damage from hits |

## Controls

| Action | Keys | Touch |
|---|---|---|
| Move | A/D or arrows | Left thumb stick (appears wherever your thumb lands on the left side) |
| Jump (hold for higher) | Space / W / Up | JUMP |
| Drop through a platform | Down + Jump | Stick down + JUMP |
| Attack | J (or X) | ATTACK |
| Special | K (or C) | SPECIAL |
| Aim up / upward variants | Hold Up while attacking or using the special | Stick up |
| Omnitrix dial | Q / E, or 1-9 to pick an alien directly | Swipe sideways on the Omnitrix button; hold it for the radial dial, slide onto an alien and let go |
| Transform, or **swap** while transformed (with a different alien selected) | T | Tap the Omnitrix button (it reads SWAP!) |
| Pause (Training: training menu) | Esc / P | II button (top centre) |
| Menus | Arrows / WASD, Enter, Esc (back); S opens Settings on Chapter Select | Tap a card to pick it, tap again to confirm; swipe or tap the arrows on Chapter Select; BACK in the top-left |
| Skip a cinematic | Any key | Tap anywhere |
| Mute | M | Settings |

What ATTACK and SPECIAL do depends on the form (the touch buttons change icon with it):

| Form | ATTACK (J) | SPECIAL (K) | Extra |
|---|---|---|---|
| Ben | Punch (parries lasers) | Dodge roll (untouchable while rolling) | |
| Heatblast | Fireballs (hold to auto-fire) | Hold, release: Fire Burst | Jump in mid-air: rocket jump, hold to glide |
| XLR8 | Hold: blur strikes, every 6th is a kick | Dash through enemies (Up: upward dash) | Run full speed to cross water |
| Four Arms | Punch, punch, haymaker. Up: overhead clap. Next to a downed drone, boulder or the dummy: lift, then J again to throw (Up: lob) | Ground slam with shockwaves. In the air: meteor drop | |
| Wildmutt | Hold: claw rakes, every 3rd a double rake | Pounce (Up: high pounce); landing on an enemy from above is a POUNCE! | Push into a wall to climb, Jump to leap off. Senses reveal invisible enemies and hidden doors |
| Stinkfly | Slime glob (slows; 3 quick ones gum an enemy in place) | Stink cloud (fire sets it off) | Jump in mid-air: fly (hold to climb, release to hover, Down to dive) until the wings tire |
| Upgrade | Eye laser (hold; Up aims high, Down in the air aims low; every 4th is a triple) | Merge: a puddle that flows into a machine and possesses it (K again ejects) or takes over a robot | Possessed: a turret aims and fires with J, a cart drives with left/right (J: horn), lifts and shutters work on their own |
| Ghostfreak | Tentacle lash (hold; every 3rd reaches further and drags) | Hold: phase (through phase walls, enemies and shots; can't attack). Phased and still: invisible | Floats down slowly. Swap-in scream frightens enemies |
| Diamondhead | Crystal shards (hold; every 3rd a fan; Up aims high) | Hold: crystal shield, reflects shots and laser beams (Up/Down while holding tilts it). Up+K: a crystal platform (two at a time) | Swap-in crystal spikes |

**THE DEEP DIVE (Chapter 5's 3D ride):** left/right switch tracks, Jump hops, Down ducks, J attacks what's ahead, K is the alien's ride special (rocket jump, brace, slow time, sniff, fly, merge, phase, shield), T transforms and swaps as usual.

On-screen controls show only on touch devices (Settings → TOUCH CONTROLS: AUTO / ON / OFF). In AUTO, pressing a key hides them and touching the screen brings them back.

## Known issues and limitations

- **Not tuned by hand.** Difficulty was tuned by reasoning, scripted playtests and a reachability test, not by human players. Boss HP (120), drone counts and the jammer ravine may need tuning after real playtests. All numbers are in `src/config/`.
- **Touch controls are untested on real hardware.** They were tested with emulated phones and multi-touch in headless Chromium. Button sizes and positions live in `config/touch.ts`.
- **Measured on one phone.** Every heavy scene runs at 60 FPS and Q0 on the owner's Android phone (Mali-G78, 60 Hz); other GPUs (Adreno, PowerVR, iOS) and 90/120 Hz screens haven't been measured. `?autobench=1` on any phone gives the same report.
- **A blocked punch thunks a few times** (BUGS.md T12, deferred).
- **Boot generates the shared art in code:** about 3.3 s from a cold start to the title screen at 4x CPU throttle. A chapter's own art can be made when it loads instead (Chapter 5's is); the first load of Chapter 5 pays for it behind the fade. `docs/PERFORMANCE.md`.
- **iOS Safari can't go fullscreen** or lock orientation from a web page; the game still fits the screen with the browser bars visible. Adding it to the home screen (web manifest) gives a fullscreen landscape launch.
- **Phones wider than 21.6:9 still get thin side bars** (the view stops growing at 864 px wide so level design stays readable).
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
- **Chapter 3 is tuned by scripted playtests, not people.** KING CROAK's health (150) and hide (45% from plain hits), LOCKDOWN's timing on Hard (12 s transformations, 15 s cooldowns) and how dark the blackout is are the first things to check with real players. Numbers are in `config/frog.ts`, `config/mutants.ts`, `config/chapter3.ts` and `config/aliens/`.
- **KING CROAK on Hard is the first thing to check with real players.** Human Ben's 15 s between transformations against the frog, at 1.5x damage, is where scripted damage-on runs failed (Normal passes cleanly). Levers: `FROG.tongue.damage`, `FROG.idleMs`, and Hard's cooldown and damage in `config/difficulty.ts`.
- **KING CROAK's health (150)** may be low for players who keep Heatblast's fire on it from range: the damage-on Normal run beat it in under a minute. `FROG.maxHp` and `FROG.hideMultiplier`.
- **Stinkfly's flight and Wildmutt's climbing need a human feel pass** (headless runs at about a third of real speed).
- **KEVIN 11 with damage on is unproven.** The scripted player (it walks at him, punches, swaps on a timer, jumps only at incoming shots) reached Chapter Complete on every difficulty with damage off, but with damage on it lost every attempt on Normal (21 in all, at 170 and at 150 HP), usually with Kevin at a quarter to a half of his health. It never reads a tell or uses the coils on purpose, so people should do much better, but play him by hand first. Levers in `config/kevin.ts`: `KEVIN.maxHp`, `COPY_RULES` (how much a copy resists its own alien), `RELIANCE` (how fast copies level up), `COPY_MOVES.fire`.
- **Chapter 4 is tuned by scripted playtests, not people.** KEVIN 11's health (150, down from 170 after damage-on playtests), the reliance thresholds (copy levels at 25, 60 and 110 points, 4 points a second of decay) and the copy resistances are the first things to check with real players: if NOTHING TO COPY is too easy or the hybrid too tanky, the levers are `RELIANCE` and `COPY_RULES` in `config/kevin.ts`. SUMO SLAMMERS' difficulty is `config/sumo.ts` (mashing alone loses round 2 by design).
- **Upgrade's feel needs a human pass:** the puddle's speed and reach into machines, the laser's rate and the cart's handling (`config/aliens/upgrade.ts`, `config/tech.ts`).
- **Kevin the buddy is a follower, not a fighter with physics:** he retraces Ben's steps and pops in behind Ben when left far behind; on a long flight or a lift ride he catches up rather than following the path.
- **Flyers can skip the power depot's shutter** by going over the wall (deliberate); walkers need Upgrade.
- **THE HUNTERS with damage on is unproven.** The scripted player cleared the chapter on every difficulty with damage off, but with damage on (Normal) it didn't beat the boss in 12 attempts: Kraab fell in 9 of them once it kept its distance, then 7 attempts ended up the shaft to Sixsix's salvos (one every 2.6-3.4 s, 950 ms tell) and 2 at Tetrax. It never jumps over Kraab or watches the missiles come in, so people should do much better, but play it by hand first. Levers: `SIXSIX.boss.salvoEveryMs` and `salvo` in `config/hunters.ts`, `MISSILE.damage` in `config/bounty.ts`. Resuming at the stage you died in is a proposal in IDEAS.md.
- **Chapter 5 is tuned by scripted playtests, not people.** THE HUNTERS' health (Kraab 90, Sixsix 70, Tetrax 110), the trackers' paint time (1.5 s) and salvo, the duels on Main Street (the trackers keep firing during them) and the lift's 15 seconds are the first things to check with real players. Numbers are in `config/hunters.ts`, `config/bounty.ts` and `config/dive.ts`.
- **THE DEEP DIVE needs a human feel pass:** track speed (11 to 24 m/s), lane switching, jump and duck timing, and how readable the obstacles are at speed on a phone. Headless runs it at about a third of real speed. Its GPU cost on phones other than the owner's is unmeasured: `?autobench=1` plays it (`ch5-dive`).
- **Ghostfreak's whispers and hesitation** (a 40% chance at timeout to hold on 0.9-1.9 s) are by design; if the hesitation reads as a bug to players, `GHOSTFREAK.hesitate` in `config/aliens/ghostfreak.ts`.
- **Chapter 4's sealed room needs two aliens:** Upgrade's lift (or a flyer) up to the mezzanine, then a swap to Ghostfreak. Intended, but nothing says so beyond the hint.
- **Lurkers are nearly invisible** to aliens without senses until they're slimed, hit or about to spit (their throat glows first). Fair by design, but worth watching in playtests.
- **The Act 1 ending is procedural pixel art** like everything else; Kevin's look is a placeholder until real art.
- **Saves live in one browser:** no cloud sync or export yet (see IDEAS.md).
- **Training options reset** when the game is reloaded (they aren't saved).

## How to test the latest chapter

**Milestone 4, part 4: Chapter 5, desktop** (`npm run dev`). Chapter 4's steps are in [history/milestone-4-part-3-chapter-4.md](history/milestone-4-part-3-chapter-4.md).

1. **Get there:** a file that has cleared Chapter 4, Chapter Select: BOUNTY HUNTERS (Silver Spur under the moon, Sixsix's laser on Ben) > PLAY. Sections on their own: `?level=ch5&start=<checkpoint>` (see the URL switches).
2. **Cold open:** Vilgax's bridge (the hologram of Ben turning on the war table, the three hunters), then Silver Spur, the CHAPTER 5 card, then the family. Any key skips; a retry doesn't replay it. A few steps in: the jetpack roar and the first salvo.
3. **Main Street:** a tracker paints you (red line, LOCKED!), then markers and missiles: break line of sight under a porch roof or behind a building (LOCK LOST), or shoot it down. Sixsix's two duels (slashes, cannon, hop; he leaves after about 13 s or when hurt enough). The water tower card.
4. **The jail:** walk into the sheriff's office: the net, the drag into the cell, NEW DNA: Ghostfreak. Hold K and walk through the stone wall on the right (or back through the bars to smash the generator: NET DOWN!). Whispers in the corner; let the timer run out to see him hesitate.
5. **The hotel:** boarded doors only Ghostfreak passes, the upper hall, the back room's card, the window out. Phase and stand still near a tracker: it loses you.
6. **The mine:** Kraab's three ambushes (a crack racing to you, then the eruption), crab-bots (smash one over), falling rocks, the cave-in (Heatblast's fire on the dynamite), the alcove card under the floor (a second crate).
7. **THE DEEP DIVE:** run into the cart. Left/right tracks, Jump, Down, J ahead, K the alien's special, T to swap mid-ride (try Four Arms' brace, Ghostfreak's phase, Wildmutt's sniff). Kraab's cracks, the drone's painted track, the cannon's glow. The high card (jump), the trestle, the landing. Without a hit: DEEP DIVER.
8. **The cavern:** Kraab charges on the trestle, Tetrax at the other side, NEW DNA: Diamondhead. Hold K facing Kraab: REFLECTED!. Then Up+K platforms (the ledge card), sentries (Diamondhead eats their shards), and the security laser: stand under it facing the emitter, hold K, then Up: the beam bounces into the receiver (a two-tile target) and the crystal gate drops. Die after the standoff on Easy or Normal: you're back at CRYSTAL FIELD, not before it; die during it: it replays with Diamondhead already in hand.
9. **The lift:** step on, it rises and jams, the hunters corner you, press T: the misfire (never the alien you picked). 15 seconds: FIX is locked with a countdown, two crab-bots drop in (KO one for IMPROVISED!). Untouched: CLUTCH MISFIRE. Then the drop and the crash into the chamber.
10. **THE HUNTERS:** Kraab (smash his shell, or hit his back; reflect his cannon; three heavy hits on the cracked pillar bring the roof down: CAVE-IN!), Sixsix up the shaft (he hovers over the far side from you: fire up at him, fly or climb up to him, or tilt the shield and send a missile into his jetpack; then climb out of the top), Tetrax in the yard (watch for the glint; Four Arms cracks him, three fire hits heat him and the next blow shatters). He yields; the ending, and the dial's last click to Ghostfreak: "SOON...".
11. **Achievements:** REFLECTED (25 reflects), BOO! (frighten 20), CLUTCH MISFIRE, DEEP DIVER, BOUNTY VOID.
12. **Older secrets** (`?aliens=diamondhead,ghostfreak` or a file that cleared Chapter 5): Chapter 4's laser vault in the power depot (Diamondhead under the beam, shield tilted up) and the sealed room off the mezzanine (Upgrade's lift up, then Ghostfreak through the welded door); Chapter 3's exhibit vault at the foot of the Night Gallery's climbing wall (Ghostfreak); Chapter 1's jammer beam (destroy the jammer, then Diamondhead on two crystal platforms over it, shield tilted down onto the crystal seam: the cliff opens).
13. **Difficulty:** Hard keeps JAIL, DEEP DIVE, CRYSTAL CAVERN, THE LIFT and THE HUNTERS only.

**Phone (emulated wide phone or real):** the radial dial now has eight faces; THE DEEP DIVE with the stick for tracks (stick down ducks); the lift's countdown and the FIX lock above the thumbs; `?autobench=1` now plays the ride too.
