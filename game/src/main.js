import { createGame, beginRun, updateGame, setMode } from './state.js';
import { createInput, consumePressed } from './input.js';
import { createRenderer } from './render.js';
import { chooseUpgrade } from './refits.js';
import { createAudio } from './audio.js';

const canvas = document.querySelector('#game');
const status = document.querySelector('#live-status');
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const seed = Number(new URLSearchParams(location.search).get('seed') || 1);
const game = createGame(seed);
const audio = createAudio();
window.addEventListener('keydown', audio.unlock);
canvas.addEventListener('pointerdown', audio.unlock);
window.addEventListener('blur', () => { if (game.mode === 'play') game.mode = 'pause'; });
// Read-only telemetry for browser QA and accessible state inspection.
window.lumenSnapshot = () => JSON.parse(JSON.stringify({ ...game, rng: undefined, events: undefined }));
let last = performance.now();

function announce(text) { status.textContent = text; }
function handleScreenInput(pressed) {
  if (pressed.mutePressed) { const muted = audio.toggle(); announce(muted ? 'Sound off' : 'Sound on'); }
  if (game.mode === 'upgrade' && pressed.upgradePressed) { chooseUpgrade(game, pressed.upgradePressed); return; }
  if (game.mode === 'title' && pressed.confirmPressed) { beginRun(game); announce('Run started. Collect signals and return to the beacon.'); }
  else if ((game.mode === 'win' || game.mode === 'lose') && pressed.confirmPressed) { beginRun(game); announce('New run started.'); }
  else if (pressed.pausePressed && (game.mode === 'play' || game.mode === 'pause')) { setMode(game, game.mode === 'play' ? 'pause' : 'play'); announce(game.mode === 'pause' ? 'Game paused.' : 'Game resumed.'); }
}
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  const pressed = consumePressed(input); handleScreenInput(pressed);
  updateGame(game, { ...input, ...pressed }, dt);
  for (const event of game.events.splice(0)) audio.play(event);
  canvas.dataset.mode = game.mode;
  renderer.draw(game); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
