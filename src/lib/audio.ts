'use client';

let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem('chats_sound_enabled');
  if (val === null) {
    // Default to true (enabled out-of-the-box for all users)
    localStorage.setItem('chats_sound_enabled', 'true');
    return true;
  }
  return val === 'true';
}

// Global unlock AudioContext on user interaction (click/touch/keydown/mousedown/pointerdown)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // Play silent 0.001s buffer to complete audio handshake across all browser engines
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch (e) {}
      }).catch(() => {});
    }
  };

  const events = ['click', 'keydown', 'touchstart', 'pointerdown', 'mousedown'];
  events.forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true, once: false });
  });
}

export function playAlertTone(overrideTone?: string, overrideVolume?: number, forcePlay: boolean = false) {
  if (typeof window === 'undefined') return;

  const soundEnabled = forcePlay || isSoundEnabled();
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const selectedTone = overrideTone || localStorage.getItem('chats_sound_tone') || 'siren';
    const volumeVal = overrideVolume !== undefined 
      ? overrideVolume 
      : parseFloat(localStorage.getItem('chats_sound_volume') || '1.0');

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volumeVal, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (selectedTone === 'siren') {
      // Tone 1: Digital Siren Alarm (880Hz -> 1760Hz pulses)
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.22;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
        osc.frequency.linearRampToValueAtTime(1760, ctx.currentTime + offset + 0.1);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + offset + 0.2);

        g.gain.setValueAtTime(0.9, ctx.currentTime + offset);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + 0.2);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.22);
      }
    } else if (selectedTone === 'dual_chime') {
      // Tone 2: Dual Chime (523.25Hz -> 659.25Hz -> 880Hz)
      const notes = [523.25, 659.25, 880.00];
      notes.forEach((freq, idx) => {
        const offset = idx * 0.15;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
        g.gain.setValueAtTime(1.0, ctx.currentTime + offset);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.35);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.35);
      });
    } else if (selectedTone === 'radar_pulse') {
      // Tone 3: Radar Pulse (4 rapid 1400Hz beeps)
      for (let i = 0; i < 4; i++) {
        const offset = i * 0.12;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, ctx.currentTime + offset);
        g.gain.setValueAtTime(1.0, ctx.currentTime + offset);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.08);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.08);
      }
    } else if (selectedTone === 'emergency_horn') {
      // Tone 4: Emergency Horn (Deep Sawtooth 440Hz + 880Hz)
      [440, 880].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(freq * 1.15, ctx.currentTime + 0.4);

        g.gain.setValueAtTime(1.0, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      });
    }
  } catch (e) {
    console.warn('Audio synthesis error:', e);
  }
}
