import { PALETTE as P } from '../../../config/palette';
import { lettering, letteringCentred, letteringWidth } from '../lettering';
import { seeded, type PixelCanvas } from '../PixelCanvas';
import { WESTERN as W } from './world';

/**
 * Silver Spur and the Diamond Deep: an 1880s ghost town kept as a roadside
 * attraction, and the old diamond mine under it. False-front buildings,
 * boardwalks, wanted posters, a headframe, timber sets and crystals.
 */

const INK = P.ink;
const WARM = 0xffd890;

/** Weathered boards: vertical planks with knots and gaps. */
function boards(pc: PixelCanvas, x: number, y: number, w: number, h: number, base: number, seed: number): void {
  const rnd = seeded(seed);
  pc.rect(x, y, w, h, base);
  for (let bx = x; bx < x + w; bx += 6) {
    pc.vline(bx, y, y + h - 1, W.plank0);
    if (rnd() < 0.4) pc.px(bx + 2 + Math.floor(rnd() * 3), y + Math.floor(rnd() * h), W.plank0);
    if (rnd() < 0.3) pc.vline(bx + 3, y + Math.floor(rnd() * h * 0.5), y + Math.floor(rnd() * h * 0.5) + 6, W.plank3);
  }
}

/** A lit window with a cross frame (warm light inside, or dark). */
function windowPane(pc: PixelCanvas, x: number, y: number, w: number, h: number, lit: boolean): void {
  pc.rect(x - 1, y - 1, w + 2, h + 2, W.plank0);
  pc.rect(x, y, w, h, lit ? 0xffc870 : 0x141a30);
  if (lit) pc.rect(x, y, w, Math.floor(h / 2), 0xffe0a0);
  pc.vline(x + Math.floor(w / 2), y, y + h - 1, W.plank0);
  pc.hline(x, x + w - 1, y + Math.floor(h / 2), W.plank0);
}

/** A false-front sign board with the shop's name. */
function signBoard(pc: PixelCanvas, cx: number, y: number, text: string, color: number): void {
  const w = letteringWidth(text) + 10;
  pc.rect(cx - w / 2, y, w, 11, W.plank0);
  pc.rect(cx - w / 2 + 1, y + 1, w - 2, 9, 0x2a1a10);
  letteringCentred(pc, cx, y + 2, text, color);
}

// ---------------------------------------------------------------- Town

/** The town gate: two log posts and an arched board, SILVER SPUR, with the town's population. 176x112. */
export function drawTownGate(pc: PixelCanvas): void {
  for (const x of [8, 158]) {
    pc.rect(x, 20, 10, 92, W.plank1);
    pc.vline(x + 2, 20, 111, W.plank2).vline(x + 7, 20, 111, W.plank0);
    pc.rect(x - 2, 104, 14, 8, W.plank0);
  }
  pc.poly([[6, 30], [20, 14], [88, 6], [156, 14], [170, 30], [156, 24], [88, 16], [20, 24]], W.plank1);
  pc.poly([[20, 15], [88, 7], [156, 15], [88, 10]], W.plank3);
  letteringCentred(pc, 88, 14, 'SILVER SPUR', 0xf4e4b8, 1);
  // A plaque hanging under the arch.
  pc.line(70, 24, 70, 34, W.plank0).line(106, 24, 106, 34, W.plank0);
  pc.rect(60, 34, 56, 18, 0x2a1a10);
  pc.rect(61, 35, 54, 16, 0x4a3018);
  letteringCentred(pc, 88, 36, 'POP. 0', 0xd8c08a);
  letteringCentred(pc, 88, 44, 'GHOSTS: 12', 0x9ab0ff);
  // Lanterns on the posts.
  for (const x of [13, 163]) {
    pc.rect(x - 3, 34, 6, 8, 0x2a2a30);
    pc.rect(x - 2, 35, 4, 6, WARM);
  }
  pc.outline(INK);
}

