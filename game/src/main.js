// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between four screens:
// title, play, paused and game over. Mouse clicks land straight on a panel; the
// keyboard drives a crosshair (arrows move it, Enter/Space clicks, H hints, P pauses,
// R restarts). A tiny WebAudio synth plays a chime on a find, a buzz on a miss and a
// little arpeggio on a win — no sound files, everything is generated.
//
// ?seed=N fixes the scene (the scene itself is fixed; the seed only steadies the
// best-score line). ?shot=start|play|play2|end (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, GAME, PANEL } from './config.js';
import { createWorld, EVENT_FOUND, EVENT_HINT, EVENT_MISS, EVENT_TIMEOUT, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { HINT_BUTTON, createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;
/** The crosshair moves this many field pixels a second on arrow keys (half with Shift). */
const CURSOR_SPEED = 520;
const CURSOR_FINE_SPEED = 160;
const STEP = 1 / 60;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
void seed;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);

// ---- sound: a tiny synth, no files -----------------------------------------

let audio = null;
function beep(frequency, startAt, duration, type, gain) {
  try {
    if (audio === null) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume();
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, audio.currentTime + startAt);
    envelope.gain.linearRampToValueAtTime(gain, audio.currentTime + startAt + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + startAt + duration);
    oscillator.connect(envelope);
    envelope.connect(audio.destination);
    oscillator.start(audio.currentTime + startAt);
    oscillator.stop(audio.currentTime + startAt + duration + 0.05);
  } catch {
    // Sound is garnish: a browser without audio still plays fine.
  }
}
function soundFound() {
  beep(660, 0, 0.12, 'sine', 0.12);
  beep(880, 0.09, 0.18, 'sine', 0.12);
}
function soundMiss() {
  beep(160, 0, 0.18, 'sawtooth', 0.06);
}
function soundHint() {
  beep(520, 0, 0.1, 'triangle', 0.08);
}
function soundWin() {
  [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.11, 0.22, 'sine', 0.12));
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. Find ${GAME.totalDifferences} differences before the timer runs out.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (world.state.won) {
      soundWin();
      announce(`You found them all! Score ${world.state.score}. Best ${best}.`);
    } else {
      announce(`Time's up. You found ${world.state.foundCount} of ${GAME.totalDifferences}. Score ${world.state.score}.`);
    }
  }

  function fieldFromClient(clientX, clientY) {
    return renderer.toField(clientX, clientY);
  }

  function hintButtonAt(field) {
    return (
      field.x >= HINT_BUTTON.x &&
      field.x <= HINT_BUTTON.x + HINT_BUTTON.width &&
      field.y >= HINT_BUTTON.y &&
      field.y <= HINT_BUTTON.y + HINT_BUTTON.height
    );
  }

  function handleClick(field) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (hintButtonAt(field)) {
      if (world.useHint() & EVENT_HINT) {
        soundHint();
        announce('Hint: look at the ringed spot.');
      }
      return;
    }
    const events = world.click(field.x, field.y);
    if (events & EVENT_FOUND) {
      soundFound();
      announce(`Found one! ${world.state.foundCount} of ${GAME.totalDifferences}.`);
    } else if (events & EVENT_MISS) {
      soundMiss();
    }
    if (events & EVENT_WIN) endGame();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else {
        handleClick(world.state.cursor);
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      if (world.useHint() & EVENT_HINT) {
        soundHint();
        announce('Hint: look at the ringed spot.');
      }
    }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) startGame();
  }

  function step(dt) {
    // Move the crosshair with the arrow keys.
    const speed = input.keys.fine ? CURSOR_FINE_SPEED : CURSOR_SPEED;
    const dx = ((input.keys.right ? 1 : 0) - (input.keys.left ? 1 : 0)) * speed * dt;
    const dy = ((input.keys.down ? 1 : 0) - (input.keys.up ? 1 : 0)) * speed * dt;
    if (dx !== 0 || dy !== 0) world.moveCursor(dx, dy);
    const events = world.step(dt);
    if (events & EVENT_TIMEOUT) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (input.takePointerDown()) {
      const pointer = input.pointer();
      if (pointer !== null) handleClick(fieldFromClient(pointer.x, pointer.y));
    }
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step(STEP);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    const pointer = input.pointer();
    renderer.draw(world.state, screen, best, pointer === null ? null : fieldFromClient(pointer.x, pointer.y));
  }

  // Leaving the tab pauses a running game rather than letting the timer run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Harbour Spotter. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
