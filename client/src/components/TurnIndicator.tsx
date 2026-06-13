import type { GameView } from '@dual-hangman/shared';

type Tone = 'you' | 'wait' | 'warn' | 'win' | 'lose';

const TONE: Record<Tone, { box: string; dot: string; pulse: boolean }> = {
  you: { box: 'bg-emerald-600 text-white', dot: 'bg-white', pulse: true },
  wait: {
    box: 'bg-slate-800 text-slate-300 ring-1 ring-slate-700',
    dot: 'bg-slate-400',
    pulse: true,
  },
  warn: { box: 'bg-amber-600 text-white', dot: 'bg-white', pulse: true },
  win: { box: 'bg-emerald-600 text-white', dot: 'bg-white', pulse: false },
  lose: { box: 'bg-red-700 text-white', dot: 'bg-white', pulse: false },
};

/**
 * Prominent, always-visible "whose turn is it" banner. Sticks to the top on
 * mobile so it stays in view while scrolling the boards/keyboard. Turn
 * ownership is conveyed by a high-contrast color block + bold label + a live
 * dot — never by the keyboard's disabled state alone. Presentation only; it
 * reads `view` and changes no game state.
 */
export default function TurnIndicator({
  view,
  opponentAway,
  graceSeconds,
}: {
  view: GameView;
  opponentAway: boolean;
  graceSeconds: number;
}) {
  const opponentName = view.opponent?.name ?? 'Opponent';
  const over = view.phase === 'game_over';
  const yourTurn = view.phase === 'playing' && view.activePlayerId === view.you.id;
  const youWon = over && view.winnerId === view.you.id;
  const byForfeit = view.gameOverReason === 'opponent_forfeit';

  let tone: Tone;
  let label: string;
  let sub: string;

  if (over) {
    tone = youWon ? 'win' : 'lose';
    label = youWon ? 'You win!' : 'You lost';
    sub = byForfeit
      ? youWon
        ? `${opponentName} left the game`
        : 'You left the game'
      : youWon
        ? `You revealed ${opponentName}'s word`
        : `${opponentName} revealed your word`;
  } else if (opponentAway) {
    tone = 'warn';
    label = `${opponentName} disconnected`;
    sub = `${graceSeconds}s to reconnect…`;
  } else if (yourTurn) {
    tone = 'you';
    label = 'Your turn';
    sub = 'Tap a letter to guess';
  } else {
    tone = 'wait';
    label = `${opponentName}'s turn`;
    sub = `Waiting for ${opponentName}…`;
  }

  const styles = TONE[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-10 w-full rounded-xl px-4 py-3 text-center shadow-lg ${styles.box}`}
    >
      <p className="flex items-center justify-center gap-2.5 text-2xl font-extrabold tracking-wide sm:text-3xl">
        <span className="relative flex h-3 w-3" aria-hidden="true">
          {styles.pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${styles.dot}`}
            />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${styles.dot}`} />
        </span>
        {label}
      </p>
      <p className="mt-0.5 text-sm opacity-80">{sub}</p>
    </div>
  );
}
