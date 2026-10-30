// Dev tool: a frame-perfect gameplay recording. The game is stepped by hand at 60 Hz (headless
// Chromium runs it too slowly to record live) and every other step is screenshotted (30 fps).
// Needs the dev server (npm run dev, port 5173) and Playwright (NODE_PATH=$(npm root -g)).
//   PLAN='[[10,"down","ArrowRight"],[80,"down","Space"],[96,"up","Space"]]' FRAMES=300 \
//     node scripts/cutout/capture.cjs <outDir> "level=ch7&mute=1&at=14&artres=8" 2.4
//   ffmpeg -framerate 30 -i <outDir>/f%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4
// PLAN: [step, "down"|"up", key] (keys as Playwright names them); the last argument is the camera zoom.
const { chromium } = require('playwright');
const fs = require('fs');
const [outDir, query, zoomArg] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('http://localhost:5173/?' + query);
  await p.waitForTimeout(11000);
  await p.evaluate(async (zoom) => {
    const g = window.__game;
    if (zoom > 0) (await import('/src/systems/CameraZoom.ts')).cameraZoom.base = zoom;
    const s = g.scene.getScenes(true).find((x) => x.arena !== undefined);
    if (zoom > 0) { s.cameras.main.setZoom(zoom); s.events.on('postupdate', () => s.cameras.main.setZoom(zoom)); }
    g.loop.sleep();
    window.__t = performance.now();
    window.__step = (n) => { for (let i = 0; i < n; i++) { window.__t += 1000 / 60; g.step(window.__t, 1000 / 60); } };
  }, Number(zoomArg ?? 0));
  // Let the spawn flicker finish first.
  await p.evaluate(() => window.__step(Number(120)));
  // [frame, action, key]
  const plan = process.env.PLAN ? JSON.parse(process.env.PLAN) : [];
  const total = Number(process.env.FRAMES ?? 430);
  let shot = 0;
  for (let f = 0; f < total; f++) {
    for (const [at, act, key] of plan) if (at === f) await p.keyboard[act](key);
    await p.evaluate(() => window.__step(1));
    if (f % 2 === 0) await p.screenshot({ path: `${outDir}/f${String(shot++).padStart(4, '0')}.png` });
  }
  console.log('zoom', await p.evaluate(() => window.__game.scene.getScenes(true).find((x) => x.arena !== undefined).cameras.main.zoom));
  console.log('shots', shot, 'errors:', errs.slice(0, 5));
  await b.close();
})();
