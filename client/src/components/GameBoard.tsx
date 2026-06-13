import { Link } from 'react-router-dom';
import type { GameView } from '@dual-hangman/shared';
import WordDisplay from './WordDisplay';
import GuessedLetters from './GuessedLetters';
import Keyboard from './Keyboard';

interface Props {
  view: GameView;
  opponentAway: boolean;
  graceSeconds: number;
  error: string | null;
  onGuess: (letter: string) => void;
  onLeave: () => void;
}

/**
 * The in-game screen: both boards live, a turn indicator, the keyboard (your
 * turn only), and the game-over result. All gameplay state comes from the
 * server via `view` — this component renders, it does not decide rules.
 */
export default function GameBoard({
  view,
  opponentAway,
  graceSeconds,
  error,
  onGuess,
  onLeave,
}: Props) {
  const { you, opponent, yourBoard, opponentBoard, activePlayerId, phase } = view;
  if (!yourBoard || !opponentBoard) return null;

  const opponentName = opponent?.name ?? 'Opponent';
  const over = phase === 'game_over';
  const yourTurn = phase === 'playing' && activePlayerId === you.id;
  const youWon = over && view.winnerId === you.id;

  const byForfeit = view.gameOverReason === 'opponent_forfeit';
  const banner = over
    ? youWon
      ? byForfeit
        ? `You win — ${opponentName} left the game.`
        : 'You win! 🎉 You revealed their word first.'
      : byForfeit
        ? 'Game over — you left the game.'
        : `${opponentName} revealed your word first.`
    : opponentAway
      ? `${opponentName} disconnected — ${graceSeconds}s to reconnect…`
      : yourTurn
        ? 'Your turn — guess a letter.'
        : `${opponentName}'s turn…`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 p-4">
      <header className="w-full text-center">
        <p className="text-xs tracking-widest text-slate-500">ROOM {view.roomCode}</p>
        <p
          className={`mt-1 text-lg font-semibold ${
            over
              ? youWon
                ? 'text-emerald-400'
                : 'text-red-300'
              : yourTurn
                ? 'text-emerald-400'
                : 'text-slate-300'
          }`}
        >
          {banner}
        </p>
      </header>

      <section className="w-full space-y-3 rounded-xl bg-slate-800 p-5 shadow-lg">
        <h2 className="text-center text-sm text-slate-400">
          You are guessing{' '}
          <span className="font-semibold text-slate-200">{opponentName}&apos;s</span> word
        </h2>
        <WordDisplay masked={yourBoard.maskedWord} />
        <p className="text-center text-xs text-slate-500">
          Wrong guesses: {yourBoard.wrongGuesses}
        </p>
        <GuessedLetters board={yourBoard} />
        {over && !youWon && view.opponentWordRevealed && (
          <p className="text-center text-sm text-slate-300">
            The word was{' '}
            <span className="font-mono font-bold tracking-widest text-amber-300">
              {view.opponentWordRevealed}
            </span>
          </p>
        )}
      </section>

      <section className="w-full space-y-3 rounded-xl bg-slate-800/60 p-5">
        <h2 className="text-center text-sm text-slate-400">
          <span className="font-semibold text-slate-200">{opponentName}</span> is guessing your word
        </h2>
        <WordDisplay masked={opponentBoard.maskedWord} />
        <p className="text-center text-xs text-slate-500">
          Wrong guesses: {opponentBoard.wrongGuesses}
        </p>
        <GuessedLetters board={opponentBoard} />
      </section>

      {!over && (
        <Keyboard board={yourBoard} disabled={!yourTurn || opponentAway} onGuess={onGuess} />
      )}

      {error && <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      {over ? (
        <Link
          to="/"
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold transition hover:bg-emerald-500"
        >
          Back to home
        </Link>
      ) : (
        <button
          type="button"
          onClick={onLeave}
          className="text-sm text-slate-400 transition hover:text-red-300"
        >
          Leave game
        </button>
      )}
    </main>
  );
}
