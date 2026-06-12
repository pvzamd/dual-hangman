# Claude Context — Dual Hangman

> Volatile session snapshot: current phase, detailed task list, repo map, gotchas.
> Entry point for the project is `START_HERE.md` — read that first; this file is step 3 of its workflow.
> Update this file at the end of every session.
> Last updated: 2026-06-13 (end of Session 5)

---

## What This Project Is

A real-time two-player browser word-guessing game: each player sets a secret word, then players take turns guessing letters of each other's word — a correct guess lets you keep guessing, a wrong one passes the turn. **The only way to win is to fully reveal the opponent's word first**; wrong guesses are tracked for stats but carry no penalty (ADR-009). The hangman figure is a cosmetic loss visual. Production-quality hobby project by Parvez Ahmed.

**GitHub:** https://github.com/pvzamd/dual-hangman

---

## Current Phase

**Phase 2 — Lobby System (COMPLETE)**

Rooms can be created, joined, left, and rejoined: lobby sync + localStorage identity + reconnection with a 60s grace timer all work end-to-end (smoke-tested over real sockets; 12 Vitest unit tests on RoomManager). `submit_secret_word` / `guess_letter` / `chat_message` remain `NOT_IMPLEMENTED` stubs. **Next: Phase 3 — Word Setup** (see PROGRESS.md for the checklist).

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
client/src/socket.ts        ← typed client singleton (autoConnect: false)
client/src/lib/identity.ts  ← localStorage identity (save/load/clear)
client/src/pages/           ← Home, Create, Join, Lobby — all wired to the socket
server/src/index.ts         ← Express + Socket.IO bootstrap, /health
server/src/socket/types.ts  ← GameServer/GameSocket generics + SocketData
server/src/socket/registerSocketHandlers.ts  ← lobby handlers live; word/guess/chat stubs
server/src/rooms/RoomManager.ts              ← rooms, join/leave, reconnect, grace timers
server/src/rooms/roomView.ts                 ← Room → GameView projection
server/src/game/GameManager.ts               ← rules engine (skeleton, Phase 4)
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

## Outstanding Tasks (Phase 3 — Word Setup)

- [ ] Server: `submit_secret_word` — validate (MIN/MAX_WORD_LENGTH, VALID_WORD_PATTERN, uppercase), store on ServerPlayer, emit `opponent_word_ready`
- [ ] Server: when both words in → phase `playing`, random first turn, emit `game_started` (needs first real GameManager state)
- [ ] Client: secret word input screen replacing the Phase-3 placeholder in LobbyPage
- [ ] Tests for word validation + transition

Then Phase 4 (gameplay — read ADR-009 first). Full roadmap in `docs/ROADMAP.md`.

---

## Known Issues / Gotchas

- Dev machine uses nvm-windows; project needs Node ≥ 22.12 (`nvm use 24`). Other projects on this machine may pin older Node versions.
- Claude Code harness quirks (npm.cmd etc.) live in `CLAUDE.md`.
- Tests: server only so far (`npm run test` → 12 Vitest tests). No client tests yet.
- `leaveRoom` + grace-expiry currently revert/destroy the room — both call sites carry a TODO to forfeit instead during `playing` (Phase 4).
- LobbyPage shows a "Word setup arrives in Phase 3" placeholder once the opponent joins — that is the Phase 3 starting point.

---

## Key Conventions

- TypeScript only; no plain JS in `src/` directories.
- Socket events: snake_case, defined ONLY in `shared/src/events.ts`; both sides get them via Socket.IO generics. Update `docs/ARCHITECTURE.md` tables when the contract changes.
- Game rule changes go to `docs/GAME_RULES.md` first (source of truth). Turn model: correct guess → guess again; wrong guess → turn passes; win by full reveal only (ADR-004 + ADR-009).
- Significant choices get an ADR in `docs/DECISIONS.md` (next: ADR-011).
- Follow the mandatory documentation maintenance rules in `START_HERE.md` §8 — tick `docs/PROGRESS.md`, append to `docs/SESSION_NOTES.md`, and refresh this file before ending a session.
- Never commit `.env`; keep `.env.example` files current.
