# Progress

Short on purpose. Decisions that still apply: [DECISIONS.md](DECISIONS.md). Each finished milestone's full record (what was built, playtest notes, how it was tested): [history/](history/). Performance budget and measurements: [PERFORMANCE.md](PERFORMANCE.md).

## Status

**Act 2 has begun: Milestone 4, part 3 built Chapter 4, Kevin 11.** Four story chapters (Camp Crash, Road Trip, Dr. Animo, Kevin 11), six aliens (Heatblast, XLR8, Four Arms, Wildmutt, Stinkfly, Upgrade), four bosses (the Hunter-Killer drone, ROADBREAKER, KING CROAK, KEVIN 11), the Act 1 ending, Omnitrix Training, achievements, the card album, JOKES FOUND, splits, ghosts and Omnitrix Master. The Act 2 plan (Chapters 4 to 6) is in [GAME_DESIGN.md](GAME_DESIGN.md); Chapter 4 is described in full in [history/milestone-4-part-3-chapter-4.md](history/milestone-4-part-3-chapter-4.md).

**This session: a quality pass, no new content.** An on-device benchmark (`?autobench=1`) that plays every heavy scene on the phone with bisect switches and ends on a report to copy, and a bug hunt across Chapters 1 to 4 with permanent tooling (`npm run qa`: screenshots and text checks at three screen sizes plus fuzz runs at every checkpoint; a string lint and fit tests in `npm test`). 35 bugs found, 34 fixed and one minor deferred (two critical: quitting during the misfire gag froze the game, and the first arcade cabinet Upgrade used froze the GAME ZONE for good), two design questions open: all in [BUGS.md](BUGS.md), the record in [history/quality-pass-after-chapter-4.md](history/quality-pass-after-chapter-4.md). The phone fix (vertex uploads re-specify their buffer) took every scene the autobench plays on the owner's phone to 60 FPS with 1% lows of 52 to 58 at Q0, the GAME ZONE included once its cabinet bug was fixed. `npm run typecheck`, `npm run build` and `npm test` pass; `npm run bench` shows no regression but misses its CPU limits on this session's slower machine, as the build before the pass does too (`docs/PERFORMANCE.md`).

**Before that (Chapter 4):** Upgrade and the machine framework, Kevin from buddy to rival, the KEVIN 11 boss, SUMO SLAMMERS, three music tracks, Chapter 4's city art and robots, and one Upgrade secret in each Act 1 chapter.

Next, when asked: Chapter 5 (Bounty Hunters) or Chapter 6 (Magic), both planned in GAME_DESIGN.md. Still deferred: Training trials, more Chapter 1 revisits, Chapter 1 Hard Remix, perfect-transform boss counterplay, the no-transform badge.

## How to run

```
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run typecheck
npm test
npm run bench      # performance benchmark against the budget (docs/PERFORMANCE.md)
npm run qa         # screenshot sweep and text checks at 3 screen sizes (add -- --fuzz for random play at every checkpoint and every boss fight)
```

URL switches for playtesting:

