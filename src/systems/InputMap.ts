import Phaser from 'phaser';

export interface Controls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  attackPressed: boolean;
  attackHeld: boolean;
  specialPressed: boolean;
  specialHeld: boolean;
  specialReleased: boolean;
  dialPrev: boolean;
  dialNext: boolean;
  transform: boolean;
  pause: boolean;
  confirm: boolean;
  anyPressed: boolean;
}

export function emptyControls(): Controls {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpPressed: false,
    jumpHeld: false,
    attackPressed: false,
    attackHeld: false,
    specialPressed: false,
    specialHeld: false,
    specialReleased: false,
    dialPrev: false,
    dialNext: false,
    transform: false,
    pause: false,
    confirm: false,
    anyPressed: false,
  };
}

const K = Phaser.Input.Keyboard.KeyCodes;

const BINDINGS = {
  left: [K.A, K.LEFT],
  right: [K.D, K.RIGHT],
  up: [K.W, K.UP],
  down: [K.S, K.DOWN],
  jump: [K.SPACE, K.W, K.UP],
  attack: [K.J, K.X],
  special: [K.K, K.C],
  dialPrev: [K.Q],
  dialNext: [K.E],
  transform: [K.T],
  pause: [K.ESC, K.P],
  confirm: [K.ENTER, K.SPACE],
} as const;

type Action = keyof typeof BINDINGS;

/** Keyboard state sampled once per frame into a plain Controls object. */
export class InputMap {
  private readonly keys: Record<Action, Phaser.Input.Keyboard.Key[]>;
  private readonly wasDown = new Map<Action, boolean>();
  private readonly latched = new Set<Action>();
  private readonly state = emptyControls();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const keys = {} as Record<Action, Phaser.Input.Keyboard.Key[]>;
    const listeners: Array<[Phaser.Input.Keyboard.Key, () => void]> = [];
    for (const action of Object.keys(BINDINGS) as Action[]) {
      keys[action] = BINDINGS[action].map((code) => {
        const key = kb.addKey(code, true, false);
        // Latch presses from the key's own event: Phaser clears JustDown when a tap is released within the same frame.
        const onDown = () => this.latched.add(action);
        key.on(Phaser.Input.Keyboard.Events.DOWN, onDown);
        listeners.push([key, onDown]);
        return key;
      });
    }
    this.keys = keys;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [key, fn] of listeners) key.off(Phaser.Input.Keyboard.Events.DOWN, fn);
    });
  }

  read(): Controls {
    const s = this.state;
    s.left = this.held('left');
    s.right = this.held('right');
    s.up = this.held('up');
    s.down = this.held('down');
    s.jumpPressed = this.pressed('jump');
    s.jumpHeld = this.held('jump') || s.jumpPressed;
    s.attackPressed = this.pressed('attack');
    s.attackHeld = this.held('attack') || s.attackPressed;
    s.specialPressed = this.pressed('special');
    const specialWas = this.wasDown.get('special') ?? false;
    // A tap shorter than one frame still reads as held for this frame, then released on the next.
    s.specialHeld = this.held('special') || s.specialPressed;
    s.specialReleased = specialWas && !s.specialHeld;
    this.wasDown.set('special', s.specialHeld);
    s.dialPrev = this.pressed('dialPrev');
    s.dialNext = this.pressed('dialNext');
    s.transform = this.pressed('transform');
    s.pause = this.pressed('pause');
    s.confirm = this.pressed('confirm');
    s.anyPressed = s.jumpPressed || s.attackPressed || s.specialPressed || s.transform || s.confirm;
    return s;
  }

  /** Forget held keys (e.g. after a pause) so nothing fires on resume. */
  reset(): void {
    for (const list of Object.values(this.keys)) for (const key of list) key.reset();
    this.wasDown.clear();
    this.latched.clear();
  }

  private held(action: Action): boolean {
    return this.keys[action].some((k) => k.isDown);
  }

  /** Latched key-down edges, so taps shorter than a frame are never lost. */
  private pressed(action: Action): boolean {
    const hit = this.latched.has(action);
    this.latched.delete(action);
    return hit;
  }

}
