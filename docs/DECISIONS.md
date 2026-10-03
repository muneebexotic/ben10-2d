# Decisions and deviations

Every decision that departs from `docs/GAME_DESIGN.md`, or fills a gap it leaves, with the reason. Read this file every session: these still apply unless a later entry replaces them. Add new entries under the milestone or session that made them.

**Milestone 1 and the Chapter 1 polish pass**

- **Phaser 4 instead of Phaser 3**, at the owner's request (CLAUDE.md updated).
- **Minimal pause, game over and title menus** were built in Milestone 1 because Esc is in the controls table and a vertical slice needs a way to restart. Milestone 3 turned them into the full loop.
- **Mobile controls were pulled forward** from Milestone 6 at the owner's request: shared links get opened on phones.
- **A floating stick instead of a D-pad:** it supports aiming up and dropping through platforms without extra buttons and never "misses" a thumb. Sideways wins near the horizon so running never accidentally aims or drops.
- **Perfect transforms also add +3 s of alien time** and a small score bonus, so mastering them pays off over a whole run. The first (tutorial) transform can't be perfect.
- **The Vilgax hologram plays once per run** so boss retries go straight to the fight.
- **Practice runs** (started mid-level with `?start=`) never save best times or splits.
- **The Four Arms vault is next to the cliff checkpoint,** where every player pauses (often waiting for the Omnitrix to recharge), so nearly everyone sees the tease.
- **Pod crater:** the pod's crater is a flat scorch decal, not a pit, so nothing blocks the walk to the first transform.
- **Placeholder art is procedural pixel art,** not flat shapes. It is still swappable from the single map in `scenes/preload/assetKeys.ts`: add a `url` with the same frame size and order.

**Milestone 2**

- **"One new file per alien" became one folder per alien plus a config file and a registry line.** A whole alien (moves, sprite sheet, sounds, music) in one file would run to 700+ lines, against "small focused files", and CLAUDE.md wants every tunable in `config/`. Nothing outside those three places changes when an alien is added (Heatblast, XLR8 and Four Arms prove it).
- **The Omnitrix swap is new** (not in GAME_DESIGN.md). The design's loop is transform → timer → cooldown, which on its own means one alien per transformation and makes switching a menu choice. Swapping mid-transformation costs 3 s of alien time, so the timer and cooldown still drive the loop, but switching becomes a skill: each alien arrives with an attack, perfect swaps exist, and tag-team combos refund half the cost. The swap can be turned off in `config/omnitrix.ts` (`SWAP.enabled`).
- **Tag-team combos** (refund 1.5 s per new form in a combo) also count human Ben, so "punch, then transform" is the first tag anyone does. Each form joins a combo once, so it can't be farmed: two swaps cost 6 s and refund at most 4.5 s.
- **Story unlocks are unchanged:** XLR8 and Four Arms unlock in Chapter 2 (`unlockChapter: 2`). Training lends them; `?aliens=` adds them to a practice run.
- **Training never rolls wrong transforms,** whatever the difficulty, because it is for practising a specific alien.
- **XLR8's "small gaps"** are crossed with long coyote time and the dash, not by running on air: it keeps gap design readable (a gap is a gap) while XLR8 still clears ones nobody else can.
- **Four Arms throws "stunned enemies" through a new downed state:** knockdown hits ground a drone for a moment (it takes 1.25× damage there and can be lifted), then it reboots. The same mechanic gives slams and the haymaker a purpose against every drone type.
- **The Armored Drone takes 15% from non-smash hits** rather than 0%, so a player without Four Arms is never fully stuck; it is just slow.
- **The Hornet ignores aim assist** and kites, so fireball spam doesn't beat it; XLR8's strikes and dash can't be dodged.
- **The vault card counts toward Chapter 1's total right away** (4 cards), as requested, and shows as a faded slot until Four Arms is on the dial. The title screen's card count for Chapter 1 now reads x/4 for everyone.
- **The active ring on the dial stays Omnitrix green** for every alien, so the timer reads the same whoever is out; the alien's colour goes on the icon, glow and shield bar.

**Milestone 3**

