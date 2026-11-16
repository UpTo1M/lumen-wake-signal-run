export function createInput(canvas) {
  const held = new Set();
  const input = { axisX: 0, axisY: 0, pulsePressed: false, pausePressed: false, confirmPressed: false, upgradePressed: 0, mutePressed: false };
  const updateAxis = () => {
    input.axisX = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
    input.axisY = (held.has('s') || held.has('arrowdown') ? 1 : 0) - (held.has('w') || held.has('arrowup') ? 1 : 0);
  };
  window.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (event.repeat) return;
    if (['1','2','3'].includes(key)) input.upgradePressed = Number(key);
    if (key === 'm') input.mutePressed = true;
    if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','p','enter'].includes(key)) event.preventDefault();
    if (key === ' ') input.pulsePressed = true;
    if (key === 'p') input.pausePressed = true;
    if (key === 'enter') input.confirmPressed = true;
    held.add(key); updateAxis();
  });
  window.addEventListener('keyup', event => { held.delete(event.key.toLowerCase()); updateAxis(); });
  window.addEventListener('blur', () => { held.clear(); updateAxis(); });
  canvas.addEventListener('pointerdown', event => {
    input.confirmPressed = true;
    const box = canvas.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width * 960;
    const y = (event.clientY - box.top) / box.height * 600;
    if (y >= 258 && y <= 418) input.upgradePressed = Math.max(1, Math.min(3, 1 + Math.floor((x - 90) / 270)));
  });
  return input;
}

export function consumePressed(input) {
  const pressed = { pulsePressed: input.pulsePressed, pausePressed: input.pausePressed, confirmPressed: input.confirmPressed, upgradePressed: input.upgradePressed, mutePressed: input.mutePressed };
  input.upgradePressed = 0; input.mutePressed = false;
  input.pulsePressed = false; input.pausePressed = false; input.confirmPressed = false;
  return pressed;
}
