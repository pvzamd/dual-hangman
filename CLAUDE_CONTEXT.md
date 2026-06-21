# Claude Context — Dual Hangman

> Volatile session snapshot: current phase, detailed task list, repo map, gotchas.
> Entry point for the project is `START_HERE.md` — read that first; this file is step 3 of its workflow.
> Update this file at the end of every session.
> Last updated: 2026-06-14 (end of Session 17 — v1.0.0 released)

---

## What This Project Is

A real-time two-player browser word-guessing game: each player sets a secret word, then players take turns guessing letters of each other's word — a correct guess lets you keep guessing, a wrong one passes the turn. **The only way to win is to fully reveal the opponent's word first**; wrong guesses are tracked for stats but carry no penalty (ADR-009). The hangman figure is a cosmetic loss visual. Production-quality hobby project by Parvez Ahmed.

**GitHub:** https://github.com/pvzamd/dual-hangman

---

## Current Phase

**Released v1.0.0 — core game feature-complete (Phases 0–7)**

Tagged `v1.0.0` on `develop/v1` (all four packages at 1.0.0; see `CHANGELOG.md`). `main` untouched. Phase 7 (the last) added:

Phase 7 added an in-memory **session score** (ADR-014): each `ServerPlayer` has a `score`; `RoomManager.recordRoundResult(room)` awards the winner +1 — called from `forfeit` and from the guess handler on a solve, so both `word_solved` and `opponent_forfeit` count. `GameView` exposes `yourScore`/`opponentScore`; the client shows a score line during play and on the game-over screen. Score **persists across rematches** (`resetForRematch` leaves it) and **resets when the room ends** (destroy, or a survivor reverting to waiting for a new opponent). No best-of-N, no persistence, no accounts (out of scope). 64 Vitest tests (score lifecycle covered) + live score smoke test. Earlier phases intact (lobby, gameplay, rematch, chat, idle sweep, sound).

**No phase in progress.** Remaining ideas are in `docs/ROADMAP.md` → Nice-to-Have / Future.

---

## Active Architecture

| Layer        | Tech                                                           |
| ------------ | -------------------------------------------------------------- |
| Frontend     | React 19 + TypeScript + Vite + Tailwind CSS 4 + react-router 7 |
| Backend      | Node ≥ 22.12 + Express 5 + Socket.IO 4 + TypeScript            |
| Shared types | `@dual-hangman/shared` — source-only pkg, the socket contract  |
| Dev          | `npm run dev` at root → `tsx watch` (server) + Vite (client)   |
| Build        | Vite (client) / tsup single-file ESM bundle (server)           |
| State        | In-memory on server, no DB (ADR-002)                           |

Full details in `docs/ARCHITECTURE.md`. Key invariant: **the server is authoritative; the opponent's unsolved word never reaches a client.**

---

## Repo Map (the parts that matter)

```
shared/src/events.ts        ← typed socket contract (compile-time truth)
shared/src/types.ts         ← GameView / BoardView / PlayerInfo / ErrorCode
shared/src/constants.ts     ← word/name limits, room code charset, grace period
shared/src/words.ts         ← normalizeSecretWord (client + server validation)
shared/src/chat.ts          ← normalizeChatText (trim/cap; client + server)
client/src/socket.ts        ← typed client singleton (autoConnect: false)
client/src/lib/identity.ts  ← localStorage identity (save/load/clear)
client/src/lib/sound.ts     ← Web Audio sound effects + mute setting (ADR-013)
client/src/hooks/useGame.ts ← socket subscription + GameView + rematch + chat; fires sound cues
client/src/pages/           ← Home, Create, Join, Lobby, Game — all wired
client/src/components/       ← WordSetupForm, GameBoard, TurnIndicator, WordDisplay, GuessedLetters, Keyboard, HangmanFigure, GameChat, SoundToggle
server/src/index.ts         ← Express + Socket.IO bootstrap, /health, idle-room sweep interval
server/src/socket/types.ts  ← GameServer/GameSocket generics + SocketData
server/src/socket/registerSocketHandlers.ts  ← all events live (lobby, word, guess, forfeit, rematch, chat)
server/src/rooms/RoomManager.ts              ← rooms, join/leave/forfeit/rematch, reconnect, grace timers, sweepIdleRooms, recordRoundResult (score)
server/src/rooms/roomView.ts                 ← Room → GameView projection (delegates to game)
server/src/game/GameManager.ts               ← round state + guessLetter + forfeit (rules, win detection)
```

---

## Commands

```bash
npm run dev          # client :5173 + server :3001 concurrently
npm run build        # vite build + tsup
npm run lint         # eslint, all workspaces
npm run typecheck    # tsc, all workspaces
npm run format       # prettier
```

---

## Outstanding Tasks

**None planned — Phases 0–7 are complete and the core game is feature-complete.** Optional future ideas live in `docs/ROADMAP.md` → Nice-to-Have / Future (e.g. dictionary validation, spectator mode, simultaneous "race mode", PWA). Explicitly out of scope for now: best-of-N, persistence/DB, accounts, leaderboards, match history (ADR-002).

---

## Known Issues / Gotchas

- Dev machine uses nvm-windows; project needs Node ≥ 22.12 (`nvm use 24`). Other projects on this machine may pin older Node versions.
- Claude Code harness quirks (npm.cmd etc.) live in `CLAUDE.md`.
- Tests: server only so far (`npm run test` → 64 Vitest tests). No client tests yet.
- Session score lives on `ServerPlayer.score` (ADR-014); persists across rematch, but resets when a survivor reverts to waiting for a new opponent — so a fresh pairing starts 0–0.
- In-game forfeit is wired through `handleExit` in the socket handler: `leave_room` and grace-timer expiry both forfeit during `playing` (opponent wins), and keep the revert/destroy behavior otherwise. Grace window is env-overridable (`RECONNECT_GRACE_SECONDS`, default 60).
- Rematch reuses `word_setup` (no new phase). Post-forfeit ghost rooms are now reclaimed by the idle sweep (60s interval, `ROOM_IDLE_TIMEOUT_MINUTES`).
- Chat is ephemeral (no persistence) and broadcast to the room; the client `GameChat` only appears on the GamePage (playing/game_over), though the server accepts chat in any in-room phase.
- **LAN playtesting works out of the box** (see `docs/LOCAL_PLAYTESTING.md`): Vite binds all interfaces (`host: true`), the client derives the socket URL from `window.location.hostname:3001`, and the server reflects the request origin for CORS when `CLIENT_ORIGIN` is unset. Set `CLIENT_ORIGIN` to lock CORS in production.

---

## Key Conventions

- TypeScript only; no plain JS in `src/` directories.
- Socket events: snake_case, defined ONLY in `shared/src/events.ts`; both sides get them via Socket.IO generics. Update `docs/ARCHITECTURE.md` tables when the contract changes.
- Game rule changes go to `docs/GAME_RULES.md` first (source of truth). Turn model: correct guess → guess again; wrong guess → turn passes; win by full reveal only (ADR-004 + ADR-009).
- Significant choices get an ADR in `docs/DECISIONS.md` (next: ADR-015).
- Follow the mandatory documentation maintenance rules in `START_HERE.md` §8 — tick `docs/PROGRESS.md`, append to `docs/SESSION_NOTES.md`, and refresh this file before ending a session.
- Never commit `.env`; keep `.env.example` files current.
