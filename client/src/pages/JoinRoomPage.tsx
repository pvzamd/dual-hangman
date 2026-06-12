import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ROOM_CODE_LENGTH } from '@dual-hangman/shared';

export default function JoinRoomPage() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO Phase 2: socket.connect() + emit join_room, navigate to
    // /lobby/:roomCode on the room_joined event.
    alert('Room joining arrives in Phase 2 (lobby system).');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-slate-800 p-6 shadow-lg"
      >
        <h1 className="text-2xl font-bold">Join a Room</h1>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Your name</span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            minLength={1}
            maxLength={20}
            placeholder="e.g. Asha"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Room code</span>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            required
            minLength={ROOM_CODE_LENGTH}
            maxLength={ROOM_CODE_LENGTH}
            placeholder="ABC12"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 font-mono tracking-widest uppercase outline-none focus:border-emerald-500"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold transition hover:bg-emerald-500"
        >
          Join Room
        </button>
        <Link to="/" className="block text-center text-sm text-slate-400 hover:text-slate-200">
          Back
        </Link>
      </form>
    </main>
  );
}
