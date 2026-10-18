# Progress

Short on purpose. Decisions that still apply: [DECISIONS.md](DECISIONS.md). Each finished milestone's full record (what was built, playtest notes, how it was tested): [history/](history/). Performance budget and measurements: [PERFORMANCE.md](PERFORMANCE.md).

## Status

**Milestone 4 part 5 and Milestone 5 built Chapter 6, Magic, set in Karachi, and closed Act 2.** Six story chapters (Camp Crash, Road Trip, Dr. Animo, Kevin 11, Bounty Hunters, Magic), nine aliens (Grey Matter joins), six bosses (HEX AND CHARMCASTER is new), Gwen as a companion with three spells, Max in the field, the Act 1 and Act 2 endings, Omnitrix Training, ALIEN FILES, achievements, the card album (45 cards), JOKES FOUND and Ghostfreak's diary. The full record is [history/milestone-5-chapter-6.md](history/milestone-5-chapter-6.md).

**This session:** the approved fixes (chapter cards before the first line, THE HUNTERS resumes at the stage you died in, Ghostfreak's diary in EXTRAS), each chapter's code in its own chunk (boot 28% faster on Slow 4G), then Chapter 6: the Sea View fair, the pink palace, the library, the cellars and Charmcaster's cage, the tunnel to Kharadar, the Spell Engine (Grey Matter's puzzle), **THE TOWER WRAP** (a climb around a turning 3D clock tower) and HEX AND CHARMCASTER on the tower top; the Act 2 ending at Keamari harbour and ACT 2 COMPLETE with a share line. Also: Gwen in Chapters 1-5 replays (Settings, off by default), the Chapter 1 cameo, Grey Matter's secrets in Chapters 3-5, cards and first drinks that stop the game to show themselves, and **ALIEN FILES** (every move with a live bot demo, and TRY IT).

Next, when asked: Act 3 (Milestone 7 holds DEEP DIVE ATTACK). Still deferred: Training trials, Chapter 1 Hard Remix, perfect-transform boss counterplay, the no-transform badge.

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
| `?level=ch6` | Play Chapter 6 directly (a practice run). Combine with `&start=`: `cp-fair`, `cp-palace` (Easy only), `cp-hall`, `cp-library`, `cp-cellar`, `cp-cage`, `cp-tunnel`, `cp-engine` (the Spell Engine), `cp-engine-2` (its second half, Easy only), `cp-wrap` (THE TOWER WRAP), `cp-towertop` (HEX AND CHARMCASTER) |
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
| Gwen's spells (once she knows them) | G: SHIELD, Up+G: STUN, Down+G: REVEAL | The Gwen button (hold it for the spell picker) |
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
| Grey Matter | Bite (hold; every 3rd hops and chomps) | ANALYZE: marks a weak point for a few seconds; any alien hits it x3 | One tile tall: vents and gaps a tile high. Swap-in: everything nearby gets a weak point |

