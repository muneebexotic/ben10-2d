# Milestone 4 part 5 and Milestone 5: Chapter 6, Magic (Karachi), and the end of Act 2

_The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`. The Chapter 6 plan, rewritten for Karachi, is in `docs/GAME_DESIGN.md`._

The owner's brief for the session: the approved fixes, the bundle split, then Chapter 6 as the Act 2 plan has it (with Milestone 5's Gwen and Max), moved to **Karachi, Pakistan**, at "peak capability". In capitals at the end: "MORE 3D, DIFFERENT CONCEPTS, UNIQUE ONES, CONCEPTS THAT ARE NOT TOUGH TO GRASP BUT MINDBLOWING, ANIMATIONS", Sumo Slammers cards (and drinks, and aliens) that stop the game to show themselves, and a screen with each alien's key presses and a looping bot demo per move, plus a place to try it.

**Real-player results (§0 of the brief) were not filled in**, so `config/kevin.ts`, `config/hunters.ts` and `config/bounty.ts` are untouched and Ghostfreak's hesitation stays a feature.

## Before the chapter

- **Approved fixes:** each chapter's opening waits for its CHAPTER card before the first line (BUGS.md C11); THE HUNTERS resumes at the stage you died in (a hidden checkpoint per stage: chamber, shaft, yard); Ghostfreak's diary in EXTRAS (the whispers he says while out, with the last line locked until Chapter 9). DEEP DIVE ATTACK stays in Milestone 7.
- **Each chapter's code is its own chunk** (`src/chapters/`, `ChapterModule`): level, story, bosses, backdrop, art, music, chapter-only enemies and scenes, loaded behind the level fade; Chapter Select prefetches the focused chapter and the title the Continue chapter; menus read a manifest checked against the level data. Boot to the title on Slow 4G at 4x CPU, median of five: cold 8528 to 6146 ms (-28%), warm 2054 to 1904 ms; JavaScript transferred on a cold boot 570 to 472 KB.

## Karachi

`levels/chapter6.ts` (524 x 64 tiles: the fair and the palace on row 30, the cellars and the tunnel on row 40, the tower top on row 12), set pieces in `scenes/level/story/magic/`, the boss in `entities/bosses/hex/`, foes in `entities/enemies/magic/`, the puzzle in `scenes/engine/`, the climb in `scenes/tower/`, art in `scenes/preload/karachi/`, music in `systems/audio/tracks/karachi.ts`. Tuning: `config/chapter6.ts`, `config/magic.ts`, `config/hexBoss.ts`, `config/tower.ts`, `config/gwen.ts`, `config/aliens/greymatter.ts`.

1. **Cold open:** Karachi Port at dusk, a crane swinging the Rustbucket off a cargo ship ("AN OLD NAVY FRIEND OWED ME A FAVOR. A BERTH ON A CARGO SHIP, NO QUESTIONS ASKED." / "WE SHIPPED AN RV ACROSS AN OCEAN AND NOBODY THINKS THAT IS WEIRD?"). Then Sea View at night: chai at Rauf's stall ("MAX SAHIB! TWENTY YEARS! CHAI PEE LO, BHAI! (HAVE SOME TEA!)"), THE GREAT HEXO's finale next to the ANCIENT WONDERS exhibition, the Charms of Bezel floating out to Hex, Charmcaster taking them for real, rocklings out of the tent, the balloon seller's balloons loose, and one Charm rolling to Gwen's feet, glowing for her. Skippable; never replayed on a retry or a continue.
2. **The fair:** bewitched kites dive-bombing (fire or a hit cuts the string), rocklings, the Ferris wheel turning over the stalls, a truck-art bus, a rickshaw and a chingchi, the kite seller, a camel and a horse ride. Rauf, Zain the fan kid ("BEN BHAI! IS IT REALLY YOU? DO THE FIRE GUY!") and Rafiq the rickshaw driver ("THE PINK PALACE? EVERYONE SAYS IT IS HAUNTED, YAAR." / "...YOU ARE GOING IN ANYWAY? SHABASH! CHALO, THE GATE IS THAT WAY!") each have a line, and another for some forms.
3. **The palace gate:** Max drives the Rustbucket through it (a short ramming cinematic; "I WILL PAY FOR IT LATER.").
4. **The great hall:** enchanted armour (a round shield in front: smash it or get behind), and Gwen's first spell, SHIELD, coming out of her when Hex's illusions open fire.
5. **The library wing:** floating books, gargoyles (stone and untouchable while perched, a lock-on and a dive once awake, stuck in the floor after a miss), and STUN.
6. **The cellars:** Hex's illusions (copies that pop on contact), a hidden door, a floor that isn't there and a bridge nobody can see, and REVEAL: a circle of true sight around Ben.
7. **Charmcaster's cage:** the bars slam down behind him and are too close for anything on the dial. NEW DNA: Grey Matter walks out between them.
8. **The tunnel toward Kharadar:** rocklings and a stone golem (a slam with a long tell, a rune to hit while it kneels), and Max catching up with a fire extinguisher ("GRANDPA, WHERE DID YOU LEARN THAT?" / "...THE NAVY."). A vent in the roof only Grey Matter fits into, with a card.
9. **The Spell Engine** (below), in the clockwork of the clock tower.
10. **THE TOWER WRAP** (below): up the outside of the tower after Hex.
11. **HEX AND CHARMCASTER** (below) on the tower top under the night sky, the port's cranes and the harbour lights, the lighthouse beam sweeping across.
12. **The outro** ("THE CHARMS ARE SAFE. AND THIS ONE... STILL WANTS TO STAY WITH ME." / "SHABASH, BACHAY! (WELL DONE, KIDS!) CHAI ON ME. RAUF IS STILL OPEN.") and, on a first clear, the Act 2 ending (below).

Checkpoints: SEA VIEW FAIR, GREAT HALL, THE LIBRARY, THE CELLARS and KHARADAR TUNNEL on Easy and Normal; PALACE GATE on Easy; THE CAGE, SPELL ENGINE, THE TOWER WRAP and the tower top on every difficulty, and the Engine's second half on Easy. Par time 12:00.

## Karachi in the game (every cultural detail used)

- **Places, each inspired by a real one, never a replica:** the Sea View / Clifton seafront fair; a pink sandstone palace with domes, arches and jharokha balconies (Mohatta Palace); a library wing with Gothic arches and a painted ceiling (Frere Hall); the palace's cellars and a tunnel under the old city toward Kharadar; a stone clock tower (Merewether Tower); Karachi Port with its cranes and container ships; Keamari harbour for the ending; the Manora lighthouse across the water, whose beam sweeps the boss fight; the Arabian Sea.
- **Monuments, respectfully:** Mazar-e-Quaid's white dome and a single-dome mosque appear only as distant skyline silhouettes, lit at night. Nothing is fought on them, nothing hits them, nothing can damage them. No real graveyards, tombs or shrines anywhere: the "catacombs" are cellars and a tunnel.
- **Street life:** a chai dhaba (Rauf's: RAUF CHAI and a CHAI KHANA sign), a bun kebab cart, a fresh juice stall (TAAZA JUICE), a balloon seller, a kite seller (PATANG HOUSE) and kites in the sky, camel and horse rides on the beach, a Ferris wheel, a hand-painted truck-art bus (SADDAR - KEAMARI), an auto-rickshaw, a chingchi, crows on the wires, the sea breeze, an evening crowd that cheers the show ("WAH!", "SHABASH!").
- **Mr. Smoothy has no branch in Karachi:** the health pickups are a glass of chai or of fresh juice, the same pickup.
- **People:** Rauf the chai-wala (Max's friend of twenty years), Rafiq the rickshaw driver, Zain the fan kid. Original characters with short warm lines.
- **Words:** light romanised Urdu, each word with one house spelling (`config/urdu.ts`): BHAI, YAAR, SHABASH, CHALO, CHAI, PEE LO, ACHA, JALDI, WAH, SAHIB, TAAZA, KHANA, PATANG, BACHAY, SHUKRIYA. Words that aren't clear from context carry the English in brackets; the string lint checks spellings and glosses. No Urdu script (DECISIONS.md).
- **Sound:** the fair's track has qawwali-style handclaps, a dhol and a harmonium-like lead; the palace's a sitar-like pluck over a drone; the boss a dhol and a driving lead (new drum and pluck voices in `Music.ts`).
- **Cards:** CAMEL RIDE KAMRAN (on a camel's saddle), TRUCK ART TARIQ (on the bus's roof), CHANDELIER CHANGEZ, BOOKWORM BILAL, TRAPDOOR TAIMUR, VENT VALI (Grey Matter's) and CISTERN SAMEER (waiting for gills).

## Gwen (Milestone 5)

Gwen walks with Ben from the cold open (`scenes/level/family/GwenCompanion.ts`): she follows his trail, throws a weak mana bolt now and then, and the player calls her spells, each with its own cooldown (`config/gwen.ts`):

- **SHIELD (G):** a bubble around Ben that blocks shots for 3 s.
- **STUN (Up+G):** a mana burst that stuns everything around Ben (it breaks a summon).
- **REVEAL (Down+G):** a circle of true sight: hidden doors, invisible enemies, Hex's fake floors vanish and hidden ones appear, the real Hex among his copies.
- Touch: a Gwen button with the Omnitrix's hold-for-radial picker. Her HUD portrait shows the three spells and their cooldowns.
- She learns them in play, one per section, and never blocks Ben's view, shots or the touch controls (she trails behind, draws behind him and fades out of the thumb zones). SPELLBOUND: 30 spells.
- **Settings: GWEN IN CHAPTERS 1-5** (off by default) brings her and the spells she knows into replays.

## Grey Matter

A Galvan, one tile tall (`src/aliens/greymatter/`): J bites (every third hops and chomps); K is ANALYZE, a scan that marks an enemy's or a boss's weak point for a few seconds, and any alien hits it for triple damage (analyse, then swap to Four Arms: BIG BRAIN for ten). Vents and gaps a tile high are doorways; he jumps five tiles. Swapping in, one look marks everything nearby. His name assembles itself letter by letter like an equation. He opens a secret in each of Chapters 3, 4 and 5 (below).

## The Spell Engine

Grey Matter crawls into the clockwork through a grille; Gwen holds the transformation open, so the Omnitrix timer stops: the puzzle is about thinking, not the clock (`scenes/engine/SpellEngineScene.ts`, rules in `scenes/engine/rules.ts`, tested).

1. **Mana pipes:** turn the pipes so the Charm's mana runs into the drain instead of the Engine (pink mana floods along as it connects).
2. **The gear train:** touching gears turn opposite ways; one spare gear and three empty slots. Two slots leave a chain that turns happily; the third closes a ring of three, and a ring of three can't turn: the train jams.
3. **The pendulum:** pull the lever as the bob crosses the green, three times; each pin makes the next window a little tighter and the swing a little quicker.

Keyboard and taps; readable on a phone; after 25 s stuck (14 s on Easy) a hint (the next pipe to turn, the slots that only make a chain, a wider window and a slower swing). Solved without a hint: THE ENGINE ROOM. Then the Engine jams, Hex appears in the gears, furious, and runs for the roof.

## THE TOWER WRAP (the 3D climb)

Out of the clock room's door and up the outside of the tower after Hex (`scenes/tower/`): ledges spiral three times around it and the tower **turns** as Ben runs, so the side he's on always faces the camera while the far side curves away and the skyline, the port's cranes, the moon and the lighthouse wheel past behind. The tower is 48 strips of stone, each squeezed and shaded by how far it faces away; ledges, merlons and clock faces are projected onto the same cylinder. Rocklings bowl down the spiral, gargoyles swoop in from behind the tower (hidden while behind it), the wind Charm throws gusts with a warning. Risers stop Ben, a missed gap lands on a catch ledge, and the climb ends on a long top step and a vault onto the parapet. Each form keeps a little of its own speed and spring.

## HEX AND CHARMCASTER (boss)

Three phases on the tower top (`entities/bosses/hex/HexBoss.ts`, `config/hexBoss.ts`):

1. **Charmcaster:** spell bags, summoned rocklings (STUN breaks the summon), a blink across the roof; Hex reads the Charms behind her.
2. **Hex with the staff:** each Charm of Bezel is a different attack with its own tell (fire, lightning, stone, wind), each used once before any repeats; Grey Matter's ANALYZE on Hex shows which Charm is next (NEXT: STONE), so the right alien can counter it.
3. **Both:** Hex splits into illusions, ward threads run from Charmcaster to every Hex (hit her to drop them), a cataclysm every third attack, rocklings up the stairs, and Max holding the stairs with the extinguisher.

Switching and Gwen's spells are rewarded, never required. The Charms fly out of Hex's hands as he falls.

## The end of Act 2

- **The harbour** (Keamari, later that night): Gwen keeps the Charm that chose her; a device in Max's jacket beeps three times; he walks to the water's edge to answer ("THIS IS TENNYSON." / "...MAGISTER, I'M RETIRED."); Ben sees a gold badge with a green light ("GRANDPA... WHAT'S THAT BADGE?" / "NAVY STUFF. EVERYBODY IN THE RV.").
- **MEANWHILE... deep under the Arabian Sea, off Karachi:** a sealed base on the sea floor powers up lamp by lamp, its screen types INCOMING SIGNAL / TENNYSON, MAX, then PLUMBERS flashes. Title: THE PLUMBERS, ACT 3: SECRETS.
- **ACT 2 COMPLETE** as an event: fireworks over the harbour, all nine aliens slamming one by one onto an Omnitrix dial, every chapter's best time counting up and its rank stamping on, the summer's total and cards, the RIVALS AND HUNTERS achievement, and a share line ("I finished ACT 2 of BEN 10: OMNITRIX SUMMER on Normal: 9 aliens on the dial, 30/45 Sumo Slammers cards, the whole summer so far in 48:17.40. Karachi's clock tower is still standing. Your turn!"), through the phone's share sheet or copied.

## Finds stop the game

- **A new Sumo Slammers card** pauses the level and flips over big in front of it, face down first: its name, number and story, and POWER / WEIGHT / SPEED on its back filling in pip by pip (fixed per card; a holo card maxes its best stat), with the album and chapter counts. Any key or tap goes back.
- **The first drink of each kind on a file** (a smoothie, chai, juice) does the same, smaller: what it is and what it does.
- Mid-cinematic finds keep the old banner; Training never pauses.

## ALIEN FILES

On the title screen: every alien's moves with the keys that do them, and a live demo window where a bot plays the selected move on a loop in the Training arena: the real game in a camera viewport behind the menu, with the bot's controls instead of the player's (`scenes/AlienFilesScene.ts`, demos in `config/alienFiles.ts`, one per line of each alien's `moves`). TRY IT starts Training as that alien. Aliens not on the file's Training dial are classified.

## Older chapters

- **Chapter 1's cameo:** Gwen and Grandpa Max at camp during the meteor opening (Max points at the sky, Gwen: "DON'T EVEN THINK ABOUT IT, BEN.", Max: "BACK BEFORE THE MARSHMALLOWS BURN!"), and the chapter's last word after the drone: "GREAT. NOW YOU'RE EVEN MORE ANNOYING." Chapter 1's alien hints now show (they never did: BUGS.md C24).
- **Grey Matter's secrets:** the museum wing's vent nook (Chapter 3, behind the hidden door Wildmutt's senses open: a swap combo), the claw machine's prize flap (Chapter 4) and the saloon's mouse hole (Chapter 5). Each card sits behind a gap a tile high; reachability tests check that only he gets in (BUGS.md C25).

## Achievements

SPELLBOUND (30 of Gwen's spells), BIG BRAIN (10 hits on weak points Grey Matter found), THE ENGINE ROOM (the Spell Engine without a hint), RIVALS AND HUNTERS (finish Act 2, secret).

## Performance

_Filled in below after the runs._

## Scripted playtests and what they caught

_Filled in below after the runs._

## How to test it

The short version is in `docs/PROGRESS.md` ("How to test the latest chapter").
