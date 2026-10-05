# Milestone 4, part 3: Act 2 opens with Chapter 4, Kevin 11

_The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`. The Act 2 plan (Chapters 4 to 6, with the owner's rules for the act) is in `docs/GAME_DESIGN.md`._

## The chapter, start to finish

One evening in a run-down downtown: Main Street, the GAME ZONE arcade from the Act 1 ending, its LASER LAIR, the abandoned subway LINE 11 and the power substation it feeds. `levels/chapter4.ts` (424 x 40 tiles), set pieces in `scenes/level/story/kevin/`, Kevin in `entities/bosses/kevin/`, machines in `entities/tech/`, tuning in `config/kevin.ts`, `config/tech.ts`, `config/robots.ts`, `config/sumo.ts` and `config/aliens/upgrade.ts`.

1. **Cold open (skippable, never replayed on a retry or a continue):** straight out of the Act 1 cliffhanger. The Rustbucket is broken down on Main Street at dusk, hood smoking ("ROADBREAKER FRIED THE ALTERNATOR. I'LL HAVE HER PURRING BY MORNING. ...PROBABLY."), Gwen is bored, Ben spots the GAME ZONE ("THE NEWS SAID ITS MACHINES KEEP DYING FOR NO REASON. BEN. DON'T GO LOOKING FOR TROUBLE." / "IT'S AN ARCADE, GWEN. WHAT'S THE WORST THAT COULD HAPPEN?"). A card on a rooftop sign (flight or a rocket jump).
2. **Meeting Kevin.** A kid at a cabinet with every high score in the place ("YOU'RE STANDING IN MY LIGHT."), the Act 1 ending's shadowy portrait until he gives his name, then his grin. He knows Ben from the news, drinks a cabinet dry and throws the power as a bolt ("RELAX. I'M A FREAK TOO."), then dumps it all into the breaker: free games for everyone, and the TOKEN TOONS animatronic band wakes up wrong. On a retry: no talking, the band still wakes.
3. **Kevin, buddy.** He tags along through the arcade and the subway: follows Ben's trail (hopping where Ben jumped), throws bolts at whatever Ben is fighting, loses it the first time he sees each alien ("THE FIRE GUY! DO THE FIRE GUY AGAIN!", "FOUR ARMS?! YOU COULD BENCH A BUS!", "A GIANT BUG! ...IT SMELLS LIKE MY GYM BAG."), and chats ("MOST KIDS RUN WHEN THEY SEE WHAT I CAN DO.", "BET THAT WATCH COULD DO ANYTHING, HUH?"). The player should like him. Claw machine (Grey Matter's card), the band stage (Wildmutt's hidden door card), prize counter, skee-ball.
4. **LASER LAIR: Upgrade.** Kevin's surge overloads the laser tag arena: the entrance seals behind Ben (LOCKDOWN!), the tag turrets wake firing real lasers, and with Ben pinned behind cover the watch finds new DNA. Upgrade pours into a turret and turns it on the others; Kevin, stuck outside the glass, goes quiet: "YOU CAN BECOME... A MACHINE?" A dead lift up to a catwalk card; out through a security shutter only Upgrade opens. Kevin catches up: "HOW DOES IT FEEL? WHAT DOES IT TASTE LIKE?"
5. **HIGH SCORE ALLEY.** The SUMO SLAMMERS dare ("MY HIGH SCORE. NOBODY HAS EVER BEATEN IT. NOBODY."), the mini-game (below), GAME OVER cabinets to blast a toon ambush with, stairs down. Win and Kevin's smile slips ("...YOU CHEATED. WITH THE WATCH."); lose and he gloats ("HA! STILL THE KING."). Either way: "I KNOW A PLACE WITH WAY MORE JUICE."
6. **Rosewood Station, LINE 11.** Platforms over the live track bed, track-bots, a transit turret, trains roaring through (lamps flash, horn, headlights first; the platform is safe). Kevin drinks the third rail: the trains stop, the station's lights die bank by bank, and he gets greedier ("WITH YOUR WATCH, WE COULD RUN THIS WHOLE TOWN." / "THAT'S NOT WHAT IT'S FOR." / "...SAYS WHO?"), then runs ahead into the dark.
7. **The maintenance line.** Upgrade drives a cart along the live rail through track-bots and rams the barricade at the end.
8. **The turn (set piece).** In the substation Kevin asks for the watch ("PEOPLE NEVER DID ANYTHING FOR ME.") and takes what he can: he grabs Ben and absorbs whatever alien Ben is (a human Ben's watch goes off in the surge). Ben reverts, that alien's slot on the dial goes dark (DNA STOLEN), and Kevin becomes a twisted purple copy of it. The watch recharges so there's always something to switch to, and the first hit from a different alien right after he copies is OUT OF SYNC. Beat the copy: the DNA blows back into the watch (DNA RESTORED!), and Kevin, overloaded, shorts out the shutter and flees ("I'VE GOT A TASTE NOW, TENNYSON. AND I WANT MORE.").
9. **The power depot.** Kevin stays a step ahead (crackling into view, taunting, flinging sparks), overcharged track-bots, a lift and a grating, a cracked wall (Four Arms' card), the security laser (Diamondhead's card) and a sealed room with no door (Ghostfreak's card).
10. **KEVIN 11** (below), then the escape on a passing train ("THIS ISN'T OVER, TENNYSON! NEXT TIME I'M TAKING ALL OF IT!"), and Gwen and Max: "SO. MAKE A NEW FRIEND?" / "WORST. PLAYDATE. EVER." / "SOME PEOPLE SEE POWER AND ONLY WANT MORE OF IT. REMEMBER THAT, BEN." / "HE'LL BE BACK. ...HE'S GOT MY HIGH SCORES TO BEAT."

Checkpoints: GAME ZONE, HIGH SCORE, ROSEWOOD STATION and POWER DEPOT (Easy and Normal); LASER LAIR, MAINTENANCE LINE, THE TURN and KEVIN 11 on every difficulty (one per set piece). Par time 9:00.

The city gets its own look: a dusk sky with two skyline layers, storefronts, neon, the GAME ZONE facade, arcade/lair/subway/tunnel/substation interior walls lined up with each room's floor, 30 new kinds of set dressing, its own ambient light per room, and three music tracks: `arcade` (bouncy C major), `subway` (driving F# minor) and `kevin` (a twitchy E minor boss theme).

## Upgrade

Data-driven like every alien (`src/aliens/upgrade/`, `config/aliens/upgrade.ts`, one registry line). Black liquid metal with green circuit traces and one round eye.

- **J: eye laser.** An instant beam that stops at walls (Up aims high, Down in the air aims low; hold to keep firing; every fourth is a triple). Machines take x1.5.
- **K: MERGE.** He melts into a fast puddle (untouchable while flowing). Into a machine: he possesses it. Into a machine enemy: TAKEOVER (it shakes with green circuitry, then blows up and hits everything around it). Into nothing: he pops back up.
- **Swap-in:** a splash of nanites that shorts out machines nearby.
- **Possession** (the alien timer keeps running; K ejects): turrets (aim and fire), arcade cabinets (GAME OVER: a blast of pixels), the SUMO SLAMMERS cabinet (the mini-game), security shutters (they roll up for good), lifts (ride up), carts (drive along the rail, ram enemies and barricades), tesla coils (discharge into Kevin).
- **Discovery:** forced in the LASER LAIR (never a misfire), the NEW DNA DETECTED card, a glitch-boot title slam (a CRT line powering on, RGB ghosts, glitch blocks), a digital sound set and a chiptune-arpeggio music layer. NANITES shield bar.
- Misfire lines for every pair with the five older aliens, both ways.
- **Older secrets:** a dead Vilgax supply hatch by Chapter 1's crash site, the truck stop's old service shed in Chapter 2, the security wing's guard room in Chapter 3. Each has a holo card, a silhouette hint for files without Upgrade, and shows SECRET WAITING! once he's on the file.

## Robots and machines

| Enemy | Behaviour | Best answer |
|---|---|---|
| **TOKEN TOON** | Lumbering animatronic: raises its cymbals with flashing eyes (the tell), then smashes the floor (a shockwave each way). Guards its stretch of the arcade: it won't follow Ben more than 8 tiles from where it woke | Anyone; Upgrade takes it over |
| **Laser turret** | A laser sight sweeps onto Ben and locks (the tell), then a three-shot burst; rests follow difficulty | Upgrade merges in and uses it; anyone can wreck it |
| **Track-bot** | Revs its grinder in a shower of sparks with a dashed charge line (the tell), then charges; a miss leaves it skidding, back open (x1.5) | Jump it and hit its back; Upgrade takes it over |
| **Overcharged track-bot** | Kevin's: faster, tougher, crackling purple | The same, quicker |
| **Spark** | Kevin's spare power: drifts closer, flashes a ring, then zaps | Anything; from range |
| **Trains** | Warn (lamps, horn, headlights), then pass at speed along the track bed | Stay on the platforms |

## KEVIN 11 (boss)

He copies the aliens Ben uses; the more Ben relies on one, the stronger Kevin's copy of it gets, so switching often is the counterplay.

- **Reliance** per alien: damage dealt to Kevin plus time spent as it, decaying while Ben uses anything else. It sets the copy level (I, II, III). A **copy meter** on the boss bar shows every alien Kevin has data on, its level in pips (red at III) and a box around the one he's copying now.
- **Phase 1, COPYCAT (100-60%).** Bolt volleys; the **absorb lunge** (a crouch, a crackling hand and a dashed line along his path, then the dive: catching Ben as an alien drains 4 s of alien time and levels up that copy on the spot, ABSORBED!); the **scan** (a beam locks onto Ben for most of a second, then he becomes a purple copy of whatever Ben is at the end of it: switching during the scan picks what he copies). A copy uses that alien's moves for a few attacks: fire volleys (III adds a fire pillar), leap slams with purple shockwaves, telegraphed dashes, pounces on a marked spot, hovering slime rains, floor-skimming eye beams.
- **Damage rules:** the copied alien does 60/40/20% to its own copy (PERFECT COPY at III); any other alien does full damage, and its first hit within 2.6 s of a copy is OUT OF SYNC (x1.75 and a stagger). Human Ben's punches do normal damage.
- **Phase 2, OVERCHARGE (60-25%).** He drains the tesla coils: a full-height striped danger band, then the arc. Upgrade can merge into a coil: it charges and discharges straight into Kevin (OVERLOAD!, big damage and a stun). He now switches between the copies of Ben's two most-used aliens himself.
- **Phase 3, KEVIN 11 (25-0%).** He swallows every copy at once: the hulking hybrid wearing a piece of each alien he copied (a crown of flame, a second pair of red arms, XLR8's visor and tail, a mane, bug wings, Upgrade's eye on his chest). He uses each copied alien's moves at its level and resists each by how well he copied it (the ones he barely copied hurt most). Every three attacks he overloads (UNSTABLE!): open and taking x1.5.
- **Defeat:** POWERED DOWN!, every stolen volt blows out of him, he shouts his line and leaps onto a freight train passing behind the hall's grating.
- Any alien can still win; switching is just much faster. Tells are the same length on every difficulty; rests and punish windows follow the difficulty.
- **Breathers:** each phase change knocks a smoothie loose on the far side of the hall, and while he's staggered (OUT OF SYNC, OVERLOAD!, UNSTABLE!) touching him doesn't hurt.

## SUMO SLAMMERS

Upgrade merges into the cabinet and the level freezes under a CRT: three rounds against KEV's sumo. Mash ATTACK to push; when KEV raises his arms (a blinking "!"), SPECIAL sidesteps his shove for a swing toward his edge. Mashing alone wins round 1 but not round 2: the sidestep is the skill. Taps are capped at 14 a second and held keys don't repeat. Win all three: NEW HIGH SCORE (the table changes to BEN), the holo card pops out of the cabinet, and the NEW HIGH SCORE achievement. Touch: the right half pushes, the left half sidesteps.

## Achievements

NEW HIGH SCORE (beat KEV's record), HOSTILE TAKEOVER (take over 15 machines as Upgrade), NOTHING TO COPY (beat KEVIN 11 before any copy reaches level III).

## Cards

Eight in Chapter 4, five reachable now: the rooftop sign (flight or a rocket jump), behind the band stage (Wildmutt), the LASER LAIR catwalk (Upgrade's lift, or flight), SUMO SLAMMERS (the prize), the depot's cracked wall (Four Arms). Three wait for later aliens with silhouettes and lines: inside the claw machine (Grey Matter), past the security laser (Diamondhead), the sealed room (Ghostfreak). Plus one Upgrade card in each Act 1 chapter (26-28 in the album).

## Scripted playtests and what they caught

Chapter 4 was played by a script in headless Chromium, title (or the level directly) to Chapter Complete, on desktop (1280x720) and an emulated wide phone (915x412, touch on). The script plays the intended route: Four Arms and Heatblast through the TOKEN TOONS, the LASER LAIR with Upgrade (a turret takeover, the shutter out), the station decks, the cart along the live rail, the turn (switching away from the stolen alien), the depot's lift and grating, and KEVIN 11 cycling all six aliens (Upgrade into the coils). Chapters 1-3 were re-run checkpoint by checkpoint (every checkpoint loads and plays a short brawl, then each boss is finished into its results), with Upgrade on the file.

First round (before the fixes below):

| Run | Result |
|---|---|
| Normal, wide phone, damage off | Main Street to Chapter Complete, no deaths, no errors (3:53 in practice mode) |
| Normal, desktop, damage off | Stuck under the band stage as human Ben (the script's jumps were too short at headless speed), then, after a script fix, **died on the maintenance line**: the cart bug below |
| Easy, desktop and wide phone; Hard, wide phone | The script skipped the turn fight (it looked the set piece up by a class name the release build minifies) and, wandering, **left the turn's sealed room through its laser wall**: the XLR8 bug below |
| Chapters 1-3, every checkpoint and each boss, desktop | All load and play with no errors; every boss falls into its results |

Final build (after every fix below):

| Run | Result |
|---|---|
| Normal, desktop, title > Chapter Select > the chapter, damage off | Chapter Complete in 3:36, S rank, no deaths, no errors; the new ROBOTS WRECKED line on the results |
| Easy, desktop; Hard, desktop | Chapter Complete, no deaths, no errors |
| Easy, Normal and Hard, wide phone | Chapter Complete each, no deaths, no errors; the defeat speech's skip hint sits under the dialogue box, clear of JUMP |
| Normal, desktop, **damage ON** | Through the station without dying (12 damage, after the toon leash); died once on the depot grating (an overcharged track-bot, the depot turret and Kevin's sparks); then KEVIN 11 (see below) |
| KEVIN 11 alone, Normal, damage ON | At 170 HP (after the safe punish windows and phase smoothies): ten attempts with and without dodging, no wins; Kevin was left with 3 to 94 HP (the bot dealt a median of about 136). His health came down to 150. At 150: eleven more attempts, still no wins (Kevin left with 21 to 84 HP). **Open:** the scripted player can't beat KEVIN 11 with damage on; whether people can is the first thing to check by hand |
| Chapters 1-3, every checkpoint and each boss, desktop and wide phone | All load and play with no errors; every boss falls into its results |

The damage-ON bot is crude: it walks at Kevin and punches, swaps on a timer, and (in the dodging variant) only jumps or rolls when a shot is about to land. It never uses the coils on purpose and never reads a tell. Its traces showed what hurt most: Kevin's body contact while it hugged him, copy-Heatblast's fire at point-blank range and the coil arcs. KEVIN 11 is the first thing to check with real players (`KEVIN.maxHp`, `COPY_RULES`, `RELIANCE` in `config/kevin.ts`).

What the runs caught, all fixed:

- **The station's track bed led into the live rail.** Walking along the tracks under deck B ended in the maintenance line's rail, and the bot died there over and over. A wall now closes the track bed under deck B (the trains run behind the terrain and pull into it like a tunnel mouth).
- **The depot's grating ended against a wall,** so the only way down was a drop-through. It now stops short of the sealed room and walking off its end drops to the floor.
- **Upgrade timing out mid-ride could kill Ben.** Riding the cart recorded Ben's last safe ground on top of it, over the live rail; when the watch ran out, the cart coasted on, Ben fell, and every pit respawn dropped him back over the rail until his hearts ran out (god mode doesn't cover falls, so the bot died). Nothing over the rail counts as safe ground now, the cart brakes the moment Upgrade leaves it, Upgrade pops straight up out of it, and an empty cart rolls back to the start of the line.
- **XLR8 could dash through walls on slow frames,** in every chapter since 2. The bot left the turn's sealed room mid-fight; probing found XLR8's dash on a 30 fps frame also passed cracked walls, Upgrade-only shutters, boss-arena laser walls and the jammer gate. Arcade decides which side of a wall a body is on from where a step leaves it, and the dash moves 22 px per 34 ms step. Physics steps are now split so Ben never moves more than 12 px in one (only XLR8's dash and Upgrade's flow on slow frames are affected), and laser walls have thick bodies.
- **The dialogue skip hint covered the JUMP button on phones** during a boss's defeat speech (every boss). It moves under the dialogue box whenever there's no letterbox.
- **Chapter 4's results said DRONES DESTROYED.** Now ROBOTS WRECKED.
- **Three Kevin effects rolled a per-frame chance** (absorb beams and grab sparks), so 120 Hz screens drew twice as many. They use `Pacing.chance`.
- Earlier, during the build: the copies first used a tint that read pink (now palette-swapped sheets), the copy meter's pips were drawn off the bar, and the Chapter 2 and 3 Upgrade shutters sat inside rock (the reachability test caught it).

Lessons for the scripts: release builds minify class names (find set pieces by their data, not `constructor.name`); headless runs the game at a quarter to a third of real speed, so human Ben needs a jump held about a second to climb the 3-tile band stage, and the Upgrade unlock beat takes up to 20 s of wall time.

## How to test (at the time)

**Milestone 4, part 3: Chapter 4, desktop** (`npm run dev`). Chapter 3's steps are in [milestone-4-part-2-chapter-3.md](milestone-4-part-2-chapter-3.md).

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
