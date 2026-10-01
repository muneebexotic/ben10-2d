import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/constants';
import { PALETTE } from '../config/palette';
import { EventBus } from '../systems/EventBus';
import { Banner } from '../ui/Banner';
import { BossBar } from '../ui/BossBar';
import { ComboDisplay } from '../ui/ComboDisplay';
import { HealthDisplay } from '../ui/HealthDisplay';
import { Letterbox } from '../ui/Letterbox';
import { OmnitrixDial } from '../ui/OmnitrixDial';
import { PromptBar } from '../ui/PromptBar';
import { StatsCorner } from '../ui/StatsCorner';
import { pixelText } from '../ui/text';
import { getAlien, getForm, hasAlien } from '../aliens/registry';
import { PLAYER } from '../config/player';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { shakeCamera } from '../systems/Accessibility';
import { SplitDisplay } from '../ui/SplitDisplay';
import { playSfx } from '../systems/audio/Sfx';
import { DialogBox } from '../ui/DialogBox';

/** HUD overlay. Knows nothing about the Level; everything arrives through the EventBus. */
export class UIScene extends Phaser.Scene {
  private dial!: OmnitrixDial;
  private health!: HealthDisplay;
  private bossBar!: BossBar;
  private banner!: Banner;
  private prompts!: PromptBar;
  private combo!: ComboDisplay;
  private stats!: StatsCorner;
  private letterbox!: Letterbox;
  private splits!: SplitDisplay;
  private dialog!: DialogBox;
  private vignette!: Phaser.GameObjects.Image;
  private hp: number = PLAYER.maxHealth;
  private alien = false;
  private dead = false;

  constructor() {
    super(SCENES.ui);
  }

