// The heaviest moments of each chapter, played by a scripted "brawler" that
// transforms, swaps, attacks, jumps and uses specials non-stop. Every scenario
// runs with ?god=1 so Ben survives, and with a seeded Math.random.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tap(page, key, holdMs = 60) {
  await page.keyboard.down(key);
  await sleep(holdMs);
  await page.keyboard.up(key);
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await sleep(ms);
  await page.keyboard.up(key);
}

/** A busy fighter: moves both ways, holds attack, jumps, specials, and turns the dial and transforms or swaps. */
export async function brawl(page, untilMs, opts = {}) {
  const swap = opts.swap ?? true;
  const end = Date.now() + untilMs;
  let i = 0;
  while (Date.now() < end) {
    const dir = i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(dir);
    await hold(page, 'j', 700);
    await tap(page, 'Space', 180);
    await hold(page, 'j', 500);
    await page.keyboard.up(dir);
    await tap(page, 'k', 350);
    await hold(page, 'j', 400);
    if (swap) {
      await tap(page, i % 3 === 0 ? 'q' : 'e');
      await tap(page, 't');
    }
    i++;
  }
}

/** Runs right through a level section, fighting on the way. */
export async function advance(page, untilMs) {
  const end = Date.now() + untilMs;
  await page.keyboard.down('ArrowRight');
  try {
    while (Date.now() < end) {
      await hold(page, 'j', 500);
      await tap(page, 'Space', 260);
      await sleep(250);
      await tap(page, 't');
    }
  } finally {
    await page.keyboard.up('ArrowRight');
  }
}

/** Presses Enter a few times to skip intros, holograms and dialogue. */
export async function skipCinematics(page, times = 4) {
  for (let i = 0; i < times; i++) {
    await tap(page, 'Enter');
    await sleep(400);
  }
}

/** Repeated big explosions on screen plus the brawler: the "everything at once" stress case. */
async function explosionStorm(page, untilMs) {
  const stop = { done: false };
  const storm = (async () => {
    while (!stop.done) {
      await page.evaluate(() => {
        const lvl = window.__level;
        const cam = lvl?.cameras?.main;
        if (!lvl || !cam) return;
        const v = cam.worldView;
        for (let k = 0; k < 3; k++) {
          lvl.fx.explosion(v.x + v.width * (0.2 + 0.3 * k), v.y + v.height * 0.45, k === 1 ? 'big' : 'medium');
        }
      });
      await sleep(450);
    }
  })();
  await brawl(page, untilMs);
  stop.done = true;
  await storm;
}

/**
 * id: report name. url: query string. setup: runs after the level is live (before warm-up);
 * restartAfterSetup: restart the level after it (for options read at level start).
 * play: drives input during warm-up and measurement (called with the total ms to fill).
 */
