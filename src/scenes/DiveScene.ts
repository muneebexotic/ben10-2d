import Phaser from 'phaser';
import { PALETTE } from '../config/palette';
import { DIVE } from '../config/dive';
import { CH5_TEX } from './preload/bounty';
import { TEX } from './preload/assetKeys';
import { SCENES } from './SceneKeys';
import { TUNNEL_FRAG } from './dive/tunnelShader';
import { project, type DiveView } from './dive/DiveView';

const POOL = 48;
/**
 * The tunnel is traced at half resolution into a texture and drawn at 2x:
 * chunky like the rest of the game's pixels, and a quarter of the fragments.
 */
const SHADER_PIXEL = 2;
const TUNNEL_TEXTURE = 'dive-tunnel-rt';
const LANE_HALF = 0.5;

export interface DiveSceneData {
  view: DiveView;
}

/**
 * THE DEEP DIVE's renderer (Chapter 5): the tunnel shader, the cart and its
 * rider from behind, and everything on the track projected onto it. It only
 * draws: MineDive in the level runs the ride and writes `view` every frame.
 * Launched over the level (whose camera is hidden meanwhile), under the HUD.
 */
export class DiveScene extends Phaser.Scene {
  private view!: DiveView;
  private shader: Phaser.GameObjects.Shader | null = null;
  private tunnel: Phaser.GameObjects.Image | null = null;
  private readonly pool: Phaser.GameObjects.Image[] = [];
  private floor!: Phaser.GameObjects.Graphics;
  private streaks!: Phaser.GameObjects.Graphics;
  private cart!: Phaser.GameObjects.Image;
  private rider!: Phaser.GameObjects.Image;
  private aura!: Phaser.GameObjects.Image;
  private fade!: Phaser.GameObjects.Rectangle;
  private readonly pt = { x: 0, y: 0, s: 0 };
  private readonly order: number[] = [];
  private readonly quad: number[] = [];

  constructor() {
    super(SCENES.dive);
  }

