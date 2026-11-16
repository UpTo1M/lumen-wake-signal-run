export const REFITS = [
  { title: 'TRACTOR FIELD', detail: 'Wider signal pickup radius', color: '#4de1c1' },
  { title: 'SLIPSTREAM DRIVE', detail: 'Faster skiff, tighter escapes', color: '#72c7ff' },
  { title: 'AEGIS CHARGE', detail: 'Absorb one sentinel collision', color: '#ffd166' },
];

export function chooseUpgrade(game, choice) {
  if (game.mode !== 'upgrade' || !REFITS[choice - 1]) return;
  if (choice === 1) game.magnet++;
  if (choice === 2) game.engine++;
  if (choice === 3) game.shield++;
  game.upgrades.push(REFITS[choice - 1].title);
  game.events.push('bank'); game.mode = 'play';
  game.message = REFITS[choice - 1].title + ' INSTALLED'; game.messageTimer = 2;
}

export function drawRefit(ctx) {
  ctx.fillStyle = '#061324e8'; ctx.fillRect(0, 0, 960, 600);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffd166'; ctx.font = 'bold 14px Trebuchet MS';
  ctx.fillText('BEACON WORKSHOP / TIME HELD', 480, 165);
  ctx.fillStyle = '#f2fbff'; ctx.font = 'bold 38px Trebuchet MS'; ctx.fillText('CHOOSE YOUR EDGE', 480, 215);
  REFITS.forEach((refit, i) => {
    const x = 90 + i * 270;
    ctx.fillStyle = '#102b40'; ctx.strokeStyle = refit.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, 258, 240, 160, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = refit.color; ctx.font = 'bold 32px Trebuchet MS'; ctx.fillText(String(i + 1), x + 120, 305);
    ctx.font = 'bold 15px Trebuchet MS'; ctx.fillText(refit.title, x + 120, 347);
    ctx.fillStyle = '#aac4d6'; ctx.font = '12px Trebuchet MS'; ctx.fillText(refit.detail, x + 120, 380);
  });
  ctx.fillStyle = '#86a8c2'; ctx.font = '14px Trebuchet MS';
  ctx.fillText('Press 1, 2, or 3 · or click a refit', 480, 468);
}
