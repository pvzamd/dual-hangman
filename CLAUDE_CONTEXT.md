# Claude Context — Dual Hangman

> Volatile session snapshot: current phase, detailed task list, repo map, gotchas.
> Entry point for the project is `START_HERE.md` — read that first; this file is step 3 of its workflow.
> Update this file at the end of every session.
> Last updated: 2026-06-13 (end of Session 4)

---

## What This Project Is

A real-time two-player browser word-guessing game: each player sets a secret word, then players take turns guessing letters of each other's word — a correct guess lets you keep guessing, a wrong one passes the turn. **The only way to win is to fully reveal the opponent's word first**; wrong guesses are tracked for stats but carry no penalty (ADR-009). The hangman figure is a cosmetic loss visual. Production-quality hobby project by Parvez Ahmed.

**GitHub:** https://github.com/pvzamd/dual-hangman

---

## Current Phase

**Phase 1 — Project Scaffolding (COMPLETE)**

The three-package workspace builds, lints, typechecks, and the server smoke-tests clean. All socket handlers are registered but return `NOT_IMPLEMENTED`. **Next: Phase 2 — Lobby System** (see PROGRESS.md for the checklist).

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
shared/src/constants.ts     ← word limits, room code charset, grace period
client/src/socket.ts        ← typed client singleton (autoConnect: false)
client/src/pages/           ← HomePage, CreateRoomPage, JoinRoomPage, LobbyPage
server/src/index.ts         ← Express + Socket.IO bootstrap, /health
server/src/socket/registerSocketHandlers.ts  ← all handlers (stubs)
server/src/rooms/RoomManager.ts              ← room map + ServerPlayer (skeleton)
server/src/game/GameManager.ts               ← rules engine (skeleton)
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

## Outstanding Tasks (Phase 2 — Lobby System)

- [ ] `RoomManager.joinRoom` (capacity + phase validation)
- [ ] Wire `create_room` / `join_room` / `leave_room` handlers (replace NOT_IMPLEMENTED stubs)
- [ ] Client: connect socket, wire Create/Join pages, Lobby reacts to `opponent_joined`
- [ ] Persist `{ roomCode, playerId, reconnectToken }` to localStorage
- [ ] Start Vitest with RoomManager unit tests

Then Phase 3 (word setup) → Phase 4 (gameplay). Full roadmap in `docs/ROADMAP.md`.

---

## Known Issues / Gotchas

- Dev machine uses nvm-windows; project needs Node ≥ 22.12 (`nvm use 24`). Other projects on this machine may pin older Node versions.
- Claude Code harness quirks (npm.cmd etc.) live in `CLAUDE.md`.
- No tests exist yet — start them with Phase 2 server logic.
- `alert()` placeholders in Create/Join pages are intentional Phase-2 TODOs.

---

## Key Conventions

- TypeScript only; no plain JS in `src/` directories.
- Socket events: snake_case, defined ONLY in `shared/src/events.ts`; both sides get them via Socket.IO generics. Update `docs/ARCHITECTURE.md` tables when the contract changes.
- Game rule changes go to `docs/GAME_RULES.md` first (source of truth). Turn model: correct guess → guess again; wrong guess → turn passes; win by full reveal only (ADR-004 + ADR-009).
- Significant choices get an ADR in `docs/DECISIONS.md` (next: ADR-010).
- Follow the mandatory documentation maintenance rules in `START_HERE.md` §8 — tick `docs/PROGRESS.md`, append to `docs/SESSION_NOTES.md`, and refresh this file before ending a session.
- Never commit `.env`; keep `.env.example` files current.
