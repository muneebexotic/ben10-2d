# Milestone 2: alien framework, XLR8 and Four Arms

_Archived from `docs/PROGRESS.md` on 2026-10-03. The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`._

## Playtest notes

The owner's notes from real phones were "nothing to fix, all good", so no fixes were needed before starting.

## Alien framework

- **One folder per alien** (`src/aliens/<id>/`): `index.ts` (the `FormDefinition`: name, stats, theme, tips, quips, move list, reachability caps), `abilities.ts` (the moves), `art.ts` (its procedural sprite sheet, HUD icon and anims), `audio.ts` (transform sting, sound recipes, music layer). Its numbers live in `config/aliens/<id>.ts`. Adding an alien is that folder, its config file, and one line in `aliens/registry.ts`. Player, Omnitrix, HUD, touch controls, Preload, Gallery, the pause move list and the reachability tests all read the registry; none of them name an alien.
- **Abilities talk to the game through a narrow contract** (`aliens/types.ts`): `AbilityContext` gives them the player handle, controls, `combat` (melee, shots, blasts, ground waves, marks, lift/hurl), `fx` and `world` (water, solids). They never import scenes.
- **Heatblast was moved into this shape without changing how he plays** (same numbers, same feel; checked side by side against the Milestone 1 build). He gained an entrance move for swaps.
- **Each alien has its own:** colour theme (dial icon and glow, shield bar, name slam, touch buttons), name-slam style (`blaze`, `blur`, `quake`), transform sting, sound set, and a **music layer** that plays over the shared soundtrack's chords while he is out (Heatblast: the original hero layer; XLR8: a high, fast arp with sixteenth-note hi-hats; Four Arms: a low lead with brassy stabs and toms).
- **Unlocks** (`systems/Unlocks.ts`): the story dial holds every alien whose `unlockChapter` you have reached. Training lends XLR8 and Four Arms (`TRAINING.lentAliens`). Unit tested.

## The dial and the swap

- **Multiple aliens on the dial:** Q/E (or a swipe on the touch Omnitrix button) turns it. The selected alien's icon slides in, and for a moment a row of every alien on the dial shows under it with the selected one large, coloured and named. Dial cycling wraps and is unit tested.
- **Omnitrix swap (new mechanic):** while transformed, select a different alien and press transform to **swap straight into it**. A swap costs 3 s of alien time, needs 1.2 s since the last transform or swap, keeps the shield at the same percentage, and every alien **arrives with an entrance attack** (Heatblast: flame nova; XLR8: a dash that cuts through everything in front; Four Arms: a landing slam). Perfect timing works on swaps too. When a swap is possible, the dial's badge pulses in that alien's colour (the touch button reads SWAP!), and a denied swap says why (NOT ENOUGH TIME TO SWAP!, RECHARGING!). Logic in `systems/Omnitrix.ts`, tested in `tests/swap.test.ts`.
- **Tag-team combos:** every form that lands hits joins the live combo. When a new one joins, the combo counter lines up their icons, the label climbs TAG TEAM! / TRIPLE THREAT! / FULL OMNITRIX!, a chime plays and **1.5 s of alien time is refunded** (half a swap). Punch as Ben, transform, swap twice: four icons.

## XLR8 (fast, fragile, precise)

- **Blur strikes:** hold J for a 70 ms flurry; every 6th hit is a kick that knocks back. He keeps 85% of his speed while striking, and strikes in mid-air hang him in place for a moment.
- **Dash through:** K dashes 100 px in 160 ms, invulnerable, straight through enemies. Everything the dash passed gets cut a beat later ("X2 CUT!" for multiples). Up+K dashes diagonally up. Dashing through an enemy shot triggers **TOO SLOW!**: slow motion and the dash comes straight back.
- **Water and gaps:** above 55% of his run speed he runs across water (with a short grace if he slows), and a long coyote time lets him clear small gaps at speed.
- **Feel:** afterimages and speed lines above 75% speed, a wind loop that rises with speed, light-blue palette, small shield (4) so hits matter.

## Four Arms (slow, heavy, unstoppable)

- **Punch chain:** two heavy punches and a four-fisted haymaker that knocks drones out of the sky. Up+J is an overhead clap: anti-air that erases shots.
- **Ground slam:** K pounds the floor: a blast at his feet plus a shockwave each way that knocks drones down. In the air it becomes a **meteor drop** whose power scales with the fall height.
- **Lift and throw:** downed drones, boulders and the Training dummy can be lifted (J) and thrown (J; Up+J lobs). A thrown drone explodes on impact and hits everything nearby.
- **Smash damage** breaks the Chapter 1 vault wall and the Armored Drone's plating.
- **Feel:** slow run and big jump with heavy gravity, footsteps that nudge the camera, long hit-stop, ground cracks that linger, camera rumble on slams, super armour (hits barely move him), biggest shield (9).

## New enemies

- **Armored Drone:** heavy plating; anything but smash damage is chipped down to 15% ("ARMOR!"). Smash hits break the plating (6 armour HP), which knocks it out of the air and leaves it exposed for 3.6 s at 1.4× damage. It lobs arcing shells at a reticle that marks where they land, and telegraphs a ram. Four Arms' counter.
- **Hornet:** tiny and twitchy. It kites at a distance, sidesteps shots ("DODGED!"), and aim assist ignores it; it alternates a darting ram with a needle spread. XLR8's strikes and dash can't be dodged and he is faster, so he is its counter.
- **Downed drones:** knockdown hits (haymaker, clap, slam waves, thrown objects) send drones to the ground for a moment, where they take extra damage and can be lifted.
- Neither new drone appears in Chapter 1. They are in Training now and are ready for Chapter 2.

## Omnitrix Training

- **OMNITRIX TRAINING** on the title screen (or `?training=1`). A holo-grid arena with a water pool (XLR8), the dummy plaza, platforms, a trench (XLR8's dash), a boulder (Four Arms) and a cracked wall that reforms.
- **Every unlocked alien plus the lent ones** on the dial. Wrong transforms are off here.
- **Training dummy:** floating damage numbers per hit, plus a DPS / total / hits readout per burst. Stunning hits knock it over, and Four Arms can throw it.
- **Pause opens the training menu:** spawn any enemy (Scout, Striker, Gunner, Armored, Hornet) with a hint about how to beat it, clear enemies, and toggles for the alien timer (off: infinite time, instant recharge), enemy attacks (off: they move but never shoot) and damage numbers. It also shows the current alien's move list.
- Built as a level like the chapters (`levels/training.ts`, a level registry, `LevelScene` mode `'training'`), so Free Play can reuse it.

## Chapter 1 vault card

The cracked wall now breaks to smash hits (Four Arms). The vault card counts toward Chapter 1's total of **4** cards from now on; the card counter shows it as a faded slot ("a card you can't reach yet") until Four Arms is on your dial. Chapter 1 completions from before this milestone keep their cards and show x/4.

## How to test (at the time)

**Milestone 2, desktop** (`npm run dev`)

1. Title → **OMNITRIX TRAINING**. Press T: Heatblast. Q/E turns the dial; a row of all three aliens shows under it.
2. **Swap:** while Heatblast, select XLR8 (Q) and press T. XLR8 dashes in cutting whatever is ahead; 3 s come off the dial. Swapping again within about a second is refused, and with under 3 s left it says NOT ENOUGH TIME TO SWAP!
3. **XLR8:** hold J at the dummy (damage numbers, every 6th hit kicks). K dashes through it ("X2 CUT!" with two targets). Run across the water pool on the far left at full speed; slow down on it and you sink. Dash across the trench. Pause → SPAWN SCOUT, then dash through its laser: TOO SLOW!
4. **Four Arms:** J, J, J at the dummy (the haymaker knocks it over), then J to lift it and J to throw it. K slams (cracks, shockwaves both ways); jump and K for a meteor drop from high up. Lift the boulder and throw it. Punch the cracked wall until it breaks (it reforms).
5. **Armored Drone** (pause → spawn): fireballs and XLR8 strikes barely scratch it (ARMOR!). Four Arms' punches or slam break the plating; it drops and takes big damage while exposed.
6. **Hornet:** as Heatblast it dodges fireballs (DODGED!) and stays out of reach. As XLR8 you can run it down.
7. **Tag team:** punch the dummy as Ben, transform, keep hitting, swap, hit, swap, hit: the combo counter shows each form's icon, TAG TEAM! → TRIPLE THREAT! → FULL OMNITRIX!, and +1.5S pops by the dial each time.
8. Pause menu: ALIEN TIMER OFF (infinite time), ENEMIES PASSIVE, DAMAGE NUMBERS OFF; the move list on the right matches the current alien.
9. **Chapter 1 regression:** play Chapter 1 from a save file. Only Heatblast is on the dial, the vault wall still won't break, and the card slots show 3 plus one faded slot.
10. **Vault card:** `?aliens=fourarms`, then from the cliff checkpoint punch the cracked wall with Four Arms and grab the card (4 of 4; practice run, nothing saved as a best).

**Milestone 2, phone**

1. From the title, OMNITRIX TRAINING. Swipe sideways on the Omnitrix button to pick an alien, tap it to transform.
2. While transformed, swipe to another alien: the button reads SWAP! in that alien's colour. Tap it to swap.
3. ATTACK and SPECIAL change icons per alien. XLR8: hold ATTACK for strikes, SPECIAL to dash (stick up: upward dash). Four Arms: stick up + ATTACK claps; ATTACK next to the knocked-over dummy lifts it, ATTACK again throws.
4. Tap II for the training menu (spawn enemies, options). The combo counter and its icons sit above the Omnitrix button, clear of thumbs.
