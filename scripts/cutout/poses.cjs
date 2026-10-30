// Dev tool: Chapter 7's characters posed by hand in the running game (WebGL), on white.
// Needs the dev server (npm run dev, port 5173) and Playwright (NODE_PATH=$(npm root -g)).
//   node scripts/cutout/poses.cjs <out.png> <rig> "clip:t,..." [zoom]
//   (a rig per item: "max/idle:0.1,gwen/run:0.5"; env COLS=4 for a grid, ARTRES=8 for sharper art)
const { chromium } = require('playwright');
const [out, rigId, list, zoomArg] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:5173/?level=ch7&mute=1&god&artres=' + (process.env.ARTRES ?? 4));
  await p.waitForTimeout(12000);
  if (process.env.COLS) await p.evaluate((c) => { window.__cols = c; }, process.env.COLS);
  await p.evaluate(async ({ rigId, list, zoom }) => {
    const { RigActor } = await import('/src/systems/hd/RigActor.ts');
    const { castRig } = await import('/src/scenes/preload/cartoon/cast.ts');
    const { rigTextureKey } = await import('/src/scenes/preload/cartoon/rig.ts');
    const scene = window.__game.scene.getScenes(true).find((s) => s.arena !== undefined);
    window.__game.scene.getScenes(true).forEach((s) => { if (s !== scene) s.sys.setVisible(false); });
    const cam = scene.cameras.main;
    cam.stopFollow(); cam.removeBounds(); cam.setZoom(zoom);
    const ox = 30000, oy = 30000;
    const items = list.split(',').map((s) => { const [who, rest] = s.includes('/') ? s.split('/') : [rigId, s]; const [clip, t] = rest.split(':'); return { who, clip, t: Number(t) }; });
    const cols = Number(window.__cols || items.length);
    const rows = Math.ceil(items.length / cols);
    const cellW = cam.width / zoom / cols;
    const cellH = cam.height / zoom / rows;
    scene.add.rectangle(ox - 500, oy - 500, 3000, 3000, 0xffffff).setOrigin(0, 0).setDepth(5000);
    const actors = items.map((it, n) => {
      const a = new RigActor(scene, castRig(it.who), rigTextureKey(it.who));
      a.play(it.clip, true);
      a.container.setPosition(ox + ((n % cols) + 0.5) * cellW, oy + Math.floor(n / cols) * cellH + cellH * 0.5 + 16).setDepth(5001);
      return a;
    });
    scene.events.on('prerender', () => {
      actors.forEach((a, n) => a.update(16, items[n].t));
      cam.stopFollow(); cam.setZoom(zoom); cam.centerOn(ox + cellW * cols / 2, oy + cellH * rows / 2);
    });
    scene.lighting && (scene.lighting.enabled = false);
  }, { rigId, list, zoom: Number(zoomArg ?? 6) });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out });
  console.log('errors:', errs.slice(0, 6));
  await b.close();
})();
