# Session Notes

---

## Session 1 — 2026-06-13

### Work Completed

- Established the full documentation system under `docs/`.
- Created `CLAUDE_CONTEXT.md` for future session continuity.
- Wrote `README.md` with project summary and dev instructions.
- Configured `.gitignore` and `.gitattributes` (LF normalization for Windows dev).
- Added `CLAUDE.md` bootstrap file (auto-loaded by Claude Code, points to `CLAUDE_CONTEXT.md` and states the docs-update workflow).
- Created empty folder skeleton: `client/src/`, `client/public/`, `server/src/`.
- Defined game rules, architecture, roadmap, decisions log, deployment notes.

### Decisions Made This Session

- Technology stack chosen: React + Vite (client), Node + Express + Socket.IO (server), both in TypeScript. Rationale documented in `DECISIONS.md`.
- Simultaneous vs turn-based guessing marked as TBD pending further design.
- No database at MVP — in-memory room state only.

### Next Recommended Action

Begin **Phase 1 — Project Scaffolding**:

1. `cd client && npm create vite@latest . -- --template react-ts`
2. `cd server && npm init -y && npm install express socket.io && npm install -D typescript ts-node @types/node @types/express`
3. Set up root `package.json` with `workspaces: ["client", "server"]` and a `dev` script using `concurrently`.

---

## Session 2 — 2026-06-13

### Work Completed

- **Phase 1 (Project Scaffolding) complete.**
- Upgraded dev machine Node 18 → 24 LTS via nvm (Node 18 is EOL and below Vite/Tailwind minimums); root `engines` requires ≥ 22.12 (ADR-008).
- Created npm workspaces monorepo: `shared/`, `client/`, `server/`.
- `shared/`: source-only package (ADR-006) with game constants, state model (`GameView`, `BoardView`, `PlayerInfo`), and the full typed socket contract (`ClientToServerEvents` / `ServerToClientEvents`).
- Client: Vite + React 19 + TypeScript + Tailwind CSS 4 + react-router 7; typed socket singleton; skeleton pages Home / Create / Join / Lobby.
- Server: Express 5 + Socket.IO with CORS and `/health`; handlers registered for the whole contract as NOT_IMPLEMENTED stubs; RoomManager skeleton (room codes, ServerPlayer with reconnect tokens); GameManager skeleton. Dev via `tsx watch`, prod build via `tsup` (bundles shared).
- ESLint 10 flat configs + Prettier everywhere; root scripts `dev` / `build` / `lint` / `typecheck` / `format`.
- Verified: all typechecks, lint, prod builds pass; built server smoke-tested (`/health` + Socket.IO polling handshake).

### Decisions Made This Session

- **ADR-004 resolved: turn-based alternating guessing** (turn passes after every guess; random first turn; draws impossible). Simultaneous mode noted as a possible future game mode.
- ADR-005 Tailwind 4; ADR-006 source-only shared package; ADR-007 reconnection = token + 60s grace; ADR-008 Node ≥ 22.12.
- Game rules updated to match the turn model (GAME_RULES.md).

### Gotchas / Environment Notes

- On this machine, the assistant's shell fails on bare `npm` — use `npm.cmd` instead.
- Game/architecture docs: `shared/src/events.ts` is the compile-time truth for the socket contract; ARCHITECTURE.md mirrors it.

### Next Recommended Action

Begin **Phase 2 — Lobby System**: implement `RoomManager.joinRoom`, wire `create_room` / `join_room` / `leave_room` handlers, connect the client pages to the socket, and start Vitest with RoomManager unit tests. See PROGRESS.md Phase 2 checklist.

---

## Session 3 — 2026-06-13

### Work Completed

