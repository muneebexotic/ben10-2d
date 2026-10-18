import { DEMO, demoKeysAt, demoLoopMs, type DemoKey, type MoveDemo } from '../../config/alienFiles';
import { emptyControls, type Controls } from '../../systems/InputMap';

/**
 * ALIEN FILES' bot: plays one move's demo in the Training arena on a loop.
 * Its controls replace the player's (the keyboard and touch drive the menu
 * around it). Every loop starts fresh: `restart` puts Ben back at the start
 * as the alien, with the move's enemy in front of him.
 */
export class AlienDemoPilot {
  private t = -DEMO.settleMs;
  private readonly held = new Set<DemoKey>();
  private readonly controls = emptyControls();

  constructor(
    readonly demo: MoveDemo,
    private readonly restart: (demo: MoveDemo) => void,
  ) {}

  read(dtMs: number): Controls {
    this.t += dtMs;
    if (this.t >= demoLoopMs(this.demo)) {
      this.t = 0;
      this.restart(this.demo);
    }
    const keys = this.t < 0 ? [] : demoKeysAt(this.demo, this.t);
    const c = this.controls;
    const was = this.held;
    const on = (k: DemoKey) => keys.includes(k);
    const pressed = (k: DemoKey) => on(k) && !was.has(k);
    c.left = on('left');
    c.right = on('right');
    c.up = on('up');
    c.down = on('down');
    c.jumpPressed = pressed('jump');
    c.jumpHeld = on('jump');
    c.attackPressed = pressed('attack');
    c.attackHeld = on('attack');
    c.specialPressed = pressed('special');
    c.specialReleased = was.has('special') && !on('special');
    c.specialHeld = on('special');
    c.transform = pressed('transform');
    c.anyPressed = c.jumpPressed || c.attackPressed || c.specialPressed || c.transform;
    was.clear();
    for (const k of keys) was.add(k);
    return c;
  }
}
