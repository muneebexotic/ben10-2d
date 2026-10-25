import Phaser from 'phaser';
import { RigActor } from '../../../systems/hd/RigActor';
import { castRig } from '../../preload/cartoon/cast';
import { rigTextureKey } from '../../preload/cartoon/rig';
import { EventBus } from '../../../systems/EventBus';

/**
 * Dev tool (`?level=ch7&rigview=ben,ripjaws&zoom=4&clips=idle,run`): every
 * clip of a cartoon rig side by side, big, on a plain background, for
 * reviewing and replacing art. Dev and bench builds only.
 */
export function startRigViewer(scene: Phaser.Scene, query: URLSearchParams): void {
  const ids = (query.get('rigview') ?? '').split(',').filter(Boolean);
  const zoom = Number(query.get('zoom') ?? 4);
  const only = (query.get('clips') ?? '').split(',').filter(Boolean);
  const cam = scene.cameras.main;
  EventBus.emit('hud:visible', { visible: false });
  const ox = 20000;
  const oy = 20000;
  const view = { w: cam.width / zoom, h: cam.height / zoom };
  scene.add.rectangle(ox - 400, oy - 400, 2000, 2000, Number(query.get('bg') ?? 0x3a4a68)).setOrigin(0, 0).setDepth(900);
  const cols = Number(query.get('cols') ?? 6);
  const cellW = view.w / cols;
  let row = 0;
  let col = 0;
  const cellH = Number(query.get('cellh') ?? 46);
  const actors: RigActor[] = [];
  for (const id of ids) {
    const rig = castRig(id);
    const clips = only.length > 0 ? only : Object.keys(rig.clips);
    for (const clip of clips) {
      const actor = new RigActor(scene, rig, rigTextureKey(id));
      actor.play(clip);
      actor.container.setPosition(ox + col * cellW + cellW / 2, oy + row * cellH + cellH - 6).setDepth(901);
      scene.add.text(ox + col * cellW + 2, oy + row * cellH + 1, clip, { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff', resolution: 1 }).setScale(1 / zoom * 1.2).setDepth(902);
      actors.push(actor);
      col++;
      if (col >= cols) {
        col = 0;
        row++;
      }
    }
    if (col > 0) {
      col = 0;
      row++;
    }
  }
  cam.stopFollow();
  cam.removeBounds();
  cam.setZoom(zoom);
  cam.setScroll(ox - (cam.width - view.w) / 2, oy - (cam.height - view.h) / 2);
  const freeze = query.get('t');
  scene.events.on(Phaser.Scenes.Events.PRE_RENDER, () => {
    for (const a of actors) a.update(freeze !== null ? 0 : scene.game.loop.delta, freeze !== null ? Number(freeze) : null);
    cam.setZoom(zoom);
    cam.setScroll(ox - (cam.width - view.w) / 2, oy - (cam.height - view.h) / 2);
  });
}
