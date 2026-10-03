import Phaser from 'phaser';
import { getAlien, hasAlien } from '../../aliens/registry';
import { PALETTE } from '../../config/palette';
import { cardInfo, type CardInfo } from '../../levels/cards';
import { CHAPTERS } from '../../levels/chapters';
import { getLevel } from '../../levels/registry';
import { countedCards } from '../../levels/secrets';
import { playSfx } from '../../systems/audio/Sfx';
import type { SlotData } from '../../systems/SaveSystem';
import { fileAliens } from '../../systems/Progress';
import { pixelText } from '../text';
import { sumoCard } from './cardArt';
import type { ExtrasPage } from './pages';

const THUMB_W = 30;
const THUMB_H = 40;
const STEP = 36;
const GRID_X = 34;
const ROW_Y = [128, 194, 260];

interface Slot {
  info: CardInfo;
  levelId: string;
  chapter: string;
  requires?: string;
  found: boolean;
  x: number;
  y: number;
}

/**
 * The Sumo Slammers album: every chapter's cards in a row (the backs of the
 * ones still out there), and the selected card large with its name and
 * flavour text, or where to look for it.
 */
export class AlbumPage implements ExtrasPage {
  readonly root: Phaser.GameObjects.Container;
  private readonly rows: Slot[][] = [];
  private row = 0;
  private col = 0;
  private readonly cursor: Phaser.GameObjects.Graphics;
  private detail: Phaser.GameObjects.Container | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly file: SlotData | null) {
    const items: Phaser.GameObjects.GameObject[] = [];
    let found = 0;
    let total = 0;
    CHAPTERS.filter((c) => c.levelId).forEach((chapter, r) => {
      const level = getLevel(chapter.levelId!);
      const have = file?.chapters[level.id]?.cards ?? [];
      const row: Slot[] = [];
      const y = ROW_Y[r];
      if (y === undefined) return;
      countedCards(level).forEach((spawn, i) => {
        const info = cardInfo(spawn.id);
        if (!info) return;
        const got = have.includes(spawn.id);
        const x = GRID_X + i * STEP;
        row.push({ info, levelId: level.id, chapter: chapter.title, requires: spawn.requires, found: got, x, y });
        items.push(sumoCard(scene, x, y, THUMB_W, THUMB_H, info, got));
        const zone = scene.add.zone(x, y, STEP, THUMB_H + 6).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.select(r, i));
        items.push(zone);
      });
      found += row.filter((s) => s.found).length;
      total += row.length;
      items.push(pixelText(scene, GRID_X - THUMB_W / 2, y - THUMB_H / 2 - 8, `CHAPTER ${chapter.number}  ${chapter.title}`, { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(scene, GRID_X - THUMB_W / 2 + 6 * STEP + THUMB_W, y - THUMB_H / 2 - 8, `${row.filter((s) => s.found).length}/${row.length}`, { originX: 1, originY: 0.5, color: PALETTE.gold }));
      this.rows.push(row);
    });
    items.push(pixelText(scene, 320, 84, `SUMO SLAMMERS  ${found} / ${total}`, { originX: 0.5, originY: 0.5, color: found === total ? PALETTE.gold : PALETTE.cream }));
    this.cursor = scene.add.graphics();
    items.push(this.cursor);
    this.root = scene.add.container(0, 0, items);
    this.select(0, 0, true);
  }

  move(dx: number, dy: number): void {
    if (this.rows.length === 0) return;
    const row = Phaser.Math.Clamp(this.row + dy, 0, this.rows.length - 1);
    const col = Phaser.Math.Clamp(this.col + dx, 0, this.rows[row].length - 1);
    this.select(row, col);
  }

  private select(row: number, col: number, quiet = false): void {
    const slot = this.rows[row]?.[col];
    if (!slot) return;
    if (!quiet && (row !== this.row || col !== this.col)) playSfx('uiMove', 0.8, 1 + col * 0.04);
    this.row = row;
    this.col = col;
    this.cursor.clear().lineStyle(2, PALETTE.gold, 1).strokeRoundedRect(slot.x - THUMB_W / 2 - 3, slot.y - THUMB_H / 2 - 3, THUMB_W + 6, THUMB_H + 6, 4);
    this.showDetail(slot);
  }

  private showDetail(slot: Slot): void {
    const scene = this.scene;
    this.detail?.destroy();
    const x = 300;
    const items: Phaser.GameObjects.GameObject[] = [sumoCard(scene, x + 58, 194, 96, 128, slot.info, slot.found)];
    const tx = x + 118;
    const num = `#${String(slot.info.number).padStart(3, '0')}`;
    if (slot.found) {
      items.push(pixelText(scene, tx, 138, slot.info.name, { originY: 0.5, color: slot.info.holo ? PALETTE.gold : PALETTE.white }));
      items.push(pixelText(scene, tx, 152, `${num}${slot.info.holo ? '  HOLO' : ''}`, { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(scene, tx, 168, slot.info.flavour, { color: PALETTE.cream, maxWidth: 196 }));
    } else {
      items.push(pixelText(scene, tx, 138, '? ? ?', { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(scene, tx, 152, num, { originY: 0.5, color: PALETTE.uiDim }));
      items.push(pixelText(scene, tx, 168, `HIDDEN SOMEWHERE IN ${slot.chapter}.`, { color: PALETTE.cream, maxWidth: 196 }));
      const needs = slot.requires;
      if (needs && hasAlien(needs)) {
        const onDial = this.file ? fileAliens(this.file).includes(needs) : false;
        const name = getAlien(needs).name;
        items.push(pixelText(scene, tx, 198, onDial ? `${name} CAN REACH IT NOW!` : `NEEDS ${name}.`, { color: onDial ? PALETTE.gold : PALETTE.uiDim, maxWidth: 196 }));
      } else if (needs) {
        items.push(pixelText(scene, tx, 198, 'NEEDS AN ALIEN YOU HAVE NOT MET YET.', { color: PALETTE.uiDim, maxWidth: 196 }));
      }
    }
    this.detail = scene.add.container(0, 0, items);
    this.root.add(this.detail);
  }
}