- **Continuity & onboarding system** (no code changes).
- Created `START_HERE.md`: universal tool-agnostic entry point with project summary, status, 60-second architecture, ADR summary table, documentation index (purpose / update triggers / authority per file), AI handoff section, 8-step development workflow, and mandatory documentation maintenance rules.
- Established the authority model: GAME_RULES (rules), PROGRESS (completion), DECISIONS (choices), ROADMAP (scope), DEPLOYMENT (env/hosting), `shared/src/events.ts` (socket protocol); PROJECT_OVERVIEW/README/CLAUDE_CONTEXT are derived summaries; SESSION_NOTES is an append-only log whose old entries are never rewritten.
- Deduplicated: `CLAUDE.md` is now a slim Claude-Code-specific bootstrap (read order + machine quirks like `npm.cmd`); the generic workflow rules moved to START_HERE.md; CLAUDE_CONTEXT no longer repeats the harness quirks.
- Consistency sweep across all docs: only stale item found was ADR-001 still saying "React 18" — amended to note the React 19 scaffold. Session 1's log entry mentioning ts-node/two-package workspaces left untouched (append-only log; Session 2 records what actually happened).
- README now points to START_HERE.md at the top.

### Next Recommended Action

Unchanged from Session 2: begin **Phase 2 — Lobby System** (PROGRESS.md checklist). New sessions should start from `START_HERE.md`.

---

## Session 4 — 2026-06-13

### Work Completed

- **Rules revision (ADR-009)** — aligned GAME_RULES.md with the original game design:
  - Correct guess grants another immediate guess; wrong guess ends the turn.
  - 6-wrong-guess loss condition removed; `opponent_hanged` removed as a game-over reason.
  - Winning is **only** by fully revealing the opponent's word (forfeit remains as non-gameplay outcome).
  - Hangman figure is now cosmetic — drawn only at game over for the loser.
  - Wrong guesses still tracked (`BoardView.wrongGuesses`) for statistics/UI; no penalty.
- Shared contract updated to match (no logic existed, so zero migration cost): `GameOverReason` narrowed to `word_solved | opponent_forfeit`; `MAX_WRONG_GUESSES` constant and `BoardView.maxWrongGuesses` removed; GameManager TODO comments updated.
- Docs aligned: ARCHITECTURE (turn model with streaks, win conditions), ROADMAP + PROGRESS Phase 4/5 items (hangman figure moved to Phase 5 result screen), START_HERE, README, PROJECT_OVERVIEW, CLAUDE_CONTEXT; ADR-004 marked amended by ADR-009.
- Verified: typecheck, lint, build all green after type changes.

### Decisions Made This Session

- ADR-009 (see DECISIONS.md). Noted trade-off: streak rule increases first-turn advantage — revisit after play-testing.
- `turn_changed` is now emitted only on wrong guesses (correct guesses keep the turn).

### Next Recommended Action

Unchanged: begin **Phase 2 — Lobby System** (PROGRESS.md checklist). Phase 4 implementers: read ADR-009 before writing `GameManager.guessLetter`.

---

## Session 5 — 2026-06-13

### Work Completed

- **Phase 2 (Lobby System) complete**, including basic reconnection pulled forward from Phase 6.
- Server: `RoomManager` implemented (joinRoom with not-found/full/wrong-phase validation; leaveRoom with revert-or-destroy semantics; validateReconnect; grace timers). New `rooms/roomView.ts` projects Room → client-safe `GameView`. New `socket/types.ts` adds `SocketData` (roomCode/playerId per socket).
- Server handlers live: `create_room`, `join_room` (notifies host via `opponent_joined` + broadcasts `word_setup_started`), `leave_room`, `reconnect_player` (rebind + `state_sync` + `opponent_reconnected`), `disconnect` (marks away, `opponent_disconnected`, 60s grace → removal). Word/guess/chat remain stubs.
- Client: `lib/identity.ts` (localStorage save/load/clear with shape validation); Create/Join pages emit and navigate with inline error display; LobbyPage syncs via `reconnect_player` → `state_sync` on every socket `connect` (ADR-010), shows both players + connection dots + grace countdown notice, leave button; HomePage offers "Return to room" when an identity is stored.
- Shared: added `MAX_PLAYER_NAME_LENGTH` (used by server validation and client inputs).
- Tests: Vitest added to server — 12 RoomManager unit tests. Root `npm run test` wired.
- Verified: typecheck, lint, tests, builds; live end-to-end smoke test covering create, join, sync, disconnect-grace, fresh-socket reconnect, bad-token/unknown-room/full-room rejections, leave-revert, and room destruction.

