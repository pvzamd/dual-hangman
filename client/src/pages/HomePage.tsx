import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">Dual Hangman</h1>
        <p className="mt-3 text-slate-400">
          Two players. Two secret words. First to solve the other&apos;s word wins.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/create"
          className="rounded-lg bg-emerald-600 px-8 py-3 text-center font-semibold transition hover:bg-emerald-500"
        >
          Create Room
        </Link>
        <Link
          to="/join"
          className="rounded-lg bg-slate-700 px-8 py-3 text-center font-semibold transition hover:bg-slate-600"
        >
          Join Room
        </Link>
      </div>
    </main>
  );
}