  create(data: DiveSceneData): void {
    this.view = data.view;
    const { width: w, height: h } = this.scale;
    this.buildTunnel(w, h);
    this.floor = this.add.graphics().setDepth(1);
    for (let i = 0; i < POOL; i++) this.pool.push(this.add.image(0, 0, TEX.px).setVisible(false).setDepth(2));
    this.streaks = this.add.graphics().setDepth(40).setBlendMode(Phaser.BlendModes.ADD);
    this.aura = this.add.image(0, 0, TEX.light).setDepth(48).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.cart = this.add.image(0, 0, CH5_TEX.diveCart).setOrigin(0.5, 1).setDepth(50);
    this.rider = this.add.image(0, 0, TEX.benBack).setOrigin(0.5, 1).setDepth(49);
    this.fade = this.add.rectangle(0, 0, w, h, 0x000000, 1).setOrigin(0, 0).setDepth(100);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.destroyTunnel();
    });
    this.draw();
  }

  /** The tunnel shader, rendering into a half-size texture, and the image that shows it full screen. */
  private buildTunnel(w: number, h: number): void {
    this.destroyTunnel();
    const sw = Math.ceil(w / SHADER_PIXEL);
    const sh = Math.ceil(h / SHADER_PIXEL);
    const shader = this.add.shader(
      {
        name: 'dive-tunnel',
        fragmentSource: TUNNEL_FRAG,
        setupUniforms: (set: (name: string, value: unknown) => void) => {
          const v = this.view;
          set('uRes', [sw, sh]);
          set('uTravel', v.travel);
          set('uYaw', v.yaw);
          set('uCam', [v.camX, v.camY]);
          set('uBend', v.bend);
          set('uCavern', v.cavern);
          set('uDepth', v.depth);
          set('uTime', v.time / 1000);
          set('uGaps', v.gaps);
          set('uTrestle', v.trestle);
          set('uFlash', v.flash);
          set('uLamp', v.lamp * DIVE.lamp);
          set('uPixel', 1);
        },
      } as unknown as Phaser.Types.GameObjects.Shader.ShaderQuadConfig,
      sw / 2,
      sh / 2,
      sw,
      sh,
    );
    if (this.textures.exists(TUNNEL_TEXTURE)) this.textures.remove(TUNNEL_TEXTURE);
    shader.setRenderToTexture(TUNNEL_TEXTURE);
    this.textures.get(TUNNEL_TEXTURE).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.shader = shader;
    this.tunnel = this.add.image(0, 0, TUNNEL_TEXTURE).setOrigin(0, 0).setScale(SHADER_PIXEL).setDepth(0.5);
  }

  private destroyTunnel(): void {
    this.tunnel?.destroy();
    this.tunnel = null;
    // The shader takes its texture with it.
    this.shader?.destroy();
    this.shader = null;
    if (this.textures.exists(TUNNEL_TEXTURE)) this.textures.remove(TUNNEL_TEXTURE);
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.buildTunnel(size.width, size.height);
    this.fade.setSize(size.width, size.height);
  }

  override update(): void {
    this.draw();
  }

  private draw(): void {
    const v = this.view;
    const { width: w, height: h } = this.scale;
    this.fade.setAlpha(v.fade);
    this.drawWarnings(w, h);
    this.drawSprites(w, h);
    this.drawCart(w, h);
    this.drawStreaks(w, h);
  }

  /** Floor warnings: a strip along each warned track, the villain's colour at the edges. */
  private drawWarnings(w: number, h: number): void {
    const g = this.floor;
    g.clear();
    const v = this.view;
    if (Math.abs(v.yaw) > 0.3) return;
    const p = this.pt;
    for (let wi = 0; wi < v.warningCount; wi++) {
      const warn = v.warnings[wi];
      for (const lane of warn.lanes) {
        const cx = DIVE.lanes[lane];
        const step = 3;
        for (let z = warn.from; z < warn.to; z += step) {
          const z2 = Math.min(warn.to, z + step);
          const pts = this.quad;
          pts.length = 0;
          for (const [x, zz] of [[cx - LANE_HALF, z], [cx + LANE_HALF, z], [cx + LANE_HALF, z2], [cx - LANE_HALF, z2]] as const) {
            if (!project(v, x, -0.99, zz, w, h, p)) break;
            pts.push(p.x, p.y);
          }
          if (pts.length < 8) continue;
          g.fillStyle(warn.color, warn.alpha * (Math.floor(z / step) % 2 === 0 ? 0.55 : 0.3));
          g.beginPath();
          g.moveTo(pts[0], pts[1]);
          g.lineTo(pts[2], pts[3]);
          g.lineTo(pts[4], pts[5]);
          g.lineTo(pts[6], pts[7]);
          g.closePath();
          g.fillPath();
          g.lineStyle(1, warn.edge, warn.alpha);
          g.lineBetween(pts[0], pts[1], pts[6], pts[7]);
          g.lineBetween(pts[2], pts[3], pts[4], pts[5]);
        }
      }
    }
  }

  private drawSprites(w: number, h: number): void {
    const v = this.view;
    const sprites = v.sprites;
    const order = this.order;
    order.length = 0;
    for (let i = 0; i < v.spriteCount && i < POOL; i++) order.push(i);
    // Far things first.
    order.sort((a, b) => sprites[b].z - sprites[a].z);
    const p = this.pt;
    let used = 0;
    const hidden = Math.abs(v.yaw) > 0.35;
    for (const i of order) {
      const s = sprites[i];
      if (hidden || !project(v, s.x, s.y, s.z, w, h, p)) continue;
      const img = this.pool[used++];
      img.setTexture(s.key, s.frame);
      const px = s.size * p.s;
      const scale = px / img.frame.height;
      img.setPosition(p.x, p.y).setOrigin(0.5, 1).setVisible(true);
      if (s.width !== undefined) img.setDisplaySize(s.width * p.s, px);
      else img.setScale(scale);
      img.setAlpha(s.alpha ?? 1).setFlipX(s.flip ?? false).setAngle(s.angle ?? 0);
      img.setBlendMode(s.additive ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
      if (s.tint !== undefined) img.setTint(s.tint);
      else img.clearTint();
      img.setDepth(2 + (POOL - used) * 0.01);
    }
    for (let i = used; i < this.pool.length; i++) this.pool[i].setVisible(false);
  }

  /** The cart and rider at the bottom of the screen, from behind; from the side during the swing. */
  private drawCart(w: number, h: number): void {
    const v = this.view;
    const p = this.pt;
    const side = v.rider.side;
    if (!project(v, v.cartX, -1 + v.cartAir, v.travel, w, h, p)) {
      this.cart.setVisible(false);
      this.rider.setVisible(false);
      return;
    }
    const shake = v.cartShake ? (Math.random() - 0.5) * v.cartShake : 0;
    const x = Math.round(p.x + shake);
    const y = Math.round(p.y + 4);
    // Whole-number scales keep the pixels square.
    const cartTex = side ? CH5_TEX.oreCart : CH5_TEX.diveCart;
    this.cart.setTexture(cartTex).setVisible(true);
    const scale = Math.max(1, Math.round((side ? 0.9 : 1.05) * p.s / this.cart.frame.width));
    this.cart.setScale(scale).setPosition(x, y).setAngle(v.cartTilt);
    const rKey = side ? v.rider.sideKey : v.rider.key;
    const rFrame = side ? v.rider.sideFrame : v.rider.frame;
    if (rKey && this.textures.exists(rKey)) {
      this.rider.setTexture(rKey, rFrame).setVisible(true).setScale(scale);
      // The rider sits in the bucket: his lower few pixels behind its rim.
      this.rider.setPosition(x, y - (this.cart.frame.height - (side ? 6 : 10)) * scale).setAngle(v.cartTilt).setAlpha(v.rider.ghost ? 0.55 : 1);
      if (v.rider.ghost) this.rider.setTint(PALETTE.ghostfreakGlow);
      else this.rider.clearTint();
    } else {
      this.rider.setVisible(false);
    }
    if (v.aura) {
      const colors = { shield: PALETTE.diamondhead, phase: PALETTE.ghostfreak, brace: 0xff8a6a, merge: PALETTE.upgrade, fly: 0xd4e83a, boost: 0x52a4ff, senses: 0xffc890, rocket: PALETTE.fire1 } as const;
      this.aura.setVisible(true).setPosition(x, y - 20 * scale).setScale(2.4 * scale, 1.6 * scale).setTint(colors[v.aura]).setAlpha(0.45 + Math.sin(v.time * 0.02) * 0.15);
    } else {
      this.aura.setVisible(false);
    }
  }

  /** Speed lines streaming out from the vanishing point. */
  private drawStreaks(w: number, h: number): void {
    const g = this.streaks;
    g.clear();
    const v = this.view;
    if (v.speed <= 0.05 || Math.abs(v.yaw) > 0.3) return;
    const cx = w / 2;
    const cy = h / 2 + 10;
    g.lineStyle(1, 0xffffff, 0.12 + v.speed * 0.2);
    const n = Math.round(6 + v.speed * 10);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ((v.time * 0.0007 + i * 0.37) % 1);
      const r0 = 120 + ((v.time * 0.6 + i * 53) % 220);
      const r1 = r0 + 16 + v.speed * 30;
      g.lineBetween(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.6, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6);
    }
  }
}
