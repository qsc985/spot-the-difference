// The game's rules and state, with no drawing and no browser in it: which differences
// are found, the score, the timer, hints and misses, the crosshair cursor. step() advances
// one fixed step and returns what happened as bit flags, so the caller can react without
// the world knowing about screens or sound. Nothing here allocates after createWorld
// returns, except the small miss/hint flashes the renderer reads.
import { DIFFERENCES, FIELD, GAME, PANEL } from './config.js';

export const EVENT_FOUND = 1;
export const EVENT_MISS = 2;
export const EVENT_WIN = 4;
export const EVENT_TIMEOUT = 8;
export const EVENT_HINT = 16;

/** A miss flash or a hint ring, drawn by the renderer for a short while. */
function makeFlash() {
  return { active: false, x: 0, y: 0, panel: 0, until: 0 };
}

export function createWorld() {
  const state = {
    found: new Array(DIFFERENCES.length).fill(false),
    foundCount: 0,
    score: 0,
    timeLeft: GAME.timeLimitSeconds,
    hintsLeft: GAME.maxHints,
    hintsUsed: 0,
    misses: 0,
    elapsed: 0,
    over: false,
    won: false,
    /** Crosshair cursor, in field coordinates. Starts in the middle of the left panel. */
    cursor: { x: PANEL.leftX + PANEL.width / 2, y: PANEL.topY + PANEL.height / 2 },
    missFlash: makeFlash(),
    hintFlash: makeFlash(),
    /** The difference the hint is pointing at, or -1. */
    hintTarget: -1,
  };

  function reset() {
    state.found.fill(false);
    state.foundCount = 0;
    state.score = 0;
    state.timeLeft = GAME.timeLimitSeconds;
    state.hintsLeft = GAME.maxHints;
    state.hintsUsed = 0;
    state.misses = 0;
    state.elapsed = 0;
    state.over = false;
    state.won = false;
    state.cursor.x = PANEL.leftX + PANEL.width / 2;
    state.cursor.y = PANEL.topY + PANEL.height / 2;
    state.missFlash.active = false;
    state.hintFlash.active = false;
    state.hintTarget = -1;
  }

  /** Which panel a field point is in: 0 for left, 1 for right, -1 for neither. */
  function panelAt(x, y) {
    if (y < PANEL.topY || y > PANEL.topY + PANEL.height) return -1;
    if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.width) return 0;
    if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.width) return 1;
    return -1;
  }

  /**
   * Try a click at field coordinates (x, y). Returns EVENT_FOUND or EVENT_MISS (or
   * EVENT_WIN as well when it was the last difference), and 0 when the click is not
   * on a panel or the game is already over.
   */
  function click(x, y) {
    if (state.over) return 0;
    const panel = panelAt(x, y);
    if (panel === -1) return 0;
    const originX = panel === 0 ? PANEL.leftX : PANEL.rightX;
    const lx = x - originX;
    const ly = y - PANEL.topY;
    for (let index = 0; index < DIFFERENCES.length; index += 1) {
      if (state.found[index]) continue;
      const d = DIFFERENCES[index];
      const dx = lx - d.x;
      const dy = ly - d.y;
      const reach = d.r + GAME.clickSlack;
      if (dx * dx + dy * dy <= reach * reach) {
        state.found[index] = true;
        state.foundCount += 1;
        state.score += GAME.pointsPerFind;
        state.hintTarget = -1;
        state.hintFlash.active = false;
        let events = EVENT_FOUND;
        if (state.foundCount === DIFFERENCES.length) {
          state.over = true;
          state.won = true;
          state.score += Math.round(state.timeLeft) * 2;
          events |= EVENT_WIN;
        }
        return events;
      }
    }
    // A miss: a red X where the player clicked, and a small points penalty.
    state.misses += 1;
    state.score = Math.max(0, state.score + GAME.pointsPerMiss);
    state.missFlash.active = true;
    state.missFlash.x = lx;
    state.missFlash.y = ly;
    state.missFlash.panel = panel;
    state.missFlash.until = state.elapsed + 0.6;
    return EVENT_MISS;
  }

  /** Spend a hint: ring the first still-hidden difference for a couple of seconds. */
  function useHint() {
    if (state.over || state.hintsLeft <= 0) return 0;
    for (let index = 0; index < DIFFERENCES.length; index += 1) {
      if (state.found[index]) continue;
      state.hintsLeft -= 1;
      state.hintsUsed += 1;
      state.score = Math.max(0, state.score - GAME.hintCost);
      state.hintTarget = index;
      state.hintFlash.active = true;
      state.hintFlash.x = DIFFERENCES[index].x;
      state.hintFlash.y = DIFFERENCES[index].y;
      state.hintFlash.until = state.elapsed + 2.5;
      return EVENT_HINT;
    }
    return 0;
  }

  /** Move the crosshair cursor by (dx, dy) field pixels, clamped to the panels. */
  function moveCursor(dx, dy) {
    state.cursor.x = Math.min(FIELD.width - 4, Math.max(4, state.cursor.x + dx));
    state.cursor.y = Math.min(PANEL.topY + PANEL.height - 4, Math.max(PANEL.topY + 4, state.cursor.y + dy));
  }

  /** Advance the clock by dt seconds. Returns EVENT_TIMEOUT when time runs out. */
  function step(dt) {
    if (state.over) return 0;
    state.elapsed += dt;
    state.timeLeft -= dt;
    if (state.missFlash.active && state.elapsed >= state.missFlash.until) state.missFlash.active = false;
    if (state.hintFlash.active && state.elapsed >= state.hintFlash.until) {
      state.hintFlash.active = false;
      state.hintTarget = -1;
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      state.won = false;
      return EVENT_TIMEOUT;
    }
    return 0;
  }

  return { state, reset, click, useHint, moveCursor, step, panelAt };
}
