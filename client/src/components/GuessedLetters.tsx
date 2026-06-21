import type { BoardView } from '@dual-hangman/shared';

/**
 * Lists the letters guessed against one board, colored by outcome.
 * A guessed letter is "correct" if it shows up in the revealed masked word.
 */
export default function GuessedLetters({ board }: { board: BoardView }) {
  if (board.guessedLetters.length === 0) {
    return <p className="text-xs text-slate-500">No guesses yet</p>;
  }
  const revealed = new Set(board.maskedWord.filter((l): l is string => l !== null));

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {board.guessedLetters.map((letter) => {
        const correct = revealed.has(letter);
        return (
          <span
            key={letter}
            className={`rounded px-1.5 py-0.5 font-mono text-sm ${
              correct
                ? 'bg-emerald-900/50 text-emerald-300'
                : 'bg-red-900/40 text-red-300 line-through'
            }`}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
