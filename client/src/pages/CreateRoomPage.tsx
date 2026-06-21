import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MAX_PLAYER_NAME_LENGTH,
  type ErrorPayload,
  type RoomCreatedPayload,
} from '@dual-hangman/shared';
import { socket } from '../socket';
import { saveIdentity } from '../lib/identity';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef('');

  useEffect(() => {
    const onCreated = (payload: RoomCreatedPayload) => {
      saveIdentity({
        roomCode: payload.roomCode,
        playerId: payload.playerId,
        reconnectToken: payload.reconnectToken,
        playerName: nameRef.current,
      });
      navigate(`/lobby/${payload.roomCode}`);
    };
    const onError = (payload: ErrorPayload) => {
      setPending(false);
      setError(payload.message);
    };
    const onConnectError = () => {
      setPending(false);
      setError('Cannot reach the game server — is it running?');
    };

    socket.on('room_created', onCreated);
    socket.on('error_occurred', onError);
    socket.on('connect_error', onConnectError);
    return () => {
      socket.off('room_created', onCreated);
      socket.off('error_occurred', onError);
      socket.off('connect_error', onConnectError);
    };
  }, [navigate]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    nameRef.current = playerName.trim();
    setError(null);
    setPending(true);
    socket.connect();
    socket.emit('create_room', { playerName: nameRef.current });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-slate-800 p-6 shadow-lg"
      >
        <h1 className="text-2xl font-bold">Create a Room</h1>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Your name</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            minLength={1}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            placeholder="e.g. Parvez"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-300">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create Room'}
        </button>
        <Link to="/" className="block text-center text-sm text-slate-400 hover:text-slate-200">
          Back
        </Link>
      </form>
    </main>
  );
}
