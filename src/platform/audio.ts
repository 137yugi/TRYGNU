export type SfxId = "start" | "select" | "gift" | "pickup" | "error" | "slotSpin" | "slotWin";

interface ToneStep {
  freq: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
}

const SFX: Record<SfxId, ToneStep[]> = {
  start: [
    { freq: 196, duration: 0.055, gain: 0.045, type: "square" },
    { freq: 392, duration: 0.09, gain: 0.05, type: "square" },
  ],
  select: [{ freq: 520, duration: 0.05, gain: 0.035, type: "triangle" }],
  gift: [
    { freq: 330, duration: 0.05, gain: 0.04, type: "triangle" },
    { freq: 660, duration: 0.06, gain: 0.04, type: "triangle" },
    { freq: 990, duration: 0.08, gain: 0.035, type: "triangle" },
  ],
  pickup: [
    { freq: 740, duration: 0.045, gain: 0.04, type: "square" },
    { freq: 988, duration: 0.07, gain: 0.035, type: "triangle" },
  ],
  error: [{ freq: 130, duration: 0.09, gain: 0.035, type: "sawtooth" }],
  slotSpin: [
    { freq: 330, duration: 0.035, gain: 0.035, type: "square" },
    { freq: 392, duration: 0.035, gain: 0.035, type: "square" },
    { freq: 494, duration: 0.035, gain: 0.035, type: "square" },
    { freq: 587, duration: 0.045, gain: 0.032, type: "triangle" },
    { freq: 494, duration: 0.045, gain: 0.03, type: "triangle" },
    { freq: 392, duration: 0.055, gain: 0.028, type: "triangle" },
  ],
  slotWin: [
    { freq: 523, duration: 0.055, gain: 0.045, type: "square" },
    { freq: 659, duration: 0.055, gain: 0.045, type: "square" },
    { freq: 784, duration: 0.08, gain: 0.045, type: "triangle" },
    { freq: 1047, duration: 0.11, gain: 0.04, type: "triangle" },
  ],
};

export class AudioBus {
  private ctx: AudioContext | null = null;
  private lastPlayed = new Map<SfxId, number>();

  play(id: SfxId, enabled: boolean): void {
    if (!enabled) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(id) || 0) < 45) return;
    this.lastPlayed.set(id, now);
    const ctx = this.context();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    let at = ctx.currentTime + 0.008;
    for (const step of SFX[id]) {
      this.tone(ctx, at, step);
      at += step.duration * 0.82;
    }
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    this.ctx = new AudioCtor();
    return this.ctx;
  }

  private tone(ctx: AudioContext, at: number, step: ToneStep): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step.type || "square";
    osc.frequency.setValueAtTime(step.freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(step.gain, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + step.duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + step.duration + 0.02);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
