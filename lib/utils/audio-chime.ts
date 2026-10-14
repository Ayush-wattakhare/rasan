/**
 * Kitchen Order Audio Chime Synthesizer
 * Uses native Web Audio API to create a warm, audible kitchen order notification chime.
 * Zero external audio assets required; immune to CORS and asset missing errors.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass();
    }
  }

  // Resume suspended context if browser autoplay policy paused it
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
}

const CHIME_MUTED_STORAGE_KEY = 'rasan_kitchen_chime_muted';

export function isKitchenChimeMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CHIME_MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setKitchenChimeMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHIME_MUTED_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {}
}

/**
 * Plays a bright two-tone brass chime (D5: 587.33Hz -> A5: 880Hz -> D6: 1174.66Hz)
 * designed specifically to cut through noisy kitchen background sounds.
 */
export function playKitchenOrderChime(): boolean {
  if (isKitchenChimeMuted()) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;

    // Tone 1: Fundamental Bell (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // Arpeggio to A5

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.65);

    // Tone 2: Harmonious Ring (D6 harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6

    gain2.gain.setValueAtTime(0.001, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);

    return true;
  } catch (err) {
    console.warn('Kitchen chime playback note:', err);
    return false;
  }
}
