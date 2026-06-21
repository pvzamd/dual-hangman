import { useEffect } from 'react';
import type { BoardView } from '@dual-hangman/shared';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

/**
 * On-screen A–Z keyboard for guessing the opponent's word (`board`).
 * Already-guessed letters are disabled and tinted by outcome; the whole
 * keyboard is disabled when it is not the player's turn. Physical typing is
 * wired in too, ignoring keys that are disabled.
 */
export default function Keyboard({
  board,
  disabled,
  onGuess,
}: {
  board: BoardView;
  disabled: boolean;
  onGuess: (letter: string) => void;
}) {
  const guessed = new Set(board.guessedLetters);
  const revealed = new Set(board.maskedWord.filter((l): l is string => l !== null));

  useEffect(() => {
    if (disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toUpperCase();
      if (/^[A-Z]$/.test(key) && !board.guessedLetters.includes(key)) {
        onGuess(key);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [board, disabled, onGuess]);

  return (
    <div className="space-y-1.5">
      {ROWS.map((row) => (
        <div key={row} className="flex justify-center gap-1">
          {row.split('').map((letter) => {
            const used = guessed.has(letter);
            const tint = used
              ? revealed.has(letter)
                ? 'bg-emerald-700 text-emerald-100'
                : 'bg-red-900/70 text-red-200'
              : 'bg-slate-700 hover:bg-slate-600';
            return (
              <button
                key={letter}
                type="button"
                disabled={disabled || used}
                onClick={() => onGuess(letter)}
                className={`h-10 w-7 rounded font-mono text-sm font-semibold transition disabled:cursor-not-allowed sm:w-9 ${tint} ${
                  disabled && !used ? 'opacity-40' : ''
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
