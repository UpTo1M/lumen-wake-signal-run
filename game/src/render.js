import { WIDTH, HEIGHT, COLORS, GAME_LENGTH, GOAL_SCORE, PULSE_COOLDOWN } from './config.js';
import { roundedRect } from './utils.js';
import { drawRefit } from './refits.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  return { ctx, draw: (game) => drawScene(ctx, game) };
}

function drawScene(ctx, game) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawWater(ctx, game);
  drawCity(ctx, game);
  drawBeacon(ctx, game);
  if (game.mode === 'title') { ctx.letterSpacing = '0px'; drawTitle(ctx, game); return; }
  ctx.letterSpacing = '0px';
  drawObjects(ctx, game);
  drawHud(ctx, game);
  if (game.mode === 'pause') drawPause(ctx);
  if (game.mode === 'upgrade') drawRefit(ctx);
  if (game.mode === 'win' || game.mode === 'lose') drawEnd(ctx, game);
}

function drawWater(ctx, game) {
  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT); bg.addColorStop(0, '#07182c'); bg.addColorStop(1, '#090d23');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save(); ctx.globalAlpha = .14; ctx.strokeStyle = '#4de1c1'; ctx.lineWidth = 1;
  for (let y = 70; y < HEIGHT; y += 42) { ctx.beginPath(); for (let x = 0; x <= WIDTH; x += 24) ctx.lineTo(x, y + Math.sin(x * .014 + game.time * .55 + y) * 4); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#0a2638'; ctx.fillRect(0, 0, WIDTH, 62);
  ctx.fillStyle = '#173753'; ctx.fillRect(0, HEIGHT - 38, WIDTH, 38);
}

