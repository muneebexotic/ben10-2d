# Progress

Short on purpose. Decisions that still apply: [DECISIONS.md](DECISIONS.md). Each finished milestone's full record (what was built, playtest notes, how it was tested): [history/](history/).

## Status

**Act 1 is complete (Milestones 1 to 4, part 2).** Three story chapters (Camp Crash, Road Trip, Dr. Animo), five aliens (Heatblast, XLR8, Four Arms, Wildmutt, Stinkfly), three bosses (the Hunter-Killer drone, ROADBREAKER, KING CROAK), the Act 1 ending, Omnitrix Training, achievements, the card album, JOKES FOUND, splits, ghosts and Omnitrix Master. Chapter 3 and the extras are described in [history/milestone-4-part-2-chapter-3.md](history/milestone-4-part-2-chapter-3.md).

Next, when asked: more Milestone 4 story chapters (Act 2 opens with Kevin 11), or Milestone 5 (characters). Still deferred: Training trials, more Chapter 1 revisits, Chapter 1 Hard Remix, perfect-transform boss counterplay, the no-transform badge.

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
| `?level=ch2` | Play Chapter 2 directly (a practice run). Combine with `&start=`: `cp-canyon`, `cp-river`, `cp-island` (Easy only), `cp-farbank`, `cp-convoy` (straight onto the RV roof), `cp-truckstop`, `cp-arena` (ROADBREAKER) |
| `?level=ch3` | Play Chapter 3 directly (a practice run). Combine with `&start=`: `cp-hall` (Easy and Normal), `cp-mammals`, `cp-dark` (the blackout), `cp-shaft` (Easy only), `cp-upper` (Easy and Normal), `cp-atrium`, `cp-lockdown`, `cp-lab` (Easy and Normal), `cp-frog` (KING CROAK) |
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
| Omnitrix dial | Q / E, or 1-5 to pick an alien directly | Swipe sideways on the Omnitrix button; hold it for the radial dial, slide onto an alien and let go |
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

On-screen controls show only on touch devices (Settings → TOUCH CONTROLS: AUTO / ON / OFF). In AUTO, pressing a key hides them and touching the screen brings them back.

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
- **Chapter 3 is tuned by scripted playtests, not people.** KING CROAK's health (150) and hide (45% from plain hits), LOCKDOWN's timing on Hard (12 s transformations, 15 s cooldowns) and how dark the blackout is are the first things to check with real players. Numbers are in `config/frog.ts`, `config/mutants.ts`, `config/chapter3.ts` and `config/aliens/`.
- **KING CROAK on Hard is the first thing to check with real players.** Human Ben's 15 s between transformations against the frog, at 1.5x damage, is where scripted damage-on runs failed (Normal passes cleanly). Levers: `FROG.tongue.damage`, `FROG.idleMs`, and Hard's cooldown and damage in `config/difficulty.ts`.
- **KING CROAK's health (150)** may be low for players who keep Heatblast's fire on it from range: the damage-on Normal run beat it in under a minute. `FROG.maxHp` and `FROG.hideMultiplier`.
- **Stinkfly's flight and Wildmutt's climbing need a human feel pass** (headless runs at about a third of real speed).
- **Lurkers are nearly invisible** to aliens without senses until they're slimed, hit or about to spit (their throat glows first). Fair by design, but worth watching in playtests.
- **The Act 1 ending is procedural pixel art** like everything else; Kevin's look is a placeholder until real art.
- **Saves live in one browser:** no cloud sync or export yet (see IDEAS.md).
- **Training options reset** when the game is reloaded (they aren't saved).

## How to test the latest chapter

**Milestone 4, part 2: Chapter 3, desktop** (`npm run dev`)

1. **Get there:** a file that has cleared Chapter 2, Chapter Select > DR. ANIMO (the museum diorama) > PLAY. Sections on their own: `?level=ch3&start=<checkpoint>` (see the URL switches).
2. **Opening:** the RV outside the museum, Max, Gwen and Ben talking, the guard running out of the glowing door with rats behind him. Any key skips; it doesn't replay on a retry.
3. **Steps and Great Hall:** Heatblast's rocket jump to the roof card. Walk in: Animo rises over the T-rex, his speech (try arriving as an alien: he wants the watch), the zap, the bat carrying him off. Die and retry: no speech, the mutants still come. Rats crouch before they leap; the ceiling roach drops when you pass under (grit falls first).
4. **Glass and the egg card:** from the gallery over the glass, Four Arms' meteor drop breaks it (a plain slam or fire doesn't).
5. **Hall of Mammals:** the brute pounds its chest, then charges: dodge so it hits the wall, then hit its back or lift it as Four Arms. Hits on its tusks glance off unless they're Four Arms'.
6. **Blackout:** the PA, the lights going out, NEW DNA, Wildmutt. The pulse shows the lurkers and the plinth door opens (HIDDEN PATH!): the card inside. Hold J for rakes, K to pounce, land on a rat for POUNCE!.
7. **The climb:** push into the tall wall to climb (Jump leaps off). At the top, the wall that smells wrong opens.
8. **Atrium:** walk onto the bridge: Animo's taunt, the floor goes, NEW DNA mid-fall, Stinkfly hanging over the tar. Press Jump to fly; hold to climb, let go to hover, watch the wing bar. Perch to perch, the card on the whale's ribs, the bats (two quick globs ground one). Fall into the tar: you're put back on the bridge stub.
9. **LOCKDOWN:** vines (Heatblast), the moat under the low ceiling (XLR8 at full speed), the cracked wall (Four Arms), the dead end (Wildmutt climbs and sniffs the vent open), the vat pit (Stinkfly). Try swapping with T on the run. In the vent: Grey Matter's and Ripjaws' silhouettes.
10. **Stink combo:** as Stinkfly, K drops a cloud next to some mutants; swap to Heatblast and shoot it: FOOMP! or KA-BOOM!.
11. **KING CROAK:** Animo's intro, then the frog. Tells: the crouch and landing target (jump the shockwaves), the tongue's aim line (as Four Arms, punch the outstretched tongue: YANK!, and it lands face-first), the swelling throat (fireball it: POP!), the belly flop's target that follows you, then locks. Slime its feet four times quickly: GUMMED DOWN!. Pounce on its head: ANIMO HIT!. At 60% it grows and Animo zaps up mutants. Defeat: CROAKED!, it shrinks to a normal frog, RIBBIT?.
12. **Results and Act 1 ending (first clear only):** MUTANTS DEFEATED, then CONTINUE: MEANWHILE..., the arcade, Kevin's lines, the cabinets dying, KEVIN 11 / ACT 2: RIVALS AND HUNTERS, then ACT 1 COMPLETE with the five aliens and every chapter's best. CONTINUE goes to Chapter Select.
13. **Difficulty:** Hard keeps NIGHT GALLERY, ATRIUM, LOCKDOWN and KING CROAK (and HALL OF MAMMALS) checkpoints only; transformations are 12 s, so LOCKDOWN needs quick swaps or a wait at a safe spot.
14. **Secrets elsewhere:** Chapter Select flags ROAD TRIP and CAMP CRASH with SECRET WAITING!. Road Trip: fly up to the pole sign card as Stinkfly. Camp Crash: near the cliff, Wildmutt sniffs out a hatch in the forest floor ("SOMETHING SMELLS FUNNY UNDER HERE...") with a fifth card.
15. **Number keys:** 1-5 pick an alien directly (the dial jumps there); T transforms or swaps.

