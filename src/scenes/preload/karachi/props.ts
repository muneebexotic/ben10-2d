import { PALETTE as P } from '../../../config/palette';
import { letteringCentred, letteringWidth } from '../lettering';
import { seeded, type PixelCanvas } from '../PixelCanvas';
import { KARACHI as K } from './colors';

/**
 * Chapter 6's set dressing: the seafront fair (chai and juice stalls, the
 * bun kebab cart, a decorated camel, the balloon and kite sellers, the
 * Ferris wheel, THE GREAT HEXO's tent), the street (a truck-art bus, a
 * rickshaw and a chingchi, painted shop signs), the pink palace and its
 * library, the cellars, the tunnel and the clock. Signs are in English and
 * romanised Urdu in the game's own pixel font.
 */

const SKIN = 0xc89068;

/** A little person: (x, feet) bottom centre, shirt and trousers colours. */
function person(pc: PixelCanvas, x: number, feet: number, shirt: number, legs: number, hair = 0x1a1414, h = 24): void {
  const top = feet - h;
  pc.rect(x - 3, feet - 9, 2, 9, legs).rect(x + 1, feet - 9, 2, 9, legs);
  pc.rect(x - 4, feet - 1, 3, 1, 0x2a2018).rect(x + 1, feet - 1, 3, 1, 0x2a2018);
  pc.rect(x - 4, top + 7, 8, h - 15, shirt);
  pc.rect(x - 6, top + 8, 2, 7, shirt).rect(x + 4, top + 8, 2, 7, shirt);
  pc.px(x - 6, top + 15, SKIN).px(x + 5, top + 15, SKIN);
  pc.rect(x - 3, top, 6, 7, SKIN);
  pc.rect(x - 3, top, 6, 2, hair);
  pc.px(x - 2, top + 3, 0x1a1414).px(x + 1, top + 3, 0x1a1414);
}

/** A strip of coloured bunting or bulbs sagging from (x0, y) to (x1, y). */
function sagLine(pc: PixelCanvas, x0: number, x1: number, y: number, sag: number, colors: readonly number[], every = 4): void {
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / Math.max(1, x1 - x0);
    const yy = y + Math.round(Math.sin(t * Math.PI) * sag);
    pc.px(x, yy, 0x2a2430);
    if ((x - x0) % every === 0) pc.px(x, yy + 1, colors[((x - x0) / every) % colors.length]);
  }
}

// ---------------------------------------------------------------- The fair

/** Rauf's chai dhaba: a striped awning, the big kettle on its stove, glasses on the counter, a bench. 96x64. */
export function drawChaiDhaba(pc: PixelCanvas): void {
  // Posts and awning.
  pc.rect(4, 14, 3, 50, K.wood1).rect(89, 14, 3, 50, K.wood1);
  for (let x = 0; x < 96; x += 8) pc.rect(x, 8, 8, 8, (x / 8) % 2 === 0 ? K.truckRed : P.cream);
  for (let x = 0; x < 96; x += 8) pc.poly([[x, 16], [x + 8, 16], [x + 4, 20]], (x / 8) % 2 === 0 ? K.truckRed : P.cream);
  pc.rect(0, 6, 96, 2, K.wood0);
  // Painted sign on the awning.
  pc.rect(22, 0, 52, 9, K.truckGreen);
  letteringCentred(pc, 48, 1, 'RAUF CHAI', K.truckYellow);
  // Counter.
  pc.rect(8, 40, 80, 24, K.wood2);
  pc.rect(8, 40, 80, 3, K.wood3);
  for (let x = 12; x < 86; x += 10) pc.rect(x, 46, 6, 14, K.wood1);
  // Stove and the big aluminium kettle, steaming.
  pc.rect(14, 34, 20, 6, 0x3a3a40);
  pc.rect(18, 36, 3, 2, 0xff8a2a).rect(26, 36, 3, 2, 0xff8a2a);
  pc.ellipse(24, 28, 9, 6, 0xb8c0c8);
  pc.rect(16, 28, 17, 6, 0xb8c0c8);
  pc.rect(33, 26, 5, 2, 0xb8c0c8).px(38, 25, 0xb8c0c8);
  pc.rect(21, 20, 6, 2, 0x8a9098);
  for (let i = 0; i < 4; i++) pc.px(22 + i, 16 - i * 2, 0xffffff, 0.5);
  // Small chai glasses in a row.
  for (let x = 44; x < 80; x += 6) {
    pc.rect(x, 34, 4, 6, 0xc88a4a);
    pc.rect(x, 34, 4, 1, 0xf0e0c8);
  }
  // A hanging bulb.
  pc.vline(60, 16, 22, 0x2a2430);
  pc.rect(59, 22, 3, 3, K.bulb);
}

/** The bun kebab cart: a griddle, a stack of buns, a painted board, bicycle wheels. 48x40. */
export function drawKebabCart(pc: PixelCanvas): void {
  pc.rect(2, 18, 44, 14, K.truckBlue);
  pc.rect(2, 18, 44, 2, K.chrome);
  letteringCentred(pc, 24, 22, 'BUN KEBAB', K.truckYellow);
  pc.rect(4, 12, 24, 6, 0x2a2a30);
  for (let x = 6; x < 26; x += 6) pc.ellipse(x + 2, 11, 3, 1, 0x7a4a2a);
  pc.ellipse(36, 13, 6, 3, 0xd8a050).ellipse(36, 10, 5, 2, 0xe8b860);
  pc.rect(44, 6, 2, 26, K.chrome).rect(40, 6, 6, 1, K.chrome);
  for (const wx of [10, 38]) {
    pc.circle(wx, 34, 5, 0x2a2a30);
    pc.circle(wx, 34, 3, K.chrome);
    pc.px(wx, 34, 0x2a2a30);
  }
  // Steam off the griddle.
  pc.px(10, 7, 0xffffff, 0.5).px(16, 5, 0xffffff, 0.4).px(20, 8, 0xffffff, 0.5);
}

