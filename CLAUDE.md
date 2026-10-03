# CLAUDE.md

## Project

2D pixel-art Ben 10 action platformer for the browser. Full design is in `docs/GAME_DESIGN.md`. Read it before starting any task. Current status is in `docs/PROGRESS.md`. Read `docs/DECISIONS.md` every session (the decisions and deviations that still apply). Past milestones are written up in `docs/history/`: read those only when a task needs the details. The performance budget and how to measure it are in `docs/PERFORMANCE.md`.

## Creative Mandate

The goal is a viral, genuinely fun, challenging game with high retention. `GAME_DESIGN.md` is a starting point, not a ceiling. At every step, bring your best creativity and game-design intuition:

- **Game feel first:** screen shake, hit-stop, particles, juicy transforms, satisfying sound cues, tight controls. Every action should feel good.
- **Visual quality:** go beyond the minimum. Strong silhouettes, readable effects, cohesive pixel-art style, polished UI and transitions.
- **Challenge:** fights and levels should demand skill and smart alien switching. Hard but fair, with clear enemy telegraphs.
- **Retention:** always think about what makes a player want one more run: rewards, secrets, unlocks, collectibles, mastery.
- **Virality:** look for moments players would clip and share.

Guardrails:
- Improve freely **within the current milestone** (better mechanics, effects, level design, enemy behavior, feel).
- Ideas that change the story, add major features, or affect other milestones go in `docs/IDEAS.md` as proposals. Don't build them until approved.
- Don't rewrite working systems for style reasons. Extend them.
- If you deviate from `GAME_DESIGN.md`, explain why in `docs/DECISIONS.md`.

## Stack

- Phaser 4 (currently 4.2.x; Arcade Physics, WebGL renderer)
- TypeScript (strict mode)
- Vite
- Vitest for unit tests on game logic
- Deployed on Vercel

Pin dependency versions. Upgrade Phaser or other major dependencies only in a dedicated session with full regression. Phaser 4 differs from Phaser 3 in several APIs (tint modes, render textures need `render()`, FX are now filters). Check `node_modules/phaser/skills/` (especially `v3-to-v4-migration`) before using an API from memory.

## Commands

- `npm run dev`: local dev server
- `npm run build`: production build (must pass before finishing any task)
- `npm run typecheck`: `tsc --noEmit`
- `npm test`: Vitest
- `npm run bench`: performance benchmark (headless Chromium, CPU throttled; see `docs/PERFORMANCE.md`)

## Folder Structure

```
src/
  main.ts
  config/        game config, difficulty.ts, constants
  scenes/        Boot, Preload, Menu, ChapterSelect, Level, UI, Touch, Pause, Settings, GameOver
  aliens/        types.ts, registry.ts, one folder per alien (src/aliens/<id>/) plus a numbers file in config/aliens/
  entities/      Player.ts, enemies/, bosses/
  systems/       Omnitrix.ts, SaveSystem.ts, EventBus.ts
  levels/        chapter data
  ui/            HUD, Omnitrix dial, menus
public/assets/   sprites/, audio/, tilemaps/
docs/            GAME_DESIGN.md, PROGRESS.md, DECISIONS.md, PERFORMANCE.md, IDEAS.md, history/ (one file per past milestone)
scripts/         bench.mjs and bench/ (the performance benchmark)
```

## Architecture Rules

- **Aliens are data-driven.** Each alien is a config object (stats, abilities, sprite key, unlock chapter) plus ability functions, registered in `aliens/registry.ts`. Adding an alien must not require editing Player or Omnitrix logic.
- **Omnitrix logic is separate from rendering.** `systems/Omnitrix.ts` handles timer, cooldown, unlocks and wrong-transform rolls as plain TypeScript so it can be unit tested.
- **All tunable numbers live in `config/`.** No magic numbers for timers, damage, speed or difficulty inside gameplay code.
- **Scenes communicate through `EventBus`**, not direct references (e.g. Level emits `alien:transformed`, UI listens).
- **UI runs in its own scene** layered over the Level scene.
- **Save data** uses localStorage via `SaveSystem`, wrapped in try/catch, with a version number for migrations.
- **Accessibility:** every full-screen flash, camera shake and gameplay blink goes through `systems/Accessibility.ts` (`flashCamera`, `shakeCamera`, `blinkOn`) so Reduce Flashing and the shake slider always apply. Never call `cameras.main.flash/shake` directly.
- **Input:** gameplay reads one `Controls` object from `InputMap`, which merges the keyboard and the on-screen touch controls (`systems/VirtualPad.ts`). Player-facing text that names a control uses tokens (`{T}`, `{J}`, `{K}`, `{JUMP}`, `{UP}`, `{MOVE}`...) rendered by `inputMode.format()`, so it reads correctly on keyboard and touch.
- **Mobile is a first-class target:** check new UI and HUD at phone sizes (emulated landscape phones in headless Chromium) and keep thumbs clear of gameplay.

## Performance Rules

Every new chapter (and any change to a hot path) must pass `npm run bench` within the budget in `docs/PERFORMANCE.md`. Add the chapter's heaviest moment to `scripts/bench/scenarios.mjs` first. The budget is CPU time per frame, GC and leaks, not headless FPS.

- **Frame-rate independence:** anything that happens "per frame" (a random chance, a damping factor, an easing step, a trail or ember stream) goes through `systems/Pacing.ts` (`chance`, `damp`, `approach`, `perFrame`) or `fx.stream`, so 90 and 120 Hz screens play the same as 60 Hz. Timers use milliseconds.
- **No per-frame Graphics redraws.** A HUD or UI shape that changes only sometimes is a `BakedGraphics` (`ui/BakedGraphics.ts`) redrawn when its value changes. Keep `Graphics.clear()` + redraw every frame for things that really move every frame.
- **Static scenery** that never moves goes in the level's `StaticCuller` so it isn't drawn off-screen.
- **No allocations in hot paths:** reuse objects in `update()` code (see `Lighting.add`), pool projectiles and particles, and never create a texture, render texture or filter per frame.
- **Clean up on SHUTDOWN:** EventBus listeners with the scene as context plus `offContext`, timers, tweens, and held sounds (an ability with a looping sound implements `dispose()`). The bench's leak check fails if listeners, textures or held sounds grow.

## Assets

- Until real sprites are added, use colored placeholder shapes generated in code (e.g. Ben = white, Heatblast = orange, enemies = red).
- Load every sprite through a single asset key map in `Preload` so swapping placeholders for real art only means changing that map.
- Never hotlink assets from external URLs. Everything goes in `public/assets/`.

## Workflow

- Work on ONE milestone per session, as listed in `docs/GAME_DESIGN.md`. Do not start the next one unless asked.
- Before finishing: run `typecheck`, `build` and `test`, and fix all errors.
- Update `docs/PROGRESS.md` at the end of each session and keep it short: status, how to run, controls, known issues, and how to test the latest chapter. Write the milestone's full record (what was built, playtest notes, how to test it) to a new file in `docs/history/`, and new decisions to `docs/DECISIONS.md`.
- Commit with clear messages per feature.
- If a design decision isn't covered in `GAME_DESIGN.md`, choose the simplest option, note it in `DECISIONS.md`, and keep going.

## Code Style

- Small focused files, clear names, no giant scene files
- Prefer composition over deep inheritance for entities
- Comment only non-obvious logic
- Target 60fps. Use object pools for projectiles and particles