**Approved extras (Milestone 4, part 2)**

1. **Achievements:** transform for the first time on a new file: IT'S HERO TIME slides in under the dial. Bowl three drones over with one Four Arms throw: STEE-RIKE!. Beat a boss without a scratch: UNTOUCHABLE. Title > EXTRAS > ACHIEVEMENTS shows them all with progress bars (PYROMANIAC counts fire KOs across runs).
2. **Card album:** EXTRAS > CARD ALBUM. Arrows (or taps) over the cards: found ones show the wrestler, name, number and flavour text; holo cards shimmer; missing ones say where they hide and which alien they need ("WILDMUTT CAN REACH IT NOW!" once he's on the dial).
3. **JOKES FOUND:** Training, pause > MISFIRES: CHAOS, transform a few times; then EXTRAS > JOKES FOUND lists the lines you heard under the alien you got.
4. **Splits review:** finish any chapter from the start (a timed run): [S] SPLITS (or the SPLITS button) lists every split with its delta and segment; on a second run, best-ever segments get gold stars and SUM OF BEST appears.
5. **Ghost:** finish a chapter from the start, then PLAY AGAIN on the same file and difficulty: a see-through blue Ben marked BEST runs the old route on the same clock and fades where it finished. Settings > GHOST: OFF hides it.
6. **Omnitrix Master:** S rank a chapter on Easy, Normal and Hard (or seed a save): its Chapter Select card turns gold, the results stamp OMNITRIX MASTER! (with a fanfare the first time) and the share text mentions it.

**Milestone 4, part 2, phone**

1. **Radial dial:** hold the Omnitrix button: the arc of alien faces fans out up and to the left. Slide onto one (it grows and its name shows) and let go: Ben transforms or swaps into it. Let go in the middle to cancel. A quick swipe still turns the dial one step.
2. Wildmutt on touch: hold the stick into a wall to climb, JUMP to leap off, SPECIAL to pounce (stick up: high). Stinkfly: JUMP in the air to fly, hold to climb.
3. The blackout and the atrium on a phone: the dialogue box stays at the top, the wing bar is readable, the boss bar and the frog's tells stay above the thumbs.
4. The ACT 1 COMPLETE screen and the Kevin scene on a wide phone: nothing cut off, TAP TO CONTINUE works.