/** A fresh juice stall: oranges and pomegranates piled up, a hand press, its sign. 56x56. */
export function drawJuiceStall(pc: PixelCanvas): void {
  pc.rect(2, 10, 3, 46, K.wood1).rect(51, 10, 3, 46, K.wood1);
  pc.rect(0, 4, 56, 8, K.truckYellow);
  for (let x = 0; x < 56; x += 7) pc.poly([[x, 12], [x + 7, 12], [x + 3.5, 15]], K.truckYellow);
  letteringCentred(pc, 28, 6, 'TAAZA JUICE', K.truckRed);
  pc.rect(4, 34, 48, 22, K.truckGreen);
  pc.rect(4, 34, 48, 3, P.cream);
  const rnd = seeded(71);
  for (let i = 0; i < 18; i++) {
    const x = 8 + Math.floor(rnd() * 22);
    const y = 26 + Math.floor(rnd() * 7);
    pc.circle(x, y, 2, rnd() < 0.7 ? 0xff9a2a : 0xc82a3a);
  }
  // The press and a full glass.
  pc.rect(36, 22, 10, 12, K.chrome).rect(40, 16, 2, 6, K.chrome).rect(37, 16, 8, 2, K.chrome);
  pc.rect(46, 28, 4, 6, 0xffb03a).rect(46, 28, 4, 1, P.white);
}

/** The balloon seller: a man holding a bunch of bright balloons on strings. 32x64. */
export function drawBalloonSeller(pc: PixelCanvas): void {
  person(pc, 16, 64, 0x4a8ac8, 0xe8e0d0, 0x1a1414, 26);
  const colors = [K.truckRed, K.truckYellow, K.truckBlue, K.truckPink, K.truckGreen, 0xff8a2a];
  const spots: Array<[number, number]> = [[8, 6], [16, 4], [24, 7], [12, 13], [21, 14], [28, 16], [5, 16]];
  spots.forEach(([x, y], i) => {
    pc.line(x, y + 4, 21, 42, 0xd8d8d8);
    pc.ellipse(x, y, 3, 4, colors[i % colors.length]);
    pc.px(x - 1, y - 2, P.white);
  });
}

/** A seafront camel in its finery: a bright woven saddle cloth, pompoms, a beaded bridle. 56x52. */
export function drawCamel(pc: PixelCanvas): void {
  const body = 0xb88a5a;
  const dark = 0x8a6440;
  // Legs.
  for (const lx of [12, 18, 36, 42]) pc.rect(lx, 34, 3, 18, dark).rect(lx - 1, 50, 5, 2, 0x5a4028);
  // Body and hump.
  pc.ellipse(27, 30, 18, 8, body);
  pc.ellipse(27, 20, 9, 8, body);
  // Neck and head.
  pc.poly([[42, 28], [47, 26], [52, 10], [48, 8], [44, 22]], body);
  pc.ellipse(51, 9, 5, 3, body);
  pc.px(53, 8, 0x1a1414);
  pc.rect(54, 10, 2, 1, dark);
  // The saddle cloth: red with yellow and green bands, tassels.
  pc.rect(14, 18, 26, 14, K.truckRed);
  pc.rect(14, 21, 26, 2, K.truckYellow).rect(14, 27, 26, 2, K.truckGreen);
  for (let x = 15; x < 40; x += 4) pc.rect(x, 32, 1, 3, K.truckYellow).px(x, 35, K.truckPink);
  pc.rect(20, 12, 14, 6, K.truckBlue);
  pc.rect(25, 9, 4, 3, K.truckYellow);
  // Pompoms and bridle beads.
  for (const [x, y] of [[14, 17], [40, 17], [47, 14], [50, 6]] as const) pc.circle(x, y, 1, K.truckPink);
  pc.line(46, 12, 53, 11, K.truckYellow);
  // The tail.
  pc.line(9, 28, 6, 36, dark);
}

/** A white horse with a red plume and a fringed saddle (seafront rides). 44x40. */
export function drawHorse(pc: PixelCanvas): void {
  const coat = 0xe8e4dc;
  const shade = 0xb8b4ac;
  for (const lx of [9, 14, 30, 35]) pc.rect(lx, 26, 3, 14, shade).rect(lx, 38, 3, 2, 0x3a3030);
  pc.ellipse(22, 22, 15, 7, coat);
  pc.poly([[32, 20], [36, 6], [41, 8], [42, 12], [38, 14], [36, 22]], coat);
  pc.px(39, 9, 0x1a1414);
  pc.line(35, 7, 32, 16, 0x8a8078, 2);
  pc.rect(35, 1, 3, 5, K.truckRed);
  pc.rect(14, 15, 14, 8, K.truckRed);
  for (let x = 14; x < 28; x += 2) pc.px(x, 23, K.truckYellow);
  pc.line(7, 20, 3, 30, shade, 2);
}

