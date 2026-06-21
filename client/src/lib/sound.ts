/**
 * Tiny sound-effects module. Sounds are synthesized with the Web Audio API
 * (short tones, no asset files, no music) so the bundle stays small and the
 * effects are easy to keep subtle. Mobile/desktop browsers block audio until a
 * user gesture, so the context is created/resumed via `unlockAudio()` on the
 * first interaction; until then `playSound` stays silent. The mute setting is
 * persisted in localStorage. Presentation only — no gameplay logic here.
 */

export type SoundName = 'correct' | 'wrong' | 'your-turn' | 'opponent-joined' | 'won' | 'lost';

const STORAGE_KEY = 'dual-hangman:sound';

let muted = readMutedFromStorage();
let ctx: AudioContext | null = null;

function readMutedFromStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'off';
  } catch {
    return false;
  }
}

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'off' : 'on');
  } catch {
    // storage unavailable — keep the in-memory setting
  }
}

function getContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Create/resume the AudioContext from a user gesture (autoplay policy). */
export function unlockAudio(): void {
  const c = getContext();
  if (c && c.state === 'suspended') void c.resume();
}

/** A single short tone with a soft attack/decay so it doesn't click. */
function blip(
  c: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  peak = 0.08,
  type: OscillatorType = 'sine',
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

const RECIPES: Record<SoundName, (c: AudioContext) => void> = {
  correct: (c) => blip(c, 880, 0, 0.12),
  wrong: (c) => blip(c, 196, 0, 0.2, 0.07, 'triangle'),
  'your-turn': (c) => blip(c, 660, 0, 0.12),
  'opponent-joined': (c) => {
    blip(c, 523, 0, 0.1);
    blip(c, 784, 0.1, 0.14);
  },
  won: (c) => {
    blip(c, 659, 0, 0.1);
    blip(c, 880, 0.1, 0.1);
    blip(c, 1175, 0.2, 0.18);
  },
  lost: (c) => {
    blip(c, 440, 0, 0.16);
    blip(c, 277, 0.16, 0.26, 0.07, 'triangle');
  },
};

export function playSound(name: SoundName): void {
  if (muted) return;
  const c = getContext();
  if (!c || c.state !== 'running') return; // not unlocked yet → stay silent
  try {
    RECIPES[name](c);
  } catch {
    // never let an audio glitch affect the game
  }
}
