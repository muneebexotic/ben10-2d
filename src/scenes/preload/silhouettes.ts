import { one, type AssetDef } from './assetTypes';
import type { PixelCanvas } from './PixelCanvas';

/**
 * Mystery silhouettes of aliens the story hasn't reached yet, for the locked
 * chapter cards ("who's that alien?"). Drawn white so the card can tint them
 * near-black with a coloured rim. Aliens that already exist use their real
 * sprite instead.
 */
const W = 0xffffff;

export const SILHOUETTE_KEYS = {
  wildmutt: 'sil-wildmutt',
  stinkfly: 'sil-stinkfly',
  upgrade: 'sil-upgrade',
  diamondhead: 'sil-diamondhead',
  ghostfreak: 'sil-ghostfreak',
  greymatter: 'sil-greymatter',
  ripjaws: 'sil-ripjaws',
  cannonbolt: 'sil-cannonbolt',
  wildvine: 'sil-wildvine',
  waybig: 'sil-waybig',
  kevin: 'sil-kevin',
} as const;

export type SilhouetteId = keyof typeof SILHOUETTE_KEYS;

/** Hunched on all fours, huge jaw, no eyes, spiky back. */
function wildmutt(pc: PixelCanvas): void {
  pc.ellipse(17, 14, 12, 6, W);
  pc.poly([[8, 10], [12, 6], [16, 8], [19, 5], [22, 8], [26, 6]], W);
  pc.ellipse(30, 12, 6, 5, W);
  // Open jaw.
  pc.poly([[30, 15], [37, 14], [36, 19], [30, 18]], W);
  pc.poly([[31, 9], [37, 11], [36, 13], [31, 12]], W);
  // Legs: thick front, crouched back.
  pc.rect(25, 17, 4, 8, W).rect(21, 18, 3, 7, W);
  pc.rect(8, 17, 4, 8, W).rect(12, 18, 3, 7, W);
  pc.rect(4, 12, 4, 3, W);
}

/** Bug body, four wings, eye stalks, stinger tail. */
function stinkfly(pc: PixelCanvas): void {
  pc.ellipse(9, 6, 7, 4, W).ellipse(25, 6, 7, 4, W);
  pc.ellipse(10, 13, 7, 3, W).ellipse(24, 13, 7, 3, W);
  pc.ellipse(17, 14, 4, 7, W);
  pc.circle(17, 7, 3, W);
  pc.line(15, 5, 12, 0, W).line(19, 5, 22, 0, W);
  pc.circle(12, 1, 1, W).circle(22, 1, 1, W);
  pc.poly([[15, 19], [19, 19], [18, 27], [17, 29], [16, 27]], W);
  pc.line(14, 17, 10, 22, W).line(20, 17, 24, 22, W);
}

/** Slim techno-humanoid with one big round eye. */
function upgrade(pc: PixelCanvas): void {
  pc.circle(10, 6, 5, W);
  pc.rect(7, 11, 7, 11, W);
  pc.rect(7, 22, 3, 11, W).rect(11, 22, 3, 11, W);
  pc.poly([[7, 12], [3, 20], [2, 26], [4, 26], [5, 20], [8, 15]], W);
  pc.poly([[14, 12], [18, 20], [19, 26], [17, 26], [16, 20], [13, 15]], W);
}

/** Crystal body: pointed head, shoulder spikes. */
function diamondhead(pc: PixelCanvas): void {
  pc.poly([[13, 0], [17, 6], [16, 11], [10, 11], [9, 6]], W);
  pc.poly([[4, 12], [22, 12], [19, 24], [7, 24]], W);
  pc.poly([[4, 13], [0, 6], [6, 11]], W).poly([[22, 13], [26, 6], [20, 11]], W);
  pc.poly([[5, 13], [1, 22], [2, 27], [5, 27], [6, 21], [8, 17]], W);
  pc.poly([[21, 13], [25, 22], [24, 27], [21, 27], [20, 21], [18, 17]], W);
  pc.rect(8, 24, 4, 13, W).rect(14, 24, 4, 13, W);
}

/** A floating, hooded ghost with tattered edges and claws. */
function ghostfreak(pc: PixelCanvas): void {
  pc.circle(13, 7, 6, W);
  pc.poly([[6, 10], [20, 10], [22, 26], [19, 32], [16, 28], [13, 34], [10, 28], [7, 32], [4, 26]], W);
  pc.poly([[6, 12], [0, 18], [1, 22], [3, 19], [7, 16]], W);
  pc.poly([[20, 12], [26, 18], [25, 22], [23, 19], [19, 16]], W);
  pc.line(0, 22, 0, 25, W).line(2, 22, 3, 25, W).line(26, 22, 26, 25, W).line(24, 22, 23, 25, W);
}