/** The Ferris wheel's rim, spokes and gondolas: it turns (Decor spins it). 144x144. */
export function drawFerrisWheel(pc: PixelCanvas): void {
  const c = 72;
  const r = 66;
  for (let i = 0; i < 360; i += 1) {
    const a = (i * Math.PI) / 180;
    pc.px(c + Math.cos(a) * r, c + Math.sin(a) * r, 0x8a8aa8);
    pc.px(c + Math.cos(a) * (r - 4), c + Math.sin(a) * (r - 4), 0x6a6a88);
  }
  const colors = [K.truckRed, K.truckYellow, K.truckBlue, K.truckPink, K.truckGreen, 0xff8a2a];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pc.line(c, c, c + Math.cos(a) * r, c + Math.sin(a) * r, 0x6a6a88);
    // Bulbs along each spoke and a gondola at the rim.
    for (let k = 1; k < 6; k++) pc.px(c + Math.cos(a) * (k * 12), c + Math.sin(a) * (k * 12), k % 2 ? K.bulb : K.bulbWarm);
    pc.rect(c + Math.cos(a) * r - 3, c + Math.sin(a) * r - 2, 7, 5, colors[i % colors.length]);
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    pc.px(c + Math.cos(a) * (r + 1), c + Math.sin(a) * (r + 1), i % 2 ? K.bulb : K.truckPink);
  }
  pc.circle(c, c, 5, 0x4a4a68);
  pc.circle(c, c, 2, K.bulb);
}

/** The Ferris wheel's A-frame stand (the wheel turns on top of it). 120x96, the axle at the top centre. */
export function drawFerrisHub(pc: PixelCanvas): void {
  pc.line(60, 2, 12, 95, 0x4a4a68, 3);
  pc.line(60, 2, 108, 95, 0x4a4a68, 3);
  pc.line(36, 48, 84, 48, 0x4a4a68, 2);
  pc.rect(40, 86, 40, 10, 0x3a2a4a);
  pc.rect(42, 88, 36, 4, K.truckYellow);
  letteringCentred(pc, 60, 88, 'RIDES', K.truckRed);
}

/** THE GREAT HEXO's big top: violet and gold stripes, pennants, a lit marquee over the curtains. 176x120. */
export function drawHexTent(pc: PixelCanvas): void {
  // Roof cone.
  for (let x = 0; x < 176; x++) {
    const t = Math.abs(x - 88) / 88;
    const top = Math.round(8 + t * 40);
    pc.rect(x, top, 1, 52 - top + 8, Math.floor(x / 11) % 2 === 0 ? K.canvasA : K.canvasB);
  }
  pc.rect(87, 0, 2, 10, K.wood1);
  pc.poly([[89, 0], [100, 3], [89, 6]], K.charm2);
  // Walls.
  for (let x = 8; x < 168; x++) pc.rect(x, 56, 1, 64, Math.floor((x - 8) / 10) % 2 === 0 ? K.canvasA : 0x4a1a6a);
  // Scalloped valance.
  for (let x = 8; x < 168; x += 10) pc.ellipse(x + 5, 57, 5, 3, K.canvasB);
  // The entrance: curtains drawn back.
  pc.rect(70, 70, 36, 50, 0x140a1e);
  pc.poly([[70, 70], [82, 70], [72, 120], [70, 120]], 0x8a1a3a);
  pc.poly([[106, 70], [94, 70], [104, 120], [106, 120]], 0x8a1a3a);
  // Marquee with bulbs.
  pc.rect(44, 60, 88, 12, 0x2a1a3a);
  for (let x = 46; x < 132; x += 4) pc.px(x, 61, K.bulb).px(x, 70, K.bulb);
  letteringCentred(pc, 88, 63, 'THE GREAT HEXO', K.brass2);
  // Pennant lines.
  sagLine(pc, 0, 87, 30, 10, [K.truckRed, K.truckYellow, K.truckBlue, K.truckGreen], 5);
  sagLine(pc, 89, 175, 30, 10, [K.truckPink, K.truckYellow, K.truckBlue, K.truckRed], 5);
}

/** ANCIENT WONDERS: the touring exhibition's white pavilion. 128x80. */
export function drawExhibitTent(pc: PixelCanvas): void {
  pc.poly([[0, 30], [64, 4], [128, 30]], 0xe8e4dc);
  pc.poly([[8, 30], [64, 8], [64, 30]], 0xd0ccc4);
  pc.rect(6, 30, 116, 50, 0xf4f0e8);
  for (let x = 6; x < 122; x += 12) pc.vline(x, 30, 79, 0xc8c4bc);
  pc.rect(48, 44, 32, 36, 0x2a2430);
  pc.rect(22, 32, 84, 10, K.tile0);
  letteringCentred(pc, 64, 34, 'ANCIENT WONDERS', K.brass2);
  for (const x of [20, 100]) pc.rect(x, 50, 10, 14, 0x3a3440).rect(x + 2, 52, 6, 10, K.brass1);
}

