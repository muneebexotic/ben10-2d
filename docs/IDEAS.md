# Ideas

Proposals for features or changes outside the current milestone. Awaiting approval.

## High priority

- **Accessibility options (Milestone 3 menus):** a "reduce flashing" toggle (camera flashes, transform emblem, alarm lights), a screen shake slider, a hold-to-transform alternative, and remappable keys. The transform and boss effects are bright; this matters for photosensitive players.
- **Gamepad support:** Phaser's gamepad plugin maps cleanly onto `InputMap`. It's cheap and makes the game feel like a console game on desktop.
- **Real playtest tuning pass:** record anonymous run stats (time per section, deaths per section, transform uptime) in a dev build to tune boss HP, drone density and jammer ravine difficulty.

## Virality

- **Auto-clip the transform:** keep a rolling canvas recording and offer "SAVE CLIP" right after the first transform and after the boss kill. Both are the most shareable moments. (Viral layer milestone, but the hook points already exist: `alien:transformed`, boss death.)
- **Share card image:** generate a PNG on Chapter Complete (rank letter, time, Heatblast portrait, card count) for one-tap sharing, instead of text only.
- **Speedrun splits:** show split times at each checkpoint against your best, and go gold when ahead. All the data is already in `RunStats`.
- **"No-transform" challenge badge:** finish a section as human Ben only. It's the hardest flex and very clip-worthy.

## Retention

- **Achievements:**
  - Pyromaniac: burn every barricade.
  - Deflector: parry 10 lasers.
  - Smoothie Addict: drink every Mr. Smoothy.
  - Untouchable: beat the boss without taking damage.
  - Speed Demon: under 3:00.
- **Card album:** a title-screen page showing collected Sumo Slammers cards with fun flavour text per card (show nostalgia).
- **Chapter 1 Hard Remix** after the first clear: shorter timer, a Gunner wave in the ravine, and a boss "overclock" phase 3.
- **Hidden Ultimate teaser:** a fourth secret in Chapter 1 that is only reachable with a later alien (for example a cracked wall for Four Arms) and shows a locked silhouette. It rewards replaying chapters after unlocks.

## Story and characters (later milestones)

- **Gwen and Grandpa Max cameos in the Chapter 1 intro:** Gwen's commentary when the watch clamps on ("Great, now you're even MORE annoying"). Belongs to Milestone 5.
- **Vilgax hologram** on the boss arena intro (a red projection that threatens Ben) to set up the season arc.

## Systems

- **Perfect transform:** pressing T within a short window right as a drone fires grants a stronger shockwave and a slow-mo "PERFECT!" banner. It adds mastery to the core mechanic. Changes Omnitrix feel, so it needs approval.
- **Dial misfire comedy (Milestone 3):** when wrong transforms go live, play a record-scratch sound plus a unique reaction line per alien pair.