  create(): void {
    this.dead = false;
    this.alien = false;
    this.vignette = this.add.image(0, 0, TEX.vignette).setOrigin(0, 0).setScale(2).setTint(PALETTE.enemy).setAlpha(0);
    this.dial = new OmnitrixDial(this, 30, 32);
    this.health = new HealthDisplay(this, 58, 12, PLAYER.maxHealth);
    this.stats = new StatsCorner(this, 3);
    this.combo = new ComboDisplay(this);
    this.bossBar = new BossBar(this, GAME_HEIGHT - 20);
    this.prompts = new PromptBar(this);
    this.banner = new Banner(this);
    this.letterbox = new Letterbox(this);
    this.splits = new SplitDisplay(this, 54);
    this.dialog = new DialogBox(this);

    const on = EventBus.on.bind(EventBus);
    on('hud:visible', (p) => {
      this.health.setVisible(p.visible);
      this.stats.setVisible(p.visible);
      this.splits.setVisible(p.visible);
      if (p.omnitrix !== undefined) this.dial.setVisible(p.omnitrix && p.visible, false);
    }, this);
    on('omnitrix:acquired', () => this.dial.setVisible(true, true), this);
    on('omnitrix:tick', (t) => this.dial.setTick(t), this);
    on('omnitrix:denied', (p) => {
      this.dial.deny();
      const text = p.reason === 'jammed' ? 'JAMMED!' : p.reason === 'lowTime' ? 'NOT ENOUGH TIME TO SWAP!' : 'RECHARGING!';
      this.popText(text, p.reason === 'jammed' ? PALETTE.jammer : PALETTE.enemy);
    }, this);
    on('omnitrix:warning', (p) => this.popText(String(p.secondsLeft), PALETTE.enemy, 2), this);
    on('omnitrix:ready', () => {
      this.dial.pop();
      this.popText('READY!', PALETTE.omnitrix);
    }, this);
    on('omnitrix:dial', (p) => this.dial.turned(p.selectedId, p.direction), this);
    on('alien:transformed', (p) => {
      this.alien = true;
      this.dial.pop();
      if (!hasAlien(p.alienId)) return;
      const theme = getAlien(p.alienId).theme;
      this.banner.alienName(p.name, theme.color, { first: p.first, swap: p.swap, style: theme.slam });
    }, this);
    on('alien:swapStrike', (p) => {
      if (hasAlien(p.alienId)) this.popText(p.hits > 1 ? `SWAP STRIKE X${p.hits}!` : 'SWAP STRIKE!', getAlien(p.alienId).theme.color);
    }, this);
    on('alien:reverted', (p) => {
      this.alien = false;
      this.dial.pop();
      const text = p.reason === 'timeout' ? 'TIME OUT!' : p.reason === 'damage' ? 'SHIELD BROKEN!' : p.reason === 'jammed' ? 'SIGNAL JAMMED!' : 'REVERTED';
      this.popText(text, p.reason === 'jammed' ? PALETTE.jammer : PALETTE.enemy);
    }, this);
    on('omnitrix:perfect', (p) => {
      this.banner.perfect(p.bonusMs);
      this.dial.pop();
      this.popText(`+${Math.round(p.bonusMs / 1000)}S`, PALETTE.gold, 2);
    }, this);
    on('hud:omnitrixSymbol', (p) => this.banner.omnitrixSymbol(p.color, p.big), this);
    on('player:health', (p) => {
      this.hp = p.hp;
      this.health.setHealth(p.hp, p.delta);
      if (p.delta < 0) shakeCamera(this.cameras.main, 120, 0.004);
    }, this);
    on('player:formHealth', (p) => this.health.setForm(p.hp, p.max, p.visible, p.delta, getForm(p.formId).theme), this);
    on('player:died', () => (this.dead = true), this);
    on('hud:reset', () => {
      this.dead = false;
      this.alien = false;
      this.prompts.clearAll();
      this.dialog.clear();
      this.combo.hide();
    }, this);
    on('combo:update', (p) => this.combo.set(p.count, this.time.now), this);
    on('combo:drop', (p) => this.combo.drop(p.count), this);
    on('stats:update', (p) => this.stats.set(p.timeMs, p.enemiesDefeated, p.cards, p.totalCards, p.reachableCards), this);
    on('card:collected', (p) => this.stats.cardPop(p.found - 1), this);
    on('hud:split', (s) => {
      this.splits.show(s, this.time.now);
      this.stats.setPace(s.deltaMs === null ? null : s.ahead);
      if (s.ahead) playSfx('combo', 1, 1.6);
    }, this);
    on('hud:prompt', (p) => this.prompts.add(p.id, p.text, p.priority), this);
    on('hud:promptClear', (p) => this.prompts.clear(p.id), this);
    on('hud:banner', (p) => this.banner.show(p), this);
    on('hud:letterbox', (p) => this.letterbox.set(p.visible), this);
    on('hud:dialog', (p) => this.dialog.show(p.speaker, p.text, p.color, p.voicePitch, p.skip), this);
    on('hud:dialogClear', () => this.dialog.clear(), this);
    on('boss:show', (p) => this.bossBar.show(p.name), this);
    on('boss:health', (p) => this.bossBar.setHealth(p.ratio, p.phase), this);
    on('boss:hide', () => this.bossBar.hide(), this);
    on('input:mode', () => this.prompts.rerender(), this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.offContext(this));
    EventBus.emit('hud:ready');
  }

  private popText(text: string, color: number, scale = 1): void {
    const t = pixelText(this, 58, 44, text, { color, scale });
    t.setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 40, duration: 120 });
    this.tweens.add({ targets: t, alpha: 0, y: 32, delay: 700, duration: 300, onComplete: () => t.destroy() });
  }

  override update(_time: number, delta: number): void {
    const now = this.time.now;
    this.dial.update(delta, now);
    this.health.update(delta, now);
    this.bossBar.update(delta, now);
    this.prompts.update(now);
    this.combo.update(delta, now);
    this.splits.update(now);
    this.dialog.update(delta, now);

    const low = !this.alien && this.hp <= 1.5 && this.hp > 0;
    const target = this.dead ? 0.8 : low ? 0.35 + Math.sin(now * 0.008) * 0.15 : 0;
    this.vignette.setAlpha(this.vignette.alpha + (target - this.vignette.alpha) * Math.min(1, delta / 200));
  }
}