function drawCity(ctx, game) {
  ctx.save(); ctx.globalAlpha = .72;
  const blocks = [[8,100,72,166],[15,294,56,102],[830,86,98,206],[748,340,116,102],[280,72,58,92],[430,90,92,112],[590,65,54,158]];
  for (const [x, y, w, h] of blocks) {
    ctx.fillStyle = '#0b253a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#1b5b70'; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#4de1c1';
    for (let wy = y + 16; wy < y + h - 8; wy += 20) for (let wx = x + 12; wx < x + w - 8; wx += 18) if (((wx + wy) / 2) % 3 > 1) ctx.fillRect(wx, wy, 5, 2);
  }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = '#235f70'; ctx.lineWidth = 1; ctx.setLineDash([2, 12]);
  ctx.beginPath(); ctx.ellipse(480, 318, 350, 180, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = '#46788b'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
  ctx.fillText('FLOODED DISTRICT / SECTOR 07', 330, 525);
  for (let i = 0; i < 38; i++) { const x = (i * 173 + game.time * (3 + i % 3)) % 960; const y = 90 + (i * 89) % 440; ctx.globalAlpha = .1 + .12 * Math.sin(i + game.time); ctx.fillStyle = '#93eedc'; ctx.fillRect(x,y,12 + i % 12,1); }
  ctx.restore();
  ctx.fillStyle = '#72c7ff'; ctx.globalAlpha = .45; ctx.fillRect(0, 299, 188, 2); ctx.fillRect(777, 299, 183, 2); ctx.globalAlpha = 1;
}

function drawBeacon(ctx, game) {
  const b = game.beacon;
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(game.time * .12); ctx.strokeStyle = '#ffd16655'; ctx.lineWidth = 2;
  ctx.setLineDash([20, 10]); ctx.beginPath(); ctx.arc(0, 0, 57, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  const glow = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, 90); glow.addColorStop(0, '#ffe7a0aa'); glow.addColorStop(1, '#ffd16600');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(b.x, b.y, 90, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-Math.PI / 4); ctx.fillStyle = '#172f46'; ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 3; roundedRect(ctx, -32, -32, 64, 64, 12); ctx.fill(); ctx.stroke();
  ctx.rotate(Math.PI / 4); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(17, 0); ctx.lineTo(0, 22); ctx.lineTo(-17, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff0bd'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.fillStyle = COLORS.gold; ctx.font = '700 11px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText('BEACON', b.x, b.y + 63);
}

function drawObjects(ctx, game) {
  ctx.strokeStyle = '#4de1c160'; ctx.lineWidth = 4; ctx.beginPath();
  game.trail.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
  for (const ripple of game.ripples) { ctx.save(); ctx.globalAlpha = ripple.life * .7; ctx.strokeStyle = '#b7f6e4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  for (const mote of game.motes) drawMote(ctx, mote, game.time);
  for (const sentinel of game.sentinels) drawSentinel(ctx, sentinel, game.time);
  for (const particle of game.particles) { ctx.globalAlpha = Math.max(0, particle.life); ctx.fillStyle = particle.color; ctx.fillRect(particle.x, particle.y, particle.size, particle.size); }
  ctx.globalAlpha = 1;
  for (const floating of game.floating) { ctx.globalAlpha = floating.life; ctx.fillStyle = floating.color; ctx.font = '700 16px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText(floating.text, floating.x, floating.y); }
  ctx.globalAlpha = 1; drawPlayer(ctx, game);
}

function drawMote(ctx, mote, time) {
  const bob = Math.sin(time * 3 + mote.phase) * 4; const color = mote.hue === 'gold' ? '#ffd166' : mote.hue === 'cyan' ? '#72c7ff' : '#4de1c1';
  ctx.save(); ctx.translate(mote.x, mote.y + bob); ctx.shadowBlur = 20; ctx.shadowColor = color; ctx.fillStyle = color; ctx.rotate(time + mote.phase); ctx.beginPath(); ctx.moveTo(0, -mote.radius); ctx.lineTo(mote.radius, 0); ctx.lineTo(0, mote.radius); ctx.lineTo(-mote.radius, 0); ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawSentinel(ctx, sentinel, time) {
  if (sentinel.arrival > 0) {
    ctx.save(); ctx.strokeStyle = sentinel.color; ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sentinel.x, sentinel.y, 32 + sentinel.arrival * 20, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = sentinel.color; ctx.font = 'bold 10px Trebuchet MS'; ctx.fillText('INCOMING', sentinel.x, sentinel.y - 44); ctx.restore(); return;
  }
  ctx.save(); ctx.translate(sentinel.x, sentinel.y); ctx.rotate(time * .8 + sentinel.phase); ctx.shadowBlur = 18; ctx.shadowColor = sentinel.color; ctx.strokeStyle = sentinel.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, sentinel.radius, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-sentinel.radius - 8, 0); ctx.lineTo(sentinel.radius + 8, 0); ctx.moveTo(0, -sentinel.radius - 8); ctx.lineTo(0, sentinel.radius + 8); ctx.stroke(); ctx.fillStyle = '#ffdae0'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawPlayer(ctx, game) {
  const p = game.player; const flicker = p.invincible > 0 && Math.floor(p.invincible * 12) % 2 === 0; if (flicker) return;
  ctx.save(); ctx.translate(p.x, p.y); const angle = Math.atan2(p.vy, p.vx || 1); ctx.rotate(angle);
  ctx.shadowBlur = p.pulsing > 0 ? 32 : 18; ctx.shadowColor = p.pulsing > 0 ? '#ffd166' : '#b7f6e4'; ctx.fillStyle = '#b7f6e4';
  ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -12); ctx.lineTo(-6, 0); ctx.lineTo(-12, 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#4de1c1'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (game.collected) {
    ctx.save(); ctx.strokeStyle = '#ffd16640'; ctx.setLineDash([3, 10]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(game.beacon.x, game.beacon.y); ctx.stroke(); ctx.restore();
  }
  if (game.collected) { ctx.textAlign = 'center'; ctx.fillStyle = COLORS.gold; ctx.font = 'bold 12px Trebuchet MS'; ctx.fillText(`${game.collected} SIGNALS · BANK AT BEACON`, p.x, p.y + 33); }
  if (game.shield) { ctx.strokeStyle = COLORS.gold; ctx.beginPath(); ctx.arc(p.x,p.y,27,0,Math.PI*2); ctx.stroke(); }
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.white; ctx.textAlign = 'left'; ctx.font = '700 14px Trebuchet MS'; ctx.fillText('LUMEN WAKE', 22, 26);
  ctx.fillStyle = COLORS.muted; ctx.font = '11px Trebuchet MS'; ctx.fillText(`WAVE ${game.wave}  //  TIDE ${Math.max(0, GAME_LENGTH - game.time).toFixed(0)}s`, 22, 45);
  drawStat(ctx, 260, 18, 'SCORE', String(game.score).padStart(5, '0'), COLORS.gold);
  drawStat(ctx, 400, 18, 'HAUL', String(game.collected).padStart(2, '0'), COLORS.teal);
  drawStat(ctx, 510, 18, 'LIVES', '◆'.repeat(game.lives) + '◇'.repeat(3 - game.lives), COLORS.coral);
  drawStat(ctx, 650, 18, 'WAVE', `${game.wave}/${5}`, COLORS.purple);
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.muted; ctx.font = '10px Trebuchet MS'; ctx.fillText(`BEST ${String(game.highScore).padStart(5, '0')}`, 936, 25);
  ctx.fillStyle = '#1b3c52'; roundedRect(ctx, 760, 35, 176, 8, 4); ctx.fill(); ctx.fillStyle = COLORS.gold; roundedRect(ctx, 760, 35, 176 * Math.min(1, game.score / GOAL_SCORE), 8, 4); ctx.fill();
  ctx.textAlign = 'left'; ctx.fillStyle = COLORS.muted; ctx.font = '10px Trebuchet MS'; ctx.fillText(`TARGET ${GOAL_SCORE} · ${Math.min(100, Math.floor(game.score / GOAL_SCORE * 100))}%`, 760, 55);
  ctx.fillStyle = '#1b3c52'; roundedRect(ctx, 24, 558, 122, 7, 4); ctx.fill(); ctx.fillStyle = COLORS.cyan; roundedRect(ctx, 24, 558, 122 * game.pulse, 7, 4); ctx.fill(); ctx.fillStyle = COLORS.muted; ctx.font = '10px Trebuchet MS'; ctx.fillText(game.pulseCooldown > 0 ? `PULSE ${game.pulseCooldown.toFixed(1)}s` : 'PULSE READY', 24, 550);
  if (game.messageTimer > 0) { ctx.globalAlpha = Math.min(1, game.messageTimer * 2); ctx.fillStyle = COLORS.white; ctx.textAlign = 'center'; ctx.font = '700 14px Trebuchet MS'; ctx.fillText(game.message, WIDTH / 2, 91); ctx.globalAlpha = 1; }
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.teal; ctx.font = '10px Trebuchet MS';
  ctx.fillText(`TRACTOR ${game.magnet}  ·  DRIVE ${game.engine}  ·  SHIELD ${game.shield}`, 936, 553);
  if (game.collected >= 4) { ctx.fillStyle = COLORS.gold; ctx.font = 'bold 12px Trebuchet MS'; ctx.fillText('HIGH-VALUE HAUL · RETURN TO BEACON', 936, 533); }
  if (game.combo > 1) { ctx.fillStyle = COLORS.gold; ctx.font = '700 15px Trebuchet MS'; ctx.textAlign = 'center'; ctx.fillText(`COMBO x${game.combo}`, WIDTH / 2, 116); }
}

function drawStat(ctx, x, y, label, value, color) { ctx.fillStyle = COLORS.muted; ctx.font = '9px Trebuchet MS'; ctx.fillText(label, x, y); ctx.fillStyle = color; ctx.font = '700 15px Trebuchet MS'; ctx.fillText(value, x, y + 19); }

function panel(ctx, x, y, w, h) { ctx.fillStyle = '#061324eF'; roundedRect(ctx, x, y, w, h, 16); ctx.fill(); ctx.strokeStyle = '#2b6078'; ctx.lineWidth = 1; ctx.stroke(); }

function drawTitle(ctx, game) {
  ctx.save(); ctx.fillStyle = '#061324b8'; ctx.fillRect(0, 0, WIDTH, HEIGHT); panel(ctx, 145, 108, 670, 392);
  ctx.textAlign = 'center'; ctx.fillStyle = COLORS.gold; ctx.font = '700 16px Trebuchet MS'; ctx.letterSpacing = '1px'; ctx.fillText('A SIGNAL-RUNNING ARCADE ODYSSEY', WIDTH / 2, 158);
  ctx.fillStyle = COLORS.white; ctx.font = '700 58px Trebuchet MS'; ctx.fillText('LUMEN WAKE', WIDTH / 2, 224);
  ctx.fillStyle = COLORS.teal; ctx.font = '700 20px Trebuchet MS'; ctx.fillText('BRING THE LIGHT HOME', WIDTH / 2, 258);
  ctx.fillStyle = COLORS.muted; ctx.font = '15px Trebuchet MS'; ctx.fillText('Steer the skiff through a drowned city. Harvest drifting signals,', WIDTH / 2, 310); ctx.fillText('Bank 2,400 points in 78 seconds. Bigger hauls earn bigger bonuses.', WIDTH / 2, 333);
  ctx.fillStyle = '#15344a'; roundedRect(ctx, 292, 375, 376, 60, 10); ctx.fill(); ctx.strokeStyle = '#4de1c1'; ctx.stroke(); ctx.fillStyle = COLORS.mint; ctx.font = '700 19px Trebuchet MS'; ctx.fillText('PRESS ENTER TO LAUNCH', WIDTH / 2, 412);
  ctx.fillStyle = COLORS.muted; ctx.font = '12px Trebuchet MS'; ctx.fillText('WASD / ARROWS steer   ·   SPACE dash + blast   ·   P pause   ·   M sound', WIDTH / 2, 470); ctx.restore();
}

function drawPause(ctx) { ctx.save(); ctx.fillStyle = '#061324bb'; ctx.fillRect(0, 0, WIDTH, HEIGHT); panel(ctx, 280, 215, 400, 150); ctx.textAlign = 'center'; ctx.fillStyle = COLORS.white; ctx.font = '700 34px Trebuchet MS'; ctx.fillText('SIGNAL HELD', WIDTH / 2, 270); ctx.fillStyle = COLORS.muted; ctx.font = '14px Trebuchet MS'; ctx.fillText('Press P to return to the wake', WIDTH / 2, 310); ctx.restore(); }

function drawEnd(ctx, game) {
  ctx.save(); ctx.fillStyle = '#061324d9'; ctx.fillRect(0, 0, WIDTH, HEIGHT); panel(ctx, 220, 145, 520, 320); ctx.textAlign = 'center';
  const win = game.mode === 'win'; ctx.fillStyle = win ? COLORS.gold : COLORS.coral; ctx.font = '700 16px Trebuchet MS'; ctx.fillText(win ? 'THE BEACON ANSWERS' : 'THE TIDE WINS THIS RUN', WIDTH / 2, 194);
  ctx.fillStyle = COLORS.white; ctx.font = '700 46px Trebuchet MS'; ctx.fillText(win ? 'SIGNAL SECURED' : 'SIGNAL LOST', WIDTH / 2, 250);
  ctx.fillStyle = COLORS.mint; ctx.font = '700 25px Trebuchet MS'; ctx.fillText(`${String(game.score).padStart(5, '0')} POINTS`, WIDTH / 2, 301);
  ctx.fillStyle = COLORS.muted; ctx.font = '14px Trebuchet MS'; ctx.fillText(`Signals banked: ${game.banked}   ·   Sentinels evaded: ${game.escaped}`, WIDTH / 2, 337);
  ctx.fillStyle = '#15344a'; roundedRect(ctx, 342, 380, 276, 48, 9); ctx.fill(); ctx.strokeStyle = win ? COLORS.gold : COLORS.teal; ctx.stroke(); ctx.fillStyle = COLORS.white; ctx.font = '700 16px Trebuchet MS'; ctx.fillText('ENTER TO RUN AGAIN', WIDTH / 2, 411); ctx.restore();
}
