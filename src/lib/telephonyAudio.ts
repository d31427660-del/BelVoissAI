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
    gain.gain.setValueAtTime(0, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    let stopped = false;
    let timerId: any = null;

    const scheduleBeep = () => {
      if (stopped || ctx.state === 'closed') return;
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
      gain.gain.setValueAtTime(0.12, t + 0.8);
      gain.gain.linearRampToValueAtTime(0, t + 0.85);
    };

    // First beep immediately
    scheduleBeep();
    // Subsequent beeps every 2.8s
    timerId = setInterval(scheduleBeep, 2800);

    return () => {
      stopped = true;
      if (timerId) clearInterval(timerId);
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
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