/** A truck-art bus: every inch painted, chrome trim, a crown up front, chains and tassels jingling. 144x80. */
export function drawTruckBus(pc: PixelCanvas): void {
  // Body.
  pc.rect(4, 22, 136, 44, K.truckBlue);
  pc.rect(4, 22, 136, 4, K.truckYellow);
  pc.rect(4, 58, 136, 8, K.truckRed);
  // Windows with passengers' silhouettes.
  for (let x = 14; x < 120; x += 16) {
    pc.rect(x, 30, 12, 12, 0x1a2440);
    if (x % 32 === 14) pc.circle(x + 6, 37, 3, 0x0a0e1a);
  }
  // Painted panels: flowers, a peacock eye, stripes.
  for (let x = 10; x < 132; x += 14) {
    pc.circle(x + 4, 50, 3, K.truckPink);
    pc.circle(x + 4, 50, 1, K.truckYellow);
    pc.px(x + 9, 47, K.truckGreen).px(x + 10, 48, K.truckGreen).px(x + 9, 53, K.truckGreen).px(x + 10, 52, K.truckGreen);
  }
  pc.ellipse(70, 50, 8, 5, K.truckGreen);
  pc.ellipse(70, 50, 4, 3, K.truckBlue);
  pc.circle(70, 50, 1, K.truckYellow);
  // The ornate crown above the cab.
  pc.poly([[118, 22], [122, 4], [128, 14], [134, 0], [138, 22]], K.truckYellow);
  pc.circle(128, 14, 2, K.truckRed);
  // Chrome bumper, chains and tassels.
  pc.rect(2, 64, 140, 3, K.chrome);
  for (let x = 6; x < 140; x += 5) pc.rect(x, 67, 1, 3, K.chrome).px(x, 70, x % 10 === 1 ? K.truckRed : K.truckYellow);
  // Wheels.
  for (const wx of [28, 112]) {
    pc.circle(wx, 70, 9, 0x1a1a22);
    pc.circle(wx, 70, 4, K.chrome);
  }
  // A destination board.
  pc.rect(40, 14, 60, 8, 0x1a1a22);
  letteringCentred(pc, 70, 15, 'SADDAR - KEAMARI', K.bulbWarm);
}

/** An auto rickshaw: green body, yellow canopy, three wheels, a little fringe. 48x40. */
export function drawRickshaw(pc: PixelCanvas): void {
  pc.poly([[6, 14], [38, 12], [44, 18], [44, 32], [4, 32]], K.rickGreen);
  pc.rect(4, 8, 36, 6, K.rickYellow);
  pc.rect(6, 6, 32, 2, K.rickYellow);
  for (let x = 6; x < 38; x += 3) pc.px(x, 14, K.truckRed);
  pc.rect(8, 16, 14, 12, 0x1a2a20);
  pc.rect(30, 16, 10, 8, 0x2a4a5a);
  pc.rect(42, 22, 4, 3, K.bulb);
  for (const wx of [10, 38]) {
    pc.circle(wx, 34, 5, 0x1a1a22);
    pc.circle(wx, 34, 2, K.chrome);
  }
}

/** A chingchi: a motorbike towing a covered passenger cart with a bright canopy. 64x40. */
export function drawChingchi(pc: PixelCanvas): void {
  pc.rect(2, 10, 38, 4, K.truckPink);
  for (let x = 2; x < 40; x += 4) pc.poly([[x, 14], [x + 4, 14], [x + 2, 17]], K.truckPink);
  pc.rect(4, 14, 2, 16, K.chrome).rect(36, 14, 2, 16, K.chrome);
  pc.rect(4, 22, 34, 8, K.truckYellow);
  pc.rect(8, 18, 26, 4, 0x8a2a4a);
  pc.circle(10, 33, 5, 0x1a1a22).circle(32, 33, 5, 0x1a1a22);
  // The bike.
  pc.line(38, 26, 52, 22, K.chrome, 2);
  pc.rect(44, 20, 10, 6, K.truckRed);
  pc.line(54, 18, 56, 26, K.chrome);
  pc.circle(56, 33, 5, 0x1a1a22);
  pc.circle(56, 33, 2, K.chrome);
}

/** Painted shop signs (four): CHAI KHANA, BUN KEBAB, TAAZA JUICE, PATANG HOUSE. 72x22 each. */
export function drawShopSign(pc: PixelCanvas, frame: number): void {
  const signs: Array<[string, number, number]> = [
    ['CHAI KHANA', K.truckGreen, K.truckYellow],
    ['BUN KEBAB', K.truckRed, P.white],
    ['TAAZA JUICE', K.truckYellow, K.truckRed],
    ['PATANG HOUSE', K.truckBlue, K.truckPink],
  ];
  const [text, bg, fg] = signs[frame % signs.length];
  pc.rect(0, 2, 72, 18, 0x1a1a22);
  pc.rect(1, 3, 70, 16, bg);
  for (let x = 2; x < 70; x += 4) pc.px(x, 4, fg).px(x + 2, 17, fg);
  const w = letteringWidth(text);
  letteringCentred(pc, 36, w > 64 ? 7 : 7, text, fg);
  pc.rect(10, 0, 2, 3, 0x2a2430).rect(60, 0, 2, 3, 0x2a2430);
}

/** A string of fair bulbs. 96x20. */
export function drawFairLights(pc: PixelCanvas): void {
  sagLine(pc, 0, 95, 2, 12, [K.bulb, K.truckPink, K.bulbWarm, K.truckBlue, K.truckGreen], 5);
}

/** The seafront railing: iron posts and a top rail. 48x18. */
export function drawPromenadeRail(pc: PixelCanvas): void {
  pc.rect(0, 2, 48, 2, 0xb8b8c8);
  pc.rect(0, 10, 48, 1, 0x8a8aa0);
  for (let x = 0; x < 48; x += 8) pc.rect(x, 2, 2, 16, 0x8a8aa0).px(x, 1, 0xd8d8e8);
}

