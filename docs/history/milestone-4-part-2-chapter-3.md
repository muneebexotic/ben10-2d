# Milestone 4, part 2: Chapter 3, Dr. Animo

_Archived from `docs/PROGRESS.md` on 2026-10-03. The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`._

## The chapter, start to finish

One night in the Tri-County Natural History Museum. `levels/chapter3.ts` (424 x 40 tiles), set pieces in `scenes/level/story/museum/`, tuning in `config/chapter3.ts`, `config/mutants.ts` and `config/frog.ts`.

1. **The opening (skippable, never replayed on a retry or a continue):** the Rustbucket parked outside the museum under a full moon. Max wants the night tour ("THEIR NIGHT TOUR OF THE MESOZOIC IS LEGENDARY"), Gwen points out it's closed, Ben spots the side door glowing green, and Max remembers the paper: a scientist fired last month over "animal experiments". "BEN. DON'T EVEN THINK ABOUT IT." A night guard bursts out of the glowing staff door with mutant rats on his heels.
2. **The steps:** lamp posts, the museum facade, a card up on the roof (Heatblast's rocket jump).
3. **The Great Hall: Dr. Animo's entrance.** The lights dip, the gem in his crown flares, and he rises on the balcony over the T-rex with his portrait and his own voice in the box: "THIS MUSEUM CALLED MY LIFE'S WORK 'AN ABOMINATION'. TONIGHT ITS EXHIBITS AGREE WITH ME." / "OKAY, CREEPY CROWN GUY. WHAT IS WITH THE RATS?" / "RATS? THESE ARE THE NEXT STEP IN EVOLUTION. AND YOU, BOY, ARE A DEAD END." He zaps the exhibits into mutants and leaves hanging from a giant bat. Already an alien when he sees you? "FASCINATING! A WALKING GENETIC MIRACLE! I MUST HAVE THAT WATCH!" (the Act 2+ thread). On a retry the speech is skipped, the mutants still come. A ceiling roach and a skylight-glass floor over the cellar (a card in a dinosaur egg: only a heavy smash from high up breaks the glass).
4. **The Hall of Mammals:** the mammoth, a stuffed bear (card on its plinth up high), the first **brute** ("TUSKS BLOCK THE FRONT! LET IT CHARGE INTO A WALL"), bats, rats and a roach.
5. **The Night Gallery: the blackout and Wildmutt.** Animo over the PA ("LET'S SEE HOW YOU FARE, BOY... IN THE DARK."), the lights clunk off one by one, pitch black, and the watch finds **Wildmutt** (below). His first breath sends a huge pulse through the dark that paints every invisible lurker and the plinth's secret door (a card inside).
6. **The climb:** a wall only Wildmutt goes up, and at the top a stretch of wall that smells wrong: a hidden door into the upper gallery. Lurkers and a ceiling roach.
7. **The atrium: Stinkfly.** The whale skeleton hangs over a bridge across the tar pits. Animo taunts from the far balcony ("ALLOW ME TO ADD YOU TO THE COLLECTION!"), the bridge falls apart under Ben, and mid-fall the watch catches him: **Stinkfly** (below). He hangs over the tar, wings buzzing, until the player flaps. Fly perch to perch (a card on the whale's ribs) through a bat ambush. "AN INSECT?! ...DISGUSTINGLY MAGNIFICENT. TO THE LAB!"
8. **LOCKDOWN: the five-alien puzzle** (below).
9. **Animo's lab:** mutagen tanks, cages, consoles, pipes; a last mixed pack.
10. **KING CROAK** (below), then Gwen: "SO WHO'S TELLING THE MUSEUM THEIR T-REX IS IN THE GIFT SHOP?" / Ben: "NOT IT!" / Max / Animo, tied up: "THIS... ISN'T OVER... EVOLUTION... ALWAYS... WINS..." Chapter Complete (MUTANTS DEFEATED), then **the Act 1 ending**.

Checkpoints: GREAT HALL (Easy and Normal), HALL OF MAMMALS, NIGHT GALLERY, THE CLIMB (Easy), UPPER GALLERY (Easy and Normal), ATRIUM, LOCKDOWN, ANIMO'S LAB (Easy and Normal), KING CROAK. **Hard keeps one at every set piece** (the blackout, the atrium, the lockdown and the boss) and drops the ones in between.

The museum gets its own look: a night city skyline, a hall wall with arched windows and moonbeams, marble tiles, 20 kinds of exhibit (T-rex, mammoth, whale, pterosaur, display cases, banners, paintings, velvet ropes, mutagen tanks, cages...), its own ambient light per room (street, museum, gallery, blackout, atrium, lab) and two new music tracks (the museum in B minor, Animo's theme in C minor).

## Wildmutt and Stinkfly

Both are data-driven like the first three (`src/aliens/<id>/`, `config/aliens/<id>.ts`, one registry line). Both discovery beats use the same NEW DNA DETECTED card as XLR8 and Four Arms, are forced (never a misfire) and save the alien the moment it's revealed.

- **Wildmutt** ("NO EYES. ALL NOSE."): **senses** pulse out around him (a ring every 1.35 s) and reveal what nobody else sees: invisible lurkers, and **hidden doors**, which crumble after he's been close for a moment (HIDDEN PATH! SNIFFED OUT). The game looks different through him: the world's light dims and a warm sense glow surrounds him, so hidden things stand out. Hold J for **claw rakes** (every third is a knockback double rake), K **pounces** (Up+K pounces high); landing on an enemy from above is a **POUNCE!** (big damage, a stun, a bounce off its back). **Push into any wall to climb it**, Jump to leap off. Swapping in lands with a roar that stuns everything close. He can't talk: his lines are growls with subtitles ("*SNIFF SNIFF* (I CAN'T SEE A THING... BUT I CAN SMELL EVERYTHING!)").
- **Stinkfly** ("GROSS. GLORIOUS. AIRBORNE."): Jump in the air to **fly**; hold Jump to climb, let go to hover, Down to dive. A **wing stamina** bar (about 2 s of climbing; hovering costs less than half as much, landing refills it in under a second) keeps flight limited; with the wings spent, holding Jump glides him down. J spits **slime** that slows whatever it hits; **three quick globs gum an enemy in place** (two for a bat, whose wings give out). K drops a **stink cloud** that chokes and slows; **fire sets it off** in a fireball (FOOMP!, or KA-BOOM! when it catches two or more), so stink, swap to Heatblast, fireball is a combo. Swapping in sprays slime ahead.
- Every older alien got misfire lines for the new pairs (and the new ones for the old), and the Banner has a claw-slash and a zig-zag fly-in for their transforms.

## Mutants (Dr. Animo's exhibits)

Each one rewards a different alien; any form can beat them, just slower.

| Mutant | Behaviour | Best answer |
|---|---|---|
| **Rat** | Packs. Squeaks and crouches (the tell), then leaps | Wildmutt's rakes and pounce |
| **Roach** | Shell takes 35% from claws, fists and goo; scuttles in bursts; drops from ceilings when Ben passes under (grit rains down first) | Heatblast (x2), or flip it over |
| **Lurker** | Nearly invisible chameleon; its throat glows before it spits mutagen (which leaves a stinging puddle), then it slinks away | Wildmutt's senses or Stinkfly's slime show it |
| **Brute** | Tusked mammoth calf: its front takes 20% from anything but smash. Pounds its chest (the tell), then charges; into a wall it knocks itself out, on its back and liftable | Four Arms smashes through; anyone can bait it into a wall and hit its back |
| **Bat** | Wakes, screeches (red eyes, a dashed line along its swoop), then swoops | Two quick slime globs ground it |

## LOCKDOWN: one alien per lock

Animo seals the security wing: "LOCKDOWN! FIVE LOCKS, ONE ALIEN EACH. {T} SWAPS ON THE FLY." The locks come in a row so swapping mid-run is the fast way through:

1. **Mutant vines** (Heatblast): claws and fists don't cut them; fire burns them away.
2. **A mutagen moat** under a low ceiling (XLR8): too wide to jump with no headroom; run across it.
3. **A cracked security wall** (Four Arms).
4. **A dead end** (Wildmutt): climb the shaft and sniff the wall at the top: the whole vent was a hidden door.
5. **The vat pit** (Stinkfly): fly across from the vent to the far ledge.

The reachability test proves each lock really needs its alien: with every other alien on the dial, the route stops at that lock. Two secrets wait in the vent for Act 2 aliens (Grey Matter, Ripjaws), with their silhouettes and lines.

## KING CROAK (boss)

A museum bullfrog Animo blew up to the size of a car, with Animo riding its head. His intro: "PERSISTENT, AREN'T YOU? LIKE A COCKROACH. ...I SHOULD KNOW. I MADE SEVERAL." / "THOSE WERE FIRST DRAFTS, BOY. ALLOW ME TO INTRODUCE... MY MASTERPIECE!"

- **Attacks**, each with a tell that's the same on every difficulty: **leap** (a crouch, a target where it will land, shockwaves both ways on landing), **tongue** (it rears back, the aim line locks, then the tongue lashes out), **spit** (the throat swells, then three globs arc out in a spread), **flop** (it rises and tracks you, locks, and belly-flops). In phase 2 (60%) it **grows** and Animo's Transmodulator **zaps up mutant helpers** every few attacks; at 25% it frenzies (shorter rests).
- **Its hide soaks most of a plain hit (45%)**, so fireball spam alone is slow. Switching pays: **fire on the swollen throat pops it** (a stun, big damage), **a Four Arms smash on the outstretched tongue yanks it face-first**, **slime on its feet gums it to the floor** (it takes 1.5x), **the recovery after a leap** is XLR8's window, and **hits from above land on Animo too** (Wildmutt's pounce). Any alien can still win; damage rules are pure functions with tests (`entities/bosses/frog/rules.ts`).
- **The arena** (Animo's lab) has scaffolds for the aliens and a low ledge in each corner for human Ben, and the frog's body always leaves a gap at each wall, so between transformations Ben can dodge and climb instead of being pinned.
- Defeated: CROAKED!, slow motion, the frog shrinks back to an ordinary bullfrog (RIBBIT?) and Animo tumbles off, out cold.

## Act 1 ending

After Chapter 3's first clear, CONTINUE on Chapter Complete goes to the **Act 1 ending** (`scenes/ActEndScene.ts`, timings in `config/actEnd.ts`) instead of Chapter Select:

1. **MEANWHILE...** on black.
2. **A dark arcade.** Five cabinets glow; a kid in a two-tone shirt plays one, back to the camera. His captions, signed "???": "A KID WITH A WATCH THAT TURNS HIM INTO MONSTERS..." / "...AND HE GETS TO BE THE HERO?" He grabs the cabinet: the power crawls up his arm as bolts, and the cabinets die one by one. "I GOTTA MEET THIS GUY." He turns to the camera: eyes glowing.
3. **KEVIN 11** smashes onto the screen with **ACT 2: RIVALS AND HUNTERS**.
4. **ACT 1 COMPLETE:** a stamp, a fanfare, confetti, the five aliens flying in one by one, and every Act 1 chapter's best time, cards and rank. CONTINUE goes to Chapter Select.

Any key skips a beat (with a short grace so a held button doesn't skip everything). It plays only on the first clear.

## Collectibles and secrets

- **Seven Sumo Slammers cards in Chapter 3:** the roof (rocket jump), the dinosaur egg under the glass (Four Arms' meteor drop from the balcony), the bear's plinth, the plinth in the dark (Wildmutt's senses), the whale's ribs (Stinkfly), and two for Act 2 aliens: the vent (Grey Matter) and the bottom of the mutagen vat (Ripjaws). Six Mr. Smoothy cups.
- **Chapter 2's Stinkfly sign opens:** with Stinkfly on the dial, Road Trip shows SECRET WAITING! on Chapter Select and the pole sign's card is reachable.
- **Wildmutt's senses open a secret in Chapter 1:** a den under the forest floor near the cliff ("SOMETHING SMELLS FUNNY UNDER HERE...") hides a fifth Camp Crash card behind a hidden hatch. Chapter 1 now has 5 cards.
- Hidden doors look exactly like the terrain around them (they're autotiled as the wall they're set into), so nothing gives them away but Wildmutt.
- SECRET WAITING! now shows only on chapters already cleared (it's about going back), so a mid-chapter save with a new alien doesn't flag the chapter being played.
- Chapter Select gets a Dr. Animo diorama: the museum under the moon, mutagen glowing from its doors, bats crossing the moon, and KING CROAK with Animo on its head squaring up to Ben.

## Omnitrix radial dial (approved idea)

- **Touch:** long-press the Omnitrix button (300 ms) and the dial fans out into an arc of alien faces around it; slide onto one and let go to transform (or swap) straight into it. Let go in the middle to cancel. A quick swipe still turns the dial one step. Geometry in `config/touch.ts` (`radial`), slot maths in `ui/RadialPicker.ts` (`radialSlot`, unit tested).
- **Desktop:** number keys **1 to 5** (and the numpad) select an alien directly; Q/E still turn the dial. Prompts name both ({DIAL}: `[Q]/[E]/[1-5]` or SWIPE/HOLD THE OMNITRIX).

## Approved extras (built after Chapter 3)

- **Achievements** (19, `config/achievements.ts`): counters that add up per file across runs (PYROMANIAC: 100 enemies by fire, DEFLECTOR, SMOOTHIE ADDICT, PERFECTIONIST, ROLL WITH IT, THE NOSE KNOWS, POUNCE!, STICKY SITUATION, CARD SHARK, WRONG ALIEN, RIGHT TIME) and one-off moments (STEE-RIKE!: 3 bowled by one throw, FULL OMNITRIX: 5 forms in one combo, SPEED DEMON: beat par, UNTOUCHABLE: a no-hit boss, NO SWEAT, HARD AS NAILS, THE SUMMER BEGINS: finish Act 1, OMNITRIX MASTER). An ACHIEVEMENT UNLOCKED toast slides in under the HUD's dial (and on Chapter Complete and ACT 1 COMPLETE). Only the story counts; Training doesn't (it spawns endless enemies). Counters are written to the file at checkpoints and at the end, unlocks at once.
- **EXTRAS** on the title (once a file exists), for the Continue file, three pages (Q/E or tap the tabs, swipe on touch):
  - **ACHIEVEMENTS:** all 19 with progress bars (37/100); the Act 1 one stays ??? until earned.
  - **CARD ALBUM:** every chapter's Sumo Slammers in a row, each card drawn in code (a wrestler in the card's colour over a sunburst; holo cards, the ones behind an alien, get a gold frame and a sweeping rainbow sheen). Select one for its name, number and flavour text ("KAMIKAZE KOJI: HIS SIGNATURE MOVE: FALLING ON YOU FROM VERY HIGH UP."); a missing card says which chapter hides it and which alien it needs, or that the file can reach it now. Names and flavour text in `levels/cards.ts`; a test checks every card in every level has one.
  - **JOKES FOUND:** the misfire log. Every reaction line, grouped by the alien Ben got (40 with five aliens), each with who he wanted; unheard ones stay ? ? ?. Built from the aliens' own misfire lines (`aliens/jokes.ts`), so it grows with the roster.
- **Splits review on Chapter Complete:** [S] SPLITS (a button on touch) on a timed run: every split's time, its delta against the previous best (green ahead, red behind), each segment with a gold star where it beat its best ever, and the **sum of best** with the possible time save. Segments are saved per difficulty (save version 4).
- **Omnitrix Master gold medal:** S on Easy, Normal and Hard turns the chapter's card gold on Chapter Select (gold frame and a glint), stamps OMNITRIX MASTER! on the results (with a fanfare the first time) and goes in the share line.
- **Ghost of your best run:** every timed run records Ben's position and pose 10 times a second (a checkpoint restart carries on the same recording); a new best time saves it as that file's ghost for the chapter and difficulty. Next time, a see-through blue Ben (or whichever alien you were) marked BEST races you on the same run clock and fades where that run ended. About 4 bytes a sample, kept in its own localStorage key (at most 9 ghosts, the oldest dropped first; erasing or replacing a file drops its ghosts). Settings: GHOST ON/OFF.

## Scripted playtests and what they caught

Chapter 3 was played by a script in headless Chromium (title > Chapter Select > the whole chapter > Chapter Complete > the Act 1 ending), on desktop (1280x720) and an emulated wide phone (844x390). The script plays the intended route: Heatblast and Four Arms through the halls, Wildmutt's climb and the hidden door, Stinkfly perch to perch over the tar, all five LOCKDOWN locks with swaps, and KING CROAK with Heatblast and Four Arms (misfires included on Hard).

| Run | Result |
|---|---|
| Easy, desktop | Title to ACT 1 COMPLETE, no deaths, no errors |
| Easy, wide phone | Title to ACT 1 COMPLETE, no deaths, no errors |
| Normal, desktop | Title to Chapter Complete, no deaths; the SPLITS review listed 8 splits, and PLAY AGAIN raced the ghost the run had just saved |
| Normal, wide phone | Title to ACT 1 COMPLETE, no deaths, no errors |
| Hard, desktop | Title to ACT 1 COMPLETE, no deaths, no errors (waiting out 15 s cooldowns between locks) |
| Hard, wide phone | Title to ACT 1 COMPLETE, no deaths; two real misfires, one mid-boss |
| **Normal, desktop, damage ON** | Title to ACT 1 COMPLETE, **no deaths** after the fixes below: down to 3 hearts in the Hall of Mammals and the Night Gallery (rats, the brute), back to full on smoothies by the atrium, untouched through LOCKDOWN, 2 hits taken at KING CROAK. Before the fixes, the same run died at the lab entrance (sent back to LOCKDOWN) and over and over at the frog |
| Hard, KING CROAK, damage ON | The same bot can't beat it: it gets the frog to phase 2 (about 85 of 150) as Heatblast, then dies as human Ben during the 15 s cooldown, in three hits: a tongue lash (3 on Hard), a spit glob and the frog's body. Every hit comes after a tell, but Hard leaves little room for a misread (MAKE IT EASIER is offered after 4 deaths) |
| Chapter 1 regression, Normal, desktop and wide phone | Title to Chapter Select: camp, the pod, the tunnel, the rocket-jump cliff, the ravine pillar to pillar as human Ben, the jammer, the nest and the Hunter-Killer; no deaths, no errors |
| Chapter 2 regression, Normal, desktop | Title to Chapter Complete through the chase and ROADBREAKER, no errors |

All runs but the damage-ON ones play with damage off (`?god=1`) to check that everything can be completed; the damage-ON runs check difficulty, with a bot that fights and dodges (on Hard it also rolls as human Ben) but never aims for weak points.

What the runs caught, all fixed:

- **The vat pit's far ledge** sat one row above a straight Stinkfly hover from the vent, so a flight that should land clipped the ledge's face and dropped into the mutagen. It's now one row below the vent.
- **Replaying the atrium** (any file that already has Stinkfly, or a restart at ATRIUM) collapsed the bridge under human Ben with a quarter of a second to switch: an unavoidable fall into the tar. The watch now catches him as Stinkfly every time.
- **Dying in Animo's lab sent Ben back to LOCKDOWN:** the lab's checkpoint was a few tiles past where he drops in from the vat pit, with a lurker and rats already on him (often as human Ben, the watch spent on the locks). The checkpoint now lights the moment he lands, and the lurker sits further in.
- **Human Ben had no way out of a corner in KING CROAK's arena:** the side scaffolds were 6 tiles up (he jumps under 4), so between transformations the frog could pin him against a wall. A low ledge in each corner (3 up) lets him hop out and climb to the scaffolds.
- **KING CROAK's belly flop** did 3 damage, more than anything in Chapter 2; with damage on, two misread attacks could end a Normal run. Now 2: the frog is harder through its hide and tempo instead.
- **The LOCKDOWN wall** announced SECRET VAULT! (the vault banner). Cracked walls can now say what they are: LOCK BUSTED! THREE DOWN, TWO TO GO.
- **Setting off a stink cloud** with fire did damage with no feedback at all. It now goes up in a fireball (FOOMP!, or KA-BOOM! for two or more).
- **Gumming a mutant never completed Stinkfly's gum tip** (the action was never reported). Fixed.
- **SECRET WAITING!** showed on a chapter not yet cleared (a mid-chapter save with a new alien). Only cleared chapters show it now.
- **Achievement toasts** were off the left edge on wide phones; the splits panel let the results show through. Both fixed.

Lessons for the scripts themselves: headless Chromium runs the game at a third to a half of real speed, so key holds are short in game time (a held jump becomes a hop) and cooldowns take two to three times longer in wall time. The scripts now hold jumps longer, wait out cooldowns, retry the shaft from the floor, and rake through the vent.

## How to test (at the time)

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