/** The saloon: a two-storey false front, a balcony, swinging doors. 128x104. */
export function drawSaloon(pc: PixelCanvas): void {
  boards(pc, 4, 8, 120, 96, 0x5a3822, 31);
  pc.rect(2, 4, 124, 6, W.plank0);
  signBoard(pc, 64, 12, 'SALOON', 0xffd84a);
  // Balcony rail.
  pc.rect(0, 46, 128, 3, W.plank2);
  for (let x = 2; x < 128; x += 6) pc.vline(x, 38, 46, W.plank1);
  pc.hline(0, 127, 38, W.plank2);
  windowPane(pc, 16, 28, 16, 12, true);
  windowPane(pc, 96, 28, 16, 12, false);
  windowPane(pc, 14, 62, 18, 16, true);
  windowPane(pc, 96, 62, 18, 16, true);
  // The batwing doors.
  pc.rect(48, 64, 32, 40, 0x1a0e0a);
  pc.rect(50, 72, 13, 18, W.plank2).rect(65, 72, 13, 18, W.plank2);
  for (const x of [52, 56, 60, 67, 71, 75]) pc.vline(x, 73, 88, W.plank0);
  pc.rect(48, 62, 32, 3, W.plank0);
  pc.outline(INK);
}

/** A false-front shop with an awning: frame 0 GENERAL STORE, 1 BANK, 2 SHERIFF, 3 UNDERTAKER. 96x88. */
export function drawShopFront(pc: PixelCanvas, frame: number): void {
  const names = ['GENERAL STORE', 'BANK', 'SHERIFF', 'UNDERTAKER'];
  const wood = [0x6a4428, 0x5a4a3a, 0x4a3a2a, 0x3a3038][frame];
  boards(pc, 4, 10, 88, 78, wood, 60 + frame);
  pc.rect(2, 6, 92, 6, W.plank0);
  signBoard(pc, 48, 14, names[frame], frame === 2 ? 0xffd84a : frame === 3 ? 0xb8c0d8 : 0xf4e4b8);
  // Awning on posts.
  pc.poly([[0, 44], [96, 44], [92, 50], [4, 50]], frame === 1 ? 0x4a5a3a : frame === 3 ? 0x2a2a34 : 0x7a3a2a);
  for (let x = 6; x < 92; x += 8) pc.rect(x, 45, 4, 4, 0xd8c8a8);
  pc.vline(4, 50, 87, W.plank0).vline(91, 50, 87, W.plank0);
  windowPane(pc, 12, 58, 22, 18, frame !== 3);
  pc.rect(54, 56, 22, 32, 0x1a100c);
  pc.rect(56, 58, 18, 30, W.plank1);
  pc.px(70, 72, 0xd8b84a);
  if (frame === 1) for (let x = 14; x < 34; x += 4) pc.vline(x, 58, 75, 0x3a3a40);
  if (frame === 2) {
    pc.poly([[64, 28], [66, 33], [71, 33], [67, 36], [69, 41], [64, 38], [59, 41], [61, 36], [57, 33], [62, 33]], 0xffd84a);
  }
  if (frame === 3) {
    pc.rect(80, 60, 8, 26, 0x2a1a14).rect(81, 61, 6, 24, 0x3a2a20);
    pc.vline(84, 64, 72, 0x5a4a3a).hline(82, 86, 66, 0x5a4a3a);
  }
  pc.outline(INK);
}

/** WANTED posters: 0 Ben ("THE BOY WITH THE WATCH"), 1 an outlaw, 2 torn. 40x40. */
export function drawWanted(pc: PixelCanvas, frame: number): void {
  pc.rect(0, 0, 40, 40, 0xd8c08a);
  pc.rect(1, 1, 38, 38, 0xe8d4a0);
  letteringCentred(pc, 20, 3, 'WANTED', 0x5a2a1a);
  pc.rect(12, 12, 16, 17, 0xc8b080);
  if (frame === 0) {
    // Ben: brown hair, the watch drawn big.
    pc.ellipse(20, 21, 5, 6, 0xf2c29b);
    pc.rect(14, 14, 12, 4, P.hair0).rect(14, 18, 2, 3, P.hair0);
    pc.px(18, 21, INK).px(22, 21, INK);
    pc.hline(18, 22, 25, 0xb07a5a);
    pc.rect(25, 24, 4, 4, P.omnitrixDark).px(26, 25, P.omnitrix);
  } else {
    pc.ellipse(20, 22, 5, 6, 0x9a7a5a);
    pc.rect(13, 15, 14, 2, INK).rect(16, 11, 8, 4, INK);
    pc.hline(16, 24, 24, INK);
    pc.px(18, 20, INK).px(22, 20, INK);
  }
  // Reward lines.
  pc.hline(6, 33, 32, 0x5a2a1a);
  pc.hline(9, 30, 35, 0x8a5a3a);
  // A torn corner, under the lettering.
  if (frame === 2) for (let y = 0; y < 12; y++) pc.ctx.clearRect(pc.ox + 39 - Math.round(y * 0.9), pc.oy + 28 + y, Math.round(y * 0.9) + 1, 1);
  pc.outline(INK);
}

