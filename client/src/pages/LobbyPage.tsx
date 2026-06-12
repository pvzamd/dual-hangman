import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  ErrorPayload,
  GameView,
  OpponentJoinedPayload,
  StateSyncPayload,
} from '@dual-hangman/shared';
import { socket } from '../socket';
import { clearIdentity, loadIdentity } from '../lib/identity';

/**
 * Lobby sync model (ADR-010): on mount we always emit reconnect_player with
 * the stored identity and render from the server's state_sync reply. The same
 * path covers fresh navigation, page refresh, and socket auto-reconnects —
 * the socket's 'connect' event re-triggers the sync.
 */
export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView | null>(null);
  const [opponentAway, setOpponentAway] = useState(false);
  const [graceSeconds, setGraceSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const identity = loadIdentity();
    if (!roomCode || !identity || identity.roomCode !== roomCode) {
      navigate('/', { replace: true });
      return;
    }

    const requestSync = () => {
      socket.emit('reconnect_player', {
        roomCode: identity.roomCode,
        playerId: identity.playerId,
        reconnectToken: identity.reconnectToken,
      });
    };
    const onStateSync = ({ state }: StateSyncPayload) => {
      setView(state);
      setOpponentAway(false);
    };
    const onOpponentJoined = ({ opponent }: OpponentJoinedPayload) => {
      setView((v) => (v ? { ...v, opponent } : v));
      setOpponentAway(false);
    };
    const onWordSetupStarted = () => {
      setView((v) => (v ? { ...v, phase: 'word_setup' } : v));
    };
    const onOpponentDisconnected = ({ graceSeconds: grace }: { graceSeconds: number }) => {
      setOpponentAway(true);
      setGraceSeconds(grace);
    };
    const onOpponentReconnected = () => {
      setOpponentAway(false);
      setView((v) => (v?.opponent ? { ...v, opponent: { ...v.opponent, connected: true } } : v));
    };
    const onError = ({ code, message }: ErrorPayload) => {
      if (code === 'RECONNECT_REJECTED') {
        clearIdentity();
        navigate('/', { replace: true });
        return;
      }
      setError(message);
    };

    socket.on('state_sync', onStateSync);
    socket.on('opponent_joined', onOpponentJoined);
    socket.on('word_setup_started', onWordSetupStarted);
    socket.on('opponent_disconnected', onOpponentDisconnected);
    socket.on('opponent_reconnected', onOpponentReconnected);
    socket.on('error_occurred', onError);
    socket.on('connect', requestSync);
    socket.connect();
    if (socket.connected) requestSync();

    return () => {
      socket.off('state_sync', onStateSync);
      socket.off('opponent_joined', onOpponentJoined);
      socket.off('word_setup_started', onWordSetupStarted);
      socket.off('opponent_disconnected', onOpponentDisconnected);
      socket.off('opponent_reconnected', onOpponentReconnected);
      socket.off('error_occurred', onError);
      socket.off('connect', requestSync);
    };
  }, [roomCode, navigate]);

  function handleLeave() {
    socket.emit('leave_room');
    clearIdentity();
    navigate('/');
  }

  const status = !view
    ? 'Connecting…'
    : opponentAway
      ? `Opponent disconnected — they have ${graceSeconds}s to return…`
      : view.phase === 'waiting_for_opponent'
        ? 'Waiting for an opponent to join…'
        : view.phase === 'word_setup'
          ? 'Opponent is here! Word setup arrives in Phase 3.'
          : `Phase: ${view.phase}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-slate-800 p-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <p className="text-sm text-slate-400">Share this code with your opponent:</p>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-emerald-400">
          {roomCode ?? '—'}
        </p>

        <div className="space-y-2 text-left">
          <PlayerRow label="You" name={view?.you.name} connected={view?.you.connected ?? true} />
          <PlayerRow
            label="Opponent"
            name={view?.opponent?.name}
            connected={(view?.opponent?.connected ?? false) && !opponentAway}
          />
        </div>

        <p className={view ? 'text-slate-300' : 'animate-pulse text-slate-400'}>{status}</p>
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

function PlayerRow({
  label,
  name,
  connected,
}: {
  label: string;
  name: string | undefined;
  connected: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="flex items-center gap-2 font-medium">
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