### Decisions Made This Session

- **ADR-010**: lobby sync reuses `reconnect_player` → `state_sync` (one path for navigation, refresh, and reconnects); leaving a two-player lobby reverts the room to `waiting_for_opponent` instead of destroying it.
- ESLint: new react-hooks rules forbid ref writes during render — refs are now written in event handlers only.

### Next Recommended Action

Begin **Phase 3 — Word Setup**: implement `submit_secret_word` (validate with `MIN/MAX_WORD_LENGTH` + `VALID_WORD_PATTERN`, store uppercase, emit `opponent_word_ready`), transition to `playing` + `game_started` with a random first turn when both words are in, and replace LobbyPage's Phase-3 placeholder with the secret-word form. Note the two Phase-4 TODOs at `leaveRoom`/grace-expiry call sites (forfeit during `playing`).

---

## Session 6 — 2026-06-13

### Work Completed

- **Phase 3 (Word Setup) complete.**
- Shared: new `words.ts` with `normalizeSecretWord` (trim → uppercase → length/charset check) — single validation source for client inline feedback and server authority. `GameView` gained `yourWordReady` / `opponentWordReady` so a refresh during word setup restores the correct screen.
- Server: `submit_secret_word` handler — phase guard (`INVALID_PHASE`), validation (`INVALID_WORD`), storage on `ServerPlayer.secretWord` (re-submission overwrites before start), `opponent_word_ready` on first submission, `state_sync` ack to the submitter. When both words are in: `GameManager` constructed with boards over each other's words and a random first turn (`crypto.randomInt`), phase → `playing`, personalized `game_started` to each socket.
- `GameManager` now holds real round state (seats, boards via `boardFor`, active player, winner accessors); `guessLetter` remains the Phase-4 TODO. `roomView.buildRoomView` delegates board/turn/winner fields to the game.
- Client: `WordSetupForm` component (inline validation, uppercase input); LobbyPage renders the form during `word_setup`, shows "✓ word set / choosing…" badges per player, handles `opponent_word_ready` + `game_started`, and announces who goes first once playing.
- Tests up to 24: `normalizeSecretWord` cases, GameManager init (board orientation, masked boards, no winner), roomView projection including a deterministic anti-cheat assertion (test words use letters excluded from the room-code alphabet so secrets can never appear in any payload).
- Live smoke test: invalid-word rejections, ready-flag flow, mid-setup resync, simultaneous personalized `game_started` (consistent first turn, no word leakage), `INVALID_PHASE` after start, `guess_letter` still stubbed, mid-game reconnection restores boards.

### Decisions Made This Session

