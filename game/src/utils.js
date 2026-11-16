export function createRng(seed = 1) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function pick(rng, values) { return values[Math.floor(rng() * values.length)]; }
export function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.closePath();
}
