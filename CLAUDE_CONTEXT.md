# Claude Context — Dual Hangman

> Volatile session snapshot: current phase, detailed task list, repo map, gotchas.
> Entry point for the project is `START_HERE.md` — read that first; this file is step 3 of its workflow.
> Update this file at the end of every session.
> Last updated: 2026-06-13 (end of Session 6)

---

## What This Project Is

A real-time two-player browser word-guessing game: each player sets a secret word, then players take turns guessing letters of each other's word — a correct guess lets you keep guessing, a wrong one passes the turn. **The only way to win is to fully reveal the opponent's word first**; wrong guesses are tracked for stats but carry no penalty (ADR-009). The hangman figure is a cosmetic loss visual. Production-quality hobby project by Parvez Ahmed.

**GitHub:** https://github.com/pvzamd/dual-hangman

---

## Current Phase

**Phase 3 — Word Setup (COMPLETE)**

Lobby and word setup work end-to-end: players submit validated secret words (shared `normalizeSecretWord`), ready states live in `GameView` and survive refresh, and when both words are in the room transitions to `playing` — GameManager is constructed (boards over each other's words, random first turn) and each player gets a personalized `game_started`. 24 Vitest tests; all flows smoke-tested over real sockets. `guess_letter` / `chat_message` remain stubs. **Next: Phase 4 — Core Gameplay** (read ADR-009 first; see PROGRESS.md).

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
client/src/socket.ts        ← typed client singleton (autoConnect: false)
client/src/lib/identity.ts  ← localStorage identity (save/load/clear)
client/src/pages/           ← Home, Create, Join, Lobby — all wired to the socket
client/src/components/WordSetupForm.tsx      ← secret word entry (word_setup phase)
server/src/index.ts         ← Express + Socket.IO bootstrap, /health
server/src/socket/types.ts  ← GameServer/GameSocket generics + SocketData
server/src/socket/registerSocketHandlers.ts  ← lobby + word handlers live; guess/chat stubs
server/src/rooms/RoomManager.ts              ← rooms, join/leave, reconnect, grace timers
server/src/rooms/roomView.ts                 ← Room → GameView projection (delegates to game)
server/src/game/GameManager.ts               ← round state: boards, first turn (guessing = Phase 4)
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

## Outstanding Tasks (Phase 4 — Core Gameplay; read ADR-009 first)

- [ ] `GameManager.guessLetter(playerId, letter)`: NOT_YOUR_TURN / ALREADY_GUESSED guards; correct guess reveals + same player continues; wrong guess increments stats + passes turn; win = word fully revealed (`word_solved` only)
- [ ] Emit `guess_result` (with refreshed GameView), `turn_changed` (wrong guesses only), `game_won`
- [ ] Forfeit on leave/grace-expiry during `playing` (TODOs at both call sites in RoomManager/handlers)
- [ ] Reveal loser's unsolved target word at game over (`opponentWordRevealed`)
- [ ] Client: `useGame` hook, word displays, on-screen keyboard (disable guessed letters), turn indicator, wrong-guess stats counter
- [ ] Tests: guess flow, turn streaks, win detection, forfeit

Then Phase 5 (result screen + rematch). Full roadmap in `docs/ROADMAP.md`.

---

## Known Issues / Gotchas

- Dev machine uses nvm-windows; project needs Node ≥ 22.12 (`nvm use 24`). Other projects on this machine may pin older Node versions.
- Claude Code harness quirks (npm.cmd etc.) live in `CLAUDE.md`.
- Tests: server only so far (`npm run test` → 24 Vitest tests). No client tests yet.
- `leaveRoom` + grace-expiry currently revert/destroy the room — both call sites carry a TODO to forfeit instead during `playing` (Phase 4). Mid-game leave currently reverts the room, which is WRONG per the rules — fix in Phase 4.
- LobbyPage shows "Guessing arrives in Phase 4" once the game starts — that status string is the Phase 4 UI starting point (likely becomes a GamePage).

---

## Key Conventions

- TypeScript only; no plain JS in `src/` directories.
- Socket events: snake_case, defined ONLY in `shared/src/events.ts`; both sides get them via Socket.IO generics. Update `docs/ARCHITECTURE.md` tables when the contract changes.
- Game rule changes go to `docs/GAME_RULES.md` first (source of truth). Turn model: correct guess → guess again; wrong guess → turn passes; win by full reveal only (ADR-004 + ADR-009).
- Significant choices get an ADR in `docs/DECISIONS.md` (next: ADR-011).
- Follow the mandatory documentation maintenance rules in `START_HERE.md` §8 — tick `docs/PROGRESS.md`, append to `docs/SESSION_NOTES.md`, and refresh this file before ending a session.
- Never commit `.env`; keep `.env.example` files current.