/** A hitching post with a trough. 36x16. */
export function drawHitchingPost(pc: PixelCanvas): void {
  pc.rect(2, 2, 32, 3, W.plank2);
  pc.rect(4, 2, 3, 14, W.plank1).rect(29, 2, 3, 14, W.plank1);
  pc.rect(10, 9, 16, 7, W.plank0);
  pc.rect(11, 10, 14, 3, 0x2a4a6a);
  pc.outline(INK);
}

/** A wagon wheel leaning on a wall. 20x20. */
export function drawWagonWheel(pc: PixelCanvas): void {
  pc.circle(10, 10, 9, W.plank1);
  // Hollow out the rim so the wall shows between the spokes.
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 42) pc.ctx.clearRect(pc.ox + 10 + x, pc.oy + 10 + y, 1, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pc.line(10, 10, 10 + Math.cos(a) * 7, 10 + Math.sin(a) * 7, W.plank2);
  }
  pc.circle(10, 10, 2, W.plank0);
  pc.outline(INK);
}

/** A stack of crates. 24x24. */
export function drawCrates(pc: PixelCanvas): void {
  for (const [x, y, s] of [[0, 10, 14], [12, 12, 12], [5, 0, 11]] as const) {
    pc.rect(x, y, s, s, W.plank2);
    pc.rect(x + 1, y + 1, s - 2, s - 2, W.plank1);
    pc.line(x + 1, y + 1, x + s - 2, y + s - 2, W.plank2);
  }
  pc.outline(INK);
}

/** A lantern on a post, lit. 12x52. */
export function drawLanternPost(pc: PixelCanvas): void {
  pc.rect(5, 8, 3, 44, W.plank1);
  pc.rect(3, 50, 7, 2, W.plank0);
  pc.hline(5, 11, 8, W.plank0);
  pc.vline(10, 8, 11, 0x2a2a30);
  pc.rect(7, 11, 6, 8, 0x2a2a30);
  pc.rect(8, 12, 4, 6, WARM);
  pc.outline(INK);
}

/** An upright coffin (the undertaker's stock). 16x32. */
export function drawCoffin(pc: PixelCanvas): void {
  pc.poly([[4, 0], [12, 0], [15, 8], [12, 31], [4, 31], [1, 8]], 0x3a2418);
  pc.poly([[5, 2], [11, 2], [13, 8], [11, 29], [5, 29], [3, 8]], 0x4a3020);
  pc.vline(8, 8, 18, 0xb8a888).hline(6, 10, 11, 0xb8a888);
  pc.outline(INK);
}

/** Silver Spur's water tower: a tank on legs, frame 0 standing, 1 wrecked (Sixsix went through it). 72x128. */
export function drawWaterTower(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    for (const [x0, x1] of [[10, 18], [62, 54]] as const) pc.line(x0, 127, x1, 50, W.plank1, 3);
    pc.line(16, 100, 56, 70, W.plank0, 2).line(56, 100, 16, 70, W.plank0, 2);
    pc.rect(6, 18, 60, 34, W.plank1);
    for (let x = 6; x < 66; x += 6) pc.vline(x, 18, 51, W.plank0);
    for (const y of [22, 34, 46]) pc.hline(6, 65, y, 0x4a4a52);
    pc.poly([[4, 18], [36, 4], [68, 18]], 0x5a3a2a);
    letteringCentred(pc, 36, 28, 'SILVER SPUR', 0xd8c08a);
  } else {
    pc.line(10, 127, 20, 70, W.plank1, 3).line(62, 127, 58, 96, W.plank1, 3);
    pc.line(58, 96, 40, 108, W.plank0, 2);
    pc.poly([[6, 110], [30, 96], [58, 112], [50, 127], [10, 127]], W.plank1);
    for (let x = 10; x < 56; x += 6) pc.line(x, 110 + (x % 4), x + 3, 125, W.plank0);
    pc.poly([[30, 92], [44, 84], [52, 96]], 0x5a3a2a);
    pc.rect(0, 124, 72, 4, 0x2a4a6a);
  }
  pc.outline(INK);
}