**THE SPELL ENGINE (Chapter 6's puzzle):** arrows or WASD move, Enter/Space/J acts; on touch, tap the pieces (the pendulum: tap anywhere). **THE TOWER WRAP:** left/right run round the tower, Jump, J swats rocklings and gargoyles.

**ALIEN FILES** (title screen): left/right pick an alien, up/down a move (the window plays it), Enter is TRY IT (Training as that alien).

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
- **Difficulty pacing is tuned by reasoning, not playtests.** Hard Chapter 1 in particular (two checkpoints, relentless drones) may need a pass. All numbers are in `config/difficulty.ts`.
- **KEVIN 11 with damage on is unproven.** The scripted player (it walks at him, punches, swaps on a timer, jumps only at incoming shots) reached Chapter Complete on every difficulty with damage off, but with damage on it lost every attempt on Normal (21 in all, at 170 and at 150 HP), usually with Kevin at a quarter to a half of his health. It never reads a tell or uses the coils on purpose, so people should do much better, but play him by hand first. Levers in `config/kevin.ts`: `KEVIN.maxHp`, `COPY_RULES` (how much a copy resists its own alien), `RELIANCE` (how fast copies level up), `COPY_MOVES.fire`.
- **THE HUNTERS with damage on is unproven.** The scripted player cleared the chapter on every difficulty with damage off, but with damage on (Normal) it didn't beat the boss in 12 attempts: Kraab fell in 9 of them once it kept its distance, then 7 attempts ended up the shaft to Sixsix's salvos (one every 2.6-3.4 s, 950 ms tell) and 2 at Tetrax. It never jumps over Kraab or watches the missiles come in, so people should do much better, but play it by hand first. Levers: `SIXSIX.boss.salvoEveryMs` and `salvo` in `config/hunters.ts`, `MISSILE.damage` in `config/bounty.ts`. Resuming at the stage you died in is a proposal in IDEAS.md.
- **Ghostfreak's whispers and hesitation** (a 40% chance at timeout to hold on 0.9-1.9 s) are by design; if the hesitation reads as a bug to players, `GHOSTFREAK.hesitate` in `config/aliens/ghostfreak.ts`.
- **Saves live in one browser:** no cloud sync or export yet (see IDEAS.md).
- **Training options reset** when the game is reloaded (they aren't saved).
- **Each chapter's own tuning notes** (what to check first with real players, and where its numbers live) are in its history file: [Chapter 2](history/milestone-4-part-1-chapter-2.md), [3](history/milestone-4-part-2-chapter-3.md), [4](history/milestone-4-part-3-chapter-4.md), [5](history/milestone-4-part-4-chapter-5.md), [6](history/milestone-5-chapter-6.md).
- **Chapter 6 is tuned by scripted playtests, not people.** HEX AND CHARMCASTER's health (120) and phase thresholds, the gargoyles' dive, the golem's slam and the tower's foes are the first things to check. Numbers: `config/hexBoss.ts`, `config/magic.ts`, `config/tower.ts`, `config/gwen.ts`.
- **THE TOWER WRAP and the Spell Engine need a human feel pass** (headless runs at about a third of real speed): the climb's run and jump, the gusts, and the pendulum's windows on a phone (`config/tower.ts`, `PENDULUM` in `scenes/engine/rules.ts`).
- **The romanised Urdu was written carefully but not checked by a native speaker;** every word and its gloss is in `config/urdu.ts`.
- **ALIEN FILES' demos are scripted inputs**, so a demo can look clumsy after an alien is retuned (`config/alienFiles.ts`); the window shows the real game.
- **Cards and first drinks pause the game** to show themselves (once per card per file). Settings: NEW FINDS: QUICK turns that into a banner (for speedruns; the benchmarks run with it).

## How to test the latest chapter

**Chapter 6, desktop** (`npm run dev`). Chapter 5's steps are in [history/milestone-4-part-4-chapter-5.md](history/milestone-4-part-4-chapter-5.md).

1. **Get there:** a file that has cleared Chapter 5, Chapter Select: MAGIC > PLAY. Sections on their own: `?level=ch6&start=<checkpoint>` (see the URL switches).
2. **Cold open:** the crane at Karachi Port, the fair, Rauf's chai, THE GREAT HEXO, Charmcaster's snatch, the Charm rolling to Gwen. Any key skips; a retry doesn't replay it.
3. **The fair:** kites (fire cuts their strings), rocklings, talk to Rauf, Zain (try Heatblast and Four Arms near him) and Rafiq; the first chai stops the game to say what it does; the camel card stops it to flip over (POWER, WEIGHT, SPEED).
4. **The gate and the hall:** the Rustbucket rams the gate; enchanted armour (get behind it or smash it); SHIELD comes out of Gwen: press G.
5. **The library:** gargoyles wake and dive (Up+G: STUN); the chandelier and shelf cards.
6. **The cellars:** Down+G: REVEAL, the hidden door, the floor that isn't there and the bridge that is; the cage: NEW DNA, Grey Matter between the bars.
7. **The tunnel:** the golem (K as Grey Matter on it, then T to Four Arms: x3), Max and the extinguisher, the vent card (Grey Matter, from the rubble under the roof vent).
8. **The Spell Engine:** at the grille, as Grey Matter: pipes, gears (try a dead-end slot first), the pendulum. Wait 25 s on a stage for its hint.
9. **THE TOWER WRAP:** run right and jump the risers; watch the tower turn and the skyline wheel past; let a gust push you; miss a gap on purpose (the catch ledge).
10. **HEX AND CHARMCASTER:** STUN her summon; ANALYZE Hex to see the next Charm; in phase 3, REVEAL the real Hex and hit Charmcaster to drop the wards.
11. **The end of Act 2** (first clear): the harbour, the base under the sea, THE PLUMBERS, ACT 2 COMPLETE ([C] or SHARE YOUR SUMMER).
12. **ALIEN FILES** from the title: pick Grey Matter, step through his moves, TRY IT.
13. **Older chapters:** Chapter 1's camp (Gwen and Max) and its ending line; Grey Matter's cards: Chapter 3's vent nook (Wildmutt opens the wing's hidden vent, then swap), Chapter 4's claw machine, Chapter 5's mouse hole in the saloon's stoop. Settings: GWEN IN CHAPTERS 1-5.
14. **Difficulty:** Hard keeps THE CAGE, SPELL ENGINE, THE TOWER WRAP and the tower top only; Easy adds PALACE GATE and the Engine's second half.

**Phone (emulated wide phone or real):** the Gwen button (hold for the spell picker), the Spell Engine by taps (the pendulum: tap anywhere), the tower climb with the stick, the card reveal closed with a tap, ACT 2 COMPLETE's share sheet. `?autobench=1` now plays THE TOWER WRAP too.
