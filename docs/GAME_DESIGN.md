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
| Upgrade | Laser from possessed tech | Merge with machines, control turrets and doors | Ch 4 |
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
