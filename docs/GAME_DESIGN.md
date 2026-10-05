# Ben 10: Omnitrix Summer (working title)

A 2D pixel-art side-scrolling action platformer based on the original Ben 10 series. Plays instantly in the browser on desktop and mobile.

Tech: Phaser 4 (4.2.x, WebGL, Arcade Physics), TypeScript, Vite, Vitest, deployed on Vercel. See CLAUDE.md for the stack rules.

## Design Pillars

1. **Instant fun:** player transforms within the first 10 seconds. No tutorial walls, teach through play.
2. **Every alien solves something:** each alien has combat AND traversal/puzzle uses. Levels are designed around switching.
3. **Chaos is content:** the Omnitrix misfiring (wrong alien) is a core feature, not a bug. It creates funny, clip-worthy moments.
4. **Nostalgia payoffs:** references, easter eggs and iconic moments from the show.
5. **Shareable:** clip export, daily challenges and duels are designed in from the start, even if built later.

## Core Loop

Explore level > hit obstacle or enemy > pick the right alien > transform > timer runs down > revert to human Ben > survive cooldown > repeat. Chapters end in a boss fight.

## Controls (desktop)

| Action | Key |
|---|---|
| Move | A/D or Arrow keys |
| Jump | Space / W / Up |
| Attack | J |
| Special ability | K |
| Cycle Omnitrix dial | Q / E |
| Transform | T |
| Pause | Esc |

Mobile (built early, in the Chapter 1 polish pass): a floating thumb stick on the left, Jump / Attack / Special on the right, and a transform button styled like the Omnitrix (tap to transform, swipe to turn the dial). Landscape only; portrait shows a "turn your phone" screen.

## The Omnitrix System

- Human Ben: weak melee, can jump, cannot do alien traversal.
- Dial through unlocked aliens with Q/E, press T to transform.
- **Transform timer:** alien lasts X seconds (by difficulty). Watch beeps and flashes red in the last 5 seconds.
- **Cooldown:** after timing out, Ben is human for Y seconds. Watch shows red.
- **Wrong transformation:** chance (by difficulty) that the Omnitrix gives a random different alien. Show a big comedic reaction ("Aw man, not this guy!"). Mid-transformation swaps misfire too, at half the chance, never into the alien Ben already is. Never during the tutorial transform, story intros or boss entrances. After a misfire the next swap is a cheap, guaranteed fix, or the first KO as the wrong alien earns time back.
- Transform effect: green flash, brief invulnerability, short camera zoom.
- Taking heavy damage as an alien can force an early revert.

## Alien Roster

| Alien | Combat | Traversal / Puzzle | Unlock |
|---|---|---|---|
| Heatblast | Fireballs, fire burst | Melt ice, rocket jump | Ch 1 |
| Four Arms | Heavy punch, ground slam | Lift/throw heavy objects, break walls | Ch 2 |
| XLR8 | Rapid strikes | Dash across gaps, run on water | Ch 2 |
| Wildmutt | Pounce, claw | Senses reveal hidden paths/enemies, wall climb | Ch 3 |
| Stinkfly | Slime shot (slows enemies) | Limited flight | Ch 3 |
| Upgrade | Eye laser, robot takeovers | Merge with machines: turrets, cabinets, doors, lifts, carts | Ch 4 |
| Diamondhead | Crystal shards | Reflect lasers, create crystal platforms | Ch 5 |
| Ghostfreak | Scare attack | Phase through walls, invisibility | Ch 5 (lost in Ch 9) |
| Grey Matter | Weak bite | Tiny size, crawl through vents, find weak points | Ch 6 |
| Ripjaws | Bite, tail whip | Fast underwater swimming (timer drains faster on land) | Ch 7 |
| Cannonbolt | Rolling charge | Bounce, smash barriers | Ch 8 |
| Wildvine | Seed bombs | Vine grapple | Ch 10 |
| Way Big | Cosmic ray | Finale only | Ch 12 |

## Characters

- **Ben Tennyson:** player. 10 years old, cocky, funny.
- **Gwen Tennyson:** support. Starts as commentary/hints, gains spells in Ch 6 (shield, stun, reveal). Later: optional co-op player 2.
- **Grandpa Max:** mentor, Rustbucket driver, hint giver. Revealed as a Plumber in Ch 7.
- **Kevin 11:** rival. Absorbs energy and alien powers. Recurring boss, forced ally in Ch 12, playable in post-game.

## Story: 4 Acts, 12 Chapters