- Word validation lives in `shared/` — client and server cannot drift.
- Ready states are part of `GameView` rather than ad-hoc events only, keeping refresh/reconnect consistent (extends ADR-010's state_sync-first philosophy).
- Re-submitting a word before the round starts overwrites silently (friendly "changed my mind" behaviour).

### Next Recommended Action

Begin **Phase 4 — Core Gameplay** (read ADR-009 first): `GameManager.guessLetter` with turn streaks (correct → guess again, wrong → pass), `guess_result` / `turn_changed` / `game_won` emission, forfeit handling at the two TODO call sites, `opponentWordRevealed` at game over, and the guessing UI (likely a GamePage with keyboard + boards).

---

## Session 7 — 2026-06-13

### Work Completed

- **Phase 4 (Core Gameplay) complete.** Reviewed GAME_RULES.md first; implementation matches it exactly.
- Server `GameManager.guessLetter` (discriminated `GuessOutcome`): rejects game-over (`INVALID_PHASE`), invalid letters (`INVALID_LETTER`), out-of-turn (`NOT_YOUR_TURN`), and repeats (`ALREADY_GUESSED`) — rejections leave state untouched and never consume the turn. Correct guess reveals every occurrence and keeps the turn (streak); wrong guess increments `wrongGuesses` (stats only) and passes the turn; win is `word_solved` only. Added `targetWordFor` and `isOver`.
- `roomView.buildRoomView` now reveals each player's own target word at `game_over` via `opponentWordRevealed`.
- `guess_letter` handler: validates, applies, then emits personalized `guess_result` (or `game_won` on a win) to each socket, plus `turn_changed` to the room **only when the turn passed**.
- Client: `useGame(roomCode)` hook owns the socket subscription + `GameView` (shared by Lobby and Game pages; missing-identity ejection derived during render to satisfy the new `react-hooks/set-state-in-effect` lint rule). New `GamePage` + `GameBoard`, `WordDisplay`, `GuessedLetters`, on-screen `Keyboard` (guessed letters disabled/tinted, physical typing). New `/game/:roomCode` route; LobbyPage navigates there on `playing`, GamePage bounces back on a pre-game phase.
- Tests up to 38: comprehensive `guessLetter` coverage (streaks, wrong-guess turn pass, repeat/out-of-turn/invalid/after-over rejections, per-board repeat tracking, lowercase normalization, full-reveal win) and a roomView game-over reveal test. Helpers read `activePlayerId` so they're deterministic despite the random first turn.
- Live smoke test over real sockets: correct-keeps-turn (no `turn_changed`), wrong-passes-turn (`turn_changed` → opponent), `NOT_YOUR_TURN`, `ALREADY_GUESSED`, solve → `game_won` (winner + reason + loser's revealed word), `INVALID_PHASE` after game over, no secret leaked.

### Decisions Made This Session

- **ADR-011**: dedicated `/game` route + shared `useGame` hook with phase-driven navigation; `game_won` reveals each player's own target word.
- `turn_changed` is emitted only on wrong guesses; the client re-renders from the full `state` in `guess_result` / `game_won`, so the event is supplementary.

### Known Gap (intentionally deferred)

Leaving or disconnecting past grace **during `playing`** still reverts the room instead of forfeiting (TODOs in `RoomManager.leaveRoom` and the `disconnect` handler). This is wrong per the rules and is scheduled for **Phase 6** (it was out of this phase's scope). Lobby-phase leave/reconnect is correct.

### Next Recommended Action

Begin **Phase 5 — Game Over & Restart**: polish the result screen, add the cosmetic hangman defeat figure for the loser (ADR-009), and a rematch flow back to `word_setup` (new `rematch` event + GameManager reset). `GameBoard` already renders a basic game-over state to build on.

---

## Session 8 — 2026-06-13

### Work Completed

- **Closed the in-game forfeit correctness gap** (implements ADR-007's "grace → forfeit" + ADR-009's `opponent_forfeit` win; no new ADR needed). Scope was strictly the forfeit fix — no Phase 5 work.
- `GameManager.forfeit(playerId)`: the opponent wins by `opponent_forfeit`; no-op if the round is already decided (a late leave can't flip a win).
- `RoomManager.forfeit(code, playerId)`: valid only during `playing` (returns null otherwise). Cancels the grace timer, sets `game_over`, and keeps the forfeiter in `players` marked disconnected so the winner's `GameView` still renders both boards. The room is **not** destroyed.
- Socket handler: new `handleExit` routes both `leave_room` and grace-timer expiry — forfeit during `playing` (emit `game_won`/`opponent_forfeit` to the remaining player), otherwise the existing revert/destroy (`removeAndNotify`). Lobby-phase behavior is unchanged.
- `RECONNECT_GRACE_SECONDS` is now env-overridable (default 60) — useful for tuning and for tests that can't wait the full window. Documented in `server/.env.example` and DEPLOYMENT.md.
- Client: `GameBoard` banner is reason-aware ("You win — {opponent} left the game." on a forfeit win).
- Tests up to 46 (+8): `GameManager.forfeit` (opponent wins, regardless of turn, no overwrite of a decided game) and `RoomManager.forfeit` (playing → forfeit with both players kept + room intact; null in waiting/word_setup; null for unknown room/player).
- Live smoke test (server run with a 2s grace) covered **both** required scenarios plus the negative case: (A) explicit `leave_room` during play → opponent wins immediately by forfeit; (B) disconnect + grace expiry during play → opponent wins after ~2s; (C) leaving during `word_setup` → opponent gets `state_sync` back to `waiting_for_opponent`, no `game_won` (lobby behavior preserved).

### Decisions / Notes

- Kept the forfeiter in `room.players` (disconnected) rather than removing them, so the winner's board view renders without special-casing a missing opponent. The lingering room is reclaimed by the Phase 6 idle sweep.
- No new ADR: this realizes decisions already recorded in ADR-007 and ADR-009.

### Next Recommended Action

Unchanged: begin **Phase 5 — Game Over & Restart** (result screen polish, hangman defeat figure, rematch). The forfeit win path already produces a correct `game_over` state for the result screen to build on.

---

## Session 9 — 2026-06-13

### Work Completed

- **Phase 5 (Game Over & Restart) complete.** Updated GAME_RULES.md first (new "Game Over and Rematch" section).
- Shared contract: added `request_rematch` (client→server) and `rematch_requested` / `rematch_started` / `rematch_unavailable` (server→client); added `yourWordRevealed` to `GameView`.
- `roomView.buildRoomView`: at `game_over` reveals **both** secret words (`yourWordRevealed` = your own, `opponentWordRevealed` = opponent's), sourced from `ServerPlayer.secretWord`.
- `RoomManager`: `ServerPlayer.wantsRematch` flag; `requestRematch(code, playerId)` returns a discriminated outcome (`invalid` / `requested` / `started` / `unavailable`); `resetForRematch(room)` clears words/flags/game and returns to `word_setup`. `leaveRoom` now also clears the remaining player's `wantsRematch`.
- Socket handler: `request_rematch` maps the outcome — `requested` → notify opponent; `started` → personalized `rematch_started` to both; `unavailable` → `rematch_unavailable` + revert the requester to the lobby (remove absent opponent + `state_sync`).
- Client: `HangmanFigure` (static SVG defeat illustration). `GameBoard` now has a game-over result panel — both revealed words, the figure for the loser, and rematch controls (Play again / Accept rematch / Waiting… / unavailable, plus Leave). `useGame` tracks `youRequestedRematch` / `opponentWantsRematch` / `rematchUnavailable` and exposes `requestRematch`; rematch flags reset when leaving game_over. GamePage wires it through.
- Tests up to 51 (+5): `RoomManager.requestRematch` (waiting / both-started / unavailable / invalid) and `resetForRematch`; roomView now asserts both words revealed at game over and null while playing.
- Live smoke test over real sockets: (1) full rematch — both opt in, room resets to word_setup, and a **second** round actually plays; (2) decline-by-leave returns the requester to the lobby; (3) opponent disconnect → `rematch_unavailable` → requester reverts to the lobby.

### Decisions Made This Session

- **ADR-012**: rematch is mutual opt-in and reuses the `word_setup` flow (no new phase); declining is just leaving; both secret words are revealed at game over.
- No "same words again" shortcut — a rematch always re-collects words (re-using them would leak information).

### Next Recommended Action

Begin **Phase 6 — Polish & Resilience**: idle room sweep (`ROOM_IDLE_TIMEOUT_MINUTES`, also reclaims post-forfeit ghost rooms), chat sidebar (`chat_message` is still stubbed), animations, and responsive/mobile layout.

---
