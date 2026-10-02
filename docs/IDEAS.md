# Ideas

Proposals for features or changes outside the current milestone. Items move to **Done** when built and to **Deferred** when approved for a later milestone.

## Done

- **Accessibility options** (Chapter 1 polish pass): Reduce Flashing toggle (transform emblem, camera flashes, alarm lights, boss and HUD blinks), a 0–100% screen shake slider, a Settings screen from the title and pause menus, saved via SaveSystem, prefers-reduced-motion as the default. *Hold-to-transform and remappable keys from the original proposal are deferred (see Deferred).*
- **Perfect transform:** transform in a short window around a drone or boss attack for a bigger shockwave that turns enemy shots around, a slow-motion beat, a gold PERFECT! stamp and +3 s of alien time. Window in `config/omnitrix.ts`, timing logic unit tested.
- **Speedrun splits:** a split at every checkpoint and the boss kill against your fastest time there, gold when ahead, saved per chapter.
- **Vilgax hologram:** a short, skippable red hologram at the boss arena where Vilgax demands the Omnitrix. Plays once per run.
- **Hidden Ultimate teaser / Four Arms wall:** a cracked wall by the cliff checkpoint seals a vault with a fourth card. Touching it shows a locked four-armed silhouette. Only `'smash'` hits break it. Since Milestone 2, Four Arms' hits are smash damage and the card counts toward the chapter total of 4.
- **Mobile touch controls** (pulled forward from Milestone 6): stick, buttons, Omnitrix dial button, landscape handling, auto-pause, frame-rate governor.
- **Dial misfire comedy** (Milestone 3): record scratch, a reaction line for every alien pair, plus a sepia freeze-frame close-up, a double take and a WANTED/GOT card.

Built within Milestone 2 (not proposed beforehand, recorded here for reference):

- **Omnitrix swap:** swap aliens mid-transformation for 3 s of alien time; each alien arrives with an entrance attack; perfect swaps.
- **Tag-team combos:** each new form in a live combo lines up its icon on the counter and refunds 1.5 s.
- **TOO SLOW!:** XLR8 dashing through an enemy shot slows time and resets the dash.
- **Downed drones:** knockdown hits ground drones so Four Arms can lift and throw them.

Built within Milestone 3 (not proposed beforehand, recorded here for reference):

- **Misfire outs:** after a misfire the next swap is half price and can't misfire (FIX), or the first KO as the wrong alien refunds +2 s (IMPROVISED!).
- **Training MISFIRES switch:** OFF / 10% / 25% / CHAOS (100%).
- **Mid-chapter Continue:** checkpoints, deaths and Save & Quit store the run; CONTINUE drops straight back in.
- **Per-difficulty medals** on Chapter Select (best rank on Easy, Normal and Hard).
- **Chapter reveal:** after a first clear the next chapter's title decodes letter by letter.
- **No-shame difficulty tip** on the game over screen after a few deaths.

Approved and built in Milestone 4, part 1 (Chapter 2):

- **Bowling throws:** a thrown enemy that bowls over two or more others pops STRIKE! with a slow-motion beat (and a thrown convoy truck hits like a truck).
- **Multi-cut freeze-frame:** XLR8's dash cutting four or more enemies freezes into a comic panel with a slash across every target before they all burst.
- **Swap stats on Chapter Complete:** SWAPS and BEST TAG TEAM rows with a small score bonus.
- **Fill wide phones:** EXPAND scaling; HUD, touch controls and every menu anchor to the real screen edges.
- **Colour-blind safe telegraphs:** every red danger zone also carries stripes (stay out) or chevrons (the way the attack travels), and impact spots get a target with a cross.
- **One-tap "make it easier"** on the game over screen after several deaths.
- **Chapter 2 encounter ideas:** the Hornet river is XLR8's showcase and the armoured convoy on the chase is thrown off the road by Four Arms.

## Deferred (approved for later)

