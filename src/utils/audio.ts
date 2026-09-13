/**
 * Web Audio API procedural sound synthesizer for Chicken Road Points.
 * Zero external audio files required, low latency, mobile-friendly.
 */

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  try {
    localStorage.setItem('crp_muted', muted ? '1' : '0');
  } catch {
    // ignore storage error
  }
}

export function getMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem('crp_muted');
    return val === '1';
  } catch {
    return false;
  }
}

// Initialize mute from storage
if (typeof window !== 'undefined') {
  isMuted = getMuted();
}

/**
 * Step hop sound
 */
export function playStepSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // ignore
  }
}

/**
 * Round start sound
 */
export function playStartSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [440, 554, 659].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.16);
    });
  } catch {
    // ignore
  }
}

/**
 * Car horn / warning beep
 */
export function playHornSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(380, now);
    osc2.frequency.setValueAtTime(475, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.26);
    osc2.stop(now + 0.26);
  } catch {
    // ignore
  }
}

/**
 * Crash / Collision sound with tire screech & impact thud
 */
export function playCrashSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Tire screech (high screeching sine)
    const screech = ctx.createOscillator();
    const screechGain = ctx.createGain();
    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(900, now);
    screech.frequency.exponentialRampToValueAtTime(250, now + 0.22);
    screechGain.gain.setValueAtTime(0.28, now);
    screechGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    screech.connect(screechGain);
    screechGain.connect(ctx.destination);
    screech.start(now);
    screech.stop(now + 0.25);

    // 2. Impact noise buffer
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.08);
    noise.stop(now + 0.45);

    // 3. Low thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(140, now + 0.1);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    thudGain.gain.setValueAtTime(0.4, now + 0.1);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now + 0.1);
    thud.stop(now + 0.4);
  } catch {
    // ignore
  }
}

/**
 * Claim Points victory fanfare / coin cascade
 */
export function playClaimSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0.3, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.32);
    });
  } catch {
    // ignore
  }
}

/**
 * Button click sound
 */
export function playClickSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // ignore
  }
}
