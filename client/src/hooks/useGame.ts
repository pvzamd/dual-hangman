import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ErrorPayload,
  GameView,
  GameWonPayload,
  GuessResultPayload,
  OpponentJoinedPayload,
  StateSyncPayload,
  TurnChangedPayload,
} from '@dual-hangman/shared';
import { socket } from '../socket';
import { clearIdentity, loadIdentity } from '../lib/identity';

export interface UseGameResult {
  view: GameView | null;
  opponentAway: boolean;
  graceSeconds: number;
  error: string | null;
  /** Stored identity is missing/mismatched, or the server rejected reconnection — leave the room. */
  ejected: boolean;
  /** Rematch state at game over. */
  youRequestedRematch: boolean;
  opponentWantsRematch: boolean;
  rematchUnavailable: boolean;
  guess: (letter: string) => void;
  requestRematch: () => void;
  leave: () => void;
}

/**
 * Owns the socket subscription and the latest GameView for one room. Used by
 * both LobbyPage and GamePage; whichever is mounted drives the same singleton
 * socket. Sync model (ADR-010): emit reconnect_player on mount and on every
 * `connect`, then render from the server's state. guess_result / game_won
 * carry a full GameView, so client state is always a pure server projection —
 * no rule logic lives here.
 */
export function useGame(roomCode: string | undefined): UseGameResult {
  // Loaded once per room; the "no/wrong identity" ejection is derived during
  // render (not via setState in the effect) so we don't trigger cascading renders.
  const identity = useMemo(() => loadIdentity(), [roomCode]);
  const hasValidIdentity = Boolean(roomCode && identity && identity.roomCode === roomCode);

  const [view, setView] = useState<GameView | null>(null);
  const [opponentAway, setOpponentAway] = useState(false);
  const [graceSeconds, setGraceSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rejectedByServer, setRejectedByServer] = useState(false);
  const [youRequestedRematch, setYouRequestedRematch] = useState(false);
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false);
  const [rematchUnavailable, setRematchUnavailable] = useState(false);

  useEffect(() => {
    if (!hasValidIdentity || !identity) return;

    const clearRematch = () => {
      setYouRequestedRematch(false);
      setOpponentWantsRematch(false);
      setRematchUnavailable(false);
    };
    const requestSync = () => {
      socket.emit('reconnect_player', {
        roomCode: identity.roomCode,
        playerId: identity.playerId,
        reconnectToken: identity.reconnectToken,
      });
    };
    const syncFromState = ({ state }: StateSyncPayload) => {
      setView(state);
      setOpponentAway(false);
      // Leaving game_over (new round, or reverted to lobby) clears rematch UI.
      if (state.phase !== 'game_over') clearRematch();
    };
    const onOpponentJoined = ({ opponent }: OpponentJoinedPayload) => {
      setView((v) => (v ? { ...v, opponent } : v));
      setOpponentAway(false);
    };
    const onWordSetupStarted = () => setView((v) => (v ? { ...v, phase: 'word_setup' } : v));
    const onOpponentWordReady = () => setView((v) => (v ? { ...v, opponentWordReady: true } : v));
    const onGuessResult = ({ state }: GuessResultPayload) => setView(state);
    const onTurnChanged = ({ activePlayerId }: TurnChangedPayload) =>
      setView((v) => (v ? { ...v, activePlayerId } : v));
    const onGameWon = ({ state }: GameWonPayload) => {
      setView(state);
      clearRematch(); // fresh game-over → clean rematch slate
    };
    const onRematchRequested = () => setOpponentWantsRematch(true);
    const onRematchUnavailable = () => setRematchUnavailable(true);
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
        setRejectedByServer(true);
        return;
      }
      setError(message);
    };

    socket.on('state_sync', syncFromState);
    socket.on('opponent_joined', onOpponentJoined);
    socket.on('word_setup_started', onWordSetupStarted);
    socket.on('opponent_word_ready', onOpponentWordReady);
    socket.on('game_started', syncFromState);
    socket.on('guess_result', onGuessResult);
    socket.on('turn_changed', onTurnChanged);
    socket.on('game_won', onGameWon);
    socket.on('rematch_requested', onRematchRequested);
    socket.on('rematch_started', syncFromState);
    socket.on('rematch_unavailable', onRematchUnavailable);
    socket.on('opponent_disconnected', onOpponentDisconnected);
    socket.on('opponent_reconnected', onOpponentReconnected);
    socket.on('error_occurred', onError);
    socket.on('connect', requestSync);
    socket.connect();
    if (socket.connected) requestSync();

    return () => {
      socket.off('state_sync', syncFromState);
      socket.off('opponent_joined', onOpponentJoined);
      socket.off('word_setup_started', onWordSetupStarted);
      socket.off('opponent_word_ready', onOpponentWordReady);
      socket.off('game_started', syncFromState);
      socket.off('guess_result', onGuessResult);
      socket.off('turn_changed', onTurnChanged);
      socket.off('game_won', onGameWon);
      socket.off('rematch_requested', onRematchRequested);
      socket.off('rematch_started', syncFromState);
      socket.off('rematch_unavailable', onRematchUnavailable);
      socket.off('opponent_disconnected', onOpponentDisconnected);
      socket.off('opponent_reconnected', onOpponentReconnected);
      socket.off('error_occurred', onError);
      socket.off('connect', requestSync);
    };
  }, [hasValidIdentity, identity]);

  const guess = useCallback((letter: string) => {
    setError(null);
    socket.emit('guess_letter', { letter });
  }, []);

  const requestRematch = useCallback(() => {
    setRematchUnavailable(false);
    setYouRequestedRematch(true);
    socket.emit('request_rematch');
  }, []);

  const leave = useCallback(() => {
    socket.emit('leave_room');
    clearIdentity();
  }, []);

  const ejected = !hasValidIdentity || rejectedByServer;
  return {
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
  };
}
