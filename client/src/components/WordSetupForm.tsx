import { useState, type FormEvent } from 'react';
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, normalizeSecretWord } from '@dual-hangman/shared';
import { socket } from '../socket';

/**
 * Secret word entry during word_setup. Validates locally with the shared
 * normalizeSecretWord (instant feedback); the server re-validates
 * authoritatively and replies with state_sync (yourWordReady: true).
 */
export default function WordSetupForm() {
  const [word, setWord] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeSecretWord(word);
    if (!normalized) {
      setError(`Use ${MIN_WORD_LENGTH}–${MAX_WORD_LENGTH} letters, A–Z only.`);
      return;
    }
    setError(null);
    socket.emit('submit_secret_word', { word: normalized });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-300">
          Your secret word ({MIN_WORD_LENGTH}–{MAX_WORD_LENGTH} letters)
        </span>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.toUpperCase())}
          required
          minLength={MIN_WORD_LENGTH}
          maxLength={MAX_WORD_LENGTH}
          autoComplete="off"
          spellCheck={false}
          placeholder="PUZZLE"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 font-mono tracking-widest uppercase outline-none focus:border-emerald-500"
        />
      </label>
      {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold transition hover:bg-emerald-500"
      >
        Lock In Word
      </button>
      <p className="text-xs text-slate-500">
        Your opponent will try to guess this — don&apos;t make it easy.
      </p>
    </form>
  );
}