/** The haunted hotel's sign: GRAND SILVER HOTEL, and a smaller TOURS NIGHTLY. 128x26. */
export function drawHotelSign(pc: PixelCanvas): void {
  pc.rect(0, 0, 128, 26, W.plank0);
  pc.rect(2, 2, 124, 22, 0x1e1428);
  letteringCentred(pc, 64, 4, 'GRAND SILVER HOTEL', 0xd8c8ff);
  letteringCentred(pc, 64, 14, 'HAUNTED TOURS NIGHTLY', 0x8a7aa8);
  pc.outline(INK);
}

/** The saloon bar counter with bottles. 64x28. */
export function drawBarCounter(pc: PixelCanvas): void {
  pc.rect(0, 8, 64, 20, W.plank1);
  pc.rect(0, 6, 64, 3, W.plank3);
  for (let x = 4; x < 64; x += 10) pc.rect(x, 12, 6, 14, W.plank0);
  for (const [x, c] of [[6, 0x3a6a3a], [12, 0x6a3a1a], [44, 0x3a3a7a], [52, 0x7a6a2a]] as const) pc.rect(x, 0, 3, 6, c).px(x + 1, -0, c);
  pc.outline(INK);
}

/** An old upright piano. 40x30. */
export function drawPiano(pc: PixelCanvas): void {
  pc.rect(0, 0, 40, 30, 0x2a1810);
  pc.rect(2, 2, 36, 12, 0x3a2418);
  pc.rect(2, 15, 36, 4, 0xe8e0c8);
  for (let x = 4; x < 38; x += 3) pc.vline(x, 15, 17, INK);
  pc.rect(4, 22, 3, 8, 0x1a0e08).rect(33, 22, 3, 8, 0x1a0e08);
  pc.outline(INK);
}

/** A mouse hole at the foot of a wall (Grey Matter's way in). 14x10. */
export function drawMouseHole(pc: PixelCanvas): void {
  pc.ellipse(7, 9, 6, 8, W.plank0);
  pc.ellipse(7, 9, 4, 6, 0x05040a);
  pc.px(5, 6, 0xffd84a);
}

/** The jail cell's cot and the sheriff's desk. 0 cot (36x14), drawn into a 48x24 frame, 1 desk. */
export function drawJailFurniture(pc: PixelCanvas, frame: number): void {
  if (frame === 0) {
    pc.rect(4, 14, 36, 4, W.plank1).rect(4, 12, 36, 2, 0x8a7a6a);
    pc.rect(5, 18, 2, 6, W.plank0).rect(37, 18, 2, 6, W.plank0);
  } else {
    pc.rect(2, 8, 44, 4, W.plank3);
    pc.rect(4, 12, 40, 12, W.plank1);
    pc.rect(30, 14, 12, 10, W.plank0);
    pc.rect(8, 2, 8, 6, 0xe8e0c8);
    pc.rect(34, 4, 6, 4, 0x3a2a1a);
  }
  pc.outline(INK);
}

// ---------------------------------------------------------------- Mine

/** The Diamond Deep's headframe: a timber A-frame, the sheave wheel, a sign. 112x168. */
export function drawHeadframe(pc: PixelCanvas): void {
  pc.line(14, 167, 50, 26, W.plank1, 4).line(98, 167, 62, 26, W.plank1, 4);
  pc.line(30, 167, 52, 40, W.plank0, 2).line(82, 167, 60, 40, W.plank0, 2);
  for (const y of [60, 100, 140]) {
    const k = (y - 26) / 141;
    pc.hline(Math.round(50 - 36 * k), Math.round(62 + 36 * k), y, W.plank2);
    pc.line(Math.round(50 - 36 * k), y, Math.round(62 + 36 * (k + 0.28)), y + 40 > 167 ? 167 : y + 40, W.plank0);
  }
  pc.circle(56, 22, 18, W.plank0);
  pc.circle(56, 22, 15, 0x1a1420);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pc.line(56, 22, 56 + Math.cos(a) * 15, 22 + Math.sin(a) * 15, W.plank1);
  }
  pc.circle(56, 22, 3, W.plank2);
  pc.rect(24, 112, 64, 14, W.plank0);
  pc.rect(25, 113, 62, 12, 0x1a1420);
  letteringCentred(pc, 56, 116, 'DIAMOND DEEP', P.diamondhead);
  pc.outline(INK);
}