| Switch | Effect |
|---|---|
| `?start=cp-cliff` | Start at a checkpoint (`cp-cliff`, `cp-nest`, `cp-arena`; `cp-ravine`). A practice run on the last-played file (cards and clears count, best times and splits don't); without a file nothing is saved |
| `?level=ch2` | Play Chapter 2 directly (a practice run). Combine with `&start=`: `cp-canyon`, `cp-river`, `cp-island` (Easy only), `cp-farbank`, `cp-convoy` (straight onto the RV roof), `cp-truckstop`, `cp-arena` (ROADBREAKER) |
| `?level=ch3` | Play Chapter 3 directly (a practice run). Combine with `&start=`: `cp-hall` (Easy and Normal), `cp-mammals`, `cp-dark` (the blackout), `cp-shaft` (Easy only), `cp-upper` (Easy and Normal), `cp-atrium`, `cp-lockdown`, `cp-lab` (Easy and Normal), `cp-frog` (KING CROAK) |
| `?level=ch4` | Play Chapter 4 directly (a practice run). Combine with `&start=`: `cp-arcade` (Easy and Normal), `cp-lair`, `cp-highscore` (Easy and Normal), `cp-station` (Easy and Normal), `cp-line`, `cp-turn`, `cp-depot` (Easy and Normal), `cp-kevin` (KEVIN 11) |
| `?training=1` | Straight into Omnitrix Training (with the last file's aliens and difficulty) |
| `?aliens=fourarms,xlr8` | Adds aliens to the Chapter 1 dial (a practice run). With Four Arms the vault card spawns and counts |
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

On-screen controls show only on touch devices (Settings → TOUCH CONTROLS: AUTO / ON / OFF). In AUTO, pressing a key hides them and touching the screen brings them back.

## Known issues and limitations

- **Not tuned by hand.** Difficulty was tuned by reasoning, scripted playtests and a reachability test, not by human players. Boss HP (120), drone counts and the jammer ravine may need tuning after real playtests. All numbers are in `src/config/`.
- **Touch controls are untested on real hardware.** They were tested with emulated phones and multi-touch in headless Chromium. Button sizes and positions live in `config/touch.ts`.
- **Measured on one phone.** Every heavy scene runs at 60 FPS and Q0 on the owner's Android phone (Mali-G78, 60 Hz); other GPUs (Adreno, PowerVR, iOS) and 90/120 Hz screens haven't been measured. `?autobench=1` on any phone gives the same report.
- **A blocked punch thunks a few times** (BUGS.md T12, deferred).
- **Boot generates all art in code:** about 3 s from a cold start to the title screen at 4x CPU throttle, about 1.3 s of it a single frozen frame on the loading bar. It grows a little with every chapter's art; options are in `docs/PERFORMANCE.md`.
- **iOS Safari can't go fullscreen** or lock orientation from a web page; the game still fits the screen with the browser bars visible. Adding it to the home screen (web manifest) gives a fullscreen landscape launch.
- **Phones wider than 21.6:9 still get thin side bars** (the view stops growing at 864 px wide so level design stays readable).
- **Practice runs still show a rank** on Chapter Complete (it isn't saved). Waiting on the owner's call (BUGS.md D2).
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
- **Lurkers are nearly invisible** to aliens without senses until they're slimed, hit or about to spit (their throat glows first). Fair by design, but worth watching in playtests.
- **The Act 1 ending is procedural pixel art** like everything else; Kevin's look is a placeholder until real art.
- **Saves live in one browser:** no cloud sync or export yet (see IDEAS.md).
- **Training options reset** when the game is reloaded (they aren't saved).

## How to test the latest chapter

**Milestone 4, part 3: Chapter 4, desktop** (`npm run dev`). Chapter 3's steps are in [history/milestone-4-part-2-chapter-3.md](history/milestone-4-part-2-chapter-3.md).

1. **Get there:** a file that has cleared Chapter 3, Chapter Select: the ACT 2 header and KEVIN 11 (the arcade at dusk) > PLAY. Sections on their own: `?level=ch4&start=<checkpoint>` (see the URL switches).
2. **Cold open:** the Rustbucket smoking on Main Street, CHAPTER 4 banner, the family talking; any key skips, it doesn't replay on a retry. Rooftop sign card: Heatblast's rocket jump or Stinkfly.
3. **Meet Kevin:** walk into the GAME ZONE. The ??? portrait turns into KEVIN, he drinks the cabinet next to him dry (its screen dies), throws the bolt, then juices the breaker: FREE GAMES FOR EVERYBODY, and the TOKEN TOONS climb off the band stage. Die and retry: no talking, the band still wakes.
4. **Kevin as a buddy:** he follows you (hops where you jumped, catches up if you leave him behind), throws purple bolts at enemies, cheers the first time he sees each alien, chats when it's quiet. Mascots: cymbals up with flashing eyes, then a smash and shockwaves (jump them).
5. **LASER LAIR:** LOCKDOWN!, the turrets wake, get behind cover; NEW DNA, Upgrade's glitch slam. K flows into a turret (green outline and a [K] badge show what's in reach): aim with up/down, J fires, K ejects. Kevin outside the glass: "YOU CAN BECOME... A MACHINE?". The dead lift to the catwalk card, the shutter out (K into its keypad).
6. **Takeovers and cabinets:** K into a mascot or a track-bot: it shakes green, then blows up (TAKEOVER!). K into an arcade cabinet: GAME OVER! blasts what's in front (one per cabinet).
7. **SUMO SLAMMERS:** Kevin's dare; K into the cabinet: mash J, and when KEV raises his arms (the "!") press K to sidestep. Three rounds. Win: NEW HIGH SCORE, the card pops out, Kevin sulks; lose: he gloats. Escape forfeits.
8. **Rosewood station:** trains warn (lamps, horn, headlights) then roar through the track bed; stay on the decks. Off the end of the first deck, the maintenance step leads up to the second. Kevin's drain: the lights die bank by bank, the trains stop.
9. **The cart:** K into the maintenance cart, drive right along the live rail (J honks and stuns), smash the barricade at speed. Let the watch run out mid-line: the cart brakes and you stand on it; step off into the rail and you respawn on the deck (one heart) while the empty cart rolls back to the start (BACK TO THE START).
10. **The turn:** Kevin's speech, the grab: whatever alien you are (or the one on the dial) goes dark on the dial (DNA STOLEN!; picking it says so) and Kevin becomes a purple copy of it. Hit him with a different alien right away for OUT OF SYNC. Beat him: DNA RESTORED!, he shorts the shutter and runs.
11. **The depot:** Kevin pops up ahead, taunts and flings sparks. Upgrade's lift to the grating (drop through it with Down + Jump, or walk off its end) (or fly over), the shutter, the cracked wall (Four Arms' card), the security laser and the sealed room (later aliens' silhouettes).
12. **KEVIN 11:** his intro, then watch the copy meter on the boss bar fill as you lean on one alien. Tells: the hand charging (bolts), the crouch and dashed line (the absorb lunge: getting caught as an alien costs time and levels his copy), the scan beam locking on (he copies whatever you are when it ends). Phase 2: the coils' striped bands then arcs; as Upgrade, K into a coil for OVERLOAD!. Phase 3: the hybrid wears a piece of each alien he copied; UNSTABLE! every three attacks. Defeat: POWERED DOWN!, the train escape, the family's last word.
13. **Achievements:** NEW HIGH SCORE (SUMO), HOSTILE TAKEOVER (15 takeovers), NOTHING TO COPY (beat him before any copy reaches III: keep switching).
14. **Older secrets with Upgrade:** Chapter Select flags the Act 1 chapters SECRET WAITING!. Camp Crash: a Vilgax supply hatch in the ground just before the crash site (flow over it with K and drop in). Road Trip: the service shed left of where the RV drops you at the truck stop. Dr. Animo: the guard room's shutter in the security wing, right of the Four Arms wall.
15. **Difficulty:** Hard keeps LASER LAIR, MAINTENANCE LINE, THE TURN and KEVIN 11 only; Upgrade's 12 s is enough to get out of the lair, and the watch recharges at the turn.

**Phone (emulated wide phone or real):** the radial dial now has six faces; Upgrade's touch buttons (eye beam, merge); SUMO SLAMMERS with the right half to push and the left to sidestep; the copy meter readable on the boss bar above the thumbs; the dialogue box clear of the controls.