### Act 1: The Summer Begins
- **Ch 1, Camp Crash:** Ben finds the Omnitrix in the woods. Vilgax's drones attack the camp. Unlock Heatblast. *Set piece: first transformation.* Boss: large drone.
- **Ch 2, Road Trip:** Rustbucket driving segment, Max intro. Unlock Four Arms, XLR8. *Set piece: chasing a runaway truck.*
- **Ch 3, Dr. Animo:** mutant animals at a museum. Unlock Wildmutt, Stinkfly. *Boss: giant mutant frog.*

### Act 2: Rivals and Hunters
- **Ch 4, Kevin 11:** meet Kevin at an arcade. Ally turns rival. Unlock Upgrade. *Set piece: Kevin absorbs your current alien and uses it against you.*
- **Ch 5, Bounty Hunters:** Sixsix, Tetrax and Kraab hunt Ben. Unlock Diamondhead, Ghostfreak. *Set piece: forced wrong transformation while cornered.*
- **Ch 6, Magic:** Hex and Charmcaster. Gwen gains spells. Unlock Grey Matter. *Set piece: Grey Matter puzzle inside a spell machine.*

### Act 3: Secrets
- **Ch 7, The Plumbers:** Max revealed as a secret alien cop. Unlock Ripjaws. *Set piece: underwater Plumber base.*
- **Ch 8, Zombozo:** haunted circus. Unlock Cannonbolt. *Set piece: funhouse mirror maze.*
- **Ch 9, Ghostfreak Out:** Ghostfreak escapes the Omnitrix. Ghostfreak is permanently removed from the dial. *Boss: fight the alien you used to be.*

### Act 4: The Omnitrix
- **Ch 10, Forever Knights:** castle infiltration, stealth sections. Unlock Wildvine.
- **Ch 11, Self-Destruct:** the Omnitrix starts a countdown that could destroy the universe. Race to find its creator, Azmuth. *Set piece: every transformation is random.*
- **Ch 12, Vilgax:** multi-phase final boss. Kevin forced into an uneasy team-up. Way Big unlocks for the last phase. *Set piece: kaiju-scale fight.*

### Post-game
- Secret Ben 10,000 future chapter
- Kevin playable in free play
- Fusion Lab and Daily Omnitrix fully unlocked

## Act 2 plan: Rivals and Hunters

Act 2 is about Ben realising he's not the only one with power. Rivals copy him, hunters chase him, and magic is something the Omnitrix can't solve alone. By the end, Gwen becomes a real fighter.

Act 1 taught the dial one alien at a time. Act 2 attacks the player's habits: Kevin punishes leaning on one alien, the hunters punish standing still and the watch itself, and magic needs Gwen as much as the watch. Each chapter ends on a hook into the next: Kevin escapes swearing revenge, Tetrax leaves a hint about Grandpa Max, and the Act 2 ending reveals Max's secret.

### Rules for all of Act 2

- Every new alien gets a discovery moment, unique sounds, colours, music layer and title slam.
- Every chapter has secrets gated by future aliens, and new aliens open older secrets ("SECRET WAITING!").
- Misfires blocked during story moments.
- Every set piece has its own checkpoint on all difficulties.
- Boss: readable tells, switching rewarded not required, multiple phases.
- Splits, medals, achievements, card album entries, ghost runs, jokes for every new alien pair, all working for new content.
- Every chapter must pass the performance budget in docs/PERFORMANCE.md (npm run bench).

### Chapter 4: Kevin 11

**Setting.** One evening in a run-down downtown: Main Street, the GAME ZONE arcade (the arcade from the Act 1 ending, half its cabinets still dead), its laser tag arena, and under the city the abandoned subway LINE 11 and the power substation it feeds. Dusk outside turning to night; neon and arcade glow inside; the subway lit by work lights and sparks. Theme `city`, music: `arcade` (bouncy chiptune), `subway` (dark, driving), `kevin` (boss).

