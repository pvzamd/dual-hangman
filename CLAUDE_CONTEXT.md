# Claude Context — Dual Hangman

> Volatile session snapshot: current phase, detailed task list, repo map, gotchas.
> Entry point for the project is `START_HERE.md` — read that first; this file is step 3 of its workflow.
> Update this file at the end of every session.
> Last updated: 2026-06-13 (end of Session 8)

---

## What This Project Is

A real-time two-player browser word-guessing game: each player sets a secret word, then players take turns guessing letters of each other's word — a correct guess lets you keep guessing, a wrong one passes the turn. **The only way to win is to fully reveal the opponent's word first**; wrong guesses are tracked for stats but carry no penalty (ADR-009). The hangman figure is a cosmetic loss visual. Production-quality hobby project by Parvez Ahmed.

**GitHub:** https://github.com/pvzamd/dual-hangman

---

## Current Phase

**Phase 4 — Core Gameplay (COMPLETE)**

A full round is playable end-to-end. `GameManager.guessLetter` enforces all rules (ADR-009): correct guess reveals every occurrence and keeps the turn (streak); wrong guess counts for stats only and passes the turn; repeats/out-of-turn/invalid are rejected without touching state; win is `word_solved` only. The server emits personalized `guess_result` / `game_won` and `turn_changed` (wrong guesses only); `game_won` reveals each player's own target word. Client: `useGame` hook + `GamePage`/`GameBoard`/`WordDisplay`/`GuessedLetters`/`Keyboard`; LobbyPage navigates to `/game/:roomCode` on `playing`. Leaving or disconnecting past the grace window **during `playing` now forfeits** — the opponent wins via `game_won` (`opponent_forfeit`); lobby-phase exits keep the revert/destroy behavior. 46 Vitest tests; full round + both forfeit paths smoke-tested over real sockets. `chat_message` remains a stub. **Next: Phase 5 — Game Over & Restart** (result screen, hangman defeat figure, rematch).

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
client/src/hooks/useGame.ts ← socket subscription + GameView (Lobby & Game pages)
client/src/pages/           ← Home, Create, Join, Lobby, Game — all wired
client/src/components/       ← WordSetupForm, GameBoard, WordDisplay, GuessedLetters, Keyboard
server/src/index.ts         ← Express + Socket.IO bootstrap, /health
server/src/socket/types.ts  ← GameServer/GameSocket generics + SocketData
server/src/socket/registerSocketHandlers.ts  ← lobby + word + guess + forfeit handlers; chat stub
server/src/rooms/RoomManager.ts              ← rooms, join/leave/forfeit, reconnect, grace timers
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

## Outstanding Tasks (Phase 5 — Game Over & Restart)

- [ ] Result screen polish (winner, reason, revealed words, wrong-guess stats) — basic game-over state already renders in `GameBoard`
- [ ] Hangman defeat figure as the loser's visual (cosmetic — ADR-009)
- [ ] Rematch flow back to `word_setup` (needs a new `rematch` event + GameManager reset)

Deferred to Phase 6: idle room sweep, chat. (In-game forfeit on leave/grace-expiry is now done — see below.) Full roadmap in `docs/ROADMAP.md`.

---

## Known Issues / Gotchas

- Dev machine uses nvm-windows; project needs Node ≥ 22.12 (`nvm use 24`). Other projects on this machine may pin older Node versions.
- Claude Code harness quirks (npm.cmd etc.) live in `CLAUDE.md`.
- Tests: server only so far (`npm run test` → 46 Vitest tests). No client tests yet.
- In-game forfeit is wired through `handleExit` in the socket handler: `leave_room` and grace-timer expiry both forfeit during `playing` (opponent wins), and keep the revert/destroy behavior otherwise. Grace window is env-overridable (`RECONNECT_GRACE_SECONDS`, default 60).
- `GameBoard` renders a game-over state (winner, reason-aware banner, revealed word); the polished result screen, hangman figure, and rematch are Phase 5.

---

## Key Conventions

- TypeScript only; no plain JS in `src/` directories.
- Socket events: snake_case, defined ONLY in `shared/src/events.ts`; both sides get them via Socket.IO generics. Update `docs/ARCHITECTURE.md` tables when the contract changes.
- Game rule changes go to `docs/GAME_RULES.md` first (source of truth). Turn model: correct guess → guess again; wrong guess → turn passes; win by full reveal only (ADR-004 + ADR-009).
- Significant choices get an ADR in `docs/DECISIONS.md` (next: ADR-012).
- Follow the mandatory documentation maintenance rules in `START_HERE.md` §8 — tick `docs/PROGRESS.md`, append to `docs/SESSION_NOTES.md`, and refresh this file before ending a session.
- Never commit `.env`; keep `.env.example` files current.