/** A mine portal: timber posts and a cap over a dark tunnel mouth, a DANGER board. 80x72. */
export function drawMinePortal(pc: PixelCanvas): void {
  pc.rect(10, 10, 60, 62, 0x05040a);
  pc.rect(4, 4, 10, 68, W.plank1).rect(66, 4, 10, 68, W.plank1);
  pc.vline(6, 4, 71, W.plank2).vline(68, 4, 71, W.plank2);
  pc.rect(0, 0, 80, 10, W.plank1);
  pc.hline(0, 79, 1, W.plank3);
  pc.rect(22, 16, 36, 12, 0xd8c08a);
  letteringCentred(pc, 40, 18, 'DANGER', 0x8a1a1a);
  pc.outline(INK);
}

/** Mine rails along the floor, a tie every few pixels. 32x6. */
export function drawMineRails(pc: PixelCanvas): void {
  for (let x = 1; x < 32; x += 6) pc.rect(x, 3, 4, 3, W.plank0);
  pc.hline(0, 31, 2, 0x6a6a78).hline(0, 31, 1, 0x9a9aaa);
}

/** A timber set: two posts and a cap beam framing the tunnel. 48x80. */
export function drawTimbers(pc: PixelCanvas): void {
  pc.rect(2, 6, 7, 74, W.plank1).rect(39, 6, 7, 74, W.plank1);
  pc.vline(3, 6, 79, W.plank2).vline(40, 6, 79, W.plank2);
  pc.rect(0, 0, 48, 7, W.plank1);
  pc.hline(0, 47, 1, W.plank2);
  pc.line(9, 7, 15, 13, W.plank0, 2).line(39, 7, 33, 13, W.plank0, 2);
  pc.outline(INK);
}

/** A miner's lantern hanging from a hook. 10x16. */
export function drawHangingLantern(pc: PixelCanvas): void {
  pc.vline(5, 0, 4, 0x4a4a52);
  pc.rect(2, 4, 7, 10, 0x2a2a30);
  pc.rect(3, 6, 5, 6, WARM);
  pc.rect(2, 14, 7, 2, 0x2a2a30);
  pc.outline(INK);
}

/** A crystal cluster growing from the floor (glows): frame 0 small, 1 large. 40x36. */
export function drawCrystalCluster(pc: PixelCanvas, frame: number): void {
  const rnd = seeded(5 + frame);
  const count = frame === 0 ? 4 : 7;
  for (let i = 0; i < count; i++) {
    const x = 6 + Math.floor((i / count) * 28) + Math.floor(rnd() * 4);
    const h = (frame === 0 ? 10 : 16) + Math.floor(rnd() * (frame === 0 ? 10 : 18));
    const lean = Math.round((x - 20) / 6);
    pc.poly([[x - 3, 35], [x + lean, 35 - h], [x + 3, 35]], i % 2 ? 0x3ab0d8 : 0x5ad0f0);
    pc.line(x + lean, 36 - h, x - 1, 34, 0xd8fbff);
    pc.poly([[x + 1, 35], [x + lean + 1, 37 - h], [x + 3, 35]], 0x1e7a9a);
  }
  pc.outline(0x08202e);
}

/** A towering crystal spire (the cavern's landmarks). 40x96. */
export function drawCrystalSpire(pc: PixelCanvas): void {
  pc.poly([[8, 95], [16, 20], [20, 2], [24, 20], [32, 95]], 0x5ad0f0);
  pc.poly([[10, 95], [17, 20], [20, 4], [20, 95]], 0x9af0ff);
  pc.poly([[22, 30], [24, 20], [31, 95], [24, 95]], 0x2a90c0);
  pc.line(20, 6, 18, 90, 0xd8fbff);
  pc.poly([[0, 95], [6, 60], [12, 95]], 0x3ab0d8);
  pc.poly([[28, 95], [36, 66], [40, 95]], 0x3ab0d8);
  pc.outline(0x08202e);
}

