# Ideas

Proposals for features or changes outside the current milestone. Items move to **Done** when built and to **Deferred** when approved for a later milestone.

## Done

- **Accessibility options** (Chapter 1 polish pass): Reduce Flashing toggle (transform emblem, camera flashes, alarm lights, boss and HUD blinks), a 0–100% screen shake slider, a Settings screen from the title and pause menus, saved via SaveSystem, prefers-reduced-motion as the default. *Hold-to-transform and remappable keys from the original proposal are still open (see Proposed).*
- **Perfect transform:** transform in a short window around a drone or boss attack for a bigger shockwave that turns enemy shots around, a slow-motion beat, a gold PERFECT! stamp and +3 s of alien time. Window in `config/omnitrix.ts`, timing logic unit tested.
- **Speedrun splits:** a split at every checkpoint and the boss kill against your fastest time there, gold when ahead, saved per chapter.
- **Vilgax hologram:** a short, skippable red hologram at the boss arena where Vilgax demands the Omnitrix. Plays once per run.
- **Hidden Ultimate teaser / Four Arms wall:** a cracked wall by the cliff checkpoint seals a vault with a fourth card. Touching it shows a locked four-armed silhouette. Only `'smash'` hits break it. Since Milestone 2, Four Arms' hits are smash damage and the card counts toward the chapter total of 4.
- **Mobile touch controls** (pulled forward from Milestone 6): stick, buttons, Omnitrix dial button, landscape handling, auto-pause, frame-rate governor.

Built within Milestone 2 (not proposed beforehand, recorded here for reference):

- **Omnitrix swap:** swap aliens mid-transformation for 3 s of alien time; each alien arrives with an entrance attack; perfect swaps.
- **Tag-team combos:** each new form in a live combo lines up its icon on the counter and refunds 1.5 s.
- **TOO SLOW!:** XLR8 dashing through an enemy shot slows time and resets the dash.
- **Downed drones:** knockdown hits ground drones so Four Arms can lift and throw them.

## Deferred (approved for later)

| Idea | Target |
|---|---|
| **Dial misfire comedy:** a record-scratch sound and a unique reaction line per alien pair when a wrong transform happens. | Milestone 3 (wrong transforms go live) |
| **Gwen and Grandpa Max cameos** in the Chapter 1 intro (e.g. Gwen: "Great, now you're even MORE annoying"). | Milestone 5 |
| **Achievements** (Pyromaniac, Deflector, Smoothie Addict, Untouchable, Speed Demon, Perfectionist...). | After 3 chapters exist |
| **Card album:** a title-screen page of collected Sumo Slammers cards with flavour text. | After 3 chapters exist |
| **Chapter 1 Hard Remix:** shorter timer, a Gunner wave in the ravine, a boss "overclock" phase 3. | After 3 chapters exist |
| **Auto-clip the transform** (rolling canvas recording, SAVE CLIP after the first transform and the boss kill) and a **share card image** (rank, time, portrait, cards as a PNG). | Milestone 7 (viral layer) |
| **Gamepad support** through Phaser's gamepad plugin feeding `InputMap`. | Later |
| **Playtest stats** (time per section, deaths per section, transform uptime) to tune difficulty. | Dev builds only, never shipped |

## Proposed (awaiting approval)

### Retention and mastery

- **"No-transform" challenge badge:** finish a section as human Ben only. The hardest flex and very clip-worthy.
- **Ghost of your best run:** a translucent Ben replaying your fastest run (positions sampled every few frames). Pairs naturally with splits and makes "one more run" irresistible.
- **Splits review on Chapter Complete:** every split with its delta and a "sum of best" possible time, so players see exactly where to save time.
- **Perfect-transform counterplay on the boss:** a perfect transform during the slam's drop stuns the Hunter-Killer early. A reward for reading the boss, not a requirement.

### Mobile

- **Fill wide phones:** switch the scale mode to EXPAND so 19.5:9 phones show more level instead of side bars (needs HUD anchoring to the screen edges).
- **Haptics on Android:** short `navigator.vibrate` pulses on hits, perfect transforms and the boss kill (no iOS support), with a Settings toggle.
- **Touch layout options:** button size slider and a left-handed mirror layout.
- **Offline play:** a small service worker so the game loads with no connection after the first visit (fits the existing web manifest).
- **Omnitrix radial dial:** a long-press on the touch Omnitrix opens a radial picker instead of swiping through aliens one by one. With three aliens, swiping is still quick; worth building at five or more (Chapter 3+).

### Aliens and switching (from Milestone 2)

- **Training trials:** short per-alien challenges in Omnitrix Training with bronze/silver/gold medals, saved. XLR8: cross the pool and down three Hornets in 12 s. Four Arms: break an Armored Drone's plating with one punch chain. Swap: three tag teams in one combo. Teaches the counters and gives Training (and later Free Play) a reason to come back.
- **Swap stats on Chapter Complete:** SWAPS and BEST TAG TEAM rows with a small score bonus, so switching mastery shows up in the rank and the share line.
- **Revisit Chapter 1 with new aliens:** after Chapter 2, Chapter 1 gains alien-gated secrets (an XLR8 water route that saves seconds on the splits, a Four Arms boulder hiding a card). Replay value for speedrunners and completionists.
- **Bowling throws:** a drone thrown by Four Arms that hits two more enemies pops STRIKE! with a slow-motion beat. A clip-worthy moment.
- **Multi-cut freeze-frame:** when XLR8's dash cuts four or more enemies, a half-second comic-panel freeze with speed lines before they all burst.
- **Chapter 2 encounter ideas:** Hornet swarms over a river (XLR8's showcase) and an Armored convoy on the runaway-truck chase that Four Arms throws off the road.
- **Hunter-Killer in Training:** a boss rehearsal (or a boss rush in Free Play) so players can practise the swaps against a boss.

### Accessibility

- **Hold-to-transform** alternative and **remappable keys** (left over from the original accessibility proposal).
- **Colour-blind safe telegraphs:** add a shape cue (stripes or chevrons) to red danger zones so they don't rely on colour alone.

### Virality

- **"Vilgax was here" share line:** the share text calls out perfect transforms and splits ("3 PERFECT transforms, gold at every split"), which makes scores more brag-worthy.