- **Swaps misfire at half the chance** (the owner's preference), and never into the current alien. Swaps were added in Milestone 2; the design table only covers transforms.
- **A misfire comes with two outs:** a half-price, misfire-proof fix swap, or +2 s for the first KO as the wrong alien. Without them, 25% on Hard is pure punishment; with them every misfire is a split-second decision, and "got the wrong alien and still clutched it" is the clip.
- **Misfires stay quiet in the opening moments:** never on a run's first transform, in the intro, or during a boss entrance. These are the "forced story moments"; Chapter 5's scripted misfire will bypass the rule on purpose.
- **The HUD hides a misfire until the reveal** (it shows the alien Ben picked during the wind-up), because the joke is the surprise.
- **Hard keeps telegraph lengths the same** and changes pacing instead (rest between attacks, wake-up grace, punish windows, boss rage threshold). Shorter telegraphs would make Hard unfair rather than hard.
- **Difficulty belongs to the save file,** and Settings changes the file being played (or, from the title, the Continue file). A run that changes difficulty is a clear but not a timed run, so every best time was earned on one difficulty.
- **Old saves become File 1 on Normal,** since Normal was the only difficulty before.
- **Continue resumes mid-chapter** at the last checkpoint with the run so far (time included), the same as a checkpoint restart. Not asked for, but a browser game gets closed mid-level all the time.
- **Chapter Select tease:** chapter names stay "? ? ?" until the chapter before is done (only Road Trip shows after Chapter 1), so the story isn't spoiled; the silhouettes and one-liners do the teasing.
- **Way Big is cropped** by his card on purpose.
- **Play time** counts time spent in levels (menus don't count).

**Milestone 4, part 1 (Chapter 2)**

- **The "Rustbucket driving segment" is a ride on the roof**, not Ben driving: Max drives (he's ten), Ben fights on the roof. The owner asked for "a driving/riding section that changes pace"; riding keeps every alien's moveset in play and lets the convoy and Four Arms' unlock happen on it. The opening is a short driving cinematic.
- **The runaway truck is the rig the convoy escorts.** The chase ends with it crashing at the truck stop, and its drone core becomes ROADBREAKER, so the set piece leads into the boss.
- **ROADBREAKER isn't in GAME_DESIGN.md** (Chapter 2 had no boss). It's a Vilgax machine like Chapter 1's, keeping the Vilgax thread (his hologram returns, with his portrait). It transforms at a fixed 55% on every difficulty (the transformation is a story beat), while rests and punish windows follow the difficulty.
- **Max and Gwen appear as portrait dialogue only.** Gwen's spells and support are Milestone 5; the owner asked for light dialogue with portraits here.
- **XLR8 unlocks before Four Arms** (the river comes first); both unlock in this chapter as the design says.
- **Treadmill instead of a moving camera** for every vehicle scene: the RV and trucks stay put and the world scrolls. It keeps physics, hitboxes and the roof platform simple and stable at 60 fps.
- **A thrown truck (or boss) does at least 20 damage** to whatever it lands on (`Liftable.impactDamage`), and a thrown object no longer hits itself with its own landing blast.
- **The convoy's armour takes 30% from non-smash** and ROADBREAKER's truck 20%: Heatblast can still chip them (never stuck), Four Arms is the fast answer.
- **Cards behind an alien a chapter unlocks spawn from the start** (the Chapter 2 vault card is there before Four Arms is), and they count toward the chapter's total like Chapter 1's vault.
- **Chapter 2's par time is 7:00** (Chapter 1's is shorter): it's a longer chapter.

**Milestone 4, part 2 (Chapter 3)**

- **How the Tennysons end up at the museum:** Max wants its famous night tour, finds it closed, and the paper's story about a fired scientist plus a glowing side door does the rest. A night guard running out with mutant rats behind him starts the chapter, so nobody has to break in.
- **The boss is the giant mutant frog** (KING CROAK), with Animo riding its head so the villain is in the fight, not just introducing it. "Hits from above land on Animo too" makes Wildmutt's pounce and Stinkfly's height part of the switching.
- **Wildmutt's senses are passive:** hidden doors open after a moment within his sense range and lurkers show inside it. No extra button to learn, and the pulse rings show the range. A banner (HIDDEN PATH!) makes sure a door opening is never missed.
- **Wildmutt can't talk** (as in the show): his speech bubbles and dialogue lines are growls with a subtitle.
- **Stinkfly unlocks mid-fall** over the tar pits, the watch catching Ben in the air, and holds him there until the player flaps: the first flight is the lesson.
- **Stinkfly's slime does more than slow:** three quick globs gum an enemy in place (two for a bat), and fire sets off his stink clouds. Both give him a reason to be on the dial in a fight, not only for flying.
- **Mutants reuse the drone framework** (walker brains with ground physics, notices and patrols) instead of a second enemy system, so Training, telegraphs, slow and stun states, Four Arms' lift and the bowling throws all work on them.
- **LOCKDOWN's order is fixed** (Heatblast, XLR8, Four Arms, Wildmutt, Stinkfly) so each lock teaches its alien in turn and the swap timing is the skill; the reachability test proves each lock needs its alien.
- **Two Chapter 3 cards need Act 2 aliens** (Grey Matter, Ripjaws). They count toward the chapter's 7 like earlier "come back later" cards, and their silhouettes and lines say who to bring.
- **The Act 1 ending plays after the results,** on CONTINUE, so the chapter's own payoff (rank, time, cards) isn't cut off, and only on the first clear.
- **The radial dial fans out up and to the left** of the Omnitrix button (115° to 255°) so every slot stays on screen and clear of the right thumb's other buttons; a 300 ms hold opens it, so a quick swipe still turns the dial.
- **Number keys select, T transforms** (the same as Q/E), so a number never transforms by accident mid-fight.
- **Chapter 3's par time is 9:00**: it's the longest chapter.
- **Chapter 2 on Hard keeps CONVOY and ROADBREAKER checkpoints** (playtest feedback).
- **Achievements count only in the story** (Training spawns endless enemies and freezes timers); misfire jokes count anywhere, so Training's CHAOS setting is the way to fill JOKES FOUND.
- **Only a run from the chapter's start can become a ghost** (a checkpoint restart carries the recording on; a run picked up with Continue after closing the game can't, since its start wasn't recorded). A ghost is saved only on a new best time, and it races only timed runs.
- **Ghosts live outside the save** (their own localStorage key, at most 9) so a full ghost store can never stop the game from saving progress.
- **Cards and jokes count from the file itself** for CARD SHARK and WRONG ALIEN, RIGHT TIME, so files from before achievements existed get credit for what they already found (the first new card or joke unlocks them).
