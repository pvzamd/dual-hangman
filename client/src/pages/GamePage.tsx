import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import GameBoard from '../components/GameBoard';

/**
 * Hosts the in-game screen. Shares the useGame hook with LobbyPage; if the
 * synced state is still a pre-game phase (e.g. landing here via a stale URL),
 * it bounces back to the lobby so the two pages never show the wrong screen.
 */
export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const {
    view,
    opponentAway,
    graceSeconds,
    error,
    ejected,
    youRequestedRematch,
    opponentWantsRematch,
    rematchUnavailable,
    guess,
    requestRematch,
    leave,
  } = useGame(roomCode);

  useEffect(() => {
    if (ejected) navigate('/', { replace: true });
  }, [ejected, navigate]);

  useEffect(() => {
    if (view && (view.phase === 'waiting_for_opponent' || view.phase === 'word_setup')) {
      navigate(`/lobby/${roomCode}`, { replace: true });
    }
  }, [view, roomCode, navigate]);

  function handleLeave() {
    leave();
    navigate('/');
  }

  if (!view || (view.phase !== 'playing' && view.phase !== 'game_over')) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="animate-pulse text-slate-400">Loading game…</p>
      </main>
    );
  }

  return (
    <GameBoard
      view={view}
      opponentAway={opponentAway}
      graceSeconds={graceSeconds}
      error={error}
      youRequestedRematch={youRequestedRematch}
      opponentWantsRematch={opponentWantsRematch}
      rematchUnavailable={rematchUnavailable}
      onGuess={guess}
      onRematch={requestRematch}
      onLeave={handleLeave}
    />
  );
}