export const SCENARIOS = [
  {
    id: 'ch1-forest',
    title: 'Ch1 forest run (parallax, night lighting, drones)',
    query: 'level=ch1&start=cp-cliff',
    play: (page, ms) => advance(page, ms),
  },
  {
    id: 'ch1-boss',
    title: 'Ch1 Hunter-Killer drone (boss, explosions)',
    query: 'level=ch1&start=cp-arena',
    play: (page, ms) => brawl(page, ms, { swap: false }),
  },
  {
    id: 'ch2-convoy',
    title: 'Ch2 roof ride and convoy (treadmill, trucks)',
    query: 'level=ch2&start=cp-convoy',
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch2-boss',
    title: 'Ch2 ROADBREAKER',
    query: 'level=ch2&start=cp-arena',
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch3-blackout',
    title: 'Ch3 blackout (Wildmutt senses, darkness)',
    query: 'level=ch3&start=cp-dark',
    play: (page, ms) => advance(page, ms),
  },
  {
    id: 'ch3-frog',
    title: 'Ch3 KING CROAK',
    query: 'level=ch3&start=cp-frog',
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch4-arcade',
    title: 'Ch4 GAME ZONE (neon, cabinets, TOKEN TOONS, Kevin as a buddy)',
    query: 'level=ch4&start=cp-arcade',
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch4-station',
    title: 'Ch4 Rosewood station (trains, track-bots, turrets)',
    query: 'level=ch4&start=cp-station',
    play: (page, ms) => advance(page, ms),
  },
  {
    id: 'ch4-kevin',
    title: 'Ch4 KEVIN 11 (copies, coils, the hybrid)',
    query: 'level=ch4&start=cp-kevin',
    setup: async (page) => {
      // Into the substation hall, then skip his speech.
      await page.evaluate(() => window.__level.player.teleport(396 * 16 + 8, 33 * 16));
      await sleep(600);
      await skipCinematics(page, 5);
    },
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch5-street',
    title: "Ch5 Main Street (tracker drones, missile salvos, Sixsix's duel, the moonlit town)",
    query: 'level=ch5&start=cp-street',
    play: (page, ms) => advance(page, ms),
  },
  {
    id: 'ch5-dive',
    title: 'Ch5 THE DEEP DIVE (the ray-traced tunnel, sprites projected on it)',
    query: 'level=ch5&start=cp-dive',
    setup: async (page) => {
      // Into the cart: the ride starts on its own.
      await page.evaluate(() => window.__level.benchTeleport(328 * 16, 40 * 16));
      await page.waitForFunction(() => window.__level.story?.pieces?.some((p) => p.phase === 'ride'), undefined, { timeout: 20000 }).catch(() => undefined);
    },
    play: (page, ms) => brawl(page, ms, { swap: false }),
  },
  {
    id: 'ch5-hunters',
    title: 'Ch5 THE HUNTERS (Kraab in the chamber, Sixsix strafing, salvos, rockfalls)',
    query: 'level=ch5&start=cp-hunters',
    setup: async (page) => {
      // Into the chamber, then skip Kraab's line.
      await page.evaluate(() => window.__level.benchTeleport(458 * 16, 58 * 16));
      await sleep(600);
      await skipCinematics(page, 3);
    },
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch6-fair',
    title: 'Ch6 Sea View fair (Ferris wheel, fair lights, kites, the sea, the lighthouse beam, Gwen)',
    query: 'level=ch6&start=cp-fair',
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'ch6-wrap',
    title: 'Ch6 THE TOWER WRAP (the turning tower: 48 stone strips, ledges, skyline, foes)',
    query: 'level=ch6&start=cp-wrap',
    setup: async (page) => {
      // Out of the clock room's door: the climb starts on its own.
      await page.evaluate(() => window.__level.benchTeleport(470 * 16 + 8, 30 * 16));
      await page.waitForFunction(() => window.__game.scene.getScene('Tower')?.sys.isActive(), undefined, { timeout: 20000 }).catch(() => undefined);
    },
    play: (page, ms) => brawl(page, ms, { swap: false }),
  },
  {
    id: 'ch6-hex',
    title: 'Ch6 HEX AND CHARMCASTER, phase 3 (illusions, ward threads, cataclysm, Max, rocklings)',
    query: 'level=ch6&start=cp-towertop',
    setup: async (page) => {
      await page.evaluate(() => window.__level.benchTeleport(497 * 16, 12 * 16));
      await sleep(600);
      await skipCinematics(page, 4);
      // Knock the fight to its last phase (both of them, the copies, the wards).
      for (let i = 0; i < 60; i++) {
        const phase = await page.evaluate(() => {
          const lvl = window.__level;
          const boss = lvl?.arena?.boss;
          if (!boss || !lvl.arena.fighting || boss.introducing) return -1;
          if (boss.phase >= 2) return boss.phase;
          for (const t of boss.extraTargets ?? []) t.takeHit({ damage: boss.maxHp * 0.03, kind: 'smash', x: lvl.player.x, y: lvl.player.centerY, knockback: 0 });
          return boss.phase;
        });
        if (phase >= 2) break;
        await tap(page, 'Enter');
        await sleep(250);
      }
      await skipCinematics(page, 3);
    },
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'misfire',
    title: 'Training, misfires on CHAOS (transform gag every swap)',
    query: 'training=1',
    setup: async (page) => {
      await page.evaluate(() => {
        window.__trainingOptions.misfireStep = 3;
        window.__trainingOptions.alienTimer = false;
      });
    },
    // Training reads its options when it starts.
    restartAfterSetup: true,
    play: (page, ms) => brawl(page, ms),
  },
  {
    id: 'stress',
    title: 'Explosion storm: 3 explosions every 450 ms plus the brawler (synthetic worst case)',
    query: 'level=ch3&start=cp-frog',
    play: (page, ms) => explosionStorm(page, ms),
  },
];

export { sleep, tap, hold };