/** A DYNAMITE warning board. 24x16. */
export function drawDynamiteSign(pc: PixelCanvas): void {
  pc.rect(0, 0, 24, 12, 0xd8c08a);
  lettering(pc, 2, 2, 'TNT', 0x8a1a1a);
  pc.rect(17, 2, 4, 8, 0x8a1a1a);
  pc.vline(11, 12, 15, W.plank0);
  pc.outline(INK);
}

/** An old prospector who never made it out, still holding his pickaxe. 32x14. */
export function drawProspector(pc: PixelCanvas): void {
  pc.rect(6, 10, 22, 3, 0xd8d0b8);
  for (let x = 9; x < 24; x += 3) pc.vline(x, 8, 12, 0xd8d0b8);
  pc.ellipse(4, 9, 4, 4, 0xe8e0c8);
  pc.px(3, 8, INK).px(5, 8, INK);
  pc.rect(0, 4, 9, 2, 0x5a3a1a);
  pc.line(24, 2, 30, 10, W.plank2).line(22, 3, 27, 0, 0x8a8a9a, 2);
  pc.outline(INK);
}

/** A mine cart on the rails (set dressing). 32x22. */
export function drawOreCart(pc: PixelCanvas): void {
  pc.poly([[2, 2], [30, 2], [27, 16], [5, 16]], 0x4a4a56);
  pc.rect(3, 2, 26, 3, 0x6a6a78);
  for (const x of [6, 14, 22]) pc.rect(x, 6, 4, 2, 0x3a3a44);
  pc.rect(4, 0, 24, 3, 0x5a5262);
  pc.circle(9, 18, 3, 0x2a2a30).circle(23, 18, 3, 0x2a2a30);
  pc.px(9, 18, 0x8a8a9a).px(23, 18, 0x8a8a9a);
  pc.outline(INK);
}

// ---------------------------------------------------------------- The cold open

/**
 * Vilgax's ship, the bridge: ribbed dark metal, a great viewport on Earth and
 * the stars, and the round holo-table where the hunters appear. 320x180
 * (shown at 2x, behind the holograms).
 */
export function drawVilgaxBridge(pc: PixelCanvas): void {
  const rnd = seeded(66);
  pc.verticalGradient(0, 0, 320, 180, [
    [0, 0x0a0610],
    [0.6, 0x1a0e1c],
    [1, 0x0c0810],
  ]);
  // The viewport: stars and the Earth, tiny and blue.
  pc.poly([[60, 14], [260, 14], [244, 84], [76, 84]], 0x020208);
  for (let i = 0; i < 60; i++) pc.px(70 + Math.floor(rnd() * 180), 16 + Math.floor(rnd() * 66), rnd() < 0.3 ? 0xffffff : 0x8a8ab8);
  pc.circle(206, 46, 14, 0x2a5aa8);
  pc.ellipse(202, 42, 6, 4, 0x3a8a4a);
  pc.ellipse(212, 50, 4, 3, 0x3a8a4a);
  pc.circle(200, 40, 3, 0xd8e8ff, 0.5);
  pc.poly([[60, 14], [76, 84], [70, 84], [52, 12]], 0x2a1a2a).poly([[260, 14], [244, 84], [250, 84], [268, 12]], 0x2a1a2a);
  pc.hline(52, 268, 12, 0x3a2438);
  // Ribs along the walls.
  for (let x = 6; x < 320; x += 34) {
    pc.rect(x, 86, 6, 94, 0x241626);
    pc.vline(x + 1, 86, 179, 0x3a2438);
  }
  pc.rect(0, 84, 320, 4, 0x3a2438);
  // The holo-table: a ring of red light on a pedestal.
  pc.ellipse(160, 150, 70, 14, 0x1a0e18);
  pc.ellipse(160, 146, 62, 10, 0x2a1626);
  pc.ellipse(160, 145, 54, 7, 0x5a1a2a);
  pc.ellipse(160, 145, 46, 5, P.enemyDark);
  pc.rect(140, 152, 40, 28, 0x1a0e18);
  for (let i = 0; i < 8; i++) pc.px(112 + i * 14, 145 + (i % 2), P.enemyGlow);
  // Consoles at the sides, blinking.
  for (const x of [14, 270]) {
    pc.rect(x, 128, 36, 30, 0x1e1220);
    pc.rect(x + 3, 131, 30, 10, 0x0a0410);
    for (let k = 0; k < 4; k++) pc.px(x + 6 + k * 7, 135, k % 2 ? P.enemy : P.omnitrix);
  }
}
