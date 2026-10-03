# Milestone 1: vertical slice (Chapter 1)

_Archived from `docs/PROGRESS.md` on 2026-10-03. The current state of the game is in `docs/PROGRESS.md`; decisions that still apply are in `docs/DECISIONS.md`._

**Project:** Phaser 4 (latest, WebGL) + TypeScript strict + Vite + Vitest. The folder structure follows CLAUDE.md. Helper modules live in `scenes/level/` (Level orchestration) and `scenes/preload/` (placeholder art + asset key map).

**Opening (first 10 seconds):**
- A skippable 3-second cinematic: the camp at night, a green and a red streak cross the sky, and an impact in the woods.
- Ben walks right to a glowing pod. It opens and the Omnitrix leaps onto his wrist ("Hey! It won't come off!").
- Drones arrive and the world drops into slow motion with a pulsing "PRESS [T] TO TRANSFORM!" until the player transforms. A first-time player transforms about 6–8 seconds after gaining control.

**Human Ben:**
- Movement: acceleration and deceleration, coyote time, jump buffering, variable jump height, apex hang, faster falling, drop-through platforms.
- Weak punch with lunge and hit-stop.
- Dodge roll with invincibility frames.
- Laser parry: punching an enemy laser knocks it back, green and stronger.

**Omnitrix (`systems/Omnitrix.ts`, pure and fully tested):**
- Dial with Q/E, transform on T.
- 20s timer and 10s cooldown from `config/difficulty.ts` (Normal).
- Warning beeps and red flashing in the last 5 seconds, then a forced revert.
- Early revert from damage or the jammer field.
- Wrong-transform rolls are implemented and tested. They can't trigger yet because only one alien is unlocked.

**Transformation sequence:**
- Wind-up: slow-mo, Ben slaps the watch, a big Omnitrix hourglass flashes on screen.
- Burst: green flash, rays, rings, particles, and a barrel-distortion pulse that bulges the whole screen.
- Camera punch, shake, and a "HEATBLAST!" name slam with speed streaks, plus a quip.
- The transformation shockwave knocks nearby drones away, so transforming doubles as a panic button.

**Heatblast:**
- Fireballs with auto-fire, slight aim assist, and hold-Up aiming.
- Charged Fire Burst: hold K, release for a radius and damage that scale with charge. It also erases enemy lasers.
- Rocket jump with a damaging blast underfoot, plus a glide while holding jump.
- Flame-crown particles, embers, a warm light that pushes back the night, and a heat shield bar.

**Level (forest to crash site, about 280 tiles):**
1. Camp with the Rustbucket, tents and campfire.
2. Pod site.
3. Forest path with a tunnel sealed by a drone barricade that only fire can burn.
4. A 7-tile cliff that needs the rocket jump.
5. The ridge.
6. A jammer ravine: its field reverts any alien and blocks transforming, so it is crossed as human Ben over stepping stones in a creek, ending at a jammer core you punch to drop the energy gate. This is the cooldown-survival section.
7. A drone nest.
8. The crash-site boss arena.

There are four checkpoints by difficulty density, two Mr. Smoothy heals, and water that costs health and respawns you on safe ground.

**Enemies (three variants, all telegraphed):**
- **Scout:** hovers and flickers a dashed aim line that locks just before a single laser.
- **Striker:** locks a reticle on Ben, dive-bombs the spot, then sits stuck and harmless, a punish window for human Ben. It takes 1.5× damage while stuck.
- **Gunner:** a heavier ship with a long charge and a three-way spread.

**Boss, the Hunter-Killer Drone:**
- Descends with a roar, arena walls rise and the boss bar slides in.
- Phase 1: aimed volleys with reticles; a slam that tracks Ben with a growing red danger zone, sends ground shockwaves, then leaves the boss stunned and exposed (1.5× damage; human punches work); and escort summons.
- At 50% the armour blows off, the arena alarm lights go red, and the boss drops a Mr. Smoothy.
- Phase 2: faster patterns, triple slams, a knee-high floor beam with a countdown blink, and a bomb rain where every impact is marked first.
- A slam is guaranteed at least every third attack, so the human cooldown always gets a damage window.
- Death: slow-motion chain explosions, then a big flash.

**Chapter Complete:**
- Time, damage taken, drones destroyed, best combo, lasers parried, deaths, Sumo Slammers cards and score, each tallied one by one.
- An S–D rank stamps in, with a "new best" check against the save.
- A teaser for Chapter 2.
- [C] copies a shareable score line.

**HUD:**
- Omnitrix dial with a timer ring that drains green, flashes red, and refills red on cooldown, with an alien hologram icon.
- Hearts and the heat shield bar.
- Run timer, drone count and card slots.
- Combo counter, boss bar, banners, prompts, letterbox and a low-health vignette.

**Menus:** title screen (Ben and Heatblast swap with a green flash), pause with a controls list, a game over screen with tips, and retry from checkpoint. (Milestone 3 rebuilt these into the full loop.)

**Audio:** everything is synthesized with Web Audio (about 50 effects) plus an original chiptune soundtrack. Its "hero layer" swells while Ben is an alien.

**Visual tech:**
- Night lightmap (multiply render texture with additive lights), emissive layer, and parallax sky.
- Hit-stop and slow motion via `TimeController`.
- Pooled projectiles and particle emitters.
- Camera vignette and death desaturation (Phaser 4 filters).


# Creative additions beyond the spec

- **Alien shield (heat bar):** damage as an alien drains a separate shield; breaking it forces an early revert. This is how "heavy damage forces revert" is implemented, and it makes the human cooldown the real danger.
- **Jammer field set piece:** a deterministic "survive as human" section instead of hoping the timer runs out at the right moment.
- **Laser parry, dodge roll, and Strikers you can punish** so human Ben has real moves, not just waiting out the cooldown.
- **Transformation shockwave** that knocks drones away.
- **Combo counter** ("HERO TIME!" at 12, "UNSTOPPABLE!" at 25), **rank and score**, **best-time save**, and a **copy score** share line.
- **Three hidden Sumo Slammers cards:**
  - A high branch that needs the rocket jump.
  - A risky creek platform in the jammer ravine.
  - A secret alcove behind a second barricade.
- **Adaptive music** that reacts to transforming.
- **Slow-motion first transform** and contextual tutorial prompts. There are no tutorial walls.
- **Night lighting:** campfire, glowing mushrooms, fireflies, the pod glow, and the RV window light (a Rustbucket nod).
- **Aim assist** on fireballs.
- **Buffered punches.**
- **Spawn grace** after checkpoints, and a wake delay before drones attack.