/** The kite seller's stand: a frame hung with paper kites and spools of string. 40x56. */
export function drawKiteSeller(pc: PixelCanvas): void {
  pc.rect(2, 8, 2, 48, K.wood1).rect(36, 8, 2, 48, K.wood1).rect(0, 6, 40, 3, K.wood2);
  const colors = [K.truckRed, K.truckYellow, K.truckGreen, K.truckPink, K.truckBlue, 0xff8a2a];
  [[10, 18], [20, 14], [30, 19], [14, 32], [26, 30]].forEach(([x, y], i) => {
    pc.poly([[x, y - 6], [x + 5, y], [x, y + 6], [x - 5, y]], colors[i % colors.length]);
    pc.line(x, y - 6, x, y + 6, P.white);
    pc.px(x, y + 7, colors[(i + 2) % colors.length]).px(x + 1, y + 8, colors[(i + 2) % colors.length]);
  });
  pc.rect(6, 46, 28, 10, K.wood2);
  for (const sx of [12, 20, 28]) pc.circle(sx, 44, 3, P.cream).circle(sx, 44, 1, K.wood1);
}

/** A wire across the street with crows on it. 64x28. */
export function drawCrowWire(pc: PixelCanvas): void {
  for (let x = 0; x < 64; x++) pc.px(x, 18 + Math.round(Math.sin((x / 63) * Math.PI) * 4), 0x1a1a22);
  for (const cx of [14, 22, 46]) {
    const y = 18 + Math.round(Math.sin((cx / 63) * Math.PI) * 4);
    pc.ellipse(cx, y - 4, 3, 3, 0x14141a);
    pc.circle(cx + 2, y - 7, 2, 0x14141a);
    pc.px(cx + 4, y - 7, 0x3a3a40);
    pc.px(cx - 3, y - 3, 0x14141a).px(cx - 4, y - 2, 0x14141a);
    pc.px(cx + 2, y - 8, 0x6a6a7a);
  }
}

// ---------------------------------------------------------------- The pink palace

/** A pointed arch filled with `fill` (local helper). */
function arch(pc: PixelCanvas, x: number, base: number, w: number, top: number, fill: number): void {
  const spring = top + Math.round(w * 0.55);
  pc.rect(x, spring, w, base - spring, fill);
  const half = w / 2;
  for (let i = 0; i <= half; i++) {
    const y = spring - Math.round(Math.sin((i / half) * (Math.PI / 2)) * (spring - top));
    pc.rect(x + i, y, 1, spring - y, fill);
    pc.rect(x + w - 1 - i, y, 1, spring - y, fill);
  }
}

/** A small domed kiosk (chhatri) that crowns the palace's corners and gate pillars. */
function chhatri(pc: PixelCanvas, cx: number, base: number, w: number): void {
  pc.rect(cx - w / 2, base - 4, w, 4, K.stone2);
  pc.rect(cx - w / 2 + 1, base - 10, 2, 6, K.stone1).rect(cx + w / 2 - 3, base - 10, 2, 6, K.stone1);
  pc.rect(cx - w / 2 - 1, base - 12, w + 2, 2, K.stone3);
  pc.ellipse(cx, base - 15, w / 2 - 1, 4, K.stone3);
  pc.rect(cx, base - 22, 1, 4, K.brass2);
}

/** The palace gate's pillars and arch (the iron doors are `drawGateDoor`, so the Rustbucket can knock them off). 112x112. */
export function drawPalaceGate(pc: PixelCanvas): void {
  for (const px of [0, 92]) {
    pc.rect(px, 24, 20, 88, K.stone1);
    for (let y = 26; y < 112; y += 8) pc.hline(px, px + 19, y, K.stone0);
    pc.rect(px + 4, 40, 12, 28, K.stone0);
    arch(pc, px + 4, 68, 12, 40, K.stone0);
    pc.rect(px - 2, 20, 24, 4, K.stone3);
    chhatri(pc, px + 10, 20, 18);
  }
  // The arch spanning the pillars.
  for (let x = 20; x < 92; x++) {
    const t = (x - 56) / 36;
    const y = Math.round(16 + Math.abs(t) * Math.abs(t) * 16);
    pc.rect(x, y, 1, 8, K.stone2);
    pc.px(x, y, K.stone3);
  }
  pc.rect(48, 8, 16, 10, K.stone3);
  pc.circle(56, 13, 3, K.tile1);
  // Lamps on the pillars.
  pc.rect(8, 28, 4, 6, K.bulbWarm).rect(100, 28, 4, 6, K.bulbWarm);
}

/** One of the gate's iron doors: bars, scrolls, spikes. 36x80. */
export function drawGateDoor(pc: PixelCanvas): void {
  pc.rect(0, 0, 36, 3, 0x2a2a34).rect(0, 77, 36, 3, 0x2a2a34).rect(0, 40, 36, 2, 0x2a2a34);
  for (let x = 2; x < 36; x += 5) {
    pc.rect(x, 0, 2, 80, 0x3a3a48);
    pc.poly([[x - 1, 0], [x + 3, 0], [x + 1, -4]], 0x3a3a48);
  }
  for (let x = 4; x < 32; x += 10) {
    pc.circle(x + 3, 20, 3, 0x4a4a5a);
    pc.circle(x + 3, 20, 2, 0x1a1a22);
    pc.circle(x + 3, 60, 3, 0x4a4a5a);
    pc.circle(x + 3, 60, 2, 0x1a1a22);
  }
  pc.rect(0, 38, 36, 6, K.brass1);
}

