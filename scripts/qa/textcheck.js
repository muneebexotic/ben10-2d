// Injected into the page by scripts/qa.mjs. Walks every visible BitmapText in
// every running scene and reports text that is cut off by the screen edge or
// the safe margin, spills out of the box it sits in, overlaps other HUD text,
// is drawn at a fractional scale (garbled pixel font), shows a raw {TOKEN},
// uses a glyph the font lacks, or names a keyboard key to a touch player.
(() => {
  const GLYPHS = new Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?:;-+/'\"()[]%><=#*&_^~| \n");
  const KEY_NAMES = /\[(?:[A-Z]|ESC|ENTER|SPACE|UP|DOWN|LEFT|RIGHT|ARROWS|1-9)\]|\bPRESS [A-Z]\b|ANY KEY/;
  const FONT_SIZE = 9;
  const SAFE = 1;

  function visibleChain(o) {
    for (let p = o; p; p = p.parentContainer) {
      if (!p.visible || p.alpha <= 0.02) return false;
    }
    return true;
  }

  function scaleOf(o) {
    let s = (o.fontSize / FONT_SIZE) * Math.abs(o.scaleX);
    for (let p = o.parentContainer; p; p = p.parentContainer) s *= Math.abs(p.scaleX);
    return s;
  }

  // Mid-tween on one of these properties (a pop, a slide-in): off for a moment by design. Alpha pulses don't count.
  function tweening(scene, o, keys) {
    const tw = scene.tweens;
    if (!tw) return false;
    for (let p = o; p; p = p.parentContainer) {
      for (const t of tw.getTweensOf?.(p) ?? []) if ((t.data ?? []).some((d) => keys.test(d.key))) return true;
    }
    return false;
  }

  function screenRect(scene, o, b) {
    // HUD (scrollFactor 0) sits in screen space already; world objects move with the camera.
    const cam = scene.cameras.main;
    let sf = o.scrollFactorX;
    for (let p = o.parentContainer; p; p = p.parentContainer) sf = Math.min(sf, p.scrollFactorX);
    const zoom = cam.zoom || 1;
    // Menus and overlays don't scroll (their camera is only offset to centre the layout): all their text is
    // screen text. Only the level's world moves.
    const hud = sf === 0 || scene.sys.settings.key !== 'Level';
    if (sf === 0) return { x: b.x, y: b.y, w: b.width, h: b.height, hud };
    return { x: (b.x - cam.worldView.x) * zoom, y: (b.y - cam.worldView.y) * zoom, w: b.width * zoom, h: b.height * zoom, hud };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
  }

  window.__qaText = function (opts = {}) {
    const game = window.__game;
    const touch = window.__inputMode?.current === 'touch';
    const W = game.scale.width;
    const H = game.scale.height;
    const issues = [];
    const add = (kind, scene, o, detail) => issues.push({ kind, scene: scene.sys.settings.key, text: String(o.text).replace(/\n/g, ' / ').slice(0, 90), detail });
    const hud = [];
    for (const scene of game.scene.getScenes(true)) {
      if (!scene.sys.settings.visible) continue;
      const walk = (list) => {
        for (const o of list) {
          if (o.list && o.type === 'Container') {
            walk(o.list);
            continue;
          }
          if (o.type !== 'BitmapText' || !o.text || !visibleChain(o)) continue;
          const text = String(o.text);
          if (text.trim() === '') continue;
          if (/[{}]/.test(text)) add('token', scene, o, 'unrendered control token');
          const missing = [...text].filter((c) => !GLYPHS.has(c));
          if (missing.length) add('glyph', scene, o, `no glyph for ${JSON.stringify([...new Set(missing)].join(''))}`);
          if (touch && KEY_NAMES.test(text) && !opts.allowKeys) add('key-on-touch', scene, o, 'names a keyboard key on a touch screen');
          const s = scaleOf(o);
          // The soft font (ui/PixelFont.ts) is made for fractional scales.
          if (o.font !== 'pixel-soft' && Math.abs(s - Math.round(s)) > 0.02 && !tweening(scene, o, /^scale/)) add('fractional', scene, o, `drawn at ${s.toFixed(2)}x: garbled pixels`);
          let b;
          try {
            b = o.getBounds();
          } catch {
            continue;
          }
          const r = screenRect(scene, o, b);
          if (r.hud) {
            const cut = r.x < SAFE - 0.5 || r.y < SAFE - 0.5 || r.x + r.w > W - SAFE + 0.5 || r.y + r.h > H - SAFE + 0.5;
            if (cut && !tweening(scene, o, /^(x|y|scale)/)) add('offscreen', scene, o, `at ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)} on a ${W}x${H} screen`);
            // Overlaps compare the glyphs' fill: a line's box adds 2 px of spacing under the glyphs, and a 1 px dark
            // outline around them may touch a neighbour's.
            hud.push({ o, r: { x: r.x + s, y: r.y + s, w: r.w - 2 * s, h: r.h - 4 * s }, scene });
          }
          // A declared box (ui/text.ts boxed(): buttons, cards, panels, the dialogue box) must hold its text.
          const box = o.getData?.('box');
          if (box) {
            const parent = o.parentContainer;
            let pts = [
              [box.x, box.y],
              [box.x + box.w, box.y + box.h],
            ];
            if (parent) {
              const m = parent.getBoundsTransformMatrix();
              pts = pts.map(([px, py]) => {
                const t = m.transformPoint(px, py);
                return [t.x, t.y];
              });
            }
            const bx0 = Math.min(pts[0][0], pts[1][0]);
            const bx1 = Math.max(pts[0][0], pts[1][0]);
            const by0 = Math.min(pts[0][1], pts[1][1]);
            const by1 = Math.max(pts[0][1], pts[1][1]);
            if (b.x < bx0 - 1 || b.right > bx1 + 1 || b.y < by0 - 1 || b.bottom > by1 + 1) {
              add('box', scene, o, `spills out of its ${Math.round(bx1 - bx0)}x${Math.round(by1 - by0)} box by ${Math.round(Math.max(bx0 - b.x, b.right - bx1, by0 - b.y, b.bottom - by1))} px`);
            }
          }
        }
      };
      walk(scene.children.list);
    }
    // HUD text under a thumb: over a touch button, the Omnitrix button or the stick's resting place.
    const pad = game.scene.getScene('Touch');
    if (pad?.sys.isActive() && pad.sys.settings.visible && pad.buttons) {
      const zones = [...Object.entries(pad.buttons), ['omnitrix', pad.dial]]
        .filter(([, b]) => b?.root?.visible && b.root.alpha > 0.02)
        .map(([name, b]) => ({ name, x: b.root.x, y: b.root.y, r: b.r }));
      if (pad.stick?.root?.visible) zones.push({ name: 'stick', x: pad.stick.cx, y: pad.stick.cy, r: 34 });
      for (const h of hud) {
        if (h.scene === pad) continue;
        for (const z of zones) {
          const nx = Math.max(h.r.x, Math.min(z.x, h.r.x + h.r.w));
          const ny = Math.max(h.r.y, Math.min(z.y, h.r.y + h.r.h));
          if ((nx - z.x) ** 2 + (ny - z.y) ** 2 < z.r * z.r) add('thumb', h.scene, h.o, `under the touch ${z.name} button`);
        }
      }
    }
    // Screen text drawn over other screen text (in any scene: HUD over touch labels too). Text under a modal
    // overlay (the pause menu dims everything beneath it) and a text's own drop shadow don't count.
    const MODALS = ['Pause', 'Settings', 'GameOver'];
    const modalAt = Math.max(-1, ...game.scene.getScenes(true).filter((sc) => MODALS.includes(sc.sys.settings.key)).map((sc) => game.scene.getIndex(sc)));
    for (let i = 0; i < hud.length; i++) {
      for (let j = i + 1; j < hud.length; j++) {
        const a = hud[i];
        const c = hud[j];
        if (a.o.text === c.o.text) continue;
        if (game.scene.getIndex(a.scene) < modalAt || game.scene.getIndex(c.scene) < modalAt) continue;
        if (overlaps(a.r, c.r)) add('overlap', a.scene, a.o, `overlaps "${String(c.o.text).replace(/\n/g, ' / ').slice(0, 40)}" (${c.scene.sys.settings.key})`);
      }
    }
    return issues;
  };
})();
