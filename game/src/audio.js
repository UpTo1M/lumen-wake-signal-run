// All sounds are synthesized locally. No audio assets or network access.
export function createAudio() {
  let context; let muted = false;
  const unlock = () => {
    try { context ??= new (window.AudioContext || window.webkitAudioContext)(); context.resume(); } catch {}
  };
  const tone = (frequency, delay, duration, type, volume) => {
    if (!context || muted) return;
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .7, at + duration);
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .008);
    gain.gain.exponentialRampToValueAtTime(.001, at + duration);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(at); oscillator.stop(at + duration + .02);
  };
  return {
    unlock,
    toggle() { muted = !muted; return muted; },
    play(event) {
      if (event === 'collect') tone(940, 0, .12, 'sine', .08);
      if (event === 'pulse') { tone(170, 0, .3, 'sawtooth', .045); tone(380, .04, .22, 'sine', .08); }
      if (event === 'hit') tone(75, 0, .4, 'triangle', .18);
      if (event === 'bank' || event === 'win') [392, 494, 587, 784].forEach((n, i) => tone(n, i * .09, .35, 'sine', .08));
      if (event === 'lose') [280, 210, 140].forEach((n, i) => tone(n, i * .14, .32, 'triangle', .09));
    },
  };
}
