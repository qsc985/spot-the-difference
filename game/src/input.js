// Keyboard and pointer input. The mouse clicks straight on a panel; the keyboard drives
// a crosshair cursor (arrow keys move it, Shift for fine steps, Enter/Space clicks where
// it stands). One-shot presses (start, pause, hint, restart) are queued as bit flags and
// taken once by the loop, so a press between two frames is never lost or counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_RESTART = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const HINT = new Set(['KeyH']);
const RESTART = new Set(['KeyR']);
const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function createInput(canvas) {
  let actions = 0;
  const keys = { left: false, right: false, up: false, down: false, fine: false };
  let pointer = null;
  let pointerDown = false;

  window.addEventListener('keydown', (event) => {
    if (ARROWS.has(event.code)) {
      if (event.code === 'ArrowLeft') keys.left = true;
      else if (event.code === 'ArrowRight') keys.right = true;
      else if (event.code === 'ArrowUp') keys.up = true;
      else if (event.code === 'ArrowDown') keys.down = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      keys.fine = true;
      return;
    }
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') keys.left = false;
    else if (event.code === 'ArrowRight') keys.right = false;
    else if (event.code === 'ArrowUp') keys.up = false;
    else if (event.code === 'ArrowDown') keys.down = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keys.fine = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    keys.fine = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerdown', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    pointerDown = true;
    event.preventDefault();
  });

  return {
    keys,
    /** The last pointer position in client pixels, or null before the first move. */
    pointer() {
      return pointer;
    },
    /** True once when the pointer was pressed since the last call. */
    takePointerDown() {
      const was = pointerDown;
      pointerDown = false;
      return was;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