**Story beats.**
1. **Cold open** (picks up from the Act 1 cliffhanger). The Rustbucket is parked on Main Street; ROADBREAKER fried its alternator and Max needs the night to fix it. Gwen: Ben will find trouble. Ben finds the GAME ZONE.
2. **Meet Kevin.** A lonely kid in a two-tone shirt holds every high score in the place ("KEV"). He knows Ben from the news ("THE KID WITH THE WATCH"), shows off his own trick (he touches a cabinet, drinks its power, throws it as a bolt), and Ben is thrilled: someone else like him. Kevin: "WANNA SEE SOMETHING REALLY COOL?"
3. **Chaos together.** Kevin dumps stolen power into the arcade's breaker: every game turns on at once, free credits for everyone... and the arcade's animatronic mascot band, the TOKEN TOONS, wakes up wrong. Kevin follows Ben as an AI buddy for the first half of the chapter: he fights alongside (absorbing from cabinets, throwing bolts), cheers, trash-talks, and reacts to each alien ("THE FIRE GUY! DO THE FIRE GUY AGAIN!"). The player should like him.
4. **Upgrade.** Kevin's surge overloads the LASER LAIR (the laser tag arena): the doors seal and the tag turrets start firing real lasers. Ben is pinned behind cover, every alien he picks gets lit up, and the watch finds new DNA. Upgrade flows across the floor into the nearest turret and turns it on the others. Kevin watches through the glass and goes quiet: "YOU CAN BECOME... A MACHINE?"
5. **The high score.** Kevin dares Ben to beat his SUMO SLAMMERS record. Upgrade merges into the cabinet: a short playable mini-game. Win and Kevin's smile slips ("YOU CHEATED. WITH THE WATCH."); lose and he gloats. Either way: "I KNOW A PLACE WITH WAY MORE JUICE."
6. **Line 11.** An abandoned subway line ("THEY CLOSED LINE 11 BEFORE I WAS BORN. THE THIRD RAIL'S STILL LIVE."). Kevin drains the third rail; the station goes dark bank by bank, and he gets greedier with every gulp: "WITH YOUR WATCH WE COULD RUN THIS WHOLE TOWN." / "THAT'S NOT WHAT IT'S FOR." / "...SAYS WHO?"
7. **The turn (set piece).** In the substation Kevin finally asks for the watch, and takes what he can: he grabs Ben and absorbs whatever alien Ben is (if Ben is human, Kevin's surge sets the watch off and absorbs that). Ben reverts, the stolen alien's dial slot goes dark ("DNA STOLEN"), and Kevin turns into a twisted purple copy of it and fights Ben with its powers. Beat the copy and the DNA blows back into the watch; Kevin, overloaded, flees down the tunnel: "I'VE GOT A TASTE NOW, TENNYSON."
8. **The chase down the power line.** Kevin is the enemy now: he runs ahead, drains the work lights, flings sparks and overcharges the maintenance robots.
9. **Boss: KEVIN 11** in the substation's main hall.
10. **Ending.** Kevin blows all the stolen power out, de-powered and furious, and escapes on a passing train: "THIS ISN'T OVER, TENNYSON! NEXT TIME I'M TAKING ALL OF IT!" Gwen and Max arrive. Gwen: "SO. MAKE A NEW FRIEND?" Ben: "WORST. PLAYDATE. EVER." Max: "SOME PEOPLE SEE POWER AND ONLY WANT MORE OF IT. REMEMBER THAT." Kevin stays a recurring rival (Act 3 return, the forced team-up in Chapter 12).

**Level sections** (about 425 x 40 tiles, left to right):

| Section | What happens | Checkpoint (densities) |
|---|---|---|
| Main Street (0-38) | Opening cinematic, storefronts, a card on a rooftop sign (flight or a rocket jump) | none |
| GAME ZONE (38-112) | Meet Kevin, the breaker, TOKEN TOON animatronics with Kevin as a buddy; cabinets, prize counter, skee-ball, the claw machine (Grey Matter card), the band stage (Wildmutt's hidden door card) | GAME ZONE (Easy, Normal) |
| LASER LAIR (112-162) | Sealed in, turrets go live, Upgrade's discovery, turret takeover, a dead lift to a catwalk card, a dead security shutter out | LASER LAIR (all) |
| HIGH SCORE ALLEY (162-200) | The SUMO SLAMMERS cabinet challenge (card + achievement), GAME OVER cabinets against a mascot ambush, stairs down | HIGH SCORE (Easy, Normal) |
| Rosewood Station (200-262) | Platforms over the live track bed, track-bots, transit turrets, trains roaring through (horn and headlight first), Kevin drains the third rail | ROSEWOOD STATION (Easy, Normal) |
| The maintenance line (262-300) | Upgrade drives a maintenance cart along the live rail and rams the barricade at the end | MAINTENANCE LINE (all) |
| The turn (300-334) | Kevin absorbs Ben's alien and fights with it | THE TURN (all) |
| Power depot (334-388) | Kevin hostile: sparks, overcharged track-bots, lifts and shutters, a cracked wall (Four Arms card), the security laser (Diamondhead card), the sealed room (Ghostfreak card) | POWER DEPOT (Easy, Normal) |
| Kevin 11's arena (388-424) | The substation's main hall, two tesla coils, scaffolds | KEVIN 11 (all) |

**Enemies.**

| Enemy | Behaviour | Best answer |
|---|---|---|
| TOKEN TOON mascot | Lumbering animatronic: raises its cymbals with flashing eyes (the tell), then smashes the floor (a short shockwave each way) | Anyone; Upgrade takes it over |
| Laser turret | Fixed. A laser sight sweeps onto Ben and locks (the tell), then a three-shot burst. Laser tag turrets in the arena, transit security turrets in the subway | Upgrade merges in and uses it; anyone can wreck it |
| Track-bot | Wheeled maintenance robot: revs its grinder in a shower of sparks (the tell), then charges along the floor. Overcharged by Kevin later: faster, leaves a short electric trail | Jump it and hit its back; Upgrade takes it over |
| Spark | Kevin's spare power, flung at Ben after the turn: a crackling wisp that drifts closer, flashes, then zaps | Anything; Heatblast and Upgrade from range |
| Kevin's copies | The turn and the boss | Switch aliens |

Upgrade's takeover makes every machine enemy (mascots, turrets, track-bots, and Vilgax's drones in older chapters) a bomb: merge in, it shakes with green circuitry, then blows up and hits everything around it.

**Alien unlock: Upgrade** ("LIVING TECH. MACHINES ARE HIS PLAYGROUND."). Black liquid-metal body with green circuits and one round eye.
- **J: eye laser.** An instant beam (hold to keep firing, every fourth beam is a triple). Machines take extra.
- **K: MERGE.** He melts into a fast puddle that slides along the floor (untouchable while flowing). Into a machine prop: he possesses it. Into a machine enemy: takeover. Into nothing: he pops back up.
- **Swap-in:** a splash of nanites that shorts out every machine enemy nearby.
- **Possession** (the alien timer keeps running; K ejects):
  - Turret: aim and fire (J), the turret takes the hits for him.
  - Arcade cabinet: GAME OVER! The screen blasts a cone of pixels (damage and stun), then the cabinet is spent.
  - SUMO SLAMMERS cabinet: the mini-game.
  - Security shutter: it rolls up for good (only Upgrade opens these).
  - Lift: rides up and stays up.
  - Maintenance cart: drive it along its rail (it rams enemies and barricades).
  - Tesla coil (boss arena): discharge it into Kevin.
- Discovery: the LASER LAIR, forced (never a misfire), NEW DNA DETECTED card, a glitch-boot title slam, digital sound set and a chiptune-arpeggio music layer. Kevin's reaction seeds the turn.

**Mini-game: SUMO SLAMMERS.** A 30-second retro bout on the cabinet's screen against KEV's sumo: mash ATTACK to push the meter, and when KEV raises his arms (the tell) press SPECIAL to sidestep his big shove for a swing toward the ring edge. Three rounds, each harder. Win all three to beat KEV's high score: a holo card and the NEW HIGH SCORE achievement. Works on touch (tap the right half to push, the left to sidestep). Freezes the level while it runs.

**Set piece: the turn.** Covered above. Mechanically: Kevin's copy uses the copied alien's attack set at copy level II, the copied alien is locked on the dial until the copy is beaten, and the watch is recharged by the story so the player always has something else to switch to. Checkpoint on every difficulty.

**Boss: KEVIN 11.** He copies the aliens Ben uses; the more Ben relies on one alien, the stronger Kevin's copy of it gets, so switching often is the counterplay.
- **Reliance** per alien: damage that alien deals Kevin plus time spent as it in the fight; it decays while Ben uses something else. Reliance sets the copy level: I, II or III. A **copy meter** under the boss bar shows every alien's icon with Kevin's copy level in pips, so the player can see the problem building.
- **Phase 1, COPYCAT (100-60%).** Base Kevin throws bolt volleys and tries an absorb lunge (if it catches Ben transformed, Kevin copies that alien one level higher and drains alien time). Every so often he scans Ben (a beam connects for most of a second: the tell) and becomes a purple copy of Ben's current alien at its reliance level, using that alien's attacks for a while: copy-Heatblast fireballs (II: a spread, III: plus a fire pillar), copy-Four Arms leap slams with shockwaves, copy-XLR8 telegraphed dashes, copy-Wildmutt pounces on a target marker, copy-Stinkfly flying slime volleys, copy-Upgrade possessing the coils.
- **Damage rules** (pure, unit-tested): the copied alien does little to its own copy (60% at I, 40% at II, 20% at III, "PERFECT COPY"); any other alien does full damage; the first hit from a different alien soon after he copies is OUT OF SYNC (a stagger and extra damage). Human Ben's punches do normal damage and parry his bolts.
- **Phase 2, OVERCHARGE (60-25%).** Kevin drains the coils: telegraphed arcs sweep the floor (striped danger band, then the bolt). Upgrade can merge into a coil and discharge it into Kevin (OVERLOAD). Kevin now switches between the copies of Ben's two most-used aliens himself.
- **Phase 3, KEVIN 11 (25-0%).** He absorbs every copy at once and becomes the unstable hybrid from the show, wearing a piece of each alien he copied (an arm, a wing, a flame). He uses each copied alien's attacks at its level and resists each in proportion; aliens he barely copied hurt most. Every few attacks he overloads (UNSTABLE!): open, and taking extra. The final phase is literally built from how the player fought.
- Any alien can still win; switching is just much faster. Tells are the same length on every difficulty; rests and punish windows follow the difficulty.
- Defeat: POWERED DOWN!, then the escape above.

**Secrets** (8 cards: 5 reachable in Chapter 4, 3 for later aliens).
- Reachable now: Main Street's rooftop sign (flight or a rocket jump), behind the band stage (Wildmutt's senses), the LASER LAIR catwalk (Upgrade's lift), the SUMO SLAMMERS high score (the reward), the power depot's cracked wall (Four Arms).
- For later aliens (silhouette hints): inside the claw machine (Grey Matter: "I'D HAVE TO BE TINY TO GET IN THERE"), past the substation's security laser (Diamondhead: "IF ONLY I COULD BOUNCE THAT LASER BACK"), a sealed room with no door (Ghostfreak: "NO DOOR. NO WAY IN. ...UNLESS I COULD WALK THROUGH WALLS").
- **Upgrade opens older secrets:** a dead Vilgax supply hatch by Chapter 1's crash site, the truck stop's dead garage door in Chapter 2, and the museum's security room in Chapter 3. Each chapter gains a card and shows SECRET WAITING! once Upgrade is on the dial.

**Achievements:** NEW HIGH SCORE (beat KEV's record), HOSTILE TAKEOVER (take over 15 machines), NOTHING TO COPY (beat KEVIN 11 before any of his copies reaches level III).

### Chapter 5: Bounty Hunters (plan only)

**Setting.** Silver Spur, an 1880s ghost town turned roadside attraction, at night under a full moon, and the Diamond Deep mine under it: the town's main street, the jail and the haunted hotel, the mine's rail tunnels, and a cavern of giant crystals at the bottom. One location, three hunters working it from three sides: the sky, the ground and the deep. Music: `ghosttown` (spaghetti-western chiptune), `mine` (percussive, echoing), `hunters` (boss).

**Story beats.**
1. **Cold open on Vilgax's ship** (portrait dialogue over a hologram): Vilgax, two machines down, hires professionals. **Sixsix** (armoured, jetpack, wrist blades and shoulder cannons; speaks only in clicks, subtitled "(SIXSIX SAYS SOMETHING RUDE)"), **Kraab** (a crab-armoured braggart with a claw cannon: "THE BOY'S AS GOOD AS CAUGHT, MY LORD!") and **Tetrax Shard** (a Petrosapien made of crystal, cool and honourable: "I DON'T DO THIS FOR FREE, VILGAX."). The bounty: the boy, alive, with the watch.
2. **Silver Spur.** Max wants the gold-panning tour; the town is empty, the saloon doors creak. Sixsix strikes first from the sky.
3. **Sixsix's hunt (main street).** His tracker drones paint Ben with a red targeting laser; a missile salvo follows a beat later unless Ben breaks line of sight behind a building or kills the drone. He lands for short duels (fast blade combos, then back into the sky).
4. **Ghostfreak.** Sixsix's energy net drags Ben into the old jail cell and seals it; no alien can break the bars without destroying the net's generator outside. The watch finds new DNA: **Ghostfreak** phases through the bars and the wall. He must feel slightly wrong: whispered lines in the corner of the screen ("LET ME OUT... LET ME STAY..."), the screen glitching when he arrives, and moments where he resists switching back (at timeout, a chance that he holds on for a second or two with a whisper: "NOT YET..."). Foreshadows Chapter 9.
5. **The haunted hotel.** Ghostfreak's showcase: locked rooms he phases through, Sixsix's drones that lose him while he's invisible.
6. **Kraab's hunt (the mine).** Kraab burrows (a crack line races along the floor toward Ben: the tell) and erupts claw-first; his claw cannon charges with a long glow. Mine carts (Upgrade drives them), dynamite crates (fire sets them off and opens cracked rock), falling rocks with dust tells.
7. **Diamondhead.** At the bottom of the mine Ben falls into the crystal cavern; Kraab's cannon charges on one side, Tetrax blocks the other. The watch reads the crystals: **Diamondhead** reflects Kraab's blast straight back at him (REFLECTED!). Tetrax notices: "A PETROSAPIEN? ...INTERESTING."
8. **Set piece: the forced misfire while cornered.** All three hunters corner Ben on the mine's lift platform. Ben picks the obvious answer to block the volley and the watch, scripted, misfires anyway (the one deliberate break of the "story moments never misfire" rule, and the only one in Act 2): the wrong alien, a beat of comedy (Kraab: "HA! IT'S A DUD!", Sixsix's laughing clicks), then 15 seconds to survive with it before the FIX swap comes back. The misfire is picked so it can be survived with skill (Ghostfreak phasing through the volley, XLR8 outrunning it), and the IMPROVISED! bonus is the intended clip. Checkpoint on every difficulty.
9. **Boss: THE HUNTERS** in the crystal cavern and up through the mine head.
10. **Ending.** Kraab is buried in a cave-in up to his eyestalks, Sixsix crashes into the water tower, and Tetrax, beaten, sees Ben spare Kraab and refuses the bounty: "A WARRIOR WITH HONOR. VILGAX DID NOT TELL ME THAT." Leaving, he says one more thing: "ASK YOUR GRANDFATHER WHERE HE LEARNED TO FIGHT LIKE THAT." (Act 3 setup.) Vilgax's hologram rages over the rubble. Last beat: the dial clicks to Ghostfreak on its own for a frame, and a whisper: "SOON..."

**Level sections:** the RV at the town gate > main street (Sixsix's hunt, cover between buildings) > the jail (Ghostfreak's discovery) > the haunted hotel (phase walls, invisibility, the drones) > the mine head and rail tunnels (Kraab's hunt, carts, dynamite) > the deep shafts > the crystal cavern (Diamondhead's discovery, crystal platforms, the laser puzzle) > the lift (the forced misfire) > the hunters' arena. Checkpoints on every difficulty at the jail, the crystal cavern, the lift and the boss.

**Enemies.** Tracker drones (Sixsix's: hover, paint Ben for a missile salvo; killing one breaks the lock), crab-bots (Kraab's: scuttle in, burrow and pinch; shelled, flip them), crystal sentries (Tetrax's: crystal spikes that fire shard volleys; Diamondhead absorbs shards to recharge), plus hazards: missiles with ground markers, falling rocks, dynamite, the mine's security lasers.

**Alien unlocks.**
- **Diamondhead** ("ROCK SOLID. LITERALLY."): J fires crystal shards; K raises a crystal shield that reflects lasers and shots back (hold to face it); Up+K grows a crystal platform where he aims (two at a time, they shatter after a while); swap-in: crystal spikes erupt around him. Traversal: crystal platforms over gaps and up shafts; puzzles: reflect security lasers onto receivers to open gates. Strongest against the hunters' lasers and missiles; weak to smash.
- **Ghostfreak** ("SOMETHING IN THE WATCH IS WATCHING YOU."): J lashes with his chest tentacles; K phases (intangible: through phase walls, enemies and shots, unable to attack; standing still while phased turns him invisible and enemies lose track); he floats down slowly; swap-in: a scream that frightens enemies for a moment. The wrongness: whispers, glitches, the hesitant revert.
- Both get discovery moments, sounds, colours, music layers and title slams (Diamondhead's name shatters in like glass; Ghostfreak's fades in backwards and twitches).

**Boss: THE HUNTERS** (multi-phase, each falls differently).
- **Phase 1: Kraab** on the cavern floor. A shelled front (like the brute: only smash breaks it), burrowing ambushes with crack-line tells, and the claw cannon (Diamondhead reflects it for big damage). Sixsix strafes in now and then. **Falls:** the cavern ceiling comes down on him (a Four Arms throw or a reflected blast into the cracked pillar speeds it up).
- **Phase 2: Sixsix** in the air up the mine head. He flies, paints Ben and fires salvos; Stinkfly's flight, Diamondhead's platforms and Heatblast's or Upgrade's range reach him; slime or a reflected missile damages his jetpack. **Falls:** the jetpack sputters and he crashes into the water tower.
- **Phase 3: Tetrax**, an honourable duel on the mine head. Crystal on crystal: Diamondhead's shards barely scratch him, Four Arms' smash cracks him, fire heats his crystal for a combo. He telegraphs every strike with a crystal glint. **Falls:** at low health he yields (not killed), and the ending plays.
- Switching rewarded: each hunter has a weakness a different alien exploits; any alien can finish the fight slowly.

**Secrets.** For later aliens: a mouse hole in the saloon wall (Grey Matter), the flooded lower shaft (Ripjaws), a mine-cart loop only a rolling ball survives (Cannonbolt). New aliens open older secrets: Diamondhead reflects Chapter 4's substation laser, Ghostfreak walks into Chapter 4's sealed room, and each adds one more: Ghostfreak phases into the museum's sealed exhibit vault (Chapter 3), Diamondhead reflects the jammer's beam onto a hidden receiver (Chapter 1).

**Achievements (plan):** REFLECTED (send 25 shots back as Diamondhead), BOO! (frighten 20 enemies as Ghostfreak), CLUTCH MISFIRE (survive the forced misfire without taking a hit), BOUNTY VOID (beat the Hunters).

### Chapter 6: Magic (plan only)

**Setting.** Hex's manor on a stormy hill outside a county fair: the fair's magic tent, the manor's halls, library and catacombs, and the Spell Engine, Hex's clockwork machine for amplifying the Charms of Bezel. Music: `fair` (organ waltz chiptune), `manor` (harpsichord, minor), `hex` (boss).

**Story beats.**
1. **Cold open at the fair's magic show.** The Great Hexo turns out to be Hex; his niece **Charmcaster** steals the Charms of Bezel from the exhibit, and in the chaos Gwen grabs one. It glows for her.
2. **Grandpa Max's bigger role.** Max drives the Rustbucket through the manor gate (a short ramming cinematic) and comes in with them. He handles himself too well (a fire extinguisher against rock creatures, knowing which runes not to touch): "GRANDPA, WHERE'D YOU LEARN THAT?" / "...THE NAVY." (Act 3 foreshadowing.)
3. **Gwen becomes a fighter (Milestone 5).** Gwen follows as a companion (the Kevin buddy system from Chapter 4, rebuilt for support): she fights a little on her own, and the player calls her spells with a cooldown each.
   - **Shield** (G): a bubble around Ben that blocks shots for 3 s.
   - **Stun** (Up+G): a mana burst that stuns enemies around Ben.
   - **Reveal** (Down+G): shows hidden doors, invisible enemies and the real Hex among his illusions for a few seconds.
   - Touch: a Gwen button with the same hold-for-radial picker as the Omnitrix. Her HUD portrait shows the three spells and their cooldowns. Spells grow through the chapter (she learns them one by one: shield in the halls, stun in the library, reveal in the catacombs).
4. **Grey Matter.** Charmcaster seals Ben in a warded cage built to hold monsters; the bars are too close for anything the watch has. New DNA: **Grey Matter** walks out between the bars.
5. **Set piece: the Spell Engine.** Hex starts the Engine to drain the Charms (and Gwen with them). Grey Matter crawls in through a vent and solves a puzzle inside the machine: gears to turn, mana pipes to reroute, a pendulum to time, wards to switch off in the right order. Gwen holds the transformation open with a spell ("I'LL KEEP YOU SMALL! HURRY!"), so the timer is paused inside: the puzzle is about thinking, not the clock. Checkpoint on every difficulty, and at each of its two halves on Easy.
6. **Boss: HEX AND CHARMCASTER.**
7. **Act 2 ending cliffhanger.** The Charms are safe; Gwen keeps the one that chose her. Packing up, a strange device in Max's jacket beeps; Max steps away to answer it: "THIS IS TENNYSON. ...MAGISTER, I'M RETIRED." Ben sees a badge he doesn't recognise. Then ActEndScene for Act 2: MEANWHILE..., deep underwater, a sealed base powering up, a signal with Max's name on it; PLUMBERS flashes on a screen. ACT 3: SECRETS. ACT 2 COMPLETE with the nine aliens of Acts 1 and 2 and every chapter's best.

**Level sections:** the fair's midway and magic tent > the manor gate (the Rustbucket rams it) > the great hall (enchanted armour, Gwen's shield) > the library (floating books, gargoyles, Gwen's stun) > the catacombs (illusions, hidden passages, Gwen's reveal) > Charmcaster's cage (Grey Matter's discovery) > the Spell Engine (the puzzle) > the tower top (the boss). Checkpoints on every difficulty at the cage, the Engine and the boss.

**Enemies.** Rocklings (Charmcaster's: small rolling stone creatures that curl up and bowl at Ben), stone golems (big, slow, a slam with a long tell; weak spots Grey Matter can analyse), enchanted armour (shield in front, needs smash or a hit from behind), gargoyles (stone while still and invulnerable, swoop when they wake), Hex's illusions (decoys that pop on contact; Gwen's reveal or Wildmutt's senses find the real one).

**Alien unlock: Grey Matter** ("SMALL BODY. BIGGEST BRAIN IN THE GALAXY."): J is a weak bite; K is ANALYZE: a scan that marks an enemy's or boss's weak point for a few seconds (weak points take triple damage from any alien, so analyse, then swap to Four Arms or Heatblast and hit it: a designed swap combo); he fits through vents and gaps a tile high and jumps very high for his size. Discovery moment, sounds, colour, music layer and title slam (his name assembles itself letter by letter like an equation).

**Boss: HEX AND CHARMCASTER** (three phases).
- **Phase 1: Charmcaster** summons rocklings and golems and hurls spell bags; Gwen's stun interrupts a summon.
- **Phase 2: Hex** with the staff: each Charm of Bezel he holds is a different attack (fire, lightning, stone, wind), each with its own tell; Grey Matter's analyse shows which Charm is powering the next spell, so the right alien can counter it (Stinkfly over the stone wave, Diamondhead reflecting the lightning once Diamondhead exists).
- **Phase 3: both**, Hex splitting into illusions while Charmcaster shields him; Gwen's reveal finds the real Hex, her shield blocks his big spell, and Max holds the stairs against the rocklings.
- Switching and Gwen's spells are rewarded, never required: any alien can win.

**Milestone 5 work in this chapter.** Gwen's companion and spells (above, also usable in replays of Chapters 1-5 once earned, as a Settings option so old routes stay as designed), Max in the field, and the deferred Chapter 1 intro cameos (Gwen: "GREAT, NOW YOU'RE EVEN MORE ANNOYING.").

**Secrets.** For later aliens: the manor's flooded cellar (Ripjaws), a corridor of heavy doors only a rolling battering ram opens (Cannonbolt), the overgrown greenhouse's high balcony (Wildvine's grapple). Grey Matter opens older secrets: Chapter 3's vent card (already waiting), Chapter 4's claw machine, Chapter 5's saloon mouse hole.

**Achievements (plan):** SPELLBOUND (call 30 of Gwen's spells), BIG BRAIN (land 10 weak-point hits after an analyse), THE ENGINE ROOM (solve the Spell Engine without a hint), ACT 2 (finish Act 2, secret).

## Difficulty

| Setting | Easy | Normal | Hard |
|---|---|---|---|
| Transform timer | 30s | 20s | 12s |
| Cooldown | 6s | 10s | 15s |
| Wrong transform chance | 0% | 10% | 25% |
| Damage taken | x0.5 | x1 | x1.5 |
| Checkpoints | Frequent | Normal | Sparse |

All values live in one config file so they can be tuned without touching logic. Hard also changes how enemies fight (less rest between attacks, faster wake-up, shorter punish windows, the boss rages earlier) while telegraphs stay the same length on every difficulty. Difficulty belongs to a save file and can be changed any time in Settings; best times are kept per difficulty.

## Enemies (initial)

- Vilgax drones: flying, shoot lasers
- Mutant animals (Dr. Animo): melee rushers
- Forever Knights: shielded melee, need heavy or piercing attacks
- Bounty hunters: mini-bosses with unique patterns

## Viral Layer (later milestones)

- **Clip button:** record last 10 seconds, export vertical video for TikTok/Reels
- **Fusion Lab:** combine two aliens into a new one with a shareable card (e.g. Heatblast + Ripjaws = steam alien)
- **Daily Omnitrix:** same random alien lineup for everyone each day, Wordle-style shareable score
- **Ben vs Kevin duels:** 1v1 via shareable link
- **Speedrun leaderboards** per chapter

## Easter Eggs

Sumo Slammers cards as collectibles, Mr. Smoothy stands as health pickups, Rustbucket references, hidden Ultimate form teasers.

## Milestones

1. **Vertical slice:** Ch 1 playable. Ben movement, Heatblast transform with timer/cooldown, drones, one boss. Deployed.
2. **Alien framework:** data-driven aliens. Add XLR8 and Four Arms.
3. **Core systems:** wrong transforms, difficulty, save progress, pause, menus.
4. **Story chapters:** 1 to 2 chapters per session.
5. **Characters:** Gwen support/spells, Max and Rustbucket segments, Kevin bosses.
6. **Mobile controls and polish.** (Touch controls, landscape handling and the frame-rate governor were pulled forward into the Chapter 1 polish pass; this milestone is now about polish across all chapters.)
7. **Viral layer.**
