import { HEIGHT, WIDTH, STARTING_LIVES, GAME_LENGTH, GOAL_SCORE, MAX_WAVE, PLAYER_SPEED, PULSE_SPEED, PULSE_COOLDOWN, MOTE_VALUE, DANGER_COLORS } from './config.js';
import { clamp, createRng, distance, lerp, pick } from './utils.js';

function readBest() {
  try { return Number(localStorage.getItem('lumen-wake-high')) || 0; } catch { return 0; }
}

export function createGame(seed = 1) {
  const rng = createRng(seed);
  return {
    mode: 'title', seed, rng, time: 0, score: 0, highScore: readBest(),
    lives: STARTING_LIVES, wave: 1, combo: 0, comboTimer: 0, pulse: 1, pulseCooldown: 0,
    player: { x: 150, y: HEIGHT / 2, vx: 0, vy: 0, radius: 15, invincible: 0, pulsing: 0 },
    beacon: { x: 110, y: HEIGHT / 2, radius: 48 },
    motes: [], sentinels: [], particles: [], ripples: [], floating: [],
    nextMote: 0.3, nextSentinel: 4.0, message: 'FOLLOW THE LIGHT', messageTimer: 2.8,
    goal: GOAL_SCORE, collected: 0, banked: 0, escaped: 0,
    events: [], upgrades: [], upgradeDue: false, nextUpgrade: 6, magnet: 0, engine: 0, shield: 0,
    lastDirection: { x: 1, y: 0 }, trail: [], bankFlash: 0,
  };
}

export function beginRun(game) {
  Object.assign(game, createGame(game.seed));
  game.mode = 'play';
  game.message = 'COLLECT SIGNAL · RETURN TO BEACON';
  game.messageTimer = 3.2;
  for (let i = 0; i < 7; i++) spawnMote(game);
}

export function setMode(game, mode) { game.mode = mode; }

function spawnMote(game) {
  const { rng } = game;
  const side = rng() > 0.5 ? 1 : -1;
  const x = side > 0 ? 760 + rng() * 150 : 270 + rng() * 420;
  const y = 110 + rng() * 380;
  game.motes.push({ x, y, radius: 9, phase: rng() * Math.PI * 2, value: MOTE_VALUE, hue: pick(rng, ['teal', 'gold', 'cyan']), age: 0 });
}

function spawnSentinel(game) {
  const { rng, wave } = game;
  const fromTop = rng() > 0.5;
  game.sentinels.push({
    x: fromTop ? 160 + rng() * 650 : 860,
    y: fromTop ? 90 : 130 + rng() * 340,
    radius: 18 + wave * 1.2,
    speed: 40 + wave * 8 + rng() * 18,
    phase: rng() * 5, color: wave > 2 ? '#b48cff' : '#ff6b79', life: 1, arrival: .85,
    kind: wave > 2 && rng() > .55 ? 'interceptor' : 'hunter',
  });
}

export function updateGame(game, input, dt) {
  if (game.mode !== 'play') return;
  game.time += dt;
  game.messageTimer = Math.max(0, game.messageTimer - dt);
  game.comboTimer = Math.max(0, game.comboTimer - dt);
  game.pulseCooldown = Math.max(0, game.pulseCooldown - dt);
  game.player.invincible = Math.max(0, game.player.invincible - dt);
  game.player.pulsing = Math.max(0, game.player.pulsing - dt);
  if (game.comboTimer === 0) game.combo = 0;

  const length = Math.hypot(input.axisX, input.axisY) || 1;
  if (input.axisX || input.axisY) game.lastDirection = { x: input.axisX / length, y: input.axisY / length };
  const speed = PLAYER_SPEED + game.engine * 28;
  const dashing = game.player.pulsing > 0;
  const targetX = dashing ? game.lastDirection.x * PULSE_SPEED : input.axisX / length * speed;
  const targetY = dashing ? game.lastDirection.y * PULSE_SPEED : input.axisY / length * speed;
  game.player.vx = lerp(game.player.vx, targetX, 1 - Math.pow(0.0001, dt));
  game.player.vy = lerp(game.player.vy, targetY, 1 - Math.pow(0.0001, dt));
  game.player.x = clamp(game.player.x + game.player.vx * dt, 95, WIDTH - 42);
  game.player.y = clamp(game.player.y + game.player.vy * dt, 82, HEIGHT - 55);
  game.trail.push({ x: game.player.x, y: game.player.y });
  if (game.trail.length > 24) game.trail.shift();
  game.bankFlash = Math.max(0, game.bankFlash - dt);

  if (input.pulsePressed && game.pulseCooldown <= 0 && game.pulse >= 0.22) {
    game.player.pulsing = 0.42; game.pulseCooldown = PULSE_COOLDOWN; game.pulse = Math.max(0, game.pulse - 0.22);
    game.player.invincible = 0.5; game.ripples.push({ x: game.player.x, y: game.player.y, radius: 18, life: 1 });
    game.message = 'PULSE CUT · SENTINELS STAGGER'; game.messageTimer = 1.3; game.events.push('pulse');
    game.sentinels.forEach(s => { if (distance(game.player, s) < 170) { s.life = 0; game.escaped++; burst(game, s.x, s.y, s.color, 14); } });
  }
  game.pulse = Math.min(1, game.pulse + dt * 0.018);

  game.nextMote -= dt;
  if (game.nextMote <= 0) { spawnMote(game); game.nextMote = Math.max(0.45, 1.15 - game.wave * 0.1) + game.rng() * 0.8; }
  game.nextSentinel -= dt;
  if (game.nextSentinel <= 0) { spawnSentinel(game); game.nextSentinel = Math.max(0.65, 2.9 - game.wave * 0.42) + game.rng() * 1.2; }

  for (const mote of game.motes) mote.age += dt;
  for (const sentinel of game.sentinels) {
    sentinel.arrival = Math.max(0, sentinel.arrival - dt);
    if (sentinel.arrival > 0) continue;
    const lead = sentinel.kind === 'interceptor' ? .6 : 0;
    const dx = game.player.x + game.player.vx * lead - sentinel.x;
    const dy = game.player.y + game.player.vy * lead - sentinel.y;
    const len = Math.hypot(dx, dy) || 1; const drift = Math.sin(game.time * 2 + sentinel.phase) * 0.28;
    sentinel.x += (dx / len - dy / len * drift) * sentinel.speed * dt;
    sentinel.y += (dy / len + dx / len * drift) * sentinel.speed * dt;
    if (sentinel.life > 0 && game.player.invincible <= 0 && distance(game.player, sentinel) < sentinel.radius + game.player.radius) hitPlayer(game, sentinel);
  }
  game.sentinels = game.sentinels.filter(s => s.life > 0 && s.x > 40 && s.x < WIDTH + 50 && s.y > 40 && s.y < HEIGHT + 40);

  for (const ripple of game.ripples) { ripple.radius += dt * 280; ripple.life -= dt * 2.4; }
  game.ripples = game.ripples.filter(r => r.life > 0);
  for (const p of game.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * p.fade; p.vy += 12 * dt; }
  game.particles = game.particles.filter(p => p.life > 0);
  for (const f of game.floating) { f.y -= dt * 26; f.life -= dt; }
  game.floating = game.floating.filter(f => f.life > 0);

  collectMotes(game);
  const nearBeacon = distance(game.player, game.beacon) < game.beacon.radius + game.player.radius;
  if (nearBeacon && game.collected > 0) bankSignal(game);
  if (game.time >= GAME_LENGTH) endRun(game, game.score >= game.goal ? 'win' : 'lose');
  const nextWave = Math.min(MAX_WAVE, 1 + Math.floor(game.time / 15));
  if (nextWave > game.wave) { game.wave = nextWave; game.message = `TIDE SURGE · WAVE ${game.wave}`; game.messageTimer = 2; }
  if (game.score >= game.goal && game.time > 4) endRun(game, 'win');
}

