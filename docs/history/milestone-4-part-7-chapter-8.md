# Milestone 4 part 7: Chapter 8, Cacklejack

Act 3's second chapter, in the HD cartoon look: Driftwood Bay's boardwalk at night and CACKLEJACK'S CIRCUS OF FRIGHTS on its pier. Built in one session (2026-11-22/23), held out of release builds (`CH8_BUILT`) until the owner's go-ahead, and released on 2026-11-28 with the owner's drawings worked through every beat (the last section).

Chapter 8's new characters are original designs (DECISIONS.md, "Act 3 / Chapter 8"): CACKLEJACK, IRONJAW, THE TANGLE, RICOCHET and the goons. The family and the older aliens play the owner's drawings as in Chapter 7.

## What was built

**Ricochet** (`aliens/ricochet/`, numbers in `config/aliens/ricochet.ts`, HD rig `scenes/preload/cartoon/characters/ricochet.ts`). J: shell bashes (every third a SHELL SLAM). K: curl up and roll: speed builds slowly and keeps (`rollMotor.ts`), fast rolls hurt and smash (cracked walls, break-away walls), walls send him back (BONK!), Jump bounces, landings bounce, Jump right as he lands is a PERFECT BOUNCE (three in a row is the top: PERFECT BOUNCE achievement), J rolling is a SPIN BOOST, Down in the air a SHELL DROP (breaks museum skylights from high enough), swap-in rolls in bowling. Heavy: sinks and rolls along the bottom. Pixel sheet (for the pixel chapters, Training and ALIEN FILES), back view for THE DEEP DIVE, icons, sounds, a bouncing music layer, the BOUNCE name slam (letters ricochet in from the screen's edges), misfire lines both ways with every alien, ALIEN FILES demos.

**The level** (`levels/chapter8.ts`, decor `levels/chapter8Decor.ts`): 424 x 46 tiles. The boardwalk (the cold open), the midway (booths, the carousel and its roof card, the high striker, Cacklejack's stage), the funhouse (its clown-face front, Gwen taken, the spinning barrel), the rolling course (a kicker to a high ledge, three pinball bumpers, a bounce pad, a break-away wall, the loop with a card at its crown), the mirror maze (lit doors, lying mirrors, glass, reflections that step out, the shaft of angled mirrors up to the heart, a card behind a lying mirror), backstage (wagons, the shooting gallery's card behind Upgrade's shutter, the rigging up to the big top's high door), and the big top (CACKLEJACK). Seven cards (album 53-59), nine checkpoints (two hidden, the boss's stages).

**HD art** (`scenes/preload/cartoon/circus/`): the circus tileset (boardwalk planks over the pier's underside; checks over harlequin walls indoors), the night (sky and moon, the sea with its lighthouse sweeping a beam, the town, fog), every prop (`circusArt.ts`) and the backdrop (`scenes/level/circus/CircusBackdrop.ts`). The presentation (`circus/presentation.ts`) is Chapter 7's (the owner's HUD icons, props and family portraits) plus Chapter 8's own HD twins (the break-away wall, the prize shutter and its padlock) and portraits painted from the rigs for CACKLEJACK, IRONJAW, THE TANGLE and the whisper in the watch.

**The funhouse's toys** (`scenes/level/circus/CircusSystems.ts`, numbers in `config/circus.ts`): bounce pads (a ball goes 25% higher), bumpers (a DING and a kick; PINBALL WIZARD for 20 as Ricochet), kickers, the loop (a ball fast enough goes round it), angled mirrors (a ball fired off at a right angle; the shaft's is a pneumatic tube), maze mirrors with live reflections of whatever form Ben is (THROUGH THE LOOKING GLASS for every lying one), the high striker, fear gas.

**Enemies** (`entities/enemies/circus/`, rigs `characters/circus/goons.ts`): grinners (a pie on a red arc), jack-in-the-boxes (the tune speeds up, a glove springs along a red lane; hit it while it winds and it jams), balloon hounds (stretch, swoop along a red line, pop into fear gas), stilt walkers (a sweeping kick; low hits or a roll take out the stilts: TIMBER!), and the maze's reflections (they copy Ben's attacks a beat later; Ben's own rig, tinted).

**Story** (`scenes/level/circus/story/`): the cold open (the family walks onto the boardwalk past the grey, drained townsfolk), Cacklejack's show (he drinks a scream out of the crowd; IRONJAW carries Max off), THE TANGLE pulling Gwen into a mirror, the spinning barrel (doors slam, spiked walls close in, NEW DNA, Ricochet smashes out), the heart (Gwen in the mirror; three hits shatter it), and music that turns as Ben goes indoors and out.

**CACKLEJACK** (`entities/bosses/cacklejack/`, numbers `config/cacklejack.ts`, rigs `characters/circus/stars.ts`): FEAR GAS (pies on red arcs, a pogo hop onto a red ring with shockwaves, fear gas on Ben's spot, jack-in-the-boxes; after every trick he bows: double damage), THE HIGH WIRE (he swings overhead dropping pies; IRONJAW stomps and throws kettlebells, THE TANGLE reaches down from her trapeze; knock one down and he falls into the ring), THE BIG HEAD (a balloon of his face that grows to fill the ring, its grin opening on a beat after a red quiver; the valve in its throat is the target; a ball rolled in bounces round inside: PINBALL!, and STANDING OVATION if that pops it). Then Max's cage drops into the net, and Cacklejack's last laugh turns Ben into Ghostfreak for a breath, on its own ("SOON."): the hook into Chapter 9.

**Shared changes:** ball gates (`rollGate`) and Chapter 5's mine-cart loop opening for Ricochet; the reachability model knows bounce pads, kickers, the loop, angled mirrors, maze mirrors and ball gates; a resumed boss's bar starts at its real health (Chapter 7's DEEPMAW too); a `punch` hook in the drone world for close-range blows; the pie and kettlebell projectiles; Ricochet's three player-handle additions.

## How it was tested

- `npm run typecheck`, `npm run build`, `npm test` (604 tests: `tests/chapter8.test.ts` (layout, story order, the barrel and heart walls, the arena, the manifest, every checkpoint and card reachable, Ricochet alone reaching the big top, the loop card a ball's), `tests/ricochet.test.ts` (the roll's speed, ricochets, damage, bounces and perfect chains, the shell drop, misfire lines, Chapter 5's loop), CACKLEJACK's stage, bow, trick and grin rules).
- Playtested in headless Chromium (about a third of real speed): the opening, the show, the barrel and the unlock beat, the shaft up to the heart, every boss stage from its checkpoint and the defeat into the outro. Bugs found and fixed on the way: every set piece thought play had resumed past it (the level hands the resume point over in pixels, the pieces compared tiles); the shaft's launch was clipped by the body's speed cap (now a tube); fear gas asked for frame -1 as it ran out; the hound and stilt walker lacked the idle animation the Drone plays on spawn; the funhouse's face hung over the room (now a solid block it covers); the boss bar showed full on a stage retry.
- A review pass for logic bugs (not looks) found and fixed:
  - On a 120 Hz screen the loop could take a ball straight back in the frame after letting it go. Its foot now waits `TOYS.loopCooldownMs`.
  - A jack-in-the-box or stilt walker hit mid-attack never hurt Ben again: the blow's "already landed" flag stayed set through the stun. It's now reset on each attack and on recovery.
  - A big hit could skip CACKLEJACK straight past a stage (from the stage to the big head, missing the high wire and its set-up). Stages now advance one at a time.
  - In a release build (Chapter 8 hidden), its four achievements still counted toward the list, so 100% couldn't be reached. They stay off the list until the chapter ships.
  - A ball gate's speed check read a fixed per-frame decay. It now goes through `Pacing.damp`, so it breaks the same at 60 and 120 Hz.
  - Leftover literals in the toys, goons, barrel and Ricochet moved to config.
  - Shared code (already on main): the level built a ghost sample (an array of the roster and an object) every frame, though the recorder keeps one every 100 ms. It's now built only when one is due (`GhostRecorder.due`).
- `npm run qa -- --fuzz`: 87 checkpoints and boss fights (Chapter 8's ten checkpoints and CACKLEJACK through all three stages), 0 failures, 0 page errors.
- `npm run bench`: see PERFORMANCE.md, "Chapter 8 check".

## How to test it

1. `npm run dev`, Chapter Select: CACKLEJACK > PLAY (the dev server opens it whatever the save says). Sections on their own: `?level=ch8&start=<checkpoint>` (`cp-midway`, `cp-barrel`, `cp-loop`, `cp-maze`, `cp-heart` (Easy), `cp-backstage`, `cp-bigtop`, `cp-highwire`, `cp-bighead`).
2. **The opening and the show:** a fresh start walks onto the boardwalk; walk up to the stage.
3. **The barrel:** walk in; the doors slam, the watch finds Ricochet; he smashes out.
4. **The rolling course:** roll fast at the kicker, the bumpers, the loop (its crown card), the break-away wall.
5. **The maze:** stand by a pink-edged mirror (it lights and opens); walk through the reflections that move wrong; roll into the angled mirror at the end (the tube up to the heart); free Gwen.
6. **Backstage:** Upgrade into the gallery's shutter for its card; climb the rigging.
7. **CACKLEJACK:** hit him while he bows; knock down IRONJAW or THE TANGLE to drop him off the wire; roll Ricochet into the big head's open grin.
8. **Ricochet elsewhere:** `?level=ch5&start=cp-tunnels&aliens=ricochet`: the shell plates in tunnel 3's ceiling (a perfect bounce under them) and the loop's card.

## What's left

- The owner's recordings for `midway`, `bigtop` and `cacklejack`; the owner's drawings for Chapter 8's cast, if wanted (ART_COVERAGE.md).
- Tuning with real players: CACKLEJACK's health and windows (`config/cacklejack.ts`), the roll's feel (`config/aliens/ricochet.ts`), the toys (`config/circus.ts`).
- Chapter 7's chute and Chapter 6's heavy-door corridor for Ricochet (IDEAS.md).

## Release: the owner's drawings, beat by beat (2026-11-28)

The owner asked for Chapter 8 to use the drawings the game already has (Ben, Gwen, Max, Kevin and the rest) and then to ship. The family and the older aliens already played their drawings frame by frame and spoke with the owner's portraits; going through every beat on screen found where they didn't, and some bugs on the way.

- **Story poses on the lines** (`Line.pose`, `Talkers`): Gwen points at the grey townsfolk and folds her arms ("THAT IS NOT A PLAN"), Ben cheers and shrugs, Max thinks; at the show Max's arm goes out ("GET BEHIND ME", a new `guard` clip on his story sheet's last drawing) and Ben points at IRONJAW; at the heart Gwen folds her arms and points; in the ending Gwen points and gasps, Ben shrugs, stares at his watch (`lookHands`), and Max goes quiet in his worried drawing. Ben poses only where a line names it and a cutscene holds him (`Player.storyPose`).
- **Max:** waits in his cage over the ring with his arms folded and cheers each time a stage falls; Gwen in the heart's glass bangs on it with her fists clenched (her angry drawing) between her surprised one.
- **Kevin** watches the show from the crowd in his own drawings (smirking, then laughing at the scream) and slips away when Ben looks away (DECISIONS.md). His drawings now load with the chapter.
- **The ending, restaged on its lines** (`Line.cue`): the safety net unfurls and Max's cage drops into it on his "NICE NET" line, bursts open, and Max laughs, hops out and walks to the family; Cacklejack's last laugh on his line; the Ghostfreak flicker (Ghostfreak's own drawing over Ben, the dial jumping) on Ben's "WAIT. WHAT IS THE WATCH DOING?!". The camera holds the whole ring.

Bugs found and fixed:

- **Max never moved before the show.** Nothing updated the story's Max between the opening and the show, so his sprite stayed where the opening placed it: he walked on the spot at the left edge of the boardwalk through the opening's talk and was missing at the stage, then popped onto IRONJAW's head. The show now updates him; and a player who runs ahead sees him hurry over before his line.
- **Max stayed in the air when his cage fell** (the tween moved his sprite, which his actor puts back every frame), and so missed the whole ending. Now he rides the cage down, lands in the net where it stops, and steps out.
- **The watch's Ghostfreak flicker fired a dozen seconds before the line about it**, during the boss's fall; it's now on that line.
- **The ending's last lines could be cut off** (every chapter): the results came on a fixed timer while the lines run on frame time, which a struggling phone clamps. Headless runs lost Ben's "RIGHT, GRANDPA?" and Max's "...". The results now wait for the last line (or twice its length if something cut it off).
- **Ben blinked through every chapter's ending** (the invulnerability after a win is now without the blink); **bounced on the spot through it** if the fight ended with him on a bounce pad; and **the Wildvine hint** popped up with Ben's quip over the ending when he stood under the pole. Hints and pads now wait for play.
- **A goon Ben ran past could hit him during the show** while it held him still; nothing hurts him while it does.
- A test now checks every pose a line names is a drawing its speaker has. It caught Max's arms-folded pose named after the drawing instead of the clip that plays it (his cage pose would have shown him just standing).

Tested: typecheck, build, 610 tests, the opening, the show (fresh start), the cage and the ending recorded line by line in headless Chromium, `npm run qa -- --fuzz` and `npm run bench` (PERFORMANCE.md, "Chapter 8 release").
