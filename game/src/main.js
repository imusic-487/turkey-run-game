// Gobble Run — the game loop and screen flow: title, play, pause, and the
// caught / escaped end screens, with restart. Wires input, sound, world and
// rendering together; the world itself lives in world.js.
import { STEP, VIEW } from './config.js';
import { EVENT_CAUGHT, EVENT_GOLD, EVENT_HIT, EVENT_OVER, EVENT_PICKUP, EVENT_STAGE, makeWorld, resetWorld, stepWorld, currentScore } from './world.js';
import { Input, hitButton } from './input.js';
import { SoundBank } from './audio.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, drawScreen } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const input = new Input(canvas);
const sounds = new SoundBank();
input.onFirstGesture = () => sounds.ensure();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const world = makeWorld(seed);
let best = 0;
try {
  best = Number(window.localStorage.getItem('gobble-run-best') || '0') || 0;
} catch {
  best = 0;
}
world.best = best;

let screen = SCREEN_TITLE;
let paused = false;
let accumulator = 0;
let lastTime = performance.now();
let elapsed = 0;
let startButton = null;
let restartButton = null;
let alarmAt = 0;

function saveBest() {
  const score = currentScore(world);
  if (score > best) {
    best = score;
    world.best = best;
    try {
      window.localStorage.setItem('gobble-run-best', String(best));
    } catch {
      // Private mode: the best score just lives for this session.
    }
  }
}

function readInput() {
  const held = (...codes) => input.held(...codes);
  const pressed = (...codes) => input.wasPressed(...codes);
  return {
    left: held('ArrowLeft', 'KeyA'),
    right: held('ArrowRight', 'KeyD'),
    down: held('ArrowDown', 'KeyS'),
    jumpPressed: pressed('ArrowUp', 'KeyW', 'Space'),
    dashPressed: pressed('ShiftLeft', 'ShiftRight'),
  };
}

function startRun() {
  resetWorld(world, (world.seed + 1) % 2147483647 || 1);
  world.best = best;
  screen = SCREEN_PLAY;
  paused = false;
  accumulator = 0;
  sounds.ensure();
  sounds.gobble();
  sounds.stage();
  status.textContent = 'The escape has begun. Outrun the farmer!';
}

function endRun() {
  screen = SCREEN_OVER;
  saveBest();
  if (world.over === 'escaped') {
    sounds.escaped();
    status.textContent = `Escaped! Score ${currentScore(world)}.`;
  } else {
    sounds.caught();
    status.textContent = `Caught! ${world.overReason} Score ${currentScore(world)}.`;
  }
}

function handleEvents(events) {
  if (events & EVENT_PICKUP) sounds.pickup();
  if (events & EVENT_GOLD) sounds.golden();
  if (events & EVENT_HIT) {
    sounds.hurt();
    status.textContent = `Ouch! ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left.`;
  }
  if (events & EVENT_STAGE) {
    sounds.stage();
    status.textContent = `Now entering ${world.stage === 1 ? 'the barn' : 'the kitchen'}!`;
  }
  if (events & EVENT_OVER) endRun();
}

function stepGame(dt, gameInput) {
  if (screen !== SCREEN_PLAY || paused) return;
  if (gameInput.jumpPressed) sounds.jump();
  if (gameInput.dashPressed) sounds.flap();
  const events = stepWorld(world, gameInput, dt);
  // Consume the presses: the next fixed step in this same frame must not
  // see the same Space as a second jump (the mid-air flap).
  gameInput.jumpPressed = false;
  gameInput.dashPressed = false;
  if (world.farmer.gained && world.time - alarmAt > 1.6) {
    alarmAt = world.time;
    sounds.alarm();
  }
  handleEvents(events);
}

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  elapsed += dt;

  // Menus: keys and clicks.
  if (screen === SCREEN_TITLE) {
    if (input.wasPressed('Enter', 'Space')) {
      startRun();
    } else {
      const click = input.consumeClick();
      if (click && startButton && hitButton(click, startButton)) {
        sounds.click();
        startRun();
      }
    }
  } else if (screen === SCREEN_OVER) {
    if (input.wasPressed('KeyR', 'Enter', 'Space')) {
      startRun();
    } else {
      const click = input.consumeClick();
      if (click && restartButton && hitButton(click, restartButton)) {
        sounds.click();
        startRun();
      }
    }
  } else if (screen === SCREEN_PLAY) {
    if (input.wasPressed('KeyP', 'Escape')) {
      paused = !paused;
      status.textContent = paused ? 'Paused.' : 'Back to the run!';
    }
    if (input.wasPressed('KeyM')) {
      const muted = sounds.toggleMute();
      status.textContent = muted ? 'Sound off.' : 'Sound on.';
    }
  }

  if (!shotName) {
    accumulator += dt;
    // Read the input once per frame: every fixed step in this frame shares
    // the same jump press, so one Space never becomes jump-plus-flap.
    const gameInput = screen === SCREEN_PLAY && !paused ? readInput() : null;
    while (accumulator >= STEP) {
      if (gameInput) stepGame(STEP, gameInput);
      accumulator -= STEP;
    }
  }

  const hover = startButton && input.mouse.x >= startButton.x && input.mouse.x <= startButton.x + startButton.width
    && input.mouse.y >= startButton.y && input.mouse.y <= startButton.y + startButton.height;
  const button = drawScreen(ctx, world, screen, best, elapsed, hover);
  if (screen === SCREEN_TITLE) startButton = button;
  if (screen === SCREEN_OVER) restartButton = button;
  if (screen === SCREEN_PLAY && paused) {
    ctx.fillStyle = 'rgba(30, 10, 4, 0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2 - 10);
    ctx.font = '18px Trebuchet MS, Verdana, sans-serif';
    ctx.fillText('Press P to keep running', VIEW.width / 2, VIEW.height / 2 + 28);
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

// Screenshot mode (?shot=start|play|end|win&seed=N): stage the world once
// and hold the frame, so the capture is exactly the staged game.
if (shotName) {
  const staged = stageShot(shotName, world, seed);
  screen = staged.screen;
  if (screen === SCREEN_OVER) saveBest();
  const button = drawScreen(ctx, world, screen, best, 0, false);
  if (screen === SCREEN_TITLE) startButton = button;
  if (screen === SCREEN_OVER) restartButton = button;
  status.textContent = `Gobble Run screenshot: ${shotName}.`;
} else {
  status.textContent = 'Gobble Run. Press Enter or click Start to play.';
  requestAnimationFrame(frame);
}

// Test hook: lets automated play-tests read the run without touching the DOM.
window.GOBBLE = {
  world,
  get screen() { return screen; },
  get paused() { return paused; },
  get best() { return best; },
  start: startRun,
};