| Idea | Target |
|---|---|
| **Gwen and Grandpa Max cameos** in the Chapter 1 intro (e.g. Gwen: "Great, now you're even MORE annoying"). | Milestone 5 |
| **Achievements** (Pyromaniac, Deflector, Smoothie Addict, Untouchable, Speed Demon, Perfectionist...). | After 3 chapters exist |
| **Card album:** a title-screen page of collected Sumo Slammers cards with flavour text. | After 3 chapters exist |
| **Chapter 1 Hard Remix:** shorter timer, a Gunner wave in the ravine, a boss "overclock" phase 3. | After 3 chapters exist |
| **Auto-clip the transform** (rolling canvas recording, SAVE CLIP after the first transform and the boss kill) and a **share card image** (rank, time, portrait, cards as a PNG). | Milestone 7 (viral layer) |
| **Gamepad support** through Phaser's gamepad plugin feeding `InputMap`. | Later |
| **Playtest stats** (time per section, deaths per section, transform uptime) to tune difficulty. | Dev builds only, never shipped |
| **Ghost of your best run:** a translucent Ben replaying your fastest run. | After 3 chapters exist |
| **Splits review on Chapter Complete:** every split with its delta and a "sum of best" time. | After 3 chapters exist |
| **Omnitrix Master:** an S rank on all three difficulties turns a chapter's card gold and adds a badge to the share line. | After 3 chapters exist |
| **Training trials:** per-alien challenges in Omnitrix Training with bronze/silver/gold medals. | After 3 chapters exist |
| **Revisit Chapter 1 with new aliens:** alien-gated secrets and shortcuts in Chapter 1 (an XLR8 water route, a Four Arms boulder hiding a card). | After 3 chapters exist |
| **Misfire log:** a page collecting every misfire reaction line triggered ("JOKES FOUND 7/12"). | After 3 chapters exist |
| **Perfect-transform counterplay on the boss:** a perfect transform during a boss's big attack stuns it early. | After 3 chapters exist |
| **"No-transform" challenge badge:** finish a section as human Ben only. | After 3 chapters exist |
| **Omnitrix radial dial:** a long-press on the touch Omnitrix opens a radial picker instead of swiping through aliens. | Chapter 3 |
| **Misfire clip:** save the seconds around every misfire automatically, WANTED/GOT card burned in (rides on the auto-clip). | Milestone 7 (viral layer) |
| **"Vilgax was here" share line:** the share text calls out perfect transforms and splits. | Milestone 7 (viral layer) |
| **Haptics on Android:** short vibration pulses on hits, perfect transforms and boss kills, with a Settings toggle. | Later |
| **Touch layout options:** button size slider and a left-handed mirror layout. | Later |
| **Save code:** export a file as a short text code and import it on another device. | Later |
| **Offline play:** a small service worker so the game loads with no connection after the first visit. | Later |
| **Hold-to-transform** alternative and **remappable keys**. | Later |
| **Timed-run marker:** a small HUD icon showing the run counts for best times. | Later |

## Proposed (awaiting approval)

### Bosses and Training

- **Boss rehearsal in Training:** the Hunter-Killer and ROADBREAKER as Training targets (or a boss rush in Free Play) so players can practise the swaps against a boss.
- **Hard Remix tie-in:** when Chapter 1 Hard Remix is built (Deferred), it plugs into the per-difficulty bests and medals already in place. Road Trip could get the same treatment: a night-only remix with a longer convoy.

### From Chapter 2 (Milestone 4)

- **Chase replay ("Rustbucket Rally"):** once Chapter 2 is cleared, the chase on its own from Chapter Select: a score attack counting trucks thrown, BULLSEYES and hits taken, with its own medal. Short, intense and very replayable.
- **Truck-on-truck bonus:** throwing a convoy truck into another truck pops DOUBLE WRECK! (today it just hits hard). A guaranteed clip moment.
- **Family barks:** Gwen and Max react to what the player does on the chase (a hit on the roof, a STRIKE, a perfect transform) with short portrait lines, so the RV ride feels like a family scene and not a backdrop.
- **Ride-along Gwen hints:** on Easy, Gwen calls out the next convoy attack ("RAM COMING!") a beat before the telegraph. An extra accessibility layer for younger players.
