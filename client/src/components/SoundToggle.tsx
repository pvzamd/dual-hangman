import { useState } from 'react';
import { isSoundMuted, playSound, setSoundMuted, unlockAudio } from '../lib/sound';

/**
 * Fixed mute/unmute control, shown on every screen. Enabling sound also
 * unlocks the audio context (a user gesture) and plays a brief confirmation.
 */
export default function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted());

  function toggle() {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
    if (!next) {
      unlockAudio();
      playSound('your-turn'); // short confirmation that sound is on
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      aria-pressed={!muted}
      title={muted ? 'Sound off' : 'Sound on'}
      className="fixed top-3 right-3 z-50 rounded-full bg-slate-800/80 px-3 py-2 text-lg shadow-md backdrop-blur transition hover:bg-slate-700"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
