import type { ChatBroadcastPayload, GameView } from '@dual-hangman/shared';
import WordDisplay from './WordDisplay';
import GuessedLetters from './GuessedLetters';
import Keyboard from './Keyboard';
import HangmanFigure from './HangmanFigure';
import TurnIndicator from './TurnIndicator';
import GameChat from './GameChat';

interface Props {
  view: GameView;
  opponentAway: boolean;
  graceSeconds: number;
  error: string | null;
  youRequestedRematch: boolean;
  opponentWantsRematch: boolean;
  rematchUnavailable: boolean;
  messages: ChatBroadcastPayload[];
  onGuess: (letter: string) => void;
  onRematch: () => void;
  onSendChat: (text: string) => void;
  onLeave: () => void;
}

/**
 * The in-game screen: both boards live, a turn indicator, the keyboard (your
 * turn only), and the game-over result (both words revealed, a defeat figure
 * for the loser, and rematch controls). All gameplay state comes from the
 * server via `view` — this component renders, it does not decide rules.
 */
export default function GameBoard({
  view,
  opponentAway,
  graceSeconds,
  error,
  youRequestedRematch,
  opponentWantsRematch,
  rematchUnavailable,
  messages,
  onGuess,
  onRematch,
  onSendChat,
  onLeave,
}: Props) {
  const { you, opponent, yourBoard, opponentBoard, activePlayerId, phase } = view;
  if (!yourBoard || !opponentBoard) return null;

  const opponentName = opponent?.name ?? 'Opponent';
  const over = phase === 'game_over';
  const yourTurn = phase === 'playing' && activePlayerId === you.id;
  const youWon = over && view.winnerId === you.id;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-4 p-4 lg:max-w-5xl">
      <p className="text-xs tracking-widest text-slate-500">ROOM {view.roomCode}</p>
      <TurnIndicator view={view} opponentAway={opponentAway} graceSeconds={graceSeconds} />

      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
        {/* Game column */}
        <div className="flex flex-1 flex-col items-center gap-4">
          {over && (
            <section
              className="w-full space-y-4 rounded-xl bg-slate-800 p-6 text-center shadow-lg"
              style={{ animation: 'fadeIn 220ms ease-out' }}
            >
              {!youWon && <HangmanFigure className="mx-auto text-slate-300" />}

              <div className="space-y-1">
                <RevealedWord label="Your word" word={view.yourWordRevealed} />
                <RevealedWord label={`${opponentName}'s word`} word={view.opponentWordRevealed} />
              </div>

              <RematchControls
                opponentName={opponentName}
                opponentAway={opponentAway}
                rematchUnavailable={rematchUnavailable}
                youRequestedRematch={youRequestedRematch}
                opponentWantsRematch={opponentWantsRematch}
                onRematch={onRematch}
                onLeave={onLeave}
              />
            </section>
          )}

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
          </section>

          <section className="w-full space-y-3 rounded-xl bg-slate-800/60 p-5">
            <h2 className="text-center text-sm text-slate-400">
              <span className="font-semibold text-slate-200">{opponentName}</span> is guessing your
              word
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

          {error && (
            <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          {!over && (
            <button
              type="button"
              onClick={onLeave}
              className="text-sm text-slate-400 transition hover:text-red-300"
            >
              Leave game
            </button>
          )}
        </div>

        {/* Chat — sidebar on large screens, stacked below on mobile */}
        <GameChat messages={messages} youId={you.id} onSend={onSendChat} />
      </div>
    </main>
  );
}

function RevealedWord({ label, word }: { label: string; word: string | null }) {
  return (
    <p className="text-sm text-slate-300">
      {label}:{' '}
      <span className="font-mono font-bold tracking-widest text-amber-300">{word ?? '—'}</span>
    </p>
  );
}

function RematchControls({
  opponentName,
  opponentAway,
  rematchUnavailable,
  youRequestedRematch,
  opponentWantsRematch,
  onRematch,
  onLeave,
}: {
  opponentName: string;
  opponentAway: boolean;
  rematchUnavailable: boolean;
  youRequestedRematch: boolean;
  opponentWantsRematch: boolean;
  onRematch: () => void;
  onLeave: () => void;
}) {
  if (rematchUnavailable) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-400">{opponentName} left — returning to the lobby…</p>
        <LeaveButton onLeave={onLeave} label="Back to home" />
      </div>
    );
  }

  const canRematch = !opponentAway;

  return (
    <div className="flex flex-col items-center gap-2">
      {opponentWantsRematch && !youRequestedRematch && canRematch && (
        <p className="text-sm text-emerald-300">{opponentName} wants a rematch!</p>
      )}
      {opponentAway && (
        <p className="text-sm text-slate-400">{opponentName} is away — rematch unavailable.</p>
      )}

      {canRematch &&
        (youRequestedRematch ? (
          <p className="animate-pulse text-sm text-slate-300">
            Waiting for {opponentName} to accept…
          </p>
        ) : (
          <button
            type="button"
            onClick={onRematch}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold transition hover:bg-emerald-500"
          >
            {opponentWantsRematch ? 'Accept rematch' : 'Play again'}
          </button>
        ))}

      <LeaveButton onLeave={onLeave} label="Leave" />
    </div>
  );
}

function LeaveButton({ onLeave, label }: { onLeave: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onLeave}
      className="text-sm text-slate-400 transition hover:text-red-300"
    >
      {label}
    </button>
  );
}