/** Tiny. Very tiny. Big head. */
function greymatter(pc: PixelCanvas): void {
  pc.ellipse(5, 3, 4, 3, W);
  pc.rect(3, 6, 4, 2, W);
  pc.rect(3, 8, 1, 2, W).rect(6, 8, 1, 2, W);
  pc.px(2, 7, W).px(7, 7, W);
}

/** Fish-man: huge jaw, back fin, tail where the legs should be. */
function ripjaws(pc: PixelCanvas): void {
  pc.ellipse(14, 8, 9, 6, W);
  pc.poly([[6, 9], [24, 9], [22, 15], [8, 15]], W);
  pc.poly([[11, 2], [16, 0], [18, 3]], W);
  pc.ellipse(14, 19, 7, 6, W);
  pc.poly([[10, 23], [18, 23], [16, 30], [14, 31], [12, 30]], W);
  pc.poly([[14, 29], [6, 34], [9, 30]], W).poly([[14, 29], [22, 34], [19, 30]], W);
  pc.poly([[8, 16], [2, 22], [4, 24], [9, 19]], W).poly([[20, 16], [26, 22], [24, 24], [19, 19]], W);
  pc.poly([[20, 13], [28, 15], [21, 18]], W);
}

/** Mostly ball: armoured shell, tiny head, stubby arms. */
function cannonbolt(pc: PixelCanvas): void {
  pc.circle(16, 17, 13, W);
  pc.rect(13, 1, 6, 5, W);
  pc.poly([[3, 14], [0, 20], [3, 21]], W).poly([[29, 14], [32, 20], [29, 21]], W);
  pc.rect(9, 29, 4, 3, W).rect(19, 29, 4, 3, W);
}

/** A walking plant: seed-pod head, one eye, trailing vines. */
function wildvine(pc: PixelCanvas): void {
  pc.ellipse(11, 6, 5, 6, W);
  pc.poly([[11, 0], [16, -1], [13, 3]], W);
  pc.rect(9, 12, 4, 14, W);
  pc.line(9, 14, 2, 22, W, 2).line(2, 22, 1, 32, W, 2);
  pc.line(13, 14, 19, 20, W, 2).line(19, 20, 21, 30, W, 2).line(21, 30, 18, 35, W, 1);
  pc.rect(8, 26, 2, 12, W).rect(12, 26, 2, 12, W);
}

/** Head and shoulders of a giant: towering crest, too big for the card. */
function waybig(pc: PixelCanvas): void {
  pc.poly([[24, 0], [28, 4], [29, 14], [27, 20], [21, 20], [19, 14], [20, 4]], W);
  pc.ellipse(24, 24, 10, 9, W);
  pc.poly([[0, 44], [6, 32], [16, 30], [32, 30], [42, 32], [48, 44], [48, 64], [0, 64]], W);
  pc.rect(19, 30, 10, 6, W);
}

/** A kid in a jacket with messy hair: a new friend from the arcade. */
function kevin(pc: PixelCanvas): void {
  pc.circle(8, 5, 4, W);
  pc.poly([[3, 3], [5, 0], [9, 0], [13, 2], [12, 5], [4, 6]], W);
  pc.rect(4, 9, 9, 10, W);
  pc.rect(2, 10, 2, 8, W).rect(13, 10, 2, 8, W);
  pc.rect(5, 19, 3, 10, W).rect(9, 19, 3, 10, W);
}

const DRAW: Record<SilhouetteId, { w: number; h: number; draw: (pc: PixelCanvas) => void }> = {
  wildmutt: { w: 38, h: 26, draw: wildmutt },
  stinkfly: { w: 34, h: 30, draw: stinkfly },
  upgrade: { w: 21, h: 34, draw: upgrade },
  diamondhead: { w: 27, h: 38, draw: diamondhead },
  ghostfreak: { w: 27, h: 35, draw: ghostfreak },
  greymatter: { w: 10, h: 11, draw: greymatter },
  ripjaws: { w: 29, h: 35, draw: ripjaws },
  cannonbolt: { w: 33, h: 33, draw: cannonbolt },
  wildvine: { w: 23, h: 39, draw: wildvine },
  waybig: { w: 49, h: 64, draw: waybig },
  kevin: { w: 17, h: 30, draw: kevin },
};

export const SILHOUETTE_ASSETS: AssetDef[] = (Object.keys(DRAW) as SilhouetteId[]).map((id) => {
  const { w, h, draw } = DRAW[id];
  return one(SILHOUETTE_KEYS[id], w, h, draw);
});
