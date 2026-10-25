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
- **Ch 6, Magic (Karachi):** Hex and Charmcaster. Gwen gains spells. Unlock Grey Matter. *Set piece: Grey Matter puzzle inside a spell machine (a clock tower's clockwork).*

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

### Chapter 6: Magic (Karachi)

The story, characters, Gwen's arc, Grey Matter, the Spell Engine and the boss are the original plan's; the owner moved the chapter to **Karachi, Pakistan** (DECISIONS.md, Milestone 4 part 5). Stylised pixel art inspired by real places, never exact replicas.

**Why the Tennysons are in Karachi.** The cold open shows a port crane lowering the Rustbucket off a cargo ship at Karachi Port at dusk. Max: "AN OLD NAVY FRIEND OWED ME A FAVOR. A BERTH ON A CARGO SHIP, NO QUESTIONS ASKED." Ben: "WE SHIPPED AN RV ACROSS AN OCEAN AND NOBODY THINKS THAT'S WEIRD?" The navy friend is the first thread of the Act 3 reveal: the Plumbers' underwater base sits in the Arabian Sea off Karachi, and the ending's call comes from there. **Hex** is touring his magic show here because the **Charms of Bezel** are on loan to a travelling exhibition, ANCIENT WONDERS, set up in a tent on the seafront.

**Setting and route** (one night, west to east across the city; each place inspired by, not a copy of, a real one):

| Section | Inspired by | What happens |
|---|---|---|
| The fair | Sea View / Clifton beach at night | A seafront fun-fair: camel and horse rides, balloon sellers, chai and bun kebab stalls, a Ferris wheel, kites, the sea breeze, and THE GREAT HEXO's big tent next to the ANCIENT WONDERS exhibition |
| The pink palace | Mohatta Palace, Clifton (pink sandstone, domes, arches, jharokha balconies, gardens) | Hex's rented manor. The Rustbucket rams its gate. Enchanted armour in the halls; Gwen learns SHIELD |
| The library wing | Frere Hall (Gothic arches, a painted ceiling, tall shelves) | Floating books, gargoyles; Gwen learns STUN |
| The old basements | The palace's cellars and a hidden tunnel under the old city towards Kharadar | Hex's illusions, hidden passages; Gwen learns REVEAL. Charmcaster's warded cage: Grey Matter. Then the tunnel (vents, rocklings, Max with a fire extinguisher) |
| The Spell Engine | The clock mechanism inside a stone clock tower inspired by Merewether Tower | Grey Matter's puzzle in the gears and pendulum of the clock itself |
| THE TOWER WRAP | The clock tower's outside | A climb around the tower in 3D: the tower turns as Ben circles it (below) |
| The tower top | Night skyline: the port cranes, the harbour lights, the city | HEX AND CHARMCASTER |
| The harbour | Keamari / the waterfront looking out at the Arabian Sea | The Act 2 ending |

**Landmarks and respect.** Mosques, Mazar-e-Quaid and other religious or national monuments appear only as distant skyline silhouettes (Mazar-e-Quaid's white dome lit at night, a single-dome mosque), never as a battleground, a magic site or anything that can be hit, damaged or stood on. Battlegrounds and magic sites are civic places: the fair, the palace, the library, the clock tower, the port, and the Manora lighthouse across the harbour, whose beam sweeps the tower top. No real graveyards, tombs or shrines anywhere (the "catacombs" are cellars and a tunnel). Signs are in English and romanised Urdu; no Urdu script is drawn (the pixel font has none, and invented script is never used).

**Karachi flavour in play, not just backdrops.** Hand-painted truck art and colourful buses, rickshaws and chingchis, kites in the sky, crows on wires, the sea breeze (Stinkfly drifts with it on the beach), a busy evening crowd that scatters when trouble starts, chai dhabas, street-food carts and shop signs. **Mr. Smoothy is replaced in this chapter by street-side chai and juice stalls** (the same pickup: a cup of chai or a glass of fresh juice). Some Sumo Slammers cards hide in Karachi spots (a camel's saddle, a kite stuck on a palace dome, the top of a truck-art bus...).

**Side characters** (original, short warm lines in English with light romanised Urdu, always clear from context or subtitled): **Rauf the chai-wala** at the fair ("CHAI PEE LO, BHAI! (HAVE SOME TEA!)"), **Rafiq the rickshaw driver** who knows the "haunted pink palace" ("EVERYONE SAYS IT'S HAUNTED, YAAR. ...YOU'RE GOING IN? SHABASH!"), and **Zain**, a kid who is a huge fan of "the kid with the watch" ("BEN BHAI! IS IT REALLY YOU? DO THE FIRE GUY!").

**Music** with a local flavour on top of the chiptune style: `fair` (qawwali-style handclaps, a harmonium-like lead, dhol rhythm), `manor` (harpsichord in a minor key with a sitar-like lead), `engine` (clockwork ticks and a slow pendulum bass), `hex` (the boss: dhol and a driving lead).

**Story beats.**
1. **Cold open:** the Rustbucket swung ashore at Karachi Port, then Sea View at night. The family at the fair (Max's chai, Gwen's guidebook, Ben's bun kebab). THE GREAT HEXO's show: Hex, the "great magician", makes the exhibition's Charms of Bezel float into his tent "for the finale". His niece **Charmcaster** grabs them for real; the crowd scatters, her rocklings tumble out of the tent, and Hex's spell animates the fair (kites dive-bomb, the balloon seller's balloons float off). In the chaos one Charm skids to Gwen's feet and glows for her.
2. **Grandpa Max's bigger role.** Rafiq points them to the pink palace; Max drives the Rustbucket through its gate (a short ramming cinematic) and comes in with them. He handles himself too well (a fire extinguisher against rocklings, knowing which runes not to touch): "GRANDPA, WHERE'D YOU LEARN THAT?" / "...THE NAVY." He holds the stairs in the boss fight.
3. **Gwen becomes a fighter (Milestone 5).** Gwen follows as a companion (the Kevin buddy system from Chapter 4, rebuilt for support): she throws a small mana bolt at enemies near her now and then, and the player calls her spells, each with its own cooldown.
   - **Shield** (G): a bubble around Ben that blocks shots for 3 s.
   - **Stun** (Up+G): a mana burst that stuns enemies around Ben.
   - **Reveal** (Down+G): a circle of true sight around Ben for a few seconds: hidden doors, invisible enemies, illusory floors (they vanish) and hidden ones (they appear), and the real Hex among his illusions.
   - Touch: a Gwen button with the same hold-for-radial picker as the Omnitrix. Her HUD portrait shows the three spells and their cooldowns. She learns them one by one: shield in the halls, stun in the library, reveal in the basements.
   - She is support, not a second protagonist: her bolts are weak, spells help but never win a fight alone, and she never blocks Ben's view, shots or the touch controls (she trails behind Ben, draws behind him, and fades out of the thumb zones).
4. **Grey Matter.** In the basements Charmcaster seals Ben in a warded cage built to hold monsters; the bars are too close for anything the watch has. New DNA: **Grey Matter** walks out between the bars.
5. **Set piece: the Spell Engine.** Hex reaches the clock tower and starts the Engine in its clockwork to drain the Charms (and Gwen, through the Charm that chose her). Grey Matter crawls in through a vent and solves a puzzle inside the clock itself: gears to turn, mana pipes to reroute, the pendulum to time, wards to switch off in the right order. Gwen holds the transformation open ("I'LL KEEP YOU SMALL! HURRY!"), so the timer is paused inside: the puzzle is about thinking, not the clock. Solvable on touch and readable on a phone, with hints that kick in after being stuck for a while. Checkpoint on every difficulty, and at each of its two halves on Easy.
6. **THE TOWER WRAP (3D set piece).** The Engine jams and Hex flees up the outside of the tower. Ben climbs after him on ledges spiralling around it, and the tower **turns** as he goes: the side he's on faces the camera, the far side curves away out of sight, the skyline wheels past behind. Gargoyles, rocklings rolling down the spiral, wind gusts from the wind Charm, the lighthouse beam sweeping across. Easy to grasp (it's a climb), and it looks like nothing else in the game.
7. **Boss: HEX AND CHARMCASTER** on the tower top.
8. **Act 2 ending cliffhanger.** The Charms are safe; Gwen keeps the one that chose her. At the harbour, packing up, a strange device in Max's jacket beeps; Max steps away to the water's edge to answer it: "THIS IS TENNYSON. ...MAGISTER, I'M RETIRED." Ben sees a badge he doesn't recognise. Then ActEndScene for Act 2: MEANWHILE..., deep under the Arabian Sea off Karachi, a sealed base powering up, a signal with Max's name on it; PLUMBERS flashes on a screen. ACT 3: SECRETS. **ACT 2 COMPLETE** is an event: the nine aliens of Acts 1 and 2 slam onto the dial, every chapter's best rank and time count up, fireworks over the harbour, and a share line (copied, or the phone's share sheet).

**Level sections:** the fair > the palace gate (the Rustbucket rams it) > the great hall (enchanted armour, Gwen's shield) > the library wing (floating books, gargoyles, Gwen's stun) > the basements (illusions, hidden passages, Gwen's reveal) > Charmcaster's cage (Grey Matter's discovery) > the tunnel to Kharadar (vents, rocklings, Max) > the Spell Engine (the puzzle) > THE TOWER WRAP > the tower top (the boss). Checkpoints on every difficulty at the cage, the Engine, THE TOWER WRAP and the boss.

**Enemies.** Rocklings (Charmcaster's: small rolling stone creatures that curl up and bowl at Ben), stone golems (big, slow, a slam with a long tell; weak spots Grey Matter can analyse), enchanted armour (a round shield in front, needs a smash or a hit from behind), gargoyles (stone while still and invulnerable, swoop when they wake), Hex's illusions (decoys that pop on contact; Gwen's reveal or Wildmutt's senses find the real one), and at the fair, kites Hex has bewitched (they dive at Ben; fire or a hit cuts their string).

**Alien unlock: Grey Matter** ("SMALL BODY. BIGGEST BRAIN IN THE GALAXY."): J is a weak bite; K is ANALYZE: a scan that marks an enemy's or boss's weak point for a few seconds (weak points take triple damage from any alien, so analyse, then swap to Four Arms or Heatblast and hit it: a designed swap combo); he fits through vents and gaps a tile high and jumps very high for his size. Discovery moment, sounds, colour, music layer and title slam (his name assembles itself letter by letter like an equation).

**Boss: HEX AND CHARMCASTER** (three phases).
- **Phase 1: Charmcaster** summons rocklings and golems and hurls spell bags; Gwen's stun interrupts a summon.
- **Phase 2: Hex** with the staff: each Charm of Bezel he holds is a different attack (fire, lightning, stone, wind), each with its own tell; Grey Matter's analyse shows which Charm is powering the next spell, so the right alien can counter it (Stinkfly over the stone wave, Diamondhead reflecting the lightning).
- **Phase 3: both**, Hex splitting into illusions while Charmcaster shields him; Gwen's reveal finds the real Hex, her shield blocks his big spell, and Max holds the stairs against the rocklings.
- Switching and Gwen's spells are rewarded, never required: any alien can win.

**Milestone 5 work in this chapter.** Gwen's companion and spells (above; also usable in replays of Chapters 1-5 once earned, as a Settings option that defaults to OFF so old routes stay as designed), Max in the field, and the deferred Chapter 1 intro cameos (Gwen: "GREAT, NOW YOU'RE EVEN MORE ANNOYING.").

**Secrets.** For later aliens: the palace's flooded cellar (Ripjaws), a corridor of heavy doors only a rolling battering ram opens (Cannonbolt), the overgrown garden's high balcony (Wildvine's grapple). Grey Matter opens older secrets: Chapter 3's vent card (already waiting), Chapter 4's claw machine, Chapter 5's saloon mouse hole.

**Achievements:** SPELLBOUND (call 30 of Gwen's spells), BIG BRAIN (land 10 weak-point hits after an analyse), THE ENGINE ROOM (solve the Spell Engine without a hint), ACT 2 (finish Act 2, secret).

## Act 3 plan: Secrets

Act 3 is about the secrets the summer has been keeping: Grandpa Max's past (Chapter 7), the thing hiding behind a clown's smile (Chapter 8), and the thing hiding inside the watch (Chapter 9). Act 1 taught the dial, Act 2 attacked the player's habits; Act 3 changes the ground under the player's feet: water that has to be swum, a ball that has to be rolled, and finally an alien that leaves the dial for good. Each chapter ends on a hook into the next: Kevin escapes the Plumber base with a stolen badge and a Magister warns Max of "something stirring on the roads ahead"; Zombozo's last laugh wakes something in the Omnitrix; Ghostfreak's escape sends the family looking for the watch's maker (Act 4).

**Act 3 is the season premiere.** It opens with the game itself changing: halfway down a Plumber elevator under Keamari harbour, the pixel world resolves into an HD cartoon one, and Act 3 stays that way.

### Rules for all of Act 3

Act 2's rules all carry over, unchanged:

- Every new alien gets a discovery moment, unique sounds, colours, music layer and title slam.
- Every chapter has secrets gated by future aliens, and new aliens open older secrets ("SECRET WAITING!").
- Misfires blocked during story moments.
- Every set piece has its own checkpoint on all difficulties.
- Boss: readable tells, switching rewarded not required, multiple phases.
- Splits, medals, achievements, card album entries, ghost runs, jokes for every new alien pair, all working for new content.
- Every chapter must pass the performance budget in docs/PERFORMANCE.md (npm run bench).

New for Act 3:

- **HD cartoon presentation, chapter-scoped.** Every Act 3 chapter is drawn in an HD cartoon style made in code: bold clean outlines, cel shading, rich gradients, dynamic lighting, smooth animation, expressive poses and juicy effects. It covers everything in the chapter: Ben, Gwen, Max, Kevin, every alien, NPCs, enemies, the boss, backgrounds and parallax, props, water, bubbles and light shafts, transformations, explosions, pickups, the HUD and the Omnitrix dial, dialogue, the chapter's pause, game over and results screens. The chapter draws at the screen's own resolution (a render scale of up to 3x the 640x360 game frame; positions, physics and level design stay in game pixels) and uses its own textures and rendering paths, swapped in when the chapter starts and back out when it ends, so **Chapters 1 to 6 keep their exact pixel look and behaviour**. The screens shared by every chapter (title, Chapter Select, Training, ALIEN FILES, EXTRAS) stay pixel art.
- **Character art rule (Act 3; replaces any earlier rule that kept the pixel sprites or forbade redraws, for Act 3 only).** Ben, Gwen, Max, Kevin and every alien that appears in an Act 3 chapter are redrawn as fully animated HD cartoon characters that keep their established identities from this game: silhouettes, proportions, faces, outfits, colours and Omnitrix details. Pixel sprites are never reused, upscaled, smoothed, traced or outlined in an Act 3 chapter. Characters are articulated rigs (parts painted with vector shapes, posed by a skeleton, animated every frame), with every animation their gameplay needs (idle, movement, jumping, falling, landing, swimming, attacks, abilities, damage, defeat, transformations) plus expressive story poses for dialogue and cinematics. Each character has one manifest in `src/config/cartoon/`; an optional replacement sprite sheet in `public/assets/licensed/<character>/` is used instead, without code changes, when present. The game always ships with complete cartoon art; `docs/ART_COVERAGE.md` lists every animation and any gap.
- **A new way to move per chapter.** Chapter 7 swims, Chapter 8 rolls and bounces, Chapter 9 loses an alien and has to manage without it.

### Chapter 7: The Plumbers

**Setting.** One night under the Arabian Sea off Karachi. Keamari harbour (the Act 2 ending's quay, still pixel art), a hidden Plumber elevator under an old navy jetty, the descent through the sea (where the game turns HD), and **PLUMBER BASE ARABIAN DEEP**: a sealed Plumber outpost on the sea floor, built in the 1970s, mothballed for twenty years, and woken by the signal at the end of Act 2. Its docking ring, the flooded maintenance ring, the reactor, the open sea around its hull, the pump hall, the containment block, and the moon pool where its submarines used to dock. Ambient light: the base's emergency blues and reds, its lamps waking section by section, bioluminescence and light shafts from far above. Music: `deep` (the base: sonar pings, a pulsing synth bass, glassy arpeggios), `opensea` (outside the hull: airy pads and slow whale calls), `deepmaw` (the boss), and an Act 3 title sting.

**Why there.** Act 2 ended with a call for Max ("THIS IS TENNYSON. ...MAGISTER, I'M RETIRED.") and a sealed base powering up under the sea with his name on its screen. The base woke because its prisoner did: its containment is failing. It called the last Plumber on its roster within a thousand miles.

**Story beats.**
1. **The jetty (pixel).** Midnight at Keamari. Max walks Ben and Gwen down an old navy jetty to the water ("STAY CLOSE. AND DON'T TOUCH ANYTHING."). He presses his gold badge to a rusted bollard; a green scan line reads it (TENNYSON, MAX / MAGISTER, RETIRED), the jetty's deck slides apart and a glass elevator rises out of the sea, dripping. Gwen: "THAT IS NOT NAVY STUFF."
2. **The descent (the transition, one continuous shot).** The capsule sinks; the camera rides down with it past the waterline into the dark pixel sea. Below, the base's beacon pings. Each ping is a ring of green light, and where it passes, the world resolves: blocky water breaks into squares that scatter, and smooth gradients, light shafts, fish and kelp flood in behind them. The family resolves too: Ben's, Gwen's and Max's pixel bodies break apart into squares, the squares are pulled into clean drawn shapes, ink lines draw on and colour floods in. They react (Ben stares at his hands: "WHOA. DO YOU GUYS FEEL... SHARPER?" / Gwen: "EVERYTHING LOOKS... DIFFERENT." / Max: "THAT'S THE BASE'S SCANNER. FIRST TIME'S ALWAYS A LITTLE WEIRD."). The camera pushes in as the base below lights up lamp by lamp, its dome, towers and docking arms emerging from the dark, fish scattering. On the capsule's roof, for one beat, a figure in silhouette grins (Kevin, stowed away).
3. **ACT 3: SECRETS** slams in (a season premiere title: ACT 3 stamps, SECRETS ripples in like water, CHAPTER 7: THE PLUMBERS under it), then the capsule docks.
4. **The docking ring (HD from here).** The base wakes as the family walks in: lights thud on section by section, holograms boot. Max's reveal: "THE PLUMBERS. INTERSTELLAR LAW ENFORCEMENT. I WAS ONE OF THEM FOR THIRTY YEARS." / Ben: "MY GRANDPA'S A SPACE COP?!" / Gwen: "THE NAVY. RIGHT." Max finds his old locker (his Plumber blaster; his armour "SHRANK"). The base's sentries don't recognise him ("INTRUDER." / "TENNYSON, MAX. CODE SEVEN SEVEN ALPHA!" / "CODE EXPIRED."): the first fight. Gwen walks with Ben through the ring.
5. **The split.** At the control hub Max and Gwen stay to bring the base's systems back ("GWEN, WITH ME. BEN, FIND THE REACTOR. AND DON'T TOUCH ANYTHING."). From here they talk to Ben over the intercom, and the systems they wake (lights, doors, pumps) light up around him.
6. **The flooded ring.** Half the maintenance ring is under water. Human Ben swims (with a breath meter, air bubbles from vents and air pockets under the ceiling), currents from burst pipes push him around, pressure doors only open when the water on both sides is level, jelly mines drift, zapper eels coil in the dark water and Deepmaw's escaped crew (fishbowl grunts) guard the dry rooms. A shadow on the far side of a window: Kevin, heading for the reactor.
7. **The reactor (set piece).** Kevin, at the base's reactor, drinking it in: "ALL THIS ALIEN TECH... AND NOBODY USING IT." He takes everything; the base goes dark, red emergency lights come on, the intercom shouts CONTAINMENT FAILURE, and Kevin blasts a bulkhead and runs for the escape pods ("THANKS FOR THE RIDE, TENNYSON!"). The sea pours in, the chamber seals, and Ben is trapped in a room filling with water.
8. **Ripjaws (the discovery).** Human Ben, out of air in the dark: the breath meter empties, the picture narrows, bubbles stop. The Omnitrix lights the water green (NEW DNA DETECTED, from the base's xenobiology archive next door), and **Ripjaws** tears out of the transformation like a torpedo, smashing through the chamber's glass into the open sea. His name forms out of water and splashes apart.
9. **The open sea.** Ripjaws' showcase outside the hull: the base lit up behind him, coral and kelp, a whale-sized shadow passing above, intake vents that suck, gnasher swarms, a card in a coral cave. He swims back in through the moon pool's intake into the pump hall.
10. **The pump hall (the base's systems).** With Max and Gwen on the intercom, Ben brings the pumps back one by one: each console drains one room and floods another, changing the hall's whole layout. Ripjaws rules the flooded rooms but drains fast on land; the dry rooms want legs. Switching is the fast way through.
11. **The containment block.** Open cells (cameo silhouettes of old prisoners), the crew and the sentries, and Max catching up with his blaster. Cell 7 is empty: "DEEPMAW." / "WHO'S DEEPMAW?" / "A PIRATE. HE SANK FOURTEEN STARSHIPS IN THE ANDROMEDA SPRAWL. IT TOOK SIX PLUMBERS AND A VERY BIG NET TO PUT HIM IN THERE. I WAS ONE OF THE SIX."
12. **Boss: DEEPMAW** in the moon pool.
13. **Ending.** Max drops the moon pool's containment field and Deepmaw is back in stasis. A Magister calls by hologram (MAGISTER KORR): "THE ARABIAN DEEP IS SECURE, TENNYSON?" / "IT IS NOW." / "AND THE BOY WITH THE OMNITRIX?" / "...HE'S WITH ME." / "THEN KEEP HIM SAFE. SOMETHING IS STIRRING ON THE ROADS AHEAD." The base's camera shows an escape pod surfacing far above, and Kevin waving a stolen Plumber badge. Ben: "SO. GRANDPA'S A SPACE COP." Gwen: "AND YOU'RE STILL A DORK." Max: "WHO WANTS A SMOOTHIE? THE BASE HAS A MACHINE."

**Level sections** (about 500 x 76 tiles; the jetty and the descent at the far left, the base along the sea floor):

| Section | What happens | Checkpoint (densities) |
|---|---|---|
| Keamari jetty and the descent (0-34) | The opening: the jetty, the elevator, the transition, ACT 3: SECRETS, docking | none |
| Docking ring (34-96) | The base wakes, Max's reveal and locker (card), the sentries' lockdown, Gwen with Ben, the split | DOCKING RING (all) |
| Flooded ring (96-176) | Swimming with breath, air pockets, burst-pipe currents, pressure doors, jelly mines, zapper eels, grunts; Kevin glimpsed; a card behind a current | FLOODED RING (Easy, Normal) |
| The reactor (176-206) | Kevin drains the reactor, the blackout, the flood; the sealed chamber; Ripjaws' discovery | THE REACTOR (all) |
| The open sea (206-290) | Ripjaws outside the hull: currents, intake vents, gnashers, the coral cave card, the Cannonbolt secret | THE OPEN SEA (Easy, Normal) |
| Pump hall (290-372) | Three pump consoles that drain and flood the hall's rooms, pressure doors, a card in a drained tank, the Wildvine secret | PUMP HALL (all), PUMP HALL: TANK 3 (Easy) |
| Containment block (372-444) | Cells, the crew, sentries, Max with his blaster, Cell 7 | CONTAINMENT (Easy, Normal) |
| The moon pool (444-500) | DEEPMAW in three stages (each a hidden checkpoint: retries start at the stage you died in) | THE MOON POOL (all), DRY DOCK, THE MAELSTROM (hidden) |

**Swimming and the base's water (the chapter's new movement).**
- Water in the base is a set of **tanks**: room-sized bodies of water whose level can change (pumps drain and flood them, a breach fills one). Below a tank's surface everything swims; at the surface Ben can jump out.
- **Swimming:** left/right and up/down swim (the stick on touch), JUMP is a stroke upward and a jump out at the surface, and doing nothing drifts down slowly. Every form swims in its own way (`config/swim.ts`): Ripjaws is a torpedo; XLR8 is quick and still runs on the surface; Wildmutt dog-paddles; Stinkfly's wings are soaked; Four Arms and Diamondhead sink and stride along the bottom (high, floaty jumps); Upgrade sinks slowly; Ghostfreak drifts as if the water weren't there; Grey Matter is small and slow. Heatblast hates it: he swims slowly in a cloud of steam and his fire comes out as weak steam bolts.
- **Breath:** human Ben has about 10 s of air (more on Easy); aliens with lungs a little more; Ripjaws, Ghostfreak, Upgrade and Diamondhead don't need any. A ring of bubbles shows what's left; air pockets under ceilings and bubble vents refill it. Out of air, he loses a heart every couple of seconds until he surfaces or breathes. Ripjaws' unlock happens at the end of a breath.
- **Currents:** jets from burst pipes and intake vents push swimmers (shown with streaks and bubbles); heavy walkers on the bottom barely feel them, Ripjaws can swim against them.
- **Pressure doors:** a door between two tanks opens only when the water on both sides is level (a gauge on the door shows the difference); a pump console or a valve wheel (Four Arms turns it, Upgrade powers it) levels them.
- **The base's systems:** consoles that wake a section (lights, doors, pumps). Any attack hits a console's big button; Upgrade merges into one to run it at once. Max and Gwen wake the rest from the control hub as the story goes.
- **Ripjaws' timer drains faster on land** (x2.5), shown by a water drop on the dial that empties; any water stops the fast drain at once.
- Older chapters' water stays deadly for everyone else; there Ripjaws can swim in water and mutagen, which opens the three cards waiting since Chapters 3, 5 and 6.

**Enemies.**

| Enemy | Behaviour | Best answer |
|---|---|---|
| Plumber sentry | The base's security drone in lockdown: its scan light sweeps and turns red on Ben (the tell), then a stun beam. Flies in air and water | Upgrade takes it over; anything wrecks it |
| Fishbowl grunt | Deepmaw's crew: a fish in a diving suit with a water-filled fishbowl helmet. Winds up a harpoon throw (the tell). Break the helmet and it flops helplessly until it crawls back into water | Anything; a smash or fire cracks the bowl |
| Zapper eel | Coiled in the water; it glows and crackles (the tell), then a shock ring through the water around it | Hit it out of water, Ripjaws' bite, Diamondhead's shield |
| Jelly mine | Drifts in the water and pulses; touch it and it stings, hit it and it pops (a chain of them pops together) | Shots from range |
| Gnasher swarm | A school of little fish that circles, then darts at Ben in a line (the tell: the school bunches up and turns) | Ripjaws, area attacks |

**Alien unlock: Ripjaws** ("KING OF THE DEEP. A FISH OUT OF WATER."). A pale grey fish-man with a huge jaw of fangs, a lure on his head, fins and gills, a black and white wetsuit with the Omnitrix on his chest, and a powerful tail for legs.
- **J: bite.** Hold to chomp; every third is a lunging CHOMP. In water the lunge carries him forward.
- **K: tail whip.** A spinning slap that hits all round him and knocks shots away; in water it fires him off as a torpedo (RIP DASH) that bites through a line of enemies.
- **In water:** the fastest thing in the game, in any direction, with momentum. **On land:** he hops on his tail, slower and floppier, and the Omnitrix drains x2.5 (gasping: "NEED... WATER..."). Any water, even a puddle-deep tank, fixes it.
- **Swap-in:** a burst of water out of nowhere that knocks everything around him back.
- Discovery: the flooded chamber at the end of Ben's breath (never a misfire), NEW DNA DETECTED, a title slam made of water, an underwater sound set and a deep, rolling music layer.

**Boss: DEEPMAW** (an original villain). A giant alien anglerfish of a pirate: a huge round body, a cavern of a mouth, a glowing lure on a stalk, a captain's coat in rags and the broken stasis collar of Cell 7. He talks ("THIRTY YEARS IN A FISHBOWL, TENNYSON! THE FOOD WAS TERRIBLE!"). Max holds the moon pool's pump console in the booth above the arena and drains or floods it between stages; Gwen is with him and can still SHIELD Ben from the booth.
- **Stage 1: LIGHTS OUT** (the moon pool flooded and dark). Only his lure glows: dynamic light in the dark. He drifts the lure as bait, then the lure flares and freezes (the tell) and the jaws lunge out of the dark along a red line; he also spits lure flashes (a bright pulse that stuns; Reduce Flashing softens it). Hitting the lure stuns him and opens his mouth to damage. Ripjaws is the natural fit; Diamondhead's shield reflects the flash; Four Arms on the bottom can grab him as he passes.
- **Stage 2: HIGH AND DRY** (Max drains the moon pool). Deepmaw flops onto the deck and fights on his fins: tail slams with shockwaves, a rolling chomp across the floor, belly flops (a shadow marks where). On land he's slower and his lure dims; land aliens shine and Ripjaws drains fast. Every so often he dives for the drain grate and the water surges back (FLOOD WARNING).
- **Stage 3: THE MAELSTROM.** He rips the moon pool's hatch open: the sea pours in as a whirlpool. The current pulls everything toward his mouth in the middle while the water rises and falls; debris spins past; he swallows what the current brings and spits it back. Swimming against it (Ripjaws), walking the bottom (Four Arms, Diamondhead) or hitting him from range all work.
- Retrying starts at the stage you died in. Tells are the same length on every difficulty; rests and punish windows follow the difficulty. Any alien can win; switching is faster.
- Defeat: RECAPTURED!, then the ending.

**Secrets** (7 cards: 5 reachable in Chapter 7, 2 for later aliens). Reachable now: Max's locker in the docking ring, behind a burst-pipe current in the flooded ring, the reactor's catwalk, the coral cave outside the hull, the drained tank in the pump hall. For later aliens: a rolling chute only a ball survives (Cannonbolt: "IF ONLY I COULD ROLL THROUGH THERE..."), a grapple point high in the pump hall's shaft (Wildvine: "WAY UP THERE... I'D NEED A VINE"). **Ripjaws opens older secrets:** Chapter 3's mutagen vat, Chapter 5's flooded lower shaft and Chapter 6's cistern (each card already waiting there).

**Achievements:** FISH OUT OF WATER (KO 5 enemies as Ripjaws on dry land), ALL SYSTEMS GO (wake every console in the base), DEEP BREATH (cross the flooded ring as Ben without running out of air), BAIT AND SWITCH (stun Deepmaw by hitting his lure as three different forms in one fight).

### Chapter 8: Zombozo (plan only)

**Setting.** The Plumbers fly the Rustbucket home in a transport and drop the family at a seaside boardwalk town on the US coast, where ZOMBOZO'S CIRCUS OF FEARS has pitched its tent for one night only. The midway, the big top, the funhouse and its mirror maze, the trapeze rig high above the ring. Night, coloured bulbs, fog off the sea. Music: `midway` (a wonky calliope in a minor key), `bigtop`, `zombozo` (boss).

**Story beats.** Zombozo, a clown who feeds on fear, and his freak-show acts (an acid-spitting strongman, a contortionist, a rubber-limbed acrobat) drain the town's crowd one scare at a time. Gwen is taken into the mirror maze; Max is caught by the strongman. Cannonbolt unlocks when Ben is trapped in the funhouse's spinning barrel: the watch rolls him up into an armoured ball that smashes out. The funhouse mirror maze is the set piece: mirrors show reflections that lie (a reflection that moves differently is a hole, a mirror that lights up is a door), and Cannonbolt bouncing off the angled mirrors is how the maze's heart is reached. Zombozo's last laugh, as he falls, makes the Omnitrix flicker to Ghostfreak on its own.

**Movement:** Cannonbolt rolls (momentum, ramps, loops, bounces off walls and angled mirrors). **Alien unlock: Cannonbolt** (J: a shell bash, K: curl and roll; roll into a jump for a big bounce; swap-in: a rolling charge). **Boss: ZOMBOZO** in the big top: fear gas and jack-in-the-box traps (phase 1), his acts joining in on the trapeze rig (phase 2), and a giant inflatable clown head that has to be popped from inside while it fills the ring (phase 3). Secrets for later aliens (Wildvine's grapple over the big top, Way Big never, a fair game only Upgrade can rig), and Cannonbolt opens the older secrets: Chapter 5's mine-cart loop and Chapter 6's corridor of heavy doors.

### Chapter 9: Ghostfreak Out (plan only)

**Setting.** The Rustbucket breaks down by an abandoned observatory in the hills during a thunderstorm. The observatory, its dome and telescope, the old caretaker's house, the woods and a cave under the hill. Music: `storm`, `observatory`, `ghostfreak` (boss).

**Story beats.** Lightning hits the Omnitrix while Ben is Ghostfreak, and Ghostfreak tears himself free: the dial's Ghostfreak slot goes dark for good (DNA LOST), and the alien who whispered for two acts finally speaks in full ("THANK YOU, BEN. I'LL TAKE IT FROM HERE."). He possesses the observatory, then Max. A chapter of managing without the alien that walked through walls: phase walls become puzzles solved another way, invisible enemies need Wildmutt's senses or Gwen's reveal. The set piece is the telescope: Ghostfreak can't stand sunlight, so the dome has to be cranked open at dawn and the telescope's mirror turned on him (Diamondhead reflects the first light, Upgrade drives the dome's motor). **Boss: GHOSTFREAK**, the alien you used to be: every one of his attacks is a move the player used as him (the tentacle lash, the phase, the scream, invisibility), now aimed at Ben; phase 1 in the observatory, phase 2 possessing objects in the caretaker's house, phase 3 in the dawn light under the dome. He escapes at the end (Act 4 carries the thread), and Ghostfreak's diary gets its last, locked line. **Act 3 ending:** ACT 3 COMPLETE as an event like Act 2's, and the hook into Act 4: the Omnitrix has started counting something down.

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