function collectMotes(game) {
  const kept = [];
  for (const mote of game.motes) {
    if (distance(game.player, mote) < game.player.radius + mote.radius + 12 + game.magnet * 30) {
      game.events.push('collect');
      game.collected++; game.combo++; game.comboTimer = 2.5; burst(game, mote.x, mote.y, mote.hue === 'gold' ? '#ffd166' : '#4de1c1', 10);
      game.floating.push({ x: mote.x, y: mote.y, text: `+${mote.value}`, life: 1, color: mote.hue === 'gold' ? '#ffd166' : '#b7f6e4' });
    } else kept.push(mote);
  }
  game.motes = kept;
}

function bankSignal(game) {
  const bonus = game.collected * MOTE_VALUE + Math.max(0, game.collected - 1) * 30;
  game.bankFlash = 1; game.events.push('bank'); game.pulse = Math.min(1, game.pulse + .2);
  game.player.invincible = Math.max(game.player.invincible, 2);
  game.sentinels = game.sentinels.filter(s => {
    if (distance(s, game.beacon) < 200) { burst(game, s.x, s.y, s.color, 10); return false; }
    return true;
  });
  game.score += bonus; game.banked += game.collected; game.collected = 0; game.combo = 0; game.comboTimer = 0;
  burst(game, game.beacon.x, game.beacon.y, '#72c7ff', 20); game.ripples.push({ x: game.beacon.x, y: game.beacon.y, radius: 20, life: 1 });
  game.message = `SIGNAL BANKED · +${bonus}`; game.messageTimer = 1.2;
  if (game.banked >= game.nextUpgrade && game.score < game.goal) { game.mode = 'upgrade'; game.nextUpgrade += 6; }
}

function hitPlayer(game, sentinel) {
  if (game.shield > 0) { game.shield--; game.player.invincible = 1.6; sentinel.life = 0; game.events.push('pulse'); return; }
  game.events.push('hit');
  game.lives--; game.player.invincible = 2.4; game.player.x = 170; game.player.y = HEIGHT / 2; game.collected = 0; game.combo = 0;
  sentinel.life = 0; burst(game, game.player.x, game.player.y, '#ff6b79', 26); game.message = game.lives > 0 ? 'HULL HIT · FIND THE BEACON' : 'THE TIDE TOOK THE SIGNAL'; game.messageTimer = 2;
  if (game.lives <= 0) endRun(game, 'lose');
}

function endRun(game, mode) {
  if (game.mode !== 'play') return;
  game.mode = mode; game.player.vx = 0; game.player.vy = 0; game.events.push(mode);
  game.highScore = Math.max(game.highScore, game.score);
  try { localStorage.setItem('lumen-wake-high', String(game.highScore)); } catch {}
  burst(game, game.player.x, game.player.y, mode === 'win' ? '#ffd166' : '#ff6b79', 42);
}

export function burst(game, x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = game.rng() * Math.PI * 2; const speed = 30 + game.rng() * 140;
    game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 2 + game.rng() * 4, life: .7 + game.rng() * .7, fade: 1 + game.rng(), color });
  }
}
