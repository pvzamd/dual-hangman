import { Link, useParams } from 'react-router-dom';

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>();

  // TODO Phase 2: subscribe to opponent_joined / word_setup_started and
  // advance to the word-setup screen when the opponent arrives.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-slate-800 p-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <p className="text-sm text-slate-400">Share this code with your opponent:</p>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-emerald-400">
          {roomCode ?? '—'}
        </p>
        <p className="animate-pulse text-slate-400">Waiting for opponent…</p>
      </div>
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
        Leave room
      </Link>
    </main>
  );
}