/** The palace's front (Mohatta-inspired): pink sandstone, a central dome, corner chhatris, arched windows lit warm. 256x176. */
export function drawPalaceFront(pc: PixelCanvas): void {
  pc.rect(12, 64, 232, 112, K.stone1);
  for (let y = 66; y < 176; y += 8) pc.hline(12, 243, y, K.stone0);
  // Parapet with crenellation.
  pc.rect(8, 58, 240, 6, K.stone3);
  for (let x = 8; x < 248; x += 8) pc.rect(x, 54, 5, 4, K.stone3);
  // Central dome on a drum.
  pc.rect(100, 36, 56, 22, K.stone2);
  for (let x = 104; x < 152; x += 8) arch(pc, x, 56, 5, 40, K.stone0);
  pc.ellipse(128, 34, 26, 18, K.stone3);
  pc.rect(102, 32, 53, 4, K.stone3);
  pc.rect(127, 6, 2, 12, K.brass2);
  pc.circle(128, 8, 2, K.brass2);
  // Corner chhatris and side domes.
  chhatri(pc, 26, 58, 24);
  chhatri(pc, 230, 58, 24);
  chhatri(pc, 70, 58, 18);
  chhatri(pc, 186, 58, 18);
  // Two rows of pointed windows, some lit.
  const rnd = seeded(5);
  for (const row of [80, 126]) {
    for (let x = 24; x < 236; x += 22) {
      const lit = rnd() < 0.55;
      arch(pc, x, row + 30, 12, row, lit ? K.bulbWarm : 0x2a1a2a);
      if (lit) pc.rect(x + 2, row + 14, 8, 1, 0xffe0a0);
      pc.rect(x - 2, row + 30, 16, 2, K.stone3);
    }
  }
  // A carved jharokha over the door.
  pc.rect(108, 108, 40, 8, K.stone3);
  arch(pc, 112, 176, 32, 124, 0x1a1020);
  pc.rect(110, 172, 36, 4, K.stone3);
}

/** A carved projecting balcony window with a little dome over it. 40x44. */
export function drawJharokha(pc: PixelCanvas): void {
  pc.ellipse(20, 8, 16, 7, K.stone3);
  pc.rect(4, 8, 32, 3, K.stone3);
  pc.rect(5, 11, 3, 22, K.stone2).rect(32, 11, 3, 22, K.stone2);
  arch(pc, 9, 33, 22, 12, 0x2a1a2a);
  for (let y = 16; y < 32; y += 3) for (let x = 10; x < 30; x += 3) pc.px(x + ((y / 3) % 2), y, K.stone2);
  pc.rect(2, 33, 36, 4, K.stone3);
  for (let x = 4; x < 36; x += 6) pc.poly([[x, 37], [x + 6, 37], [x + 3, 43]], K.stone2);
}

/** An interior pointed archway, carved, standing on the floor. 64x112. */
export function drawArchway(pc: PixelCanvas): void {
  pc.rect(0, 30, 10, 82, K.stone2).rect(54, 30, 10, 82, K.stone2);
  for (let i = 0; i <= 22; i++) {
    const y = 48 - Math.round(Math.sin((i / 22) * (Math.PI / 2)) * 40);
    pc.rect(10 + i, y, 1, 6, K.stone3);
    pc.rect(53 - i, y, 1, 6, K.stone3);
  }
  for (let y = 34; y < 112; y += 6) pc.px(4, y, K.tile2).px(59, y, K.tile2);
  pc.rect(0, 26, 64, 4, K.stone3);
}

/** A brass chandelier with candle bulbs. 32x32, hanging from its top. */
export function drawChandelier(pc: PixelCanvas): void {
  pc.vline(16, 0, 10, K.brass1);
  pc.ellipse(16, 18, 13, 4, K.brass1);
  pc.ellipse(16, 17, 11, 2, K.brass2);
  for (const x of [5, 11, 16, 21, 27]) {
    pc.rect(x, 12, 1, 5, K.brass0);
    pc.rect(x - 1, 10, 3, 2, K.bulb);
  }
  for (let x = 6; x < 27; x += 3) pc.px(x, 22, K.windowCool).px(x, 24, K.windowCool);
  pc.circle(16, 26, 2, K.brass2);
}

/** An empty suit of armor on a stand: just decoration... probably. 20x40. */
export function drawArmorStand(pc: PixelCanvas): void {
  pc.rect(4, 36, 12, 4, K.wood1);
  pc.rect(9, 30, 2, 6, K.wood2);
  pc.rect(5, 12, 10, 18, K.steel1);
  pc.rect(6, 13, 8, 2, K.steel2);
  pc.rect(6, 2, 8, 10, K.steel1);
  pc.rect(7, 6, 6, 1, 0x0a0a10);
  pc.rect(9, 0, 2, 2, K.truckRed);
  pc.rect(2, 13, 3, 12, K.steel0).rect(15, 13, 3, 12, K.steel0);
}

/** A long Sindhi rug: red, with a geometric border. 112x6. */
export function drawCarpet(pc: PixelCanvas): void {
  pc.rect(0, 0, 112, 6, 0x8a1a22);
  pc.hline(0, 111, 0, K.truckYellow).hline(0, 111, 5, K.truckYellow);
  for (let x = 2; x < 110; x += 6) {
    pc.px(x, 2, P.cream).px(x + 1, 3, P.cream).px(x + 2, 2, P.cream);
    pc.px(x + 4, 3, 0x1a1a22);
  }
}

