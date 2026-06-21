import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import WordSetupForm from '../components/WordSetupForm';

/**
 * Pre-game screen: waiting for an opponent, then secret-word setup. Shares the
 * useGame hook with GamePage; once the synced state reaches `playing`, it
 * navigates to the dedicated game screen.
 */
export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { view, opponentAway, graceSeconds, error, ejected, leave } = useGame(roomCode);

  useEffect(() => {
    if (ejected) navigate('/', { replace: true });
  }, [ejected, navigate]);

  useEffect(() => {
    if (view && (view.phase === 'playing' || view.phase === 'game_over')) {
      navigate(`/game/${roomCode}`, { replace: true });
    }
  }, [view, roomCode, navigate]);

  function handleLeave() {
    leave();
    navigate('/');
  }

  const status = !view
    ? 'Connecting…'
    : opponentAway
      ? `Opponent disconnected — they have ${graceSeconds}s to return…`
      : view.phase === 'waiting_for_opponent'
        ? 'Waiting for an opponent to join…'
        : view.phase === 'word_setup'
          ? view.yourWordReady
            ? view.opponentWordReady
              ? 'Both words locked in — starting…'
              : 'Word locked in. Waiting for your opponent…'
            : 'Choose the word your opponent must guess.'
          : 'Starting game…';

  const showWordForm = view?.phase === 'word_setup' && !view.yourWordReady && !opponentAway;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-slate-800 p-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold">Lobby</h1>
        {(!view || view.phase === 'waiting_for_opponent') && (
          <p className="text-sm text-slate-400">Share this code with your opponent:</p>
        )}
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-emerald-400">
          {roomCode ?? '—'}
        </p>
        {roomCode && (!view || view.phase === 'waiting_for_opponent') && (
          <CopyCodeButton code={roomCode} />
        )}

        <div className="space-y-2 text-left">
          <PlayerRow
            label="You"
            name={view?.you.name}
            connected={view?.you.connected ?? true}
            wordReady={view?.phase === 'word_setup' ? view.yourWordReady : undefined}
          />
          <PlayerRow
            label="Opponent"
            name={view?.opponent?.name}
            connected={(view?.opponent?.connected ?? false) && !opponentAway}
            wordReady={view?.phase === 'word_setup' ? view.opponentWordReady : undefined}
          />
        </div>

        <p className={view ? 'text-slate-300' : 'animate-pulse text-slate-400'}>{status}</p>
        {showWordForm && <WordSetupForm />}
        {error && (
          <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleLeave}
        className="text-sm text-slate-400 transition hover:text-red-300"
      >
        Leave room
      </button>
    </main>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API needs a secure context (https/localhost); over plain LAN
      // http it may be unavailable — fail silently, the code is shown above.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mx-auto block rounded-lg bg-slate-700 px-4 py-1.5 text-sm font-medium transition hover:bg-slate-600"
    >
      {copied ? '✓ Copied!' : 'Copy code'}
    </button>
  );
}

function PlayerRow({
  label,
  name,
  connected,
  wordReady,
}: {
  label: string;
  name: string | undefined;
  connected: boolean;
  /** Shown only during word_setup; undefined hides the badge. */
  wordReady?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="flex items-center gap-2 font-medium">
        {wordReady !== undefined && name && (
          <span className={`text-xs ${wordReady ? 'text-emerald-400' : 'text-slate-500'}`}>
            {wordReady ? '✓ word set' : 'choosing…'}
          </span>
        )}
        {name ?? <span className="text-slate-500">—</span>}
        {name && (
          <span
            className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`}
            title={connected ? 'connected' : 'disconnected'}
          />
        )}
      </span>
    </div>
  );
}
