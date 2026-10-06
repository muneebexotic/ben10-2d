/**
 * What the autobench knows about the device: screen, canvas, WebGL, power
 * hints, and warnings about things that make a phone slower than it is.
 */
export interface DeviceInfo {
  ua: string;
  dpr: number;
  screen: string;
  viewport: string;
  cores: number | null;
  memoryGb: number | null;
  /** Measured on the idle start screen. */
  refreshHz: number;
  battery: string | null;
  saveData: boolean;
  reducedMotion: boolean;
  renderer: string;
  vendor: string;
  webgl: string;
  contextAttributes: string;
  maxTextureSize: number;
  timerQuery: string;
  canvas: string;
  inApp: string | null;
}

/** Recognises in-app browsers (Instagram, Facebook, TikTok, Snapchat, the Google app, Android WebViews...). */
export function inAppBrowser(ua: string): string | null {
  const checks: Array<[RegExp, string]> = [
    [/Instagram/i, 'Instagram'],
    [/FBAN|FBAV|FB_IAB|FBIOS/i, 'Facebook'],
    [/musical_ly|BytedanceWebview|TikTok/i, 'TikTok'],
    [/Snapchat/i, 'Snapchat'],
    [/Twitter/i, 'Twitter/X'],
    [/\bLine\//i, 'LINE'],
    [/WhatsApp/i, 'WhatsApp'],
    [/Discord/i, 'Discord'],
    [/\bGSA\//i, 'the Google app'],
    [/; wv\)/i, 'an Android WebView'],
  ];
  for (const [re, name] of checks) if (re.test(ua)) return name;
  return null;
}

export interface WarningInput {
  refreshHz: number;
  battery: { level: number; charging: boolean } | null;
  inApp: string | null;
  saveData: boolean;
  fullscreen: boolean;
  touch: boolean;
  zoom: number;
}

/** Things that hold a phone back, in plain words (pure, for tests). */
export function deviceWarnings(w: WarningInput): string[] {
  const out: string[] = [];
  if (w.refreshHz > 0 && w.refreshHz <= 35) out.push(`THE SCREEN RUNS AT ${w.refreshHz} HZ: BATTERY SAVER OR A POWER-SAVING MODE IS PROBABLY ON. TURN IT OFF AND RELOAD.`);
  else if (w.refreshHz > 35 && w.refreshHz < 58) out.push(`THE SCREEN RUNS AT ${w.refreshHz} HZ: SOMETHING IS LIMITING THE REFRESH RATE (POWER SAVING, A LOW-RATE MODE).`);
  if (w.battery && !w.battery.charging && w.battery.level < 0.2) out.push('BATTERY UNDER 20% AND NOT CHARGING: PHONES SLOW DOWN WHEN LOW. PLUG IN.');
  if (w.inApp) out.push(`THIS IS ${w.inApp.toUpperCase()}'S BUILT-IN BROWSER: OPEN THE LINK IN CHROME FOR REAL NUMBERS.`);
  if (w.saveData) out.push('DATA SAVER (LITE MODE) IS ON.');
  if (w.touch && !w.fullscreen) out.push('NOT FULLSCREEN: TAP START TO GO FULLSCREEN (THE BROWSER BARS COST A LITTLE).');
  if (Math.abs(w.zoom - 1) > 0.01) out.push('THE PAGE IS ZOOMED: PINCH BACK OUT.');
  return out;
}

export function webglInfo(gl: WebGLRenderingContext): Pick<DeviceInfo, 'renderer' | 'vendor' | 'webgl' | 'contextAttributes' | 'maxTextureSize' | 'timerQuery'> {
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  const vendor = String(dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR));
  const a = gl.getContextAttributes();
  const bit = (v: boolean | undefined) => (v ? 1 : 0);
  const attrs = a
    ? `alpha=${bit(a.alpha)} depth=${bit(a.depth)} stencil=${bit(a.stencil)} aa=${bit(a.antialias)} pma=${bit(a.premultipliedAlpha)} pdb=${bit(a.preserveDrawingBuffer)} desync=${bit(a.desynchronized)} power=${a.powerPreference ?? '?'}`
    : 'unknown';
  return {
    renderer,
    vendor,
    webgl: String(gl.getParameter(gl.VERSION)),
    contextAttributes: attrs,
    maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
    timerQuery: timerQuerySupport(gl),
  };
}

/** Which GPU timer extension exists: the game's WebGL1 context, and a throwaway WebGL2 one (for the record). */
function timerQuerySupport(gl: WebGLRenderingContext): string {
  const v1 = gl.getExtension('EXT_disjoint_timer_query') ? 'webgl1 yes' : 'webgl1 no';
  let v2 = 'webgl2 no';
  try {
    const c = document.createElement('canvas');
    const gl2 = c.getContext('webgl2');
    if (gl2) {
      v2 = gl2.getExtension('EXT_disjoint_timer_query_webgl2') ? 'webgl2 yes' : 'webgl2 no';
      gl2.getExtension('WEBGL_lose_context')?.loseContext();
    } else {
      v2 = 'webgl2 unavailable';
    }
  } catch {
    v2 = 'webgl2 unavailable';
  }
  return `${v1}, ${v2}`;
}

/** Canvas backing size against its CSS size and the physical pixels it covers. */
export function canvasInfo(canvas: HTMLCanvasElement): string {
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const css = `${Math.round(r.width)}x${Math.round(r.height)}`;
  const phys = `${Math.round(r.width * dpr)}x${Math.round(r.height * dpr)}`;
  const k = canvas.width > 0 ? r.width / canvas.width : 0;
  const style = getComputedStyle(canvas).imageRendering;
  return `backing ${canvas.width}x${canvas.height}, css ${css} (${k.toFixed(2)} css px per px), physical ${phys}, image-rendering ${style}`;
}

export async function batteryState(): Promise<{ level: number; charging: boolean } | null> {
  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (!nav.getBattery) return null;
    const b = await nav.getBattery();
    return { level: b.level, charging: b.charging };
  } catch {
    return null;
  }
}

export function describeBattery(b: { level: number; charging: boolean } | null): string | null {
  return b ? `${Math.round(b.level * 100)}% ${b.charging ? 'charging' : 'on battery'}` : null;
}

export function collectDevice(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, refreshHz: number, battery: { level: number; charging: boolean } | null): DeviceInfo {
  const nav = navigator as unknown as { deviceMemory?: number; connection?: { saveData?: boolean } };
  const ua = navigator.userAgent;
  let reducedMotion = false;
  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    reducedMotion = false;
  }
  return {
    ua,
    dpr: window.devicePixelRatio || 1,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    cores: navigator.hardwareConcurrency ?? null,
    memoryGb: nav.deviceMemory ?? null,
    refreshHz,
    battery: describeBattery(battery),
    saveData: nav.connection?.saveData === true,
    reducedMotion,
    ...webglInfo(gl),
    canvas: canvasInfo(canvas),
    inApp: inAppBrowser(ua),
  };
}