/** A tall library shelf full of books. 48x112. */
export function drawBookshelf(pc: PixelCanvas): void {
  pc.rect(0, 0, 48, 112, K.wood0);
  pc.rect(2, 0, 44, 4, K.wood2);
  const rnd = seeded(123);
  const spines = [0x8a2a2a, 0x2a4a8a, 0x2a6a3a, 0x8a6a2a, 0x5a2a6a, 0xd8c8a8, 0x3a3a3a];
  for (let y = 6; y < 108; y += 17) {
    let x = 3;
    while (x < 45) {
      const w = 2 + Math.floor(rnd() * 3);
      const h = 10 + Math.floor(rnd() * 5);
      if (x + w > 45) break;
      pc.rect(x, y + 15 - h, w, h, spines[Math.floor(rnd() * spines.length)]);
      if (rnd() < 0.4) pc.px(x, y + 15 - h + 2, K.brass2);
      x += w + (rnd() < 0.1 ? 3 : 0);
    }
    pc.rect(1, y + 15, 46, 2, K.wood2);
  }
}

/** A brass reading lamp on a stand. 12x44. */
export function drawReadingLamp(pc: PixelCanvas): void {
  pc.rect(3, 41, 6, 3, K.brass0);
  pc.rect(5, 10, 2, 31, K.brass1);
  pc.poly([[1, 10], [11, 10], [8, 2], [4, 2]], 0x2a6a3a);
  pc.rect(4, 10, 4, 2, K.bulb);
}

/** An old globe on a wooden stand. 24x30. */
export function drawGlobe(pc: PixelCanvas): void {
  pc.circle(12, 11, 9, 0x3a6aa8);
  pc.poly([[6, 6], [12, 4], [14, 10], [9, 13]], 0x8a7a3a);
  pc.poly([[14, 13], [19, 12], [17, 18]], 0x8a7a3a);
  for (let i = -10; i <= 10; i++) pc.px(12 + Math.round(Math.sin(i / 6) * 10), 11 + i, K.brass1);
  pc.rect(11, 20, 2, 6, K.wood2);
  pc.rect(6, 26, 12, 4, K.wood1);
}

/** A painted ceiling panel, seen from below (gold vines on blue). 128x32. */
export function drawPaintedCeiling(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 32, K.tile0);
  for (let x = 0; x < 128; x++) pc.px(x, 16 + Math.round(Math.sin(x * 0.2) * 6), K.brass2);
  for (let x = 8; x < 128; x += 16) {
    pc.circle(x, 16, 4, K.truckRed);
    pc.circle(x, 16, 2, K.brass2);
  }
  pc.rect(0, 0, 128, 2, K.brass1).rect(0, 30, 128, 2, K.brass1);
}

// ---------------------------------------------------------------- Under the palace and the clock

/** A heavy stone arch in the cellars. 64x88. */
export function drawCellarArch(pc: PixelCanvas): void {
  pc.rect(0, 24, 10, 64, K.cellar2).rect(54, 24, 10, 64, K.cellar2);
  for (let i = 0; i <= 22; i++) {
    const y = 30 - Math.round(Math.sin((i / 22) * Math.PI) * 26) + 22;
    pc.rect(10 + i * 2, y - 26, 2, 8, i % 3 === 0 ? K.cellar1 : K.cellar2);
  }
  for (let y = 28; y < 88; y += 7) pc.hline(0, 9, y, K.cellar1).hline(54, 63, y, K.cellar1);
}

/** A ring of Charmcaster's runes glowing on the floor. 56x14. Additive. */
export function drawRuneCircle(pc: PixelCanvas): void {
  pc.ellipse(28, 7, 26, 6, K.rune, 0.25);
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pc.px(28 + Math.cos(a) * 26, 7 + Math.sin(a) * 6, K.charmGlow);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = 28 + Math.cos(a) * 18;
    const y = 7 + Math.sin(a) * 4;
    pc.rect(x - 1, y - 1, 3, 1, K.charmGlow).px(x, y, K.charmGlow);
  }
}

/** Charmcaster's cage frame: a stone plinth and lintel carved with runes (the bars are separate). 64x96. */
export function drawWardCage(pc: PixelCanvas): void {
  pc.rect(0, 88, 64, 8, K.cellar2);
  pc.rect(0, 0, 64, 8, K.cellar2);
  for (let x = 4; x < 60; x += 8) pc.rect(x, 2, 4, 4, K.charm1).px(x + 1, 3, K.charmGlow).rect(x, 90, 4, 4, K.charm1).px(x + 2, 91, K.charmGlow);
}

/** One glowing ward bar of the cage. 16x96 (tiles down). */
export function drawWardBars(pc: PixelCanvas): void {
  for (const x of [3, 9]) {
    pc.rect(x, 0, 3, 96, K.charm1);
    pc.rect(x + 1, 0, 1, 96, K.charmGlow);
  }
  for (let y = 6; y < 96; y += 18) pc.rect(2, y, 11, 2, K.charm2);
}

/** A caged work lamp on the tunnel wall. 10x16. */
export function drawTunnelLamp(pc: PixelCanvas): void {
  pc.rect(4, 0, 2, 4, 0x3a3a40);
  pc.ellipse(5, 9, 4, 5, 0x3a3a40);
  pc.ellipse(5, 9, 2, 3, K.bulbWarm);
  pc.hline(1, 9, 9, 0x3a3a40);
}

