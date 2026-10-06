/**
 * The autobench's start, continue and report screens. Plain DOM over the
 * canvas (they need real buttons, a scrolling report and the clipboard); none
 * of them is on screen while a run is being measured.
 */

const STYLE_ID = 'autobench-style';
const CSS = `
.ab-overlay{position:fixed;inset:0;z-index:30;background:rgba(4,6,15,.97);color:#f4f4f0;
 font:600 13px/1.45 ui-monospace,Menlo,Consolas,monospace;display:flex;flex-direction:column;gap:10px;
 box-sizing:border-box;padding:max(12px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));
 overflow:auto;-webkit-user-select:text;user-select:text;touch-action:auto}
.ab-overlay h1{margin:0;font-size:20px;color:#5dff5a;letter-spacing:2px}
.ab-overlay p{margin:0}
.ab-dim{color:#8a93b8;font-weight:400}
.ab-warn{color:#ffd23c}
.ab-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.ab-btn{appearance:none;border:3px solid #5dff5a;background:#123a14;color:#f4f4f0;font:800 18px ui-monospace,Menlo,monospace;
 padding:14px 22px;border-radius:10px;letter-spacing:1px;min-height:56px;touch-action:manipulation}
.ab-btn.ab-big{font-size:24px;padding:16px 36px;min-width:220px}
.ab-btn.ab-quiet{border-color:#3a4268;background:#10142a;font-size:14px;min-height:44px;padding:10px 16px}
.ab-report{flex:1 1 auto;min-height:120px;width:100%;box-sizing:border-box;background:#0b1024;color:#d8ffd6;border:1px solid #2a3260;
 border-radius:6px;padding:8px;font:400 10.5px/1.35 ui-monospace,Menlo,Consolas,monospace;white-space:pre;overflow:auto;resize:none}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function button(text: string, cls: string, onTap: () => void): HTMLButtonElement {
  const b = el('button', `ab-btn ${cls}`, text);
  b.type = 'button';
  // Fullscreen and audio need a real user gesture: act on click (the end of a tap).
  b.addEventListener('click', (e) => {
    e.preventDefault();
    onTap();
  });
  return b;
}

function overlay(): HTMLDivElement {
  ensureStyle();
  const o = el('div', 'ab-overlay');
  // Keep taps here from reaching the game's own listeners.
  for (const type of ['pointerdown', 'touchstart', 'keydown']) o.addEventListener(type, (e) => e.stopPropagation());
  // In fullscreen only the fullscreen element (and what's inside it) is drawn.
  (document.fullscreenElement ?? document.body).appendChild(o);
  return o;
}

export interface StartOverlay {
  setInfo(lines: string[], warnings: string[]): void;
  close(): void;
}

export function showStartOverlay(opts: {
  runs: number;
  minutes: number;
  quickMinutes: number;
  hasReport: boolean;
  onStart: (quick: boolean) => void;
  onReport: () => void;
}): StartOverlay {
  const o = overlay();
  o.append(el('h1', '', 'AUTOBENCH'));
  o.append(el('p', '', `THE GAME PLAYS ITS HEAVIEST SCENES BY ITSELF, ${opts.runs} RUNS: EACH ONE NORMALLY, THEN WITH EACH EFFECT SWITCHED OFF, TO FIND WHAT SLOWS THIS PHONE DOWN.`));
  o.append(el('p', 'ab-dim', `ABOUT ${opts.minutes} MIN. PLUG THE PHONE IN, KEEP THIS TAB IN FRONT AND DON'T TOUCH THE SCREEN; IT STAYS ON BY ITSELF. SOUND PLAYS (TURN THE VOLUME DOWN). NOTHING IS SAVED TO YOUR GAME FILES. AT THE END: A REPORT WITH A COPY BUTTON.`));
  const info = el('p', 'ab-dim', 'MEASURING THE SCREEN...');
  const warn = el('p', 'ab-warn');
  o.append(info, warn);
  const row = el('div', 'ab-row');
  row.append(button('START', 'ab-big', () => opts.onStart(false)));
  row.append(button(`QUICK (${opts.quickMinutes} MIN)`, 'ab-quiet', () => opts.onStart(true)));
  if (opts.hasReport) row.append(button('LAST REPORT', 'ab-quiet', () => opts.onReport()));
  o.append(row);
  return {
    setInfo(lines, warnings) {
      info.textContent = lines.join('  |  ');
      warn.textContent = warnings.length ? `WARNING: ${warnings.join('  ')}` : '';
    },
    close: () => o.remove(),
  };
}

/** Between pages (context variants reload the page): a tap restores fullscreen; otherwise it carries on by itself. */
export function showContinueOverlay(title: string, seconds: number, onGo: (tapped: boolean) => void): void {
  const o = overlay();
  o.append(el('h1', '', 'AUTOBENCH'));
  o.append(el('p', '', title));
  const count = el('p', 'ab-dim');
  o.append(count);
  let left = seconds;
  let done = false;
  const go = (tapped: boolean) => {
    if (done) return;
    done = true;
    window.clearInterval(timer);
    o.remove();
    onGo(tapped);
  };
  const tick = () => {
    count.textContent = `TAP ANYWHERE FOR FULLSCREEN, OR WAIT: CONTINUING IN ${left}...`;
    if (left-- <= 0) go(false);
  };
  const timer = window.setInterval(tick, 1000);
  tick();
  o.addEventListener('click', () => go(true));
}

export function showReportOverlay(report: string, opts: { title: string; onRerun: () => void; onClose: () => void }): void {
  const o = overlay();
  o.append(el('h1', '', opts.title));
  const row = el('div', 'ab-row');
  const copy = button('COPY REPORT', 'ab-big', () => {
    void copyText(report, area).then((ok) => {
      copy.textContent = ok ? 'COPIED!' : 'SELECT ALL + COPY';
      window.setTimeout(() => (copy.textContent = 'COPY REPORT'), 2500);
    });
  });
  row.append(copy);
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
  if (nav.share) row.append(button('SHARE', 'ab-quiet', () => void nav.share?.({ text: report }).catch(() => undefined)));
  row.append(button('RUN AGAIN', 'ab-quiet', opts.onRerun));
  row.append(button('TO THE GAME', 'ab-quiet', opts.onClose));
  o.append(row);
  const area = el('textarea', 'ab-report');
  area.readOnly = true;
  area.value = report;
  area.spellcheck = false;
  o.append(area);
}

async function copyText(text: string, area: HTMLTextAreaElement): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the old way.
  }
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  }
}
