/**
 * Web Audio API synthesizer for authentic telephony sound effects (dial tone, ringing, hangup).
 */

export function playRingingTone(): () => void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return () => {};

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 425Hz is the standard European / Belarusian telephone dial tone frequency
    osc.frequency.setValueAtTime(425, ctx.currentTime);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);

    // Tone 1: 0.8s beep, then quiet
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.setValueAtTime(0.12, now + 0.8);
    gain.gain.linearRampToValueAtTime(0, now + 0.85);

    // Tone 2 (after 2s if still ringing)
    gain.gain.setValueAtTime(0, now + 2.5);
    gain.gain.linearRampToValueAtTime(0.12, now + 2.54);
    gain.gain.setValueAtTime(0.12, now + 3.3);
    gain.gain.linearRampToValueAtTime(0, now + 3.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    return () => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            osc.stop();
            ctx.close();
          } catch {}
        }, 80);
      } catch {}
    };
  } catch {
    return () => {};
  }
}

export function playHangupSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(425, ctx.currentTime);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.12, now + 0.15);
    gain.gain.setValueAtTime(0, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    setTimeout(() => {
      try {
        osc.stop();
        ctx.close();
      } catch {}
    }, 250);
  } catch {}
}