/** Old pipes along the tunnel. 48x32. */
export function drawPipesOld(pc: PixelCanvas): void {
  pc.rect(0, 6, 48, 5, 0x5a4a3a).rect(0, 7, 48, 1, 0x7a6a5a);
  pc.rect(0, 18, 48, 4, 0x4a4a52);
  pc.rect(30, 6, 5, 26, 0x5a4a3a);
  for (const x of [8, 26, 40]) pc.rect(x, 5, 3, 7, 0x3a2a22);
  pc.px(32, 26, 0x6ab8f0).px(33, 29, 0x6ab8f0);
}

/** A cluster of brass gears (still: the clockwork behind the action). 64x64. */
export function drawGears(pc: PixelCanvas): void {
  const gear = (cx: number, cy: number, r: number, teeth: number, c: number, hi: number) => {
    pc.circle(cx, cy, r, c);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      pc.rect(cx + Math.cos(a) * (r + 1) - 1, cy + Math.sin(a) * (r + 1) - 1, 3, 3, c);
    }
    pc.circle(cx, cy, Math.round(r * 0.7), hi);
    pc.circle(cx, cy, Math.round(r * 0.3), c);
  };
  gear(22, 24, 16, 14, K.brass1, K.brass2);
  gear(48, 46, 11, 10, K.brass0, K.brass1);
  gear(46, 14, 7, 8, K.brass1, K.brass2);
}

/** The clock's face from inside: frosted glass, hour marks backwards, the hands' spindle. 96x96. */
export function drawClockFace(pc: PixelCanvas): void {
  pc.circle(48, 48, 46, K.brass0);
  pc.circle(48, 48, 43, 0xd8d0b8, 0.85);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const len = i % 3 === 0 ? 8 : 4;
    for (let k = 0; k < len; k++) pc.px(48 + Math.cos(a) * (40 - k), 48 + Math.sin(a) * (40 - k), 0x2a2420);
  }
  pc.line(48, 48, 48, 18, 0x2a2420, 2);
  pc.line(48, 48, 66, 56, 0x2a2420, 2);
  pc.circle(48, 48, 4, K.brass2);
}

/** The pendulum: a long rod and a heavy brass bob. 24x96, hanging from the top centre. */
export function drawPendulum(pc: PixelCanvas): void {
  pc.rect(11, 0, 2, 76, K.brass1);
  pc.circle(12, 84, 10, K.brass1);
  pc.circle(12, 84, 7, K.brass2);
  pc.circle(10, 81, 2, K.brass3);
}

// ---------------------------------------------------------------- Little things in the air

/** A flying book, pages flapping (two frames). 16x12. */
export function drawFlyingBook(pc: PixelCanvas, frame: number): void {
  const up = frame === 0;
  pc.rect(7, 4, 2, 6, 0x5a2a2a);
  pc.poly(up ? [[8, 5], [1, 1], [1, 7], [8, 9]] : [[8, 5], [1, 6], [2, 11], [8, 9]], P.cream);
  pc.poly(up ? [[8, 5], [15, 1], [15, 7], [8, 9]] : [[8, 5], [15, 6], [14, 11], [8, 9]], P.cream);
  pc.px(4, up ? 4 : 8, 0x8a8a8a).px(12, up ? 4 : 8, 0x8a8a8a);
}

/** A crow flapping (two frames). 10x8. */
export function drawCrow(pc: PixelCanvas, frame: number): void {
  pc.ellipse(5, 4, 3, 2, 0x14141a);
  pc.px(8, 3, 0x14141a).px(9, 3, 0x3a3a40);
  if (frame === 0) pc.poly([[3, 3], [6, 3], [4, 0]], 0x14141a);
  else pc.poly([[3, 4], [6, 4], [4, 7]], 0x14141a);
}

/** A loose balloon floating off (four colours). 8x12. */
export function drawBalloon(pc: PixelCanvas, frame: number): void {
  const c = [K.truckRed, K.truckYellow, K.truckBlue, K.truckPink][frame % 4];
  pc.ellipse(4, 4, 3, 4, c);
  pc.px(3, 2, P.white);
  pc.vline(4, 8, 11, 0xd8d8d8);
}

/** A paper kite high in the sky (three colours). 10x12. */
export function drawSkyKite(pc: PixelCanvas, frame: number): void {
  const c = [K.truckRed, K.truckGreen, K.truckYellow][frame % 3];
  pc.poly([[5, 0], [9, 4], [5, 8], [1, 4]], c);
  pc.vline(5, 0, 8, P.white);
  pc.px(5, 9, c).px(6, 10, c).px(5, 11, c);
}

// ---------------------------------------------------------------- Pickups

/** A small glass of chai, steaming (the Karachi health pickup). 10x12. */
export function drawChai(pc: PixelCanvas): void {
  pc.rect(2, 4, 6, 8, 0xe0e8f0, 0.6);
  pc.rect(2, 6, 6, 6, 0xc88a4a);
  pc.rect(2, 6, 6, 1, 0xf0d8b0);
  pc.rect(1, 4, 8, 1, P.white);
  pc.px(4, 2, P.white, 0.6).px(5, 1, P.white, 0.5).px(6, 0, P.white, 0.4);
  pc.rect(2, 11, 6, 1, 0x8a5a2a);
}

/** A glass of fresh orange juice with a straw. 10x12. */
export function drawJuice(pc: PixelCanvas): void {
  pc.rect(2, 3, 6, 9, 0xe0e8f0, 0.6);
  pc.rect(2, 5, 6, 7, 0xffa02a);
  pc.rect(2, 5, 6, 1, 0xffd080);
  pc.line(6, 0, 5, 7, K.truckRed);
  pc.circle(8, 4, 1, 0xff8a2a);
}
